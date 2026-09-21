# 🧹 FASE 7 EJECUCIÓN - Deuda Técnica Post-PROD

**Duración**: 2-3 horas  
**Criticidad**: P4 (Post-PROD, no bloqueador)  
**Estado**: ⏳ PENDIENTE - Después de FASE 6 PROD deploy  
**Ejecutor**: ChatGPT (opcional)  
**Auditor**: Claude Code  
**Parallelizable**: Independiente (puede hacerse en paralelo con bugs de PROD)

---

## 📊 RESUMEN

FASE 7 limpia deuda técnica acumulada de desarrollo anterior a FASE 0:
- 40+ warnings de `@typescript-eslint/no-unused-vars`
- 15+ errores de `any` types sin especificar
- 5-10 warnings menores de ESLint
- Screen reader testing (manual)

**Items**: 4 (lint cleanup, types, testing)  
**Bloqueador para PROD**: NO (completamente deferido)  
**Impacto**: Mejor mantenibilidad, menos ruido en CI/CD  

---

## ✅ ITEM 1: Eliminar Unused Imports/Variables (1 hora)

**Objetivo**: Limpiar `@typescript-eslint/no-unused-vars` warnings

**Comando para identificar**:
```bash
npm run lint 2>&1 | grep "no-unused-vars"
```

**Categorías**:

### 1.1 Imports no usados
```typescript
// ANTES:
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';  // No se usa
import { useState } from 'react';

// DESPUÉS:
import { Button } from '@/components/ui/button';
import { useState } from 'react';
```

### 1.2 Variables locales no usadas
```typescript
// ANTES:
const unused = await fetchData();
const data = processData();

// DESPUÉS:
const data = processData();
```

### 1.3 Parámetros no usados (dejar con `_` prefix)
```typescript
// ANTES:
function handler(req, res) {
  return 'ok';
}

// DESPUÉS:
function handler(_req, _res) {
  return 'ok';
}
```

**Proceso**:
1. Ejecutar `npm run lint` → guardar output
2. Para cada warning `no-unused-vars`:
   - Identificar línea exacta
   - Verificar si realmente no se usa (grep en archivo)
   - Eliminar import/variable O prefixar con `_`
3. Re-ejecutar `npm run lint`
4. Repeat hasta 0 warnings

**Validación**:
```bash
npm run lint 2>&1 | grep "no-unused-vars" | wc -l
# Esperado: 0
```

**Reporta**:
- ✅ X warnings de no-unused-vars eliminados
- ✅ Imports limpios
- ✅ Variables prefixadas con `_` (si necesarias)
- ❌ [Describe si algo falla]

---

## ✅ ITEM 2: Reemplazar `any` con Tipos Específicos (1 hora)

**Objetivo**: Eliminar `@typescript-eslint/no-explicit-any` warnings

**Comando para identificar**:
```bash
npm run lint 2>&1 | grep "no-explicit-any"
```

**Patrones comunes**:

### 2.1 `any` en parámetros
```typescript
// ANTES:
export async function POST(request: any) {
  const body = await request.json();
}

// DESPUÉS:
export async function POST(request: NextRequest) {
  const body = await request.json();
}
```

### 2.2 `any` en arrays/objects
```typescript
// ANTES:
const items: any[] = [];
const config: any = { };

// DESPUÉS:
const items: Vacante[] = [];
const config: AppConfig = { };
```

### 2.3 `any` en callbacks
```typescript
// ANTES:
vacantes.filter((v: any) => v.estado === 'activa')

// DESPUÉS:
vacantes.filter((v: Vacante) => v.estado === 'activa')
```

**Proceso**:
1. Ejecutar `npm run lint` → guardar output
2. Para cada warning `no-explicit-any`:
   - Identificar línea y contexto
   - Determinar tipo correcto (check types.ts, interfaces.ts)
   - Reemplazar `any` con tipo específico
3. Re-ejecutar `npm run lint`
4. Repeat hasta 0 warnings

**Validación**:
```bash
npm run lint 2>&1 | grep "no-explicit-any" | wc -l
# Esperado: 0
```

**Reporta**:
- ✅ X warnings de no-explicit-any eliminados
- ✅ Tipos específicos usados
- ✅ Imports de tipos actualizados
- ❌ [Describe si algo falla]

---

## ✅ ITEM 3: ESLint Warnings Menores (30 min)

**Objetivo**: Limpiar warnings menores (prefer-const, etc.)

**Comando**:
```bash
npm run lint 2>&1 | head -50
```

**Patrones**:

### 3.1 Usar const en lugar de let
```typescript
// ANTES:
let data = fetchData();

// DESPUÉS:
const data = fetchData();
```

### 3.2 Remover console.log de PROD
```typescript
// ANTES:
console.log('[DEBUG]', data);

// DESPUÉS:
// Remover completamente si es solo debug
// O usar logger en producción:
logger.debug('[DEBUG]', data);
```

