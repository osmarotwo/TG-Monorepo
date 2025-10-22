# Plan de Implementación: Sistema de Optimización con Reprogramación

## 🎯 Objetivo
Permitir que el algoritmo de optimización proponga nuevos horarios para las citas, validando disponibilidad en tiempo real con los negocios.

## 📝 Resumen Ejecutivo

**Problema actual:**
- El algoritmo no puede optimizar rutas porque las citas tienen horarios fijos
- No hay forma de saber si un negocio tiene disponibilidad para reprogramar

**Solución propuesta:**
- Nueva tabla `Availability` con horarios de negocios y especialistas
- API para consultar disponibilidad en tiempo real
- Algoritmo mejorado que propone nuevos horarios óptimos
- UI que muestra los cambios y pide aprobación al usuario

---

## 📋 Tareas por Fase

### ✅ FASE 1: Base de Datos (2-3 horas)
**Estado: EN PROGRESO**

- [x] Crear tabla `Availability` en CDK
- [ ] Definir tipos TypeScript para las entidades
- [ ] Crear seed con datos de prueba:
  - Horarios de operación (8 AM - 8 PM, Lun-Sáb)
  - Duraciones de servicios (30-90 min)
  - Agendas de especialistas (6 especialistas x 5 ubicaciones)
  - Slots disponibles para mañana (22/10/2025)

### ⏳ FASE 2: API de Disponibilidad (3-4 horas)

- [ ] Handler: `GET /api/availability/:locationId/:date`
  - Retorna slots disponibles
  - Filtra por tipo de servicio y duración
  
- [ ] Handler: `POST /api/availability/check-multiple`
  - Verifica múltiples citas simultáneamente
  - Retorna alternativas si no hay disponibilidad
  
- [ ] Handler: `POST /api/availability/reserve-slot`
  - Reserva temporalmente un slot (15 min TTL)
  - Permite confirmar después

### ⏳ FASE 3: Algoritmo Mejorado (4-5 horas)

- [ ] Nuevo algoritmo: `buildOptimizedRouteWithRescheduling()`
  - Calcula ruta geográficamente óptima (TSP)
  - Para cada cita, busca slot disponible más cercano
  - Retorna propuesta con nuevos horarios
  
- [ ] Validación de cambios:
  - Máximo cambio permitido por cita (ej: +/- 4 horas)
  - Respetar preferencias del usuario
  
- [ ] Tipos de resultado:
  - `RescheduledAppointment[]`
  - `AvailabilityConflict[]`

### ⏳ FASE 4: UI Actualizada (2-3 horas)

- [ ] `RouteOptimizationCard` mejorada:
  - Sección "Cambios de horario requeridos"
  - Mostrar horario original vs propuesto
  - Indicador de disponibilidad (✓ Disponible / ⚠️ Requiere confirmación)
  
- [ ] Modal de detalles:
  - Lista completa de cambios
  - Especialista asignado
  - Razón del cambio
  
- [ ] Flujo de aprobación:
  - Botón "Aplicar Optimización"
  - Confirmación de cambios
  - Llamada a API para reprogramar

### ⏳ FASE 5: Testing & Refinamiento (2 horas)

- [ ] Crear escenarios de prueba:
  - Ruta totalmente flexible
  - Ruta con restricciones
  - Sin disponibilidad para alguna cita
  
- [ ] Validar métricas de mejora
- [ ] Documentar casos edge

---

## 🚀 Entregables

### Sprint 1 (Hoy):
1. ✅ Tabla `Availability` creada
2. ✅ Seed con datos de prueba
3. ✅ API básica funcionando
4. ✅ Algoritmo retorna propuesta con reprogramación

### Sprint 2 (Mañana):
5. ✅ UI muestra cambios propuestos
6. ✅ Usuario puede aprobar/rechazar
7. ✅ Testing end-to-end
8. ✅ Documentación completa

---

## 💡 Decisiones de Diseño

### 1. Single Table Design
Usaremos la tabla `Availability` con el patrón:
```
PK: LOCATION#<locationId> | SPECIALIST#<specialistId>
SK: HOURS#<dayOfWeek> | SERVICE#<type> | DATE#<YYYY-MM-DD>
```

### 2. Slots de 15 minutos
Granularidad: bloques de 15 minutos
- 08:00, 08:15, 08:30, 08:45, 09:00...
- Un servicio de 60 min ocupa 4 slots consecutivos

### 3. Flexibilidad del usuario
Por ahora: +/- 4 horas por cita
Futuro: Configuración por usuario

### 4. Reserva temporal
Cuando el algoritmo propone horarios, reserva temporalmente (15 min TTL)
Si el usuario no confirma, se libera automáticamente

---

## ⚠️ Consideraciones

### Limitaciones MVP:
- No consulta disponibilidad real de APIs externas
- Datos de seed son estáticos
- No hay sincronización con calendarios externos

### Futuro (Backoffice B2B):
- Dashboard para negocios gestionar agendas
- Integración con Google Calendar / Outlook
- Reglas de negocio personalizadas por sede
- Notificaciones automáticas a clientes

---

## 🔄 Siguiente Paso Inmediato

**¿Continuar con el seed de datos?**

Voy a crear:
1. Tipos TypeScript para las entidades
2. Seed que crea:
   - Horarios de operación para 5 ubicaciones
   - 6 especialistas con sus agendas
   - Servicios con duraciones
   - Slots disponibles para mañana

**Tiempo estimado: 30 minutos**

¿Procedo? 🚀
