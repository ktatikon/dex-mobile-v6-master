import { ethers } from 'ethers';
import { UNISWAP_V2_ROUTER_ABI } from '@/contracts/abis/UniswapV2Router';
import { UNISWAP_V3_ROUTER_ABI } from '@/contracts/abis/UniswapV3Router';
import { UNISWAP_V3_QUOTER_ABI } from '@/contracts/abis/UniswapV3Quoter';
import { UNISWAP_V3_FACTORY_ABI } from '@/contracts/abis/UniswapV3Factory';
import { UNISWAP_V3_POOL_ABI } from '@/contracts/abis/UniswapV3Pool';
import { ERC20_ABI } from '@/contracts/abis/ERC20';
import {
  getNetworkConfig,
  getRouterAddress,
  getWETHAddress,
  isTestnet,
  getUniswapV3RouterAddress,
  getUniswapV3FactoryAddress,
  getUniswapV3QuoterAddress,
  getUniswapV3QuoterV2Address,
  isUniswapV3Supported
} from '@/contracts/addresses';
import { loadingOrchestrator } from './enterprise/loadingOrchestrator';

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amountIn: string;
  amountOutMin: string;
  slippageTolerance: number;
  deadline: number;
  recipient: string;
}

export interface SwapQuote {
  amountOut: string;
  priceImpact: number;
  gasEstimate: string;
  route: string[];
  minimumReceived: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance?: string;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  error?: string;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

// Uniswap V3 specific interfaces
export interface UniswapV3SwapParams {
  tokenIn: string;
  tokenOut: string;
  fee: number; // 500, 3000, 10000
  amountIn: string;
  amountOutMinimum: string;
  recipient: string;
  deadline: number;
  sqrtPriceLimitX96?: string;
}

export interface UniswapV3Quote {
  amountOut: string;
  amountIn?: string;
  sqrtPriceX96After: string;
  initializedTicksCrossed: number;
  gasEstimate: string;
  priceImpact: number;
  route: string[];
}

export interface PoolInfo {
  address: string;
  token0: string;
  token1: string;
  fee: number;
  liquidity: string;
  sqrtPriceX96: string;
  tick: number;
  exists: boolean;
}

class BlockchainService {
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private currentNetwork: string = 'ethereum';
  private routerContract: ethers.Contract | null = null;

  // Uniswap V3 contracts
  private uniswapV3RouterContract: ethers.Contract | null = null;
  private uniswapV3FactoryContract: ethers.Contract | null = null;
  private uniswapV3QuoterContract: ethers.Contract | null = null;

  constructor() {
    this.registerLoadingComponents();
  }

  private registerLoadingComponents(): void {
    loadingOrchestrator.registerComponent({
      componentId: 'blockchain_connection',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 2000,
      dependencies: [],
      priority: 'critical'
    });

    loadingOrchestrator.registerComponent({
      componentId: 'uniswap_v3_quote',
      timeout: 15000,
      maxRetries: 2,
      retryDelay: 1000,
      dependencies: ['blockchain_connection'],
      priority: 'high'
    });

    loadingOrchestrator.registerComponent({
      componentId: 'token_approval',
      timeout: 180000, // 3 minutes
      maxRetries: 1,
      retryDelay: 0,
      dependencies: ['blockchain_connection'],
      priority: 'high'
    });
  }

