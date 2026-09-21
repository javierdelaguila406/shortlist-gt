# Política de Retención de Datos

## Alcance y responsables

Esta política aplica al esquema operativo descrito en `SCHEMA_CANONICAL.md`. El administrador de base de datos es responsable de ejecutar y auditar los jobs mensualmente. Las solicitudes de acceso o eliminación se reciben en `privacy@shortlist.gt`.

## `companies` (usuarios)

- Retención: indefinida mientras exista la cuenta.
- Eliminación: manual, por solicitud del titular.
- Nota: el nombre canónico actual es `companies`; no existe una tabla operativa `usuarios`.

## `vacantes`

- Activas o pausadas: retención indefinida.
- Cerradas: eliminación 90 días después de `updated_at`.
- Antes de eliminar se solicita el borrado del registro espejo en GoDaddy.

```sql
DELETE FROM vacantes
WHERE estado = 'cerrada'
  AND updated_at < NOW() - INTERVAL '90 days';
```

## `candidatos`

- Retención máxima: un año después del cierre de la vacante.
- Los registros se eliminan antes de la vacante padre cuando superan un año.
- Si la relación de base de datos tiene borrado en cascada, al eliminar una vacante a los 90 días sus candidatos se eliminan también; por tanto, un año es un máximo, no un mínimo garantizado.

```sql
DELETE FROM candidatos c
WHERE c.vacante_id IN (
  SELECT id FROM vacantes
  WHERE estado = 'cerrada'
    AND updated_at < NOW() - INTERVAL '1 year'
);
```

## `license_codes`

- Retención: indefinida por motivos de auditoría de compras y canjes.
- El nombre canónico actual es `license_codes`; no existe una tabla operativa `licenses`.

## `consent_log`

- Retención objetivo: dos años.
- El job solo debe activarse cuando la tabla exista en el esquema operativo.

```sql
DELETE FROM consent_log
WHERE timestamp < NOW() - INTERVAL '2 years';
```

## Logs operacionales

- Retención: 30 días.
- No deben contener PII, secretos, documentos ni payloads completos.
- La purga depende de la configuración de retención del proveedor de logs.

## Sincronización GoDaddy

- Datos sincronizados actualmente: `companies`, `vacantes` y `candidatos` únicamente para la cuenta configurada por la integración.
- Una vacante eliminada por retención se elimina primero de GoDaddy y luego de Supabase.
- Si GoDaddy no está configurado, el job continúa solo para instalaciones que no usan espejo; si está configurado y el borrado falla, se detiene antes de eliminar en Supabase.

## Auditoría mensual

- [ ] Confirmar ejecución satisfactoria de `runRetentionJobs`.
- [ ] Verificar vacantes cerradas con más de 90 días.
- [ ] Verificar candidatos asociados a cierres con más de un año.
- [ ] Comparar eliminaciones con el espejo GoDaddy.
- [ ] Confirmar retención de logs de 30 días y ausencia de PII.
