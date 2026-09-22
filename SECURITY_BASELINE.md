# SECURITY_BASELINE.md — Línea Base de Seguridad Final

**Generado:** 2026-09-22  
**Auditoría Maestra Integral — FASE 9 (FINAL)**  
**Commit:** d906cc0 "Security hardening sprint completion"  
**Periodo:** Sept 18-22, 2026  
**Auditor:** Sistema de Auditoría Integral SHORTLIST.GT

---

## I. PUNTUACIÓN GENERAL

| Métrica | Valor | Interpretación |
|---|---|---|
| **Risk Score** | 87/100 | 🔴 CRÍTICO |
| **CVSS Promedio** | 8.2 | CRÍTICO |
| **Vulnerabilidades CRITICAL** | 11 | Explotables inmediatamente |
| **Vulnerabilidades HIGH** | 8 | Exploración factible |
| **Vulnerabilidades MEDIUM** | 4 | Riesgo moderado |
| **Hallazgos Nuevos (vs Audit Anterior)** | 14 | Hardening incompleto |
| **Hallazgos Confirmados (vs Audit Anterior)** | 9 | Regresión presente |

### Interpretación de Risk Score

| Rango | Nivel | Acción |
|---|---|---|
| 0-20 | ✅ SEGURO | Deployment seguro, testing limitado |
| 21-50 | ⚠️ BAJO | Deployment con alertas, testing obligatorio |
| 51-80 | 🟠 ALTO | NO DESPLEGAR, remediar CRITICAL/HIGH primero |
| 81-100 | 🔴 CRÍTICO | **BLOQUEO INMEDIATO DE PRODUCCIÓN** |

**Estado Actual:** 🔴 **CRÍTICO — BLOQUEO RECOMENDADO**

---

## II. MATRIZ DE CONTROL RESUMIDA

### Fases de Auditoría Completadas

| Fase | Documento | Componentes | Estado |
|---|---|---|---|
| **0** | SECURITY_SCOPE.md | Alcance, stack, restricciones | ✅ COMPLETO |
| **1** | ATTACK_SURFACE.md | 50 superficies, 31 APIs, 19 páginas | ✅ COMPLETO |
| **2** | THREAT_MODEL.md | 31 amenazas, 6 actores, 10 escenarios | ✅ COMPLETO |
| **3** | SECURITY_MATRIX.md | ASVS, CWE, OWASP, NIST | ✅ COMPLETO |
| **4-8** | SECURITY_FINDINGS.md | 23 hallazgos (11 CRITICAL, 8 HIGH) | ✅ COMPLETO |
| **9** | SECURITY_BASELINE.md | Línea base, comparativa | ✅ COMPLETO |

---

## III. HALLAZGOS POR CATEGORÍA OWASP TOP 10

### A01:2025 — Broken Access Control

| Hallazgo | Rutas | CVSS | Count |
|---|---|---|---|
| IDOR en Candidatos (GET, LISTAR, ELIMINAR) | `/api/candidatos/*` | 9.4 | 3 |
| IDOR en Vacantes (GET, ELIMINAR) | `/api/vacantes/*` | 9.3 | 2 |
| Middleware Bypass | middleware.ts | 9.8 | 1 |
| **Total A01** | | | **6 CRITICAL** |

### A03:2025 — Injection

| Hallazgo | Ubicación | CVSS |
|---|---|---|
| SQL Injection | `/api/vacantes/buscar` | 9.9 |
| XSS Stored | `/api/vacantes/crear` | 8.2 |
| XSS Reflected | `/api/vacantes/buscar` | 8.1 |
| Prompt Injection | `/api/evaluaciones/generar-preguntas` | 6.8 |
| **Total A03** | | **4 CRITICAL/HIGH** |

### A07:2025 — Identification & Auth Failures

| Hallazgo | Endpoint | CVSS |
|---|---|---|
| Brute Force (Rate Limiting) | `/api/auth/signin` | 8.7 |
| JWT Prediction | middleware | 9.0 |
| Session Fixation | `/api/auth/signin` | 6.5 |
| User Enumeration | `/api/auth/reset-password` | 5.3 |
| **Total A07** | | **3 CRITICAL, 1 MEDIUM** |

### A04:2025 — Insecure Design

| Hallazgo | Componente | CVSS |
|---|---|---|
| Race Condition (License) | `/api/auth/use-license-code` | 7.4 |
| Escalamiento Vertical | `/api/admin/*` | 8.2 |
| Webhook Spoofing | `/api/webhooks/whatsapp` | 7.2 |
| **Total A04** | | **3 HIGH** |

### Otros (A01 + A05)

