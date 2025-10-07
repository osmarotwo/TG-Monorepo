# Configuración de AWS Amplify para Deployment

Este archivo explica cómo configurar AWS Amplify para desplegar automáticamente el frontend.

## 🚀 Pasos para Configurar Amplify

### 1. Conectar Repositorio

1. Ve a la [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click en "New app" → "Host web app"
3. Conecta tu repositorio de GitHub/GitLab/Bitbucket
4. Selecciona la rama `main` o `master`

### 2. Configuración de Build

Amplify detectará automáticamente el archivo `amplify.yml` en la raíz del proyecto. La configuración incluye:

```yaml
version: 1
applications:
  - frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: out
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
      buildPath: /frontend
```

### 3. Variables de Entorno

Configura las siguientes variables en Amplify Console:

```
NEXT_PUBLIC_API_URL=https://tu-api-gateway-url.execute-api.region.amazonaws.com/prod
```

**Para obtener la URL del API Gateway:**
1. Despliega la infraestructura: `npm run deploy:infrastructure`
2. Copia la URL de la salida del comando (busca "ApiUrl")

### 4. Configuración Avanzada (Opcional)

#### Custom Headers
```json
[
  {
    "source": "**/*",
    "headers": [
      {
        "key": "X-Frame-Options",
        "value": "DENY"
      },
      {
        "key": "X-Content-Type-Options",
        "value": "nosniff"
      }
    ]
  }
]
```

#### Redirects
```json
[
  {
    "source": "/<*>",
    "target": "/index.html",
    "status": "404-200",
    "condition": null
  }
]
```

## 🔄 Workflow de Deployment

### Automático (Recomendado)

1. **Push a GitHub**: Cualquier push a la rama principal
2. **Build automático**: Amplify ejecuta el build automáticamente
3. **Deploy**: Se despliega la nueva versión

### Manual

1. En Amplify Console, ve a tu app
2. Click en "Run build" para desplegar manualmente

## 🔍 Monitoreo y Logs

### Access Logs
- Ve a CloudWatch Logs
- Busca el log group de tu app Amplify

### Build Logs
- En Amplify Console → Tu app → Build history
- Click en cualquier build para ver logs detallados

### Métricas
- Amplify Console muestra métricas de:
  - Requests por minuto
  - Data transfer
  - Build duration

## 🛠️ Troubleshooting

### Build Failures

1. **Error de dependencias**:
   ```bash
   # En Amplify build settings, asegúrate de usar:
   npm ci  # en lugar de npm install
   ```

2. **Error de memoria**:
   - Increase build memory en Amplify settings
   - Considera optimizar el build de Next.js

3. **Variables de entorno faltantes**:
   - Verifica que `NEXT_PUBLIC_API_URL` esté configurada
   - Variables deben empezar con `NEXT_PUBLIC_` para ser accesibles en el frontend

### Deployment Issues

1. **404 en rutas**:
   - Verifica que los redirects estén configurados
   - Next.js con `output: export` necesita configuración especial

2. **API no funciona**:
   - Verifica CORS en API Gateway
   - Verifica que la URL sea correcta (incluye `/prod`)
   - Usa las herramientas de developer del navegador para debug

### Performance

1. **Tiempo de carga lento**:
   - Optimiza imágenes
   - Usa Next.js Image optimization (considera si es compatible con export)
   - Implementa lazy loading

2. **Bundle size**:
   ```bash
   # Analiza el bundle
   npm run build
   npx @next/bundle-analyzer
   ```

## 📚 Recursos Adicionales

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Amplify Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html)