import crypto from 'node:crypto';
import {
  fetchPaymentTransactionById,
  recordPaymentTransaction,
  updateUserSubscription
} from '../../../../src/services/dbService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Verifies Razorpay HMAC-SHA256 webhook signature.
 * Uses timing-safe string comparison to protect against timing attacks.
 */
export function verifyRazorpaySignature(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch (e) {
    return false;
  }
}

export async function POST(req) {
  const webhookSecret =
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    (process.env.NODE_ENV === 'test'
      ? process.env.TEST_RAZORPAY_WEBHOOK_SECRET || 'aethercraft_rzp_secret_key'
      : null);

  if (!webhookSecret) {
    console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured.');
    return Response.json(
      { error: 'Webhook is not configured' },
      { status: 503 }
    );
  }

  const signature = req.headers.get('x-razorpay-signature');

  if (!signature) {
    return Response.json(
      { error: 'Missing x-razorpay-signature header' },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  const isValid = verifyRazorpaySignature(rawBody, signature, webhookSecret);

  if (!isValid) {
    console.warn('[Razorpay Webhook] Invalid signature verification attempt.');
    return Response.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  try {
    const event = JSON.parse(rawBody);
    const eventType = event.event;
    console.log(`[Razorpay Webhook] Verified event: ${eventType} (${event.payload?.payment?.entity?.id || 'no-id'})`);

    const payment = event.payload?.payment?.entity || {};
    const notes = payment.notes || {};
    const userId = notes.user_id || notes.userId;
    const planId = notes.plan_id || notes.planId || 'pro';
    const billingCycle = notes.billing_cycle || 'monthly';

    // 1. payment.authorized: Request server-side capture, NEVER upgrade user yet
    if (eventType === 'payment.authorized') {
      console.log(`[Razorpay Webhook] Payment ${payment.id} is authorized. Requesting capture...`);
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (keyId && keySecret && payment.id && process.env.NODE_ENV !== 'test') {
        try {
          const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
          await fetch(`https://api.razorpay.com/v1/payments/${payment.id}/capture`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
            },
            body: JSON.stringify({
              amount: payment.amount,
              currency: payment.currency || 'INR'
            })
          });
          console.log(`[Razorpay Webhook] Server-side capture requested for ${payment.id}`);
        } catch (err) {
          console.error('[Razorpay Webhook] Error triggering payment capture:', err);
        }
      }

      // DO NOT upgrade user on authorized.
      return Response.json(
        { received: true, event: eventType, status: 'authorized', message: 'Capture requested; access pending capture confirmation' },
        { status: 200 }
      );
    }

    // 2. payment.captured & order.paid: Upgrade user with strict idempotency
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (userId) {
        // Idempotency: Check if transaction has already been captured
        const existingTx = await fetchPaymentTransactionById(payment.id);
        if (existingTx && existingTx.status === 'captured') {
          console.log(`[Razorpay Webhook] Idempotent duplicate: payment ${payment.id} already processed.`);
          return Response.json(
            { received: true, event: eventType, idempotent: true },
            { status: 200 }
          );
        }

        // 1. Upgrade subscription in database
        await updateUserSubscription({
          userId,
          plan: planId,
          subscriptionStatus: 'active',
          subscriptionId: payment.id,
          billingCycle
        });

        // 2. Record audit receipt
        await recordPaymentTransaction({
          id: payment.id,
          userId,
          orderId: payment.order_id,
          amount: (payment.amount || 0) / 100,
          currency: payment.currency || 'INR',
          provider: 'razorpay',
          status: 'captured',
          planId
        });

        console.log(`[Razorpay Webhook] Successfully upgraded user ${userId} to plan ${planId}`);
      } else {
        console.warn('[Razorpay Webhook] Notice: payment captured but missing user_id in notes. Notes received:', JSON.stringify(notes));
      }

      return Response.json({ received: true, event: eventType }, { status: 200 });
    }

    // 3. payment.failed: Log failure, record audit, NEVER upgrade user
    if (eventType === 'payment.failed') {
      console.warn(`[Razorpay Webhook] Payment failed: ${payment.id} for user ${userId || 'unknown'}`);
      if (userId && payment.id) {
        await recordPaymentTransaction({
          id: payment.id,
          userId,
          orderId: payment.order_id,
          amount: (payment.amount || 0) / 100,
          currency: payment.currency || 'INR',
          provider: 'razorpay',
          status: 'failed',
          planId
        });
      }
      return Response.json({ received: true, event: eventType, status: 'failed' }, { status: 200 });
    }

    // 4. subscription.cancelled: Downgrade to free
    if (eventType === 'subscription.cancelled') {
      const subscription = event.payload?.subscription?.entity || {};
      const subNotes = subscription.notes || {};
      const subUserId = subNotes.user_id || subNotes.userId;

      if (subUserId) {
        await updateUserSubscription({
          userId: subUserId,
          plan: 'free',
          subscriptionStatus: 'canceled'
        });
        console.log(`[Razorpay Webhook] Downgraded user ${subUserId} to free plan (subscription canceled)`);
      }
      return Response.json({ received: true, event: eventType }, { status: 200 });
    }

    return Response.json({ received: true, event: eventType }, { status: 200 });
  } catch (err) {
    console.error('[Razorpay Webhook] Processing error:', err);
    return Response.json(
      { error: 'Error processing webhook event' },
      { status: 500 }
    );
  }
}
