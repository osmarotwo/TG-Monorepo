# 🚀 Propuesta: Algoritmo de Optimización de Rutas para Citas

## 📅 Fecha: 21 de octubre de 2025
## 📊 Estado: PROPUESTA PARA REVISIÓN

---

## 🎯 Objetivo

Diseñar e implementar un sistema inteligente que **sugiera al usuario la mejor secuencia de citas** para minimizar tiempo de viaje y maximizar eficiencia, considerando:
- Distancias entre ubicaciones
- Tiempos de viaje reales (Google Directions API)
- Duraciones de servicios
- Ventanas de tiempo disponibles
- Restricciones de horario de cada negocio

---

## 📋 Análisis del Problema

### Estado Actual del Sistema

**Datos Disponibles**:
```typescript
interface Appointment {
  appointmentId: string
  locationId: string
  startTime: string
  endTime: string
  estimatedDuration: number  // ✅ Ya implementado
  serviceType: string
  status: string
}

interface Location {
  locationId: string
  name: string
  latitude: number
  longitude: number
  address: string
  businessHours: { open: string, close: string }
}
```

**Funcionalidades Implementadas**:
- ✅ Detección de conflictos de tiempo (cuando no se puede llegar)
- ✅ Cálculo de tiempos de viaje (Google Directions API + Fallback Haversine)
- ✅ Visualización de rutas en mapa
- ✅ Alertas visuales de citas no alcanzables

**Limitaciones Actuales**:
- ❌ No sugiere reordenamiento óptimo
- ❌ Usuario ve el problema pero no la solución
- ❌ Orden de citas puede ser ineficiente (ejemplo: ir al norte, luego al sur, luego al norte otra vez)

---

## 🧠 Algoritmo Propuesto: TSP + Restricciones Temporales

### Tipo de Problema

Este es una **variante del Problema del Viajante (TSP - Traveling Salesman Problem)** con restricciones adicionales:
- **TSP Clásico**: Minimizar distancia visitando todos los puntos exactamente una vez
- **Nuestra Variante**: TSP + Ventanas de Tiempo (Time Windows) + Duraciones de Servicio

### Enfoque de Solución

Dado que las citas de un usuario típicamente son **< 20 por día**, podemos usar:

**Opción 1: Algoritmo Greedy con Optimización Local** ⭐ RECOMENDADO
- Complejidad: O(n²)
- Rápido y eficiente para n < 50
- Resultados buenos (no necesariamente óptimos)
- Fácil de implementar y mantener

**Opción 2: Búsqueda Exhaustiva (Fuerza Bruta)**
- Complejidad: O(n!)
- Solo viable para n < 10
- Garantiza solución óptima
- Muy lento para muchas citas

**Opción 3: Algoritmo Genético**
- Complejidad: O(n² × generaciones)
- Bueno para n > 20
- Mayor complejidad de implementación
- Quizás overkill para nuestro caso

### 🎯 Decisión: Usar Algoritmo Greedy Optimizado

---

## 📐 Diseño del Algoritmo

### Fase 1: Preparación de Datos

```typescript
interface OptimizableAppointment {
  appointment: Appointment
  location: Location
  flexibility: number // Qué tan flexible es el horario (0-1)
  priority: number // Prioridad del usuario (1-5)
  canReschedule: boolean // Si se puede reprogramar
}

interface TravelMatrix {
  [fromLocationId: string]: {
    [toLocationId: string]: {
      distance: number // metros
      duration: number // minutos
      lastUpdated: Date // Cache
    }
  }
}
```

### Fase 2: Cálculo de Matriz de Viaje

```typescript
async function buildTravelMatrix(locations: Location[]): Promise<TravelMatrix> {
  // Usar Google Directions API para obtener tiempos reales
  // Cache de 1 semana (los tiempos no cambian mucho)
  // Fallback a Haversine si API falla
}
```

### Fase 3: Algoritmo Greedy con Nearest Neighbor

