import { phase6Validator } from './phase6Validator';

/**
 * Run Phase 6 validation and display results
 */
async function runPhase6Validation() {
  console.log('🚀 Starting Phase 6: Core Blockchain Integration Validation');
  console.log('=' .repeat(80));
  
  try {
    const report = await phase6Validator.validatePhase6Implementation();
    
    // Display summary
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('-'.repeat(50));
    console.log(`Overall Status: ${report.overallStatus}`);
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passedTests}`);
    console.log(`❌ Failed: ${report.failedTests}`);
    console.log(`⚠️  Warnings: ${report.warningTests}`);
    console.log(`\n${report.summary}`);
    
    // Display detailed results
    console.log('\n📋 DETAILED RESULTS');
    console.log('-'.repeat(50));
    
    report.results.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : 
                   result.status === 'FAIL' ? '❌' : '⚠️';
      
      console.log(`\n${index + 1}. ${icon} ${result.test}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Details: ${result.details}`);
      console.log(`   Time: ${new Date(result.timestamp).toLocaleTimeString()}`);
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
      console.log('\n🔧 Action Required: Fix failed tests before proceeding to Phase 7');
    }
    
    if (report.warningTests > 0) {
      console.log('⚠️  WARNINGS:');
      report.results
        .filter(r => r.status === 'WARNING')
        .forEach(result => {
          console.log(`   • ${result.test}: ${result.details}`);
        });
      console.log('\n📝 Note: Warnings are acceptable but should be reviewed');
    }
    
    if (report.overallStatus === 'PASS') {
      console.log('🎉 ALL TESTS PASSED! Phase 6 implementation is complete and ready.');
      console.log('✅ Ready to proceed to Phase 7: DEX Aggregator Integration');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('Phase 6 Validation Complete');
    
    return report;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

// Export for use in other modules
export { runPhase6Validation };

// Run validation if this file is executed directly
if (require.main === module) {
  runPhase6Validation()
    .then(() => {
      console.log('✅ Validation completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}
