# 🔐 FASE 1: AUTORIZACIÓN COMPLETA - EJECUCIÓN

**Para**: ChatGPT  
**Prerequisito**: FASE_0_EJECUCION completada ✅  
**Objetivo**: Cerrar vulnerabilidades de autorización en APIs  
**Duración**: 12-16 horas (días 2-4)  
**Auditor**: Claude Code verificará después

---

## 📋 PRE-CONDICIÓN

✅ Verificar que FASE 0 está COMPLETA:
```bash
# Secretos revocados
grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | grep -v "sb_secret_0B"

# Middleware arreglado
grep "pathname === route" middleware.ts

# DELETE autenticado
grep "Authorization" app/api/vacantes/eliminar/route.ts
```

---

## 🎯 OBJETIVOS FASE 1

1. ✅ Autorización en TODAS las APIs críticas
2. ✅ Verificación de propiedad (usuario/empresa/recurso)
3. ✅ RLS auditada en Supabase
4. ✅ Tests de autorización con 2 usuarios
5. ✅ Sincronización idempotente (GoDaddy)
6. ✅ Esquema de datos coherente

---

## 📋 ITEMS FASE 1

### ITEM 1: Completar DELETE `/api/vacantes/eliminar` con JWT

**Tiempo**: 30 minutos  
**Archivo**: `app/api/vacantes/eliminar/route.ts`

**ANTES** (donde está el cambio de Fase 0):
```typescript
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// NUEVO: Verificar que el usuario es dueño de la vacante
const { data: vacante, error: vacError } = await supabase
  .from('vacantes')
  .select('usuario_id')
  .eq('id', vacante_id)
  .single();

if (vacError || !vacante) {
  return NextResponse.json(
    { error: 'Vacante no encontrada', success: false },
    { status: 404 }
  );
}

// Extraer usuario_id del token (SIMPLIFICADO - ver ITEM 8 para JWT completo)
// Por ahora, aceptar cualquier token válido
// TODO: Verificar que vacante.usuario_id == userId del JWT
```

**DESPUÉS** (agregar verificación JWT):
```typescript
import { jwtDecode } from 'jwt-decode';

// ... en la función DELETE

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Decodificar JWT para obtener usuario_id
let userId: string;
try {
  const decoded = jwtDecode(token) as any;
  userId = decoded.sub; // sub es el user_id en Supabase JWT
} catch (e) {
  return NextResponse.json(
    { error: 'Token inválido', success: false },
    { status: 401 }
  );
}

// Verificar que el usuario es dueño de la vacante
const { data: vacante, error: vacError } = await supabase
  .from('vacantes')
  .select('usuario_id')
  .eq('id', vacante_id)
  .single();

if (vacError || !vacante) {
  return NextResponse.json(
    { error: 'Vacante no encontrada', success: false },
    { status: 404 }
  );
}

// VERIFICAR PROPIEDAD
if (vacante.usuario_id !== userId) {
  return NextResponse.json(
    { error: 'Forbidden - No eres dueño de esta vacante', success: false },
    { status: 403 }
  );
}
```

**Validación**:
```bash
# Verificar JWT decode
grep -n "jwtDecode" app/api/vacantes/eliminar/route.ts

# Verificar comparación usuario_id
grep -n "usuario_id !== userId" app/api/vacantes/eliminar/route.ts

# Verificar status 403
grep -n "status.*403" app/api/vacantes/eliminar/route.ts
```

---

### ITEM 2: BOLA Fix `/api/candidatos/listar`

**Tiempo**: 20 minutos  
**Archivo**: `app/api/candidatos/listar/route.ts`

**CAMBIO CRÍTICO** (línea 1-15):

