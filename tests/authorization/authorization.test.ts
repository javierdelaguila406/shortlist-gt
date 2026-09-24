import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

const fixtures = vi.hoisted(() => ({
  vacancies: {
    'vacante-a': { id: 'vacante-a', usuario_id: 'user-a' },
    'vacante-b': { id: 'vacante-b', usuario_id: 'user-b' },
  } as Record<string, { id: string; usuario_id: string }>,
  candidates: [
    { id: 'candidate-a', vacante_id: 'vacante-a', email: 'a@example.com', vacantes: { usuario_id: 'user-a' } },
    { id: 'candidate-b', vacante_id: 'vacante-b', email: 'b@example.com', vacantes: { usuario_id: 'user-b' } },
  ],
}));

class QueryBuilder {
  private operation = 'select';
  private filters: Record<string, unknown> = {};

  constructor(private table: string) {}

  select() { this.operation = 'select'; return this; }
  delete() { this.operation = 'delete'; return this; }
  insert() { this.operation = 'insert'; return this; }
  update() { this.operation = 'update'; return this; }
  eq(column: string, value: unknown) { this.filters[column] = value; return this; }
  order() { return this.execute(); }
  single() { return this.execute(true); }
  maybeSingle() { return this.execute(true); }
  then(resolve: (value: unknown) => unknown) { return this.execute().then(resolve); }

  private async execute(single = false) {
    if (this.operation !== 'select') return { data: null, error: null };

    if (this.table === 'vacantes') {
      const vacancy = fixtures.vacancies[String(this.filters.id)] || null;
      return { data: vacancy, error: vacancy ? null : { message: 'not found' } };
    }

    if (this.table === 'candidatos') {
      let rows = fixtures.candidates;
      for (const [column, value] of Object.entries(this.filters)) {
        rows = rows.filter((row) => row[column as keyof typeof row] === value);
      }
      return single
        ? { data: rows[0] || null, error: rows[0] ? null : { message: 'not found' } }
        : { data: rows, error: null };
    }

    if (this.table === 'companies') {
      return { data: single ? { plan: 'premium' } : [{ plan: 'premium' }], error: null };
    }

    return { data: single ? null : [], error: null };
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async (token: string) => {
        const id = token === 'token-a' ? 'user-a' : token === 'token-b' ? 'user-b' : null;
        return id
          ? { data: { user: { id } }, error: null }
          : { data: { user: null }, error: { message: 'invalid token' } };
      },
    },
    from: (table: string) => new QueryBuilder(table),
    rpc: () => ({ single: async () => ({ data: { email: null, plan: 'premium' }, error: null }) }),
    storage: { from: () => ({ remove: async () => ({ error: null }) }) },
  }),
}));

vi.mock('@/lib/whatsapp', () => ({ sendEvaluationStart: vi.fn(), isWhatsAppEnabled: vi.fn(() => false) }));

import { GET as listCandidates } from '@/app/api/candidatos/listar/route';
import { GET as getCandidate } from '@/app/api/candidatos/[id]/route';
import { PUT as customizeQuestions } from '@/app/api/evaluaciones/personalizar-preguntas/route';
import { POST as startWhatsapp } from '@/app/api/evaluaciones/iniciar-whatsapp/route';
import { DELETE as deleteVacancy } from '@/app/api/vacantes/eliminar/route';
import { POST as exportCandidate } from '@/app/api/candidatos/exportar/route';
import { DELETE as deleteCandidate } from '@/app/api/candidatos/eliminar/route';
import { POST as redeemLicense } from '@/app/api/auth/use-license-code/route';
import { rateLimit, resetRateLimitStore } from '@/lib/rate-limit';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-test-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-test-key';
  resetRateLimitStore();
});