| Hallazgo | Descripción | CVSS |
|---|---|---|
| File Upload Malicioso | POST /api/candidatos/postular | 7.8 |
| Path Traversal | GET /api/cv | 9.0 |
| CSRF en Formularios | Frontend forms | 6.5 |
| Information Disclosure | Error messages, source maps | 6.3 |
| CORS Unknown | Headers config | 5.8 |
| Encriptación Desconocida | Data at rest | 5.9 |
| **Total Otros** | | **2 CRITICAL, 5 HIGH/MEDIUM** |

---

## IV. ESTADO DE REMEDIACIÓN DESDE AUDITORÍA ANTERIOR

### Comparativa Sept 18 → Sept 22

```
Audit Anterior (8d2990f):
├─ CRÍTICO: 14 vulnerabilidades
├─ ALTO: 7 vulnerabilidades
└─ Conclusion: "Vulnerabilidades confirmadas no remediadas"

Audit Actual (d906cc0):
├─ CRÍTICO: 11 vulnerabilidades
├─ ALTO: 8 vulnerabilidades
├─ Nuevas: 14 hallazgos adicionales
└─ Conclusion: "Hardening parcial, REGRESIÓN en algunos campos"
```

### Hallazgos Remediados vs Aún Presentes

| ID | Hallazgo | Estado | Evidencia |
|---|---|---|---|
| SEG-01 | Info Disclosure (errors, headers) | ⚠️ PRESENTE | HAL-015, HAL-016 |
| SEG-02 | Middleware Bypass | ⚠️ PRESENTE | HAL-005 (confirmado) |
| SEG-03 | IDOR Vacantes | ⚠️ PRESENTE | HAL-004 (confirmado) |
| SEG-04 | IDOR Candidatos | ⚠️ PRESENTE | HAL-001-003, 008, 011 |
| SEG-05 | Eliminación sin Auth | ⚠️ PRESENTE | HAL-003 (confirmado) |
| **Remediados** | — | ✅ NINGUNO | — |
| **Nuevos Encontrados** | SQL Injection, XSS, etc. | ❌ 14 más | HAL-006-023 |

---

## V. MATRIZ DETALLADA POR COMPONENTE

### API Routes

| Ruta | Método | Autenticado | IDOR | Injection | Auth | Rate Limit | Estado |
|---|---|---|---|---|---|---|---|
| `/api/auth/signin` | POST | ❌ | N/A | ⚠️ | ❌ Brute Force | ⚠️ | 🔴 FAIL |
| `/api/candidatos/[id]` | GET | ✅ | ❌ IDOR | ⚠️ | ✅ | N/A | 🔴 FAIL |
| `/api/candidatos/listar` | GET | ✅ | ❌ IDOR | ⚠️ SQL Inj | ✅ | N/A | 🔴 FAIL |
| `/api/candidatos/eliminar` | POST | ✅ | ❌ IDOR | ⚠️ | ✅ | N/A | 🔴 FAIL |
| `/api/vacantes/crear` | POST | ✅ | ✅ | ❌ XSS | ✅ | ⚠️ | 🔴 FAIL |
| `/api/vacantes/[id]/candidatos` | GET | ✅ | ❌ IDOR | ⚠️ | ✅ | N/A | 🔴 FAIL |
| `/api/vacantes/buscar` | GET | ⚠️ | N/A | ❌ SQL+XSS | ⚠️ | ⚠️ | 🔴 FAIL |
| `/api/vacantes/eliminar` | DELETE | ✅ | ❌ IDOR | ⚠️ | ✅ | ⚠️ | 🔴 FAIL |
| `/api/cv` | GET | ✅ | ❌ IDOR | ❌ Path Trav | ✅ | N/A | 🔴 FAIL |
| `/api/evaluaciones/generar-preguntas` | POST | ✅ | N/A | ❌ Prompt Inj | ✅ | ⚠️ | 🟠 PARTIAL |
| `/api/webhooks/whatsapp` | POST | ⚠️ | N/A | ⚠️ | ❌ Spoof | ⚠️ | 🟠 PARTIAL |
| `/api/admin/generate-license` | POST | ✅ | N/A | ⚠️ | ⚠️ Token Weak | ⚠️ | 🟠 PARTIAL |
| `/api/admin/limpiar` | POST | ✅ | N/A | ⚠️ | ⚠️ | N/A | 🟠 PARTIAL |
| Restantes (8 rutas) | — | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ UNKNOWN |

**Resumen:** 
- 🔴 13/31 rutas CRÍTICA (42%)
- 🟠 3/31 rutas ALTA (10%)
- ⚠️ 15/31 rutas DESCONOCIDA (48%)

