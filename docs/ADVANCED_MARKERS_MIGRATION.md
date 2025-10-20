# Migración a Google Maps AdvancedMarkerElement

## 📢 Aviso de Google Maps

**Desde el 21 de febrero de 2024**, `google.maps.Marker` está **deprecated** (obsoleto).

Google recomienda migrar a `google.maps.marker.AdvancedMarkerElement`.

### Timeline:
- ✅ **Ahora**: Ambas APIs funcionan
- ⚠️ **Futuro**: Solo se arreglarán bugs críticos en `Marker`
- 🔴 **12+ meses aviso**: Antes de discontinuar completamente

## 🔄 Cambios Implementados

### 1. Script Loading con Librería `marker`

**ANTES**:
```javascript
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`
```

**DESPUÉS**:
```javascript
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async`
```

**Por qué**: `AdvancedMarkerElement` requiere la librería `marker` explícitamente.

### 2. Map Initialization con `mapId`

**ANTES**:
```javascript
const map = new google.maps.Map(mapRef.current, {
  zoom: 12,
  center: { lat: centerLat, lng: centerLng },
  mapTypeControl: true,
})
```

**DESPUÉS**:
```javascript
const map = new google.maps.Map(mapRef.current, {
  zoom: 12,
  center: { lat: centerLat, lng: centerLng },
  mapTypeControl: true,
  mapId: 'APPOINTMENT_MAP', // ⭐ REQUERIDO para AdvancedMarkerElement
})
```

**Por qué**: `AdvancedMarkerElement` requiere un `mapId` para funcionar. Puede ser cualquier string único.

### 3. Marcadores con HTML Personalizado

#### ANTES - google.maps.Marker (deprecated):
```javascript
const marker = new google.maps.Marker({
  position: { lat: location.latitude, lng: location.longitude },
  map,
  title: location.name,
  icon: {
    path: google.maps.SymbolPath.CIRCLE,
    scale: 20,
    fillColor: '#DC2626',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 3,
  },
  label: {
    text: `${index + 1}`,
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
  },
})
```

#### DESPUÉS - AdvancedMarkerElement (recomendado):
```javascript
// 1. Crear elemento HTML personalizado
const pin = document.createElement('div')
pin.className = 'appointment-marker'
pin.innerHTML = `
  <div style="
    width: 48px;
    height: 48px;
    background-color: #DC2626;
    border: 4px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    color: white;
    cursor: pointer;
    transition: transform 0.2s;
  " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
    ${index + 1}
  </div>
`

// 2. Crear marcador con contenido HTML
const marker = new google.maps.marker.AdvancedMarkerElement({
  map,
  position: { lat: location.latitude, lng: location.longitude },
  content: pin, // ⭐ Elemento HTML en lugar de icon
  title: location.name,
})
```

**Ventajas**:
- 🎨 **HTML/CSS completo**: Usa cualquier estilo, no limitado a SVG paths
- 🖱️ **Hover effects**: `onmouseover`, `onmouseout` funcionan nativamente
- 🎯 **Flexibilidad**: Puedes usar emojis, iconos, imágenes, gradientes, etc.
- ⚡ **Mejor performance**: Renderizado más eficiente

### 4. InfoWindow con Nueva API

**ANTES**:
```javascript
marker.addListener('click', () => {
  infoWindow.open(map, marker)
})
```

**DESPUÉS**:
```javascript
marker.addListener('click', () => {
  infoWindow.open({
    anchor: marker, // ⭐ Usar objeto con anchor
    map,
  })
})
```

**Por qué**: `AdvancedMarkerElement` usa un formato diferente para abrir InfoWindows.

### 5. Cleanup de Marcadores

**ANTES**:
```javascript
markersRef.current.forEach((marker) => marker.setMap(null))
```

**DESPUÉS**:
```javascript
markersRef.current.forEach((marker) => {
  if (marker.setMap) {
    marker.setMap(null) // Old API (Marker)
  } else if (marker.map) {
    marker.map = null // New API (AdvancedMarkerElement)
  }
})
```

**Por qué**: APIs diferentes para remover marcadores.

## 📁 Archivos Modificados

### `/nextjs-app/src/components/dashboard/AppointmentMapSection.tsx`

