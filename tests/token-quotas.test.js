import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTokenUsage,
  verifyTokenQuota,
  resetTokenUsage,
  recordTokenUsage,
  getCurrentPeriod,
  FREE_TIER_MONTHLY_TOKEN_CAP,
  PRO_TIER_MONTHLY_TOKEN_CAP
} from '../src/services/tokenService.js';
import { checkRateLimit, resetRateLimit } from '../src/services/rateLimiter.js';

test('Token Quotas — Monthly cap defaults and period format', () => {
  assert.equal(FREE_TIER_MONTHLY_TOKEN_CAP, 100000);
  assert.equal(PRO_TIER_MONTHLY_TOKEN_CAP, 1000000);

  const period = getCurrentPeriod();
  assert.match(period, /^\d{4}-\d{2}$/, 'Period should match YYYY-MM format');
});

test('Token Quotas — BYOK bypasses quota verification regardless of usage', () => {
  const result = verifyTokenQuota(50000, true, 'user_byok_test');
  assert.equal(result.allowed, true);
  assert.equal(result.quotaBypassed, true);
});

test('Token Quotas — Server-side Rate Limiting sliding window', () => {
  const testKey = `test_user_rate_${Date.now()}`;
  resetRateLimit(testKey);

  // Send 5 requests within limit of 5
  for (let i = 0; i < 5; i++) {
    const res = checkRateLimit(testKey, { maxRequests: 5, windowMs: 10000 });
    assert.equal(res.allowed, true, `Request ${i + 1} should be allowed`);
  }

  // 6th request must be rejected
  const sixth = checkRateLimit(testKey, { maxRequests: 5, windowMs: 10000 });
  assert.equal(sixth.allowed, false, '6th request must exceed rate limit');
  assert.equal(sixth.remaining, 0);
  assert.ok(sixth.resetMs > 0);

  // Reset and verify recovery
  resetRateLimit(testKey);
  const fresh = checkRateLimit(testKey, { maxRequests: 5, windowMs: 10000 });
  assert.equal(fresh.allowed, true, 'After reset, request should be allowed');
});
