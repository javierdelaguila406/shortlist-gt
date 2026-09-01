# 🗺️ Mapa de Rutas y Flujos - SHORTLIST.GT

---

## 📍 Rutas Disponibles (Fase 2)

### 🌐 Rutas Públicas (Sin Autenticación)

```
GET  /                          ┌─ Homepage Premium
                                │  - Hero section
                                │  - Features
                                │  - Tech stack
                                │  - CTA
                                └─ Footer

GET  /auth/login               ┌─ Página Login
                               │  - Email input
                               │  - Password input
                               │  - Submit button
                               │  - Link a signup
                               └─ Error handling

GET  /auth/signup              ┌─ Página Signup
                               │  - Name input
                               │  - Email input
                               │  - Password inputs
                               │  - Validation
                               │  - Link a login
                               └─ Success redirect

GET  /postular/[slug]          ┌─ Landing Candidatos
                               │  - Formulario candidato
                               │  - CV upload (dropzone)
                               │  - Datos personales
                               │  - Disponibilidad
                               └─ Success message

GET  /api/webhooks/whatsapp    ┌─ Webhook Verification
                               │  - GET: verify token
                               │  - Retorna: hub.challenge
                               └─ Meta validation

POST /api/webhooks/whatsapp    ┌─ Webhook Handler
                               │  - Recibe eventos WhatsApp
                               │  - Procesa mensajes
                               │  - Guarda en BD
                               └─ Response 200

POST /api/candidatos/postular  ┌─ Postulación API
                               │  - Recibe form data
                               │  - Guarda CV
                               │  - Crea candidato
                               │  - Dispara WhatsApp
                               └─ Response 201

POST /api/cv                   ┌─ CV Analysis API
                               │  - OpenAI processing
                               │  - Extrae competencias
                               │  - Calcula score
                               └─ JSON response
```

### 🔒 Rutas Protegidas (Requieren Autenticación)

```
GET  /dashboard                ┌─ Dashboard Principal
                               │  - Stats (vacantes, candidatos)
                               │  - Lista de vacantes
                               │  - Botón nueva vacante
                               │  - Logout button
                               └─ ProtectedRoute guard

GET  /dashboard/vacantes/new   ┌─ Crear Vacante
                               │  - Form campos vacante
                               │  - Slug auto-generation
                               │  - Validación
                               │  - Submit → POST /api/vacantes
                               └─ Redirect a vacante

GET  /dashboard/vacantes/[id]  ┌─ Detalle Vacante
                               │  - Info vacante (mock data)
                               │  - Top 3 candidatos
                               │  - Lista completa candidatos
                               │  - Detalle candidato seleccionado
                               │  - Scores y medallas
                               └─ Actions (agendar, oferta)
```

---

## 🔗 API Endpoints (FASE 2)

### 📤 POST Endpoints

```
POST /api/vacantes
├─ Authorization: Bearer token (required)
├─ Body:
│  ├─ titulo (required)
│  ├─ slug (required)
│  ├─ descripcion (optional)
│  ├─ departamento (optional)
│  ├─ salario_minimo (optional)
│  └─ salario_maximo (optional)
├─ Return: 201 { vacante, message }
└─ Errors: 400/401/500

POST /api/candidatos/postular
├─ FormData:
│  ├─ nombre (required)
│  ├─ email (required)
│  ├─ telefono (required)
│  ├─ disponibilidad (required)
│  ├─ salario (optional)
│  ├─ slug (required)
│  └─ cv (File, PDF)
├─ Return: 201 { candidato, message }
└─ Errors: 400/404/500

POST /api/cv
├─ Body:
│  ├─ cvText (required)
│  ├─ jobDescription (required)
│  └─ candidatoId (required)
├─ OpenAI Processing
├─ Return: 200 { analysis }
└─ Errors: 400/500

POST /api/webhooks/whatsapp
├─ Body: WebhookEvent
├─ Process:
│  ├─ Text messages
│  ├─ Videos
│  └─ Status updates
├─ Return: 200 { success }
└─ Save: logs_whatsapp table
```

