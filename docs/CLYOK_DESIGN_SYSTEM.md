# 🎨 Sistema de Diseño Clyok

## Última actualización: 16 de octubre de 2025

Este documento define el sistema de diseño oficial de Clyok que debe ser respetado en **TODOS** los componentes de UI del proyecto.

---

## 🎯 Principios de Diseño

1. **Consistencia**: Todos los componentes deben usar los mismos colores, tipografías y espaciados
2. **Claridad**: Diseño limpio y minimalista sin elementos innecesarios
3. **Modernidad**: Uso de glassmorphism (backdrop-blur) para efectos visuales modernos
4. **Accesibilidad**: Contraste adecuado y componentes accesibles
5. **Tema único**: Solo modo claro (light mode), **sin dark mode**

---

## 🎨 Paleta de Colores

### Colores Principales

```css
/* Color primario de marca */
--primary: #13a4ec;
--primary-hover: #0f8fcd;

/* Fondos */
--background-light: #f6f7f8;
--background-white: #ffffff;
--background-glass: rgba(255, 255, 255, 0.5); /* Con backdrop-blur */

/* Grises */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-900: #111827;

/* Estados */
--success: #10b981;
--success-bg: #f0fdf4;
--success-border: #bbf7d0;

--error: #ef4444;
--error-bg: #fef2f2;
--error-border: #fecaca;

--warning: #f59e0b;
--info: #3b82f6;
```

### Aplicación en Tailwind CSS

```tsx
// Fondo principal de página
className="bg-[#f6f7f8]"

// Tarjetas con efecto glassmorphism
className="bg-white/50 backdrop-blur-sm"

// Botones primarios
className="bg-[#13a4ec] hover:bg-[#0f8fcd]"

// Inputs
className="bg-[#f6f7f8] focus:ring-[#13a4ec]"

// Links
className="text-[#13a4ec] hover:text-[#0f8fcd]"
```

---

## 📝 Tipografía

### Fuente Principal

**Inter** - Google Fonts

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
```

### Escala Tipográfica

```tsx
// Título principal (H1)
className="text-3xl font-bold text-gray-900"

// Título secundario (H2)
className="text-2xl font-bold text-gray-900"

// Título terciario (H3)
className="text-lg font-medium text-gray-900"

// Párrafo normal
className="text-sm text-gray-600"

// Párrafo pequeño
className="text-xs text-gray-500"

// Label de formulario
className="text-sm font-medium text-gray-700"
```

---

## 🧩 Componentes Base

### Logo

**Ubicación**: `/nextjs-app/src/components/Logo.tsx`

```tsx
import { Logo } from '@/components/Logo';

// Tamaños disponibles
<Logo size="sm" />  // 8 (2rem)
<Logo size="md" />  // 12 (3rem)
<Logo size="lg" />  // 16 (4rem)

// Centrado en páginas de autenticación
<div className="flex justify-center mb-4">
  <Logo size="lg" />
</div>
```

### Estructura de Página de Autenticación

```tsx
<div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center px-4">
  {/* Language Selector - Fixed position */}
  <div className="fixed top-4 right-4 z-50">
    <LanguageSelector />
  </div>
  
  <div className="max-w-md w-full">
    <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Logo size="lg" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Título de la Página
        </h1>
        <p className="text-gray-600">
          Descripción breve
        </p>
      </div>

      {/* Contenido */}
      {/* ... */}
    </div>
  </div>
</div>
```

### Inputs de Formulario

```tsx
// Input de texto
<input
  type="text"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
  placeholder="Ingresa tu texto"
/>

// Input de email
<input
  type="email"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
  placeholder="correo@ejemplo.com"
/>

// Input de password
<input
  type="password"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-[#f6f7f8] text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent transition-colors"
  placeholder="••••••••"
/>

// Radio button
<input
  type="radio"
  className="mr-3 text-[#13a4ec] focus:ring-[#13a4ec]"
/>
```

### Botones

```tsx
// Botón primario
<button
  type="submit"
  className="w-full bg-[#13a4ec] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0f8fcd] focus:ring-2 focus:ring-[#13a4ec] focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  Acción Principal
</button>

// Botón secundario (Google OAuth)
<button
  type="button"
  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
>
  Acción Secundaria
</button>

// Botón terciario
<button
  type="button"
  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
>
  Cancelar
</button>
```

### Mensajes de Estado

```tsx
// Mensaje de éxito
<div className="bg-green-50 border border-green-200 p-4 rounded-lg">
  <div className="flex items-center">
    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <p className="text-sm text-green-800">Operación exitosa</p>
  </div>
</div>

// Mensaje de error
<div className="bg-red-50 border border-red-200 p-4 rounded-lg">
  <div className="flex items-center">
    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <p className="text-sm text-red-800">Ha ocurrido un error</p>
  </div>
</div>
```

### Links

```tsx
// Link normal
<Link 
  href="/ruta"
  className="text-[#13a4ec] hover:text-[#0f8fcd] font-medium"
>
  Texto del enlace
</Link>

// Link pequeño
<Link 
  href="/ruta"
  className="text-sm text-[#13a4ec] hover:text-[#0f8fcd] font-medium"
>
  Texto del enlace
</Link>
```

### Divisores

```tsx
// Divisor con texto
<div className="mt-6">
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white/50 text-gray-500">O continuar con</span>
    </div>
  </div>
</div>
```

### Loading Spinner

```tsx
// Spinner en página completa
<div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec]"></div>
</div>

// Spinner en botón
<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
```

---

## 📐 Espaciados y Layout

### Contenedores

```tsx
// Contenedor de página completa
className="min-h-screen bg-[#f6f7f8]"

