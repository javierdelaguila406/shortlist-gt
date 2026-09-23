import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import { PDFParse } from 'pdf-parse';

const fixtures = vi.hoisted(() => ({
  candidates: [] as Array<Record<string, unknown>>,
}));

class QueryBuilder {
  private filters: Record<string, unknown> = {};
  constructor(private table: string) {}
  select() { return this; }
  eq(column: string, value: unknown) { this.filters[column] = value; return this; }
  gte() { return this; }
  lte() { return this; }
  maybeSingle() { return this.single(); }
  single() {
    if (this.table === 'vacantes') {
      const owner = this.filters.id === 'vacante-b' ? 'user-b' : 'user-a';
      return Promise.resolve({ data: { id: this.filters.id, usuario_id: owner, titulo: 'Test Export' }, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }
  order() {
    const data = this.filters.estado
      ? fixtures.candidates.filter((candidate) => candidate.estado === this.filters.estado)
      : fixtures.candidates;
    return Promise.resolve({ data, error: null });
  }
  insert() { return Promise.resolve({ error: null }); }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: async (token: string) => ({ data: { user: token ? { id: 'user-a' } : null }, error: null }) },
    from: (table: string) => new QueryBuilder(table),
  }),
}));

import { POST } from '@/app/api/candidatos/exportar/route';
import { resetRateLimitStore } from '@/lib/rate-limit';

const makeRequest = (body: Record<string, unknown>) => new NextRequest('http://localhost/api/candidatos/exportar', {
  method: 'POST',
  headers: { Authorization: 'Bearer token-a', 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const validBody = {
  vacante_id: 'vacante-a', formato: 'excel', desde: '2026-01-01', hasta: '2026-12-31',
};

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  fixtures.candidates = [];
  resetRateLimitStore();
});

describe('exportación por vacante', () => {
  test('genera un Excel descargable para un rango válido', async () => {
    fixtures.candidates = [{
      email: 'candidate@example.com', nombre: 'Candidate', estado: 'aceptado', score_total: 90,
      created_at: '2026-03-01T12:00:00.000Z',
    }];
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('spreadsheetml');
    const workbook = XLSX.read(await response.arrayBuffer());
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Candidatos);
    expect(rows).toHaveLength(1);
  });

  test('rango vacío retorna Excel con encabezados y cero datos', async () => {
    const response = await POST(makeRequest(validBody));
    expect(response.status).toBe(200);
    const workbook = XLSX.read(await response.arrayBuffer());
    const sheet = workbook.Sheets.Candidatos;
    expect(XLSX.utils.sheet_to_json(sheet)).toHaveLength(0);
    expect(XLSX.utils.sheet_to_json(sheet, { header: 1 })[0]).toEqual([
      'email', 'nombre', 'estado', 'score_total', 'fecha_postulacion',
    ]);
  });

  test('rechaza un rango invertido', async () => {
    const response = await POST(makeRequest({ ...validBody, desde: '2026-12-31', hasta: '2026-01-01' }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe('Fecha inicial debe ser anterior a final');
  });

  test('rechaza exportar una vacante ajena', async () => {
    expect((await POST(makeRequest({ ...validBody, vacante_id: 'vacante-b' }))).status).toBe(403);
  });

  test('bloquea el sexto intento durante la ventana', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await POST(makeRequest(validBody))).status).toBe(200);
    }
    expect((await POST(makeRequest(validBody))).status).toBe(429);
  });

  test('PDF y Excel contienen los mismos 20 registros, scores, fechas y estados', async () => {
    fixtures.candidates = Array.from({ length: 20 }, (_, index) => ({
      email: `compare${index}@example.com`, nombre: `José ${index}`, estado: index % 2 ? 'aceptado' : 'rechazado',
      score_total: 50 + index, created_at: `2026-02-${String(index + 1).padStart(2, '0')}T12:00:00.000Z`,
    }));
    const excelResponse = await POST(makeRequest(validBody));
    const pdfResponse = await POST(makeRequest({ ...validBody, formato: 'pdf' }));
    const workbook = XLSX.read(await excelResponse.arrayBuffer());
    const excelRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Candidatos);
    const parser = new PDFParse({ data: Buffer.from(await pdfResponse.arrayBuffer()) });
    const pdfText = (await parser.getText()).text;
    await parser.destroy();

    expect(excelRows).toHaveLength(20);
    for (const row of excelRows) {
      expect(pdfText).toContain(String(row.email));
      expect(pdfText).toContain(String(row.estado));
      expect(pdfText).toContain(String(row.score_total));
      expect(pdfText).toContain(String(row.fecha_postulacion));
    }
  });

  test('filtro de estado devuelve solo candidatos aceptados', async () => {
    fixtures.candidates = [
      { email: 'accepted@example.com', nombre: 'Accepted', estado: 'aceptado', created_at: '2026-02-01T00:00:00Z' },
      { email: 'rejected@example.com', nombre: 'Rejected', estado: 'rechazado', created_at: '2026-02-02T00:00:00Z' },
    ];
    const response = await POST(makeRequest({ ...validBody, estado: 'aceptado' }));
    const workbook = XLSX.read(await response.arrayBuffer());
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Candidatos);
    expect(rows).toHaveLength(1);
    expect(rows[0].estado).toBe('aceptado');
  });

  test('cada reporte registra auditoría única sin datos personales', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    for (let index = 0; index < 5; index += 1) await POST(makeRequest(validBody));
    const generated = log.mock.calls.filter(([message]) => message === '[Report] Generated');
    expect(generated).toHaveLength(5);
    expect(new Set(generated.map(([, metadata]) => (metadata as { reportId: string }).reportId)).size).toBe(5);
    for (const [, metadata] of generated) {
      expect(metadata).toMatchObject({ userId: 'user-a', vacante_id: 'vacante-a', formato: 'excel' });
      expect(JSON.stringify(metadata)).not.toMatch(/candidate|authorization|bearer/i);
    }
    log.mockRestore();
  });
});
