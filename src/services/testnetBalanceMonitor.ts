/**
 * Testnet Balance Monitor Service
 * Real-time balance monitoring and transaction detection for testnet wallets
 */

import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import { getProviderWithRetry, getBalance } from './ethersService';
import { TestnetNetwork } from './enhancedTestnetService';

interface BalanceUpdate {
  walletId: string;
  address: string;
  oldBalance: string;
  newBalance: string;
  network: TestnetNetwork;
  timestamp: Date;
}

interface TransactionDetection {
  walletId: string;
  address: string;
  txHash: string;
  type: 'incoming' | 'outgoing';
  amount: string;
  network: TestnetNetwork;
  blockNumber: number;
}

class TestnetBalanceMonitor {
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastKnownBalances: Map<string, string> = new Map();
  private lastProcessedBlocks: Map<TestnetNetwork, number> = new Map();
  private listeners: Map<string, (update: BalanceUpdate) => void> = new Map();
  private transactionListeners: Map<string, (detection: TransactionDetection) => void> = new Map();

  /**
   * Start monitoring a wallet's balance
   */
  startMonitoring(
    walletId: string, 
    address: string, 
    network: TestnetNetwork, 
    intervalMs: number = 15000
  ): void {
    const key = `${walletId}_${network}`;
    
    // Stop existing monitoring for this wallet
    this.stopMonitoring(walletId, network);
    
    // Start new monitoring
    const interval = setInterval(async () => {
      await this.checkBalanceUpdate(walletId, address, network);
      await this.checkForNewTransactions(walletId, address, network);
    }, intervalMs);
    
    this.monitoringIntervals.set(key, interval);
    
    // Initialize balance
    this.initializeBalance(walletId, address, network);
    
    console.log(`Started monitoring wallet ${walletId} on ${network}`);
  }

