import { getServerAuthSession } from '../../../../../src/services/serverAuth.js';
import { PLANS } from '../../../../../src/config/plans.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getEffectiveUserId(req, clientUserId = null) {
  let authenticatedUserId = null;
  try {
    const session = getServerAuthSession(req);
    authenticatedUserId = session?.userId || null;
  } catch (e) {}

  if (authenticatedUserId) return authenticatedUserId;

  if (process.env.NODE_ENV === 'test') {
    return req.headers.get('x-test-user-id') || clientUserId || null;
  }

  if (process.env.NODE_ENV === 'development' && clientUserId) {
    return clientUserId;
  }

  return null;
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { planId = 'pro', billingCycle = 'annual', currency = 'INR', couponCode, userId: clientUserId } = body;

  const userId = getEffectiveUserId(req, clientUserId);
  if (!userId) {
    return Response.json(
      { error: 'Unauthorized: You must be logged in to initiate checkout.', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return Response.json(
      { error: 'Payment gateway credentials are not configured on the server.' },
      { status: 503 }
    );
  }

  try {
    const plan = PLANS[planId] || PLANS.pro;
    const isAnnual = billingCycle === 'annual';

    let unitPrice = currency === 'INR'
      ? (isAnnual ? plan.annualPriceINR : plan.monthlyPriceINR)
      : (isAnnual ? plan.annualPriceUSD : plan.monthlyPriceUSD);

    let totalDue = unitPrice * (isAnnual ? 12 : 1);

    // Apply promo discount if provided
    if (couponCode && typeof couponCode === 'string' && couponCode.toUpperCase().trim() === 'LAUNCH20') {
      totalDue = Math.round(totalDue * 0.8);
    }

    const amountInSubunits = Math.round(totalDue * 100);

    // Generate deterministic/mock response if running under unit tests with dummy credentials
    if (process.env.NODE_ENV === 'test' && keySecret === 'test_secret_for_unit_tests') {
      const mockOrderId = `order_test_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
      return Response.json({
        orderId: mockOrderId,
        amount: amountInSubunits,
        currency: currency === 'INR' ? 'INR' : 'USD',
        keyId,
        notes: {
          user_id: userId,
          plan_id: plan.id,
          billing_cycle: billingCycle
        }
      });
    }

    const orderPayload = {
      amount: amountInSubunits,
      currency: currency === 'INR' ? 'INR' : 'USD',
      receipt: `rcpt_${userId.slice(0, 10)}_${Date.now().toString().slice(-6)}`,
      notes: {
        user_id: userId,
        plan_id: plan.id,
        billing_cycle: billingCycle
      }
    };

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(orderPayload)
    });

    if (!rzpRes.ok) {
      const errorData = await rzpRes.json().catch(() => ({}));
      console.error('[Razorpay Order Creation Failed]', errorData);
      return Response.json(
        { error: errorData.error?.description || 'Failed to create payment order with Razorpay.' },
        { status: 502 }
      );
    }

    const order = await rzpRes.json();

    // STRICT: Return only client-safe fields. NEVER expose keySecret.
    return Response.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      notes: order.notes
    });
  } catch (err) {
    console.error('[Razorpay Order Creation Exception]', err);
    return Response.json(
      { error: 'An unexpected error occurred while setting up your payment.' },
      { status: 500 }
    );
  }
}
