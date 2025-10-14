#!/bin/bash

# Script para sincronizar los outputs de CDK con los archivos de configuración
# Uso: ./sync-cdk-outputs.sh

set -e

echo "🔍 Consultando outputs de CDK..."
echo ""

cd "$(dirname "$0")"

# Obtener outputs del AuthStack
echo "📦 AuthStack:"
AUTH_OUTPUT=$(npx cdk deploy AuthStack --outputs-file /tmp/auth-outputs.json --require-approval never --dry-run 2>&1 | grep -A 20 "Outputs:" | grep "AuthApiUrl" || true)
if [ -n "$AUTH_OUTPUT" ]; then
    AUTH_URL=$(echo "$AUTH_OUTPUT" | awk '{print $3}')
    echo "   Auth API URL: $AUTH_URL"
else
    echo "   ⚠️  No se pudo obtener el Auth API URL"
fi

echo ""

# Obtener outputs del ApiLambdaStack
echo "📦 ApiLambdaStack:"
API_OUTPUT=$(npx cdk deploy ApiLambdaStack --outputs-file /tmp/api-outputs.json --require-approval never --dry-run 2>&1 | grep -A 20 "Outputs:" | grep "ApiUrl" || true)
if [ -n "$API_OUTPUT" ]; then
    API_URL=$(echo "$API_OUTPUT" | awk '{print $3}')
    echo "   API URL: $API_URL"
else
    echo "   ⚠️  No se pudo obtener el API URL"
fi

echo ""

# Obtener outputs del AmplifyStack
echo "📦 AmplifyStack:"
AMPLIFY_OUTPUT=$(npx cdk deploy AmplifyStack --outputs-file /tmp/amplify-outputs.json --require-approval never --dry-run 2>&1 | grep -A 20 "Outputs:" | grep "ProductionUrl" || true)
if [ -n "$AMPLIFY_OUTPUT" ]; then
    AMPLIFY_URL=$(echo "$AMPLIFY_OUTPUT" | awk '{print $3}')
    echo "   Production URL: $AMPLIFY_URL"
else
    echo "   ⚠️  No se pudo obtener el Amplify URL"
fi

echo ""
echo "✅ Consulta completada"
echo ""
echo "📝 Para actualizar el archivo .env.local, ejecuta:"
if [ -n "$AUTH_URL" ]; then
    echo "   NEXT_PUBLIC_AUTH_API_URL=$AUTH_URL"
fi

echo ""
echo "💡 Tip: Los outputs completos se guardan en /tmp/*-outputs.json"
