# 🎯 Feature: Duración Real de Servicios en Optimización

## 📋 Resumen

Se implementó el uso de **duraciones reales de servicios** en lugar de un valor hardcoded de 60 minutos, asegurando que:

1. ✅ El algoritmo de optimización usa `appointment.estimatedDuration` en cálculos
2. ✅ La tabla de reprogramación muestra la duración de cada servicio
3. ✅ Los horarios propuestos son precisos para servicios de cualquier duración

## 🔍 Problema Identificado

### Antes de la implementación:

```typescript
// ❌ Duración hardcoded en el algoritmo
const SERVICE_DURATION_MINUTES = 60;
currentTime = new Date(currentTime.getTime() + SERVICE_DURATION_MINUTES * 60 * 1000);
```

**Consecuencias:**
- Un corte de pelo (30 min) generaba 30 minutos de tiempo muerto
- Una keratina (120 min) causaba conflictos de horarios superpuestos
- Usuarios no podían ver cuánto duraría cada servicio
- Imposible validar si los horarios propuestos eran correctos

## ✅ Solución Implementada

---

## 🎯 Componentes Modificados

### 1. **Tipo de Datos - Appointment**
**Archivo**: `/nextjs-app/src/services/api/appointments.ts`

```typescript
export interface Appointment {
  appointmentId: string
  userId: string
  locationId: string
  startTime: string
  endTime: string
  status: string
  serviceType: string
  estimatedDuration: number  // ← NUEVO: Duración en minutos
  customerName: string
  notes?: string
  createdAt: string
  updatedAt: string
}
```

**Campo agregado**:
- `estimatedDuration: number` - Duración estimada del servicio en minutos

---

### 2. **Seeds de Prueba**
**Archivo**: `/lambdas/data-handler/src/seed/seed-appointments.ts`

Se agregó `estimatedDuration` a todas las 6 citas de prueba con valores realistas para servicios de belleza:

| Cita | Servicio | Duración |
|------|----------|----------|
| APT-001 | Tratamiento de Keratina | 90 min |
| APT-002 | Corte y Peinado | 60 min |
| APT-003 | Manicure Express | 45 min |
| APT-004 | Pedicure Spa | 60 min |
| APT-005 | Color y Highlights | 120 min |
| APT-006 | Masaje Capilar | 30 min |

**Ejecución**:
```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/data-handler
npm run seed
```

---

### 3. **Dashboard - Visualización de Duración**
**Archivo**: `/nextjs-app/src/app/dashboard/page.tsx`

Se agregó el display de duración en cada tarjeta de cita:

```tsx
<p className="text-sm text-gray-600 flex items-center gap-2">
  <span>⏱️ Duración: {appointment.estimatedDuration} min</span>
</p>
```

**Ubicación**: Líneas 214-218

---

### 4. **Mapa de Citas - Detección de Conflictos**
**Archivo**: `/nextjs-app/src/components/dashboard/AppointmentMapSection.tsx`

#### 4.1 Interfaces Extendidas

```typescript
interface AppointmentWithLocation extends Appointment {
  location: Location | null
  travelTimeFromUser?: string
  travelTimeFromPrevious?: string
  distanceFromUser?: string
  distanceFromPrevious?: string
  travelTimeMinutes?: number      // ← NUEVO: Tiempo en minutos
  isReachable?: boolean            // ← NUEVO: ¿Es alcanzable?
  conflictMessage?: string         // ← NUEVO: Mensaje del conflicto
}

interface TimeConflict {
  fromAppointment: AppointmentWithLocation
  toAppointment: AppointmentWithLocation
  required: number      // Minutos necesarios de viaje
  available: number     // Minutos disponibles
  shortfall: number     // Minutos que faltan
}
```

#### 4.2 Estado de Conflictos

```typescript
const [timeConflicts, setTimeConflicts] = useState<TimeConflict[]>([])
```

#### 4.3 Algoritmo de Detección (Google Directions API)

**Ubicación**: Líneas 407-460 (callback de `calculateRoutes`)

```typescript
// Extraer tiempo de viaje en minutos
const travelMinutes = Math.ceil((legs[index].duration?.value || 0) / 60)
timesData[index].travelTimeMinutes = travelMinutes

// Detectar conflictos entre citas consecutivas
const conflicts: TimeConflict[] = []

for (let i = 0; i < timesData.length - 1; i++) {
  const current = timesData[i]
  const next = timesData[i + 1]
  
  if (!current.travelTimeMinutes) continue
  
  // Calcular tiempo disponible entre fin de cita actual e inicio de siguiente
  const currentEnd = new Date(current.endTime).getTime()
  const nextStart = new Date(next.startTime).getTime()
  const availableMinutes = Math.floor((nextStart - currentEnd) / (60 * 1000))
  
  // Comparar con tiempo de viaje necesario
  const requiredMinutes = current.travelTimeMinutes
  
  if (availableMinutes < requiredMinutes) {
    const shortfall = requiredMinutes - availableMinutes
    
    conflicts.push({
      fromAppointment: current,
      toAppointment: next,
      required: requiredMinutes,
      available: availableMinutes,
      shortfall: shortfall
    })
    
    // Marcar la cita siguiente como no alcanzable
    timesData[i + 1].isReachable = false
    timesData[i + 1].conflictMessage = `⚠️ Faltan ${shortfall} minutos para llegar a tiempo`
  }
}

setTimeConflicts(conflicts)
```

