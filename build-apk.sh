#!/bin/bash

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
echo "📝 Renaming APK to v-dex_v6_0.1.apk..."
if [ -f "*.apk" ]; then
  mv *.apk v-dex_v6_0.1.apk
  echo "✅ APK generated successfully: v-dex_v6_0.1.apk"
else
  echo "❌ APK generation failed"
  exit 1
fi

echo "🎉 Build completed successfully!"
