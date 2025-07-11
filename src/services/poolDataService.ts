import { Token, ChainId } from '@uniswap/sdk-core';
import { FeeAmount, Pool } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import {
  PoolData,
  PoolDataResult,
  PoolQueryParams,
  PoolDataSourceConfig,
  PoolSearchOptions,
  BatchPoolRequest
} from '@/types/pool';
import { SubgraphService } from './subgraphService';
import { PoolCacheService } from './poolCacheService';
import { getNetworkConfig } from '@/contracts/addresses';
import { loadingOrchestrator } from '@/services/enterprise/loadingOrchestrator';
import { realTimeDataManager } from '@/services/enterprise/realTimeDataManager';
import { uniswapV3Service } from './uniswapV3Service';

/**
 * Default configuration for pool data service
 */
const DEFAULT_CONFIG: PoolDataSourceConfig = {
  subgraphUrl: '',
  cacheEnabled: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  maxCacheSize: 1000,
  requestTimeout: 10000, // 10 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  rateLimitPerSecond: 10,
  burstLimit: 50
};

/**
 * Rate limiter for API requests
 */
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot();
      }
    }
    
    this.requests.push(now);
  }
}

/**
 * Enhanced Pool Data Service with Uniswap V3 integration and enterprise loading
 */
class PoolDataService {
  private subgraphService: SubgraphService;
  private cacheService: PoolCacheService;
  private config: PoolDataSourceConfig;
  private rateLimiter: RateLimiter;
  private providers: Map<number, ethers.Provider> = new Map();

  // Enterprise loading integration
  private componentId = 'pool_data_service';
  private isInitialized = false;

  constructor(config: Partial<PoolDataSourceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.subgraphService = new SubgraphService(this.config);
    this.cacheService = new PoolCacheService({
      maxSize: this.config.maxCacheSize,
      defaultTTL: this.config.cacheTTL,
      enablePersistence: true
    });

    this.rateLimiter = new RateLimiter(
      this.config.rateLimitPerSecond,
      1000
    );

    this.registerWithLoadingOrchestrator();
    this.initializeProviders();
  }

  /**
   * Register with enterprise loading orchestrator
   */
  private registerWithLoadingOrchestrator(): void {
    loadingOrchestrator.registerComponent({
      componentId: this.componentId,
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      dependencies: ['subgraph_service', 'cache_service'],
      priority: 'high'
    });
  }

  /**
   * Initialize RPC providers for different networks
   */
  private initializeProviders(): void {
    const networks = [
      ChainId.MAINNET,
      ChainId.POLYGON,
      ChainId.ARBITRUM_ONE,
      ChainId.OPTIMISM,
      ChainId.BASE
    ];

    networks.forEach(chainId => {
      const networkConfig = getNetworkConfig(this.getNetworkName(chainId));
      if (networkConfig?.rpcUrl) {
        const provider = new ethers.ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
        this.providers.set(chainId, provider);
      }
    });
  }

  /**
   * Get network name from chain ID
   */
  private getNetworkName(chainId: number): string {
    const networkMap: Record<number, string> = {
      [ChainId.MAINNET]: 'ethereum',
      [ChainId.POLYGON]: 'polygon',
      [ChainId.ARBITRUM_ONE]: 'arbitrum',
      [ChainId.OPTIMISM]: 'optimism',
      [ChainId.BASE]: 'base'
    };
    return networkMap[chainId] || 'ethereum';
  }

  /**
   * Retry wrapper for async operations
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Get pool data by address with caching, fallbacks, and enterprise loading
   */
  async getPool(poolAddress: string, chainId: number): Promise<PoolDataResult<PoolData>> {
    const operationId = `${this.componentId}_get_pool_${poolAddress}`;

    try {
      await loadingOrchestrator.startLoading(operationId, `Fetching pool data for ${poolAddress}`);

      // Check cache first with real-time data manager
      const cacheKey = `pool_${poolAddress}_${chainId}`;
      const cachedResult = await realTimeDataManager.fetchData(
        cacheKey,
        () => this.fetchPoolFromSources(poolAddress, chainId),
        () => this.getMockPoolData(poolAddress, chainId),
        {
          ttl: this.config.cacheTTL,
          refreshInterval: this.config.cacheTTL / 2,
          preloadNext: true,
          compressionEnabled: true
        }
      );

      if (cachedResult) {
        await loadingOrchestrator.completeLoading(operationId, 'Pool data retrieved from cache');
        return {
          success: true,
          data: cachedResult,
          source: 'cache',
          timestamp: Date.now(),
          latency: 0
        };
      }

      // If no cached data, fetch from sources
      const result = await this.fetchPoolFromSources(poolAddress, chainId);

      if (result.success && result.data) {
        await loadingOrchestrator.completeLoading(operationId, 'Pool data fetched successfully');
        return result;
      }

      throw new Error(result.error || 'Failed to fetch pool data');
    } catch (error) {
      await loadingOrchestrator.failLoading(operationId, `Failed to get pool: ${error}`);
      throw error;
    }
  }

