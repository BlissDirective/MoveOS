/**
 * Minimal in-memory fixed-window rate limiter. Good enough for a single dev
 * process; replace with a distributed store (Upstash/Redis) before running
 * more than one instance — counters here are per-process.
 */
export interface RateLimiter {
  /** Returns true if the action is allowed for `key` within the window. */
  check(key: string): boolean;
}

export function inMemoryRateLimiter(opts: {
  windowMs: number;
  max: number;
}): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key) {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || now >= entry.resetAt) {
        hits.set(key, { count: 1, resetAt: now + opts.windowMs });
        return true;
      }
      if (entry.count >= opts.max) return false;
      entry.count += 1;
      return true;
    },
  };
}
