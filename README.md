# AWS Full-Stack Monorepo

Este es un monorepo completo para una aplicación full-stack en AWS que incluye:

- **Infrastructure (CDK)**: Infraestructura como código con AWS CDK
- **Lambdas**- **Vista Previa en Vivo**

- **URL Local**: http://localhost:3000/
- **Toggle tema**: Botón superior derecha
- **Responsive**: Redimensiona la ventana para probar

### 📸 Ejemplos de Configuración

#### Ejemplo 1: Plataforma "CitasMédicas"
```typescript
// frontend/src/utils/brandConfig.ts
export const brandConfig = {
  platform: {
    name: "CitasMédicas",
    tagline: "Agenda tus citas médicas fácilmente",
  },
  branding: {
    primaryColor: "#059669", // Verde médico
    logoType: "icon",
    logoConfig: {
      icon: "calendar",
    }
  },
  content: {
    registration: {
      title: "Únete a CitasMédicas",
      subtitle: "Gestiona tus citas médicas de forma inteligente.",
    }
  }
};
```

#### Ejemplo 2: Plataforma "BeautyApp"
```typescript
// frontend/src/utils/brandConfig.ts
export const brandConfig = {
  platform: {
    name: "BeautyApp",
    tagline: "Tu belleza, nuestra prioridad",
  },
  branding: {
    primaryColor: "#ec4899", // Rosa beauty
    logoType: "text",
    logoConfig: {
      text: "BA",
    }
  },
  content: {
    registration: {
      title: "Únete a BeautyApp",
      subtitle: "Reserva tus citas de belleza al instante.",
    }
  }
};
```

#### Ejemplo 3: Con Logo Personalizado
```typescript
// 1. Coloca tu logo en: frontend/public/mi-logo.png
// 2. Configura:
export const brandConfig = {
  platform: {
    name: "MiEmpresa",
  },
  branding: {
    primaryColor: "#1d4ed8", // Azul corporativo
    logoType: "image",
    logoConfig: {
      image: "/mi-logo.png", // ← Tu imagen aquí
    }
  }
};
```

### ❓ FAQ - Personalización

**P: ¿Cómo cambio el logo?**
R: Edita `logoType` y `logoConfig` en `frontend/src/utils/brandConfig.ts`

**P: ¿Puedo usar mi propio icono SVG?**
R: Sí, agrega tu icono al objeto `icons` en `frontend/src/components/ui/Icon.tsx`

**P: ¿Los cambios se aplican automáticamente?**
R: Sí, Vite tiene hot reload. Los cambios aparecen instantáneamente.

**P: ¿Cómo hago que el logo sea más grande?**
R: En el componente Logo, cambia la prop `size`: `<Logo size="xl" />`

**P: ¿Puedo cambiar la tipografía?**
R: Sí, modifica `fontFamily` en `frontend/tailwind.config.js`

### 5. Desplegar Frontend en Amplifyones serverless en TypeScript  
- **Frontend**: Aplicación React con Vite y pantalla de registro moderna

## 📁 Estructura del Proyecto

```
.
├── infrastructure/          # AWS CDK Infrastructure as Code
│   ├── bin/                # CDK app entry point
│   ├── lib/                # CDK stacks y construcciones
│   ├── test/               # Tests de infraestructura
│   └── cdk.json           # Configuración CDK
├── lambdas/                # Funciones Lambda
│   └── api-handler/        # Handler principal del API
│       ├── src/           # Código fuente de la Lambda
│       └── package.json   # Dependencias de la Lambda
├── frontend/               # Aplicación React + Vite
│   ├── src/               # Código fuente del frontend
│   │   ├── components/    # Componentes React reutilizables
│   │   │   ├── ui/       # Componentes UI base
│   │   │   ├── RegistrationForm.tsx  # Pantalla de registro
│   │   │   └── ThemeToggle.tsx       # Toggle dark/light
│   │   ├── contexts/      # React Contexts (tema, etc.)
│   │   ├── utils/         # Utilidades y configuración
│   │   │   └── brandConfig.ts        # 🎨 CONFIGURACIÓN DINÁMICA
│   │   └── styles/        # Estilos CSS
│   ├── tailwind.config.js # Configuración Tailwind
│   └── package.json       # Dependencias del frontend
├── design_reference/       # Diseños de referencia
├── package.json           # Configuración del monorepo
└── amplify.yml           # Configuración de Amplify
```

## 🚀 Guía de Inicio Rápido

### 1. Instalación de Dependencias

```bash
# Instalar todas las dependencias del monorepo
npm run install:all
```

### 2. Desplegar Infraestructura

```bash
# Bootstrap CDK (solo la primera vez)
cd infrastructure && npm run bootstrap

# Desplegar la infraestructura
npm run deploy:infrastructure
```

