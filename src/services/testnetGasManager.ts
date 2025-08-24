/**
 * Testnet Gas Manager Service
 * Advanced gas price tracking, estimation, and optimization
 */

import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import { testnetNetworkManager } from './testnetNetworkManager';

export interface GasPrice {
  slow: string;
  standard: string;
  fast: string;
  instant: string;
  timestamp: Date;
}

export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  totalCost: string;
  totalCostUSD?: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface GasOptimization {
  currentGas: string;
  optimizedGas: string;
  savings: string;
  savingsPercent: number;
  recommendation: string;
}

export interface GasTracker {
  networkId: string;
  gasPriceGwei: number;
  gasPriceWei: string;
  blockNumber: number;
  transactionCount: number;
  avgGasUsed?: number;
  maxGasUsed?: number;
  minGasUsed?: number;
  timestamp: Date;
}

class TestnetGasManager {
  private gasTrackingInterval: NodeJS.Timeout | null = null;
  private readonly GAS_TRACKING_INTERVAL = 15000; // 15 seconds
  private readonly ETH_USD_PRICE = 2000; // Simplified USD price for testnet

  /**
   * Get current gas prices for a network
   */
  async getCurrentGasPrices(networkName: string): Promise<GasPrice> {
    try {
      const provider = await testnetNetworkManager.getNetworkProvider(networkName);
      const currentGasPrice = await provider.getGasPrice();
      const gasPriceGwei = parseFloat(ethers.utils.formatUnits(currentGasPrice, 'gwei'));

      // Calculate different speed tiers
      const slow = (gasPriceGwei * 0.8).toFixed(2);
      const standard = gasPriceGwei.toFixed(2);
      const fast = (gasPriceGwei * 1.2).toFixed(2);
      const instant = (gasPriceGwei * 1.5).toFixed(2);

      return {
        slow,
        standard,
        fast,
        instant,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting current gas prices:', error);
      // Return fallback prices
      return {
        slow: '10',
        standard: '20',
        fast: '30',
        instant: '40',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    networkName: string,
    fromAddress: string,
    toAddress: string,
    value?: string,
    data?: string
  ): Promise<GasEstimate> {
    try {
      const provider = await testnetNetworkManager.getNetworkProvider(networkName);
      
      // Prepare transaction object
      const txObject: Record<string, unknown> = {
        from: fromAddress,
        to: toAddress,
      };

      if (value) {
        txObject.value = ethers.utils.parseEther(value);
      }

      if (data) {
        txObject.data = data;
      }

      // Estimate gas limit
      const gasLimit = await provider.estimateGas(txObject);
      
      // Get current gas price
      const gasPrice = await provider.getGasPrice();
      
      // Calculate total cost
      const totalCostWei = gasLimit.mul(gasPrice);
      const totalCost = ethers.utils.formatEther(totalCostWei);
      const totalCostUSD = (parseFloat(totalCost) * this.ETH_USD_PRICE).toFixed(2);

      // Determine confidence based on gas limit
      let confidence: 'low' | 'medium' | 'high' = 'medium';
      if (gasLimit.lt(21000)) {
        confidence = 'high';
      } else if (gasLimit.gt(100000)) {
        confidence = 'low';
      }

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
        totalCost,
        totalCostUSD,
        confidence,
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      // Return fallback estimate
      return {
        gasLimit: '21000',
        gasPrice: '20',
        totalCost: '0.00042',
        totalCostUSD: '0.84',
        confidence: 'low',
      };
    }
  }

  /**
   * Get gas optimization suggestions
   */
  async getGasOptimization(
    networkName: string,
    currentGasPrice: string,
    gasLimit: string
  ): Promise<GasOptimization> {
    try {
      const gasPrices = await this.getCurrentGasPrices(networkName);
      const currentGasPriceNum = parseFloat(currentGasPrice);
      const standardGasPrice = parseFloat(gasPrices.standard);

      let optimizedGas = gasPrices.standard;
      let recommendation = 'Use standard gas price for optimal balance of speed and cost';

      // Determine optimization
      if (currentGasPriceNum > standardGasPrice * 1.5) {
        optimizedGas = gasPrices.fast;
        recommendation = 'Current gas price is very high. Consider using fast gas price instead';
      } else if (currentGasPriceNum > standardGasPrice * 1.2) {
        optimizedGas = gasPrices.standard;
        recommendation = 'Current gas price is high. Standard gas price recommended';
      } else if (currentGasPriceNum < standardGasPrice * 0.8) {
        optimizedGas = gasPrices.slow;
        recommendation = 'Current gas price is low. You can use slow gas price to save more';
      }

      // Calculate savings
      const currentCost = parseFloat(currentGasPrice) * parseFloat(gasLimit);
      const optimizedCost = parseFloat(optimizedGas) * parseFloat(gasLimit);
      const savings = (currentCost - optimizedCost).toFixed(9);
      const savingsPercent = ((currentCost - optimizedCost) / currentCost * 100);

      return {
        currentGas: currentGasPrice,
        optimizedGas,
        savings,
        savingsPercent: Math.round(savingsPercent * 100) / 100,
        recommendation,
      };
    } catch (error) {
      console.error('Error getting gas optimization:', error);
      return {
        currentGas: currentGasPrice,
        optimizedGas: currentGasPrice,
        savings: '0',
        savingsPercent: 0,
        recommendation: 'Unable to optimize gas price at this time',
      };
    }
  }

  /**
   * Track gas prices and store in database
   */
  async trackGasPrices(networkName: string): Promise<void> {
    try {
      const network = await testnetNetworkManager.getNetworkByName(networkName);
      if (!network) {
        throw new Error(`Network ${networkName} not found`);
      }

      const provider = await testnetNetworkManager.getNetworkProvider(networkName);
      
      // Get current block and gas price
      const [blockNumber, gasPrice, block] = await Promise.all([
        provider.getBlockNumber(),
        provider.getGasPrice(),
        provider.getBlock('latest', true),
      ]);

      const gasPriceGwei = parseFloat(ethers.utils.formatUnits(gasPrice, 'gwei'));
      const gasPriceWei = gasPrice.toString();

      // Calculate gas usage statistics from block transactions
      let avgGasUsed: number | undefined;
      let maxGasUsed: number | undefined;
      let minGasUsed: number | undefined;

      if (block.transactions.length > 0) {
        const gasUsages = await Promise.all(
          block.transactions.slice(0, 10).map(async (tx: { hash: string }) => {
            try {
              const receipt = await provider.getTransactionReceipt(tx.hash);
              return receipt.gasUsed.toNumber();
            } catch {
              return null;
            }
          })
        );

        const validGasUsages = gasUsages.filter(gas => gas !== null) as number[];
        
        if (validGasUsages.length > 0) {
          avgGasUsed = Math.round(validGasUsages.reduce((a, b) => a + b, 0) / validGasUsages.length);
          maxGasUsed = Math.max(...validGasUsages);
          minGasUsed = Math.min(...validGasUsages);
        }
      }

      // Store gas tracking data
      await supabase
        .from('testnet_gas_tracker')
        .insert({
          network_id: network.id,
          gas_price_gwei: gasPriceGwei,
          gas_price_wei: gasPriceWei,
          block_number: blockNumber,
          transaction_count: block.transactions.length,
          avg_gas_used: avgGasUsed,
          max_gas_used: maxGasUsed,
          min_gas_used: minGasUsed,
        });

    } catch (error) {
      console.error(`Error tracking gas prices for ${networkName}:`, error);
    }
  }

  /**
   * Get gas price history
   */
  async getGasPriceHistory(
    networkName: string,
    hours: number = 24
  ): Promise<GasTracker[]> {
    try {
      const network = await testnetNetworkManager.getNetworkByName(networkName);
      if (!network) {
        throw new Error(`Network ${networkName} not found`);
      }

      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const { data: gasData, error } = await supabase
        .from('testnet_gas_tracker')
        .select('*')
        .eq('network_id', network.id)
        .gte('timestamp', since.toISOString())
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        throw new Error(`Failed to fetch gas price history: ${error.message}`);
      }

      return gasData.map(data => ({
        networkId: data.network_id,
        gasPriceGwei: data.gas_price_gwei,
        gasPriceWei: data.gas_price_wei,
        blockNumber: data.block_number,
        transactionCount: data.transaction_count,
        avgGasUsed: data.avg_gas_used,
        maxGasUsed: data.max_gas_used,
        minGasUsed: data.min_gas_used,
        timestamp: new Date(data.timestamp),
      }));
    } catch (error) {
      console.error('Error fetching gas price history:', error);
      return [];
    }
  }

  /**
   * Start gas price tracking
   */
  startGasTracking(networks: string[] = ['Sepolia']): void {
    if (this.gasTrackingInterval) {
      this.stopGasTracking();
    }

    this.gasTrackingInterval = setInterval(async () => {
      for (const network of networks) {
        try {
          await this.trackGasPrices(network);
        } catch (error) {
          console.error(`Gas tracking failed for ${network}:`, error);
        }
      }
    }, this.GAS_TRACKING_INTERVAL);

    console.log(`Gas tracking started for networks: ${networks.join(', ')}`);
  }

  /**
   * Stop gas price tracking
   */
  stopGasTracking(): void {
    if (this.gasTrackingInterval) {
      clearInterval(this.gasTrackingInterval);
      this.gasTrackingInterval = null;
      console.log('Gas tracking stopped');
    }
  }

  /**
   * Get gas price statistics
   */
  async getGasStatistics(networkName: string, hours: number = 24): Promise<{
    average: number;
    min: number;
    max: number;
    median: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    try {
      const history = await this.getGasPriceHistory(networkName, hours);
      
      if (history.length === 0) {
        return {
          average: 20,
          min: 10,
          max: 30,
          median: 20,
          trend: 'stable',
        };
      }

      const prices = history.map(h => h.gasPriceGwei).sort((a, b) => a - b);
      const average = prices.reduce((a, b) => a + b, 0) / prices.length;
      const min = prices[0];
      const max = prices[prices.length - 1];
      const median = prices[Math.floor(prices.length / 2)];

      // Determine trend (compare first and last quarter)
      const firstQuarter = history.slice(-Math.floor(history.length / 4));
      const lastQuarter = history.slice(0, Math.floor(history.length / 4));
      
      const firstAvg = firstQuarter.reduce((a, b) => a + b.gasPriceGwei, 0) / firstQuarter.length;
      const lastAvg = lastQuarter.reduce((a, b) => a + b.gasPriceGwei, 0) / lastQuarter.length;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      const change = (lastAvg - firstAvg) / firstAvg;
      
      if (change > 0.1) {
        trend = 'up';
      } else if (change < -0.1) {
        trend = 'down';
      }

      return {
        average: Math.round(average * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        median: Math.round(median * 100) / 100,
        trend,
      };
    } catch (error) {
      console.error('Error getting gas statistics:', error);
      return {
        average: 20,
        min: 10,
        max: 30,
        median: 20,
        trend: 'stable',
      };
    }
  }
}

export const testnetGasManager = new TestnetGasManager();
