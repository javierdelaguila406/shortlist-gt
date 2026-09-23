# REMEDIATION_FIXES.md — Correcciones propuestas (versión 2)

**Fecha:** 2026-09-22 · **Base:** commit `26f8a86` · **Next.js:** 16.3.5 · **supabase-js:** 2.112 · **zod:** 3.22 · **pdf-parse:** 2.4
**Estado:** propuesta. **Nada de esto está aplicado.** Todo se desarrolla y prueba en staging con datos sintéticos antes de producción.
**Referencias:** `PHASE_2_AUDIT_DETAILED.md` (hallazgos), `PHASE_3_EXECUTIVE_REPORT.md` (etapas y decisiones), `PHASE_4_VALIDATION_TESTING.md` (pruebas `T-*`)

---

## Estado de aplicación (2026-09-22)

**Etapa 1 implementada en código, en la rama local `remediacion/etapa-1` (sin commit, sin desplegar, migración sin aplicar).**

- Verificación local: `tsc` sin errores; `vitest` 57/57 (antes 36/48); `next build --webpack` correcto; lint sin errores nuevos.
- **No aplicado en ningún entorno.** No existe staging: Supabase solo tiene variables en Production, y Preview tiene tokens reales de WhatsApp y credenciales de GoDaddy. `migrations/006_rls_consolidada.sql` está escrita y no se ha ejecutado.

**Hallazgos adicionales encontrados al implementar:**

- **OP-03, causa directa:** `/api/vacantes/resolver-slug` caía bajo el prefijo protegido `/api/vacantes` del middleware. La página pública recibía 401 al enviar y mostraba "Vacante no encontrada". Corregido en `middleware.ts`.
- **OP-02:** `getUserLicenseFromStorage()` devuelve siempre `null`, por lo que el panel bloqueaba **toda** creación de vacantes. Se quitó esa comprobación del cliente; el límite de plan se aplicará en el servidor (R-09).
- **OP-01:** `/dashboard` y `/vacantes/crear` pedían la sesión al cliente de Supabase del navegador, que nunca la tiene porque el login ocurre en el servidor. Ahora usan la cookie.
- **Falso éxito:** `asignar-template` y `generar-preguntas` hacían `upsert` sin `onConflict: 'vacante_id'` sobre una tabla con `UNIQUE(vacante_id)`. Reasignar fallaba, y el error se ocultaba devolviendo éxito.
- `next build` falla con Turbopack (predeterminado en Next.js 16) porque `next.config.ts` define `webpack`. Es previo a estos cambios; se compila con `--webpack` mientras tanto.

---

## 0. La versión 1 queda retirada

No aplique ningún cambio de la versión anterior de este archivo:

| Fix anterior | Motivo del retiro |
|---|---|
| FIX-001 (DOMPurify en `crear`) | No corresponde a un hallazgo verificado: la salida ya se escapa en el reporte. Añade una dependencia sin necesidad |
| FIX-002 (IDOR en `/api/cv`) | Consultaba como `anon` (hereda N-01). Lo reemplaza R-04 |
| FIX-003 (licencias) | Reemplazaba la RPC atómica **correcta** por otra con columnas que no existen y sin `auth.uid()` |
| FIX-004 (webhook) | HMAC en base64 y comparación `!==`: rechaza todos los webhooks reales de Meta. El código actual ya está bien |
| FIX-005 (prompt injection) | Escrito para OpenAI; la ruta usa Anthropic. El filtro de palabras rechaza salidas válidas |
| FIX-006 a FIX-010 | Verificaciones sin cambios de código, o ya cubiertas |
| FIX-011 (AES-CBC) | Repite SEG-17. La función no se usa: se elimina (R-15) |

---

## 1. Principios de estas correcciones

1. **La base de datos decide quién ve qué.** Cada ruta consulta con el JWT del usuario y la RLS aplica. El control en código es una segunda barrera, no la única.
2. **Una sola forma de autenticar.** La sesión va en la cookie `httpOnly` `sb-auth-token`, que `signin` ya crea. Hoy `reclutador_token` se escribe en `localStorage` pero **ningún código lo lee**, así que la interfaz nunca envía `Authorization` y las rutas que lo exigen fallan desde el panel.
3. **El service role solo en el servidor y solo donde no hay usuario:** postulación pública, administración y sincronización. Siempre en un módulo aparte.
4. **El servidor no confía en el navegador** para el score, el tipo de archivo, el dueño ni el plan.

---

## 2. Orden de aplicación

| Paso | Correcciones | Etapa (Fase 3) | Depende de | Pruebas de cierre |
|---|---|---|---|---|
| 1 | R-00 | 0 | — | T-SEC-01 |
| 2 | R-01, R-02, R-03, R-04, R-05, R-06 **juntas** | 1 | Paso 1 | T-DB-*, T-AUTH-*, T-BOLA-*, T-POS-* |
| 3 | R-07, R-08, R-09, R-10 | 2 | Paso 2; R-09 depende de la decisión 6 | T-BIZ-*, T-FILE-*, T-RL-*, T-HDR-01 |
| 4 | R-11 a R-19 | 3 | Paso 2 | T-ADM-04, ciclo de vida de datos |

