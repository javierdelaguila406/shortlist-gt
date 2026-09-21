# VALIDACIÓN DE AUDITORÍA - Estado Real vs Hallazgos

## CONFIRMADOS (REALES, CRÍTICOS)

### ✅ SEG-01: Secretos en PROGRESS_DAY_1.md
- **Status**: CONFIRMADO Y VIGENTE
- **Evidencia**: Líneas 13, 17 contienen:
  - SUPABASE_SERVICE_ROLE_KEY completa
  - OPENAI_API_KEY completa
- **Archivo**: Versionado en Git, visible en GitHub público
- **Impacto**: CRÍTICO - Acceso privilegiado a Supabase y OpenAI

### ✅ SEG-02: Middleware permite todas las rutas
- **Status**: CONFIRMADO Y VIGENTE  
- **Evidencia**: middleware.ts línea 63:
  - `pathname.startsWith('/')` con publicRoutes contiene '/'
  - Hace que TODAS las rutas sean públicas
- **Impacto**: CRÍTICO - Bypassea autenticación en todo el sistema

### ✅ SEG-03: Borrado sin autenticación
- **Status**: CONFIRMADO Y VIGENTE
- **Evidencia**: app/api/vacantes/eliminar/route.ts líneas 4-46
  - No verifica Authorization header
  - No valida propietario
  - Usa service role sin control
- **Impacto**: CRÍTICO - Cualquiera puede borrar cualquier vacante

## PARCIALMENTE PROBADOS (Análisis estático, no PROD ejecutado)

### ⚠️ OP-02: Vacantes no persisten
- **Status**: Reportado como ARREGLADO en sesión anterior
- **Cambio**: `estado: 'abierta'` → `estado: 'activa'`
- **Validación**: Audit tests pasaron en sesión previa
- **Riesgo pendiente**: No se confirmó en PROD después de despliegue

### ⚠️ OP-08: Sincronización duplica inserts
- **Status**: CÓDIGO verificado
- **Ubicación**: lib/dual-sync.ts
- **Defecto**: `user_id` vs `usuario_id`, `abierta` vs `activa`
- **Validación**: No se ejecutó en PROD

### ⚠️ SEG-06: RLS y permisos excesivos
- **Status**: NO INSPECCIONADO
- **Razón**: Requiere acceso directo a consola Supabase
- **Crítico**: No se verificó estado real de las políticas

## NO PROBADOS (Por diseño, sin ejecución destructiva)

### ❌ SEG-04: Lectura/exportación de candidatos
- **Motivo exclusión**: No extraer expedientes reales
- **Defecto reportado**: Sin validación de identidad
- **Pendiente de validar**: Con datos sintéticos

### ❌ SEG-05, SEG-07 a SEG-17: Otros defectos de seguridad
- **Motivo**: Análisis estático, no explotación comprobada
- **Pendiente**: Ejecutar matriz de regresión con staging

### ❌ UI-01 a UI-11: Defectos de interfaz
- **Motivo**: Observado en QA pero no reproducido sistemáticamente
- **Pendiente**: Tests de accesibilidad y responsividad

---

## INCERTIDUMBRES Y LAGUNAS

| Hallazgo | Probado | Observado | Pendiente |
|----------|---------|-----------|-----------|
| SEG-01 (Secretos) | Código ✅ | GitHub ✅ | Revocar |
| SEG-02 (Middleware) | Código ✅ | - | Ejecutar contra rutas |
| SEG-03 (Delete) | Código ✅ | - | Test de exploit |
| SEG-04 (Export) | Código ✅ | - | Test con datos sintéticos |
| SEG-06 (RLS) | No | No | Acceso Supabase requerido |
| OP-02 (Persistencia) | Código + Audit | Parcial PROD | Verificar post-deploy |
| OP-08 (Sync) | Código | No | Rastrear sync a GoDaddy |
| OP-15 (Tests) | CI ejecutado | TypeScript OK | Lint (60 errores) |

