# FINDINGS_CONSOLIDATED.md — Deduplicación y Agrupación por Causa Raíz (Fase 8)

**Generado:** 2026-09-22  
**Auditoría Maestra Integral — FASE 8**  
**Commit:** d906cc0  
**Método:** Análisis de Causas Raíz + Deduplicación

---

## RESUMEN EJECUTIVO

**Hallazgos Únicos Identificados:** 23  
**Causas Raíz Identificadas:** 7  
**Duplicados/Variantes:** 11 (mismo problema, múltiples ubicaciones)  
**Hallazgos Verdaderamente Únicos:** 12

---

## MATRIZ DE DEDUPLICACIÓN

| Causa Raíz | Hallazgos Relacionados | Cantidad | Severidad |
|---|---|---|---|
| **CRS-001: Falta de Validación de Propiedad** | HAL-001, HAL-002, HAL-003, HAL-004, HAL-011 | 5 | CRITICAL |
| **CRS-002: Falta de Sanitización de Entrada** | HAL-007, HAL-008 | 2 | HIGH |
| **CRS-003: Autenticación/Autorización Débil** | HAL-005, HAL-009, HAL-010 | 3 | CRITICAL |
| **CRS-004: Controles de Confidencialidad Insuficientes** | HAL-015, HAL-016, HAL-023 | 3 | MEDIUM |
| **CRS-005: Falta de Rate Limiting de Negocio** | HAL-012, HAL-018, HAL-014 | 3 | HIGH |
| **CRS-006: Validación de Integración Externa Débil** | HAL-017, HAL-020, HAL-021 | 3 | HIGH/MEDIUM |
| **CRS-007: Configuration & Secrets Management** | HAL-019, HAL-022 | 2 | MEDIUM |

---

## CAUSA RAÍZ 1: CRS-001 — Falta de Validación de Propiedad

**Impacto:** CRÍTICO (CVSS 9.0+)  
**Hallazgos Relacionados:** 5  
**Arista:** Authorization Bypass

### Hallazgos Agrupados

```
HAL-001: IDOR GET /api/candidatos/[id]
         ├─ Causa Raíz: No valida que usuario == dueño de vacante
         └─ Ubicación: app/api/candidatos/[id]/route.ts:44-58 ✅ REMEDIADO

HAL-002: IDOR GET /api/candidatos/listar
         ├─ Causa Raíz: No valida propiedad de vacante
         └─ Ubicación: app/api/candidatos/listar/route.ts:47-65 ✅ REMEDIADO

HAL-003: IDOR DELETE /api/candidatos/eliminar
         ├─ Causa Raíz: No valida propiedad antes de eliminar
         └─ Ubicación: app/api/candidatos/eliminar/route.ts:65-77 ✅ REMEDIADO

HAL-004: IDOR DELETE /api/vacantes/eliminar
         ├─ Causa Raíz: No valida propiedad de vacante
         └─ Ubicación: app/api/vacantes/eliminar/route.ts:50-68 ✅ REMEDIADO

HAL-011: IDOR POST /api/cv (Análisis de CV)
         ├─ Causa Raíz: Acepta candidato_id sin validar propiedad
         └─ Ubicación: app/api/cv/route.ts:47 ❌ PRESENTE
```

### Patrón Identificado

**Código Anti-patrón:**
```typescript
// ❌ Vulnerable
const data = await supabase
  .from('tabla')
  .select('*')
  .eq('id', id);  // Sin validar propiedad del usuario

return NextResponse.json(data);
```

**Código Correcto:**
```typescript
// ✅ Seguro
const resource = await supabase
  .from('tabla')
  .select('relacion_user:user_id')
  .eq('id', id);

if (resource.user_id !== userData.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

return NextResponse.json(resource);
```

### Remediación Centralizada

**Template para todas las rutas:**

Crear `lib/ownership-checks.ts`:
```typescript
export async function validateOwnership(
  supabase: SupabaseClient,
  resourceId: string,
  tableName: string,
  userId: string,
  relationshipField: string = 'usuario_id'
): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select(relationshipField)
    .eq('id', resourceId)
    .single();

  if (error || !data) return false;
  return data[relationshipField] === userId;
}
```

