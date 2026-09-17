import test from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../app/api/monitoring/route.js';
import { reportClientError, recordTelemetry } from '../src/services/monitoringService.js';

test('Monitoring API — GET /api/monitoring returns system status and provider health', async () => {
  const res = await GET();
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.ok(['healthy', 'degraded'].includes(data.status));
  assert.ok(typeof data.uptime === 'number');
  assert.ok(data.timestamp);
  assert.ok(data.providers);
  assert.ok('openrouter' in data.providers);
  assert.ok('supabase' in data.providers);
  assert.ok('clerk' in data.providers);
  assert.ok('razorpay' in data.providers);
});

test('Monitoring API — POST /api/monitoring rejects invalid payload', async () => {
  const req = new Request('http://localhost:3000/api/monitoring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const res = await POST(req);
  assert.equal(res.status, 400);

  const data = await res.json();
  assert.ok(data.error);
});

test('Monitoring API — POST /api/monitoring records valid error telemetry', async () => {
  const req = new Request('http://localhost:3000/api/monitoring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'SANDBOX_RUNTIME_ERROR',
      error: 'ReferenceError: foo is not defined',
      previewId: 'prev_test_123',
      context: { line: 12, column: 4 },
      timestamp: new Date().toISOString(),
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.receivedAt);
});

test('Monitoring Service — Deduplicates identical error reports', async () => {
  // Mock global.fetch in node test environment
  let fetchCallCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCallCount++;
    return { ok: true, json: async () => ({ success: true }) };
  };

  try {
    const errorPayload = {
      type: 'SYNTAX_ERROR',
      error: 'Unexpected token < in JSON at position 0',
      previewId: `preview_dedupe_${Date.now()}`,
    };

    const firstResult = await reportClientError(errorPayload);
    assert.equal(firstResult, true);
    assert.equal(fetchCallCount, 1);

    // Immediate second call with exact same error signature should be suppressed by deduplication
    const secondResult = await reportClientError(errorPayload);
    assert.equal(secondResult, false);
    assert.equal(fetchCallCount, 1, 'Duplicate error within window should not trigger fetch');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Monitoring Service — recordTelemetry safely records telemetry events without throwing', () => {
  assert.doesNotThrow(() => {
    recordTelemetry('PREVIEW_RENDER_TRIGGERED', { previewId: 'p_1' });
  });
});
