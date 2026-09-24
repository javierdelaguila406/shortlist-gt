import { afterEach, describe, expect, test, vi } from 'vitest';

async function loadWithEnv(vercelEnv: string | undefined) {
  vi.resetModules();
  process.env.WHATSAPP_PHONE_NUMBER_ID = 'phone-id';
  process.env.WHATSAPP_ACCESS_TOKEN = 'token';
  if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = vercelEnv;
  return import('@/lib/whatsapp');
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.VERCEL_ENV;
});

describe('envío de WhatsApp solo en producción', () => {
  test.each(['preview', 'development', undefined])('no llama a la API de Meta con VERCEL_ENV=%s aunque haya credenciales', async (env) => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const whatsapp = await loadWithEnv(env);
    expect(whatsapp.isWhatsAppEnabled()).toBe(false);
    expect(await whatsapp.sendWhatsAppMessage('+50200000000', 'QA')).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('en producción con credenciales el envío está habilitado', async () => {
    const whatsapp = await loadWithEnv('production');
    expect(whatsapp.isWhatsAppEnabled()).toBe(true);
  });
});
