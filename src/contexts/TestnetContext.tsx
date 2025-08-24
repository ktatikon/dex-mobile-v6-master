import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  getProviderWithRetry,
  getBalance,
  isValidAddress
} from '@/services/ethersService';
import { TestnetErrorHandler } from '@/services/testnetErrorHandler';
import { testnetWalletManager } from '@/services/testnetWalletManager';

// Define types
export type TestnetNetwork = 'sepolia' | 'ganache' | 'solana-devnet';

export interface TestnetWallet {
  id: string;
  name: string;
  network: TestnetNetwork;
  address: string;
  balance: string;
}

export interface TestnetTransaction {
  id: string;
  type: 'send' | 'receive';
  amount: string;
  tokenSymbol: string;
  timestamp: Date;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  fromAddress?: string;
  toAddress?: string;
  network: TestnetNetwork;
}

// Enhanced interface with all services
interface TestnetContextType {
  // Core properties
  activeNetwork: TestnetNetwork;
  setActiveNetwork: (network: TestnetNetwork) => void;
  wallets: TestnetWallet[];
  transactions: TestnetTransaction[];
  loading: boolean;
  error: Error | null;
  hasTestnetAccess: boolean;
  isAdminLoading: boolean;
  myWallet: TestnetWallet | null;

  // Enhanced wallet management
  createWallet: (name: string, network: TestnetNetwork) => Promise<TestnetWallet | null>;
  createMyWallet: (network: TestnetNetwork) => Promise<TestnetWallet | null>;
  importWallet: (privateKey: string, name: string, network: TestnetNetwork) => Promise<TestnetWallet | null>;
  exportWallet: (walletId: string) => Promise<any>;
  setPrimaryWallet: (walletId: string) => Promise<boolean>;
  archiveWallet: (walletId: string, archive?: boolean) => Promise<boolean>;

  // Enhanced transaction management
  sendTransaction: (to: string, amount: string, walletId: string) => Promise<string | null>;
  requestTestTokens: (walletId: string) => Promise<boolean>;
  estimateTransactionFee: (fromAddress: string, toAddress: string, amount: string) => Promise<string>;

  // Enhanced services
  refreshWalletData: () => Promise<void>;

  // Network management
  availableNetworks: any[];
  networkHealth: Record<string, string>;
  switchNetwork: (network: string) => Promise<boolean>;

  // Gas management
  currentGasPrices: any;
  getGasOptimization: (currentGasPrice: string, gasLimit: string) => Promise<any>;

  // Contract management
  userContracts: any[];
  deployERC20Token: (walletId: string, name: string, symbol: string, supply: string) => Promise<any>;
  addContract: (address: string, name: string, abi?: any[]) => Promise<any>;
  getERC20TokenInfo: (tokenAddress: string) => Promise<any>;

  // Address book
  addressBook: any[];
  addAddress: (address: string, label: string, notes?: string) => Promise<any>;
  searchAddresses: (query: string) => Promise<any[]>;

  // Real-time monitoring
  startRealTimeMonitoring: () => void;
  stopRealTimeMonitoring: () => void;
  isMonitoringActive: boolean;
}

const TestnetContext = createContext<TestnetContextType>({} as TestnetContextType);

export const useTestnet = () => useContext(TestnetContext);

