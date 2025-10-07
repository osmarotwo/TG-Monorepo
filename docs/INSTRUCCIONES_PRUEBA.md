## 🧪 INSTRUCCIONES DE PRUEBA - Onboarding

### 🚀 **Para probar el flujo completo:**

1. **Abre el navegador** en: `http://localhost:3000`

2. **Limpia datos anteriores** (para simular usuario nuevo):
   - Abre **DevTools** (F12)
   - Ve a **Application > Storage**
   - Haz clic en **"Clear storage"** o elimina `auth_user` de localStorage

3. **Inicia el flujo**:
   - Haz clic en **"Continuar con Google"**
   - Autoriza con Google
   - **¡Automáticamente aparecerá el onboarding!**

### 📋 **Lo que deberías ver:**

#### **Paso 1: Información Básica**
- ✅ Formulario con progreso "Paso 1 de 2"
- ✅ Nombre completo (pre-rellenado con tu nombre de Google)
- ✅ Email (pre-rellenado con tu email de Google)
- ✅ Botón "Siguiente" para continuar

#### **Paso 2: Información Personal**  
- ✅ Formulario con progreso "Paso 2 de 2"
- ✅ Campo teléfono (vacío para completar)
- ✅ Campo fecha de nacimiento (selector de fecha)
- ✅ Botones "Anterior" y "Completar perfil"

#### **Resultado Final**
- ✅ Redirección automática al Dashboard
- ✅ Perfil completado (no vuelve a aparecer el onboarding)
- ✅ Acceso a "Ver Perfil Completo" con todos los datos

### 🔍 **Validaciones que puedes probar:**
- ❌ Dejar campos vacíos → Mensajes de error
- ❌ Email inválido → Error de formato
- ❌ Teléfono muy corto → Error de validación
- ❌ Fecha de nacimiento de menor de 13 años → Error de edad

---
**¡Está listo para probar!** 🎯