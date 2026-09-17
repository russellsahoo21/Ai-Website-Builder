/**
 * dbService.js
 * Cloud database service managing User Profiles, Projects, and Chat Histories
 * backed by Supabase PostgreSQL with seamless offline/local-first fallback.
 */

import { supabase, isCloudDbConfigured, getServiceSupabase } from './supabaseClient.js';
import { ensureStandardReactStructure } from '../utils/projectStructure.js';

export { isCloudDbConfigured, supabase };

/**
 * Returns the privileged service role client on the server.
 * Never falls back to the anonymous client to prevent silent RLS failures.
 */
export function getServerDbClient() {
  if (typeof window === 'undefined') {
    try {
      return getServiceSupabase();
    } catch (e) {
      if (process.env.NODE_ENV === 'production') {
        throw e;
      }
      return null;
    }
  }
  return null;
}

const LOCAL_STORAGE_KEY = 'aethercraft_saved_projects';

/**
 * Sync or create user profile in Supabase matching Clerk user
 */
export async function syncUserProfile(user) {
  if (!user?.id) return null;

  // In browser, route through authenticated API endpoint
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.fullName || user.firstName || 'User',
          email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '',
          avatar_url: user.imageUrl || '',
        })
      });
      if (res.ok) {
        const json = await res.json();
        return json.profile || null;
      }
    } catch (e) {}
    return null;
  }

  // Server-side execution using service role client
  const client = getServerDbClient();
  if (!isCloudDbConfigured() || !client) return null;

  try {
    const { data: existing } = await client
      .from('profiles')
      .select('plan, project_quota')
      .eq('id', user.id)
      .maybeSingle();

    const profile = {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '',
      name: user.fullName || user.firstName || 'User',
      avatar_url: user.imageUrl || '',
      plan: existing?.plan || 'free',
      project_quota: existing?.project_quota || 5,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('[dbService] Profile upsert notice:', error.message);
      return existing ? { id: user.id, ...profile, ...existing } : null;
    }
    return data;
  } catch (err) {
    console.error('[dbService] syncUserProfile failed:', err);
    return null;
  }
}

/**
 * Fetch a single user profile from Supabase
 */
export async function fetchUserProfile(userId) {
  if (!userId) return null;

  // In browser, route through authenticated API endpoint
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const json = await res.json();
        return json.profile || null;
      }
    } catch (e) {}
    return null;
  }

  // Server-side execution using service role client
  const client = getServerDbClient();
  if (!isCloudDbConfigured() || !client) return memoryUserProfiles.get(userId) || null;

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[dbService] fetchUserProfile notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[dbService] fetchUserProfile error:', err);
    return null;
  }
}

/**
 * Update user plan in Supabase (e.g. upgraded to pro)
 */
export async function updateUserPlan(userId, plan = 'pro') {
  const client = getServerDbClient();
  if (!isCloudDbConfigured() || !client || !userId) return null;

  try {
    const { data, error } = await client
      .from('profiles')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[dbService] updateUserPlan error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[dbService] updateUserPlan failed:', err);
    return null;
  }
}

/**
 * Fetch token usage for a user and period from Supabase user_token_usage
 */
