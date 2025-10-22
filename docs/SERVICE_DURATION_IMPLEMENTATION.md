# Implementación de Duración de Servicios en Optimización de Rutas

**Fecha**: 21 de octubre de 2025  
**Estado**: ✅ Implementado  
**Prioridad**: CRÍTICA

---

## 📋 Resumen Ejecutivo

Se implementó el manejo correcto de la **duración de servicios** en el algoritmo de optimización de rutas y la interfaz de usuario. Antes de este cambio, el sistema usaba una duración hardcoded de 60 minutos para todos los servicios, lo que causaba cálculos incorrectos para servicios más cortos (ej: corte de cabello 30min) o más largos (ej: keratina 120min).

---

## 🎯 Objetivos

### Problema Identificado
1. ❌ **Algoritmo usaba duración hardcoded**: `SERVICE_DURATION_MINUTES = 60` para todos los servicios
2. ❌ **UI no mostraba duración**: La tabla de reprogramación no indicaba cuánto dura cada servicio
3. ❌ **Tipo incompleto**: `RescheduledAppointment` no incluía campo `durationMinutes`
4. ❌ **Cálculos incorrectos**: Horarios propuestos no reflejaban la duración real del servicio

### Impacto en Producción
- **Servicios cortos (30min)**: Generaban gaps de 30min innecesarios
- **Servicios largos (120min)**: Causaban solapamiento de citas
- **Confianza del usuario**: No podían verificar si los horarios propuestos eran correctos

---

## ✅ Solución Implementada

### 1. Actualización de Tipos (TypeScript)

#### Frontend: `/nextjs-app/src/services/api/availabilityService.ts`
```typescript
export interface RescheduledAppointment {
  appointmentId: string;
  clientName: string;
  serviceType: string;
  locationId: string;
  locationName: string;
  originalStartTime: string;
  originalEndTime: string;
  proposedStartTime: string;
  proposedEndTime: string;
  timeDifferenceMinutes: number;
  durationMinutes: number; // ✨ NUEVO: Duración del servicio
  specialistId: string;
  specialistName: string;
  status: 'proposed' | 'approved' | 'rejected';
  reason?: string;
}
```

#### Backend: `/lambdas/data-handler/src/types/availability.ts`
```typescript
export interface RescheduledAppointment {
  // ... campos existentes
  durationMinutes: number; // ✨ NUEVO: Duración estimada en minutos
  // ...
}
```

#### Algoritmo: `/nextjs-app/src/services/optimization/routeOptimizerWithRescheduling.ts`
```typescript
export interface Appointment {
  id: string;
  locationId: string;
  locationName: string;
  clientName: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  estimatedDuration: number; // ✨ NUEVO: Duración del servicio en minutos
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}
```

---

### 2. Modificación del Algoritmo de Optimización

#### Antes (Hardcoded)
```typescript
const SERVICE_DURATION_MINUTES = 60; // ❌ Valor fijo para todos

// Sumar duración del servicio
currentTime = new Date(currentTime.getTime() + SERVICE_DURATION_MINUTES * 60 * 1000);
```

#### Después (Duración Real)
```typescript
const SERVICE_DURATION_MINUTES = 60; // Solo como fallback

/**
 * Calcula horarios propuestos para una ruta optimizada
 * IMPORTANTE: Usa la duración real de cada servicio (estimatedDuration)
 */
function calculateProposedTimes(
  route: Appointment[],
  userLocation: { lat: number; lng: number },
  startTime: Date
): { appointmentId: string; proposedTime: Date }[] {
  const proposedTimes: { appointmentId: string; proposedTime: Date }[] = [];
  let currentTime = new Date(startTime);
  let currentLat = userLocation.lat;
  let currentLng = userLocation.lng;
  
  for (const appointment of route) {
    // Calcular tiempo de viaje
    const distance = calculateDistance(
      currentLat,
      currentLng,
      appointment.location.lat,
      appointment.location.lng
    );
    const travelTimeMinutes = (distance / AVERAGE_SPEED_KMH) * 60;
    
    // Sumar tiempo de viaje
    currentTime = new Date(currentTime.getTime() + travelTimeMinutes * 60 * 1000);
    
    // Guardar horario propuesto
    proposedTimes.push({
      appointmentId: appointment.id,
      proposedTime: new Date(currentTime)
    });
    
    // ✨ Sumar duración REAL del servicio (no hardcoded)
    const serviceDuration = appointment.estimatedDuration || SERVICE_DURATION_MINUTES;
    currentTime = new Date(currentTime.getTime() + serviceDuration * 60 * 1000);
    currentLat = appointment.location.lat;
    currentLng = appointment.location.lng;
  }
  
  return proposedTimes;
}
```

