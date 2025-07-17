#!/usr/bin/env node

/**
 * Android APK Build Setup Script
 * Prepares the DEX mobile application for Android APK generation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Android APK Build Setup for DEX Mobile v6...');

// APK Configuration
const APK_CONFIG = {
  appName: 'DEX Mobile v6',
  packageName: 'com.techvitta.dexmobile',
  versionName: '6.0.1',
  versionCode: 1,
  outputName: 'v-dex_v6_0.1.apk',
  signingConfig: {
    keyAlias: 'dex-mobile-key',
    keyPassword: 'password123',
    storePassword: 'password123',
    keystore: 'dex-mobile-keystore.jks'
  },
  developer: {
    name: 'krishna deepak tatikonda',
    organization: 'techvitta pvt ltd',
    location: 'kanchi cafe, hyderabad, telangana'
  }
};

// Create Android build configuration
function createAndroidConfig() {
  console.log('📱 Creating Android build configuration...');
  
  const androidConfig = {
    name: APK_CONFIG.appName,
    slug: 'dex-mobile-v6',
    version: APK_CONFIG.versionName,
    orientation: 'portrait',
    icon: './public/icons/icon-512x512.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './public/icons/splash-screen.png',
      resizeMode: 'contain',
      backgroundColor: '#000000'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    android: {
      adaptiveIcon: {
        foregroundImage: './public/icons/adaptive-icon.png',
        backgroundColor: '#B1420A'
      },
      package: APK_CONFIG.packageName,
      versionCode: APK_CONFIG.versionCode,
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'USE_FINGERPRINT',
        'USE_BIOMETRIC'
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || ''
        }
      }
    },
    web: {
      favicon: './public/favicon.ico',
      bundler: 'metro'
    },
    plugins: [
      'expo-router',
      'expo-camera',
      'expo-local-authentication',
      'expo-secure-store'
    ]
  };

  fs.writeFileSync('app.json', JSON.stringify({ expo: androidConfig }, null, 2));
  console.log('✅ Android configuration created');
}

// Create Metro configuration for React Native
function createMetroConfig() {
  console.log('⚙️ Creating Metro bundler configuration...');
  
  const metroConfig = `
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('bin');
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// Configure transformer for web compatibility
config.transformer.babelTransformerPath = require.resolve('metro-react-native-babel-transformer');

module.exports = config;
`;

  fs.writeFileSync('metro.config.js', metroConfig);
  console.log('✅ Metro configuration created');
}

// Create Babel configuration for React Native
function createBabelConfig() {
  console.log('🔧 Creating Babel configuration...');
  
  const babelConfig = {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/services': './src/services',
          '@/hooks': './src/hooks',
          '@/utils': './src/utils',
          '@/types': './src/types'
        }
      }],
      'react-native-reanimated/plugin'
    ]
  };

  fs.writeFileSync('babel.config.js', `module.exports = ${JSON.stringify(babelConfig, null, 2)};`);
  console.log('✅ Babel configuration created');
}

// Create keystore for APK signing
function createKeystore() {
  console.log('🔐 Creating keystore for APK signing...');
  
  try {
    const keystoreCommand = `keytool -genkeypair -v -keystore ${APK_CONFIG.signingConfig.keystore} ` +
      `-alias ${APK_CONFIG.signingConfig.keyAlias} -keyalg RSA -keysize 2048 -validity 10000 ` +
      `-storepass ${APK_CONFIG.signingConfig.storePassword} ` +
      `-keypass ${APK_CONFIG.signingConfig.keyPassword} ` +
      `-dname "CN=${APK_CONFIG.developer.name}, OU=${APK_CONFIG.developer.organization}, ` +
      `O=${APK_CONFIG.developer.organization}, L=${APK_CONFIG.developer.location}, ST=Telangana, C=IN"`;
    
    execSync(keystoreCommand, { stdio: 'inherit' });
    console.log('✅ Keystore created successfully');
  } catch (error) {
    console.warn('⚠️ Keystore creation failed (may already exist):', error.message);
  }
}

// Create build scripts
function createBuildScripts() {
  console.log('📝 Creating build scripts...');
  
  const buildScript = `#!/bin/bash

echo "🚀 Building DEX Mobile v6 APK..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🏗️ Building production bundle..."
npm run build

# Generate APK
echo "📱 Generating APK..."
npx expo build:android --type apk --release-channel production

# Rename APK
echo "📝 Renaming APK to ${APK_CONFIG.outputName}..."
if [ -f "*.apk" ]; then
  mv *.apk ${APK_CONFIG.outputName}
  echo "✅ APK generated successfully: ${APK_CONFIG.outputName}"
else
  echo "❌ APK generation failed"
  exit 1
fi

echo "🎉 Build completed successfully!"
`;

  fs.writeFileSync('build-apk.sh', buildScript);
  fs.chmodSync('build-apk.sh', '755');
  console.log('✅ Build scripts created');
}

// Create production environment configuration
function createProductionEnv() {
  console.log('🌍 Creating production environment configuration...');
  
  const prodEnv = `
# Production Environment Configuration
NODE_ENV=production
REACT_APP_ENV=production

# API Endpoints
REACT_APP_API_BASE_URL=https://api.dex-mobile.com
REACT_APP_WEBSOCKET_URL=wss://ws.dex-mobile.com

# Blockchain Configuration
REACT_APP_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
REACT_APP_POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY
REACT_APP_BSC_RPC_URL=https://bsc-dataseed.binance.org/

# Uniswap V3 Configuration
REACT_APP_UNISWAP_V3_ENABLED=true
REACT_APP_UNISWAP_SUBGRAPH_URL=https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3

# MEV Protection
REACT_APP_FLASHBOTS_ENABLED=true
FLASHBOTS_API_KEY=YOUR_FLASHBOTS_API_KEY

# Payment Gateways
REACT_APP_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
REACT_APP_PHONEPE_MERCHANT_ID=YOUR_PHONEPE_MERCHANT_ID

# KYC/AML Services
REACT_APP_IDFY_API_KEY=YOUR_IDFY_API_KEY
REACT_APP_KYC_ENABLED=true

# Security
REACT_APP_ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY
REACT_APP_JWT_SECRET=YOUR_JWT_SECRET

# Analytics
REACT_APP_ANALYTICS_ENABLED=true
REACT_APP_SENTRY_DSN=YOUR_SENTRY_DSN
`;

  fs.writeFileSync('.env.production', prodEnv);
  console.log('✅ Production environment configuration created');
}

// Main execution
async function main() {
  try {
    console.log('🎯 DEX Mobile v6 Android Build Setup');
    console.log('=====================================');
    
    createAndroidConfig();
    createMetroConfig();
    createBabelConfig();
    createKeystore();
    createBuildScripts();
    createProductionEnv();
    
    console.log('\n🎉 Android APK build setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Install Expo CLI: npm install -g @expo/cli');
    console.log('2. Configure environment variables in .env.production');
    console.log('3. Run build script: ./build-apk.sh');
    console.log(`4. APK will be generated as: ${APK_CONFIG.outputName}`);
    console.log('\n🔗 Repository: https://github.com/ktatikon/dex-mobile-v6-master.git');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { APK_CONFIG, main };
