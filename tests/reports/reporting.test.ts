import { describe, expect, test } from 'vitest';
import { buildReportRows, REPORT_HEADERS, validateReportRange } from '@/lib/reporting';

describe('validación de rangos de reportes', () => {
  test.each([
    ['2026-01-01', '2026-03-31', null],
    ['2026-03-31', '2026-01-01', 'Fecha inicial debe ser anterior a final'],
    ['', '2026-03-31', 'Selecciona fecha inicial y final'],
    ['2020-01-01', '2026-12-31', 'Máximo 2 años'],
    ['2026-03-15', '2026-03-15', null],
  ])('valida %s → %s', (desde, hasta, expected) => {
    expect(validateReportRange(desde, hasta)).toBe(expected);
  });
});

describe('datos masivos de reportes', () => {
  test('normaliza 100 candidatos sin duplicados y conserva caracteres especiales', () => {
    const candidates = Array.from({ length: 100 }, (_, index) => ({
      email: index === 0 ? 'test+alias@domain.co' : `candidate${index}@example.com`,
      nombre: index === 0 ? 'José María López — Tech & Solutions' : `Candidate ${index}`,
      estado: index % 2 ? 'aceptado' : 'rechazado',
      score_total: index === 2 ? null : index,
      created_at: `2026-01-${String((index % 28) + 1).padStart(2, '0')}T00:00:00.000Z`,
    }));
    candidates.push(candidates[0]);
    const rows = buildReportRows(candidates);
    expect(rows).toHaveLength(100);
    expect(rows[0].nombre).toContain('José María López');
    expect(rows[2].score_total).toBe('No evaluado');
    expect(REPORT_HEADERS).toEqual(['email', 'nombre', 'estado', 'score_total', 'fecha_postulacion']);
  });

  test('procesa 1000 candidatos en menos de 10 segundos', () => {
    const candidates = Array.from({ length: 1000 }, (_, index) => ({
      email: `bulk${index}@example.com`, nombre: `Bulk ${index}`, estado: 'aceptado',
      score_total: index % 101, created_at: new Date(2026, 0, 1, 0, 0, index).toISOString(),
    }));
    const startedAt = performance.now();
    expect(buildReportRows(candidates)).toHaveLength(1000);
    expect(performance.now() - startedAt).toBeLessThan(10_000);
  });
});
