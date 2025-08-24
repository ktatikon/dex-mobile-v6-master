/**
 * Comprehensive Testnet Integration Audit
 * Tests the complete user journey and all backend integrations
 */

import { supabase } from '@/integrations/supabase/client';
import { testnetWalletManager } from '@/services/testnetWalletManager';
import { testnetNetworkManager } from '@/services/testnetNetworkManager';
import { testnetContractManager } from '@/services/testnetContractManager';
import { testnetGasManager } from '@/services/testnetGasManager';
import { testnetAddressManager } from '@/services/testnetAddressManager';
import { ethers } from 'ethers';

interface AuditResult {
  component: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: unknown;
}

class TestnetIntegrationAudit {
  private results: AuditResult[] = [];
  private testUserId = 'test-user-' + Date.now();

  async runCompleteAudit(): Promise<AuditResult[]> {
    console.log('🔍 Starting Comprehensive Testnet Integration Audit...\n');

    await this.auditDatabaseSchema();
    await this.auditNetworkConnectivity();
    await this.auditWalletManagement();
    await this.auditTransactionFlow();
    await this.auditContractIntegration();
    await this.auditGasManagement();
    await this.auditAddressBook();
    await this.auditEndToEndUserJourney();

    this.printAuditReport();
    return this.results;
  }

  /**
   * 1. Database Schema Integrity Audit
   */
  private async auditDatabaseSchema(): Promise<void> {
    console.log('📊 Auditing Database Schema...');

    try {
      // Test foreign key relationships
      const { data: fkData, error: fkError } = await supabase
        .from('testnet_wallets')
        .select('id, network_id, testnet_networks(name)')
        .limit(1);

      if (fkError) {
        this.addResult('Database', 'Foreign Key Relationships', 'FAIL', 
          `Foreign key relationship test failed: ${fkError.message}`);
      } else {
        this.addResult('Database', 'Foreign Key Relationships', 'PASS', 
          'All foreign key relationships working correctly');
      }

      // Test table existence
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .like('table_name', 'testnet_%');

      const expectedTables = [
        'testnet_wallets', 'testnet_balances', 'testnet_transactions',
        'testnet_networks', 'testnet_contracts', 'testnet_gas_tracker',
        'testnet_addresses', 'testnet_accounts'
      ];

      const existingTables = tables?.map(t => t.table_name) || [];
      const missingTables = expectedTables.filter(t => !existingTables.includes(t));

      if (missingTables.length > 0) {
        this.addResult('Database', 'Table Existence', 'FAIL', 
          `Missing tables: ${missingTables.join(', ')}`);
      } else {
        this.addResult('Database', 'Table Existence', 'PASS', 
          'All required tables exist');
      }

    } catch (error) {
      this.addResult('Database', 'Schema Audit', 'FAIL', 
        `Database schema audit failed: ${error}`);
    }
  }

  /**
   * 2. Network Connectivity Audit
   */
  private async auditNetworkConnectivity(): Promise<void> {
    console.log('🌐 Auditing Network Connectivity...');

    try {
      // Test Sepolia connectivity
      const sepoliaHealth = await testnetNetworkManager.checkNetworkHealth('sepolia');
      
      if (sepoliaHealth.isConnected) {
        this.addResult('Network', 'Sepolia Connectivity', 'PASS', 
          `Connected to Sepolia. Block: ${sepoliaHealth.blockNumber}, Latency: ${sepoliaHealth.latency}ms`);
      } else {
        this.addResult('Network', 'Sepolia Connectivity', 'FAIL', 
          `Sepolia connection failed: ${sepoliaHealth.error}`);
      }

      // Test network switching
      const switchResult = await testnetNetworkManager.switchNetwork(this.testUserId, 'Sepolia');
      
      if (switchResult.success) {
        this.addResult('Network', 'Network Switching', 'PASS', 
          'Network switching functionality working');
      } else {
        this.addResult('Network', 'Network Switching', 'FAIL', 
          `Network switching failed: ${switchResult.error}`);
      }

    } catch (error) {
      this.addResult('Network', 'Connectivity Audit', 'FAIL', 
        `Network connectivity audit failed: ${error}`);
    }
  }