  /**
   * Stop monitoring a wallet's balance
   */
  stopMonitoring(walletId: string, network: TestnetNetwork): void {
    const key = `${walletId}_${network}`;
    const interval = this.monitoringIntervals.get(key);
    
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(key);
      this.lastKnownBalances.delete(key);
      console.log(`Stopped monitoring wallet ${walletId} on ${network}`);
    }
  }

  /**
   * Stop all monitoring
   */
  stopAllMonitoring(): void {
    this.monitoringIntervals.forEach((interval) => {
      clearInterval(interval);
    });
    this.monitoringIntervals.clear();
    this.lastKnownBalances.clear();
    this.listeners.clear();
    this.transactionListeners.clear();
    console.log('Stopped all wallet monitoring');
  }

  /**
   * Add balance update listener
   */
  addBalanceListener(
    listenerId: string, 
    callback: (update: BalanceUpdate) => void
  ): void {
    this.listeners.set(listenerId, callback);
  }

  /**
   * Remove balance update listener
   */
  removeBalanceListener(listenerId: string): void {
    this.listeners.delete(listenerId);
  }

  /**
   * Add transaction detection listener
   */
  addTransactionListener(
    listenerId: string, 
    callback: (detection: TransactionDetection) => void
  ): void {
    this.transactionListeners.set(listenerId, callback);
  }

  /**
   * Remove transaction detection listener
   */
  removeTransactionListener(listenerId: string): void {
    this.transactionListeners.delete(listenerId);
  }

  /**
   * Initialize balance for a wallet
   */
  private async initializeBalance(
    walletId: string, 
    address: string, 
    network: TestnetNetwork
  ): Promise<void> {
    try {
      const balance = await getBalance(address, network);
      const key = `${walletId}_${network}`;
      this.lastKnownBalances.set(key, balance);
    } catch (error) {
      console.error(`Error initializing balance for wallet ${walletId}:`, error);
    }
  }

  /**
   * Check for balance updates
   */
  private async checkBalanceUpdate(
    walletId: string, 
    address: string, 
    network: TestnetNetwork
  ): Promise<void> {
    try {
      const key = `${walletId}_${network}`;
      const currentBalance = await getBalance(address, network);
      const lastBalance = this.lastKnownBalances.get(key) || '0';

      if (currentBalance !== lastBalance) {
        const update: BalanceUpdate = {
          walletId,
          address,
          oldBalance: lastBalance,
          newBalance: currentBalance,
          network,
          timestamp: new Date(),
        };

        // Update stored balance
        this.lastKnownBalances.set(key, currentBalance);

        // Update database
        await this.updateBalanceInDatabase(walletId, currentBalance, network);

        // Notify listeners
        this.notifyBalanceListeners(update);

        console.log(`Balance updated for wallet ${walletId}: ${lastBalance} -> ${currentBalance} ETH`);
      }
    } catch (error) {
      console.error(`Error checking balance for wallet ${walletId}:`, error);
    }
  }

  /**
   * Check for new transactions
   */
  private async checkForNewTransactions(
    walletId: string, 
    address: string, 
    network: TestnetNetwork
  ): Promise<void> {
    try {
      if (network !== 'sepolia') return; // Only support Sepolia for now

      const provider = await getProviderWithRetry(network);
      const currentBlock = await provider.getBlockNumber();
      const lastProcessedBlock = this.lastProcessedBlocks.get(network) || currentBlock - 10;

      // Check recent blocks for transactions involving this address
      for (let blockNumber = lastProcessedBlock + 1; blockNumber <= currentBlock; blockNumber++) {
        const block = await provider.getBlockWithTransactions(blockNumber);
        
        for (const tx of block.transactions) {
          if (tx.to?.toLowerCase() === address.toLowerCase() || 
              tx.from?.toLowerCase() === address.toLowerCase()) {
            
            const isIncoming = tx.to?.toLowerCase() === address.toLowerCase();
            const amount = ethers.utils.formatEther(tx.value);

            // Check if we already recorded this transaction
            const { data: existingTx } = await supabase
              .from('testnet_transactions')
              .select('id')
              .eq('hash', tx.hash)
              .single();

            if (!existingTx && parseFloat(amount) > 0) {
              const detection: TransactionDetection = {
                walletId,
                address,
                txHash: tx.hash,
                type: isIncoming ? 'incoming' : 'outgoing',
                amount,
                network,
                blockNumber,
              };

              // Record transaction in database
              await this.recordDetectedTransaction(detection);

              // Notify listeners
              this.notifyTransactionListeners(detection);

              console.log(`Detected ${detection.type} transaction: ${amount} ETH (${tx.hash})`);
            }
          }
        }
      }

      this.lastProcessedBlocks.set(network, currentBlock);
    } catch (error) {
      console.error(`Error checking for new transactions:`, error);
    }
  }

  /**
   * Update balance in database
   */
  private async updateBalanceInDatabase(
    walletId: string, 
    balance: string, 
    network: TestnetNetwork
  ): Promise<void> {
    try {
      // Update testnet_balances table
      await supabase
        .from('testnet_balances')
        .update({ 
          balance,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_id', walletId)
        .eq('network', network);
    } catch (error) {
      console.error('Error updating balance in database:', error);
    }
  }

  /**
   * Record detected transaction in database
   */
  private async recordDetectedTransaction(detection: TransactionDetection): Promise<void> {
    try {
      // Get user ID for this wallet
      const { data: wallet } = await supabase
        .from('testnet_wallets')
        .select('user_id')
        .eq('id', detection.walletId)
        .single();

      if (!wallet) return;

      await supabase
        .from('testnet_transactions')
        .insert({
          user_id: wallet.user_id,
          wallet_id: detection.walletId,
          transaction_type: detection.type === 'incoming' ? 'receive' : 'send',
          from_address: detection.type === 'incoming' ? '' : detection.address,
          to_address: detection.type === 'incoming' ? detection.address : '',
          amount: detection.amount,
          token_symbol: 'ETH',
          hash: detection.txHash,
          network: detection.network,
          status: 'confirmed',
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error recording detected transaction:', error);
    }
  }

  /**
   * Notify balance listeners
   */
  private notifyBalanceListeners(update: BalanceUpdate): void {
    this.listeners.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        console.error('Error in balance listener callback:', error);
      }
    });
  }

  /**
   * Notify transaction listeners
   */
  private notifyTransactionListeners(detection: TransactionDetection): void {
    this.transactionListeners.forEach((callback) => {
      try {
        callback(detection);
      } catch (error) {
        console.error('Error in transaction listener callback:', error);
      }
    });
  }

  /**
   * Get monitoring status
   */
  getMonitoringStatus(): { 
    activeWallets: number; 
    listeners: number; 
    transactionListeners: number;
  } {
    return {
      activeWallets: this.monitoringIntervals.size,
      listeners: this.listeners.size,
      transactionListeners: this.transactionListeners.size,
    };
  }
}

export const testnetBalanceMonitor = new TestnetBalanceMonitor();
