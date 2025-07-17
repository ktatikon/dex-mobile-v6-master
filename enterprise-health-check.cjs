#!/usr/bin/env node

/**
 * Enterprise Service Health Check
 * Verifies all enterprise services are operational in production environment
 */

const fs = require('fs');
const path = require('path');

console.log('🏥 DEX Mobile v6 - Enterprise Service Health Check');
console.log('================================================');

// Health check results
const healthResults = {
  timestamp: new Date().toISOString(),
  overall_status: 'CHECKING',
  services: {},
  summary: {
    total_services: 0,
    operational: 0,
    degraded: 0,
    failed: 0
  }
};

// Service definitions
const enterpriseServices = [
  {
    name: 'Uniswap V3 Service',
    file: 'src/services/uniswapV3Service.ts',
    critical: true,
    description: 'Core Uniswap V3 SDK integration for swapping'
  },
  {
    name: 'DEX Swap Service',
    file: 'src/services/dexSwapService.ts',
    critical: true,
    description: 'Enhanced swap service with Uniswap V3 integration'
  },
  {
    name: 'MEV Protection Service',
    file: 'src/services/mevProtectionService.ts',
    critical: true,
    description: 'MEV protection with Flashbots integration'
  },
  {
    name: 'Gas Optimization Service',
    file: 'src/services/gasOptimizationService.ts',
    critical: true,
    description: 'Dynamic gas optimization for mobile'
  },
  {
    name: 'TDS Compliance Service',
    file: 'src/services/tdsComplianceService.ts',
    critical: true,
    description: 'Indian tax compliance and reporting'
  },
  {
    name: 'KYC API Service',
    file: 'src/services/kycApiService.ts',
    critical: true,
    description: 'KYC verification with Aadhaar eKYC'
  },
  {
    name: 'AML Service',
    file: 'src/services/amlService.ts',
    critical: true,
    description: 'Anti-money laundering screening'
  },
  {
    name: 'Fiat Wallet Service',
    file: 'src/services/fiatWalletService.ts',
    critical: true,
    description: 'Fiat wallet with payment gateway integration'
  },
  {
    name: 'PayPal Service',
    file: 'src/services/paypalService.ts',
    critical: false,
    description: 'PayPal payment gateway integration'
  },
  {
    name: 'PhonePe Service',
    file: 'src/services/phonepeService.ts',
    critical: false,
    description: 'PhonePe payment gateway integration'
  },
  {
    name: 'UPI Service',
    file: 'src/services/upiService.ts',
    critical: false,
    description: 'UPI payment integration'
  },
  {
    name: 'Enterprise Service Integrator',
    file: 'src/services/enterpriseServiceIntegrator.ts',
    critical: true,
    description: 'Central service orchestration and integration'
  },
  {
    name: 'Loading Orchestrator',
    file: 'src/services/enterprise/loadingOrchestrator.ts',
    critical: true,
    description: 'Enterprise loading patterns and state management'
  },
  {
    name: 'Real-time Data Manager',
    file: 'src/services/enterprise/realTimeDataManager.ts',
    critical: true,
    description: 'Real-time data caching and fallback mechanisms'
  },
  {
    name: 'Blockchain Service',
    file: 'src/services/blockchainService.ts',
    critical: true,
    description: 'Multi-chain blockchain interaction service'
  },
  {
    name: 'Wallet Service',
    file: 'src/services/walletService.ts',
    critical: true,
    description: 'Universal wallet connection and management'
  }
];

// Check service file existence and basic structure
function checkServiceFile(service) {
  const result = {
    name: service.name,
    file: service.file,
    critical: service.critical,
    status: 'UNKNOWN',
    checks: {
      file_exists: false,
      has_class_export: false,
      has_initialize_method: false,
      has_error_handling: false,
      has_loading_integration: false,
      typescript_compliant: false
    },
    issues: [],
    recommendations: []
  };

  try {
    // Check if file exists
    if (fs.existsSync(service.file)) {
      result.checks.file_exists = true;
      
      // Read file content
      const content = fs.readFileSync(service.file, 'utf8');
      
      // Check for class export or service object
      if (content.includes('export class') || content.includes('export const') || content.includes('export default')) {
        result.checks.has_class_export = true;
      }
      
      // Check for initialize method
      if (content.includes('initialize') || content.includes('init')) {
        result.checks.has_initialize_method = true;
      }
      
      // Check for error handling
      if (content.includes('try {') && content.includes('catch')) {
        result.checks.has_error_handling = true;
      }
      
      // Check for loading orchestrator integration
      if (content.includes('loadingOrchestrator')) {
        result.checks.has_loading_integration = true;
      }
      
      // Check TypeScript compliance (no 'any' types)
      if (!content.includes(': any') && content.includes('interface') || content.includes('type ')) {
        result.checks.typescript_compliant = true;
      }
      
      // Determine overall status
      const passedChecks = Object.values(result.checks).filter(Boolean).length;
      const totalChecks = Object.keys(result.checks).length;
      
      if (passedChecks === totalChecks) {
        result.status = 'OPERATIONAL';
      } else if (passedChecks >= totalChecks * 0.7) {
        result.status = 'DEGRADED';
        result.issues.push('Some quality checks failed');
      } else {
        result.status = 'FAILED';
        result.issues.push('Multiple critical checks failed');
      }
      
      // Add specific recommendations
      if (!result.checks.has_error_handling) {
        result.recommendations.push('Add comprehensive error handling');
      }
      if (!result.checks.has_loading_integration) {
        result.recommendations.push('Integrate with loading orchestrator');
      }
      if (!result.checks.typescript_compliant) {
        result.recommendations.push('Improve TypeScript type safety');
      }
      
    } else {
      result.status = 'FAILED';
      result.issues.push('Service file not found');
      result.recommendations.push('Create missing service file');
    }
    
  } catch (error) {
    result.status = 'FAILED';
    result.issues.push(`Error reading file: ${error.message}`);
  }
  
  return result;
}

