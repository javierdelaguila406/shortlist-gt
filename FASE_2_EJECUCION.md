# 🚀 FASE 2 EJECUCIÓN - Persistencia y Datos

**Duración**: 6-8 horas  
**Criticidad**: P1  
**Estado**: ✅ LISTO - FASE 1 completada  
**Ejecutor**: ChatGPT  
**Auditor**: Claude Code  

---

## 📊 RESUMEN

FASE 2 valida que:
- Vacantes se guardan correctamente en Supabase
- Sincronización a GoDaddy es idempotente (sin duplicados)
- Datos de candidatos son coherentes y accesibles
- Webhooks se validan por firma
- Reportes filtran correctamente

**Items**: 7 (validación + implementación)  
**Bloqueadores**: 0 (FASE 1 es prerequisito)  
**Parallelizable con**: FASE 3 (Reportes) e FASE 4 (UI)

---

## ✅ ITEM 1: Validar Persistencia de Vacantes (30 minutos)

**Objetivo**: Confirmar que vacantes se guardan y recuperan correctamente.

**Pruebas en STAGING**:

```
1. En navegador (http://localhost:3000):
   - Login con usuario test
   - Crear vacante: "Senior Developer" 
   - Verificar que aparece en dashboard

2. Recargar página (F5):
   - Vacante debe persistir (no desaparecer)
   - Estado debe ser 'activa'
   - Fechas deben ser correctas

3. Nueva sesión (logout + login):
   - Vacante sigue visible
   - Mismo usuario la ve

4. Verificar en Supabase Console:
   - Ir a https://supabase.com/dashboard/project/shortlist-gt
   - SQL Editor → ejecutar:
   
   SELECT id, titulo, usuario_id, estado, created_at
   FROM vacantes 
   ORDER BY created_at DESC
   LIMIT 5;
   
   - Debe mostrar vacante creada
   - Estado = 'activa' (NOT 'abierta')
   - usuario_id = UUID del usuario

5. Test de enum inválido (desde terminal):
   curl -X POST http://localhost:3000/api/vacantes/crear \
     -H "Authorization: Bearer [TOKEN]" \
     -H "Content-Type: application/json" \
     -d '{"titulo":"Test","estado":"INVALIDO"}'
   
   Esperado: 400 Bad Request (enum validation error)
```

**Reporta**:
- ✅ Vacante persiste después de reload
- ✅ Nueva sesión ve vacante
- ✅ Supabase muestra registro correcto
- ✅ Enum inválido rechazado
- ❌ [Describe si algo falla]

---

## ⏸️ ITEM 2: Auditar Sincronización GoDaddy (DEFERRED)

**Status**: DEFERRED - Bloqueador externo  
**Motivo**: Credenciales `GODADDY_MYSQL_*` no disponibles en .env.local  
**Reschedule**: Cuando tenga credenciales reales de GoDaddy

**Objetivo**: Confirmar que sincronización NO duplica registros.

**Archivos a validar**:
- `lib/dual-sync.ts`
- `migrations/002_redeem_license_code_atomic.sql`

**Pruebas**:

```
1. Crear usuario sincronizable en Supabase:
   - Email: test-sync@example.com
   - company_id = [empresa que tiene GoDaddy sync]
   - Verificar en supabase que existe

2. Crear vacante para usuario sincronizable:
   - Titular: "Sync Test Vacante"
   - Debe aparecer en Supabase con estado = 'activa'

3. Verificar sincronización a GoDaddy:
   - Acceder a GoDaddy MySQL
   - Ejecutar query:
   
   SELECT id, titulo, usuario_id, estado, created_at
   FROM usuarios_vacantes
   WHERE usuario_id = 'test-sync@example.com'
   AND titulo = 'Sync Test Vacante';
   
   Resultado esperado: UNA SOLA ROW

4. Test de reintento (simular failover):
   - Ejecutar sincronización nuevamente (o simular reintento)
   - Ejecutar query nuevamente → aún UNA SOLA ROW
   - Verificar que campo `updated_at` cambió pero ID es el mismo

5. Validar en código:
   - En lib/dual-sync.ts debe haber:
     ```typescript
     // Check if vacante already exists
     const existing = await godaddyDb
       .query('SELECT id FROM usuarios_vacantes WHERE usuario_id = ? AND supabase_id = ?', 
              [usuario_id, vacanteId]);
     
     if (existing.length > 0) {
       // UPDATE, no INSERT
       await godaddyDb.query('UPDATE usuarios_vacantes SET ... WHERE id = ?', [existing[0].id]);
     } else {
       // INSERT
       await godaddyDb.query('INSERT INTO usuarios_vacantes ...');
     }
     ```
```

