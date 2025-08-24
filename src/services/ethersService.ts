import { ethers } from 'ethers';

// Enhanced Network configurations with production-ready endpoints
export const NETWORKS = {
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161', // Public Infura endpoint
    rpcUrlBackup: 'https://eth-sepolia.g.alchemy.com/v2/demo', // Backup endpoint
    blockExplorer: 'https://sepolia.etherscan.io',
    symbol: 'ETH',
    faucetUrl: 'https://sepoliafaucet.com/',
    gasPrice: '20000000000', // 20 gwei
    gasLimit: '21000',
    isTestnet: true,
  },
  ganache: {
    name: 'Ganache (Local)',
    chainId: 1337,
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
    symbol: 'ETH',
    faucetUrl: '',
    gasPrice: '20000000000',
    gasLimit: '21000',
    isTestnet: true,
  },
};

// Create provider for a specific network with fallback support
export const getProvider = (network: 'sepolia' | 'ganache') => {
  const networkConfig = NETWORKS[network];

  // Try primary RPC first, fallback to backup if available
  try {
    return new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
  } catch (error) {
    console.warn(`Primary RPC failed for ${network}, trying backup...`);
    if (networkConfig.rpcUrlBackup) {
      return new ethers.providers.JsonRpcProvider(networkConfig.rpcUrlBackup);
    }
    throw error;
  }
};

// Enhanced provider with retry logic
export const getProviderWithRetry = async (network: 'sepolia' | 'ganache', maxRetries: number = 3) => {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const provider = getProvider(network);
      // Test the connection
      await provider.getBlockNumber();
      return provider;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Provider connection attempt ${i + 1} failed:`, error);

      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  throw new Error(`Failed to connect to ${network} after ${maxRetries} attempts: ${lastError?.message}`);
};

// Create wallet from private key
export const createWalletFromPrivateKey = (privateKey: string, network: 'sepolia' | 'ganache') => {
  const provider = getProvider(network);
  return new ethers.Wallet(privateKey, provider);
};

// Create new random wallet
export const createRandomWallet = (network: 'sepolia' | 'ganache') => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
};

// Enhanced balance fetching with retry logic
export const getBalance = async (address: string, network: 'sepolia' | 'ganache') => {
  try {
    // Validate address format
    if (!ethers.utils.isAddress(address)) {
      throw new Error(`Invalid address format: ${address}`);
    }

    const provider = await getProviderWithRetry(network);
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error(`Error getting balance for ${address} on ${network}:`, error);
    return '0';
  }
};

// Get balance in Wei (for precise calculations)
export const getBalanceWei = async (address: string, network: 'sepolia' | 'ganache') => {
  try {
    if (!ethers.utils.isAddress(address)) {
      throw new Error(`Invalid address format: ${address}`);
    }

    const provider = await getProviderWithRetry(network);
    return await provider.getBalance(address);
  } catch (error) {
    console.error(`Error getting balance in Wei for ${address} on ${network}:`, error);
    return ethers.BigNumber.from(0);
  }
};

// Enhanced transaction sending with gas estimation and validation
export const sendTransaction = async (
  privateKey: string,
  toAddress: string,
  amount: string,
  network: 'sepolia' | 'ganache',
  gasPrice?: string,
  gasLimit?: string
) => {
  try {
    // Validate inputs
    if (!ethers.utils.isAddress(toAddress)) {
      throw new Error(`Invalid recipient address: ${toAddress}`);
    }

    if (!privateKey || privateKey.length !== 66) {
      throw new Error('Invalid private key format');
    }

    const amountWei = ethers.utils.parseEther(amount);
    if (amountWei.lte(0)) {
      throw new Error('Amount must be greater than 0');
    }

    const wallet = createWalletFromPrivateKey(privateKey, network);

    // Check balance before sending
    const balance = await wallet.getBalance();
    const networkConfig = NETWORKS[network];
    const estimatedGasPrice = gasPrice ? ethers.utils.parseUnits(gasPrice, 'gwei') : ethers.utils.parseUnits(networkConfig.gasPrice, 'wei');
    const estimatedGasLimit = gasLimit ? ethers.BigNumber.from(gasLimit) : ethers.BigNumber.from(networkConfig.gasLimit);
    const estimatedFee = estimatedGasPrice.mul(estimatedGasLimit);

    if (balance.lt(amountWei.add(estimatedFee))) {
      throw new Error(`Insufficient balance. Required: ${ethers.utils.formatEther(amountWei.add(estimatedFee))} ETH, Available: ${ethers.utils.formatEther(balance)} ETH`);
    }

    // Estimate gas for the transaction
    const gasEstimate = await wallet.estimateGas({
      to: toAddress,
      value: amountWei,
    });

    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amountWei,
      gasPrice: estimatedGasPrice,
      gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
    });

    console.log(`Transaction sent: ${tx.hash} on ${network}`);
    return tx.hash;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
};

// Enhanced transaction receipt fetching with retry logic
export const getTransactionReceipt = async (txHash: string, network: 'sepolia' | 'ganache', maxRetries: number = 5) => {
  try {
    if (!txHash || txHash.length !== 66) {
      throw new Error(`Invalid transaction hash: ${txHash}`);
    }

    const provider = await getProviderWithRetry(network);

    // Retry logic for pending transactions
    for (let i = 0; i < maxRetries; i++) {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt) {
        return receipt;
      }

      // Wait before retry
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting transaction receipt for ${txHash}:`, error);
    return null;
  }
};

