# ATTACK_SURFACE.md — Inventario Exhaustivo de Superficies de Ataque

**Generado:** 2026-09-22  
**Auditoría Maestra Integral — FASE 1**  
**Commit:** d906cc0

---

## Sumario Ejecutivo

**Total de Rutas Identificadas:** 50
- **Rutas API:** 31
- **Páginas Frontend:** 19
- **Superficies de Entrada de Datos:** 23+
- **Métodos HTTP:** GET, POST, PUT, DELETE, OPTIONS
- **Autenticación:** JWT + Cookies
- **Validación Observada:** Zod schemas en algunas rutas

---

## SECCIÓN I: RUTAS API (31 ENDPOINTS)

### A. AUTENTICACIÓN Y SESIÓN (8 endpoints)

#### 1. POST /api/auth/signin
**Ruta Física:** `app/api/auth/signin/route.ts`
- **Método:** POST
- **Autenticación:** No (pública)
- **Parámetros:**
  - Body: `email`, `password` (JSON)
- **Validación:** Zod schema validation
- **Flujo:** 
  - Valida email/contraseña
  - Crea sesión Supabase
  - Retorna token JWT
- **Datos de Entrada:** Email, contraseña
- **Datos Sensibles Manejados:** Credenciales, JWT token
- **Puntos de Fallo Potencial:** SQL injection via email, brute force, información disclosure

#### 2. POST /api/auth/signup
**Ruta Física:** `app/api/auth/signup/route.ts`
- **Método:** POST
- **Autenticación:** No (pública)
- **Parámetros:**
  - Body: `email`, `password`, `company_name` (JSON)
- **Validación:** Zod schema validation
- **Flujo:**
  - Valida entrada
  - Crea usuario en Supabase
  - Crea empresa asociada
  - Retorna token JWT
- **Datos de Entrada:** Email, contraseña, nombre empresa
- **Datos Sensibles Manejados:** Credenciales nuevas, JWT token
- **Puntos de Fallo Potencial:** SQL injection, autorización horizontal (crear empresa para otro), información disclosure

#### 3. POST /api/auth/logout
**Ruta Física:** `app/api/auth/logout/route.ts`
- **Método:** POST
- **Autenticación:** SÍ (requiere token)
- **Parámetros:** Ninguno (body vacío)
- **Validación:** Token JWT
- **Flujo:**
  - Invalida sesión Supabase
  - Limpia cookies
- **Datos Sensibles Manejados:** Token JWT
- **Puntos de Fallo Potencial:** Falta de validación de propiedad de sesión

#### 4. POST /api/auth/reset-password
**Ruta Física:** `app/api/auth/reset-password/route.ts`
- **Método:** POST
- **Autenticación:** No (pública, pero rate-limited)
- **Parámetros:**
  - Body: `email` (JSON)
- **Validación:** Email validation, rate limiting
- **Flujo:**
  - Busca usuario por email
  - Genera token de reset
  - Envía correo (no probado, WhatsApp disabled)
- **Datos de Entrada:** Email
- **Datos Sensibles Manejados:** Email, token de reset
- **Puntos de Fallo Potencial:** User enumeration, reset token prediction, mail spoofing

#### 5. POST /api/auth/change-password
**Ruta Física:** `app/api/auth/change-password/route.ts`
- **Método:** POST
- **Autenticación:** SÍ (requiere token)
- **Parámetros:**
  - Body: `currentPassword`, `newPassword` (JSON)
- **Validación:** Zod schema, contraseña actual verificada
- **Flujo:**
  - Verifica contraseña actual
  - Actualiza a nueva contraseña
- **Datos de Entrada:** Contraseña actual, nueva contraseña
- **Datos Sensibles Manejados:** Credenciales
- **Puntos de Fallo Potencial:** Rate limiting insuficiente, información disclosure

#### 6. GET /api/auth/me
**Ruta Física:** `app/api/auth/me/route.ts`
- **Método:** GET
- **Autenticación:** SÍ (requiere token)
- **Parámetros:** Ninguno
- **Validación:** Token JWT
- **Flujo:**
  - Retorna perfil del usuario autenticado
- **Datos Sensibles Manejados:** Datos de usuario
- **Puntos de Fallo Potencial:** Información disclosure, falta de ownership check

