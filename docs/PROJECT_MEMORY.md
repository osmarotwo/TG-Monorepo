# 🧠 Memoria del Proyecto - TG-Monorepo

## 📋 Resumen Ejecutivo
**Fecha de creación**: 2 de octubre de 2025  
**Última actualización**: 3 de octubre de 2025  
**Estado actual**: Backend serverless completo + Frontend OAuth + AmplifyStack CDK implementado  
**Tecnologías**: AWS CDK + Amplify + Lambda + DynamoDB + React + Vite + TypeScript + Tailwind CSS + Google OAuth  

---

## 🏗️ Arquitectura Completa Implementada

### Monorepo Structure
```
TG-OM/
├── infrastructure/        # AWS CDK - INFRAESTRUCTURA COMPLETA
│   ├── lib/
│   │   ├── auth-stack.ts      # ✅ Backend serverless autenticación
│   │   ├── amplify-stack.ts   # ✅ NUEVO: Frontend hosting automático
│   │   └── api-lambda-stack.ts # ✅ API original
├── lambdas/              # ✅ COMPLETAMENTE IMPLEMENTADO
│   ├── auth-handler/     # ✅ Todos los endpoints de autenticación
│   └── jwt-authorizer/   # ✅ Custom authorizer con cache
├── frontend/             # ✅ React + Vite (OAuth funcional)
└── design_reference/    # Diseños analizados
```

### Stack Tecnológico COMPLETO
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Hosting**: AWS Amplify (CDK automatizado)
- **Backend**: AWS Lambda + DynamoDB + API Gateway
- **Auth**: JWT + Google OAuth + bcrypt + Email verification
- **Infrastructure**: AWS CDK (3 stacks)
- **CI/CD**: Amplify automatic deployments

---

## 🚀 NUEVO: Infraestructura AWS Completa (3 de octubre 2025)

### 🏭 **AmplifyStack** - Frontend Hosting Automatizado
**Archivo**: `infrastructure/lib/amplify-stack.ts`

#### Características Implementadas:
- ✅ **Deployment automático** desde GitHub
- ✅ **CI/CD pipeline** configurado automáticamente  
- ✅ **Multi-branch deployment** (main + develop)
- ✅ **Variables de entorno** configuradas automáticamente
- ✅ **SPA routing** con redirects para React Router
- ✅ **API integration** automática con AuthStack
- ✅ **Build optimization** con cache de node_modules

#### Configuración Automática:
```typescript
// Variables de entorno automáticas:
VITE_API_URL         # ← URL del AuthStack automáticamente
VITE_APP_NAME        # ← "TG Platform" 
VITE_ENVIRONMENT     # ← "production" / "staging"

// Branches configurados:
main                 # ← Producción
feature/frontend-user # ← Staging/desarrollo
```

### 🔐 **AuthStack** - Backend Serverless Completo
**Archivo**: `infrastructure/lib/auth-stack.ts`

#### Infraestructura DynamoDB:
- ✅ **Users Table** con GSI por email y Google ID
- ✅ **Sessions Table** con TTL automático  
- ✅ **EmailVerifications Table** con TTL automático

#### Lambda Functions:
- ✅ **JWT Authorizer** (custom API Gateway authorizer con cache 5min)
- ✅ **Auth Handler** (todos los endpoints implementados)

#### Endpoints Implementados (100% funcionales):
```typescript
// 🔓 Públicos:
POST /auth/register              # Registro manual
POST /auth/login                 # Login manual  
POST /auth/google                # Google OAuth
POST /auth/refresh               # Renovar tokens
POST /auth/verify-email          # Verificar email
POST /auth/forgot-password       # Reset password
POST /auth/reset-password        # Confirmar reset

// 🔒 Protegidos (JWT required):
POST /auth/complete-profile      # Completar perfil (onboarding)
GET  /auth/me                    # Obtener perfil
POST /auth/logout                # Invalidar sesión
PUT  /auth/profile              # Actualizar perfil
```