export async function fetchUserTokenUsage(userId, period) {
  const client = getServerDbClient();
  if (!isCloudDbConfigured() || !client || !userId || !period) return null;

  try {
    const { data, error } = await client
      .from('user_token_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('period', period)
      .maybeSingle();

    if (error) {
      return null;
    }
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Record token consumption in Supabase user_token_usage
 */
export async function recordUserTokenUsage(userId, period, tokensToAdd, limit = 100000) {
  const client = getServerDbClient();
  if (!isCloudDbConfigured() || !client || !userId || !period) return null;

  try {
    const existing = await fetchUserTokenUsage(userId, period);
    const currentUsed = existing ? Number(existing.tokens_used || 0) : 0;
    const newUsed = currentUsed + Math.max(0, tokensToAdd);

    const row = {
      user_id: userId,
      period,
      tokens_used: newUsed,
      token_limit: limit,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('user_token_usage')
      .upsert(row, { onConflict: 'user_id,period' })
      .select()
      .single();

    if (error) {
      return { user_id: userId, period, tokens_used: newUsed, token_limit: limit };
    }
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Volatile in-memory ledger with atomic semantics for offline and test execution
 */
export const memoryTokenLedger = new Map();

/**
 * Atomically reserves tokens for an upcoming generation.
 * If user exceeds token cap, returns { allowed: false, currentUsed, cap }.
 * If allowed, updates usage atomically and returns { allowed: true, currentUsed, cap }.
 */
export async function atomicReserveTokens(userId, period, tokensToAdd, tokenCap = 100000) {
  if (!userId || !period) {
    return { allowed: false, currentUsed: 0, cap: tokenCap, reason: 'INVALID_PARAMS' };
  }

  // 1. Try atomic Postgres RPC if Cloud DB is configured using privileged server client
  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      const { data, error } = await client.rpc('increment_token_quota', {
        p_user_id: userId,
        p_period: period,
        p_tokens_to_add: tokensToAdd,
        p_token_cap: tokenCap
      });

      if (!error && data && typeof data.allowed === 'boolean') {
        memoryTokenLedger.set(`${userId}_${period}`, data.current_used);
        return {
          allowed: data.allowed,
          currentUsed: data.current_used,
          cap: data.cap,
          reason: data.reason
        };
      }
    } catch (e) {
      console.warn('[dbService] Atomic RPC notice, falling back to synchronous ledger:', e.message);
    }
  }

  // 2. Synchronous Atomic Memory Ledger (for offline, testing, or fallback)
  const ledgerKey = `${userId}_${period}`;
  const currentUsed = memoryTokenLedger.get(ledgerKey) || 0;

  if (tokenCap > 0 && (currentUsed + tokensToAdd) > tokenCap) {
    return {
      allowed: false,
      currentUsed,
      cap: tokenCap,
      reason: 'TOKEN_QUOTA_EXCEEDED'
    };
  }

  const newUsed = currentUsed + tokensToAdd;
  memoryTokenLedger.set(ledgerKey, newUsed);

  return {
    allowed: true,
    currentUsed: newUsed,
    cap: tokenCap
  };
}

/**
 * Atomically rolls back reserved tokens if upstream provider generation failed.
 */
export async function atomicRollbackTokens(userId, period, tokensToSubtract) {
  if (!userId || !period || !tokensToSubtract) return;

  // 1. Try atomic Postgres RPC using privileged server client
  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      await client.rpc('rollback_token_quota', {
        p_user_id: userId,
        p_period: period,
        p_tokens_to_subtract: tokensToSubtract
      });
    } catch (e) {
      console.warn('[dbService] Rollback RPC notice:', e.message);
    }
  }

  // 2. Update synchronous ledger
  const ledgerKey = `${userId}_${period}`;
  const currentUsed = memoryTokenLedger.get(ledgerKey) || 0;
  const rolledBack = Math.max(0, currentUsed - tokensToSubtract);
  memoryTokenLedger.set(ledgerKey, rolledBack);
  return rolledBack;
}

/**
 * Fetch all projects for a user from Supabase Cloud DB
 */
export async function fetchCloudProjects(userId) {
  if (!userId) return null;

  // In browser, route through authenticated API endpoint
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const json = await res.json();
        return json.projects || [];
      }
    } catch (e) {}
    return [];
  }

  const client = getServerDbClient();
  if (!isCloudDbConfigured() || !client) return null;

  try {
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[dbService] Failed to fetch projects:', error.message);
      return null;
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      prompt: row.prompt || '',
      files: ensureStandardReactStructure(row.files || {}, row.name),
      messages: Array.isArray(row.messages) ? row.messages : [],
      fileCount: row.file_count || Object.keys(row.files || {}).length,
      isStarred: Boolean(row.is_starred),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      synced: true
    }));
  } catch (err) {
    console.error('[dbService] fetchCloudProjects error:', err);
    return null;
  }
}

