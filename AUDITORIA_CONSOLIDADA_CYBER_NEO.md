# 🔒 AUDITORÍA CONSOLIDADA: Informe QA + Cyber Neo

**Fecha**: 20 de Septiembre, 2026  
**Fuentes**: 
- INFORME_QA_SHORTLIST_PARA_CLAUDE.md (45 hallazgos)
- cyber-neo-report-SHORTLIST-2026-09-20.md (60+ hallazgos)

---

## 📊 SÍNTESIS COMPARATIVA

| Aspecto | QA Audit | Cyber Neo | Overlap | Total Único |
|---------|----------|-----------|---------|------------|
| **Hallazgos** | 45 | 60+ | 8-10 | ~95 |
| **Críticos** | 3 | 14 | 3 | 14 |
| **Metodología** | Análisis estático + observacional | SAST + DAST + depencias | Complementaria | ✅ |
| **Cobertura** | Código + UX + datos | Dependencias + infra + CI/CD | Complementaria | ✅ |
| **Confianza** | 75% | 95% | - | **95%** |

---

## 🔴 CRÍTICOS CONFIRMADOS POR AMBOS (8-10)

### P0 - ARREGLAR HOY (4-6 horas)

#### 1. **SEG-01 / CWE-798**: Secretos expuestos en Git
- **Fuente**: ✅ QA + ✅ Cyber Neo
- **Ubicación**: `PROGRESS_DAY_1.md` líneas 13, 17
  - SUPABASE_SERVICE_ROLE_KEY completa
  - OPENAI_API_KEY completa
- **Impacto**: CRÍTICO - Acceso privilegiado a BD y APIs
- **Acción**:
  1. Revocar en Supabase dashboard + OpenAI
  2. `git filter-branch` para remover del historial
  3. Regenerar claves
  4. Push fuerza a main
- **Tiempo**: 30 minutos
- **Validación**: Claves antiguas revocadas, nuevas en .env.local

#### 2. **SEG-02 / CWE-20**: Middleware permite TODAS las rutas
- **Fuente**: ✅ QA + ✅ Cyber Neo (como "Weak Token Validation")
- **Defecto**: `pathname.startsWith('/')` con `'/'` en publicRoutes
- **Impacto**: CRÍTICO - Bypass de autenticación total
- **Acción**:
  ```typescript
  // ANTES (DEFECTUOSO):
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  // DESPUÉS (FIJO):
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  const isApiPublic = publicRoutes.some(route => 
    route.includes('/api/') && pathname.startsWith(route)
  );
  ```
- **Tiempo**: 5 minutos
- **Validación**: `/dashboard/*` → login sin token

