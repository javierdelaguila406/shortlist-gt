# MULTI_TENANT_AUDIT.md — Revisión de Aislamiento Multi-Tenant (Fase 5)

**Generado:** 2026-09-22  
**Auditoría Maestra Integral — FASE 5**  
**Commit:** d906cc0  
**Alcance:** Validar que Empresa A no accede datos de Empresa B

---

## RESUMEN EJECUTIVO

| Componente | Verificado | Secure | Hallazgos |
|---|---|---|---|
| **Modelo de Tenancia** | ✅ | ✅ | Usuario-based (no empresa-based) |
| **Validación usuario_id** | ✅ | ✅ | Presente en IDOR checks |
| **Validación company_id** | ⚠️ | ❌ | AUSENTE - CRÍTICO |
| **Row-Level Security (RLS)** | ❌ | ❓ | Presumiblemente en Supabase, no verificado |
| **Aislamiento de Datos** | ⚠️ | ⚠️ | Parcial - usuario-level, no empresa-level |

---

## ANÁLISIS: ¿CÓMO ESTÁ IMPLEMENTADO EL MULTI-TENANCY?

### Modelo Observado

```
Usuarios → Empresas (1:N relación inversa)
  usuario_id → companies table
  usuario_id → vacantes table (owner)
  vacante_id → candidatos table
```

**Arquitectura:**
```
Company (empresa)
  ├─ user_id: Usuario que crea la empresa
  └─ email, nombre

Usuario (user en Supabase Auth)
  ├─ id: UUID
  ├─ email: string
  └─ companies (relación: cuántas empresas puede tener?)

Vacante (vacancy posting)
  ├─ id: UUID
  ├─ usuario_id: Dueño de la vacante
  └─ candidatos: Candidatos aplicados

Candidato (applicant)
  ├─ id: UUID
  ├─ vacante_id: Vacante a la que aplicó
  └─ datos personales: nombre, email, teléfono, CV
```

---

## IDENTIFICACIÓN DE VULNERABILIDAD CRÍTICA

### ⚠️ HALLAZGO: Validación `usuario_id` pero NO `empresa_id`

**Escenario de Ataque:**
```
Empresa A: usuario_id = "user-123"
Empresa B: usuario_id = "user-456"

Reclutador en Empresa A crea Vacante V1 con usuario_id="user-123"
Reclutador en Empresa B TAMBIÉN con usuario_id="user-456"
```

**Si ambos usuarios están en la MISMA EMPRESA:**
```
Usuario A: usuario_id = "user-123", empresa_id = "empresa-A"
Usuario B: usuario_id = "user-456", empresa_id = "empresa-A"  ← MISMO EMPRESA

Usuario A puede ver vacantes de Usuario B (mismo empresa)
```

**Pregunta Crítica:** ¿La validación es por usuario individual O por empresa?

---

## ANÁLISIS DE CÓDIGO: Patrones Observados

### Patrón 1: Validación `usuario_id` en IDOR Checks

**Línea:** `app/api/candidatos/listar/route.ts:60`
```typescript
if (vacante.usuario_id !== userData.user.id) {  // Solo usuario
  return { error: 'Forbidden' };
}
```

**Interpretación:**
- ✅ Valida que el usuario logeado sea dueño de la vacante
- ❓ Pero: ¿Qué si hay dos usuarios en la misma empresa?
- ❓ ¿Pueden ver datos uno del otro?

### Patrón 2: NO hay `empresa_id` en Queries

**Búsqueda en código:** Ningún query incluye `empresa_id`  
**Riesgo:** Si la lógica de negocio requiere compartir datos entre usuarios de misma empresa, pero la seguridad NO está implementada correctamente, hay un gap.

**Ejemplo problema:**
```typescript
// Presunto código de Empresa (si existiera):
SELECT * FROM vacantes
WHERE empresa_id = userData.empresa_id  // ❓ ¿Se hace esto?

// Vs lo que encontramos:
SELECT * FROM vacantes
WHERE usuario_id = userData.user.id  // Solo usuario individual
```

---

## VALIDACIÓN: Escenarios de Ataque Multi-Tenant

### Escenario 1: Horizontal Escalation en MISMA EMPRESA

