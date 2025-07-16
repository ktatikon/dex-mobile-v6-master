/**
 * Mobile Service Adapter
 * Optimizes enterprise services for mobile environments
 * Handles network conditions, battery optimization, and mobile-specific features
 */

import { blockchainService } from '@/services/blockchainService';
import { uniswapV3Service } from '@/services/uniswapV3Service';
import { enterpriseServiceIntegrator } from '@/services/enterpriseServiceIntegrator';
import { loadingOrchestrator } from '@/services/enterprise/loadingOrchestrator';

interface NetworkCondition {
  type: 'wifi' | '4g' | '3g' | '2g' | 'offline';
  speed: 'fast' | 'medium' | 'slow';
  quality: number; // 0-1
}

interface MobileOptimizationConfig {
  enableCaching: boolean;
  batchRequests: boolean;
  reducePolling: boolean;
  compressData: boolean;
  prioritizeEssential: boolean;
}

class MobileServiceAdapter {
  private networkCondition: NetworkCondition = {
    type: 'wifi',
    speed: 'fast',
    quality: 1
  };

  private optimizationConfig: MobileOptimizationConfig = {
    enableCaching: true,
    batchRequests: true,
    reducePolling: true,
    compressData: true,
    prioritizeEssential: true
  };

  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private requestQueue: Array<{ id: string; request: () => Promise<any>; priority: number }> = [];
  private isProcessingQueue = false;

  constructor() {
    this.initializeNetworkMonitoring();
    this.initializeBatteryOptimization();
  }

  /**
   * Initialize network condition monitoring
   */
  private initializeNetworkMonitoring() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkCondition = () => {
        const effectiveType = connection.effectiveType || '4g';
        const downlink = connection.downlink || 10;
        
        this.networkCondition = {
          type: effectiveType as any,
          speed: downlink > 5 ? 'fast' : downlink > 1 ? 'medium' : 'slow',
          quality: Math.min(downlink / 10, 1)
        };

        this.adjustOptimizationConfig();
      };

