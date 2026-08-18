// Minimal in-memory rate limiter. Good enough for a single Node instance /
// local development. On serverless (Vercel), each function instance has its
// own memory, so this only provides a soft per-instance limit — for real
// production protection, swap this for a durable store such as Upstash
// Redis (see README "Production hardening").

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  opts: { max: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.max - 1 };
  }

  if (bucket.count >= opts.max) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: opts.max - bucket.count };
}

export function clientKeyFromHeaders(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
