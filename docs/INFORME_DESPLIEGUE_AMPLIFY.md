# 📋 Informe de Ajustes para Despliegue en AWS Amplify

**Fecha**: 23 de octubre de 2025  
**Proyecto**: TG-OM Frontend (Next.js)  
**Estado Actual**: Configuración parcial completada

---

## 🎯 Resumen Ejecutivo

El proyecto está **80% listo** para despliegue en Amplify. Se requieren ajustes menores en variables de entorno y configuración de CDK para completar el despliegue exitoso.

---

## ✅ Configuraciones Correctas (Ya implementadas)

### 1. **Next.js Configuration** ✓
**Archivo**: `nextjs-app/next.config.ts`
```typescript
output: 'export',           // ✓ Static export habilitado
trailingSlash: true,       // ✓ Amplify compatible
images: { unoptimized: true }, // ✓ Sin Image Optimization
distDir: 'out',            // ✓ Output directory correcto
```

### 2. **Amplify Build Spec** ✓
**Archivo**: `amplify.yml` (raíz del proyecto)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      - nvm use 20          # ✓ Node 20 especificado
      - cd nextjs-app       # ✓ Navega al subdirectorio
      - npm ci              # ✓ Clean install
    build:
      - npm run build       # ✓ Build command correcto
  artifacts:
    baseDirectory: nextjs-app/out  # ✓ Output correcto
    files: ['**/*']
  cache:
    paths: [nextjs-app/node_modules/**/*]
```

### 3. **CDK Infrastructure** ✓
**Archivo**: `infrastructure/lib/amplify-stack.ts`
- ✓ AmplifyStack configurado con GitHub integration
- ✓ IAM Role con permisos AdministratorAccess-Amplify
- ✓ Branch configuration (main + develop)
- ✓ Environment variables básicas configuradas

### 4. **Recursos AWS Desplegados** ✓
```json
{
  "AmplifyAppId": "d3npwupb455k1n",
  "ProductionUrl": "https://feature/frontend-user.d3npwupb455k1n.amplifyapp.com",
  "StagingUrl": "https://develop.d3npwupb455k1n.amplifyapp.com"
}
```

---

## ⚠️ Ajustes Críticos Requeridos

### 1. **Variables de Entorno Faltantes** 🔴

El frontend requiere **7 variables de entorno** que NO están configuradas en CDK:

#### 📍 Variables Requeridas:

```typescript
// CRÍTICAS (App no funciona sin estas)
NEXT_PUBLIC_AUTH_API_URL          // ❌ FALTA
NEXT_PUBLIC_DATA_API_URL          // ❌ FALTA  
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY   // ❌ FALTA
NEXT_PUBLIC_GOOGLE_CLIENT_ID      // ✓ YA CONFIGURADA

// OPCIONALES (App funciona con fallbacks)
NEXT_PUBLIC_GOOGLE_REDIRECT_URI   // ❌ FALTA
NEXT_PUBLIC_APP_NAME              // ✓ YA CONFIGURADA
NEXT_PUBLIC_ENVIRONMENT           // ✓ YA CONFIGURADA
```

#### 🔧 Valores Correctos (desde outputs.json):

```typescript
// Auth API (AuthStack)
NEXT_PUBLIC_AUTH_API_URL = "https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod"

// Data API (DataStack) 
NEXT_PUBLIC_DATA_API_URL = "https://v0igzegm95.execute-api.us-east-1.amazonaws.com/prod"

// Google Maps API Key (obtener de Google Cloud Console)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "[TU_GOOGLE_MAPS_API_KEY]"

// Google OAuth Redirect (debe coincidir con producción)
NEXT_PUBLIC_GOOGLE_REDIRECT_URI = "https://feature-frontend-user.d3npwupb455k1n.amplifyapp.com/auth/google"
```

---

### 2. **CDK Stack - Environment Variables** 🟡

**Problema**: `amplify-stack.ts` solo configura `NEXT_PUBLIC_API_URL` genérica, pero el frontend usa URLs específicas.

**Archivo a Modificar**: `infrastructure/lib/amplify-stack.ts`

#### Líneas 90-104 (environmentVariables del App):
```typescript
environmentVariables: [
  {
    name: 'NEXT_PUBLIC_AUTH_API_URL',
    value: 'https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod',
  },
  {
    name: 'NEXT_PUBLIC_DATA_API_URL', 
    value: 'https://v0igzegm95.execute-api.us-east-1.amazonaws.com/prod',
  },
  {
    name: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    value: process.env.GOOGLE_MAPS_API_KEY || '', // Pasar desde CDK context
  },
  {
    name: 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    value: '816694945748-4mcep0bf0abnjoa36bta8btqlevgonft.apps.googleusercontent.com',
  },
  {
    name: 'NEXT_PUBLIC_GOOGLE_REDIRECT_URI',
    value: `https://feature-frontend-user.${this.amplifyApp.attrAppId}.amplifyapp.com/auth/google`,
  },
]
```

#### Líneas 121-137 (environmentVariables del MainBranch):
**Duplicar las mismas variables aquí para el branch de producción**

---

### 3. **Google Cloud Console Configuration** 🟡

**Acción Requerida**: Actualizar Authorized Redirect URIs en Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Selecciona el OAuth 2.0 Client ID: `816694945748-4mcep0bf0abnjoa36bta8btqlevgonft`
3. Agregar a **Authorized redirect URIs**:
   ```
   https://feature-frontend-user.d3npwupb455k1n.amplifyapp.com/auth/google
   https://develop.d3npwupb455k1n.amplifyapp.com/auth/google
   http://localhost:3000/auth/google  (mantener para dev)
   ```

---

### 4. **CORS Backend Configuration** 🟢

**Estado**: Ya configurado en `data-stack.ts` y `auth-stack.ts`

Verificar que incluya el dominio de Amplify:
```typescript
defaultCorsPreflightOptions: {
  allowOrigins: [
    'http://localhost:3000',
    'https://feature-frontend-user.d3npwupb455k1n.amplifyapp.com',
    'https://develop.d3npwupb455k1n.amplifyapp.com'
  ],
  allowMethods: apigateway.Cors.ALL_METHODS,
  allowHeaders: ['*'],
  allowCredentials: true,
}
```

---

## 🛠️ Pasos de Implementación

### **Paso 1: Actualizar CDK Stack**

```bash
cd infrastructure

