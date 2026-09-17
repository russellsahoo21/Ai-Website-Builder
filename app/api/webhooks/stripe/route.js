import crypto from 'node:crypto';
import { recordPaymentTransaction, updateUserSubscription } from '../../../../src/services/dbService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cryptographically verifies Stripe webhook signature (t=..., v1=...).
 * Enforces timestamp freshness tolerance (default: 300 seconds) to prevent replay attacks.
 */
export function verifyStripeSignature(rawBody, signatureHeader, secret, toleranceInSeconds = 300) {
  if (!rawBody || !signatureHeader || !secret) return false;
  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find(p => p.trim().startsWith('t='));
    const sigPart = parts.find(p => p.trim().startsWith('v1='));

    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.split('=')[1].trim();
    const signature = sigPart.split('=')[1].trim();

    // Replay attack defense: ensure timestamp is within tolerance window
    const timestampSec = parseInt(timestamp, 10);
    const currentSec = Math.floor(Date.now() / 1000);
    if (isNaN(timestampSec) || Math.abs(currentSec - timestampSec) > toleranceInSeconds) {
      return false;
    }

    const signedPayload = `${timestamp}.${rawBody}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (e) {
    return false;
  }
}

export async function POST(req) {
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET ||
    (process.env.NODE_ENV === 'test'
      ? process.env.TEST_STRIPE_WEBHOOK_SECRET || 'aethercraft_stripe_secret_key'
      : null);

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured.');
    return Response.json(
      { error: 'Webhook is not configured' },
      { status: 503 }
    );
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return Response.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  const isValid = verifyStripeSignature(rawBody, signature, webhookSecret);

  if (!isValid) {
    console.warn('[Stripe Webhook] Invalid signature verification attempt.');
    return Response.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  try {
    const event = JSON.parse(rawBody);
    const eventType = event.type;
    console.log(`[Stripe Webhook] Verified event: ${eventType} (${event.data?.object?.id || 'no-id'})`);

    if (eventType === 'checkout.session.completed') {
      const session = event.data?.object || {};
      const metadata = session.metadata || {};
      const userId = metadata.user_id || metadata.userId || session.client_reference_id;
      const planId = metadata.plan_id || metadata.planId || 'pro';
      const billingCycle = metadata.billing_cycle || 'monthly';

      if (userId) {
        await updateUserSubscription({
          userId,
          plan: planId,
          subscriptionStatus: 'active',
          subscriptionId: session.subscription || session.id,
          customerId: session.customer,
          billingCycle
        });

        await recordPaymentTransaction({
          id: session.id,
          userId,
          orderId: session.payment_intent || session.id,
          amount: (session.amount_total || 0) / 100,
          currency: (session.currency || 'USD').toUpperCase(),
          provider: 'stripe',
          status: 'captured',
          planId
        });

        console.log(`[Stripe Webhook] Successfully upgraded user ${userId} to plan ${planId}`);
      }
    } else if (eventType === 'customer.subscription.deleted') {
      const subscription = event.data?.object || {};
      const metadata = subscription.metadata || {};
      const userId = metadata.user_id || metadata.userId;

      if (userId) {
        await updateUserSubscription({
          userId,
          plan: 'free',
          subscriptionStatus: 'canceled'
        });
        console.log(`[Stripe Webhook] Downgraded user ${userId} to free plan`);
      }
    }

    return Response.json({ received: true, event: eventType }, { status: 200 });
  } catch (err) {
    console.error('[Stripe Webhook] Processing error:', err);
    return Response.json(
      { error: 'Error processing webhook event' },
      { status: 500 }
    );
  }
}
