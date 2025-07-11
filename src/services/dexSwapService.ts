import { SwapParams, SwapQuote, TransactionResult } from './blockchainService';
import { getRouterAddress, getNetworkConfig } from '@/contracts/addresses';
import { uniswapV3Service, UniswapV3SwapRequest, UniswapV3SwapQuote } from './uniswapV3Service';
import { Token } from '@/types';
import { FeeAmount } from '@uniswap/v3-sdk';

export interface SwapRequest {
  fromToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  toToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  amountIn: string;
  slippageTolerance: number;
  recipient?: string;
  deadline?: number;
  useUniswapV3?: boolean; // New flag to enable Uniswap V3
  feeAmount?: FeeAmount; // Uniswap V3 fee tier
}

export interface SwapPreview {
  quote: SwapQuote;
  needsApproval: boolean;
  approvalTxHash?: string;
  gasEstimate: {
    approval?: string;
    swap: string;
    total: string;
  };
  priceImpactWarning: boolean;
  slippageWarning: boolean;
  // Enhanced Uniswap V3 fields
  uniswapV3Quote?: UniswapV3SwapQuote;
  isUniswapV3?: boolean;
  feeAmount?: FeeAmount;
  poolAddress?: string;
  executionPrice?: string;
}

export interface SwapExecution {
  approvalResult?: TransactionResult;
  swapResult: TransactionResult;
  totalGasUsed: string;
  effectivePrice: string;
  priceImpact: number;
}

export type SwapStatus = 'idle' | 'quoting' | 'approving' | 'swapping' | 'completed' | 'failed';

interface ServiceEventListener {
  (...args: unknown[]): void;
}

interface WalletServiceInterface {
  getWalletInfo(): { address: string; chainId: number } | null;
  // Add other wallet service methods as needed
}

interface BlockchainServiceInterface {
  // Add blockchain service methods as needed
  [key: string]: unknown;
}

class DEXSwapService {
  private currentStatus: SwapStatus = 'idle';
  private eventListeners: Map<string, ServiceEventListener[]> = new Map();
  private walletService: WalletServiceInterface | null = null;
  private blockchainService: BlockchainServiceInterface | null = null;

  /**
   * Initialize DEX swap service with dependency injection
   */
  async initialize(walletSvc?: WalletServiceInterface, blockchainSvc?: BlockchainServiceInterface): Promise<void> {
    try {
      // Use dependency injection to avoid circular imports
      if (walletSvc) {
        this.walletService = walletSvc;
      } else {
        // Lazy load wallet service if not provided
        const { walletService } = await import('./walletService');
        this.walletService = walletService;
      }

      if (blockchainSvc) {
        this.blockchainService = blockchainSvc;
      } else {
        // Lazy load blockchain service if not provided
        const { blockchainService } = await import('./blockchainService');
        this.blockchainService = blockchainService;
      }

      // Initialize dependencies
      if (this.walletService && typeof this.walletService.initialize === 'function') {
        await this.walletService.initialize();
      }

      // Set up event listeners
      this.setupEventListeners();

      console.log('✅ DEX swap service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize DEX swap service:', error);
      throw error;
    }
  }

  /**
   * Get swap preview with all necessary information
   * Enhanced with Uniswap V3 integration
   */
  async getSwapPreview(request: SwapRequest): Promise<SwapPreview> {
    try {
      this.setStatus('quoting');

      // Ensure services are available
      if (!this.walletService || !this.blockchainService) {
        throw new Error('Services not initialized');
      }

      // Validate wallet connection
      if (!this.walletService.isConnected()) {
        throw new Error('Wallet not connected');
      }

      const walletInfo = this.walletService.getWalletInfo();
      if (!walletInfo) {
        throw new Error('Wallet info not available');
      }

      // Initialize blockchain service if needed
      if (!this.blockchainService.isInitialized()) {
        const networkId = this.getNetworkIdFromChainId(walletInfo.chainId);
        await this.blockchainService.initialize(networkId);
      }

      // Check if Uniswap V3 should be used
      if (request.useUniswapV3 && uniswapV3Service.isServiceInitialized()) {
        return await this.getUniswapV3Preview(request, walletInfo);
      }

      // Fallback to existing V2 logic
      return await this.getV2Preview(request, walletInfo);
    } catch (error) {
      this.setStatus('failed');
      console.error('❌ Failed to get swap preview:', error);
      throw error;
    }
  }