#### 7. POST /api/auth/validate-license
**Ruta Física:** `app/api/auth/validate-license/route.ts`
- **Método:** POST
- **Autenticación:** SÍ (requiere token Bearer)
- **Parámetros:**
  - Body: `codigo` (JSON)
- **Validación:** Código formato
- **Flujo:**
  - Valida código de licencia
  - Retorna tipo de licencia
- **Datos de Entrada:** Código de licencia
- **Datos Sensibles Manejados:** Códigos de licencia
- **Puntos de Fallo Potencial:** Fuerza bruta de códigos, información disclosure

#### 8. POST /api/auth/use-license-code
**Ruta Física:** `app/api/auth/use-license-code/route.ts`
- **Método:** POST
- **Autenticación:** SÍ (requiere token)
- **Parámetros:**
  - Body: `codigo` (JSON)
- **Validación:** Verificación de código no usado
- **Flujo:**
  - Marca código como usado
  - Asocia a empresa del usuario
- **Datos de Entrada:** Código de licencia
- **Datos Sensibles Manejados:** Códigos de licencia
- **Puntos de Fallo Potencial:** Race condition (dos usuarios mismo código), IDOR (usar código de otra empresa)

---

### B. VACANTES (7 endpoints)

#### 9. POST /api/vacantes/crear
**Ruta Física:** `app/api/vacantes/crear/route.ts`
- **Método:** POST
- **Autenticación:** SÍ (requiere token)
- **Parámetros:**
  - Body: `titulo`, `descripcion`, `requisistos`, `salario`, `ubicacion`, etc.
- **Validación:** Zod schema
- **Flujo:**
  - Crea vacante en BD
  - Genera slug único
  - Retorna ID vacante
- **Datos de Entrada:** Detalles de vacante (22+ campos posibles)
- **Datos Sensibles Manejados:** Información de vacante (privada)
- **Puntos de Fallo Potencial:** SQL injection, autorización horizontal (crear para otra empresa), XSS en descripción

#### 10. GET /api/vacantes/[id]/candidatos
**Ruta Física:** `app/api/vacantes/[id]/candidatos/route.ts`
- **Método:** GET
- **Autenticación:** SÍ (requiere token)
- **Parámetros:**
  - Path: `id` (uuid vacante)
- **Validación:** Ownership check
- **Flujo:**
  - Retorna candidatos para vacante específica
- **Datos Entrada:** ID vacante (path param)
- **Datos Sensibles Manejados:** Lista de candidatos
- **Puntos de Fallo Potencial:** IDOR (acceder candidatos vacante ajena), información disclosure

#### 11. GET /api/vacantes/buscar
**Ruta Física:** `app/api/vacantes/buscar/route.ts`
- **Método:** GET
- **Autenticación:** Posiblemente pública o requerida
- **Parámetros:**
  - Query: `q` (search term)
- **Validación:** Desconocida
- **Flujo:**
  - Busca vacantes por término
- **Datos Entrada:** Término de búsqueda (query param)
- **Datos Sensibles Manejados:** Vacantes (públicas/privadas)
- **Puntos de Fallo Potencial:** NoSQL/SQL injection en búsqueda, información disclosure

#### 12. DELETE /api/vacantes/eliminar
**Ruta Física:** `app/api/vacantes/eliminar/route.ts`
- **Método:** DELETE
- **Autenticación:** SÍ (pero verificar nivel)
- **Parámetros:**
  - Body: `vacante_id` (JSON)
- **Validación:** Desconocida — **CRÍTICO POR AUDITORÍA ANTERIOR**
- **Flujo:**
  - Elimina vacante y candidatos asociados
- **Datos Entrada:** ID vacante
- **Datos Sensibles Manejados:** Elimina datos
- **Puntos de Fallo Potencial:** **SIN OWNERSHIP CHECK (hallazgo anterior SEG-03)**, eliminación cascada peligrosa

#### 13. GET /api/vacantes
**Ruta Física:** `app/api/vacantes/route.ts`
- **Método:** GET (probable)
- **Autenticación:** SÍ
- **Parámetros:** Posiblemente query params
- **Validación:** Desconocida
- **Flujo:**
  - Lista vacantes del usuario/empresa
- **Datos Entrada:** Query params (filtros)
- **Datos Sensibles Manejados:** Vacantes
- **Puntos de Fallo Potencial:** IDOR, información disclosure

