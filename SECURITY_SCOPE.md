# SECURITY_SCOPE.md — Definición de Alcance de Auditoría Maestra

**Generado:** 2026-09-22  
**Auditoría Maestra Integral — FASE 0**

---

## 1. IDENTIFICACIÓN EXACTA DEL PROYECTO

### Nombre
**SHORTLIST.GT** — Plataforma de Reclutamiento y Evaluación de Candidatos

### Ubicación Física
```
Raíz del Proyecto Web: C:\Users\gabri\Desktop\SHORTLIST\Plataforma Web RR.HH\shortlist-gt
Servicio Adicional: C:\Users\gabri\Desktop\SHORTLIST\shortlist-scoring-service
Directorio Padre: C:\Users\gabri\Desktop\SHORTLIST
```

### Repositorio Git
```
Remoto: https://github.com/javierdelaguila406/shortlist-gt
Rama Auditada: main (presumido por defecto)
Commit Actual (Esta Auditoría): d906cc02a37d5828d3e76f0538a236ef9258d9e8
Mensaje del Commit: "Security hardening sprint completion"
Fecha del Commit: 2026-09-22
```

### Versión en Producción
```
URL: https://shortlist-gt.vercel.app/
Plataforma: Vercel
Commit Desplegado: NO VERIFICADO — asumir que puede diferir del local
```

### Estado de Auditorías Previas
```
Auditoría QA Anterior: 20 de septiembre de 2026
Commit QA Anterior: 8d2990f0669b74d891400104dc6e6159b6fac701
Riesgo Encontrado: CRÍTICO (múltiples vulnerabilidades de autorización y secretos expuestos)
Hallazgos Anteriores: SEG-01 a SEG-17, OP-01 a OP-17, UI-01 a UI-11
Estado de Remediación: DESCONOCIDO — se han realizado commits posteriores sugiriendo trabajo de hardening
```

### Diferencia Entre Auditorías
```
Commits Entre Auditoría Anterior y Esta:
1. 9ad9480 - fix: address MEDIUM priority information disclosure and security header issues
2. 2fa7e6f - fix: resolve ISSUE #2, #3, #4 - docs with secrets, error exposure, rate limiting
3. 00f4345 - revert: restore 8 files to previous state (undo rate-limit changes)
4. d198dac - fix: resolve all 14 TypeScript compilation errors (ISSUE #5 RERUN)
5. d906cc0 - Security hardening sprint completion

Cambios Aparentes: Correcciones de seguridad, error handling, rate limiting
Cambios Desconocidos: Alcance exacto no verificado hasta esta auditoría
```

---

## 2. TECNOLOGÍA IDENTIFICADA

### Stack Principal (Plataforma Web RR.HH/shortlist-gt)

**Frontend:**
- Framework: Next.js 16.3.5
- Lenguaje: TypeScript 5.6.2
- Runtime: React 19.2.8
- Estilos: Tailwind CSS 3.4.1
- Validación: Zod 3.25.76

**Backend:**
- Plataforma: Next.js API Routes
- Lenguaje: TypeScript
- Runtime: Node.js (Vercel)

**Base de Datos:**
- Primary: Supabase PostgreSQL
- Variables:
  - `NEXT_PUBLIC_SUPABASE_URL`: Configurada
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Configurada
  - `SUPABASE_SERVICE_ROLE_KEY`: Configurada (sensible)

**Autenticación:**
- Tipo: Token JWT (via Supabase Auth)
- Método: Cookies + JWT en header
- Sesión: Almacenada via Supabase SSR

**Servicios Externos Identificados:**
- OpenAI API (procesamiento de evaluaciones)
- Supabase (autenticación, BD, storage)
- WhatsApp Business API (notificaciones)
- GoDaddy (gestión de dominios)
- MySQL2 (conectividad adicional — investigar)

### Stack Secundario (shortlist-scoring-service)

**Tipo:** Servicio Python independiente
**Archivos:**
- `app.py`: Aplicación Flask/similar
- `requirements.txt`: Dependencias Python
- `Procfile`: Configuración de despliegue (Heroku)
- `.git`: Repositorio Git independiente