### 📥 GET Endpoints

```
GET /api/vacantes
├─ Authorization: Bearer token (required)
├─ Query: (ninguno)
├─ Return: 200 { vacantes[] }
└─ Errors: 401/500

GET /api/vacantes/[id]/candidatos
├─ Authorization: Bearer token (required)
├─ Params: id (vacante)
├─ Validates: Ownership
├─ Return: 200 { candidatos[], stats }
└─ Errors: 401/404/500

GET /api/candidatos/[id]
├─ Authorization: Bearer token (required)
├─ Params: id (candidato)
├─ Validates: Ownership
├─ Return: 200 { candidato }
└─ Errors: 401/404/500
```

### 🔧 PATCH Endpoints

```
PATCH /api/candidatos/[id]
├─ Authorization: Bearer token (required)
├─ Params: id (candidato)
├─ Body: { estado }
├─ Validates: Ownership + Valid estado
├─ Return: 200 { candidato, message }
└─ Errors: 400/401/404/500
```

---

## 🔀 Flujos de Usuario

### Flujo 1️⃣: Reclutador Registrarse y Crear Vacante

```
┌─ Usuario abre /
│
├─ Clickea "Acceder"
│  └─ Redirect: /auth/login
│
├─ No tiene cuenta
│  └─ Clickea "Regístrate aquí"
│     └─ Redirect: /auth/signup
│
├─ Completa formulario (nombre, email, password)
│  ├─ Validación local (password >= 8)
│  └─ Submit → supabase.auth.signUp()
│     ├─ Crea auth user
│     ├─ Crea usuarios record
│     └─ Status: "success"
│
├─ Redirect automático: /auth/login
│  └─ Mensaje: "Registrado exitosamente"
│
├─ Ingresa credenciales
│  └─ Submit → supabase.auth.signInWithPassword()
│     ├─ Valida credenciales
│     ├─ Retorna session
│     └─ Hook useAuth() actualiza
│
├─ Redirect automático: /dashboard
│
├─ Ve texto: "Bienvenido, [nombre]"
│  ├─ Estadísticas: 0 vacantes, 0 candidatos
│  └─ Botón: "Nueva Vacante"
│
├─ Clickea "Nueva Vacante"
│  └─ Redirect: /dashboard/vacantes/new
│
├─ Completa formulario:
│  ├─ Título: "Senior React Developer"
│  ├─ Slug: "senior-react-developer" (auto)
│  ├─ Descripción: "..."
│  ├─ Departamento: "Desarrollo"
│  ├─ Salario: "45000 - 50000"
│  └─ Ubicación: "Guatemala"
│
├─ Clickea "Crear Vacante"
│  └─ POST /api/vacantes (con Bearer token)
│     ├─ Validación de headers (auth)
│     ├─ Validación de campos (titulo, slug)
│     ├─ INSERT vacantes table
│     └─ Return: 201 { vacante }
│
├─ Redirect automático: /dashboard/vacantes/[id]
│
└─ Ve detalle vacante:
   ├─ Título: "Senior React Developer"
   ├─ Estado: "activa"
   ├─ Enlace público: /postular/senior-react-developer
   ├─ Número de candidatos: 0
   └─ Botón: "Compartir enlace"

[FIN FLUJO 1]
```

### Flujo 2️⃣: Candidato Postularse