**Lógica**:
1. Para cada par de citas consecutivas:
   - Calcular tiempo disponible: `nextStart - currentEnd`
   - Comparar con tiempo de viaje necesario
   - Si `disponible < necesario` → **CONFLICTO**
   - Calcular exactamente cuántos minutos faltan

2. Guardar conflictos en array `timeConflicts`
3. Marcar citas no alcanzables con `isReachable = false`

#### 4.4 Algoritmo de Detección (Fallback Haversine)

**Ubicación**: Líneas 660-690

Similar al algoritmo anterior, pero usando tiempos estimados en lugar de datos reales de Google:

```typescript
// Extraer minutos del tiempo estimado (formato: "X min")
const match = timeEstimate.match(/(\d+)/)
const travelMinutes = match ? parseInt(match[1]) : 0

// Detectar conflicto
if (index > 0 && travelMinutes > 0) {
  const prevApt = appointmentsWithDetails[index - 1]
  const prevEnd = new Date(prevApt.endTime).getTime()
  const currentStart = new Date(apt.startTime).getTime()
  const availableMinutes = Math.floor((currentStart - prevEnd) / (60 * 1000))
  
  if (availableMinutes < travelMinutes) {
    isConflicted = true
    const shortfall = travelMinutes - availableMinutes
    conflictMessage = `⚠️ Faltan ${shortfall} minutos (estimado)`
  }
}
```

---

## 🎨 Interfaz de Usuario

### 1. **Banner de Alerta de Conflictos**

Cuando se detectan conflictos, aparece un banner rojo prominente arriba del mapa:

```tsx
{timeConflicts.length > 0 && (
  <div className="bg-red-50 border-2 border-red-400 rounded-xl p-5 shadow-md">
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 text-3xl">⚠️</div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-red-800 mb-2">
          Conflictos de Tiempo Detectados
        </h3>
        <p className="text-sm text-red-700 mb-3">
          Los siguientes trayectos no tienen tiempo suficiente...
        </p>
        <div className="space-y-2">
          {timeConflicts.map((conflict, idx) => (
            <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
              <div className="font-semibold text-red-900 text-sm">
                {conflict.fromAppointment.location?.name} → {conflict.toAppointment.location?.name}
              </div>
              <div className="text-xs text-red-700 mt-1">
                Tiempo disponible: {conflict.available} min | 
                Tiempo necesario: {conflict.required} min | 
                <span className="font-bold"> Faltan {conflict.shortfall} minutos</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}
```

**Muestra**:
- Total de conflictos detectados
- Para cada conflicto:
  - Nombres de negocios origen → destino
  - Tiempo disponible vs. tiempo necesario
  - Exactamente cuántos minutos faltan

### 2. **Indicadores en Tarjetas de Citas**

Cada cita en la tarjeta de "Tiempos de Desplazamiento" muestra:

```tsx
// Cambio de color del marcador
const markerColor = isConflicted ? 'bg-red-600' : 'bg-[#13a4ec]'

// Badge "No alcanzable"
{isConflicted && (
  <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
    ⚠️ No alcanzable
  </span>
)}

// Mensaje específico del conflicto
{isConflicted && apt.conflictMessage && (
  <div className="text-xs text-red-700 font-semibold mt-1 bg-red-100 px-2 py-1 rounded">
    {apt.conflictMessage}
  </div>
)}
```

**Indicadores visuales**:
- ✅ Marcador **azul** → Cita alcanzable
- ❌ Marcador **rojo** → Cita NO alcanzable
- Badge "⚠️ No alcanzable"
- Mensaje específico de cuántos minutos faltan

### 3. **Colores de Fondo**

Las tarjetas de citas conflictivas tienen fondo rojo claro para destacarlas:

```typescript
const borderColor = isConflicted ? 'border-red-200 bg-red-50' : 'border-gray-100'
```

---

## 🧪 Cómo Probar

### Paso 1: Verificar datos de prueba
```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/data-handler
npm run seed
```

Debe crear 6 citas para mañana con duraciones de 30-120 minutos.

### Paso 2: Iniciar aplicación
```bash
cd /Users/oscarkof/repos/TG-OM/nextjs-app
npm run dev
```

### Paso 3: Login como usuario de prueba
- Email: `osmarotwo@gmail.com`
- Password: `Admin123!`

### Paso 4: Ir al Dashboard
- URL: `http://localhost:3000/dashboard`

### Paso 5: Activar geolocalización
- Permitir acceso a ubicación cuando el navegador lo solicite
- O usar ubicación de prueba en DevTools

