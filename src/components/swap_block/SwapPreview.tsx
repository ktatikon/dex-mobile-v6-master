/**
 * ENHANCED SWAPPREVIEW COMPONENT - MODULAR ARCHITECTURE
 * 
 * Displays swap details, MEV analysis, gas optimization results, and TDS compliance.
 * Integrates with enterprise services for comprehensive transaction analysis.
 * Built with real-time updates and enterprise loading patterns.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  Shield,
  Zap,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw
} from 'lucide-react';
import { loadingOrchestrator } from '@/services/enterprise/loadingOrchestrator';
import { Token } from '@/types';
import { SwapQuote } from '@/services/blockchainService';
import { UniswapV3SwapQuote } from '@/services/uniswapV3Service';
import { MEVAnalysis } from '@/services/mevProtectionService';
import { GasOptimizationResult } from '@/services/gasOptimizationService';
import { TDSCalculation } from '@/services/tdsComplianceService';

// Types for component props
export interface SwapPreviewProps {
  swapQuote: SwapQuote | UniswapV3SwapQuote | null;
  isGettingQuote: boolean;
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  mevAnalysis?: MEVAnalysis | null;
  gasOptimization?: GasOptimizationResult | null;
  tdsCalculation?: TDSCalculation | null;
  onRefreshQuote?: () => void;
  className?: string;
}

// Price impact severity levels
type PriceImpactLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

/**
 * Enhanced SwapPreview Component
 * Displays comprehensive swap analysis with enterprise service integration
 */
