# 🎨 Frontend React App

Frontend moderno desarrollado con React, Vite y TypeScript. Parte del monorepo AWS Full-Stack.

## 🚀 Tecnologías

- **React 18** - Librería UI moderna
- **Vite** - Build tool ultrarrápido
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Iconos SVG
- **React Router** - Navegación SPA
- **Vitest** - Testing framework

## 📁 Estructura del Proyecto

```
frontend/
├── public/                # Assets estáticos
├── src/
│   ├── components/        # Componentes React reutilizables
│   │   └── HolaMundo.tsx  # Componente de ejemplo
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utilidades y helpers
│   │   └── config.ts     # Configuración de la app
│   ├── types/            # Definiciones TypeScript
│   ├── assets/           # Imágenes, iconos, etc.
│   ├── styles/           # Archivos CSS
│   │   ├── index.css     # Estilos globales + Tailwind
│   │   └── App.css       # Estilos específicos del App
│   ├── App.tsx           # Componente principal
│   ├── main.tsx          # Entry point
│   └── vite-env.d.ts     # Tipos de Vite
├── package.json
├── vite.config.ts        # Configuración de Vite
├── tsconfig.json         # Configuración TypeScript
├── tailwind.config.js    # Configuración Tailwind
└── postcss.config.js     # Configuración PostCSS
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo (http://localhost:3000)
npm run preview          # Preview del build de producción

# Build
npm run build            # Build para producción
npm run deploy           # Alias para build (usado en Amplify)

# Testing y Quality
npm run test             # Ejecutar tests con Vitest
npm run test:ui          # UI de tests interactiva
npm run lint             # Linter ESLint

# Desde el monorepo raíz
npm run dev:frontend     # Iniciar desarrollo
npm run build:frontend   # Build del frontend
npm run test:frontend    # Tests del frontend
```

## 🎯 Características Principales

### ⚡ Desarrollo Rápido
- **Hot Module Replacement (HMR)** con Vite
- **TypeScript** para mejor DX y menos bugs
- **ESLint** configurado para calidad de código

### 🎨 Styling Moderno
- **Tailwind CSS** con configuración personalizada
- **PostCSS** para procesamiento CSS
- **Custom Animations** y themes configurados

### 🏗️ Arquitectura Escalable
- **Alias paths** configurados (`@/components`, `@/utils`, etc.)
- **Separación de concerns** clara
- **Custom hooks** para lógica reutilizable

### 🔧 Configuración de Desarrollo
- **Path mapping** en TypeScript
- **Environment variables** con tipado
- **Modern ES modules** configuration

## 🌐 Variables de Entorno

Crea un archivo `.env.local` en la carpeta `frontend/`:

```env
VITE_API_URL=https://tu-api-gateway-url.execute-api.region.amazonaws.com/prod
VITE_APP_TITLE=Mi App Frontend
```

**Importante**: Las variables deben empezar con `VITE_` para ser accesibles en el frontend.

## 🎨 Integración de Diseños

El proyecto está preparado para integrar tus diseños personalizados:

### 1. Componentes Base
```tsx
// src/components/MiComponente.tsx
import React from 'react'

interface MiComponenteProps {
  titulo: string
  onClick?: () => void
}

const MiComponente: React.FC<MiComponenteProps> = ({ titulo, onClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {titulo}
      </h2>
      {onClick && (
        <button 
          onClick={onClick}
          className="btn-primary"
        >
          Click me
        </button>
      )}
    </div>
  )
}

export default MiComponente
```

### 2. Estilos Personalizados
```css
/* src/styles/custom.css */
@layer components {
  .mi-boton-especial {
    @apply px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300;
  }
}
```

### 3. Hooks Personalizados
```tsx
// src/hooks/useApi.ts
import { useState, useEffect } from 'react'
import { API_CONFIG } from '@/utils/config'

export const useApi = <T>(endpoint: string) => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`)
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [endpoint])

  return { data, loading, error }
}
```

## 🚀 Deployment en Amplify

El proyecto está configurado para despliegue automático en AWS Amplify:

1. **Conecta tu repositorio** en Amplify Console
2. **Build settings**: Se detecta automáticamente via `amplify.yml`
3. **Variables de entorno**: Configura `VITE_API_URL` en Amplify
4. **Deploy automático** en cada push

### Build Configuration (amplify.yml)
```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - cd frontend
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: frontend/dist
        files:
          - '**/*'
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm run test

# Watch mode
npm run test:watch

# UI interactiva
npm run test:ui
```

Ejemplo de test:
```tsx
// src/components/__tests__/HolaMundo.test.tsx
import { render, screen } from '@testing-library/react'
import HolaMundo from '../HolaMundo'

describe('HolaMundo', () => {
  it('should render hello message', () => {
    render(<HolaMundo />)
    expect(screen.getByText('¡Hola Mundo!')).toBeInTheDocument()
  })
})
```

## 📝 Próximos Pasos

1. **Integra tus diseños**: Reemplaza el componente `HolaMundo` con tus componentes
2. **Añade routing**: Configura React Router para navegación
3. **Conecta con API**: Usa el API Gateway desplegado
4. **Optimiza performance**: Lazy loading, code splitting
5. **Add testing**: Aumenta cobertura de tests

## 🤝 Contribución

1. Crea componentes reutilizables en `src/components/`
2. Mantén consistencia con Tailwind CSS
3. Añade tipos TypeScript para mejor DX
4. Documenta componentes complejos
5. Escribe tests para funcionalidad crítica

---

✨ **¡El frontend está listo para tus diseños!** ✨