  /**
   * Initialize blockchain service with provider and network
   */
  async initialize(networkId: string = 'ethereum'): Promise<void> {
    try {
      await loadingOrchestrator.startLoading('blockchain_connection', 'Initializing blockchain connection');

      this.currentNetwork = networkId;
      const networkConfig = getNetworkConfig(networkId);

      if (!networkConfig) {
        throw new Error(`Unsupported network: ${networkId}`);
      }

      await loadingOrchestrator.updateLoading('blockchain_connection', 'Connecting to network provider');

      // Initialize provider
      if (typeof window !== 'undefined' && window.ethereum) {
        // Use MetaMask or injected provider
        this.provider = new ethers.ethers.providers.Web3Provider(window.ethereum);
        this.signer = await this.provider.getSigner();
      } else {
        // Fallback to RPC provider (read-only)
        this.provider = new ethers.ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
      }

      await loadingOrchestrator.updateLoading('blockchain_connection', 'Initializing contract interfaces');

      // Initialize Uniswap V2 router contract
      const routerAddress = getRouterAddress(networkId);
      if (routerAddress && this.provider) {
        this.routerContract = new ethers.Contract(
          routerAddress,
          UNISWAP_V2_ROUTER_ABI,
          this.signer || this.provider
        );
      }

      // Initialize Uniswap V3 contracts if supported
      if (isUniswapV3Supported(networkId)) {
        await this.initializeUniswapV3Contracts(networkId);
      }

      await loadingOrchestrator.completeLoading('blockchain_connection', `Connected to ${networkConfig.name}`);
      console.log(`✅ Blockchain service initialized for ${networkConfig.name}`);
    } catch (error) {
      await loadingOrchestrator.failLoading('blockchain_connection', `Connection failed: ${error}`);
      console.error('❌ Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  /**
   * Initialize Uniswap V3 contracts
   */
  private async initializeUniswapV3Contracts(networkId: string): Promise<void> {
    if (!this.provider) return;

    const signerOrProvider = this.signer || this.provider;

    // Initialize Uniswap V3 Router
    const v3RouterAddress = getUniswapV3RouterAddress(networkId);
    if (v3RouterAddress) {
      this.uniswapV3RouterContract = new ethers.Contract(
        v3RouterAddress,
        UNISWAP_V3_ROUTER_ABI,
        signerOrProvider
      );
    }

    // Initialize Uniswap V3 Factory
    const v3FactoryAddress = getUniswapV3FactoryAddress(networkId);
    if (v3FactoryAddress) {
      this.uniswapV3FactoryContract = new ethers.Contract(
        v3FactoryAddress,
        UNISWAP_V3_FACTORY_ABI,
        signerOrProvider
      );
    }

    // Initialize Uniswap V3 Quoter
    const v3QuoterAddress = getUniswapV3QuoterV2Address(networkId) || getUniswapV3QuoterAddress(networkId);
    if (v3QuoterAddress) {
      this.uniswapV3QuoterContract = new ethers.Contract(
        v3QuoterAddress,
        UNISWAP_V3_QUOTER_ABI,
        signerOrProvider
      );
    }

    console.log('✅ Uniswap V3 contracts initialized');
  }

  /**
   * Connect wallet and request account access
   */
  async connectWallet(): Promise<string> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Reinitialize with signer
      this.provider = new ethers.ethers.providers.Web3Provider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Update router contract with signer
      const routerAddress = getRouterAddress(this.currentNetwork);
      if (routerAddress) {
        this.routerContract = new ethers.Contract(
          routerAddress,
          UNISWAP_V2_ROUTER_ABI,
          this.signer
        );
      }

      console.log('✅ Wallet connected:', accounts[0]);
      return accounts[0];
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Switch to specific network
   */
  async switchNetwork(networkId: string): Promise<void> {
    try {
      const networkConfig = getNetworkConfig(networkId);
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${networkId}`);
      }

      if (!window.ethereum) {
        throw new Error('MetaMask not available');
      }

      // Convert chainId to hex
      const chainIdHex = `0x${networkConfig.chainId.toString(16)}`;

      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }]
        });
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: networkConfig.name,
              nativeCurrency: networkConfig.nativeCurrency,
              rpcUrls: [networkConfig.rpcUrl],
              blockExplorerUrls: [networkConfig.blockExplorer]
            }]
          });
        } else {
          throw switchError;
        }
      }

      // Reinitialize service for new network
      await this.initialize(networkId);
      console.log(`✅ Switched to ${networkConfig.name}`);
    } catch (error) {
      console.error('❌ Failed to switch network:', error);
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals()
      ]);

      return {
        address: tokenAddress,
        symbol,
        name,
        decimals: Number(decimals)
      };
    } catch (error) {
      console.error('❌ Failed to get token info:', error);
      throw error;
    }
  }

  /**
   * Get token balance for address
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      // Handle native token (ETH, BNB, MATIC)
      const wethAddress = getWETHAddress(this.currentNetwork);
      if (tokenAddress.toLowerCase() === wethAddress?.toLowerCase()) {
        const balance = await this.provider.getBalance(walletAddress);
        return ethers.ethers.utils.formatEther(balance);
      }

      // Handle ERC20 tokens
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      const balance = await tokenContract.balanceOf(walletAddress);
      const decimals = await tokenContract.decimals();
      
      return ethers.ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error('❌ Failed to get token balance:', error);
      return '0';
    }
  }

  /**
   * Get swap quote from DEX
   */
  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amountIn: string,
    slippageTolerance: number = 0.5
  ): Promise<SwapQuote> {
    try {
      if (!this.routerContract) {
        throw new Error('Router contract not initialized');
      }

      const wethAddress = getWETHAddress(this.currentNetwork);
      if (!wethAddress) {
        throw new Error('WETH address not found for network');
      }

      // Build swap path
      const path = this.buildSwapPath(fromToken, toToken, wethAddress);
      
      // Parse amount with proper decimals
      const fromTokenInfo = await this.getTokenInfo(fromToken);
      const amountInWei = ethers.ethers.utils.parseUnits(amountIn, fromTokenInfo.decimals);

      // Get amounts out
      const amounts = await this.routerContract.getAmountsOut(amountInWei, path);
      const amountOut = amounts[amounts.length - 1];

      // Get to token info for formatting
      const toTokenInfo = await this.getTokenInfo(toToken);
      const amountOutFormatted = ethers.ethers.utils.formatUnits(amountOut, toTokenInfo.decimals);

      // Calculate minimum received with slippage
      const slippageMultiplier = (100 - slippageTolerance) / 100;
      const minimumReceived = (parseFloat(amountOutFormatted) * slippageMultiplier).toFixed(6);

      // Calculate price impact (simplified)
      const priceImpact = this.calculatePriceImpact(amountIn, amountOutFormatted);

      // Estimate gas
      const gasEstimate = await this.estimateSwapGas(fromToken, toToken, amountInWei.toString(), path);

      return {
        amountOut: amountOutFormatted,
        priceImpact,
        gasEstimate,
        route: path,
        minimumReceived
      };
    } catch (error) {
      console.error('❌ Failed to get swap quote:', error);
      throw error;
    }
  }

  /**
   * Build swap path between tokens
   */
  private buildSwapPath(fromToken: string, toToken: string, wethAddress: string): string[] {
    // Direct pair
    if (fromToken.toLowerCase() === toToken.toLowerCase()) {
      throw new Error('Cannot swap same token');
    }

    // If one token is WETH, direct swap
    if (fromToken.toLowerCase() === wethAddress.toLowerCase() || 
        toToken.toLowerCase() === wethAddress.toLowerCase()) {
      return [fromToken, toToken];
    }

    // Otherwise, route through WETH
    return [fromToken, wethAddress, toToken];
  }

  /**
   * Calculate price impact (simplified)
   */
  private calculatePriceImpact(amountIn: string, amountOut: string): number {
    // This is a simplified calculation
    // In production, you'd want to compare against spot price
    const inputValue = parseFloat(amountIn);
    const outputValue = parseFloat(amountOut);
    
    if (inputValue === 0) return 0;
    
    // Assuming 1:1 ratio for simplification
    const expectedOutput = inputValue;
    const impact = Math.abs((expectedOutput - outputValue) / expectedOutput) * 100;
    
    return Math.min(impact, 100); // Cap at 100%
  }

  /**
   * Estimate gas for swap transaction
   */
  private async estimateSwapGas(
    fromToken: string,
    toToken: string,
    amountIn: string,
    path: string[]
  ): Promise<string> {
    try {
      if (!this.routerContract || !this.signer) {
        return '200000'; // Default estimate
      }

      const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes
      const signerAddress = await this.signer.ethers.utils.getAddress();
      const wethAddress = getWETHAddress(this.currentNetwork);

      let gasEstimate: bigint;

      if (fromToken.toLowerCase() === wethAddress?.toLowerCase()) {
        // ETH to Token
        gasEstimate = await this.routerContract.swapExactETHForTokens.estimateGas(
          0, // amountOutMin (will be calculated properly in actual swap)
          path,
          signerAddress,
          deadline,
          { value: amountIn }
        );
      } else if (toToken.toLowerCase() === wethAddress?.toLowerCase()) {
        // Token to ETH
        gasEstimate = await this.routerContract.swapExactTokensForETH.estimateGas(
          amountIn,
          0, // amountOutMin
          path,
          signerAddress,
          deadline
        );
      } else {
        // Token to Token
        gasEstimate = await this.routerContract.swapExactTokensForTokens.estimateGas(
          amountIn,
          0, // amountOutMin
          path,
          signerAddress,
          deadline
        );
      }

      return gasEstimate.toString();
    } catch (error) {
      console.error('❌ Failed to estimate gas:', error);
      return '250000'; // Conservative estimate
    }
  }

  /**
   * Check if token needs approval
   */
  async checkTokenApproval(tokenAddress: string, spenderAddress: string, amount: string): Promise<boolean> {
    try {
      if (!this.provider || !this.signer) {
        throw new Error('Provider or signer not initialized');
      }

      const signerAddress = await this.signer.ethers.utils.getAddress();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      const allowance = await tokenContract.allowance(signerAddress, spenderAddress);
      const tokenInfo = await this.getTokenInfo(tokenAddress);
      const amountWei = ethers.ethers.utils.parseUnits(amount, tokenInfo.decimals);
      
      return allowance >= amountWei;
    } catch (error) {
      console.error('❌ Failed to check token approval:', error);
      return false;
    }
  }

  /**
   * Approve token spending
   */
  async approveToken(tokenAddress: string, spenderAddress: string, amount: string): Promise<TransactionResult> {
    try {
      if (!this.signer) {
        throw new Error('Signer not initialized');
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.signer);
      const tokenInfo = await this.getTokenInfo(tokenAddress);
      const amountWei = ethers.ethers.utils.parseUnits(amount, tokenInfo.decimals);

      const tx = await tokenContract.approve(spenderAddress, amountWei);
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        success: receipt.status === 1,
        gasUsed: receipt.gasUsed?.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString()
      };
    } catch (error) {
      console.error('❌ Failed to approve token:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current network info
   */
  getCurrentNetwork(): string {
    return this.currentNetwork;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.provider !== null;
  }

  /**
   * Check if wallet is connected
   */
  isWalletConnected(): boolean {
    return this.signer !== null;
  }

  /**
   * Execute swap transaction
   */
  async executeSwap(params: SwapParams): Promise<TransactionResult> {
    try {
      if (!this.routerContract || !this.signer) {
        throw new Error('Router contract or signer not initialized');
      }

      const wethAddress = getWETHAddress(this.currentNetwork);
      if (!wethAddress) {
        throw new Error('WETH address not found');
      }

      // Build path
      const path = this.buildSwapPath(params.fromToken, params.toToken, wethAddress);

      // Parse amounts
      const fromTokenInfo = await this.getTokenInfo(params.fromToken);
      const toTokenInfo = await this.getTokenInfo(params.toToken);

      const amountInWei = ethers.ethers.utils.parseUnits(params.amountIn, fromTokenInfo.decimals);
      const amountOutMinWei = ethers.ethers.utils.parseUnits(params.amountOutMin, toTokenInfo.decimals);

      let tx: any;

      if (params.fromToken.toLowerCase() === wethAddress.toLowerCase()) {
        // ETH to Token swap
        tx = await this.routerContract.swapExactETHForTokens(
          amountOutMinWei,
          path,
          params.recipient,
          params.deadline,
          { value: amountInWei }
        );
      } else if (params.toToken.toLowerCase() === wethAddress.toLowerCase()) {
        // Token to ETH swap
        tx = await this.routerContract.swapExactTokensForETH(
          amountInWei,
          amountOutMinWei,
          path,
          params.recipient,
          params.deadline
        );
      } else {
        // Token to Token swap
        tx = await this.routerContract.swapExactTokensForTokens(
          amountInWei,
          amountOutMinWei,
          path,
          params.recipient,
          params.deadline
        );
      }

      console.log('🔄 Swap transaction submitted:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log('✅ Swap transaction confirmed:', receipt.hash);

      return {
        hash: tx.hash,
        success: receipt.status === 1,
        gasUsed: receipt.gasUsed?.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString()
      };
    } catch (error) {
      console.error('❌ Failed to execute swap:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<any> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      console.error('❌ Failed to get transaction receipt:', error);
      return null;
    }
  }

  /**
   * Get current gas price
   */
  async getCurrentGasPrice(): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const feeData = await this.provider.getFeeData();
      return ethers.ethers.utils.formatUnits(feeData.gasPrice || 0, 'gwei');
    } catch (error) {
      console.error('❌ Failed to get gas price:', error);
      return '20'; // Default 20 gwei
    }
  }

  // ==================== UNISWAP V3 METHODS ====================

  /**
   * Get Uniswap V3 pool information
   */
  async getUniswapV3Pool(tokenA: string, tokenB: string, fee: number): Promise<PoolInfo> {
    try {
      if (!this.uniswapV3FactoryContract) {
        throw new Error('Uniswap V3 Factory contract not initialized');
      }

      // Get pool address
      const poolAddress = await this.uniswapV3FactoryContract.getPool(tokenA, tokenB, fee);

      if (poolAddress === ethers.ethers.constants.AddressZero) {
        return {
          address: ethers.ethers.constants.AddressZero,
          token0: tokenA,
          token1: tokenB,
          fee,
          liquidity: '0',
          sqrtPriceX96: '0',
          tick: 0,
          exists: false
        };
      }

      // Get pool contract
      const poolContract = new ethers.Contract(
        poolAddress,
        UNISWAP_V3_POOL_ABI,
        this.provider!
      );

      // Get pool state
      const [slot0, liquidity, token0, token1] = await Promise.all([
        poolContract.slot0(),
        poolContract.liquidity(),
        poolContract.token0(),
        poolContract.token1()
      ]);

      return {
        address: poolAddress,
        token0,
        token1,
        fee,
        liquidity: liquidity.toString(),
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        tick: Number(slot0.tick),
        exists: true
      };
    } catch (error) {
      console.error('❌ Failed to get Uniswap V3 pool:', error);
      throw error;
    }
  }

  /**
   * Get Uniswap V3 swap quote
   */
  async getUniswapV3Quote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    fee: number = 3000
  ): Promise<UniswapV3Quote> {
    try {
      await loadingOrchestrator.startLoading('uniswap_v3_quote', 'Getting Uniswap V3 quote');

      if (!this.uniswapV3QuoterContract) {
        throw new Error('Uniswap V3 Quoter contract not initialized');
      }

      await loadingOrchestrator.updateLoading('uniswap_v3_quote', 'Calculating optimal route');

      // Get token decimals for proper amount formatting
      const tokenInInfo = await this.getTokenInfo(tokenIn);
      const amountInWei = ethers.ethers.utils.parseUnits(amountIn, tokenInInfo.decimals);

      // Get quote from Quoter V2
      const quoteParams = {
        tokenIn,
        tokenOut,
        amountIn: amountInWei,
        fee,
        sqrtPriceLimitX96: 0
      };

      const quoteResult = await this.uniswapV3QuoterContract.quoteExactInputSingle(quoteParams);

      // Format output amount
      const tokenOutInfo = await this.getTokenInfo(tokenOut);
      const amountOut = ethers.ethers.utils.formatUnits(quoteResult.amountOut, tokenOutInfo.decimals);

      // Calculate price impact (simplified)
      const priceImpact = this.calculateUniswapV3PriceImpact(amountIn, amountOut);

      await loadingOrchestrator.completeLoading('uniswap_v3_quote', 'Quote calculated successfully');

      return {
        amountOut,
        sqrtPriceX96After: quoteResult.sqrtPriceX96After.toString(),
        initializedTicksCrossed: Number(quoteResult.initializedTicksCrossed),
        gasEstimate: quoteResult.gasEstimate.toString(),
        priceImpact,
        route: [tokenIn, tokenOut]
      };
    } catch (error) {
      await loadingOrchestrator.failLoading('uniswap_v3_quote', `Quote failed: ${error}`);
      console.error('❌ Failed to get Uniswap V3 quote:', error);
      throw error;
    }
  }

  /**
   * Execute Uniswap V3 swap
   */
  async executeUniswapV3Swap(params: UniswapV3SwapParams): Promise<TransactionResult> {
    try {
      if (!this.uniswapV3RouterContract || !this.signer) {
        throw new Error('Uniswap V3 Router contract or signer not initialized');
      }

      // Parse amounts with proper decimals
      const tokenInInfo = await this.getTokenInfo(params.tokenIn);
      const tokenOutInfo = await this.getTokenInfo(params.tokenOut);

      const amountInWei = ethers.ethers.utils.parseUnits(params.amountIn, tokenInInfo.decimals);
      const amountOutMinWei = ethers.ethers.utils.parseUnits(params.amountOutMinimum, tokenOutInfo.decimals);

      // Build swap parameters
      const swapParams = {
        tokenIn: params.tokenIn,
        tokenOut: params.tokenOut,
        fee: params.fee,
        recipient: params.recipient,
        deadline: params.deadline,
        amountIn: amountInWei,
        amountOutMinimum: amountOutMinWei,
        sqrtPriceLimitX96: params.sqrtPriceLimitX96 || 0
      };

      // Execute swap
      const tx = await this.uniswapV3RouterContract.exactInputSingle(swapParams, {
        value: params.tokenIn === getWETHAddress(this.currentNetwork) ? amountInWei : 0
      });

      console.log('🔄 Uniswap V3 swap transaction submitted:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();

      console.log('✅ Uniswap V3 swap transaction confirmed:', receipt.hash);

      return {
        hash: tx.hash,
        success: receipt.status === 1,
        gasUsed: receipt.gasUsed?.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice?.toString()
      };
    } catch (error) {
      console.error('❌ Failed to execute Uniswap V3 swap:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check token approval for Uniswap V3 Router
   */
  async checkUniswapV3TokenApproval(tokenAddress: string, amount: string): Promise<boolean> {
    try {
      const v3RouterAddress = getUniswapV3RouterAddress(this.currentNetwork);
      if (!v3RouterAddress) {
        throw new Error('Uniswap V3 Router address not found');
      }

      return await this.checkTokenApproval(tokenAddress, v3RouterAddress, amount);
    } catch (error) {
      console.error('❌ Failed to check Uniswap V3 token approval:', error);
      return false;
    }
  }

  /**
   * Approve token for Uniswap V3 Router
   */
  async approveUniswapV3Token(tokenAddress: string, amount: string): Promise<TransactionResult> {
    try {
      await loadingOrchestrator.startLoading('token_approval', 'Approving token for Uniswap V3');

      const v3RouterAddress = getUniswapV3RouterAddress(this.currentNetwork);
      if (!v3RouterAddress) {
        throw new Error('Uniswap V3 Router address not found');
      }

      const result = await this.approveToken(tokenAddress, v3RouterAddress, amount);

      if (result.success) {
        await loadingOrchestrator.completeLoading('token_approval', 'Token approved successfully');
      } else {
        await loadingOrchestrator.failLoading('token_approval', 'Token approval failed');
      }

      return result;
    } catch (error) {
      await loadingOrchestrator.failLoading('token_approval', `Approval failed: ${error}`);
      throw error;
    }
  }

  /**
   * Calculate price impact for Uniswap V3 (simplified)
   */
  private calculateUniswapV3PriceImpact(amountIn: string, amountOut: string): number {
    try {
      const inputValue = parseFloat(amountIn);
      const outputValue = parseFloat(amountOut);

      if (inputValue === 0) return 0;

      // This is a simplified calculation
      // In production, you'd want to compare against the current pool price
      const expectedOutput = inputValue; // Assuming 1:1 for simplification
      const impact = Math.abs((expectedOutput - outputValue) / expectedOutput) * 100;

      return Math.min(impact, 100); // Cap at 100%
    } catch (error) {
      console.error('Error calculating price impact:', error);
      return 0;
    }
  }

  // ==================== ENHANCED UTILITY METHODS ====================

  /**
   * Estimate gas for any transaction
   */
  async estimateGas(transactionData: any): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const gasEstimate = await this.provider.estimateGas(transactionData);
      return gasEstimate.toString();
    } catch (error) {
      console.error('❌ Failed to estimate gas:', error);
      return '300000'; // Conservative default
    }
  }

  /**
   * Send raw transaction
   */
  async sendTransaction(transactionData: any): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('Signer not initialized');
      }

      const tx = await this.signer.sendTransaction(transactionData);
      return tx.hash;
    } catch (error) {
      console.error('❌ Failed to send transaction:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string): Promise<any> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      return await this.provider.waitForTransaction(txHash);
    } catch (error) {
      console.error('❌ Failed to wait for transaction:', error);
      throw error;
    }
  }

  /**
   * Call contract method (read-only)
   */
  async call(transactionData: any): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      return await this.provider.call(transactionData);
    } catch (error) {
      console.error('❌ Failed to call contract:', error);
      throw error;
    }
  }

  /**
   * Get gas price with different speed options
   */
  async getGasPrice(): Promise<string> {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const feeData = await this.provider.getFeeData();
      return (feeData.gasPrice || BigInt(0)).toString();
    } catch (error) {
      console.error('❌ Failed to get gas price:', error);
      return '20000000000'; // 20 gwei in wei
    }
  }

  // ==================== GETTERS FOR UNISWAP V3 ====================

  /**
   * Check if Uniswap V3 is supported on current network
   */
  isUniswapV3Supported(): boolean {
    return isUniswapV3Supported(this.currentNetwork);
  }

  /**
   * Get Uniswap V3 Router contract
   */
  getUniswapV3RouterContract(): ethers.Contract | null {
    return this.uniswapV3RouterContract;
  }

  /**
   * Get Uniswap V3 Factory contract
   */
  getUniswapV3FactoryContract(): ethers.Contract | null {
    return this.uniswapV3FactoryContract;
  }

  /**
   * Get Uniswap V3 Quoter contract
   */
  getUniswapV3QuoterContract(): ethers.Contract | null {
    return this.uniswapV3QuoterContract;
  }
}

export const blockchainService = new BlockchainService();
