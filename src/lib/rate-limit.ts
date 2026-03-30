const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter for API routes.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 * 
 * NOTE: This is per-instance (resets on cold start). For production at scale,
 * swap to Redis or Vercel KV. Fine for launch.
 */
export function rateLimit(
  key: string,
  { maxRequests = 10, windowMs = 60_000 }: { maxRequests?: number; windowMs?: number } = {}
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { allowed: true };
}

// Periodic cleanup to prevent memory leak (runs every 5 min)
if (typeof globalThis !== "undefined") {
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  const globalAny = globalThis as any;
  if (!globalAny.__rateLimitCleanup) {
    globalAny.__rateLimitCleanup = setInterval(() => {
      const now = Date.now();
      for (const [k, v] of rateLimitMap) {
        if (now > v.resetAt) rateLimitMap.delete(k);
      }
    }, CLEANUP_INTERVAL);
  }
}
