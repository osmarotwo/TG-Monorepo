# 🚀 Guía de Deployment - Infraestructura Completa

## 📋 **RESUMEN EJECUTIVO**

✅ **Backend serverless completo** (AuthStack + JWT + DynamoDB)  
✅ **Frontend hosting automático** (AmplifyStack + CI/CD)  
✅ **Integración completa** (variables de entorno automáticas)  
⏳ **Ready to deploy** (solo falta configurar GitHub token)

---

## 🎯 **DEPLOYMENT EN 3 PASOS**

### **PASO 1: Configurar GitHub Token**

#### 1.1 Crear GitHub Personal Access Token:
1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. **Scopes necesarios**:
   - `repo` (Full control of private repositories)
   - `admin:repo_hook` (Full control of repository hooks)
4. **Copia el token** (ghp_xxxxxxxxxxxx)

#### 1.2 Almacenar en AWS SSM:
```bash
# Configurar AWS CLI si no está configurado
aws configure

# Crear parameter seguro en SSM
aws ssm put-parameter \
  --name "/amplify/github-token" \
  --value "ghp_tu_token_aqui" \
  --type "SecureString" \
  --description "GitHub token for Amplify integration"
```

### **PASO 2: Deploy de la Infraestructura**

```bash
# Ir al directorio de infraestructura
cd infrastructure

# Instalar dependencias (si no está hecho)
npm install

# Verificar que todo compila
npx tsc --noEmit

# Bootstrap CDK (solo la primera vez)
npx cdk bootstrap

# Deploy completo (todos los stacks)
npx cdk deploy --all --require-approval never
```

**Orden de deployment automático**:
1. `ApiLambdaStack` (API original)
2. `AuthStack` (Backend serverless)  
3. `AmplifyStack` (Frontend hosting) ← Depende de AuthStack

### **PASO 3: Verificación Post-Deploy**

#### 3.1 URLs Generadas:
Después del deploy, obtendrás estas URLs en la salida:

```bash
# Outputs del deploy:
AuthStack.AuthApiUrl = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
AmplifyStack.ProductionUrl = https://main.xxxxx.amplifyapp.com  
AmplifyStack.StagingUrl = https://feature-frontend-user.xxxxx.amplifyapp.com
AmplifyStack.AmplifyConsoleUrl = https://console.aws.amazon.com/amplify/...
```

#### 3.2 Verificaciones:
```bash
# 1. Verificar API funcionando
curl https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/auth/health

# 2. Verificar frontend desplegado
open https://main.xxxxx.amplifyapp.com

# 3. Verificar integración OAuth
# Ir al frontend y probar Google Sign In
```

---

## 🏗️ **ARQUITECTURA DESPLEGADA**

### **Stack 1: AuthStack**
- **DynamoDB Tables**: Users, Sessions, EmailVerifications
- **Lambda Functions**: JWT Authorizer + Auth Handler
- **API Gateway**: Custom authorizer + CORS
- **SSM Parameters**: JWT secret, app references

### **Stack 2: AmplifyStack** 
- **Amplify App**: CI/CD desde GitHub
- **Branch Deployments**: main (prod) + feature/frontend-user (staging)
- **Environment Variables**: VITE_API_URL automático
- **Build Config**: Vite optimizado con cache

### **Stack 3: ApiLambdaStack**
- **Lambda**: Hello function original
- **API Gateway**: API original para testing

---

## 🔧 **CONFIGURACIÓN POST-DEPLOY**

### **Variables de Entorno Automáticas**:
El AmplifyStack configura automáticamente:
```bash
VITE_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod
VITE_APP_NAME=TG Platform  
VITE_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0
```

### **CI/CD Automático**:
- **Push a `main`** → Deploy automático a producción
- **Push a `feature/frontend-user`** → Deploy automático a staging
- **Pull Requests** → Preview deployments automáticos

---

## 🚨 **TROUBLESHOOTING**

### **Error: GitHub token invalid**
```bash
# Verificar que el token existe y es correcto
aws ssm get-parameter --name "/amplify/github-token" --with-decryption

# Regenerar token si es necesario
aws ssm put-parameter \
  --name "/amplify/github-token" \
  --value "nuevo_token" \
  --type "SecureString" \
  --overwrite
```

### **Error: CDK bootstrap required**
```bash
# Bootstrap CDK en tu cuenta
npx cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

### **Error: Build failure en Amplify**
1. Ve a AWS Amplify Console
2. Click en tu app → Build history
3. Revisa los logs del build fallido
4. Verifica que `package.json` en frontend tenga `npm run build`

### **Error: CORS en API**
```bash
# Verificar que API Gateway tiene CORS habilitado
# El AuthStack ya incluye configuración CORS automática
```

---

## 📊 **MONITOREO Y LOGS**

### **CloudWatch Logs**:
```bash
# Logs del Auth Handler
aws logs tail /aws/lambda/AuthStack-AuthHandler --follow

# Logs del JWT Authorizer
aws logs tail /aws/lambda/AuthStack-JWTAuthorizer --follow

# Logs de Amplify builds
# Ve a Amplify Console → App → Build history
```

### **Métricas Importantes**:
- **Lambda Invocations**: Número de requests
- **API Gateway 4xx/5xx**: Errores de API
- **Amplify Build Time**: Tiempo de deployment
- **DynamoDB Consumption**: Uso de base de datos

---

## 🔐 **SEGURIDAD POST-DEPLOY**

### **JWT Secret Configuration**:
```bash
# Configurar JWT secret seguro (si no existe)
aws ssm put-parameter \
  --name "/auth/jwt-secret" \
  --value "tu-jwt-secret-super-seguro-256-bits" \
  --type "SecureString"
```

### **Google OAuth Configuration**:
1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Configura las URLs de tu frontend desplegado en "Authorized JavaScript origins"
3. Actualiza `frontend/src/utils/config.ts` con tu Google Client ID real

---

## 🎯 **PRÓXIMOS PASOS POST-DEPLOY**

### **Inmediato**:
1. **Probar OAuth end-to-end** en frontend desplegado
2. **Configurar Google OAuth** con URLs reales
3. **Verificar email verification** (implementar SES)

### **Optimización**:
1. **Configurar dominio custom** en Amplify
2. **Implementar WAF** para seguridad
3. **Configurar CloudWatch alarms**
4. **Implementar backup de DynamoDB**

---

## 📞 **COMANDOS DE GESTIÓN**

```bash
# Eliminar todo (CUIDADO!)
npx cdk destroy --all

# Actualizar solo un stack
npx cdk deploy AuthStack

# Ver diferencias antes de deploy
npx cdk diff

# Listar todos los stacks
npx cdk list

# Ver template generado
npx cdk synth AmplifyStack
```

---

**🎉 ESTADO: LISTO PARA PRODUCCIÓN**  
**⏰ Tiempo estimado de deploy: 10-15 minutos**  
**💰 Costo estimado: <$5/mes para usage básico**