**Precondición:** Empresa tiene 2 reclutadores
- Reclutador 1: user-123
- Reclutador 2: user-456
- Ambos en empresa-A

**Attack:**
```bash
GET /api/candidatos/listar?vacante_id=VACANTE-DE-RECLUTADOR-2

# Validación:
vacante.usuario_id (user-456) !== userData.user.id (user-123) ✓
→ BLOQUEADO ✓
```

**Resultado:** ✅ SEGURO - No puede ver datos del otro reclutador

**Conclusión:** Modelo es USUARIO-individual, NO empresa-wide. Esto es más restrictivo pero más seguro.

---

### Escenario 2: Cross-Tenant si empresa_id está NULL

**Precondición:** Falta validación de `empresa_id`

**Attack:** Un usuario podría potencialmente:
1. Obtener `usuario_id` de competidor
2. Si hay falla en lógica de empresa, podría ver datos

**Probabilidad:** BAJA si RLS está bien configurado en Supabase

---

## VALIDACIÓN DE ROW-LEVEL SECURITY (RLS)

**Problema:** No hay evidencia de RLS en código visitado (implementación probable en Supabase)

**RLS Presunto en Supabase:**
```sql
-- Presunto schema de seguridad
CREATE POLICY "usuarios_pueden_ver_sus_vacantes" ON vacantes
  FOR SELECT
  USING (usuario_id = auth.uid());  -- ✅ Si existe

CREATE POLICY "usuarios_pueden_ver_sus_candidatos" ON candidatos
  FOR SELECT
  USING (
    vacante_id IN (
      SELECT id FROM vacantes WHERE usuario_id = auth.uid()
    )
  );  -- ✅ Si existe
```

**Verificable pero NO INSPECCIONADA** (requiere acceso a Supabase dashboard)

---

## HALLAZGO FINAL: Modelo Multi-Tenant

### Tipo de Implementación

✅ **Per-User Isolation** (no per-company)
- Cada usuario solo ve sus propias vacantes
- Cada usuario solo ve candidatos de sus vacantes
- Datos aislados a nivel de usuario individual

### Implicaciones de Negocio

**Si el modelo de negocio es:**
- ✅ "Un reclutador = una persona" → SEGURO
- ❌ "Múltiples reclutadores por empresa" → INSUFICIENTE

**Riesgo Identificado:** Si la aplicación permite múltiples usuarios por empresa y espera que compartan datos (reportes, historiales), entonces falta `empresa_id` en los checks.

---

## MATRIZ DE VALIDACIÓN MULTI-TENANT

| Control | Implementado | Verificado | Nivel |
|---|---|---|---|
| usuario_id check en GET candidatos | ✅ | ✅ | Per-User |
| usuario_id check en DELETE candidatos | ✅ | ✅ | Per-User |
| usuario_id check en GET vacantes | ✅ | ✅ | Per-User |
| usuario_id check en DELETE vacantes | ✅ | ✅ | Per-User |
| empresa_id check en cualquier ruta | ❌ | ❌ | MISSING |
| RLS en Supabase | ⚠️ | ❌ | UNKNOWN |
| Rate limiting por empresa | ❌ | ❌ | MISSING |
| Audit logging por empresa | ⚠️ | ⚠️ | PARTIAL |

---

## RECOMENDACIONES

### ✅ SEGURO (No requerida acción inmediata)
- Aislamiento per-usuario está bien implementado
- IDOR checks previenen acceso horizontal dentro de mismo usuario

### ⚠️ VERIFICACIÓN REQUERIDA
1. **Confirmar RLS en Supabase** — Validar que las policies existen y están correctas
2. **Validar modelo de negocio** — ¿Los usuarios deben compartir datos dentro de empresa?
3. **Agregar empresa_id si es necesario** — Si se requiere compartir datos entre usuarios

### ❌ HALLAZGOS ADICIONALES
1. **No hay rate limiting por empresa** — Empresa A podría DoS API en nombre de Empresa B
2. **Audit logging no vinculado a empresa** — Imposible auditar por tenant

---

**FASE 5 COMPLETADA**  
**Próxima Fase:** Pruebas Dinámicas (Fase 6) o continuar con consolidación