### Frontend Pages

| Página | Autenticación | CSRF | XSS | Input Val | Estado |
|---|---|---|---|---|---|
| `/postular/[slug]` | ❌ | ⚠️ | ⚠️ | ⚠️ | 🟠 PARTIAL |
| `/auth/login` | N/A | ⚠️ | ⚠️ | ⚠️ | 🟠 PARTIAL |
| `/dashboard/vacantes` | ✅ | ⚠️ | ⚠️ | ⚠️ | 🟠 PARTIAL |
| Restantes (16 páginas) | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ UNKNOWN |

---

## VI. LÍNEA BASE CONSOLIDADA

### Matriz PASS/FAIL/UNKNOWN

```
PASS (Controles confirmados seguros):
├─ HTTPS/TLS (Vercel)
├─ HTTPS-only cookies
├─ Logout invalida sesión Supabase
├─ Secretos en .env (no hardcoded)
├─ No eval()/exec() aparente
├─ JSON parsing (no pickle/yaml)
└─ Total: 8 controles (8%)

PARTIAL (Implementado pero incompleto):
├─ Rate limiting presente pero efectividad desconocida
├─ Validación Zod presente pero alcance desconocido
├─ JWT presente pero expiration desconocida
├─ Middleware presente pero defectuoso
├─ CORS configurado pero whitelist desconocida
├─ Error handling presente pero detalles Unknown
├─ CSP headers unknown
└─ Total: 12 controles (12%)

FAIL (Incumplimiento confirmado):
├─ IDOR generalizado (6 hallazgos)
├─ Middleware bypass (1 hallazgo)
├─ SQL injection (1 hallazgo)
├─ XSS no sanitizado (2 hallazgos)
├─ Rate limiting insuficiente (1 hallazgo)
├─ JWT prediction (1 hallazgo)
├─ Path traversal (1 hallazgo)
├─ Webhook spoofing (1 hallazgo)
├─ Race condition (1 hallazgo)
├─ Escalamiento vertical (1 hallazgo)
└─ Total: 18 controles (18%)

UNKNOWN (No determinable):
└─ 62 controles (62%)
```

---

## VII. RECOMENDACIONES DE ACCIÓN

### 🔴 BLOQUEO INMEDIATO (DO NOT DEPLOY)

1. **Parchear HAL-005** (Middleware Bypass) — Riesgo: acceso total sin autenticación
2. **Parchear HAL-001 a HAL-004** (IDOR) — Riesgo: exfiltración de 10000+ candidatos
3. **Parchear HAL-006** (SQL Injection) — Riesgo: extracción de BD completa
4. **Parchear HAL-007 a HAL-008** (XSS) — Riesgo: token theft, malware

### ⚠️ CRÍTICA (Fix this sprint)

5. **HAL-009** (Brute Force Rate Limiting)
6. **HAL-010** (JWT Prediction)
7. **HAL-011** (Path Traversal)
8. **HAL-012** (File Upload Validation)
9. **HAL-019** (Admin Token Escalation)

### 🟠 ALTA (Fix within 2 weeks)

10-17: HAL-013 a HAL-020 (CSRF, Prompt Injection, Info Disclosure, etc.)

### 🟡 MEDIA (Fix within 1 month)

18-23: HAL-021 a HAL-023 (Session Fixation, CORS, Encryption at Rest)

---

## VIII. ESFUERZO DE REMEDIACIÓN

### Estimación de Desarrollo

| Prioridad | Hallazgos | Estimado | Orden |
|---|---|---|---|
| **P0 (Bloqueo)** | 4 (HAL-001-008, -005, -006) | 40-50h | Semana 1 |
| **P1 (Crítico)** | 5 (HAL-009-012, -019) | 24-30h | Semana 2 |
| **P2 (Alto)** | 8 (HAL-013-020) | 20-24h | Semana 3 |
| **P3 (Medio)** | 6 (HAL-021-023, unknowns) | 16-20h | Semana 4+ |

**Total:** ~100-120 horas de desarrollo + testing

### Testing Requerido

| Tipo | Componente | Alcance |
|---|---|---|
| **Unit Tests** | Autorización checks | 15+ tests |
| **Integration Tests** | IDOR scenarios | 20+ tests |
| **Penetration Testing** | API, auth flow | Manual full sweep |
| **Security Review** | Código post-fix | Peer review + static analysis |

---

## IX. COMPARATIVA CON AUDITORÍA ANTERIOR

### Cambios Detectados (Sept 18 → 22)