  /**
   * Fetch pool data from multiple sources with fallbacks
   */
  private async fetchPoolFromSources(poolAddress: string, chainId: number): Promise<PoolDataResult<PoolData>> {
    // Rate limiting
    await this.rateLimiter.waitForSlot();

    // Try subgraph first
    try {
      const result = await this.withRetry(() =>
        this.subgraphService.getPool(poolAddress, chainId)
      );

      if (result.success && result.data) {
        // Cache successful result
        if (this.config.cacheEnabled) {
          this.cacheService.set(result.data);
        }
        return result;
      }
    } catch (error) {
      console.warn('Subgraph query failed, trying RPC fallback:', error);
    }

    // Try Uniswap V3 service integration
    try {
      if (uniswapV3Service.isServiceInitialized()) {
        const poolInfo = await this.getPoolFromUniswapV3Service(poolAddress, chainId);
        if (poolInfo) {
          return {
            success: true,
            data: poolInfo,
            source: 'rpc',
            timestamp: Date.now(),
            latency: 0
          };
        }
      }
    } catch (error) {
      console.warn('Uniswap V3 service fallback failed:', error);
    }

    // Final fallback - return mock data for development
    return {
      success: false,
      error: 'Pool data not available from any source',
      source: 'rpc',
      timestamp: Date.now(),
      latency: 0
    };
  }

  /**
   * Get pool data from Uniswap V3 service
   */
  private async getPoolFromUniswapV3Service(poolAddress: string, chainId: number): Promise<PoolData | null> {
    try {
      // This would require additional logic to determine tokens and fee from pool address
      // For now, return null to indicate this fallback is not available
      return null;
    } catch (error) {
      console.error('Failed to get pool from Uniswap V3 service:', error);
      return null;
    }
  }

  /**
   * Get mock pool data for development/fallback
   */
  private getMockPoolData(poolAddress: string, chainId: number): PoolData {
    return {
      address: poolAddress,
      token0: new Token(chainId, '0x0000000000000000000000000000000000000001', 18, 'TOKEN0', 'Token 0'),
      token1: new Token(chainId, '0x0000000000000000000000000000000000000002', 18, 'TOKEN1', 'Token 1'),
      fee: FeeAmount.MEDIUM,
      sqrtPriceX96: '79228162514264337593543950336',
      liquidity: '1000000000000000000000',
      tick: 0,
      tickSpacing: 60,
      chainId,
      createdAtTimestamp: '1640995200',
      createdAtBlockNumber: '13916166',
      volumeUSD: '1000000',
      totalValueLockedUSD: '5000000',
      totalValueLockedToken0: '1000',
      totalValueLockedToken1: '1000',
      feesUSD: '10000',
      feeGrowthGlobal0X128: '0',
      feeGrowthGlobal1X128: '0'
    };
  }