**Importante:** R-03 (RLS estricta) **no puede desplegarse sin R-01, R-04, R-05 y R-06**. Con RLS estricta y rutas que siguen consultando como `anon`, la aplicación deja de encontrar sus datos, que es precisamente el modo E descrito en N-01. Despliegue el paso 2 completo en staging, pase las pruebas T-POS y después páselo a producción en una sola ventana.

---

## 3. Etapa 0 — Contención

### R-00 — Secretos (SEG-01)

No requiere código. La hace el responsable de cada cuenta:

1. Revocar y rotar la llave secreta de Supabase (`sb_secret_…` / service role) y la llave de OpenAI. Actualizarlas en Vercel (Production, Preview y Development).
2. Revisar en los paneles de Supabase y OpenAI la actividad desde el 2026-09-20.
3. Pedir a GitHub Support la purga del commit `8d2990f` en `javierdelaguila406/shortlist-gt`.
4. Borrar los prefijos de llave de `RESUMEN_EJECUTIVO.md:23-24`.
5. Activar *Secret scanning* y *Push protection* en el repositorio.

**Cierre:** las llaves viejas devuelven 401, `8d2990f` no responde en la API de GitHub y `gitleaks detect --log-opts="--all"` sale limpio.

---

## 4. Etapa 1 — Aislamiento entre empresas

### R-01 — Cliente de Supabase por solicitud (N-01)

**Archivo nuevo:** `lib/supabase-server.ts`

```ts
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function getRequestToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
  return request.cookies.get('sb-auth-token')?.value ?? null;
}

export function createUserClient(token: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireUser(
  request: NextRequest
): Promise<{ user: User; supabase: SupabaseClient } | null> {
  const token = getRequestToken(request);
  if (!token) return null;
  const supabase = createUserClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, supabase };
}

export function createAnonClient(): SupabaseClient {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
```

**Archivo nuevo:** `lib/supabase-admin.ts`. Solo se importa desde `postular`, `admin/*`, `lib/rate-limit.ts` y `lib/dual-sync.ts`.

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase admin client is not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
```

**Sobre la cookie:** `signin/route.ts:82-90` la emite con `httpOnly`, `secure` y `sameSite: 'strict'`. `SameSite=Strict` impide que otros sitios la envíen, lo que cubre CSRF para estas rutas. El CORS de `middleware.ts:41-56` solo admite el dominio propio con credenciales; mantenerlo así.

**Limitación conocida (OP-01):** la cookie guarda solo el access token, que vence en aproximadamente una hora, y no hay refresh. La solución de fondo es migrar la sesión a `@supabase/ssr`, que ya está en `package.json`. Queda fuera de este paso; ver R-20.

### R-02 — Helpers de propiedad (N-05 y controles repetidos)

**Archivo nuevo:** `lib/authz.ts`

```ts
import type { SupabaseClient } from '@supabase/supabase-js';

type OwnerRelation = { usuario_id: string } | { usuario_id: string }[] | null | undefined;

function ownerOf(relation: OwnerRelation): string | undefined {
  return Array.isArray(relation) ? relation[0]?.usuario_id : relation?.usuario_id;
}

export async function getOwnedVacante(supabase: SupabaseClient, userId: string, vacanteId: string) {
  const { data, error } = await supabase
    .from('vacantes')
    .select('id, usuario_id, titulo, descripcion, estado')
    .eq('id', vacanteId)
    .maybeSingle();
  if (error || !data || String(data.usuario_id) !== userId) return null;
  return data;
}

export async function getOwnedCandidato(supabase: SupabaseClient, userId: string, candidatoId: string) {
  const { data, error } = await supabase
    .from('candidatos')
    .select('*, vacantes:vacante_id(usuario_id)')
    .eq('id', candidatoId)
    .maybeSingle();
  if (error || !data) return null;
  if (String(ownerOf(data.vacantes as OwnerRelation)) !== userId) return null;
  return data;
}
```

`ownerOf` acepta objeto o arreglo. Eso corrige N-05: el dueño ya no recibe 401 en `candidatos/[id]`.

**Prueba unitaria sugerida** (`tests/authorization/owner-of.test.ts`): relación como objeto, como arreglo, `null` y dueño distinto.

### R-03 — RLS consolidada (SEG-06, N-01, N-07, N-11)

**Antes de ejecutar:** guardar la salida de la consulta 3.1 de la Fase 4 como respaldo para poder revertir. Si esa consulta muestra políticas permisivas que no están en esta lista, añadir un `DROP POLICY` para cada una.

**Archivo nuevo:** `migrations/006_rls_consolidada.sql`

```sql
BEGIN;