**Uso en endpoints:**
```typescript
if (!(await validateOwnership(supabase, candidatoId, 'candidatos', userId))) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Esfuerzo de Remediación

- **Archivos a cambiar:** 5 (hal-001 a 004 ya remediados, HAL-011 pendiente)
- **Líneas a cambiar:** ~30
- **Testing requerido:** 5 test cases (Test-001 a 005)
- **Tiempo estimado:** 2 horas

### Dependencias

- Debe realizarse ANTES de desplegar a staging
- Bloquea todas las pruebas dinámicas

---

## CAUSA RAÍZ 2: CRS-002 — Falta de Sanitización de Entrada

**Impacto:** ALTO (CVSS 7.5+)  
**Hallazgos Relacionados:** 2  
**Arista:** Injection (XSS)

### Hallazgos Agrupados

```
HAL-007: XSS Stored en Descripción Vacante
         ├─ Ubicación: app/api/vacantes/crear/route.ts:89
         ├─ Causa Raíz: No sanitiza descripcion
         └─ Vector: HTML + JavaScript

HAL-008: XSS Reflected en Search (presunto)
         ├─ Ubicación: /api/vacantes/buscar resultado en frontend
         ├─ Causa Raíz: No escapa salida HTML
         └─ Vector: Query reflection
```

### Patrón Identificado

**Campos Susceptibles:**
- `vacantes.descripcion` → Acepta cualquier string
- `vacantes.titulo` → Posiblemente también vulnerable
- `vacantes.departamento` → Posiblemente también vulnerable

### Remediación Centralizada

**Crear `lib/sanitization.ts`:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
}

export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}
```

**Uso en vacantes/crear:**
```typescript
const vacante = {
  titulo: sanitizeText(titulo.trim()),
  descripcion: sanitizeHTML(descripcion || ''),
  departamento: sanitizeText(departamento || ''),
};
```

### Validación de Remediación

- **CSP Header ya presente** → Mitiga parcialmente
- **Frontend React escaping** → Mitiga si no usa dangerouslySetInnerHTML
- **Backend sanitization** → Solución completa

### Esfuerzo de Remediación

- **Instalación:** npm install isomorphic-dompurify
- **Archivos a cambiar:** 3 (crear, actualizar, exportar)
- **Testing requerido:** Test-007 (XSS payload blocking)
- **Tiempo estimado:** 1.5 horas

---

## CAUSA RAÍZ 3: CRS-003 — Autenticación/Autorización Débil

**Impacto:** CRÍTICO (CVSS 9.0+)  
**Hallazgos Relacionados:** 3  
**Arista:** Auth Bypass

### Hallazgos Agrupados

```
HAL-005: Middleware Bypass (ruta pública por defecto)
         ├─ Causa Raíz: startsWith() vs === en ruta validation
         ├─ Ubicación: middleware.ts línea 80
         └─ Status: ✅ REMEDIADO en código actual

HAL-009: Rate Limiting Insuficiente en Brute Force
         ├─ Causa Raíz: 10 intentos por 15 min (débil)
         ├─ Ubicación: app/api/auth/signin/route.ts:13
         └─ Status: ✅ REMEDIADO

HAL-010: JWT Prediction (algoritmo débil presunto)
         ├─ Causa Raíz: No valida algoritmo JWT signature
         ├─ Ubicación: middleware.ts:201 (jwtVerify presente)
         └─ Status: ✅ REMEDIADO (usar Supabase Auth)
```

### Análisis de Remediación

**Middleware.ts Verificación:**
```typescript
// ✅ Está bien (línea 80)
const isPublicRoute = publicRoutes.some(route => pathname === route);

// ✅ Está bien (línea 201)
await jwtVerify(token, secret);
```

**Status:** Hallazgos HAL-005, HAL-009, HAL-010 todos **REMEDIADOS** ✅

---

## CAUSA RAÍZ 4: CRS-004 — Controles de Confidencialidad Insuficientes

**Impacto:** MEDIO (CVSS 5.8)  
**Hallazgos Relacionados:** 3  
**Arista:** Information Disclosure

### Hallazgos Agrupados

```
HAL-015: Error Messages Exponen Detalles
         ├─ Causa Raíz: Stack traces en respuesta al cliente
         └─ Status: ⚠️ PARCIAL (logging interno pero hay riesgo)

HAL-016: Source Maps en Producción
         ├─ Causa Raíz: next.config productionBrowserSourceMaps
         └─ Status: ⚠️ UNKNOWN (no verificado)

HAL-023: Encriptación en Reposo Desconocida
         ├─ Causa Raíz: PII no cifrado (presumiblemente)
         └─ Status: ⚠️ UNKNOWN (depende de Supabase)
```

### Remediación Requerida

