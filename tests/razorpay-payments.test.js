import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

import { POST as createOrderHandler } from '../app/api/payments/razorpay/create-order/route.js';
import { POST as verifyPaymentHandler, verifyPaymentSignature } from '../app/api/payments/razorpay/verify/route.js';
import { POST as razorpayWebhookHandler } from '../app/api/webhooks/razorpay/route.js';
import {
  fetchUserProfile,
  fetchPaymentTransactionById,
  memoryUserProfiles,
  memoryPaymentTransactions
} from '../src/services/dbService.js';

process.env.NODE_ENV = 'test';
process.env.RAZORPAY_KEY_ID = 'rzp_test_mock_key_123';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_for_unit_tests';
process.env.TEST_RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_for_unit_tests';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_for_unit_tests';

test('Razorpay Order Creation — Rejects unauthenticated requests with 401', async () => {
  const req = new Request('http://localhost:3000/api/payments/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId: 'pro', billingCycle: 'annual' })
  });

  const res = await createOrderHandler(req);
  assert.equal(res.status, 401, 'Unauthenticated order creation must return 401');
  const data = await res.json();
  assert.equal(data.code, 'UNAUTHORIZED');
});

test('Razorpay Order Creation — Succeeds for authenticated user and protects secret key', async () => {
  const req = new Request('http://localhost:3000/api/payments/razorpay/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-user-id': 'user_order_auth_test_1'
    },
    body: JSON.stringify({ planId: 'pro', billingCycle: 'annual' })
  });

  const res = await createOrderHandler(req);
  assert.equal(res.status, 200, 'Authenticated request must succeed');
  const data = await res.json();

  assert.ok(data.orderId, 'Response must contain orderId');
  assert.equal(data.currency, 'INR');
  assert.equal(data.keyId, process.env.RAZORPAY_KEY_ID);

  // Requirement 4: Never expose RAZORPAY_KEY_SECRET to browser code
  assert.equal(data.keySecret, undefined, 'Must not return keySecret');
  assert.equal(data.secret, undefined, 'Must not return secret');
  assert.equal(data.razorpay_key_secret, undefined, 'Must not return razorpay_key_secret');

  const jsonStr = JSON.stringify(data);
  assert.equal(jsonStr.includes('test_secret_for_unit_tests'), false, 'Response payload must never contain key secret');
});

test('Razorpay Payment Signature — Verifies authentic signature and rejects tampered data', () => {
  const secret = 'test_secret_for_unit_tests';
  const orderId = 'order_test_998811';
  const paymentId = 'pay_test_334455';

  const validSig = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Valid signature
  assert.equal(
    verifyPaymentSignature(orderId, paymentId, validSig, secret),
    true,
    'Authentic order_id|payment_id signature must verify'
  );

  // Tampered payment ID
  assert.equal(
    verifyPaymentSignature(orderId, 'pay_forged_9999', validSig, secret),
    false,
    'Tampered paymentId must fail signature check'
  );

  // Tampered signature string
  assert.equal(
    verifyPaymentSignature(orderId, paymentId, 'bad_signature_hex_1234567890abcdef', secret),
    false,
    'Tampered signature must fail signature check'
  );
});

test('Razorpay Payment Verification — Rejects invalid signatures with 400', async () => {
  const req = new Request('http://localhost:3000/api/payments/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-user-id': 'user_tamper_tester'
    },
    body: JSON.stringify({
      razorpay_order_id: 'order_123',
      razorpay_payment_id: 'pay_123',
      razorpay_signature: 'forged_tampered_signature_hex'
    })
  });

  const res = await verifyPaymentHandler(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /Invalid payment signature/i);
});

test('Razorpay Payment Verification — Authorized state does NOT upgrade user access', async () => {
  const userId = 'user_authorized_only_test';
  const orderId = 'order_auth_pending_1';
  const paymentId = 'pay_auth_pending_1';
  const secret = 'test_secret_for_unit_tests';

  // Seed user as free
  memoryUserProfiles.set(userId, { id: userId, plan: 'free' });

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const req = new Request('http://localhost:3000/api/payments/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-user-id': userId,
      'x-test-payment-status': 'authorized' // Simulated payment still in authorized state
    },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      plan_id: 'pro'
    })
  });

  const res = await verifyPaymentHandler(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'authorized');
  assert.equal(data.success, false, 'Authorized payment must not report success');

  // Verify DB profile: user must NOT be upgraded to pro
  const profile = await fetchUserProfile(userId);
  assert.equal(profile?.plan, 'free', 'User must remain on free plan while payment is in authorized state');
});

