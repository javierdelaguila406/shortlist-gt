import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';

const TOKEN = 'A'.repeat(43);

const db = vi.hoisted(() => ({
  evaluation: {} as Record<string, unknown>,
  candidateUpdates: [] as Array<Record<string, unknown>>,
}));

class QueryBuilder {
  private op: 'select' | 'update' = 'select';
  private filters: Record<string, unknown> = {};
  private values: Record<string, unknown> = {};
  constructor(private table: string) {}

  select() { return this.op === 'update' ? this.runUpdate() : this; }
  update(values: Record<string, unknown>) { this.op = 'update'; this.values = values; return this; }
  eq(column: string, value: unknown) { this.filters[column] = value; return this; }
  gt(column: string, value: unknown) { this.filters[`gt:${column}`] = value; return this; }
  maybeSingle() { return this.runSelect(); }
  then(resolve: (value: unknown) => unknown) {
    return (this.op === 'update' ? this.runUpdate() : this.runSelect()).then(resolve);
  }

  private async runSelect() {
    if (this.table === 'evaluaciones_candidato') {
      return { data: this.filters.token_hash === db.evaluation.token_hash ? { ...db.evaluation } : null, error: null };
    }
    if (this.table === 'vacantes') return { data: { titulo: 'QA Analista', usuario_id: 'owner-1' }, error: null };
    if (this.table === 'companies') return { data: { nombre: 'Empresa QA' }, error: null };
    return { data: null, error: null };
  }

  private async runUpdate() {
    if (this.table === 'candidatos') {
      db.candidateUpdates.push(this.values);
      return { data: null, error: null };
    }
    if (this.filters.estado && db.evaluation.estado !== this.filters.estado) return { data: [], error: null };
    Object.assign(db.evaluation, this.values);
    return { data: [{ id: db.evaluation.id }], error: null };
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => new QueryBuilder(table),
    rpc: () => ({ single: async () => ({ data: { allowed: true, retry_after_s: 0 }, error: null }) }),
  }),
}));

import { GET, POST } from '@/app/api/evaluacion/[token]/route';

const params = (token = TOKEN) => ({ params: Promise.resolve({ token }) });
const post = (body: unknown) => new NextRequest(`http://localhost/api/evaluacion/${TOKEN}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  db.candidateUpdates = [];
  db.evaluation = {
    id: 'ev-1',
    candidato_id: 'cand-1',
    vacante_id: 'vac-1',
    token_hash: createHash('sha256').update(TOKEN).digest('hex'),
    estado: 'pendiente',
    expira_en: new Date(Date.now() + 86_400_000).toISOString(),
    abierta_en: null,
    preguntas: {
      pre_entrevista: [{ pregunta: '¿Por qué este puesto?' }],
      prueba_tecnica: [{ pregunta: '¿2 + 2?', opciones: ['3', '4'], respuesta_correcta: 1, criterio: 'secreto' }],
      preguntas_video: [],
    },
  };
});

describe('evaluación pública por enlace', () => {
  test('muestra las preguntas sin respuestas correctas ni criterios', async () => {
    const response = await GET(new NextRequest(`http://localhost/api/evaluacion/${TOKEN}`), params());
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.empresa).toBe('Empresa QA');
    expect(JSON.stringify(body)).not.toContain('respuesta_correcta');
    expect(JSON.stringify(body)).not.toContain('secreto');
    expect(body.preguntas.opcion_multiple[0].opciones).toEqual(['3', '4']);
  });

  test('un token desconocido o mal formado responde 404', async () => {
    expect((await GET(new NextRequest('http://localhost/x'), params('B'.repeat(43)))).status).toBe(404);
    expect((await GET(new NextRequest('http://localhost/x'), params('corto'))).status).toBe(404);
  });

  test('un enlace vencido responde 410', async () => {
    db.evaluation.expira_en = new Date(Date.now() - 1000).toISOString();
    const response = await GET(new NextRequest('http://localhost/x'), params());
    expect(response.status).toBe(410);
    expect((await response.json()).estado).toBe('expirada');
  });

  test('califica en el servidor, actualiza al candidato y solo acepta un envío', async () => {
    const first = await POST(post({ abiertas: ['Me encanta el análisis'], opcion_multiple: [1] }), params());
    expect(first.status).toBe(200);
    expect(db.evaluation).toMatchObject({ estado: 'completada', score_test: 100 });
    expect(db.candidateUpdates[0]).toMatchObject({ estado: 'evaluado', score_test: 100 });

    const second = await POST(post({ abiertas: ['otra'], opcion_multiple: [0] }), params());
    expect(second.status).toBe(410);
    expect(db.evaluation.score_test).toBe(100);
  });

  test('rechaza respuestas incompletas sin cerrar la evaluación', async () => {
    const response = await POST(post({ abiertas: [], opcion_multiple: [1] }), params());
    expect(response.status).toBe(400);
    expect(db.evaluation.estado).toBe('pendiente');
  });
});
