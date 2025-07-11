import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowUpDown, 
  Settings, 
  Sliders, 
  Wallet, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield,
  ChevronDown
} from 'lucide-react';
import { TokenSelector } from '@/components/TokenSelector';
import { SwapBlockProps, SwapExecutionData } from '@/components/swap_block/SwapBlock';
import { loadingOrchestrator } from '@/services/enterprise/loadingOrchestrator';
import { enterpriseServiceIntegrator } from '@/services/enterpriseServiceIntegrator';
import { uniswapV3Service, UniswapV3SwapQuote } from '@/services/uniswapV3Service';
import { blockchainService, SwapQuote, Token } from '@/services/blockchainService';
import '../../styles/mobile.css';

interface MobileSwapState {
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  toAmount: string;
  isGettingQuote: boolean;
  currentQuote: SwapQuote | UniswapV3SwapQuote | null;
  slippageTolerance: number;
  showTokenSelector: boolean;
  selectingToken: 'from' | 'to' | null;
  isSwapping: boolean;
  error: string | null;
  success: string | null;
}

export const MobileSwapBlock: React.FC<SwapBlockProps> = ({
  tokens = [],
  onSwap,
  enableUniswapV3 = true,
  defaultSlippage = 0.5,
  onQuoteUpdate,
  className = ''
}) => {
  const [swapState, setSwapState] = useState<MobileSwapState>({
    fromToken: null,
    toToken: null,
    fromAmount: '',
    toAmount: '',
    isGettingQuote: false,
    currentQuote: null,
    slippageTolerance: defaultSlippage,
    showTokenSelector: false,
    selectingToken: null,
    isSwapping: false,
    error: null,
    success: null
  });

  const [isServicesReady, setIsServicesReady] = useState(false);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await loadingOrchestrator.startLoading('mobile_swap_init', 'Initializing mobile swap services');
        
        if (!blockchainService.isInitialized()) {
          await blockchainService.initialize();
        }
        
        if (enableUniswapV3 && !uniswapV3Service.isInitialized()) {
          await uniswapV3Service.initialize();
        }
        
        await enterpriseServiceIntegrator.initializeAll();
        
        setIsServicesReady(true);
        await loadingOrchestrator.completeLoading('mobile_swap_init', 'Mobile swap services ready');
      } catch (error) {
        console.error('Failed to initialize mobile swap services:', error);
        setSwapState(prev => ({ ...prev, error: 'Failed to initialize services' }));
        await loadingOrchestrator.failLoading('mobile_swap_init', `Initialization failed: ${error}`);
      }
    };

    initializeServices();
  }, [enableUniswapV3]);

  // Get quote when amounts or tokens change
  useEffect(() => {
    if (swapState.fromToken && swapState.toToken && swapState.fromAmount && parseFloat(swapState.fromAmount) > 0) {
      getQuote();
    } else {
      setSwapState(prev => ({ ...prev, toAmount: '', currentQuote: null }));
    }
  }, [swapState.fromToken, swapState.toToken, swapState.fromAmount]);

  const getQuote = useCallback(async () => {
    if (!swapState.fromToken || !swapState.toToken || !swapState.fromAmount) return;

    setSwapState(prev => ({ ...prev, isGettingQuote: true, error: null }));

    try {
      let quote: SwapQuote | UniswapV3SwapQuote;

      if (enableUniswapV3 && uniswapV3Service.isInitialized()) {
        quote = await uniswapV3Service.getSwapQuote({
          tokenIn: swapState.fromToken,
          tokenOut: swapState.toToken,
          amountIn: swapState.fromAmount,
          slippageTolerance: swapState.slippageTolerance
        });
      } else {
        quote = await blockchainService.getSwapQuote(
          swapState.fromToken,
          swapState.toToken,
          swapState.fromAmount
        );
      }

      setSwapState(prev => ({
        ...prev,
        currentQuote: quote,
        toAmount: quote.amountOut,
        isGettingQuote: false
      }));

      onQuoteUpdate?.(quote);
    } catch (error) {
      console.error('Failed to get quote:', error);
      setSwapState(prev => ({
        ...prev,
        error: 'Failed to get quote. Please try again.',
        isGettingQuote: false
      }));
    }
  }, [swapState.fromToken, swapState.toToken, swapState.fromAmount, swapState.slippageTolerance, enableUniswapV3, onQuoteUpdate]);

  const handleTokenSelect = useCallback((token: Token) => {
    if (swapState.selectingToken === 'from') {
      setSwapState(prev => ({ ...prev, fromToken: token }));
    } else if (swapState.selectingToken === 'to') {
      setSwapState(prev => ({ ...prev, toToken: token }));
    }
    
    setSwapState(prev => ({
      ...prev,
      showTokenSelector: false,
      selectingToken: null
    }));
  }, [swapState.selectingToken]);

  const handleSwapTokens = useCallback(() => {
    setSwapState(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount
    }));
  }, []);

  const handleSwapExecute = useCallback(async () => {
    if (!swapState.currentQuote || !swapState.fromToken || !swapState.toToken) return;

    setSwapState(prev => ({ ...prev, isSwapping: true, error: null }));

    try {
      const swapData: SwapExecutionData = {
        fromToken: swapState.fromToken,
        toToken: swapState.toToken,
        fromAmount: swapState.fromAmount,
        toAmount: swapState.toAmount,
        quote: swapState.currentQuote
      };

      await onSwap?.(swapData);
      
      setSwapState(prev => ({
        ...prev,
        success: 'Swap executed successfully!',
        fromAmount: '',
        toAmount: '',
        currentQuote: null,
        isSwapping: false
      }));

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSwapState(prev => ({ ...prev, success: null }));
      }, 3000);

    } catch (error) {
      console.error('Swap execution failed:', error);
      setSwapState(prev => ({
        ...prev,
        error: 'Swap failed. Please try again.',
        isSwapping: false
      }));
    }
  }, [swapState.currentQuote, swapState.fromToken, swapState.toToken, swapState.fromAmount, swapState.toAmount, onSwap]);

  if (!isServicesReady) {
    return (
      <div className="mobile-content">
        <div className="mobile-loading">
          <div className="mobile-spinner"></div>
          Initializing DEX services...
        </div>
      </div>
    );
  }

  return (
    <div className={`mobile-swap-container ${className}`}>
      <Card className="mobile-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white font-poppins">Swap</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="mobile-touch-button p-2"
              onClick={() => getQuote()}
              disabled={swapState.isGettingQuote}
            >
              <RefreshCw className={`h-4 w-4 ${swapState.isGettingQuote ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="mobile-touch-button p-2"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {swapState.error && (
          <div className="mobile-error">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            {swapState.error}
          </div>
        )}

        {swapState.success && (
          <div className="mobile-success">
            <CheckCircle className="h-4 w-4 inline mr-2" />
            {swapState.success}
          </div>
        )}

        {/* From Token */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2 font-poppins">From</div>
          <div className="mobile-token-selector"
               onClick={() => setSwapState(prev => ({ 
                 ...prev, 
                 showTokenSelector: true, 
                 selectingToken: 'from' 
               }))}>
            <div className="flex items-center">
              {swapState.fromToken ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-orange-500 mr-3 flex items-center justify-center">
                    {swapState.fromToken.symbol.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{swapState.fromToken.symbol}</div>
                    <div className="text-sm text-gray-400">{swapState.fromToken.name}</div>
                  </div>
                </>
              ) : (
                <div className="text-gray-400">Select token</div>
              )}
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
          
          <Input
            type="number"
            placeholder="0.0"
            value={swapState.fromAmount}
            onChange={(e) => setSwapState(prev => ({ ...prev, fromAmount: e.target.value }))}
            className="mobile-amount-input mt-2"
          />
        </div>

        {/* Swap Button */}
        <div className="flex justify-center my-4">
          <Button
            variant="ghost"
            size="sm"
            className="mobile-touch-button p-3 rounded-full"
            onClick={handleSwapTokens}
          >
            <ArrowUpDown className="h-5 w-5" />
          </Button>
        </div>

        {/* To Token */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2 font-poppins">To</div>
          <div className="mobile-token-selector"
               onClick={() => setSwapState(prev => ({ 
                 ...prev, 
                 showTokenSelector: true, 
                 selectingToken: 'to' 
               }))}>
            <div className="flex items-center">
              {swapState.toToken ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-green-500 mr-3 flex items-center justify-center">
                    {swapState.toToken.symbol.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{swapState.toToken.symbol}</div>
                    <div className="text-sm text-gray-400">{swapState.toToken.name}</div>
                  </div>
                </>
              ) : (
                <div className="text-gray-400">Select token</div>
              )}
            </div>
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="mobile-amount-input mt-2 text-right text-2xl font-semibold text-white">
            {swapState.isGettingQuote ? (
              <div className="flex items-center justify-end">
                <div className="mobile-spinner mr-2"></div>
                Getting quote...
              </div>
            ) : (
              swapState.toAmount || '0.0'
            )}
          </div>
        </div>

        {/* Swap Execute Button */}
        <Button
          className="mobile-primary-button w-full mobile-touch-button"
          onClick={handleSwapExecute}
          disabled={!swapState.currentQuote || swapState.isSwapping || swapState.isGettingQuote}
        >
          {swapState.isSwapping ? (
            <div className="flex items-center">
              <div className="mobile-spinner mr-2"></div>
              Swapping...
            </div>
          ) : (
            'Swap'
          )}
        </Button>

        {/* Quote Details */}
        {swapState.currentQuote && (
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Quote Details</div>
            <div className="flex justify-between text-sm">
              <span>Rate</span>
              <span className="text-white">
                1 {swapState.fromToken?.symbol} = {(parseFloat(swapState.toAmount) / parseFloat(swapState.fromAmount)).toFixed(6)} {swapState.toToken?.symbol}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Slippage</span>
              <span className="text-white">{swapState.slippageTolerance}%</span>
            </div>
          </div>
        )}
      </Card>

      {/* Token Selector Modal */}
      {swapState.showTokenSelector && (
        <div className={`mobile-modal ${swapState.showTokenSelector ? 'open' : ''}`}>
          <div className="mobile-modal-header">
            <h3 className="text-lg font-semibold text-white">Select Token</h3>
            <Button
              variant="ghost"
              onClick={() => setSwapState(prev => ({ 
                ...prev, 
                showTokenSelector: false, 
                selectingToken: null 
              }))}
            >
              ✕
            </Button>
          </div>
          <div className="mobile-modal-content">
            <TokenSelector
              tokens={tokens}
              onSelect={handleTokenSelect}
              selectedToken={swapState.selectingToken === 'from' ? swapState.fromToken : swapState.toToken}
            />
          </div>
        </div>
      )}
    </div>
  );
};
