# 📋 Tareas Pendientes - Sistema de Citas Personales

**Fecha:** 13 de noviembre de 2025  
**Proyecto:** TG-OM - Sistema de Gestión de Citas  
**Feature:** Citas Personales con Optimización de Rutas

---

## ✅ Completado

### 1. Backend - Infraestructura
- ✅ Endpoint `POST /api/appointments/personal` creado y desplegado
- ✅ Handler `createPersonalAppointment.ts` con validación de conflictos
- ✅ Campos `type` y `isFlexible` agregados al schema de DynamoDB
- ✅ API Gateway configurado con ruta `/api/appointments/personal`
- ✅ CDK desplegado exitosamente (67.87s)

### 2. Frontend - UI Básica
- ✅ Componente `CreatePersonalAppointmentModal.tsx` creado
- ✅ Botón "Add Personal Appointment" en dashboard
- ✅ Visualización diferenciada de citas personales (fondo morado, badge)
- ✅ Interface `Appointment` actualizada con campos personales
- ✅ Validación frontend completa (campos requeridos, tiempos)

---

## 🔴 ALTA PRIORIDAD

### 3. Integración con Google Maps
**Archivos a crear/modificar:**
- `/nextjs-app/src/components/LocationPicker.tsx` (nuevo)
- `/nextjs-app/src/components/CreatePersonalAppointmentModal.tsx` (modificar)

**Descripción:**
Crear componente reutilizable de selección de ubicación con Google Maps que permita:

**Funcionalidades requeridas:**
1. **Búsqueda de dirección con autocomplete**
   - Usar `@react-google-maps/api` o similar
   - Input con Places Autocomplete
   - Seleccionar dirección de sugerencias

2. **Selección visual en mapa**
   - Mapa interactivo de Google Maps
   - Click en mapa para colocar marcador
   - Arrastrar marcador para ajustar ubicación

3. **Geocoding reverso**
   - Convertir lat/lng a dirección legible
   - Actualizar campo de dirección automáticamente

4. **Outputs del componente:**
   ```typescript
   interface LocationData {
     address: string;
     latitude: number;
     longitude: number;
   }
   ```

**Integración en modal:**
- Agregar toggle: "Ingresar dirección manualmente" vs "Seleccionar en mapa"
- Si selecciona mapa: mostrar `<LocationPicker>`
- Si selecciona manual: usar input de texto actual
- Validar que tenga dirección O coordenadas antes de submit

**Verificaciones previas:**
- [ ] Confirmar API Key de Google Maps en `.env.local`
- [ ] Verificar que `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` esté configurada
- [ ] Verificar que Places API esté habilitada en Google Cloud Console
- [ ] Instalar dependencia: `npm install @react-google-maps/api`

**Comando para ejecutar:**
```bash
cd nextjs-app
npm install @react-google-maps/api
```

---

## 🟡 PRIORIDAD MEDIA

### 4. Validación de Disponibilidad Mejorada
**Archivos a modificar:**
- `/lambdas/data-handler/src/handlers/createAppointment.ts`
- Función: `validateAppointmentSlot()`

**Descripción:**
Actualizar la validación de slots para considerar AMBOS tipos de citas (business + personal).

