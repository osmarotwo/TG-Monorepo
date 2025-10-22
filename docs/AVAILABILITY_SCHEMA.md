# Sistema de Disponibilidad de Horarios

## 📊 Tablas DynamoDB

### 1. `BusinessHours` - Horarios de Operación del Negocio

**Descripción**: Define los horarios en que cada sede/location opera.

**Estructura**:
```typescript
{
  PK: "LOCATION#<locationId>",
  SK: "HOURS#<dayOfWeek>", // MONDAY, TUESDAY, etc.
  
  locationId: string,
  businessId: string,
  dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
  isOpen: boolean,
  openTime: string, // "08:00"
  closeTime: string, // "20:00"
  breakStart?: string, // "13:00" (opcional)
  breakEnd?: string, // "14:00" (opcional)
  
  createdAt: string,
  updatedAt: string,
}
```

**Ejemplo**:
```json
{
  "PK": "LOCATION#LOC001",
  "SK": "HOURS#MONDAY",
  "locationId": "LOC001",
  "businessId": "BIZ001",
  "dayOfWeek": "MONDAY",
  "isOpen": true,
  "openTime": "08:00",
  "closeTime": "20:00",
  "breakStart": "13:00",
  "breakEnd": "14:00"
}
```

---

### 2. `ServiceDurations` - Duración de Servicios

**Descripción**: Define cuánto dura cada tipo de servicio.

**Estructura**:
```typescript
{
  PK: "LOCATION#<locationId>",
  SK: "SERVICE#<serviceType>",
  
  locationId: string,
  businessId: string,
  serviceType: string, // "Corte y Peinado", "Manicure", etc.
  duration: number, // minutos
  bufferTime: number, // minutos de preparación/limpieza
  price: number,
  
  specialists: string[], // IDs de especialistas que pueden hacer este servicio
  
  createdAt: string,
  updatedAt: string,
}
```

**Ejemplo**:
```json
{
  "PK": "LOCATION#LOC001",
  "SK": "SERVICE#Corte y Peinado",
  "serviceType": "Corte y Peinado",
  "duration": 60,
  "bufferTime": 10,
  "price": 50000,
  "specialists": ["SP001", "SP002", "SP003"]
}
```

---

### 3. `SpecialistSchedule` - Agenda de Especialistas

**Descripción**: Agenda/calendario de cada especialista.

**Estructura**:
```typescript
{
  PK: "SPECIALIST#<specialistId>",
  SK: "DATE#<YYYY-MM-DD>",
  
  specialistId: string,
  locationId: string,
  date: string, // "2025-10-22"
  
  // Bloques de disponibilidad (slots de 15 minutos)
  availability: {
    [time: string]: "available" | "booked" | "blocked"
    // "08:00": "available",
    // "08:15": "available",
    // "08:30": "booked",
    // ...
  },
  
  // Citas reservadas
  appointments: string[], // appointmentIds
  
  createdAt: string,
  updatedAt: string,
}
```

**Ejemplo**:
```json
{
  "PK": "SPECIALIST#SP001",
  "SK": "DATE#2025-10-22",
  "specialistId": "SP001",
  "locationId": "LOC001",
  "date": "2025-10-22",
  "availability": {
    "08:00": "available",
    "08:15": "available",
    "08:30": "available",
    "08:45": "available",
    "09:00": "booked",
    "09:15": "booked",
    "09:30": "booked",
    "09:45": "booked"
  },
  "appointments": ["APT001"]
}
```

---

### 4. Tabla Existente `Appointments` - ACTUALIZACIÓN

Agregar campos:

```typescript
{
  // ... campos existentes ...
  
  // NUEVOS CAMPOS:
  canReschedule: boolean, // Si el cliente permite reprogramar
  flexibilityWindow: number, // Horas de flexibilidad (+/- X horas)
  
  originalStartTime?: string, // Horario original si fue reprogramada
  rescheduledBy?: "CUSTOMER" | "OPTIMIZATION" | "BUSINESS",
  rescheduledReason?: string,
}
```

---

## 🔌 FASE 2: APIs de Disponibilidad

### Endpoints Necesarios:

#### 1. `GET /api/availability/location/:locationId/date/:date`
Retorna slots disponibles en una sede para una fecha.

**Query params**:
- `serviceType`: Tipo de servicio
- `duration`: Duración en minutos

**Response**:
```json
{
  "date": "2025-10-22",
  "locationId": "LOC001",
  "availableSlots": [
    {
      "startTime": "08:00",
      "endTime": "09:00",
      "specialist": {
        "id": "SP001",
        "name": "Emily Rodríguez"
      }
    },
    {
      "startTime": "09:00",
      "endTime": "10:00",
      "specialist": {
        "id": "SP002",
        "name": "Andrea López"
      }
    }
  ]
}
```

