import test from 'node:test';
import assert from 'node:assert/strict';

import { PLANS, getPlanConfig, isUnlimitedPlan } from '../src/config/plans.js';
import { POST as generateHandler, tokenLedger } from '../app/api/generate/route.js';
import { GET as usageHandler } from '../app/api/usage/route.js';
import { atomicReserveTokens, atomicRollbackTokens } from '../src/services/dbService.js';

process.env.NODE_ENV = 'test';

function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

test('Plan Configuration — Source of truth definitions and helpers', () => {
  // Free tier
  const freeConfig = getPlanConfig('free');
  assert.equal(freeConfig.id, 'free');
  assert.equal(freeConfig.monthlyTokenQuota, 100000);
  assert.equal(freeConfig.maxProjects, 5);
  assert.equal(isUnlimitedPlan('free'), false);

  // Pro tier
  const proConfig = getPlanConfig('pro');
  assert.equal(proConfig.id, 'pro');
  assert.equal(proConfig.monthlyTokenQuota, -1);
  assert.equal(proConfig.maxProjects, 50);
  assert.equal(isUnlimitedPlan('pro'), true);

  // Enterprise tier
  const entConfig = getPlanConfig('enterprise');
  assert.equal(entConfig.id, 'enterprise');
  assert.equal(entConfig.monthlyTokenQuota, -1);
  assert.equal(isUnlimitedPlan('enterprise'), true);

  // Fallback on invalid/empty tier
  const fallback = getPlanConfig('unknown_plan');
  assert.equal(fallback.id, 'free');
  assert.equal(isUnlimitedPlan('unknown_plan'), false);
});

test('Quota Enforcement — Free user reaching 100,000 monthly tokens receives 403 Forbidden', async () => {
  const testUserId = `test_capped_user_${Date.now()}`;
  const period = getCurrentPeriod();

  // Simulate user having consumed 100,000 tokens
  tokenLedger.set(`${testUserId}_${period}`, 100000);

  const req = new Request('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-user-id': testUserId
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Create a simple counter' }]
    })
  });

  const res = await generateHandler(req);
  assert.equal(res.status, 403, 'Quota exceeded should return HTTP 403 Forbidden');

  const json = await res.json();
  assert.equal(json.code, 'TOKEN_QUOTA_EXCEEDED');
  assert.ok(json.error.includes('Monthly token quota'));
  assert.equal(json.usage, 100000);
  assert.equal(json.limit, 100000);
});

test('Quota Enforcement — BYOK key bypasses quota even if user is over the 100,000 token limit', async () => {
  const testUserId = `test_byok_capped_user_${Date.now()}`;
  const period = getCurrentPeriod();

  // Capped at 150k
  tokenLedger.set(`${testUserId}_${period}`, 150000);

  const req = new Request('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-user-id': testUserId
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Create a simple counter' }],
      customApiKey: 'gsk_mock_valid_key_for_byok_bypass_test'
    })
  });

  const res = await generateHandler(req);
  // Status should NOT be 403. Even if downstream provider call fails or mocks out, it bypassed the 403 quota gate.
  assert.notEqual(res.status, 403, 'BYOK requests must never be blocked with 403 token quota exceeded');
});

test('Usage Endpoint — GET /api/usage returns plan config, unlimited status, and analytics structure', async () => {
  const testUserId = `test_usage_user_${Date.now()}`;

  const req = new Request('http://localhost:3000/api/usage', {
    method: 'GET',
    headers: {
      'x-test-user-id': testUserId
    }
  });

  const res = await usageHandler(req);
  assert.equal(res.status, 200, 'Usage request should return HTTP 200');

  const json = await res.json();
  assert.equal(json.userId, testUserId);
  assert.equal(json.plan, 'free');
  assert.equal(json.isUnlimited, false);
  assert.equal(json.total, 100000);
  assert.ok(typeof json.used === 'number');
  assert.ok(json.subscription);
  assert.ok(json.analytics);
  assert.ok(Array.isArray(json.analytics.dailyTrend));
  assert.ok(typeof json.analytics.modelBreakdown === 'object');
  assert.ok(json.features);
  assert.equal(json.features.byokBypass, true);
});

test('Atomic Token Reservation — Reserves tokens and rolls back upon generation failure', async () => {
  const testUserId = `test_rollback_user_${Date.now()}`;
  const period = getCurrentPeriod();

  // Set baseline usage at 50,000
  tokenLedger.set(`${testUserId}_${period}`, 50000);

  // Reserve 4,000 tokens
  const res = await atomicReserveTokens(testUserId, period, 4000, 100000);
  assert.equal(res.allowed, true);
  assert.equal(res.currentUsed, 54000);
  assert.equal(tokenLedger.get(`${testUserId}_${period}`), 54000);

  // Simulate upstream provider failure -> rollback 4,000 tokens
  const rolledBack = await atomicRollbackTokens(testUserId, period, 4000);
  assert.equal(rolledBack, 50000);
  assert.equal(tokenLedger.get(`${testUserId}_${period}`), 50000, 'Usage must return to baseline after failure rollback');
});

test('Atomic Token Reservation — Prevents race conditions when concurrent requests hit token cap', async () => {
  const testUserId = `test_race_user_${Date.now()}`;
  const period = getCurrentPeriod();

  // User currently at 98,500 with a 100,000 cap
  tokenLedger.set(`${testUserId}_${period}`, 98500);

  // Request A reserves 1,000 tokens
  const resA = await atomicReserveTokens(testUserId, period, 1000, 100000);
  assert.equal(resA.allowed, true);
  assert.equal(resA.currentUsed, 99500);

  // Concurrent Request B immediately tries to reserve 1,000 tokens (99,500 + 1,000 > 100,000)
  const resB = await atomicReserveTokens(testUserId, period, 1000, 100000);
  assert.equal(resB.allowed, false, 'Concurrent request exceeding remaining cap must be rejected atomically');
  assert.equal(resB.reason, 'TOKEN_QUOTA_EXCEEDED');
  assert.equal(resB.currentUsed, 99500);
});

test('Generation Route — Failed upstream provider call does not deplete user token balance', async () => {
  const testUserId = `test_gen_safe_user_${Date.now()}`;
  const period = getCurrentPeriod();

  // Start with 10,000 tokens
  tokenLedger.set(`${testUserId}_${period}`, 10000);

  const req = new Request('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-user-id': testUserId
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Synthesize a large dashboard' }]
    })
  });

  // Mock upstream provider 500 failure
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(
    JSON.stringify({ error: { message: 'Provider overloaded / 500 error' } }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );

  try {
    const res = await generateHandler(req);
    assert.equal(res.status, 500, 'Upstream failure must return 500');

    // Quota must NOT have permanently increased
    const currentUsage = tokenLedger.get(`${testUserId}_${period}`) || 0;
    assert.equal(currentUsage, 10000, 'Failed generation must roll back all reserved tokens');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

