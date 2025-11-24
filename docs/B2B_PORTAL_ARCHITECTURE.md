# Portal B2B - Arquitectura y Plan de Implementación

**Fecha de creación:** 23 de noviembre de 2025  
**Rama:** feature/frontend-user  
**Estado:** Documentación inicial

---

## 📋 Resumen Ejecutivo

El Portal B2B permitirá a los negocios (peluquerías, spas, clínicas, etc.) gestionar sus datos y configuraciones de forma autónoma. Reutiliza toda la infraestructura existente del portal B2C (cliente final), agregando solo las interfaces de administración y permisos necesarios.

**Principio clave:** El portal B2B es la **interfaz de escritura** para que los negocios creen/editen sus datos. El portal B2C es la **interfaz de lectura** para que los clientes reserven servicios.

---

## 🏗️ Arquitectura Actual (Reutilizable)

### Tablas DynamoDB Existentes

| Tabla | Uso Actual | Uso en B2B |
|-------|-----------|------------|
| `Businesses` | Datos de negocios (seed data) | CRUD completo por negocio owner |
| `Locations` | Sedes de cada negocio | CRUD por negocio owner |
| `Services` | Servicios por sede | CRUD por negocio owner |
| `Availability` | Horarios y slots disponibles | Configuración por negocio |
| `Appointments` | Citas reservadas | Vista de citas del negocio |
| `Users` | Usuarios del sistema | **Extender** con businessId y role |
| `Sessions` | Sesiones JWT | Sin cambios |

### Lambdas Existentes

**Auth Handler** (`auth-handler`)
- ✅ Ya existe: Login, registro, OAuth, JWT
- 🔨 Agregar: Campos businessId y role en Users

**Data Handler** (`data-handler`)
- ✅ Ya existe: GET endpoints para consultas B2C
  - GET /businesses
  - GET /businesses/{id}
  - GET /locations
  - GET /services
  - GET /availability
  - POST /appointments
- 🔨 Agregar: Endpoints de escritura para B2B
  - POST/PUT/DELETE /businesses
  - POST/PUT/DELETE /locations
  - POST/PUT/DELETE /services
  - POST/PUT/DELETE /availability
  - GET /appointments/business/{businessId}

---

## 🎯 Estructura del Portal B2B

### Flujo de Registro y Onboarding

```
1. Usuario se registra → tabla Users (profileType: 'business')
2. Completa perfil personal → profileCompleted: true
3. Crea comercio → tabla Businesses (status: 'pending')
4. Admin plataforma revisa → status: 'active'
5. Owner configura sedes → tabla Locations
6. Owner configura servicios → tabla Services
7. Owner configura disponibilidad → tabla Availability
8. Clientes pueden reservar en portal B2C
```

### Roles y Permisos

| Role | Permisos |
|------|----------|
| `business-owner` | Crear comercio, gestionar todo, ver estadísticas |
| `business-manager` | Gestionar sedes, servicios, disponibilidad, ver citas |
| `business-staff` | Solo ver citas y marcar como completadas |
| `platform-admin` | Aprobar/rechazar comercios, ver todos los datos |

### Rutas del Portal B2B

```
/business/register                          → Crear nuevo comercio
/business/[businessId]/dashboard           → Dashboard principal
/business/[businessId]/profile             → Editar datos del comercio
/business/[businessId]/locations           → Listar sedes
/business/[businessId]/locations/new       → Crear sede
/business/[businessId]/locations/[id]      → Editar sede
/business/[businessId]/services            → Listar servicios
/business/[businessId]/services/new        → Crear servicio
/business/[businessId]/services/[id]       → Editar servicio
/business/[businessId]/availability        → Configurar horarios
/business/[businessId]/appointments        → Ver citas del negocio
/business/[businessId]/team                → Gestionar usuarios del negocio
/business/[businessId]/stats               → Estadísticas y reportes

/admin/businesses                          → Revisar comercios pendientes
/admin/businesses/[id]/approve             → Aprobar comercio
```

---

## 📊 Modelos de Datos

### Users (Extender tabla existente)

```typescript
interface User {
  // Campos existentes
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileCompleted: boolean;
  
  // NUEVOS campos B2B
  profileType?: 'customer' | 'business' | 'admin'; // Tipo de perfil
  businessId?: string;                              // ID del negocio asociado
  role?: 'business-owner' | 'business-manager' | 'business-staff' | 'platform-admin';
  businessPermissions?: string[];                   // Permisos específicos
}
```

### Businesses (Tabla existente - sin cambios mayores)

