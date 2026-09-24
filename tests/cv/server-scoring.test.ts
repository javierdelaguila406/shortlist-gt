import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ extractedText: 'TypeScript React SQL 6 años de experiencia', insert: vi.fn(async () => ({ error: null })) }));

vi.mock('pdf-parse/worker', () => ({}));
vi.mock('pdf-parse', () => ({
  PDFParse: class {
    async getText() { return { text: mocks.extractedText }; }
    async destroy() {}
  },
}));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: async (token: string) => token === 'valid' ? { data: { user: { id: 'user-a' } }, error: null } : { data: { user: null }, error: {} } },
    from: () => ({ insert: mocks.insert }),
  }),
}));

import { POST } from '@/app/api/cv/route';
import { calculateCVScore } from '@/lib/cv-score';
import { resetRateLimitStore } from '@/lib/rate-limit';

const makeRequest = (file: File, authenticated = true) => {
  const form = new FormData();
  form.set('pdf', file);
  form.set('score', '100');
  return new NextRequest('http://localhost/api/cv', {
    method: 'POST', headers: authenticated ? { Authorization: 'Bearer valid' } : {}, body: form,
  });
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  mocks.extractedText = 'TypeScript React SQL 6 años de experiencia';
  mocks.insert.mockClear();
  resetRateLimitStore();
});

describe('scoring de documentos en servidor', () => {
  test('calcula y persiste un score determinista sin aceptar score cliente', async () => {
    const file = new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' });
    const first = await POST(makeRequest(file));
    const second = await POST(makeRequest(file));
    expect(first.status).toBe(200);
    expect((await first.json()).score_total).toBe((await second.json()).score_total);
    expect(calculateCVScore(mocks.extractedText).total).toBe(60);
    expect(mocks.insert).toHaveBeenCalledTimes(2);
  });

  test('documento sin texto retorna score cero y no evaluado', async () => {
    mocks.extractedText = '   ';
    const response = await POST(makeRequest(new File(['%PDF-1.4'], 'scan.pdf', { type: 'application/pdf' })));
    expect(await response.json()).toMatchObject({ score_total: 0, evaluated: false });
  });

  test('rechaza archivo no PDF', async () => {
    expect((await POST(makeRequest(new File(['text'], 'resume.txt', { type: 'text/plain' })))).status).toBe(400);
  });

  test('rechaza archivo que declara PDF pero no tiene la firma %PDF-', async () => {
    const disguised = new File(['<html>no es pdf</html>'], 'resume.pdf', { type: 'application/pdf' });
    expect((await POST(makeRequest(disguised))).status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  test('rechaza archivo mayor de 10MB', async () => {
    const large = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' });
    expect((await POST(makeRequest(large))).status).toBe(413);
  });

  test('rechaza solicitud sin autenticación', async () => {
    expect((await POST(makeRequest(new File(['%PDF'], 'resume.pdf', { type: 'application/pdf' }), false))).status).toBe(401);
  });
});
