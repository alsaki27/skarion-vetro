// Simple in-memory rate limiter for auth endpoints.
// In production, replace with Redis-based sliding window.

const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  login: { maxRequests: 10, windowMs: 60_000 },
  invite: { maxRequests: 20, windowMs: 60_000 },
  refresh: { maxRequests: 30, windowMs: 60_000 },
};

export function checkRateLimit(key: string, endpoint: string): { allowed: boolean; remaining: number; resetAt: number } {
  const config = DEFAULTS[endpoint] ?? { maxRequests: 60, windowMs: 60_000 };
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  bucket.count++;
  if (bucket.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  return { allowed: true, remaining: config.maxRequests - bucket.count, resetAt: bucket.resetAt };
}

// Prevent unbounded memory growth — prune expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(key);
    }
  }, 300_000);
}
