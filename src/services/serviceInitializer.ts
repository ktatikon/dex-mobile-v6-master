/**
 * SERVICE INITIALIZATION MANAGER - ENTERPRISE IMPLEMENTATION
 * 
 * Centralized service initialization with proper dependency management,
 * error handling, and loading state coordination for all DEX services.
 */

import { ethers } from 'ethers';
import { ChainId } from '@uniswap/sdk-core';
import { uniswapV3Service } from './uniswapV3Service';
import { dexSwapService } from './dexSwapService';
import { walletService } from './walletService';
import { blockchainService } from './blockchainService';
import { loadingOrchestrator } from './enterprise/loadingOrchestrator';

// ==================== TYPES & INTERFACES ====================

export interface ServiceInitializationStatus {
  uniswapV3Service: boolean;
  dexSwapService: boolean;
  walletService: boolean;
  blockchainService: boolean;
  provider: boolean;
}

export interface InitializationResult {
  success: boolean;
  services: ServiceInitializationStatus;
  errors: string[];
  provider?: ethers.Provider;
  signer?: ethers.Signer;
}

// ==================== SERVICE INITIALIZER CLASS ====================

class ServiceInitializer {
  private isInitialized = false;
  private initializationPromise: Promise<InitializationResult> | null = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private componentId = 'service_initializer';

  constructor() {
    this.registerWithLoadingOrchestrator();
  }

  private registerWithLoadingOrchestrator(): void {
    loadingOrchestrator.registerComponent({
      componentId: this.componentId,
      timeout: 60000, // 60 seconds for service initialization
      maxRetries: 3,
      retryDelay: 2000,
      dependencies: [],
      priority: 'critical'
    });
  }