#### Cálculo de `endTime` con Duración Real
```typescript
// Usar horario propuesto (aunque tenga conflicto) con duración real
const serviceDuration = appointment.estimatedDuration || SERVICE_DURATION_MINUTES;
return {
  ...appointment,
  startTime: proposedTime.proposedTime.toISOString(),
  endTime: new Date(proposedTime.proposedTime.getTime() + serviceDuration * 60 * 1000).toISOString()
};
```

#### Enriquecimiento de Resultados
```typescript
// 8. Enriquecer información de reprogramación con duración del servicio
const rescheduledAppointments = available.map(a => {
  const originalAppointment = appointments.find(app => app.id === a.appointmentId);
  return {
    ...a,
    clientName: originalAppointment?.clientName || '',
    locationName: originalAppointment?.locationName || '',
    durationMinutes: originalAppointment?.estimatedDuration || SERVICE_DURATION_MINUTES // ✨ NUEVO
  };
});
```

---

### 3. Actualización del Hook de Optimización

**Archivo**: `/nextjs-app/src/hooks/useRouteOptimizationWithRescheduling.ts`

```typescript
// Convertir appointments al formato esperado (incluyendo estimatedDuration)
const appointmentsForOptimization = appointmentsWithLocation.map(apt => ({
  id: apt.appointmentId,
  locationId: apt.locationId,
  locationName: apt.locationName || apt.location?.name || '',
  clientName: apt.customerName,
  serviceType: apt.serviceType,
  startTime: apt.startTime,
  endTime: apt.endTime,
  estimatedDuration: apt.estimatedDuration, // ✨ Pasar duración real
  location: {
    lat: apt.location!.latitude,
    lng: apt.location!.longitude,
    address: apt.location!.address
  }
}));
```

---

### 4. Actualización de la UI - Tabla de Reprogramación

**Archivo**: `/nextjs-app/src/components/dashboard/ReschedulingProposalTable.tsx`

#### Helper de Formato
```typescript
// Helper para formatear duración
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};
```

#### Nueva Columna en Header
```tsx
<thead className="bg-gray-50 border-b border-gray-200">
  <tr>
    <th className="px-4 py-3 text-left font-semibold text-gray-700">Cliente</th>
    <th className="px-4 py-3 text-left font-semibold text-gray-700">Ubicación</th>
    <th className="px-4 py-3 text-left font-semibold text-gray-700">Servicio</th>
    <th className="px-4 py-3 text-center font-semibold text-gray-700">Duración</th> {/* ✨ NUEVO */}
    <th className="px-4 py-3 text-center font-semibold text-gray-700">Horario Original</th>
    <th className="px-4 py-3 text-center font-semibold text-gray-700">→</th>
    <th className="px-4 py-3 text-center font-semibold text-gray-700">Horario Propuesto</th>
    <th className="px-4 py-3 text-center font-semibold text-gray-700">Diferencia</th>
    <th className="px-4 py-3 text-left font-semibold text-gray-700">Especialista</th>
  </tr>
</thead>
```

#### Nueva Columna en Body
```tsx
<td className="px-4 py-3 text-center">
  <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
    <span className="text-xs">⏱️</span>
    <span className="font-semibold">{formatDuration(appointment.durationMinutes)}</span>
  </div>
</td>
```

---

### 5. Actualización del Lambda Backend

**Archivo**: `/lambdas/data-handler/src/handlers/availability.ts`

```typescript
if (allAvailable) {
  // ¡Disponible!
  const endTime = addMinutesToTime(time, durationMinutes);
  available.push({
    appointmentId,
    clientName: '',
    serviceType,
    locationId,
    locationName: '',
    originalStartTime: requestedTime,
    originalEndTime: addMinutesToTime(requestedTime.split('T')[1].substring(0, 5), durationMinutes),
    proposedStartTime: requestedTime,
    proposedEndTime: endTime,
    timeDifferenceMinutes: 0,
    durationMinutes, // ✨ Incluir duración del servicio
    specialistId: schedule.specialistId,
    specialistName: schedule.specialistName,
    status: 'proposed',
    reason: 'Horario confirmado'
  });
  foundAvailability = true;
  break;
}
```

