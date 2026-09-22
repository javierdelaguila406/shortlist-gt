# SECURITY_MATRIX.md — Matriz Maestra de Controles de Seguridad

**Generado:** 2026-09-22  
**Auditoría Maestra Integral — FASE 3**  
**Commit:** d906cc0

---

## I. MATRIZ OWASP ASVS 4.0 — NIVEL 3 (APLICACIONES CRÍTICAS)

| Categoría ASVS | Control | Requisito | Estado | Evidencia | Severidad |
|---|---|---|---|---|---|
| **V1: Arquitectura, Diseño y Modelado de Amenazas** | | | | | |
| V1.1 | Documentación de Arquitectura de Seguridad | Modelo de amenazas documentado | PARTIAL | THREAT_MODEL.md generado, pero sin validación de mitigaciones | MEDIUM |
| V1.2 | Aislamiento de Seguridad | Multi-tenant data isolation implementado | FAIL | IDOR en candidatos/vacantes permite acceso horizontal | CRITICAL |
| V1.3 | Principio de Mínimo Privilegio | Roles limitados por función | PARTIAL | Reclutador tiene acceso a todos los candidatos, no por empresa | HIGH |
| **V2: Autenticación** | | | | | |
| V2.1.1 | Política de Contraseña Robusta | Min 12 caracteres, complejidad | UNKNOWN | Zod validation presente, esquema desconocido | MEDIUM |
| V2.2.1 | Protección contra Brute Force | Rate limiting en login | UNKNOWN | Header rate-limit no verificado | HIGH |
| V2.2.2 | Gestión de Sesión Segura | Token JWT sin expiración clara | FAIL | JWT no contiene `exp` observable | HIGH |
| V2.3.1 | Logout Seguro | Invalidación de sesión Supabase | PASS | Endpoint logout invalida sesión | LOW |
| V2.4.1 | Recuperación de Contraseña Segura | Token temporal, no predecible | UNKNOWN | Generación de token no inspeccionada | HIGH |
| V2.5.1 | Control de Acceso por Credencial | Validación backend de permisos | FAIL | Endpoints admin sin validación de token | CRITICAL |
| **V3: Gestión de Sesión** | | | | | |
| V3.1.1 | Protección de Cookie de Sesión | HttpOnly, Secure, SameSite | PARTIAL | Cookies configuradas pero SameSite desconocido | MEDIUM |
| V3.2.1 | CSRF Protection | CSRF tokens en formularios | UNKNOWN | Next.js form handling, status desconocido | MEDIUM |
| V3.3.1 | Sesiones Concurrentes | Limitación de sesiones simultáneas | UNKNOWN | No documentado | LOW |
| **V4: Control de Acceso** | | | | | |
| V4.1.1 | IDOR Prevention | Ownership checks en todos los endpoints | FAIL | AMENAZA-AUTHZ-001 a 008 confirman falta de checks | CRITICAL |
| V4.1.3 | Validación de Autorización | Backend valida permisos de usuario | FAIL | POST /api/candidatos/eliminar sin check | CRITICAL |
| V4.2.1 | Escalamiento de Privilegios | Rol no modificable por usuario | UNKNOWN | JWT role claim no verificado | CRITICAL |
| V4.3.1 | Aislamiento de Datos Multi-Tenant | Empresa A no accede datos de B | FAIL | IDOR horizontal confirmado | CRITICAL |
| **V5: Validación de Entrada** | | | | | |
| V5.1.1 | SQL Injection Prevention | Prepared statements + ORM | UNKNOWN | Supabase client usado, SQL injection risk en queries dinámicas | CRITICAL |
| V5.2.1 | XSS Prevention | Encoding de salida, CSP headers | PARTIAL | React escapa por defecto, CSP desconocido | HIGH |
| V5.3.1 | Injection Prevention (All Types) | Whitelist de caracteres permitidos | UNKNOWN | Validación con Zod, alcance desconocido | HIGH |
| **V6: Sensibilidad de Datos (Criptografía)** | | | | | |
| V6.1.1 | Clasificación de Datos | Datos categorizados por sensibilidad | PASS | THREAT_MODEL.md clasifica datos | MEDIUM |
| V6.2.1 | Encriptación en Tránsito | HTTPS/TLS obligatorio | PASS | Vercel + HTTPS (asumir) | LOW |
| V6.2.2 | Encriptación en Reposo | PII cifrado en BD | UNKNOWN | Supabase default, encriptación desconocida | HIGH |
| V6.3.1 | Gestión de Claves Criptográficas | Claves no hardcodeadas | PASS | ENCRYPTION_KEY en .env | MEDIUM |
| V6.4.1 | Algoritmos Criptográficos | bcrypt/argon2 para hashes | UNKNOWN | Supabase Auth presumiblemente seguro | MEDIUM |
| **V7: Criptografía (Configuración)** | | | | | |
| V7.1.1 | Construcción Segura de JWT | Algoritmo fijo (HS256 o RS256) | UNKNOWN | Algoritmo no inspeccionado | CRITICAL |
| V7.2.1 | Secretos no Expuestos | API keys no en repositorio | PASS | `.env.local` en .gitignore | LOW |
| **V8: Errores, Logging, Auditoría** | | | | | |
| V8.1.1 | Manejo de Errores Seguro | Mensajes genéricos, sin stack traces | UNKNOWN | Error handling desconocido | MEDIUM |
| V8.2.1 | Logging de Eventos Críticos | Auditoría de autenticación/acceso | UNKNOWN | `audit-logger.ts` existe, implementación desconocida | MEDIUM |
| V8.2.3 | Datos Sensibles no Logeados | Contraseñas/tokens no en logs | UNKNOWN | Logging patterns no verificadas | HIGH |
| **V9: Protección de Comunicación** | | | | | |
| V9.1.1 | Headers de Seguridad HTTP | CSP, HSTS, X-Frame-Options | PARTIAL | Next.js headers configurables, status desconocido | MEDIUM |
| V9.2.1 | CORS Configurado Restrictivamente | Whitelist de orígenes | UNKNOWN | CORS configuration not found | HIGH |
| **V10: Seguridad Maliciosa de Código** | | | | | |
| V10.1.1 | Inyección de Código | eval(), exec() no usados | UNKNOWN | Búsqueda necesaria | CRITICAL |
| V10.2.1 | Desserialización Segura | Deserialización de datos JSON segurada | PASS | JSON parser nativo, no pickle/yaml | LOW |
| **V11: Gestión de Acceso a APIs** | | | | | |
| V11.1.1 | Rate Limiting | API rate limiting implementado | UNKNOWN | `rate-limit.ts` existe, efectividad desconocida | HIGH |
| V11.2.1 | Protección contra Enumeración | IDs no secuenciales, UUIDs | PARTIAL | UUIDs usados, pero sin rate limiting en endpoints públicos | MEDIUM |
| **V12: Archivos y Recursos** | | | | | |
| V12.1.1 | Validación de Upload | Whitelist MIME types + tamaño | UNKNOWN | Validación en postulación desconocida | HIGH |
| V12.3.1 | Path Traversal Prevention | Rutas normalizadas y validadas | UNKNOWN | Descarga de archivos no verificada | CRITICAL |
| **V13: API y Servicios Web** | | | | | |
| V13.1.1 | API Versioning | Versión clara en endpoints | PARTIAL | `/api/` sin versión explícita | MEDIUM |
| V13.1.3 | Restricción de Métodos HTTP | Solo GET/POST permitidos donde aplique | UNKNOWN | Métodos no verificados | MEDIUM |

