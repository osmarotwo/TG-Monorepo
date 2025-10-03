# 🔧 Solución de Emergencia: Nuevo Client ID

Si sigues teniendo problemas CORS, crea un **nuevo Client ID**:

## Pasos:

1. **Google Cloud Console** → **"APIs y servicios"** → **"Credenciales"**

2. **"Crear credenciales"** → **"ID de cliente OAuth"**

3. **Configuración exacta**:
   ```
   Tipo: Aplicación web
   Nombre: LocalTest OAuth Client
   
   Orígenes autorizados de JavaScript:
   http://localhost:3000
   
   URIs de redirección autorizadas:
   http://localhost:3000
   ```

4. **Copia el nuevo Client ID**

5. **Actualiza `.env.local`**:
   ```bash
   VITE_GOOGLE_CLIENT_ID=tu-nuevo-client-id-aqui.apps.googleusercontent.com
   ```

6. **Reinicia el servidor**

## ¿Por qué puede funcionar?
- Client ID limpio sin configuraciones conflictivas
- Configuración mínima y precisa
- Sin configuraciones legacy que puedan causar CORS

---
Fecha: 3 de octubre de 2025