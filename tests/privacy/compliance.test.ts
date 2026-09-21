import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const database = vi.hoisted(() => ({
  rateLimits: [] as Array<{ key: string; timestamp: string }>,
  audits: [] as Array<Record<string, unknown>>,
}));

class QueryBuilder {
  private operation = 'select';
  private key = '';
  constructor(private table: string) {}
  select() { this.operation = 'select'; return this; }
  eq(column: string, value: string) { if (column === 'key') this.key = value; return this; }
  async gt(_column: string, value: string) {
    return { data: database.rateLimits.filter(row => row.key === this.key && row.timestamp > value), error: null };
  }
  async insert(value: Record<string, unknown>) {
    if (this.table === 'rate_limit_log') database.rateLimits.push(value as { key: string; timestamp: string });
    if (this.table === 'audit_log') database.audits.push(value);
    return { error: null };
  }
  delete() { this.operation = 'delete'; return this; }
  async lt(_column: string, value: string) {
    if (this.operation === 'delete' && this.table === 'rate_limit_log') {
      database.rateLimits = database.rateLimits.filter(row => row.timestamp >= value);
    }
    return { error: null };
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: (table: string) => new QueryBuilder(table) }),
}));

import { logAuditEvent } from '@/lib/audit';
import { persistentRateLimit, resetRateLimitStore } from '@/lib/rate-limit';

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  database.rateLimits = [];
  database.audits = [];
  resetRateLimitStore();
});

describe('rate limit persistente', () => {
  test('persiste después de reiniciar el almacén local y separa usuarios', async () => {
    for (let index = 0; index < 5; index += 1) {
      expect((await persistentRateLimit('export:user-a', 5, 3600000)).success).toBe(true);
    }
    resetRateLimitStore();
    expect((await persistentRateLimit('export:user-a', 5, 3600000)).success).toBe(false);
    expect((await persistentRateLimit('export:user-b', 5, 3600000)).success).toBe(true);
  });

  test('elimina registros con más de 24 horas', async () => {
    database.rateLimits.push({ key: 'old', timestamp: '2020-01-01T00:00:00.000Z' });
    await persistentRateLimit('new', 5, 3600000);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(database.rateLimits.some(row => row.key === 'old')).toBe(false);
  });
});

describe('cumplimiento y auditoría', () => {
  test('elimina PII del campo cambios', async () => {
    await logAuditEvent({
      action: 'CREATE', userId: 'user-a', resourceId: 'candidate-a', resourceType: 'candidato',
      changes: { vacante_id: 'vacancy-a', estado: 'pendiente', email: 'private@example.com', cvText: 'secret' },
    });
    expect(database.audits[0].cambios).toEqual({ vacante_id: 'vacancy-a', estado: 'pendiente' });
  });

  test('migración, consentimiento y ciclo de vida están conectados', () => {
    const migration = readFileSync('migrations/005_privacy_compliance.sql', 'utf8');
    const application = readFileSync('app/api/candidatos/postular/route.ts', 'utf8');
    const retention = readFileSync('lib/retention.ts', 'utf8');
    expect(migration).toContain('public.consent_log');
    expect(migration).toContain('public.rate_limit_log');
    expect(migration).toContain('public.audit_log');
    expect(application.indexOf("from('consent_log')")).toBeLessThan(application.indexOf("from('candidatos')"));
    expect(retention).toContain('runRetentionJobs');
    expect(retention).toContain('syncDeleteVacante');
  });
});