---

## 📊 Archivos Modificados

### Frontend (Next.js)
1. ✅ `/nextjs-app/src/services/api/availabilityService.ts` - Tipo `RescheduledAppointment`
2. ✅ `/nextjs-app/src/services/optimization/routeOptimizerWithRescheduling.ts` - Algoritmo
3. ✅ `/nextjs-app/src/hooks/useRouteOptimizationWithRescheduling.ts` - Hook de conversión
4. ✅ `/nextjs-app/src/components/dashboard/ReschedulingProposalTable.tsx` - UI de tabla

### Backend (Lambda)
5. ✅ `/lambdas/data-handler/src/types/availability.ts` - Tipo `RescheduledAppointment`
6. ✅ `/lambdas/data-handler/src/handlers/availability.ts` - Handler de API
7. ✅ Lambda compilado (`npm run build` exitoso)

---

## 🧪 Casos de Prueba

### Escenario 1: Servicio Corto (30 minutos)
**Input**: Corte de cabello - `estimatedDuration: 30`

**Antes**:
- Algoritmo usa 60min
- Gap de 30min innecesario
- UI no muestra duración

**Después**:
- Algoritmo usa 30min
- Sin gaps innecesarios
- UI muestra "30min" en azul

### Escenario 2: Servicio Estándar (60 minutos)
**Input**: Manicure - `estimatedDuration: 60`

**Antes**:
- Algoritmo usa 60min ✓
- UI no muestra duración

**Después**:
- Algoritmo usa 60min ✓
- UI muestra "1h" en azul

### Escenario 3: Servicio Largo (120 minutos)
**Input**: Keratina - `estimatedDuration: 120`

**Antes**:
- Algoritmo usa 60min
- ⚠️ SOLAPAMIENTO: siguiente cita empieza 60min después pero servicio dura 120min
- UI no muestra duración

**Después**:
- Algoritmo usa 120min ✓
- Sin solapamientos
- UI muestra "2h" en azul

### Escenario 4: Servicio con Minutos (90 minutos)
**Input**: Tinte - `estimatedDuration: 90`

**Antes**:
- Algoritmo usa 60min
- Cálculo incorrecto por 30min de diferencia
- UI no muestra duración

**Después**:
- Algoritmo usa 90min ✓
- Cálculo correcto
- UI muestra "1h 30min" en azul

---

## 🎨 Mejoras Visuales en la Tabla

| Columna | Emoji | Color | Formato |
|---------|-------|-------|---------|
| Duración | ⏱️ | `bg-blue-100 text-blue-700` | "30min", "1h", "1h 30min", "2h" |
| Original | ⏰ | `bg-red-100 text-red-700` | "08:00", "14:30" |
| Propuesta | ✓ | `bg-green-100 text-green-700` | "09:30", "15:00" |

**Ejemplo visual**:
```
┌─────────┬──────────┬──────────┬──────────┬─────────┬───┬──────────┬────────────┬─────────────┐
│ Cliente │ Ubicación│ Servicio │ Duración │ Original│ → │ Propuesto│ Diferencia │ Especialista│
├─────────┼──────────┼──────────┼──────────┼─────────┼───┼──────────┼────────────┼─────────────┤
│ Ana G.  │📍 Centro │ Corte    │⏱️ 30min  │⏰ 08:00 │ → │✓ 09:30   │+90min      │👤 María L.  │
│ Carlos  │📍 Norte  │ Keratina │⏱️ 2h     │⏰ 10:00 │ → │✓ 11:00   │+60min      │👤 Laura P.  │
└─────────┴──────────┴──────────┴──────────┴─────────┴───┴──────────┴────────────┴─────────────┘
```

---

## 🔍 Flujo de Datos Completo

```
1. Dashboard Page
   ↓ fetchUpcomingAppointments()
   ↓ appointments: Appointment[] (con estimatedDuration)

2. useRouteOptimizationWithRescheduling Hook
   ↓ Mapea Appointment → Appointment (algoritmo)
   ↓ Incluye: estimatedDuration

3. buildOptimizedRouteWithRescheduling()
   ↓ calculateProposedTimes()
   ↓ Usa: appointment.estimatedDuration
   ↓ Calcula: nextTime = currentTime + serviceDuration + travelTime

4. checkMultipleAvailability() API
   ↓ POST /availability/check-multiple
   ↓ Body: { appointments: [{ durationMinutes }] }

5. Lambda Handler (availability.ts)
   ↓ Verifica disponibilidad con duración real
   ↓ Retorna: RescheduledAppointment[] con durationMinutes

6. Frontend enriquece resultados
   ↓ Agrega: clientName, locationName, durationMinutes

7. ReschedulingProposalTable
   ↓ Muestra: formatDuration(durationMinutes)
   ↓ Renderiza: "30min", "1h", "1h 30min", "2h"
```