-- 1. Retirar políticas permisivas conocidas
DROP POLICY IF EXISTS "vacantes_public_read"   ON public.vacantes;
DROP POLICY IF EXISTS "vacantes_public_insert" ON public.vacantes;
DROP POLICY IF EXISTS "candidatos_public_read"   ON public.candidatos;
DROP POLICY IF EXISTS "candidatos_public_insert" ON public.candidatos;
DROP POLICY IF EXISTS "Allow all" ON public.vacante_preguntas;
DROP POLICY IF EXISTS "audit_logs_service_insert"     ON public.audit_logs;
DROP POLICY IF EXISTS "rate_limit_log_service_insert" ON public.rate_limit_log;
DROP POLICY IF EXISTS "rate_limit_log_service_select" ON public.rate_limit_log;
DROP POLICY IF EXISTS "Admin can view all license codes"   ON public.license_codes;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "update_own_company"                 ON public.companies;

-- 2. Vacantes: solo el dueño
ALTER TABLE public.vacantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vacantes_select_own" ON public.vacantes;
DROP POLICY IF EXISTS "vacantes_insert_own" ON public.vacantes;
DROP POLICY IF EXISTS "vacantes_update_own" ON public.vacantes;
DROP POLICY IF EXISTS "vacantes_delete_own" ON public.vacantes;
CREATE POLICY "vacantes_select_own" ON public.vacantes FOR SELECT TO authenticated
  USING (usuario_id::text = auth.uid()::text);
CREATE POLICY "vacantes_insert_own" ON public.vacantes FOR INSERT TO authenticated
  WITH CHECK (usuario_id::text = auth.uid()::text);
CREATE POLICY "vacantes_update_own" ON public.vacantes FOR UPDATE TO authenticated
  USING (usuario_id::text = auth.uid()::text) WITH CHECK (usuario_id::text = auth.uid()::text);
CREATE POLICY "vacantes_delete_own" ON public.vacantes FOR DELETE TO authenticated
  USING (usuario_id::text = auth.uid()::text);

-- 3. Candidatos: el dueño de la vacante lee, actualiza y borra.
--    Sin política INSERT: la postulación pública inserta desde el servidor (R-05).
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "candidatos_select_own" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos_insert_own" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos_update_own" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos_delete_own" ON public.candidatos;
CREATE POLICY "candidatos_select_own" ON public.candidatos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = candidatos.vacante_id AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY "candidatos_update_own" ON public.candidatos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = candidatos.vacante_id AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY "candidatos_delete_own" ON public.candidatos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = candidatos.vacante_id AND v.usuario_id::text = auth.uid()::text));

-- 4. Preguntas de evaluación: solo el dueño de la vacante (N-03)
ALTER TABLE public.vacante_preguntas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vacante_preguntas_owner" ON public.vacante_preguntas;
CREATE POLICY "vacante_preguntas_owner" ON public.vacante_preguntas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = vacante_preguntas.vacante_id AND v.usuario_id::text = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = vacante_preguntas.vacante_id AND v.usuario_id::text = auth.uid()::text));

-- 5. Análisis de CV: el usuario inserta lo suyo (N-11)
DROP POLICY IF EXISTS "cv_analysis_insert_own" ON public.cv_analysis;
CREATE POLICY "cv_analysis_insert_own" ON public.cv_analysis FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid()::text);

-- 6. Tablas de control: sin políticas para anon/authenticated (el service role omite la RLS)
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_log    ENABLE ROW LEVEL SECURITY;