# 1. Modificar amplify-stack.ts (agregar variables de entorno)
# Ver código en sección "Ajustes Críticos Requeridos #2"

# 2. Redeploy AmplifyStack
npx cdk deploy AmplifyStack --require-approval never
```

### **Paso 2: Configurar Variables en Amplify Console (Alternativa)**

Si no quieres modificar CDK, puedes configurar las variables manualmente:

1. Ve a [Amplify Console](https://console.aws.amazon.com/amplify/home#/apps/d3npwupb455k1n)
2. Click en la app → "Environment variables"
3. Agregar las 4 variables faltantes:
   - `NEXT_PUBLIC_AUTH_API_URL`
   - `NEXT_PUBLIC_DATA_API_URL`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`

### **Paso 3: Actualizar Google OAuth**

1. Ir a Google Cloud Console
2. Agregar redirect URIs de Amplify
3. Guardar cambios

### **Paso 4: Trigger Build**

```bash
# En Amplify Console, hacer click en "Redeploy this version"
# O hacer push a la rama feature/frontend-user:
git push origin feature/frontend-user
```

### **Paso 5: Verificar Deployment**

1. **Build logs**: Verificar que `npm run build` complete exitosamente
2. **Environment variables**: Verificar en build logs que las variables estén presentes
3. **Frontend**: Abrir `https://feature-frontend-user.d3npwupb455k1n.amplifyapp.com`
4. **Console errors**: Verificar que no haya errores de API URLs
5. **Google OAuth**: Probar login con Google

---

## 📊 Checklist de Pre-Deployment

- [x] Next.js configurado para static export
- [x] amplify.yml configurado correctamente
- [x] CDK AmplifyStack desplegado
- [ ] Variables de entorno AUTH_API_URL configurada
- [ ] Variables de entorno DATA_API_URL configurada
- [ ] Variables de entorno GOOGLE_MAPS_API_KEY configurada
- [ ] Variables de entorno GOOGLE_REDIRECT_URI configurada
- [ ] Google OAuth redirect URIs actualizados
- [ ] CORS configurado en backends
- [ ] Primer build completado exitosamente
- [ ] Frontend accesible en URL de producción
- [ ] Login con Google funcional
- [ ] Dashboard carga citas correctamente
- [ ] Mapas de Google funcionan

---

## 🚨 Problemas Conocidos

### 1. **Build con --turbopack en Amplify**
**Problema**: `next build --turbopack` puede no estar soportado en Amplify
**Solución**: Modificar `package.json`:
```json
"scripts": {
  "build": "next build",  // Remover --turbopack flag
}
```

### 2. **Branch Name con Slash**
**Problema**: URL tiene `feature/frontend-user` en el path
**Observación**: Amplify convierte automáticamente a `feature-frontend-user`
**URL Real**: `https://feature-frontend-user.d3npwupb455k1n.amplifyapp.com`

### 3. **Google Maps Quota**
**Problema**: API Key puede tener límites de cuota
**Solución**: Verificar cuota en Google Cloud Console

---

## 📈 Métricas de Deployment

```
Tiempo estimado de build: 3-5 minutos
Tamaño del bundle: ~15-20 MB (static export)
CDN: CloudFront (automático con Amplify)
SSL: Automático con Amplify
Rollback: Disponible en Amplify Console
```

---

## 🎓 Recomendaciones

### 1. **Monitoreo**
- Habilitar CloudWatch Logs para Amplify
- Configurar alertas de build failures
- Monitorear métricas de API Gateway

### 2. **Performance**
- Habilitar Amplify CDN caching
- Optimizar imágenes antes del build
- Minimizar bundle size

### 3. **Seguridad**
- Rotar Google OAuth secrets regularmente
- Implementar rate limiting en APIs
- Configurar AWS WAF para Amplify

### 4. **CI/CD**
- Configurar pre-deployment tests
- Implementar smoke tests post-deployment
- Automatizar rollback en caso de errores

---

## 📝 Siguiente Acción Inmediata

**Prioridad 1**: Configurar las 4 variables de entorno faltantes en Amplify Console o CDK

**Comando rápido** (si usas CDK):
```bash
cd infrastructure
# Modificar amplify-stack.ts con las variables
npx cdk deploy AmplifyStack
```

**Comando rápido** (si usas Amplify Console):
- Ir a la consola y agregar las variables manualmente
- Hacer "Redeploy" del último build

---

## 📞 Soporte

Si encuentras problemas:
1. Revisar build logs en Amplify Console
2. Verificar CloudWatch Logs de Lambda
3. Probar APIs directamente con curl/Postman
4. Verificar CORS en Network tab del navegador

---

**Estado Final**: ⚠️ **Requiere 2-3 ajustes menores antes de deployment completo**
