/**
 * UNISWAP V3 SWAP ROUTER ABI
 * Contract: SwapRouter (0xE592427A0AEce92De3Edee1F18E0157C05861564)
 * Essential methods for Uniswap V3 swap operations
 */

export const UNISWAP_V3_ROUTER_ABI = [
  // exactInputSingle - Single-hop exact input swap
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "tokenIn", "type": "address" },
          { "internalType": "address", "name": "tokenOut", "type": "address" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" },
          { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "internalType": "struct ISwapRouter.ExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },

  // exactInput - Multi-hop exact input swap
  {
    "inputs": [
      {
        "components": [
          { "internalType": "bytes", "name": "path", "type": "bytes" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" }
        ],
        "internalType": "struct ISwapRouter.ExactInputParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactInput",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },

  // exactOutputSingle - Single-hop exact output swap
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "tokenIn", "type": "address" },
          { "internalType": "address", "name": "tokenOut", "type": "address" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
          { "internalType": "uint256", "name": "amountInMaximum", "type": "uint256" },
          { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "internalType": "struct ISwapRouter.ExactOutputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactOutputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },

  // exactOutput - Multi-hop exact output swap
  {
    "inputs": [
      {
        "components": [
          { "internalType": "bytes", "name": "path", "type": "bytes" },
          { "internalType": "address", "name": "recipient", "type": "address" },
          { "internalType": "uint256", "name": "deadline", "type": "uint256" },
          { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
          { "internalType": "uint256", "name": "amountInMaximum", "type": "uint256" }
        ],
        "internalType": "struct ISwapRouter.ExactOutputParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "exactOutput",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },

  // multicall - Batch multiple operations
  {
    "inputs": [
      { "internalType": "bytes[]", "name": "data", "type": "bytes[]" }
    ],
    "name": "multicall",
    "outputs": [
      { "internalType": "bytes[]", "name": "results", "type": "bytes[]" }
    ],
    "stateMutability": "payable",
    "type": "function"
  },

  // unwrapWETH9 - Unwrap WETH to ETH
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountMinimum", "type": "uint256" },
      { "internalType": "address", "name": "recipient", "type": "address" }
    ],
    "name": "unwrapWETH9",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },

  // refundETH - Refund excess ETH
  {
    "inputs": [],
    "name": "refundETH",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },

  // sweepToken - Sweep tokens to recipient
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "amountMinimum", "type": "uint256" },
      { "internalType": "address", "name": "recipient", "type": "address" }
    ],
    "name": "sweepToken",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

export default UNISWAP_V3_ROUTER_ABI;
