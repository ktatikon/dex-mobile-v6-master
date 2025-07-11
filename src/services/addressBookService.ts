import { supabase } from '@/integrations/supabase/client';

export interface AddressBookEntry {
  id: string;
  user_id: string;
  address: string;
  nickname: string;
  network: string;
  is_favorite: boolean;
  last_used: string;
  created_at: string;
  updated_at: string;
}

export interface RecentAddress {
  address: string;
  network: string;
  last_used: string;
  usage_count: number;
}

class AddressBookService {
  private cache = new Map<string, AddressBookEntry[]>();
  private recentCache = new Map<string, RecentAddress[]>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all address book entries for a user
   */
  async getAddressBook(userId: string): Promise<AddressBookEntry[]> {
    try {
      const cacheKey = `addressbook_${userId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('address_book')
        .select('*')
        .eq('user_id', userId)
        .order('is_favorite', { ascending: false })
        .order('last_used', { ascending: false });

      if (error) {
        console.error('Error fetching address book:', error);
        return [];
      }

      const entries = data || [];
      this.cache.set(cacheKey, entries);
      
      // Clear cache after TTL
      setTimeout(() => this.cache.delete(cacheKey), this.CACHE_TTL);
      
      return entries;
    } catch (error) {
      console.error('Error in getAddressBook:', error);
      return [];
    }
  }

  /**
   * Add new address to address book
   */
  async addAddress(
    userId: string,
    address: string,
    nickname: string,
    network: string,
    isFavorite: boolean = false
  ): Promise<{ success: boolean; entry?: AddressBookEntry; error?: string }> {
    try {
      // Validate address format
      if (!this.isValidAddress(address, network)) {
        return {
          success: false,
          error: 'Invalid address format for the selected network'
        };
      }

      // Check if address already exists
      const existing = await this.findAddress(userId, address, network);
      if (existing) {
        return {
          success: false,
          error: 'Address already exists in address book'
        };
      }

      const { data, error } = await supabase
        .from('address_book')
        .insert({
          user_id: userId,
          address,
          nickname,
          network,
          is_favorite: isFavorite,
          last_used: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding address:', error);
        return {
          success: false,
          error: 'Failed to add address to address book'
        };
      }

      // Clear cache to force refresh
      this.cache.delete(`addressbook_${userId}`);

      return {
        success: true,
        entry: data
      };
    } catch (error) {
      console.error('Error in addAddress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update address usage (for recent addresses tracking)
   */
  async updateAddressUsage(userId: string, address: string, network: string): Promise<void> {
    try {
      // Update in address book if exists
      const { error: updateError } = await supabase
        .from('address_book')
        .update({ last_used: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('address', address)
        .eq('network', network);

      if (updateError) {
        console.error('Error updating address usage:', updateError);
      }

      // Add to recent addresses
      await this.addToRecentAddresses(userId, address, network);
      
      // Clear caches
      this.cache.delete(`addressbook_${userId}`);
      this.recentCache.delete(`recent_${userId}`);
    } catch (error) {
      console.error('Error in updateAddressUsage:', error);
    }
  }

  /**
   * Get recent addresses for a user
   */
  async getRecentAddresses(userId: string, limit: number = 5): Promise<RecentAddress[]> {
    try {
      const cacheKey = `recent_${userId}`;
      const cached = this.recentCache.get(cacheKey);
      
      if (cached) {
        return cached.slice(0, limit);
      }

      const { data, error } = await supabase
        .from('recent_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('last_used', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent addresses:', error);
        return [];
      }

      const recent = data || [];
      this.recentCache.set(cacheKey, recent);
      
      // Clear cache after TTL
      setTimeout(() => this.recentCache.delete(cacheKey), this.CACHE_TTL);
      
      return recent;
    } catch (error) {
      console.error('Error in getRecentAddresses:', error);
      return [];
    }
  }

  /**
   * Find specific address in address book
   */
  async findAddress(userId: string, address: string, network: string): Promise<AddressBookEntry | null> {
    try {
      const { data, error } = await supabase
        .from('address_book')
        .select('*')
        .eq('user_id', userId)
        .eq('address', address)
        .eq('network', network)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in findAddress:', error);
      return null;
    }
  }

  /**
   * Validate address format based on network
   */
  private isValidAddress(address: string, network: string): boolean {
    switch (network.toLowerCase()) {
      case 'ethereum':
      case 'polygon':
      case 'bsc':
      case 'arbitrum':
      case 'optimism':
        return /^0x[a-fA-F0-9]{40}$/.test(address);
      case 'bitcoin':
        return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address);
      case 'solana':
        return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      default:
        return /^0x[a-fA-F0-9]{40}$/.test(address); // Default to Ethereum format
    }
  }

  /**
   * Add address to recent addresses table
   */
  private async addToRecentAddresses(userId: string, address: string, network: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('recent_addresses')
        .upsert({
          user_id: userId,
          address,
          network,
          last_used: new Date().toISOString(),
          usage_count: 1
        }, {
          onConflict: 'user_id,address,network',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error adding to recent addresses:', error);
      }
    } catch (error) {
      console.error('Error in addToRecentAddresses:', error);
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.recentCache.clear();
  }
}

export const addressBookService = new AddressBookService();