/**
 * Save or update a project and its chat history in Supabase Cloud DB
 */
export async function saveCloudProject(userId, project) {
  if (!userId || !project?.id) return null;

  // In browser, route through authenticated API endpoint
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      if (res.ok) {
        const json = await res.json();
        return json.project || null;
      }
    } catch (e) {}
    return null;
  }

  const client = getServerDbClient();
  if (!isCloudDbConfigured() || !client) return null;

  try {
    const normalizedFiles = ensureStandardReactStructure(project.files || {}, project.name);
    const row = {
      id: project.id,
      user_id: userId,
      name: project.name || 'Untitled Project',
      prompt: project.prompt || '',
      files: normalizedFiles,
      messages: Array.isArray(project.messages) ? project.messages : [],
      file_count: Object.keys(normalizedFiles).length,
      is_starred: Boolean(project.isStarred),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('projects')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[dbService] Failed to save cloud project:', error.message);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      prompt: data.prompt,
      files: normalizedFiles,
      messages: data.messages,
      fileCount: data.file_count,
      isStarred: data.is_starred,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      synced: true
    };
  } catch (err) {
    console.error('[dbService] saveCloudProject error:', err);
    return null;
  }
}

/**
 * Delete a project from Supabase Cloud DB
 */
export async function deleteCloudProject(userId, projectId) {
  if (!projectId) return false;

  // In browser, route through authenticated API endpoint
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/projects?id=${encodeURIComponent(projectId)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  const client = getServerDbClient();
  if (!isCloudDbConfigured() || !client || !userId) return false;

  try {
    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) {
      console.error('[dbService] Failed to delete cloud project:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[dbService] deleteCloudProject error:', err);
    return false;
  }
}

/**
 * Migrate local projects from browser localStorage into Supabase Cloud DB
 */
export async function migrateLocalProjectsToCloud(userId) {
  if (!isCloudDbConfigured() || !supabase || !userId) return 0;

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return 0;

    const localProjects = JSON.parse(raw);
    if (!Array.isArray(localProjects) || localProjects.length === 0) return 0;

    // Fetch existing cloud project IDs to prevent overwriting
    const existing = await fetchCloudProjects(userId);
    const existingIds = new Set((existing || []).map(p => p.id));

    let migratedCount = 0;
    for (const p of localProjects) {
      if (!p.id || existingIds.has(p.id)) continue;

      const saved = await saveCloudProject(userId, p);
      if (saved) migratedCount += 1;
    }

    if (migratedCount > 0) {
      console.log(`[dbService] Successfully migrated ${migratedCount} local projects to Cloud Database!`);
    }
    return migratedCount;
  } catch (err) {
    console.warn('[dbService] Migration notice:', err.message);
    return 0;
  }
}

/**
 * In-memory stores for testing, offline environments, and idempotent fallbacks
 */
export const memoryPaymentTransactions = new Map();
export const memoryUserProfiles = new Map();

/**
 * Fetch a payment transaction by ID to support idempotency checks
 */
export async function fetchPaymentTransactionById(id) {
  if (!id) return null;
  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      const { data, error } = await client
        .from('payment_transactions')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error && data) {
        return data;
      }
    } catch (e) {}
  }
  return memoryPaymentTransactions.get(id) || null;
}

/**
 * Record a verified payment transaction (idempotent upsert)
 */