describe('authorization boundaries', () => {
  test('Usuario A NO puede listar candidatos de Usuario B', async () => {
    const request = new NextRequest('http://localhost/api/candidatos/listar?vacante_id=vacante-b', { headers: auth('token-a') });
    expect((await listCandidates(request)).status).toBe(403);
  });

  test('Usuario A puede listar candidatos PROPIOS', async () => {
    const request = new NextRequest('http://localhost/api/candidatos/listar?vacante_id=vacante-a', { headers: auth('token-a') });
    const response = await listCandidates(request);
    expect(response.status).toBe(200);
    expect((await response.json()).candidatos).toHaveLength(1);
  });

  test('Usuario A NO puede borrar vacante de Usuario B', async () => {
    const request = new NextRequest('http://localhost/api/vacantes/eliminar', {
      method: 'DELETE', headers: auth('token-a'), body: JSON.stringify({ vacante_id: 'vacante-b' }),
    });
    expect((await deleteVacancy(request)).status).toBe(403);
  });

  test('Usuario A puede borrar vacante PROPIA', async () => {
    const request = new NextRequest('http://localhost/api/vacantes/eliminar', {
      method: 'DELETE', headers: auth('token-a'), body: JSON.stringify({ vacante_id: 'vacante-a' }),
    });
    expect((await deleteVacancy(request)).status).toBe(200);
  });

  test('Usuario A NO puede exportar candidatos de Usuario B', async () => {
    const request = new NextRequest('http://localhost/api/candidatos/exportar', {
      method: 'POST', headers: { ...auth('token-a'), 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'b@example.com' }),
    });
    expect((await exportCandidate(request)).status).toBe(403);
  });

  test('Exportar aplica límite de 5 solicitudes por usuario por hora', async () => {
    const makeRequest = () => new NextRequest('http://localhost/api/candidatos/exportar', {
      method: 'POST', headers: { ...auth('token-a'), 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a@example.com' }),
    });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await exportCandidate(makeRequest())).status).toBe(200);
    }
    expect((await exportCandidate(makeRequest())).status).toBe(429);
  });

  test('Canje de licencia aplica límite de 5 intentos por usuario por hora', async () => {
    const makeRequest = () => new NextRequest('http://localhost/api/auth/use-license-code', {
      method: 'POST', headers: { ...auth('token-a'), 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: 'TEST-CODE' }),
    });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await redeemLicense(makeRequest())).status).toBe(200);
    }
    expect((await redeemLicense(makeRequest())).status).toBe(429);
  });

  test('Usuario A NO puede borrar candidato de Usuario B', async () => {
    const request = new NextRequest('http://localhost/api/candidatos/eliminar', {
      method: 'DELETE', headers: auth('token-a'), body: JSON.stringify({ candidatoId: 'candidate-b' }),
    });
    expect((await deleteCandidate(request)).status).toBe(403);
  });

  test('Usuario A puede borrar candidato PROPIO', async () => {
    const request = new NextRequest('http://localhost/api/candidatos/eliminar', {
      method: 'DELETE', headers: auth('token-a'), body: JSON.stringify({ candidatoId: 'candidate-a' }),
    });
    expect((await deleteCandidate(request)).status).toBe(200);
  });

  test('Usuario anónimo es rechazado en APIs protegidas', async () => {
    const requests = [
      listCandidates(new NextRequest('http://localhost/api/candidatos/listar?vacante_id=vacante-a')),
      deleteVacancy(new NextRequest('http://localhost/api/vacantes/eliminar', { method: 'DELETE', body: JSON.stringify({ vacante_id: 'vacante-a' }) })),
      exportCandidate(new NextRequest('http://localhost/api/candidatos/exportar', { method: 'POST', body: JSON.stringify({ email: 'a@example.com' }) })),
    ];
    const responses = await Promise.all(requests);
    expect(responses.map((response) => response.status)).toEqual([401, 401, 401]);
  });

  test('La sesión en cookie httpOnly autentica igual que el Bearer', async () => {
    const request = new NextRequest('http://localhost/api/candidatos/listar?vacante_id=vacante-a', {
      headers: { cookie: 'sb-auth-token=token-a' },
    });
    expect((await listCandidates(request)).status).toBe(200);
  });

  test('El dueño puede ver su candidato aunque la relación llegue como objeto (N-05)', async () => {
    const request = new NextRequest('http://localhost/api/candidatos/candidate-a', { headers: auth('token-a') });
    const response = await getCandidate(request, { params: Promise.resolve({ id: 'candidate-a' }) });
    expect(response.status).toBe(200);
    expect((await response.json()).candidato).not.toHaveProperty('vacantes');
  });

  test('Usuario A NO puede ver candidato de Usuario B', async () => {
    const request = new NextRequest('http://localhost/api/candidatos/candidate-b', { headers: auth('token-a') });
    const response = await getCandidate(request, { params: Promise.resolve({ id: 'candidate-b' }) });
    expect([403, 404]).toContain(response.status);
  });

  test('Usuario A NO puede reescribir preguntas de vacante de Usuario B (N-03)', async () => {
    const request = new NextRequest('http://localhost/api/evaluaciones/personalizar-preguntas', {
      method: 'PUT',
      headers: { ...auth('token-a'), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vacante_id: 'vacante-b',
        prueba_tecnica: [{ numero: 1, pregunta: 'QA', opciones: ['a', 'b'], respuesta_correcta: 1 }],
      }),
    });
    expect([403, 404]).toContain((await customizeQuestions(request)).status);
  });

  test('personalizar-preguntas rechaza respuesta_correcta fuera de rango', async () => {
    const request = new NextRequest('http://localhost/api/evaluaciones/personalizar-preguntas', {
      method: 'PUT',
      headers: { ...auth('token-a'), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vacante_id: 'vacante-a',
        prueba_tecnica: [{ numero: 1, pregunta: 'QA', opciones: ['a', 'b'], respuesta_correcta: 5 }],
      }),
    });
    expect((await customizeQuestions(request)).status).toBe(400);
  });

  test('Usuario A NO puede iniciar WhatsApp ni leer datos de candidato de Usuario B (N-02)', async () => {
    const request = new NextRequest('http://localhost/api/evaluaciones/iniciar-whatsapp', {
      method: 'POST',
      headers: { ...auth('token-a'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidatoId: 'candidate-b' }),
    });
    const response = await startWhatsapp(request);
    expect([403, 404]).toContain(response.status);
    expect(JSON.stringify(await response.json())).not.toContain('b@example.com');
  });
});

describe('rate limiting', () => {
  test('permite solicitudes dentro del límite', () => {
    expect(rateLimit('endpoint:user-a', 2, 1000).success).toBe(true);
    expect(rateLimit('endpoint:user-a', 2, 1000).success).toBe(true);
  });

  test('rechaza solicitudes que superan el límite', () => {
    rateLimit('endpoint:user-b', 1, 1000);
    expect(rateLimit('endpoint:user-b', 1, 1000).success).toBe(false);
  });

  test('reinicia el contador después de expirar la ventana', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    rateLimit('endpoint:user-c', 1, 1000);
    vi.setSystemTime(new Date('2026-01-01T00:00:02Z'));
    expect(rateLimit('endpoint:user-c', 1, 1000)).toEqual({ success: true, remaining: 0 });
    vi.useRealTimers();
  });
});