---

## 📦 Deployment

### Frontend (Next.js)
```bash
cd /Users/oscarkof/repos/TG-OM/nextjs-app
npm run build
# O automático con Amplify
```

### Backend (Lambda)
```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/data-handler
npm run build  # ✅ Compilado exitosamente

cd /Users/oscarkof/repos/TG-OM/infrastructure
cdk deploy DataStack --force
```

---

## ✅ Checklist de Verificación

### Pre-Deployment
- [x] Tipos actualizados (frontend + backend)
- [x] Algoritmo usa `estimatedDuration`
- [x] Hook pasa duración correctamente
- [x] Lambda incluye `durationMinutes` en respuesta
- [x] Tabla muestra columna de duración
- [x] Lambda compilado sin errores
- [x] Documentación creada

### Post-Deployment
- [ ] DataStack desplegado
- [ ] Dashboard muestra columna "Duración"
- [ ] Duración formateada correctamente (30min, 1h, 1h 30min)
- [ ] Optimización usa duraciones reales
- [ ] Horarios propuestos son correctos
- [ ] No hay solapamientos para servicios largos
- [ ] No hay gaps para servicios cortos

---

## 🐛 Troubleshooting

### Problema: Columna de duración no aparece
**Causa**: Frontend no actualizado  
**Solución**: Refrescar navegador (`Cmd+Shift+R`) o reiniciar servidor Next.js

### Problema: Duración siempre muestra 60min
**Causa**: Base de datos no tiene `estimatedDuration`  
**Solución**: Verificar que appointments en DynamoDB tienen el campo `estimatedDuration`

### Problema: Horarios propuestos incorrectos
**Causa**: Algoritmo no recibe duración  
**Solución**: Verificar que `appointmentsForOptimization` incluye `estimatedDuration`

### Problema: Error TypeScript en RescheduledAppointment
**Causa**: Tipo desactualizado  
**Solución**: Verificar que ambos archivos (`availabilityService.ts` y `availability.ts`) tienen `durationMinutes`

---

## 📝 Notas Técnicas

### Fallback de Seguridad
El sistema mantiene `SERVICE_DURATION_MINUTES = 60` como fallback por seguridad:
```typescript
const serviceDuration = appointment.estimatedDuration || SERVICE_DURATION_MINUTES;
```

Esto previene crashes si:
- Una cita no tiene `estimatedDuration` (datos legacy)
- Hay un error en la base de datos
- El campo viene como `null` o `undefined`

### Formato de Duración Inteligente
La función `formatDuration()` muestra el formato más legible:
- `30` → "30min"
- `60` → "1h"
- `90` → "1h 30min"
- `120` → "2h"

### Precisión de Cálculo
Los cálculos usan milisegundos para máxima precisión:
```typescript
currentTime = new Date(currentTime.getTime() + serviceDuration * 60 * 1000);
```

---

## 🎯 Próximos Pasos

1. **Verificar en Dashboard**: Refrescar `/dashboard` y confirmar que columna "Duración" aparece
2. **Probar con datos reales**: Ejecutar optimización con citas de diferentes duraciones
3. **Validar cálculos**: Verificar que horarios propuestos son matemáticamente correctos
4. **Documentar en PROJECT_MEMORY.md**: Actualizar memoria del proyecto con esta feature

---

## 📚 Referencias

- **Tipo Appointment**: `/nextjs-app/src/services/api/appointments.ts` (línea 8)
- **Algoritmo TSP**: `/nextjs-app/src/services/optimization/routeOptimizerWithRescheduling.ts`
- **API Availability**: `/lambdas/data-handler/src/handlers/availability.ts`
- **UI Fixes**: `/docs/UI_FIXES_OPTIMIZATION_CARD.md`
- **Sistema de Diseño**: `/docs/CLYOK_DESIGN_SYSTEM.md`

---

**Implementado por**: GitHub Copilot  
**Fecha**: 21 de octubre de 2025  
**Versión**: 1.0  
**Status**: ✅ Listo para deployment
