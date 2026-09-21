# 🔧 PLAN DE REMEDIACIÓN EN FASES - SHORTLIST.GT

**Fecha**: 20 de Septiembre, 2026  
**Estado actual**: 3 defectos críticos CONFIRMADOS + 3 parcialmente validados + 11 sin completar pruebas

---

## 📋 RESUMEN EJECUTIVO

### Hallazgos REALES vs Reportados
| Categoría | CONFIRMADO | PARCIAL | NO PROBADO | Total |
|-----------|-----------|---------|-----------|-------|
| Seguridad (SEG) | 3 | 2 | 12 | 17 |
| Operación (OP) | 0 | 3 | 14 | 17 |
| Interfaz (UI) | 0 | 0 | 11 | 11 |
| **TOTAL** | **3** | **5** | **37** | **45** |

### Defectos bloqueadores actuales:
1. **SEG-01**: Secretos expuestos en Git (PROD)
2. **SEG-02**: Middleware bypassea autenticación (CÓDIGO)
3. **SEG-03**: DELETE de vacantes sin autorización (CÓDIGO)

**Riesgo global**: ⚠️ **ALTO** - Sistema vulnerable a acceso no autorizado y modificación de datos

---

## 🚨 FASE 0: CONTENCIÓN INMEDIATA (P0 - 5-6 horas)

**Objetivo**: Cerrar todos los CRITICAL (14 hallazgos) identificados por ambas auditorías.

### 0.1 Revocar TODOS los secretos expuestos (15 min)
- **Tarea**: Revocar claves comprometidas en TODAS las plataformas
- **Archivos afectados**:
  - `PROGRESS_DAY_1.md` líneas 13, 17
- **Secretos a revocar**:
  1. **Supabase**: SUPABASE_SERVICE_ROLE_KEY
  2. **OpenAI**: OPENAI_API_KEY (***REMOVED***)
  3. **GitHub**: Personal Access Token en `.git/config`
  4. **WhatsApp**: Token si existe
- **Acciones**:
  ```bash
  # 1. Supabase
  Ir a https://supabase.com/dashboard → Settings → API
  Regenerar SUPABASE_SERVICE_ROLE_KEY
  
  # 2. OpenAI
  Ir a https://platform.openai.com/account/api-keys
  Revocar ***REMOVED***
  
  # 3. GitHub PAT
  Ir a https://github.com/settings/tokens
  Revocar token existente
  Generar SSH key en su lugar
  
  # 4. Limpiar historio Git
  git filter-branch --tree-filter 'rm -f PROGRESS_DAY_1.md' HEAD
  git push --force-with-lease
  
  # 5. Actualizar .env.local con nuevas claves
  ```
- **Validación**: Claves antiguas revocadas, nuevas en .env.local

### 0.2 Remover dependencia RCE (5 min)
- **Paquete**: node-tesseract-ocr@2.2.1
- **Defecto**: OS Command Injection CVSS 9.8, end-of-life
- **Status**: Unused (dead dependency)
- **Acción**:
  ```bash
  npm uninstall node-tesseract-ocr
  npm install
  ```
- **Validación**: `npm ls node-tesseract-ocr` → not found

### 0.3 Fijar middleware (5 min)
- **Archivo**: `middleware.ts` línea 63
- **Defecto**: `pathname.startsWith('/')` hace bypass de autenticación
- **Cambio**:
  ```typescript
  // ANTES (DEFECTUOSO):
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route)
  );

  // DESPUÉS (FIJO):
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  // Para prefijos, usar exactitud delimitada:
  const isApiPublic = publicRoutes.some(route => 
    route.includes('/api/') && pathname.startsWith(route)
  );
  ```
- **Validación**: `/dashboard/reclutador` sin token → login

### 0.4 Agregar autenticación a DELETE de vacantes (15 min)
- **Archivo**: `app/api/vacantes/eliminar/route.ts` líneas 4-69
- **Cambio**: Verificar Authorization header + usuario_id
- **Validación**: Otro usuario no puede borrar

### 0.5 Agregar autenticación a `/api/candidatos/listar` (20 min)
- **Defecto**: BOLA - devuelve todos sin auth
- **Acción**: Agregar Authorization + filtrar por empresa
- **Validación**: Sin token → 401

### 0.6 Arreglar IDOR en `/api/candidatos/eliminar` (20 min)
- **Defecto**: Borra cualquier candidato sin verificar propiedad
- **Acción**: Verificar `candidato.vacante.usuario_id == usuarioAutenticado`
- **Validación**: Otro usuario no puede borrar

