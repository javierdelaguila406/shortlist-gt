# 🔒 Guía de Seguridad - SHORTLIST.GT

## Vulnerabilidades Corregidas

### ✅ Pilar 1: Validación Estricta de Inputs
- **Archivo:** `lib/validations.ts`
- **Cambios:**
  - ✓ Schema Zod para email, teléfono (+502...), contraseñas
  - ✓ Validación de archivos PDF (máx 5MB)
  - ✓ Sanitización de inputs en formularios
  - ✓ Implementado en: `/api/candidatos/postular`, `/api/cv`

### ✅ Pilar 2: Rate Limiting y Bloqueos
- **Archivo:** `lib/rate-limit.ts`
- **Límites implementados:**
  - `/api/candidatos/postular`: 5 solicitudes por IP / 15 minutos
  - `/api/cv`: 20 análisis por IP / 10 minutos
  - `/auth/login`: 10 intentos / 15 minutos (implementar en auth)
  - `/auth/signup`: 3 registros / 1 hora (implementar en auth)
- **Respuesta:** HTTP 429 (Too Many Requests) con `Retry-After` header

### ✅ Pilar 3: Autenticación y Gestión de Sesiones
- **Archivo:** `middleware.ts`
- **Cambios:**
  - ✓ Middleware de autenticación en rutas protegidas
  - ✓ Verificación de token en cookies (`sb-auth-token`)
  - ✓ Redirección a `/auth/login` si no hay sesión
  - ✓ Protege: `/dashboard/*`, `/api/candidatos/eliminar`, `/api/vacantes`
- **Nota:** Supabase Auth maneja hashing de contraseñas (bcrypt/argon2)

### ✅ Pilar 4: Mensajes de Error Controlados
- **Cambios en todas las rutas API:**
  - ✓ `/api/candidatos/postular` - Errores genéricos
  - ✓ `/api/cv` - Sin exposición de stack traces
  - ✓ `/api/candidatos/eliminar` - Logs internos solo
- **Patrón:**
  ```typescript
  console.error('[SECURITY] Error:', { error, stack, timestamp });
  return NextResponse.json(
    { error: 'Ocurrió un error. Intenta más tarde.' },
    { status: 500 }
  );
  ```

### ✅ Pilar 5: Headers de Seguridad HTTP
- **Archivo:** `next.config.ts`
- **Headers agregados:**
  - `X-Frame-Options: SAMEORIGIN` (prevenir clickjacking)
  - `X-Content-Type-Options: nosniff` (prevenir MIME sniffing)
  - `X-XSS-Protection: 1; mode=block` (XSS en navegadores antiguos)
  - `Content-Security-Policy` (CSP)
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (bloquear cámara, micrófono, geolocalización)

---

## VULNERABILIDADES CRÍTICAS CORREGIDAS

### 🔴 1. Credenciales Expuestas en Repositorio
**Antes:** `.env.local` con `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` visibles
**Después:**
- ✓ Archivo `.env.local` incluido en `.gitignore`
- ✓ Crear `.env.local` desde `.env.example`
- ✓ Implementar en CI/CD: usar GitHub Secrets o Vercel Environment

**Acción requerida:**
```bash
# NO commitar credenciales
git rm --cached .env.local
# Crear archivo local
cp .env.example .env.local
# Actualizar con credenciales reales
```

### 🔴 2. `/api/candidatos/eliminar` sin Autenticación
**Antes:** Cualquiera podía eliminar datos de cualquier candidato con solo el ID/teléfono
**Después:**
- ✓ Requiere Bearer token en header `Authorization: Bearer <token>`
- ✓ Verifica identidad con Supabase Auth
- ✓ Rechaza solicitudes no autenticadas (401)
- ✓ Logs de auditoría con IP y timestamp

### 🔴 3. Falta de Validación de Inputs
**Antes:** Aceptaba datos sin validar
**Después:**
- ✓ Email validado con RFC 5322
- ✓ Teléfono validado con formato internacional (+502XXXXXXXX)
- ✓ Archivos PDF validados (tipo MIME + tamaño máximo)
- ✓ Contraseñas con requisitos mínimos

