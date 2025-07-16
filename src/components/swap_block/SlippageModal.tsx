/**
 * ENHANCED SLIPPAGE MODAL - MODULAR ARCHITECTURE
 * 
 * Advanced slippage tolerance settings with real-time market analysis.
 * Integrates with enterprise services for optimal slippage recommendations.
 * Built with predictive analytics and risk assessment.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Sliders, 
  TrendingUp, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { realTimeDataManager } from '@/services/enterprise/realTimeDataManager';
import { loadingOrchestrator } from '@/services/enterprise/loadingOrchestrator';

// Types for component props
import { Token } from '@/types';

export interface SlippageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSlippageUpdate?: (slippage: number) => void;
  currentSlippage?: number;
  fromToken?: Token;
  toToken?: Token;
  swapAmount?: string;
  className?: string;
}

// Slippage preset options
const SLIPPAGE_PRESETS = [
  { value: 0.1, label: '0.1%', risk: 'low', description: 'Minimal slippage, may fail in volatile markets' },
  { value: 0.5, label: '0.5%', risk: 'low', description: 'Recommended for most trades' },
  { value: 1.0, label: '1.0%', risk: 'medium', description: 'Good for volatile tokens' },
  { value: 3.0, label: '3.0%', risk: 'high', description: 'High slippage for very volatile tokens' },
  { value: 5.0, label: '5.0%', risk: 'very-high', description: 'Maximum slippage, high risk' }
];

// Market volatility levels
type VolatilityLevel = 'low' | 'medium' | 'high' | 'extreme';

// Risk assessment interface
interface SlippageRiskAssessment {
  recommendedSlippage: number;
  marketVolatility: VolatilityLevel;
  priceImpact: number;
  liquidityDepth: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  suggestions: string[];
}

/**
 * Enhanced Slippage Modal Component
 * Advanced slippage tolerance settings with market analysis
 */
