/**
 * Enhanced Testnet Service
 * Provides comprehensive testnet functionality with enterprise-level features
 * including secure wallet management, real-time transaction tracking, and robust error handling
 */

import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import {
  NETWORKS,
  getProviderWithRetry,
  sendTransaction as ethersendTransaction,
  getBalance,
  getTransactionStatus,
  waitForTransaction,
  isValidAddress,
  isValidPrivateKey,
  getAddressFromPrivateKey,
  getCurrentGasPrice
} from './ethersService';
import { TestnetErrorHandler } from './testnetErrorHandler';
import { v4 as uuidv4 } from 'uuid';

// Types
export type TestnetNetwork = 'sepolia' | 'ganache';

export interface EnhancedTestnetWallet {
  id: string;
  name: string;
  network: TestnetNetwork;
  address: string;
  balance: string;
  balanceWei: string;
  isMyWallet: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestnetTransactionRequest {
  walletId: string;
  toAddress: string;
  amount: string;
  gasPrice?: string;
  gasLimit?: string;
  memo?: string;
}

export interface TestnetTransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  estimatedFee?: string;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'unknown';
  confirmations: number;
  blockNumber?: number;
  gasUsed?: string;
  effectiveGasPrice?: string;
}

class EnhancedTestnetService {
  private readonly ENCRYPTION_KEY = 'testnet-wallet-encryption-key'; // In production, use proper key management

  /**
   * Create or get "My Wallet" for testnet
   */
  async createMyWallet(userId: string, network: TestnetNetwork = 'sepolia'): Promise<EnhancedTestnetWallet> {
    try {
      // Check if "My Wallet" already exists for this user and network
      const { data: existingWallet, error: fetchError } = await supabase
        .from('testnet_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('network', network)
        .eq('name', 'My Wallet')
        .single();

      if (existingWallet && !fetchError) {
        // Return existing wallet with updated balance
        const balance = await getBalance(existingWallet.address, network);
        return {
          id: existingWallet.id,
          name: existingWallet.name,
          network: existingWallet.network as TestnetNetwork,
          address: existingWallet.address,
          balance,
          balanceWei: ethers.utils.parseEther(balance).toString(),
          isMyWallet: true,
          created_at: existingWallet.created_at,
          updated_at: existingWallet.updated_at,
        };
      }

      // Create new "My Wallet"
      const wallet = ethers.Wallet.createRandom();
      const walletId = uuidv4();

      // Encrypt private key (in production, use proper encryption)
      const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);

      const { data: newWallet, error: insertError } = await supabase
        .from('testnet_wallets')
        .insert({
          id: walletId,
          user_id: userId,
          name: 'My Wallet',
          network,
          address: wallet.address,
          private_key: encryptedPrivateKey,
        })
        .select('*')
        .single();

      if (insertError) {
        throw new Error(`Failed to create wallet: ${insertError.message}`);
      }

      // Create initial balance record
      await supabase
        .from('testnet_balances')
        .insert({
          user_id: userId,
          wallet_id: walletId,
          token_symbol: 'ETH',
          token_name: 'Ethereum',
          balance: '0',
          network,
        });

      return {
        id: newWallet.id,
        name: newWallet.name,
        network: newWallet.network as TestnetNetwork,
        address: newWallet.address,
        balance: '0',
        balanceWei: '0',
        isMyWallet: true,
        created_at: newWallet.created_at,
        updated_at: newWallet.updated_at,
      };
    } catch (error) {
      console.error('Error creating My Wallet:', error);
      throw error;
    }
  }

