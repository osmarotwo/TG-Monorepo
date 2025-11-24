# Configuración de Google OAuth para Amplify

## URLs actuales de la aplicación

- **App ID**: `dgcndz0zrpvos`
- **Branch**: `feature/frontend-user`
- **URL completa**: `https://feature-frontend-user.dgcndz0zrpvos.amplifyapp.com`

## Configuración requerida en Google Cloud Console

### 1. Ir a Google Cloud Console
https://console.cloud.google.com/apis/credentials

### 2. Seleccionar el proyecto y el OAuth 2.0 Client ID
Client ID: `816694945748-4mcep0bf0abnjoa36bta8btqlevgonft.apps.googleusercontent.com`

### 3. Configurar "Orígenes de JavaScript autorizados"

Agregar **EXACTAMENTE** estas URLs (copiar y pegar):

```
https://feature-frontend-user.dgcndz0zrpvos.amplifyapp.com
```

⚠️ **IMPORTANTE**: 
- NO incluir `/` al final
- NO incluir paths como `/auth/google`
- Debe ser HTTPS

### 4. Configurar "URIs de redireccionamiento autorizados"

Agregar **EXACTAMENTE** estas URLs (copiar y pegar):

```
https://feature-frontend-user.dgcndz0zrpvos.amplifyapp.com/auth/google
```

⚠️ **IMPORTANTE**: 
- SÍ incluir el path `/auth/google`
- Debe coincidir exactamente con el redirect_uri usado en el código
- Debe ser HTTPS

### 5. También agregar para localhost (desarrollo local)

**Orígenes autorizados**:
```
http://localhost:3000
```

**URIs de redirección**:
```
http://localhost:3000/auth/google
```

### 6. Guardar los cambios

Clic en "Guardar" en la parte inferior de la página.

## Verificación

Después de guardar, Google mostrará algo como:

```
Orígenes de JavaScript autorizados (2):
- http://localhost:3000
- https://feature-frontend-user.dgcndz0zrpvos.amplifyapp.com

URIs de redireccionamiento autorizados (2):
- http://localhost:3000/auth/google
- https://feature-frontend-user.dgcndz0zrpvos.amplifyapp.com/auth/google
```

## Solución de problemas

### Error: "Error en la autorización"
- Verifica que las URLs estén escritas EXACTAMENTE como se muestra arriba
- No debe haber espacios extras
- Verifica que sea HTTPS (no HTTP)
- Espera 1-2 minutos después de guardar para que los cambios se propaguen

### Error: "redirect_uri_mismatch"
- La URL en Google Cloud Console NO coincide con la usada en el código
- Verifica que el path `/auth/google` esté incluido en los URIs de redirección
- Verifica que NO esté incluido en los orígenes autorizados

### Error: "access_denied"
- El usuario canceló la autenticación
- O las credenciales (Client ID/Secret) son incorrectas