### 3.3 Simplificar condicionales
```typescript
// ANTES:
if (error) {
  return false;
} else {
  return true;
}

// DESPUÉS:
return !error;
```

**Validación**:
```bash
npm run lint 2>&1 | grep -v "no-unused-vars\|no-explicit-any" | grep "warning" | wc -l
# Esperado: < 5
```

**Reporta**:
- ✅ X warnings menores limpiados
- ✅ ESLint output limpio
- ❌ [Describe si algo falla]

---

## ✅ ITEM 4: Screen Reader Testing (30 min) - MANUAL

**Objetivo**: Validar accesibilidad con screen reader real

**Herramientas**:
- NVDA (Windows, gratis)
- VoiceOver (Mac, built-in)
- JAWS (Windows, pago)

**Requisitos**:
- Navegador + dev server corriendo
- Screen reader instalado
- 30 min para testing manual

**Flujos a validar**:

### Test 1: Navegación principal
```
1. Abrir /auth/login
2. NVDA lee: "Email input", "Password input", "Sign in button"
3. Tab key navega entre campos
4. Enter submit
5. Dashboard carga, NVDA anuncia "Bienvenido"
```

### Test 2: Vacantes listing
```
1. Ir a /dashboard
2. NVDA lee: "Mi Vacantes", "Crear Nueva Vacante"
3. Listar vacantes:
   - "Vacante titulo", "estado", "Ver →"
   - Tab navega entre cards
4. Click en vacante → abre detalles
```

### Test 3: Postulación
```
1. Ir a /postular/[slug]
2. NVDA lee: "Términos de privacidad" modal
3. Checkbox: "Acepto términos"
4. Button: "Continuar"
5. Form fields leídos correctamente
6. Submit → "Postulación enviada"
```

### Test 4: Errores y estados
```
1. Login con email inválido
2. NVDA anuncia error: "Email o contraseña incorrectos"
3. Cierre vacante
4. NVDA anuncia: "Vacante cerrada"
5. Loading states: "Cargando..."
```

**Checklist**:
```
□ Botones tienen aria-label o texto visible
□ Inputs tienen labels asociados
□ Modals tienen role="dialog" + aria-labelledby
□ Errores anunciados con ARIA live regions
□ Navegar con Tab es posible (no trapped focus)
□ Heading hierarchy correcto (h1, h2, h3)
□ Imágenes tienen alt text (o aria-hidden si decorativas)
□ Links tienen destino claro (no "click here")
□ Color no es única forma de comunicar (también estado, icono, texto)
□ Contraste: WCAG AA mínimo (4.5:1 normal text)
```

**Reporta**:
- ✅ Flujo de login: accesible
- ✅ Flujo de vacantes: accesible
- ✅ Flujo de postulación: accesible
- ⚠️ [Si hay problemas: describe y cómo arreglarlo]

**Nota**: Si no tienes NVDA/screen reader instalado, saltar este test y dejar para post-PROD. No es bloqueador.

---

## 🎯 REPORTE FINAL FASE 7

```
FASE 7 COMPLETADA

ITEM 1: Unused vars/imports limpios      [✅ / ❌]
ITEM 2: `any` types reemplazados         [✅ / ❌]
ITEM 3: ESLint warnings menores          [✅ / ❌]
ITEM 4: Screen reader testing            [✅ / ⚠️ DEFERRED]

RESUMEN: [✅ TODOS COMPLETOS] o [⚠️ PARCIAL: ___]

Validaciones:
✅ npm run lint: < 5 warnings (deuda técnica aceptable)
✅ npm run build: exitoso
✅ npm test: todos pasan
✅ npm audit: 0 vulnerabilidades
✅ Código más mantenible

RESULTADO: 🎉 PROD LIMPIO Y MANTENIBLE
```

---

## 📋 CRITERIOS DE ÉXITO

FASE 7 se considera **COMPLETADA** si:

```
□ no-unused-vars: 0 warnings
□ no-explicit-any: 0 warnings
□ ESLint warnings: < 5 (aceptable para deuda técnica)
□ npm run lint: 0 errores críticos
□ npm run build: exitoso
□ npm test: todos pasan
□ Screen reader: accesible (o deferred si no hay herramienta)

RESULTADO: ✅ CÓDIGO PRODUCCIÓN LIMPIO
```

---

## 🚀 PRÓXIMOS PASOS (POST-FASE 7)

Si todo está limpio:
1. ✅ Pushear commits de FASE 7
2. ✅ Documentar en CHANGELOG
3. ✅ Marcar PROD como LISTO
4. ✅ Considerar CI/CD automático (ESLint enforcement)

Si hay problemas en PROD:
1. 🐛 Bug fix en rama separada
2. 🔄 Cherry-pick a main
3. 📊 Update FASE 7 si hay patrones nuevos

---

**Documento**: FASE 7 Ejecución  
**Duración**: 2-3 horas  
**Bloqueador para PROD**: NO  
**Estado**: 🚀 LISTO PARA EJECUTAR (después de FASE 6 deploy)
