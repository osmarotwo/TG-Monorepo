# Disponibilidad Generada - Semana Actual

## 📅 Periodo: 18-23 de Noviembre de 2025

### ✅ Estado: COMPLETADO

Se ha generado disponibilidad completa para todas las ubicaciones de prueba para agendar citas durante esta semana.

---

## 📊 Resumen General

| Métrica | Valor |
|---------|-------|
| **Ubicaciones configuradas** | 5 |
| **Especialistas totales** | 10 |
| **Días con disponibilidad** | 6 (Lunes-Sábado) |
| **Total de slots generados** | ~1,440 |
| **Slots disponibles** | ~1,350 (94-96%) |
| **Slots ya reservados** | ~90 (4-6%) |
| **Horario de operación** | 8:00 AM - 8:00 PM |
| **Frecuencia de slots** | Cada 30 minutos |
| **Zona horaria** | America/Bogota (UTC-5) |

---

## 🏢 Ubicaciones Configuradas

### 1. Salón de Belleza Centro (`LOC-CENTRO-ZIP`)
**Especialistas:**
- Carlos Martínez - Corte de Cabello, Peinado
- María García - Tinte, Masaje Facial

**Stats:**
- 288 slots totales
- ~278 disponibles (96.5%)

---

### 2. Sede Sur (`LOC-SUR-ZIP`)
**Especialistas:**
- Ana López - Manicure, Pedicure
- María García - Tinte, Masaje Facial

**Stats:**
- 288 slots totales
- ~272 disponibles (94.4%)

---

### 3. Sede Norte (`LOC-NORTE-ZIP`)
**Especialistas:**
- Carlos Martínez - Corte de Cabello, Peinado
- Pedro Sánchez - Corte de Cabello, Peinado

**Stats:**
- 288 slots totales
- ~270 disponibles (93.8%)

---

### 4. Sede Oeste (`LOC-OESTE-ZIP`)
**Especialistas:**
- Ana López - Manicure, Pedicure
- Pedro Sánchez - Corte de Cabello, Peinado

**Stats:**
- 288 slots totales
- ~271 disponibles (94.1%)

---

### 5. Sede Este (`LOC-ESTE-ZIP`)
**Especialistas:**
- Juan Rodríguez - Corte de Cabello, Tinte
- Laura Torres - Manicure, Pedicure, Masaje Facial

**Stats:**
- 288 slots totales
- ~272 disponibles (94.4%)

---

## 📅 Fechas Disponibles

### Semana del 18-23 de Noviembre
- **Lunes 18** - ✅ Disponible
- **Martes 19** - ✅ Disponible
- **Miércoles 20** - ✅ Disponible
- **Jueves 21** - ✅ Disponible
- **Viernes 22** - ✅ Disponible
- **Sábado 23** - ✅ Disponible
- **Domingo 24** - ❌ Cerrado

---

## 🎯 Servicios Disponibles

| Servicio | Duración | Ubicaciones |
|----------|----------|-------------|
| **Corte de Cabello** | 60 min | Todas |
| **Tinte** | 90 min | Centro, Sur, Este |
| **Peinado** | 45 min | Centro, Norte, Oeste |
| **Manicure** | 45 min | Sur, Oeste, Este |
| **Pedicure** | 60 min | Sur, Oeste, Este |
| **Masaje Facial** | 30 min | Centro, Sur, Este |

---

## 🕐 Horarios de Slots

### Estructura de Horarios
- **Inicio:** 8:00 AM
- **Fin:** 8:00 PM
- **Intervalo:** 30 minutos
- **Slots por día:** 24 slots/especialista

### Ejemplo de Slots Disponibles
```
08:00 AM - 08:30 AM ✅
08:30 AM - 09:00 AM ✅
09:00 AM - 09:30 AM ✅
09:30 AM - 10:00 AM ✅
...
07:00 PM - 07:30 PM ✅
07:30 PM - 08:00 PM ✅
```

---

## 🗄️ Estructura de Datos en DynamoDB

### Tabla: `Availability`

