# AWS Deployed Resources - Summary

## 📊 Overview
Last Updated: October 14, 2025

## 🔐 Auth Stack (Backend de Autenticación)

### API Gateway
- **Endpoint**: `https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod/`
- **ID**: `ectre1y1fg`
- **Stage**: `prod`

### Rutas Disponibles
- `POST /auth/register` - Registro de usuario
- `POST /auth/login` - Login de usuario
- `POST /auth/verify-email` - Verificación de email
- `POST /auth/google-auth` - Autenticación con Google
- `POST /auth/complete-profile` - Completar perfil
- `POST /auth/request-password-reset` - Solicitar reset de contraseña
- `POST /auth/reset-password` - Resetear contraseña
- `POST /auth/refresh` - Refrescar token
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/profile` - Obtener perfil de usuario

### DynamoDB Tables
- **Users**: `Users`
- **Sessions**: `Sessions`
- **EmailVerifications**: `EmailVerifications`

---

## 🚀 API Lambda Stack (API Adicional)

### API Gateway
- **Endpoint**: `https://dcxsc3pt09.execute-api.us-east-1.amazonaws.com/prod/`
- **Lambda ARN**: `arn:aws:lambda:us-east-1:702944629921:function:ApiLambdaStack-HelloLambdaFunction3DCA9067-YTxC2bk8iwfU`

---

## 🌐 Amplify Stack (Frontend)

### URLs
- **Production Branch**: `https://feature/frontend-user.d3npwupb455k1n.amplifyapp.com`
- **Staging Branch**: `https://develop.d3npwupb455k1n.amplifyapp.com`
- **Console**: `https://console.aws.amazon.com/amplify/home#/apps/d3npwupb455k1n`

### App Info
- **App ID**: `d3npwupb455k1n`
- **App Name**: `TG-Frontend-App`

---

## 🔧 Environment Variables

### Local Development (.env.local)
```bash
# Auth API (Backend)
NEXT_PUBLIC_AUTH_API_URL=https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=816694945748-4mcep0bf0abnjoa36bta8btqlevgonft.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-*** (oculto por seguridad)
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google
```

### Production (Amplify)
Configurar las siguientes variables en Amplify Console:
- `NEXT_PUBLIC_AUTH_API_URL` → `https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` → `816694945748-4mcep0bf0abnjoa36bta8btqlevgonft.apps.googleusercontent.com`
- `GOOGLE_CLIENT_SECRET` → (valor real del secreto)
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` → `https://feature/frontend-user.d3npwupb455k1n.amplifyapp.com/auth/google`

---

## 📝 Notas

1. **Auth API URL**: Ya está correctamente configurada en `.env.local` y `api.ts` ahora usa la variable de entorno
2. **Google OAuth**: Asegúrate de agregar la URL de producción de Amplify como Redirect URI en Google Cloud Console
3. **CORS**: El backend debe tener configurado CORS para permitir solicitudes desde el dominio de Amplify

---

## 🧪 Testing Endpoints

### Local
```bash
# Test Auth API
curl https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod/auth/register

# Test Hello API
curl https://dcxsc3pt09.execute-api.us-east-1.amazonaws.com/prod/
```

### From Frontend
El frontend ya está configurado para usar `NEXT_PUBLIC_AUTH_API_URL` automáticamente.
