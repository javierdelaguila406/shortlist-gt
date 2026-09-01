# 🔑 Credenciales de Demo - SHORTLIST.GT

**IMPORTANTE**: Estas son credenciales para **testing local únicamente**. No usar en producción.

---

## 🧪 Testing Local

### Método 1: Crear Cuenta Nueva

Accede a http://localhost:3000/auth/signup y crea una cuenta:

```
Nombre: Tu Nombre
Email: tumail@example.com
Contraseña: Test123!@
Confirmar: Test123!@
```

**Requisitos:**
- Email válido (se puede usar fake)
- Contraseña mínimo 8 caracteres
- Base de datos Supabase configurada

---

### Método 2: Usar Credenciales Demo (Sin BD)

Si quieres probar la interfaz sin Supabase configurado:

```
Email: demo@shortlist.gt
Contraseña: Demo123!@Test
```

**Limitaciones:**
- No guarda datos (solo UI)
- No crea usuario real
- Úsalo solo para UI testing

---

## 🚀 Flujo de Testing Completo

### Paso 1: Setup Local

```bash
# Terminal 1: Instalar y compilar
cd "C:\Users\gabri\Desktop\Plataforma Web RR.HH\shortlist-gt"
npm install
npm run build

# Verificar compilación exitosa
# Build time: 643ms
# TypeScript errors: 0
```

### Paso 2: Configurar Supabase (Opcional pero Recomendado)

```bash
# 1. Crear proyecto en https://supabase.com
# 2. En SQL Editor → New Query
# 3. Copiar contenido de supabase/schema.sql
# 4. Ejecutar (Cmd+Enter)
# 5. Copiar URL y keys

# 6. Actualizar .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Paso 3: Iniciar Dev Server

```bash
# Terminal 2: Dev server
npm run dev

# Esperar mensaje:
# ▲ Next.js 16.3.4 (Turbopack)
# - Environments: .env.local
# ✓ Ready in 1234ms
```

### Paso 4: Testing de Rutas Públicas

```
✅ Homepage:        http://localhost:3000
✅ Landing Cand.:   http://localhost:3000/postular/test
✅ Login:           http://localhost:3000/auth/login
✅ Signup:          http://localhost:3000/auth/signup
```

### Paso 5: Testing de Autenticación

```
1. Ir a http://localhost:3000/auth/signup
2. Crear cuenta:
   - Nombre: Test User
   - Email: test@example.com
   - Contraseña: Test123!
3. Clickear "Crear Cuenta"
4. Esperar redirección a /auth/login
5. Ingresar credenciales
6. Deberías ser redirigido a /dashboard
```

### Paso 6: Testing de Dashboard

```
1. Una vez en /dashboard deberías ver:
   - ✅ Header con tu nombre
   - ✅ Estadísticas (0 vacantes, 0 candidatos)
   - ✅ Botón "Nueva Vacante"
   - ✅ Botón "Cerrar Sesión"

2. Crear vacante:
   - Clickear "Nueva Vacante"
   - Ir a /dashboard/vacantes/new
   - Llenar formulario:
     * Título: Senior React Developer
     * Slug: (auto-generado)
     * Descripción: Test job
     * Departamento: Desarrollo
   - Clickear "Crear Vacante"

3. Debe redirigirse a /dashboard/vacantes/[id]
   - Deberías ver detalles de la vacante
   - Opción de volver
```

### Paso 7: Testing de Formulario Candidatos

```
1. Crear vacante (paso anterior)
2. Compartir enlace público:
   http://localhost:3000/postular/senior-react-developer
   
3. En incógnito/nueva ventana, acceder al enlace
4. Llenar formulario:
   - Nombre: Juan Pérez
   - Email: juan@example.com
   - Teléfono: +502 7123 4567
   - Disponibilidad: Inmediata
   - Salario: Q 45,000 - Q 50,000
   - CV: Subir PDF cualquiera

5. Clickear "Enviar Solicitud"
6. Deberías ver mensaje de éxito
```

---

## 🔌 Testing de API Endpoints

### Test 1: Get Vacantes

```bash
# Suponiendo que tienes token después de login
TOKEN="tu_access_token_aqui"

curl -X GET http://localhost:3000/api/vacantes \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
# {
#   "vacantes": [
#     { id, titulo, slug, estado, ... }
#   ]
# }
```

### Test 2: Create Vacante

```bash
TOKEN="tu_access_token_aqui"

curl -X POST http://localhost:3000/api/vacantes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "DevOps Engineer",
    "slug": "devops-engineer",
    "descripcion": "Test",
    "departamento": "Infraestructura"
  }'

# Respuesta esperada: 201
# { "vacante": { id, titulo, ... }, "message": "..." }
```

### Test 3: Get Candidatos

```bash
TOKEN="tu_access_token_aqui"
VACANTE_ID="uuid_de_vacante"