**Cambios necesarios:**
```typescript
// Actualmente solo valida citas de negocio en una ubicación
// Debe validar:
// 1. Citas de negocio en la misma ubicación
// 2. Citas personales del usuario en el mismo horario
// 3. Considerar que un usuario no puede estar en dos lugares a la vez

// Lógica sugerida:
const validateUserAvailability = async (
  userId: string, 
  date: string, 
  startTime: string, 
  endTime: string
) => {
  // Query todas las citas del usuario para esa fecha
  const userAppointments = await queryItems({
    TableName: APPOINTMENTS_TABLE,
    IndexName: 'GSI1',
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :datePrefix)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':datePrefix': `DATE#${date}`,
    },
  });
  
  // Verificar overlaps de tiempo
  // Return { available: boolean, reason?: string }
}
```

**Testing:**
- [ ] Crear cita personal a las 10:00-11:00
- [ ] Intentar crear cita de negocio a las 10:30 (debe fallar)
- [ ] Intentar crear otra cita personal a las 10:30 (debe fallar)
- [ ] Crear cita a las 11:00-12:00 (debe funcionar)

---

### 5. Optimización de Rutas con Citas Personales
**Archivos a modificar:**
- `/nextjs-app/src/hooks/useRouteOptimizationWithRescheduling.tsx`

**Descripción:**
Actualizar el módulo de optimización de rutas para incluir citas personales y respetar restricciones.

**Cambios necesarios:**

1. **Incluir citas personales en cálculos:**
   ```typescript
   // Filtrar TODAS las citas (business + personal)
   const allAppointments = appointments; // Ya incluye ambos tipos
   
   // Calcular ubicaciones considerando:
   // - business: location.latitude/longitude
   // - personal: appointment.latitude/longitude
   ```

2. **Respetar `isFlexible=false`:**
   ```typescript
   // NO sugerir reprogramación para citas con isFlexible=false
   const flexibleAppointments = appointments.filter(apt => 
     apt.isFlexible !== false
   );
   
   // Solo optimizar/reagendar las flexibles
   // Mantener posición fija de las no flexibles
   ```

3. **Cálculo de distancias:**
   ```typescript
   const getAppointmentLocation = (appointment: Appointment) => {
     if (appointment.type === 'personal') {
       return {
         lat: appointment.latitude!,
         lng: appointment.longitude!,
       };
     } else {
       return {
         lat: appointment.location?.latitude,
         lng: appointment.location?.longitude,
       };
     }
   };
   ```

4. **Visualización en tarjeta de optimización:**
   - Marcar citas personales con 📝
   - Indicar que citas no flexibles no se mueven
   - Mostrar dirección para citas personales

**Testing:**
- [ ] Dashboard con 2 citas de negocio + 1 personal
- [ ] Verificar que optimización incluye las 3 ubicaciones
- [ ] Verificar que cita personal no se sugiere mover
- [ ] Aplicar optimización y verificar que solo mueve las flexibles

---

## 🟢 PRIORIDAD BAJA (Mejoras futuras)

### 6. Edición de Citas Personales
**Archivos a crear:**
- `/nextjs-app/src/components/EditPersonalAppointmentModal.tsx`
- Endpoint: `PUT /api/appointments/personal/:id`

**Funcionalidades:**
- Modificar título, descripción, dirección
- Cambiar fecha/hora (con validación de conflictos)
- Botón "Edit" en tarjeta de cita personal

---

### 7. Eliminación de Citas
**Funcionalidad:**
- Botón "Delete" en tarjetas de citas
- Modal de confirmación
- Endpoint: `DELETE /api/appointments/:id`
- Distinguir entre business y personal

---

### 8. Tipos de Citas Personales
**Mejora sugerida:**
Agregar categorías para citas personales:
- 🏥 Médica
- 🏋️ Gimnasio
- 🍽️ Comida
- 👨‍👩‍👧 Personal
- 📚 Educación
- ✈️ Viaje

**Beneficio:** Mejor organización y filtros visuales

---

### 9. Notificaciones
**Funcionalidad:**
- Email/SMS recordatorio 1 día antes
- Notificación 1 hora antes
- Usar AWS SNS/SES
- Configuración por usuario

---

### 10. Historial y Estadísticas
**Funcionalidad:**
- Dashboard con métricas:
  - Total citas personales vs negocio
  - Tiempo promedio de viaje ahorrado
  - Gráficos de distribución temporal
- Página `/history` con calendario

---

## 📝 Comandos Útiles

### Desarrollo Frontend
```bash
cd nextjs-app
npm run dev
```

### Deployment Backend
```bash
cd lambdas/data-handler
npm run build
cd ../../infrastructure
cdk deploy DataStack --require-approval never
```

### Ver Logs Lambda
```bash
aws logs tail /aws/lambda/DataStack-DataHandlerFunction245A5251-vdVdyDfKbXXh --follow
```

### Testing API
```bash
# Crear cita personal
curl -X POST https://v0igzegm95.execute-api.us-east-1.amazonaws.com/prod/api/appointments/personal \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "5fabb21e-3722-43ab-b491-5e53a45f9616",
    "title": "Cita médica",
    "description": "Chequeo anual",
    "address": "Calle 100 #15-20, Bogotá",
    "date": "2025-11-15",
    "startTime": "2025-11-15T14:00:00.000Z",
    "endTime": "2025-11-15T15:00:00.000Z"
  }'
