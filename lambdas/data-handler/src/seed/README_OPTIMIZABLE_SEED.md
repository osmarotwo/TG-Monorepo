# Seed de Ruta Optimizable 🚗

## Descripción

Este seed crea una ruta **intencionalmente INEFICIENTE** con 6 citas para testing del algoritmo de optimización de rutas.

## ¿Qué hace?

1. ✅ **Elimina** todas las citas existentes del usuario de prueba
2. ✅ **Crea** 6 citas nuevas en orden ineficiente (cruzando toda la ciudad)

## Ruta Creada (INEFICIENTE)

```
1. Chapinero (Centro)         8:00 AM  - Corte y Peinado (60 min)
      ↓ 23 km (~40 min) ⚠️ SALTO AL NORTE
2. Chía (Norte)               10:00 AM - Tratamiento Keratina (90 min)
      ↓ 35 km (~55 min) ⚠️ CRUCE COMPLETO DE CIUDAD
3. Kennedy (Sur-Occidente)    12:30 PM - Manicure Express (45 min)
      ↓ 22 km (~45 min) ⚠️ REGRESO AL NORTE
4. Usaquén (Norte)            2:30 PM  - Color y Highlights (60 min)
      ↓ 8 km (~20 min) ⚠️ MOVIMIENTO LATERAL
5. Suba (Noroccidente)        4:00 PM  - Pedicure Express (30 min)
      ↓ 12 km (~25 min)
6. Chapinero (Centro)         5:30 PM  - Masaje Capilar (45 min)

Total: ~100 km, ~3 horas de viaje
```

## Ruta Óptima Esperada (después de optimización)

```
1. Chapinero (Centro)         8:00 AM
      ↓ 6 km (~15 min) ✅
2. Usaquén (Norte)            9:00 AM
      ↓ 18 km (~30 min) ✅
3. Chía (Norte)               10:30 AM
      ↓ 15 km (~30 min) ✅
4. Suba (Noroccidente)        1:00 PM
      ↓ 20 km (~40 min) ✅
5. Kennedy (Sur-Occidente)    2:00 PM
      ↓ 12 km (~25 min) ✅
6. Chapinero (Centro)         3:30 PM

Total: ~71 km, ~2 horas de viaje
```

## Mejora Esperada

- ⏱️ **Tiempo:** ~1 hora ahorrada (33% mejora)
- 📏 **Distancia:** ~29 km ahorrados (29% mejora)
- ✅ **Eficiencia:** Ruta circular con mínimo backtracking

## Cómo Ejecutar

### Opción 1: Usando npm script (Recomendado)

```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/data-handler
npm run build
npm run seed:optimizable
```

### Opción 2: Ejecución manual

```bash
cd /Users/oscarkof/repos/TG-OM/lambdas/data-handler
npm run build
AWS_REGION=us-east-1 APPOINTMENTS_TABLE=Appointments node dist/seed/seed-optimizable-route.js
```

## Variables de Entorno

- `AWS_REGION`: Región de AWS (default: `us-east-1`)
- `APPOINTMENTS_TABLE`: Nombre de la tabla DynamoDB (default: `Appointments`)

## Testing

Después de ejecutar el seed:

1. **Iniciar frontend:**
   ```bash
   cd /Users/oscarkof/repos/TG-OM/nextjs-app
   npm run dev
   ```

2. **Navegar al dashboard:**
   ```
   http://localhost:3000/dashboard
   ```

3. **Verificar:**
   - ✅ RouteOptimizationCard aparece automáticamente
   - ✅ Muestra comparación antes/después
   - ✅ Savings: ~1 hora, ~29 km
   - ✅ Orden optimizado coincide con el esperado

## Ubicaciones Usadas

| ID | Nombre | Zona | Coordenadas |
|---|---|---|---|
| LOC001 | Salón Aurora - Chapinero | Centro | 4.653, -74.057 |
| LOC002 | Salón Aurora - Chía | Norte (fuera) | 4.862, -74.055 |
| LOC003 | Salón Aurora - Usaquén | Norte | 4.701, -74.033 |
| LOC004 | Salón Aurora - Suba | Noroccidente | 4.740, -74.091 |
| LOC005 | Salón Aurora - Kennedy | Sur-Occidente | 4.635, -74.155 |

## Usuario de Prueba

- **ID:** `5fabb21e-3722-43ab-b491-5e53a45f9616`
- **Email:** `osmarotwo@gmail.com`
- **Nombre:** Valerie Sofia Martinez

## Notas

- Las citas se crean para **mañana** (día siguiente a la ejecución)
- Todas las citas están en status `confirmed`
- Duraciones realistas: 30-120 minutos
- Horario: 8:00 AM - 6:15 PM

## Troubleshooting

### Error: Cannot find module

**Solución:**
```bash
npm run build
```

### Error: AccessDeniedException

**Solución:** Verificar credenciales AWS:
```bash
aws sts get-caller-identity
```

### No aparece RouteOptimizationCard en dashboard

**Posibles causas:**
1. Mejora < 10% (poco probable con esta ruta)
2. Error en Google Maps API
3. userLocation no detectada

**Solución:**
- Check console del navegador para errores
- Verificar permisos de geolocation
- Check DevTools → Network para llamadas API

## Archivos Relacionados

- **Seed:** `/lambdas/data-handler/src/seed/seed-optimizable-route.ts`
- **Optimización:** `/nextjs-app/src/services/optimization/`
- **UI Component:** `/nextjs-app/src/components/dashboard/RouteOptimizationCard.tsx`
- **Hook:** `/nextjs-app/src/hooks/useRouteOptimization.ts`
- **Documentación:** `/docs/ROUTE_OPTIMIZATION_IMPLEMENTATION.md`

## Próximos Pasos

1. ✅ Ejecutar este seed
2. ⏭️ Iniciar frontend y verificar que aparece la sugerencia
3. 🧪 Probar botones Apply/Dismiss
4. 📊 Verificar métricas de mejora
5. 🔍 Check cache en localStorage

---

**Creado:** 21 de octubre de 2025  
**Autor:** GitHub Copilot  
**Versión:** 1.0