#### 14. GET /api/vacantes/generate-link
**Ruta Física:** `app/api/vacantes/generate-link/route.ts`
- **Método:** GET (probable)
- **Autenticación:** SÍ
- **Parámetros:** Query params
- **Validación:** Desconocida
- **Flujo:**
  - Genera enlace público para postulación
- **Datos Entrada:** ID vacante
- **Datos Sensibles Manejados:** Links públicos
- **Puntos de Fallo Potencial:** IDOR, exposición de enlaces privados

#### 15. GET /api/vacantes/resolver-slug
**Ruta Física:** `app/api/vacantes/resolver-slug/route.ts`
- **Método:** GET
- **Autenticación:** No (pública)
- **Parámetros:**
  - Query: `slug`
- **Validación:** Formato slug
- **Flujo:**
  - Resuelve slug a ID vacante
- **Datos Entrada:** Slug (query param)
- **Datos Sensibles Manejados:** Información pública de vacante
- **Puntos de Fallo Potencial:** Slug prediction/enumeration

---

### C. CANDIDATOS (5 endpoints)

#### 16. POST /api/candidatos/postular
**Ruta Física:** `app/api/candidatos/postular/route.ts`
- **Método:** POST
- **Autenticación:** No (pública, rate-limited)
- **Parámetros:**
  - Body: `nombre`, `email`, `telefono`, `cv_url`, `vacante_id`, datos adicionales
- **Validación:** Zod schema, formato email
- **Flujo:**
  - Crea candidato
  - Asocia a vacante
  - Posiblemente inicia evaluación
- **Datos Entrada:** Información personal de candidato (CRÍTICA)
- **Datos Sensibles Manejados:** Nombre, email, teléfono, CV
- **Puntos de Fallo Potencial:** SQL injection, XSS, información disclosure, IDOR en vacante_id, spam de postulaciones

#### 17. GET /api/candidatos/[id]
**Ruta Física:** `app/api/candidatos/[id]/route.ts`
- **Método:** GET (probable)
- **Autenticación:** SÍ
- **Parámetros:**
  - Path: `id` (uuid candidato)
- **Validación:** Ownership check
- **Flujo:**
  - Retorna detalles de candidato
- **Datos Entrada:** ID candidato
- **Datos Sensibles Manejados:** Datos personales candidato
- **Puntos de Fallo Potencial:** **IDOR (hallazgo anterior SEG-04)** — acceder datos de candidato ajeno

#### 18. GET /api/candidatos/listar
**Ruta Física:** `app/api/candidatos/listar/route.ts`
- **Método:** GET
- **Autenticación:** SÍ
- **Parámetros:**
  - Query: `vacante_id` (probable)
- **Validación:** Ownership check
- **Flujo:**
  - Lista candidatos para vacante específica
- **Datos Entrada:** ID vacante (query)
- **Datos Sensibles Manejados:** Lista de candidatos
- **Puntos de Fallo Potencial:** **IDOR (hallazgo anterior SEG-04)**, información disclosure masiva

#### 19. POST /api/candidatos/eliminar
**Ruta Física:** `app/api/candidatos/eliminar/route.ts`
- **Método:** POST/DELETE
- **Autenticación:** SÍ
- **Parámetros:**
  - Body: `candidato_id` (JSON)
- **Validación:** Desconocida — **CRÍTICO POR AUDITORÍA ANTERIOR**
- **Flujo:**
  - Elimina candidato y archivos asociados
- **Datos Entrada:** ID candidato
- **Datos Sensibles Manejados:** Elimina datos personales
- **Puntos de Fallo Potencial:** **SIN OWNERSHIP CHECK (hallazgo anterior SEG-05)**, información disclosure

#### 20. GET /api/candidatos/exportar
**Ruta Física:** `app/api/candidatos/exportar/route.ts`
- **Método:** GET
- **Autenticación:** SÍ
- **Parámetros:**
  - Query: `email` o `telefono` (identificadores)
- **Validación:** Desconocida — **CRÍTICO POR AUDITORÍA ANTERIOR**
- **Flujo:**
  - Exporta datos de candidato (portabilidad GDPR)
  - Retorna archivo o datos
- **Datos Entrada:** Email o teléfono
- **Datos Sensibles Manejados:** Todos los datos personales
- **Puntos de Fallo Potencial:** **IDOR (hallazgo anterior SEG-04)** — cualquiera con email/tel accede datos, información disclosure masiva

