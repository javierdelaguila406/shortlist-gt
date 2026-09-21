// Simple in-memory rate limiter. En despliegues con varias instancias debe
// sustituirse por un almacén compartido (por ejemplo, Redis).
type RateLimitEntry = { count: number; resetTime: number };
import { createClient } from '@supabase/supabase-js';

const store = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minuto por defecto
): { success: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  const record = store.get(key);

  if (!record || now >= record.resetTime) {
    store.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  // Incrementar contador
  record.count++;

  if (record.count > limit) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { success: false, remaining: 0, retryAfter };
  }

  return { success: true, remaining: limit - record.count };
}

// Limpiar entradas expiradas cada 5 minutos sin mantener vivo el proceso.
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetTime <= now) {
      store.delete(key);
    }
  }
}, 300000);

cleanupTimer.unref?.();

export function resetRateLimitStore(): void {
  store.clear();
}

export async function persistentRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number; retryAfter?: number }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return rateLimit(identifier, limit, windowMs);

  const key = `ratelimit:${identifier}`;
  try {
    const client = createClient(url, serviceRole);
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs).toISOString();
    const cleanupBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await client.from('rate_limit_log').select('timestamp').eq('key', key).gt('timestamp', windowStart);
    if (error) throw error;
    const attempts = data?.length || 0;
    if (attempts >= limit) {
      const oldest = data?.map(item => new Date(item.timestamp).getTime()).sort()[0] || now.getTime();
      return { success: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now.getTime()) / 1000)) };
    }
    const { error: insertError } = await client.from('rate_limit_log').insert({ key, timestamp: now.toISOString() });
    if (insertError) throw insertError;
    void client.from('rate_limit_log').delete().lt('timestamp', cleanupBefore);
    return { success: true, remaining: limit - attempts - 1 };
  } catch {
    console.error('[RateLimit] Persistent operation failed; using local fallback', { key });
    return rateLimit(identifier, limit, windowMs);
  }
}