export const SwapPreview: React.FC<SwapPreviewProps> = ({
  swapQuote,
  isGettingQuote,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  mevAnalysis,
  gasOptimization,
  tdsCalculation,
  onRefreshQuote,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // Update timestamp when quote changes
  useEffect(() => {
    if (swapQuote) {
      setLastUpdateTime(new Date());
    }
  }, [swapQuote]);

  /**
   * Calculate price impact level
   */
  const getPriceImpactLevel = useCallback((priceImpact: number): PriceImpactLevel => {
    if (priceImpact < 0.1) return 'none';
    if (priceImpact < 1) return 'low';
    if (priceImpact < 3) return 'medium';
    if (priceImpact < 5) return 'high';
    return 'critical';
  }, []);

  /**
   * Get price impact color
   */
  const getPriceImpactColor = useCallback((level: PriceImpactLevel): string => {
    switch (level) {
      case 'none': return 'text-green-400';
      case 'low': return 'text-yellow-400';
      case 'medium': return 'text-orange-400';
      case 'high': return 'text-red-400';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-400';
    }
  }, []);

  /**
   * Format currency value
   */
  const formatCurrency = useCallback((value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value);
  }, []);

  /**
   * Format percentage
   */
  const formatPercentage = useCallback((value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  }, []);

  // Don't render if no quote data
  if (!swapQuote && !isGettingQuote) {
    return null;
  }

  // Loading state
  if (isGettingQuote) {
    return (
      <Card className={`bg-[#1C1C1E] border-gray-600 p-4 ${className}`}>
        <div className="text-center py-6">
          <div className="w-6 h-6 border-2 border-[#B1420A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Analyzing swap conditions...</p>
          <p className="text-xs text-gray-500 mt-1">MEV protection • Gas optimization • TDS compliance</p>
        </div>
      </Card>
    );
  }

  if (!swapQuote) {
    return null;
  }

  // Calculate derived values
  const exchangeRate = fromToken && toToken && fromAmount && toAmount ? 
    (parseFloat(toAmount) / parseFloat(fromAmount)) : 0;
  
  const priceImpact = swapQuote.priceImpact || 0;
  const priceImpactLevel = getPriceImpactLevel(priceImpact);
  const priceImpactColor = getPriceImpactColor(priceImpactLevel);

  return (
    <Card className={`bg-[#1C1C1E] border-gray-600 p-4 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#B1420A]" />
          <span className="font-semibold text-white">Swap Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdateTime && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdateTime.toLocaleTimeString()}
            </span>
          )}
          {onRefreshQuote && (
            <Button
              onClick={onRefreshQuote}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-1"
              title="Refresh Quote"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Swap Details */}
      <div className="space-y-3">
        {/* Exchange Rate */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Exchange Rate</span>
          <div className="text-right">
            <div className="text-sm text-white font-medium">
              1 {fromToken?.symbol} = {exchangeRate.toFixed(6)} {toToken?.symbol}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Live price</span>
            </div>
          </div>
        </div>

        {/* Price Impact */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Price Impact</span>
          <span className={`text-sm font-medium ${priceImpactColor}`}>
            {formatPercentage(priceImpact)}
          </span>
        </div>

        {/* Network Fee */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Network Fee</span>
          <span className="text-sm text-white">
            {swapQuote.gasPrice ? `${parseFloat(swapQuote.gasPrice).toFixed(4)} ETH` : 'Calculating...'}
          </span>
        </div>

        {/* Minimum Received */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Minimum Received</span>
          <span className="text-sm text-white">
            {swapQuote.minimumReceived || toAmount} {toToken?.symbol}
          </span>
        </div>
      </div>

      {/* Enterprise Services Analysis */}
      {(mevAnalysis || gasOptimization || tdsCalculation) && (
        <div className="mt-4 pt-4 border-t border-gray-600">
          <div className="space-y-3">
            {/* MEV Protection Analysis */}
            {mevAnalysis && (
              <div className="bg-[#2C2C2E] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">MEV Protection</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    mevAnalysis.riskLevel === 'low' ? 'bg-green-900/20 text-green-400' :
                    mevAnalysis.riskLevel === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                    'bg-red-900/20 text-red-400'
                  }`}>
                    {mevAnalysis.riskLevel?.toUpperCase()} RISK
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Protection Level:</span>
                    <span className="text-white">{mevAnalysis.protectionLevel || 'Standard'}</span>
                  </div>
                  {mevAnalysis.estimatedSavings > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Est. Savings:</span>
                      <span className="text-green-400">{formatCurrency(mevAnalysis.estimatedSavings)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Gas Optimization */}
            {gasOptimization && (
              <div className="bg-[#2C2C2E] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-white">Gas Optimization</span>
                  <span className="text-xs bg-yellow-900/20 text-yellow-400 px-2 py-1 rounded">
                    {gasOptimization.recommendedTier?.tier?.toUpperCase() || 'STANDARD'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated Cost:</span>
                    <span className="text-white">{formatCurrency(gasOptimization.recommendedTier?.cost || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated Time:</span>
                    <span className="text-white">{gasOptimization.recommendedTier?.estimatedTime || '2-3 min'}</span>
                  </div>
                  {gasOptimization.optimization?.potentialSavings > 0 && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-gray-400">Potential Savings:</span>
                      <span className="text-green-400">{formatCurrency(gasOptimization.optimization.potentialSavings)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TDS Compliance */}
            {tdsCalculation && (
              <div className="bg-[#2C2C2E] rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">TDS Compliance</span>
                  <span className="text-xs bg-purple-900/20 text-purple-400 px-2 py-1 rounded">
                    INDIA
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">TDS Rate:</span>
                    <span className="text-white">{tdsCalculation.rate || 1}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">TDS Amount:</span>
                    <span className="text-white">₹{tdsCalculation.amount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-400">Total Cost:</span>
                    <span className="text-white">₹{(tdsCalculation.totalAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Price Impact Warning */}
      {priceImpactLevel === 'high' || priceImpactLevel === 'critical' && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">High Price Impact Warning</span>
          </div>
          <p className="text-xs text-red-300 mt-1">
            This swap has a {priceImpactLevel} price impact of {formatPercentage(priceImpact)}. 
            Consider reducing the swap amount or checking for better routes.
          </p>
        </div>
      )}

      {/* Expand/Collapse Button */}
      <div className="mt-4 pt-3 border-t border-gray-600">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          size="sm"
          className="w-full text-gray-400 hover:text-white text-xs"
        >
          {isExpanded ? 'Show Less' : 'Show More Details'}
        </Button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Route:</span>
            <span className="text-white">{swapQuote.route || 'Direct'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Slippage Tolerance:</span>
            <span className="text-white">{swapQuote.slippage || 0.5}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Transaction Deadline:</span>
            <span className="text-white">20 minutes</span>
          </div>
          {swapQuote.poolFee && (
            <div className="flex justify-between">
              <span className="text-gray-400">Pool Fee:</span>
              <span className="text-white">{swapQuote.poolFee}%</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default SwapPreview;