  /**
   * Initialize all DEX services with proper dependency management
   */
  async initialize(forceReinitialize = false): Promise<InitializationResult> {
    // Return existing initialization if already in progress
    if (this.initializationPromise && !forceReinitialize) {
      return this.initializationPromise;
    }

    // Return cached result if already initialized
    if (this.isInitialized && !forceReinitialize) {
      return {
        success: true,
        services: await this.getServiceStatus(),
        errors: [],
        provider: this.provider || undefined,
        signer: this.signer || undefined
      };
    }

    // Start new initialization
    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<InitializationResult> {
    const errors: string[] = [];
    const services: ServiceInitializationStatus = {
      uniswapV3Service: false,
      dexSwapService: false,
      walletService: false,
      blockchainService: false,
      provider: false
    };

    try {
      await loadingOrchestrator.startLoading(this.componentId, 'Initializing DEX services');

      // Step 1: Initialize Provider
      await loadingOrchestrator.updateLoading(this.componentId, 'Setting up blockchain provider');
      try {
        await this.initializeProvider();
        services.provider = true;
      } catch (error) {
        const errorMsg = `Provider initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }

      // Step 2: Initialize Blockchain Service
      await loadingOrchestrator.updateLoading(this.componentId, 'Initializing blockchain service');
      try {
        await blockchainService.initialize();
        services.blockchainService = true;
      } catch (error) {
        const errorMsg = `Blockchain service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }

      // Step 3: Initialize Wallet Service
      await loadingOrchestrator.updateLoading(this.componentId, 'Initializing wallet service');
      try {
        await walletService.initialize(blockchainService);
        services.walletService = true;
      } catch (error) {
        const errorMsg = `Wallet service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }

      // Step 4: Initialize Uniswap V3 Service (CRITICAL)
      await loadingOrchestrator.updateLoading(this.componentId, 'Initializing Uniswap V3 service');
      try {
        if (this.provider) {
          await uniswapV3Service.initialize(this.provider, this.signer || undefined, ChainId.MAINNET);
          services.uniswapV3Service = true;
          console.log('✅ Uniswap V3 Service initialized successfully');
        } else {
          throw new Error('Provider not available for Uniswap V3 service');
        }
      } catch (error) {
        const errorMsg = `Uniswap V3 service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }

      // Step 5: Initialize DEX Swap Service
      await loadingOrchestrator.updateLoading(this.componentId, 'Initializing DEX swap service');
      try {
        await dexSwapService.initialize(walletService, blockchainService);
        services.dexSwapService = true;
      } catch (error) {
        const errorMsg = `DEX swap service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }

      // Determine overall success
      const success = services.uniswapV3Service && services.provider; // Critical services
      this.isInitialized = success;

      if (success) {
        await loadingOrchestrator.completeLoading(this.componentId, 'All critical services initialized successfully');
        console.log('🎉 Service initialization completed successfully');
      } else {
        await loadingOrchestrator.failLoading(this.componentId, `Service initialization failed: ${errors.join(', ')}`);
        console.error('❌ Service initialization failed');
      }

      return {
        success,
        services,
        errors,
        provider: this.provider || undefined,
        signer: this.signer || undefined
      };

    } catch (error) {
      const errorMsg = `Critical initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      
      await loadingOrchestrator.failLoading(this.componentId, errorMsg);
      console.error('❌', errorMsg);

      return {
        success: false,
        services,
        errors,
        provider: this.provider || undefined,
        signer: this.signer || undefined
      };
    }
  }

  private async initializeProvider(): Promise<void> {
    try {
      // Try to get provider from window.ethereum (MetaMask, etc.)
      if (typeof window !== 'undefined' && window.ethereum) {
        this.provider = new ethers.ethers.providers.Web3Provider(window.ethereum);
        
        // Try to get signer if wallet is connected
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            this.signer = await this.provider.getSigner();
            console.log('✅ Wallet signer available');
          }
        } catch (signerError) {
          console.log('ℹ️ Wallet not connected, using read-only provider');
        }
        
        console.log('✅ Browser provider initialized');
        return;
      }

      // Fallback to public RPC provider
      const rpcUrls = [
        'https://eth-mainnet.g.alchemy.com/v2/demo',
        'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        'https://cloudflare-eth.com',
        'https://ethereum.publicnode.com'
      ];

      for (const rpcUrl of rpcUrls) {
        try {
          this.provider = new ethers.ethers.providers.JsonRpcProvider(rpcUrl);
          
          // Test the connection
          await this.provider.getNetwork();
          console.log(`✅ Fallback provider initialized: ${rpcUrl}`);
          return;
        } catch (error) {
          console.warn(`⚠️ Failed to connect to ${rpcUrl}:`, error);
          continue;
        }
      }

      throw new Error('No working provider found');
    } catch (error) {
      console.error('❌ Provider initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get current service initialization status
   */
  async getServiceStatus(): Promise<ServiceInitializationStatus> {
    return {
      uniswapV3Service: uniswapV3Service.isServiceInitialized(),
      dexSwapService: true, // DEX swap service doesn't have a status check method
      walletService: true, // Wallet service doesn't have a status check method
      blockchainService: true, // Blockchain service doesn't have a status check method
      provider: this.provider !== null
    };
  }

  /**
   * Check if critical services are initialized
   */
  isReady(): boolean {
    return this.isInitialized && uniswapV3Service.isServiceInitialized();
  }

  /**
   * Get initialized provider
   */
  getProvider(): ethers.Provider | null {
    return this.provider;
  }

  /**
   * Get initialized signer
   */
  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  /**
   * Reinitialize services (useful for network changes)
   */
  async reinitialize(): Promise<InitializationResult> {
    this.isInitialized = false;
    this.initializationPromise = null;
    return this.initialize(true);
  }

  /**
   * Cleanup services
   */
  cleanup(): void {
    this.isInitialized = false;
    this.initializationPromise = null;
    this.provider = null;
    this.signer = null;
    
    // Cleanup individual services
    uniswapV3Service.cleanup();
  }
}

// Export singleton instance
export const serviceInitializer = new ServiceInitializer();
export default serviceInitializer;