**Reporta**:
- ✅ Vacante sincronizada a GoDaddy (encontrada 1 row)
- ✅ Reintento no duplica (aún 1 row)
- ✅ Código contiene lógica upsert/idempotente
- ❌ Duplicados encontrados: [describe]
- ❌ GoDaddy no accesible: [describe]

---

## ✅ ITEM 3: Validar Coherencia de Esquema (45 minutos)

**Objetivo**: Confirmar que campos están mapeados correctamente.

**Verificaciones**:

```
1. En Supabase, ejecutar:
   SELECT table_name, column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name IN ('usuarios', 'empresas', 'vacantes', 'candidatos', 'licenses')
   ORDER BY table_name, ordinal_position;

2. Verificar que:
   ✅ vacantes.usuario_id existe (UUID, not null)
   ✅ vacantes.estado es enum con valores: 'activa', 'pausada', 'cerrada'
   ✅ candidatos.vacante_id existe (UUID, foreign key)
   ✅ licenses.usuario_id existe (UUID)
   ✅ licenses.plan es enum: 'free', 'pro', 'enterprise'
   
3. En lib/dual-sync.ts, verificar:
   - Mapeo de 'usuario_id' (NOT 'user_id')
   - Mapeo de 'estado: activa' (NOT 'abierta')
   - Que correlationId se loguea para rastreo

4. Comparar con SCHEMA_CANONICAL.md:
   - Debe reflejar lo que verás en information_schema
   - Todos los tipos deben coincidir
```

**Reporta**:
- ✅ Esquema coherente, sin discrepancias
- ✅ Enums correctos (activa/pausada/cerrada)
- ✅ Mapeo campos correcto (usuario_id, NOT user_id)
- ❌ Discrepancias encontradas: [lista]

---

## ✅ ITEM 4: Fijar Validación de Webhooks - WhatsApp (45 minutos)

**Archivo**: `app/api/webhooks/whatsapp/route.ts`

**Objetivo**: Rechazar webhooks sin firma HMAC válida.

**Cambios requeridos**:

```typescript
import crypto from 'crypto';

export async function POST(request: Request) {
  const signature = request.headers.get('X-Hub-Signature-256');
  
  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 401 }
    );
  }

  const body = await request.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  
  // Calcular HMAC-SHA256
  const hash = crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex');
  
  const expectedSignature = `sha256=${hash}`;
  
  // Validar firma
  if (!crypto.timingSafeEqual(signature, expectedSignature)) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // Procesar webhook
  const data = JSON.parse(body);
  
  // ... procesar evento ...
  
  return NextResponse.json({ success: true });
}
```

**Validación**:

```bash
# Test con firma válida (debe pasar)
WEBHOOK_SECRET="tu_secret_aqui"
BODY='{"message":"test"}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "X-Hub-Signature-256: sha256=$SIG" \
  -H "Content-Type: application/json" \
  -d "$BODY"

# Esperado: 200 OK

# Test sin firma (debe fallar)
curl -X POST http://localhost:3000/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Esperado: 401 Unauthorized
```

**Reporta**:
- ✅ Webhook con firma válida: 200 OK
- ✅ Webhook sin firma: 401 Unauthorized
- ✅ Webhook con firma inválida: 401 Unauthorized
- ❌ Validación falla: [describe]

---

## ✅ ITEM 5: Validar Exportación PDF/Excel (1.5 horas)

**Objetivo**: Confirmar que exportación de candidatos es confiable.

**Archivo**: `app/api/candidatos/exportar/route.ts`

**Pruebas**:

```
1. Crear candidatos de prueba:
   - Vacante: "Test Export"
   - Candidatos: 5 (con CVs válidos)
   - Estado: algunos aceptados, algunos rechazados

2. Test de rango válido:
   curl -X POST http://localhost:3000/api/candidatos/exportar \
     -H "Authorization: Bearer [TOKEN]" \
     -H "Content-Type: application/json" \
     -d '{
       "vacante_id": "[ID]",
       "formato": "excel",
       "desde": "2026-01-01",
       "hasta": "2026-12-31"
     }'
   
   Esperado: 200 OK, archivo descargable

3. Test de rango vacío (sin candidatos):
   curl -X POST http://localhost:3000/api/candidatos/exportar \
     -H "Authorization: Bearer [TOKEN]" \
     -H "Content-Type: application/json" \
     -d '{
       "vacante_id": "[ID_DISTINTO]",
       "formato": "excel",
       "desde": "2026-01-01",
       "hasta": "2026-12-31"
     }'
   
   Esperado: 200 OK, archivo vacío (0 datos, solo headers)
   NO debe ser error 400/404

4. Test de rango invertido:
   curl -X POST http://localhost:3000/api/candidatos/exportar \
     -H "Authorization: Bearer [TOKEN]" \
     -H "Content-Type: application/json" \
     -d '{
       "vacante_id": "[ID]",
       "formato": "excel",
       "desde": "2026-12-31",
       "hasta": "2026-01-01"
     }'
   
   Esperado: 400 Bad Request
   Respuesta: { "error": "Fecha inicial debe ser anterior a final" }

5. Test de no-autorización:
   curl -X POST http://localhost:3000/api/candidatos/exportar \
     -H "Authorization: Bearer [OTRO_USUARIO]" \
     -H "Content-Type: application/json" \
     -d '{...}'
   
   Esperado: 403 Forbidden

6. Test de rate limit:
   - Hacer 5 exports (OK)
   - 6to export: 429 Too Many Requests
   - Esperar 1 hora (en staging: clearear rate limit)
   - 6to export nuevamente: OK
```

**Validación de contenido** (descargar archivo y verificar):
```
- Números coinciden entre lo que viste en UI y en Excel
- Headers en Excel: email, nombre, estado, score_total, fecha_postulacion
- Sin caracteres especiales rotos (HTML escaped correctamente)
- Archivo legible en Excel, Google Sheets, etc.
```

**Reporta**:
- ✅ Rango válido: archivo descargable
- ✅ Rango vacío: archivo con 0 datos
- ✅ Rango invertido: 400 rechazado
- ✅ No autorización: 403 rechazado
- ✅ Rate limit: 6to intento bloqueado
- ❌ [Describe si algo falla]

---

## ✅ ITEM 6: Implementar Logging Redactado (1 hora)

**Objetivo**: Asegurar que logs NO contienen PII (datos personales).

**Archivos a auditar**:
- `app/api/**/*.ts` (todas las rutas)
- `lib/*.ts` (librerías)
- `middleware.ts`

**Pattern incorrecto** (❌ DEFECTUOSO):
```typescript
console.log('[CV Analysis] Text:', cvText);  // ❌ Loguea documento entero
console.log('[Auth] User email:', userEmail); // ❌ Loguea email personal
console.log('[Webhook] Payload:', payload);  // ❌ Loguea datos sensibles
```

**Pattern correcto** (✅ SEGURO):
```typescript
console.log('[CV Analysis] Extracted from candidate', candidatoId); // ✅
console.log('[Auth] User authenticated', userId); // ✅ UUID, no email
console.log('[Webhook] Event received', eventType, eventId); // ✅ Sólo metadata
console.log('[Sync] GoDaddy sync completed for user', correlationId); // ✅
```

**Cambios**:

1. Auditar `app/api/cv/route.ts`:
   ```typescript
   // ANTES: console.log('CV Text:', extractedText);
   // DESPUÉS:
   console.log('[CV] Analysis completed for candidate', candidatoId);
   ```

2. Auditar `app/api/candidatos/exportar/route.ts`:
   ```typescript
   // ANTES: console.log('Exporting candidates:', candidatosData);
   // DESPUÉS:
   console.log('[Export] Candidates exported', candidatosCount);
   ```

3. Auditar `lib/dual-sync.ts`:
   ```typescript
   // ANTES: console.log('Syncing user:', userData);
   // DESPUÉS:
   console.log('[Sync] User data synced', userId, { correlationId });
   ```

**Validación**:

```bash
# Buscar palabras clave en código
grep -r "console.log" app/ lib/ middleware.ts \
  | grep -iE "email|password|cpf|cnpj|phone|address|token|cv|pdf" \
  | wc -l

# Esperado: 0 (cero coincidencias)
```

**Reporta**:
- ✅ Logs auditados, sin PII encontrada
- ✅ Logging redactado implementado
- ✅ grep mostró 0 coincidencias de PII
- ❌ Encontradas [N] líneas con PII: [describe]

---

## ✅ ITEM 7: Documentar Retención de Datos (45 minutos)

**Objetivo**: Definir política de ciclo de vida de datos.

**Crear archivo**: `DATA_RETENTION_POLICY.md`

**Contenido**:

