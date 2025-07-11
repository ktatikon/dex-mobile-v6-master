/**
 * REAL-TIME QUOTE DISPLAY COMPONENT - ENTERPRISE IMPLEMENTATION
 * Real-time quote updates with price impact warnings, route visualization, and confidence indicators
 * Integrates with Uniswap V3 services and enterprise loading patterns
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export interface RealTimeQuoteDisplayProps {
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

export const RealTimeQuoteDisplay: React.FC<RealTimeQuoteDisplayProps> = ({
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
  const pulseAnimation = useRef(new Animated.Value(1)).current;

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
      
      // Trigger pulse animation
      Animated.sequence([
        Animated.timing(pulseAnimation, { toValue: 1.1, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnimation, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();

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
    let confidence = 1.0;
    
    // Reduce confidence based on price impact
    if (priceImpact > 5) confidence -= 0.3;
    else if (priceImpact > 2) confidence -= 0.2;
    else if (priceImpact > 1) confidence -= 0.1;
    
    // Reduce confidence for complex routes
    if (routeLength > 2) confidence -= 0.1;
    if (routeLength > 3) confidence -= 0.2;
    
    return Math.max(0.1, confidence);
  };

  const getPriceImpactColor = (impact: number): string => {
    if (impact < 1) return '#34C759';
    if (impact < 3) return '#FF9500';
    if (impact < 5) return '#FF3B30';
    return '#FF3B30';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.8) return '#34C759';
    if (confidence > 0.6) return '#FF9500';
    return '#FF3B30';
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // ==================== RENDER HELPERS ====================

  const renderQuoteHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Best Quote</Text>
        {lastUpdated && (
          <Text style={styles.lastUpdated}>
            Updated {lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </View>
      
      <View style={styles.headerRight}>
        {autoRefresh && countdown > 0 && (
          <Text style={styles.countdown}>{countdown}s</Text>
        )}
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={fetchQuote}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#B1420A" />
          ) : (
            <Ionicons name="refresh" size={16} color="#B1420A" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderQuoteAmount = () => (
    <Animated.View style={[styles.amountContainer, { transform: [{ scale: pulseAnimation }] }]}>
      <Text style={styles.amountValue}>
        {parseFloat(quote!.amountOut).toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 6 
        })}
      </Text>
      <Text style={styles.amountSymbol}>{toToken.symbol}</Text>
      
      <View style={styles.exchangeRateContainer}>
        <Text style={styles.exchangeRate}>
          1 {fromToken.symbol} = {quote!.exchangeRate.toFixed(6)} {toToken.symbol}
        </Text>
      </View>
    </Animated.View>
  );

  const renderPriceImpact = () => (
    <View style={styles.metricContainer}>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Price Impact</Text>
        <Text style={[styles.metricValue, { color: getPriceImpactColor(quote!.priceImpact) }]}>
          {quote!.priceImpact.toFixed(2)}%
        </Text>
      </View>
      
      {quote!.priceImpact > 3 && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={14} color="#FF3B30" />
          <Text style={styles.warningText}>High price impact</Text>
        </View>
      )}
    </View>
  );

  const renderConfidence = () => (
    <View style={styles.metricContainer}>
      <View style={styles.metricRow}>
        <Text style={styles.metricLabel}>Confidence</Text>
        <View style={styles.confidenceContainer}>
          <View style={[styles.confidenceBar, { width: `${quote!.confidence * 100}%`, backgroundColor: getConfidenceColor(quote!.confidence) }]} />
          <Text style={[styles.metricValue, { color: getConfidenceColor(quote!.confidence) }]}>
            {(quote!.confidence * 100).toFixed(0)}%
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRoute = () => (
    <View style={styles.routeContainer}>
      <Text style={styles.routeLabel}>Route</Text>
      <View style={styles.routePath}>
        {quote!.route.map((address, index) => (
          <React.Fragment key={address}>
            <View style={styles.routeToken}>
              <Text style={styles.routeTokenText}>
                {address === fromToken.address ? fromToken.symbol : 
                 address === toToken.address ? toToken.symbol : 
                 address.slice(0, 6) + '...'}
              </Text>
            </View>
            {index < quote!.route.length - 1 && (
              <Ionicons name="arrow-forward" size={12} color="#8E8E93" style={styles.routeArrow} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  const renderFees = () => (
    <View style={styles.feesContainer}>
      <Text style={styles.feesLabel}>Estimated Fees</Text>
      <View style={styles.feeRow}>
        <Text style={styles.feeLabel}>Network Fee</Text>
        <Text style={styles.feeValue}>{quote!.fees.network} ETH</Text>
      </View>
      <View style={styles.feeRow}>
        <Text style={styles.feeLabel}>Platform Fee</Text>
        <Text style={styles.feeValue}>{quote!.fees.platform} {toToken.symbol}</Text>
      </View>
    </View>
  );

  // ==================== MAIN RENDER ====================

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQuote}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && !quote) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#B1420A" />
          <Text style={styles.loadingText}>Getting best quote...</Text>
        </View>
      </View>
    );
  }

  if (!quote) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="swap-horizontal" size={32} color="#8E8E93" />
          <Text style={styles.emptyText}>Enter amount to see quote</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderQuoteHeader()}
      {renderQuoteAmount()}
      {renderPriceImpact()}
      {renderConfidence()}
      {renderRoute()}
      {renderFees()}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Minimum received: {quote.minimumReceived} {toToken.symbol}
        </Text>
        <Text style={styles.footerText}>
          Est. time: {formatTime(quote.estimatedTime)}
        </Text>
      </View>
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    fontFamily: 'Poppins',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countdown: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Poppins',
  },
  refreshButton: {
    padding: 4,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  amountSymbol: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 4,
    fontFamily: 'Poppins',
  },
  exchangeRateContainer: {
    marginTop: 8,
  },
  exchangeRate: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Poppins',
  },
  metricContainer: {
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Poppins',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBar: {
    height: 4,
    borderRadius: 2,
    width: 40,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#FF3B30',
    fontFamily: 'Poppins',
  },
  routeContainer: {
    marginBottom: 12,
  },
  routeLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  routePath: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  routeToken: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  routeTokenText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  routeArrow: {
    marginHorizontal: 4,
  },
  feesContainer: {
    marginBottom: 12,
  },
  feesLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  feeLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Poppins',
  },
  feeValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Poppins',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    paddingTop: 12,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'Poppins',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginVertical: 8,
    fontFamily: 'Poppins',
  },
  retryButton: {
    backgroundColor: '#B1420A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    fontFamily: 'Poppins',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    fontFamily: 'Poppins',
  },
});

export default RealTimeQuoteDisplay;