**Relación con Aplicación Principal:** 
- **DESCONOCIDA** — Requiere investigación
- Posible scoring de candidatos via API RPC
- Posible webhook listener

---

## 3. IDENTIDAD DE USUARIOS Y ROLES IDENTIFICADOS

### Tipos de Usuarios
1. **Administrador**: Acceso total sistema, gestión de licencias
2. **Reclutador/HR**: Gestión de vacantes, evaluación de candidatos, reportes
3. **Candidato Registrado**: Postulación a vacantes, responder evaluaciones
4. **Candidato Anónimo**: Acceso público para postularse
5. **Empresa** (Tenant): Aislamiento de datos multiempresa

### Roles Identificados en Código
- Roles RBAC en middleware y API
- Ownership por empresa/usuario
- Posible escalamiento de privilegios (verificar)

---

## 4. DATOS SENSIBLES IDENTIFICADOS

### Datos Personales
- Nombres de candidatos
- Correos electrónicos
- Teléfonos
- CVs (documentos)
- Historiales de evaluación
- Scores/puntuaciones

### Datos de Empresa
- Información de reclutadores
- Vacantes activas
- Criterios de selección
- Resultados de evaluación

### Credenciales y Secretos
- Supabase Service Role Key (CRÍTICO)
- OpenAI API Key (CRÍTICO)
- JWT tokens (sessión)
- GitHub tokens (potencialmente en remoto)

---

## 5. SUPERFICIES DE ATAQUE IDENTIFICADAS PRELIMINARES

### Públicas
- Página de postulación: `/postular/[slug]`
- Landing page: `/`
- Términos/Privacidad: `/terminos`, `/privacidad`

### Autenticadas
- Dashboard reclutador: `/dashboard/reclutador`
- Gestión de vacantes: `/dashboard/vacantes`
- Evaluaciones: `/api/evaluaciones/*`
- Gestión de candidatos: `/api/candidatos/*`

### APIs Internas
- `/api/auth/*` — Autenticación
- `/api/vacantes/*` — Gestión de vacantes
- `/api/candidatos/*` — Gestión de candidatos
- `/api/evaluaciones/*` — Evaluaciones
- `/api/admin/*` — Funciones administrativas

### Potenciales
- Webhooks (WhatsApp, Supabase)
- WebSockets (realtime)
- Scheduled jobs / Cron jobs
- Service role operations

---

## 6. PUNTO DE ENTRADA TÉCNICO

### Middleware
- `middleware.ts`: Control de acceso por ruta
- Validación de tokens JWT
- Establecimiento de sesión

### APIs de Rutas Críticas
- `app/api/auth/` — Gestión de sesiones
- `app/api/evaluaciones/` — Procesamiento de evaluaciones
- `app/api/candidatos/` — Operaciones CRUD de candidatos
- `app/api/vacantes/` — Operaciones CRUD de vacantes
- `app/api/admin/` — Funciones administrativas

### Biblioteca de Utilities
- `lib/rate-limit.ts` — Control de tasa
- `lib/security-utils.ts` — Validación y encriptación
- `lib/audit-logger.ts` — Auditoría

---

## 7. ESTADO DE CONFIGURACIÓN

### Variables de Entorno Críticas
- `NEXT_PUBLIC_SUPABASE_URL`: Pública (OK)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Pública (OK)
- `SUPABASE_SERVICE_ROLE_KEY`: **SENSIBLE**
- `OPENAI_API_KEY`: **SENSIBLE**
- `ENCRYPTION_KEY`: **SENSIBLE**
- `ADMIN_SECRET_TOKEN`: **SENSIBLE**

### Archivos de Configuración
- `.env.example`: Plantilla de variables (verificar si contiene valores)
- `.env.local`: Variables locales (NO incluido en Git)
- `.env.production`: Variables de producción (verificar si diferente)

### Configuración de Seguridad
- `next.config.ts`: Headers de seguridad
- `middleware.ts`: Rutas públicas/protegidas
- `tailwind.config.ts`: Configuración de estilos

---

## 8. MATRIZ DE CONTROL INICIAL