**Línea 115**: Script loading
```diff
- script.src = `...api/js?key=${apiKey}&loading=async`
+ script.src = `...api/js?key=${apiKey}&libraries=marker&loading=async`
```

**Línea 168**: Map initialization
```diff
  const map = new google.maps.Map(mapRef.current, {
    zoom: 12,
    center: { lat: centerLat, lng: centerLng },
+   mapId: 'APPOINTMENT_MAP',
  })
```

**Líneas 178-195**: Cleanup de marcadores
```diff
  markersRef.current.forEach((marker) => {
-   marker.setMap(null)
+   if (marker.setMap) {
+     marker.setMap(null) // Old API
+   } else if (marker.map) {
+     marker.map = null // New API
+   }
  })
```

**Líneas 198-238**: Marcador de usuario con HTML
```diff
- const userMarker = new google.maps.Marker({
-   position: userLocation,
-   map,
-   icon: { ... }
- })

+ const userPin = document.createElement('div')
+ userPin.innerHTML = `<div style="...">📍</div>`
+ 
+ const userMarker = new google.maps.marker.AdvancedMarkerElement({
+   map,
+   position: userLocation,
+   content: userPin,
+   title: 'Tu ubicación',
+ })
```

**Líneas 241-285**: Marcadores de citas con HTML y números
```diff
- const marker = new google.maps.Marker({
-   position: { lat, lng },
-   map,
-   label: { text: `${index + 1}`, ... },
-   icon: { path: CIRCLE, scale: 20, ... }
- })

+ const pin = document.createElement('div')
+ pin.innerHTML = `<div style="...background: #DC2626...">${index + 1}</div>`
+ 
+ const marker = new google.maps.marker.AdvancedMarkerElement({
+   map,
+   position: { lat, lng },
+   content: pin,
+   title: location.name,
+ })
```

**Línea 314**: InfoWindow.open()
```diff
  marker.addListener('click', () => {
-   infoWindow.open(map, marker)
+   infoWindow.open({ anchor: marker, map })
  })
```

### `/nextjs-app/src/components/dashboard/MapSection.tsx`

**Línea 74**: Script loading
```diff
- script.src = `...api/js?key=${apiKey}&loading=async`
+ script.src = `...api/js?key=${apiKey}&libraries=marker&loading=async`
```

**Línea 118**: Map initialization (small map)
```diff
  const map = new google.maps.Map(mapRef.current, {
    center: { lat: centerLat, lng: centerLng },
    zoom: 12,
+   mapId: 'LOCATIONS_MAP',
  })
```

**Líneas 125-160**: Marcadores con HTML personalizado
```diff
- const marker = new google.maps.Marker({
-   position: { lat, lng },
-   map,
-   icon: { path: CIRCLE, scale: 14, ... },
-   label: { text: name[0], ... }
- })

+ const pin = document.createElement('div')
+ pin.innerHTML = `
+   <div style="width: 40px; height: 40px; background: #DC2626; ...">
+     ${location.name[0]}
+   </div>
+ `
+ 
+ const marker = new google.maps.marker.AdvancedMarkerElement({
+   map,
+   position: { lat, lng },
+   content: pin,
+   title: location.name,
+ })
```

**Línea 177**: InfoWindow.open()
```diff
  marker.addListener('click', () => {
-   infoWindow.open(map, marker)
+   infoWindow.open({ anchor: marker, map })
  })
```

**Línea 227**: Map initialization (fullscreen)
```diff
  const map = new google.maps.Map(fullscreenMapRef.current, {
    center: { lat: centerLat, lng: centerLng },
    zoom: 12,
+   mapId: 'LOCATIONS_MAP_FULLSCREEN',
  })
```

**Líneas 235-270**: Marcadores fullscreen con HTML (48px)
```diff
- const marker = new google.maps.Marker({
-   position: { lat, lng },
-   map,
-   icon: { path: CIRCLE, scale: 15, ... },
-   label: { text: name[0], ... }
- })

+ const pin = document.createElement('div')
+ pin.innerHTML = `
+   <div style="width: 48px; height: 48px; background: #DC2626; ...">
+     ${location.name[0]}
+   </div>
+ `
+ 
+ const marker = new google.maps.marker.AdvancedMarkerElement({
+   map,
+   position: { lat, lng },
+   content: pin,
+   title: location.name,
+ })
```

