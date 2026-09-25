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

// Contar e insertar ocurre dentro de rate_limit_hit bajo un bloqueo: solicitudes simultáneas no se saltan el límite.
// Si la base no responde, falla cerrado salvo que la llamada pida lo contrario.
export async function persistentRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
  options: { failOpen?: boolean } = {}
): Promise<{ success: boolean; remaining: number; retryAfter?: number }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = `ratelimit:${identifier}`;
  try {
    if (!url || !serviceRole) throw new Error('rate limit not configured');
    const client = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client
      .rpc('rate_limit_hit', { p_key: key, p_limit: limit, p_window_ms: windowMs })
      .single();
    if (error || !data) throw error ?? new Error('rate limit unavailable');
    const row = data as { allowed: boolean; retry_after_s: number };
    return row.allowed
      ? { success: true, remaining: 0 }
      : { success: false, remaining: 0, retryAfter: row.retry_after_s };
  } catch {
    console.error('[RateLimit] Persistent limiter unavailable', { key });
    return options.failOpen ? rateLimit(identifier, limit, windowMs) : { success: false, remaining: 0, retryAfter: 60 };
  }
}
