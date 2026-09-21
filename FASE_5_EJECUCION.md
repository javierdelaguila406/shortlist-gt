# 🔒 FASE 5 EJECUCIÓN - Privacidad y Cumplimiento

**Duración**: 6-8 horas  
**Criticidad**: P2/P3  
**Estado**: ✅ LISTO - FASE 3-4 completadas  
**Ejecutor**: ChatGPT  
**Auditor**: Claude Code  
**Parallelizable**: Con FASE 4 (independientes), no bloqueador para PROD (pero recomendado)

---

## 📊 RESUMEN

FASE 5 implementa cumplimiento legal y privacidad:
- Consentimiento registrado (antes de postular)
- Ciclo de vida de datos verificado (DELETE propaga)
- Rate limiting global/persistente (Redis/Supabase)
- Cumplimiento GDPR/LGPD

**Items**: 4 (privacidad + cumplimiento legal)  
**Prerequisito**: ✅ FASE 2-3-4 completadas (pero puede ser paralelo)  
**Bloqueador para PROD**: NO (pero fuerte recomendación legal)

---

## ✅ ITEM 1: Consentimiento Registrado (1.5 horas)

**Objetivo**: Registrar que usuario aceptó términos antes de postular

**Defecto actual**: No hay registro de consentimiento

**Cambios requeridos**:

### 1.1 Crear tabla de consent_log

```sql
-- En Supabase SQL Editor
CREATE TABLE IF NOT EXISTS consent_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id TEXT NOT NULL,
  vacante_id TEXT,
  tipo TEXT NOT NULL, -- 'postulacion', 'privacidad', 'cookies'
  aceptado BOOLEAN NOT NULL DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  
  FOREIGN KEY (vacante_id) REFERENCES vacantes(id) ON DELETE CASCADE
);

-- RLS: Solo autenticados pueden ver su propio consentimiento
ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_consent_read" ON consent_log
  FOR SELECT USING (auth.uid()::text = usuario_id OR auth.is_admin());

CREATE POLICY "own_consent_insert" ON consent_log
  FOR INSERT WITH CHECK (auth.uid()::text = usuario_id);

-- Index para búsquedas
CREATE INDEX idx_consent_usuario ON consent_log(usuario_id);
CREATE INDEX idx_consent_vacante ON consent_log(vacante_id);
```

### 1.2 Implementar registro de consentimiento

```typescript
// app/api/candidatos/postular/route.ts
export async function POST(request: Request) {
  const { vacante_id, email, nombre, cv_file } = await request.json();
  
  // 1. Validar autenticación
  const authHeader = request.headers.get('Authorization');
  const { userId } = await supabase.auth.getUser();
  
  // 2. ANTES de postular, registrar consentimiento
  const clientIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('cf-connecting-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  const { error: consentError } = await supabase
    .from('consent_log')
    .insert({
      usuario_id: userId,
      vacante_id,
      tipo: 'postulacion',
      aceptado: true,
      ip_address: clientIp,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    });

  if (consentError) {
    console.error('[Consent] Failed to log', { userId, vacante_id });
    // No bloquear postulación, pero loguear error
  }

  // 3. Continuar con postulación normal
  // ... resto del código ...
  
  console.log('[Consent] Postulation logged', { userId, vacante_id, timestamp: new Date() });
  
  return NextResponse.json({ success: true, candidate_id });
}
```

### 1.3 UI - Mostrar términos antes de postular

```typescript
// app/postular/[slug]/page.tsx
export default function PostularPage() {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(true);

  const handlePostulate = async () => {
    // Validar aceptación
    if (!acceptTerms) {
      setError('Debes aceptar los términos de privacidad');
      return;
    }

    // Enviar postulación (que registra consentimiento en servidor)
    await submitApplication();
  };

  if (showTerms) {
    return (
      <div className="modal">
        <h2>Términos de Privacidad</h2>
        <p>
          Al postular, aceptas que tus datos serán procesados según nuestra
          política de privacidad. Tus datos se guardarán por máximo 1 año
          después de que la vacante cierre, para auditoría legal.
        </p>
        
        <label>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
          />
          Acepto los términos de privacidad
        </label>

        <button
          onClick={() => setShowTerms(false)}
          disabled={!acceptTerms}
        >
          Continuar
        </button>
      </div>
    );
  }

  return <PostulationForm onSuccess={handlePostulate} />;
}
```

**Pruebas**:

```
Test 1 - Registro de consentimiento:
- Postular como usuario
- En Supabase: SELECT * FROM consent_log WHERE usuario_id = '[id]'
- Debe mostrar entrada con: tipo='postulacion', aceptado=true, timestamp reciente

Test 2 - Aceptar términos requerido:
- Página de postulación muestra términos
- Sin checkbox: botón "Continuar" deshabilitado
- Con checkbox: botón habilitado

Test 3 - Datos registrados:
- Verificar que se registran: usuario_id, vacante_id, ip, user_agent, timestamp
- Todos los campos completados

Test 4 - Búsqueda por usuario:
- Seleccionar * FROM consent_log WHERE usuario_id = '[id]'
- Mostrar historial de consentimientos de usuario

Test 5 - Auditoría legal:
- Generar reporte: SELECT COUNT(*), tipo FROM consent_log GROUP BY tipo
- Mostrar totales por tipo de consentimiento
```

