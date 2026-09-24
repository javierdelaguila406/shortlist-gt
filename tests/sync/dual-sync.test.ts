import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  existing: null as null | { id: string },
  insert: vi.fn(async () => true),
  update: vi.fn(async () => true),
  get: vi.fn(async () => mocks.existing),
  supabaseUpsert: vi.fn(() => ({ select: async () => ({ data: [{ id: 'vacante-a' }], error: null }) })),
}));

vi.mock('@/lib/godaddy-db', () => ({
  insertGodaddyRecord: mocks.insert,
  updateGodaddyRecord: mocks.update,
  getGodaddyRecord: mocks.get,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ upsert: mocks.supabaseUpsert }),
  }),
}));

import { syncCreateVacante } from '@/lib/dual-sync';

const vacancy = {
  id: 'vacante-a',
  usuario_id: 'user-a',
  titulo: 'Developer',
  userEmail: 'lesters@furniturecity.com.gt',
};

beforeEach(() => {
  mocks.existing = null;
  vi.clearAllMocks();
  process.env.VERCEL_ENV = 'production';
});

afterEach(() => {
  delete process.env.VERCEL_ENV;
});

describe('copia a GoDaddy solo en producción', () => {
  test.each(['preview', 'development', undefined])('con VERCEL_ENV=%s no toca GoDaddy', async (env) => {
    if (env === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = env;
    await syncCreateVacante(vacancy);
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe('syncCreateVacante idempotente', () => {
  test('inserta una sola vez cuando la vacante no existe', async () => {
    const result = await syncCreateVacante(vacancy);
    expect(result.success).toBe(true);
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).toHaveBeenCalledWith('vacantes', expect.objectContaining({
      id: 'vacante-a', usuario_id: 'user-a', estado: 'activa',
    }));
  });

  test('un reintento actualiza y no duplica', async () => {
    mocks.existing = { id: 'vacante-a' };
    const result = await syncCreateVacante(vacancy);
    expect(result.success).toBe(true);
    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