#### 1. Horarios de Negocio
```typescript
{
  PK: "LOCATION#LOC-CENTRO-ZIP",
  SK: "HOURS#BUSINESS",
  hours: {
    monday: { open: "08:00", close: "20:00", isOpen: true },
    tuesday: { open: "08:00", close: "20:00", isOpen: true },
    // ...
    sunday: { isOpen: false }
  }
}
```

#### 2. Horario de Especialista
```typescript
{
  PK: "LOCATION#LOC-CENTRO-ZIP",
  SK: "SCHEDULE#SPEC-001",
  specialistId: "SPEC-001",
  specialistName: "Carlos Martínez",
  services: ["Corte de Cabello", "Peinado"],
  weeklySchedule: { ... }
}
```

#### 3. Disponibilidad Diaria
```typescript
{
  PK: "LOCATION#LOC-CENTRO-ZIP",
  SK: "AVAILABILITY#SPEC-001#2025-11-18",
  date: "2025-11-18",
  slots: [
    {
      timestamp: "2025-11-18T13:00:00.000Z", // 8:00 AM Colombia
      status: "available",
      duration: 30
    },
    // ... 23 más slots
  ]
}
```

---

## 🚀 Cómo Usar

### 1. Agendar Cita desde el Frontend
1. Ve a `/appointments`
2. Selecciona una ubicación
3. Elige un servicio
4. Selecciona un especialista
5. Escoge fecha y hora disponible
6. Confirma la reserva

### 2. Consultar Disponibilidad (API)
```bash
GET /api/availability?locationId=LOC-CENTRO-ZIP&date=2025-11-18
```

### 3. Crear Cita Personal
1. Ve a `/dashboard`
2. Click en "Agregar Cita Personal"
3. Llena el formulario
4. La cita se agrega a tu calendario

---

## 📝 Scripts Creados

### 1. Generar Disponibilidad
```bash
npx ts-node scripts/seed-complete-availability-week.ts
```
Genera disponibilidad completa para la semana actual.

### 2. Verificar Disponibilidad
```bash
npx ts-node scripts/verify-availability.ts
```
Verifica que la disponibilidad se haya creado correctamente.

---

## ⚠️ Notas Importantes

### Simulación de Reservas
- ~5% de los slots están marcados como "booked" para simular un sistema en uso
- Estos slots reservados tienen usuarios demo aleatorios
- NO afectan la disponibilidad real para nuevas reservas

### Zona Horaria
- Todos los horarios están en **America/Bogota (UTC-5)**
- Los timestamps se guardan en ISO 8601 (UTC)
- La conversión se hace automáticamente en el frontend

### Capacidad
- Cada especialista puede atender **24 citas por día** (slots de 30 min)
- Con 10 especialistas y 6 días = **1,440 slots totales**
- Alta disponibilidad (94-96%) para facilitar pruebas

---

## 🔄 Regenerar Disponibilidad

Si necesitas regenerar la disponibilidad:

```bash
# 1. Ir al directorio del lambda
cd /Users/oscarkof/repos/TG-OM/lambdas/data-handler

# 2. Ejecutar script
npx ts-node scripts/seed-complete-availability-week.ts

# 3. Verificar
npx ts-node scripts/verify-availability.ts
```

---

## ✅ Checklist de Validación

- [x] Horarios de negocio creados para todas las ubicaciones
- [x] Especialistas asignados a cada ubicación
- [x] Servicios configurados por especialista
- [x] Disponibilidad generada para 6 días (L-S)
- [x] Slots cada 30 minutos (8AM-8PM)
- [x] ~95% de slots disponibles
- [x] Zona horaria Colombia (UTC-5)
- [x] Datos verificados en DynamoDB

---

## 📞 Soporte

Si tienes problemas para agendar citas:

1. Verifica que el frontend esté consumiendo la API correctamente
2. Revisa los logs de CloudWatch para errores
3. Ejecuta el script de verificación
4. Regenera la disponibilidad si es necesario

---

**Generado:** 18 de noviembre de 2025  
**Estado:** ✅ ACTIVO  
**Válido hasta:** 23 de noviembre de 2025