```

---

## 🎯 Próxima Sesión - Tareas Recomendadas

**Opción A - MVP Completo (2-3 horas):**
1. Integrar Google Maps en modal (Tarea #3)
2. Mejorar validación de disponibilidad (Tarea #4)
3. Testing end-to-end completo

**Opción B - Optimización Avanzada (1-2 horas):**
1. Actualizar módulo de optimización de rutas (Tarea #5)
2. Testing con escenarios complejos
3. Ajustes de UI en tarjeta de optimización

**Opción C - Features Adicionales (2-4 horas):**
1. Edición de citas personales (Tarea #6)
2. Eliminación de citas (Tarea #7)
3. Categorías de citas personales (Tarea #8)

---

## 🐛 Issues Conocidos

1. **Geocoding manual:** Actualmente el usuario debe ingresar dirección manualmente. Google Maps resolvería esto.

2. **Validación de conflictos:** Solo valida en backend al crear. Sería ideal validar en tiempo real mientras el usuario selecciona fecha/hora.

3. **Timezone:** Todo está hardcoded a `America/Bogota`. Considerar hacer configurable por usuario.

4. **Optimización sin ubicación del usuario:** Si geolocalización falla, usa Zipaquirá como default. Podría permitir al usuario configurar su ubicación base.

---

## 📚 Referencias

- **Backend Handler:** `/lambdas/data-handler/src/handlers/createPersonalAppointment.ts`
- **Frontend Modal:** `/nextjs-app/src/components/CreatePersonalAppointmentModal.tsx`
- **Dashboard:** `/nextjs-app/src/app/dashboard/page.tsx`
- **Types:** `/nextjs-app/src/services/api/appointments.ts`
- **Docs anteriores:** `/docs/ONBOARDING_COMPLETO.md`, `/docs/DASHBOARD_IMPROVEMENTS.md`

---

## 💡 Notas Técnicas

### Schema DynamoDB - Appointments
```typescript
{
  PK: "USER#{userId}",
  SK: "APPOINTMENT#{appointmentId}",
  type: "personal" | "business",
  isFlexible: boolean,
  
  // Campos compartidos
  date: "YYYY-MM-DD",
  time: "HH:MM",
  startTime: "ISO8601",
  endTime: "ISO8601",
  duration: number,
  notes?: string,
  
  // Citas de negocio
  businessId?: string,
  locationId?: string,
  serviceType?: string,
  customerName?: string,
  
  // Citas personales
  title?: string,
  description?: string,
  address?: string,
  latitude?: number,
  longitude?: number,
}
```

### Indexes Existentes
- **GSI1:** `PK=USER#{userId}`, `SK=DATE#{date}#TIME#{time}`
- **GSI2:** `PK=LOCATION#{locationId}`, `SK=DATE#{date}`

---

**Última actualización:** 13 de noviembre de 2025, 20:30  
**Autor:** GitHub Copilot  
**Estado del proyecto:** Backend desplegado, Frontend básico funcional, Integración con Maps pendiente
