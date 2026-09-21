# 🧹 FASE 7 - Prompt para ChatGPT

**Documento**: Instrucciones para ejecutar FASE 7 (Deuda Técnica Post-PROD)  
**Duración**: 2-3 horas  
**Criticidad**: P4 (Post-PROD cleanup)  
**Estado**: ⏳ LISTO PARA EJECUTAR  

---

## 📋 RESUMEN EJECUTIVO

FASE 7 limpia deuda técnica acumulada. Después de desplegar FASE 6 en PROD, ejecuta estas tareas:

1. ✅ Eliminar 40+ warnings `no-unused-vars`
2. ✅ Reemplazar 15+ `any` types con tipos específicos
3. ✅ Limpiar 5+ warnings menores de ESLint
4. ⚠️ Screen reader testing (manual, si tienes NVDA/VoiceOver)

---

## 🎯 ITEM 1: Limpiar Unused Imports/Variables

### Paso 1: Identificar warnings

```bash
npm run lint 2>&1 | grep "no-unused-vars" > lint-warnings.txt
# Ver archivo para lista completa
```

### Paso 2: Para cada línea en lint-warnings.txt:

**Patrón de warning**:
```
app/path/file.tsx:5:8 warning 'Button' is defined but never used
```

**Acción**:
1. Abre `app/path/file.tsx`
2. Línea 5: Busca `import { Button }`
3. Verifica con Ctrl+F/Cmd+F si `Button` se usa en el archivo
4. Si NO se usa → Elimina el import
5. Si se usa pero linter dice lo contrario → Prefija con `_`: `_Button`

### Paso 3: Validar

```bash
npm run lint 2>&1 | grep "no-unused-vars" | wc -l
# Esperado: 0
```

**Reporta al auditor**:
```
ITEM 1: Unused vars/imports limpios
- X warnings eliminados
- Imports limpiados
- Variables prefixadas con _ donde necesario
```

---

## 🎯 ITEM 2: Reemplazar `any` Types

### Paso 1: Identificar errors

```bash
npm run lint 2>&1 | grep "no-explicit-any" > lint-any.txt
```

### Paso 2: Para cada línea:

**Patrón de error**:
```
app/api/auth/login/route.ts:47:19 error Unexpected any. Specify a different type
```

**Acción**:
1. Abre `app/api/auth/login/route.ts`
2. Línea 47, columna 19
3. Identifica el contexto:
   ```typescript
   // Ejemplo
   const handleSubmit = async (e: any) => {  // ← AQUÍ
   ```
4. Determina tipo correcto:
   - Si es evento React: `React.FormEvent`
   - Si es response: `NextResponse`
   - Si es request: `NextRequest`
   - Si es JSON: Define interface específica
5. Reemplaza `any` con tipo correcto
6. Agrega import si es necesario

### Ejemplos comunes:

```typescript
// ANTES
const handleSubmit = async (e: any) => { }
// DESPUÉS
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { }

// ANTES
const data: any = await fetch(...).json();
// DESPUÉS
interface ResponseData { ... }
const data: ResponseData = await fetch(...).json();

// ANTES
export async function POST(request: any) { }
// DESPUÉS
export async function POST(request: NextRequest) { }
```

### Paso 3: Validar

```bash
npm run lint 2>&1 | grep "no-explicit-any" | wc -l
# Esperado: 0
```

**Reporta al auditor**:
```
ITEM 2: `any` types reemplazados
- X errors de no-explicit-any eliminados
- Tipos específicos usados
- Imports de tipos actualizados
```

---

## 🎯 ITEM 3: ESLint Minor Warnings

### Paso 1: Revisar warnings menores

```bash
npm run lint 2>&1 | grep -v "no-unused-vars\|no-explicit-any" | head -50
```

### Paso 2: Busca patrones:

**prefer-const**: `let` sin reasignar
```typescript
// ANTES
let data = fetchData();

// DESPUÉS
const data = fetchData();
```

**console.log en PROD**:
```typescript
// ANTES
console.log('[DEBUG]', data);

// DESPUÉS
// Remover si es solo debug, o usar logger en PROD
```

**Condicionales redundantes**:
```typescript
// ANTES
if (error) {
  return false;
} else {
  return true;
}

// DESPUÉS
return !error;
```