```typescript
function optimizeRoute(
  appointments: OptimizableAppointment[],
  userLocation: { lat: number, lng: number },
  travelMatrix: TravelMatrix
): OptimizedRoute {
  
  const unvisited = [...appointments]
  const route: AppointmentNode[] = []
  let currentLocation = userLocation
  let currentTime = new Date()
  
  while (unvisited.length > 0) {
    // 1. Encontrar siguiente mejor cita
    const next = findBestNext(
      currentLocation,
      currentTime,
      unvisited,
      travelMatrix
    )
    
    if (!next) {
      // No hay solución viable - marcar citas restantes como conflictivas
      break
    }
    
    // 2. Agregar a la ruta
    route.push(next)
    
    // 3. Actualizar estado
    currentLocation = next.location
    currentTime = new Date(next.suggestedEndTime)
    unvisited.splice(unvisited.indexOf(next.appointment), 1)
  }
  
  return {
    route,
    totalDistance: calculateTotalDistance(route),
    totalTravelTime: calculateTotalTravelTime(route),
    conflicts: findConflicts(route),
    improvement: compareWithOriginal(appointments, route)
  }
}
```

### Fase 4: Criterios de Selección de Próxima Cita

```typescript
function findBestNext(
  currentLocation: Location,
  currentTime: Date,
  candidates: OptimizableAppointment[],
  travelMatrix: TravelMatrix
): AppointmentNode | null {
  
  const scored = candidates.map(apt => {
    const travel = travelMatrix[currentLocation.id][apt.location.id]
    const arrivalTime = new Date(currentTime.getTime() + travel.duration * 60000)
    
    // Calcular score basado en múltiples factores
    const score = calculateScore({
      distance: travel.distance,
      travelTime: travel.duration,
      arrivalTime: arrivalTime,
      appointmentTime: new Date(apt.appointment.startTime),
      flexibility: apt.flexibility,
      priority: apt.priority,
      waitTime: calculateWaitTime(arrivalTime, apt.appointment.startTime)
    })
    
    return { appointment: apt, score, arrivalTime }
  })
  
  // Filtrar solo viables (se puede llegar a tiempo)
  const viable = scored.filter(s => s.arrivalTime <= new Date(s.appointment.startTime))
  
  if (viable.length === 0) {
    // No hay citas viables - buscar la que requiere menor ajuste
    return findBestWithReschedule(scored)
  }
  
  // Retornar la de mejor score
  return viable.reduce((best, current) => 
    current.score > best.score ? current : best
  ).appointment
}
```

### Fase 5: Función de Score

```typescript
function calculateScore(factors: ScoreFactors): number {
  // Pesos configurables
  const weights = {
    proximity: 0.4,      // Priorizar cercanía
    timing: 0.3,         // Priorizar llegar justo a tiempo
    priority: 0.2,       // Priorizar citas importantes
    waitTime: -0.1       // Penalizar tiempos de espera largos
  }
  
  const proximityScore = 1 / (1 + factors.distance / 1000) // Normalizado
  const timingScore = calculateTimingScore(factors.arrivalTime, factors.appointmentTime)
  const priorityScore = factors.priority / 5
  const waitScore = Math.max(0, 1 - factors.waitTime / 60) // Penalizar esperas > 1h
  
  return (
    proximityScore * weights.proximity +
    timingScore * weights.timing +
    priorityScore * weights.priority +
    waitScore * weights.waitTime
  )
}
```

---

## 🎨 Propuesta de UI/UX

### 1. Card de Optimización

