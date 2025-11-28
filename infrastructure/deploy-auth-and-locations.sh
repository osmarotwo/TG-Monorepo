#!/bin/bash

# Deploy AuthStack and LocationsStack to AWS
echo "🚀 Deploying Locations Stack to AWS..."

# Check if OAuth credentials are set
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "⚠️  Google OAuth credentials not found in environment"
  echo "Please provide them:"
  read -p "Google Client ID: " GOOGLE_CLIENT_ID
  read -sp "Google Client Secret: " GOOGLE_CLIENT_SECRET
  echo ""
fi

# First deploy AuthStack to update exports
echo "📦 Step 1: Deploying AuthStack to update exports..."
npx cdk deploy AuthStack \
  --require-approval never \
  -c googleClientId="${GOOGLE_CLIENT_ID}" \
  -c googleClientSecret="${GOOGLE_CLIENT_SECRET}"

if [ $? -ne 0 ]; then
  echo "❌ AuthStack deployment failed"
  exit 1
fi

echo "✅ AuthStack deployed successfully"
echo ""

# Then deploy LocationsStack
echo "📦 Step 2: Deploying LocationsStack..."
npx cdk deploy LocationsStack \
  --require-approval never \
  -c googleClientId="${GOOGLE_CLIENT_ID}" \
  -c googleClientSecret="${GOOGLE_CLIENT_SECRET}"

if [ $? -ne 0 ]; then
  echo "❌ LocationsStack deployment failed"
  exit 1
fi

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Get the API Gateway URL from the AuthStack outputs"
echo "2. Update your frontend NEXT_PUBLIC_API_URL with this URL"
echo "3. Test the locations CRUD operations"