export async function recordPaymentTransaction({
  id,
  userId,
  orderId = null,
  amount,
  currency = 'INR',
  provider = 'razorpay',
  status = 'captured',
  planId = 'pro'
}) {
  if (!userId || amount === undefined || amount === null) return null;
  const transaction = {
    id: id || `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    order_id: orderId,
    amount: Number(amount),
    currency,
    provider,
    status,
    plan_id: planId,
    created_at: new Date().toISOString()
  };

  memoryPaymentTransactions.set(transaction.id, transaction);

  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      const { data, error } = await client
        .from('payment_transactions')
        .upsert(transaction, { onConflict: 'id' })
        .select()
        .single();
      if (error) {
        console.warn('[dbService] Error upserting payment transaction:', error.message);
      } else if (data) {
        return data;
      }
    } catch (e) {
      console.warn('[dbService] recordPaymentTransaction caught:', e.message);
    }
  }
  return transaction;
}

/**
 * Update user subscription plan and status in profiles table
 */
export async function updateUserSubscription({
  userId,
  plan = 'pro',
  subscriptionStatus = 'active',
  subscriptionId = null,
  customerId = null,
  billingCycle = 'monthly',
  currentPeriodEnd = null
}) {
  if (!userId) return null;

  const projectQuota = plan === 'enterprise' ? 999999 : plan === 'pro' ? 50 : 5;
  const updates = {
    plan,
    project_quota: projectQuota,
    subscription_status: subscriptionStatus,
    subscription_id: subscriptionId,
    customer_id: customerId,
    billing_cycle: billingCycle,
    current_period_end: currentPeriodEnd || new Date(Date.now() + 30 * 86400000).toISOString(),
    updated_at: new Date().toISOString()
  };

  const existingMem = memoryUserProfiles.get(userId) || {};
  memoryUserProfiles.set(userId, { ...existingMem, id: userId, ...updates });

  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      const { data, error } = await client
        .from('profiles')
        .upsert({ id: userId, ...updates }, { onConflict: 'id' })
        .select()
        .single();
      if (error) {
        console.warn('[dbService] Error updating user subscription in profiles:', error.message);
      } else if (data) {
        return data;
      }
    } catch (e) {
      console.warn('[dbService] updateUserSubscription caught:', e.message);
    }
  }
  return { id: userId, ...updates };
}

/**
 * Fetch past payment history for user
 */
export async function fetchPaymentHistory(userId) {
  if (!userId) return [];
  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      const { data, error } = await client
        .from('payment_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {}
  }
  return [];
}

/**
 * Record token consumption by model for daily analytics
 */
export async function recordDailyModelUsage(userId, model = 'gemini-flash', tokens = 0) {
  if (!userId || !tokens) return;
  const today = new Date().toISOString().split('T')[0];

  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      const { data: existing } = await client
        .from('daily_token_usage')
        .select('tokens')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .eq('model', model)
        .maybeSingle();

      const newTotal = (existing?.tokens || 0) + Number(tokens);
      await client
        .from('daily_token_usage')
        .upsert({
          user_id: userId,
          usage_date: today,
          model,
          tokens: newTotal
        });
    } catch (e) {
      console.warn('[dbService] recordDailyModelUsage warning:', e.message);
    }
  }
}

/**
 * Fetch daily token usage history and model breakdown
 */
export async function fetchDailyUsageAnalytics(userId, days = 7) {
  if (!userId) {
    return { dailyTrend: [], modelBreakdown: {} };
  }

  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      const { data, error } = await client
        .from('daily_token_usage')
        .select('*')
        .eq('user_id', userId)
        .gte('usage_date', startDate)
        .order('usage_date', { ascending: true });

      if (!error && Array.isArray(data)) {
        const modelBreakdown = {};
        const dateMap = {};

        data.forEach(row => {
          modelBreakdown[row.model] = (modelBreakdown[row.model] || 0) + Number(row.tokens);
          dateMap[row.usage_date] = (dateMap[row.usage_date] || 0) + Number(row.tokens);
        });

        const dailyTrend = Object.entries(dateMap).map(([date, tokens]) => ({
          date,
          tokens
        }));

        return { dailyTrend, modelBreakdown };
      }
    } catch (e) {}
  }

  // Fallback data structure
  return {
    dailyTrend: [
      { date: new Date().toISOString().split('T')[0], tokens: 0 }
    ],
    modelBreakdown: {}
  };
}