Cuando se detectan conflictos o ruta ineficiente:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ Optimización Sugerida                                    │
│                                                              │
│ Tu ruta actual tiene conflictos y puede ser optimizada:     │
│                                                              │
│ ❌ Ruta Actual:                                             │
│   1. Chapinero (8:00) → 2. Usaquén (10:30) →               │
│   3. Suba (12:00) → 4. Chapinero (14:00)                   │
│   📍 Distancia total: 45 km                                 │
│   ⏱️  Tiempo de viaje: 2h 15min                            │
│   ⚠️  2 conflictos detectados                               │
│                                                              │
│ ✅ Ruta Optimizada:                                         │
│   1. Chapinero (8:00) → 2. Chapinero (9:45) →              │
│   3. Usaquén (12:00) → 4. Suba (14:30)                     │
│   📍 Distancia total: 28 km (-37%)                          │
│   ⏱️  Tiempo de viaje: 1h 20min (-41%)                     │
│   ✅ Sin conflictos                                         │
│                                                              │
│   [Ver Detalles] [Aplicar Optimización] [Ignorar]          │
└─────────────────────────────────────────────────────────────┘
```

### 2. Mapa Comparativo (Antes/Después)

```
┌──────────────────────┬──────────────────────┐
│   Ruta Actual       │   Ruta Optimizada    │
│                      │                      │
│   [Mapa con ruta    │   [Mapa con ruta    │
│    zigzag ❌]       │    eficiente ✅]     │
│                      │                      │
└──────────────────────┴──────────────────────┘
```

### 3. Modal de Confirmación

```
┌─────────────────────────────────────────────────────────────┐
│ Confirmar Optimización                                   [X] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Se van a modificar las siguientes citas:                    │
│                                                              │
│ ✏️  Manicure Express                                        │
│    Antes: 12:00 PM en Suba                                  │
│    Después: 2:30 PM en Usaquén                              │
│                                                              │
│ ✏️  Pedicure Spa                                            │
│    Antes: 2:00 PM en Chapinero                              │
│    Después: 12:00 PM en Suba                                │
│                                                              │
│ ℹ️  Beneficios de la optimización:                          │
│    • Ahorro de 55 minutos en traslados                      │
│    • Reducción de 17 km de distancia                        │
│    • Eliminación de 2 conflictos de tiempo                  │
│                                                              │
│    [Cancelar]  [Confirmar Cambios]                          │
└─────────────────────────────────────────────────────────────┘
```

### 4. Botón de Acción Rápida

En el dashboard, arriba del mapa:

```tsx
{hasInefficiency && (
  <button className="bg-gradient-to-r from-[#13a4ec] to-blue-600 
                     text-white px-6 py-3 rounded-lg font-bold
                     shadow-lg hover:shadow-xl transition-all
                     flex items-center gap-2">
    <span>⚡</span>
    Optimizar Ruta
    <span className="text-xs bg-white/20 px-2 py-1 rounded">
      Ahorra {savings.time} min
    </span>
  </button>
)}
```

---

## 🔧 Arquitectura Técnica Propuesta

### Estructura de Archivos

```
nextjs-app/src/
├── services/
│   └── optimization/
│       ├── routeOptimizer.ts           # Algoritmo principal
│       ├── travelMatrixService.ts      # Cache de tiempos de viaje
│       ├── scoringEngine.ts            # Cálculo de scores
│       └── types.ts                    # Interfaces TypeScript
│
├── components/
│   └── dashboard/
│       ├── RouteOptimizationCard.tsx   # Card de sugerencia
│       ├── RouteComparison.tsx         # Mapa comparativo
│       ├── OptimizationModal.tsx       # Modal de confirmación
│       └── OptimizationButton.tsx      # Botón de acción
│
└── hooks/
    └── useRouteOptimization.ts         # Hook personalizado
```

### Flujo de Datos

```
1. Dashboard carga citas
   ↓
2. useRouteOptimization detecta ineficiencias
   ↓
3. routeOptimizer.optimize() calcula ruta óptima
   ↓
4. RouteOptimizationCard muestra sugerencia
   ↓
5. Usuario revisa y confirma
   ↓
6. API actualiza horarios de citas
   ↓
7. Dashboard refresca con nueva ruta
```

### Cache de Tiempos de Viaje

```typescript
// LocalStorage o IndexedDB
interface CachedTravelTime {
  from: string
  to: string
  duration: number
  distance: number
  timestamp: Date
  expiresAt: Date // 7 días
}

