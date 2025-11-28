# Locations Infrastructure - CDK Import

## 📋 Resumen

Los recursos de Locations fueron creados manualmente via AWS CLI para evitar el hook `AWS::EarlyValidation::ResourceExistenceCheck` que estaba bloqueando todos los despliegues via CDK.

Ahora estos recursos están **referenciados en CDK** para control y documentación, aunque fueron creados fuera de CDK.

## 🏗️ Recursos Creados

### 1. DynamoDB Table: `Locations`
- **Stack**: `DataStack` (ya existía)
- **ARN**: `arn:aws:dynamodb:us-east-1:702944629921:table/Locations`
- **Características**:
  - Partition Key: `PK` (String)
  - Sort Key: `SK` (String)
  - GSI1: `GSI1PK` / `GSI1SK`
  - Billing Mode: PAY_PER_REQUEST
  - Point-in-time Recovery: Enabled

### 2. Lambda Function: `LocationsHandler`
- **Creado**: Manualmente via AWS CLI
- **ARN**: `arn:aws:lambda:us-east-1:702944629921:function:LocationsHandler`
- **Runtime**: Node.js 18.x
- **Handler**: `dist/index.handler`
- **Memory**: 512 MB
- **Timeout**: 30 segundos
- **Environment Variables**:
  - `LOCATIONS_TABLE`: `Locations`
  - `USERS_TABLE`: `Users`
  - `JWT_SECRET_PARAM`: `/tg-om/jwt-secret`
  - `FRONTEND_URL`: `*`

### 3. IAM Role: `LocationsHandlerRole`
- **ARN**: `arn:aws:iam::702944629921:role/LocationsHandlerRole`
- **Políticas adjuntas**:
  - `AWSLambdaBasicExecutionRole` (managed policy)
  - `LocationsHandlerPolicy` (inline policy)
    - DynamoDB: Read/Write en `Locations` y `Users`
    - SSM: GetParameter en `/tg-om/jwt-secret`

### 4. API Gateway Endpoints

API Gateway ID: `ectre1y1fg` (Authentication API)

**Endpoints creados**:
- `POST /locations` - Crear location
- `GET /locations` - Listar todas las locations
- `GET /locations/{id}` - Obtener location específica
- `PUT /locations/{id}` - Actualizar location
- `DELETE /locations/{id}` - Eliminar location

**URL Base**: `https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod`

## 📝 Estado en CDK

### AuthStack

Los recursos están **referenciados** (no creados) en `AuthStack`:

```typescript
// Importar tabla Locations existente desde DataStack
const locationsTable = dynamodb.Table.fromTableName(
  this,
  'LocationsTable',
  'Locations'
);

// Importar Lambda LocationsHandler existente (creado manualmente)
const locationsHandler = lambda.Function.fromFunctionArn(
  this,
  'LocationsHandler',
  `arn:aws:lambda:${this.region}:${this.account}:function:LocationsHandler`
);
```

### Outputs en CDK

```typescript
LocationsTableNameOutput: Locations
LocationsHandlerArnOutput: arn:aws:lambda:us-east-1:702944629921:function:LocationsHandler
```

## 🔄 Actualizaciones Futuras

### Para actualizar el Lambda:

1. **Compilar el código**:
```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/locations-handler/deployment
npm install
npx tsc
```

2. **Empaquetar**:
```bash
zip -r locations-handler.zip dist node_modules package.json -q
```

3. **Actualizar función Lambda**:
```bash
aws lambda update-function-code \
  --function-name LocationsHandler \
  --zip-file fileb://locations-handler.zip \
  --region us-east-1
```

### Para actualizar endpoints de API Gateway:

Usa AWS CLI o la consola de AWS. **NO** usar CDK debido al hook que bloquea changesets.

Ejemplo para agregar CORS:
```bash
aws apigateway put-method-response \
  --rest-api-id ectre1y1fg \
  --resource-id 27j9t9 \
  --http-method POST \
  --status-code 200 \
  --response-parameters '{"method.response.header.Access-Control-Allow-Origin":true}' \
  --region us-east-1
```

Después de cambios, redesplegar:
```bash
aws apigateway create-deployment \
  --rest-api-id ectre1y1fg \
  --stage-name prod \
  --region us-east-1
```

## ⚠️ Importante

1. **NO** intentar crear estos recursos con `cdk deploy` - ya existen
2. Los recursos están en CDK solo para **documentación y referencia**
3. Para cambios en infraestructura, usar **AWS CLI directo**
4. El hook `AWS::EarlyValidation::ResourceExistenceCheck` sigue activo en la cuenta

## 🧪 Testing

Verificar que los endpoints funcionan:

```bash
# Obtener token JWT (requiere login previo)
TOKEN="tu-jwt-token-aqui"

# Crear location
curl -X POST https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod/locations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sede Principal",
    "address": "Calle 123",
    "city": "Ciudad",
    "country": "País",
    "coordinates": {"lat": 4.6097, "lng": -74.0817}
  }'

# Listar locations
curl -X GET https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod/locations \
  -H "Authorization: Bearer $TOKEN"
```

## 📚 Referencias

- Lambda Source Code: `/lambdas/locations-handler/`
- CDK Stack: `/infrastructure/lib/auth-stack.ts` (líneas 305-337)
- API Gateway Console: https://console.aws.amazon.com/apigateway/
- Lambda Console: https://console.aws.amazon.com/lambda/
