/**
 * Testnet Address Manager Service
 * Address book and contact management for testnet operations
 */

import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import { testnetNetworkManager } from './testnetNetworkManager';

export interface TestnetAddress {
  id: string;
  userId: string;
  networkId: string;
  address: string;
  label: string;
  notes?: string;
  isFavorite: boolean;
  lastUsed?: Date;
  usageCount: number;
  addressType: 'external' | 'contract' | 'exchange' | 'personal';
  ensName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddressValidation {
  isValid: boolean;
  isContract?: boolean;
  ensName?: string;
  error?: string;
}

export interface RecentAddress {
  address: string;
  label?: string;
  lastUsed: Date;
  usageCount: number;
}

class TestnetAddressManager {
  /**
   * Add address to address book
   */
  async addAddress(
    userId: string,
    networkName: string,
    address: string,
    label: string,
    notes?: string,
    addressType: 'external' | 'contract' | 'exchange' | 'personal' = 'external'
  ): Promise<TestnetAddress> {
    try {
      // Validate address
      if (!ethers.utils.isAddress(address)) {
        throw new Error('Invalid address format');
      }

      // Get network
      const network = await testnetNetworkManager.getNetworkByName(networkName);
      if (!network) {
        throw new Error(`Network ${networkName} not found`);
      }

      // Check if address already exists for this user and network
      const { data: existingAddress } = await supabase
        .from('testnet_addresses')
        .select('id')
        .eq('user_id', userId)
        .eq('network_id', network.id)
        .eq('address', address.toLowerCase())
        .single();

      if (existingAddress) {
        throw new Error('Address already exists in address book');
      }

      // Try to resolve ENS name (for mainnet-like testnets)
      let ensName: string | undefined;
      try {
        const provider = await testnetNetworkManager.getNetworkProvider(networkName);
        ensName = await provider.lookupAddress(address);
      } catch {
        // ENS resolution failed, continue without it
      }

      // Insert new address
      const { data: newAddress, error } = await supabase
        .from('testnet_addresses')
        .insert({
          user_id: userId,
          network_id: network.id,
          address: address.toLowerCase(),
          label,
          notes,
          address_type: addressType,
          ens_name: ensName,
          is_favorite: false,
          usage_count: 0,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to add address: ${error.message}`);
      }

      return this.mapDatabaseAddressToAddress(newAddress);
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  }

  /**
   * Get user's address book
   */
  async getAddressBook(
    userId: string,
    networkName?: string,
    favoritesOnly: boolean = false
  ): Promise<TestnetAddress[]> {
    try {
      let query = supabase
        .from('testnet_addresses')
        .select('*, testnet_networks(name)')
        .eq('user_id', userId);

      if (networkName) {
        const network = await testnetNetworkManager.getNetworkByName(networkName);
        if (network) {
          query = query.eq('network_id', network.id);
        }
      }

      if (favoritesOnly) {
        query = query.eq('is_favorite', true);
      }

      const { data: addresses, error } = await query.order('label');

      if (error) {
        throw new Error(`Failed to fetch address book: ${error.message}`);
      }

      return addresses.map(address => this.mapDatabaseAddressToAddress(address));
    } catch (error) {
      console.error('Error fetching address book:', error);
      throw error;
    }
  }

  /**
   * Update address information
   */
  async updateAddress(
    userId: string,
    addressId: string,
    updates: {
      label?: string;
      notes?: string;
      addressType?: 'external' | 'contract' | 'exchange' | 'personal';
      isFavorite?: boolean;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('testnet_addresses')
        .update({
          ...updates,
          is_favorite: updates.isFavorite,
          address_type: updates.addressType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update address: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error updating address:', error);
      return false;
    }
  }

  /**
   * Remove address from address book
   */
  async removeAddress(userId: string, addressId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('testnet_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to remove address: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Error removing address:', error);
      return false;
    }
  }

  /**
   * Record address usage
   */
  async recordAddressUsage(userId: string, networkName: string, address: string): Promise<void> {
    try {
      const network = await testnetNetworkManager.getNetworkByName(networkName);
      if (!network) {
        return;
      }

      // Check if address exists in address book
      const { data: existingAddress } = await supabase
        .from('testnet_addresses')
        .select('id, usage_count')
        .eq('user_id', userId)
        .eq('network_id', network.id)
        .eq('address', address.toLowerCase())
        .single();

      if (existingAddress) {
        // Update existing address usage
        await supabase
          .from('testnet_addresses')
          .update({
            usage_count: existingAddress.usage_count + 1,
            last_used: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingAddress.id);
      } else {
        // Add as recent address (not in address book)
        await this.addRecentAddress(userId, networkName, address);
      }
    } catch (error) {
      console.error('Error recording address usage:', error);
    }
  }

  /**
   * Get recent addresses
   */
  async getRecentAddresses(
    userId: string,
    networkName?: string,
    limit: number = 10
  ): Promise<RecentAddress[]> {
    try {
      let query = supabase
        .from('testnet_addresses')
        .select('address, label, last_used, usage_count')
        .eq('user_id', userId)
        .not('last_used', 'is', null);

      if (networkName) {
        const network = await testnetNetworkManager.getNetworkByName(networkName);
        if (network) {
          query = query.eq('network_id', network.id);
        }
      }

      const { data: addresses, error } = await query
        .order('last_used', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch recent addresses: ${error.message}`);
      }

      return addresses.map(addr => ({
        address: addr.address,
        label: addr.label,
        lastUsed: new Date(addr.last_used),
        usageCount: addr.usage_count,
      }));
    } catch (error) {
      console.error('Error fetching recent addresses:', error);
      return [];
    }
  }

