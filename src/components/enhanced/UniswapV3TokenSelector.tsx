/**
 * UNISWAP V3 ENHANCED TOKEN SELECTOR
 * 
 * Wrapper component that enhances the existing TokenSelector with Uniswap V3
 * pool liquidity information, fee tier data, and trading volume metrics.
 * Maintains zero-duplication by reusing the existing TokenSelector component.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Token } from '@/types';
import EnhancedTokenSelector from '@/components/TokenSelector';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { uniswapV3Service } from '@/services/uniswapV3Service';
import { poolDataService } from '@/services/poolDataService';
import { FeeAmount } from '@uniswap/v3-sdk';
import { loadingOrchestrator } from '@/services/enterprise/loadingOrchestrator';
import { serviceInitializer } from '@/services/serviceInitializer';
import { realTimeDataManager } from '@/services/enterprise/realTimeDataManager';
import {
  Droplets,
  TrendingUp,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  Search,
  Filter,
  Star,
  Clock
} from 'lucide-react';

interface UniswapV3TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  label?: string;
  required?: boolean;
  showBalance?: boolean;
  allowCustomTokens?: boolean;
  placeholder?: string;
  error?: string;
  // Uniswap V3 specific props
  pairedToken?: Token | null; // Token to check liquidity against
  showLiquidityInfo?: boolean;
  showVolumeInfo?: boolean;
  preferredFeeAmount?: FeeAmount;
  minLiquidityThreshold?: number; // Minimum liquidity in USD
}

interface TokenLiquidityInfo {
  hasLiquidity: boolean;
  tvlUSD: number;
  volumeUSD24h: number;
  bestFeeAmount: FeeAmount;
  availableFeeTiers: FeeAmount[];
  priceImpact1000USD: number;
  isLoading: boolean;
  error?: string;
}

const UniswapV3TokenSelector: React.FC<UniswapV3TokenSelectorProps> = ({
  tokens,
  selectedToken,
  onSelectToken,
  label = 'Select Token',
  required = false,
  showBalance = true,
  allowCustomTokens = false,
  placeholder = 'Search tokens...',
  error,
  pairedToken = null,
  showLiquidityInfo = true,
  showVolumeInfo = true,
  preferredFeeAmount = FeeAmount.MEDIUM,
  minLiquidityThreshold = 10000 // $10k minimum liquidity
}) => {
  const [liquidityData, setLiquidityData] = useState<Map<string, TokenLiquidityInfo>>(new Map());
  const [isLoadingLiquidity, setIsLoadingLiquidity] = useState(false);

  // Enhanced filtering and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByLiquidity, setFilterByLiquidity] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'liquidity' | 'volume'>('name');
  const [recentTokens, setRecentTokens] = useState<Token[]>([]);
  const [favoriteTokens, setFavoriteTokens] = useState<Set<string>>(new Set());

  // Fetch actual liquidity information from pool data service (moved up to avoid temporal dead zone)
  const fetchTokenLiquidityInfo = useCallback(async (token: Token, paired: Token): Promise<TokenLiquidityInfo> => {
    // Check if services are initialized before attempting to fetch data
    if (!serviceInitializer.isReady()) {
      console.log('⏳ [UniswapV3TokenSelector] Services not ready, returning mock data');
      return getMockLiquidityInfo(token);
    }

    const feeTiers = [FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];
    const availableFeeTiers: FeeAmount[] = [];
    let bestPool: {
      fee: FeeAmount;
      tvlUSD: string;
      volumeUSD: string;
      token0Price: string;
      token1Price: string;
    } | null = null;
    let maxTVL = 0;

    // Check all fee tiers for liquidity
    for (const feeAmount of feeTiers) {
      try {
        const poolResult = await poolDataService.getPoolByTokens(
          { address: token.address!, symbol: token.symbol, name: token.name, decimals: token.decimals },
          { address: paired.address!, symbol: paired.symbol, name: paired.name, decimals: paired.decimals },
          feeAmount,
          1 // Ethereum mainnet
        );

        if (poolResult.success && poolResult.data) {
          availableFeeTiers.push(feeAmount);
          const tvl = parseFloat(poolResult.data.totalValueLockedUSD);

          if (tvl > maxTVL) {
            maxTVL = tvl;
            bestPool = poolResult.data;
          }
        }
      } catch (error) {
        console.warn(`Failed to check pool for fee tier ${feeAmount}:`, error);
      }
    }

    return {
      hasLiquidity: availableFeeTiers.length > 0,
      tvlUSD: maxTVL,
      volumeUSD24h: bestPool ? parseFloat(bestPool.volumeUSD) : 0,
      bestFeeAmount: bestPool ? bestPool.fee : preferredFeeAmount,
      availableFeeTiers,
      priceImpact1000USD: maxTVL > 0 ? Math.min((1000 / maxTVL) * 100, 10) : 10, // Estimate
      isLoading: false
    };
  }, [preferredFeeAmount]);

  // Load liquidity information for a token pair (moved up to avoid temporal dead zone)
  const loadTokenLiquidityInfo = useCallback(async (token: Token) => {
    if (!pairedToken || !token.address || !pairedToken.address) return;

    // Check if services are initialized
    if (!serviceInitializer.isReady()) {
      console.log('⏳ [UniswapV3TokenSelector] Services not ready, setting mock liquidity data');
      setLiquidityData(prev => new Map(prev).set(token.address!, getMockLiquidityInfo(token)));
      return;
    }

    const cacheKey = `liquidity_${token.address}_${pairedToken.address}`;
    setIsLoadingLiquidity(true);

    try {
      // Loading orchestrator integration (simplified for compatibility)

      // Use real-time data manager for caching
      const liquidityInfo = await realTimeDataManager.fetchData(
        cacheKey,
        () => fetchTokenLiquidityInfo(token, pairedToken),
        () => getMockLiquidityInfo(token),
        {
          ttl: 5 * 60 * 1000, // 5 minutes
          refreshInterval: 2 * 60 * 1000, // 2 minutes
          preloadNext: true,
          compressionEnabled: true
        }
      );

      setLiquidityData(prev => new Map(prev).set(token.address!, liquidityInfo));
      // Liquidity data loaded successfully
    } catch (error) {
      console.error('Failed to load liquidity info:', error);

      // Set error state
      setLiquidityData(prev => new Map(prev).set(token.address!, {
        hasLiquidity: false,
        tvlUSD: 0,
        volumeUSD24h: 0,
        bestFeeAmount: preferredFeeAmount,
        availableFeeTiers: [],
        priceImpact1000USD: 0,
        isLoading: false,
        error: 'Failed to load liquidity data'
      }));
    } finally {
      setIsLoadingLiquidity(false);
    }
  }, [pairedToken, preferredFeeAmount, fetchTokenLiquidityInfo]);

  // Enhanced token selection with liquidity check and recent tokens tracking
  const handleTokenSelect = useCallback(async (token: Token) => {
    // Call original handler
    onSelectToken(token);

    // Add to recent tokens
    setRecentTokens(prev => {
      const filtered = prev.filter(t => t.id !== token.id);
      return [token, ...filtered].slice(0, 5); // Keep only 5 recent tokens
    });

    // Load liquidity info if paired token is available
    if (pairedToken && showLiquidityInfo) {
      await loadTokenLiquidityInfo(token);
    }
  }, [onSelectToken, pairedToken, showLiquidityInfo, loadTokenLiquidityInfo]);

  // Enhanced token filtering and sorting
  const filteredAndSortedTokens = useMemo(() => {
    let filtered = tokens;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(token =>
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Liquidity filter
    if (filterByLiquidity && minLiquidityThreshold) {
      filtered = filtered.filter(token => {
        const liquidity = liquidityData.get(token.address || token.id);
        return liquidity && liquidity.tvlUSD >= minLiquidityThreshold;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      // Favorites first
      const aIsFavorite = favoriteTokens.has(a.address || a.id);
      const bIsFavorite = favoriteTokens.has(b.address || b.id);
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;

      // Then by sort criteria
      switch (sortBy) {
        case 'liquidity': {
          const aLiquidity = liquidityData.get(a.address || a.id)?.tvlUSD || 0;
          const bLiquidity = liquidityData.get(b.address || b.id)?.tvlUSD || 0;
          return bLiquidity - aLiquidity;
        }
        case 'volume': {
          const aVolume = liquidityData.get(a.address || a.id)?.volumeUSD24h || 0;
          const bVolume = liquidityData.get(b.address || b.id)?.volumeUSD24h || 0;
          return bVolume - aVolume;
        }
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [tokens, searchTerm, filterByLiquidity, minLiquidityThreshold, liquidityData, sortBy, favoriteTokens]);

  // Toggle favorite token
  const toggleFavorite = useCallback((tokenId: string) => {
    setFavoriteTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  }, []);





  /**
   * Get mock liquidity info for development
   */
  const getMockLiquidityInfo = (token: Token): TokenLiquidityInfo => {
    return {
      hasLiquidity: true,
      tvlUSD: Math.random() * 1000000 + 100000, // $100k - $1M
      volumeUSD24h: Math.random() * 500000 + 50000, // $50k - $500k
      bestFeeAmount: FeeAmount.MEDIUM,
      availableFeeTiers: [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH],
      priceImpact1000USD: Math.random() * 2 + 0.1, // 0.1% - 2%
      isLoading: false
    };
  };

  /**
   * Enhanced tokens with liquidity information
   */
  const enhancedTokens = useMemo(() => {
    if (!showLiquidityInfo || !pairedToken) return tokens;

    return tokens.map(token => {
      const liquidityInfo = liquidityData.get(token.address || '');
      
      return {
        ...token,
        // Add liquidity metadata for display
        liquidityInfo
      };
    });
  }, [tokens, liquidityData, showLiquidityInfo, pairedToken]);

  /**
   * Filter tokens by liquidity threshold
   */
  const filteredTokens = useMemo(() => {
    if (!showLiquidityInfo || minLiquidityThreshold <= 0) return enhancedTokens;

    return enhancedTokens.filter(token => {
      const liquidityInfo = liquidityData.get(token.address || '');
      return !liquidityInfo || liquidityInfo.tvlUSD >= minLiquidityThreshold;
    });
  }, [enhancedTokens, liquidityData, showLiquidityInfo, minLiquidityThreshold]);

  /**
   * Load liquidity for visible tokens
   */
  useEffect(() => {
    if (showLiquidityInfo && pairedToken) {
      // Load liquidity for top tokens
      const topTokens = tokens.slice(0, 20); // Load for first 20 tokens
      topTokens.forEach(token => {
        if (token.address && !liquidityData.has(token.address)) {
          loadTokenLiquidityInfo(token);
        }
      });
    }
  }, [tokens, pairedToken, showLiquidityInfo, loadTokenLiquidityInfo, liquidityData]);

  return (
    <div className="space-y-3">
      {/* Enhanced Search and Filter Controls */}
      {showLiquidityInfo && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-dex-text-primary">Token Search & Filters</Label>
            <div className="flex items-center space-x-2 text-xs text-dex-text-secondary">
              <Filter className="w-3 h-3" />
              <span>{filteredAndSortedTokens.length} tokens</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dex-text-secondary" />
            <input
              type="text"
              placeholder="Search by name, symbol, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dex-secondary/10 border border-dex-border rounded-lg text-dex-text-primary placeholder-dex-text-secondary focus:outline-none focus:border-dex-primary/50 text-sm"
            />
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterByLiquidity(!filterByLiquidity)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-xs transition-colors ${
                  filterByLiquidity
                    ? 'bg-dex-primary text-white'
                    : 'bg-dex-secondary/20 text-dex-text-secondary hover:bg-dex-secondary/30'
                }`}
              >
                <Droplets className="w-3 h-3" />
                <span>High Liquidity</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-dex-text-secondary">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'liquidity' | 'volume')}
                className="bg-dex-secondary/10 border border-dex-border rounded px-2 py-1 text-xs text-dex-text-primary focus:outline-none focus:border-dex-primary/50"
              >
                <option value="name">Name</option>
                <option value="liquidity">Liquidity</option>
                <option value="volume">Volume</option>
              </select>
            </div>
          </div>

          {/* Recent Tokens */}
          {recentTokens.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-dex-text-secondary" />
                <span className="text-xs font-medium text-dex-text-secondary">Recent</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentTokens.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => handleTokenSelect(token)}
                    className="flex items-center space-x-1 px-2 py-1 bg-dex-secondary/20 hover:bg-dex-secondary/30 rounded-md text-xs text-dex-text-primary transition-colors"
                  >
                    <span>{token.symbol}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(token.address || token.id);
                      }}
                      className="ml-1"
                    >
                      <Star
                        className={`w-3 h-3 ${
                          favoriteTokens.has(token.address || token.id)
                            ? 'text-yellow-400 fill-current'
                            : 'text-dex-text-secondary'
                        }`}
                      />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Token Selector with advanced filtering */}
      <EnhancedTokenSelector
        tokens={filteredAndSortedTokens}
        selectedToken={selectedToken}
        onSelectToken={handleTokenSelect}
        label={label}
        required={required}
        showBalance={showBalance}
        allowCustomTokens={allowCustomTokens}
        placeholder={placeholder}
        error={error}
      />

      {/* Liquidity Information Display */}
      {selectedToken && showLiquidityInfo && pairedToken && (
        <div className="p-3 bg-dex-secondary/10 border border-dex-primary/30 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-dex-text-primary">
            <Droplets className="h-4 w-4" />
            <span>Pool Liquidity: {selectedToken.symbol}/{pairedToken.symbol}</span>
          </div>
          
          {(() => {
            const liquidityInfo = liquidityData.get(selectedToken.address || '');
            
            if (!liquidityInfo || liquidityInfo.isLoading || isLoadingLiquidity) {
              return (
                <div className="flex items-center gap-2 text-dex-text-secondary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-xs">Loading liquidity data...</span>
                </div>
              );
            }

            if (liquidityInfo.error) {
              return (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">Failed to load liquidity data</span>
                </div>
              );
            }

            if (!liquidityInfo.hasLiquidity) {
              return (
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">No liquidity pools found</span>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-dex-text-secondary" />
                    <span className="text-dex-text-secondary">TVL:</span>
                    <span className="text-dex-text-primary font-medium">
                      ${liquidityInfo.tvlUSD.toLocaleString()}
                    </span>
                  </div>
                  {showVolumeInfo && (
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-dex-text-secondary" />
                      <span className="text-dex-text-secondary">24h Vol:</span>
                      <span className="text-dex-text-primary font-medium">
                        ${liquidityInfo.volumeUSD24h.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dex-text-secondary">Available Fee Tiers:</span>
                  <div className="flex gap-1">
                    {liquidityInfo.availableFeeTiers.map(fee => (
                      <Badge 
                        key={fee} 
                        variant={fee === liquidityInfo.bestFeeAmount ? "default" : "outline"}
                        className="text-xs px-1 py-0"
                      >
                        {(fee / 10000).toFixed(2)}%
                      </Badge>
                    ))}
                  </div>
                </div>

                {liquidityInfo.priceImpact1000USD > 5 && (
                  <div className="flex items-center gap-2 text-orange-400">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs">
                      High price impact for $1000 trades (~{liquidityInfo.priceImpact1000USD.toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default UniswapV3TokenSelector;