  /**
   * Get Uniswap V3 swap preview
   */
  private async getUniswapV3Preview(request: SwapRequest, walletInfo: { address: string; chainId: number }): Promise<SwapPreview> {
    try {
      // Convert to Token format for Uniswap V3 service
      const fromToken: Token = {
        id: request.fromToken.address,
        symbol: request.fromToken.symbol,
        name: request.fromToken.symbol,
        logo: '',
        decimals: request.fromToken.decimals,
        address: request.fromToken.address
      };

      const toToken: Token = {
        id: request.toToken.address,
        symbol: request.toToken.symbol,
        name: request.toToken.symbol,
        logo: '',
        decimals: request.toToken.decimals,
        address: request.toToken.address
      };

      // Create Uniswap V3 request
      const v3Request: UniswapV3SwapRequest = {
        fromToken,
        toToken,
        amountIn: request.amountIn,
        slippageTolerance: request.slippageTolerance,
        recipient: request.recipient || walletInfo.address,
        deadline: request.deadline,
        feeAmount: request.feeAmount || FeeAmount.MEDIUM
      };

      // Get Uniswap V3 quote
      const v3Quote = await uniswapV3Service.getSwapQuote(v3Request);

      // Convert to standard quote format
      const quote: SwapQuote = {
        amountOut: v3Quote.amountOut,
        priceImpact: v3Quote.priceImpact,
        gasEstimate: v3Quote.gasEstimate,
        route: [request.fromToken.address, request.toToken.address],
        minimumReceived: v3Quote.minimumReceived
      };

      // Check if approval is needed (for Uniswap V3 router)
      const needsApproval = !(await this.blockchainService.checkTokenApproval(
        request.fromToken.address,
        '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 SwapRouter
        request.amountIn
      ));

      const approvalGasEstimate = needsApproval ? '50000' : '0';
      const totalGasEstimate = (
        parseInt(approvalGasEstimate) + parseInt(v3Quote.gasEstimate)
      ).toString();

      const preview: SwapPreview = {
        quote,
        needsApproval,
        gasEstimate: {
          approval: needsApproval ? approvalGasEstimate : undefined,
          swap: v3Quote.gasEstimate,
          total: totalGasEstimate
        },
        priceImpactWarning: v3Quote.priceImpact > 5,
        slippageWarning: request.slippageTolerance > 3,
        // Enhanced V3 fields
        uniswapV3Quote: v3Quote,
        isUniswapV3: true,
        feeAmount: v3Request.feeAmount,
        poolAddress: v3Quote.poolAddress,
        executionPrice: v3Quote.executionPrice
      };

      this.setStatus('idle');
      this.emit('swapPreviewReady', preview);
      return preview;
    } catch (error) {
      console.error('❌ Failed to get Uniswap V3 preview:', error);
      throw error;
    }
  }

  /**
   * Get V2 swap preview (existing logic)
   */
  private async getV2Preview(request: SwapRequest, walletInfo: { address: string; chainId: number }): Promise<SwapPreview> {
    try {
      // Get swap quote
    const quote = await this.blockchainService.getSwapQuote(
      request.fromToken.address,
      request.toToken.address,
      request.amountIn,
      request.slippageTolerance
    );

    // Check if approval is needed
    const routerAddress = getRouterAddress(this.blockchainService.getCurrentNetwork());
    if (!routerAddress) {
      throw new Error('Router address not found for current network');
    }

    const needsApproval = !(await this.blockchainService.checkTokenApproval(
      request.fromToken.address,
      routerAddress,
      request.amountIn
    ));

    // Calculate gas estimates
    const swapGasEstimate = quote.gasEstimate;
    const approvalGasEstimate = needsApproval ? '50000' : '0';
    const totalGasEstimate = (
      parseInt(approvalGasEstimate) + parseInt(swapGasEstimate)
    ).toString();

    // Check for warnings
    const priceImpactWarning = quote.priceImpact > 5;
    const slippageWarning = request.slippageTolerance > 3;

    const preview: SwapPreview = {
      quote,
      needsApproval,
      gasEstimate: {
        approval: needsApproval ? approvalGasEstimate : undefined,
        swap: swapGasEstimate,
        total: totalGasEstimate
      },
      priceImpactWarning,
      slippageWarning,
      isUniswapV3: false
    };

    this.setStatus('idle');
    this.emit('swapPreviewReady', preview);

    return preview;
    } catch (error) {
      this.setStatus('failed');
      console.error('❌ Failed to get swap preview:', error);
      throw error;
    }
  }

