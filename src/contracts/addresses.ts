export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    uniswapV2Router?: string;
    uniswapV3Router?: string;
    uniswapV3Factory?: string;
    uniswapV3Quoter?: string;
    uniswapV3QuoterV2?: string;
    pancakeSwapRouter?: string;
    weth: string;
    usdt?: string;
    usdc?: string;
    dai?: string;
  };
}

export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  // Ethereum Mainnet
  ethereum: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {
      uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      uniswapV3Quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      uniswapV3QuoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
      weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      usdc: '0xA0b86a33E6417c8f4c8B4B8c4B8c4B8c4B8c4B8c',
      dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    }
  },
  
  // Ethereum Goerli Testnet
  goerli: {
    chainId: 5,
    name: 'Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    blockExplorer: 'https://goerli.etherscan.io',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {
      uniswapV2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      weth: '0xB4FBF271143F4FBf85C4c8c4c4c4c4c4c4c4c4c4',
      usdt: '0x509Ee0d083DdF8AC028f2a56731412edD63223B9',
      usdc: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F'
    }
  },
  
  // Binance Smart Chain
  bsc: {
    chainId: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    contracts: {
      pancakeSwapRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
      usdt: '0x55d398326f99059fF775485246999027B3197955',
      usdc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
    }
  },
  
  // BSC Testnet
  bscTestnet: {
    chainId: 97,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    blockExplorer: 'https://testnet.bscscan.com',
    nativeCurrency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18
    },
    contracts: {
      pancakeSwapRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
      weth: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // WBNB Testnet
      usdt: '0x7ef95a0FEE0Dd31b22626fA2e10Ee6A223F8a684',
      usdc: '0x64544969ed7EBf5f083679233325356EbE738930'
    }
  },
  
  // Polygon
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    contracts: {
      uniswapV2Router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap
      weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
      usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
    }
  },
  
  // Polygon Mumbai Testnet
  mumbai: {
    chainId: 80001,
    name: 'Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    contracts: {
      uniswapV2Router: '0x8954AfA98594b838bda56FE4C12a09D7739D179b',
      weth: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889', // WMATIC Mumbai
      usdt: '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
      usdc: '0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e'
    }
  },
  
  // Arbitrum
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    contracts: {
      uniswapV2Router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // SushiSwap
      uniswapV3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
      uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
      uniswapV3Quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
      uniswapV3QuoterV2: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',
      weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      usdt: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      usdc: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
    }
  }
};

// Helper function to get network config
export const getNetworkConfig = (networkId: string): NetworkConfig | null => {
  return NETWORK_CONFIGS[networkId] || null;
};

// Helper function to get router address for network
export const getRouterAddress = (networkId: string): string | null => {
  const config = getNetworkConfig(networkId);
  if (!config) return null;
  
  return config.contracts.uniswapV2Router || 
         config.contracts.uniswapV3Router || 
         config.contracts.pancakeSwapRouter || 
         null;
};

// Helper function to get WETH address for network
export const getWETHAddress = (networkId: string): string | null => {
  const config = getNetworkConfig(networkId);
  return config?.contracts.weth || null;
};

// Helper function to check if network is testnet
export const isTestnet = (networkId: string): boolean => {
  const testnets = ['goerli', 'bscTestnet', 'mumbai'];
  return testnets.includes(networkId);
};

// Helper function to get Uniswap V3 Router address
export const getUniswapV3RouterAddress = (networkId: string): string | null => {
  const config = getNetworkConfig(networkId);
  return config?.contracts.uniswapV3Router || null;
};

// Helper function to get Uniswap V3 Factory address
export const getUniswapV3FactoryAddress = (networkId: string): string | null => {
  const config = getNetworkConfig(networkId);
  return config?.contracts.uniswapV3Factory || null;
};

// Helper function to get Uniswap V3 Quoter address
export const getUniswapV3QuoterAddress = (networkId: string): string | null => {
  const config = getNetworkConfig(networkId);
  return config?.contracts.uniswapV3Quoter || null;
};

// Helper function to get Uniswap V3 QuoterV2 address
export const getUniswapV3QuoterV2Address = (networkId: string): string | null => {
  const config = getNetworkConfig(networkId);
  return config?.contracts.uniswapV3QuoterV2 || null;
};

// Helper function to check if Uniswap V3 is supported on network
export const isUniswapV3Supported = (networkId: string): boolean => {
  const config = getNetworkConfig(networkId);
  return !!(config?.contracts.uniswapV3Router && config?.contracts.uniswapV3Factory);
};