-- 7. Lectura pública mínima de una vacante activa (reemplaza la lectura pública de la tabla)
CREATE OR REPLACE FUNCTION public.get_vacante_publica(p_id text)
RETURNS TABLE(id text, titulo text, descripcion text, departamento text, empresa text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id::text, v.titulo::text, v.descripcion::text, v.departamento::text, c.nombre::text
  FROM public.vacantes v
  LEFT JOIN public.companies c ON c.user_id::text = v.usuario_id::text
  WHERE v.id::text = p_id AND v.estado = 'activa';
$$;
REVOKE ALL ON FUNCTION public.get_vacante_publica(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_vacante_publica(text) TO anon, authenticated;

-- 8. Bucket de CV privado
UPDATE storage.buckets
SET public = false, file_size_limit = 5242880, allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'cvs';

COMMIT;
```

Notas:

- Si alguna tabla mencionada (por ejemplo `audit_logs`, `audit_log`, `cv_analysis` o `vacante_preguntas`) no existe en la base efectiva, quitar sus líneas. Tanto `DROP POLICY IF EXISTS … ON tabla` como `ALTER TABLE` fallan si la tabla no existe, y el `BEGIN/COMMIT` revierte toda la migración.
- Revisar además las políticas de `storage.objects` para el bucket `cvs` y eliminar las que den acceso a `anon`.
- `companies` queda solo con SELECT e INSERT propios. El plan cambia únicamente por `redeem_license_code` o por el service role.

**Cierre:** T-DB-01 a T-DB-07 en PASA.

### R-04 — Migrar las rutas autenticadas

**Patrón general** (ejemplo: `app/api/candidatos/listar/route.ts`):

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedVacante } from '@/lib/authz';

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized', candidatos: [], success: false }, { status: 401 });

  const vacanteId = request.nextUrl.searchParams.get('vacante_id');
  if (!vacanteId) return NextResponse.json({ error: 'vacante_id requerido', candidatos: [], success: false }, { status: 400 });

  if (!(await getOwnedVacante(auth.supabase, auth.user.id, vacanteId))) {
    return NextResponse.json({ error: 'Vacante no encontrada', candidatos: [], success: false }, { status: 404 });
  }

  const { data: candidatos, error } = await auth.supabase
    .from('candidatos')
    .select('*')
    .eq('vacante_id', vacanteId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Error al cargar candidatos', candidatos: [], success: false }, { status: 500 });
  return NextResponse.json({ success: true, candidatos: candidatos ?? [] });
}
```

**Rutas a migrar:**

| Ruta | Cambio |
|---|---|
| `vacantes/route.ts` (GET) | `requireUser` + `auth.supabase` (quitar `lib/supabase`) |
| `vacantes/crear` | `requireUser`; insertar con `auth.supabase` en lugar del service role; quitar el cliente de módulo con service role |
| `vacantes/eliminar` | `requireUser` + `getOwnedVacante`; borrar con `auth.supabase` |
| `vacantes/[id]/candidatos` | `requireUser` + `getOwnedVacante` |
| `vacantes/generate-link` | `requireUser` + `getOwnedVacante`; tomar título y descripción de la vacante guardada, no del cuerpo |
| `candidatos/listar` | Patrón de arriba |
| `candidatos/exportar` | `requireUser` + `getOwnedVacante`. En la rama por email o teléfono: filtrar por las vacantes del usuario en vez de usar `.single()` global |
| `candidatos/[id]` GET y PATCH | `requireUser` + `getOwnedCandidato` (corrige N-05); actualizar con `auth.supabase` |
| `candidatos/eliminar` | `requireUser` + `getOwnedCandidato`; borrar el registro con `auth.supabase`. El archivo, con el admin client y la ruta guardada (R-05) |
| `evaluaciones/generar-preguntas`, `asignar-template` | `requireUser` + `getOwnedVacante`; escribir con `auth.supabase` |
| `evaluaciones/personalizar-preguntas` | Ver abajo (N-03) |
| `evaluaciones/iniciar-whatsapp` | Ver abajo (N-02, N-04) |
| `cv` | Ver abajo (SEG-07) |
| `auth/me`, `auth/check-plan`, `auth/change-password` | Usar `requireUser` para que acepten cookie o Bearer por igual |

**`evaluaciones/personalizar-preguntas` — PUT (N-03)**

```ts
import { z } from 'zod';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedVacante } from '@/lib/authz';

const preguntaTecnica = z.object({
  numero: z.number().int(),
  pregunta: z.string().min(1).max(500),
  opciones: z.array(z.string().min(1).max(200)).min(2).max(6),
  respuesta_correcta: z.number().int().min(0),
  criterio: z.string().max(300).optional(),
}).refine(p => p.respuesta_correcta < p.opciones.length, { message: 'respuesta_correcta fuera de rango' });

const bodySchema = z.object({
  vacante_id: z.string().min(1),
  pre_entrevista: z.array(z.unknown()).max(20).optional(),
  prueba_tecnica: z.array(preguntaTecnica).max(20).optional(),
  preguntas_video: z.array(z.unknown()).max(10).optional(),
});

export async function PUT(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const { vacante_id, ...campos } = parsed.data;

  if (!(await getOwnedVacante(auth.supabase, auth.user.id, vacante_id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await auth.supabase
    .from('vacante_preguntas')
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq('vacante_id', vacante_id);

  if (error) return NextResponse.json({ error: 'Error personalizando preguntas' }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

La validación de `respuesta_correcta` también evita índices fuera de rango (relacionado con UI-06).

**`evaluaciones/iniciar-whatsapp` (N-02, N-04, validación de plan que falla abierta)** — cambios sobre el archivo actual:

```ts
import { requireUser } from '@/lib/supabase-server';
import { getOwnedCandidato } from '@/lib/authz';

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { user, supabase } = auth;

  // N-04: llave por usuario, no por prefijo del token
  const limit = await persistentRateLimit(`whatsapp-start:${user.id}`, 10, 3600000);
  if (!limit.success) return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });

  // Falla cerrada: sin empresa o con error, no continúa
  const { data: company, error: companyError } = await supabase
    .from('companies').select('plan').eq('user_id', user.id).maybeSingle();
  if (companyError || !company) return NextResponse.json({ error: 'No se pudo verificar el plan' }, { status: 403 });
  if (company.plan !== 'premium') {
    return NextResponse.json({ error: 'Disponible solo en el plan Premium', plan: company.plan }, { status: 403 });
  }

  const { candidatoId } = await request.json().catch(() => ({}));
  if (typeof candidatoId !== 'string' || !candidatoId) {
    return NextResponse.json({ error: 'candidatoId es requerido' }, { status: 400 });
  }

  // N-02: solo candidatos de vacantes propias
  const candidato = await getOwnedCandidato(supabase, user.id, candidatoId);
  if (!candidato) return NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });

  // ...resto del flujo actual, usando `supabase` (cliente del usuario) en los inserts y updates.
  // Las respuestas devuelven { success, evaluacionId } SIN nombre, email ni teléfono.
}
```

Además: quitar de los logs el teléfono (`console.log` de la línea 185) y el mensaje de error del proveedor en la respuesta (línea 219).

**`cv` (SEG-07)** — cambios sobre el archivo actual:

```ts
const auth = await requireUser(request);
if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// ...validaciones de tamaño existentes...
const bytes = Buffer.from(await pdf.arrayBuffer());
if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
  return NextResponse.json({ error: 'File must be PDF' }, { status: 400 });
}
if (typeof candidateId === 'string' && candidateId &&
    !(await getOwnedCandidato(auth.supabase, auth.user.id, candidateId))) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