  /**
   * Get pool data by token pair and fee with enterprise loading and Uniswap V3 integration
   */
  async getPoolByTokens(
    token0: Token,
    token1: Token,
    fee: FeeAmount,
    chainId: number
  ): Promise<PoolDataResult<PoolData>> {
    const operationId = `${this.componentId}_get_pool_tokens_${token0.symbol}_${token1.symbol}_${fee}`;

    try {
      await loadingOrchestrator.startLoading(operationId, `Fetching pool for ${token0.symbol}/${token1.symbol}`);

      // Use real-time data manager for caching
      const cacheKey = `pool_tokens_${token0.address}_${token1.address}_${fee}_${chainId}`;
      const cachedResult = await realTimeDataManager.fetchData(
        cacheKey,
        () => this.fetchPoolByTokensFromSources(token0, token1, fee, chainId),
        () => this.getMockPoolDataForTokens(token0, token1, fee, chainId),
        {
          ttl: this.config.cacheTTL,
          refreshInterval: this.config.cacheTTL / 2,
          preloadNext: true,
          compressionEnabled: true
        }
      );

      if (cachedResult) {
        await loadingOrchestrator.completeLoading(operationId, 'Pool data retrieved successfully');
        return {
          success: true,
          data: cachedResult,
          source: 'cache',
          timestamp: Date.now(),
          latency: 0
        };
      }

      throw new Error(`Pool not found for ${token0.symbol}/${token1.symbol} with fee ${fee}`);
    } catch (error) {
      await loadingOrchestrator.failLoading(operationId, `Failed to get pool: ${error}`);
      throw error;
    }
  }

  /**
   * Fetch pool data by tokens from multiple sources
   */
  private async fetchPoolByTokensFromSources(
    token0: Token,
    token1: Token,
    fee: FeeAmount,
    chainId: number
  ): Promise<PoolData | null> {
    // Rate limiting
    await this.rateLimiter.waitForSlot();

    // Try subgraph first
    try {
      const result = await this.withRetry(() =>
        this.subgraphService.getPoolByTokens(
          token0.address,
          token1.address,
          fee,
          chainId
        )
      );

      if (result.success && result.data) {
        // Cache successful result
        if (this.config.cacheEnabled) {
          this.cacheService.set(
            result.data,
            undefined,
            undefined,
            token0.address,
            token1.address,
            fee
          );
        }
        return result.data;
      }
    } catch (error) {
      console.warn('Subgraph query failed for token pair:', error);
    }

    // Try Uniswap V3 service integration
    try {
      if (uniswapV3Service.isServiceInitialized()) {
        // Convert to application Token format
        const appToken0 = this.convertToAppToken(token0);
        const appToken1 = this.convertToAppToken(token1);

        const poolInfo = await uniswapV3Service.getPoolInfo(appToken0, appToken1, fee);
        if (poolInfo) {
          return this.convertPoolInfoToPoolData(poolInfo, chainId);
        }
      }
    } catch (error) {
      console.warn('Uniswap V3 service fallback failed:', error);
    }

    return null;
  }

  /**
   * Convert Uniswap SDK Token to application Token format
   */
  private convertToAppToken(uniToken: Token): import('@/types').Token {
    return {
      id: uniToken.address,
      symbol: uniToken.symbol || '',
      name: uniToken.name || '',
      logo: '',
      decimals: uniToken.decimals,
      address: uniToken.address
    };
  }

  /**
   * Convert PoolInfo to PoolData format
   */
  private convertPoolInfoToPoolData(poolInfo: any, chainId: number): PoolData {
    return {
      address: poolInfo.address,
      token0: poolInfo.token0,
      token1: poolInfo.token1,
      fee: poolInfo.fee,
      sqrtPriceX96: poolInfo.sqrtPriceX96,
      liquidity: poolInfo.liquidity,
      tick: poolInfo.tick,
      tickSpacing: 60, // Default for medium fee
      chainId,
      createdAtTimestamp: '1640995200',
      createdAtBlockNumber: '13916166',
      volumeUSD: poolInfo.volumeUSD24h?.toString() || '0',
      totalValueLockedUSD: poolInfo.tvlUSD?.toString() || '0',
      totalValueLockedToken0: '0',
      totalValueLockedToken1: '0',
      feesUSD: '0',
      feeGrowthGlobal0X128: '0',
      feeGrowthGlobal1X128: '0'
    };
  }

  /**
   * Get mock pool data for token pair
   */
  private getMockPoolDataForTokens(token0: Token, token1: Token, fee: FeeAmount, chainId: number): PoolData {
    return {
      address: `0x${token0.address.slice(2, 10)}${token1.address.slice(2, 10)}${fee.toString().padStart(8, '0')}`,
      token0,
      token1,
      fee,
      sqrtPriceX96: '79228162514264337593543950336',
      liquidity: '1000000000000000000000',
      tick: 0,
      tickSpacing: fee === FeeAmount.LOW ? 10 : fee === FeeAmount.MEDIUM ? 60 : 200,
      chainId,
      createdAtTimestamp: '1640995200',
      createdAtBlockNumber: '13916166',
      volumeUSD: '1000000',
      totalValueLockedUSD: '5000000',
      totalValueLockedToken0: '1000',
      totalValueLockedToken1: '1000',
      feesUSD: '10000',
      feeGrowthGlobal0X128: '0',
      feeGrowthGlobal1X128: '0'
    };
  }