| Componente | Verificable | Alcance | Prioridad |
|-----------|-----------|---------|-----------|
| Middleware de Autenticación | SÍ | Bloquear todo acceso anónimo a rutas privadas | P0 |
| Autorización por Empresa | SÍ | Empresa A no accede datos de Empresa B | P0 |
| Autorización por Usuario | SÍ | Usuario A no accede datos de Usuario B | P0 |
| Control de Acceso CRUD | SÍ | Operaciones limitadas a propietarios | P0 |
| Validación de Entradas | SÍ | SQL injection, XSS, command injection | P1 |
| Rate Limiting | SÍ | Prevención de abuso de APIs | P1 |
| Encriptación de Datos | SÍ | Datos sensibles cifrados en tránsito/reposo | P1 |
| Gestión de Secretos | SÍ | Secretos no expuestos en código/logs | P0 |
| Auditoría | SÍ | Rastreo de acciones críticas | P2 |
| Error Handling | SÍ | No expone detalles internos | P1 |
| HTTPS | PARTIAL | Validar en producción (Vercel) | P2 |
| CORS | SÍ | Configuración correcta | P1 |
| CSP Headers | SÍ | Mitigación de XSS | P2 |

---

## 9. CONVENCIONES DE ESTA AUDITORÍA

| Estado | Significado |
|--------|------------|
| **PASS** | Control verificado y cumplido |
| **FAIL** | Control verificado e incumplido |
| **UNKNOWN** | Control no determinable con información actual |
| **NOT_APPLICABLE** | Control no relevante para este componente |

| Severidad | CVSS | Definición |
|-----------|------|-----------|
| **CRITICAL** | 9.0-10.0 | RCE, auth bypass, exfiltración de datos masiva, activo explotable |
| **HIGH** | 7.0-8.9 | SQL injection, XSS almacenado, escalamiento de privilegios, IDOR confirmado |
| **MEDIUM** | 4.0-6.9 | XSS reflejado, CSRF, información sensible expuesta, rate limiting insuficiente |
| **LOW** | 1.0-3.9 | Información menor, errores verbosos, funcionalidad degradada |
| **INFORMATIONAL** | 0.0-0.9 | Recomendaciones, best practices, hallazgos no explotables |

---

## 10. RESTRICCIONES DURANTE LA AUDITORÍA

### Prohibido
- Modificar código durante la auditoría
- Enviar correos reales
- Enviar mensajes WhatsApp
- Cambiar configuración de producción
- Borrar datos reales
- Acceder a datos privados de usuarios reales
- Revocar credenciales sin autorización

### Permitido
- Auditoría estática de código
- Análisis de configuración
- Pruebas en staging/desarrollo
- Crear datos sintéticos de prueba (dos empresas de prueba)
- Análisis de lógica de autorización
- Pruebas de autenticación con credenciales de prueba

### Verificación
- Todas las vulnerabilidades deben tener pasos reproducibles
- Cada FAIL debe documentarse individualmente
- Causas raíz deben identificarse

---

## 11. SALIDA ESPERADA

Esta auditoría generará:

1. **ATTACK_SURFACE.md** — Inventario exhaustivo de endpoints y superficies
2. **THREAT_MODEL.md** — Modelo de amenazas multi-tenant
3. **SECURITY_MATRIX.md** — Matriz maestra de controles OWASP/CWE
4. **SECURITY_FINDINGS.md** — Todos los FAIL documentados
5. **SECURITY_BASELINE.md** — Línea base de seguridad
6. **REMEDIATION_PLAN.md** — Plan de corrección (Fase 2)

---

## 12. VALIDACIÓN DE FASE 0

- [x] Identificado proyecto exacto
- [x] Identificado commit actual
- [x] Identificada tecnología
- [x] Identificados datos sensibles
- [x] Identificadas restricciones
- [x] Definidas convenciones
- [ ] Iniciar FASE 1: ATTACK_SURFACE

**Estado:** LISTO PARA FASE 1

---

**Próximo Paso:** Generar ATTACK_SURFACE.md con inventario exhaustivo de todas las rutas, endpoints y superficies de ataque.