// Insertar en cv_analysis con auth.supabase (política de R-03 §5)
```

### R-05 — Postulación pública y CV privados (SEG-08, N-01 en el flujo público)

**`vacantes/resolver-slug` y `vacantes/buscar` (también N-10):** reemplazar las consultas a la tabla por la RPC.

```ts
const { data, error } = await createAnonClient()
  .rpc('get_vacante_publica', { p_id: id })
  .maybeSingle();
if (error || !data) return NextResponse.json({ found: false }, { status: 404 });
return NextResponse.json({ found: true, vacante: data });
```

- En `buscar`, aceptar IDs `vacante-\d+` además de UUID.
- En `resolver-slug`, eliminar la búsqueda `ilike` por título.

**`candidatos/postular`:**

- Leer la vacante y escribir el candidato con `createAdminClient()`. Es el único punto sin usuario autenticado; la ruta valida todo antes de escribir.
- Subir el CV a una ruta privada y guardar **la ruta del objeto**, no una URL pública:

```ts
const admin = createAdminClient();
const { data: vacante } = await admin
  .from('vacantes').select('titulo, descripcion, estado, usuario_id').eq('id', vacante_id).maybeSingle();
if (!vacante) return NextResponse.json({ error: 'Vacante no encontrada', success: false }, { status: 404 });
if (vacante.estado !== 'activa') return NextResponse.json({ error: 'La vacante no acepta aplicaciones', success: false }, { status: 410 });

const cvPath = `${vacante_id}/${candidato_id}.pdf`;
const { error: uploadError } = await admin.storage
  .from('cvs').upload(cvPath, cvBytes, { contentType: 'application/pdf', upsert: false });
if (uploadError) return NextResponse.json({ error: 'No se pudo guardar el CV', success: false }, { status: 500 });
// candidatoData.cv_url = cvPath   (ya no getPublicUrl)
```

- Eliminar el bloque de "plan demo" de las líneas 209-253: valida el plan del postulante en lugar del dueño de la vacante. Lo reemplaza R-09.

**Endpoint nuevo:** `app/api/candidatos/[id]/cv/route.ts`, que entrega el CV solo al dueño.

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getOwnedCandidato } from '@/lib/authz';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const candidato = await getOwnedCandidato(auth.supabase, auth.user.id, id);
  if (!candidato?.cv_url) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

  const { data, error } = await createAdminClient().storage
    .from('cvs').createSignedUrl(candidato.cv_url, 60, { download: true });
  if (error || !data) return NextResponse.json({ error: 'No disponible' }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}
```

**Datos existentes:** los candidatos anteriores tienen en `cv_url` una URL pública completa. Migrarlos a la ruta del objeto (lo que va después de `/object/public/cvs/`) con un script de staging antes de cambiar el bucket a privado.

### R-06 — Panel del reclutador (OP-02, OP-11, OP-04)

En `app/dashboard/reclutador/page.tsx`:

| Líneas actuales | Cambio |
|---|---|
| 97-99 (`supabase.from('vacantes')` desde el navegador) | `fetch('/api/vacantes')`. La cookie se envía sola en solicitudes al mismo origen |
| 122-128 (plan desde el cliente) | `fetch('/api/auth/check-plan')` |
| 170-175, 304-305, 346-352, 368 (`localStorage`/`sessionStorage` de vacantes) | Eliminar. La lista sale siempre de la API |
| 190, 770, 794 | Sin cambios: con R-01 las rutas aceptan la cookie |
| 216-232 (Realtime sobre todos los candidatos) | Eliminar o reemplazar por recarga manual. El navegador no tiene sesión de Supabase y, con RLS estricta, no recibirá eventos |
| 274-321 (`handleCreateVacante`) | Ver abajo |
| 355-363 (cerrar plaza) | `PATCH /api/vacantes/{id}` con `{ estado: 'cerrada' }`, comprobando `res.ok` antes de anunciar éxito |

```ts
const handleCreateVacante = async () => {
  if (!newVacante.titulo.trim()) return;
  const res = await fetch('/api/vacantes/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: newVacante.titulo,
      descripcion: newVacante.descripcion,
      departamento: newVacante.departamento,
    }),
  });
  const created = await res.json().catch(() => ({}));
  if (!res.ok || !created.success) {
    alert(created.error ?? 'No se pudo crear la vacante');
    return;
  }
  const linkRes = await fetch('/api/vacantes/generate-link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vacanteId: created.vacante_id }),
  });
  setLinkedinData(linkRes.ok ? await linkRes.json() : null);
  setVacantesRetry(n => n + 1);   // recarga la lista desde la API
  setSelectedVacanteId(created.vacante_id);
  setShowCreateVacante(false);
  setShowLinkedinLink(linkRes.ok);
  setNewVacante({ titulo: '', descripcion: '', departamento: '', linkedinLink: '' });
};
```

