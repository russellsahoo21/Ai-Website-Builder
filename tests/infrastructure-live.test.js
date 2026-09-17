import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Load .env credentials if available
if (fs.existsSync('.env') && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile('.env');
}

test('Infrastructure Live — OpenRouter credentials and API connectivity', async () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  assert.ok(apiKey, 'OPENROUTER_API_KEY must be defined in environment');
  assert.ok(apiKey.startsWith('sk-or-'), 'OPENROUTER_API_KEY should have sk-or- prefix');

  const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  assert.equal(
    res.status,
    200,
    `OpenRouter auth key check failed with status ${res.status}`
  );

  const data = await res.json();
  assert.ok(data?.data, 'OpenRouter should return key metadata object');
  assert.ok(
    typeof data.data.usage !== 'undefined' || typeof data.data.limit !== 'undefined',
    'OpenRouter metadata includes usage or limit attributes'
  );
});

test('Infrastructure Live — Supabase cloud project connectivity', async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL must be defined');
  assert.ok(serviceKey, 'Supabase key must be defined');
  assert.ok(supabaseUrl.startsWith('https://'), 'Supabase URL must be HTTPS');

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Test connectivity by querying profiles table
  const { data, error, status } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  // Status should be 200 (or if table empty, data is array)
  assert.ok(
    status === 200 || !error,
    `Supabase connectivity check failed: ${error?.message || status}`
  );
  assert.ok(Array.isArray(data), 'Supabase query returns array of records');
});

test('Infrastructure Live — Clerk authentication API credentials', async () => {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  assert.ok(publishableKey, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must be defined');
  assert.ok(secretKey, 'CLERK_SECRET_KEY must be defined');
  assert.ok(
    publishableKey.startsWith('pk_test_') || publishableKey.startsWith('pk_live_'),
    'Clerk publishable key has valid prefix'
  );
  assert.ok(
    secretKey.startsWith('sk_test_') || secretKey.startsWith('sk_live_'),
    'Clerk secret key has valid prefix'
  );

  const res = await fetch('https://api.clerk.com/v1/users?limit=1', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  assert.equal(
    res.status,
    200,
    `Clerk backend auth check failed with status ${res.status}`
  );

  const users = await res.json();
  assert.ok(Array.isArray(users), 'Clerk users endpoint returns list of users');
});

test('Infrastructure Live — Razorpay payment gateway credentials', async () => {
  const keyId =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  assert.ok(keyId, 'Razorpay Key ID must be defined');
  assert.ok(keySecret, 'RAZORPAY_KEY_SECRET must be defined');
  assert.ok(
    keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_'),
    'Razorpay Key ID has valid prefix'
  );

  // Validate Razorpay credentials against official orders endpoint
  const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
  const res = await fetch('https://api.razorpay.com/v1/orders?count=1', {
    method: 'GET',
    headers: {
      Authorization: authHeader,
    },
  });

  assert.equal(
    res.status,
    200,
    `Razorpay credentials check failed with status ${res.status}`
  );

  const data = await res.json();
  assert.ok(data?.entity === 'collection', 'Razorpay returns order collection entity');
  assert.ok(Array.isArray(data.items), 'Razorpay collection includes items array');
});