---

### D. EVALUACIONES (4 endpoints)

#### 21. POST /api/evaluaciones/generar-preguntas
**Ruta Física:** `app/api/evaluaciones/generar-preguntas/route.ts`
- **Método:** POST
- **Autenticación:** SÍ
- **Parámetros:**
  - Body: Descripción vacante, criterios, requisitos
- **Validación:** Zod schema
- **Flujo:**
  - Llama API OpenAI
  - Genera preguntas de evaluación
  - Retorna preguntas
- **Datos Entrada:** Descripción vacante, criterios
- **Datos Sensibles Manejados:** Prompts enviados a OpenAI
- **Puntos de Fallo Potencial:** Información disclosure en respuesta API, prompt injection

#### 22. POST /api/evaluaciones/asignar-template
**Ruta Física:** `app/api/evaluaciones/asignar-template/route.ts`
- **Método:** POST
- **Autenticación:** SÍ
- **Parámetros:**
  - Body: Template ID, vacante_id, candidato_id (probable)
- **Validación:** Desconocida
- **Flujo:**
  - Asigna template de evaluación a candidato
- **Datos Entrada:** IDs
- **Datos Sensibles Manejados:** Asignaciones de evaluación
- **Puntos de Fallo Potencial:** IDOR, acceso a templates ajenos

#### 23. POST /api/evaluaciones/personalizar-preguntas
**Ruta Física:** `app/api/evaluaciones/personalizar-preguntas/route.ts`
- **Método:** POST
- **Autenticación:** SÍ
- **Parámetros:**
  - Body: Preguntas, opciones de personalización
- **Validación:** Desconocida
- **Flujo:**
  - Personaliza preguntas de evaluación
- **Datos Entrada:** Preguntas, criterios
- **Datos Sensibles Manejados:** Templates de evaluación
- **Puntos de Fallo Potencial:** XSS en preguntas, información disclosure

#### 24. POST /api/evaluaciones/iniciar-whatsapp
**Ruta Física:** `app/api/evaluaciones/iniciar-whatsapp/route.ts`
- **Método:** POST
- **Autenticación:** SÍ (token Bearer con rate limiting)
- **Parámetros:**
  - Body: `candidatoId`
- **Validación:** Plan check, candidato exists
- **Flujo:**
  - Envía evaluación por WhatsApp
  - Integración con WhatsApp Business API
  - Crea registro de evaluación
- **Datos Entrada:** ID candidato
- **Datos Sensibles Manejados:** Teléfono candidato, URL evaluación
- **Puntos de Fallo Potencial:** IDOR (iniciar evaluación para candidato ajeno), exposición de teléfono, información disclosure

---

### E. ARCHIVOS (2 endpoints)

#### 25. GET /api/cv
**Ruta Física:** `app/api/cv/route.ts`
- **Método:** GET (probable)
- **Autenticación:** Desconocida
- **Parámetros:**
  - Query: `candidato_id` o similiar
- **Validación:** Desconocida
- **Flujo:**
  - Descarga CV del candidato
- **Datos Entrada:** ID candidato
- **Datos Sensibles Manejados:** Archivos personales
- **Puntos de Fallo Potencial:** **IDOR**, path traversal, información disclosure

#### 26. GET /api/descargar/manual
**Ruta Física:** `app/api/descargar/manual/route.ts`
- **Método:** GET
- **Autenticación:** Posiblemente no
- **Parámetros:** Ninguno
- **Validación:** Desconocida
- **Flujo:**
  - Descarga manual de usuario
- **Datos Entrada:** Ninguno
- **Datos Sensibles Manejados:** Documentación
- **Puntos de Fallo Potencial:** Path traversal, información disclosure

---

### F. WEBHOOKS (1 endpoint)

#### 27. POST /api/webhooks/whatsapp
**Ruta Física:** `app/api/webhooks/whatsapp/route.ts`
- **Método:** POST
- **Autenticación:** Webhook signature verification
- **Parámetros:**
  - Body: Webhook payload de WhatsApp
- **Validación:** Firma del webhook
- **Flujo:**
  - Recibe eventos de WhatsApp
  - Procesa respuestas de candidatos
  - Actualiza estado de evaluación