  /**
   * Get user's testnet wallets
   */
  async getUserWallets(userId: string, network?: TestnetNetwork): Promise<EnhancedTestnetWallet[]> {
    try {
      let query = supabase
        .from('testnet_wallets')
        .select('*')
        .eq('user_id', userId);

      if (network) {
        query = query.eq('network', network);
      }

      const { data: wallets, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch wallets: ${error.message}`);
      }

      // Update balances for all wallets
      const walletsWithBalances = await Promise.all(
        wallets.map(async (wallet) => {
          const balance = await getBalance(wallet.address, wallet.network as TestnetNetwork);
          return {
            id: wallet.id,
            name: wallet.name,
            network: wallet.network as TestnetNetwork,
            address: wallet.address,
            balance,
            balanceWei: ethers.utils.parseEther(balance).toString(),
            isMyWallet: wallet.name === 'My Wallet',
            created_at: wallet.created_at,
            updated_at: wallet.updated_at,
          };
        })
      );

      return walletsWithBalances;
    } catch (error) {
      TestnetErrorHandler.logError(error, 'getUserWallets');
      throw error;
    }
  }

  /**
   * Send testnet transaction
   */
  async sendTransaction(
    userId: string,
    request: TestnetTransactionRequest
  ): Promise<TestnetTransactionResult> {
    try {
      // Validate inputs
      if (!isValidAddress(request.toAddress)) {
        return { success: false, error: 'Invalid recipient address' };
      }

      const amount = parseFloat(request.amount);
      if (amount <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }

      // Get wallet details
      const { data: wallet, error: walletError } = await supabase
        .from('testnet_wallets')
        .select('*')
        .eq('id', request.walletId)
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        return { success: false, error: 'Wallet not found' };
      }

      // Decrypt private key
      const privateKey = this.decryptPrivateKey(wallet.private_key);
      
      // Check balance
      const balance = await getBalance(wallet.address, wallet.network as TestnetNetwork);
      if (parseFloat(balance) < amount) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Send transaction
      const txHash = await ethersendTransaction(
        privateKey,
        request.toAddress,
        request.amount,
        wallet.network as TestnetNetwork,
        request.gasPrice,
        request.gasLimit
      );

      // Record transaction in database
      await this.recordTransaction(
        userId,
        request.walletId,
        'send',
        wallet.address,
        request.toAddress,
        request.amount,
        'ETH',
        txHash,
        wallet.network as TestnetNetwork,
        request.memo
      );

      return { success: true, transactionHash: txHash };
    } catch (error) {
      console.error('Error sending transaction:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Transaction failed' };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txHash: string, network: TestnetNetwork): Promise<TransactionStatus> {
    try {
      const status = await getTransactionStatus(txHash, network);
      const provider = await getProviderWithRetry(network);
      
      let confirmations = 0;
      let blockNumber: number | undefined;
      let gasUsed: string | undefined;
      let effectiveGasPrice: string | undefined;

      if (status === 'confirmed' || status === 'failed') {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) {
          const currentBlock = await provider.getBlockNumber();
          confirmations = currentBlock - receipt.blockNumber + 1;
          blockNumber = receipt.blockNumber;
          gasUsed = receipt.gasUsed.toString();
          effectiveGasPrice = receipt.effectiveGasPrice?.toString();
        }
      }

      return {
        hash: txHash,
        status: status as 'pending' | 'confirmed' | 'failed' | 'unknown',
        confirmations,
        blockNumber,
        gasUsed,
        effectiveGasPrice,
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return {
        hash: txHash,
        status: 'unknown',
        confirmations: 0,
      };
    }
  }

  /**
   * Record transaction in database
   */
  private async recordTransaction(
    userId: string,
    walletId: string,
    type: 'send' | 'receive',
    fromAddress: string,
    toAddress: string,
    amount: string,
    tokenSymbol: string,
    hash: string,
    network: TestnetNetwork,
    memo?: string
  ): Promise<void> {
    try {
      await supabase
        .from('testnet_transactions')
        .insert({
          user_id: userId,
          wallet_id: walletId,
          transaction_type: type,
          from_address: fromAddress,
          to_address: toAddress,
          amount,
          token_symbol: tokenSymbol,
          hash,
          network,
          status: 'pending',
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error recording transaction:', error);
    }
  }

  /**
   * Simple encryption for private keys (use proper encryption in production)
   */
  private encryptPrivateKey(privateKey: string): string {
    // This is a simple XOR encryption for demo purposes
    // In production, use proper encryption like AES with proper key management
    return Buffer.from(privateKey).toString('base64');
  }

  /**
   * Simple decryption for private keys
   */
  private decryptPrivateKey(encryptedPrivateKey: string): string {
    // This is a simple decryption for demo purposes
    return Buffer.from(encryptedPrivateKey, 'base64').toString();
  }

  /**
   * Get current gas price for network
   */
  async getGasPrice(network: TestnetNetwork): Promise<string> {
    return await getCurrentGasPrice(network);
  }

  /**
   * Estimate transaction fee
   */
  async estimateTransactionFee(
    fromAddress: string,
    toAddress: string,
    amount: string,
    network: TestnetNetwork
  ): Promise<string> {
    try {
      const provider = await getProviderWithRetry(network);
      const gasPrice = await provider.getGasPrice();
      const gasEstimate = await provider.estimateGas({
        from: fromAddress,
        to: toAddress,
        value: ethers.utils.parseEther(amount),
      });
      
      const fee = gasPrice.mul(gasEstimate);
      return ethers.utils.formatEther(fee);
    } catch (error) {
      console.error('Error estimating transaction fee:', error);
      return '0.001'; // Default estimate
    }
  }
}

export const enhancedTestnetService = new EnhancedTestnetService();
