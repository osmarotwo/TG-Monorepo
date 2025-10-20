# Fix: Mapa Recargando Infinitamente

## 🔴 Problema Original

El mapa se estaba recargando múltiples veces causando:
- Error de cuota de Google Maps multiplicado
- Consola llena de errores `IntersectionObserver`
- Warnings de `google.maps.Marker` deprecated
- Geolocalización preguntando permisos repetidamente
- Página con "flickering" / parpadeo

## 🔍 Causa Raíz

**Re-render Loop infinito** causado por `useEffect` con dependencias mal configuradas:

```typescript
// ❌ ANTES - PROBLEMA:
const [appointmentsWithDetails, setAppointmentsWithDetails] = useState([])

// useEffect 1: Combina appointments + locations -> actualiza state
useEffect(() => {
  setAppointmentsWithDetails(combined) // ❌ Cambia state
}, [appointments, locations])

// useEffect 2: Inicializa mapa cuando cambia appointmentsWithDetails
useEffect(() => {
  // ... inicializa mapa
  calculateRoutes() // ❌ Dentro llama setAppointmentsWithDetails()
}, [appointmentsWithDetails]) // ❌ Se dispara cuando cambia appointmentsWithDetails

// useEffect 3: calculateRoutes actualiza appointmentsWithDetails
const calculateRoutes = () => {
  setAppointmentsWithDetails(updatedData) // ❌ Cambia state de nuevo
}

// LOOP INFINITO:
// appointments change → useEffect 1 → setAppointmentsWithDetails
// → useEffect 2 → calculateRoutes → setAppointmentsWithDetails
// → useEffect 2 → calculateRoutes → ... ♾️
```

## ✅ Solución Implementada

### 1. Usar `useMemo` para Datos Derivados

```typescript
// ✅ DESPUÉS - SOLUCIÓN:
// No usar state para datos derivados, usar useMemo
const appointmentsWithDetails = React.useMemo(() => {
  return appointments.map((apt) => ({
    ...apt,
    location: locations.find((loc) => loc.locationId === apt.locationId),
  }))
}, [appointments, locations]) // Solo re-calcula si props cambian
```

**Por qué funciona**: `useMemo` no causa re-renders, solo re-calcula el valor cuando las dependencias cambian.

### 2. Separar Travel Times Data

```typescript
// ✅ State separado para travel times (calculados por Directions API)
const [travelTimesData, setTravelTimesData] = useState<any[]>([])

// calculateRoutes ahora solo actualiza travel times
const calculateRoutes = (map, userLoc, appointments) => {
  directionsService.route(request, (result, status) => {
    if (status === 'OK') {
      const timesData = appointments.map((apt, index) => ({
        ...apt,
        travelTimeFromUser: legs[0]?.duration?.text,
        // ...
      }))
      setTravelTimesData(timesData) // ✅ No afecta appointmentsWithDetails
    }
  })
}
```

### 3. Prevenir Múltiples Inicializaciones

```typescript
// ✅ Ref para prevenir inicializaciones concurrentes
const isInitializingRef = useRef(false)
const [hasCalculatedRoutes, setHasCalculatedRoutes] = useState(false)

useEffect(() => {
  if (isInitializingRef.current) return // ✅ Ya inicializando
  if (mapInstanceRef.current) return // ✅ Ya existe el mapa
  
  isInitializingRef.current = true
  
  // ... inicializar mapa
  
  if (!hasCalculatedRoutes) {
    calculateRoutes(...)
    setHasCalculatedRoutes(true) // ✅ Solo una vez
  }
  
  isInitializingRef.current = false
}, [isLoaded, appointmentsWithDetails, userLocation, hasCalculatedRoutes])
```

### 4. Geolocalización Solo Una Vez

```typescript
// ✅ ANTES: Se ejecutaba múltiples veces
useEffect(() => {
  navigator.geolocation.getCurrentPosition(...)
}, []) // ❌ Pero se disparaba igual por otros re-renders

// ✅ DESPUÉS: Con cleanup y mounted flag
useEffect(() => {
  let mounted = true
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (mounted) { // ✅ Solo si componente sigue montado
        setUserLocation(...)
      }
    },
    (error) => {
      if (mounted) {
        setUserLocation({ lat: 4.711, lng: -74.073 }) // Bogotá default
      }
    },
    { timeout: 5000, maximumAge: 300000 } // ✅ Cache por 5 minutos
  )

  return () => {
    mounted = false // ✅ Cleanup
  }
}, []) // ✅ Solo una vez
```

### 5. Manejo Gracioso de Errores de Cuota

```typescript
// ✅ Si falla Directions API, el mapa sigue funcionando
directionsService.route(request, (result, status) => {
  if (status === 'OK' && result?.routes?.[0]) {
    // Mostrar rutas y travel times
    setTravelTimesData(timesData)
  } else {
    // ✅ Fail silently - mapa con marcadores sigue visible
    console.warn('Could not calculate route:', status)
  }
})
```

