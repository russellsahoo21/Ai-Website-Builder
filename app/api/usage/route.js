import { getServerAuthSession } from '../../../src/services/serverAuth.js';
import { checkRateLimit, getRateLimitHeaders } from '../../../src/services/rateLimiter.js';
import { fetchUserProfile, fetchUserTokenUsage, fetchDailyUsageAnalytics } from '../../../src/services/dbService.js';
import { getPlanConfig, isUnlimitedPlan } from '../../../src/config/plans.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_TIER_MONTHLY_TOKEN_CAP = 100000;
const PRO_TIER_MONTHLY_TOKEN_CAP = 1000000;

function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function GET(req) {
  const requestId = `usage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  try {
    // 1. Authenticate with Clerk Server-Side
    let authenticatedUserId = null;
    try {
      const session = await getServerAuthSession(req);
      authenticatedUserId = session?.userId || null;
    } catch (e) {}

    // Test bypass is strictly restricted to automated unit tests in test environment
    const testUserId = process.env.NODE_ENV === 'test'
      ? req.headers.get('x-test-user-id')
      : null;
    const effectiveUserId = authenticatedUserId || testUserId;

    if (!effectiveUserId) {
      return Response.json(
        {
          error: 'Unauthorized: Authentication required to view usage details.',
          code: 'UNAUTHORIZED',
          requestId,
        },
        {
          status: 401,
          headers: { 'X-Request-Id': requestId },
        }
      );
    }

    // 2. Rate Limit: 30 requests per minute
    const rateLimit = checkRateLimit(`usage_${effectiveUserId}`, { maxRequests: 30, windowMs: 60000 });
    const rateLimitHeaders = getRateLimitHeaders(rateLimit);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: 'Rate limit exceeded for usage requests.',
          code: 'RATE_LIMIT_EXCEEDED',
          requestId,
        },
        {
          status: 429,
          headers: {
            'X-Request-Id': requestId,
            ...rateLimitHeaders,
          },
        }
      );
    }

    // 3. Query Plan & Usage from Supabase PostgreSQL
    const currentPeriod = getCurrentPeriod();
    let plan = 'free';
    let profile = null;
    let dataSyncStatus = 'synced';
    const dbSyncErrors = [];

    try {
      profile = await fetchUserProfile(effectiveUserId);
      if (profile?.plan) {
        plan = profile.plan;
      }
    } catch (err) {
      dataSyncStatus = 'degraded';
      dbSyncErrors.push('profile_fetch_failed');
      console.warn(`[Usage API] Database profile query failed for user ${effectiveUserId}:`, err?.message || err);
    }

    const planConfig = getPlanConfig(plan);
    const hasUnlimited = isUnlimitedPlan(plan);
    const tokenCap = hasUnlimited ? -1 : (planConfig.monthlyTokenQuota || FREE_TIER_MONTHLY_TOKEN_CAP);
    let tokensUsed = 0;

    try {
      const usageRow = await fetchUserTokenUsage(effectiveUserId, currentPeriod);
      if (usageRow && typeof usageRow.tokens_used !== 'undefined') {
        tokensUsed = Number(usageRow.tokens_used);
      }
    } catch (err) {
      dataSyncStatus = 'degraded';
      dbSyncErrors.push('token_usage_fetch_failed');
      console.warn(`[Usage API] Database token usage query failed for user ${effectiveUserId}:`, err?.message || err);
    }

    const remaining = hasUnlimited ? 'Unlimited' : Math.max(0, tokenCap - tokensUsed);
    const percent = hasUnlimited ? 0 : Math.min(100, Math.round((tokensUsed / (tokenCap || 1)) * 100));

    // Fetch 7-day daily usage analytics
    let analytics = { dailyTrend: [], modelBreakdown: {} };
    try {
      analytics = await fetchDailyUsageAnalytics(effectiveUserId, 7);
    } catch (e) {}

    return Response.json(
      {
        userId: effectiveUserId,
        plan,
        planName: planConfig.name,
        isUnlimited: hasUnlimited,
        tier: plan === 'enterprise' ? 'studio_unlimited' : plan === 'pro' ? 'developer_pro' : 'developer_free',
        total: tokenCap,
        used: tokensUsed,
        remaining,
        percent,
        period: currentPeriod,
        dataSyncStatus,
        ...(dbSyncErrors.length > 0 ? { warning: 'Database temporarily unavailable. Showing fallback state.', syncErrors: dbSyncErrors } : {}),
        unrestrictedModels: true,
        subscription: {
          status: profile?.subscription_status || 'inactive',
          subscriptionId: profile?.subscription_id || null,
          billingCycle: profile?.billing_cycle || 'monthly',
          currentPeriodEnd: profile?.current_period_end || null
        },
        analytics,
        features: {
          tokenCap,
          isUnlimited: hasUnlimited,
          modelFreedom: true,
          byokBypass: true,
          projectQuota: profile?.project_quota || planConfig.maxProjects,
          priorityQueue: planConfig.priorityQueue,
          teamSeats: planConfig.teamSeats
        },
        requestId,
      },
      {
        headers: {
          'X-Request-Id': requestId,
          ...rateLimitHeaders,
        },
      }
    );
  } catch (err) {
    console.error(`[USAGE_ERROR] [${requestId}]`, err);
    return Response.json(
      { error: err.message || 'Failed to fetch usage metrics', code: 'USAGE_ERROR', requestId },
      {
        status: 500,
        headers: { 'X-Request-Id': requestId },
      }
    );
  }
}