**Importante**: Copia la URL del API Gateway de la salida del comando deploy.

### 3. Configurar Frontend

```bash
# Crear archivo de variables de entorno
echo "VITE_API_URL=tu_api_gateway_url_aqui" > frontend/.env.local
```

### 4. Ejecutar Frontend Localmente

```bash
npm run dev:frontend
```

## 🎨 Personalización de la Plataforma

### 🔧 Configuración Dinámica

Todo el branding de la aplicación se controla desde un solo archivo: `frontend/src/utils/brandConfig.ts`

#### Cambiar Nombre de la Plataforma

```typescript
// En frontend/src/utils/brandConfig.ts
export const brandConfig: BrandConfig = {
  platform: {
    name: "MiPlataforma", // 🔧 CAMBIAR AQUÍ
    tagline: "Gestiona tus citas de manera eficiente",
    description: "La mejor plataforma para administrar tus citas y servicios"
  },
  // ...
};
```

#### Personalizar Logo

**Opción 1: Usar Icono SVG (Recomendado)**
```typescript
branding: {
  primaryColor: "#13a4ec",
  logoType: "icon", // 🔧 Tipo de logo
  logoConfig: {
    icon: "user", // 🔧 Iconos disponibles:
    // "user", "calendar", "star", "heart", "settings", 
    // "google", "moon", "sun", "eye", "eyeOff"
  }
}
```

**Opción 2: Usar Imagen**
```typescript
branding: {
  primaryColor: "#13a4ec",
  logoType: "image", // 🔧 Cambiar a imagen
  logoConfig: {
    image: "/logo.png", // 🔧 Path a tu imagen (colócala en frontend/public/)
  }
}
```

**Opción 3: Usar Texto/Iniciales**
```typescript
branding: {
  primaryColor: "#13a4ec",
  logoType: "text", // 🔧 Cambiar a texto
  logoConfig: {
    text: "MP", // 🔧 Iniciales o texto corto
  }
}
```

#### Cambiar Colores

```typescript
branding: {
  primaryColor: "#13a4ec", // 🔧 Tu color principal en HEX
  // Este color se aplicará automáticamente a:
  // - Botones primarios
  // - Links
  // - Focus states
  // - Logo background
}
```

#### Personalizar Textos

```typescript
content: {
  registration: {
    title: "Crea tu cuenta", // 🔧 Título principal
    subtitle: "Únete para gestionar tus citas sin problemas.", // 🔧 Subtítulo
    submitText: "Registrarse", // 🔧 Texto del botón
    alternativeText: "O regístrate con", // 🔧 Texto separador
    loginLinkText: "Iniciar sesión", // 🔧 Link inferior
    passwordRequirements: "La contraseña debe tener al menos 8 caracteres..."
  }
}
```

#### Configurar Tema

```typescript
theme: {
  defaultMode: "light", // 🔧 "light", "dark", "system"
  glassmorphism: true   // 🔧 Efecto cristal en cards
}
```

### 🎨 Colores Disponibles en Tailwind

Tu configuración automáticamente genera estas clases CSS:

```css
/* Colores primarios */
.bg-primary      /* Fondo color principal */
.text-primary    /* Texto color principal */
.border-primary  /* Borde color principal */
.ring-primary    /* Ring focus color principal */

/* Fondos por tema */
.bg-background-light  /* Fondo claro */
.bg-background-dark   /* Fondo oscuro */
.bg-card-light        /* Card claro con glassmorphism */
.bg-card-dark         /* Card oscuro con glassmorphism */
```

### 🚀 Aplicar Cambios

1. **Edita** `frontend/src/utils/brandConfig.ts`
2. **Guarda** el archivo
3. **El hot reload** aplicará los cambios automáticamente
4. **Reinicia** el servidor si es necesario: `npm run dev:frontend`

### 📱 Vista Previa en Vivo

- **URL Local**: http://localhost:3000/
- **Toggle tema**: Botón superior derecha
- **Responsive**: Redimensiona la ventana para probar

### 5. Desplegar Frontend en Amplify

El archivo `amplify.yml` ya está configurado. Solo necesitas:

1. Conectar tu repositorio a AWS Amplify
2. Amplify detectará automáticamente la configuración
3. Configurar la variable de entorno `NEXT_PUBLIC_API_URL` en Amplify

## 📦 Scripts Disponibles

### Scripts del Monorepo

- `npm run install:all` - Instala dependencias en todos los proyectos
- `npm run build` - Construye todos los proyectos
- `npm run test` - Ejecuta tests en todos los proyectos
- `npm run clean` - Limpia node_modules de todos los proyectos

### Scripts de Infraestructura