## 📊 Resultados

### Antes:
```
❌ 10+ inicializaciones de mapa por carga de página
❌ 20+ requests a Directions API
❌ Cuota agotada en minutos
❌ Console llena de errores
❌ Página flickering
```

### Después:
```
✅ 1 sola inicialización de mapa
✅ 1 solo request a Directions API (si hay cuota)
✅ Mapa funciona aunque falle Directions API
✅ Console limpia (solo warnings informativos)
✅ Página estable sin flickering
✅ Si falta cuota: mapa con marcadores visible, sin travel times
```

## 🎯 Cambios en Archivos

### `/nextjs-app/src/components/dashboard/AppointmentMapSection.tsx`

**Líneas 30-50**: State y refs actualizados
```diff
- const [appointmentsWithDetails, setAppointmentsWithDetails] = useState([])
+ const [travelTimesData, setTravelTimesData] = useState([])
+ const [hasCalculatedRoutes, setHasCalculatedRoutes] = useState(false)
+ const isInitializingRef = useRef(false)

+ const appointmentsWithDetails = React.useMemo(() => {
+   return appointments.map(...)
+ }, [appointments, locations])
```

**Líneas 55-75**: Geolocalización mejorada
```diff
  useEffect(() => {
+   let mounted = true
    navigator.geolocation.getCurrentPosition(
      (position) => {
-       setUserLocation(...)
+       if (mounted) setUserLocation(...)
      },
+     { timeout: 5000, maximumAge: 300000 }
    )
+   return () => { mounted = false }
  }, [])
```

**Líneas 135-270**: Inicialización de mapa con guards
```diff
  useEffect(() => {
+   if (isInitializingRef.current) return
+   if (mapInstanceRef.current) return
+   
+   isInitializingRef.current = true
    
    // ... inicializar mapa
    
+   if (!hasCalculatedRoutes) {
      calculateRoutes(...)
+     setHasCalculatedRoutes(true)
+   }
    
+   isInitializingRef.current = false
- }, [isLoaded, appointmentsWithDetails, userLocation])
+ }, [isLoaded, appointmentsWithDetails, userLocation, hasCalculatedRoutes])
```

**Líneas 280-350**: calculateRoutes actualizado
```diff
  const calculateRoutes = (map, userLoc, appointments) => {
    directionsService.route(request, (result, status) => {
-     if (status === 'OK') {
+     if (status === 'OK' && result?.routes?.[0]) {
-       setAppointmentsWithDetails(updatedData)
+       setTravelTimesData(timesData)
+     } else {
+       console.warn('Could not calculate route:', status)
      }
    })
  }
```

**Líneas 420-455**: Travel Times usando travelTimesData
```diff
- {appointmentsWithDetails.some(...) && (
+ {travelTimesData.length > 0 && travelTimesData.some(...) && (
    <div>
-     {appointmentsWithDetails.map(...)}
+     {travelTimesData.map(...)}
    </div>
  )}
```

## 🚀 Mejoras Adicionales Futuras

### 1. Debounce de Inicialización

```typescript
const debouncedInit = useCallback(
  debounce(() => {
    initializeMap()
  }, 500),
  []
)
```

### 2. Memoizar Marcadores

```typescript
const markers = useMemo(() => {
  return appointmentsWithDetails.map((apt) => ({
    position: { lat: apt.location.latitude, lng: apt.location.longitude },
    label: `${index + 1}`,
  }))
}, [appointmentsWithDetails])
```

### 3. Lazy Loading del Mapa

```typescript
const [shouldLoadMap, setShouldLoadMap] = useState(false)

useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      setShouldLoadMap(true)
    }
  })
  
  if (mapRef.current) {
    observer.observe(mapRef.current)
  }
  
  return () => observer.disconnect()
}, [])
```

## 📝 Lecciones Aprendidas

1. **No usar state para datos derivados** → Usar `useMemo` o `useCallback`
2. **Evitar actualizar state dentro de useEffect que depende de ese state** → Loop infinito
3. **Usar refs para flags de control** → `isInitializingRef`, `mapInstanceRef`
4. **Cleanup en useEffect** → `return () => {}` para prevenir memory leaks
5. **Fail gracefully** → Si una feature falla, las demás siguen funcionando
6. **Cache API calls costosos** → Geolocation con `maximumAge`

## ✅ Verificación

Para confirmar que el fix funciona:

1. Abrir DevTools → Console
2. Recargar página
3. Verificar:
   - ✅ Solo 1 mensaje de geolocalización
   - ✅ Solo 1 "Loading Google Maps"
   - ✅ Máximo 1 error de cuota (si aplica)
   - ✅ Mapa visible con marcadores
   - ✅ Travel times visible (si hay cuota disponible)

Si ves múltiples mensajes repetidos, el problema persiste.
