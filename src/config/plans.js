/**
 * plans.js
 * Single source of truth for AetherCraft subscription plans, quotas, and pricing.
 * Used universally across Next.js server routes and client React components.
 */

export const PLANS = {
  free: {
    id: 'free',
    name: 'Developer Free',
    badge: 'Free Tier',
    tagline: 'For prototyping and personal applications.',
    monthlyPriceUSD: 0,
    annualPriceUSD: 0,
    monthlyPriceINR: 0,
    annualPriceINR: 0,
    maxProjects: 5,
    monthlyTokenQuota: 100000,
    priorityQueue: false,
    frontierModels: false,
    teamSeats: 1,
    features: [
      '5 active projects',
      '100,000 monthly AI tokens',
      'BYOK support for unlimited generations',
      'In-memory sandbox preview',
      '1-Click production ZIP export',
      'Community Discord support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro Founder',
    badge: 'Pro Tier',
    tagline: 'For indie makers shipping commercial products.',
    monthlyPriceUSD: 20,
    annualPriceUSD: 16, // $192/year (20% off)
    monthlyPriceINR: 1599,
    annualPriceINR: 1299, // ₹15,588/year (20% off)
    maxProjects: 50,
    monthlyTokenQuota: -1, // -1 represents Unlimited tokens
    priorityQueue: true,
    frontierModels: true,
    teamSeats: 1,
    features: [
      'Up to 50 active projects',
      'Unlimited monthly AI tokens',
      '2x priority synthesis queue',
      'All frontier models unlocked',
      'Custom domain publishing with auto-SSL',
      'Multi-turn architectural memory',
      'Priority email & Discord support'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Studio Unlimited',
    badge: 'Unlimited Team',
    tagline: 'For agencies, studios, and high-velocity engineering teams.',
    monthlyPriceUSD: 49,
    annualPriceUSD: 40, // $480/year (20% off)
    monthlyPriceINR: 3999,
    annualPriceINR: 3199, // ₹38,388/year (20% off)
    maxProjects: Infinity,
    monthlyTokenQuota: -1, // Unlimited
    priorityQueue: true,
    frontierModels: true,
    teamSeats: 5,
    features: [
      'Unlimited active projects (No caps)',
      'Unlimited tokens with zero throttling',
      '5 team member seats & shared workspaces',
      'White-label export & custom branding',
      'Shared custom API keys pool',
      'Dedicated account manager & SLA'
    ]
  }
};

/**
 * Returns plan details with safe fallback to free plan.
 */
export function getPlanConfig(planId = 'free') {
  const normalized = (planId || 'free').toLowerCase();
  return PLANS[normalized] || PLANS.free;
}

/**
 * Checks if a given plan has unlimited tokens.
 */
export function isUnlimitedPlan(planId = 'free') {
  const config = getPlanConfig(planId);
  return config.monthlyTokenQuota === -1 || config.monthlyTokenQuota === Infinity;
}