**Línea 293**: InfoWindow.open() fullscreen
```diff
  marker.addListener('click', () => {
-   infoWindow.open(map, marker)
+   infoWindow.open({ anchor: marker, map })
  })
```

## 🎨 Mejoras Visuales Incluidas

Con `AdvancedMarkerElement` ahora tenemos:

### 1. Hover Effects Nativos
```javascript
onmouseover="this.style.transform='scale(1.1)'" 
onmouseout="this.style.transform='scale(1)'"
```

Los marcadores crecen al hacer hover, mejorando la UX.

### 2. Tamaños Consistentes
- **Marcador de usuario**: 24px (azul con 📍)
- **Marcadores pequeños**: 40px (letra inicial del lugar)
- **Marcadores de citas**: 48px (número de cita)
- **Marcadores fullscreen**: 48px (letra inicial, más grande)

### 3. Box Shadows Mejoradas
```css
box-shadow: 0 2px 8px rgba(0,0,0,0.3);  /* Normal */
box-shadow: 0 3px 10px rgba(0,0,0,0.4); /* Fullscreen */
```

Mayor profundidad visual en los marcadores.

### 4. Emojis en Marcadores
```javascript
// Marcador de usuario con emoji
pin.innerHTML = `<div>📍</div>`
```

Los emojis se renderizan perfectamente en los marcadores HTML.

## ⚡ Beneficios de la Migración

### Performance
- ✅ Renderizado más eficiente (GPU-accelerated)
- ✅ Menos llamadas al Canvas API
- ✅ Mejor manejo de muchos marcadores

### Flexibilidad
- ✅ HTML/CSS completo (gradientes, sombras, animaciones)
- ✅ Elementos interactivos en marcadores
- ✅ Imágenes, SVG, o cualquier contenido HTML

### Mantenimiento
- ✅ API moderna con soporte activo
- ✅ Nuevas features solo en AdvancedMarkerElement
- ✅ No depende de API deprecated

### UX
- ✅ Hover effects suaves
- ✅ Marcadores más atractivos visualmente
- ✅ Mejor contraste y legibilidad

## 🧪 Testing

Para verificar que la migración funciona:

1. **Abrir DevTools → Console**
2. **Verificar**:
   - ❌ **NO** debe aparecer warning de `google.maps.Marker is deprecated`
   - ✅ Script carga con `&libraries=marker`
   - ✅ Marcadores se ven con estilos HTML
   - ✅ Hover effects funcionan (marcadores crecen)
   - ✅ InfoWindows se abren al hacer click

3. **Inspeccionar marcadores**:
   ```javascript
   // En Console:
   window.google.maps.marker // Debe existir
   ```

4. **Verificar que no hay errores**:
   - Map ID warnings → Normal si no tienes Map ID en Google Cloud
   - Quota errors → Solo si excediste cuota (esperado)

## 📚 Referencias

- [Google Maps Deprecations](https://developers.google.com/maps/deprecations)
- [Advanced Markers Migration Guide](https://developers.google.com/maps/documentation/javascript/advanced-markers/migration)
- [Advanced Markers Documentation](https://developers.google.com/maps/documentation/javascript/advanced-markers)
- [AdvancedMarkerElement API Reference](https://developers.google.com/maps/documentation/javascript/reference/advanced-markers#AdvancedMarkerElement)

## ✅ Estado Actual

- ✅ **AppointmentMapSection**: Migrado a AdvancedMarkerElement
- ✅ **MapSection**: Migrado a AdvancedMarkerElement (normal + fullscreen)
- ✅ **Script loading**: Incluye librería `marker`
- ✅ **Map IDs**: Configurados para todos los mapas
- ✅ **Cleanup**: Compatible con ambas APIs
- ✅ **InfoWindows**: Actualizado formato de open()
- ✅ **Hover effects**: Implementados en todos los marcadores
- ✅ **No warnings**: Eliminado warning de deprecated

**La app ahora usa la API moderna de Google Maps recomendada por Google.** 🎉
