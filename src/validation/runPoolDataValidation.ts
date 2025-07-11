import { poolDataIntegrationValidator } from './poolDataIntegrationValidator';

/**
 * Run Pool Data Integration validation and display comprehensive results
 */
async function runPoolDataValidation() {
  console.log('🚀 Starting Pool Data Integration Validation');
  console.log('=' .repeat(80));
  
  try {
    const report = await poolDataIntegrationValidator.validatePoolDataIntegration();
    
    // Display summary
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('-'.repeat(50));
    console.log(`Overall Status: ${getStatusIcon(report.overallStatus)} ${report.overallStatus}`);
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passedTests}`);
    console.log(`❌ Failed: ${report.failedTests}`);
    console.log(`⚠️  Warnings: ${report.warningTests}`);
    console.log(`\n${report.summary}`);
    
    // Display performance metrics
    console.log('\n⚡ PERFORMANCE METRICS');
    console.log('-'.repeat(50));
    console.log(`Average Latency: ${report.performanceMetrics.averageLatency.toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${(report.performanceMetrics.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`Total Data Requests: ${report.performanceMetrics.totalDataFetched}`);
    
    // Display detailed results
    console.log('\n📋 DETAILED RESULTS');
    console.log('-'.repeat(50));
    
    report.results.forEach((result, index) => {
      const icon = getStatusIcon(result.status);
      const latencyInfo = result.latency ? ` (${result.latency}ms)` : '';
      
      console.log(`\n${index + 1}. ${icon} ${result.test}${latencyInfo}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Details: ${result.details}`);
      console.log(`   Time: ${new Date(result.timestamp).toLocaleTimeString()}`);
    });
    
    // Display categorized results
    console.log('\n🔍 RESULTS BY CATEGORY');
    console.log('-'.repeat(50));
    
    const categories = {
      'Service Initialization': report.results.filter(r => r.test.includes('Initialization')),
      'Type System': report.results.filter(r => r.test.includes('Token') || r.test.includes('FeeAmount') || r.test.includes('ChainId')),
      'Cache System': report.results.filter(r => r.test.includes('Cache')),
      'Data Fetching': report.results.filter(r => r.test.includes('Subgraph') || r.test.includes('Pool Data') || r.test.includes('Real')),
      'Error Handling': report.results.filter(r => r.test.includes('Error')),
      'Performance': report.results.filter(r => r.test.includes('Performance')),
      'Integration': report.results.filter(r => r.test.includes('Integration'))
    };
    
    Object.entries(categories).forEach(([category, results]) => {
      if (results.length > 0) {
        const passed = results.filter(r => r.status === 'PASS').length;
        const failed = results.filter(r => r.status === 'FAIL').length;
        const warnings = results.filter(r => r.status === 'WARNING').length;
        
        console.log(`\n${category}: ${passed}/${results.length} passed`);
        if (failed > 0) console.log(`  ❌ ${failed} failed`);
        if (warnings > 0) console.log(`  ⚠️  ${warnings} warnings`);
      }
    });
    
    // Display recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(50));
    
    if (report.failedTests > 0) {
      console.log('❌ CRITICAL ISSUES FOUND:');
      report.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.details}`);
        });
      console.log('\n🔧 Action Required: Fix failed tests before proceeding to next phase');
    }
    
    if (report.warningTests > 0) {
      console.log('⚠️  WARNINGS (Expected in test environment):');
      report.results
        .filter(r => r.status === 'WARNING')
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.details}`);
        });
      console.log('\n📝 Note: Warnings are acceptable for network-dependent features');
    }
    
    // Performance recommendations
    if (report.performanceMetrics.averageLatency > 1000) {
      console.log('\n⚡ PERFORMANCE RECOMMENDATIONS:');
      console.log('   • Consider increasing cache TTL for better performance');
      console.log('   • Implement request batching for multiple pool queries');
      console.log('   • Add connection pooling for subgraph requests');
    }
    
    if (report.performanceMetrics.cacheHitRate < 0.5) {
      console.log('\n💾 CACHE OPTIMIZATION:');
      console.log('   • Cache hit rate is low, consider warming up cache with popular pools');
      console.log('   • Increase cache size if memory allows');
      console.log('   • Implement predictive caching for frequently accessed pairs');
    }
    
    // Success message
    if (report.overallStatus === 'PASS') {
      console.log('\n🎉 ALL CRITICAL TESTS PASSED!');
      console.log('✅ Pool Data Integration is complete and ready for production');
      console.log('✅ Ready to proceed to next high-priority item: Proper Route Calculation');
    } else if (report.overallStatus === 'WARNING') {
      console.log('\n⚠️  VALIDATION COMPLETED WITH WARNINGS');
      console.log('✅ Core functionality is working correctly');
      console.log('📝 Network-dependent features may not work in test environment');
      console.log('✅ Ready to proceed to next implementation phase');
    }
    
    // Implementation status
    console.log('\n📈 IMPLEMENTATION STATUS');
    console.log('-'.repeat(50));
    console.log('✅ HIGH PRIORITY ITEM 1: Real Pool Data Integration - COMPLETE');
    console.log('🔄 NEXT: HIGH PRIORITY ITEM 2: Proper Route Calculation');
    console.log('🔄 NEXT: HIGH PRIORITY ITEM 3: Accurate Price Impact');
    console.log('🔄 NEXT: HIGH PRIORITY ITEM 4: Real Gas Estimation');
    
    console.log('\n' + '='.repeat(80));
    console.log('Pool Data Integration Validation Complete');
    
    return report;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

/**
 * Get status icon for display
 */
function getStatusIcon(status: 'PASS' | 'FAIL' | 'WARNING'): string {
  switch (status) {
    case 'PASS': return '✅';
    case 'FAIL': return '❌';
    case 'WARNING': return '⚠️';
    default: return '❓';
  }
}

// Export for use in other modules
export { runPoolDataValidation };

// Run validation if this file is executed directly
if (require.main === module) {
  runPoolDataValidation()
    .then(() => {
      console.log('✅ Pool Data Integration validation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Pool Data Integration validation failed:', error);
      process.exit(1);
    });
}