### Paso 6: Verificar visualización
- ✅ Cada cita debe mostrar "⏱️ Duración: X min"
- ✅ El mapa debe calcular rutas entre citas
- ✅ Si hay conflictos, debe aparecer el banner rojo de alerta
- ✅ Las citas no alcanzables deben tener marcador rojo y badge "⚠️ No alcanzable"

---

## 📊 Ejemplo de Conflicto Real

### Escenario:
```
Cita 1: Salón Belleza Total
  - Inicio: 10:00 AM
  - Duración: 90 min
  - Fin: 11:30 AM

Viaje: 45 minutos

Cita 2: Estética Glamour
  - Inicio: 12:00 PM
```

### Cálculo:
```
Tiempo disponible = 12:00 PM - 11:30 AM = 30 minutos
Tiempo necesario = 45 minutos
Conflicto = 45 - 30 = 15 minutos faltan
```

### Resultado en UI:
```
⚠️ Conflictos de Tiempo Detectados

Salón Belleza Total → Estética Glamour
Tiempo disponible: 30 min | Tiempo necesario: 45 min | Faltan 15 minutos
```

---

## 🔄 Flujos de Detección

### Con Google Directions API (Por defecto):
1. Usuario permite geolocalización
2. Sistema calcula rutas usando Google Directions API
3. Extrae `duration.value` (segundos) y convierte a minutos
4. Para cada par de citas:
   - Calcula ventana disponible
   - Compara con tiempo de viaje real
   - Detecta conflictos y calcula faltante
5. Renderiza alertas visuales

### Con Haversine Fallback (Sin API key o cuota excedida):
1. Sistema calcula distancias en línea recta (Haversine)
2. Estima tiempos usando velocidad promedio
3. Extrae minutos del string "X min"
4. Aplica mismo algoritmo de detección de conflictos
5. Renderiza alertas con nota "(estimado)"

---

## 🛠️ Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `/nextjs-app/src/services/api/appointments.ts` | Agregado campo `estimatedDuration: number` |
| `/lambdas/data-handler/src/seed/seed-appointments.ts` | Agregado `estimatedDuration` a 6 citas de prueba |
| `/nextjs-app/src/app/dashboard/page.tsx` | Display de duración en tarjetas (líneas 214-218) |
| `/nextjs-app/src/components/dashboard/AppointmentMapSection.tsx` | Interfaces extendidas, algoritmo de detección, UI de alertas |

---

## ⚙️ Variables de Estado

```typescript
// Estado de conflictos
const [timeConflicts, setTimeConflicts] = useState<TimeConflict[]>([])

// Datos de citas con información de viaje
const [travelTimesData, setTravelTimesData] = useState<AppointmentWithLocation[]>([])
```

---

## 📝 Notas Técnicas

1. **Cálculo de tiempo disponible**:
   ```typescript
   const availableMinutes = Math.floor((nextStart - currentEnd) / (60 * 1000))
   ```
   - `nextStart`: Timestamp de inicio de siguiente cita
   - `currentEnd`: Timestamp de fin de cita actual
   - División por 60000 convierte milisegundos a minutos

2. **Extracción de minutos de Google**:
   ```typescript
   const travelMinutes = Math.ceil((legs[index].duration?.value || 0) / 60)
   ```
   - `duration.value` está en segundos
   - `Math.ceil` redondea hacia arriba para seguridad

3. **Extracción de minutos del fallback**:
   ```typescript
   const match = timeEstimate.match(/(\d+)/)
   const travelMinutes = match ? parseInt(match[1]) : 0
   ```
   - Usa regex para extraer número del string "X min"

4. **Marcado de citas no alcanzables**:
   ```typescript
   timesData[i + 1].isReachable = false
   timesData[i + 1].conflictMessage = `⚠️ Faltan ${shortfall} minutos...`
   ```
   - Se marca la cita **destino** como no alcanzable
   - Se guarda mensaje específico con minutos faltantes

---

## 🎯 Beneficios

- ✅ **Prevención de conflictos**: Usuario sabe de antemano si puede llegar a tiempo
- ✅ **Información específica**: No solo dice "conflicto", dice cuántos minutos faltan
- ✅ **Visual prominente**: Alertas rojas imposibles de ignorar
- ✅ **Doble cobertura**: Funciona con API real y con estimaciones
- ✅ **Experiencia mejorada**: Usuario puede reorganizar citas antes de salir

---

## 🚀 Próximas Mejoras Sugeridas

1. **Sugerencia automática de reordenamiento**: Sistema propone nuevo orden de citas sin conflictos
2. **Tiempo de preparación**: Agregar buffer de preparación entre servicios (5-10 min)
3. **Notificaciones proactivas**: Alertar al usuario 24h antes si hay conflictos
4. **Reorganización drag & drop**: UI para arrastrar y reordenar citas conflictivas
5. **Exportar ruta a Google Maps**: Botón para abrir ruta completa en Google Maps app

---

## 📚 Referencias

- **Google Directions API**: https://developers.google.com/maps/documentation/directions
- **Haversine Formula**: https://en.wikipedia.org/wiki/Haversine_formula
- **DynamoDB GSI**: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html