- `npm run deploy:infrastructure` - Despliega el stack de CDK
- `npm run destroy:infrastructure` - Destruye el stack de CDK
- `npm run cdk -- diff` - Muestra diferencias con el stack desplegado
- `npm run cdk -- synth` - Genera el template CloudFormation

### Scripts de Frontend

- `npm run dev:frontend` - Ejecuta el frontend en modo desarrollo
- `npm run build:frontend` - Construye el frontend para producción
- `npm run deploy:frontend` - Construye y exporta para Amplify

## 🏗️ Arquitectura

### Infraestructura (AWS CDK)

- **API Gateway**: REST API público
- **Lambda Function**: Procesa las solicitudes HTTP
- **IAM Roles**: Permisos automáticos entre servicios
- **CloudWatch**: Logs automáticos

### Frontend (React + Vite)

- **React 18**: Biblioteca moderna con Concurrent Features
- **Vite**: Build tool ultrarrápido con HMR
- **TypeScript**: Tipado estático para mejor desarrollo
- **Tailwind CSS**: Framework CSS utility-first
- **Responsive Design**: Mobile-first approach
- **Dark/Light Mode**: Sistema de temas completo
- **Glassmorphism**: Efectos visuales modernos
- **Componentes Reutilizables**: Biblioteca UI escalable

### Lambda Functions

- **TypeScript**: Código tipado y moderno
- **Modular**: Estructura escalable para múltiples funciones
- **Testing**: Configuración de Jest incluida

## 🔧 Desarrollo

### Agregar una Nueva Lambda

1. Crear nueva carpeta en `lambdas/`
2. Copiar estructura de `api-handler/`
3. Actualizar el stack CDK para incluir la nueva función

### Modificar la API

- Editar `lambdas/api-handler/src/index.ts`
- Compilar: `cd lambdas/api-handler && npm run build`
- Redesplegar: `npm run deploy:infrastructure`

### Personalizar el Frontend

- **Configuración dinámica**: `frontend/src/utils/brandConfig.ts`
- **Componentes UI**: `frontend/src/components/ui/`
- **Pantallas**: `frontend/src/components/`
- **Estilos**: Tailwind CSS con configuración personalizada
- **Temas**: Sistema dark/light integrado

## 🚀 Deployment

### Infraestructura

```bash
npm run deploy:infrastructure
```

### Frontend en Amplify

1. **Conectar repositorio**: En AWS Amplify Console
2. **Build settings**: Amplify detecta `amplify.yml` automáticamente
3. **Variables de entorno**: Configurar `NEXT_PUBLIC_API_URL`
4. **Deploy**: Amplify construye y despliega automáticamente

### Variables de Entorno

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://tu-api-id.execute-api.region.amazonaws.com/prod
```

#### Amplify (en la consola)
```
NEXT_PUBLIC_API_URL=https://tu-api-id.execute-api.region.amazonaws.com/prod
```

## 🧪 Testing

### Ejecutar Todos los Tests

```bash
npm run test
```

### Tests por Proyecto

```bash
npm run test:infrastructure  # Tests de CDK
npm run test:lambdas        # Tests de Lambdas  
npm run test:frontend       # Tests del Frontend
```

## 🛠️ Troubleshooting

### Frontend Issues

#### No aparece el logo en el formulario
1. Verifica que el servidor esté ejecutándose: `npm run dev:frontend`
2. Abre las herramientas de desarrollador (F12) y revisa errores en Console
3. Verifica la configuración en `frontend/src/utils/brandConfig.ts`:
   ```typescript
   logoType: "icon", // Debe ser "icon", "image" o "text"
   logoConfig: {
     icon: "user", // Verifica que el icono exista
   }
   ```
4. Fuerza un refresh: Ctrl+F5 (Windows) o Cmd+Shift+R (Mac)

#### Los colores no se aplican
1. Verifica que Tailwind esté compilando correctamente
2. Reinicia el servidor de desarrollo
3. Verifica que `primaryColor` sea un HEX válido: `#13a4ec`

#### El tema oscuro no funciona
1. Verifica que el ThemeProvider esté correctamente configurado en App.tsx
2. Comprueba que el toggle esté visible en la esquina superior derecha
3. Verifica localStorage del navegador para `theme`

### Error de permisos AWS
```bash
aws configure
# Asegúrate de tener permisos para CloudFormation, Lambda, API Gateway, IAM
```

### Error de bootstrap CDK
```bash
cd infrastructure
npm run bootstrap
```

### Frontend no conecta con API
1. Verifica que `NEXT_PUBLIC_API_URL` esté configurado
2. Verifica que la URL termine en `/prod` (o el stage correcto)
3. Verifica CORS en el API Gateway

### Build failures
```bash
npm run clean
npm run install:all
npm run build
```

## 📚 Recursos Adicionales

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)