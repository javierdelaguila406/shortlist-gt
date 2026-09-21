# 🚨 BLOQUEO CRÍTICO: RLS Incorrecta - DEBE ARREGLARSE ANTES DE COMMIT

**Severidad**: 🔴 CRÍTICO  
**Bloqueador**: SÍ - No commit hasta esto esté correcto  
**Auditor**: Claude Code

---

## 📊 ESTADO ACTUAL

**Reporte de ChatGPT**:
```
PASO 5 RLS Audit: ❌ Incorrecta: 
- Existen lecturas públicas
- Una política "Allow all"
- Faltan restricciones por propietario
```

**Impacto**:
- 🔴 **CRÍTICO**: Aunque el código usa `anon key` ahora, las políticas RLS abiertas permiten acceso público
- Usuario anónimo puede leer TODOS los candidatos
- Usuario anónimo puede insertar candidatos sin verificación

---

## 🔧 CÓMO ARREGLARLO

### OPCIÓN A: Desde Supabase Console (Recomendado - 30 minutos)

**Ir a**: https://supabase.com/dashboard/project/shortlist-gt

**Paso 1**: SQL Editor → Ejecutar

```sql
-- ELIMINAR políticas abiertas
DROP POLICY IF EXISTS "allow_all_read" ON candidatos;
DROP POLICY IF EXISTS "allow_all_insert" ON candidatos;
DROP POLICY IF EXISTS "Allow all" ON candidatos;
DROP POLICY IF EXISTS "allow_public_read" ON vacantes;

-- CREAR políticas restrictivas
CREATE POLICY "select_own_candidates" ON candidatos
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "select_own_vacancies" ON vacantes
  FOR SELECT USING (auth.uid() = usuario_id OR estado = 'activa');

CREATE POLICY "insert_own_candidate" ON candidatos
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "update_own_candidate" ON candidatos
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "delete_own_candidate" ON candidatos
  FOR DELETE USING (auth.uid() = usuario_id);

-- Verificar resultado
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Validación esperada**:
```
tablename | policyname                | qual / with_check
----------|---------------------------|------------------
candidatos| select_own_candidates     | auth.uid() = usuario_id
candidatos| insert_own_candidate      | auth.uid() = usuario_id
candidatos| update_own_candidate      | auth.uid() = usuario_id
candidatos| delete_own_candidate      | auth.uid() = usuario_id
vacantes  | select_own_vacancies      | auth.uid() = usuario_id OR ...
...
```

---

### OPCIÓN B: Desde CLI (Si tienes Supabase CLI - 15 minutos)

```bash
# 1. Instalar Supabase CLI si no lo tienes
npm install -g supabase

# 2. Login
supabase login

# 3. Link al proyecto
supabase link --project-ref xropotkrcovaqsarkjvp

# 4. Crear migration
supabase migration new fix_rls_policies

# 5. En el archivo generado, agregar:
-- supabase/migrations/[timestamp]_fix_rls_policies.sql

DROP POLICY IF EXISTS "allow_all_read" ON candidatos;
-- ... (igual al OPCIÓN A)

# 6. Deploy
supabase db push
```

---

## 🔍 QUÉ BUSCAR (para verificar)

**Después de arreglar, ejecuta**:
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('candidatos', 'vacantes', 'usuarios')
ORDER BY tablename, policyname;
```

**Debe cumplir**:
- ✅ NO hay políticas con nombre "Allow all" sin restricciones
- ✅ Cada tabla tiene `SELECT` con `auth.uid() = usuario_id`
- ✅ NO hay `USING (true)` sin condiciones
- ✅ Políticas de `INSERT` tienen `WITH CHECK (auth.uid() = ...)`

---

## ⚠️ PARA LECTURA PÚBLICA (Vacantes activas)

**Las vacantes ACTIVAS deben ser públicamente legibles** (para `/api/vacantes/buscar`):

```sql
-- Esto es CORRECTO para vacantes:
CREATE POLICY "select_active_vacancies" ON vacantes
  FOR SELECT USING (
    auth.uid() = usuario_id  -- Dueño ve todas sus vacantes
    OR estado = 'activa'      -- Anónimo ve solo activas
  );
```

**Pero para candidatos: NUNCA públicos**

```sql
-- CANDIDATOS deben estar RESTRINGIDOS:
CREATE POLICY "select_own_candidates" ON candidatos
  FOR SELECT USING (auth.uid() = usuario_id);
  
-- NO esto:
-- FOR SELECT USING (true);  -- ❌ NUNCA
```

---

## 📋 CHECKLIST ANTES DE CONTINUAR

- [ ] Ingresé a Supabase dashboard
- [ ] Ejecuté el SQL para eliminar políticas abiertas
- [ ] Ejecuté el SQL para crear políticas restrictivas
- [ ] Verifiqué con `SELECT * FROM pg_policies` que está correcto
- [ ] NO hay "Allow all" sin restricciones
- [ ] Cada tabla tiene restricciones por `usuario_id`

---

## 🚀 CUANDO RLS ESTÉ CORRECTO:

Reporta:
```
RLS AUDIT: ✅ Corregida
- Eliminadas políticas "Allow all"
- Agregadas restricciones por usuario_id
- Lectura pública solo para vacantes activas
- Candidatos restringidos al propietario
```

---

## ⏸️ MIENTRAS TANTO: Meta/WhatsApp

**PASO 4 puede esperar** (menos crítico):
- [ ] Inicia sesión en Meta que está abierto en Chrome
- [ ] Reporta cuando puedas acceder

---

## 🔐 POR QUÉ RLS ES CRÍTICO

**Cambios de código que hicimos**:
- Ahora usamos `anon key` (sin poderes de admin)
- Confiamos en RLS para proteger datos

**Si RLS está incorrecta**:
- ❌ `anon key` puede leer/modificar CUALQUIER dato
- ❌ Usuarios anónimos pueden acceder a candidatos
- ❌ Todo el código que escribimos NO sirve

**Si RLS está correcta**:
- ✅ `anon key` solo puede leer/modificar datos autorizados
- ✅ Protección en la BD (no solo en código)
- ✅ Defensa en profundidad

---

**Status Actual**: ⏸️ BLOQUEADO - Esperando RLS corregida

**Próximo paso**: 
1. Arregla RLS en Supabase
2. Reporta ✅
3. Entonces hago COMMIT + PUSH + luz verde FASE 1

¿Ya estás en Supabase? ⏳
