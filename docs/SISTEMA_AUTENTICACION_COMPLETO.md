# Sistema de Autenticación Completo

## Resumen

Este documento describe el sistema de autenticación implementado para la plataforma TG-OM, que incluye registro nativo, verificación de email, Google OAuth y gestión completa de usuarios.

## Arquitectura del Sistema

### Backend (AWS Serverless)

**Stack de Infraestructura:**
- **AWS CDK**: Infrastructure as Code
- **API Gateway**: RESTful API con CORS habilitado
- **Lambda Functions**: Lógica de negocio serverless
- **DynamoDB**: Base de datos NoSQL para usuarios, sesiones y verificaciones
- **JWT**: Autenticación basada en tokens

**Tablas DynamoDB:**
1. **Users**: Información de usuarios
2. **Sessions**: Sesiones activas con refresh tokens
3. **EmailVerifications**: Tokens de verificación de email

### Frontend (Next.js)

**Tecnologías:**
- **Next.js 15**: Framework React con SSG
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos
- **React Context**: Gestión de estado global
- **Google OAuth**: Integración con Google Identity

## Endpoints de la API

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro de usuario nativo |
| POST | `/auth/verify-email` | Verificación de email |
| POST | `/auth/login` | Login nativo |
| POST | `/auth/google` | Autenticación con Google |
| POST | `/auth/refresh` | Renovar token de acceso |
| GET | `/auth/profile` | Obtener perfil de usuario |
| PUT | `/auth/profile` | Actualizar perfil |
| POST | `/auth/complete-profile` | Completar perfil |

### URL Base de la API
```
https://tuaglbfc2h.execute-api.us-east-1.amazonaws.com/prod/
```

## Flujos de Usuario

### 1. Registro Nativo

1. **Registro**: Usuario completa formulario con email, password y nombre completo
2. **Creación**: Se crea usuario en DynamoDB con `emailVerified: false`
3. **Token**: Se genera token de verificación con expiración de 24 horas
4. **Email**: Se envía email de verificación (pendiente implementar)

**Ejemplo de Request:**
```json
POST /auth/register
{
  "email": "usuario@example.com",
  "password": "SecurePassword123",
  "fullName": "Juan Pérez"
}
```

**Response:**
```json
{
  "message": "User registered successfully. Please check your email for verification.",
  "userId": "uuid-generated",
  "verificationToken": "verification-token"
}
```

### 2. Verificación de Email

1. **Token**: Usuario hace clic en enlace de email con token
2. **Validación**: Sistema valida token y verifica expiración
3. **Actualización**: Se marca `emailVerified: true`
4. **Limpieza**: Se elimina token de verificación

**Ejemplo de Request:**
```json
POST /auth/verify-email
{
  "token": "verification-token"
}
```

### 3. Login Nativo

1. **Credenciales**: Usuario ingresa email y password
2. **Validación**: Sistema verifica credenciales y email verificado
3. **Tokens**: Se generan access token (1h) y refresh token (30 días)
4. **Sesión**: Se crea sesión en DynamoDB

**Ejemplo de Request:**
```json
POST /auth/login
{
  "email": "usuario@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "userId": "uuid",
    "email": "usuario@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "profileCompleted": false,
    "emailVerified": true
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 3600
  }
}
```

### 4. Google OAuth

1. **Frontend**: Usuario hace clic en "Continuar con Google"
2. **Google**: Se obtiene ID token de Google
3. **Backend**: Se valida token con Google API
4. **Usuario**: Se crea o actualiza usuario existente
5. **Tokens**: Se generan tokens JWT

## Estructura de Datos

### Usuario (DynamoDB)

```typescript
interface User {
  PK: string;                    // USER#${userId}
  SK: string;                    // PROFILE
  GSI1PK: string;               // EMAIL#${email}
  GSI1SK: string;               // USER
  GSI2PK?: string;              // GOOGLE#${googleId}
  GSI2SK?: string;              // USER
  
  userId: string;
  googleId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  pictureUrl?: string;
  phone?: string;
  birthDate?: string;
  password?: string;
  passwordHash?: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  provider: 'google' | 'email';
  registrationMethod?: 'google' | 'manual';
  accountStatus?: 'pending' | 'active';
  role?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Sesión

```typescript
interface Session {
  PK: string;         // SESSION#sessionId
  SK: string;         // SESSION
  sessionId: string;
  userId: string;
  refreshToken: string;
  expiresAt: number;
}
```

### Verificación de Email

```typescript
interface EmailVerification {
  PK: string;         // EMAIL_VERIFY#${token}
  SK: string;         // TOKEN
  userId: string;
  email: string;
  token: string;
  expiresAt: number;
  createdAt?: string;
  ttl?: number;
}
```

## Configuración Frontend

### Variables de Entorno (.env.local)

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=816694945748-4mcep0bf0abnjoa36bta8btqlevgonft.apps.googleusercontent.com

# Auth API Configuration
NEXT_PUBLIC_AUTH_API_URL=https://tuaglbfc2h.execute-api.us-east-1.amazonaws.com/prod
```

