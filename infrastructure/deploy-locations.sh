#!/bin/bash

# Script para desplegar AuthStack (incluye endpoints de Locations)

set -e

echo "🚀 Deploying AuthStack with Locations endpoints..."

# Navigate to infrastructure directory
cd "$(dirname "$0")"

# Check for required environment variables
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables must be set"
  echo "Usage: GOOGLE_CLIENT_ID=your-id GOOGLE_CLIENT_SECRET=your-secret ./deploy-locations.sh"
  exit 1
fi

# Deploy AuthStack (includes Locations endpoints)
npx cdk deploy AuthStack \
  -c googleClientId="$GOOGLE_CLIENT_ID" \
  -c googleClientSecret="$GOOGLE_CLIENT_SECRET" \
  --require-approval never

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📝 API Gateway URL: https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod/"
echo "📝 Locations endpoints available at:"
echo "   - POST   /prod/locations"
echo "   - GET    /prod/locations"
echo "   - GET    /prod/locations/{id}"
echo "   - PUT    /prod/locations/{id}"
echo "   - DELETE /prod/locations/{id}"