  /**
   * Execute complete swap process (approval + swap)
   */
  async executeSwap(request: SwapRequest, preview: SwapPreview): Promise<SwapExecution> {
    try {
      // Ensure services are available
      if (!this.walletService || !this.blockchainService) {
        throw new Error('Services not initialized');
      }

      const walletInfo = this.walletService.getWalletInfo();
      if (!walletInfo) {
        throw new Error('Wallet not connected');
      }

      const recipient = request.recipient || walletInfo.address;
      const deadline = request.deadline || Math.floor(Date.now() / 1000) + 1200; // 20 minutes

      let approvalResult: TransactionResult | undefined;
      let totalGasUsed = '0';

      // Step 1: Approve token if needed
      if (preview.needsApproval) {
        this.setStatus('approving');
        this.emit('swapStatusUpdate', { status: 'approving', message: 'Approving token spending...' });

        const routerAddress = getRouterAddress(this.blockchainService.getCurrentNetwork());
        if (!routerAddress) {
          throw new Error('Router address not found');
        }

        approvalResult = await this.blockchainService.approveToken(
          request.fromToken.address,
          routerAddress,
          request.amountIn
        );

        if (!approvalResult.success) {
          throw new Error(`Approval failed: ${approvalResult.error}`);
        }

        totalGasUsed = approvalResult.gasUsed || '0';
        this.emit('approvalCompleted', approvalResult);
      }

      // Step 2: Execute swap
      this.setStatus('swapping');
      this.emit('swapStatusUpdate', { status: 'swapping', message: 'Executing swap...' });

      const swapParams: SwapParams = {
        fromToken: request.fromToken.address,
        toToken: request.toToken.address,
        amountIn: request.amountIn,
        amountOutMin: preview.quote.minimumReceived,
        slippageTolerance: request.slippageTolerance,
        deadline,
        recipient
      };

      const swapResult = await this.blockchainService.executeSwap(swapParams);

      if (!swapResult.success) {
        throw new Error(`Swap failed: ${swapResult.error}`);
      }

      // Calculate totals
      const swapGasUsed = swapResult.gasUsed || '0';
      totalGasUsed = (parseInt(totalGasUsed) + parseInt(swapGasUsed)).toString();

      // Calculate effective price and price impact
      const effectivePrice = this.calculateEffectivePrice(
        request.amountIn,
        preview.quote.amountOut,
        request.fromToken.symbol,
        request.toToken.symbol
      );

      const execution: SwapExecution = {
        approvalResult,
        swapResult,
        totalGasUsed,
        effectivePrice,
        priceImpact: preview.quote.priceImpact
      };

      this.setStatus('completed');
      this.emit('swapCompleted', execution);

      console.log('✅ Swap executed successfully:', execution);
      return execution;
    } catch (error) {
      this.setStatus('failed');
      console.error('❌ Failed to execute swap:', error);
      this.emit('swapFailed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get supported tokens for current network
   */
  async getSupportedTokens(): Promise<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
  }[]> {
    try {
      const networkId = blockchainService.getCurrentNetwork();
      const networkConfig = getNetworkConfig(networkId);
      
      if (!networkConfig) {
        return [];
      }

      // Return common tokens for the network
      const tokens = [];
      
      if (networkConfig.contracts.weth) {
        tokens.push({
          address: networkConfig.contracts.weth,
          symbol: networkConfig.nativeCurrency.symbol,
          name: networkConfig.nativeCurrency.name,
          decimals: networkConfig.nativeCurrency.decimals,
          isNative: true
        });
      }

      if (networkConfig.contracts.usdt) {
        tokens.push({
          address: networkConfig.contracts.usdt,
          symbol: 'USDT',
          name: 'Tether USD',
          decimals: 6,
          isNative: false
        });
      }

      if (networkConfig.contracts.usdc) {
        tokens.push({
          address: networkConfig.contracts.usdc,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          isNative: false
        });
      }

      if (networkConfig.contracts.dai) {
        tokens.push({
          address: networkConfig.contracts.dai,
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
          isNative: false
        });
      }

      return tokens;
    } catch (error) {
      console.error('❌ Failed to get supported tokens:', error);
      return [];
    }
  }

  /**
   * Get token balance for connected wallet
   */
  async getTokenBalance(tokenAddress: string): Promise<string> {
    try {
      const walletInfo = walletService.getWalletInfo();
      if (!walletInfo) {
        return '0';
      }

      return await blockchainService.getTokenBalance(tokenAddress, walletInfo.address);
    } catch (error) {
      console.error('❌ Failed to get token balance:', error);
      return '0';
    }
  }

  /**
   * Calculate effective price
   */
  private calculateEffectivePrice(
    amountIn: string,
    amountOut: string,
    fromSymbol: string,
    toSymbol: string
  ): string {
    const inputAmount = parseFloat(amountIn);
    const outputAmount = parseFloat(amountOut);
    
    if (inputAmount === 0) return '0';
    
    const price = outputAmount / inputAmount;
    return `1 ${fromSymbol} = ${price.toFixed(6)} ${toSymbol}`;
  }

  /**
   * Get network ID from chain ID
   */
  private getNetworkIdFromChainId(chainId: number): string {
    const networkMap: Record<number, string> = {
      1: 'ethereum',
      5: 'goerli',
      56: 'bsc',
      97: 'bscTestnet',
      137: 'polygon',
      80001: 'mumbai',
      42161: 'arbitrum'
    };

    return networkMap[chainId] || 'ethereum';
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    walletService.on('walletDisconnected', () => {
      this.setStatus('idle');
    });

    walletService.on('chainChanged', () => {
      this.setStatus('idle');
    });
  }

  /**
   * Status management
   */
  private setStatus(status: SwapStatus): void {
    this.currentStatus = status;
    this.emit('statusChanged', status);
  }

  getStatus(): SwapStatus {
    return this.currentStatus;
  }

  /**
   * Event emitter methods
   */
  on(event: string, callback: ServiceEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: ServiceEventListener): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

export const dexSwapService = new DEXSwapService();
