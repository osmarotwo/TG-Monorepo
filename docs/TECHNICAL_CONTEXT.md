# 🔧 Context Técnico - TG-Monorepo

## 📊 Estado de la Base de Código

### Commits y Branches
- **Branch actual**: `feature/frontend-user`
- **Último commit significativo**: Implementación pantalla de registro
- **Cambios pendientes**: ~15 archivos modificados/creados

### Estructura de Dependencias
```javascript
// frontend/package.json - Dependencias clave
{
  "react": "^18.3.1",
  "vite": "^5.4.20", 
  "typescript": "~5.6.2",
  "tailwindcss": "^3.4.0",
  "@types/react": "^18.3.12"
}
```

---

## 🏗️ Arquitectura de Componentes

### Jerarquía Actual
```
App.tsx
├── ThemeProvider (Context)
│   ├── ThemeToggle (Fixed position)
│   └── RegistrationForm
│       ├── Logo (Dynamic)
│       ├── Card (Glassmorphism container)
│       ├── Input × 3 (Name, Email, Password)
│       ├── Button (Primary submit)
│       └── Button (Google OAuth)
```

### Props Interfaces
```typescript
// Interfaces principales definidas:
interface BrandConfig {...}
interface ButtonProps {...}
interface InputProps {...}
interface CardProps {...}
interface IconProps {...}
```

---

## 🎨 Sistema de Estilos

### Tailwind Classes Generadas
```css
/* Colores dinámicos desde brandConfig */
.bg-primary          /* #13a4ec */
.text-primary        /* #13a4ec */
.border-primary      /* #13a4ec */
.ring-primary        /* Focus states */

/* Fondos por tema */
.bg-background-light /* #f6f7f8 */
.bg-background-dark  /* #101c22 */
.bg-card-light       /* rgba(255,255,255,0.5) */
.bg-card-dark        /* rgba(16,28,34,0.5) */
```

### CSS Custom Properties
```css
/* Generadas automáticamente desde brandConfig */
--primary-color: #13a4ec;
--primary-rgb: 19, 164, 236;
```

---

## 🔄 Flujos de Estado

### Theme Management
```typescript
// Context flow:
localStorage → ThemeContext → CSS classes → DOM
// Estados: 'light' | 'dark' | 'system'
```

### Form Validation
```typescript
// Validation flow:
onChange → validateField → setError → UI update
onSubmit → validateForm → API call → success/error
```

### Brand Configuration
```typescript
// Config flow:
brandConfig.ts → useBrandConfig() → Component props → Render
```

---

## 🛠️ Herramientas de Desarrollo

### Vite Configuration
```javascript
// vite.config.ts - Configuración actual
{
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: { port: 3000 }
}
```

### ESLint Rules Activas
- React hooks rules
- TypeScript strict mode
- Unused imports detection

### PostCSS Pipeline
```javascript
// postcss.config.js
{
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

---

## 📡 Integraciones Configuradas

### GitHub CLI
```bash
# Estado actual:
gh auth status
# ✓ Logged in as osmarotwo
# ✓ Git operations: HTTPS
# ✓ Token scopes: repo, workflow
```

### Git Configuration
```bash
user.name=Oscar Martínez
user.email=osmarotwo@gmail.com
remote.origin.url=https://github.com/osmarotwo/TG-Monorepo.git
```

---

## 🧪 Testing Setup

### Jest Configuration (Preparado)
```javascript
// Archivos de test existentes:
infrastructure/test/api-lambda-stack.test.ts
// Frontend testing: Pendiente configuración
```

---

## 🔍 Debugging Information

### Console Errors to Watch
```javascript
// Errores comunes que pueden aparecer:
// 1. "Icon [name] not found" - Icon.tsx
// 2. Theme context undefined - ThemeProvider missing
// 3. brandConfig import errors - Path resolution
```

### Development URLs
```
Frontend Dev: http://localhost:3000
Browser DevTools: F12 (Console, Network, Elements)
React DevTools: Extension recomendada
```

---

## 📈 Métricas de Performance

### Bundle Size (Estimado)
```
React + Dependencies: ~150KB
Tailwind CSS: ~50KB (purged)
Custom Components: ~20KB
Total estimate: ~220KB gzipped
```

### Lighthouse Targets
- Performance: >90
- Accessibility: >95  
- Best Practices: >90
- SEO: >90

---

## 🔐 Security Considerations

### Environment Variables
```bash
# .env.local (frontend)
VITE_API_URL=...  # Para conexión con Lambda
# Nota: Todas las VITE_ vars son públicas
```

### Input Validation
```typescript
// Implementado en frontend:
- Email regex validation
- Password complexity requirements  
- XSS prevention via React (default)
- CSRF: Pendiente implementación backend
```

---

## 🚀 Deployment Status

### Frontend (Local)
- ✅ Dev server functional
- ✅ Hot reload working
- ✅ Build command tested
- ❌ Production build not tested
- ❌ Amplify deployment not configured

### Infrastructure (AWS)
- ✅ CDK code exists
- ❌ Not deployed to AWS
- ❌ Environment variables not set

---

## 🔧 Quick Commands Reference

### Development
```bash
# Start frontend dev server
cd frontend && npm run dev

# Build for production  
cd frontend && npm run build

# Install all dependencies
npm run install:all

# Deploy infrastructure
npm run deploy:infrastructure
```

### Git Workflow
```bash
# Add changes
git add .

# Commit with message
git commit -m "feat: description"

# Push to feature branch
git push origin feature/frontend-user
```

---

## 📋 Code Quality Checklist

### Antes de nuevos commits:
- [ ] ESLint errors fixed
- [ ] TypeScript errors resolved
- [ ] Console.log statements removed
- [ ] Responsive design tested
- [ ] Dark/light theme tested
- [ ] brandConfig personalization tested

### Antes de merge:
- [ ] Code reviewed
- [ ] Tests passing (cuando se implementen)
- [ ] Build successful
- [ ] Memory file updated
- [ ] README updated if needed

---

## 🎯 Próxima Sesión - Quick Start

### Para continuar eficientemente:
1. **Leer** PROJECT_MEMORY.md (overview)
2. **Leer** este archivo (detalles técnicos)
3. **Verificar** que dev server funciona: `npm run dev:frontend`
4. **Revisar** último commit: `git log --oneline -5`
5. **Continuar** desde donde se quedó

### Si aparecen errores:
1. **Check** PROJECT_MEMORY.md troubleshooting
2. **Verify** dependencies: `npm install`
3. **Clear cache**: `rm -rf node_modules .next .vite`
4. **Reinstall**: `npm run install:all`

---

**Archivo creado**: 2 de octubre de 2025  
**Propósito**: Contexto técnico detallado para continuidad  
**Uso**: Referencia rápida para debugging y desarrollo