#### Utilidades Completas:
- ✅ **JWT Management** (generación, verificación, refresh, reset)
- ✅ **Password Security** (bcrypt 12 rounds, comparación segura)
- ✅ **DynamoDB Operations** (CRUD optimizado con GSI)
- ✅ **Google Verification** (validación de ID tokens)
- ✅ **Joi Validation** (esquemas para todos los endpoints)

### 🔗 **Integración Completa**
- ✅ **AmplifyStack** → conectado automáticamente a **AuthStack** 
- ✅ **Variables de entorno** automáticas (VITE_API_URL)
- ✅ **Dependencies** configuradas (deploy order correcto)
- ✅ **Cross-stack references** con SSM Parameter Store

---

## 🎯 Deployment Status

### ✅ **Listo para Deploy**:
```bash
# 1. Setup del GitHub token en AWS:
aws ssm put-parameter \
  --name "/amplify/github-token" \
  --value "tu_github_token" \
  --type "SecureString"

# 2. Deploy completo:
cd infrastructure
npm install
npx cdk deploy --all

# 3. URLs generadas automáticamente:
# - Producción: https://main.XXXXX.amplifyapp.com
# - Staging: https://feature-frontend-user.XXXXX.amplifyapp.com
# - API: https://XXXXX.execute-api.us-east-1.amazonaws.com/prod
```

### 📊 **Status Actual**:
| Componente | Estado | Archivo | 
|------------|--------|---------|
| Frontend Local | ✅ Funcional | `frontend/` |
| OAuth Google | ✅ Funcional | `AuthContext.tsx` |
| Backend Serverless | ✅ Completo | `lambdas/auth-handler/` |
| JWT Authorizer | ✅ Completo | `lambdas/jwt-authorizer/` |
| CDK AuthStack | ✅ Deployed | `auth-stack.ts` |
| CDK AmplifyStack | ✅ Deployed | `amplify-stack.ts` |
| CDK ApiLambdaStack | ✅ Deployed | `api-lambda-stack.ts` |
| **AWS Deploy** | ✅ **COMPLETADO** 🎉 | Todos los stacks |

## 🚀 **DEPLOYMENT EXITOSO** - 3 de octubre de 2025

### URLs de Producción:
- **Frontend Producción**: https://main.d2zb37k33o6pi9.amplifyapp.com
- **Frontend Staging**: https://feature/frontend-user.d2zb37k33o6pi9.amplifyapp.com
- **API Auth Backend**: https://tuaglbfc2h.execute-api.us-east-1.amazonaws.com/prod/
- **API Lambda**: https://9f5gm0jct2.execute-api.us-east-1.amazonaws.com/prod/
- **Amplify Console**: https://console.aws.amazon.com/amplify/home#/apps/d2zb37k33o6pi9

### Recursos AWS Creados:
- **AmplifyStack**: 
  - App ID: `d2zb37k33o6pi9`
  - Nombre: `TG-Frontend-App`
  - CI/CD automático desde GitHub
- **AuthStack**: 
  - DynamoDB Tables: Users, Sessions, EmailVerifications
  - Lambda Functions: auth-handler, jwt-authorizer
- **ApiLambdaStack**: 
  - API Gateway + Lambda function básica

### Configuración SSM:
- ✅ GitHub Token configurado y funcionando
- ✅ JWT Secret configurado
- ✅ Google Client ID configurado

---

## 🎨 Frontend - Estado Actual

### Pantalla Implementada: REGISTRO DE USUARIO
**Archivo principal**: `frontend/src/components/RegistrationForm.tsx`

#### Características Implementadas:
- ✅ **Formulario completo** con validación en tiempo real
- ✅ **Google OAuth funcional** con Google Identity Services
- ✅ **Autenticación dual** (manual + Google)
- ✅ **Dashboard post-registro** con datos del usuario
- ✅ **Responsive design** (mobile-first)
- ✅ **Dark/Light mode** con toggle
- ✅ **Glassmorphism** effects
- ✅ **Logo dinámico** configurable
- ✅ **Tema personalizable** completo
- ✅ **Validación de password** con requisitos
- ✅ **Estados de loading** y errores
- ✅ **Persistencia de sesión** en localStorage

