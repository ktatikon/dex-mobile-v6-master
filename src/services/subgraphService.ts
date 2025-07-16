import { GraphQLClient, gql } from 'graphql-request';
import { Token, ChainId } from '@uniswap/sdk-core';
import { FeeAmount } from '@uniswap/v3-sdk';
import { ethers } from 'ethers';
import {
  PoolData,
  PoolQueryParams,
  PoolDataResult,
  PoolSwap,
  PoolPosition,
  BatchPoolRequest,
  PoolDataSourceConfig
} from '@/types/pool';

/**
 * Subgraph endpoints for different networks
 */
const SUBGRAPH_ENDPOINTS: Record<number, string> = {
  [ChainId.MAINNET]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  [ChainId.POLYGON]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-polygon',
  [ChainId.ARBITRUM_ONE]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-arbitrum',
  [ChainId.OPTIMISM]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-optimism',
  [ChainId.BASE]: 'https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest',
  [ChainId.BNB]: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-bsc'
};

/**
 * GraphQL queries for pool data
 */
const POOL_QUERY = gql`
  query GetPool($poolId: String!) {
    pool(id: $poolId) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      feeTier
      sqrtPrice
      liquidity
      tick
      tickSpacing
      createdAtTimestamp
      createdAtBlockNumber
      volumeUSD
      totalValueLockedUSD
      totalValueLockedToken0
      totalValueLockedToken1
      feesUSD
      feeGrowthGlobal0X128
      feeGrowthGlobal1X128
    }
  }
`;

const POOLS_QUERY = gql`
  query GetPools(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: Pool_orderBy = totalValueLockedUSD
    $orderDirection: OrderDirection = desc
    $where: Pool_filter
  ) {
    pools(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      feeTier
      sqrtPrice
      liquidity
      tick
      tickSpacing
      createdAtTimestamp
      createdAtBlockNumber
      volumeUSD
      totalValueLockedUSD
      totalValueLockedToken0
      totalValueLockedToken1
      feesUSD
      feeGrowthGlobal0X128
      feeGrowthGlobal1X128
    }
  }
`;

const POOL_SWAPS_QUERY = gql`
  query GetPoolSwaps(
    $poolId: String!
    $first: Int = 100
    $skip: Int = 0
    $orderBy: Swap_orderBy = timestamp
    $orderDirection: OrderDirection = desc
  ) {
    swaps(
      where: { pool: $poolId }
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      transaction {
        id
        timestamp
        blockNumber
        gasUsed
        gasPrice
      }
      pool {
        id
        token0 {
          id
          symbol
          name
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
        }
        feeTier
      }
      sender
      recipient
      origin
      amount0
      amount1
      amountUSD
      sqrtPriceX96
      tick
      logIndex
    }
  }
`;

const POOL_POSITIONS_QUERY = gql`
  query GetPoolPositions(
    $poolId: String!
    $first: Int = 100
    $skip: Int = 0
  ) {
    positions(
      where: { pool: $poolId }
      first: $first
      skip: $skip
    ) {
      id
      owner
      pool {
        id
      }
      tickLower {
        tickIdx
      }
      tickUpper {
        tickIdx
      }
      liquidity
      depositedToken0
      depositedToken1
      withdrawnToken0
      withdrawnToken1
      collectedFeesToken0
      collectedFeesToken1
      transaction {
        id
        timestamp
        blockNumber
      }
    }
  }
`;

/**
 * Service for fetching pool data from Uniswap V3 subgraph
 */
class SubgraphService {
  private clients: Map<number, GraphQLClient> = new Map();
  private config: PoolDataSourceConfig;

  constructor(config: PoolDataSourceConfig) {
    this.config = config;
    this.initializeClients();
  }