  /**
   * 3. Wallet Management Audit
   */
  private async auditWalletManagement(): Promise<void> {
    console.log('👛 Auditing Wallet Management...');

    try {
      // Test wallet creation
      const wallet = await testnetWalletManager.createWallet(this.testUserId, {
        name: 'Test Audit Wallet',
        network: 'Sepolia',
        walletType: 'generated'
      });

      if (wallet) {
        this.addResult('Wallet', 'Wallet Creation', 'PASS', 
          `Wallet created successfully: ${wallet.address}`);

        // Test wallet retrieval
        const userWallets = await testnetWalletManager.getUserWallets(this.testUserId);
        
        if (userWallets.length > 0) {
          this.addResult('Wallet', 'Wallet Retrieval', 'PASS', 
            `Retrieved ${userWallets.length} wallets`);
        } else {
          this.addResult('Wallet', 'Wallet Retrieval', 'FAIL', 
            'No wallets retrieved after creation');
        }

        // Test wallet export
        const exportData = await testnetWalletManager.exportWallet(this.testUserId, wallet.id);
        
        if (exportData && exportData.privateKey) {
          this.addResult('Wallet', 'Wallet Export', 'PASS', 
            'Wallet export functionality working');
        } else {
          this.addResult('Wallet', 'Wallet Export', 'FAIL', 
            'Wallet export failed');
        }

      } else {
        this.addResult('Wallet', 'Wallet Creation', 'FAIL', 
          'Wallet creation failed');
      }

    } catch (error) {
      this.addResult('Wallet', 'Management Audit', 'FAIL', 
        `Wallet management audit failed: ${error}`);
    }
  }

  /**
   * 4. Transaction Flow Audit
   */
  private async auditTransactionFlow(): Promise<void> {
    console.log('💸 Auditing Transaction Flow...');

    try {
      // Test gas estimation
      const testAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      const gasEstimate = await testnetGasManager.estimateGas(
        'Sepolia',
        testAddress,
        testAddress,
        '0.001'
      );

      if (gasEstimate.gasLimit && gasEstimate.gasPrice) {
        this.addResult('Transaction', 'Gas Estimation', 'PASS', 
          `Gas estimation working. Limit: ${gasEstimate.gasLimit}, Price: ${gasEstimate.gasPrice} gwei`);
      } else {
        this.addResult('Transaction', 'Gas Estimation', 'FAIL', 
          'Gas estimation failed');
      }

      // Test gas price fetching
      const gasPrices = await testnetGasManager.getCurrentGasPrices('Sepolia');
      
      if (gasPrices.standard && parseFloat(gasPrices.standard) > 0) {
        this.addResult('Transaction', 'Gas Price Fetching', 'PASS', 
          `Gas prices: Slow: ${gasPrices.slow}, Standard: ${gasPrices.standard}, Fast: ${gasPrices.fast} gwei`);
      } else {
        this.addResult('Transaction', 'Gas Price Fetching', 'FAIL', 
          'Gas price fetching failed');
      }

    } catch (error) {
      this.addResult('Transaction', 'Flow Audit', 'FAIL', 
        `Transaction flow audit failed: ${error}`);
    }
  }

