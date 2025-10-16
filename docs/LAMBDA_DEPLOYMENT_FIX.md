# Lambda Deployment - Error 502 Fix

## Problem

After updating the Lambda code, the function started returning 502 (Bad Gateway) errors with the following CloudWatch logs:

```
Runtime.ImportModuleError: Error: Cannot find module 'jsonwebtoken'
Require stack:
- /var/task/utils/jwt.js
- /var/task/index.js
- /var/runtime/index.mjs
```

## Root Cause

When copying the compiled TypeScript code to the `deployment` directory, **only the JavaScript files were copied, not the `node_modules` dependencies**. This caused the Lambda to fail at runtime when trying to import required packages like:
- `jsonwebtoken`
- `bcryptjs`
- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`
- `joi`
- `google-auth-library`

## Solution

Install production dependencies in the deployment directory before deploying:

```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/auth-handler/deployment
npm install --production
```

This installs all dependencies listed in `package.json` (excluding devDependencies) into `deployment/node_modules`.

## Proper Deployment Workflow

### 1. Compile TypeScript
```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/auth-handler
npx tsc
```

This generates compiled JavaScript in the `dist/` directory.

### 2. Update Deployment Directory
```bash
# Backup current deployment (optional)
cp -r deployment/ deployment-backup/

# Clear deployment directory
rm -rf deployment/*

# Copy compiled code
cp -r dist/* deployment/

# Copy package.json
cp package.json deployment/

# Install production dependencies
cd deployment
npm install --production
```

### 3. Deploy with CDK
```bash
cd /Users/oscarkof/repos/TG-OM/infrastructure
npx cdk deploy AuthStack --require-approval never
```

## Verification

After deployment, test the Lambda by making a request and checking CloudWatch logs:

```bash
# Check recent logs
aws logs tail /aws/lambda/AuthStack-AuthHandlerFunctionD0F71E32-CyQka2TCEITT \
  --since 5m \
  --region us-east-1 \
  --format short
```

Look for:
- ✅ No "ImportModuleError" messages
- ✅ Successful Lambda invocations
- ✅ Proper response codes (200, 400, 401, etc. - NOT 502)

## Alternative: Automated Build Script

Create a build script to automate this process:

**`lambdas/auth-handler/build.sh`**:
```bash
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

echo "✅ Build complete!"
```

Make it executable:
```bash
chmod +x lambdas/auth-handler/build.sh
```

Usage:
```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/auth-handler
./build.sh
```

## Files Structure

```
lambdas/auth-handler/
├── src/                    # TypeScript source code
│   ├── index.ts
│   └── utils/
├── dist/                   # Compiled JavaScript (git-ignored)
│   ├── index.js
│   └── utils/
├── deployment/             # AWS Lambda package
│   ├── index.js
│   ├── utils/
│   ├── node_modules/       # ⚠️ CRITICAL: Must include dependencies!
│   └── package.json
├── package.json            # Dependencies definition
└── tsconfig.json          # TypeScript configuration
```

## Common Mistakes to Avoid

1. ❌ **Deploying without node_modules**
   - Causes: Runtime.ImportModuleError
   - Fix: Run `npm install --production` in deployment/

2. ❌ **Deploying TypeScript source files**
   - Causes: Syntax errors at runtime
   - Fix: Always compile with `tsc` first

3. ❌ **Including devDependencies**
   - Causes: Larger package size, slower cold starts
   - Fix: Use `npm install --production` (or `--omit=dev`)

4. ❌ **Not updating package.json in deployment/**
   - Causes: Wrong dependencies installed
   - Fix: Always copy latest package.json to deployment/

## Prevention

To prevent this issue in the future:

1. **Always run the full build workflow** before deploying
2. **Verify node_modules exists** in deployment/ before running CDK
3. **Check CloudWatch logs** after every deployment
4. **Consider using Lambda Layers** for shared dependencies
5. **Use the automated build script** instead of manual steps

## Related Issues

- Initial error: 502 Bad Gateway
- CloudWatch logs: Runtime.ImportModuleError
- Affected endpoints: ALL Lambda endpoints
- Resolution time: ~5 minutes after identifying root cause

## Lessons Learned

1. **Dependencies are not optional**: Lambda needs `node_modules` even for compiled code
2. **Verify deployment package**: Always check what's being deployed
3. **Monitor logs immediately**: Check CloudWatch after every deploy
4. **Automate builds**: Reduce human error with scripts
5. **Document workflow**: Clear deployment steps prevent mistakes
