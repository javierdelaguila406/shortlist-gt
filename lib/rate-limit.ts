// Simple in-memory rate limiter
// Para producción, usar Redis
type RateLimitStore = {
  [key: string]: { count: number; resetTime: number };
};

const store: RateLimitStore = {};

export function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minuto por defecto
): { success: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  if (!store[key]) {
    store[key] = { count: 1, resetTime: now + windowMs };
    return { success: true, remaining: limit - 1 };
  }

  const record = store[key];

  // Reset si la ventana expiró
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
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

// Limpiar store viejo cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 600000);
