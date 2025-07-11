/**
 * UNISWAP V3 POOL ABI
 * Essential methods for interacting with Uniswap V3 pool contracts
 * Used for getting pool state, liquidity, and price information
 */

export const UNISWAP_V3_POOL_ABI = [
  // token0 - Get the first token of the pool
  {
    "inputs": [],
    "name": "token0",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // token1 - Get the second token of the pool
  {
    "inputs": [],
    "name": "token1",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // fee - Get the pool's fee tier
  {
    "inputs": [],
    "name": "fee",
    "outputs": [
      { "internalType": "uint24", "name": "", "type": "uint24" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // slot0 - Get the current pool state
  {
    "inputs": [],
    "name": "slot0",
    "outputs": [
      { "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
      { "internalType": "int24", "name": "tick", "type": "int24" },
      { "internalType": "uint16", "name": "observationIndex", "type": "uint16" },
      { "internalType": "uint16", "name": "observationCardinality", "type": "uint16" },
      { "internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16" },
      { "internalType": "uint8", "name": "feeProtocol", "type": "uint8" },
      { "internalType": "bool", "name": "unlocked", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // liquidity - Get current liquidity
  {
    "inputs": [],
    "name": "liquidity",
    "outputs": [
      { "internalType": "uint128", "name": "", "type": "uint128" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // tickSpacing - Get tick spacing for the pool
  {
    "inputs": [],
    "name": "tickSpacing",
    "outputs": [
      { "internalType": "int24", "name": "", "type": "int24" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // ticks - Get tick info
  {
    "inputs": [
      { "internalType": "int24", "name": "tick", "type": "int24" }
    ],
    "name": "ticks",
    "outputs": [
      { "internalType": "uint128", "name": "liquidityGross", "type": "uint128" },
      { "internalType": "int128", "name": "liquidityNet", "type": "int128" },
      { "internalType": "uint256", "name": "feeGrowthOutside0X128", "type": "uint256" },
      { "internalType": "uint256", "name": "feeGrowthOutside1X128", "type": "uint256" },
      { "internalType": "int56", "name": "tickCumulativeOutside", "type": "int56" },
      { "internalType": "uint160", "name": "secondsPerLiquidityOutsideX128", "type": "uint160" },
      { "internalType": "uint32", "name": "secondsOutside", "type": "uint32" },
      { "internalType": "bool", "name": "initialized", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // positions - Get position info
  {
    "inputs": [
      { "internalType": "bytes32", "name": "key", "type": "bytes32" }
    ],
    "name": "positions",
    "outputs": [
      { "internalType": "uint128", "name": "liquidity", "type": "uint128" },
      { "internalType": "uint256", "name": "feeGrowthInside0LastX128", "type": "uint256" },
      { "internalType": "uint256", "name": "feeGrowthInside1LastX128", "type": "uint256" },
      { "internalType": "uint128", "name": "tokensOwed0", "type": "uint128" },
      { "internalType": "uint128", "name": "tokensOwed1", "type": "uint128" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // observations - Get historical observations
  {
    "inputs": [
      { "internalType": "uint256", "name": "index", "type": "uint256" }
    ],
    "name": "observations",
    "outputs": [
      { "internalType": "uint32", "name": "blockTimestamp", "type": "uint32" },
      { "internalType": "int56", "name": "tickCumulative", "type": "int56" },
      { "internalType": "uint160", "name": "secondsPerLiquidityCumulativeX128", "type": "uint160" },
      { "internalType": "bool", "name": "initialized", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // Swap event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "recipient", "type": "address" },
      { "indexed": false, "internalType": "int256", "name": "amount0", "type": "int256" },
      { "indexed": false, "internalType": "int256", "name": "amount1", "type": "int256" },
      { "indexed": false, "internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160" },
      { "indexed": false, "internalType": "uint128", "name": "liquidity", "type": "uint128" },
      { "indexed": false, "internalType": "int24", "name": "tick", "type": "int24" }
    ],
    "name": "Swap",
    "type": "event"
  },

  // Mint event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "int24", "name": "tickLower", "type": "int24" },
      { "indexed": true, "internalType": "int24", "name": "tickUpper", "type": "int24" },
      { "indexed": false, "internalType": "uint128", "name": "amount", "type": "uint128" },
      { "indexed": false, "internalType": "uint256", "name": "amount0", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount1", "type": "uint256" }
    ],
    "name": "Mint",
    "type": "event"
  },

  // Burn event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "int24", "name": "tickLower", "type": "int24" },
      { "indexed": true, "internalType": "int24", "name": "tickUpper", "type": "int24" },
      { "indexed": false, "internalType": "uint128", "name": "amount", "type": "uint128" },
      { "indexed": false, "internalType": "uint256", "name": "amount0", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "amount1", "type": "uint256" }
    ],
    "name": "Burn",
    "type": "event"
  }
] as const;

export default UNISWAP_V3_POOL_ABI;