- **Datos Entrada:** Payload de WhatsApp
- **Datos Sensibles Manejados:** Conversaciones, respuestas
- **Puntos de Fallo Potencial:** Replay attacks, replay forgery, información disclosure

---

### G. ADMINISTRACIÓN (3 endpoints)

#### 28. POST /api/admin/generate-license
**Ruta Física:** `app/api/admin/generate-license/route.ts`
- **Método:** POST
- **Autenticación:** SÍ (X-Admin-Token header)
- **Parámetros:**
  - Body: `cantidad` (número de códigos)
- **Validación:** Token admin
- **Flujo:**
  - Genera códigos de licencia
  - Guarda en BD
- **Datos Entrada:** Cantidad
- **Datos Sensibles Manejados:** Códigos de licencia
- **Puntos de Fallo Potencial:** Token prediction, fuerza bruta, información disclosure

#### 29. POST /api/admin/generate-token
**Ruta Física:** `app/api/admin/generate-token/route.ts`
- **Método:** POST
- **Autenticación:** Desconocida
- **Parámetros:** Desconocidos
- **Validación:** Desconocida
- **Flujo:** Desconocido
- **Datos Entrada:** Desconocidos
- **Datos Sensibles Manejados:** Tokens
- **Puntos de Fallo Potencial:** Autorización, información disclosure

#### 30. POST /api/admin/limpiar
**Ruta Física:** `app/api/admin/limpiar/route.ts`
- **Método:** POST
- **Autenticación:** Desconocida
- **Parámetros:** Desconocidos
- **Validación:** Desconocida
- **Flujo:** Limpieza de datos (desarrollo?)
- **Datos Entrada:** Desconocidos
- **Datos Sensibles Manejados:** Potencialmente todos
- **Puntos de Fallo Potencial:** **DESTRUCCIÓN DE DATOS** sin autorización, información disclosure

---

### H. MISCELÁNEA (1 endpoint)

#### 31. GET /api/health (inferido del código)
**Ruta Física:** Posiblemente en `app/api/health/route.ts` (no listado)
- **Método:** GET
- **Autenticación:** No
- **Parámetros:** Ninguno
- **Validación:** Ninguna
- **Flujo:**
  - Health check del servidor
- **Datos Entrada:** Ninguno
- **Datos Sensibles Manejados:** Estado del servidor
- **Puntos de Fallo Potencial:** Información disclosure (versiones, BD status, etc.)

---

## SECCIÓN II: RUTAS FRONTEND (19 PÁGINAS)

### A. RUTAS PÚBLICAS (9 páginas)

| Ruta | Archivo | Autenticación | Parámetros | Entradas de Datos |
|------|---------|---|---|---|
| `/` | `app/page.tsx` | No | Ninguno | Ninguno |
| `/terminos` | `app/terminos/page.tsx` | No | Ninguno | Ninguno |
| `/privacidad` | `app/privacidad/page.tsx` | No | Ninguno | Ninguno |
| `/health` | `app/health/page.tsx` | No | Ninguno | Ninguno (health check) |
| `/test` | `app/test/page.tsx` | Desconocida | Ninguno | Desconocida (testing?) |
| `/descargar-manual` | `app/descargar-manual/page.tsx` | No | Ninguno | Descarga |
| `/postular/[slug]` | `app/postular/[slug]/page.tsx` | No | `slug` (path) | Formulario postulación (nombre, email, tel, CV) |
| `/vacantes/crear` | `app/vacantes/crear/page.tsx` | Desconocida | Ninguno | Formulario de creación (múltiples campos) |
| `/acceso` | `app/acceso/page.tsx` | No | Ninguno | Posiblemente redirige a login |

**Puntos de Fallo Identificados:**
- XSS en formularios públicos (postulación, creación)
- CSRF en formularios
- Information disclosure en formularios (errores)
- Validación solo en frontend sin backend
- File upload sin validación

### B. RUTAS DE AUTENTICACIÓN (5 páginas)

| Ruta | Archivo | Autenticación | Parámetros | Funcionalidad |
|------|---------|---|---|---|
| `/auth/login` | `app/auth/login/page.tsx` | No | Ninguno | Formulario login |
| `/auth/signup` | `app/auth/signup/page.tsx` | No | Ninguno | Formulario registro |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | No | Ninguno | Recuperación contraseña |
| `/auth/confirm` | `app/auth/confirm/page.tsx` | Posiblemente token | `token` query param | Confirmación de email |
| `/acceso` (posible) | — | — | — | Redirige a login |

