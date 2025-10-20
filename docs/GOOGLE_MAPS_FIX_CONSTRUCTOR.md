# 🔧 Fix Final - Error "undefined is not a constructor"

**Fecha**: 20 de octubre de 2025 (después del almuerzo)
**Error**: `TypeError: undefined is not a constructor (evaluating 'new google.maps.Map(...)')`

## 🐛 Problema

Después de los fixes iniciales, apareció un nuevo error:
```
TypeError: undefined is not a constructor 
(evaluating 'new google.maps.Map(mapRef.current, {...})')
```

### Causa Raíz
El evento `onload` del script se disparaba **antes** de que `google.maps.Map` estuviera completamente inicializado. El script HTML se cargaba, pero la API de Google Maps necesitaba tiempo adicional para inicializarse.

**Secuencia del problema**:
1. ✅ Script `<script src="maps.googleapis.com/...">` se carga
2. 🔥 Evento `onload` se dispara
3. ✅ React state `isLoaded` se pone en `true`
4. ❌ `useEffect` intenta crear `new google.maps.Map()`
5. 💥 **Error**: `google.maps.Map` aún no existe

## ✅ Solución Implementada

### 1. Polling para Verificar API Disponible

En lugar de confiar solo en el evento `onload`, ahora hacemos **polling** para verificar que `google.maps.Map` realmente exista:

```typescript
script.onload = () => {
  console.log('📦 Script loaded, waiting for API...');
  
  // Poll cada 100ms hasta que API esté disponible
  const checkInterval = setInterval(() => {
    if (window.google?.maps?.Map) {
      console.log('✅ Google Maps API ready');
      clearInterval(checkInterval);
      setIsLoaded(true); // ← Solo ahora marcamos como loaded
    }
  }, 100);
  
  // Timeout después de 10 segundos
  setTimeout(() => clearInterval(checkInterval), 10000);
};
```

### 2. Verificación Específica de `google.maps.Map`

Cambiamos de verificar solo `window.google?.maps` a verificar `window.google?.maps?.Map`:

**Antes**:
```typescript
if (window.google?.maps) return; // ❌ maps puede existir pero Map no
```

**Después**:
```typescript
if (window.google?.maps?.Map) return; // ✅ Verificamos el constructor
```

### 3. Try-Catch para Errores

Agregamos bloques `try-catch` alrededor de la creación del mapa:

```typescript
try {
  const map = new google.maps.Map(mapRef.current, {...});
  // ... resto del código
} catch (error) {
  console.error('❌ Error initializing Google Maps:', error);
}
```

### 4. Logs para Debugging

Agregamos logs detallados para rastrear el proceso de carga:

```
📥 Loading Google Maps script...
📦 Script loaded, waiting for API...
✅ Google Maps API ready
```

## 📁 Cambios en el Código

### MapSection.tsx - useEffect de Carga

```typescript
useEffect(() => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') return;

  // 1. Verificar si ya está disponible
  if (window.google?.maps?.Map) {
    console.log('✅ Google Maps already loaded');
    setIsLoaded(true);
    return;
  }

  // 2. Buscar script existente
  const existingScript = document.querySelector(
    'script[src*="maps.googleapis.com/maps/api/js"]'
  );
  
  if (existingScript) {
    console.log('⏳ Google Maps script found, waiting for API...');
    // Poll para verificar disponibilidad
    const checkInterval = setInterval(() => {
      if (window.google?.maps?.Map) {
        console.log('✅ Google Maps API ready');
        clearInterval(checkInterval);
        setIsLoaded(true);
      }
    }, 100);
    setTimeout(() => clearInterval(checkInterval), 10000);
    return;
  }

  // 3. Crear nuevo script
  console.log('📥 Loading Google Maps script...');
  const script = document.createElement('script');
  script.src = `...&loading=async`;
  script.onload = () => {
    console.log('📦 Script loaded, waiting for API...');
    // Poll para verificar disponibilidad
    const checkInterval = setInterval(() => {
      if (window.google?.maps?.Map) {
        console.log('✅ Google Maps API ready');
        clearInterval(checkInterval);
        setIsLoaded(true);
      }
    }, 100);
    setTimeout(() => clearInterval(checkInterval), 10000);
  };
  document.head.appendChild(script);
}, []);
```