curl -X GET http://localhost:3000/api/vacantes/$VACANTE_ID/candidatos \
  -H "Authorization: Bearer $TOKEN"

# Respuesta esperada:
# {
#   "candidatos": [...],
#   "stats": { total, en_whatsapp, aprobados, rechazados }
# }
```

### Test 4: Update Candidato

```bash
TOKEN="tu_access_token_aqui"
CANDIDATO_ID="uuid_de_candidato"

curl -X PATCH http://localhost:3000/api/candidatos/$CANDIDATO_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "estado": "aprobado" }'

# Respuesta esperada: 200
# { "candidato": { id, estado: "aprobado", ... } }
```

---

## 🧪 Testing de Validaciones

### Form Validation

```
✅ Nombre vacío → "Nombre es requerido"
✅ Email inválido → "Email inválido"
✅ Contraseña < 8 → "Mínimo 8 caracteres"
✅ Contraseñas no coinciden → "Las contraseñas no coinciden"
✅ Email duplicado → "Email ya registrado"
```

### API Validation

```
✅ Sin Authorization header → 401 "No authorization header"
✅ Token inválido → 401 "Unauthorized"
✅ Usuario diferente → 401 "Unauthorized"
✅ Campos faltantes → 400 "Missing required fields"
✅ Estado inválido → 400 "Invalid estado"
```

---

## 📊 Estado de la BD Esperado (Después de Testing)

### Tabla usuarios
```
1 registro: Test User (test@example.com)
```

### Tabla vacantes
```
1 registro: Senior React Developer (si creaste vacante)
```

### Tabla candidatos
```
1 registro: Juan Pérez (si enviaste postulación)
```

---

## 🚨 Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `supabaseUrl is required` | Falta .env.local | Copiar .env.example a .env.local |
| `Cannot find module` | Falta npm install | Ejecutar `npm install` |
| `Port 3000 in use` | Otro servicio usa 3000 | Cambiar port: `npm run dev -- -p 3001` |
| `Unauthorized 401` | Token inválido/faltante | Verificar header Authorization |
| `Cannot POST /api/vacantes` | Método no permitido | Usar POST, no GET |
| `Email already exists` | Usuario duplicado | Usar email diferente |
| `SyntaxError in schema.sql` | Error SQL | Verificar sintaxis del archivo |

---

## ✅ Checklist de Testing Completo

```
[ ] Compilación sin errores (npm run build)
[ ] Homepage carga correctamente
[ ] Página de signup accesible
[ ] Crear usuario exitosamente
[ ] Login con credenciales correctas
[ ] Dashboard muestra nombre de usuario
[ ] Crear vacante desde dashboard
[ ] Ver vacante creada en lista
[ ] Acceder a formulario de postulación
[ ] Enviar postulación con CV
[ ] Ver candidato en dashboard
[ ] Cambiar estado de candidato
[ ] Cerrar sesión funciona
[ ] Redireccionamiento automático funciona
[ ] API endpoints retornan datos correctos
[ ] Validaciones funcionan
[ ] Errores se muestran correctamente
```

---

## 📱 Testing Mobile

Para probar en mobile:

```bash
# Usar IP local en lugar de localhost
# En otra máquina/móvil:
# http://[tu_ip_local]:3000

# O usar device emulation en browser:
# F12 → Toggle device toolbar (Ctrl+Shift+M)
# Probar en iPhone/Pixel presets
```

---

## 🎯 Casos de Uso Principales

### Caso 1: Reclutador Nuevo
```
1. Acceder a /auth/signup
2. Registrarse
3. Ir a /dashboard (vacío)
4. Crear primera vacante
5. Compartir enlace /postular/[slug] con candidatos
```

### Caso 2: Candidato
```
1. Recibir enlace /postular/[slug]
2. Llenar formulario
3. Subir CV
4. Enviar postulación
5. (Próximamente) Recibir WhatsApp con preguntas
```

### Caso 3: Evaluación
```
1. Reclutador ve candidatos en dashboard
2. Ve score de CV, video, test
3. Puede cambiar estado (aprobado/rechazado/oferta)
4. Sistema guarda la decisión
```

---

## 📋 Información Importante

⚠️ **LOCAL ONLY**: Estas credenciales son para development local únicamente

⚠️ **RESET DB**: Si necesitas empezar de nuevo:
```bash
# En Supabase console:
# 1. Ir a SQL Editor
# 2. DROP TABLE usuarios CASCADE;
# 3. Ejecutar schema.sql nuevamente
```

⚠️ **BACKUP**: Antes de cambios grandes, guardar respaldo de datos

---

## 🎉 Ready to Test!

Ahora puedes:
1. Ejecutar `npm run dev`
2. Acceder a http://localhost:3000
3. Crear usuario y cuenta
4. Probar toda la plataforma

**¡Buena suerte con el testing!** 🚀

---

*Documentación de Demo - SHORTLIST.GT*  
*Actualizado: 1 de Septiembre, 2026*
