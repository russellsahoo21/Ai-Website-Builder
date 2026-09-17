import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { verifyRazorpaySignature, POST as razorpayWebhookHandler } from '../app/api/webhooks/razorpay/route.js';
import { verifyStripeSignature, POST as stripeWebhookHandler } from '../app/api/webhooks/stripe/route.js';

process.env.NODE_ENV = 'test';

test('Razorpay Webhook — HMAC-SHA256 signature validation succeeds with authentic secret', () => {
  const secret = 'rzp_test_secret_key_12345';
  const payload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_998877',
          amount: 159900,
          currency: 'INR',
          notes: {
            user_id: 'user_rzp_valid',
            plan_id: 'pro',
            billing_cycle: 'monthly'
          }
        }
      }
    }
  });

  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const result = verifyRazorpaySignature(payload, validSignature, secret);
  assert.equal(result, true, 'Valid HMAC signature must verify successfully');
});

test('Razorpay Webhook — Rejects tampered payloads or invalid signatures', () => {
  const secret = 'rzp_test_secret_key_12345';
  const payload = JSON.stringify({ event: 'order.paid' });
  const forgedSignature = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  const result = verifyRazorpaySignature(payload, forgedSignature, secret);
  assert.equal(result, false, 'Forged signature must be rejected');

  const emptyResult = verifyRazorpaySignature('', '', secret);
  assert.equal(emptyResult, false, 'Empty payload/signature must be rejected');
});

test('Razorpay Webhook Route — POST returns 400 when signature header is missing or invalid', async () => {
  // 1. Missing header
  const reqNoSig = new Request('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'payment.captured' })
  });
  const resNoSig = await razorpayWebhookHandler(reqNoSig);
  assert.equal(resNoSig.status, 400);
  const jsonNoSig = await resNoSig.json();
  assert.match(jsonNoSig.error, /Missing x-razorpay-signature/i);

  // 2. Invalid signature
  const reqBadSig = new Request('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': 'invalid_signature_hex_code_12345678'
    },
    body: JSON.stringify({ event: 'payment.captured' })
  });
  const resBadSig = await razorpayWebhookHandler(reqBadSig);
  assert.equal(resBadSig.status, 400);
  const jsonBadSig = await resBadSig.json();
  assert.match(jsonBadSig.error, /Invalid webhook signature/i);
});

test('Razorpay Webhook Route — Successfully processes authenticated payment.captured event', async () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.TEST_RAZORPAY_WEBHOOK_SECRET || 'aethercraft_rzp_secret_key';
  const bodyObj = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_capture_integration_123',
          amount: 159900,
          currency: 'INR',
          order_id: 'order_test_456',
          notes: {
            user_id: 'user_subscriber_rzp',
            plan_id: 'pro',
            billing_cycle: 'monthly'
          }
        }
      }
    }
  };
  const rawBody = JSON.stringify(bodyObj);
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validSignature
    },
    body: rawBody
  });

  const res = await razorpayWebhookHandler(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.received, true);
  assert.equal(json.event, 'payment.captured');
});

test('Stripe Webhook — Cryptographic signature validation succeeds with timestamp and v1 signature', () => {
  const secret = 'whsec_stripe_test_secret_789';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const rawBody = JSON.stringify({ type: 'checkout.session.completed' });

  const signedPayload = `${timestamp}.${rawBody}`;
  const v1Signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const signatureHeader = `t=${timestamp},v1=${v1Signature}`;

  const result = verifyStripeSignature(rawBody, signatureHeader, secret);
  assert.equal(result, true, 'Authentic Stripe signature must verify');
});

test('Stripe Webhook — Rejects malformed or tampered Stripe headers', () => {
  const secret = 'whsec_stripe_test_secret_789';
  const rawBody = JSON.stringify({ type: 'checkout.session.completed' });

  // Tampered signature
  const badHeader = `t=12345678,v1=wrong_hex_code_1234567890abcdef1234567890abcdef`;
  const result = verifyStripeSignature(rawBody, badHeader, secret);
  assert.equal(result, false, 'Tampered Stripe signature must be rejected');

  // Missing parts
  assert.equal(verifyStripeSignature(rawBody, 'invalid-header-string', secret), false);
  assert.equal(verifyStripeSignature(rawBody, '', secret), false);
});

test('Stripe Webhook Route — POST returns 400 when stripe-signature header is missing or forged', async () => {
  const reqNoSig = new Request('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'checkout.session.completed' })
  });

  const resNoSig = await stripeWebhookHandler(reqNoSig);
  assert.equal(resNoSig.status, 400);
  const jsonNoSig = await resNoSig.json();
  assert.match(jsonNoSig.error, /Missing stripe-signature/i);
});

test('Stripe Webhook Route — Successfully handles checkout.session.completed event', async () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || process.env.TEST_STRIPE_WEBHOOK_SECRET || 'aethercraft_stripe_secret_key';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const bodyObj = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_session_stripe_999',
        subscription: 'sub_test_stripe_888',
        customer: 'cus_test_stripe_777',
        amount_total: 2000,
        currency: 'usd',
        metadata: {
          user_id: 'user_stripe_buyer_1',
          plan_id: 'pro',
          billing_cycle: 'monthly'
        }
      }
    }
  };

  const rawBody = JSON.stringify(bodyObj);
  const signedPayload = `${timestamp}.${rawBody}`;
  const v1Signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const req = new Request('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': `t=${timestamp},v1=${v1Signature}`
    },
    body: rawBody
  });

  const res = await stripeWebhookHandler(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.received, true);
  assert.equal(json.event, 'checkout.session.completed');
});

test('Stripe Webhook — Rejects expired timestamp to prevent replay attacks', () => {
  const secret = 'whsec_stripe_test_secret_789';
  // Timestamp 10 minutes (600s) in the past
  const staleTimestamp = (Math.floor(Date.now() / 1000) - 600).toString();
  const rawBody = JSON.stringify({ type: 'checkout.session.completed' });

  const signedPayload = `${staleTimestamp}.${rawBody}`;
  const v1Signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const signatureHeader = `t=${staleTimestamp},v1=${v1Signature}`;

  // Default tolerance is 300s, so 600s must be rejected
  const result = verifyStripeSignature(rawBody, signatureHeader, secret, 300);
  assert.equal(result, false, 'Stale timestamp must be rejected to prevent replay attacks');
});

test('Webhook Routes — Fail closed with HTTP 503 if secrets are not configured in production', async () => {
  const originalEnv = process.env.NODE_ENV;
  const originalRzp = process.env.RAZORPAY_WEBHOOK_SECRET;
  const originalStripe = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    // Razorpay route without secret
    const rzpReq = new Request('http://localhost:3000/api/webhooks/razorpay', {
      method: 'POST',
      headers: { 'x-razorpay-signature': 'sig' },
      body: '{}'
    });
    const rzpRes = await razorpayWebhookHandler(rzpReq);
    assert.equal(rzpRes.status, 503, 'Missing secret must fail closed with 503 in production');

    // Stripe route without secret
    const stripeReq = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig' },
      body: '{}'
    });
    const stripeRes = await stripeWebhookHandler(stripeReq);
    assert.equal(stripeRes.status, 503, 'Missing secret must fail closed with 503 in production');
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalRzp) process.env.RAZORPAY_WEBHOOK_SECRET = originalRzp;
    if (originalStripe) process.env.STRIPE_WEBHOOK_SECRET = originalStripe;
  }
});

