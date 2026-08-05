import { RATE_LIMITS, RateLimitTier } from '@/types/platform';

interface RateLimitEntry {
  count: number;
  resetAt: number;
  tokens: number;
  lastRefill: number;
}

/**
 * RateLimitManager
 *
 * Token bucket + sliding window rate limiter.
 * Supports per-tier limits and burst detection.
 */
export class RateLimitManager {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if a request is allowed for a given client.
   */
  checkLimit(clientId: string, tier: RateLimitTier): {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterMs?: number;
  } {
    const config = RATE_LIMITS[tier];
    const now = Date.now();
    const key = `ratelimit:${clientId}`;
    const minuteKey = `${key}:${Math.floor(now / 60000)}`;

    let entry = this.store.get(minuteKey);
    if (!entry) {
      entry = {
        count: 0,
        resetAt: Math.floor(now / 60000 + 1) * 60000,
        tokens: config.burst_size,
        lastRefill: now,
      };
      this.store.set(minuteKey, entry);
    }

    // Refill tokens
    const elapsed = now - entry.lastRefill;
    const refillRate = config.requests_per_minute / 60000;
    entry.tokens = Math.min(config.burst_size, entry.tokens + elapsed * refillRate);
    entry.lastRefill = now;

    // Check burst (token bucket)
    if (entry.tokens < 1) {
      const retryAfterMs = Math.ceil((1 - entry.tokens) / refillRate);
      return {
        allowed: false,
        limit: config.requests_per_minute,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfterMs,
      };
    }

    // Check minute limit (sliding window)
    if (entry.count >= config.requests_per_minute) {
      return {
        allowed: false,
        limit: config.requests_per_minute,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfterMs: entry.resetAt - now,
      };
    }

    // Allow request
    entry.count++;
    entry.tokens--;

    return {
      allowed: true,
      limit: config.requests_per_minute,
      remaining: config.requests_per_minute - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Get current usage for a client.
   */
  getUsage(clientId: string, tier: RateLimitTier): {
    used: number;
    limit: number;
    remaining: number;
    resetAt: number;
  } {
    const config = RATE_LIMITS[tier];
    const now = Date.now();
    const minuteKey = `ratelimit:${clientId}:${Math.floor(now / 60000)}`;
    const entry = this.store.get(minuteKey);

    if (!entry) {
      return { used: 0, limit: config.requests_per_minute, remaining: config.requests_per_minute, resetAt: Math.floor(now / 60000 + 1) * 60000 };
    }

    return {
      used: entry.count,
      limit: config.requests_per_minute,
      remaining: Math.max(0, config.requests_per_minute - entry.count),
      resetAt: entry.resetAt,
    };
  }

  /**
   * Cleanup expired entries.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the rate limiter.
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}