```
Archivo/Componente que cambió:
├─ middleware.ts — No cambio observable (SEG-02 persiste)
├─ app/api/auth/* — Cambios parciales (SEG-01 aún presente)
├─ app/api/candidatos/* — Cambios parciales (SEG-04, SEG-05 persisten)
├─ app/api/vacantes/* — Cambios parciales (SEG-03 persiste)
├─ next.config.ts — Posible mejora de headers (unknown)
├─ package.json — Posible bump de dependencias (unknown)
└─ Commits nuevos — 5 commits de "hardening" (parcialmente exitosos)
```

### Hallazgos Esperados Remediados vs Realidad

| Esperado | Realidad | Gap |
|---|---|---|
| Middleware bypass remediado | Aún presente | ❌ No remediado |
| IDOR checks agregados | Parcialmente en algunos endpoints | ❌ Incompleto |
| Rate limiting mejorado | Presente pero efectividad desconocida | ⚠️ Unknown |
| Headers de seguridad | No verificados | ⚠️ Unknown |
| Secretos removidos | Presentes en .env (correcto) | ✅ OK |
| TypeScript errors fixed | 14 errores resueltos (ISSUE #5) | ✅ Partial |

---

## X. RECOMENDACIÓN FINAL

### Estado General: 🔴 CRÍTICO — NO APTO PARA PRODUCCIÓN

**Razones:**
1. 11 vulnerabilidades CRITICAL confirmadas
2. 5 de la auditoría anterior aún presentes (regresión)
3. Nuevas 14 vulnerabilidades identificadas durante audit
4. Risk Score 87/100 indica inestabilidad grave
5. Multi-tenancy data isolation completamente comprometida

### Acciones Inmediatas Recomendadas:

1. ✋ **PAUSA deployments a producción** — Risk es demasiado alto
2. 🔧 **Task force de seguridad** — Asignar 2-3 devs full-time
3. 📋 **Revertir a versión conocida estable** (último commit pre-hardening si es necesario) o aplicar parches P0
4. 🧪 **Audit de penetración independiente** — Después de remediación
5. 📚 **Security training** — Para el equipo de desarrollo
6. ✅ **Re-audit** — 2 semanas después de remediación completa

### Criterios para Reapertura de Producción:

- [ ] Todos los hallazgos P0 remediados y testeados
- [ ] Todos los hallazgos P1 remediados
- [ ] 50%+ de P2 remediados
- [ ] Risk Score < 40/100
- [ ] Audit de penetración independiente PASS
- [ ] Re-audit interno confirma remediaciones
- [ ] Ningún regresión detectada

---

## XI. LÍNEA BASE PARA AUDITORÍAS FUTURAS

### Métricas de Referencia

```json
{
  "audit_date": "2026-09-22",
  "commit": "d906cc0",
  "baseline": {
    "total_findings": 23,
    "critical": 11,
    "high": 8,
    "medium": 4,
    "risk_score": 87,
    "api_routes_affected": 13,
    "owasp_top_10": {
      "A01": 6,
      "A03": 4,
      "A07": 4,
      "A04": 3,
      "others": 6
    }
  },
  "next_audit_target": {
    "risk_score_target": "<40",
    "critical_target": "0",
    "high_target": "<3",
    "medium_target": "<2"
  }
}
```

### Matriz de Comparación Futura

Auditoría siguiente (prevista para Oct 22):
- Comparar contra estas 23 métricas
- Detectar regresiones (hallazgos que vuelven)
- Validar remediaciones (hallazgos que desaparecen)
- Identificar nuevas vulnerabilidades

---

## APÉNDICE: DOCUMENTOS GENERADOS

| Documento | Líneas | Hallazgos | Status |
|---|---|---|---|
| SECURITY_SCOPE.md | 315 | Scope definition | ✅ |
| ATTACK_SURFACE.md | 500 | 31 APIs inventoried | ✅ |
| THREAT_MODEL.md | 500+ | 31 threats identified | ✅ |
| SECURITY_MATRIX.md | 400 | 100 controls assessed | ✅ |
| SECURITY_FINDINGS.md | 600+ | 23 findings detailed | ✅ |
| SECURITY_BASELINE.md | THIS | 1 final assessment | ✅ |

**Total de Documentación:** 2400+ líneas de análisis integrado

---

**Auditoría Completa: SHORTLIST.GT — Sept 22, 2026**  
**Próxima Auditoría Programada:** Oct 22, 2026 (o cuando P0 remediaciones terminen)

**⚠️ ADVERTENCIA FINAL:** Este sistema está en estado CRÍTICO de seguridad. No es apto para producción. Implementar remediaciones inmediatamente.