**ANTES**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const vacante_id = searchParams.get('vacante_id');

    if (!vacante_id) {
      return NextResponse.json(
        { error: 'vacante_id requerido', success: false },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    // GET candidatos por vacante_id sin auth
    const { data: candidatos } = await supabase
      .from('candidatos')
      .select('*')
      .eq('vacante_id', vacante_id);
```

**DESPUÉS** (agregar Authorization):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';

export async function GET(request: NextRequest) {
  try {
    // NUEVO: Validar Authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    // Decodificar para obtener usuario_id
    let userId: string;
    try {
      const decoded = jwtDecode(token) as any;
      userId = decoded.sub;
    } catch (e) {
      return NextResponse.json(
        { error: 'Token inválido', success: false },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const vacante_id = searchParams.get('vacante_id');

    if (!vacante_id) {
      return NextResponse.json(
        { error: 'vacante_id requerido', success: false },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    // NUEVO: Verificar que el usuario es dueño de la vacante
    const { data: vacante, error: vacError } = await supabase
      .from('vacantes')
      .select('usuario_id')
      .eq('id', vacante_id)
      .single();

    if (vacError || !vacante || vacante.usuario_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', success: false },
        { status: 403 }
      );
    }

    // Listar candidatos de la vacante propia
    const { data: candidatos } = await supabase
      .from('candidatos')
      .select('*')
      .eq('vacante_id', vacante_id);
```

**Validación**:
```bash
# Verificar Authorization check
grep -n "Authorization" app/api/candidatos/listar/route.ts

# Verificar JWT decode
grep -n "jwtDecode" app/api/candidatos/listar/route.ts

# Verificar propiedad
grep -n "usuario_id !== userId" app/api/candidatos/listar/route.ts
```

---

### ITEM 3: IDOR Fix `/api/candidatos/eliminar`

**Tiempo**: 20 minutos  
**Archivo**: `app/api/candidatos/eliminar/route.ts`

**Cambio**: Agregar validación de propiedad ANTES de eliminar

**ESTRUCTURA SIMILAR A ITEM 1 y 2**:
1. Validar Authorization header
2. Decodificar JWT
3. Obtener candidato
4. Verificar que `candidato.vacante.usuario_id == userId`
5. Si no, retornar 403

---

### ITEM 4: Autenticación `/api/candidatos/exportar`

**Tiempo**: 20 minutos  
**Archivo**: `app/api/candidatos/exportar/route.ts`

**Cambio**: Igual que ITEM 2-3:
1. Validar Authorization
2. Decodificar JWT
3. Verificar empresa/propiedad
4. Retornar 403 si no es propietario

---

### ITEM 5: License Code Brute Force Fix

**Tiempo**: 20 minutos  
**Archivo**: `/api/auth/use-license-code/route.ts`

**CRÍTICO**: No confiar en `userId` del body

**CAMBIO**:

**ANTES**:
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, licenseCode } = body;  // ❌ userId del cliente
```

**DESPUÉS**:
```typescript
import { jwtDecode } from 'jwt-decode';

export async function POST(request: NextRequest) {
  // Validar token
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let userId: string;
  try {
    const decoded = jwtDecode(token) as any;
    userId = decoded.sub;  // ✅ userId del JWT, no del body
  } catch (e) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const body = await request.json();
  const { licenseCode } = body;

  // Agregar rate limit: máx 5 intentos por usuario por hora
  // (ver ITEM 11 para implementación)
```

---

### ITEM 6: Auditar RLS en Supabase

**Tiempo**: 1 hora  
**Ubicación**: Supabase Dashboard  
**Crítico**: NO SE PUEDE AUTOMATIZAR

**Acción manual**:
1. Ir a https://supabase.com/dashboard
2. Proyecto: shortlist-gt
3. SQL Editor
4. Ejecutar:
   ```sql
   SELECT schemaname, tablename, policyname, qual, with_check 
   FROM pg_policies 
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```
5. Verificar que CADA tabla tiene políticas restrictivas:
   - ✅ Política para `SELECT`: Filtra por usuario_id
   - ✅ Política para `UPDATE`: Verifica propietario
   - ✅ Política para `DELETE`: Verifica propietario
   - ✅ NO hay políticas `Allow all` sin condiciones

**Reporte esperado** (fragmento):
```
tablename | policyname | qual | with_check
----------+------------|------|----------
vacantes  | author_own | auth.uid() = usuario_id | NULL
candidatos| author_own | auth.uid() = usuario_id | NULL
usuarios  | own_record | auth.uid() = id | NULL
...
```

**Si algo está MAL**:
- Reportar qué tabla/política está incorrecta
- Crear issue para Fase 1.5 (RLS fixes)

---

### ITEM 7: Sincronización Idempotente (GoDaddy)

**Tiempo**: 30 minutos  
**Archivo**: `lib/dual-sync.ts`

**CAMBIOS NECESARIOS**:

1. **Cambiar `user_id` a `usuario_id`** (línea 90-103):
```typescript
// ANTES:
INSERT INTO godaddy_vacante (id, titulo, usuario_id, estado, ...)
                           // ❌ Campo correcto es usuario_id en Supabase

// DESPUÉS:
INSERT INTO godaddy_vacante (id, titulo, usuario_id, estado, ...)
// ✅ Usar usuario_id (consistente con Supabase)
```

2. **Cambiar `estado: 'abierta'` a `estado: 'activa'`**:
```typescript
// ANTES:
const godaddyVacante = {
  ...vacante,
  estado: 'abierta'  // ❌ No existe en enum
};

// DESPUÉS:
const godaddyVacante = {
  ...vacante,
  estado: 'activa'   // ✅ Válido en enum
};
```

3. **Agregar verificación de duplicado** (línea 100):
```typescript
// ANTES:
await godaddyDb.query('INSERT INTO vacante ...', [values]);

// DESPUÉS:
// Verificar que no existe ya
const existing = await godaddyDb.query(
  'SELECT id FROM vacante WHERE id = ?',
  [vacante.id]
);

if (existing.length === 0) {
  // Insertar solo si no existe
  await godaddyDb.query('INSERT INTO vacante ...', [values]);
} else {
  // Actualizar si existe (idempotencia)
  await godaddyDb.query('UPDATE vacante SET ... WHERE id = ?', [values]);
}
```

---

### ITEM 8: Esquema Documentado

**Tiempo**: 1 hora  
**Acción**: Crear archivo `SCHEMA_CANONICAL.md`

**Contenido**:
```markdown
# Esquema Canónico SHORTLIST.GT

## Tabla: usuarios
- id (UUID) - PK
- email (string) - UK
- empresa_id (UUID) - FK → companies

## Tabla: empresas (ó companies)
- id (UUID) - PK
- nombre (string)

## Tabla: vacantes
- id (string) - PK
- titulo (string)
- usuario_id (UUID) - FK → usuarios
- estado (enum: 'activa', 'pausada', 'cerrada')
- creado_en (timestamp)

## Tabla: candidatos
- id (string) - PK
- email (string)
- vacante_id (string) - FK → vacantes
- score_total (number)
- creado_en (timestamp)

## Tabla: licenses
- id (UUID) - PK
- code (string) - UK
- usuario_id (UUID) - FK → usuarios
- plan (enum: 'free', 'pro', 'enterprise')
- estado (enum: 'disponible', 'canjeado', 'revocado')
```

**Validación**: Comparar código actual con este esquema, documentar discrepancias

---

### ITEM 9: Tests de Autorización

**Tiempo**: 2 horas  
**Ubicación**: Nueva carpeta `tests/authorization/`

**Crear archivo**: `tests/authorization/authorization.test.ts`

```typescript
describe('Authorization Tests', () => {
  let userA: any, userB: any;
  let companyA: any, companyB: any;
  
  beforeAll(async () => {
    // Crear 2 usuarios en Supabase
    // Crear 2 empresas
    // Crear vacantes para cada usuario
  });

  test('Usuario A NO puede listar candidatos de Usuario B', async () => {
    const response = await fetch('/api/candidatos/listar?vacante_id=...', {
      headers: { Authorization: `Bearer ${tokenUserB}` }
    });
    expect(response.status).toBe(403);
  });

  test('Usuario A puede borrar vacante propia', async () => {
    const response = await fetch('/api/vacantes/eliminar', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUserA}` },
      body: JSON.stringify({ vacante_id: vacanteA.id })
    });
    expect(response.status).toBe(200);
  });

  test('Usuario A NO puede borrar vacante de Usuario B', async () => {
    const response = await fetch('/api/vacantes/eliminar', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenUserA}` },
      body: JSON.stringify({ vacante_id: vacanteB.id })
    });
    expect(response.status).toBe(403);
  });
  
  // ... más tests
});
```

**Ejecución**:
```bash
npm test -- authorization.test.ts
```

**Resultado esperado**: ✅ Todos los tests PASAN

---

### ITEM 10: CI/CD - GitHub Actions

**Tiempo**: 1 hora  
**Ubicación**: `.github/workflows/security.yml`

```yaml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test -- authorization
      - run: npm audit --audit-level=moderate