  /**
   * Initialize GraphQL clients for different networks
   */
  private initializeClients(): void {
    Object.entries(SUBGRAPH_ENDPOINTS).forEach(([chainId, endpoint]) => {
      const client = new GraphQLClient(endpoint, {
        timeout: this.config.requestTimeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      this.clients.set(Number(chainId), client);
    });
  }

  /**
   * Get GraphQL client for specific chain
   */
  private getClient(chainId: number): GraphQLClient {
    const client = this.clients.get(chainId);
    if (!client) {
      throw new Error(`No subgraph client available for chain ${chainId}`);
    }
    return client;
  }

  /**
   * Create Token instance from subgraph data
   */
  private createToken(tokenData: unknown, chainId: number): Token {
    return new Token(
      chainId,
      tokenData.id,
      parseInt(tokenData.decimals),
      tokenData.symbol,
      tokenData.name
    );
  }

  /**
   * Transform subgraph pool data to PoolData interface
   */
  private transformPoolData(poolData: unknown, chainId: number): PoolData {
    const token0 = this.createToken(poolData.token0, chainId);
    const token1 = this.createToken(poolData.token1, chainId);

    return {
      address: poolData.id,
      token0,
      token1,
      fee: poolData.feeTier as FeeAmount,
      sqrtPriceX96: poolData.sqrtPrice,
      liquidity: poolData.liquidity,
      tick: parseInt(poolData.tick),
      tickSpacing: parseInt(poolData.tickSpacing),
      chainId,
      createdAtTimestamp: poolData.createdAtTimestamp,
      createdAtBlockNumber: poolData.createdAtBlockNumber,
      volumeUSD: poolData.volumeUSD,
      totalValueLockedUSD: poolData.totalValueLockedUSD,
      totalValueLockedToken0: poolData.totalValueLockedToken0,
      totalValueLockedToken1: poolData.totalValueLockedToken1,
      feesUSD: poolData.feesUSD,
      feeGrowthGlobal0X128: poolData.feeGrowthGlobal0X128,
      feeGrowthGlobal1X128: poolData.feeGrowthGlobal1X128,
    };
  }

  /**
   * Fetch single pool data by address
   */
  async getPool(poolAddress: string, chainId: number): Promise<PoolDataResult<PoolData>> {
    const startTime = Date.now();
    
    try {
      const client = this.getClient(chainId);
      const response = await client.request(POOL_QUERY, {
        poolId: poolAddress.toLowerCase()
      });

      if (!response.pool) {
        return {
          success: false,
          error: `Pool not found: ${poolAddress}`,
          source: 'subgraph',
          timestamp: Date.now(),
          latency: Date.now() - startTime
        };
      }

      const poolData = this.transformPoolData(response.pool, chainId);

      return {
        success: true,
        data: poolData,
        source: 'subgraph',
        timestamp: Date.now(),
        latency: Date.now() - startTime
      };
    } catch (error) {
      console.error('Failed to fetch pool data from subgraph:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'subgraph',
        timestamp: Date.now(),
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Fetch multiple pools with filtering and pagination
   */
  async getPools(
    chainId: number, 
    params: PoolQueryParams = {}
  ): Promise<PoolDataResult<PoolData[]>> {
    const startTime = Date.now();
    
    try {
      const client = this.getClient(chainId);
      
      // Build where clause for filtering
      const where: unknown = {};
      
      if (params.token0) {
        where.token0 = params.token0.toLowerCase();
      }
      
      if (params.token1) {
        where.token1 = params.token1.toLowerCase();
      }
      
      if (params.fee) {
        where.feeTier = params.fee;
      }
      
      if (params.fees && params.fees.length > 0) {
        where.feeTier_in = params.fees;
      }
      
      if (params.minLiquidity) {
        where.totalValueLockedUSD_gte = params.minLiquidity;
      }
      
      if (params.minVolume) {
        where.volumeUSD_gte = params.minVolume;
      }

      const response = await client.request(POOLS_QUERY, {
        first: params.first || 100,
        skip: params.skip || 0,
        orderBy: params.orderBy || 'totalValueLockedUSD',
        orderDirection: params.orderDirection || 'desc',
        where: Object.keys(where).length > 0 ? where : undefined
      });

      const pools = response.pools.map((pool: unknown) => 
        this.transformPoolData(pool, chainId)
      );

      return {
        success: true,
        data: pools,
        source: 'subgraph',
        timestamp: Date.now(),
        latency: Date.now() - startTime
      };
    } catch (error) {
      console.error('Failed to fetch pools from subgraph:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'subgraph',
        timestamp: Date.now(),
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Fetch pool by token pair and fee
   */
  async getPoolByTokens(
    token0: string,
    token1: string,
    fee: FeeAmount,
    chainId: number
  ): Promise<PoolDataResult<PoolData>> {
    // Ensure token addresses are in correct order (token0 < token1)
    const [tokenA, tokenB] = token0.toLowerCase() < token1.toLowerCase() 
      ? [token0.toLowerCase(), token1.toLowerCase()]
      : [token1.toLowerCase(), token0.toLowerCase()];

    return this.getPools(chainId, {
      token0: tokenA,
      token1: tokenB,
      fee,
      first: 1
    }).then(result => {
      if (result.success && result.data && result.data.length > 0) {
        return {
          ...result,
          data: result.data[0]
        };
      }
      return {
        success: false,
        error: `Pool not found for tokens ${tokenA}/${tokenB} with fee ${fee}`,
        source: 'subgraph',
        timestamp: Date.now(),
        latency: result.latency
      };
    });
  }

  /**
   * Fetch recent swaps for a pool
   */
  async getPoolSwaps(
    poolAddress: string,
    chainId: number,
    limit: number = 100
  ): Promise<PoolDataResult<PoolSwap[]>> {
    const startTime = Date.now();
    
    try {
      const client = this.getClient(chainId);
      const response = await client.request(POOL_SWAPS_QUERY, {
        poolId: poolAddress.toLowerCase(),
        first: limit
      });

      const swaps: PoolSwap[] = response.swaps.map((swap: unknown) => ({
        id: swap.id,
        transaction: {
          id: swap.transaction.id,
          timestamp: swap.transaction.timestamp,
          blockNumber: swap.transaction.blockNumber,
          gasUsed: swap.transaction.gasUsed,
          gasPrice: swap.transaction.gasPrice,
        },
        pool: {
          id: swap.pool.id,
          token0: this.createToken(swap.pool.token0, chainId),
          token1: this.createToken(swap.pool.token1, chainId),
          fee: swap.pool.feeTier as FeeAmount,
        },
        sender: swap.sender,
        recipient: swap.recipient,
        origin: swap.origin,
        amount0: swap.amount0,
        amount1: swap.amount1,
        amountUSD: swap.amountUSD,
        sqrtPriceX96: swap.sqrtPriceX96,
        tick: parseInt(swap.tick),
        logIndex: parseInt(swap.logIndex),
      }));

      return {
        success: true,
        data: swaps,
        source: 'subgraph',
        timestamp: Date.now(),
        latency: Date.now() - startTime
      };
    } catch (error) {
      console.error('Failed to fetch pool swaps from subgraph:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'subgraph',
        timestamp: Date.now(),
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Get top pools by TVL
   */
  async getTopPools(chainId: number, limit: number = 50): Promise<PoolDataResult<PoolData[]>> {
    return this.getPools(chainId, {
      first: limit,
      orderBy: 'totalValueLockedUSD',
      orderDirection: 'desc',
      minLiquidity: '1000' // Minimum $1000 TVL
    });
  }

  /**
   * Search pools by token symbols or addresses
   */
  async searchPools(
    query: string,
    chainId: number,
    limit: number = 20
  ): Promise<PoolDataResult<PoolData[]>> {
    const isValidAddress = ethers.utils.ethers.utils.isAddress(query);

    if (isValidAddress) {
      // Search by token address
      const result = await this.getPools(chainId, {
        tokens: [query.toLowerCase()],
        first: limit
      });
      return result;
    } else {
      // For symbol search, we'd need a more complex query
      // For now, return top pools and filter client-side
      const result = await this.getTopPools(chainId, 100);
      
      if (result.success && result.data) {
        const filtered = result.data.filter(pool => 
          pool.token0.symbol?.toLowerCase().includes(query.toLowerCase()) ||
          pool.token1.symbol?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, limit);
        
        return {
          ...result,
          data: filtered
        };
      }
      
      return result;
    }
  }
}

export { SubgraphService, SUBGRAPH_ENDPOINTS };
