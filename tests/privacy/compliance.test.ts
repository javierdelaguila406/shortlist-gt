import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const database = vi.hoisted(() => ({
  rateHits: {} as Record<string, number>,
  rpcFails: false,
  audits: [] as Array<Record<string, unknown>>,
}));

class QueryBuilder {
  constructor(private table: string) {}
  async insert(value: Record<string, unknown>) {
    if (this.table === 'audit_log') database.audits.push(value);
    return { error: null };
  }
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => new QueryBuilder(table),
    rpc: (_name: string, args: { p_key: string; p_limit: number }) => ({
      single: async () => {
        if (database.rpcFails) return { data: null, error: { message: 'unavailable' } };
        const hits = database.rateHits[args.p_key] ?? 0;
        if (hits >= args.p_limit) return { data: { allowed: false, retry_after_s: 30 }, error: null };
        database.rateHits[args.p_key] = hits + 1;
        return { data: { allowed: true, retry_after_s: 0 }, error: null };
      },
    }),
  }),
}));

import { logAuditEvent } from '@/lib/audit';
import { persistentRateLimit, resetRateLimitStore } from '@/lib/rate-limit';

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role';
  database.rateHits = {};
  database.rpcFails = false;
  database.audits = [];
  resetRateLimitStore();
});

describe('rate limit persistente', () => {
  test('persiste después de reiniciar el almacén local y separa usuarios', async () => {
    for (let index = 0; index < 5; index += 1) {
      expect((await persistentRateLimit('export:user-a', 5, 3600000)).success).toBe(true);
    }
    resetRateLimitStore();
    const blocked = await persistentRateLimit('export:user-a', 5, 3600000);
    expect(blocked).toMatchObject({ success: false, retryAfter: 30 });
    expect((await persistentRateLimit('export:user-b', 5, 3600000)).success).toBe(true);
  });

  test('falla cerrado si la base no responde', async () => {
    database.rpcFails = true;
    expect((await persistentRateLimit('login:1.2.3.4', 5, 3600000)).success).toBe(false);
  });

  test('con failOpen usa el contador local si la base no responde', async () => {
    database.rpcFails = true;
    expect((await persistentRateLimit('login:1.2.3.4', 5, 3600000, { failOpen: true })).success).toBe(true);
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
    expect(retention).toContain("storage.from('cvs').remove");
  });
});