#### Componentes UI Creados:
```
frontend/src/components/ui/
├── Button.tsx         # 4 variantes + loading states
├── Input.tsx          # Con iconos + validación + password toggle
├── Card.tsx           # Glassmorphism configurable
├── Icon.tsx           # Biblioteca SVG (user, calendar, star, etc.)
├── Logo.tsx           # Logo dinámico (icon/image/text)
└── index.ts           # Exports centralizados
```

### Sistema de Configuración Dinámica
**Archivo clave**: `frontend/src/utils/brandConfig.ts`

```typescript
// Todo el branding se controla desde aquí:
export const brandConfig = {
  platform: {
    name: "MiPlataforma",     // ← Cambiar nombre
    tagline: "...",
  },
  branding: {
    primaryColor: "#13a4ec",  // ← Cambiar color principal
    logoType: "icon",         // ← icon/image/text
    logoConfig: {
      icon: "user",           // ← Icono específico
    }
  },
  theme: {
    defaultMode: "light",     // ← Tema por defecto
    glassmorphism: true,      // ← Efectos visuales
  },
  content: {
    registration: {
      title: "...",           // ← Textos personalizables
      subtitle: "...",
      // ...más textos
    }
  }
};
```

### Tailwind Config Extendido
**Archivo**: `frontend/tailwind.config.js`
- ✅ Dark mode habilitado (`class`)
- ✅ Colores custom (primary, background-light/dark, card-light/dark)
- ✅ Fuente Inter configurada
- ✅ Breakpoints responsive (xs: 320px)
- ✅ Animaciones custom (fade-in, slide-up)

---

## 🎯 Diseño Base Analizado

### Origen del Diseño
**Archivo**: `design_reference/client_registration_form/`
- `code.html` - HTML original analizado
- `screen.png` - Screenshot de referencia

### Características del Diseño Original:
- **Color primario**: #13a4ec
- **Glassmorphism**: backdrop-blur con transparencias
- **Tipografía**: Inter font family
- **Layout**: Card centrado, responsive
- **Campos**: Name, Email, Password con validación
- **Dark mode**: Implementado completamente
- **Botón Google**: Con icono SVG

---

## 🚀 Funcionalidades Actuales

### Lo que está 100% funcional:
1. **Servidor de desarrollo**: `http://localhost:3000`
2. **Hot reload**: Cambios instantáneos
3. **Responsive**: Mobile, tablet, desktop
4. **Validación**: Email regex, password requirements
5. **Temas**: Toggle manual + detección sistema
6. **Persistencia**: localStorage para tema
7. **Accesibilidad**: Labels, ARIA attributes
8. **Estados**: Loading, error, success

### Validaciones Implementadas:
```typescript
// Email: regex validation
// Password: 8+ chars, 1 mayúscula, 1 número, 1 especial
// Name: required field
```

---

## 🔧 Configuraciones Clave

### Scripts NPM Configurados:
```json
// En package.json raíz
"dev:frontend": "cd frontend && npm run dev"
"build:frontend": "cd frontend && npm run build"
"install:all": "npm ci && cd infrastructure && npm ci && ..."
```

### Git Configuration:
- ✅ Usuario: Oscar Martínez <osmarotwo@gmail.com>
- ✅ GitHub CLI autenticado (osmarotwo)
- ✅ Repository: osmarotwo/TG-Monorepo
- ✅ Branch actual: feature/frontend-user

### URLs Importantes:
- **Dev Server**: http://localhost:3000
- **GitHub Repo**: https://github.com/osmarotwo/TG-Monorepo
- **AWS**: Pendiente configuración

---

## � CRITICAL: Creación de Scripts de Seed para DynamoDB

### ⚠️ IMPORTANTE: Estructura de Datos de Appointments

**SIEMPRE incluir estos campos en cada appointment seed:**

