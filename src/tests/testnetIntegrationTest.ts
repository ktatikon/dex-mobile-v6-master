/**
 * Testnet Integration Test
 * Verify that all enhanced services are properly integrated
 */

import { testnetNetworkManager } from '@/services/testnetNetworkManager';
import { testnetGasManager } from '@/services/testnetGasManager';

export async function runIntegrationTest(): Promise<boolean> {
  console.log('🧪 Running Testnet Integration Test...');
  
  try {
    // Test 1: Network Manager
    console.log('📡 Testing Network Manager...');
    const networks = await testnetNetworkManager.getNetworks(true);
    console.log(`✅ Found ${networks.length} active networks`);
    
    if (networks.length === 0) {
      console.error('❌ No networks found');
      return false;
    }
    
    // Test 2: Network Health Check
    console.log('🏥 Testing Network Health Check...');
    const sepoliaNetwork = networks.find(n => n.name === 'Sepolia');
    if (sepoliaNetwork) {
      const health = await testnetNetworkManager.checkNetworkHealth(sepoliaNetwork.id);
      console.log(`✅ Sepolia health check: ${health.isConnected ? 'Connected' : 'Disconnected'}`);
    }
    
    // Test 3: Gas Manager
    console.log('⛽ Testing Gas Manager...');
    const gasPrices = await testnetGasManager.getCurrentGasPrices('Sepolia');
    console.log(`✅ Gas prices - Standard: ${gasPrices.standard} gwei`);
    
    // Test 4: Gas Statistics
    console.log('📊 Testing Gas Statistics...');
    const gasStats = await testnetGasManager.getGasStatistics('Sepolia', 1);
    console.log(`✅ Gas stats - Average: ${gasStats.average} gwei, Trend: ${gasStats.trend}`);
    
    console.log('🎉 All integration tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  }
}

// Export for use in development
if (typeof window !== 'undefined') {
  (window as any).runTestnetIntegrationTest = runIntegrationTest;
}