### Paso 3: Validar

```bash
npm run lint 2>&1 | grep "warning" | wc -l
# Esperado: < 5 (deuda técnica aceptable)
```

**Reporta al auditor**:
```
ITEM 3: ESLint warnings menores
- X warnings limpiados
- Prefer const applied
- Console.log limpiados
- Condicionales simplificados
```

---

## 🎯 ITEM 4: Screen Reader Testing (MANUAL)

**Nota**: Solo si tienes NVDA (Windows) o VoiceOver (Mac) instalado.

### Requisitos
```
✅ npm run dev corriendo
✅ NVDA/VoiceOver abierto
✅ 30 minutos
```

### Test 1: Login Flow
```
1. Abre http://localhost:3000/auth/login
2. NVDA anuncia: "Email input", "Password input", "Sign in button"
3. Tab navega entre campos
4. Entra credenciales demo@shortlist.gt
5. Click Sign in
6. Anuncia: "Bienvenido"
```

### Test 2: Dashboard
```
1. Dashboard carga
2. NVDA anuncia: "Mis Vacantes", "Crear Nueva Vacante"
3. Tab navega entre cards
4. Vacante card: "Vacante titulo", "estado", "Ver →"
```

### Test 3: Postulación
```
1. Click en vacante → /postular/[slug]
2. Modal: "Términos de privacidad"
3. NVDA anuncia términos
4. Checkbox: "Acepto términos"
5. Button: "Continuar"
6. Form fields accesibles
7. Submit → "Postulación enviada"
```

### Checklist Accesibilidad
```
□ Botones tienen aria-label o texto visible
□ Inputs tienen labels asociados
□ Modals: role="dialog" + aria-labelledby
□ Errores anunciados con ARIA live regions
□ Navegar con Tab funciona
□ Heading hierarchy h1 → h2 → h3
□ Imágenes: alt text o aria-hidden
□ Links claros (no "click here")
□ Color + otro indicador (icono, texto, estado)
□ Contraste: WCAG AA (4.5:1 normal text)
```

**Reporta al auditor**:
```
ITEM 4: Screen reader testing
- ✅ Login accesible
- ✅ Dashboard accesible
- ✅ Postulación accesible
- ⚠️ [Describe issues si hay]
```

---

## 📊 REPORTE FINAL FASE 7

Una vez completados todos los items, reporta:

```
FASE 7 COMPLETADA

ITEM 1: Unused vars/imports      [✅ / ❌]
ITEM 2: `any` types              [✅ / ❌]
ITEM 3: ESLint minor warnings    [✅ / ❌]
ITEM 4: Screen reader testing    [✅ / ⚠️ SKIPPED]

VALIDACIONES:
✅ npm run lint: 0-5 warnings (acceptable debt)
✅ npm run build: successful
✅ npm test: all pass
✅ npm audit: 0 vulnerabilities
✅ git status: clean

RESULTADO: 🎉 CÓDIGO PRODUCCIÓN LIMPIO
```

---

## 🚀 PRÓXIMOS PASOS

Cuando todo esté ✅:

1. **Commit**:
```bash
git add -A
git commit -m "feat: FASE 7 cleanup - Deuda técnica post-PROD

- Eliminadas 40+ no-unused-vars warnings
- Reemplazados 15+ any types con tipos específicos
- Limpiados ESLint minor warnings
- Screen reader validation (si aplica)

npm run lint: 0 errors
npm test: all pass
npm audit: 0 vulnerabilities"
```

2. **Push**:
```bash
git push
```

3. **Final verification**:
```bash
npm run type-check
npm run build
npm test
npm audit
```

---

## 📞 CONTACTO CON AUDITOR

Si tienes dudas:
- ✅ Verifica FASE_7_EJECUCION.md para ejemplos detallados
- ✅ Busca en git log cambios anteriores para patrones
- ✅ Pregunta al auditor si algo no está claro

---

**Duración estimada**: 2-3 horas  
**Complejidad**: Baja (limpieza mechanical)  
**Riesgo**: Muy bajo (refactorización sin lógica nueva)  

🚀 **¡Adelante con FASE 7!**