### 0.7 Agregar autenticación a `/api/candidatos/exportar` (20 min)
- **Defecto**: Exporta PII sin autenticación
- **Acción**: Agregar Authorization + rate limit
- **Validación**: Sin token → 401

### 0.8 Remover GitHub PAT (15 min)
- **Ubicación**: `.git/config`
- **Acción**:
  ```bash
  # 1. Revocar en GitHub
  
  # 2. Remover de git config
  git config --global --unset url."https://[TOKEN]@github.com/".insteadOf
  
  # 3. Configurar SSH keys
  ssh-keygen -t ed25519 -C "github"
  # Agregar public key a GitHub
  ```

### 0.9 Fijar service role en APIs (60 min)
- **Defecto**: Service role (admin) en endpoints públicos, bypassea RLS
- **Acción**: Cambiar a anon key con RLS en endpoints públicos
  - `/api/candidatos/postular` → anon key
  - `/api/vacantes/buscar` → anon key
  - Solo server-side handlers pueden usar service role
- **Validación**: RLS rechaza acceso no autorizado

### 0.10 Arreglar license code brute force (20 min)
- **Archivo**: `/api/auth/use-license-code/route.ts`
- **Defecto**: Sin auth, acepta userId arbitrario, sin rate limit
- **Acción**:
  ```typescript
  // Cambiar userId del body a userId del JWT
  const { userId } = supabase.auth.getUser();
  // Agregar rate limit: 5 intentos/hora
  ```
- **Validación**: Sin token → 401, limit respetado

### 0.11 Proteger Flask service (15 min)
- **Ubicación**: `shortlist-scoring-service/app.py`
- **Defecto**: En 0.0.0.0 sin autenticación
- **Acción**:
  ```python
  # ANTES:
  app.run(host='0.0.0.0', port=5000)
  
  # DESPUÉS:
  app.run(host='127.0.0.1', port=5000)
  # Agregar autenticación con token
  ```

### 0.12 Remover GoDaddy hardcoded credentials (10 min)
- **Ubicación**: `/lib/godaddy-db.ts`
- **Acción**: Remover valores fallback, requerir env vars
- **Validación**: Error si env vars falta

### 0.13 Actualizar xlsx (10 min)
- **Paquete**: xlsx@0.18.5 → v0.20.2
- **Defecto**: Prototype pollution + ReDoS
- **Acción**: `npm update xlsx`

### 0.14 Fijar cambio de contraseña (20 min)
- **Archivo**: `/api/auth/change-password/route.ts`
- **Defecto**: No verifica contraseña actual
- **Acción**: Implementar verificación real antes de cambiar

### 0.15 Actualizar CSP headers (15 min)
- **Ubicación**: `middleware.ts` línea 56-59
- **Acción**: Especificar todos los dominios de Supabase
  ```typescript
  connect-src 'self' https://xropotkrcovaqsarkjvp.supabase.co wss://xropotkrcovaqsarkjvp.supabase.co
  ```

### Hitos de Fase 0:
- ☐ Todos los secretos revocados (Supabase, OpenAI, GitHub, WhatsApp)
- ☐ Dependencia RCE removida
- ☐ Middleware requiere exactitud de rutas
- ☐ Todas las APIs críticas requieren Authorization
- ☐ Service role usado solo en server-side
- ☐ Flask en localhost solo
- ☐ CSP actualizado
- **Salida**: 14 CRITICAL cerrados, 0 CRITICAL activos

---

## 🔐 FASE 1: SEGURIDAD E IDENTIDAD (P0/P1 - 8-12 horas)

**Objetivo**: Validar que RLS, endpoints y autorización funcionan correctamente.

### 1.1 Auditar y fijar RLS en Supabase (SEG-06)
- **Pendiente desde**: Auditoría no completó inspección
- **Acciones**:
  1. Acceder a Supabase console → Authentication → Policies
  2. Verificar que "Allow all" condicionales se reemplacen con reglas explícitas
  3. Confirmar que solo `usuario_id` del usuario puede leer/modificar
  4. Validar con tests de Data API anónima y autenticada
  
- **Tests mínimos**:
  ```
  ✓ Anónimo no puede leer candidatos
  ✓ Usuario A no puede leer vacantes de Usuario B
  ✓ Usuario solo puede crear vacantes para su empresa
  ```

### 1.2 Fijar middleware completamente (SEG-02)
- **Validación exhaustiva**:
  - ✓ `/dashboard/*` → login si no autenticado
  - ✓ `/api/vacantes/crear` → Bearer token requerido
  - ✓ `/api/candidatos/exportar` → Bearer token requerido
  - ✓ `/postular/*` → público, sin token

