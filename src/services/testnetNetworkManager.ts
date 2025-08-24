/**
 * Testnet Network Manager Service
 * Comprehensive network management with status monitoring and health checks
 */

import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';

export interface TestnetNetwork {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  rpcUrlBackup?: string;
  blockExplorer: string;
  symbol: string;
  faucetUrl?: string;
  gasPriceGwei: string;
  gasLimit: string;
  isTestnet: boolean;
  isActive: boolean;
  lastHealthCheck?: Date;
  healthStatus: 'healthy' | 'degraded' | 'down' | 'unknown';
  createdAt: Date;
  updatedAt: Date;
}

export interface NetworkHealthCheck {
  networkId: string;
  isConnected: boolean;
  blockNumber?: number;
  latency: number;
  gasPrice?: string;
  error?: string;
  timestamp: Date;
}

export interface NetworkSwitchResult {
  success: boolean;
  network?: TestnetNetwork;
  error?: string;
}

class TestnetNetworkManager {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly CONNECTION_TIMEOUT = 10000; // 10 seconds

  /**
   * Get all available networks
   */
  async getNetworks(activeOnly: boolean = false): Promise<TestnetNetwork[]> {
    try {
      let query = supabase
        .from('testnet_networks')
        .select('*');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data: networks, error } = await query.order('name');

      if (error) {
        throw new Error(`Failed to fetch networks: ${error.message}`);
      }

      return networks.map(network => this.mapDatabaseNetworkToNetwork(network));
    } catch (error) {
      console.error('Error fetching networks:', error);
      throw error;
    }
  }

  /**
   * Get network by name
   */
  async getNetworkByName(name: string): Promise<TestnetNetwork | null> {
    try {
      const { data: network, error } = await supabase
        .from('testnet_networks')
        .select('*')
        .eq('name', name)
        .single();

      if (error || !network) {
        return null;
      }

      return this.mapDatabaseNetworkToNetwork(network);
    } catch (error) {
      console.error('Error fetching network by name:', error);
      return null;
    }
  }

  /**
   * Get network by chain ID
   */
  async getNetworkByChainId(chainId: number): Promise<TestnetNetwork | null> {
    try {
      const { data: network, error } = await supabase
        .from('testnet_networks')
        .select('*')
        .eq('chain_id', chainId)
        .single();

      if (error || !network) {
        return null;
      }

      return this.mapDatabaseNetworkToNetwork(network);
    } catch (error) {
      console.error('Error fetching network by chain ID:', error);
      return null;
    }
  }

  /**
   * Check network connectivity and health
   */
  async checkNetworkHealth(networkId: string): Promise<NetworkHealthCheck> {
    const startTime = Date.now();
    
    try {
      const network = await this.getNetworkById(networkId);
      if (!network) {
        throw new Error('Network not found');
      }

      // Try primary RPC first
      let provider: ethers.providers.JsonRpcProvider;
      let rpcUrl = network.rpcUrl;
      
      try {
        provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
        await provider.getBlockNumber();
      } catch (primaryError) {
        // Try backup RPC if available
        if (network.rpcUrlBackup) {
          try {
            provider = new ethers.providers.JsonRpcProvider(network.rpcUrlBackup);
            await provider.getBlockNumber();
            rpcUrl = network.rpcUrlBackup;
          } catch (backupError) {
            throw primaryError; // Use primary error if both fail
          }
        } else {
          throw primaryError;
        }
      }

      // Get network information
      const [blockNumber, gasPrice] = await Promise.all([
        provider.getBlockNumber(),
        provider.getGasPrice().catch(() => null)
      ]);

      const latency = Date.now() - startTime;

      const healthCheck: NetworkHealthCheck = {
        networkId,
        isConnected: true,
        blockNumber,
        latency,
        gasPrice: gasPrice ? ethers.utils.formatUnits(gasPrice, 'gwei') : undefined,
        timestamp: new Date(),
      };

      // Update network health status
      await this.updateNetworkHealthStatus(networkId, 'healthy', healthCheck);

      return healthCheck;
    } catch (error) {
      const latency = Date.now() - startTime;
      
      const healthCheck: NetworkHealthCheck = {
        networkId,
        isConnected: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };

      // Update network health status
      await this.updateNetworkHealthStatus(networkId, 'down', healthCheck);

      return healthCheck;
    }
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(userId: string, networkName: string): Promise<NetworkSwitchResult> {
    try {
      const network = await this.getNetworkByName(networkName);
      if (!network) {
        return {
          success: false,
          error: `Network ${networkName} not found`,
        };
      }

      if (!network.isActive) {
        return {
          success: false,
          error: `Network ${networkName} is not active`,
        };
      }

      // Check network health
      const healthCheck = await this.checkNetworkHealth(network.id);
      if (!healthCheck.isConnected) {
        return {
          success: false,
          error: `Network ${networkName} is currently unavailable: ${healthCheck.error}`,
        };
      }

      // Update user's default network
      await supabase
        .from('testnet_accounts')
        .upsert({
          user_id: userId,
          default_network_id: network.id,
          updated_at: new Date().toISOString(),
        });

      return {
        success: true,
        network,
      };
    } catch (error) {
      console.error('Error switching network:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to switch network',
      };
    }
  }

  /**
   * Get user's default network
   */
  async getUserDefaultNetwork(userId: string): Promise<TestnetNetwork | null> {
    try {
      const { data: account, error } = await supabase
        .from('testnet_accounts')
        .select('default_network_id, testnet_networks(*)')
        .eq('user_id', userId)
        .single();

      if (error || !account || !account.testnet_networks) {
        // Return Sepolia as default if no preference set
        return await this.getNetworkByName('Sepolia');
      }

      return this.mapDatabaseNetworkToNetwork(account.testnet_networks);
    } catch (error) {
      console.error('Error fetching user default network:', error);
      return await this.getNetworkByName('Sepolia'); // Fallback to Sepolia
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      this.stopHealthMonitoring();
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const networks = await this.getNetworks(true);
        
        // Check health of all active networks
        const healthChecks = networks.map(network => 
          this.checkNetworkHealth(network.id).catch(error => {
            console.error(`Health check failed for ${network.name}:`, error);
            return null;
          })
        );

        await Promise.all(healthChecks);
      } catch (error) {
        console.error('Error during health monitoring:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL);

    console.log('Network health monitoring started');
  }

  /**
   * Stop periodic health checks
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('Network health monitoring stopped');
    }
  }

  /**
   * Get network provider with fallback
   */
  async getNetworkProvider(networkName: string): Promise<ethers.providers.JsonRpcProvider> {
    const network = await this.getNetworkByName(networkName);
    if (!network) {
      throw new Error(`Network ${networkName} not found`);
    }

    // Try primary RPC first
    try {
      const provider = new ethers.providers.JsonRpcProvider(network.rpcUrl);
      await provider.getBlockNumber(); // Test connection
      return provider;
    } catch (primaryError) {
      // Try backup RPC if available
      if (network.rpcUrlBackup) {
        try {
          const provider = new ethers.providers.JsonRpcProvider(network.rpcUrlBackup);
          await provider.getBlockNumber(); // Test connection
          return provider;
        } catch (backupError) {
          throw new Error(`Both primary and backup RPC endpoints failed for ${networkName}`);
        }
      } else {
        throw new Error(`Primary RPC endpoint failed for ${networkName}: ${primaryError}`);
      }
    }
  }

  /**
   * Add or update network configuration
   */
  async upsertNetwork(networkData: Partial<TestnetNetwork>): Promise<TestnetNetwork> {
    try {
      const { data: network, error } = await supabase
        .from('testnet_networks')
        .upsert({
          ...networkData,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to upsert network: ${error.message}`);
      }

      return this.mapDatabaseNetworkToNetwork(network);
    } catch (error) {
      console.error('Error upserting network:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async getNetworkById(networkId: string): Promise<TestnetNetwork | null> {
    try {
      const { data: network, error } = await supabase
        .from('testnet_networks')
        .select('*')
        .eq('id', networkId)
        .single();

      if (error || !network) {
        return null;
      }

      return this.mapDatabaseNetworkToNetwork(network);
    } catch (error) {
      console.error('Error fetching network by ID:', error);
      return null;
    }
  }

  private async updateNetworkHealthStatus(
    networkId: string, 
    status: 'healthy' | 'degraded' | 'down' | 'unknown',
    healthCheck: NetworkHealthCheck
  ): Promise<void> {
    try {
      await supabase
        .from('testnet_networks')
        .update({
          health_status: status,
          last_health_check: healthCheck.timestamp.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', networkId);
    } catch (error) {
      console.error('Error updating network health status:', error);
    }
  }

  private mapDatabaseNetworkToNetwork(dbNetwork: Record<string, unknown>): TestnetNetwork {
    return {
      id: dbNetwork.id,
      name: dbNetwork.name,
      chainId: dbNetwork.chain_id,
      rpcUrl: dbNetwork.rpc_url,
      rpcUrlBackup: dbNetwork.rpc_url_backup,
      blockExplorer: dbNetwork.block_explorer,
      symbol: dbNetwork.symbol,
      faucetUrl: dbNetwork.faucet_url,
      gasPriceGwei: dbNetwork.gas_price_gwei,
      gasLimit: dbNetwork.gas_limit,
      isTestnet: dbNetwork.is_testnet,
      isActive: dbNetwork.is_active,
      lastHealthCheck: dbNetwork.last_health_check ? new Date(dbNetwork.last_health_check) : undefined,
      healthStatus: dbNetwork.health_status || 'unknown',
      createdAt: new Date(dbNetwork.created_at),
      updatedAt: new Date(dbNetwork.updated_at),
    };
  }
}

export const testnetNetworkManager = new TestnetNetworkManager();