#### Campos Obligatorios para DynamoDB:
```typescript
{
  // Keys principales
  PK: `USER#${userId}`,           // ⚠️ CRÍTICO: Partition Key
  SK: `APPOINTMENT#${appointmentId}`, // ⚠️ CRÍTICO: Sort Key
  
  // IDs y referencias
  appointmentId: string,          // UUID único
  userId: string,                 // ID del usuario/especialista
  businessId: string,             // ID del negocio
  locationId: string,             // ID de la sede
  customerId: string,             // ID del cliente
  specialistId: string,           // ID del especialista
  
  // Información básica
  customerName: string,           // Nombre del cliente
  specialistName: string,         // Nombre del especialista
  locationName: string,           // Nombre de la sede
  serviceType: string,            // Tipo de servicio
  status: 'confirmed' | 'pending' | 'cancelled' | 'no-show' | 'completed',
  
  // ⚠️ CRÍTICO: Campos de fecha/hora SEPARADOS (requeridos por handler)
  date: string,                   // ⚠️ FORMATO: "YYYY-MM-DD" (ej: "2025-10-24")
  time: string,                   // ⚠️ FORMATO: "HH:MM" (ej: "08:00")
  startTime: string,              // ISO 8601 completo
  endTime: string,                // ISO 8601 completo
  estimatedDuration: number,      // Duración en minutos
  
  // Ubicación (objeto completo)
  location: {
    name: string,
    address: string,
    city: string,
    latitude: number,
    longitude: number
  },
  
  // Metadata
  resourceId: string,
  notes?: string,
  createdAt: string,              // ISO timestamp
  updatedAt: string,              // ISO timestamp
  
  // GSI Keys (para búsquedas optimizadas)
  GSI1PK: `DATE#${date}`,
  GSI1SK: `USER#${userId}#${startTime}`,
  GSI2PK: `LOCATION#${locationId}`,
  GSI2SK: `DATE#${date}#${startTime}`
}
```

### 🚨 ERROR COMÚN: Olvidar campos `date` y `time`

**❌ INCORRECTO** (seed fallará en frontend):
```typescript
{
  PK: `USER#${userId}`,
  SK: `APPOINTMENT#${id}`,
  startTime: "2025-10-24T08:00:00.000Z",  // Solo ISO
  endTime: "2025-10-24T08:30:00.000Z"
  // ⚠️ FALTA date y time separados
}
```

**✅ CORRECTO** (funciona con handler):
```typescript
{
  PK: `USER#${userId}`,
  SK: `APPOINTMENT#${id}`,
  date: "2025-10-24",                     // ✅ Campo separado
  time: "08:00",                          // ✅ Campo separado
  startTime: "2025-10-24T08:00:00.000Z",  // ✅ También incluir ISO
  endTime: "2025-10-24T08:30:00.000Z"
}
```

### 📋 Template Completo para Seed Scripts:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = 'Appointments';

// ⚠️ SIEMPRE verificar el userId correcto:
// - Valerie: '5fabb21e-3722-43ab-b491-5e53a45f9616'
// - Oscar: 'user_2ou2yWhWI2pF5r4Zs9MbjCjPYHM'
const USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616'; // Valerie
const USER_NAME = 'Valerie Sofia Martinez';

// Fecha objetivo
const TARGET_DATE = '2025-10-24'; // YYYY-MM-DD

async function createAppointment(appointmentData: {
  location: Location,
  customer: Customer,
  service: string,
  time: string // "08:00" format
}) {
  const serviceDetails = SERVICES.find(s => s.name === appointmentData.service);
  const startTime = `${TARGET_DATE}T${appointmentData.time}:00.000Z`;
  const endTime = new Date(
    new Date(startTime).getTime() + serviceDetails!.duration * 60000
  ).toISOString();

  const appointmentId = `APT-${uuidv4().substring(0, 8)}`;
  const now = new Date().toISOString();

  const appointment = {
    // ⚠️ Keys principales
    PK: `USER#${USER_ID}`,
    SK: `APPOINTMENT#${appointmentId}`,
    
    // ⚠️ IDs
    appointmentId,
    userId: USER_ID,
    businessId: appointmentData.location.businessId,
    locationId: appointmentData.location.locationId,
    customerId: appointmentData.customer.id,
    specialistId: USER_ID,
    
    // ⚠️ Nombres
    customerName: appointmentData.customer.name,
    specialistName: USER_NAME,
    locationName: appointmentData.location.name,
    serviceType: appointmentData.service,
    
    // ⚠️ CRÍTICO: Fecha/hora separados
    date: TARGET_DATE,              // ✅ "YYYY-MM-DD"
    time: appointmentData.time,     // ✅ "HH:MM"
    startTime,                      // ISO completo
    endTime,                        // ISO completo
    estimatedDuration: serviceDetails!.duration,
    
    // ⚠️ Status y metadata
    status: 'confirmed',
    resourceId: `RES-${appointmentData.location.locationId}`,
    notes: `Cita generada automáticamente`,
    
    // ⚠️ Location completa
    location: {
      name: appointmentData.location.name,
      address: appointmentData.location.address,
      city: appointmentData.location.city,
      latitude: appointmentData.location.coordinates.latitude,
      longitude: appointmentData.location.coordinates.longitude
    },
    
    // Timestamps
    createdAt: now,
    updatedAt: now,
    
    // ⚠️ GSI Keys
    GSI1PK: `DATE#${TARGET_DATE}`,
    GSI1SK: `USER#${USER_ID}#${startTime}`,
    GSI2PK: `LOCATION#${appointmentData.location.locationId}`,
    GSI2SK: `DATE#${TARGET_DATE}#${startTime}`
  };

  await docClient.send(new PutCommand({
    TableName: APPOINTMENTS_TABLE,
    Item: appointment
  }));

  return appointment;
}
```

### 🔍 Por Qué `date` y `time` Separados:

**Razón**: El handler `/api/appointments` usa estos campos para filtrar "upcoming appointments":

```typescript
// Handler code (appointments.ts líneas 42-48):
appointments = items.filter((item: any) => {
  // Comparar fecha y hora
  if (item.date > todayStr) return true; // ✅ Usa 'date'
  if (item.date === todayStr && item.time >= currentTimeStr) return true; // ✅ Usa 'time'
  return false;
});
```

**Sin estos campos**: El dashboard mostrará "No upcoming appointments" aunque existan citas en DynamoDB.

### ✅ Checklist para Nuevos Seeds:

- [ ] Verificar `userId` correcto (Valerie vs Oscar)
- [ ] Incluir campos `date` (YYYY-MM-DD) y `time` (HH:MM)
- [ ] Incluir `startTime` y `endTime` en ISO 8601
- [ ] Objeto `location` completo con coordenadas
- [ ] Status válido ('confirmed', 'pending', etc.)
- [ ] GSI1PK y GSI1SK para búsqueda por fecha
- [ ] GSI2PK y GSI2SK para búsqueda por location
- [ ] `estimatedDuration` en minutos
- [ ] Probar con `npx tsx scripts/nombre-del-seed.ts`

### 📝 Ejemplo Completo Funcional:

Ver archivo: `/lambdas/data-handler/scripts/seed-appointments-oct24.ts`

---

## 👥 Usuarios del Sistema

### Usuarios Conocidos:

#### 1. **Valerie Sofia Martinez** (Usuario Principal)
```typescript
userId: '5fabb21e-3722-43ab-b491-5e53a45f9616'
name: 'Valerie Sofia Martinez'
role: 'Especialista' // Atiende citas en múltiples negocios
```
**Uso**: Usuario principal para pruebas y desarrollo

#### 2. **Oscar Marin** (Usuario Secundario)
```typescript
userId: 'user_2ou2yWhWI2pF5r4Zs9MbjCjPYHM'
name: 'Oscar Marin'
role: 'Especialista'
```
**Uso**: Usuario alternativo para pruebas multi-usuario

### ⚠️ IMPORTANTE: Verificar Usuario Antes de Seeds

**Siempre confirmar** qué usuario debe recibir las citas:
```typescript
// ❌ INCORRECTO: Asumir usuario
const USER_ID = 'user_2ou2yWhWI2pF5r4Zs9MbjCjPYHM'; // Oscar