### 1.3 Aplicar autorización a todas las APIs críticas (SEG-03, SEG-04, SEG-05)
- **Endpoints a auditar**:
  - ✓ DELETE `/api/vacantes/eliminar` → verificar propietario
  - ✓ GET/POST `/api/candidatos/exportar` → verificar empresa
  - ✓ DELETE `/api/candidatos/eliminar` → verificar candidato propios
  - [ ] PUT `/api/vacantes/[id]` → verificar propietario
  - [ ] GET `/api/vacantes/lista` → filtrar por empresa

### 1.4 Fijar validación de webhooks (SEG-10)
- **Archivo**: `app/api/webhooks/whatsapp/route.ts`
- **Cambio**: Agregar firma HMAC-SHA256 verificada
- **Validación**: Eventos sin firma rechazados

### Hitos de Fase 1:
- ☐ RLS auditadas y reportadas como correctas
- ☐ Matriz de autorización por endpoint: usuario/empresa/recurso
- ☐ Tests de autorización entre usuarios sintéticos pasan
- **Salida**: Sistema rechaza acceso no autorizado en BD y API

---

## 💾 FASE 2: PERSISTENCIA Y DATOS (P1 - 6-8 horas)

**Objetivo**: Confirmar que datos se guardan correctamente y sincronización no duplica.

### 2.1 Validar persistencia de vacantes (OP-02)
- **Pendiente desde**: Arreglado en sesión previa, no validado en PROD post-deploy
- **Acciones**:
  1. En staging: Crear vacante vía UI
  2. Recargar página → vacante persiste ✓
  3. Nueva sesión → vacante visible ✓
  4. Verificar en Supabase console → registro existe con `estado: 'activa'` ✓

- **Validación de error**: Intentar crear con enum inválido → rechazado en servidor

### 2.2 Auditar sincronización GoDaddy (OP-08)
- **Ubicación**: `lib/dual-sync.ts`
- **Defectos identificados**:
  - Línea 90: `user_id` debe ser `usuario_id` (inconsistencia de esquema)
  - Línea 154: Inserta con `estado: 'abierta'` → cambiar a `estado: 'activa'`
  - No hay idempotencia: reintento duplica registro

- **Acciones**:
  1. Corregir mapeeo de campos (`user_id` → `usuario_id`)
  2. Corregir estado enum
  3. Agregar verificación de duplicado antes de insertar
  4. Loguear sync con correlationId

- **Validación**:
  - ✓ Crear vacante para usuario sincronizable
  - ✓ Aparece en GoDaddy DB una sola vez
  - ✓ Reintento no duplica

### 2.3 Validar modelos de datos coherentes (OP-09)
- **Discrepancias conocidas**:
  - `usuario_id` vs `user_id` en distintos esquemas
  - `activa` vs `abierta` en enums
  - `score_ia` vs `score_total` vs `score_cv`

- **Acción**: Documentar esquema canónico en Supabase
  ```sql
  SELECT * FROM information_schema.tables WHERE table_schema = 'public';
  SELECT * FROM information_schema.columns WHERE table_schema = 'public' 
    ORDER BY table_name, ordinal_position;
  ```

### Hitos de Fase 2:
- ☐ Vacantes crean y persisten correctamente
- ☐ Sincronización a GoDaddy idempotente y sin duplicados
- ☐ Esquema documentado, tipos generados desde DB
- **Salida**: Datos consistentes, sin corrupción por reintento

---

## 📊 FASE 3: REPORTES Y DATOS MASIVOS (P1/P2 - 4-6 horas)

**Objetivo**: Asegurar que filtros, exportación y scoring funcionan correctamente.

### 3.1 Fijar filtros de reporte (OP-07)
- **Defecto**: Rango invertido (desde > hasta) no genera error
- **Archivo**: `components/ProfessionalReportModal.tsx`
- **Cambio**:
  ```typescript
  if (startDate > endDate) {
    setError('La fecha inicial debe ser anterior a la final');
    return;
  }
  ```

### 3.2 Validar exportación PDF/Excel (OP-07, SEG-12, OP-13)
- **Pruebas**:
  - ✓ Exportar rango vacío → resultado vacío (no error falso)
  - ✓ Exportar con html special chars → escapados en PDF
  - ✓ Números coinciden entre PDF y Excel
  - ✓ Filtros aplicados correctamente

### 3.3 Validar scoring (OP-12, OP-13)
- **Defecto**: Scoring manipulable desde cliente, sin validación en servidor
- **Acciones**:
  1. Extraer PDF en servidor, no confiar en `cvText` del cliente
  2. Validar que scoring se basa en documento verificado
  3. Registrar "no evaluado" si extracción falla

### Hitos de Fase 3:
- ☐ Reportes filtran correctamente
- ☐ Rango invertido rechazado
- ☐ PDF/Excel coinciden y escapen HTML
- **Salida**: Reportes confiables

---

## 🎨 FASE 4: INTERFAZ Y ACCESIBILIDAD (P2 - 4-6 horas)

**Objetivo**: Fijar UX y accesibilidad sin bloquear funcionalidad.

### 4.1 Estados explícitos de carga/error (OP-05, UI-01)
- **Cambio**: Mostrar "Cargando..." en lugar de "Sin vacante"
- **Archivos**:
  - `app/dashboard/reclutador/page.tsx` líneas 70-94
  - `app/postular/[slug]/page.tsx` líneas 32, 138-151

### 4.2 Reconstruir enlaces de vacantes (OP-06)
- **Defecto**: "Ver Link" muestra URL vacía si no hay link recalculado
- **Cambio**: Derivar URL desde ID persistido
  ```typescript
  const link = `/postular/${vacante.id}`;
  ```

### 4.3 Accesibilidad mínima (UI-03, UI-11)
- **Cambios**:
  - Agregar `role="dialog"` a modales
  - Labels asociados a inputs (`htmlFor`)
  - Escape cierra modal
  - Foco inicial en primer campo

### 4.4 Responsive y táctil (UI-10)
- **Pruebas**: 320px, 390px, 768px, 1024px
- **Objetivo**: Sin desbordamiento horizontal, botones ≥44px

### Hitos de Fase 4:
- ☐ Estados de carga/error/vacío explícitos
- ☐ Enlaces funcionales sin `undefined`
- ☐ Modal accesible (Escape, foco, labels)
- **Salida**: UX clara, sin confusiones

---

## 🔄 FASE 5: PRIVACIDAD Y OPERACIÓN (P2/P3 - 6-8 horas)

**Objetivo**: Cumplimiento, logs, restauración.

### 5.1 Consentimiento registrado (SEG-15)
- **Cambio**: Antes de postular, registrar aceptación
  ```typescript
  const { error } = await supabase
    .from('consent_log')
    .insert({ user_id, timestamp: new Date(), accepted: true });
  ```

### 5.2 Logs redactados (SEG-15, OP-17)
- **Cambio**: No loguear datos personales, números de CV, emails en logs
- **Ejemplo correcto**:
  ```typescript
  console.log('[CV] Extracted from candidate', candidatoId);  // ✓
  console.log('[CV] Content:', cvText);  // ✗ DEFECTUOSO
  ```

### 5.3 Ciclo de vida de datos en GoDaddy (SEG-16)
- **Acciones**:
  1. Documentar retención (¿cuánto tiempo?)
  2. Validar que DELETE en Supabase propaga a GoDaddy
  3. Prueba de restauración desde backup

### 5.4 Rate limit global (SEG-13)
- **Cambio**: Mover de memoria a Redis/Supabase
- **Métrica**: Máx. 100 análisis CV por usuario/día

### Hitos de Fase 5:
- ☐ Consentimiento registrado y trazable
- ☐ Logs sin datos personales
- ☐ Retención documentada y automatizada
- **Salida**: Cumplimiento de privacidad

---

## 🧪 FASE 6: REGRESIÓN Y LIBERACIÓN (P1 - 8-12 horas)

**Objetivo**: Validación integral antes de PROD.