// Reduce llamadas a Google Maps API
// Mejora rendimiento
// Offline-first approach
```

---

## 📊 Métricas de Éxito

### KPIs a Medir

1. **Reducción de Tiempo de Viaje**
   - Objetivo: 30-40% de ahorro promedio
   - Medición: Comparar tiempo original vs optimizado

2. **Reducción de Distancia**
   - Objetivo: 25-35% menos kilómetros
   - Medición: Suma de distancias de todas las rutas

3. **Eliminación de Conflictos**
   - Objetivo: 100% de citas viables
   - Medición: # de conflictos antes vs después

4. **Tasa de Adopción**
   - Objetivo: 60% de usuarios aceptan sugerencias
   - Medición: # de optimizaciones aplicadas / # de sugerencias

5. **Satisfacción del Usuario**
   - Objetivo: 4.5+ de 5 estrellas
   - Medición: Encuesta post-optimización

---

## 🎯 Casos de Uso

### Caso 1: Ruta Zigzag (Común)

**Antes**:
```
Casa → Norte (10 km) → Sur (15 km) → Norte (12 km) → Casa
Total: 47 km, 2h 10min
```

**Después**:
```
Casa → Norte (10 km) → Norte (3 km) → Sur (20 km) → Casa
Total: 33 km, 1h 25min
Ahorro: 14 km, 45 min
```

### Caso 2: Tiempos de Espera Largos

**Antes**:
```
8:00 - Cita A (30 min)
8:30 - Llegada a B
11:00 - Cita B (2h 30min espera! ❌)
```

**Después**:
```
8:00 - Cita B
10:00 - Cita A (tiempo justo ✅)
```

### Caso 3: Conflictos Irresolubles

Si no hay solución sin reprogramar:
```
┌─────────────────────────────────────────────┐
│ ⚠️  No es posible optimizar sin cambiar    │
│     horarios                                │
│                                              │
│ Sugerencias:                                │
│ • Reprogramar Cita #3 para 30 min después  │
│ • Cancelar Cita #5 (muy lejana)            │
│ • Dividir en dos días diferentes            │
│                                              │
│     [Ver Opciones]  [Contactar Negocio]    │
└─────────────────────────────────────────────┘
```

---

## ⚡ Optimizaciones de Rendimiento

### 1. Procesamiento Asíncrono

```typescript
// No bloquear UI mientras calcula
async function optimizeInBackground() {
  const worker = new Worker('optimization-worker.js')
  const result = await worker.calculate(appointments)
  return result
}
```

### 2. Memoización

```typescript
// Cachear resultados de optimizaciones previas
const memoizedOptimize = useMemo(() => {
  return optimizeRoute(appointments, userLocation)
}, [appointments, userLocation])
```

### 3. Lazy Loading

```typescript
// Cargar componente solo cuando hay ineficiencia
const OptimizationCard = lazy(() => import('./RouteOptimizationCard'))