```
┌─ Candidato recibe link
│  └─ /postular/senior-react-developer
│
├─ Abre en browser
│  └─ GET /postular/[slug]
│     └─ Carga formulario
│
├─ Completa formulario:
│  ├─ Nombre: "Juan Pérez"
│  ├─ Email: "juan@example.com"
│  ├─ Teléfono: "+502 7123 4567"
│  ├─ Disponibilidad: "Inmediata"
│  ├─ Expectativa salarial: "Q 45,000 - Q 50,000"
│  └─ CV: [arrastrar PDF]
│
├─ Validación local:
│  ├─ ✓ Todos campos requeridos
│  ├─ ✓ CV es PDF
│  └─ ✓ Teléfono válido
│
├─ Clickea "Enviar Solicitud"
│  └─ POST /api/candidatos/postular (FormData)
│     ├─ Validación servidor:
│     │  ├─ ✓ Campos requeridos
│     │  ├─ ✓ Vacante existe
│     │  └─ ✓ CV es PDF válido
│     ├─ Salvar CV en /public/uploads
│     ├─ INSERT candidatos table
│     ├─ Llamar WhatsApp API (próximo)
│     └─ Return: 201 { candidato }
│
├─ Response success
│  ├─ Mensaje: "✅ Solicitud Recibida!"
│  ├─ "Te contactaremos por WhatsApp"
│  └─ Auto-redirección en 3s
│
├─ (Próximo) Webhook WhatsApp:
│  ├─ POST /api/webhooks/whatsapp
│  ├─ Envía mensaje: "Hola, recibimos tu postulación..."
│  ├─ Paso 1: Confirmación (Sí/No)
│  ├─ Paso 2: Grabación de videos
│  ├─ Paso 3: Preguntas de test
│  └─ Guarda respuestas en evaluaciones_whatsapp
│
└─ Reclutador ve candidato en dashboard

[FIN FLUJO 2]
```

### Flujo 3️⃣: Reclutador Evalúa Candidato

```
┌─ Reclutador en /dashboard
│  └─ Clickea vacante
│     └─ GET /dashboard/vacantes/[id]
│
├─ Ve lista de candidatos:
│  ├─ Candidatos ordenados por score_total
│  ├─ Top 3 con medallas (🥇🥈🥉)
│  └─ Badges de disponibilidad
│
├─ Clickea candidato
│  └─ Se carga detalle en panel derecho
│
├─ Ve información:
│  ├─ Nombre: "Juan Pérez"
│  ├─ Teléfono: "+502 7123 4567"
│  ├─ Radial Gauge: Score total (95/100)
│  ├─ Desglose: CV 92, Video 98, Test 95
│  ├─ Disponibilidad: "Inmediata"
│  ├─ Expectativa: "Q 45,000 - Q 50,000"
│  ├─ Grid de videos (2-3 videos)
│  └─ Botones: "Agendar Entrevista", "Hacer Oferta"
│
├─ Cambiar estado:
│  ├─ Dropdown: [Pendiente, En Revisión, Aprobado, Rechazado, Oferta]
│  │
│  └─ Selecciona "Aprobado"
│     └─ PATCH /api/candidatos/[id]
│        ├─ Validación:
│        │  ├─ ✓ User autenticado
│        │  ├─ ✓ Candidato existe
│        │  ├─ ✓ User es propietario
│        │  └─ ✓ Estado válido
│        ├─ UPDATE candidatos
│        │  └─ estado = "aprobado"
│        └─ Return: 200 { candidato }
│
├─ UI actualiza:
│  ├─ Badge cambia a verde
│  ├─ Confirmación: "Estado actualizado ✓"
│  └─ Score sigue visible
│
└─ Reclutador puede:
   ├─ Ver siguiente candidato
   ├─ Hacer oferta
   ├─ Agendar entrevista (próximo)
   └─ Rechazar candidato

[FIN FLUJO 3]
```

---

## 🔐 Flujo de Seguridad