```

---

### ITEM 11: Rate Limiting Distribuido

**Tiempo**: 1 hora  
**Tipo**: Upgrade de memory a Redis (opcional pero recomendado)

**Por ahora** (quick fix):
```typescript
// lib/rate-limit.ts

const limiter = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, maxRequests: number, windowSeconds: number): boolean {
  const now = Date.now();
  const entry = limiter.get(key);
  
  if (!entry || now > entry.reset) {
    limiter.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    return true;
  }
  
  if (entry.count < maxRequests) {
    entry.count++;
    return true;
  }
  
  return false;
}
```

**Uso en `/api/auth/use-license-code`**:
```typescript
const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
if (!rateLimit(`license:${clientIp}`, 5, 3600)) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

---

## 📊 REPORTE FINAL FASE 1

```
ITEM 1:  DELETE DELETE JWT         [✅ / ❌]
ITEM 2:  BOLA listar               [✅ / ❌]
ITEM 3:  IDOR eliminar             [✅ / ❌]
ITEM 4:  Export autenticado        [✅ / ❌]
ITEM 5:  License code brute force  [✅ / ❌]
ITEM 6:  RLS auditada              [✅ / ❌]
ITEM 7:  Sync idempotente          [✅ / ❌]
ITEM 8:  Esquema documentado       [✅ / ❌]
ITEM 9:  Tests autorización        [✅ / ❌]
ITEM 10: CI/CD GitHub Actions      [✅ / ❌]
ITEM 11: Rate limiting              [✅ / ❌]

RESULTADO FINAL: [✅ TODOS] o [❌ FALLOS: ___]

COMANDO FINAL:
git add .
git commit -m "Fase 1: Autorización completa en APIs críticas"
git push origin main
```

---

**Próximo**: FASE_2_EJECUCION.md (Persistencia y Sincronización)

**Auditor**: Claude Code verificará cada cambio después ✅
