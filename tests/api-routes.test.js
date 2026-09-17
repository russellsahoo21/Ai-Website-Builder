import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { POST } from '../app/api/generate/route.js';
import { GET } from '../app/api/usage/route.js';
import { resetRateLimit } from '../src/services/rateLimiter.js';

test('API Route Auth — POST /api/generate rejects unauthenticated requests with 401', async () => {
  const req = new Request('http://localhost:3000/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // No Clerk auth session cookie or mock header
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Create a button' }],
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 401, 'Unauthenticated request must return HTTP 401');

  const json = await res.json();
  assert.equal(json.code, 'UNAUTHORIZED');
  assert.ok(json.requestId, 'Response should contain requestId');
  assert.ok(res.headers.get('X-Request-Id'), 'Response header must have X-Request-Id');
});

test('API Route Auth — GET /api/usage rejects unauthenticated requests with 401', async () => {
  const req = new Request('http://localhost:3000/api/usage', {
    method: 'GET',
    headers: {},
  });

  const res = await GET(req);
  assert.equal(res.status, 401, 'Unauthenticated request must return HTTP 401');

  const json = await res.json();
  assert.equal(json.code, 'UNAUTHORIZED');
  assert.ok(json.requestId, 'Response should contain requestId');
});

test('API Route Rate Limiting — Rapid requests trigger 429 with standard headers', async () => {
  const testUserId = `test_rate_user_${Date.now()}`;
  resetRateLimit(testUserId);

  let lastRes = null;
  // Trigger 11 requests when limit is 10
  for (let i = 0; i < 11; i++) {
    const req = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-user-id': testUserId,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test ping' }],
        customApiKey: 'gsk_mock_test_key_12345678',
      }),
    });
    lastRes = await POST(req);
  }

  assert.equal(lastRes.status, 429, '11th request must return HTTP 429 Too Many Requests');
  const json = await lastRes.json();
  assert.equal(json.code, 'RATE_LIMIT_EXCEEDED');
  assert.ok(lastRes.headers.get('Retry-After'), 'Must include Retry-After header');
  assert.equal(lastRes.headers.get('X-RateLimit-Remaining'), '0');
});

test('API Route Security — Production environment rejects x-test-user-id bypass attempts with 401', async () => {
  const originalEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';

    // 1. Generate route
    const genReq = new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-user-id': 'victim_user_123',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Infiltrate' }],
      }),
    });
    const genRes = await POST(genReq);
    assert.equal(genRes.status, 401, 'x-test-user-id must NOT bypass authentication in production');
    const genJson = await genRes.json();
    assert.equal(genJson.code, 'UNAUTHORIZED');

    // 2. Usage route
    const usageReq = new Request('http://localhost:3000/api/usage', {
      method: 'GET',
      headers: {
        'x-test-user-id': 'victim_user_123',
      },
    });
    const usageRes = await GET(usageReq);
    assert.equal(usageRes.status, 401, 'x-test-user-id must NOT bypass usage endpoint in production');
    const usageJson = await usageRes.json();
    assert.equal(usageJson.code, 'UNAUTHORIZED');
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
});