test('Razorpay Payment Verification — Captured state upgrades user access', async () => {
  const userId = 'user_capture_success_test';
  const orderId = 'order_captured_2';
  const paymentId = 'pay_captured_2';
  const secret = 'test_secret_for_unit_tests';

  memoryUserProfiles.set(userId, { id: userId, plan: 'free' });

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const req = new Request('http://localhost:3000/api/payments/razorpay/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-test-user-id': userId,
      'x-test-payment-status': 'captured'
    },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      plan_id: 'pro'
    })
  });

  const res = await verifyPaymentHandler(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.status, 'captured');

  // Verify DB profile: user upgraded to pro
  const profile = await fetchUserProfile(userId);
  assert.equal(profile?.plan, 'pro', 'User must be upgraded to pro after payment is captured');
  assert.equal(profile?.subscription_status, 'active');
});

test('Razorpay Webhook — payment.authorized does NOT upgrade user plan', async () => {
  const userId = 'user_webhook_auth_only';
  const paymentId = 'pay_webhook_auth_888';
  memoryUserProfiles.set(userId, { id: userId, plan: 'free' });

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const payload = JSON.stringify({
    event: 'payment.authorized',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          amount: 1558800,
          currency: 'INR',
          status: 'authorized',
          notes: {
            user_id: userId,
            plan_id: 'pro'
          }
        }
      }
    }
  });

  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature
    },
    body: payload
  });

  const res = await razorpayWebhookHandler(req);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'authorized');

  const profile = await fetchUserProfile(userId);
  assert.equal(profile?.plan, 'free', 'payment.authorized must not upgrade user');
});

test('Razorpay Webhook — Duplicate payment.captured events are strictly idempotent', async () => {
  const userId = 'user_idempotency_test';
  const paymentId = 'pay_idempotency_test_100';
  memoryUserProfiles.set(userId, { id: userId, plan: 'free' });

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const payload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: 'order_idemp_1',
          amount: 1558800,
          currency: 'INR',
          status: 'captured',
          notes: {
            user_id: userId,
            plan_id: 'pro'
          }
        }
      }
    }
  });

  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  // Delivery 1: Initial capture
  const req1 = new Request('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature
    },
    body: payload
  });
  const res1 = await razorpayWebhookHandler(req1);
  assert.equal(res1.status, 200);
  const json1 = await res1.json();
  assert.equal(json1.received, true);

  const profileAfter1 = await fetchUserProfile(userId);
  assert.equal(profileAfter1?.plan, 'pro');

  // Delivery 2: Duplicate webhook retry
  const req2 = new Request('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature
    },
    body: payload
  });
  const res2 = await razorpayWebhookHandler(req2);
  assert.equal(res2.status, 200);
  const json2 = await res2.json();
  assert.equal(json2.idempotent, true, 'Duplicate delivery must be recognized as idempotent');

  // Transaction record must exist and status must be captured
  const tx = await fetchPaymentTransactionById(paymentId);
  assert.equal(tx?.status, 'captured');
});

test('Razorpay Webhook — payment.failed records failure and never upgrades user', async () => {
  const userId = 'user_payment_failed_test';
  const paymentId = 'pay_failed_event_404';
  memoryUserProfiles.set(userId, { id: userId, plan: 'free' });

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const payload = JSON.stringify({
    event: 'payment.failed',
    payload: {
      payment: {
        entity: {
          id: paymentId,
          order_id: 'order_failed_1',
          amount: 1558800,
          currency: 'INR',
          status: 'failed',
          notes: {
            user_id: userId,
            plan_id: 'pro'
          }
        }
      }
    }
  });

  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  const req = new Request('http://localhost:3000/api/webhooks/razorpay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature
    },
    body: payload
  });

  const res = await razorpayWebhookHandler(req);
  assert.equal(res.status, 200);
  const json = await res.json();
  assert.equal(json.status, 'failed');

  const profile = await fetchUserProfile(userId);
  assert.equal(profile?.plan, 'free', 'payment.failed must not upgrade user');

  const tx = await fetchPaymentTransactionById(paymentId);
  assert.equal(tx?.status, 'failed', 'Transaction record must reflect failed status');
});
