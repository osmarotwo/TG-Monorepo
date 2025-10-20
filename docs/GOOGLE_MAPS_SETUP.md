# 🗺️ Guía de Configuración de Google Maps

## Paso 1: Crear API Key de Google Maps

### 1. Ir a Google Cloud Console
Visita: https://console.cloud.google.com/

### 2. Crear o Seleccionar un Proyecto
- Si no tienes proyecto, crea uno nuevo
- Dale un nombre como "Clyok-Dashboard"

### 3. Habilitar APIs Necesarias
Ve a **APIs & Services > Library** y habilita:
- ✅ **Maps JavaScript API** (para mapas interactivos)
- ✅ **Maps Static API** (para imágenes estáticas del mapa)
- ✅ **Geocoding API** (opcional, para convertir direcciones a coordenadas)

### 4. Crear API Key
1. Ve a **APIs & Services > Credentials**
2. Click en **+ CREATE CREDENTIALS**
3. Selecciona **API Key**
4. Copia la API Key generada (ejemplo: `AIzaSyD...`)

### 5. Restringir la API Key (Recomendado para Seguridad)
1. Click en la API Key creada
2. En **Application restrictions**:
   - Selecciona **HTTP referrers (web sites)**
   - Agrega:
     - `http://localhost:3000/*` (desarrollo)
     - `https://tudominio.com/*` (producción)
3. En **API restrictions**:
   - Selecciona **Restrict key**
   - Marca las APIs habilitadas arriba
4. Click **Save**

---

## Paso 2: Configurar en el Proyecto

### 1. Agregar API Key al archivo `.env.local`

Crea o edita el archivo `.env.local` en la carpeta `nextjs-app`:

```bash
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyD-tu-api-key-aqui
```

⚠️ **IMPORTANTE**: 
- No compartas esta API Key públicamente
- Agrega `.env.local` al `.gitignore` (ya debería estar)

### 2. Reiniciar el servidor de desarrollo

```bash
cd nextjs-app
npm run dev
```

---

## Paso 3: Verificar que Funciona

### Opción A: Mapa Estático (Ya Implementado)
El componente `MapSection.tsx` ya está configurado para usar Google Maps Static API automáticamente cuando detecte la API Key.

**Verás**:
- Mapa real con marcadores de tus ubicaciones
- Colores personalizados (Clyok blue: #13a4ec)
- Etiquetas con primera letra del nombre de cada sede

### Opción B: Mapa Interactivo (Opcional)
Si quieres un mapa interactivo (zoom, arrastrar, click en marcadores), podemos actualizar el componente.

---

## Costos de Google Maps

### Maps Static API (Actual)
- **Gratis**: Primeras 28,000 solicitudes/mes
- **Después**: $2 USD por cada 1,000 solicitudes adicionales
- **Estimado dashboard**: ~100-500 solicitudes/mes (muy bajo costo)

### Maps JavaScript API (Si implementas interactivo)
- **Gratis**: Primeras 28,000 cargas/mes
- **Después**: $7 USD por cada 1,000 cargas adicionales

💡 **Recomendación**: Para un dashboard con pocas visitas, el tier gratuito es más que suficiente.

---

## Troubleshooting

### Problema: "This page can't load Google Maps correctly"
**Solución**: 
- Verifica que la API Key esté correcta en `.env.local`
- Verifica que las APIs estén habilitadas en Google Cloud
- Verifica las restricciones de la API Key

### Problema: Mapa no carga en producción
**Solución**:
- Agrega tu dominio de producción a las restricciones de HTTP referrers
- Verifica que la variable de entorno esté configurada en tu plataforma de hosting

### Problema: Marcadores no aparecen
**Solución**:
- Verifica que las coordenadas lat/lng sean correctas
- Revisa la consola del navegador para errores

---

## Alternativas Gratuitas (Opcional)

Si prefieres no usar Google Maps, estas son alternativas:

### 1. **Mapbox** (Recomendado)
- Tier gratuito: 50,000 cargas/mes
- API similar a Google Maps
- Mejor pricing para startups

### 2. **OpenStreetMap + Leaflet**
- 100% gratuito
- Open source
- Requiere más configuración

### 3. **Placeholder estático** (Actual)
- Gratis
- No requiere API Key
- Ya funciona ahora

---

## Próximos Pasos

1. ✅ Obtén la API Key de Google Maps
2. ✅ Agrégala a `.env.local`
3. ✅ Reinicia el servidor
4. ✅ Recarga http://localhost:3000/dashboard
5. 🎉 ¡Verás el mapa real!

¿Necesitas ayuda con algún paso específico?