export const TestnetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { isAdmin, isLoading: isAdminLoading, hasPermission } = useAdmin();
  const { toast } = useToast();
  // Core state
  const [activeNetwork, setActiveNetwork] = useState<TestnetNetwork>('sepolia');
  const [wallets, setWallets] = useState<TestnetWallet[]>([]);
  const [transactions, setTransactions] = useState<TestnetTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [myWallet, setMyWallet] = useState<TestnetWallet | null>(null);

  // Enhanced state
  const [availableNetworks, setAvailableNetworks] = useState<any[]>([]);
  const [networkHealth, setNetworkHealth] = useState<Record<string, string>>({});
  const [currentGasPrices, setCurrentGasPrices] = useState<any>(null);
  const [userContracts, setUserContracts] = useState<any[]>([]);
  const [addressBook, setAddressBook] = useState<any[]>([]);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  // Check if user has testnet access
  const hasTestnetAccess = isAdmin && hasPermission('report_viewer');

  // Refresh wallet data
  const refreshWalletData = useCallback(async () => {
    if (!user || !hasTestnetAccess) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch wallets from Supabase
      const { data: walletsData, error: walletsError } = await supabase
        .from('testnet_wallets')
        .select('*')
        .eq('user_id', user.id)
        .eq('network', activeNetwork);

      if (walletsError) {
        throw new Error(`Error fetching wallets: ${walletsError.message}`);
      }

      // Fetch transactions from Supabase
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('testnet_transactions')
        .select(`
          id,
          transaction_type,
          from_address,
          to_address,
          amount,
          token_symbol,
          hash,
          network,
          status,
          timestamp
        `)
        .eq('user_id', user.id)
        .eq('network', activeNetwork)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (transactionsError) {
        throw new Error(`Error fetching transactions: ${transactionsError.message}`);
      }

      // Update wallet balances from blockchain using enhanced service
      const updatedWallets = await Promise.all(
        walletsData.map(async (wallet) => {
          let balance = '0';
          try {
            if (wallet.network === 'sepolia' || wallet.network === 'ganache') {
              balance = await getBalance(wallet.address, wallet.network as 'sepolia' | 'ganache');

              // Update balance in database
              await supabase
                .from('testnet_wallets')
                .update({ balance, updated_at: new Date().toISOString() })
                .eq('id', wallet.id);
            } else if (wallet.network === 'solana-devnet') {
              // For Solana, we'll just use the stored balance for now
              balance = wallet.balance || '0';
            }
          } catch (err) {
            TestnetErrorHandler.logError(err, `fetchBalance-${wallet.id}`);
            // Use stored balance as fallback
            balance = wallet.balance || '0';
          }

          const walletData = {
            id: wallet.id,
            name: wallet.name,
            network: wallet.network as TestnetNetwork,
            address: wallet.address,
            balance
          };

          // Set myWallet if this is "My Wallet"
          if (wallet.name === 'My Wallet') {
            setMyWallet(walletData);
          }

          return walletData;
        })
      );

      // Format transactions
      const formattedTransactions = transactionsData.map(tx => ({
        id: tx.id,
        type: tx.transaction_type as 'send' | 'receive',
        amount: tx.amount,
        tokenSymbol: tx.token_symbol || 'ETH',
        timestamp: new Date(tx.timestamp),
        hash: tx.hash || '',
        status: tx.status as 'pending' | 'confirmed' | 'failed',
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        network: tx.network as TestnetNetwork
      }));

      setWallets(updatedWallets);
      setTransactions(formattedTransactions);
    } catch (err) {
      console.error('Error refreshing wallet data:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh wallet data'));
    } finally {
      setLoading(false);
    }
  }, [user, activeNetwork, hasTestnetAccess]);

  // Fetch wallet data when user, network, or admin status changes
  useEffect(() => {
    if (user && hasTestnetAccess) {
      refreshWalletData();
    } else {
      setWallets([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [user, activeNetwork, hasTestnetAccess, refreshWalletData]);

  // Enhanced service methods
  const loadEnhancedData = useCallback(async () => {
    if (!user || !hasTestnetAccess) return;

    try {
      // Load available networks
      const networks = await testnetNetworkManager.getNetworks(true);
      setAvailableNetworks(networks);

      // Load network health
      const healthStatus: Record<string, string> = {};
      for (const network of networks) {
        try {
          const health = await testnetNetworkManager.checkNetworkHealth(network.id);
          healthStatus[network.name] = health.isConnected ? 'healthy' : 'down';
        } catch {
          healthStatus[network.name] = 'unknown';
        }
      }
      setNetworkHealth(healthStatus);

      // Load gas data
      try {
        const gasData = await testnetGasManager.getCurrentGasPrices(activeNetwork);
        setCurrentGasPrices(gasData);
      } catch (error) {
        console.error('Failed to load gas data:', error);
      }

      // Load user contracts if wallet exists
      if (myWallet) {
        try {
          const contracts = await testnetContractManager.getUserContracts(user.id);
          setUserContracts(contracts);
        } catch (error) {
          console.error('Failed to load contracts:', error);
        }

        // Load address book
        try {
          const addresses = await testnetAddressManager.getAddressBook(user.id, activeNetwork);
          setAddressBook(addresses);
        } catch (error) {
          console.error('Failed to load address book:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load enhanced data:', error);
    }
  }, [user, hasTestnetAccess, activeNetwork, myWallet]);

  // Start real-time monitoring
  const startRealTimeMonitoring = useCallback(() => {
    if (isMonitoringActive) return;

    try {
      // Start network health monitoring
      testnetNetworkManager.startHealthMonitoring();

      // Start gas price tracking
      testnetGasManager.startGasTracking(['Sepolia']);

      setIsMonitoringActive(true);

      toast({
        title: "Real-time Monitoring Started",
        description: "Network health and gas price monitoring are now active",
      });
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to start real-time monitoring",
        variant: "destructive",
      });
    }
  }, [isMonitoringActive, toast]);

  // Stop real-time monitoring
  const stopRealTimeMonitoring = useCallback(() => {
    if (!isMonitoringActive) return;

    try {
      testnetNetworkManager.stopHealthMonitoring();
      testnetGasManager.stopGasTracking();
      setIsMonitoringActive(false);

      toast({
        title: "Monitoring Stopped",
        description: "Real-time monitoring has been disabled",
      });
    } catch (error) {
      console.error('Failed to stop monitoring:', error);
    }
  }, [isMonitoringActive, toast]);

  // Load enhanced data when dependencies change
  useEffect(() => {
    if (user && hasTestnetAccess) {
      loadEnhancedData();
    }
  }, [user, hasTestnetAccess, activeNetwork, myWallet, loadEnhancedData]);

  // Auto-refresh enhanced data
  useEffect(() => {
    if (isMonitoringActive) {
      const interval = setInterval(loadEnhancedData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [isMonitoringActive, loadEnhancedData]);

  // Create a new wallet
  const createWallet = async (name: string, network: TestnetNetwork): Promise<TestnetWallet | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a wallet",
        variant: "destructive",
      });
      return null;
    }

    if (!hasTestnetAccess) {
      toast({
        title: "Access Denied",
        description: "Testnet functionality is restricted to administrators only",
        variant: "destructive",
      });
      return null;
    }

    try {
      let address = '';let privateKey = '';// Generate wallet based on network
      if (network === 'sepolia' || network === 'ganache') {
        const wallet = ethers.Wallet.createRandom();
        address = wallet.address;
        privateKey = wallet.privateKey;
      } else if (network === 'solana-devnet') {
        // For Solana, we would generate a keypair
        // For now, we'll just create a mock address
        address = `solana${Math.random().toString(16).substring(2, 14)}`;
        privateKey = `solana_private_key_${Math.random().toString(16).substring(2, 14)}`;
      }

      // Save to Supabase
      const walletId = uuidv4();
      const { error: insertError } = await supabase
        .from('testnet_wallets')
        .insert({
          id: walletId,
          user_id: user.id,
          name,
          network,
          address,
          private_key: privateKey,
          balance: '0'
        });

      if (insertError) {
        throw new Error(`Error creating wallet: ${insertError.message}`);
      }

      // Create initial balance record
      await supabase
        .from('testnet_balances')
        .insert({
          user_id: user.id,
          wallet_id: walletId,
          token_symbol: network === 'solana-devnet' ? 'SOL' : 'ETH',
          token_name: network === 'solana-devnet' ? 'Solana' : 'Ethereum',
          balance: '0',
          network
        });

      toast({
        title: "Wallet Created",
        description: `Your ${network} testnet wallet has been created successfully`,
      });

      // Refresh wallet data
      await refreshWalletData();

      return {
        id: walletId,
        name,
        network,
        address,
        balance: '0'
      };
    } catch (err) {
      console.error('Error creating wallet:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create wallet",
        variant: "destructive",
      });
      return null;
    }
  };

  // Import an existing wallet
  const importWallet = async (privateKey: string, name: string, network: TestnetNetwork): Promise<TestnetWallet | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to import a wallet",
        variant: "destructive",
      });
      return null;
    }

    if (!hasTestnetAccess) {
      toast({
        title: "Access Denied",
        description: "Testnet functionality is restricted to administrators only",
        variant: "destructive",
      });
      return null;
    }

    try {
      let address = '';// Validate and import wallet based on network
      if (network === 'sepolia' || network === 'ganache') {
        try {
          const wallet = new ethers.Wallet(privateKey);
          address = wallet.address;
        } catch (err) {
          throw new Error('Invalid Ethereum private key');
        }
      } else if (network === 'solana-devnet') {
        // For Solana, we would validate and import the keypair
        // For now, we'll just create a mock address
        if (!privateKey.startsWith('solana_')) {
          throw new Error('Invalid Solana private key');
        }
        address = `solana${Math.random().toString(16).substring(2, 14)}`;
      }

      // Save to Supabase
      const walletId = uuidv4();
      const { error: insertError } = await supabase
        .from('testnet_wallets')
        .insert({
          id: walletId,
          user_id: user.id,
          name,
          network,
          address,
          private_key: privateKey,
          balance: '0'
        });

      if (insertError) {
        throw new Error(`Error importing wallet: ${insertError.message}`);
      }

      // Create initial balance record
      await supabase
        .from('testnet_balances')
        .insert({
          user_id: user.id,
          wallet_id: walletId,
          token_symbol: network === 'solana-devnet' ? 'SOL' : 'ETH',
          token_name: network === 'solana-devnet' ? 'Solana' : 'Ethereum',
          balance: '0',
          network
        });

      toast({
        title: "Wallet Imported",
        description: `Your ${network} testnet wallet has been imported successfully`,
      });

      // Refresh wallet data
      await refreshWalletData();

      return {
        id: walletId,
        name,
        network,
        address,
        balance: '0'
      };
    } catch (err) {
      console.error('Error importing wallet:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to import wallet",
        variant: "destructive",
      });
      return null;
    }
  };

  // Send a transaction
  const sendTransaction = async (to: string, amount: string, walletId: string): Promise<string | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send a transaction",
        variant: "destructive",
      });
      return null;
    }

    if (!hasTestnetAccess || !hasPermission('transaction_manager')) {
      toast({
        title: "Access Denied",
        description: "Testnet transaction functionality requires transaction manager permissions",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Get wallet from Supabase
      const { data: walletData, error: walletError } = await supabase
        .from('testnet_wallets')
        .select('*')
        .eq('id', walletId)
        .eq('user_id', user.id)
        .single();

      if (walletError || !walletData) {
        throw new Error('Wallet not found');
      }

      let txHash = '';// Send transaction based on network
      if (walletData.network === 'sepolia' || walletData.network === 'ganache') {
        const provider = new ethers.providers.JsonRpcProvider(
          walletData.network === 'sepolia'
            ? 'https://eth-sepolia.g.alchemy.com/v2/demo'
            : 'http://127.0.0.1:8545'
        );

        const wallet = new ethers.Wallet(walletData.private_key, provider);

        const tx = await wallet.sendTransaction({
          to,
          value: ethers.utils.parseEther(amount)
        });

        txHash = tx.hash;
      } else if (walletData.network === 'solana-devnet') {
        // For Solana, we would send a transaction using the Solana web3.js library
        // For now, we'll just create a mock transaction hash
        txHash = `solana_tx_${Math.random().toString(16).substring(2, 30)}`;
      }

      // Save transaction to Supabase
      const txId = uuidv4();
      await supabase
        .from('testnet_transactions')
        .insert({
          id: txId,
          user_id: user.id,
          wallet_id: walletId,
          transaction_type: 'send',
          from_address: walletData.address,
          to_address: to,
          amount,
          token_symbol: walletData.network === 'solana-devnet' ? 'SOL' : 'ETH',
          hash: txHash,
          network: walletData.network,
          status: 'pending',
          timestamp: new Date().toISOString()
        });

      toast({
        title: "Transaction Sent",
        description: `Your transaction has been sent successfully`,
      });

      // Refresh wallet data
      await refreshWalletData();

      return txHash;
    } catch (err) {
      console.error('Error sending transaction:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send transaction",
        variant: "destructive",
      });
      return null;
    }
  };

  // Request test tokens from a faucet
  const requestTestTokens = async (walletId: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to request test tokens",
        variant: "destructive",
      });
      return false;
    }

    if (!hasTestnetAccess || !hasPermission('transaction_manager')) {
      toast({
        title: "Access Denied",
        description: "Testnet token request functionality requires transaction manager permissions",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Get wallet from Supabase
      const { data: walletData, error: walletError } = await supabase
        .from('testnet_wallets')
        .select('*')
        .eq('id', walletId)
        .eq('user_id', user.id)
        .single();

      if (walletError || !walletData) {
        throw new Error('Wallet not found');
      }

      // In a real implementation, we would call a faucet API
      // For now, we'll just simulate a successful faucet request

      // Create a mock transaction for the faucet request
      const txId = uuidv4();
      const txHash = `faucet_tx_${Math.random().toString(16).substring(2, 30)}`;

      await supabase
        .from('testnet_transactions')
        .insert({
          id: txId,
          user_id: user.id,
          wallet_id: walletId,
          transaction_type: 'receive',
          from_address: 'Faucet',
          to_address: walletData.address,
          amount: walletData.network === 'solana-devnet' ? '1' : '0.1',
          token_symbol: walletData.network === 'solana-devnet' ? 'SOL' : 'ETH',
          hash: txHash,
          network: walletData.network,
          status: 'confirmed',
          timestamp: new Date().toISOString()
        });

      // Update wallet balance
      const currentBalance = parseFloat(walletData.balance || '0');
      const newBalance = currentBalance + (walletData.network === 'solana-devnet' ? 1 : 0.1);

      await supabase
        .from('testnet_wallets')
        .update({ balance: newBalance.toString() })
        .eq('id', walletId);

      // Update balance record
      const { data: balanceData } = await supabase
        .from('testnet_balances')
        .select('*')
        .eq('wallet_id', walletId)
        .eq('token_symbol', walletData.network === 'solana-devnet' ? 'SOL' : 'ETH')
        .single();

      if (balanceData) {
        const currentTokenBalance = parseFloat(balanceData.balance || '0');
        const newTokenBalance = currentTokenBalance + (walletData.network === 'solana-devnet' ? 1 : 0.1);

        await supabase
          .from('testnet_balances')
          .update({ balance: newTokenBalance.toString() })
          .eq('id', balanceData.id);
      }

      toast({
        title: "Test Tokens Received",
        description: `You have received test ${walletData.network === 'solana-devnet' ? 'SOL' : 'ETH'} in your wallet`,
      });

      // Refresh wallet data
      await refreshWalletData();

      return true;
    } catch (err) {
      console.error('Error requesting test tokens:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to request test tokens",
        variant: "destructive",
      });
      return false;
    }
  };

  // Enhanced "My Wallet" creation using new service
  const createMyWallet = async (network: TestnetNetwork): Promise<TestnetWallet | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create My Wallet",
        variant: "destructive",
      });
      return null;
    }

    if (!hasTestnetAccess) {
      toast({
        title: "Access Denied",
        description: "Testnet functionality is restricted to administrators only",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Use enhanced wallet manager for secure wallet creation
      const enhancedWallet = await testnetWalletManager.createWallet(user.id, {
        name: 'My Wallet',
        network: network,
        walletType: 'generated',
        isPrimary: true
      });

      if (enhancedWallet) {
        // Convert to legacy format for compatibility
        const walletData = {
          id: enhancedWallet.id,
          name: enhancedWallet.name,
          network: enhancedWallet.network as TestnetNetwork,
          address: enhancedWallet.address,
          balance: enhancedWallet.balance,
        };
        setMyWallet(walletData);

        toast({
          title: "Wallet Created",
          description: `"My Wallet" created successfully on ${network}`,
        });

        return walletData;
      }

      return null;
    } catch (error) {
      TestnetErrorHandler.logError(error, 'createMyWallet');
      const errorInfo = TestnetErrorHandler.getUserFriendlyMessage(error);
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
      return null;
    }
  };

  // Estimate transaction fee
  const estimateTransactionFee = async (
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<string> => {
    try {
      if (!isValidAddress(toAddress)) {
        throw new Error('Invalid recipient address');
      }

      const provider = await getProviderWithRetry(activeNetwork as 'sepolia' | 'ganache');
      const gasPrice = await provider.getGasPrice();
      const gasEstimate = await provider.estimateGas({
        from: fromAddress,
        to: toAddress,
        value: ethers.utils.parseEther(amount),
      });

      const fee = gasPrice.mul(gasEstimate);
      return ethers.utils.formatEther(fee);
    } catch (error) {
      TestnetErrorHandler.logError(error, 'estimateTransactionFee');
      return '0.001'; // Default estimate
    }
  };

  // Enhanced wallet management methods
  const exportWallet = async (walletId: string) => {
    if (!user) return null;
    try {
      return await testnetWalletManager.exportWallet(user.id, walletId);
    } catch (error) {
      TestnetErrorHandler.logError(error, 'exportWallet');
      toast({
        title: "Export Failed",
        description: "Failed to export wallet",
        variant: "destructive",
      });
      return null;
    }
  };

  const setPrimaryWallet = async (walletId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const success = await testnetWalletManager.setPrimaryWallet(user.id, walletId);
      if (success) {
        await refreshWalletData();
        toast({
          title: "Primary Wallet Updated",
          description: "Primary wallet has been changed",
        });
      }
      return success;
    } catch (error) {
      TestnetErrorHandler.logError(error, 'setPrimaryWallet');
      toast({
        title: "Update Failed",
        description: "Failed to update primary wallet",
        variant: "destructive",
      });
      return false;
    }
  };

  const archiveWallet = async (walletId: string, archive: boolean = true): Promise<boolean> => {
    if (!user) return false;
    try {
      const success = await testnetWalletManager.archiveWallet(user.id, walletId, archive);
      if (success) {
        await refreshWalletData();
        toast({
          title: archive ? "Wallet Archived" : "Wallet Restored",
          description: `Wallet has been ${archive ? 'archived' : 'restored'}`,
        });
      }
      return success;
    } catch (error) {
      TestnetErrorHandler.logError(error, 'archiveWallet');
      toast({
        title: "Operation Failed",
        description: `Failed to ${archive ? 'archive' : 'restore'} wallet`,
        variant: "destructive",
      });
      return false;
    }
  };

  // Enhanced network management
  const switchNetwork = async (network: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const result = await testnetNetworkManager.switchNetwork(user.id, network);
      if (result.success) {
        setActiveNetwork(network as TestnetNetwork);
        await loadEnhancedData();
        toast({
          title: "Network Switched",
          description: `Successfully switched to ${network}`,
        });
        return true;
      } else {
        toast({
          title: "Network Switch Failed",
          description: result.error,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      TestnetErrorHandler.logError(error, 'switchNetwork');
      toast({
        title: "Switch Failed",
        description: "Failed to switch network",
        variant: "destructive",
      });
      return false;
    }
  };

  // Enhanced gas management
  const getGasOptimization = async (currentGasPrice: string, gasLimit: string) => {
    try {
      return await testnetGasManager.getGasOptimization(activeNetwork, currentGasPrice, gasLimit);
    } catch (error) {
      TestnetErrorHandler.logError(error, 'getGasOptimization');
      return null;
    }
  };

  // Enhanced contract management
  const deployERC20Token = async (walletId: string, name: string, symbol: string, supply: string) => {
    if (!user) return null;
    try {
      const result = await testnetContractManager.deployERC20Token(
        user.id, walletId, activeNetwork, name, symbol, supply
      );
      await loadEnhancedData();
      toast({
        title: "Token Deployed",
        description: `${name} (${symbol}) has been deployed successfully`,
      });
      return result;
    } catch (error) {
      TestnetErrorHandler.logError(error, 'deployERC20Token');
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy ERC-20 token",
        variant: "destructive",
      });
      return null;
    }
  };

  const addContract = async (address: string, name: string, abi?: any[]) => {
    if (!user) return null;
    try {
      const contract = await testnetContractManager.addContract(
        user.id, activeNetwork, address, name, abi
      );
      await loadEnhancedData();
      toast({
        title: "Contract Added",
        description: `"${name}" has been added to your contracts`,
      });
      return contract;
    } catch (error) {
      TestnetErrorHandler.logError(error, 'addContract');
      toast({
        title: "Add Failed",
        description: "Failed to add contract",
        variant: "destructive",
      });
      return null;
    }
  };

  const getERC20TokenInfo = async (tokenAddress: string) => {
    try {
      return await testnetContractManager.getERC20TokenInfo(activeNetwork, tokenAddress);
    } catch (error) {
      TestnetErrorHandler.logError(error, 'getERC20TokenInfo');
      return null;
    }
  };

  // Enhanced address book management
  const addAddress = async (address: string, label: string, notes?: string) => {
    if (!user) return null;
    try {
      const addressEntry = await testnetAddressManager.addAddress(
        user.id, activeNetwork, address, label, notes
      );
      await loadEnhancedData();
      toast({
        title: "Address Added",
        description: `"${label}" has been added to your address book`,
      });
      return addressEntry;
    } catch (error) {
      TestnetErrorHandler.logError(error, 'addAddress');
      toast({
        title: "Add Failed",
        description: "Failed to add address",
        variant: "destructive",
      });
      return null;
    }
  };

  const searchAddresses = async (query: string) => {
    if (!user) return [];
    try {
      return await testnetAddressManager.searchAddresses(user.id, query, activeNetwork);
    } catch (error) {
      TestnetErrorHandler.logError(error, 'searchAddresses');
      return [];
    }
  };

  return (
    <TestnetContext.Provider
      value={{
        // Core properties
        activeNetwork,
        setActiveNetwork,
        wallets,
        transactions,
        loading,
        error,
        hasTestnetAccess,
        isAdminLoading,
        myWallet,

        // Enhanced wallet management
        createWallet,
        createMyWallet,
        importWallet,
        exportWallet,
        setPrimaryWallet,
        archiveWallet,

        // Enhanced transaction management
        sendTransaction,
        requestTestTokens,
        estimateTransactionFee,

        // Enhanced services
        refreshWalletData,

        // Network management
        availableNetworks,
        networkHealth,
        switchNetwork,

        // Gas management
        currentGasPrices,
        getGasOptimization,

        // Contract management
        userContracts,
        deployERC20Token,
        addContract,
        getERC20TokenInfo,

        // Address book
        addressBook,
        addAddress,
        searchAddresses,

        // Real-time monitoring
        startRealTimeMonitoring,
        stopRealTimeMonitoring,
        isMonitoringActive,
      }}
    >
      {children}
    </TestnetContext.Provider>
  );
};