```typescript
interface Business {
  businessId: string;
  name: string;
  description: string;
  category: string;
  logo?: string;
  ownerId: string;              // userId del owner
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  taxId?: string;               // RUT/NIT/RFC
  legalName?: string;
  phone?: string;
  email?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Locations (Tabla existente - sin cambios)

```typescript
interface Location {
  locationId: string;
  businessId: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  phone?: string;
  hours?: {
    [day: string]: { open: string; close: string }[];
  };
  createdAt: string;
  updatedAt: string;
}
```

### Services (Tabla existente - sin cambios)

```typescript
interface Service {
  serviceId: string;
  businessId: string;
  locationId?: string;
  name: string;
  description: string;
  duration: number;     // minutos
  price: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## 🔐 Sistema de Autenticación y Permisos

### JWT Token (Extender payload existente)

```typescript
interface JWTPayload {
  // Campos existentes
  userId: string;
  email: string;
  sessionId: string;
  
  // NUEVOS campos B2B
  profileType?: 'customer' | 'business' | 'admin';
  businessId?: string;
  role?: string;
}
```

### Middleware de Permisos en Lambda

```typescript
// Verificar si usuario tiene acceso a un negocio
function canAccessBusiness(jwt: JWTPayload, businessId: string): boolean {
  if (jwt.role === 'platform-admin') return true;
  if (jwt.businessId === businessId) {
    return ['business-owner', 'business-manager', 'business-staff'].includes(jwt.role);
  }
  return false;
}

// Verificar si usuario puede editar
function canEditBusiness(jwt: JWTPayload, businessId: string): boolean {
  if (jwt.role === 'platform-admin') return true;
  if (jwt.businessId === businessId) {
    return ['business-owner', 'business-manager'].includes(jwt.role);
  }
  return false;
}
```

---

## 🛠️ Endpoints Lambda a Implementar

### Businesses

```
POST   /businesses                    → Crear comercio (requiere auth)
GET    /businesses/{id}               → Ya existe ✅
PUT    /businesses/{id}               → Actualizar comercio (requiere owner/admin)
DELETE /businesses/{id}               → Eliminar comercio (requiere owner/admin)
PUT    /businesses/{id}/approve       → Aprobar comercio (requiere platform-admin)
GET    /businesses/my                 → Obtener comercios del usuario autenticado
```

### Locations

```
POST   /locations                     → Crear sede (requiere owner/manager)
GET    /locations                     → Ya existe ✅
GET    /locations/{id}                → Ya existe ✅
PUT    /locations/{id}                → Actualizar sede (requiere owner/manager)
DELETE /locations/{id}                → Eliminar sede (requiere owner/manager)
```

### Services

```
POST   /services                      → Crear servicio (requiere owner/manager)
GET    /services                      → Ya existe ✅
GET    /services/{id}                 → Ya existe ✅
PUT    /services/{id}                 → Actualizar servicio (requiere owner/manager)
DELETE /services/{id}                 → Eliminar servicio (requiere owner/manager)
```

### Availability

```
POST   /availability                  → Crear horarios (requiere owner/manager)
GET    /availability                  → Ya existe ✅
PUT    /availability/{id}             → Actualizar horarios (requiere owner/manager)
DELETE /availability/{id}             → Eliminar horarios (requiere owner/manager)
```

### Appointments (Extender endpoints existentes)

```
GET    /appointments/business/{businessId}  → Listar citas del negocio
PUT    /appointments/{id}/status             → Marcar cita como completada/cancelada
```

---

## 🎨 Componentes UI a Desarrollar

### Componentes Nuevos

1. **BusinessForm** - Formulario crear/editar comercio
2. **LocationForm** - Formulario crear/editar sede con Google Maps
3. **ServiceForm** - Formulario crear/editar servicio
4. **AvailabilityScheduler** - Configurador visual de horarios
5. **BusinessStats** - Dashboard con métricas y gráficos
6. **AppointmentsList** - Lista de citas del negocio
7. **TeamManager** - Gestión de usuarios del negocio
8. **LocationPicker** - Selector de ubicación con mapa interactivo

### Componentes Reutilizables (del B2C)

- `<Logo>` - Logo de la plataforma
- `<LanguageSelector>` - Selector de idioma
- `<Navigation>` - Barra de navegación
- Formularios con validación
- Botones y inputs del sistema de diseño Clyok

---

## 📱 Páginas del Portal B2B

### 1. Dashboard Principal (`/business/[businessId]/dashboard`)

**Elementos:**
- Resumen de citas hoy/semana/mes
- Gráficos de ocupación
- Próximas citas
- Alertas y notificaciones
- Accesos rápidos a configuración

### 2. Registro de Comercio (`/business/register`)

**Campos:**
- Nombre del comercio
- Tipo de negocio (categoría)
- Descripción
- Logo (upload de imagen)
- Datos fiscales (opcional)
- Teléfono y email de contacto

**Flujo:**
1. Usuario completa formulario
2. Se crea registro en tabla Businesses con status: 'pending'
3. Se asigna businessId al usuario
4. Redirige a onboarding de configuración

### 3. Gestión de Sedes (`/business/[businessId]/locations`)

**Vista lista:**
- Tabla con todas las sedes
- Botones: Editar, Eliminar, Activar/Desactivar
- Botón "Nueva Sede"

**Formulario:**
- Nombre de la sede
- Dirección completa
- Selector de ubicación en mapa (Google Maps)
- Teléfono
- Horarios de atención por día
- Fotos de la sede (opcional)

### 4. Gestión de Servicios (`/business/[businessId]/services`)

**Vista lista:**
- Cards con servicios agrupados por categoría
- Filtros por sede, categoría, estado
- Botón "Nuevo Servicio"

**Formulario:**
- Nombre del servicio
- Descripción
- Duración (minutos)
- Precio
- Categoría
- Sede(s) donde se ofrece
- Estado (activo/inactivo)

### 5. Configurador de Disponibilidad (`/business/[businessId]/availability`)

**UI:**
- Selector de sede
- Calendario visual semanal
- Bloques de tiempo arrastrables
- Configuración por día:
  - Horas de inicio/fin
  - Intervalo de slots
  - Capacidad simultánea
- Excepciones (días festivos, vacaciones)

### 6. Citas del Negocio (`/business/[businessId]/appointments`)

**Funcionalidades:**
- Lista filtrable por fecha, sede, servicio, estado
- Vista de calendario
- Detalles de cada cita
- Acciones: Confirmar, Cancelar, Completar, Reagendar
- Búsqueda por cliente

---

## 🚀 Plan de Implementación (10 Tareas)

### Fase 1: Fundamentos (Tareas 1-2)
1. ✅ **Diseñar arquitectura del portal B2B** - Documento completado
2. **Extender sistema de autenticación**
   - Agregar campos businessId, role, profileType a tabla Users
   - Modificar auth-handler para incluir campos en JWT
   - Crear middleware de permisos

### Fase 2: Backend (Tareas 3-4)
3. **Crear endpoints Lambda para Businesses**
   - POST /businesses (crear comercio)
   - PUT /businesses/{id} (editar)
   - PUT /businesses/{id}/approve (aprobar - admin)
   - GET /businesses/my (mis comercios)

4. **Crear endpoints Lambda para Locations y Services**
   - POST/PUT/DELETE /locations
   - POST/PUT/DELETE /services
   - Validación de permisos en cada endpoint

### Fase 3: UI Core (Tareas 5-7)
5. **Página de registro de comercio**
   - `/business/register`
   - Formulario con validación
   - Upload de logo
   - Integración con Lambda

6. **Dashboard de comercio**
   - `/business/[businessId]/dashboard`
   - Resumen de citas
   - Estadísticas básicas
   - Navegación a otras secciones

7. **Gestión de sedes**
   - `/business/[businessId]/locations`
   - Lista de sedes
   - Formulario crear/editar
   - Integración Google Maps

### Fase 4: Funcionalidades Avanzadas (Tareas 8-10)
8. **Módulo de servicios**
   - `/business/[businessId]/services`
   - CRUD de servicios
   - Categorización

9. **Configurador de disponibilidad**
   - `/business/[businessId]/availability`
   - UI visual de horarios
   - Integración con tabla Availability

10. **Vista de citas del negocio**
    - `/business/[businessId]/appointments`
    - Lista y calendario
    - Gestión de estados

---

## 🎯 Input para Continuar Mañana

**Copia y pega esto al iniciar la sesión:**

```
Continúa con la implementación del Portal B2B según el documento /docs/B2B_PORTAL_ARCHITECTURE.md

Contexto:
- Portal B2C (cliente) ya funciona completamente en producción
- Tablas DynamoDB ya existen: Businesses, Locations, Services, Availability, Appointments, Users
- Lambda data-handler tiene endpoints GET funcionando
- Auth con Google OAuth funcionando
- Sistema de diseño Clyok implementado

Prioridad de implementación:
1. Extender tabla Users con campos: profileType, businessId, role
2. Modificar auth-handler para incluir nuevos campos en JWT
3. Crear endpoints de escritura en data-handler Lambda
4. Implementar página /business/register
5. Implementar dashboard /business/[businessId]/dashboard

Empecemos con la Tarea 2: Extender sistema de autenticación
```

---

## 📝 Notas Técnicas

### Consideraciones de Seguridad
- Todos los endpoints B2B requieren autenticación JWT
- Validar businessId en cada operación
- Logs de auditoría para cambios importantes
- Rate limiting por usuario

### Performance
- Cachear datos de negocios activos
- Índices GSI en DynamoDB para queries frecuentes
- Paginación en listas largas

### Internacionalización
- Reutilizar sistema de i18n existente
- Agregar traducciones para nuevas páginas B2B
- Soporte ES/EN desde el inicio

### Testing
- Tests unitarios para nuevos endpoints Lambda
- Tests de integración para flujo completo
- Tests E2E para registro y configuración de comercio

---

**Fin del documento**

*Este documento es la guía completa para la implementación del Portal B2B. Reutiliza toda la infraestructura existente y solo agrega las capas de administración necesarias.*