**Ruta nueva** `app/api/vacantes/[id]/route.ts` (convive con la carpeta `[id]/candidatos` que ya existe):

```ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedVacante } from '@/lib/authz';

const ESTADOS = ['activa', 'pausada', 'cerrada'] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { estado } = await request.json().catch(() => ({}));
  if (!ESTADOS.includes(estado)) return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  if (!(await getOwnedVacante(auth.supabase, auth.user.id, id))) {
    return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 });
  }

  const { error } = await auth.supabase
    .from('vacantes').update({ estado, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 });
  return NextResponse.json({ success: true });
}
```

**Otros archivos:**

- En `app/auth/login/page.tsx:43` y `app/auth/signup/page.tsx:84`, dejar de guardar `reclutador_token` en `localStorage`: nadie lo lee y queda expuesto ante cualquier XSS.
- `app/dashboard/login/page.tsx:25` crea un token falso de demostración: retirar esa página o aislarla de la aplicación real.

**Cierre de la etapa 1:** T-POS-01 a T-POS-08 en PASA y persistencia comprobada en el navegador (Fase 4, sección D), con RLS estricta activa.

---

## 5. Etapa 2 — Integridad del proceso

### R-07 — Score calculado con el PDF real (N-06 / OP-12, SEG-08)

**Archivo nuevo:** `lib/pdf.ts`. Mueve la extracción que ya usa `cv/route.ts:9-16` y le agrega un límite de tiempo.

```ts
import { PDFParse } from 'pdf-parse';

export const MAX_CV_BYTES = 5 * 1024 * 1024;

export function isPdf(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString('latin1') === '%PDF-';
}

export async function extractPdfText(bytes: Buffer, timeoutMs = 10_000): Promise<string> {
  const parser = new PDFParse({ data: bytes });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('pdf-timeout')), timeoutMs);
    });
    return ((await Promise.race([parser.getText(), timeout])).text || '').trim();
  } finally {
    clearTimeout(timer);
    await parser.destroy();
  }
}
```

**En `candidatos/postular`:**

```ts
const cv = formData.get('cv');
if (!(cv instanceof File) || cv.size === 0) return NextResponse.json({ error: 'CV en PDF requerido', success: false }, { status: 400 });
if (cv.size > MAX_CV_BYTES) return NextResponse.json({ error: 'El CV supera 5 MB', success: false }, { status: 413 });
const cvBytes = Buffer.from(await cv.arrayBuffer());
if (!isPdf(cvBytes)) return NextResponse.json({ error: 'El archivo debe ser PDF', success: false }, { status: 400 });

let cvTexto = '';
try { cvTexto = await extractPdfText(cvBytes); } catch { cvTexto = ''; }
const evaluado = cvTexto.length >= 20;
const score_ia = evaluado ? calculateScore(cvTexto, vacante.titulo, vacante.descripcion || '') : 0;
const estado = evaluado && score_ia >= UMBRAL_PRECALIFICADO ? 'precalificado' : 'pendiente';
// Ya no se leen los campos 'cvText' ni 'habilidades' del formulario para puntuar.
// El email de respaldo se extrae de cvTexto en lugar de cvText.
```

**Migración complementaria:**

```sql
ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS cv_evaluado boolean NOT NULL DEFAULT false;
```

Guardar `cv_evaluado: evaluado`. El panel debe mostrar "No evaluado, requiere revisión" cuando sea `false`, en lugar de un score bajo.

**Pendiente de decisión (OP-13 / OP-16):**

- Hay dos fórmulas de score: `calculateScore` en `postular` y `calculateCVScore` en `lib/cv-score.ts`. Hay que elegir una y borrar la otra.
- Definir `UMBRAL_PRECALIFICADO` en un solo lugar (hoy es 70 en el código y la interfaz anuncia 80).

**En el formulario** (`app/postular/[slug]/page.tsx`): dejar de enviar `cvText`; el servidor ya no lo usa.

### R-08 — Límite de tasa atómico (SEG-13, N-04)

**Migración:**

```sql
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_limit int, p_window_ms bigint)
RETURNS TABLE(allowed boolean, retry_after_s int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_window interval := make_interval(secs => p_window_ms / 1000.0);
  v_count int;
  v_oldest timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_key, 0));
  SELECT count(*), min(r."timestamp") INTO v_count, v_oldest
  FROM public.rate_limit_log r
  WHERE r.key = p_key AND r."timestamp" > now() - v_window;

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT false, GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_oldest + v_window - now())))::int);
    RETURN;
  END IF;

  INSERT INTO public.rate_limit_log(key, "timestamp") VALUES (p_key, now());
  RETURN QUERY SELECT true, 0;
END;
$$;
REVOKE ALL ON FUNCTION public.rate_limit_hit(text, int, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, int, bigint) TO service_role;
```

