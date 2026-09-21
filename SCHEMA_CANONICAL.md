# Esquema canónico de SHORTLIST.GT

Este documento distingue el esquema canónico usado por la aplicación actual de los archivos SQL históricos. Los nombres canónicos de fecha son `created_at` y `updated_at`; `creado_en` no existe en el código ni en el esquema activo documentado.

## `usuarios`

| Columna | Tipo | Restricción |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `email` | `text` | UNIQUE, NOT NULL |
| `nombre` | `text` | NOT NULL |
| `rol` | `text` | `reclutador` o `administrador` |
| `empresa_id` | `uuid` | FK lógica a empresa; el SQL histórico no declara la FK |
| `activo` | `boolean` | DEFAULT `true` |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

RLS esperada: el usuario solo puede leer y actualizar el registro cuyo `id = auth.uid()`.

## `companies` (empresa canónica actual)

La implementación usa `companies`, no `empresas`.

| Columna | Tipo | Restricción |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | UNIQUE, FK → `auth.users(id)` |
| `email` | `varchar(255)` | |
| `nombre` | `varchar(255)` | |
| `plan` | `varchar(50)` | enum lógico: `demo`, `premium`; DEFAULT `demo` |
| `license_code_used` | `varchar(255)` | |
| `plan_upgraded_at` | `timestamptz` | |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

RLS esperada: `user_id = auth.uid()` para SELECT, INSERT y UPDATE.

## `vacantes`

| Columna | Tipo | Restricción |
| --- | --- | --- |
| `id` | `text` | PK |
| `usuario_id` | `text` | propietario; corresponde a `auth.users.id` serializado |
| `titulo` | `text` | NOT NULL |
| `descripcion` | `text` | |
| `slug` | `text` | UNIQUE cuando está informado |
| `departamento` | `text` | |
| `salario_minimo` | `bigint` | |
| `salario_maximo` | `bigint` | |
| `ubicacion` | `text` | |
| `tipo_contrato` | `text` | |
| `estado` | `text` | enum lógico: `activa`, `pausada`, `cerrada`; DEFAULT `activa` |
| `criterios_minimos` | `jsonb` | |
| `preguntas_test` | `jsonb` | DEFAULT `[]` |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

RLS esperada: escritura solo del propietario; lectura de vacantes activas o propias.

## `candidatos`

| Columna | Tipo | Restricción |
| --- | --- | --- |
| `id` | `text` | PK |
| `vacante_id` | `text` | FK → `vacantes(id)` |
| `nombre` | `text` | NOT NULL |
| `email` | `text` | |
| `telefono` | `text` | NOT NULL |
| `cv_url` | `text` | |
| `cv_texto` | `text` | |
| `score_cv` | `bigint` | DEFAULT `0` |
| `score_video` | `bigint` | DEFAULT `0` |
| `score_test` | `bigint` | DEFAULT `0` |
| `score_ia` | `bigint` | DEFAULT `0` |
| `score_total` | `bigint` | DEFAULT `0` |
| `disponibilidad` | `text` | |
| `rango_salario` | `text` | |
| `link_linkedin` | `text` | |
| `estado` | `text` | enum usado por código: `pendiente`, `en_revision`, `aprobado`, `rechazado`, `oferta` |
| `metadata` | `jsonb` | |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `updated_at` | `timestamptz` | DEFAULT `now()` |

No tiene `usuario_id`. La propiedad se resuelve mediante `candidatos.vacante_id → vacantes.usuario_id`.

## `license_codes` (licencias canónicas actuales)

La implementación usa `license_codes`, no `licenses`.

| Columna | Tipo | Restricción |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `code` | `varchar(255)` | UNIQUE, NOT NULL |
| `status` | `varchar(50)` | enum: `unused`, `used`, `inactive`; DEFAULT `unused` |
| `used_by_user_id` | `uuid` | FK → `auth.users(id)` |
| `created_at` | `timestamptz` | DEFAULT `now()` |
| `used_at` | `timestamptz` | |
| `created_by_admin` | `uuid` | FK → `auth.users(id)` |
| `notes` | `text` | |

El plan activado se guarda en `companies.plan`, no en la licencia.

## Discrepancias encontradas

- La especificación de FASE 1 nombra `empresas` y `licenses`; la aplicación usa `companies` y `license_codes`.
- La especificación usa `creado_en`; la aplicación usa `created_at`.
- `usuarios.empresa_id` aparece en el esquema histórico, pero la relación activa de cuenta/empresa se implementa con `companies.user_id`.
- Los IDs de `vacantes` y `candidatos` son `text` en el esquema operativo, aunque `supabase/schema.sql` histórico todavía declara `uuid`.
- `candidatos` no contiene `usuario_id`; su propietario se deriva de la vacante.
- El enum de plan real es `demo | premium`, no `free | pro | enterprise`.
- El enum real de licencia es `unused | used | inactive`, no `disponible | canjeado | revocado`.
- Algunos scripts SQL históricos contienen políticas `USING (true)` y nombres obsoletos. No deben reutilizarse como fuente de verdad ni ejecutarse sobre producción.