  /**
   * Get multiple pools with filtering
   */
  async getPools(
    chainId: number,
    params: PoolQueryParams = {}
  ): Promise<PoolDataResult<PoolData[]>> {
    // Rate limiting
    await this.rateLimiter.waitForSlot();

    try {
      const result = await this.withRetry(() =>
        this.subgraphService.getPools(chainId, params)
      );

      if (result.success && result.data) {
        // Cache individual pools
        if (this.config.cacheEnabled) {
          result.data.forEach(pool => {
            this.cacheService.set(pool);
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to get pools:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'subgraph',
        timestamp: Date.now(),
        latency: 0
      };
    }
  }

  /**
   * Get top pools by TVL
   */
  async getTopPools(
    chainId: number,
    limit: number = 50
  ): Promise<PoolDataResult<PoolData[]>> {
    return this.getPools(chainId, {
      first: limit,
      orderBy: 'totalValueLockedUSD',
      orderDirection: 'desc',
      minLiquidity: '1000'
    });
  }

  /**
   * Search pools by token or address
   */
  async searchPools(
    query: string,
    chainId: number,
    options: PoolSearchOptions = {}
  ): Promise<PoolDataResult<PoolData[]>> {
    const limit = options.limit || 20;
    
    // Rate limiting
    await this.rateLimiter.waitForSlot();

    try {
      const result = await this.withRetry(() =>
        this.subgraphService.searchPools(query, chainId, limit)
      );

      if (result.success && result.data) {
        // Apply additional filters
        let filteredPools = result.data;

        if (options.feeTiers && options.feeTiers.length > 0) {
          filteredPools = filteredPools.filter(pool =>
            options.feeTiers!.includes(pool.fee)
          );
        }

        if (options.minTVL) {
          filteredPools = filteredPools.filter(pool =>
            parseFloat(pool.totalValueLockedUSD) >= options.minTVL!
          );
        }

        if (options.minVolume24h) {
          filteredPools = filteredPools.filter(pool =>
            parseFloat(pool.volumeUSD) >= options.minVolume24h!
          );
        }

        // Cache results
        if (this.config.cacheEnabled) {
          filteredPools.forEach(pool => {
            this.cacheService.set(pool);
          });
        }

        return {
          ...result,
          data: filteredPools.slice(0, limit)
        };
      }

      return result;
    } catch (error) {
      console.error('Failed to search pools:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'subgraph',
        timestamp: Date.now(),
        latency: 0
      };
    }
  }

  /**
   * Batch fetch multiple pools
   */
  async batchGetPools(
    requests: BatchPoolRequest
  ): Promise<PoolDataResult<PoolData[]>> {
    const results: PoolData[] = [];
    const errors: string[] = [];

    for (const poolRequest of requests.pools) {
      try {
        const token0 = new Token(
          1, // Will be updated based on actual chain
          poolRequest.token0,
          18 // Default decimals, will be fetched
        );
        const token1 = new Token(
          1,
          poolRequest.token1,
          18
        );

        const result = await this.getPoolByTokens(
          token0,
          token1,
          poolRequest.fee,
          1 // Default to mainnet
        );

        if (result.success && result.data) {
          results.push(result.data);
        } else {
          errors.push(result.error || 'Unknown error');
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return {
      success: results.length > 0,
      data: results,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      source: 'subgraph',
      timestamp: Date.now(),
      latency: 0
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cacheService.clear();
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<PoolDataSourceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update cache config if needed
    if (newConfig.cacheTTL || newConfig.maxCacheSize) {
      this.cacheService.updateConfig({
        defaultTTL: newConfig.cacheTTL,
        maxSize: newConfig.maxCacheSize
      });
    }
  }

  /**
   * Cleanup and destroy service
   */
  destroy(): void {
    this.cacheService.destroy();
  }
}

export { PoolDataService };

// Export singleton instance
export const poolDataService = new PoolDataService();