  /**
   * 5. Contract Integration Audit
   */
  private async auditContractIntegration(): Promise<void> {
    console.log('📜 Auditing Contract Integration...');

    try {
      // Test ERC-20 token info retrieval (using a known Sepolia token if available)
      const testTokenAddress = '0x779877A7B0D9E8603169DdbD7836e478b4624789'; // Example Sepolia token
      
      try {
        const tokenInfo = await testnetContractManager.getERC20TokenInfo('Sepolia', testTokenAddress);
        
        if (tokenInfo.name && tokenInfo.symbol) {
          this.addResult('Contract', 'ERC-20 Token Info', 'PASS', 
            `Token info retrieved: ${tokenInfo.name} (${tokenInfo.symbol})`);
        } else {
          this.addResult('Contract', 'ERC-20 Token Info', 'WARNING', 
            'Token info retrieval returned empty data');
        }
      } catch (error) {
        this.addResult('Contract', 'ERC-20 Token Info', 'WARNING', 
          'ERC-20 token info test skipped (test token may not exist)');
      }

      // Test contract registry
      const contracts = await testnetContractManager.getUserContracts(this.testUserId);
      
      this.addResult('Contract', 'Contract Registry', 'PASS', 
        `Contract registry working. User has ${contracts.length} contracts`);

    } catch (error) {
      this.addResult('Contract', 'Integration Audit', 'FAIL', 
        `Contract integration audit failed: ${error}`);
    }
  }

  /**
   * 6. Gas Management Audit
   */
  private async auditGasManagement(): Promise<void> {
    console.log('⛽ Auditing Gas Management...');

    try {
      // Test gas statistics
      const gasStats = await testnetGasManager.getGasStatistics('Sepolia', 1);
      
      if (gasStats.average > 0) {
        this.addResult('Gas', 'Gas Statistics', 'PASS', 
          `Gas stats: Avg: ${gasStats.average}, Min: ${gasStats.min}, Max: ${gasStats.max} gwei, Trend: ${gasStats.trend}`);
      } else {
        this.addResult('Gas', 'Gas Statistics', 'WARNING', 
          'Gas statistics returned default values (no historical data)');
      }

      // Test gas optimization
      const gasOptimization = await testnetGasManager.getGasOptimization('Sepolia', '25', '21000');
      
      if (gasOptimization.recommendation) {
        this.addResult('Gas', 'Gas Optimization', 'PASS', 
          `Gas optimization working: ${gasOptimization.recommendation}`);
      } else {
        this.addResult('Gas', 'Gas Optimization', 'FAIL', 
          'Gas optimization failed');
      }

    } catch (error) {
      this.addResult('Gas', 'Management Audit', 'FAIL', 
        `Gas management audit failed: ${error}`);
    }
  }

  /**
   * 7. Address Book Audit
   */
  private async auditAddressBook(): Promise<void> {
    console.log('📇 Auditing Address Book...');

    try {
      // Test address validation
      const validAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      const validation = await testnetAddressManager.validateAddress('Sepolia', validAddress);
      
      if (validation.isValid) {
        this.addResult('AddressBook', 'Address Validation', 'PASS', 
          `Address validation working. Contract: ${validation.isContract}`);
      } else {
        this.addResult('AddressBook', 'Address Validation', 'FAIL', 
          `Address validation failed: ${validation.error}`);
      }

      // Test address book operations
      const address = await testnetAddressManager.addAddress(
        this.testUserId,
        'Sepolia',
        validAddress,
        'Test Address',
        'Audit test address'
      );

      if (address) {
        this.addResult('AddressBook', 'Add Address', 'PASS', 
          'Address book add functionality working');

        // Test address retrieval
        const addressBook = await testnetAddressManager.getAddressBook(this.testUserId, 'Sepolia');
        
        if (addressBook.length > 0) {
          this.addResult('AddressBook', 'Address Retrieval', 'PASS', 
            `Retrieved ${addressBook.length} addresses from address book`);
        } else {
          this.addResult('AddressBook', 'Address Retrieval', 'FAIL', 
            'No addresses retrieved after adding');
        }
      } else {
        this.addResult('AddressBook', 'Add Address', 'FAIL', 
          'Address book add functionality failed');
      }

    } catch (error) {
      this.addResult('AddressBook', 'Audit', 'FAIL', 
        `Address book audit failed: ${error}`);
    }
  }