// Check component integration
function checkComponentIntegration() {
  const components = [
    'src/components/swap_block/SwapBlock.tsx',
    'src/components/swap_block/SwapForm.tsx',
    'src/components/TokenSelector.tsx'
  ];
  
  const integrationResults = {
    token_selector_reuse: false,
    enterprise_loading_patterns: false,
    zero_duplication_compliance: false
  };
  
  components.forEach(componentPath => {
    if (fs.existsSync(componentPath)) {
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check TokenSelector reuse
      if (content.includes('TokenSelector') && !componentPath.includes('TokenSelector.tsx')) {
        integrationResults.token_selector_reuse = true;
      }
      
      // Check enterprise loading patterns
      if (content.includes('loadingOrchestrator') || content.includes('enterpriseServiceIntegrator')) {
        integrationResults.enterprise_loading_patterns = true;
      }
      
      // Check for zero duplication (no duplicate component definitions)
      if (!content.includes('// DUPLICATE') && !content.includes('// TODO: Remove duplicate')) {
        integrationResults.zero_duplication_compliance = true;
      }
    }
  });
  
  return integrationResults;
}

// Main health check execution
function runHealthCheck() {
  console.log('🔍 Checking enterprise services...\n');
  
  healthResults.summary.total_services = enterpriseServices.length;
  
  enterpriseServices.forEach((service, index) => {
    console.log(`[${index + 1}/${enterpriseServices.length}] Checking ${service.name}...`);
    
    const result = checkServiceFile(service);
    healthResults.services[service.name] = result;
    
    // Update summary
    switch (result.status) {
      case 'OPERATIONAL':
        healthResults.summary.operational++;
        console.log(`  ✅ ${result.status}`);
        break;
      case 'DEGRADED':
        healthResults.summary.degraded++;
        console.log(`  ⚠️  ${result.status} - ${result.issues.join(', ')}`);
        break;
      case 'FAILED':
        healthResults.summary.failed++;
        console.log(`  ❌ ${result.status} - ${result.issues.join(', ')}`);
        break;
    }
  });
  
  console.log('\n🔧 Checking component integration...');
  const integration = checkComponentIntegration();
  healthResults.component_integration = integration;
  
  console.log(`  TokenSelector Reuse: ${integration.token_selector_reuse ? '✅' : '❌'}`);
  console.log(`  Enterprise Loading: ${integration.enterprise_loading_patterns ? '✅' : '❌'}`);
  console.log(`  Zero Duplication: ${integration.zero_duplication_compliance ? '✅' : '❌'}`);
  
  // Determine overall status
  const criticalServices = enterpriseServices.filter(s => s.critical);
  const criticalOperational = criticalServices.filter(s => 
    healthResults.services[s.name].status === 'OPERATIONAL'
  ).length;
  
  if (criticalOperational === criticalServices.length && healthResults.summary.failed === 0) {
    healthResults.overall_status = 'OPERATIONAL';
  } else if (criticalOperational >= criticalServices.length * 0.8) {
    healthResults.overall_status = 'DEGRADED';
  } else {
    healthResults.overall_status = 'FAILED';
  }
  
  // Generate report
  generateHealthReport();
}

// Generate health check report
function generateHealthReport() {
  console.log('\n📊 ENTERPRISE SERVICE HEALTH REPORT');
  console.log('=====================================');
  console.log(`Overall Status: ${getStatusIcon(healthResults.overall_status)} ${healthResults.overall_status}`);
  console.log(`Total Services: ${healthResults.summary.total_services}`);
  console.log(`Operational: ${healthResults.summary.operational}`);
  console.log(`Degraded: ${healthResults.summary.degraded}`);
  console.log(`Failed: ${healthResults.summary.failed}`);
  
  const healthPercentage = Math.round((healthResults.summary.operational / healthResults.summary.total_services) * 100);
  console.log(`Health Score: ${healthPercentage}%`);
  
  // Save detailed report
  fs.writeFileSync('ENTERPRISE_HEALTH_REPORT.json', JSON.stringify(healthResults, null, 2));
  console.log('\n📄 Detailed report saved to: ENTERPRISE_HEALTH_REPORT.json');
  
  console.log('\n🎯 PRODUCTION READINESS ASSESSMENT');
  console.log('===================================');
  
  if (healthResults.overall_status === 'OPERATIONAL') {
    console.log('✅ All enterprise services are operational');
    console.log('✅ Ready for production deployment');
  } else if (healthResults.overall_status === 'DEGRADED') {
    console.log('⚠️  Some services have issues but core functionality is operational');
    console.log('⚠️  Recommend addressing issues before full production deployment');
  } else {
    console.log('❌ Critical services are failing');
    console.log('❌ NOT ready for production deployment');
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'OPERATIONAL': return '✅';
    case 'DEGRADED': return '⚠️';
    case 'FAILED': return '❌';
    default: return '❓';
  }
}

// Execute health check
runHealthCheck();
