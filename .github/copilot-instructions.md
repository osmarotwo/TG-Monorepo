# GitHub Copilot Instructions - TG-OM Project

## ⚠️ REGLA CRÍTICA DE DEPLOYMENT

**SIEMPRE USA AWS CDK PARA DESPLIEGUES**
- ❌ **NUNCA** usar `aws lambda update-function-code` directamente
- ❌ **NUNCA** hacer deploy manual de Lambdas o recursos AWS
- ✅ **SIEMPRE** usar `cdk deploy` desde la carpeta `/infrastructure`
- ✅ **SIEMPRE** modificar los stacks de CDK en TypeScript
- ✅ Comandos válidos:
  - `cd infrastructure && cdk deploy DataStack`
  - `cd infrastructure && cdk deploy AuthStack`
  - `cd infrastructure && cdk deploy --all`

---

## 🎨 Sistema de Diseño Clyok

**IMPORTANTE**: Este proyecto usa el sistema de diseño Clyok. SIEMPRE consulta y respeta las especificaciones en:
📄 `/docs/CLYOK_DESIGN_SYSTEM.md`

### Reglas Críticas de UI:

1. **⚠️ LanguageSelector (OBLIGATORIO)**:
   - TODAS las páginas deben incluir LanguageSelector
   - **Con `<Navigation>`**: Ya está integrado, NO agregar duplicado
   - **Sin `<Navigation>`**: Agregar en posición fija `top-4 right-4 z-50`
   - Importar de: `/nextjs-app/src/components/LanguageSelector.tsx`
   - Páginas con navbar (dashboard, services, appointments, locations): Usa Navigation
   - Páginas sin navbar (login, register, onboarding): Posición fija

2. **Colores**:
   - Color primario: `#13a4ec` (Clyok blue)
   - Fondo de página: `bg-[#f6f7f8]`
   - Tarjetas: `bg-white/50 backdrop-blur-sm`
   - **NO usar dark mode** (sin clases `dark:`)

3. **Logo**:
   - Usar componente `<Logo>` de `/nextjs-app/src/components/Logo.tsx`
   - Siempre centrado: `<div className="flex justify-center mb-4"><Logo size="lg" /></div>`
   - NO usar `<LogoWithText>` en headers

4. **Inputs**:
   - Background: `bg-[#f6f7f8]`
   - Focus: `focus:ring-[#13a4ec]`
   - Border: `border-gray-300`

5. **Botones primarios**:
   - `bg-[#13a4ec] hover:bg-[#0f8fcd] text-white`

6. **Links**:
   - `text-[#13a4ec] hover:text-[#0f8fcd]`

### Antes de crear/modificar UI:
1. ✅ Lee `/docs/CLYOK_DESIGN_SYSTEM.md`
2. ✅ Consulta páginas de referencia: `/auth/login`, `/auth/register`, `/dashboard`
3. ✅ Verifica checklist del sistema de diseño
4. ✅ No uses gradientes ni dark mode

---

## 📋 Project Checklist

- [x] Verify that the copilot-instructions.md file in the .github directory is created.

- [x] Clarify Project Requirements
	<!-- AWS CDK TypeScript project with API Gateway and Lambda function specified -->

- [x] Scaffold the Project
	<!-- Created AWS CDK TypeScript project structure with Lambda and API Gateway -->

- [x] Customize the Project
	<!-- Implemented Lambda handler, API Gateway configuration, and CDK stack -->

- [x] Install Required Extensions
	<!-- No specific extensions required for CDK project -->

- [x] Compile the Project
	<!-- Installed CDK dependencies and compiled TypeScript successfully -->

- [x] Create and Run Task
	<!-- Configured npm scripts for CDK deployment and management -->

- [x] Launch the Project
	<!-- Project ready for deployment to AWS -->

- [x] Ensure Documentation is Complete
	<!-- Created comprehensive README.md with CDK project documentation -->

- [x] Implement Clyok Design System
	<!-- Sistema de diseño implementado en todas las páginas: login, register, forgot-password, reset-password, onboarding, dashboard -->
	<!-- Documentación completa en /docs/CLYOK_DESIGN_SYSTEM.md -->
