# 🔑 Configuración de Google OAuth - Guía Rápida

## 📋 Pasos para Configurar Google Sign-In

### 1. Crear Proyecto en Google Cloud Console

1. **Ve a**: https://console.cloud.google.com/
2. **Crea** un nuevo proyecto o selecciona uno existente
3. **Nombra** tu proyecto (ej: "MiPlataforma OAuth")

### 2. Habilitar APIs

1. Ve a **"APIs y servicios" > "Biblioteca"**
2. Busca y habilita **"Identity Toolkit API"**
3. Haz clic en **"Habilitar"**

💡 **Nota**: Identity Toolkit API es la API moderna de Google para autenticación y OAuth.

### 3. Configurar Pantalla de Consentimiento OAuth

**⚠️ PASO OBLIGATORIO**: Antes de crear credenciales, debes configurar la pantalla de consentimiento.

1. Ve a **"APIs y servicios" > "Pantalla de consentimiento de OAuth"**
2. Selecciona **"Externo"** (para usuarios de cualquier cuenta Google)
3. Completa la información básica:
   - **Nombre de la aplicación**: "Mi Plataforma" (o tu nombre)
   - **Correo electrónico de asistencia**: tu email
   - **Logo de la aplicación**: (opcional, DÉJALO VACÍO por ahora)
   - **Dominios autorizados**: DÉJALO VACÍO por ahora
   - **Correo electrónico del desarrollador**: tu email
4. **Guarda y continúa** en cada sección
5. En **"Ámbitos"**: NO agregues nada, usa solo los predeterminados
6. En **"Usuarios de prueba"**: agrega tu email para testing
7. **Finaliza** la configuración

**🔍 IMPORTANTE**: 
- Si tu app está en "Testing", solo los usuarios de prueba pueden usarla
- Para producción, deberás solicitar verificación de Google
- Por ahora, agrega tu email como usuario de prueba

### 4. Crear Credenciales OAuth

1. Ve a **"APIs y servicios" > "Credenciales"**
2. Clic **"Crear credenciales" > "ID de cliente OAuth"** (la única opción disponible)
3. Selecciona **"Aplicación web"**
4. Configura **EXACTAMENTE** así:
   - **Nombre**: "MiPlataforma Web Client"
   - **Orígenes autorizados de JavaScript**:
     ```
     http://localhost:3000
     http://127.0.0.1:3000
     ```
   - **URIs de redirección autorizadas**:
     ```
     http://localhost:3000
     http://127.0.0.1:3000
     http://localhost:3000/
     http://127.0.0.1:3000/
     ```

**⚠️ IMPORTANTE**: 
- NO uses `https://` para localhost
- AGREGA tanto con como sin `/` al final
- Los orígenes deben coincidir EXACTAMENTE
- **URIs de redirección** son CRÍTICOS para OAuth 2.0 directo
   - **Nombre**: "MiPlataforma Web Client"
   - **Orígenes autorizados de JavaScript**:
     - `http://localhost:3000`
     - `http://127.0.0.1:3000`
   - **URIs de redirección autorizadas**:
     - `http://localhost:3000`

### 5. Copiar Client ID

1. **Copia** el Client ID generado (termina en `.apps.googleusercontent.com`)
2. **Guárdalo** - lo necesitarás en el siguiente paso

### 6. Configurar Variables de Entorno

1. **Copia** el archivo de ejemplo:
   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

2. **Edita** `frontend/.env.local`:
   ```bash
   VITE_GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
   ```

3. **Reemplaza** `tu-client-id-aqui` con tu Client ID real

### 7. Reiniciar Servidor

```bash
# Desde la raíz del proyecto
npm run dev:frontend
```

### 8. Probar Funcionalidad

1. Ve a: http://localhost:3000
2. Haz clic en **"Registrarse con Google"**
3. Debería aparecer el popup de Google para autenticación

---

## 🛠️ Troubleshooting

### Error: "Invalid Client ID"
- ✅ Verifica que el Client ID esté correcto en `.env.local`
- ✅ Asegúrate de que el dominio esté autorizado en Google Console

### Error: "Popup blocked"
- ✅ Permite popups en tu navegador
- ✅ Prueba en modo incógnito

### El botón no aparece
- ✅ Verifica que el script de Google se cargue (Network tab en DevTools)
- ✅ Revisa errores en la consola del navegador

### "Client ID not configured"
- ✅ Verifica que `VITE_GOOGLE_CLIENT_ID` esté configurado
- ✅ Reinicia el servidor después de cambiar variables de entorno

---

## 🔒 Seguridad

### Variables de Entorno
- ✅ **Nunca** hagas commit de `.env.local`
- ✅ El Client ID puede ser público (por diseño de Google)
- ✅ Para producción, configura dominios reales en Google Console

### 🌐 Configuración de Dominios de Producción

#### Paso 1: Google Cloud Console
1. Ve a **Google Cloud Console** → **"APIs y servicios"** → **"Credenciales"**
2. Haz clic en tu **Client ID OAuth 2.0**
3. En **"Orígenes autorizados de JavaScript"**, agrega:
   ```
   https://tudominio.com
   https://www.tudominio.com
   https://app.tudominio.com (si usas subdominio)
   ```
4. En **"URIs de redirección autorizadas"**, agrega:
   ```
   https://tudominio.com
   https://www.tudominio.com
   ```
5. **Guarda** los cambios

#### Paso 2: Variables de Entorno
- **Desarrollo**: `frontend/.env.local`
- **Producción**: Configura en tu servidor/hosting:
  ```bash
  VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
  ```

#### Paso 3: Deploy y Pruebas
1. Despliega tu aplicación
2. Verifica que el dominio coincida exactamente
3. Prueba el flujo OAuth en producción

---

## ✅ Estado Actual

### ✅ Implementado:
- Google Identity Services integrado
- AuthContext con manejo de estado
- Botón Google funcional con fallback
- Dashboard post-registro
- Persistencia en localStorage
- Validación de tokens JWT

### 🔄 Flujo Completo:
1. Usuario hace clic en "Registrarse con Google"
2. Google popup aparece para autenticación
3. Usuario autoriza la aplicación
4. Token JWT se recibe y decodifica
5. Usuario se guarda en contexto y localStorage
6. Redirige automáticamente al Dashboard

---

**Archivo**: `GOOGLE_OAUTH_SETUP.md`  
**Fecha**: 2 de octubre de 2025  
**Estado**: ✅ Completamente funcional (requiere configuración de Client ID)