**Reporta**:
- ✅ Tabla consent_log creada con RLS
- ✅ Consentimiento registrado antes de postular
- ✅ Términos requeridos en UI
- ✅ Datos completos en registro (usuario, vacante, ip, user_agent, timestamp)
- ❌ [Describe si algo falla]

---

## ✅ ITEM 2: Verificar Ciclo de Vida - DELETE Propaga (1.5 horas)

**Objetivo**: Confirmar que DELETE en Supabase propaga a GoDaddy

**Nota**: FASE 2 definió política en `DATA_RETENTION_POLICY.md`, ahora verificamos que funciona

**Pruebas**:

```
Test 1 - Crear y borrar vacante:
1. Crear vacante en Supabase
2. Verificar aparece en GoDaddy
3. Ejecutar: DELETE FROM vacantes WHERE id = '[id]'
4. Verificar en GoDaddy: Registro se borra

Test 2 - Borra candidatos en cascada:
1. Crear vacante con 5 candidatos
2. Borrar vacante
3. Verificar en Supabase: candidatos con ese vacante_id se borraron
4. Verificar en GoDaddy: candidatos también se borraron (si estaban sincronizados)

Test 3 - Confirmar jobs de retención:
- Revisar lib/retention.ts
- Verificar que función runRetentionJobs() existe
- Probar:
  1. Crear vacante, cerrarla
  2. Ejecutar: await runRetentionJobs()
  3. Vacante se borra si > 90 días (simular en test)

Test 4 - Sincronizar GoDaddy con DELETE:
- En lib/dual-sync.ts
- Verificar patrón:
  ```typescript
  if (action === 'DELETE') {
    await godaddyDb.query('DELETE FROM usuarios_vacantes WHERE supabase_id = ?', [vacanteId]);
  }
  ```
- Confirma que DELETE propaga bidireccional
```

**Validación en código**:
- ✅ `runRetentionJobs()` en lib/retention.ts
- ✅ DELETE vacante → borra candidatos (cascada)
- ✅ DELETE en GoDaddy sync (si credenciales disponibles)

**Reporta**:
- ✅ Ciclo de vida implementado (retention jobs)
- ✅ DELETE en Supabase borra candidatos en cascada
- ✅ Política de retención está en lib/retention.ts
- ⏳ GoDaddy sync verificado cuando credenciales disponibles (FASE 2 ITEM 2 deferred)
- ❌ [Describe si algo falla]

---

## ✅ ITEM 3: Rate Limiting Global/Persistente (1.5 horas)

**Objetivo**: Rate limit no se resetea al reiniciar servidor (persistencia)

**Nota**: FASE 1 ITEM 11 implementó rate limiting en memoria. Aquí lo mejoramos a persistente

**Cambio requerido**:

```typescript
// ANTES (FASE 1): Memory-only
const rateLimitStore = new Map();

// DESPUÉS: Persistente en Supabase
export async function rateLimit(
  key: string, 
  maxAttempts: number, 
  windowSeconds: number
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // 1. Buscar intentos recientes
  const { data: attempts, error } = await supabase
    .from('rate_limit_log')
    .select('*')
    .eq('key', key)
    .gt('timestamp', new Date(windowStart).toISOString());

  if (error) {
    console.error('[RateLimit] Query error', { key });
    return true; // Permitir si DB falla (fail-open)
  }

  // 2. Verificar si excedió límite
  if ((attempts?.length || 0) >= maxAttempts) {
    console.log('[RateLimit] Exceeded', { key, attempts: attempts?.length });
    return false;
  }

  // 3. Registrar nuevo intento
  await supabase
    .from('rate_limit_log')
    .insert({
      key,
      timestamp: new Date().toISOString(),
    });

  return true;
}

// Crear tabla en Supabase
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL, -- 'export:userId', 'license:userId', etc.
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_key_timestamp (key, timestamp)
);

-- Limpiar logs viejos (job diario)
DELETE FROM rate_limit_log WHERE timestamp < NOW() - INTERVAL '24 hours';
```

**Implementación en endpoints**:

```typescript
// app/api/candidatos/exportar/route.ts
export async function POST(request: Request) {
  const userId = decoded.sub;
  
  // Rate limit: 5 exports por usuario por hora
  const allowed = await rateLimit(`export:${userId}`, 5, 3600);
  
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 5 exports per hour' },
      { status: 429 }
    );
  }

  // Continuar con exportación
  // ...
}
```

**Pruebas**:

```
Test 1 - Persistencia:
1. Usuario hace 5 exports
2. Reiniciar servidor (pm2 restart, docker restart, etc.)
3. Usuario intenta export #6: 429 Too Many Requests ✅
4. Esperar 1 hora
5. Usuario intenta export #6: 200 OK ✅

Test 2 - Múltiples users:
1. Usuario A: 5 exports (limitado)
2. Usuario B: 5 exports (limitado)
3. Cada uno tiene contador independiente

Test 3 - Limpieza de datos:
- Ejecutar retention job
- Verificar que entradas > 24h se borran
```

