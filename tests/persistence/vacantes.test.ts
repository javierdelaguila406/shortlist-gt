import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

const database = vi.hoisted(() => ({
  vacancies: [] as Array<Record<string, unknown>>,
  insertError: null as null | { message: string; code?: string },
}));

class QueryBuilder {
  private operation = 'select';
  private payload: Array<Record<string, unknown>> = [];

  constructor(private table: string) {}

  select() {
    if (this.operation === 'insert' && this.table === 'vacantes') {
      if (database.insertError) return Promise.resolve({ data: null, error: database.insertError });
      database.vacancies.push(...this.payload);
      return Promise.resolve({ data: this.payload, error: null });
    }
    return this;
  }

  insert(payload: Array<Record<string, unknown>>) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  eq() { return this; }
  then(resolve: (value: unknown) => unknown) {
    return Promise.resolve({ data: database.vacancies, error: null }).then(resolve);
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async (token: string) => token === 'valid-token'
        ? { data: { user: { id: 'user-test' } }, error: null }
        : { data: { user: null }, error: { message: 'invalid' } },
    },
    from: (table: string) => new QueryBuilder(table),
  }),
}));

import { POST as createVacancy } from '@/app/api/vacantes/crear/route';

const request = (body: Record<string, unknown>) => new NextRequest('http://localhost/api/vacantes/crear', {
  method: 'POST',
  headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

beforeEach(() => {
  database.vacancies.length = 0;
  database.insertError = null;
});

describe('persistencia de vacantes', () => {
  test('crea y persiste una vacante con estado activa por defecto', async () => {
    const response = await createVacancy(request({ titulo: 'Senior Developer' }));

    expect(response.status).toBe(200);
    expect(database.vacancies).toHaveLength(1);
    expect(database.vacancies[0]).toMatchObject({
      titulo: 'Senior Developer',
      usuario_id: 'user-test',
      estado: 'activa',
    });
  });

  test('rechaza un estado fuera del enum', async () => {
    const response = await createVacancy(request({ titulo: 'Test', estado: 'INVALIDO' }));

    expect(response.status).toBe(400);
    expect(database.vacancies).toHaveLength(0);
  });

  test('traduce el límite del plan Demo que aplica la base a un 403 claro', async () => {
    database.insertError = { message: 'plan_limit:vacantes', code: 'P0001' };
    const response = await createVacancy(request({ titulo: 'Segunda vacante' }));

    expect(response.status).toBe(403);
    expect((await response.json()).error).toContain('plan Demo permite 1 vacante');
  });
});
