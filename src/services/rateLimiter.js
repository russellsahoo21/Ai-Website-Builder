/**
 * rateLimiter.js
 * In-memory sliding window rate limiter for Next.js API routes.
 * Tracks requests per identifier (e.g. Clerk userId or client IP) with automatic cleanup.
 */

const hitMap = new Map();

// Periodic sweep every 5 minutes to avoid memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer = null;

function ensureCleanupTimer() {
  if (cleanupTimer || typeof setInterval === 'undefined') return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of hitMap.entries()) {
      const valid = timestamps.filter(t => now - t < 120000);
      if (valid.length === 0) {
        hitMap.delete(key);
      } else {
        hitMap.set(key, valid);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

/**
 * Checks and records a request against a sliding-window rate limit.
 *
 * @param {string} key - Unique rate-limit identifier (userId or IP)
 * @param {Object} options
 * @param {number} options.maxRequests - Max allowed requests within the window (default: 10)
 * @param {number} options.windowMs - Sliding window duration in ms (default: 60,000 / 1 min)
 * @returns {{ allowed: boolean, remaining: number, resetMs: number, total: number }}
 */
export function checkRateLimit(key, { maxRequests = 10, windowMs = 60000 } = {}) {
  ensureCleanupTimer();

  const now = Date.now();
  const windowStart = now - windowMs;

  const history = hitMap.get(key) || [];
  const activeHits = history.filter(t => t > windowStart);

  if (activeHits.length >= maxRequests) {
    const oldest = activeHits[0];
    const resetMs = Math.max(0, oldest + windowMs - now);
    return {
      allowed: false,
      remaining: 0,
      resetMs,
      total: maxRequests,
    };
  }

  activeHits.push(now);
  hitMap.set(key, activeHits);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - activeHits.length),
    resetMs: windowMs,
    total: maxRequests,
  };
}

/**
 * Generates standard RFC rate limit headers for HTTP responses.
 */
export function getRateLimitHeaders(rateLimitResult) {
  return {
    'X-RateLimit-Limit': String(rateLimitResult.total),
    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
    'X-RateLimit-Reset': String(Math.ceil((Date.now() + rateLimitResult.resetMs) / 1000)),
    ...(rateLimitResult.allowed ? {} : { 'Retry-After': String(Math.ceil(rateLimitResult.resetMs / 1000)) }),
  };
}

/**
 * Resets rate limit for a specific key (useful for tests)
 */
export function resetRateLimit(key) {
  if (key) {
    hitMap.delete(key);
  } else {
    hitMap.clear();
  }
}
