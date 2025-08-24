/**
 * Testnet Wallet Manager Service
 * Comprehensive wallet management with cryptographic security and multi-wallet support
 */

import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';

export interface TestnetWallet {
  id: string;
  userId: string;
  name: string;
  network: string;
  networkId: string;
  address: string;
  balance: string;
  walletType: 'generated' | 'imported' | 'hardware';
  isPrimary: boolean;
  lastActivity?: Date;
  transactionCount: number;
  totalSent: string;
  totalReceived: string;
  isArchived: boolean;
  backupStatus: 'not_backed_up' | 'backed_up' | 'pending';
  derivationPath?: string;
  publicKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletCreationOptions {
  name: string;
  network: string;
  walletType?: 'generated' | 'imported';
  derivationPath?: string;
  isPrimary?: boolean;
}

export interface WalletImportOptions {
  name: string;
  network: string;
  privateKey: string;
  isPrimary?: boolean;
}

export interface WalletExportData {
  address: string;
  privateKey: string;
  publicKey: string;
  derivationPath?: string;
  createdAt: Date;
}

class TestnetWalletManager {
  private readonly ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'testnet-wallet-key-2024';
  private readonly DERIVATION_PATH_BASE = "m/44'/60'/0'/0/";

  /**
   * Create a new testnet wallet with cryptographic security
   */
  async createWallet(userId: string, options: WalletCreationOptions): Promise<TestnetWallet | null> {
    try {
      // Get network information
      const { data: network, error: networkError } = await supabase
        .from('testnet_networks')
        .select('*')
        .eq('name', options.network)
        .single();

      if (networkError || !network) {
        throw new Error(`Network ${options.network} not found`);
      }

      // Generate wallet
      const wallet = ethers.Wallet.createRandom();
      const walletId = uuidv4();

      // Encrypt private key
      const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);

      // Set derivation path for generated wallets
      const derivationPath = options.derivationPath || `${this.DERIVATION_PATH_BASE}0`;

      // Check if this should be primary wallet
      const isPrimary = options.isPrimary || await this.shouldBePrimary(userId, network.id);

      // Create wallet record
      const { data: newWallet, error: insertError } = await supabase
        .from('testnet_wallets')
        .insert({
          id: walletId,
          user_id: userId,
          name: options.name,
          network: options.network,
          network_id: network.id,
          address: wallet.address,
          private_key: encryptedPrivateKey,
          wallet_type: options.walletType || 'generated',
          is_primary: isPrimary,
          derivation_path: derivationPath,
          public_key: wallet.publicKey,
          balance: '0',
          transaction_count: 0,
          total_sent: '0',
          total_received: '0',
          backup_status: 'not_backed_up',
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
          token_symbol: network.symbol,
          token_name: 'Ethereum',
          balance: '0',
          network: options.network,
        });

      // Create user account if it doesn't exist
      await this.ensureUserAccount(userId, network.id);

      return this.mapDatabaseWalletToWallet(newWallet);
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  /**
   * Import an existing wallet from private key
   */
  async importWallet(userId: string, options: WalletImportOptions): Promise<TestnetWallet | null> {
    try {
      // Validate private key
      if (!this.isValidPrivateKey(options.privateKey)) {
        throw new Error('Invalid private key format');
      }

      // Create wallet from private key
      const wallet = new ethers.Wallet(options.privateKey);

      // Check if wallet already exists
      const { data: existingWallet } = await supabase
        .from('testnet_wallets')
        .select('id')
        .eq('user_id', userId)
        .eq('address', wallet.address)
        .eq('network', options.network)
        .single();

      if (existingWallet) {
        throw new Error('Wallet with this address already exists');
      }

      // Get network information
      const { data: network, error: networkError } = await supabase
        .from('testnet_networks')
        .select('*')
        .eq('name', options.network)
        .single();

      if (networkError || !network) {
        throw new Error(`Network ${options.network} not found`);
      }

      const walletId = uuidv4();
      const encryptedPrivateKey = this.encryptPrivateKey(options.privateKey);
      const isPrimary = options.isPrimary || await this.shouldBePrimary(userId, network.id);

      // Create wallet record
      const { data: newWallet, error: insertError } = await supabase
        .from('testnet_wallets')
        .insert({
          id: walletId,
          user_id: userId,
          name: options.name,
          network: options.network,
          network_id: network.id,
          address: wallet.address,
          private_key: encryptedPrivateKey,
          wallet_type: 'imported',
          is_primary: isPrimary,
          public_key: wallet.publicKey,
          balance: '0',
          transaction_count: 0,
          total_sent: '0',
          total_received: '0',
          backup_status: 'backed_up', // Imported wallets are considered backed up
        })
        .select('*')
        .single();

      if (insertError) {
        throw new Error(`Failed to import wallet: ${insertError.message}`);
      }

      // Create initial balance record
      await supabase
        .from('testnet_balances')
        .insert({
          user_id: userId,
          wallet_id: walletId,
          token_symbol: network.symbol,
          token_name: 'Ethereum',
          balance: '0',
          network: options.network,
        });

      return this.mapDatabaseWalletToWallet(newWallet);
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw error;
    }
  }

  /**
   * Get all wallets for a user
   */
  async getUserWallets(userId: string, network?: string): Promise<TestnetWallet[]> {
    try {
      let query = supabase
        .from('testnet_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('is_archived', false);

      if (network) {
        query = query.eq('network', network);
      }

      const { data: wallets, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch wallets: ${error.message}`);
      }

      return wallets.map(wallet => this.mapDatabaseWalletToWallet(wallet));
    } catch (error) {
      console.error('Error fetching user wallets:', error);
      throw error;
    }
  }

  /**
   * Get primary wallet for user and network
   */
  async getPrimaryWallet(userId: string, network: string): Promise<TestnetWallet | null> {
    try {
      const { data: wallet, error } = await supabase
        .from('testnet_wallets')
        .select('*')
        .eq('user_id', userId)
        .eq('network', network)
        .eq('is_primary', true)
        .eq('is_archived', false)
        .single();

      if (error || !wallet) {
        return null;
      }

      return this.mapDatabaseWalletToWallet(wallet);
    } catch (error) {
      console.error('Error fetching primary wallet:', error);
      return null;
    }
  }

  /**
   * Export wallet data (requires authentication)
   */
  async exportWallet(userId: string, walletId: string): Promise<WalletExportData | null> {
    try {
      const { data: wallet, error } = await supabase
        .from('testnet_wallets')
        .select('*')
        .eq('id', walletId)
        .eq('user_id', userId)
        .single();

      if (error || !wallet) {
        throw new Error('Wallet not found or access denied');
      }

      const privateKey = this.decryptPrivateKey(wallet.private_key);

      return {
        address: wallet.address,
        privateKey,
        publicKey: wallet.public_key,
        derivationPath: wallet.derivation_path,
        createdAt: new Date(wallet.created_at),
      };
    } catch (error) {
      console.error('Error exporting wallet:', error);
      throw error;
    }
  }

  /**
   * Set wallet as primary
   */
  async setPrimaryWallet(userId: string, walletId: string): Promise<boolean> {
    try {
      // Get wallet to verify ownership and network
      const { data: wallet, error: walletError } = await supabase
        .from('testnet_wallets')
        .select('network_id')
        .eq('id', walletId)
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        throw new Error('Wallet not found or access denied');
      }

      // Remove primary status from other wallets in the same network
      await supabase
        .from('testnet_wallets')
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('network_id', wallet.network_id);

      // Set this wallet as primary
      const { error: updateError } = await supabase
        .from('testnet_wallets')
        .update({ is_primary: true, updated_at: new Date().toISOString() })
        .eq('id', walletId);

      if (updateError) {
        throw new Error(`Failed to set primary wallet: ${updateError.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error setting primary wallet:', error);
      return false;
    }
  }

  /**
   * Archive/unarchive wallet
   */
  async archiveWallet(userId: string, walletId: string, archive: boolean = true): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('testnet_wallets')
        .update({ 
          is_archived: archive, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', walletId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to ${archive ? 'archive' : 'unarchive'} wallet: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error(`Error ${archive ? 'archiving' : 'unarchiving'} wallet:`, error);
      return false;
    }
  }

  /**
   * Update wallet backup status
   */
  async updateBackupStatus(userId: string, walletId: string, status: 'not_backed_up' | 'backed_up' | 'pending'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('testnet_wallets')
        .update({ 
          backup_status: status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', walletId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update backup status: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating backup status:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private encryptPrivateKey(privateKey: string): string {
    return CryptoJS.AES.encrypt(privateKey, this.ENCRYPTION_KEY).toString();
  }

  private decryptPrivateKey(encryptedPrivateKey: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, this.ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private isValidPrivateKey(privateKey: string): boolean {
    try {
      new ethers.Wallet(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  private async shouldBePrimary(userId: string, networkId: string): Promise<boolean> {
    const { data: existingPrimary } = await supabase
      .from('testnet_wallets')
      .select('id')
      .eq('user_id', userId)
      .eq('network_id', networkId)
      .eq('is_primary', true)
      .single();

    return !existingPrimary;
  }

  private async ensureUserAccount(userId: string, defaultNetworkId: string): Promise<void> {
    const { data: existingAccount } = await supabase
      .from('testnet_accounts')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existingAccount) {
      await supabase
        .from('testnet_accounts')
        .insert({
          user_id: userId,
          default_network_id: defaultNetworkId,
        });
    }
  }

  private mapDatabaseWalletToWallet(dbWallet: Record<string, unknown>): TestnetWallet {
    return {
      id: dbWallet.id,
      userId: dbWallet.user_id,
      name: dbWallet.name,
      network: dbWallet.network,
      networkId: dbWallet.network_id,
      address: dbWallet.address,
      balance: dbWallet.balance || '0',
      walletType: dbWallet.wallet_type || 'generated',
      isPrimary: dbWallet.is_primary || false,
      lastActivity: dbWallet.last_activity ? new Date(dbWallet.last_activity) : undefined,
      transactionCount: dbWallet.transaction_count || 0,
      totalSent: dbWallet.total_sent || '0',
      totalReceived: dbWallet.total_received || '0',
      isArchived: dbWallet.is_archived || false,
      backupStatus: dbWallet.backup_status || 'not_backed_up',
      derivationPath: dbWallet.derivation_path,
      publicKey: dbWallet.public_key,
      createdAt: new Date(dbWallet.created_at),
      updatedAt: new Date(dbWallet.updated_at),
    };
  }
}

export const testnetWalletManager = new TestnetWalletManager();