// Enhanced transaction details fetching
export const getTransaction = async (txHash: string, network: 'sepolia' | 'ganache') => {
  try {
    if (!txHash || txHash.length !== 66) {
      throw new Error(`Invalid transaction hash: ${txHash}`);
    }

    const provider = await getProviderWithRetry(network);
    return await provider.getTransaction(txHash);
  } catch (error) {
    console.error(`Error getting transaction details for ${txHash}:`, error);
    return null;
  }
};

// Wait for transaction confirmation
export const waitForTransaction = async (
  txHash: string,
  network: 'sepolia' | 'ganache',
  confirmations: number = 1,
  timeout: number = 300000 // 5 minutes
) => {
  try {
    const provider = await getProviderWithRetry(network);
    return await provider.waitForTransaction(txHash, confirmations, timeout);
  } catch (error) {
    console.error(`Error waiting for transaction ${txHash}:`, error);
    throw error;
  }
};

// Get transaction status
export const getTransactionStatus = async (txHash: string, network: 'sepolia' | 'ganache') => {
  try {
    const receipt = await getTransactionReceipt(txHash, network);

    if (!receipt) {
      return 'pending';
    }

    return receipt.status === 1 ? 'confirmed' : 'failed';
  } catch (error) {
    console.error(`Error getting transaction status for ${txHash}:`, error);
    return 'unknown';
  }
};

// Format address for display
export const formatAddress = (address: string) => {
  if (!address) return '';
  if (!ethers.utils.isAddress(address)) return address;
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Validate Ethereum address
export const isValidAddress = (address: string): boolean => {
  return ethers.utils.isAddress(address);
};

// Validate private key
export const isValidPrivateKey = (privateKey: string): boolean => {
  try {
    if (!privateKey || privateKey.length !== 66) return false;
    new ethers.Wallet(privateKey);
    return true;
  } catch {
    return false;
  }
};

// Get address from private key
export const getAddressFromPrivateKey = (privateKey: string): string => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  } catch (error) {
    throw new Error('Invalid private key');
  }
};

// Check network connectivity
export const checkNetworkConnectivity = async (network: 'sepolia' | 'ganache'): Promise<boolean> => {
  try {
    const provider = await getProviderWithRetry(network, 1);
    await provider.getBlockNumber();
    return true;
  } catch {
    return false;
  }
};

// Get current gas price
export const getCurrentGasPrice = async (network: 'sepolia' | 'ganache'): Promise<string> => {
  try {
    const provider = await getProviderWithRetry(network);
    const gasPrice = await provider.getGasPrice();
    return ethers.utils.formatUnits(gasPrice, 'gwei');
  } catch (error) {
    console.error(`Error getting gas price for ${network}:`, error);
    return NETWORKS[network].gasPrice;
  }
};

// Start Ganache local blockchain
export const startGanache = async () => {
  try {
    // In a real implementation, we would start Ganache programmatically
    // For now, we'll just assume Ganache is running
    return true;
  } catch (error) {
    console.error('Error starting Ganache:', error);
    return false;
  }
};

// Check if Ganache is running
export const isGanacheRunning = async () => {
  try {
    const provider = getProvider('ganache');
    await provider.getBlockNumber();
    return true;
  } catch (error) {
    console.error('Ganache is not running:', error);
    return false;
  }
};
