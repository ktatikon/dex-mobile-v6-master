
import React, { useMemo, useEffect, useState } from 'react';
import PortfolioCard from '@/components/PortfolioCard';
import SwapBlock from '@/components/swap_block';
import TokenListItem from '@/components/TokenListItem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useGlobalMarketData } from '@/contexts/MarketDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRealTimeTokens } from '@/hooks/useRealTimeTokens';
import EmptyStateCard from '@/components/EmptyStateCard';
import { RefreshCw, Wallet } from 'lucide-react';
import { comprehensiveWalletService } from '@/services/comprehensiveWalletService';
import { getPortfolioHoldings } from '@/services/portfolioService';
import { Token, Transaction } from '@/types';
import { useToast } from '@/hooks/use-toast';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Use real-time token data with automatic updates
  const {
    tokens: realTimeTokens,
    loading: realTimeLoading,
    error: realTimeError,
    refreshData: refreshRealTimeData
  } = useRealTimeTokens({
    autoRefresh: true,
    refreshOnMount: true,
    sortBy: 'marketCap',
    sortOrder: 'desc'
  });

  // Fallback to global market data if needed
  const {
    tokens: fallbackTokens,
    sortedByMarketCap,
    sortedByPriceChange,
    loading: fallbackLoading,
    error: fallbackError,
    refreshData: refreshFallbackData
  } = useGlobalMarketData();

  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<Error | null>(null);

  // Use real-time data if available, otherwise fallback
  const tokens = realTimeTokens.length > 0 ? realTimeTokens : fallbackTokens;
  const loading = realTimeLoading || fallbackLoading;
  const error = realTimeError || fallbackError;

  // Fetch user data from Supabase
  useEffect(() => {
    async function fetchUserData() {
      if (!user) {
        setUserTokens([]);
        setRecentTransactions([]);
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        // Get portfolio holdings
        const holdings = await getPortfolioHoldings(user.id);

        // If we have real-time token data, merge it with the holdings
        if (tokens.length > 0) {
          const updatedHoldings = holdings.map(holding => {
            const token = tokens.find(t => t.id === holding.id);
            if (token) {
              return {
                ...holding,
                price: token.price,
                priceChange24h: token.priceChange24h
              };
            }
            return holding;
          });
          setUserTokens(updatedHoldings);
        } else {
          setUserTokens(holdings);
        }

        // Get recent transactions
        const transactions = await comprehensiveWalletService.getUserTransactions(user.id, 5);
        setRecentTransactions(transactions);

        setDataLoading(false);
        setDataError(null);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setDataError(err instanceof Error ? err : new Error('Failed to fetch user data'));
        setUserTokens([]);
        setRecentTransactions([]);
        setDataLoading(false);
      }
    }

    fetchUserData();
  }, [user, tokens]);

  // Get trending tokens (top gainers and losers)
  const trendingTokens = useMemo(() => {
    // Get top 2 gainers
    const topGainers = sortedByPriceChange
      .filter(token => (token.priceChange24h || 0) > 0)
      .slice(0, 2);

    // Get top 2 losers
    const topLosers = sortedByPriceChange
      .filter(token => (token.priceChange24h || 0) < 0)
      .slice(0, 2);

    // Combine and sort by absolute price change
    return [...topGainers, ...topLosers].sort((a, b) => {
      return Math.abs(b.priceChange24h || 0) - Math.abs(a.priceChange24h || 0);
    });
  }, [sortedByPriceChange]);

  const handleGoToMarket = () => {
    navigate('/trade');
  };

  const handleGoToWallet = () => {
    navigate('/wallet-dashboard');
  };

  // Enhanced swap functionality with enterprise service integration
  const handleSwap = async (swapData: unknown) => {
    try {
      const {
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        mevAnalysis,
        gasOptimization,
        tdsCalculation,
        transactionHash,
        gasUsed,
        actualSlippage
      } = swapData;

      // Show success notification with enterprise features
      toast({
        title: "🎉 Swap Completed Successfully!",
        description: (
          <div className="space-y-2 font-poppins">
            <div className="font-medium">
              Swapped {fromAmount} {fromToken?.symbol} → {toAmount} {toToken?.symbol}
            </div>
            {transactionHash && (
              <div className="text-xs text-gray-400">
                Transaction: {transactionHash.substring(0, 10)}...
              </div>
            )}
            {mevAnalysis && (
              <div className="text-xs text-green-400">
                ✓ MEV Protection: Saved ${mevAnalysis.potentialSavings || '0.00'}
              </div>
            )}
            {gasOptimization && (
              <div className="text-xs text-blue-400">
                ⚡ Gas Optimized: {gasOptimization.efficiency || '95'}% efficiency
              </div>
            )}
            {tdsCalculation && (
              <div className="text-xs text-purple-400">
                📊 TDS Compliance: ${tdsCalculation.feeAmount || '0.00'} fee applied
              </div>
            )}
          </div>
        ),
        variant: "default",
      });

      // Refresh user data after successful swap
      await handleRefresh();

    } catch (error) {
      console.error('Swap completion error:', error);
      toast({
        title: "Swap Processing Error",
        description: "There was an issue processing the swap completion. Please check your wallet.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshRealTimeData();
      await refreshFallbackData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Format last updated time
  const formatLastUpdated = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Loading state
  if ((loading && !trendingTokens.length) || dataLoading) {
    return (
      <div className="pb-24">
        <div className="mb-6">
          <Card className="p-5 bg-dex-dark text-white border-none shadow-[0_4px_16px_rgba(0,0,0,0.3)] rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-gray-400 font-medium text-lg">Portfolio Value</h2>
              <div className="animate-pulse bg-dex-secondary/20 h-6 w-16 rounded-full"></div>
            </div>
            <div className="mb-6">
              <div className="animate-pulse bg-dex-secondary/20 h-10 w-32 rounded-md"></div>
            </div>
            <div className="h-24 w-full animate-pulse bg-dex-secondary/10 rounded-md"></div>
          </Card>
        </div>

        <div className="mb-8">
          <div className="bg-[#1C1C1E] border border-[#B1420A]/20 rounded-xl p-8 shadow-[0_4px_16px_rgba(177,66,10,0.1)]">
            <div className="mb-6">
              <h2 className="text-2xl font-medium text-white font-poppins flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#B1420A] to-[#D2691E] rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                Swap Tokens
              </h2>
            </div>
            <SwapBlock
              tokens={userTokens}
              onSwap={handleSwap}
              enableUniswapV3={true}
              defaultSlippage={0.5}
              className="bg-transparent border-none shadow-none p-0"
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-4 font-poppins">Your Assets</h2>
          <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-dex-primary" />
              <p className="text-dex-text-secondary">Loading market data...</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  if ((error || dataError) && !trendingTokens.length) {
    const displayError = error || dataError;
    return (
      <div className="pb-24">
        <div className="mb-6">
          <PortfolioCard tokens={userTokens} />
        </div>

        <div className="mb-8">
          <div className="bg-[#1C1C1E] border border-[#B1420A]/20 rounded-xl p-8 shadow-[0_4px_16px_rgba(177,66,10,0.1)]">
            <div className="mb-6">
              <h2 className="text-2xl font-medium text-white font-poppins flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#B1420A] to-[#D2691E] rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                Swap Tokens
              </h2>
            </div>
            <SwapBlock
              tokens={userTokens}
              onSwap={handleSwap}
              enableUniswapV3={true}
              defaultSlippage={0.5}
              className="bg-transparent border-none shadow-none p-0"
            />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-4 font-poppins">Market Data</h2>
          <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            <div className="p-8 text-center">
              <p className="text-dex-negative mb-2">Error loading market data</p>
              <p className="text-dex-text-secondary mb-4">{displayError.message}</p>
              <Button
                variant="default"
                onClick={async () => {
                  try {
                    await refreshRealTimeData();
                    await refreshFallbackData();
                  } catch (error) {
                    console.error('Error refreshing data:', error);
                  }
                }}
                className="font-poppins"
              >
                Retry
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Portfolio section */}
      <div className="mb-6">
        <PortfolioCard tokens={userTokens} />
      </div>



      {/* Enterprise Swap Functionality */}
      <div className="mb-8">
        <div className="bg-[#1C1C1E] border border-[#B1420A]/20 rounded-xl p-8 shadow-[0_4px_16px_rgba(177,66,10,0.1)]">
          <div className="mb-6">
            <h2 className="text-2xl font-medium text-white font-poppins flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#B1420A] to-[#D2691E] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
              Swap Tokens
            </h2>
            <p className="text-gray-400 text-sm font-poppins mt-2">
              Enterprise-grade trading with MEV protection, gas optimization, and TDS compliance
            </p>
          </div>

          <SwapBlock
            tokens={userTokens}
            onSwap={handleSwap}
            enableUniswapV3={true}
            defaultSlippage={0.5}
            onQuoteUpdate={(quote) => {
              // Handle quote updates for real-time price tracking
              console.log('Quote updated:', quote);
            }}
            className="bg-transparent border-none shadow-none p-0"
          />

          {/* Enterprise Features Indicator */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-xs font-poppins">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-400">MEV Protected</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-poppins">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-400">Gas Optimized</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-poppins">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-gray-400">TDS Compliant</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-poppins">
                <div className="w-2 h-2 bg-[#B1420A] rounded-full"></div>
                <span className="text-gray-400">Uniswap V3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top assets */}
      <div className="mb-8">
        <h2 className="text-2xl font-medium mb-4 font-poppins">Your Assets</h2>
        {userTokens.length > 0 ? (
          <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            {userTokens.slice(0, 4).map(token => (
              <TokenListItem
                key={token.id}
                token={token}
                onSelect={() => navigate('/wallet-dashboard', { state: { preSelectedToken: token } })}
              />
            ))}

            <div className="p-4 text-center">
              <Button
                variant="ghost"
                className="text-dex-primary hover:text-dex-primary/90 hover:bg-dex-primary/10 font-medium text-base py-3 px-6 rounded-lg"
                onClick={handleGoToWallet}
              >
                View All Assets
              </Button>
            </div>
          </Card>
        ) : (
          <EmptyStateCard
            title="No Assets Yet"
            description="You don't own any assets yet. Add funds to your wallet to get started."
            icon={<Wallet size={40} />}
            actionLabel="Add Funds"
            onAction={() => navigate('/wallet-dashboard')}
          />
        )}
      </div>

      {/* Trending tokens */}
      <div>
        <h2 className="text-2xl font-medium mb-4 font-poppins">Trending</h2>
        <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
          {trendingTokens.map(token => (
            <TokenListItem
              key={token.id}
              token={token}
              showBalance={false}
              onSelect={() => {
                navigate('/trade', { state: { preSelectedToken: token } });
              }}
            />
          ))}
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
