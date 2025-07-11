import { Token, CurrencyAmount, Price, Percent } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';

/**
 * Represents a Uniswap V3 liquidity pool with all necessary data
 */
export interface PoolData {
  // Core pool identifiers
  address: string;
  token0: Token;
  token1: Token;
  fee: FeeAmount;
  
  // Pool state
  sqrtPriceX96: string;
  liquidity: string;
  tick: number;
  tickSpacing: number;
  
  // Additional metadata
  chainId: number;
  createdAtTimestamp: string;
  createdAtBlockNumber: string;
  
  // Volume and TVL data
  volumeUSD: string;
  totalValueLockedUSD: string;
  totalValueLockedToken0: string;
  totalValueLockedToken1: string;
  
  // Fee data
  feesUSD: string;
  feeGrowthGlobal0X128: string;
  feeGrowthGlobal1X128: string;
}

/**
 * Pool query parameters for filtering and pagination
 */
export interface PoolQueryParams {
  // Token filtering
  token0?: string;
  token1?: string;
  tokens?: string[];
  
  // Fee tier filtering
  fee?: FeeAmount;
  fees?: FeeAmount[];
  
  // Sorting and pagination
  orderBy?: 'totalValueLockedUSD' | 'volumeUSD' | 'feesUSD' | 'createdAtTimestamp';
  orderDirection?: 'asc' | 'desc';
  first?: number;
  skip?: number;
  
  // Minimum thresholds
  minLiquidity?: string;
  minVolume?: string;
}

/**
 * Pool statistics for analytics
 */
export interface PoolStats {
  // Price information
  token0Price: Price<Token, Token>;
  token1Price: Price<Token, Token>;
  
  // Volume metrics
  volume24h: CurrencyAmount<Token>;
  volume7d: CurrencyAmount<Token>;
  volumeChange24h: Percent;
  
  // Liquidity metrics
  tvl: CurrencyAmount<Token>;
  tvlChange24h: Percent;
  
  // Fee metrics
  fees24h: CurrencyAmount<Token>;
  feeAPR: Percent;
  
  // Trading metrics
  txCount24h: number;
  priceChange24h: Percent;
}

/**
 * Pool position data for liquidity providers
 */
export interface PoolPosition {
  id: string;
  owner: string;
  pool: PoolData;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  depositedToken0: string;
  depositedToken1: string;
  withdrawnToken0: string;
  withdrawnToken1: string;
  collectedFeesToken0: string;
  collectedFeesToken1: string;
  transaction: {
    id: string;
    timestamp: string;
    blockNumber: string;
  };
}

/**
 * Tick data for concentrated liquidity
 */
export interface TickData {
  tickIdx: number;
  liquidityGross: string;
  liquidityNet: string;
  price0: string;
  price1: string;
  feeGrowthOutside0X128: string;
  feeGrowthOutside1X128: string;
}

/**
 * Pool swap transaction data
 */
export interface PoolSwap {
  id: string;
  transaction: {
    id: string;
    timestamp: string;
    blockNumber: string;
    gasUsed: string;
    gasPrice: string;
  };
  pool: {
    id: string;
    token0: Token;
    token1: Token;
    fee: FeeAmount;
  };
  sender: string;
  recipient: string;
  origin: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  sqrtPriceX96: string;
  tick: number;
  logIndex: number;
}

/**
 * Pool creation event data
 */
export interface PoolCreatedEvent {
  id: string;
  token0: Token;
  token1: Token;
  fee: FeeAmount;
  tickSpacing: number;
  pool: string;
  transaction: {
    id: string;
    timestamp: string;
    blockNumber: string;
  };
}

/**
 * Pool search and filtering options
 */
export interface PoolSearchOptions {
  // Search query
  query?: string;
  
  // Token filters
  includeTokens?: string[];
  excludeTokens?: string[];
  
  // Fee tier filters
  feeTiers?: FeeAmount[];
  
  // Liquidity filters
  minTVL?: number;
  maxTVL?: number;
  
  // Volume filters
  minVolume24h?: number;
  maxVolume24h?: number;
  
  // Chain filter
  chainId?: number;
  
  // Result options
  limit?: number;
  offset?: number;
  sortBy?: 'tvl' | 'volume' | 'fees' | 'created';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pool data cache entry
 */
export interface PoolCacheEntry {
  data: PoolData;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  source: 'subgraph' | 'rpc' | 'cache';
}

/**
 * Pool data source configuration
 */
export interface PoolDataSourceConfig {
  // Subgraph endpoints
  subgraphUrl: string;
  subgraphBackupUrl?: string;
  
  // RPC endpoints
  rpcUrl: string;
  rpcBackupUrl?: string;
  
  // Cache configuration
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
  maxCacheSize: number;
  
  // Request configuration
  requestTimeout: number;
  maxRetries: number;
  retryDelay: number;
  
  // Rate limiting
  rateLimitPerSecond: number;
  burstLimit: number;
}

/**
 * Pool data fetch result
 */
export interface PoolDataResult<T = PoolData> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'subgraph' | 'rpc' | 'cache';
  timestamp: number;
  latency: number; // milliseconds
}

/**
 * Batch pool data request
 */
export interface BatchPoolRequest {
  pools: Array<{
    token0: string;
    token1: string;
    fee: FeeAmount;
  }>;
  includeStats?: boolean;
  includeTicks?: boolean;
  includePositions?: boolean;
}

/**
 * Pool data subscription options
 */
export interface PoolSubscriptionOptions {
  poolAddress: string;
  events: Array<'swap' | 'mint' | 'burn' | 'collect' | 'flash'>;
  callback: (event: PoolSwap | PoolPosition) => void;
  errorCallback?: (error: Error) => void;
}

/**
 * Pool analytics data
 */
export interface PoolAnalytics {
  // Historical data
  hourlyData: Array<{
    timestamp: number;
    volumeUSD: number;
    tvlUSD: number;
    feesUSD: number;
    txCount: number;
  }>;
  
  dailyData: Array<{
    date: string;
    volumeUSD: number;
    tvlUSD: number;
    feesUSD: number;
    txCount: number;
    high: number;
    low: number;
    open: number;
    close: number;
  }>;
  
  // Aggregated metrics
  totalVolume: number;
  totalFees: number;
  totalTransactions: number;
  averageTVL: number;
  
  // Performance metrics
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

/**
 * Pool health metrics
 */
export interface PoolHealthMetrics {
  // Liquidity health
  liquidityUtilization: Percent;
  liquidityConcentration: Percent;
  
  // Trading health
  bidAskSpread: Percent;
  priceImpact1000USD: Percent;
  priceImpact10000USD: Percent;
  
  // Activity health
  dailyActiveUsers: number;
  averageTradeSize: number;
  tradingFrequency: number;
  
  // Risk metrics
  impermanentLossRisk: Percent;
  liquidityRisk: Percent;
  volatilityRisk: Percent;
}

/**
 * Export all types for easy importing
 */
export type {
  PoolData,
  PoolQueryParams,
  PoolStats,
  PoolPosition,
  TickData,
  PoolSwap,
  PoolCreatedEvent,
  PoolSearchOptions,
  PoolCacheEntry,
  PoolDataSourceConfig,
  PoolDataResult,
  BatchPoolRequest,
  PoolSubscriptionOptions,
  PoolAnalytics,
  PoolHealthMetrics
};