#### 3. **SEG-03 / CWE-639**: DELETE de vacantes sin autorización
- **Fuente**: ✅ QA + ✅ Cyber Neo (como "CRITICAL" #4 en tabla)
- **Ubicación**: `app/api/vacantes/eliminar/route.ts` líneas 4-46
- **Defecto**: No valida Authorization header ni propietario
- **Acción**: Agregar verificación de `usuario_id` == usuario autenticado
- **Tiempo**: 15 minutos
- **Validación**: Otro usuario no puede borrar

#### 4. **SEG-04 / CWE-639**: BOLA en `/api/candidatos/listar`
- **Fuente**: ✅ QA (SEG-04) + ✅ Cyber Neo (CRITICAL #1)
- **Defecto**: Devuelve todos los candidatos sin autenticación
- **Impacto**: CRÍTICO - Exposición de PII (emails, teléfono, CV)
- **Acción**: Agregar autenticación + verificar empresa
- **Tiempo**: 20 minutos
- **Validación**: Sin token → 401

#### 5. **SEG-05 / CWE-639**: IDOR en `/api/candidatos/eliminar`
- **Fuente**: ✅ QA (SEG-05) + ✅ Cyber Neo (CRITICAL #2)
- **Defecto**: Borra cualquier candidato sin verificar propiedad
- **Impacto**: CRÍTICO - Destrucción de datos arbitraria
- **Acción**: Verificar que usuario autenticado es dueño
- **Tiempo**: 20 minutos
- **Validación**: Otro usuario no puede borrar

#### 6. **SEG-06 / CWE-639**: Missing auth en `/api/candidatos/exportar`
- **Fuente**: ✅ QA (SEG-04) + ✅ Cyber Neo (CRITICAL #3)
- **Defecto**: Exporta datos sin autenticación
- **Impacto**: CRÍTICO - Exposición masiva de PII
- **Acción**: Agregar autenticación + rate limit
- **Tiempo**: 20 minutos

#### 7. **SEG-07 / CWE-798 + CWE-200**: GitHub PAT en .git/config
- **Fuente**: ❌ QA NO detectó + ✅ Cyber Neo (CRITICAL #4)
- **Ubicación**: `.git/config`
- **Defecto**: Personal Access Token en plaintext
- **Impacto**: CRÍTICO - Impersonación del repositorio
- **Acción**:
  1. Revocar en https://github.com/settings/tokens
  2. Remover de .git/config
  3. Usar SSH keys en su lugar
- **Tiempo**: 15 minutos

#### 8. **DEP-001 / CWE-78**: node-tesseract-ocr RCE
- **Fuente**: ❌ QA NO detectó + ✅ Cyber Neo (CRITICAL #5, CVSS 9.8)
- **Paquete**: node-tesseract-ocr@2.2.1
- **Defecto**: OS Command Injection, end-of-life
- **Status**: ✅ UNUSED (dead dependency)
- **Acción**: `npm uninstall node-tesseract-ocr`
- **Tiempo**: 5 minutos

#### 9. **CWE-798**: Service Role Key en APIs públicas
- **Fuente**: ✅ QA (SEG-06) + ✅ Cyber Neo (CRITICAL #3)
- **Defecto**: Service role (admin) cargada en endpoints públicos
- **Impacto**: CRÍTICO - Bypassea RLS completamente
- **Acción**: Usar anon key con RLS en endpoints, service role solo servidor
- **Tiempo**: 1 hora (requiere cambios en todas las APIs)

#### 10. **CWE-307**: License code brute force
- **Fuente**: ✅ QA (SEG-09) + ✅ Cyber Neo (CRITICAL)
- **Ubicación**: `/api/auth/use-license-code`
- **Defecto**: No requiere autenticación, acepta `userId` arbitrario, sin rate limit
- **Acción**: Agregar autenticación + usar userId del JWT
- **Tiempo**: 20 minutos

---

## 🟠 HALLAZGOS SOLO EN CYBER NEO (5+)

### Alta Severidad pero NO en QA:

1. **Flask service en 0.0.0.0** (CRITICAL)
   - Ubicación: `shortlist-scoring-service/app.py`
   - Defecto: Expuesto sin autenticación
   - Acción: `app.run(host='127.0.0.1', ...)` + agregar auth
   - Tiempo: 15 minutos

2. **Weak password change validation** (HIGH)
   - Ubicación: `/api/auth/change-password/route.ts`
   - Defecto: Nunca verifica contraseña actual
   - Acción: Implementar verificación real
   - Tiempo: 20 minutos

3. **Hardcoded GoDaddy credentials** (HIGH)
   - Ubicación: `/lib/godaddy-db.ts`
   - Defecto: Fallback values exponen credenciales
   - Acción: Remover, solo usar env vars
   - Tiempo: 10 minutos

4. **xlsx dependency vulnerabilities** (HIGH)
   - Paquete: xlsx@0.18.5
   - Defecto: Prototype pollution + ReDoS
   - Acción: Actualizar a v0.20.2
   - Tiempo: 10 minutos

5. **CSP disabled** (HIGH)
   - Defecto: No hay Content-Security-Policy fuerte
   - Acción: Actualizar CSP en middleware
   - Tiempo: 15 minutos

---

## 🟡 HALLAZGOS SOLO EN QA (8+)

### Detectados por observación/análisis que Cyber Neo no enfatizó:

1. **OP-02**: Vacantes no persisten (arreglado, validar en PROD)
2. **OP-07**: Filtros de reporte no aplicados
3. **OP-08**: Sincronización duplica inserts
4. **OP-09**: Esquema divergente (usuario_id vs user_id)
5. **UI-01 a UI-11**: Defectos de accesibilidad y UX
6. **SEG-13**: Rate limit local sin coordinación
7. **SEG-14**: CSP no cubre Supabase WebSocket
8. **OP-17**: Logs registran PII

---

## 📋 PLAN REMEDIACIÓN CONSOLIDADO

### **FASE 0: EMERGENCIA (TODAY - 4-6 horas)**

**Objetivo**: Cerrar todos los CRITICAL de ambas auditorías

```
1. Revocar secretos (SEG-01)                     15 min
   └─ Supabase + OpenAI + GitHub + WhatsApp

2. Fijar middleware (SEG-02)                      5 min
   └─ Cambiar startsWith a ===

3. DELETE autenticado (SEG-03)                   15 min
   └─ Verificar usuario_id

4. BOLA en listar (SEG-04)                       20 min
   └─ Agregar Authorization header

5. IDOR en eliminar candidatos (SEG-05)          20 min
   └─ Verificar propietario

6. Export sin auth (SEG-06)                      20 min
   └─ Agregar autenticación

7. GitHub PAT (SEG-07)                           15 min
   └─ Revocar + SSH keys

8. Node-tesseract RCE (DEP-001)                   5 min
   └─ npm uninstall

9. Service role en APIs (CWE-798)                60 min
   └─ Cambiar todas a anon key con RLS

10. License brute force (CWE-307)                20 min
    └─ Autenticación + rate limit

11. Flask 0.0.0.0 (CRITICAL)                     15 min
    └─ Localhost solo + auth

12. GoDaddy hardcoded creds (HIGH)               10 min
    └─ Remover fallback values

13. xlsx vulnerabilities (HIGH)                  10 min
    └─ npm update xlsx

14. Weak password change (HIGH)                  20 min
    └─ Verificar contraseña actual

15. CSP headers (HIGH)                           15 min
    └─ Actualizar en middleware

─────────────────────────────
TOTAL FASE 0: 5-6 horas
```

### **FASE 1: CRÍTICAS (THIS WEEK - 2-3 días)**

- Validar RLS en Supabase (SEG-06)
- Implementar autorización completa en todas las APIs
- Tests de autorización (2 usuarios, 2 empresas)
- Sincronización idempotente (OP-08)
- Validar vacante en PROD (OP-02)

### **FASE 2: IMPORTANTES (THIS MONTH - 1-2 semanas)**

- GitHub Actions CI/CD
- Secret detection pre-commit
- Logging sin PII (OP-17)
- Rate limiting distribuido
- Accesibilidad UX (UI-01-11)

### **FASE 3: HARDENING (NEXT QUARTER - 2-4 semanas)**

- Monitoring y auditoría
- Automated dependency updates
- Security assessment trail

---

## 🎯 TIMELINE REALISTA

### Cyber Neo estima: **3-4 semanas** para production-ready
### QA estima: **38-56 horas** (ambas fases combinadas)

**Consolidado realista**:
- **Fase 0** (Emergencia): 5-6 horas (HOY)
- **Fase 1** (Críticas): 16-20 horas (3-5 días)
- **Fase 2** (Hardening): 30-40 horas (1-2 semanas)
- **Fase 3** (Validación): 8-12 horas (3-4 días)

**TOTAL**: ~60-80 horas en staging antes de PROD

---

## 🚨 RIESGOS COMBINADOS

### Si NO haces Fase 0:
- 🔴 **CRÍTICO**: 14 vulnerabilidades críticas activas
- Acceso no autorizado a datos personales
- Bypass de autenticación total
- Inyección OS en dependencias

### Si haces Fase 0 pero no Fase 1:
- 🟡 **ALTO**: Vulnerabilidades autenticadas
- RLS puede estar incorrecta
- Sincronización puede duplicar
- Logs contienen PII

### Si haces Fases 0-1:
- 🟢 **BAJO**: Sistema funciona con seguridad básica
- Requiere Fase 2 para hardening

---

## ✅ MATRIZ CONSOLIDADA DE VALIDACIÓN

```
DEFECTO                    | QA | Cyber | CRÍTICO | ACCIÓN
===========================================================
Secretos en Git           | ✅ | ✅   | P0      | Revocar hoy
Middleware bypass         | ✅ | ✅   | P0      | Arreglar hoy
DELETE sin auth           | ✅ | ✅   | P0      | Arreglar hoy
BOLA listar               | ✅ | ✅   | P0      | Arreglar hoy
IDOR eliminar             | ✅ | ✅   | P0      | Arreglar hoy
Export sin auth           | ✅ | ✅   | P0      | Arreglar hoy
GitHub PAT                | ❌ | ✅   | P0      | Revocar hoy
node-tesseract RCE        | ❌ | ✅   | P0      | Remover hoy
Service role APIs         | ✅ | ✅   | P0      | Arreglar hoy
License brute force       | ✅ | ✅   | P0      | Arreglar hoy
Flask 0.0.0.0             | ❌ | ✅   | P0      | Arreglar hoy
GoDaddy hardcoded         | ❌ | ✅   | P1      | Arreglar mañana
xlsx vulns                | ❌ | ✅   | P1      | Update mañana
Weak password change      | ❌ | ✅   | P1      | Arreglar mañana
CSP disabled              | ❌ | ✅   | P1      | Arreglar mañana
RLS inspeccionada         | ⚠️ | ✅   | P1      | Auditar
Vacante en PROD           | ⚠️ | ❌   | P1      | Validar
Sync duplica              | ✅ | ❌   | P1      | Arreglar
Logs con PII              | ✅ | ✅   | P1      | Redactar
UX/Accesibilidad          | ✅ | ❌   | P2      | Mejorar
```

---

## 📊 RESUMEN FINAL

| Métrica | Valor |
|---------|-------|
| Total hallazgos únicos | ~95 |
| Críticos no cuestionables | 14 |
| Confianza análisis | 95% |
| Horas para Fase 0 | 5-6 |
| Horas para todas fases | 60-80 |
| Riesgo sin Fase 0 | 🔴 CRÍTICO |
| Riesgo con Fase 0 | 🟡 ALTO |
| Riesgo con Fases 0-1 | 🟢 BAJO |

---

## 🎬 ACCIÓN INMEDIATA

**AHORA (próxima hora)**:
1. Leer este documento
2. Comparar con PLAN_REMEDIACION_FASES.md
3. Ejecutar Fase 0 items 1-15 en paralelo
4. Hacer push a main
5. Redeploy en Vercel

**VALIDACIÓN POST-FASE-0**:
- Secretos revocados ✅
- Claves nuevas en .env.local ✅
- Endpoints requieren Authorization ✅
- node-tesseract removido ✅
- GitHub PAT revocado ✅

---

**Documento**: Auditoría Consolidada (QA + Cyber Neo)  
**Fecha**: 20 de Septiembre, 2026  
**Confianza**: 95%  
**Recomendación**: Ejecutar Fase 0 HOY, sin demora
