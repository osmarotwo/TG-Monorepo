#!/bin/bash

# Build script for JWT Authorizer Lambda
# This script compiles TypeScript and prepares the deployment package

set -e  # Exit on error

echo "==================================="
echo "Building JWT Authorizer Lambda"
echo "==================================="

# Clean previous build
echo "Cleaning previous build..."
rm -rf dist
mkdir -p dist

# Compile TypeScript
echo "Compiling TypeScript..."
npx tsc

# Copy package.json to dist
echo "Copying package.json..."
cp package.json dist/

# Remove devDependencies from package.json
echo "Cleaning devDependencies from package.json..."
cd dist
node -e "const pkg = require('./package.json'); delete pkg.devDependencies; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Install production dependencies
echo "Installing production dependencies..."
npm install --production --omit=dev

# Report size
echo ""
echo "Build complete!"
echo "Total size:"
du -sh .
echo ""
echo "Dependencies installed:"
npm list --depth=0

echo "==================================="
echo "Build successful!"
echo "==================================="
