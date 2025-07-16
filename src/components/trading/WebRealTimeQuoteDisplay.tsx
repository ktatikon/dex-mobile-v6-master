/**
 * WEB REAL-TIME QUOTE DISPLAY COMPONENT - ENTERPRISE IMPLEMENTATION
 * Web-compatible version using Shadcn/UI components
 * Real-time quote updates with price impact warnings, route visualization, and confidence indicators
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, TrendingUp, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { loadingOrchestrator } from '../../services/enterprise/loadingOrchestrator';
import { uniswapV3Service } from '../../services/uniswapV3Service';
import { realTimeDataManager } from '../../services/enterprise/realTimeDataManager';

// ==================== TYPES & INTERFACES ====================

export interface QuoteData {
  amountOut: string;
  amountIn: string;
  priceImpact: number;
  gasEstimate: string;
  route: string[];
  confidence: number; // 0-1
  timestamp: Date;
  exchangeRate: number;
  minimumReceived: string;
  maxSlippage: number;
  estimatedTime: number; // seconds
  fees: {
    network: string;
    platform: string;
    total: string;
  };
}

export interface WebRealTimeQuoteDisplayProps {
  fromToken: {
    address: string;
    symbol: string;
    decimals: number;
    logoUri?: string;
  };
  toToken: {
    address: string;
    symbol: string;
    decimals: number;
    logoUri?: string;
  };
  amountIn: string;
  slippageTolerance: number;
  onQuoteUpdate: (quote: QuoteData | null) => void;
  refreshInterval?: number; // milliseconds
  autoRefresh?: boolean;
  networkId: string;
}

// ==================== COMPONENT ====================

export const WebRealTimeQuoteDisplay: React.FC<WebRealTimeQuoteDisplayProps> = ({
  fromToken,
  toToken,
  amountIn,
  slippageTolerance,
  onQuoteUpdate,
  refreshInterval = 15000, // 15 seconds
  autoRefresh = true,
  networkId
}) => {
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (amountIn && parseFloat(amountIn) > 0 && fromToken.address && toToken.address) {
      fetchQuote();
      
      if (autoRefresh) {
        startAutoRefresh();
      }
    } else {
      setQuote(null);
      setError(null);
      stopAutoRefresh();
    }

    return () => {
      stopAutoRefresh();
    };
  }, [amountIn, fromToken.address, toToken.address, slippageTolerance, autoRefresh, refreshInterval]);

  useEffect(() => {
    onQuoteUpdate(quote);
  }, [quote, onQuoteUpdate]);

  // ==================== QUOTE FETCHING ====================

  const fetchQuote = useCallback(async () => {
    if (!amountIn || parseFloat(amountIn) <= 0) return;

    try {
      setIsLoading(true);
      setError(null);

      const quoteResult = await uniswapV3Service.getSwapQuote({
        fromToken,
        toToken,
        amountIn,
        slippageTolerance,
        recipient: '0x0000000000000000000000000000000000000000', // Placeholder
        feeAmount: 3000 // 0.3% default fee
      });

      // Calculate additional quote data
      const exchangeRate = parseFloat(quoteResult.amountOut) / parseFloat(amountIn);
      const minimumReceived = (parseFloat(quoteResult.amountOut) * (1 - slippageTolerance / 100)).toFixed(6);
      
      // Estimate confidence based on price impact and route complexity
      const confidence = calculateConfidence(quoteResult.priceImpact, quoteResult.route?.length || 2);

      const newQuote: QuoteData = {
        amountOut: quoteResult.amountOut,
        amountIn,
        priceImpact: quoteResult.priceImpact,
        gasEstimate: quoteResult.gasEstimate,
        route: quoteResult.route || [fromToken.address, toToken.address],
        confidence,
        timestamp: new Date(),
        exchangeRate,
        minimumReceived,
        maxSlippage: slippageTolerance,
        estimatedTime: 60, // 1 minute default
        fees: {
          network: (parseFloat(quoteResult.gasEstimate) * 20 / 1e9).toFixed(6), // Rough ETH estimate
          platform: (parseFloat(quoteResult.amountOut) * 0.003).toFixed(6), // 0.3% platform fee
          total: (parseFloat(quoteResult.gasEstimate) * 20 / 1e9 + parseFloat(quoteResult.amountOut) * 0.003).toFixed(6)
        }
      };

      setQuote(newQuote);
      setLastUpdated(new Date());
      setCountdown(refreshInterval / 1000);

    } catch (err) {
      console.error('Failed to fetch quote:', err);
      setError(err instanceof Error ? err.message : 'Failed to get quote');
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, [amountIn, fromToken, toToken, slippageTolerance, refreshInterval]);

  // ==================== AUTO REFRESH ====================

  const startAutoRefresh = useCallback(() => {
    stopAutoRefresh();
    
    refreshTimerRef.current = setInterval(fetchQuote, refreshInterval);
    
    // Start countdown timer
    setCountdown(refreshInterval / 1000);
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
  }, [fetchQuote, refreshInterval]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // ==================== UTILITY FUNCTIONS ====================

  const calculateConfidence = (priceImpact: number, routeLength: number): number => {
    const confidence = 1.0;// Reduce confidence based on price impact
    if (priceImpact > 5) confidence -= 0.3;
    else if (priceImpact > 2) confidence -= 0.2;
    else if (priceImpact > 1) confidence -= 0.1;
    
    // Reduce confidence for complex routes
    if (routeLength > 2) confidence -= 0.1;
    if (routeLength > 3) confidence -= 0.2;
    
    return Math.max(0.1, confidence);
  };

  const getPriceImpactColor = (impact: number): string => {
    if (impact < 1) return 'text-green-400';
    if (impact < 3) return 'text-yellow-400';
    if (impact < 5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.8) return 'bg-green-400';
    if (confidence > 0.6) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // ==================== RENDER HELPERS ====================

  if (error) {
    return (
      <Card className="bg-dex-secondary/10 border-dex-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchQuote}
            className="w-full mt-2 border-dex-primary/30"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !quote) {
    return (
      <Card className="bg-dex-secondary/10 border-dex-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-dex-primary" />
            <span className="text-sm text-dex-text-secondary">Getting best quote...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quote) {
    return (
      <Card className="bg-dex-secondary/10 border-dex-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2 text-dex-text-secondary">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Enter amount to see quote</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dex-secondary/10 border-dex-primary/30">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium text-dex-text-primary flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-dex-primary" />
            Best Quote
          </CardTitle>
          <div className="flex items-center space-x-2">
            {autoRefresh && countdown > 0 && (
              <span className="text-xs text-dex-text-secondary">{countdown}s</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchQuote}
              disabled={isLoading}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 text-dex-primary ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-dex-text-secondary">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Quote Amount */}
        <div className="text-center">
          <div className="text-2xl font-bold text-dex-text-primary">
            {parseFloat(quote.amountOut).toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 6 
            })}
          </div>
          <div className="text-sm text-dex-text-secondary">{toToken.symbol}</div>
          <div className="text-xs text-dex-text-secondary mt-1">
            1 {fromToken.symbol} = {quote.exchangeRate.toFixed(6)} {toToken.symbol}
          </div>
        </div>

        <Separator className="bg-dex-border/30" />

        {/* Quote Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-dex-text-secondary">Price Impact:</span>
              <div className="flex items-center gap-1">
                <span className={`font-medium ${getPriceImpactColor(quote.priceImpact)}`}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
                {quote.priceImpact > 3 && (
                  <AlertTriangle className="h-3 w-3 text-orange-400" />
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-dex-text-secondary">Confidence:</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-2 bg-dex-secondary/30 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getConfidenceColor(quote.confidence)} transition-all duration-300`}
                    style={{ width: `${quote.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-dex-text-primary">
                  {(quote.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-dex-text-secondary">Min. Received:</span>
              <span className="text-dex-text-primary font-medium">
                {quote.minimumReceived} {toToken.symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dex-text-secondary">Est. Time:</span>
              <span className="text-dex-text-primary">
                {formatTime(quote.estimatedTime)}
              </span>
            </div>
          </div>
        </div>

        {/* Route Display */}
        {quote.route.length > 2 && (
          <div className="space-y-2">
            <span className="text-xs text-dex-text-secondary">Route:</span>
            <div className="flex items-center space-x-1 text-xs">
              {quote.route.map((address, index) => (
                <React.Fragment key={address}>
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    {address === fromToken.address ? fromToken.symbol : 
                     address === toToken.address ? toToken.symbol : 
                     address.slice(0, 6) + '...'}
                  </Badge>
                  {index < quote.route.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-dex-text-secondary" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Price Impact Warning */}
        {quote.priceImpact > 3 && (
          <div className="flex items-start space-x-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5" />
            <div className="text-xs">
              <div className="text-orange-400 font-medium">High Price Impact Warning</div>
              <div className="text-dex-text-secondary mt-1">
                {quote.priceImpact > 10
                  ? 'This trade will significantly impact the token price'
                  : 'Consider splitting this trade into smaller amounts'
                }
              </div>
            </div>
          </div>
        )}

        {/* Fees Breakdown */}
        <div className="text-xs text-dex-text-secondary space-y-1">
          <div className="flex justify-between">
            <span>Network Fee:</span>
            <span>{quote.fees.network} ETH</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee:</span>
            <span>{quote.fees.platform} {toToken.symbol}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebRealTimeQuoteDisplay;
