# 🧪 FASE 6 EJECUCIÓN - Regresión y Liberación

**Duración**: 8-12 horas  
**Criticidad**: P0 - BLOQUEADOR PARA PROD  
**Estado**: ✅ LISTO - TODAS LAS FASES 0-5 completadas  
**Ejecutor**: ChatGPT  
**Auditor**: Claude Code  
**Parallelizable**: NO - Esta es la fase final, todo debe pasar

---

## 📊 RESUMEN

FASE 6 es la **última validación exhaustiva** antes de PROD:
- Matriz de regresión en 12 áreas críticas
- CI/CD checklist completo
- Revisión independiente (opcional pero recomendada)
- **Certificación LISTO PARA PROD**

**Items**: 3 (regresión + CI/CD + revisión)  
**Prerequisito**: ✅ FASE 0-5 completadas  
**Bloqueador**: ✅ SÍ - No hay PROD sin esto
**Después de esto**: 🎉 DEPLOY A PRODUCCIÓN

---

## ✅ ITEM 1: Matriz de Regresión Exhaustiva (6-8 horas)

**Objetivo**: Validar que nada se rompió, todo funciona juntos

**Nota**: Esto se hace en STAGING con datos sintéticos (NUNCA PROD)

### 1.1 Sesión y Autenticación (30 minutos)

```
Test 1 - Login correcto:
□ Ir a /auth/login
□ Ingresar email válido + contraseña
□ Redirige a /dashboard/reclutador
□ Token se guarda en cookies

Test 2 - Login incorrecto:
□ Email válido + contraseña incorrecta
□ Mensaje de error: "Contraseña incorrecta"
□ NO redirige a dashboard

Test 3 - Email inexistente:
□ Email que no existe + cualquier contraseña
□ Mensaje de error: "Usuario no encontrado"

Test 4 - Recarga preserva sesión:
□ Login
□ Ir a /dashboard/reclutador
□ F5 (recargar)
□ Token sigue válido, usuario se mantiene
□ NO redirige a login

Test 5 - Cerrar sesión:
□ Click en "Cerrar sesión"
□ Redirige a /auth/login
□ Cookie de token se borra
□ No puede acceder a /dashboard (redirige a login)

Test 6 - Token expirado:
□ Esperar a que token expire (o simular en DevTools)
□ Intentar acceder a /dashboard
□ Redirige a /auth/login
□ Mensaje: "Sesión expirada, por favor ingresa nuevamente"

Test 7 - Token falsificado:
□ Modificar token en DevTools console: document.cookie = 'sb-auth-token=falso'
□ Intentar acceder a /dashboard
□ Redirige a /auth/login
```

### 1.2 Autorización (30 minutos)

```
Test 1 - Usuario A NO ve vacantes de Usuario B:
□ Crear vacante como Usuario A
□ Login como Usuario B
□ /dashboard NO muestra vacante de A
□ Si intenta /api/vacantes/[id-de-A] → 403 Forbidden

Test 2 - Usuario A NO puede eliminar vacante de Usuario B:
□ Obtener ID de vacante de User B
□ Como User A: DELETE /api/vacantes/eliminar
□ Resultado: 403 Forbidden
□ Vacante de B NO se borra

Test 3 - Usuario A NO puede ver candidatos de Usuario B:
□ User B crea vacante, recibe 3 candidatos
□ User A intenta GET /api/candidatos/listar?vacante_id=[id-B]
□ Resultado: 403 Forbidden
□ NO ve candidatos de B

Test 4 - Anónimo NO puede acceder a APIs protegidas:
□ Sin token: POST /api/vacantes/crear
□ Resultado: 401 Unauthorized
□ Sin token: GET /api/candidatos/listar
□ Resultado: 401 Unauthorized

Test 5 - Data API anónima es rechazada:
□ En DevTools console:
   fetch('https://xropotkrcovaqsarkjvp.supabase.co/rest/v1/vacantes',
     { headers: { 'apikey': '[anon-key]' } })
□ Resultado: 401 o 403 (RLS rechaza)
□ NO devuelve datos
```

### 1.3 Vacantes (1 hora)

```
Test 1 - Crear vacante:
□ Click en "Crear vacante"
□ Llenar form: titulo, descripción, estado='activa'
□ Click "Guardar"
□ Vacante aparece en dashboard
□ Verificar en Supabase: registro existe con estado='activa'

Test 2 - Consultar vacante:
□ Crear vacante (o usar existente)
□ Copiar link de postulación
□ Ir a link en nueva pestaña/navegador privado
□ Vacante visible (público)
□ Botón "Postularse" presente

Test 3 - Editar vacante:
□ Click en "Editar"
□ Cambiar título
□ Click "Guardar"
□ Título actualizado en dashboard
□ Link sigue siendo mismo ID (no cambia URL)

Test 4 - Cerrar vacante:
□ Click en "Cerrar vacante"
□ Estado cambia a 'cerrada'
□ Ya no aparece en búsquedas públicas
□ Link muestra: "Esta vacante cerró"

Test 5 - Borrar vacante:
□ Click en "Borrar vacante"
□ Confirmar (modal)
□ Vacante desaparece del dashboard
□ Verificar en Supabase: registro borrado
□ Candidatos asociados también borrados (cascada)

Test 6 - Candidatos de vacante borrada:
□ Crear vacante + 3 candidatos
□ Borrar vacante
□ Verificar en Supabase: candidatos también borrados
```

### 1.4 Postulación (1 hora)

```
Test 1 - Postular válido:
□ Ir a /postular/[vacante-id]
□ Rellenar form: email, nombre, subir PDF
□ Aceptar términos (checkbox)
□ Click "Postular"
□ Mensaje: "Postulación enviada"
□ Aparece en dashboard del reclutador

Test 2 - Postular sin PDF:
□ Intentar postular sin adjuntar PDF
□ Resultado: Error "PDF requerido"
□ NO se crea candidato

Test 3 - Postular PDF falso:
□ Adjuntar archivo .txt renombrado como .pdf
□ Resultado: Error "Archivo debe ser PDF válido"
□ NO se crea candidato

Test 4 - Postular PDF muy grande (>10MB):
□ Adjuntar PDF > 10MB
□ Resultado: Error "Archivo muy grande (máx 10MB)"
□ NO se crea candidato

Test 5 - Postular a vacante cerrada:
□ Cerrar vacante
□ Ir a link de postulación
□ Mensaje: "Esta vacante cerró"
□ Botón "Postular" deshabilitado

Test 6 - Postular sin aceptar términos:
□ Ir a /postular/[id]
□ Rellenar form
□ Checkbox "Acepto términos" SIN marcar
□ Botón "Postular" deshabilitado
□ Al marcar: botón habilitado

Test 7 - Registro de consentimiento:
□ Postular correctamente
□ Verificar en Supabase: consent_log tiene entrada
□ tipo='postulacion', usuario_id, timestamp presente
```

### 1.5 Persistencia (30 minutos)

```
Test 1 - Recarga preserva datos:
□ Crear vacante + agregar candidatos
□ F5 (recargar página)
□ Dashboard muestra mismos datos
□ Números coinciden

Test 2 - Nuevo navegador ve vacante:
□ Usuario A crea vacante en navegador A
□ Abrir navegador B (incógnita)
□ Ir a /postular/[id] desde navegador B
□ Vacante visible
□ localStorage NO es fuente de verdad

Test 3 - localStorage no es crítico:
□ Crear vacante
□ Abrir DevTools → Application → localStorage → Limpiar
□ F5 (recargar)
□ Dashboard sigue mostrando vacantes (datos de Supabase)
□ Si localStorage fuera crítico: fallaría (error)
```

### 1.6 Duplicados (30 minutos)

```
Test 1 - Doble clic no duplica candidato:
□ Ir a /postular/[id]
□ Llenar form
□ Click "Postular" 2 veces rápido
□ Resultado: 1 candidato creado (no 2)
□ Verificar en BD: COUNT = 1

Test 2 - Reintento de postulación:
□ Postular
□ Cerrar modal
□ Intenta postular OTRA VEZ con MISMO email
□ Resultado: Mensaje de error "Ya postulaste a esta vacante"
□ O: Crea segundo candidato (si es permitido)
□ Documentar el comportamiento esperado

Test 3 - Reintento en GoDaddy (cuando credenciales):
□ Crear vacante para usuario sincronizable
□ Ejecutar sincronización 2 veces
□ Verificar en GoDaddy: 1 registro (no 2)
```

### 1.7 Licencias (30 minutos)

```
Test 1 - Canje atómico:
□ Crear código de licencia: "TEST-2026-001"
□ Usuario canjea código
□ Plan actualiza a 'pro'
□ Código NO se puede canjear 2ª vez
□ Intento de 2ª vez: "Código ya fue usado"

Test 2 - Fallo en activación:
□ Canjear código
□ Si activación falla (ej: DB error)
□ Código NO se consume
□ Usuario puede reintentar

Test 3 - Rate limit en canje:
□ Intenta canjear 6 códigos en 1 hora
□ Primeros 5: OK (429)
□ 6to: 429 Too Many Requests
□ Esperar 1 hora → 6to intento: OK
```

### 1.8 Reportes (1 hora)

```
Test 1 - Rango válido:
□ Crear 10 candidatos
□ Generar reporte desde 2026-01-01 a 2026-12-31
□ Reporte completo con 10 registros
□ PDF y Excel coinciden

Test 2 - Rango invertido:
□ Intentar desde 2026-12-31 a 2026-01-01
□ Resultado: Error "Fecha inicial anterior a final"
□ Reporte NO se genera

Test 3 - Rango vacío:
□ Generar reporte con rango que NO tiene candidatos
□ Resultado: Reporte vacío (0 datos, solo headers)
□ NO es error

Test 4 - Exportar sin autorización:
□ Como usuario B: intenta exportar reporte de usuario A
□ Resultado: 403 Forbidden

Test 5 - Números correctos:
□ 10 candidatos con scores: 50, 60, 70, ...
□ Generar reporte
□ Verificar: suma, promedio, máximo, mínimo coinciden
```

### 1.9 Evaluación/Scoring (30 minutos)

```
Test 1 - Score índices correctos:
□ Analizar CV con keywords: typescript, react, python
□ Score debe ser > 0 y ≤ 100
□ Repetir con mismo CV: score IDÉNTICO (determinista)

Test 2 - Scoring en servidor:
□ Verificar que cliente NO envía score
□ Servidor calcula score
□ Verificar en audit_log: action='CREATE', recurso='candidato'

Test 3 - Extracción fallida:
□ Subir PDF sin texto (imagen pura)
□ Resultado: score=0, evaluated=false
□ Mostrar "No evaluado" en reporte
□ NO es error, es estado válido
```

### 1.10 Integraciones (1 hora)

```
Test 1 - Webhook sin firma:
□ POST /api/webhooks/whatsapp sin X-Hub-Signature-256
□ Resultado: 401 Unauthorized

Test 2 - Webhook con firma válida:
□ Calcular HMAC-SHA256 correcta
□ POST /api/webhooks/whatsapp con firma
□ Resultado: 200 OK, evento procesado

Test 3 - Webhook con firma inválida:
□ POST con X-Hub-Signature-256: invalido
□ Resultado: 401 Unauthorized

Test 4 - Sincronización idempotente:
□ Crear vacante (se sincroniza a GoDaddy)
□ Ejecutar sync 2ª vez
□ GoDaddy: 1 registro (no 2)
□ Sin duplicados
```

### 1.11 Accesibilidad (30 minutos)

```
Test 1 - Teclado navega:
□ Presionar Tab repetidamente
□ Todos los botones/inputs alcanzables
□ Orden es lógico (L→R, T→B)

Test 2 - Escape cierra modal:
□ Abrir modal
□ Presionar Escape
□ Modal cierra

Test 3 - Screen reader:
□ Activar NVDA o VoiceOver
□ Navegar página
□ Labels audibles, descripción de botones
□ NO solo iconos sin aria-label

Test 4 - Responsive:
□ DevTools: 375px (mobile) → sin overflow horizontal
□ DevTools: 768px (tablet) → layout adaptado
□ DevTools: 1024px (desktop) → optimizado
```

### 1.12 Operación (1 hora)

```
Test 1 - Compilación:
□ npm run build
□ 0 errores, 0 warnings críticos

Test 2 - Tests:
□ npm test
□ Todos los tests pasan (50+ tests)

Test 3 - Secretos en código:
□ npm audit
□ 0 vulnerabilidades
□ GitHub Push Protection: sin secretos

Test 4 - Logs redactados:
□ Generar muchas acciones (crear, borrar, postular, exportar)
□ Revisar logs
□ Verificar: 0 PII (emails, tokens, CVs)
□ Solo IDs, timestamps, eventos

Test 5 - Backup restaurable:
□ (Opcional si tienes BD de respaldo)
□ Simular restauración
□ Todos los datos se recuperan
□ Integridad de data confirmada
```

**Reporta estado de TODOS los tests**:
```
MATRIZ DE REGRESIÓN (12 áreas):

1.1 Sesión y Autenticación     [✅ / ❌]
1.2 Autorización               [✅ / ❌]
1.3 Vacantes                   [✅ / ❌]
1.4 Postulación                [✅ / ❌]
1.5 Persistencia               [✅ / ❌]
1.6 Duplicados                 [✅ / ❌]
1.7 Licencias                  [✅ / ❌]
1.8 Reportes                   [✅ / ❌]
1.9 Evaluación/Scoring         [✅ / ❌]
1.10 Integraciones             [✅ / ❌]
1.11 Accesibilidad             [✅ / ❌]
1.12 Operación                 [✅ / ❌]

RESULTADO: [✅ TODOS PASAN] o [❌ FALLOS: ___]
```

---

## ✅ ITEM 2: CI/CD Checklist (1-2 horas)

```
□ npm run type-check
  Esperado: 0 errores TypeScript

□ npm run lint
  Esperado: 0 errores críticos (warnings OK)

□ npm run build
  Esperado: Build exitoso, 0 warnings críticos

□ npm test
  Esperado: Todos los tests pasan (50+ tests)

□ npm audit
  Esperado: 0 vulnerabilidades

□ git status
  Esperado: Working tree clean (sin cambios no comiteados)

□ git log --oneline | head -10
  Esperado: 6 commits de fases (FASE 0-5)

□ Secrets detection:
  - GitHub Push Protection: sin secretos bloqueados
  - .env.local: en .gitignore (no versionizado)
  - API keys: solo en .env.local, no en código

□ CI/CD pipeline (si está configurado):
  - GitHub Actions: security.yml corriendo
  - Build: ✅ pasa
  - Tests: ✅ pasan
  - Lint: ✅ pasa

Reporta:
✅ TODOS LOS CHECKS PASAN
❌ Fallos: [describe]
```

---

## ✅ ITEM 3: Revisión Independiente (OPCIONAL)

**Recomendación**: Que alguien más revise los cambios (no el que los escribió)

```
□ Otro desarrollador revisa cambios de FASE 0-5
  Enfoque: ¿Hay bugs de lógica? ¿Está seguro?

□ Matriz de regresión ejecutada por QA
  (Si tienes equipo QA, ellos ejecutan la matriz)

□ Datos sintéticos, NUNCA PROD
  (Usar staging con datos de prueba)

Resultado:
✅ REVISIÓN APRUEBA
⚠️ REVISIÓN ENCUENTRA ISSUES: [describe]
```

---

## 🎯 REPORTE FINAL FASE 6

```
FASE 6 - REGRESIÓN Y LIBERACIÓN

ITEM 1: Matriz de regresión     [✅ / ❌]
        Áreas críticas: [12/12 o N/12]

ITEM 2: CI/CD Checklist         [✅ / ❌]
        Checks: [todos pasan o X fallos]

ITEM 3: Revisión independiente  [✅ / ⚠️ / OMITIDA]

═══════════════════════════════════════════════════════════

RESUMEN FINAL:

[✅ FASE 6 APROBADA - LISTO PARA PROD]
  - Todos los tests pasan
  - 0 bugs críticos encontrados
  - Matriz de regresión completa
  - CI/CD todo verde
  - Revisión independiente (si aplica)

[❌ FASE 6 RECHAZADA - BLOQUEADORES]
  - Fallo: [describe]
  - Acción: [qué arreglar]
  - Reintentar después de fix

═══════════════════════════════════════════════════════════

Si está ✅ APROBADA:

🎉 SHORTLIST.GT LISTO PARA PRODUCCIÓN 🎉

Próximos pasos:
1. Merge a rama de deploy (main está limpia)
2. Desplegar a Vercel (automático o manual)
3. Verificar en PROD: login funciona, datos cargados
4. Monitorear logs por 24h (Sentry, Vercel logs)
5. Estar listo para rollback si hay problemas
```

---

**Documento**: FASE 6 Ejecución - Regresión Final  
**Duración**: 8-12 horas  
**Prerequisito**: ✅ FASE 0-5 completadas  
**Bloqueador**: ✅ CRÍTICO - Sin esto NO hay PROD  
**Después**: 🚀 DEPLOY A PRODUCCIÓN  
**Estado**: 🧪 LISTO PARA EJECUTAR
