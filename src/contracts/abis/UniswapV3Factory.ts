/**
 * UNISWAP V3 FACTORY ABI
 * Contract: UniswapV3Factory (0x1F98431c8aD98523631AE4a59f267346ea31F984)
 * For finding and creating pool addresses
 */

export const UNISWAP_V3_FACTORY_ABI = [
  // getPool - Get pool address for token pair and fee
  {
    "inputs": [
      { "internalType": "address", "name": "tokenA", "type": "address" },
      { "internalType": "address", "name": "tokenB", "type": "address" },
      { "internalType": "uint24", "name": "fee", "type": "uint24" }
    ],
    "name": "getPool",
    "outputs": [
      { "internalType": "address", "name": "pool", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // createPool - Create a new pool
  {
    "inputs": [
      { "internalType": "address", "name": "tokenA", "type": "address" },
      { "internalType": "address", "name": "tokenB", "type": "address" },
      { "internalType": "uint24", "name": "fee", "type": "uint24" }
    ],
    "name": "createPool",
    "outputs": [
      { "internalType": "address", "name": "pool", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // owner - Get factory owner
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // feeAmountTickSpacing - Get tick spacing for fee amount
  {
    "inputs": [
      { "internalType": "uint24", "name": "fee", "type": "uint24" }
    ],
    "name": "feeAmountTickSpacing",
    "outputs": [
      { "internalType": "int24", "name": "", "type": "int24" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // PoolCreated event
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "token0", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "token1", "type": "address" },
      { "indexed": true, "internalType": "uint24", "name": "fee", "type": "uint24" },
      { "indexed": false, "internalType": "int24", "name": "tickSpacing", "type": "int24" },
      { "indexed": false, "internalType": "address", "name": "pool", "type": "address" }
    ],
    "name": "PoolCreated",
    "type": "event"
  }
] as const;

export default UNISWAP_V3_FACTORY_ABI;