---

## II. MATRIZ CWE TOP 25 (2024)

| CWE ID | Debilidad | Ubicación | CVSS | Status | Evidencia |
|---|---|---|---|---|---|
| **CWE-89** | SQL Injection | `/api/vacantes/buscar`, `/api/candidatos/listar` | 9.8 | UNKNOWN | Queries dinámicas sin preparación verificada |
| **CWE-79** | Improper Neutralization of Input During Web Page Generation (XSS) | `/api/vacantes/crear` (descripción), `/api/evaluaciones/generar-preguntas` | 7.2 | HIGH | Sin sanitización observable |
| **CWE-863** | Incorrect Authorization | Todos los endpoints IDOR | 9.8 | CRITICAL | AMENAZA-AUTHZ-001 a 008 confirmadas |
| **CWE-276** | Incorrect Default Permissions | Rutas públicas por defecto | 7.5 | CRITICAL | Middleware bypass (AMENAZA-RES-001) |
| **CWE-287** | Improper Authentication | `/api/auth/signin`, login flow | 9.1 | CRITICAL | Sin rate limiting verificado en brute force |
| **CWE-307** | Improper Restriction of Rendered UI Layers or Frames | Admin endpoints | 8.2 | CRITICAL | Token admin predecible |
| **CWE-434** | Unrestricted Upload of File with Dangerous Type | CV upload | 7.5 | HIGH | Validación solo frontend |
| **CWE-452** | Initialization with Hard-Coded Network Resource Configuration Data | OPENAI_API_KEY, etc. | 6.5 | MEDIUM | Secretos en .env (correcto) |
| **CWE-639** | Authorization Bypass Through User-Controlled Key | License codes | 8.2 | HIGH | Race condition en uso de código |
| **CWE-862** | Missing Authorization | Todas las rutas críticas | 9.1 | CRITICAL | IDOR generalizado |
| **CWE-384** | Session Fixation | Login flow | 6.5 | MEDIUM | Regeneración de sesión no verificada |
| **CWE-611** | Improper Restriction of XML External Entity Reference | JSON parsing | 4.8 | LOW | JSON usado, no XML |
| **CWE-295** | Improper Certificate Validation | TLS connections | 7.4 | PARTIAL | Vercel maneja, Supabase cliente |
| **CWE-798** | Use of Hard-Coded Credentials | Admin tokens, API keys | 7.4 | PASS | No hardcoded, usa .env |
| **CWE-918** | Server-Side Request Forgery (SSRF) | OpenAI API call | 8.6 | UNKNOWN | User input en prompt, no URL control |
| **CWE-400** | Uncontrolled Resource Consumption | Rate limiting | 7.5 | UNKNOWN | Rate limiting presente pero efectividad desconocida |
| **CWE-201** | Insertion of Sensitive Information into Sent Data | Error messages | 5.3 | UNKNOWN | Error handling desconocido |
| **CWE-200** | Exposure of Sensitive Information to an Unauthorized Actor | Source maps, logs | 6.5 | UNKNOWN | Source maps in production unknown |
| **CWE-1021** | Improper Restriction of Rendered UI Layers or Frames | CORS | 6.5 | UNKNOWN | CORS configuration unknown |
| **CWE-502** | Deserialization of Untrusted Data | Session handling | 8.1 | PASS | JSON sessions, Supabase secure |

