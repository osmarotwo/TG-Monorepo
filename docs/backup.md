# 📋 INFORME DE IMPLEMENTACIÓN - DASHBOARD CLYOK

## 🎯 Objetivo
Implementar un dashboard completo para la plataforma Clyok que permita a administradores de negocios (ej: Camila - Administradora de Salón Aurora) visualizar:
- Top 2 próximas citas
- Ubicaciones de sus sedes/comercios en mapa
- Filtros por tipo de industria (salones de belleza, restaurantes, etc.)
- KPIs operativos clave

---

## 📊 Análisis del Diseño de Referencia

### Estructura identificada:
1. **Header sticky** con logo, navegación, notificaciones y avatar
2. **Welcome section** con mensaje personalizado
3. **Appointments grid** (responsive: 1 col móvil, 2 cols desktop)
4. **Map section** con imagen de mapa
5. **Nearby locations grid** (1 col móvil, 2 cols tablet, 3 cols desktop)
6. **Action buttons** (primario + secundario)

### Elementos a adaptar:
- ❌ Remover dark mode (dark:)
- ✅ Usar Clyok colors (#13a4ec, #f6f7f8)
- ✅ Usar Logo component existente
- ✅ Mantener glassmorphism (bg-white/50 backdrop-blur-sm)
- ✅ Añadir link a perfil de usuario
- ✅ Integrar sistema de filtros por industria

---

## 🏗️ ARQUITECTURA DE IMPLEMENTACIÓN

### **FASE 1: Backend - Base de Datos (DynamoDB)**

#### 1.1. Tablas a crear:

##### **Tabla: Appointments**
```
PK: APPOINTMENT#{appointmentId}
SK: METADATA

Atributos:
- appointmentId (string)
- businessId (string)
- locationId (string)
- userId (string) // Administrador que gestiona
- customerId (string) // Cliente final
- customerName (string)
- serviceType (string) // "Haircut", "Color", "Manicure"
- specialistName (string) // "Emily", "Laura"
- specialistId (string)
- startTime (string) // ISO 8601
- endTime (string)
- status (string) // "confirmed", "pending", "cancelled", "no-show", "completed"
- resourceId (string) // Cabina/silla/mesa asignada
- notes (string)
- createdAt (string)
- updatedAt (string)

GSI1:
- GSI1PK: USER#{userId}
- GSI1SK: APPOINTMENT#{startTime}
- Permite: Listar citas de un usuario ordenadas por fecha

GSI2:
- GSI2PK: LOCATION#{locationId}
- GSI2SK: APPOINTMENT#{startTime}
- Permite: Listar citas de una sede ordenadas por fecha

GSI3:
- GSI3PK: BUSINESS#{businessId}
- GSI3SK: STATUS#{status}#TIME#{startTime}
- Permite: Filtrar citas por negocio y estado
```

##### **Tabla: Businesses**
```
PK: BUSINESS#{businessId}
SK: METADATA

Atributos:
- businessId (string)
- name (string) // "Salón Aurora"
- industry (string) // "beauty", "restaurant", "retail", "logistics", "banking"
- ownerId (string) // Usuario dueño
- logoUrl (string)
- description (string)
- totalLocations (number)
- settings (object) // Configuraciones del negocio
- createdAt (string)
- updatedAt (string)

GSI1:
- GSI1PK: OWNER#{ownerId}
- GSI1SK: BUSINESS#{businessId}
- Permite: Listar negocios de un propietario
```

##### **Tabla: Locations**
```
PK: LOCATION#{locationId}
SK: METADATA

Atributos:
- locationId (string)
- businessId (string)
- name (string) // "Salón Aurora - Sede Chapinero"
- address (string)
- city (string)
- latitude (number)
- longitude (number)
- phone (string)
- imageUrl (string)
- resources (array) // [{id, name, type: "cabin/chair/table"}]
- specialists (array) // [{id, name, specialties: []}]
- operatingHours (object)
- status (string) // "active", "inactive"
- createdAt (string)
- updatedAt (string)

GSI1:
- GSI1PK: BUSINESS#{businessId}
- GSI1SK: LOCATION#{locationId}
- Permite: Listar sedes de un negocio

GSI2:
- GSI2PK: GEO#{city}
- GSI2SK: LOCATION#{locationId}
- Permite: Buscar por ciudad
```

##### **Tabla: KPIs** (opcional para caché de métricas)
```
PK: KPI#{locationId}#{period}
SK: METRIC#{metricType}

Atributos:
- locationId (string)
- period (string) // "2025-10-16", "2025-10"
- metricType (string) // "no-show-rate", "occupancy", "avg-ticket"
- value (number)
- target (number)
- calculatedAt (string)
```

---

### **FASE 2: Backend - Lambda Functions**

#### 2.1. Nuevo Lambda: `data-handler`

**Estructura:**
```
lambdas/data-handler/
├── src/
│   ├── index.ts (router principal)
│   ├── handlers/
│   │   ├── appointments.ts (GET /appointments, POST /appointments)
│   │   ├── locations.ts (GET /locations, GET /locations/{id})
│   │   ├── businesses.ts (GET /businesses, POST /businesses)
│   │   └── kpis.ts (GET /kpis/{locationId})
│   ├── utils/
│   │   ├── dynamodb.ts (helpers para DynamoDB)
│   │   ├── calculations.ts (cálculos de KPIs)
│   │   └── validators.ts (validaciones de datos)
│   └── types/
│       └── index.ts (TypeScript interfaces)
├── package.json
└── tsconfig.json
```

**Endpoints a implementar:**

```typescript
// GET /appointments?userId={userId}&limit=2&upcoming=true
// Retorna las próximas 2 citas del usuario
GET /api/appointments

// GET /locations?businessId={businessId}
// Retorna todas las sedes de un negocio
GET /api/locations

// GET /locations/{locationId}
// Retorna detalles de una sede específica
GET /api/locations/{id}

// GET /businesses?ownerId={ownerId}
// Retorna los negocios del usuario
GET /api/businesses

// GET /kpis/{locationId}?period=current-month
// Retorna KPIs de una sede
GET /api/kpis/{locationId}

// POST /appointments
// Crea una nueva cita (para botón "Book New Appointment")
POST /api/appointments
```

#### 2.2. CDK Stack Update: `data-stack.ts`

```typescript
// infrastructure/lib/data-stack.ts
export class DataStack extends cdk.Stack {
  - Crear tablas DynamoDB (Appointments, Businesses, Locations, KPIs)
  - Crear Lambda data-handler con permisos DynamoDB
  - Integrar con API Gateway existente
  - Crear rutas /api/appointments, /api/locations, etc.
  - Añadir JWT Authorizer para proteger endpoints
  - Output: API endpoints URLs
}
```

---

### **FASE 3: Frontend - Dashboard Component**

#### 3.1. Nueva página: page.tsx

**Componentes a crear:**

```
nextjs-app/src/
├── app/
│   └── dashboard-v2/
│       └── page.tsx (nuevo dashboard)
├── components/
│   ├── dashboard/
│   │   ├── AppointmentCard.tsx
│   │   ├── LocationCard.tsx
│   │   ├── KpiCard.tsx
│   │   ├── IndustryFilter.tsx
│   │   └── MapSection.tsx
│   └── (existentes: Logo, etc.)
├── services/
│   └── api/
│       ├── appointments.ts (fetch appointments)
│       ├── locations.ts (fetch locations)
│       └── kpis.ts (fetch KPIs)
└── types/
    └── dashboard.ts (interfaces TypeScript)
```

#### 3.2. Estructura del Dashboard:

```tsx
<div className="bg-[#f6f7f8] min-h-screen">
  {/* Header Sticky */}
  <header className="sticky top-0 z-10 bg-[#f6f7f8]/80 backdrop-blur-sm">
    <Logo />
    <nav>Home | Services | Appointments | Locations</nav>
    <div>
      <NotificationButton />
      <UserAvatar onClick={goToProfile} />
    </div>
  </header>

  {/* Main Content */}
  <main className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10">
    {/* Welcome Section */}
    <h2>Bienvenido/a de vuelta, {firstName}!</h2>
    <p>Resumen de tus próximas citas y ubicaciones.</p>

    {/* Industry Filter (NUEVO) */}
    <IndustryFilter 
      selected={selectedIndustry} 
      options={["beauty", "restaurant", "retail", "logistics", "banking"]}
      onChange={setSelectedIndustry}
    />

    {/* Upcoming Appointments */}
    <section>
      <h3>Próximas Citas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appointments.slice(0, 2).map(apt => (
          <AppointmentCard key={apt.id} appointment={apt} />
        ))}
      </div>
    </section>

    {/* KPIs Quick View (NUEVO) */}
    <section>
      <h3>Métricas Clave</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="No-show Rate" value={kpis.noShowRate} target={12} />
        <KpiCard label="Ocupación" value={kpis.occupancy} target={85} />
        <KpiCard label="Ticket Promedio" value={kpis.avgTicket} format="currency" />
      </div>
    </section>

    {/* Map + Nearby Locations */}
    <section>
      <h3>Mis Sedes</h3>
      <MapSection locations={locations} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(loc => (
          <LocationCard key={loc.id} location={loc} />
        ))}
      </div>
    </section>

    {/* Actions */}
    <div className="flex gap-4">
      <button className="bg-[#13a4ec]">Agendar Nueva Cita</button>
      <button className="bg-[#13a4ec]/10 text-[#13a4ec]">Ver Todas las Citas</button>
    </div>
  </main>
</div>
```

---

### **FASE 4: Datos de Prueba (Seed)**

#### 4.1. Script de Seed: `lambdas/data-handler/src/seed/seed-data.ts`

**Datos ficticios basados en Camila - Salón Aurora:**

```typescript
// Business
{
  businessId: "BIZ001",
  name: "Salón Aurora",
  industry: "beauty",
  ownerId: "{userId from Cognito/Auth}",
  logoUrl: "https://...",
  totalLocations: 5
}

// Locations (5 sedes)
[
  {
    locationId: "LOC001",
    businessId: "BIZ001",
    name: "Salón Aurora - Sede Chapinero",
    address: "Calle 63 #10-20",
    city: "Bogotá",
    latitude: 4.653,
    longitude: -74.057,
    imageUrl: "https://...",
    resources: [
      {id: "CAB001", name: "Cabina 1", type: "cabin"},
      {id: "CAB002", name: "Cabina 2", type: "cabin"}
    ],
    specialists: [
      {id: "SP001", name: "Emily", specialties: ["Haircut", "Color"]},
      {id: "SP002", name: "Laura", specialties: ["Manicure", "Pedicure"]}
    ]
  },
  // ... 4 sedes más (Chía, Usaquén, Suba, Kennedy)
]

// Appointments (10 citas de ejemplo)
[
  {
    appointmentId: "APT001",
    businessId: "BIZ001",
    locationId: "LOC001",
    customerId: "CUST001",
    customerName: "María González",
    serviceType: "Haircut",
    specialistName: "Emily",
    specialistId: "SP001",
    startTime: "2025-10-17T14:00:00Z", // Mañana 2 PM
    endTime: "2025-10-17T15:00:00Z",
    status: "confirmed",
    resourceId: "CAB001"
  },
  {
    appointmentId: "APT002",
    businessId: "BIZ001",
    locationId: "LOC002",
    customerId: "CUST002",
    customerName: "Ana Rodríguez",
    serviceType: "Color & Highlights",
    specialistName: "Laura",
    specialistId: "SP002",
    startTime: "2025-10-17T16:00:00Z", // Mañana 4 PM
    endTime: "2025-10-17T18:00:00Z",
    status: "confirmed",
    resourceId: "CAB002"
  },
  // ... 8 citas más con diferentes estados y fechas
]

// KPIs
{
  locationId: "LOC001",
  period: "2025-10",
  metrics: {
    noShowRate: 22,
    target: 12,
    occupancy: 74,
    avgTicket: 78000
  }
}
```

---

## 🛠️ STACK TECNOLÓGICO

### Backend:
- ✅ **AWS CDK** (TypeScript) - Infraestructura como código
- ✅ **DynamoDB** - Base de datos NoSQL serverless
- ✅ **Lambda** (Node.js 18.x) - Funciones serverless
- ✅ **API Gateway** - REST API con CORS
- ✅ **JWT Authorizer** - Autenticación existente

### Frontend:
- ✅ **Next.js 15.5.4** (React 19)
- ✅ **TypeScript**
- ✅ **Tailwind CSS v4** (configuración inline @theme)
- ✅ **Componentes existentes**: Logo, AuthContext

---

## 📦 PLAN DE IMPLEMENTACIÓN

### **SPRINT 1: Backend Foundation (4-6 horas)**

#### Tareas:
1. ✅ Crear CDK Stack: `infrastructure/lib/data-stack.ts`
   - Definir tablas DynamoDB (Appointments, Businesses, Locations, KPIs)
   - Configurar GSIs para consultas eficientes
   - Crear Lambda `data-handler`
   - Integrar con API Gateway
   - Añadir JWT Authorizer a rutas

2. ✅ Implementar Lambda handlers:
   - index.ts (router)
   - `handlers/appointments.ts` (GET top 2 upcoming)
   - `handlers/locations.ts` (GET por businessId)
   - `handlers/businesses.ts` (GET por ownerId)
   - `handlers/kpis.ts` (GET por locationId)

3. ✅ Crear script de seed:
   - `lambdas/data-handler/src/seed/seed-data.ts`
   - Poblar con datos de Salón Aurora
   - Script ejecutable: `npm run seed`

4. ✅ Deploy backend:
   ```bash
   cd infrastructure
   npm run build
   cdk deploy DataStack
   ```

---

### **SPRINT 2: Frontend Components (4-6 horas)**

#### Tareas:
1. ✅ Crear servicios API:
   - `nextjs-app/src/services/api/appointments.ts`
   - `nextjs-app/src/services/api/locations.ts`
   - `nextjs-app/src/services/api/kpis.ts`
   - Incluir JWT token en headers

2. ✅ Crear componentes de UI:
   - `components/dashboard/AppointmentCard.tsx`
     - Imagen, badge "Próxima cita", servicio, técnico, cliente, hora, botón "Ver detalles"
   - `components/dashboard/LocationCard.tsx`
     - Thumbnail 64px, nombre, distancia/dirección
   - `components/dashboard/KpiCard.tsx`
     - Label, valor actual, meta, progreso visual
   - `components/dashboard/IndustryFilter.tsx`
     - Chips seleccionables (beauty, restaurant, retail, etc.)
   - `components/dashboard/MapSection.tsx`
     - Placeholder de mapa (imagen o iframe futuro)

3. ✅ Implementar página dashboard:
   - page.tsx
   - Integrar todos los componentes
   - Fetch de datos desde API
   - Loading states
   - Error handling

---

### **SPRINT 3: Integration & Polish (2-4 horas)**

#### Tareas:
1. ✅ Integración completa:
   - Conectar frontend con backend
   - Validar JWT en todas las requests
   - Manejo de errores (401, 403, 500)

2. ✅ Responsive design:
   - Validar en móvil (1 col)
   - Tablet (2 cols)
   - Desktop (3 cols para locations)

3. ✅ Pulido visual:
   - Hover states en cards
   - Transiciones suaves
   - Loading skeletons
   - Empty states ("No tienes citas próximas")

4. ✅ Testing básico:
   - Verificar datos de seed se muestran correctamente
   - Probar filtros por industria
   - Validar navegación a perfil
   - Confirmar botones de acción

---

## 🎨 DISEÑO CLYOK COMPLIANCE

### Checklist de validación:
- ✅ Background página: `bg-[#f6f7f8]`
- ✅ Cards: `bg-white/50 backdrop-blur-sm rounded-xl shadow-sm`
- ✅ Color primario: `#13a4ec` (botones, links, badges)
- ✅ Hover botón primario: `hover:bg-[#0f8fcd]`
- ✅ Logo: Usar componente `<Logo>` existente
- ✅ Inputs (si aplica): `bg-[#f6f7f8] focus:ring-[#13a4ec]`
- ✅ No dark mode (eliminar todas las clases `dark:`)
- ✅ Font: Inter (ya configurado globalmente)
- ✅ Border radius: `rounded-xl` para cards, `rounded-lg` para elementos pequeños

---

## 📊 MODELO DE DATOS - EJEMPLO REAL

### Appointment Card (Next Appointment):
```json
{
  "appointmentId": "APT001",
  "customerName": "María González",
  "serviceType": "Corte con tratamiento",
  "specialistName": "Emily",
  "startTime": "2025-10-17T14:00:00Z",
  "endTime": "2025-10-17T15:00:00Z",
  "status": "confirmed",
  "locationName": "Salón Aurora - Sede Chapinero",
  "imageUrl": "https://placehold.co/400x300/13a4ec/white?text=Salon"
}
```

### Location Card:
```json
{
  "locationId": "LOC001",
  "name": "Salón Aurora - Sede Chapinero",
  "address": "Calle 63 #10-20, Bogotá",
  "distance": "1.2 km",
  "imageUrl": "https://placehold.co/64x64/13a4ec/white?text=Ch",
  "currentOccupancy": 74
}
```

### KPI Card:
```json
{
  "label": "Tasa de No-show",
  "value": 22,
  "target": 12,
  "unit": "%",
  "status": "warning"
}
```

---

## 🚀 COMANDOS DE DESPLIEGUE

### Backend:
```bash
# 1. Compilar Lambda data-handler
cd lambdas/data-handler
npm install
npm run build

# 2. Deploy infraestructura
cd ../../infrastructure
npm run build
cdk deploy DataStack --context frontendUrl=http://localhost:3000

# 3. Seed de datos (una vez desplegado)
cd ../lambdas/data-handler
npm run seed
```

### Frontend:
```bash
cd nextjs-app
npm run dev
# Navegar a: http://localhost:3000/dashboard-v2
```

---

## 🔒 SEGURIDAD

### Autenticación:
- ✅ JWT Authorizer en todos los endpoints `/api/*`
- ✅ Validación de `userId` en tokens para filtrar datos
- ✅ Solo mostrar datos del negocio del usuario autenticado

### Autorización:
- ✅ Query appointments WHERE userId = {token.userId}
- ✅ Query locations WHERE businessId IN (user.businesses)
- ✅ No exponer datos de otros usuarios/negocios

---

## 📈 MÉTRICAS DE ÉXITO

### Post-implementación:
1. ✅ Dashboard carga en <2 segundos
2. ✅ Top 2 appointments se muestran correctamente
3. ✅ Locations se listan con distancia/dirección
4. ✅ KPIs calculados y actualizados
5. ✅ Filtro por industria funciona (future-proof)
6. ✅ Responsive en móvil, tablet, desktop
7. ✅ Link a perfil de usuario funcional
8. ✅ Botón "Agendar nueva cita" navega a modal/página (futuro)

---

## 🔮 FUTURAS EXTENSIONES

### Fase 2 (opcional):
1. **Mapa interactivo real**:
   - Google Maps API o Mapbox
   - Pins por cada location
   - Click para ver detalles

2. **Filtros avanzados**:
   - Por estado de cita (confirmed, pending, cancelled)
   - Por rango de fechas
   - Por sede específica

3. **Vista de calendario**:
   - Calendario mensual con citas
   - Drag & drop para reprogramar

4. **Analytics dashboard**:
   - Gráficas de tendencias (no-show rate, occupancy)
   - Comparación mes a mes
   - Exportar reportes PDF

5. **Notificaciones en tiempo real**:
   - WebSockets para alertas de nuevas citas
   - Confirmaciones/cancelaciones

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| DynamoDB query muy lenta con muchas citas | Media | Alto | Usar GSIs optimizados + límite de 2 citas |
| Token JWT expirado en llamada API | Alta | Medio | Refresh token automático + error handling |
| Datos de seed no se cargan | Baja | Alto | Script idempotente + logs detallados |
| Responsive no funciona en móvil | Media | Medio | Testing en Chrome DevTools + real devices |
| Costos AWS inesperados | Baja | Medio | DynamoDB On-Demand + Lambda con timeout 30s |

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Para dar "GO":
1. ✅ Plan de arquitectura claro y completo
2. ✅ Modelo de datos definido (tablas + GSIs)
3. ✅ Endpoints API especificados con ejemplos
4. ✅ Componentes frontend listados con responsabilidades
5. ✅ Plan de seed con datos realistas
6. ✅ Cumplimiento del sistema de diseño Clyok
7. ✅ Estimación de tiempos (10-16 horas totales)
8. ✅ Riesgos identificados y mitigados

---

## 📋 RESUMEN EJECUTIVO

### **QUÉ se va a hacer:**
Dashboard interactivo para administradores de Clyok que muestra:
- Top 2 próximas citas con detalles visuales
- Sedes/ubicaciones del negocio con distancia
- KPIs operativos (no-show, ocupación, ticket promedio)
- Filtros por industria (beauty, restaurant, etc.)

### **CÓMO se va a hacer:**
- **Backend**: DynamoDB (4 tablas) + Lambda (Node.js 18) + API Gateway + JWT Auth
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS + Sistema Clyok
- **Datos**: Script de seed con datos de Salón Aurora (5 sedes, 10 citas)

### **CUÁNDO estará listo:**
- Sprint 1 (Backend): 4-6 horas
- Sprint 2 (Frontend): 4-6 horas
- Sprint 3 (Integration): 2-4 horas
- **Total estimado: 10-16 horas** (1.5-2 días de trabajo)

### **POR QUÉ esta arquitectura:**
- Serverless = sin gestión de servidores + costos optimizados
- DynamoDB = escalable + pay-per-request
- GSIs = queries eficientes para diferentes filtros
- Componentes reutilizables = mantenibilidad
- Sistema Clyok = consistencia visual

---

## 🎯 PRÓXIMOS PASOS

### **Una vez aprobado el informe:**
1. ✅ **Iniciar Sprint 1**: Crear DataStack en CDK
2. ✅ **Validar deployment**: Probar endpoints con Postman/curl
3. ✅ **Seed data**: Poblar tablas con datos de Salón Aurora
4. ✅ **Iniciar Sprint 2**: Crear componentes de frontend
5. ✅ **Integration testing**: Conectar frontend con backend
6. ✅ **Demo**: Mostrar dashboard funcional con datos reales

---

# 🚦 DECISIÓN

**¿Procedo con la implementación según este plan?**

**Opciones:**
1. ✅ **GO** - Iniciar Sprint 1 (Backend)
2. 🔄 **Ajustes** - Modificar algún aspecto del plan
3. ❓ **Dudas** - Aclarar algún punto antes de iniciar

**Responde con: GO / AJUSTES / DUDAS**

osmarotwo: bien, genera un documento que te sirva de memoria/instrucciones para generar esta implementacion que muy seguramente no alcancermos a implementar hoy por eso cuando mañana continuemos quedes donde vas 

GitHub Copilot: Perfecto! Voy a crear un documento completo de memoria/instrucciones para que mañana podamos continuar exactamente donde quedamos. 

osmarotwo: genera el documento con el informe que acabas de generar 

GitHub Copilot: Perfecto! Voy a crear un documento completo de memoria/instrucciones en la carpeta docs para que mañana puedas continuar exactamente donde quedamos. 