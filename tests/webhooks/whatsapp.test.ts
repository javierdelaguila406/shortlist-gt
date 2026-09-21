import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/whatsapp', () => ({ handleIncomingMessage: vi.fn() }));
vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ insert: vi.fn().mockResolvedValue({ error: null }) }) },
}));

import { POST } from '@/app/api/webhooks/whatsapp/route';

const secret = 'test-app-secret';
const body = JSON.stringify({ message: 'test' });
const request = (signature?: string) => new NextRequest('http://localhost/api/webhooks/whatsapp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(signature ? { 'X-Hub-Signature-256': signature } : {}),
  },
  body,
});

beforeEach(() => {
  process.env.WHATSAPP_APP_SECRET = secret;
});

describe('firma del webhook de WhatsApp', () => {
  test('acepta una firma HMAC válida', async () => {
    const digest = createHmac('sha256', secret).update(body).digest('hex');
    expect((await POST(request(`sha256=${digest}`))).status).toBe(200);
  });

  test('rechaza una solicitud sin firma', async () => {
    expect((await POST(request())).status).toBe(401);
  });

  test('rechaza una firma inválida', async () => {
    expect((await POST(request('sha256=invalid'))).status).toBe(401);
  });
});
