
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push('bin');
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// Configure transformer for web compatibility
config.transformer.babelTransformerPath = require.resolve('metro-react-native-babel-transformer');

module.exports = config;
