/**
 * tokenService.js
 * Token Quota & Consumption Tracker
 * Tracks monthly token consumption (100,000 Free Tier cap per individual user).
 * Provides quota verification, client telemetry, and local cache with server sync.
 */

import { estimateTokens } from '../utils/tokenOptimizer.js';

export { estimateTokens };
export const FREE_TIER_MONTHLY_TOKEN_CAP = 100000;

let currentUserId = null;

export function setCurrentUserId(userId) {
  currentUserId = userId || null;
}

export function getCurrentUserId() {
  return currentUserId;
}

/**
 * Returns the current billing period string: "YYYY-MM"
 */
export function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getStorageKeys(userId) {
  const effectiveUser = userId || currentUserId || 'guest';
  const period = getCurrentPeriod();
  return {
    effectiveUser,
    period,
    usageKey: `aethercraft_token_usage_${effectiveUser}_${period}`,
    periodKey: `aethercraft_token_period_${effectiveUser}`,
  };
}

/**
 * Retrieves the current user's token usage.
 * Isolated per individual authenticated user (100,000 monthly credits each).
 * Automatically resets when entering a new calendar month.
 * @param {string} [userId] - Optional user ID (e.g. Clerk user ID)
 * @returns {{ used: number, total: number, remaining: number, percent: number, period: string, userId: string }}
 */
export function getTokenUsage(userId = currentUserId) {
  if (typeof window === 'undefined') {
    return {
      used: 0,
      total: FREE_TIER_MONTHLY_TOKEN_CAP,
      remaining: FREE_TIER_MONTHLY_TOKEN_CAP,
      percent: 0,
      period: getCurrentPeriod(),
      userId: userId || 'guest',
    };
  }

  const { effectiveUser, period, usageKey, periodKey } = getStorageKeys(userId);

  // Clear legacy global un-scoped runaway count so it never contaminates any user
  if (localStorage.getItem('aethercraft_monthly_token_usage')) {
    localStorage.removeItem('aethercraft_monthly_token_usage');
  }

  const storedPeriod = localStorage.getItem(periodKey);

  // New month: reset counter for this user
  if (storedPeriod !== period) {
    localStorage.setItem(periodKey, period);
    localStorage.setItem(usageKey, '0');
  }

  const raw = localStorage.getItem(usageKey);
  let used = parseInt(raw || '0', 10);
  if (isNaN(used) || used < 0) used = 0;

  const total = FREE_TIER_MONTHLY_TOKEN_CAP;
  const remaining = Math.max(0, total - used);
  const percent = Math.min(100, Math.round((used / total) * 100));

  return {
    used,
    total,
    remaining,
    percent,
    period,
    userId: effectiveUser,
  };
}

/**
 * Resets or recalibrates the user's monthly token usage.
 */
export function resetTokenUsage(amount = 0, userId = currentUserId) {
  if (typeof window === 'undefined') return;
  const { usageKey, periodKey, period, effectiveUser } = getStorageKeys(userId);
  localStorage.setItem(periodKey, period);
  localStorage.setItem(usageKey, String(Math.max(0, amount)));
  const usage = getTokenUsage(effectiveUser);
  try {
    window.dispatchEvent(new CustomEvent('tokenUsageUpdated', { detail: usage }));
  } catch (e) {}
  return usage;
}

/**
 * Records tokens used after a synthesis operation.
 * Dispatches a custom event 'tokenUsageUpdated' so UI components refresh instantly.
 * @param {number} tokens - Number of tokens consumed
 * @param {Object} [metadata] - Optional usage details (isEstimated, rawProviderUsage)
 * @param {string} [userId] - Optional user ID
 * @returns {{ used: number, total: number, remaining: number, percent: number, userId: string }}
 */
export function recordTokenUsage(tokens = 0, metadata = {}, userId = currentUserId) {
  if (typeof window === 'undefined' || !tokens) return getTokenUsage(userId);

  const current = getTokenUsage(userId);
  const updatedUsed = current.used + Math.max(0, tokens);
  const { usageKey, effectiveUser } = getStorageKeys(userId);

  localStorage.setItem(usageKey, String(updatedUsed));
  if (metadata?.rawProviderUsage) {
    try {
      localStorage.setItem(`aethercraft_last_raw_usage_${effectiveUser}`, JSON.stringify(metadata.rawProviderUsage));
    } catch (e) {}
  }

  const updated = {
    used: updatedUsed,
    total: current.total,
    remaining: Math.max(0, current.total - updatedUsed),
    percent: Math.min(100, Math.round((updatedUsed / current.total) * 100)),
    period: current.period,
    userId: effectiveUser,
    lastTurn: {
      tokens,
      isEstimated: Boolean(metadata.isEstimated),
      rawProviderUsage: metadata.rawProviderUsage || null,
    },
  };

  try {
    window.dispatchEvent(new CustomEvent('tokenUsageUpdated', { detail: updated }));
  } catch (e) {}

  return updated;
}

/**
 * Checks if the user has sufficient quota for an upcoming generation.
 * @param {number} estimatedTokens
 * @param {boolean} isByok - If user provides their own API key, quota is bypassed
 * @param {string} [userId] - Optional user ID
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function verifyTokenQuota(estimatedTokens = 1000, isByok = false, userId = currentUserId) {
  if (isByok) {
    return { allowed: true, quotaBypassed: true };
  }

  const usage = getTokenUsage(userId);
  if (usage.used >= usage.total) {
    return {
      allowed: false,
      reason: `Monthly token limit of ${FREE_TIER_MONTHLY_TOKEN_CAP.toLocaleString()} reached. Please upgrade or provide your own API key in Settings.`,
    };
  }

  return { allowed: true, quotaBypassed: false };
}
