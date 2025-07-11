/**
 * UNISWAP V3 QUOTER ABI
 * Contract: QuoterV2 (0x61fFE014bA17989E743c5F6cB21bF9697530B21e)
 * For getting swap quotes without executing transactions
 */

export const UNISWAP_V3_QUOTER_ABI = [
  // quoteExactInputSingle - Quote for single-hop exact input
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "tokenIn", "type": "address" },
          { "internalType": "address", "name": "tokenOut", "type": "address" },
          { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "internalType": "struct IQuoterV2.QuoteExactInputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "quoteExactInputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
      { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" },
      { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" },
      { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // quoteExactInput - Quote for multi-hop exact input
  {
    "inputs": [
      { "internalType": "bytes", "name": "path", "type": "bytes" },
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" }
    ],
    "name": "quoteExactInput",
    "outputs": [
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
      { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" },
      { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" },
      { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // quoteExactOutputSingle - Quote for single-hop exact output
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "tokenIn", "type": "address" },
          { "internalType": "address", "name": "tokenOut", "type": "address" },
          { "internalType": "uint256", "name": "amountOut", "type": "uint256" },
          { "internalType": "uint24", "name": "fee", "type": "uint24" },
          { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
        ],
        "internalType": "struct IQuoterV2.QuoteExactOutputSingleParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "quoteExactOutputSingle",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint160", "name": "sqrtPriceX96After", "type": "uint160" },
      { "internalType": "uint32", "name": "initializedTicksCrossed", "type": "uint32" },
      { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // quoteExactOutput - Quote for multi-hop exact output
  {
    "inputs": [
      { "internalType": "bytes", "name": "path", "type": "bytes" },
      { "internalType": "uint256", "name": "amountOut", "type": "uint256" }
    ],
    "name": "quoteExactOutput",
    "outputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "uint160[]", "name": "sqrtPriceX96AfterList", "type": "uint160[]" },
      { "internalType": "uint32[]", "name": "initializedTicksCrossedList", "type": "uint32[]" },
      { "internalType": "uint256", "name": "gasEstimate", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export default UNISWAP_V3_QUOTER_ABI;