### 🔴 4. Exposición de Errores Internos
**Antes:** Stack traces y detalles de OpenAI al cliente
**Después:**
- ✓ Errores internos solo en logs del servidor
- ✓ Mensajes genéricos al cliente
- ✓ Nunca exponer nombres de tablas, rutas, APIs

### 🔴 5. Sin Rate Limiting
**Antes:** Posibilidad de DDoS, spam, costos innecesarios en OpenAI
**Después:**
- ✓ Rate limiter implementado en `lib/rate-limit.ts`
- ✓ Límites por IP en rutas públicas
- ✓ Respuestas HTTP 429 con `Retry-After`

---

## Checklist de Seguridad Adicional

### Base de Datos (Supabase)
- [ ] Verificar RLS (Row Level Security) en tabla `candidatos`
- [ ] Usuarios solo ven sus propios registros
- [ ] Reclutadores solo ven candidatos de sus plazas

### Autenticación (Supabase Auth)
- [ ] Deshabilitar email confirmation si no es necesario (o implementar en `/auth/confirm`)
- [ ] Implementar 2FA (two-factor authentication)
- [ ] Session timeout: 1 hora de inactividad

### WhatsApp Cloud API
- [ ] Validar webhook tokens
- [ ] Encriptar credenciales (WHATSAPP_ACCESS_TOKEN)
- [ ] Implementar rate limiting en `/api/webhooks/whatsapp`

### Deployment (Vercel)
- [ ] Variables de entorno: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` en Secrets
- [ ] NO incluir `.env.local` en deploy
- [ ] Habilitar HTTPS (automático en Vercel)
- [ ] Monitorear logs para intentos de acceso no autorizados

### GDPR / Privacidad
- [ ] Implementar "derecho al olvido" en `/api/candidatos/eliminar`
- [ ] Logs de auditoría de todas las operaciones
- [ ] Política de privacidad en `/`
- [ ] Consentimiento explícito para procesar CVs con OpenAI

---

## Archivos Modificados

| Archivo | Cambio | Tipo |
|---------|--------|------|
| `lib/validations.ts` | **Creado** | Validación Zod |
| `lib/rate-limit.ts` | **Creado** | Rate Limiting |
| `middleware.ts` | **Creado** | Autenticación |
| `app/api/candidatos/postular/route.ts` | Actualizado | Validación + Rate Limiting |
| `app/api/cv/route.ts` | Actualizado | Validación + Errores seguros |
| `app/api/candidatos/eliminar/route.ts` | **CRÍTICO** | Autenticación + Auditoría |
| `next.config.ts` | Actualizado | Security Headers |

---

## Testing de Seguridad

### 1. Probar Rate Limiting
```bash
# Ejecutar 6 postulaciones en rápida sucesión
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/candidatos/postular \
    -F "nombre=Test" -F "email=test@test.com" \
    -F "telefono=+50212345678" -F "slug=demo" \
    -F "cv=@test.pdf"
done
# La 6ta debe retornar 429 Too Many Requests
```

### 2. Probar Validación de Email
```bash
curl -X POST http://localhost:3000/api/candidatos/postular \
  -F "nombre=Test" -F "email=invalido" \
  -F "telefono=+50212345678" -F "slug=demo" \
  -F "cv=@test.pdf"
# Debe retornar error de validación
```

### 3. Probar Autenticación en /api/candidatos/eliminar
```bash
curl -X DELETE http://localhost:3000/api/candidatos/eliminar \
  -H "Content-Type: application/json" \
  -d '{"id":"test-id"}'
# Debe retornar 401 Unauthorized

# Con token válido
curl -X DELETE http://localhost:3000/api/candidatos/eliminar \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{"id":"test-id"}'
```

---

## Próximos Pasos

1. **URGENTE:** Renovar todas las credenciales en `.env`:
   - Crear nuevo API key en OpenAI
   - Crear nuevo token en Supabase
   - Generar nuevo token de WhatsApp

2. Implementar rate limiting en `/auth/login` y `/auth/signup`

3. Audit de RLS en Supabase:
   - `candidatos` table
   - `vacantes` table
   - `evaluaciones` table

4. Implementar monitoreo:
   - Alertas de múltiples 401s (intentos de acceso no autorizados)
   - Logs centralizados (Sentry, LogRocket, etc.)

5. HTTPS + HSTS (Strict-Transport-Security header)