### Servicio de Autenticación

El frontend utiliza un servicio centralizado (`authService.ts`) que maneja:
- Registro nativo
- Login nativo
- Google OAuth
- Verificación de email
- Gestión de tokens
- Renovación automática

### Context de Autenticación

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginNative: (email: string, password: string) => Promise<void>;
  registerNative: (data: RegisterData) => Promise<void>;
  authenticateWithGoogle: (idToken: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

## Componentes Principales

### Frontend

1. **RegistrationForm**: Formulario de registro nativo
2. **LoginForm**: Formulario de login
3. **GoogleAuthButton**: Botón de autenticación con Google
4. **EmailVerification**: Pantalla de verificación de email
5. **ProfileCompletion**: Completar perfil de usuario
6. **Dashboard**: Panel principal del usuario

### Backend

1. **auth-handler**: Lambda principal con todos los endpoints
2. **jwt-authorizer**: Lambda para autorización JWT
3. **dynamodb.ts**: Funciones de base de datos
4. **validation.ts**: Schemas de validación
5. **jwt.ts**: Utilidades JWT
6. **password.ts**: Hash y verificación de passwords

## Seguridad

### Autenticación
- **Passwords**: Hash con bcrypt
- **JWT**: Tokens firmados con secret
- **Sesiones**: Refresh tokens seguros
- **Validación**: Joi para validación de entrada

### Autorización
- **Lambda Authorizer**: Validación de JWT en API Gateway
- **CORS**: Configurado para dominios específicos
- **HTTPS**: Toda comunicación encriptada

## Estado del Sistema

### ✅ Completado

1. **Infraestructura AWS**: Stack desplegado y funcional
2. **Registro Nativo**: Endpoint funcional con validaciones
3. **Verificación Email**: Token generation y validación
4. **Login Nativo**: Autenticación completa con JWT
5. **Frontend**: Interfaz completa con React/Next.js
6. **Google OAuth**: Configurado (pendiente token real)
7. **Base de Datos**: Tablas DynamoDB operativas
8. **CORS**: Configurado correctamente
9. **Variables de Entorno**: Configuradas en frontend

### 🔄 Pendiente

1. **Servicio de Email**: Implementar envío real de emails
2. **Pruebas Google OAuth**: Validar con token real de Google
3. **Completar Perfil**: Implementar pantalla adicional
4. **Forgot Password**: Funcionalidad de recuperación
5. **Dashboard**: Pantalla principal post-login

## Comandos de Deployment

### Backend
```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/auth-handler
npm install --no-workspaces
npm run build

cd /Users/oscarkof/repos/TG-OM/infrastructure
cdk deploy AuthStack
```

### Frontend
```bash
cd /Users/oscarkof/repos/TG-OM/nextjs-app
npm install
npm run dev
```

## URLs de Acceso

- **Frontend**: http://localhost:3000
- **API Gateway**: https://tuaglbfc2h.execute-api.us-east-1.amazonaws.com/prod/
- **Documentación**: Este archivo

## Pruebas Realizadas

### Endpoints Validados

1. ✅ **POST /auth/register**: Registro exitoso
2. ✅ **POST /auth/verify-email**: Verificación exitosa
3. ✅ **POST /auth/login**: Login exitoso con tokens
4. ✅ **Frontend**: Aplicación funcionando en puerto 3000

### Casos de Prueba

```bash
# Registro
curl -X POST "https://tuaglbfc2h.execute-api.us-east-1.amazonaws.com/prod/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePassword123", "fullName": "Juan Pérez"}'

# Verificación
curl -X POST "https://tuaglbfc2h.execute-api.us-east-1.amazonaws.com/prod/auth/verify-email" \
  -H "Content-Type: application/json" \
  -d '{"token": "verification-token"}'

# Login
curl -X POST "https://tuaglbfc2h.execute-api.us-east-1.amazonaws.com/prod/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePassword123"}'
```

## Resolución de Problemas

### Problemas Comunes

1. **Cannot find module 'jsonwebtoken'**: Instalar dependencias localmente con `--no-workspaces`
2. **CORS Error**: Verificar configuración en API Gateway
3. **Handler path error**: Verificar que CDK apunte a `dist/index.handler`
4. **DynamoDB overlap error**: No duplicar `updatedAt` en updateUser

### Logs y Debugging

```bash
# Ver logs Lambda
aws logs tail /aws/lambda/AuthStack-AuthHandlerFunction --follow

# Ver estado CDK
cd infrastructure && cdk list && cdk diff

# Verificar build
cd lambdas/auth-handler && npm run build && ls -la dist/
```

---

**Fecha de Creación**: 7 de octubre de 2025  
**Estado**: Sistema Funcional - Backend y Frontend Operativos  
**Próximos Pasos**: Implementar servicio de email y completar Google OAuth testing