**En `lib/rate-limit.ts`:** reemplazar el cuerpo de `persistentRateLimit` y fallar cerrado por defecto.

```ts
export async function persistentRateLimit(
  identifier: string, limit: number, windowMs: number, options: { failOpen?: boolean } = {}
): Promise<{ success: boolean; remaining: number; retryAfter?: number }> {
  try {
    const { data, error } = await createAdminClient()
      .rpc('rate_limit_hit', { p_key: `ratelimit:${identifier}`, p_limit: limit, p_window_ms: windowMs })
      .single();
    if (error || !data) throw error ?? new Error('rate limit unavailable');
    const row = data as { allowed: boolean; retry_after_s: number };
    return row.allowed ? { success: true, remaining: 0 } : { success: false, remaining: 0, retryAfter: row.retry_after_s };
  } catch {
    console.error('[RateLimit] Persistent limiter unavailable', { identifier });
    return options.failOpen ? rateLimit(identifier, limit, windowMs) : { success: false, remaining: 0, retryAfter: 60 };
  }
}
```

- En `candidatos/postular/route.ts:9`, quitar `const persistentRateLimit = rateLimit;` e importar la función real.
- Para la IP, usar el primer valor de `x-forwarded-for`, que Vercel establece él mismo.

### R-09 — Límites por plan (OP-10)

**Bloqueado por la decisión 6 de la Fase 3.** El diseño es este; los números no:

- Un único objeto `PLAN_LIMITS` en `lib/plan-limits.ts`. Hoy la única referencia es el comentario de `create_license_system.sql:65`: demo = 1 vacante, 1 candidato y 1 evaluación.
- El límite se evalúa sobre **el dueño de la vacante**:
  - en `vacantes/crear`: contar las vacantes del usuario;
  - en `postular`: contar los candidatos de las vacantes del dueño;
  - en `iniciar-whatsapp`: contar las evaluaciones.
- Para evitar carreras, contar e insertar dentro de una misma función SQL con bloqueo, igual que en R-08.
- `lib/license-manager.ts` y `canCreateVacante` del panel solo sirven para mostrar mensajes; nunca son el control.

### R-10 — CSP con nonce en `proxy.ts` (SEG-14)

Next.js 16 deprecó `middleware.ts` en favor de `proxy.ts` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/middleware.md`). Pasos:

1. Migrar con `npx @next/codemod@canary middleware-to-proxy .`. La función exportada pasa a llamarse `proxy`.
2. Generar la CSP con nonce, según `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`:

```ts
const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const isDev = process.env.NODE_ENV === 'development';
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
  `style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`} https://fonts.googleapis.com`,
  `img-src 'self' blob: data:`,
  `font-src 'self' https://fonts.gstatic.com`,
  `connect-src 'self' ${supabaseUrl} ${supabaseUrl.replace('https://', 'wss://')}`,
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
].join('; ');