export const SlippageModal: React.FC<SlippageModalProps> = ({
  isOpen,
  onClose,
  onSlippageUpdate,
  currentSlippage = 0.5,
  fromToken,
  toToken,
  swapAmount,
  className = ''
}) => {
  const [slippage, setSlippage] = useState(currentSlippage);
  const [customSlippage, setCustomSlippage] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<SlippageRiskAssessment | null>(null);
  const [marketData, setMarketData] = useState<{
    volatility: number;
    liquidity: number;
    volume24h: number;
    priceImpact: number;
  } | null>(null);

  const componentId = 'slippage_modal';

  /**
   * Load market analysis for slippage recommendation
   */
  const loadMarketAnalysis = useCallback(async () => {
    if (!isOpen || !fromToken || !toToken) return;

    try {
      setIsLoading(true);
      await loadingOrchestrator.startLoading(componentId, 'Analyzing market conditions');

      // Get real-time market data
      const marketAnalysis = await realTimeDataManager.getMarketAnalysis([
        fromToken.address || fromToken.id,
        toToken.address || toToken.id
      ]);

      // Calculate volatility and liquidity metrics
      const fromTokenData = marketAnalysis[fromToken.address || fromToken.id];
      const toTokenData = marketAnalysis[toToken.address || toToken.id];

      const avgVolatility = ((fromTokenData?.volatility || 0) + (toTokenData?.volatility || 0)) / 2;
      const avgLiquidity = ((fromTokenData?.liquidity || 0) + (toTokenData?.liquidity || 0)) / 2;

      // Determine volatility level
      let volatilityLevel: VolatilityLevel = 'low';
      if (avgVolatility > 0.15) volatilityLevel = 'extreme';
      else if (avgVolatility > 0.08) volatilityLevel = 'high';
      else if (avgVolatility > 0.03) volatilityLevel = 'medium';

      // Calculate recommended slippage
      let recommendedSlippage = 0.5;// Default
      if (volatilityLevel === 'extreme') recommendedSlippage = 3.0;
      else if (volatilityLevel === 'high') recommendedSlippage = 1.5;
      else if (volatilityLevel === 'medium') recommendedSlippage = 1.0;

      // Adjust for liquidity
      if (avgLiquidity < 100000) recommendedSlippage += 0.5;
      if (avgLiquidity < 50000) recommendedSlippage += 1.0;

      // Calculate price impact estimate
      const swapValue = parseFloat(swapAmount || '0');
      const priceImpact = swapValue > 0 ? Math.min((swapValue / avgLiquidity) * 100, 10) : 0;

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (slippage > 3.0 || priceImpact > 3.0) riskLevel = 'critical';
      else if (slippage > 1.5 || priceImpact > 1.5) riskLevel = 'high';
      else if (slippage > 0.8 || priceImpact > 0.8) riskLevel = 'medium';

      // Generate warnings and suggestions
      const warnings: string[] = [];
      const suggestions: string[] = [];

      if (slippage < recommendedSlippage) {
        warnings.push('Slippage may be too low for current market conditions');
        suggestions.push(`Consider increasing to ${recommendedSlippage}% for better execution`);
      }

      if (slippage > 5.0) {
        warnings.push('Very high slippage tolerance - risk of significant value loss');
      }

      if (volatilityLevel === 'extreme') {
        warnings.push('Extremely volatile market conditions detected');
        suggestions.push('Consider waiting for market stabilization');
      }

      if (priceImpact > 2.0) {
        warnings.push('High price impact detected for this trade size');
        suggestions.push('Consider reducing trade size or splitting into multiple trades');
      }

      const assessment: SlippageRiskAssessment = {
        recommendedSlippage,
        marketVolatility: volatilityLevel,
        priceImpact,
        liquidityDepth: avgLiquidity,
        riskLevel,
        warnings,
        suggestions
      };

      setRiskAssessment(assessment);
      setMarketData({
        fromToken: fromTokenData,
        toToken: toTokenData,
        lastUpdated: new Date()
      });

      await loadingOrchestrator.completeLoading(componentId, 'Market analysis completed');
    } catch (error) {
      console.error('Failed to load market analysis:', error);
      await loadingOrchestrator.failLoading(componentId, `Failed to analyze market: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, fromToken, toToken, swapAmount, slippage]);

  /**
   * Handle slippage preset selection
   */
  const handlePresetSelect = useCallback((value: number) => {
    setSlippage(value);
    setIsCustom(false);
    setCustomSlippage('');
  }, []);

  /**
   * Handle custom slippage input
   */
  const handleCustomSlippageChange = useCallback((value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 50) {
      setSlippage(numValue);
      setIsCustom(true);
    }
  }, []);

  /**
   * Apply slippage settings
   */
  const applySlippage = useCallback(() => {
    if (onSlippageUpdate) {
      onSlippageUpdate(slippage);
    }
    onClose();
  }, [slippage, onSlippageUpdate, onClose]);

  /**
   * Use recommended slippage
   */
  const useRecommended = useCallback(() => {
    if (riskAssessment) {
      setSlippage(riskAssessment.recommendedSlippage);
      setIsCustom(false);
      setCustomSlippage('');
    }
  }, [riskAssessment]);

  // Load market analysis when modal opens
  useEffect(() => {
    if (isOpen) {
      loadMarketAnalysis();
    }
  }, [isOpen, loadMarketAnalysis]);

  // Update slippage when currentSlippage prop changes
  useEffect(() => {
    setSlippage(currentSlippage);
    setIsCustom(!SLIPPAGE_PRESETS.some(preset => preset.value === currentSlippage));
    if (!SLIPPAGE_PRESETS.some(preset => preset.value === currentSlippage)) {
      setCustomSlippage(currentSlippage.toString());
    }
  }, [currentSlippage]);

  /**
   * Get risk color based on level
   */
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'very-high': return 'text-red-400';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  /**
   * Get volatility color
   */
  const getVolatilityColor = (level: VolatilityLevel) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a1a] border-gray-600 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#B1420A]" />
            Slippage Tolerance
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Slippage Display */}
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-1">{slippage.toFixed(1)}%</div>
            <div className="text-sm text-gray-400">Current slippage tolerance</div>
          </div>

          {/* Market Analysis */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-[#B1420A] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Analyzing market conditions...</p>
            </div>
          ) : riskAssessment && (
            <div className="bg-[#2C2C2E] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Market Analysis</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Volatility:</span>
                  <span className={getVolatilityColor(riskAssessment.marketVolatility)}>
                    {riskAssessment.marketVolatility.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price Impact:</span>
                  <span className="text-white">{riskAssessment.priceImpact.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Risk Level:</span>
                  <span className={getRiskColor(riskAssessment.riskLevel)}>
                    {riskAssessment.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recommended:</span>
                  <span className="text-[#B1420A]">{riskAssessment.recommendedSlippage}%</span>
                </div>
              </div>

              {riskAssessment.recommendedSlippage !== slippage && (
                <Button
                  onClick={useRecommended}
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 border-[#B1420A] text-[#B1420A] hover:bg-[#B1420A] hover:text-white text-xs"
                >
                  Use Recommended ({riskAssessment.recommendedSlippage}%)
                </Button>
              )}
            </div>
          )}

          {/* Slippage Presets */}
          <div>
            <label className="text-sm text-gray-400 mb-3 block">Quick Settings</label>
            <div className="grid grid-cols-3 gap-2">
              {SLIPPAGE_PRESETS.slice(0, 3).map((preset) => (
                <Button
                  key={preset.value}
                  variant={!isCustom && slippage === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`text-xs ${
                    !isCustom && slippage === preset.value
                      ? 'bg-[#B1420A] text-white'
                      : 'border-gray-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SLIPPAGE_PRESETS.slice(3).map((preset) => (
                <Button
                  key={preset.value}
                  variant={!isCustom && slippage === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`text-xs ${
                    !isCustom && slippage === preset.value
                      ? 'bg-[#B1420A] text-white'
                      : 'border-gray-600 text-gray-300 hover:text-white'
                  }`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Slippage */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Custom Slippage</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.5"
                value={customSlippage}
                onChange={(e) => handleCustomSlippageChange(e.target.value)}
                className="bg-[#2C2C2E] border-gray-600 text-white"
                min="0"
                max="50"
                step="0.1"
              />
              <span className="flex items-center text-gray-400 text-sm">%</span>
            </div>
          </div>

          {/* Warnings and Suggestions */}
          {riskAssessment && (riskAssessment.warnings.length > 0 || riskAssessment.suggestions.length > 0) && (
            <div className="space-y-2">
              {riskAssessment.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-500/30 rounded">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-red-300">{warning}</span>
                </div>
              ))}
              {riskAssessment.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-blue-300">{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-600">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={applySlippage}
              className="flex-1 bg-[#B1420A] hover:bg-[#8B3208] text-white"
            >
              Apply {slippage.toFixed(1)}%
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SlippageModal;
