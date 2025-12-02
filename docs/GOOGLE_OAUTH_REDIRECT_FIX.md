# 🔧 Fix Google OAuth "invalid_client Unauthorized"

## 🔴 Problema Actual

Error en logs del Lambda:
```
[Google OAuth] Error: invalid_client Unauthorized
```

Frontend recibe:
```
POST https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod/auth/google-exchange 400 (Bad Request)
{"error": "Unauthorized"}
```

## 🎯 Causa Raíz

Google OAuth está rechazando la petición porque el `redirect_uri` (`http://localhost:3000/auth/google`) **NO está autorizado** en la configuración de Google Cloud Console.

## ✅ Solución: Configurar Redirect URIs en Google Cloud Console

### Paso 1: Acceder a Google Cloud Console

1. Ir a: https://console.cloud.google.com/apis/credentials
2. Seleccionar tu proyecto
3. En la sección **Credenciales OAuth 2.0**, hacer clic en tu Client ID:
   - **Client ID**: `816694945748-4mcep0bf0abnjoa36bta8btqlevgonft.apps.googleusercontent.com`

### Paso 2: Agregar URIs de Redirección Autorizadas

En la página de configuración del OAuth 2.0 Client ID, buscar la sección **"URIs de redireccionamiento autorizados"** y agregar:

#### 🏠 Para desarrollo local:
```
http://localhost:3000/auth/google
```

#### 🌐 Para producción:
```
https://www.clyok.in/auth/google
https://feature-frontend-user.d3npwupb455k1n.amplifyapp.com/auth/google
```

### Paso 3: Verificar Orígenes JavaScript Autorizados

En la sección **"Orígenes de JavaScript autorizados"**, agregar:

#### Para desarrollo:
```
http://localhost:3000
```

#### Para producción:
```
https://www.clyok.in
https://feature-frontend-user.d3npwupb455k1n.amplifyapp.com
```

### Paso 4: Guardar Cambios

1. Hacer clic en **"Guardar"** en la parte inferior de la página
2. Esperar 1-2 minutos para que los cambios se propaguen en los servidores de Google

## 🧪 Prueba

1. Recargar `http://localhost:3000/auth/login`
2. Hacer clic en "Continuar con Google"
3. Completar el flujo de autorización de Google
4. Verificar que el callback funciona correctamente

### Expected Flow:

```
1. Frontend → Google OAuth Authorization
   URL: https://accounts.google.com/o/oauth2/v2/auth
   
2. Google → Redirect back with code
   URL: http://localhost:3000/auth/google?code=XXXXX&state=google_auth

3. Frontend → Lambda /auth/google-exchange
   Body: { code: "XXXXX", redirectUri: "http://localhost:3000/auth/google" }

4. Lambda → Google Token Exchange
   URL: https://oauth2.googleapis.com/token
   Body: {
     code: "XXXXX",
     client_id: "816694945748-4mcep0bf0abnjoa36bta8btqlevgonft...",
     client_secret: "GOCSPX-I2sM5VWzN9m3G...",
     redirect_uri: "http://localhost:3000/auth/google",
     grant_type: "authorization_code"
   }

5. Google → Returns id_token ✅

6. Lambda → Returns id_token to Frontend

7. Frontend → /auth/google (with idToken)
   Authenticates user and redirects to dashboard
```

## 📋 Checklist de Configuración

- [ ] Agregar `http://localhost:3000/auth/google` a URIs de redirección
- [ ] Agregar `http://localhost:3000` a orígenes JavaScript
- [ ] Agregar `https://www.clyok.in/auth/google` a URIs de redirección
- [ ] Agregar `https://www.clyok.in` a orígenes JavaScript
- [ ] Agregar URL de Amplify a URIs de redirección
- [ ] Agregar URL de Amplify a orígenes JavaScript
- [ ] Guardar cambios y esperar 1-2 minutos
- [ ] Probar login con Google desde localhost
- [ ] Probar login con Google desde producción

## 🔍 Verificar Configuración Actual

Para ver qué URIs están configurados actualmente en Google Cloud Console:

1. Ir a: https://console.cloud.google.com/apis/credentials
2. Buscar el Client ID: `816694945748-4mcep0bf0abnjoa36bta8btqlevgonft`
3. Verificar las secciones:
   - **URIs de redireccionamiento autorizados**
   - **Orígenes de JavaScript autorizados**

## 🐛 Debugging

Si después de agregar los URIs el error persiste:

### 1. Verificar que el CLIENT_SECRET es correcto:
```bash
aws ssm get-parameter --name "/auth/google-client-secret" --with-decryption --query 'Parameter.Value' --output text
```

### 2. Ver logs del Lambda:
```bash
aws logs tail /aws/lambda/AuthStack-AuthHandlerFunctionD0F71E32-CyQka2TCEITT --follow --since 5m
```

### 3. Probar con curl:
```bash
curl -X POST https://oauth2.googleapis.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=YOUR_CODE" \
  -d "client_id=816694945748-4mcep0bf0abnjoa36bta8btqlevgonft.apps.googleusercontent.com" \
  -d "client_secret=YOUR_SECRET" \
  -d "redirect_uri=http://localhost:3000/auth/google" \
  -d "grant_type=authorization_code"
```

## 📚 Referencias

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
- [OAuth 2.0 Redirect URI Guidelines](https://developers.google.com/identity/protocols/oauth2/web-server#uri-validation)