// ✅ CORRECTO: Preguntar o verificar contexto
const USER_ID = '5fabb21e-3722-43ab-b491-5e53a45f9616'; // Valerie (usuario principal)
```

---

## �📁 Archivos Clave Modificados

### Archivos Principales:
1. `frontend/src/App.tsx` - Integración ThemeProvider + RegistrationForm
2. `frontend/src/components/RegistrationForm.tsx` - Pantalla principal
3. `frontend/src/utils/brandConfig.ts` - Configuración dinámica
4. `frontend/src/contexts/ThemeContext.tsx` - Manejo de temas
5. `frontend/tailwind.config.js` - Colores y configuración custom
6. `frontend/index.html` - Google Fonts (Inter)
7. `README.md` - Documentación completa de personalización

### Archivos de Componentes UI:
- `Button.tsx` - 4 variantes (primary, secondary, outline, ghost)
- `Input.tsx` - Con iconos, validación, password toggle
- `Card.tsx` - Glassmorphism configurable
- `Icon.tsx` - 9 iconos SVG disponibles
- `Logo.tsx` - Sistema de logo dinámico

---

## 🎨 Personalización Rápida

### Para cambiar branding:
1. **Editar**: `frontend/src/utils/brandConfig.ts`
2. **Nombre**: Cambiar `platform.name`
3. **Color**: Cambiar `branding.primaryColor`
4. **Logo**: Cambiar `logoType` y `logoConfig`
5. **Textos**: Modificar `content.registration`

### Iconos Disponibles:
`user`, `calendar`, `star`, `heart`, `settings`, `google`, `moon`, `sun`, `eye`, `eyeOff`

---

## 🛣️ Próximos Pasos Sugeridos

### Immediate Next Steps:
1. **Pantalla de Login** (similar al registro)
2. **Dashboard principal** (post-login)
3. **Navegación** entre pantallas
4. **Integración con Lambda** (API calls)
5. **Autenticación real** (JWT/OAuth)

### Componentes UI Pendientes:
- `Modal.tsx` - Para dialogs
- `Dropdown.tsx` - Menús desplegables  
- `Table.tsx` - Para datos tabulares
- `Toast.tsx` - Notificaciones
- `Navigation.tsx` - Menu principal

### Backend Integration:
- Conectar formulario con Lambda
- Implementar autenticación
- Base de datos (DynamoDB)
- Validación server-side

---

## 📝 Decisiones de Arquitectura

### Por qué estas tecnologías:
- **Vite**: Hot reload ultra-rápido vs Create React App
- **Tailwind**: Utility-first, fácil responsive
- **TypeScript**: Type safety para mejor DX
- **Glassmorphism**: Diseño moderno, diferenciación visual
- **Sistema dinámico**: Reutilización para múltiples marcas

### Patrones Implementados:
- **Compound Components**: Button + Icon
- **Configuration Driven**: brandConfig.ts
- **Context Pattern**: ThemeContext
- **Custom Hooks**: useBrandConfig, useTheme
- **Component Composition**: UI components reutilizables

---

## 🔍 Como usar esta memoria:

### Para continuar desarrollo:
1. **Lee esta memoria** antes de nuevas features
2. **Actualiza esta memoria** cuando agregues nuevos componentes
3. **Referencia los patrones** ya establecidos
4. **Mantén la consistencia** de naming y estructura

### Para nuevas pantallas:
1. **Usa los componentes UI** existentes
2. **Sigue el patrón** de RegistrationForm
3. **Integra con brandConfig** para personalización
4. **Mantén responsive** design

---

**Última actualización**: 2 de octubre de 2025  
**Estado**: Pantalla de registro completada y funcional  
**Siguiente sesión**: Leer esta memoria + definir próxima feature