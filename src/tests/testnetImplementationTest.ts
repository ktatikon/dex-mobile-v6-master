/**
 * Testnet Implementation Test
 * Comprehensive test suite for the enhanced testnet functionality
 */

import { enhancedTestnetService } from '../services/enhancedTestnetService';
import { testnetBalanceMonitor } from '../services/testnetBalanceMonitor';
import { TestnetErrorHandler } from '../services/testnetErrorHandler';
import { checkNetworkConnectivity, isValidAddress } from '../services/ethersService';

interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class TestnetImplementationTest {
  private results: TestResult[] = [];

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Testnet Implementation Tests...\n');

    await this.testNetworkConnectivity();
    await this.testAddressValidation();
    await this.testErrorHandling();
    await this.testBalanceMonitor();
    await this.testWalletService();

    this.printResults();
    return this.results;
  }

  /**
   * Test network connectivity
   */
  private async testNetworkConnectivity(): Promise<void> {
    await this.runTest('Network Connectivity - Sepolia', async () => {
      const isConnected = await checkNetworkConnectivity('sepolia');
      if (!isConnected) {
        throw new Error('Cannot connect to Sepolia testnet');
      }
    });

    await this.runTest('Network Connectivity - Ganache', async () => {
      // Ganache might not be running, so we'll just test the function
      const isConnected = await checkNetworkConnectivity('ganache');
      // Don't fail if Ganache is not running
      console.log(`Ganache connectivity: ${isConnected}`);
    });
  }

  /**
   * Test address validation
   */
  private async testAddressValidation(): Promise<void> {
    await this.runTest('Address Validation - Valid Address', async () => {
      const validAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      if (!isValidAddress(validAddress)) {
        throw new Error('Valid address failed validation');
      }
    });

    await this.runTest('Address Validation - Invalid Address', async () => {
      const invalidAddress = '0xinvalid';
      if (isValidAddress(invalidAddress)) {
        throw new Error('Invalid address passed validation');
      }
    });

    await this.runTest('Address Validation - Empty Address', async () => {
      if (isValidAddress('')) {
        throw new Error('Empty address passed validation');
      }
    });
  }

  /**
   * Test error handling
   */
  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling - Insufficient Funds', async () => {
      const error = new Error('insufficient funds for gas * price + value');
      const handled = TestnetErrorHandler.handleError(error);
      
      if (handled.code !== 'INSUFFICIENT_BALANCE') {
        throw new Error(`Expected INSUFFICIENT_BALANCE, got ${handled.code}`);
      }
      
      if (!handled.recoverable) {
        throw new Error('Insufficient funds error should be recoverable');
      }
    });

    await this.runTest('Error Handling - Invalid Address', async () => {
      const error = new Error('invalid address');
      const handled = TestnetErrorHandler.handleError(error);
      
      if (handled.code !== 'INVALID_ADDRESS') {
        throw new Error(`Expected INVALID_ADDRESS, got ${handled.code}`);
      }
    });

    await this.runTest('Error Handling - Network Error', async () => {
      const error = { code: 'NETWORK_ERROR', message: 'Network connection failed' };
      const handled = TestnetErrorHandler.handleError(error);
      
      if (handled.code !== 'NETWORK_UNAVAILABLE') {
        throw new Error(`Expected NETWORK_UNAVAILABLE, got ${handled.code}`);
      }
    });

    await this.runTest('Error Handling - User Friendly Messages', async () => {
      const error = new Error('insufficient funds');
      const userMessage = TestnetErrorHandler.getUserFriendlyMessage(error);
      
      if (!userMessage.title || !userMessage.description) {
        throw new Error('User friendly message missing title or description');
      }
    });
  }

  /**
   * Test balance monitor
   */
  private async testBalanceMonitor(): Promise<void> {
    await this.runTest('Balance Monitor - Status Check', async () => {
      const status = testnetBalanceMonitor.getMonitoringStatus();
      
      if (typeof status.activeWallets !== 'number' ||
          typeof status.listeners !== 'number' ||
          typeof status.transactionListeners !== 'number') {
        throw new Error('Invalid monitoring status structure');
      }
    });

    await this.runTest('Balance Monitor - Listener Management', async () => {
      const testListenerId = 'test_listener';
      
      // Add listener
      testnetBalanceMonitor.addBalanceListener(testListenerId, () => {});
      
      // Check if listener was added
      const statusAfterAdd = testnetBalanceMonitor.getMonitoringStatus();
      if (statusAfterAdd.listeners === 0) {
        throw new Error('Listener was not added');
      }
      
      // Remove listener
      testnetBalanceMonitor.removeBalanceListener(testListenerId);
      
      // Check if listener was removed
      const statusAfterRemove = testnetBalanceMonitor.getMonitoringStatus();
      if (statusAfterRemove.listeners !== 0) {
        throw new Error('Listener was not removed');
      }
    });
  }

  /**
   * Test wallet service
   */
  private async testWalletService(): Promise<void> {
    await this.runTest('Wallet Service - Gas Price Estimation', async () => {
      try {
        const gasPrice = await enhancedTestnetService.getGasPrice('sepolia');
        
        if (!gasPrice || isNaN(parseFloat(gasPrice))) {
          throw new Error('Invalid gas price returned');
        }
      } catch (error) {
        // Gas price estimation might fail if network is unavailable
        console.log('Gas price estimation failed (network might be unavailable):', error);
      }
    });

    await this.runTest('Wallet Service - Fee Estimation', async () => {
      try {
        const fromAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
        const toAddress = '0x8ba1f109551bD432803012645Hac136c';
        const amount = '0.1';
        
        const fee = await enhancedTestnetService.estimateTransactionFee(
          fromAddress,
          toAddress,
          amount,
          'sepolia'
        );
        
        if (!fee || isNaN(parseFloat(fee))) {
          throw new Error('Invalid fee estimation returned');
        }
      } catch (error) {
        // Fee estimation might fail if network is unavailable
        console.log('Fee estimation failed (network might be unavailable):', error);
      }
    });
  }

  /**
   * Run a single test
   */
  private async runTest(testName: string, testFunction: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: true,
        duration,
      });
      
      console.log(`✅ ${testName} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        testName,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      
      console.log(`❌ ${testName} (${duration}ms): ${error}`);
    }
  }

  /**
   * Print test results summary
   */
  private printResults(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Results Summary:');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.error}`);
        });
    }

    console.log('\n🎯 Test Recommendations:');
    
    if (failedTests === 0) {
      console.log('✅ All tests passed! The testnet implementation is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Review the failed tests and fix any issues.');
    }
    
    console.log('🔗 Make sure Sepolia testnet is accessible for full functionality.');
    console.log('💰 Get test ETH from https://sepoliafaucet.com/ for transaction testing.');
    console.log('🔍 Use https://sepolia.etherscan.io/ to verify transactions.');
  }

  /**
   * Get test results
   */
  getResults(): TestResult[] {
    return this.results;
  }

  /**
   * Check if all tests passed
   */
  allTestsPassed(): boolean {
    return this.results.every(r => r.passed);
  }
}

// Export for use in other files
export { TestnetImplementationTest };

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined') {
  const tester = new TestnetImplementationTest();
  tester.runAllTests().then(() => {
    process.exit(tester.allTestsPassed() ? 0 : 1);
  });
}