```
Cliente Hace Request
│
├─ Authorization: Bearer eyJ...
│  └─ Headers
│
└─ API Endpoint
   │
   ├─ Verificar header presente
   │  ├─ ✓ → continuar
   │  └─ ✗ → 401 "No authorization header"
   │
   ├─ Extraer token
   │  └─ token = header.replace('Bearer ', '')
   │
   ├─ Validar con Supabase
   │  └─ supabase.auth.getUser(token)
   │     ├─ ✓ Válido → userData, user.id
   │     └─ ✗ Inválido → 401 "Unauthorized"
   │
   ├─ Verificar Ownership (para POST/PATCH)
   │  └─ SELECT * WHERE usuario_id = user.id
   │     ├─ ✓ Propietario → proceder
   │     └─ ✗ No propietario → 401 "Unauthorized"
   │
   ├─ Validar datos del request
   │  ├─ ✓ Válidos → proceder
   │  └─ ✗ Inválidos → 400 "Missing required fields"
   │
   └─ Ejecutar operación
      ├─ INSERT/UPDATE/SELECT
      ├─ Return: 200/201 { data }
      └─ Log en auditoría (próximo)
```

---

## 🔄 Ciclo de Vida del Componente useAuth()

```
App Monta
│
├─ useEffect ejecuta
│  │
│  ├─ supabase.auth.getSession()
│  │  └─ Lee sesión existente
│  │
│  ├─ SI sesión válida:
│  │  ├─ SELECT usuarios WHERE id = user.id
│  │  └─ setUser(userData)
│  │
│  ├─ SI no hay sesión:
│  │  └─ setUser(null)
│  │
│  └─ Listener onAuthStateChange()
│     ├─ "SIGNED_IN" → setUser(userData)
│     ├─ "SIGNED_OUT" → setUser(null)
│     ├─ "USER_UPDATED" → setUser(updated)
│     └─ "PASSWORD_RECOVERY" → manejo
│
└─ Return:
   ├─ user: { id, email, nombre, rol }
   ├─ loading: boolean
   └─ isAuthenticated: !!user
```

---

## 📊 Diagrama de Relaciones BD

```
usuarios (1)
  │
  ├─ (N) vacantes
  │   │
  │   └─ (N) candidatos
  │       │
  │       ├─ (N) evaluaciones_whatsapp
  │       │   └─ (N) logs_whatsapp
  │       │
  │       └─ (N) archivos_cv
  │
  └─ (N) logs_whatsapp (próximamente)

RLS Policies:
- usuarios: select/update self only
- vacantes: CRUD only owner
- candidatos: read/update only from owner's vacantes
- evaluaciones: read/update only from owner's vacantes
- archivos_cv: similar a candidatos
- logs: similar a evaluaciones
```

---

## 🎯 Resumen de Rutas y Flujos

| Ruta | Método | Auth | Propósito | Status |
|------|--------|------|-----------|--------|
| `/` | GET | ❌ | Homepage | ✅ Listo |
| `/auth/login` | GET | ❌ | Login page | ✅ Listo |
| `/auth/signup` | GET | ❌ | Signup page | ✅ Listo |
| `/postular/[slug]` | GET | ❌ | Form candidatos | ✅ Listo |
| `/dashboard` | GET | ✅ | Dashboard main | ✅ Listo |
| `/dashboard/vacantes/new` | GET | ✅ | Create vacante | ✅ Listo |
| `/dashboard/vacantes/[id]` | GET | ✅ | View vacante | ✅ Listo |
| `POST /api/vacantes` | POST | ✅ | Create vacante | ✅ Listo |
| `GET /api/vacantes` | GET | ✅ | List mis vacantes | ✅ Listo |
| `GET /api/vacantes/[id]/candidatos` | GET | ✅ | List candidatos | ✅ Listo |
| `GET /api/candidatos/[id]` | GET | ✅ | Get candidato | ✅ Listo |
| `PATCH /api/candidatos/[id]` | PATCH | ✅ | Update candidato | ✅ Listo |
| `POST /api/candidatos/postular` | POST | ❌ | Create candidato | ✅ Listo |
| `POST /api/cv` | POST | ❌ | Analyze CV | ✅ Listo |
| `POST /api/webhooks/whatsapp` | POST | ❌ | WhatsApp events | ✅ Listo |

---

*Mapa de Rutas y Flujos - SHORTLIST.GT FASE 2*  
*Actualizado: 1 de Septiembre, 2026*