      connection.addEventListener('change', updateNetworkCondition);
      updateNetworkCondition();
    }

    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('📱 [MobileAdapter] Network back online');
      this.processRequestQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📱 [MobileAdapter] Network offline - enabling offline mode');
      this.networkCondition.type = 'offline';
    });
  }

  /**
   * Initialize battery optimization
   */
  private initializeBatteryOptimization() {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: unknown) => {
        const updateBatteryOptimization = () => {
          const level = battery.level;
          const charging = battery.charging;

          // Adjust optimization based on battery level
          if (level < 0.2 && !charging) {
            this.optimizationConfig = {
              ...this.optimizationConfig,
              reducePolling: true,
              prioritizeEssential: true,
              compressData: true
            };
          } else if (level > 0.8 || charging) {
            this.optimizationConfig = {
              ...this.optimizationConfig,
              reducePolling: false,
              prioritizeEssential: false
            };
          }
        };

        battery.addEventListener('levelchange', updateBatteryOptimization);
        battery.addEventListener('chargingchange', updateBatteryOptimization);
        updateBatteryOptimization();
      });
    }
  }

  /**
   * Adjust optimization configuration based on network conditions
   */
  private adjustOptimizationConfig() {
    if (this.networkCondition.speed === 'slow' || this.networkCondition.quality < 0.5) {
      this.optimizationConfig = {
        ...this.optimizationConfig,
        batchRequests: true,
        compressData: true,
        reducePolling: true
      };
    } else {
      this.optimizationConfig = {
        ...this.optimizationConfig,
        batchRequests: false,
        compressData: false,
        reducePolling: false
      };
    }
  }

  /**
   * Cached request wrapper
   */
  private async cachedRequest<T>(
    key: string,
    request: () => Promise<T>,
    ttl: number = 30000
  ): Promise<T> {
    if (this.optimizationConfig.enableCaching) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    const data = await request();
    
    if (this.optimizationConfig.enableCaching) {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
    }

    return data;
  }

  /**
   * Add request to queue for batch processing
   */
  private queueRequest<T>(
    id: string,
    request: () => Promise<T>,
    priority: number = 1
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        id,
        request: async () => {
          try {
            const result = await request();
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        priority
      });

      if (!this.isProcessingQueue) {
        this.processRequestQueue();
      }
    });
  }

  /**
   * Process request queue with batching and prioritization
   */
  private async processRequestQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;

    // Sort by priority (higher first)
    this.requestQueue.sort((a, b) => b.priority - a.priority);

    const batchSize = this.optimizationConfig.batchRequests ? 3 : 1;
    
    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, batchSize);
      
      try {
        await Promise.all(batch.map(item => item.request()));
      } catch (error) {
        console.error('📱 [MobileAdapter] Batch request failed:', error);
      }

      // Add delay between batches for slow networks
      if (this.networkCondition.speed === 'slow') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Mobile-optimized blockchain service wrapper
   */
  async getSwapQuote(fromToken: unknown, toToken: unknown, amount: string) {
    const cacheKey = `swap_quote_${fromToken.address}_${toToken.address}_${amount}`;
    
    if (this.optimizationConfig.batchRequests) {
      return this.queueRequest(
        cacheKey,
        () => this.cachedRequest(
          cacheKey,
          () => blockchainService.getSwapQuote(fromToken, toToken, amount),
          15000 // 15 second cache for quotes
        ),
        3 // High priority
      );
    }

    return this.cachedRequest(
      cacheKey,
      () => blockchainService.getSwapQuote(fromToken, toToken, amount),
      15000
    );
  }

  /**
   * Mobile-optimized Uniswap V3 service wrapper
   */
  async getUniswapV3Quote(params: unknown) {
    const cacheKey = `uniswap_quote_${params.tokenIn.address}_${params.tokenOut.address}_${params.amountIn}`;
    
    if (this.optimizationConfig.batchRequests) {
      return this.queueRequest(
        cacheKey,
        () => this.cachedRequest(
          cacheKey,
          () => uniswapV3Service.getSwapQuote(params),
          15000
        ),
        3 // High priority
      );
    }

    return this.cachedRequest(
      cacheKey,
      () => uniswapV3Service.getSwapQuote(params),
      15000
    );
  }

  /**
   * Mobile-optimized token balance fetching
   */
  async getTokenBalance(tokenAddress: string, walletAddress: string) {
    const cacheKey = `balance_${tokenAddress}_${walletAddress}`;
    
    return this.cachedRequest(
      cacheKey,
      () => blockchainService.getTokenBalance(tokenAddress, walletAddress),
      30000 // 30 second cache for balances
    );
  }

  /**
   * Preload essential data for offline usage
   */
  async preloadEssentialData() {
    try {
      await loadingOrchestrator.startLoading('mobile_preload', 'Preloading essential data');

      // Preload popular tokens
      const popularTokens = [
        '0xA0b86a33E6441b8e8C7C7b0b8e8C7C7b0b8e8C7C', // ETH
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        '0xA0b86a33E6441b8e8C7C7b0b8e8C7C7b0b8e8C7C'  // USDC
      ];

      // Cache token information
      for (const tokenAddress of popularTokens) {
        try {
          await this.cachedRequest(
            `token_info_${tokenAddress}`,
            () => blockchainService.getTokenInfo(tokenAddress),
            300000 // 5 minute cache
          );
        } catch (error) {
          console.warn(`Failed to preload token ${tokenAddress}:`, error);
        }
      }

      await loadingOrchestrator.completeLoading('mobile_preload', 'Essential data preloaded');
    } catch (error) {
      console.error('Failed to preload essential data:', error);
      await loadingOrchestrator.failLoading('mobile_preload', `Preload failed: ${error}`);
    }
  }

  /**
   * Clear cache to free memory
   */
  clearCache() {
    this.cache.clear();
    console.log('📱 [MobileAdapter] Cache cleared');
  }

  /**
   * Get current network condition
   */
  getNetworkCondition(): NetworkCondition {
    return { ...this.networkCondition };
  }

  /**
   * Get current optimization config
   */
  getOptimizationConfig(): MobileOptimizationConfig {
    return { ...this.optimizationConfig };
  }

  /**
   * Force optimization config update
   */
  updateOptimizationConfig(config: Partial<MobileOptimizationConfig>) {
    this.optimizationConfig = { ...this.optimizationConfig, ...config };
  }
}

export const mobileServiceAdapter = new MobileServiceAdapter();
