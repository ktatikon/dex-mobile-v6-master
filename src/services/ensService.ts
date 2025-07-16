import { ethers } from 'ethers';

export interface ENSResolution {
  address: string | null;
  name: string | null;
  avatar: string | null;
  isValid: boolean;
  error?: string;
}

class ENSService {
  private provider: ethers.Provider | null = null;
  private cache = new Map<string, ENSResolution>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize Ethereum provider for ENS resolution
   */
  private initializeProvider(): void {
    try {
      // Try to use Infura or Alchemy provider
      const infuraKey = process.env.REACT_APP_INFURA_KEY;
      const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY;
      
      if (infuraKey) {
        this.provider = new ethers.InfuraProvider('mainnet', infuraKey);
      } else if (alchemyKey) {
        this.provider = new ethers.AlchemyProvider('mainnet', alchemyKey);
      } else {
        // Fallback to public provider (rate limited)
        this.provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com');
      }
      
      console.log('✅ ENS provider initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ENS provider:', error);
      this.provider = null;
    }
  }

  /**
   * Resolve ENS name to address
   */
  async resolveENSToAddress(ensName: string): Promise<ENSResolution> {
    try {
      // Validate ENS name format
      if (!this.isValidENSName(ensName)) {
        return {
          address: null,
          name: ensName,
          avatar: null,
          isValid: false,
          error: 'Invalid ENS name format'
        };
      }

      // Check cache first
      const cacheKey = `ens_${ensName.toLowerCase()}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      if (!this.provider) {
        return {
          address: null,
          name: ensName,
          avatar: null,
          isValid: false,
          error: 'ENS provider not available'
        };
      }

      // Resolve ENS name
      const address = await this.provider.resolveName(ensName);
      
      if (!address) {
        const result: ENSResolution = {
          address: null,
          name: ensName,
          avatar: null,
          isValid: false,
          error: 'ENS name not found'
        };
        
        // Cache negative result for shorter time
        this.cache.set(cacheKey, result);
        setTimeout(() => this.cache.delete(cacheKey), 2 * 60 * 1000); // 2 minutes
        
        return result;
      }

      // Try to get avatar (optional)
      let avatar: string | null = null;
      try {
        avatar = await this.provider.getAvatar(ensName);
      } catch (error) {
        // Avatar resolution is optional, don't fail the whole resolution
        console.log('Could not resolve avatar for', ensName);
      }

      const result: ENSResolution = {
        address,
        name: ensName,
        avatar,
        isValid: true
      };

      // Cache successful result
      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), this.CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error resolving ENS name:', error);
      return {
        address: null,
        name: ensName,
        avatar: null,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Resolve address to ENS name (reverse resolution)
   */
  async resolveAddressToENS(address: string): Promise<ENSResolution> {
    try {
      // Validate address format
      if (!ethers.utils.ethers.utils.isAddress(address)) {
        return {
          address,
          name: null,
          avatar: null,
          isValid: false,
          error: 'Invalid Ethereum address'
        };
      }

      // Check cache first
      const cacheKey = `addr_${address.toLowerCase()}`;
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }

      if (!this.provider) {
        return {
          address,
          name: null,
          avatar: null,
          isValid: false,
          error: 'ENS provider not available'
        };
      }

      // Reverse resolve address
      const ensName = await this.provider.lookupAddress(address);
      
      if (!ensName) {
        const result: ENSResolution = {
          address,
          name: null,
          avatar: null,
          isValid: true, // Address is valid, just no ENS name
          error: 'No ENS name found for this address'
        };
        
        // Cache negative result for shorter time
        this.cache.set(cacheKey, result);
        setTimeout(() => this.cache.delete(cacheKey), 2 * 60 * 1000); // 2 minutes
        
        return result;
      }

      // Try to get avatar (optional)
      let avatar: string | null = null;
      try {
        avatar = await this.provider.getAvatar(ensName);
      } catch (error) {
        console.log('Could not resolve avatar for', ensName);
      }

      const result: ENSResolution = {
        address,
        name: ensName,
        avatar,
        isValid: true
      };

      // Cache successful result
      this.cache.set(cacheKey, result);
      setTimeout(() => this.cache.delete(cacheKey), this.CACHE_TTL);

      return result;
    } catch (error) {
      console.error('Error resolving address to ENS:', error);
      return {
        address,
        name: null,
        avatar: null,
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate ENS name format
   */
  private isValidENSName(name: string): boolean {
    // Basic ENS name validation
    return /^[a-zA-Z0-9-]+\.eth$/.test(name) && name.length >= 7; // minimum: "a.eth"
  }

  /**
   * Check if input looks like an ENS name
   */
  isENSName(input: string): boolean {
    return input.endsWith('.eth') && this.isValidENSName(input);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const ensService = new ENSService();