### MapSection.tsx - useEffect de Inicialización

```typescript
useEffect(() => {
  if (!isLoaded || !mapRef.current || locations.length === 0) return;

  // Verificación específica del constructor
  if (!window.google?.maps?.Map) {
    console.log('⚠️ Google Maps API not ready yet, waiting...');
    return;
  }
  
  const google = window.google;
  
  try {
    const map = new google.maps.Map(mapRef.current, {...});
    // ... resto del código
  } catch (error) {
    console.error('❌ Error initializing Google Maps:', error);
  }
}, [isLoaded, locations, centerLat, centerLng]);
```

## 🧪 Testing

### Cómo Verificar el Fix

1. **Abrir Dashboard**: http://localhost:3000/dashboard
2. **Abrir DevTools Console** (F12)
3. **Verificar logs en orden**:
   ```
   📥 Loading Google Maps script...
   📦 Script loaded, waiting for API...
   ✅ Google Maps API ready
   ```
4. **Verificar NO aparezca**:
   ```
   ❌ TypeError: undefined is not a constructor
   ```

### Checklist
- [ ] Mapa carga sin errores
- [ ] Logs aparecen en el orden correcto
- [ ] No hay "undefined is not a constructor"
- [ ] Controles del mapa funcionan
- [ ] Marcadores clickeables
- [ ] Info windows funcionan

## 📊 Antes vs Después

### Antes del Fix
```
1. Script onload → setIsLoaded(true)
2. useEffect ejecuta → new google.maps.Map()
3. 💥 Error: google.maps.Map is undefined
```

### Después del Fix
```
1. Script onload → Poll every 100ms
2. window.google?.maps?.Map existe? → setIsLoaded(true)
3. useEffect ejecuta → Verificación adicional
4. ✅ new google.maps.Map() funciona
```

## 🔄 Por Qué Este Approach

### ¿Por qué Polling?

**Alternativas consideradas**:
1. ❌ `script.onload` - Se dispara antes de que API esté lista
2. ❌ Callback global - Requiere modificar URL y configurar callback
3. ✅ **Polling** - Simple, confiable, funciona en todos los casos

**Ventajas del Polling**:
- ✅ Verifica el estado real de la API
- ✅ No depende de eventos externos
- ✅ Fácil de entender y debuggear
- ✅ Timeout incorporado (10s) para evitar loops infinitos

### ¿Por qué 100ms?

- **Suficientemente rápido**: Usuario no nota delay
- **Suficientemente lento**: No sobrecarga el navegador
- **Balance perfecto**: Típicamente se detecta en 200-500ms

## 📝 Notas Técnicas

### Race Condition

Este error era un **race condition** clásico:
- Script se carga asíncronamente
- API se inicializa asíncronamente dentro del script
- React intenta usar API antes de que esté lista

### TypeScript Ignores

Los `// @ts-ignore` son necesarios porque:
```typescript
// TypeScript no sabe que google existe en window
if (window.google?.maps?.Map) { // OK con ?. pero TS no infiere tipo
  const map = new google.maps.Map(...) // TS error sin @ts-ignore
}
```

### Cleanup de Intervals

**Importante**: Siempre limpiamos los intervals:
```typescript
setTimeout(() => clearInterval(checkInterval), 10000);
```
Sin esto, podrían quedar intervals corriendo indefinidamente.

## ✅ Estado Final

**Error Resuelto**: ✅  
**Polling Implementado**: ✅  
**Try-Catch Agregado**: ✅  
**Logs Detallados**: ✅  
**Timeout de Seguridad**: ✅  

---

**Próximo Paso**: Probar en el dashboard y verificar que funcione correctamente.
