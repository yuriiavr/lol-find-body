// Простий in-memory rate limiter. Достатній для single-instance/dev.
// Для serverless/multi-instance замініть на Upstash Ratelimit або Redis.
const hits = new Map<string, { count: number; reset: number }>();

/**
 * Повертає true, якщо запит дозволено, false — якщо ліміт вичерпано.
 * @param key    унікальний ключ (напр. `rank-refresh:${userId}` або IP)
 * @param limit  скільки запитів дозволено у вікні
 * @param windowMs тривалість вікна в мілісекундах
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    // Періодичне прибирання застарілих ключів, щоб Map не ріс безмежно.
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        if (now > v.reset) hits.delete(k);
      }
    }
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
