// Simple in-memory rate limiter. En despliegues con varias instancias debe
// sustituirse por un almacén compartido (por ejemplo, Redis).
type RateLimitEntry = { count: number; resetTime: number };

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
