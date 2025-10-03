# AWS Full-Stack Monorepo

Este es un monorepo completo para una aplicación full-stack en AWS que incluye:

- **Infrastructure (CDK)**: Infraestructura como código con AWS CDK
- **Lambdas**: Funciones serverless en TypeScript  
- **Frontend**: Aplicación Next.js desplegable en Amplify

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
├── frontend/               # Aplicación Next.js
│   ├── src/               # Código fuente del frontend
│   │   ├── app/          # App Router de Next.js
│   │   └── components/   # Componentes React
│   └── package.json      # Dependencias del frontend
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
echo "NEXT_PUBLIC_API_URL=tu_api_gateway_url_aqui" > frontend/.env.local
```

### 4. Ejecutar Frontend Localmente

```bash
npm run dev:frontend
```

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

### Frontend (Next.js)

- **App Router**: Estructura moderna de Next.js 14
- **Tailwind CSS**: Estilos utilitarios
- **TypeScript**: Tipado estático
- **Componentes**: Interfaz para probar la API

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

- Componentes en `frontend/src/components/`
- Páginas en `frontend/src/app/`
- Estilos con Tailwind CSS

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