import { beforeEach, describe, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({ calls: [] as string[] }));

class QueryBuilder {
  private operation = 'select';
  constructor(private table: string) {}
  select() { this.operation = 'select'; return this; }
  delete() { this.operation = 'delete'; return this; }
  eq(column: string, value: unknown) { state.calls.push(`${this.table}:${this.operation}:eq:${column}:${value}`); return this; }
  lt(column: string) { state.calls.push(`${this.table}:${this.operation}:lt:${column}`); return this; }
  then(resolve: (value: unknown) => unknown) {
    const value = this.operation === 'select'
      ? { data: this.table === 'vacantes' ? [{ id: 'old-vacancy' }] : [], error: null }
      : { data: null, error: null };
    return Promise.resolve(value).then(resolve);
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: (table: string) => new QueryBuilder(table) }),
}));

import { runRetentionJobs } from '@/lib/retention';

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  state.calls.length = 0;
});

describe('retención de datos', () => {
  test('elimina candidatos y datos dependientes antes de borrar vacantes cerradas', async () => {
    const result = await runRetentionJobs(new Date('2026-09-21T00:00:00.000Z'));

    expect(result).toEqual({ candidateVacanciesProcessed: 1, vacanciesProcessed: 1 });
    expect(state.calls).toContain('candidatos:delete:eq:vacante_id:old-vacancy');
    expect(state.calls).toContain('vacante_preguntas:delete:eq:vacante_id:old-vacancy');
    expect(state.calls).toContain('evaluaciones_whatsapp:delete:eq:vacante_id:old-vacancy');
    const vacancyDelete = state.calls.indexOf('vacantes:delete:eq:estado:cerrada');
    expect(vacancyDelete).toBeGreaterThan(state.calls.lastIndexOf('vacante_preguntas:delete:eq:vacante_id:old-vacancy'));
  });
});