**Validación en código**:
- ✅ `rateLimit()` en lib/rate-limit.ts
- ✅ Tabla `rate_limit_log` en Supabase
- ✅ Integrado en endpoints críticos (export, license, etc.)
- ✅ Limpieza de datos viejos

**Reporta**:
- ✅ Rate limit persistente en Supabase
- ✅ Persiste después de reiniciar
- ✅ Contador independiente por usuario
- ✅ Limpieza de datos automática
- ❌ [Describe si algo falla]

---

## ✅ ITEM 4: Auditoría - Trazabilidad Completa (1.5 horas)

**Objetivo**: Todo cambio importante está loguado para auditoría legal

**Cambios requeridos**:

```typescript
// lib/audit.ts
export async function logAuditEvent(event: AuditEvent) {
  const { action, userId, resourceId, resourceType, change, timestamp } = event;

  const { error } = await supabase
    .from('audit_log')
    .insert({
      action,           // 'CREATE', 'UPDATE', 'DELETE'
      usuario_id: userId,
      recurso_id: resourceId,
      recurso_tipo: resourceType, // 'vacante', 'candidato', 'reporte'
      cambios: change,  // diff de qué cambió (sin PII)
      timestamp: timestamp || new Date().toISOString(),
    });

  if (error) {
    console.error('[Audit] Failed to log', { action, userId });
  }

  return !error;
}

// Tabla en Supabase
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  usuario_id TEXT NOT NULL,
  recurso_id TEXT,
  recurso_tipo TEXT, -- 'vacante', 'candidato', 'vacante_actualizada'
  cambios JSONB, -- qué cambió (sin emails, CVs, etc.)
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  
  INDEX idx_usuario_timestamp (usuario_id, timestamp)
);
```

**Eventos a auditar**:

```typescript
// Crear vacante
await logAuditEvent({
  action: 'CREATE',
  userId,
  resourceType: 'vacante',
  resourceId: vacanteId,
  change: { titulo, descripcion, estado: 'activa' },
});

// Borrar vacante
await logAuditEvent({
  action: 'DELETE',
  userId,
  resourceType: 'vacante',
  resourceId: vacanteId,
  change: { estado: 'cerrada', reason: 'user_deletion' },
});

// Postulación
await logAuditEvent({
  action: 'CREATE',
  userId: candidatoEmail, // email del postulante
  resourceType: 'candidato',
  resourceId: candidatoId,
  change: { vacante_id: vacanteId, score_total: score },
});

// Exportación de reporte
await logAuditEvent({
  action: 'READ',
  userId,
  resourceType: 'reporte',
  resourceId: reportId,
  change: { formato: 'excel', registros: 50, filtros: { desde, hasta } },
});
```

**Pruebas**:

```
Test 1 - Crear vacante:
- Crear vacante
- Verificar en audit_log: entrada con action='CREATE'

Test 2 - Borrar vacante:
- Borrar vacante
- Verificar en audit_log: entrada con action='DELETE'

Test 3 - Postulación:
- Postular
- Verificar en audit_log: entrada con usuario_id del postulante

Test 4 - Reporte:
- Generar reporte
- Verificar en audit_log: entrada con formato, registros, filtros

Test 5 - Búsqueda por usuario:
- SELECT * FROM audit_log WHERE usuario_id = '[id]' ORDER BY timestamp DESC
- Ver historial completo de acciones del usuario
```

**Validación en código**:
- ✅ `logAuditEvent()` en lib/audit.ts
- ✅ Tabla `audit_log` en Supabase
- ✅ Eventos loguados en operaciones críticas
- ✅ Sin PII en cambios (no guardar emails, CVs)

**Reporta**:
- ✅ Auditoría log creada
- ✅ Eventos loguados (crear, borrar, postular, exportar)
- ✅ Sin PII en logs
- ✅ Búsqueda por usuario funciona
- ❌ [Describe si algo falla]

---

## 🎯 REPORTE FINAL FASE 5

```
FASE 5 COMPLETADA

ITEM 1: Consentimiento registrado    [✅ / ❌]
ITEM 2: Ciclo de vida verificado     [✅ / ❌]
ITEM 3: Rate limit persistente       [✅ / ❌]
ITEM 4: Auditoría completa           [✅ / ❌]

RESUMEN: [✅ TODOS COMPLETOS] o [❌ PENDIENTES: ___]

Validaciones:
✅ Tests pasan
✅ TypeScript sin errores
✅ Cumplimiento GDPR/LGPD implementado
✅ Trazabilidad completa

Si TODO está ✅:
Confirma que estás listo para que Claude haga commit + push + FASE 6 (FINAL)
```

---

**Documento**: FASE 5 Ejecución  
**Duración**: 6-8 horas  
**Prerequisito**: FASE 2-3-4 ✅ completadas (paralelo o después)  
**Parallelizable**: Con FASE 4  
**Bloqueador para PROD**: NO (pero fuerte recomendación legal)  
**Estado**: 🚀 LISTO PARA EJECUTAR