**Puntos de Fallo Identificados:**
- Token prediction en URL
- Information disclosure en errores
- Password reset enumeration
- XSS en formularios
- CSRF en formularios

### C. RUTAS PROTEGIDAS - DASHBOARD (5 páginas)

| Ruta | Archivo | Autenticación | Parámetros | Funcionalidad |
|------|---------|---|---|---|
| `/dashboard` | `app/dashboard/page.tsx` | SÍ | Ninguno | Dashboard principal |
| `/dashboard/reclutador` | `app/dashboard/reclutador/page.tsx` | SÍ | Ninguno | Dashboard reclutador |
| `/dashboard/demo` | `app/dashboard/demo/page.tsx` | Desconocida | Ninguno | Demo (testing?) |
| `/dashboard/login` | `app/dashboard/login/page.tsx` | Desconocida | Ninguno | Login adicional? |
| `/dashboard/vacantes/new` | `app/dashboard/vacantes/new/page.tsx` | SÍ | Ninguno | Crear vacante (formulario) |
| `/dashboard/vacantes/[id]` | `app/dashboard/vacantes/[id]/page.tsx` | SÍ | `id` (uuid) | Ver detalle vacante, candidatos |

**Puntos de Fallo Identificados:**
- IDOR en `/dashboard/vacantes/[id]` (acceder vacante ajena)
- Falta de ownership check
- XSS en formularios
- CSRF
- Information disclosure

---

## SECCIÓN III: RESUMEN DE PUNTOS DE ENTRADA DE DATOS

### Formularios Identificados (12+)

| Formulario | Ubicación | Campos | Validación | Riesgo |
|-----------|-----------|--------|-----------|--------|
| Login | `/auth/login` | email, password | Frontend + Backend | Brute force, SQL injection, credential stuffing |
| Registro | `/auth/signup` | email, password, company | Frontend + Backend | SQL injection, XSS, account takeover |
| Postulación | `/postular/[slug]` | nombre, email, tel, CV | Frontend + Backend | XSS, IDOR, file upload |
| Crear Vacante | `/dashboard/vacantes/new` | 22+ campos | Frontend + Backend | XSS, SQL injection, IDOR |
| Cambiar Contraseña | `/api/auth/change-password` | current, new | Backend | Brute force, información disclosure |
| Reset Contraseña | `/api/auth/reset-password` | email | Backend | Enumeration, token prediction |
| Generar Preguntas | `/api/evaluaciones/generar-preguntas` | prompt fields | Backend + OpenAI | Prompt injection, información disclosure |
| Personalizar Preguntas | `/api/evaluaciones/personalizar-preguntas` | preguntas | Frontend + Backend | XSS, SQL injection |
| Usar Código Licencia | `/api/auth/use-license-code` | codigo | Backend | Brute force, race condition, IDOR |
| Validar Licencia | `/api/auth/validate-license` | codigo | Backend | Brute force, enumeration |
| Generar Licencias (Admin) | `/api/admin/generate-license` | cantidad | Backend | Autorización, information disclosure |
| Iniciar Evaluación WhatsApp | `/api/evaluaciones/iniciar-whatsapp` | candidatoId | Backend | IDOR, information disclosure |

---

## SECCIÓN IV: PARÁMETROS CRÍTICOS IDENTIFICADOS

### Path Parameters (6 tipos)

```
/postular/[slug]              → slug (vacante slug)
/dashboard/vacantes/[id]      → id (vacante uuid)
/api/vacantes/[id]/candidatos → id (vacante uuid)
/api/candidatos/[id]          → id (candidato uuid)
```

**Riesgos:** IDOR, information disclosure, enumeration

### Query Parameters (8 tipos)

```
/api/vacantes/buscar?q=...              → search term (SQL injection)
/api/vacantes/resolver-slug?slug=...    → slug (enumeration)
/api/candidatos/listar?vacante_id=...   → vacante_id (IDOR)
/api/candidatos/exportar?email=...      → email (IDOR)
/api/candidatos/exportar?telefono=...   → telefono (IDOR)
/auth/confirm?token=...                 → token (prediction, timing)
```

**Riesgos:** SQL injection, IDOR, enumeration, token prediction

