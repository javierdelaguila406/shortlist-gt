# ⚠️ HALLAZGOS NO COMPLETAMENTE VALIDADOS - SHORTLIST.GT

**Documento**: Enumera qué fue identificado en código pero NO probado en ejecución, por restricciones de auditoría.

---

## 📋 CATEGORÍAS

### 🔴 CRÍTICO - NO PROBADO, PERO CÓDIGO DEFECTUOSO EVIDENTE

Estos hallazgos están confirmados en el análisis estático pero no se ejecutaron para no violar restricciones de QA.

#### SEG-04: Lectura/Exportación de candidatos sin validación de identidad
- **Archivo**: `app/api/candidatos/listar/route.ts` y `exportar/route.ts`
- **Defecto**: Usa `select('*')` con service role sin validar empresa del usuario
- **Evidencia**: No requiere `usuario_id` verificado del JWT
- **Por qué no se probó**: Requería extraer expedientes reales ajenos
- **Cómo validar**: 
  - Tests unitarios con dos usuarios sintéticos
  - Usuario A intenta listar candidatos de Usuario B → 403
  - Candidato real no se toca

#### SEG-05: Borrado de candidatos sin verificación de propiedad
- **Archivo**: `app/api/candidatos/eliminar/route.ts` líneas 5-68
- **Defecto**: Valida que usuario exista pero no verifica candidato/vacante/empresa
- **Evidencia**: Sin `donde empresa_id = $1` en query
- **Por qué no se probó**: Prohibición de ejecutar borrados
- **Cómo validar**:
  - Crear 2 usuarios, 2 empresas, 1 candidato
  - Usuario B intenta borrar candidato de Usuario A → 403

#### SEG-07: Path traversal en CV
- **Archivo**: `app/api/cv/route.ts` líneas 44-60
- **Defecto**: `cvPath` admite string arbitrario, no valida contención de resultado
- **Evidencia**: `public + cvPath` sin verificación de bounds
- **Por qué no se probó**: Requería intentar acceder a archivos fuera de /public
- **Cómo validar**:
  - cvPath = "../../.env.local" → rechazado
  - cvPath = "/etc/passwd" → rechazado
  - cvPath = "valid-cv.pdf" → OK

#### SEG-08: Validación insuficiente de CV en upload
- **Archivo**: `app/api/candidatos/postular/route.ts` líneas 114-122, 230-253
- **Defecto**: 
  - No valida tamaño en servidor (frontend no protege API)
  - No valida contenido PDF real
  - `getPublicUrl` expone URL si bucket es público
- **Por qué no se probó**: Requería upload de archivos maliciosos
- **Cómo validar**:
  - Upload 100MB "PDF" → rechazado si > límite
  - Upload archivo no-PDF con extensión .pdf → rechazado
  - Verificar bucket privacy en Supabase

#### SEG-09: Canje de licencias inseguro
- **Archivo**: `app/api/auth/use-license-code/route.ts`
- **Defectos**:
  - Línea 20: Confía en `userId` del body, no del JWT
  - Línea 40-60: Lectura y update separadas (race condition)
  - No hay límite de intentos
- **Evidencia**: `const userId = body.userId` sin validación
- **Por qué no se probó**: Requería generar códigos reales y probar concurrencia
- **Cómo validar**:
  - Dos peticiones simultáneas de mismo código → solo una acepta
  - POST sin userId → 400
  - userId falso → 401 (no se actualiza plan)

#### SEG-10: Webhook sin firma
- **Archivo**: `app/api/webhooks/whatsapp/route.ts`
- **Defecto**: 
  - Línea 20: Procesa eventos sin verificar firma HMAC
  - GET para verificación no protege eventos posteriores (POST)
  - Línea 39-109: Registra token de verificación en logs
- **Por qué no se probó**: Requería mocks de WhatsApp o eventos reales
- **Cómo validar**:
  - POST webhook sin firma → 401
  - POST webhook con firma inválida → 401
  - POST webhook con firma válida → procesa
  - Logs no contienen verify_token

#### SEG-11: Cambio de contraseña sin validación de sesión
- **Archivo**: `app/api/auth/change-password/route.ts`
- **Defectos**:
  - Línea 12: Valida cookie, no el JWT dentro
  - Línea 18: Pide `currentPassword` pero no lo valida
  - Línea 30: `updateUser` en cliente compartido sin vincular sesión
- **Por qué no se probó**: Requería dos sesiones simultáneas
- **Cómo validar**:
  - Usuario A + Usuario B: A intenta cambiar contraseña de B → falla
  - currentPassword incorrecta → rechazada
  - Sesión vencida → 401

---

### 🟠 ALTO - NO PROBADO EN INTEGRACIÓN

Estos hallazgos fueron identificados en análisis estático. No se ejecutó la prueba completa.

#### SEG-06: RLS y permisos excesivos
- **Ubicación**: Supabase console, no inspeccionada en esta auditoría
- **Defectos reportados**:
  - Políticas con `Allow all` donde devería haber restricciones
  - Cualquier usuario puede leer códigos de licencia
  - Plan se puede actualizar desde cliente
  - Cambios de preguntas sin autorización
- **Por qué no se probó**: Requería acceso directo a Supabase console
- **Cómo validar**:
  ```sql
  SELECT * FROM pg_policies WHERE schemaname = 'public';
  -- Verificar que TODAS las políticas tengan restricción by usuario_id
  ```
- **Tests mínimos**:
  - SELECT como anón en `candidatos` → 0 filas
  - SELECT como usuario A en vacantes de B → 0 filas
  - UPDATE `plan` como cliente anónimo → error

#### SEG-12: HTML no escapado en reportes
- **Archivo**: `components/ProfessionalReportModal.tsx` líneas 168-175, 220-244
- **Defecto**: Interpola empresa, vacante, candidatos en HTML para `innerHTML` y `html2pdf`
- **Por qué no se probó**: Requería cargar datos maliciosos
- **Cómo validar**:
  - Empresa con nombre: `<script>alert('xss')</script>`
  - PDF generado: script NO ejecuta, aparece como texto literal

#### SEG-13: Rate limit local sin coordinación
- **Archivo**: `lib/rate-limit.ts`
- **Defecto**: Contadores en memoria, no funcionan en múltiples instancias Vercel
- **Por qué no se probó**: Requería tests de carga
- **Cómo validar**:
  - 50 requests CV/min × 2 instancias = 100 total
  - Expected: rechazadas después de 50
  - Actual: ambas instancias permiten 50 = 100 total (DEFECTO)

#### SEG-14: CSP no cubre Supabase WebSocket
- **Archivo**: `middleware.ts` líneas 55-59
- **CSP observada**:
  ```
  connect-src 'self' https://supabase.co
  ```
- **Defecto**: Supabase usa `xropotkrcovaqsarkjvp.supabase.co` (subdomain específico)
- **Por qué no se probó**: Requería verificar cabeceras HTTP en navegador
- **Cómo validar**:
  - Abrir DevTools → Network
  - Filtrar por Supabase URL real
  - Si aparece "CSP blocked", defecto confirmado

---

### 🟡 OPERACIONAL - PARCIALMENTE PROBADO

#### OP-02: Vacantes no persisten
- **Status**: Código arreglado (`estado: 'activa'`), audit tests pasaron
- **Por qué dudoso**: No se ejecutó en PROD post-deploy
- **Cómo validar en PROD**:
  1. Crear vacante en https://shortlist-gt.vercel.app/vacantes/crear
  2. Recargar página
  3. Ir a https://shortlist-gt.vercel.app/dashboard/reclutador
  4. Vacante debe aparecer

#### OP-03: Postulación rechazada con "Vacante no encontrada"
- **Status**: Error reportado en QA, causa parcialmente identificada
- **Posibles causas**:
  - Vacante no persiste (arreglado en OP-02)
  - RLS rechaza la lectura (SEG-06 no auditada)
  - Otra transacción incompleta
- **Cómo validar**:
  1. Crear vacante (OP-02)
  2. Abrir link público
  3. Llenar formulario + PDF
  4. Enviar
  5. Debe registrarse candidato sin error

#### OP-04: Cierre anuncia éxito falso
- **Archivo**: `app/dashboard/reclutador/page.tsx` líneas 303-349
- **Defecto**: Actualiza localStorage sin verificar error de BD
- **Por qué no se probó**: Requería simular error de Supabase
- **Cómo validar**:
  - Inyectar error en cliente Supabase
  - Intentar cerrar vacante
  - UI debe mostrar error, no éxito

#### OP-05: Carga fallida → listas vacías
- **Archivo**: `app/dashboard/reclutador/page.tsx` líneas 70-94
- **Por qué no se probó**: Requería offline o conexión rota
- **Cómo validar**:
  - DevTools → Offline
  - Recargar dashboard
  - Debe mostrar "Error de conexión" o estado claro
  - No "Sin vacante" (que parece correcto)

#### OP-06: Enlaces no reconstruidos
- **Archivo**: `app/dashboard/reclutador/page.tsx`
- **Defecto**: Mapea `id, título, descripción, departamento` pero omite `aplicarLink`
- **Por qué no se probó**: Requería verificar UI después de crear vacante
- **Cómo validar**:
  - Crear vacante
  - Click "Ver Link"
  - URL debe ser `/postular/{id}`, no vacía

#### OP-07: Filtros de reporte no aplicados
- **Archivo**: `components/ProfessionalReportModal.tsx`
- **Defecto**: Almacena período pero exporta TODOS los candidatos
- **Por qué no se probó**: Sin datos reales de prueba
- **Cómo validar** (con 20+ candidatos):
  - Rango: 1 Sept - 10 Sept
  - Exportar PDF
  - Contar candidatos: ¿solo los del rango? ¿todos?

#### OP-08: Sincronización duplica inserts
- **Ubicación**: `lib/dual-sync.ts` líneas 90-103, 154-169
- **Defectos**:
  - Usa `user_id` en GoDaddy pero tabla usa `usuario_id`
  - Usa `estado: 'abierta'` pero GoDaddy usa `activa`
  - Reintento sin idempotencia
- **Por qué no se probó**: Requería acceso a GoDaddy DB
- **Cómo validar**:
  - Crear vacante para usuario sincronizable
  - `SELECT COUNT(*) FROM godaddy_db.vacantes WHERE id = ?`
  - Debe ser 1, no 2
  - Reintento: sigue siendo 1

#### OP-09: Esquema divergente
- **Ubicación**: Múltiples archivos
- **Discrepancias**:
  - `usuario_id` vs `user_id`
  - `activa` vs `abierta`
  - `score_ia` vs `score_total` vs `score_cv`
- **Por qué no se probó**: Requería mapeo exhaustivo
- **Cómo validar**:
  ```bash
  grep -r "usuario_id" app/ | head -20
  grep -r "user_id" app/ | head -20
  grep -r "estado.*abierta" . --include="*.ts" | wc -l
  grep -r "estado.*activa" . --include="*.ts" | wc -l
  ```

#### OP-10: Cuotas incoherentes
- **Ubicación**: APIs y `lib/license-manager.ts`
- **Defecto**: Plan demo casi ilimitado, pero API verifica plan diferente
- **Por qué no se probó**: Requería crear múltiples vacantes
- **Cómo validar**:
  - Crear vacante → vacante 1, contador = 1
  - Crear vacante → vacante 2, contador = 2
  - Verificar que contador es coherente entre endpoints

#### OP-11: Botones sin Authorization header
- **Archivo**: `app/dashboard/reclutador/page.tsx` líneas 720-749
- **Defecto**: Llama WhatsApp y DELETE sin `Authorization: Bearer {token}`
- **Por qué no se probó**: Prohibición de enviar mensajes WhatsApp
- **Cómo validar**:
  - DevTools → Network
  - Click "Enviar WhatsApp"
  - Request debe contener `Authorization: Bearer ...`

#### OP-14: Reportes con empresa fija
- **Archivo**: `components/ProfessionalReportModal.tsx`
- **Defecto**: Código empresa fija "FORNITURE CITY"
- **Por qué no se probó**: Sin múltiples empresas en staging
- **Cómo validar** (2 empresas):
  - Crear vacante en Empresa A
  - Generar reporte
  - Debe decir "Empresa A", no "FORNITURE CITY"

#### OP-15: Lint 60 errores
- **Status**: Ejecutado, no arreglado
- **Archivo**: ESLint en 82 archivos
- **Por qué incompleto**: No se ejecutó `npm run lint:fix`
- **Cómo validar**:
  - `npm run lint` → debe ser 0 errors, 0 warnings (o < 5 excepciones documentadas)

#### OP-16: Dependencias no declaradas
- **Defecto**: `zod` usado pero no en `package.json`
- **Por qué no se probó**: Funciona por transitividad, pero riesgo
- **Cómo validar**:
  ```bash
  grep -r "from 'zod'" app/
  grep '"zod"' package.json  # ← vacío = DEFECTO
  ```

#### OP-17: Logs no redactados
- **Ubicación**: Múltiples rutas
- **Defecto**: Loguea `candidatos`, `emails`, `cvText`, tokens
- **Por qué no se probado**: Requería recolectar logs de Vercel
- **Cómo validar**:
  - Vercel dashboard → Logs
  - Buscar `email`, `token`, `cvText`
  - Debe estar vacío o redactado

---

### 🟢 INTERFACE - NO SISTEMÁTICAMENTE PROBADO

#### UI-01 a UI-11: Defectos de UX y accesibilidad
- **Estado**: Observados en QA, no reproducidos sistemáticamente
- **Alcance**: 11 hallazgos menores (no críticos)
- **Por qué pendiente**: Requería sesión dedicada de accesibilidad
- **Cómo validar**: Ver sección "MATRIZ DE REGRESIÓN" en PLAN_REMEDIACION_FASES.md

---

## 🎯 IMPACTO DE LO NO VALIDADO

### Si se descubren defectos reales en PROD:
1. **SEG-04, SEG-05**: Usuario B ve/modifica datos de Usuario A
2. **SEG-07**: Acceso a .env.local vía `/api/cv?path=../../.env.local`
3. **SEG-08**: Upload 500MB "PDF" → crash o DoS
4. **SEG-09**: Mismo código canjeado 2x simultáneamente
5. **SEG-10**: Evento falso de WhatsApp dispara acciones
6. **SEG-11**: Usuario A cambia contraseña de Usuario B
7. **SEG-06**: Anónimo lee todos los candidatos
8. **SEG-12**: XSS vía empresa con `<img onerror>`
9. **SEG-13**: Rate limit trivial de burlar con 2 instancias
10. **OP-08**: GoDaddy DB crece 10x por duplicados

### Riesgo global si NO SE VALIDAN:
- 🔴 **CRÍTICO**: SEG-04, SEG-05, SEG-06, SEG-09, SEG-11
- 🟠 **ALTO**: SEG-07, SEG-08, SEG-10, SEG-13
- 🟡 **MEDIO**: SEG-12, SEG-14, OP-02, OP-08, OP-17

---

## ✅ ACCIONES RECOMENDADAS

### Inmediatas (antes de PROD):
- ☐ Validar SEG-06 en Supabase console
- ☐ Ejecutar MATRIZ DE REGRESIÓN MÍNIMA (ver PLAN_REMEDIACION_FASES.md)
- ☐ Tests unitarios de autorización para SEG-04, SEG-05, SEG-09, SEG-11

### En paralelo (staging):
- ☐ Rate limit: mover a Redis
- ☐ RLS: auditar todas las políticas
- ☐ Webhooks: agregar firma HMAC

### Post-PROD:
- ☐ Logs y monitoreo para detectar exploits
- ☐ Alertas de cambios a plan/licencias
- ☐ Auditoría periódica de accesos no autorizados

---

**Documento generado**: 20 de Septiembre, 2026  
**Validez**: Mientras el código no cambie significativamente  
**Próxima revisión**: Después de cada despliegue a PROD