```markdown
# 📋 Política de Retención de Datos

## Tabla: usuarios
- **Retención**: Indefinida
- **Motivo**: Identificación de cuenta
- **Eliminación**: Solo manual (por solicitud del usuario)

## Tabla: vacantes
- **Retención**: Activas indefinidas, cerradas 90 días
- **Lógica**:
  - estado = 'activa' → mantener
  - estado = 'cerrada' → mantener 90 días, luego DELETE
- **Acción**:
  ```sql
  -- Job que corre cada día
  DELETE FROM vacantes 
  WHERE estado = 'cerrada' 
  AND updated_at < NOW() - INTERVAL '90 days';
  ```

## Tabla: candidatos
- **Retención**: 1 año después de vacante cerrada
- **Motivo**: Cumplimiento legal (auditoría)
- **Acción**:
  ```sql
  DELETE FROM candidatos c
  WHERE c.vacante_id IN (
    SELECT id FROM vacantes 
    WHERE estado = 'cerrada'
    AND updated_at < NOW() - INTERVAL '1 year'
  );
  ```

## Tabla: licenses
- **Retención**: Indefinida
- **Motivo**: Auditoría de compras
- **Búsqueda**: Por usuario, por código

## Tabla: consent_log
- **Retención**: 2 años (cumplimiento GDPR/LGPD)
- **Acción**:
  ```sql
  DELETE FROM consent_log 
  WHERE timestamp < NOW() - INTERVAL '2 years';
  ```

## Tabla: logs (operacionales)
- **Retención**: 30 días
- **Motivo**: Debugging, sin PII
- **Storage**: En Vercel logs, purga automática

## GoDaddy Sync
- **Datos sincronizados**: usuarios, vacantes (solo "activa")
- **Candidatos**: NO se sincronizan
- **Retención en GoDaddy**: = Retención en Supabase
- **DELETE Cascada**: Si vacante se borra en Supabase, también en GoDaddy
  ```typescript
  // En lib/dual-sync.ts
  if (action === 'DELETE') {
    await godaddyDb.query('DELETE FROM usuarios_vacantes WHERE supabase_id = ?', [vacanteId]);
  }
  ```

## Auditoría
- **Responsable**: Administrador de BD
- **Frecuencia**: Mensual
- **Checklist**:
  - [ ] Verificar que DELETE jobs corrieron
  - [ ] Confirmar que vacantes cerradas > 90 días fueron eliminadas
  - [ ] Auditar que candidatos > 1 año sin vacante fueron eliminados
  - [ ] Verificar sincronización a GoDaddy es consistent

## Contacto
Para solicitar datos o eliminación: privacy@shortlist.gt
```

**Integración en código**:

En `lib/retention.ts`:
```typescript
export async function runRetentionJobs() {
  // Job 1: Eliminar vacantes cerradas > 90 días
  await supabase
    .from('vacantes')
    .delete()
    .eq('estado', 'cerrada')
    .lt('updated_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));

  // Job 2: Eliminar candidatos de vacantes cerradas > 1 año
  const oldVacantes = await supabase
    .from('vacantes')
    .select('id')
    .eq('estado', 'cerrada')
    .lt('updated_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));

  if (oldVacantes.data) {
    for (const vacante of oldVacantes.data) {
      await supabase
        .from('candidatos')
        .delete()
        .eq('vacante_id', vacante.id);
    }
  }

  console.log('[Retention] Jobs completed');
}
```

**Reporta**:
- ✅ DATA_RETENTION_POLICY.md creado
- ✅ Política define retención por tabla
- ✅ Jobs de retención implementados en lib/retention.ts
- ✅ GoDaddy sync respeta política
- ❌ [Describe si falta algo]

---

## 🎯 REPORTE FINAL FASE 2

```
FASE 2 COMPLETADA (5/7 + 1 DEFERRED)

ITEM 1: Persistencia               ✅
ITEM 2: Sincronización GoDaddy     ⏸️  DEFERRED (credenciales faltando)
ITEM 3: Coherencia esquema         ✅ (documentación actualizada)
ITEM 4: Webhooks con firma         ✅
ITEM 5: Exportación confiable      ✅
ITEM 6: Logging redactado          ✅
ITEM 7: Retención de datos         ✅

RESUMEN: ✅ 5/7 COMPLETADOS + 1 DEFERRED + 1 DOCUMENTACIÓN

Status: LISTO PARA COMMIT + FASE 3

Decisiones tomadas:
- ITEM 2: Postponer a FASE posterior (cuando tengas credenciales GoDaddy)
- ITEM 3: Actualizar documentación, NO migrar Supabase (alto riesgo)
- Normalización: SQL para convertir estado='abierta' → 'activa' (datos históricos)
```

---

**Documento**: FASE 2 Ejecución  
**Duración**: 6-8 horas  
**Prerequisito**: FASE 1 ✅ completada  
**Estado**: 🚀 LISTO PARA EJECUTAR
