# 🗺️ Guía de Prueba - Google Maps Interactivo

## ✅ Estado Actual
- ✅ Servidor Next.js corriendo en http://localhost:3000
- ✅ MapSection.tsx convertido a mapa interactivo
- ✅ API Key configurada (confirmado porque el mapa cargó)
- ✅ Sin errores de TypeScript

## 🎯 Pasos para Probar

### 1. Abrir Dashboard
Navega a: **http://localhost:3000/dashboard**

### 2. Verificar Controles de Navegación

#### Zoom Controls
- [ ] ✅ Botón **+** (zoom in) visible en esquina superior izquierda
- [ ] ✅ Botón **-** (zoom out) visible debajo del +
- [ ] ✅ Al hacer click en +, el mapa hace zoom
- [ ] ✅ Al hacer click en -, el mapa aleja

#### Street View (Pegman)
- [ ] ✅ Ícono de persona amarilla visible (esquina superior derecha)
- [ ] ✅ Al arrastrar el pegman, aparecen calles azules
- [ ] ✅ Al soltar en una calle azul, se activa Street View
- [ ] ✅ Botón X para salir de Street View

#### Map Type Selector
- [ ] ✅ Selector visible (esquina superior derecha)
- [ ] ✅ Opciones: "Map" y "Satellite"
- [ ] ✅ Al cambiar a Satellite, se ve imagen satelital
- [ ] ✅ Al volver a Map, se ve mapa de calles

#### Pan/Drag
- [ ] ✅ Al hacer click y arrastrar, el mapa se mueve
- [ ] ✅ Cursor cambia a "mano" al arrastrar

#### Scroll Zoom
- [ ] ✅ Al hacer scroll, el mapa hace zoom in/out

### 3. Verificar Marcadores Personalizados

#### Apariencia
- [ ] ✅ Marcadores son **círculos azules** (#13a4ec)
- [ ] ✅ Tienen borde **blanco**
- [ ] ✅ Muestran **primera letra** del nombre de la sede en blanco
- [ ] ✅ Tamaño apropiado (12px)

#### Conteo
Deberías ver **5 marcadores** para:
- [ ] Chapinero
- [ ] Chía
- [ ] Usaquén
- [ ] Suba
- [ ] Kennedy

### 4. Verificar Info Windows

Para **cada marcador**:
- [ ] ✅ Al hacer **click**, se abre ventana de información
- [ ] ✅ Muestra **nombre de la sede** en azul Clyok
- [ ] ✅ Muestra **dirección** con ícono 📍
- [ ] ✅ Muestra **ciudad** con ícono 🏙️
- [ ] ✅ Muestra **teléfono** con ícono 📞 (si está disponible)
- [ ] ✅ Botón **"🗺️ Cómo llegar"** presente
- [ ] ✅ Al hacer click en "Cómo llegar", abre Google Maps en nueva pestaña
- [ ] ✅ Google Maps abre con direcciones desde ubicación actual

### 5. Verificar Overlay de Estadísticas

En la parte **inferior** del mapa:
- [ ] ✅ Fondo blanco semi-transparente
- [ ] ✅ Muestra: "5 Sedes en X Ciudades"
- [ ] ✅ Muestra: "💡 Click en los marcadores para ver detalles"
- [ ] ✅ Botón **"🗺️ Ampliar"** visible

### 6. Verificar Modo Fullscreen

Al hacer click en **"🗺️ Ampliar"**:
- [ ] ✅ Se abre modal a pantalla completa
- [ ] ✅ Fondo negro semi-transparente
- [ ] ✅ Mapa más grande en el centro
- [ ] ✅ Botón **"✕ Cerrar"** visible (esquina superior derecha)

En modo fullscreen:
- [ ] ✅ Marcadores **más grandes** (15px)
- [ ] ✅ Todos los controles funcionan
- [ ] ✅ Info windows funcionan igual
- [ ] ✅ Control de fullscreen de Google Maps también visible

En **overlay inferior**:
- [ ] ✅ Título: "Todas las Sedes"
- [ ] ✅ Grid con las 5 sedes
- [ ] ✅ Cada sede muestra:
  - Círculo azul
  - Nombre de la sede
  - Ciudad

Al hacer click en **"✕ Cerrar"**:
- [ ] ✅ Modal se cierra
- [ ] ✅ Vuelve al mapa normal

### 7. Verificar Auto-Fit Bounds

Al cargar el mapa:
- [ ] ✅ Todas las 5 sedes son visibles
- [ ] ✅ Zoom automático para mostrar todas
- [ ] ✅ Ninguna sede queda fuera del área visible

## 🎨 Comparación Antes vs Después

### Antes (Imagen Estática)
- ❌ Sin controles de navegación
- ❌ No se puede hacer zoom
- ❌ No se puede arrastrar
- ❌ Marcadores no clickeables
- ❌ No hay info windows
- ❌ Sin Street View
- ❌ No se puede cambiar tipo de mapa

### Después (Mapa Interactivo)
- ✅ Controles de zoom (+/-)
- ✅ Street View (pegman)
- ✅ Map Type selector (Map/Satellite)
- ✅ Pan/drag para mover
- ✅ Scroll para zoom
- ✅ Marcadores clickeables
- ✅ Info windows con datos
- ✅ Botón "Cómo llegar" funcional
- ✅ Modo fullscreen
- ✅ Auto-fit bounds

## 📸 Screenshots Sugeridos

Toma screenshots de:
1. Vista normal del mapa con controles visibles
2. Info window abierta en un marcador
3. Modo Satellite
4. Street View activado
5. Modo fullscreen

## 🐛 Troubleshooting

### Si no ves los controles:
1. Verifica que el API key sea válida
2. Verifica que Maps JavaScript API esté habilitada
3. Abre consola del navegador (F12) y busca errores

### Si los marcadores se ven mal:
1. Deberían ser círculos azules (#13a4ec)
2. Con letra blanca en el centro
3. Si se ven diferentes, revisa la consola

### Si las info windows no abren:
1. Asegúrate de hacer click directamente en el marcador
2. Espera a que el mapa cargue completamente
3. Revisa consola por errores

## ✅ Checklist Final

- [ ] Dashboard carga correctamente
- [ ] Mapa interactivo visible
- [ ] Controles de zoom funcionan
- [ ] Street View disponible
- [ ] Map Type selector funciona
- [ ] Marcadores azules Clyok visibles
- [ ] Info windows abren al hacer click
- [ ] Botón "Cómo llegar" funciona
- [ ] Modo fullscreen funciona
- [ ] Auto-fit muestra todas las sedes
- [ ] Overlay con estadísticas visible
- [ ] Sin errores en consola

## 🎉 Resultado Esperado

Deberías ver un **mapa interactivo de Google Maps** con:
- 🗺️ Todos los controles de navegación
- 📍 5 marcadores azules (#13a4ec) con letras blancas
- 💬 Info windows al hacer click en marcadores
- 🔍 Zoom automático mostrando todas las sedes
- 📊 Overlay con "5 Sedes en X Ciudades"
- 🖼️ Botón para abrir fullscreen

## 📝 Notas

- El mapa debe cargar en **menos de 2 segundos**
- Los controles deben ser **responsive** en mobile
- Las info windows deben tener el **color Clyok** (#13a4ec)
- El botón "Cómo llegar" debe abrir **Google Maps** en nueva pestaña

---

**¿Todo funciona?** ✅  
**¿Encontraste algún problema?** 🐛 Reporta en la consola del navegador (F12)
