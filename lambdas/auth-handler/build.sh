#!/bin/bash
set -e

echo "🔨 Building auth-handler Lambda..."

# Compile TypeScript
echo "📦 Compiling TypeScript..."
npx tsc

# Backup deployment
if [ -d "deployment" ]; then
  echo "💾 Backing up deployment..."
  rm -rf deployment-backup
  cp -r deployment deployment-backup
fi

# Clear and rebuild deployment
echo "🧹 Clearing deployment directory..."
rm -rf deployment
mkdir -p deployment

# Copy compiled code
echo "📋 Copying compiled code..."
cp -r dist/* deployment/
cp package.json deployment/

# Install dependencies
echo "📦 Installing production dependencies..."
cd deployment
npm install --production

cd ..
echo "✅ Build complete! Ready to deploy with CDK."
