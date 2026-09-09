# Configuración Requerida en Supabase

## ✅ CHECKLIST DE CONFIGURACIÓN

### 1. Bucket de Storage (CRÍTICO)

**DEBE HACER EN SUPABASE DASHBOARD:**

```
1. Ir a Storage → Buckets
2. Crear bucket llamado: cvs
3. Configurar permisos:
   - Público: SÍ (para URLs públicas de PDF)
   - Allowed MIME types: application/pdf
```

**Verificar:**
- ✅ Bucket existe: `cvs`
- ✅ Es público (puede generar URLs)
- ✅ Solo permite application/pdf

### 2. Tabla `candidatos` (CRÍTICO)

**DEBE TENER ESTOS CAMPOS:**

```sql
CREATE TABLE candidatos (
  id TEXT PRIMARY KEY,
  vacante_id TEXT NOT NULL REFERENCES vacantes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,  -- ← REQUERIDO
  telefono TEXT,
  cv_url TEXT,          -- ← NUEVO (URL pública del PDF)
  estado TEXT DEFAULT 'pendiente',
  score_ia INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Verificar:**
- ✅ Campo `email` existe y NOT NULL
- ✅ Campo `cv_url` existe (nullable, es OK)
- ✅ Foreign key `vacante_id` existe

**SQL para agregar cv_url si falta:**
```sql
ALTER TABLE candidatos ADD COLUMN cv_url TEXT;
```

### 3. Tabla `vacantes` (DEBE TENER)

```sql
CREATE TABLE vacantes (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,  -- ← IMPORTANTE para scoring
  departamento TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Verificar:**
- ✅ Campo `descripcion` existe (puede ser NULL)

### 4. Variables de Entorno en Vercel

**DEBE ESTAR EN `.env.local` O VERCEL DASHBOARD:**

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

**Validar en Vercel:**
1. Settings → Environment Variables
2. Verificar que los 3 están presentes
3. Redeploy si los agregaste ahora

### 5. RLS Policies en Supabase (si está habilitado)

**SI TIENES RLS HABILITADO en tabla `candidatos`:**

Agregar esta policy para permitir INSERT:

```sql
CREATE POLICY "Allow insert from API" ON candidatos
FOR INSERT TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Allow select from API" ON candidatos
FOR SELECT TO authenticated, anon
USING (true);
```

**SI RLS ESTÁ DESHABILITADO:** No necesitas hacer nada, cualquiera puede leer/escribir.

---

## 🔍 CHECKLIST PRE-PRODUCCIÓN

- [ ] Bucket `cvs` creado en Supabase Storage
- [ ] Bucket es público
- [ ] Campo `cv_url` existe en tabla `candidatos`
- [ ] Campo `email` es NOT NULL en tabla `candidatos`
- [ ] Campo `descripcion` existe en tabla `vacantes`
- [ ] ENV vars en Vercel:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] Después de cambios en Supabase, redeploy en Vercel

---

## 🧪 VERIFICACIÓN RÁPIDA

### Test 1: Verificar bucket
```bash
# En Supabase SQL editor:
SELECT * FROM storage.buckets WHERE name = 'cvs';
# Debe retornar 1 fila
```

### Test 2: Verificar tabla candidatos
```bash
SELECT * FROM information_schema.columns 
WHERE table_name = 'candidatos' AND column_name IN ('email', 'cv_url');
# Debe retornar 2 filas
```

### Test 3: Verificar tabla vacantes
```bash
SELECT * FROM information_schema.columns 
WHERE table_name = 'vacantes' AND column_name = 'descripcion';
# Debe retornar 1 fila
```

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

| Error | Solución |
|-------|----------|
| `"cvs" bucket not found` | Crear bucket en Storage → Buckets |
| `Email required (not extracted)` | Frontend debe enviar email o PDF debe tener |
| `PDF saved but URL is empty` | Bucket no es público, verificar en Supabase |
| `Storage upload fails` | SERVICE_ROLE_KEY inválida en Vercel |
| `Candidates not appearing` | Verificar vacante_id es UUID correcto |

---

## 📋 CONFIGURACIÓN ACTUAL

**Última actualización:** 2026-09-09

Archivo de API: `app/api/candidatos/postular/route.ts`

**Acciones de Bucket esperadas:**
1. Upload PDF a `cvs/{candidato_id}_{timestamp}.pdf`
2. Generar URL pública
3. Guardar URL en campo `cv_url`

**Validaciones requeridas:**
- Email es obligatorio (error 400 si no hay)
- PDF es opcional
- CV text es opcional
- Habilidades es opcional

**Pero al menos UNO de estos debe estar:**
- Email en formulario
- Email en PDF
- CV text (de PDF o textarea)