const requestHeaders = new Headers(request.headers);
requestHeaders.set('x-nonce', nonce);
requestHeaders.set('Content-Security-Policy', csp);
const response = NextResponse.next({ request: { headers: requestHeaders } });
response.headers.set('Content-Security-Policy', csp);
```

3. Mantener las demás cabeceras de seguridad actuales.
4. El proxy solo **redirige** a `/auth/login` si falta la cookie en páginas privadas. La autorización real la hacen las rutas (R-01). Quitar `isValidJWT` (código muerto) y el parseo de formato del JWT.

**Costo:** con nonce, las páginas se renderizan de forma dinámica (sin caché estática ni PPR). La alternativa documentada es SRI experimental (`experimental.sri`), que conserva el renderizado estático. Decidir en staging tras medir.

**Cierre:** T-HDR-01 con cero violaciones de CSP en la consola en `/`, `/auth/login`, `/dashboard/reclutador` y `/postular/<id>`.

---

## 6. Etapa 3 — Privacidad y operación

### R-11 — Códigos de licencia fuera de los logs (N-08)

En `app/api/admin/generate-license/route.ts:97-101`:

```ts
console.log('[ADMIN] License codes generated', { cantidad: data?.length ?? 0, timestamp: new Date().toISOString() });
```

Además, rotar los códigos generados que hayan quedado en los logs de Vercel.

### R-12 — Llave propia para administración (N-09)

- En `admin/generate-token` y `admin/limpiar`, usar `ADMIN_JWT_SECRET` (nuevo, de 32 bytes aleatorios o más) en lugar de `SUPABASE_JWT_SECRET`. Verificar además `iss: 'shortlist-admin'` y `aud: 'admin'`.
- Agregar `persistentRateLimit('admin-token:<ip>', 5, 900000)` al inicio de `generate-token`.
- En `limpiar`, eliminar el método "legacy" `X-Admin-Token` (líneas 42-58) y registrar la acción en `audit_log`.
- A mediano plazo: rol de administrador en Supabase Auth con MFA, y retirar el secreto compartido.

### R-13 — Copia en GoDaddy (SEG-16, OP-08)

En `lib/dual-sync.ts`:

- Añadir `syncDeleteCandidato(id)` y `syncUpdateCandidatoEstado(id, estado)`, con la misma forma que `syncDeleteVacante`. Llamarlas desde `candidatos/eliminar` y desde el PATCH de `candidatos/[id]`.
- Quitar de `syncCreateUser` y `syncCreateVacante` la escritura a Supabase (líneas 36-45 y 93-104): duplica la escritura que ya hizo la ruta (OP-08).

En `lib/godaddy-db.ts`:

- Agregar `ssl: { rejectUnauthorized: true }` a la configuración, o la CA del proveedor si la exige. Confirmar con GoDaddy que el servidor acepta TLS.
- Reemplazar `connection.end()` por `connection.release()` en las conexiones del pool.

En MySQL (GoDaddy): `ALTER TABLE candidatos MODIFY id VARCHAR(64);`. Los IDs `candidato-<uuid>` tienen 46 caracteres y no caben en `VARCHAR(36)`.

**Decisión pendiente:** la réplica solo copia los datos de un usuario fijo (`dual-sync.ts:19`). Confirmar con ese cliente y con asesoría legal si debe mantenerse.

### R-14 — Consentimiento con la empresa correcta (SEG-15)

- La RPC `get_vacante_publica` (R-03) ya devuelve `empresa`. En `app/postular/[slug]/page.tsx:396`, mostrar ese nombre en lugar de "Forniture City".
- Eliminar `localStorage.setItem('candidatos_postulantes', …)` (`page.tsx:291`).
- Guardar la versión del texto aceptado:

```sql
ALTER TABLE public.consent_log ADD COLUMN IF NOT EXISTS version_aviso text;
```

El formulario envía `version_aviso` (por ejemplo `'2026-09-v1'`) y `postular` lo guarda.

### R-15 — Código de cifrado sin uso (SEG-17)

Eliminar `encryptSensitiveData`, `decryptSensitiveData` y `getEncryptionKey` de `lib/security-utils.ts:98-167`. Ninguna ruta los usa. Si en el futuro se necesita cifrado de campos, usar AES-256-GCM con una llave de 32 bytes decodificada y verificar la etiqueta de autenticación.

### R-16 — URL de la API de WhatsApp (N-13)

En `lib/whatsapp.ts:3`, usar `https://graph.facebook.com/v20.0`. Confirmar en la documentación de Meta la versión vigente de la Graph API antes de activar envíos reales.

### R-17 — Servicio Flask (N-12)

Retirar `shortlist-scoring-service/` del despliegue y del repositorio: ninguna ruta lo llama. Si se decide conservarlo, debe escuchar solo en red privada y tener autenticación, `MAX_CONTENT_LENGTH` y validación de JSON.

### R-18 — Reporte con la empresa y las fechas correctas (OP-14, OP-07)

- En `components/ProfessionalReportModal.tsx:29`, quitar el valor por defecto `'FORNITURE CITY'` y hacer obligatorio el prop `company`. El panel lo toma de `/api/auth/check-plan` (agregar allí `nombre`). En la línea 299, usar el mismo prop.
- Para el Excel y el PDF, llamar a `POST /api/candidatos/exportar`, que ya valida el rango de fechas (`exportar:72-73`), en lugar de generar el archivo en el navegador con todos los candidatos.

### R-19 — Deduplicación del webhook (SEG-10, residual)

Guardar `message.id` en una tabla con clave única y descartar los repetidos antes de llamar a `handleIncomingMessage`.

### R-20 — Sesión con renovación (OP-01)

Migrar el inicio de sesión y la lectura de sesión a `@supabase/ssr` (ya instalado), con cookies de access y refresh gestionadas por la librería. Así `requireUser` puede renovar la sesión, en lugar de que caduque a la hora. Leer la guía de la versión instalada antes de implementarlo.

---

## 7. Verificación y reversión

| Corrección | Pruebas (Fase 4) | Cómo revertir |
|---|---|---|
| R-01 a R-06 | T-DB-01…07, T-AUTH-01…03, T-BOLA-01…14, T-POS-01…08 | Redesplegar el commit anterior y restaurar las políticas guardadas antes de R-03 |
| R-07 | T-BIZ-01, T-FILE-01…03 | Revertir el commit; la columna `cv_evaluado` es aditiva |
| R-08 | T-RL-01…03 | `DROP FUNCTION rate_limit_hit` y revertir `lib/rate-limit.ts` |
| R-09 | T-BIZ-02, T-BIZ-03 | Revertir el commit |
| R-10 | T-HDR-01 | Revertir a la CSP anterior en `proxy.ts` |
| R-11 a R-20 | T-ADM-04; ciclo de vida del candidato sintético en staging | Revertir cada commit por separado |

**Pruebas nuevas recomendadas:**

- Unitarias: `ownerOf`, `isPdf`, el esquema zod de `personalizar-preguntas`.
- De integración contra staging (Fase 4, sección 6): RLS con `anon` y con dos usuarios. Los mocks actuales de `tests/` no pueden detectar errores de RLS.

**Cada corrección va en su propio commit,** con el ID `R-xx` en el mensaje. Así se puede revertir una sin arrastrar las demás.