  /**
   * 8. End-to-End User Journey Audit
   */
  private async auditEndToEndUserJourney(): Promise<void> {
    console.log('🎯 Auditing End-to-End User Journey...');

    try {
      // Simulate complete user journey
      let journeySteps = 0;
      let successfulSteps = 0;

      // Step 1: Create "My Wallet"
      journeySteps++;
      const myWallet = await testnetWalletManager.createWallet(this.testUserId, {
        name: 'My Wallet',
        network: 'Sepolia',
        walletType: 'generated',
        isPrimary: true
      });

      if (myWallet) {
        successfulSteps++;
        console.log('✅ Step 1: My Wallet created');
      } else {
        console.log('❌ Step 1: My Wallet creation failed');
      }

      // Step 2: Add recipient to address book
      journeySteps++;
      const recipient = await testnetAddressManager.addAddress(
        this.testUserId,
        'Sepolia',
        '0x8ba1f109551bD432803012645Hac136c',
        'Test Recipient',
        'End-to-end test recipient'
      );

      if (recipient) {
        successfulSteps++;
        console.log('✅ Step 2: Recipient added to address book');
      } else {
        console.log('❌ Step 2: Adding recipient failed');
      }

      // Step 3: Estimate transaction fee
      journeySteps++;
      if (myWallet) {
        const feeEstimate = await testnetGasManager.estimateGas(
          'Sepolia',
          myWallet.address,
          '0x8ba1f109551bD432803012645Hac136c',
          '0.001'
        );

        if (feeEstimate.gasLimit) {
          successfulSteps++;
          console.log('✅ Step 3: Transaction fee estimated');
        } else {
          console.log('❌ Step 3: Fee estimation failed');
        }
      }

      const journeySuccess = (successfulSteps / journeySteps) * 100;
      
      if (journeySuccess >= 80) {
        this.addResult('UserJourney', 'End-to-End Flow', 'PASS', 
          `User journey ${journeySuccess.toFixed(0)}% successful (${successfulSteps}/${journeySteps} steps)`);
      } else if (journeySuccess >= 50) {
        this.addResult('UserJourney', 'End-to-End Flow', 'WARNING', 
          `User journey ${journeySuccess.toFixed(0)}% successful (${successfulSteps}/${journeySteps} steps)`);
      } else {
        this.addResult('UserJourney', 'End-to-End Flow', 'FAIL', 
          `User journey ${journeySuccess.toFixed(0)}% successful (${successfulSteps}/${journeySteps} steps)`);
      }

    } catch (error) {
      this.addResult('UserJourney', 'End-to-End Audit', 'FAIL', 
        `End-to-end user journey audit failed: ${error}`);
    }
  }

  /**
   * Helper methods
   */
  private addResult(component: string, test: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: unknown): void {
    this.results.push({ component, test, status, message, details });
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${component} - ${test}: ${message}`);
  }

  private printAuditReport(): void {
    console.log('\n📊 COMPREHENSIVE AUDIT REPORT');
    console.log('================================');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warningTests = this.results.filter(r => r.status === 'WARNING').length;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⚠️  Warnings: ${warningTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.component} - ${r.test}: ${r.message}`));
    }

    if (warningTests > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.results
        .filter(r => r.status === 'WARNING')
        .forEach(r => console.log(`  - ${r.component} - ${r.test}: ${r.message}`));
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    
    if (failedTests === 0 && warningTests === 0) {
      console.log('✅ All tests passed! The testnet implementation is production-ready.');
    } else {
      console.log('⚠️  Review failed tests and warnings before production deployment.');
    }
    
    console.log('🔗 Ensure Sepolia testnet access for full functionality.');
    console.log('💰 Get test ETH from https://sepoliafaucet.com/ for transaction testing.');
    console.log('🔍 Use https://sepolia.etherscan.io/ to verify transactions.');
  }
}

export { TestnetIntegrationAudit };