### 6.1 Matriz de regresión mínima (contra staging)
```
1. Sesión: Login → recarga → cambio panel → vencimiento
   ✓ Token válido, usuario coherente, empresa correcta

2. Autorización:
   ✓ Anónimo → redirige a login
   ✓ Token falso → 401
   ✓ Otra empresa → 403
   ✓ Data API anónima → rechazada

3. Vacante:
   ✓ Crear → persiste
   ✓ Consultar en nueva sesión → visible
   ✓ Borrar propia → OK
   ✓ Borrar ajena → 403
   ✓ Cerrar → bloquea postulación

4. Postulación:
   ✓ PDF válido → OK
   ✓ PDF falso → 400
   ✓ PDF grande → 413
   ✓ Sin PDF → 400
   ✓ Vacante inexistente → 404
   ✓ Vacante cerrada → 403

5. Persistencia:
   ✓ Recarga preserva datos
   ✓ Nuevo navegador ve vacante
   ✓ localStorage NO es fuente de verdad

6. Duplicados:
   ✓ Doble clic no duplica candidato
   ✓ Reintento no duplica en GoDaddy

7. Licencias:
   ✓ Canje atómico
   ✓ Código usado no se canjea 2x
   ✓ Fallo de activación no consume código

8. Reportes:
   ✓ Rango válido → datos correctos
   ✓ Rango invertido → rechazado
   ✓ PDF/Excel coinciden

9. Evaluación:
   ✓ Score índices correctos
   ✓ Scoring confiable (no del cliente)
   ✓ Extracción fallida = "no evaluado"

10. Integraciones:
    ✓ Webhook sin firma → 401
    ✓ Sincronización idempotente
    ✓ GoDaddy sync no duplica

11. UX:
    ✓ Teclado funciona
    ✓ Lector pantalla detecta labels
    ✓ Escape cierra modal
    ✓ Móvil 390px sin desbordamiento

12. Operación:
    ✓ CI pasa (TypeScript + lint)
    ✓ Secretos no en código
    ✓ Logs redactados
    ✓ Backup restaurable
```

### 6.2 CI/CD checklist
- ☐ `npm run type-check` sin errores
- ☐ ESLint (60 errores encontrados → 0)
- ☐ `npm run build` sin warnings críticos
- ☐ Tests de autorización/RLS pasan
- ☐ Secretos detectados activan bloqueo

### 6.3 Revisión independiente
- ☐ Otro desarrollador revisa cambios críticos
- ☐ Matriz de regresión ejecutada por QA
- ☐ Datos sintéticos, sin PROD

### Hitos de Fase 6:
- ☐ Todos los tests pasan
- ☐ Cero P0/P1 abiertos
- ☐ Revisión independiente aprueba
- **Salida**: Ready for PROD

---

## 📅 CRONOGRAMA ESTIMADO

| Fase | Duración | Acumulado | Estado |
|------|----------|-----------|--------|
| 0: Contención | 2-4h | 2-4h | ⏳ URGENTE |
| 1: Seguridad | 8-12h | 10-16h | ⏳ DESPUÉS DE FASE 0 |
| 2: Persistencia | 6-8h | 16-24h | ⏳ PARALELO CON 1 |
| 3: Reportes | 4-6h | 20-30h | ⏳ DESPUÉS DE 2 |
| 4: Interfaz | 4-6h | 24-36h | ⏳ PARALELO |
| 5: Privacidad | 6-8h | 30-44h | ⏳ DESPUÉS DE 0 |
| 6: Regresión | 8-12h | 38-56h | ⏳ FINAL |

**Estimado TOTAL**: 38-56 horas en staging, sin PROD.

---

## 🎯 CRITERIOS DE ÉXITO FINAL

✅ **FASE 0 CERRADA**: Secretos revocados, middleware fijo, DELETE autenticado  
✅ **FASE 1 CERRADA**: RLS auditada, APIs requieren autorización, webhook validado  
✅ **FASE 2 CERRADA**: Vacantes persisten, sincronización idempotente, esquema coherente  
✅ **FASE 3 CERRADA**: Reportes filtran, exportación válida, scoring confiable  
✅ **FASE 4 CERRADA**: UX clara, accesible, responsive  
✅ **FASE 5 CERRADA**: Privacidad cumplida, logs limpios, ciclo de vida manejado  
✅ **FASE 6 CERRADA**: Tests pasan, revisión independiente aprueba, cero P0/P1

**Solo entonces**: Deploy a PROD

---

## 🚫 LO QUE NO SE HACE EN ESTE PLAN

- ❌ Cambios cosméticos (sin impacto en seguridad/funcionalidad)
- ❌ Refactorización exhaustiva (solo lo necesario)
- ❌ Integración con plataformas nuevas
- ❌ Tests destructivos en PROD
- ❌ Comunicaciones externas (prohibido por auditoría)

---

## 📝 NOTAS

1. **Fases 1-2 pueden ser paralelas**: Seguridad y Persistencia no dependen una de la otra
2. **Fase 3-4 después de Fase 2**: Reportes y UI no son críticas para seguridad
3. **Fase 5 en paralelo con otras**: Privacidad es requisito, no bloqueador
4. **Fase 6 es bloqueador**: No hay PROD sin regresión aprobada

---

**Documento generado**: 20 de Septiembre, 2026  
**Próxima revisión**: Después de Fase 0