  /**
   * Validate address and get additional information
   */
  async validateAddress(networkName: string, address: string): Promise<AddressValidation> {
    try {
      // Basic format validation
      if (!ethers.utils.isAddress(address)) {
        return {
          isValid: false,
          error: 'Invalid address format',
        };
      }

      const provider = await testnetNetworkManager.getNetworkProvider(networkName);

      // Check if it's a contract
      const code = await provider.getCode(address);
      const isContract = code !== '0x';

      // Try to resolve ENS name
      let ensName: string | undefined;
      try {
        ensName = await provider.lookupAddress(address);
      } catch {
        // ENS resolution failed
      }

      return {
        isValid: true,
        isContract,
        ensName,
      };
    } catch (error) {
      console.error('Error validating address:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      };
    }
  }

  /**
   * Search addresses in address book
   */
  async searchAddresses(
    userId: string,
    query: string,
    networkName?: string
  ): Promise<TestnetAddress[]> {
    try {
      let dbQuery = supabase
        .from('testnet_addresses')
        .select('*')
        .eq('user_id', userId);

      if (networkName) {
        const network = await testnetNetworkManager.getNetworkByName(networkName);
        if (network) {
          dbQuery = dbQuery.eq('network_id', network.id);
        }
      }

      // Search in label, notes, address, and ENS name
      dbQuery = dbQuery.or(`label.ilike.%${query}%,notes.ilike.%${query}%,address.ilike.%${query}%,ens_name.ilike.%${query}%`);

      const { data: addresses, error } = await dbQuery
        .order('usage_count', { ascending: false })
        .limit(20);

      if (error) {
        throw new Error(`Failed to search addresses: ${error.message}`);
      }

      return addresses.map(address => this.mapDatabaseAddressToAddress(address));
    } catch (error) {
      console.error('Error searching addresses:', error);
      return [];
    }
  }

  /**
   * Get address by label
   */
  async getAddressByLabel(
    userId: string,
    networkName: string,
    label: string
  ): Promise<TestnetAddress | null> {
    try {
      const network = await testnetNetworkManager.getNetworkByName(networkName);
      if (!network) {
        return null;
      }

      const { data: address, error } = await supabase
        .from('testnet_addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('network_id', network.id)
        .eq('label', label)
        .single();

      if (error || !address) {
        return null;
      }

      return this.mapDatabaseAddressToAddress(address);
    } catch (error) {
      console.error('Error getting address by label:', error);
      return null;
    }
  }

  /**
   * Private helper methods
   */
  private async addRecentAddress(
    userId: string,
    networkName: string,
    address: string
  ): Promise<void> {
    try {
      const network = await testnetNetworkManager.getNetworkByName(networkName);
      if (!network) {
        return;
      }

      // Add as temporary address with auto-generated label
      const label = `Address ${address.substring(0, 8)}...`;
      
      await supabase
        .from('testnet_addresses')
        .insert({
          user_id: userId,
          network_id: network.id,
          address: address.toLowerCase(),
          label,
          address_type: 'external',
          is_favorite: false,
          usage_count: 1,
          last_used: new Date().toISOString(),
        });
    } catch (error) {
      // Ignore errors for recent address tracking
      console.debug('Could not add recent address:', error);
    }
  }

  private mapDatabaseAddressToAddress(dbAddress: Record<string, unknown>): TestnetAddress {
    return {
      id: dbAddress.id,
      userId: dbAddress.user_id,
      networkId: dbAddress.network_id,
      address: dbAddress.address,
      label: dbAddress.label,
      notes: dbAddress.notes,
      isFavorite: dbAddress.is_favorite || false,
      lastUsed: dbAddress.last_used ? new Date(dbAddress.last_used) : undefined,
      usageCount: dbAddress.usage_count || 0,
      addressType: dbAddress.address_type || 'external',
      ensName: dbAddress.ens_name,
      createdAt: new Date(dbAddress.created_at),
      updatedAt: new Date(dbAddress.updated_at),
    };
  }
}

export const testnetAddressManager = new TestnetAddressManager();
