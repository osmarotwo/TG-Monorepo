# CORS Fix - Complete Profile Endpoint (October 2025)

## Problem

When trying to complete the user profile at `/onboarding`, the frontend received a CORS error:

```
Access to fetch at 'https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod/auth/complete-profile' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Causes

### 1. Missing CORS Headers on Error Responses
When the API Gateway returns error responses (4XX, 5XX), it wasn't including CORS headers. This is critical because:
- The JWT authorizer validates tokens before the Lambda handler executes
- If authorization fails, API Gateway returns an error response directly
- Without CORS headers on these error responses, browsers block the response

### 2. JWT Authorizer Misconfiguration
The JWT Authorizer Lambda was misconfigured:
- **Handler**: Was set to `src/authorizer.handler` but using `fromAsset` with uncompiled TypeScript files
- **Code**: Was pointing to the source directory with `.ts` files excluded
- **Error**: `Runtime.ImportModuleError: Error: Cannot find module 'authorizer'`

This caused all protected endpoints to fail with `AuthorizerConfigurationException`, and without CORS headers, the frontend couldn't even see the error.

## Solutions Implemented

### 1. Added Gateway Responses for CORS

Modified `/infrastructure/lib/auth-stack.ts` to add CORS headers to all error responses:

```typescript
// Add CORS headers to Gateway Responses for error cases
this.authApi.addGatewayResponse('Unauthorized', {
  type: apigateway.ResponseType.UNAUTHORIZED,
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'",
  },
});

this.authApi.addGatewayResponse('AccessDenied', {
  type: apigateway.ResponseType.ACCESS_DENIED,
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'",
  },
});

this.authApi.addGatewayResponse('Default4XX', {
  type: apigateway.ResponseType.DEFAULT_4XX,
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'",
  },
});

this.authApi.addGatewayResponse('Default5XX', {
  type: apigateway.ResponseType.DEFAULT_5XX,
  responseHeaders: {
    'Access-Control-Allow-Origin': "'*'",
    'Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'",
  },
});
```

### 2. Fixed JWT Authorizer Configuration

**Compiled the JWT Authorizer:**
```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/jwt-authorizer
npm run build  # Compiles TypeScript to dist/
```

**Updated CDK Configuration:**
```typescript
// Before (incorrect)
const jwtAuthorizer = new lambda.Function(this, 'JwtAuthorizerFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'src/authorizer.handler',  // ❌ Wrong path
  code: lambda.Code.fromAsset('../lambdas/jwt-authorizer', {
    exclude: ['tsconfig.json', '*.ts', 'node_modules/@types'],
  }),
  // ...
});

// After (correct)
const jwtAuthorizer = new lambda.Function(this, 'JwtAuthorizerFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'authorizer.handler',  // ✅ Correct - compiled code in root
  code: lambda.Code.fromAsset('../lambdas/jwt-authorizer/dist'),  // ✅ Use dist folder
  // ...
});
```

## Technical Details

### API Gateway CORS Flow

1. **Preflight Request (OPTIONS)**:
   - Browser sends OPTIONS request
   - API Gateway has `defaultCorsPreflightOptions` configured
   - Returns CORS headers without calling Lambda
   - Authorization is NOT required for OPTIONS

2. **Actual Request (POST)**:
   - Browser sends POST with Authorization header
   - API Gateway invokes JWT Authorizer Lambda
   - If authorization succeeds → Lambda handler executes → returns response with CORS headers
   - If authorization fails → API Gateway returns error → **NOW includes CORS headers thanks to Gateway Responses**

### Gateway Response Types

- **UNAUTHORIZED (401)**: Invalid or expired token
- **ACCESS_DENIED (403)**: Valid token but insufficient permissions
- **DEFAULT_4XX**: Catch-all for other client errors
- **DEFAULT_5XX**: Catch-all for server errors (like AuthorizerConfigurationException)

## Files Modified

1. `/infrastructure/lib/auth-stack.ts`:
   - Added Gateway Responses with CORS headers for all error types
   - Fixed JWT Authorizer handler path from `src/authorizer.handler` to `authorizer.handler`
   - Changed code source from `/lambdas/jwt-authorizer` to `/lambdas/jwt-authorizer/dist`

2. `/lambdas/jwt-authorizer/`:
   - Compiled TypeScript to JavaScript in `dist/` folder using `npm run build`

## Deployment

```bash
# Compile JWT Authorizer
cd /Users/oscarkof/repos/TG-OM/lambdas/jwt-authorizer
npm run build

# Deploy infrastructure
cd /Users/oscarkof/repos/TG-OM/infrastructure
npm run build
npx cdk deploy AuthStack --require-approval never
```

## Verification

Test that error responses now include CORS headers:

```bash
curl -i -X POST https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod/auth/complete-profile \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{}'
```

Expected response headers:
```
HTTP/2 401
access-control-allow-origin: *
access-control-allow-headers: Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token
access-control-allow-methods: OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD
```

## Lessons Learned

1. **Always add Gateway Responses for CORS**: When using custom authorizers, Gateway Responses ensure CORS headers are present even when authorization fails

2. **Compile Lambda functions**: TypeScript Lambdas must be compiled to JavaScript before deployment. Use `fromAsset` with the `dist/` folder, not the source folder

3. **Test with curl**: Testing with curl and checking response headers helps identify CORS issues that might not be visible in browser dev tools

4. **Check CloudWatch Logs**: Always check Lambda logs when seeing `AuthorizerConfigurationException` - it often indicates a module loading issue

## Impact

This fix resolves CORS issues for ALL protected endpoints:
- `/auth/complete-profile` (POST)
- `/auth/me` (GET)
- `/auth/logout` (POST)
- `/auth/profile` (PUT)

Any endpoint that uses the JWT Authorizer will now properly return CORS headers even on authorization failures.

## Related Documentation

- [AWS API Gateway Gateway Responses](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-gatewayResponse-definition.html)
- [AWS CDK Gateway Responses](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_apigateway.RestApi.html#addwbrgatewayresponse)
- [CORS in API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
