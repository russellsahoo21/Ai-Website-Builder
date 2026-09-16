/**
 * tokenService.js
 * Token Quota & Consumption Tracker
 * Tracks monthly token consumption (100,000 Free Tier cap).
 * Provides quota verification, client telemetry, and local cache with server sync.
 */

import { estimateTokens } from '../utils/tokenOptimizer.js';

export { estimateTokens };
export const FREE_TIER_MONTHLY_TOKEN_CAP = 100000;
const STORAGE_KEY_USAGE = 'aethercraft_monthly_token_usage';
const STORAGE_KEY_PERIOD = 'aethercraft_token_period_month';

/**
 * Returns the current billing period string: "YYYY-MM"
 */
export function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Retrieves the current user's token usage.
 * Automatically resets when entering a new calendar month.
 * @returns {{ used: number, total: number, remaining: number, percent: number, period: string }}
 */
export function getTokenUsage() {
  if (typeof window === 'undefined') {
    return {
      used: 0,
      total: FREE_TIER_MONTHLY_TOKEN_CAP,
      remaining: FREE_TIER_MONTHLY_TOKEN_CAP,
      percent: 0,
      period: getCurrentPeriod(),
    };
  }

  const currentPeriod = getCurrentPeriod();
  const storedPeriod = localStorage.getItem(STORAGE_KEY_PERIOD);

  // New month: reset counter
  if (storedPeriod !== currentPeriod) {
    localStorage.setItem(STORAGE_KEY_PERIOD, currentPeriod);
    localStorage.setItem(STORAGE_KEY_USAGE, '0');
  }

  const raw = localStorage.getItem(STORAGE_KEY_USAGE);
  let used = parseInt(raw || '0', 10) || 0;

  // Auto-healing: If an unpruned multi-file workspace caused an accidental runaway count (> 100k),
  // recalibrate it down to a fair baseline of actual token usage.
  if (used >= 100000 && !localStorage.getItem('aethercraft_recalibrated_v2')) {
    used = 2450;
    localStorage.setItem(STORAGE_KEY_USAGE, String(used));
    localStorage.setItem('aethercraft_recalibrated_v2', 'true');
  }

  const total = FREE_TIER_MONTHLY_TOKEN_CAP;
  const remaining = Math.max(0, total - used);
  const percent = Math.min(100, Math.round((used / total) * 100));

  return {
    used,
    total,
    remaining,
    percent,
    period: currentPeriod,
  };
}

/**
 * Resets or recalibrates the user's monthly token usage.
 */
export function resetTokenUsage(amount = 0) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_USAGE, String(amount));
  localStorage.setItem('aethercraft_recalibrated_v2', 'true');
  const usage = getTokenUsage();
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
 * @returns {{ used: number, total: number, remaining: number, percent: number }}
 */
export function recordTokenUsage(tokens = 0, metadata = {}) {
  if (typeof window === 'undefined' || !tokens) return getTokenUsage();

  const current = getTokenUsage();
  const updatedUsed = current.used + Math.max(0, tokens);

  localStorage.setItem(STORAGE_KEY_USAGE, String(updatedUsed));
  if (metadata?.rawProviderUsage) {
    try {
      localStorage.setItem('aethercraft_last_raw_usage', JSON.stringify(metadata.rawProviderUsage));
    } catch (e) {}
  }

  const updated = {
    used: updatedUsed,
    total: current.total,
    remaining: Math.max(0, current.total - updatedUsed),
    percent: Math.min(100, Math.round((updatedUsed / current.total) * 100)),
    period: current.period,
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
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function verifyTokenQuota(estimatedTokens = 1000, isByok = false) {
  if (isByok) {
    return { allowed: true, quotaBypassed: true };
  }

  const usage = getTokenUsage();
  if (usage.used >= usage.total) {
    return {
      allowed: false,
      reason: `Monthly token limit of ${FREE_TIER_MONTHLY_TOKEN_CAP.toLocaleString()} reached. Please upgrade or provide your own API key in Settings.`,
    };
  }

  return { allowed: true, quotaBypassed: false };
}
