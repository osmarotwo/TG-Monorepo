# 🚀 Guía de Comandos Rápidos

## 📥 Instalación Inicial

```bash
# Instalar todas las dependencias del monorepo
npm run install:all

# O instalar por separado si prefieres
npm run install:infrastructure
npm run install:lambdas  
npm run install:frontend
```

## 🏗️ Desarrollo y Build

```bash
# Compilar todos los proyectos
npm run build

# Compilar por separado
npm run build:infrastructure
npm run build:lambdas
npm run build:frontend

# Ejecutar tests
npm run test
```

## ☁️ Deployment en AWS

### 1. Configurar AWS CLI
```bash
aws configure
# Ingresa tu Access Key ID, Secret Key, región, etc.
```

### 2. Bootstrap CDK (solo primera vez)
```bash
cd infrastructure
npm run bootstrap
```

### 3. Desplegar Infraestructura
```bash
npm run deploy:infrastructure
```

**📝 Importante**: Copia la URL del API Gateway que aparece en la salida del comando.

### 4. Configurar Frontend
```bash
# Crear archivo de variables de entorno
echo "NEXT_PUBLIC_API_URL=https://tu-api-gateway-url/prod" > frontend/.env.local
```

### 5. Probar Frontend Localmente
```bash
npm run dev:frontend
# Abre http://localhost:3000
```

## 🌐 Deployment en Amplify

### Opción 1: Amplify Console (Recomendado)
1. Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click "New app" → "Host web app"
3. Conecta tu repositorio GitHub
4. Amplify detecta automáticamente `amplify.yml`
5. Configura variable de entorno: `NEXT_PUBLIC_API_URL`
6. ¡Deploy automático!

### Opción 2: Amplify CLI
```bash
# Instalar Amplify CLI
npm install -g @aws-amplify/cli

# Configurar
amplify configure

# Inicializar en la carpeta frontend
cd frontend
amplify init

# Agregar hosting
amplify add hosting

# Desplegar
amplify publish
```

## 🔧 Comandos de Desarrollo

```bash
# Limpiar todo
npm run clean

# Ver diferencias antes de deploy
npm run cdk -- diff

# Destruir infraestructura
npm run destroy:infrastructure

# Sintetizar CloudFormation template
npm run cdk -- synth
```

## 🐛 Troubleshooting

### Error de permisos AWS
```bash
# Verificar configuración
aws sts get-caller-identity

# Reconfigurar si es necesario
aws configure
```

### Error de dependencias
```bash
npm run clean
npm run install:all
```

### Frontend no se conecta al API
1. Verifica que `NEXT_PUBLIC_API_URL` esté configurado
2. Verifica que la URL incluya `/prod` al final
3. Verifica CORS en el API Gateway

### Build failure en Amplify
1. Verifica que `amplify.yml` esté en la raíz
2. Verifica variables de entorno en Amplify Console
3. Revisa los logs de build en Amplify

## 📂 Estructura de Archivos Principales

```
.
├── infrastructure/          # AWS CDK
│   ├── bin/app.ts          # Entry point
│   ├── lib/api-lambda-stack.ts # Stack principal
│   └── test/               # Tests CDK
├── lambdas/api-handler/     # Lambda function
│   └── src/index.ts        # Handler code
├── frontend/               # Next.js app
│   ├── src/app/           # Pages
│   └── src/components/    # React components
├── package.json           # Scripts del monorepo
├── amplify.yml           # Config Amplify
└── README.md             # Documentación completa
```

## 📚 URLs Útiles

- **AWS CDK Docs**: https://docs.aws.amazon.com/cdk/
- **Next.js Docs**: https://nextjs.org/docs
- **Amplify Docs**: https://docs.amplify.aws/
- **AWS CLI Docs**: https://docs.aws.amazon.com/cli/

## 🎯 Próximos Pasos Sugeridos

1. **Personalizar la API**: Modifica `lambdas/api-handler/src/index.ts`
2. **Agregar más endpoints**: Actualiza el CDK stack
3. **Mejorar el frontend**: Agrega más componentes en `frontend/src/components/`
4. **Configurar CI/CD**: Usa GitHub Actions con Amplify
5. **Agregar autenticación**: Considera AWS Cognito
6. **Agregar base de datos**: DynamoDB con CDK

¡Tu monorepo full-stack está listo para escalar! 🚀