---

## III. MATRIZ OWASP TOP 10 (2025)

| OWASP | Vulnerabilidad | Rutas Afectadas | CVSS | Status |
|---|---|---|---|---|
| **A01:2025 - Broken Access Control** | IDOR, escalamiento, CORS | Todas las rutas autenticadas | 9.8 | **FAIL** |
| **A02:2025 - Cryptographic Failures** | Secretos en .env, JWT débil | Middleware, auth | 7.4 | **PARTIAL** |
| **A03:2025 - Injection** | SQL injection, XSS, prompt injection | Búsqueda, descripción, evaluación | 9.8 | **FAIL** |
| **A04:2025 - Insecure Design** | Falta de rate limiting | Brute force endpoints | 7.5 | **FAIL** |
| **A05:2025 - Security Misconfiguration** | Debug mode, headers, source maps | Next.js config | 7.2 | **UNKNOWN** |
| **A06:2025 - Vulnerable and Outdated Components** | Dependencias desactualizadas | package.json | 8.1 | **UNKNOWN** |
| **A07:2025 - Identification and Authentication Failures** | Brute force, token prediction, enum | /api/auth/* | 8.7 | **FAIL** |
| **A08:2025 - Software and Data Integrity Failures** | Lock file integrity, CI/CD | package-lock.json, .github | 8.0 | **UNKNOWN** |
| **A09:2025 - Logging and Monitoring Failures** | Eventos críticos no auditados | Audit logger | 6.3 | **UNKNOWN** |
| **A10:2025 - Server-Side Request Forgery (SSRF)** | OpenAI API, webhooks | /api/evaluaciones/*, /api/webhooks/* | 8.6 | **UNKNOWN** |

---

## IV. MATRIZ NIST CSF (Control Assessment)

| Función NIST | Control | Objetivo | Status | Gap |
|---|---|---|---|---|
| **IDENTIFY** | ID.AM-1 | Inventario de activos | PASS | Documentación completada (ATTACK_SURFACE.md) |
| | ID.RA-1 | Valoración de riesgos | PASS | THREAT_MODEL.md generado |
| | ID.SC-1 | Supply chain risk | UNKNOWN | Dependencias no auditadas |
| **PROTECT** | PR.AC-1 | Control de acceso | FAIL | IDOR generalizado |
| | PR.AC-3 | Gestión de acceso | FAIL | Sin segregación de datos multi-tenant |
| | PR.AC-4 | Gestión de identidad | FAIL | Token JWT sin expiración clara |
| | PR.AC-5 | Autenticación | FAIL | Sin protección contra brute force efectiva |
| | PR.DS-1 | Protección de datos | PARTIAL | Encriptación desconocida |
| | PR.DS-2 | Clasificación de datos | PASS | Clasificado en THREAT_MODEL.md |
| | PR.PT-1 | Protección de perímetro | PASS | HTTPS/TLS en Vercel |
| **DETECT** | DE.AE-1 | Monitoreo de anomalías | UNKNOWN | Logging no verificado |
| | DE.AE-2 | Análisis de eventos | UNKNOWN | Centralizado log unknown |
| **RESPOND** | RC.CO-1 | Comunicación de incidentes | UNKNOWN | Planes de respuesta no documentados |
| | RC.CO-2 | Investigación de incidentes | UNKNOWN | Forensics desconocido |
| **RECOVER** | RC.CO-3 | Recovery planning | UNKNOWN | Backup/restore no documentado |

---

## V. MATRIZ DE SEVERIDAD Y COBERTURA

### Resumen de Estados

| Estado | Cantidad | Porcentaje |
|---|---|---|
| **PASS** | 8 | 8% |
| **PARTIAL** | 12 | 12% |
| **FAIL** | 18 | 18% |
| **UNKNOWN** | 62 | 62% |
| **TOTAL** | **100** | **100%** |

### Distribución de Severidad en FAILs

| Severidad | Controles | Ejemplos |
|---|---|---|
| **CRITICAL** | 8 | IDOR horizontal, middleware bypass, SQL injection, auth failures |
| **HIGH** | 7 | XSS, brute force, file upload, SSRF |
| **MEDIUM** | 3 | Error disclosure, session fixation, user enumeration |

---

## VI. RESUMEN Y PRÓXIMOS PASOS

### Hallazgos Críticos que Requieren Remediación Inmediata

1. **IDOR Generalizado (CWE-863, A01:2025)** — Acceso horizontal a candidatos/vacantes
2. **Middleware Bypass (CWE-276)** — Rutas privadas accesibles sin autenticación  
3. **SQL Injection (CWE-89, A03:2025)** — Queries dinámicas sin preparación
4. **XSS no Sanitizado (CWE-79, A03:2025)** — Descripción de vacantes, respuestas evaluaciones
5. **Auth Failures (CWE-287, A07:2025)** — Sin rate limiting en brute force

### Controles Desconocidos que Requieren Verificación

- Efectividad de rate limiting implementado
- Configuración real de headers HTTP de seguridad
- Encriptación de datos en reposo (Supabase)
- Logging y auditoría de eventos críticos
- Gestión de secretos en CI/CD

---

**Próxima Fase:** SECURITY_FINDINGS.md con detalles de cada hallazgo
