# Sistema de Licencias - SETUP

## 📋 RESUMEN

SHORTLIST.GT ahora tiene un sistema de licencias con dos planes:

```
PLAN DEMO (Gratuito):
├─ Vacantes: 1 máximo
├─ Candidatos: 1 máximo
├─ Evaluaciones WhatsApp: 1 máximo
└─ Features: Ver plantilla, crear vacante, ver candidatos

PLAN PREMIUM (Pago):
├─ Vacantes: Ilimitadas
├─ Candidatos: Ilimitados
├─ Evaluaciones WhatsApp: Ilimitadas
└─ Features: Todas disponibles
```

---

## 🔧 PASO 1: EJECUTAR MIGRACIÓN EN SUPABASE

### A. Abrir Supabase SQL Editor

1. Ir a: https://app.supabase.com
2. Seleccionar tu proyecto
3. Ir a **SQL Editor** (izquierda)
4. Hacer clic en **+ New Query**

### B. Copiar y ejecutar el SQL

Copiar el contenido de:
```
shortlist-gt/migrations/create_license_system.sql
```

Y pegarlo en el SQL Editor de Supabase. Luego hacer clic en **▶️ Run**.

Esto creará:
- ✅ Tabla `license_codes` - almacena códigos de licencia
- ✅ Tabla `companies` - almacena plan de cada usuario
- ✅ Índices y RLS policies para seguridad

---

## 🔑 PASO 2: GENERAR CÓDIGOS DE LICENCIA

### Opción A: API Admin (Recomendado)

1. En tu terminal, ejecutar:

```bash
curl -X POST http://localhost:3000/api/admin/generate-license \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: TU_ADMIN_SECRET_TOKEN" \
  -d '{"cantidad": 10}'
```

2. Reemplaza `TU_ADMIN_SECRET_TOKEN` con el valor de tu `.env.local`:
```
ADMIN_SECRET_TOKEN=tu_token_aqui
```

3. La respuesta tendrá los códigos generados:
```json
{
  "success": true,
  "codes": [
    "SHORTLIST-2024-ABC123",
    "SHORTLIST-2024-DEF456",
    ...
  ]
}
```

### Opción B: Directamente en Supabase (Si prefieres)

1. En Supabase, ir a **Table Editor**
2. Seleccionar tabla `license_codes`
3. Hacer clic en **+ Insert Row**
4. Llenar:
   - `code`: SHORTLIST-2024-ABC123 (único)
   - `status`: unused
   - Dejar otros campos vacíos

---

## 🧪 PASO 3: PROBAR EL SISTEMA

### Test 1: Crear cuenta DEMO

1. Ir a: http://localhost:3000/acceso
2. Hacer clic en **Acceso Demo Gratuito**
3. Verificar que aparezca con plan `demo`

### Test 2: Validar límite de candidatos

1. Con la cuenta demo, crear un candidato
2. Intentar crear otro candidato
3. Debe rechazar: "Has alcanzado el límite de 1 candidato..."

### Test 3: Activar código de licencia

1. En el dashboard, buscar botón/modal para "Usar Código de Licencia"
2. Ingresar un código válido (ej: SHORTLIST-2024-ABC123)
3. Debe cambiar a `plan: premium`
4. Ahora puede crear candidatos ilimitados

### Test 4: Bloquear features en DEMO

En demo, intentar:
- Hacer clic en "Contactar por WhatsApp" → Debe rechazar
- Ver "Reportes" → Debe rechazar

---

## 🚀 PASO 4: DESPLEGAR A VERCEL

```bash
git add .
git commit -m "Add license system: demo/premium plans with code validation"
git push origin main
```

Vercel automáticamente:
1. ✅ Ejecutará build
2. ✅ Desplegará cambios
3. ✅ Los endpoints de API estarán disponibles en producción

---

## 📋 REFERENCIA: ENDPOINTS DE API

### Usar Código de Licencia
```
POST /api/auth/use-license-code
Body: { "codigo": "SHORTLIST-2024-ABC123", "userId": "uuid..." }
Response: { success: true, plan: "premium" }
```

### Verificar Plan Actual
```
GET /api/auth/check-plan
Header: Authorization: Bearer <token>
Response: { plan: "demo" | "premium", user_id: "uuid..." }
```

### Generar Códigos (Admin)
```
POST /api/admin/generate-license
Header: X-Admin-Token: <admin_token>
Body: { "cantidad": 10 }
Response: { success: true, codes: ["SHORTLIST-2024-ABC123", ...] }
```

---

## ⚙️ VARIABLES DE ENTORNO

Asegúrate que tu `.env.local` tenga:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
ADMIN_SECRET_TOKEN=tu_token_secreto_aqui
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Tabla no existe"
**Solución**: Ejecutar la migración SQL (Paso 1)

### Problema: "Código inválido"
**Solución**: Verificar que el código esté en tabla `license_codes` con `status: unused`

### Problema: "Usuario no tiene plan"
**Solución**: Asegurar que se insertó registro en `companies` con el `user_id`

### Problema: "Admin token inválido"
**Solución**: Verificar `ADMIN_SECRET_TOKEN` en `.env.local`

---

## 📊 MODELO DE DATOS

### Tabla: license_codes
```
id (UUID) → Identificador único
code (VARCHAR) → Código único (ej: SHORTLIST-2024-ABC123)
status (VARCHAR) → unused | used | inactive
used_by_user_id (UUID) → Usuario que lo usó (null si no usado)
created_at (TIMESTAMP) → Cuándo se creó
used_at (TIMESTAMP) → Cuándo se usó
notes (TEXT) → Notas opcionales
```

### Tabla: companies
```
id (UUID) → Identificador único
user_id (UUID) → FK a auth.users
email (VARCHAR) → Email de contacto
nombre (VARCHAR) → Nombre empresa/usuario
plan (VARCHAR) → demo | premium
license_code_used (VARCHAR) → Código que se usó (para referencia)
plan_upgraded_at (TIMESTAMP) → Cuándo se cambió a premium
created_at (TIMESTAMP) → Cuándo se registró
updated_at (TIMESTAMP) → Última actualización
```

---

## ✅ CHECKLIST

- [ ] Ejecuté migración SQL en Supabase
- [ ] Generé códigos de licencia con `/api/admin/generate-license`
- [ ] Probé crear cuenta DEMO
- [ ] Probé usar un código de licencia
- [ ] Validé límites de candidatos en DEMO
- [ ] Validé bloqueo de WhatsApp en DEMO
- [ ] Desplegué a Vercel
- [ ] Probé en producción

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisar logs en Supabase
2. Verificar variables de entorno
3. Ejecutar migration nuevamente
4. Contactar soporte

¡Listo para usar! 🚀