#### 2. `POST /api/availability/check-multiple`
Verifica disponibilidad para múltiples citas simultáneamente.

**Request**:
```json
{
  "appointments": [
    {
      "locationId": "LOC001",
      "serviceType": "Corte y Peinado",
      "proposedTime": "2025-10-22T08:00:00Z"
    },
    {
      "locationId": "LOC002",
      "serviceType": "Manicure",
      "proposedTime": "2025-10-22T10:30:00Z"
    }
  ]
}
```

**Response**:
```json
{
  "results": [
    {
      "index": 0,
      "available": true,
      "specialist": "SP001"
    },
    {
      "index": 1,
      "available": false,
      "reason": "No specialists available",
      "alternatives": [
        {
          "startTime": "2025-10-22T10:00:00Z",
          "specialist": "SP005"
        },
        {
          "startTime": "2025-10-22T11:00:00Z",
          "specialist": "SP005"
        }
      ]
    }
  ]
}
```

---

## 🧠 FASE 3: Algoritmo de Optimización con Reprogramación

### Nuevo Flujo:

```
1. Obtener citas actuales del usuario
2. Calcular ruta geográficamente óptima (TSP)
3. Para cada cita en orden óptimo:
   a. Calcular tiempo de llegada
   b. SI llega antes del horario actual:
      - Mantener horario actual
   c. SI llega después:
      - Buscar slot disponible más cercano
      - Proponer nuevo horario
4. Validar que todos los horarios propuestos sean viables
5. Mostrar comparación: Original vs Optimizada (con nuevos horarios)
6. Permitir al usuario aceptar/rechazar
```

### Nuevo Tipo: `RescheduledAppointment`

```typescript
type RescheduledAppointment = {
  appointmentId: string
  
  // Original
  originalStartTime: Date
  originalEndTime: Date
  
  // Propuesto
  proposedStartTime: Date
  proposedEndTime: Date
  
  // Disponibilidad
  availableSlot: {
    specialist: {
      id: string
      name: string
    }
    confirmed: boolean
  }
  
  // Cambio
  timeChange: number // minutos de diferencia
  requiresApproval: boolean
}
```

---

## 🎨 FASE 4: UI Mejorada

### Nueva Tarjeta de Optimización:

```
┌──────────────────────────────────────────────────────────┐
│  ⚡ Optimización Sugerida                          [X]   │
│  Ahorra 1 hora y 29 km reprogramando 3 citas            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ❌ Ruta Actual                                          │
│  Distance: 165 km  │  Time: 4h 56min  │  Conflicts: 1  │
│                                                          │
│  Secuencia: 1 → 2 → 3 → 4 → 5 → 6                       │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ✅ Ruta Optimizada                                      │
│  Distance: 71 km  │  Time: 2h  │  Conflicts: 0         │
│                                                          │
│  Secuencia optimizada: 1 → 4 → 2 → 5 → 3 → 6           │
│                                                          │
│  ⚠️ Cambios de horario requeridos:                      │
│                                                          │
│  📍 Salón Aurora - Usaquén                               │
│     Original: 2:30 PM                                   │
│     Propuesto: 9:30 AM ✓ Disponible (Emily R.)         │
│     Cambio: +5h más temprano                            │
│                                                          │
│  📍 Salón Aurora - Suba                                  │
│     Original: 7:00 PM                                   │
│     Propuesto: 1:00 PM ✓ Disponible (Diana T.)         │
│     Cambio: +6h más temprano                            │
│                                                          │
│  📍 Salón Aurora - Kennedy                               │
│     Original: 2:00 PM                                   │
│     Propuesto: 3:00 PM ✓ Disponible (Laura G.)         │
│     Cambio: +1h más tarde                               │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  💰 Ahorrarías con esta optimización:                    │
│  ⏱️  Tiempo: 1 hora (~33%)                              │
│  📏 Distancia: 29 km (~29%)                             │
│  💵 Gasolina: ~$15,000 COP                              │
│                                                          │
│  🗺️ [Ver Comparación en Mapa]                          │
│                                                          │
│  [Ver Detalles]  [💡 Aplicar Optimización]             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Implementación Paso a Paso

¿Por dónde empezamos?

1. ✅ **Crear tablas DynamoDB** (BusinessHours, ServiceDurations, SpecialistSchedule)
2. ✅ **Seed de datos de prueba** (horarios, servicios, especialistas)
3. ✅ **API de disponibilidad** (handlers + endpoints)
4. ✅ **Algoritmo de optimización mejorado** (con reprogramación)
5. ✅ **UI actualizada** (mostrar cambios de horario)

**¿Empezamos con la creación de las tablas en DynamoDB?**
