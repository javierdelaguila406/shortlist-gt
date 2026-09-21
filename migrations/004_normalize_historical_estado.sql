-- Migration: Normalize historical estado='abierta' to 'activa'
-- Date: 2026-09-21
-- Risk: LOW (data-only change, no schema changes)
-- Reversible: YES (can revert with UPDATE ... SET estado='abierta' WHERE ...)

BEGIN TRANSACTION;

-- Step 1: Verify estado='abierta' exists
SELECT COUNT(*) as abierta_count FROM vacantes WHERE estado = 'abierta';

-- Step 2: Normalize abierta → activa
UPDATE vacantes
SET estado = 'activa'
WHERE estado = 'abierta';

-- Step 3: Verify normalization
SELECT DISTINCT estado FROM vacantes ORDER BY estado;

-- Expected output after normalization:
-- estado
-- --------
-- activa
-- cerrada
-- pausada

-- Step 4: Log normalization event
INSERT INTO audit_log (table_name, action, old_value, new_value, affected_rows, performed_at)
VALUES (
  'vacantes',
  'normalize_estado',
  'abierta',
  'activa',
  (SELECT COUNT(*) FROM vacantes WHERE estado = 'activa'),
  NOW()
);

COMMIT;

-- Rollback (if needed):
-- BEGIN TRANSACTION;
-- UPDATE vacantes SET estado = 'abierta' WHERE updated_at >= '2026-09-21'::timestamp AND estado = 'activa';
-- COMMIT;
