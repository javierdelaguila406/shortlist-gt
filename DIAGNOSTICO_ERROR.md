# 🔍 DIAGNÓSTICO: Error al guardar candidato

**Error observado:** "Error al guardar candidato"  
**Ruta:** `/postular/vacante-1788998078998`  
**Fecha:** 2026-09-09

---

## 🎯 CAUSAS PROBABLES (En orden de probabilidad)

### **CAUSA #1: Bucket 'cvs' No Existe en Supabase Storage (80% probabilidad)**

**Síntomas:**
- Error genérico al guardar
- PDF no se guarda en Storage
- cv_url es null

**Cómo verificar:**
```sql
-- En Supabase SQL Editor:
SELECT * FROM storage.buckets WHERE name = 'cvs';
-- Si retorna 0 filas → PROBLEMA CONFIRMADO
```

**Cómo arreglarlo:**
1. Ve a Supabase Dashboard
2. Storage → Buckets
3. Clic en "New Bucket"
4. Nombre: `cvs`
5. Público: **SÍ** ✅
6. Clic en "Create Bucket"

---

### **CAUSA #2: Campo cv_url No Existe en Tabla candidatos (15% probabilidad)**

**Síntomas:**
- Error: "column cv_url does not exist"
- La tabla fue creada antes del cambio

**Cómo verificar:**
```sql
-- En Supabase SQL Editor:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'candidatos' AND column_name = 'cv_url';
-- Si retorna 0 filas → PROBLEMA CONFIRMADO
```

**Cómo arreglarlo:**
```sql
ALTER TABLE candidatos ADD COLUMN cv_url TEXT;
```

---

### **CAUSA #3: Credenciales de Supabase Incorrectas (5% probabilidad)**

**Síntomas:**
- Error al conectar
- Timeout de conexión
- "Unauthorized"

**Cómo verificar:**
1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Verifica que existan:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY`

**Si faltan:**
1. Ve a Supabase Dashboard → Project Settings → API
2. Copia los valores correctos
3. Agrégalos a Vercel Environment Variables
4. **Redeploy** la aplicación en Vercel

---

## 📋 CHECKLIST DE VALIDACIÓN

### Paso 1: Validar Bucket
```bash
VERIFICAR EN SUPABASE:
[ ] Storage → Buckets
[ ] Bucket 'cvs' existe
[ ] Bucket es PÚBLICO
[ ] Permite upload de application/pdf
```

### Paso 2: Validar Tabla
```bash
EJECUTAR EN SQL EDITOR:
[ ] Campo 'email' existe (NOT NULL)
[ ] Campo 'cv_url' existe
[ ] Campo 'vacante_id' existe (FK)
[ ] Campo 'score_ia' existe
[ ] Campo 'estado' existe
```

### Paso 3: Validar Credenciales
```bash
EN VERCEL DASHBOARD:
[ ] NEXT_PUBLIC_SUPABASE_URL configurada
[ ] NEXT_PUBLIC_SUPABASE_ANON_KEY configurada
[ ] SUPABASE_SERVICE_ROLE_KEY configurada
[ ] Vercel ha redeploy después de cambios
```

### Paso 4: Validar Logs
```bash
EN VERCEL:
[ ] Ve a Deployments
[ ] Haz clic en "Latest"
[ ] Clic en "View Logs"
[ ] Busca "[API]" o "Error"
[ ] Lee el mensaje de error específico
```

---

## 🔧 SOLUCIÓN RÁPIDA (En orden)

### 1️⃣ **Crear bucket cvs**
```
Supabase Dashboard → Storage → New Bucket
- Nombre: cvs
- Público: SÍ
- Create
```

### 2️⃣ **Agregar campo cv_url**
```sql
ALTER TABLE candidatos ADD COLUMN cv_url TEXT;
```

### 3️⃣ **Verificar credenciales en Vercel**
```
Vercel Dashboard → Settings → Environment Variables
Verificar que existan los 3 valores correctos
```

### 4️⃣ **Redeploy**
```
Vercel → Deployments → Latest → Redeploy
O esperar 1-2 minutos a que auto-deploy (desde GitHub)
```

### 5️⃣ **Reintentar postulación**
```
Vuelve a https://shortlist-gt.vercel.app/postular/...
Llena el formulario nuevamente
Envía
```

---

## 📊 VERIFICACIÓN POST-FIX

Después de hacer los cambios, verifica en Supabase:

```sql
-- Ver si el candidato se guardó
SELECT id, nombre, email, cv_url, score_ia, estado 
FROM candidatos 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver si el PDF se guardó en Storage
SELECT name, size, created_at 
FROM storage.objects 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'cvs')
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🆘 SI TODAVÍA FALLA

Si después de hacer todos estos pasos sigue fallando:

1. **Abre DevTools** (F12)
2. **Network tab**
3. **Vuelve a intentar postular**
4. **Busca la request a `/api/candidatos/postular`**
5. **Clic en la request**
6. **Ve a Response tab**
7. **Copia todo el response**
8. **Comparte el error exacto**

Eso me dirá exactamente qué está fallando.

---

## 🔍 GUÍA VISUAL POR CAUSA

### Si el problema es Bucket:
```
Error en logs: "cvs" bucket not found
Solución: Crear bucket en Storage
Tiempo: 1 minuto
```

### Si el problema es Tabla:
```
Error en logs: column "cv_url" does not exist
Solución: ALTER TABLE ADD COLUMN
Tiempo: 30 segundos
```

### Si el problema es Credenciales:
```
Error en logs: Unauthorized o Connection timeout
Solución: Copiar credenciales correctas a Vercel
Tiempo: 2 minutos + redeploy
```

---

**Próximo paso:** Verifica el punto #1 (Bucket) primero, es el más probable.