// Contenedor centrado con max-width
className="max-w-md w-full"  // Formularios de auth
className="max-w-7xl mx-auto" // Dashboard/contenido principal

// Padding de página
className="px-4 py-6 sm:px-6 lg:px-8"
```

### Tarjetas

```tsx
// Tarjeta principal con glassmorphism
className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl p-8"

// Tarjeta secundaria
className="bg-[#f6f7f8] rounded-lg p-4"

// Tarjeta de contenido
className="bg-white overflow-hidden shadow-lg rounded-2xl"
```

### Espaciados Comunes

```tsx
// Entre secciones
className="mb-8"

// Entre elementos de formulario
className="space-y-6"

// Entre campos de texto
className="mb-2"

// Padding de tarjetas
className="p-8"  // Grande
className="p-4"  // Mediano
className="p-2"  // Pequeño
```

---

## 🎭 Efectos Visuales

### Glassmorphism

El efecto glassmorphism es característico del diseño Clyok:

```tsx
// Aplicación estándar
className="bg-white/50 backdrop-blur-sm"

// Con sombra
className="bg-white/50 backdrop-blur-sm shadow-xl"

// En divisores
className="bg-white/50" // Para el span del texto
```

### Sombras

```tsx
className="shadow-sm"   // Sutil
className="shadow"      // Normal
className="shadow-lg"   // Grande
className="shadow-xl"   // Extra grande
className="shadow-2xl"  // Máxima
```

### Transiciones

```tsx
// Transición de colores
className="transition-colors"

// Transición de todo
className="transition-all"

// Hover en botones
className="hover:bg-[#0f8fcd] transition-colors"
```

---

## 📱 Responsive Design

### Breakpoints

```tsx
// Móvil (default)
className="grid-cols-1"

// Tablet (md: 768px+)
className="md:grid-cols-2"

// Desktop (lg: 1024px+)
className="lg:px-8"

// Ejemplo completo
className="grid grid-cols-1 md:grid-cols-2 gap-6"
```

---

## 🚫 Prohibiciones

### ❌ NO USAR:

1. **Dark mode**: No usar clases con prefijo `dark:`
2. **Colores blue genéricos**: Usar `#13a4ec` en lugar de `blue-600`
3. **Gradientes de fondo**: Usar `bg-[#f6f7f8]` sólido
4. **Íconos decorativos innecesarios**: Mantener UI limpio
5. **Texto oscuro en fondos oscuros**: Solo light theme

### ❌ Ejemplos de lo que NO hacer:

```tsx
// ❌ NO usar dark mode
className="dark:bg-gray-900 dark:text-white"

// ❌ NO usar gradientes en fondos principales
className="bg-gradient-to-br from-blue-50 to-indigo-100"

// ❌ NO usar colores blue genéricos
className="bg-blue-600" // Usar bg-[#13a4ec]

// ❌ NO usar íconos circulares decorativos en headers
<div className="bg-[#13a4ec] p-3 rounded-full">
  <svg>...</svg>
</div>

// ❌ NO agregar texto "Clyok" junto al logo
<LogoWithText /> // Usar solo <Logo />
```

---

## ✅ Checklist para Nuevos Componentes

Antes de crear o modificar un componente de UI, verifica:

- [ ] Usa el color primario `#13a4ec` para botones principales
- [ ] Usa fondo `bg-[#f6f7f8]` para páginas completas
- [ ] Usa `bg-white/50 backdrop-blur-sm` para tarjetas principales
- [ ] El logo está centrado usando `<div className="flex justify-center">`
- [ ] Los inputs usan `bg-[#f6f7f8]` y `focus:ring-[#13a4ec]`
- [ ] No hay clases `dark:` en ninguna parte
- [ ] Los links usan `text-[#13a4ec]`
- [ ] Las transiciones están aplicadas con `transition-colors`
- [ ] El espaciado es consistente con el sistema
- [ ] La tipografía usa Inter (ya cargada globalmente)
- [ ] Los estados de loading usan el color `#13a4ec`
- [ ] Los mensajes de error/éxito siguen el formato estándar

---

## 📚 Referencias

### Archivos Clave

```
/nextjs-app/src/
├── components/
│   ├── Logo.tsx                    # Componente de logo oficial
│   ├── GoogleAuthButton.tsx        # Botón de Google OAuth
│   └── LanguageSelector.tsx        # Selector de idioma
├── app/
│   ├── globals.css                 # Estilos globales y Tailwind config
│   ├── auth/
│   │   ├── login/page.tsx         # ✅ Referencia de diseño
│   │   ├── register/page.tsx      # ✅ Referencia de diseño
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── onboarding/page.tsx
│   └── dashboard/page.tsx
└── design_reference/
    └── logo/
        └── logo-clyok.png          # Logo oficial en PNG
```

### Páginas de Referencia

Para ver ejemplos completos de implementación correcta, consulta:

1. **Login**: `/nextjs-app/src/app/auth/login/page.tsx`
2. **Register**: `/nextjs-app/src/app/auth/register/page.tsx`
3. **Dashboard**: `/nextjs-app/src/app/dashboard/page.tsx`

---

## 🔄 Última Revisión

**Fecha**: 16 de octubre de 2025  
**Versión**: 1.0  
**Estado**: ✅ Implementado en todas las páginas

Este sistema de diseño fue implementado completamente en todo el proyecto y debe ser respetado para mantener la consistencia visual de la marca Clyok.

---

## 📞 Contacto

Para preguntas o sugerencias sobre el sistema de diseño, consulta con el equipo de desarrollo.