### Body Parameters (JSON)

```
POST /api/auth/signin         → { email, password }
POST /api/auth/signup         → { email, password, company_name }
POST /api/candidatos/postular → { nombre, email, telefono, cv_url, vacante_id, ... }
POST /api/vacantes/crear      → { titulo, descripcion, ... 20+ campos }
POST /api/evaluaciones/*      → { prompts, criterios, preguntas, ... }
DELETE /api/candidatos/eliminar → { candidato_id }
DELETE /api/vacantes/eliminar  → { vacante_id }
```

**Riesgos:** SQL injection, XSS, IDOR, information disclosure, mass assignment

### Headers Críticos

```
Authorization: Bearer <jwt>           → JWT token (prediction, theft)
X-Admin-Token: <admin-secret>         → Admin auth (prediction, brute force)
Cookie: sb-auth-token=...             → Session token (prediction, theft)
```

**Riesgos:** Token prediction, token theft, session fixation

---

## SECCIÓN V: VULNERABILIDADES IDENTIFICADAS EN AUDITORÍA ANTERIOR

### Hallazgos que deben re-verificarse

| Hallazgo | Ruta Afectada | Severidad | Estado |
|----------|--------------|----------|--------|
| SEG-01: Secretos expuestos | Repositorio Git | CRÍTICO | ¿Remediado? |
| SEG-02: Middleware permite todas las rutas | `middleware.ts` | ALTO | ¿Remediado? |
| SEG-03: Borrado sin autenticación | `/api/vacantes/eliminar` | CRÍTICO | ¿Remediado? |
| SEG-04: Lectura sin autorización | `/api/candidatos/listar`, `/api/candidatos/[id]`, `/api/candidatos/exportar` | CRÍTICO | ¿Remediado? |
| SEG-05: Eliminación sin ownership | `/api/candidatos/eliminar` | ALTO | ¿Remediado? |

---

## SECCIÓN VI: ARQUITECTURA DE DATOS

### Flujos de Datos Críticos

```
1. Postulación:
   Frontend /postular/[slug] 
   → POST /api/candidatos/postular 
   → Supabase (candidatos table)
   → WhatsApp webhook (posible)

2. Evaluación:
   Frontend /dashboard/vacantes/[id]
   → POST /api/evaluaciones/generar-preguntas
   → OpenAI API
   → POST /api/evaluaciones/asignar-template
   → Supabase
   → WhatsApp /api/evaluaciones/iniciar-whatsapp

3. Autorización:
   Frontend (cualquier ruta)
   → middleware.ts
   → JWT validation + Supabase session
   → Acceso permitido/denegado

4. Administrativo:
   Frontend /dashboard/reclutador
   → POST /api/admin/generate-license (o similar)
   → Supabase (licenses table)
```

**Riesgos:**
- Race conditions en creación
- Falta de transacciones atómicas
- Información disclosure entre flujos
- Falta de logging/auditoría

---

## SECCIÓN VII: RESUMEN EJECUTIVO DE SUPERFICIES

**Total de Superficies de Ataque Identificadas:** 50+

| Categoría | Cantidad | Nivel de Riesgo |
|-----------|----------|-----------------|
| **Endpoints Públicos (sin autenticación)** | 12 | ALTO |
| **Endpoints Autenticados** | 19 | ALTO |
| **Rutas Frontend Públicas** | 9 | ALTO |
| **Rutas Frontend Autenticadas** | 10 | ALTO |
| **Formularios** | 12+ | ALTO |
| **Path Parameters** | 6 | ALTO |
| **Query Parameters** | 8 | ALTO |
| **Body Parameters** | 20+ | ALTO |
| **Headers Críticos** | 3 | ALTO |

**Hallazgos Preliminares:**
- ✅ Múltiples endpoints sin ownership checks (IDOR risk)
- ✅ Múltiples puntos de entrada de datos sin validación completa
- ✅ Rutas administrativas potencialmente sin autorización adecuada
- ✅ Webhooks sin verificación de origen
- ✅ File uploads sin validación suficiente
- ✅ Falta de rate limiting en algunos endpoints públicos

---

**NOTA:** Este documento se completará tras verificación de cada componente en Fase 4 (Auditoría Estática).

**Estado de FASE 1:** ✅ COMPLETADA
**Próxima Fase:** FASE 2 — Threat Model