{hasInefficiency && (
  <Suspense fallback={<Spinner />}>
    <OptimizationCard />
  </Suspense>
)}
```

---

## 🚧 Consideraciones y Limitaciones

### Restricciones del Negocio

1. **Horarios de Atención**
   - Cada negocio tiene horario específico
   - No sugerir citas fuera de horario

2. **Disponibilidad de Especialistas**
   - Verificar si el especialista está libre
   - Considerar bloqueos de agenda

3. **Políticas de Cancelación**
   - Respetar ventanas de cancelación (ej: 24h)
   - No reprogramar citas muy próximas

### Limitaciones Técnicas

1. **API de Google Maps**
   - Cuota diaria limitada (consultar plan)
   - Latencia de red
   - Costo por request

2. **Complejidad Computacional**
   - Para > 20 citas, considerar algoritmo más avanzado
   - Timeout de 5 segundos máximo

3. **Precisión de Estimaciones**
   - Tráfico variable (hora pico vs normal)
   - Condiciones climáticas
   - Eventos especiales

---

## 📅 Plan de Implementación Sugerido

### Fase 1: MVP (2-3 semanas)
- ✅ Algoritmo Greedy básico
- ✅ Card de sugerencia simple
- ✅ Métricas básicas (distancia, tiempo)
- ✅ Solo visualización (no aplicar cambios)

### Fase 2: Aplicación (1-2 semanas)
- ✅ Modal de confirmación
- ✅ API para actualizar citas
- ✅ Validaciones de negocio
- ✅ Manejo de errores

### Fase 3: Refinamiento (2 semanas)
- ✅ Mapa comparativo
- ✅ Algoritmo mejorado con prioridades
- ✅ Cache de tiempos de viaje
- ✅ Analytics y métricas

### Fase 4: Avanzado (Futuro)
- ⬜ Algoritmo genético para > 20 citas
- ⬜ Machine Learning (predicción de tráfico)
- ⬜ Integración con calendario
- ⬜ Notificaciones proactivas

---

## 💰 Estimación de Esfuerzo

### Recursos Necesarios

**Desarrollo**:
- Senior Developer: 60-80 horas
- Mid-Level Developer: 40-60 horas
- Designer: 20 horas

**Total**: ~120-160 horas (3-4 semanas con 1 dev full-time)

### Desglose por Componente

| Componente | Horas |
|------------|-------|
| Algoritmo de optimización | 25h |
| Servicio de matriz de viaje | 15h |
| UI Components (Card, Modal, etc.) | 30h |
| Integración con API | 20h |
| Testing (unit + integration) | 25h |
| Documentación | 10h |
| QA y refinamiento | 15h |
| **TOTAL** | **140h** |

---

## 🎁 Valor Agregado para el Usuario

### Beneficios Directos

1. **Ahorro de Tiempo**: 30-45 min promedio por día
2. **Ahorro de Dinero**: Menos gasolina/transporte
3. **Menos Estrés**: Sin carreras contra el reloj
4. **Mejor Experiencia**: Llegar relajado a cada cita
5. **Productividad**: Tiempo libre para otras actividades

### Beneficios Indirectos

1. **Fidelización**: Usuarios valoran la inteligencia del sistema
2. **Diferenciación**: Competencia no tiene esta feature
3. **Datos Valiosos**: Insights sobre patrones de movilidad
4. **Reputación**: "La app que optimiza tu tiempo"

---

## ❓ Preguntas para Validar

Antes de implementar, necesitamos definir:

1. **Prioridad**: ¿Es alta prioridad o puede esperar?
2. **Alcance**: ¿MVP simple o feature completa?
3. **Timeline**: ¿Cuándo necesitamos tenerlo?
4. **Recursos**: ¿Quién trabajará en esto?
5. **Budget**: ¿Presupuesto para Google Maps API?
6. **Permisos**: ¿Podemos reprogramar citas automáticamente o solo sugerir?

---

## 📌 Recomendación Final

### 👍 PROCEDER CON MVP (Fase 1)

**Razones**:
- ✅ Problema real y frecuente
- ✅ Solución técnicamente viable
- ✅ Valor agregado claro para usuario
- ✅ Diferenciador competitivo
- ✅ Datos ya disponibles (duraciones, ubicaciones)
- ✅ Infraestructura lista (mapas, detección de conflictos)

**Empezar con**:
1. Algoritmo Greedy simple
2. Card de visualización (sin aplicar cambios)
3. Métricas de mejora
4. Feedback de usuarios beta

**Luego iterar** basado en feedback real.

---

## 📊 Próximos Pasos si se Aprueba

1. ✅ Crear issue en GitHub con especificación técnica
2. ✅ Diseñar mockups de UI en Figma
3. ✅ Definir contratos de API
4. ✅ Setup de testing environment
5. ✅ Implementar algoritmo core
6. ✅ Iterar y refinar

---

**Esperando tu aprobación para proceder** 🚀

¿Quieres que avancemos con esta propuesta? ¿Algún ajuste o consideración adicional?