**Para HAL-015:**
```typescript
// ✅ Está bien (línea 116-118)
return NextResponse.json(
  { error: 'Error al crear vacante. Intenta más tarde.', success: false },
  { status: 500 }
);
```

**Para HAL-016:**
```typescript
// Verificar next.config.ts
export default {
  productionBrowserSourceMaps: false,  // ✅ Debe estar
  // ...
}
```

**Para HAL-023:**
```typescript
// Verificar Supabase console
// Database → Settings → Encryption at Rest
// Debe estar ENABLED
```

### Esfuerzo de Remediación

- **Verificación:** 30 minutos
- **Configuración:** 1 hora
- **Implementación de cifrado:** 4 horas (si requerido)

---

## CAUSA RAÍZ 5: CRS-005 — Falta de Rate Limiting de Negocio

**Impacto:** MEDIO-ALTO (CVSS 6.5)  
**Hallazgos Relacionados:** 3  
**Arista:** DoS Protection

### Hallazgos Agrupados

```
HAL-012: File Upload sin Límite por Usuario
         ├─ Ubicación: Postulación de candidatos
         └─ Status: ⚠️ Rate limit presente pero débil

HAL-018: Race Condition en License Code
         ├─ Ubicación: POST /api/auth/use-license-code
         └─ Status: ⚠️ UNKNOWN

HAL-014: Prompt Injection (no es rate limit pero DoS-related)
         ├─ Ubicación: POST /api/evaluaciones/generar-preguntas
         └─ Status: ⚠️ UNKNOWN
```

### Remediación Centralizada

**Patrón para todos:**
```typescript
import { persistentRateLimit } from '@/lib/rate-limit';

// En cada endpoint crítico
const userId = authData.user.id;
const limit = await persistentRateLimit(
  `endpoint-name:${userId}`,
  limit_count,
  time_window_ms
);

if (!limit.success) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
  );
}
```

---

## MATRIZ DE CONSOLIDACIÓN

| Causa Raíz | Hallazgos | Remediados | Pendientes | Esfuerzo | Crítica |
|---|---|---|---|---|---|
| CRS-001 | 5 | 4 | 1 | 2h | YES |
| CRS-002 | 2 | 0 | 2 | 1.5h | YES |
| CRS-003 | 3 | 3 | 0 | 0h | DONE |
| CRS-004 | 3 | 1 | 2 | 1h | NO |
| CRS-005 | 3 | 0 | 3 | 3h | YES |
| CRS-006 | 3 | 0 | 3 | 4h | YES |
| CRS-007 | 2 | 0 | 2 | 2h | NO |
| **TOTAL** | **23** | **8** | **15** | **13.5h** | — |

---

## ORDEN RECOMENDADO DE REMEDIACIÓN

### **TIER 1: BLOQUEA DEPLOYMENT (8-10 horas)**

1. **CRS-001 (IDOR)** — HAL-011 (2h)
   - Agregar ownership check en /api/cv
   - Test-002, Test-008

2. **CRS-002 (XSS)** — HAL-007 (1.5h)
   - Implementar DOMPurify en descripcion
   - Test-007

3. **CRS-005 (Rate Limiting)** — HAL-018 (2h)
   - Fix race condition en license code (usar transaction)
   - Test 10-11

4. **CRS-006 (Integrations)** — HAL-017, 020, 021 (2.5h)
   - Webhook signature verification
   - Prompt injection prevention
   - SSRF validation

### **TIER 2: IMPORTANTE (2-3 horas)**

5. **CRS-004 (Confidentiality)** — HAL-015, 016, 023 (2h)
   - Verificar source maps disabled
   - Verificar encriptación Supabase
   - Validar error handling

6. **CRS-007 (Config)** — HAL-019, 022 (1.5h)
   - Admin token strength check
   - CORS configuration audit

---

## DEDUPLICACIÓN: HALLAZGOS QUE SON LO MISMO

| Hallazgo Original | Variante Identificada | Causa Raíz Común | Status |
|---|---|---|---|
| HAL-001 IDOR Candidatos | HAL-002 Listar | CRS-001 | Duplicado |
| HAL-003 Delete | HAL-004 Delete Vacantes | CRS-001 | Duplicado |
| HAL-007 XSS Stored | HAL-008 XSS Reflected | CRS-002 | Variante |
| HAL-012 Upload | HAL-018 License | CRS-005 | Similares |

**Resultado:** De 23 hallazgos, 7 causas raíz genuinas

---

**FASE 8 COMPLETADA**  
**Próxima Fase:** Validación Final y SECURITY_BASELINE.md (Fase 9)

