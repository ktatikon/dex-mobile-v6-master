import { PoolData, PoolCacheEntry, PoolDataResult } from '@/types/pool';

/**
 * Cache configuration options
 */
interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // milliseconds
  cleanupInterval: number; // milliseconds
  enablePersistence: boolean;
  storageKey: string;
}

/**
 * Cache statistics for monitoring
 */
interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
  memoryUsage: number; // approximate bytes
}

/**
 * LRU Cache implementation for pool data
 */
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }

  values(): IterableIterator<V> {
    return this.cache.values();
  }
}

/**
 * Pool data cache service with LRU eviction and TTL support
 */
class PoolCacheService {
  private cache: LRUCache<string, PoolCacheEntry>;
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      enablePersistence: false,
      storageKey: 'uniswap_pool_cache',
      ...config
    };

    this.cache = new LRUCache(this.config.maxSize);
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };

    this.startCleanupTimer();
    this.loadFromStorage();
  }

  /**
   * Generate cache key for pool data
   */
  private generateKey(
    poolAddress?: string,
    token0?: string,
    token1?: string,
    fee?: number,
    chainId?: number
  ): string {
    if (poolAddress) {
      return `pool:${chainId}:${poolAddress.toLowerCase()}`;
    }
    if (token0 && token1 && fee !== undefined && chainId) {
      const [tokenA, tokenB] = token0.toLowerCase() < token1.toLowerCase() 
        ? [token0.toLowerCase(), token1.toLowerCase()]
        : [token1.toLowerCase(), token0.toLowerCase()];
      return `pair:${chainId}:${tokenA}:${tokenB}:${fee}`;
    }
    throw new Error('Invalid cache key parameters');
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: PoolCacheEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl);
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      // Rough estimation: JSON string length * 2 (for UTF-16)
      totalSize += JSON.stringify(entry).length * 2;
    }
    return totalSize;
  }

  /**
   * Start cleanup timer for expired entries
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpired(): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });

    this.updateStats();
    this.saveToStorage();
  }

  /**
   * Load cache from localStorage (if enabled)
   */
  private loadFromStorage(): void {
    if (!this.config.enablePersistence || typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data.cache || {}).forEach(([key, entry]) => {
          const cacheEntry = entry as PoolCacheEntry;
          if (!this.isExpired(cacheEntry)) {
            this.cache.set(key, cacheEntry);
          }
        });
        
        if (data.stats) {
          this.stats = { ...this.stats, ...data.stats };
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * Save cache to localStorage (if enabled)
   */
  private saveToStorage(): void {
    if (!this.config.enablePersistence || typeof window === 'undefined') {
      return;
    }

    try {
      const cacheData: Record<string, PoolCacheEntry> = {};
      for (const [key, entry] of this.cache.entries()) {
        if (!this.isExpired(entry)) {
          cacheData[key] = entry;
        }
      }

      const data = {
        cache: cacheData,
        stats: this.stats,
        timestamp: Date.now()
      };

      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * Get pool data from cache
   */
  get(
    poolAddress?: string,
    token0?: string,
    token1?: string,
    fee?: number,
    chainId?: number
  ): PoolDataResult<PoolData> | null {
    try {
      const key = this.generateKey(poolAddress, token0, token1, fee, chainId);
      const entry = this.cache.get(key);

      if (!entry) {
        this.stats.misses++;
        this.updateStats();
        return null;
      }

      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.stats.misses++;
        this.stats.evictions++;
        this.updateStats();
        return null;
      }

      this.stats.hits++;
      this.updateStats();

      return {
        success: true,
        data: entry.data,
        source: 'cache',
        timestamp: entry.timestamp,
        latency: 0
      };
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set pool data in cache
   */
  set(
    poolData: PoolData,
    ttl?: number,
    poolAddress?: string,
    token0?: string,
    token1?: string,
    fee?: number
  ): void {
    try {
      const key = this.generateKey(
        poolAddress || poolData.address,
        token0 || poolData.token0.address,
        token1 || poolData.token1.address,
        fee || poolData.fee,
        poolData.chainId
      );

      const entry: PoolCacheEntry = {
        data: poolData,
        timestamp: Date.now(),
        ttl: ttl || this.config.defaultTTL,
        source: 'cache'
      };

      this.cache.set(key, entry);
      this.updateStats();
      this.saveToStorage();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Check if pool data exists in cache and is not expired
   */
  has(
    poolAddress?: string,
    token0?: string,
    token1?: string,
    fee?: number,
    chainId?: number
  ): boolean {
    try {
      const key = this.generateKey(poolAddress, token0, token1, fee, chainId);
      const entry = this.cache.get(key);
      return entry !== undefined && !this.isExpired(entry);
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove pool data from cache
   */
  delete(
    poolAddress?: string,
    token0?: string,
    token1?: string,
    fee?: number,
    chainId?: number
  ): boolean {
    try {
      const key = this.generateKey(poolAddress, token0, token1, fee, chainId);
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.updateStats();
        this.saveToStorage();
      }
      return deleted;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0
    };
    this.updateStats();
    this.saveToStorage();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupInterval && this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.startCleanupTimer();
    }
  }

  /**
   * Warm up cache with frequently used pools
   */
  async warmUp(pools: PoolData[]): Promise<void> {
    pools.forEach(pool => {
      this.set(pool);
    });
  }

  /**
   * Cleanup and destroy cache service
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.saveToStorage();
    this.cache.clear();
  }
}

export { PoolCacheService, type CacheConfig, type CacheStats };
