/**
 * integrationService.js
 * Production-ready Integration Management Service
 * Manages credentials, connection states, and health validation
 * for GitHub, Supabase, Vercel, Netlify, Stripe, and Resend.
 */

const STORAGE_KEY = 'aethercraft_platform_integrations';

// Default metadata for supported integrations
export const INTEGRATION_PLATFORMS = {
  github: {
    id: 'github',
    name: 'GitHub',
    category: 'Version Control',
    tagline: 'Two-way repository synchronization & commit push',
    badge: 'Official',
    icon: 'Github',
    docsUrl: 'https://github.com/settings/tokens?type=beta',
    fields: [
      {
        key: 'token',
        label: 'Personal Access Token (classic or fine-grained)',
        placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
        type: 'password',
        required: true,
        helpText: 'Requires "repo" scope to create repositories and commit code.'
      },
      {
        key: 'defaultVisibility',
        label: 'Default Repository Privacy',
        type: 'select',
        options: [
          { value: 'public', label: 'Public (Open Source)' },
          { value: 'private', label: 'Private (Protected)' }
        ],
        defaultValue: 'public'
      }
    ]
  },
  supabase: {
    id: 'supabase',
    name: 'Supabase',
    category: 'Database & Auth',
    tagline: 'PostgreSQL database, authentication & Edge functions',
    badge: 'Official',
    icon: 'Database',
    docsUrl: 'https://supabase.com/dashboard/project/_/settings/api',
    fields: [
      {
        key: 'url',
        label: 'Project URL',
        placeholder: 'https://your-project.supabase.co',
        type: 'text',
        required: true,
        helpText: 'Found under Project Settings → API in your Supabase dashboard.'
      },
      {
        key: 'anonKey',
        label: 'Anon / Public API Key',
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        type: 'password',
        required: true,
        helpText: 'Client-safe public anon key for database queries and user auth.'
      }
    ]
  },
  vercel: {
    id: 'vercel',
    name: 'Vercel',
    category: 'Deployment',
    tagline: 'Instant edge deployment with automated preview branches',
    badge: '1-Click',
    icon: 'Triangle',
    docsUrl: 'https://vercel.com/account/tokens',
    fields: [
      {
        key: 'token',
        label: 'Vercel Access Token',
        placeholder: 'ver_xxxxxxxxxxxxxxxxxxxx',
        type: 'password',
        required: true,
        helpText: 'Personal or team access token created in Vercel Account Settings.'
      },
      {
        key: 'teamId',
        label: 'Team ID (Optional)',
        placeholder: 'team_xxxxxxxxxxxxxxxx',
        type: 'text',
        required: false,
        helpText: 'Leave empty for personal hobby deployments, or specify team ID.'
      }
    ]
  },
  netlify: {
    id: 'netlify',
    name: 'Netlify',
    category: 'Hosting',
    tagline: 'Drag-and-drop instant deployments or automated Git pipelines',
    badge: '1-Click',
    icon: 'Globe',
    docsUrl: 'https://app.netlify.com/user/applications#personal-access-tokens',
    fields: [
      {
        key: 'token',
        label: 'Netlify Personal Access Token',
        placeholder: 'nfp_xxxxxxxxxxxxxxxxxxxx',
        type: 'password',
        required: true,
        helpText: 'Generate in Netlify User Settings → Applications → Personal Access Tokens.'
      }
    ]
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    category: 'Payments',
    tagline: 'Subscription checkouts, billing portals & payment handlers',
    badge: 'Beta',
    icon: 'CreditCard',
    docsUrl: 'https://dashboard.stripe.com/test/apikeys',
    fields: [
      {
        key: 'publishableKey',
        label: 'Publishable Key',
        placeholder: 'pk_test_xxxxxxxxxxxxxxxxxxxx',
        type: 'text',
        required: true,
        helpText: 'Used client-side in generated checkout views (pk_test_... or pk_live_...).'
      },
      {
        key: 'secretKey',
        label: 'Secret Key (Restricted)',
        placeholder: 'sk_test_xxxxxxxxxxxxxxxxxxxx',
        type: 'password',
        required: true,
        helpText: 'Used for webhook authentication and checkout session creation.'
      }
    ]
  },
  resend: {
    id: 'resend',
    name: 'Resend',
    category: 'Email',
    tagline: 'Transactional email delivery with React-based email templates',
    badge: 'Verified',
    icon: 'Mail',
    docsUrl: 'https://resend.com/api-keys',
    fields: [
      {
        key: 'apiKey',
        label: 'Resend API Key',
        placeholder: 're_xxxxxxxxxxxxxxxxxxxx',
        type: 'password',
        required: true,
        helpText: 'Create in your Resend dashboard with full or sending access.'
      },
      {
        key: 'senderEmail',
        label: 'Verified Sender Email or Domain',
        placeholder: 'onboarding@resend.dev',
        type: 'text',
        required: false,
        helpText: 'e.g. hello@yourdomain.com or onboarding@resend.dev for test sandbox.'
      }
    ]
  }
};

/**
 * Get all stored integrations from local cache
 */
export function getAllIntegrations() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('[integrationService] Load error:', err);
    return {};
  }
}

/**
 * Get a specific integration config
 */
export function getIntegration(id) {
  const all = getAllIntegrations();
  return all[id] || null;
}

/**
 * Check if a platform is connected
 */
export function isPlatformConnected(id) {
  const config = getIntegration(id);
  return Boolean(config && config.connected);
}

/**
 * Save or update an integration config
 */
export function saveIntegration(id, data) {
  if (typeof window === 'undefined' || !id) return null;
  try {
    const all = getAllIntegrations();
    const existing = all[id] || {};
    
    const updated = {
      ...existing,
      ...data,
      id,
      connected: true,
      updatedAt: new Date().toISOString()
    };

    all[id] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    notifyIntegrationListeners();
    return updated;
  } catch (err) {
    console.error('[integrationService] Save error:', err);
    return null;
  }
}

/**
 * Disconnect an integration
 */
export function disconnectIntegration(id) {
  if (typeof window === 'undefined' || !id) return false;
  try {
    const all = getAllIntegrations();
    if (all[id]) {
      all[id] = {
        ...all[id],
        connected: false,
        disconnectedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      notifyIntegrationListeners();
    }
    return true;
  } catch (err) {
    console.error('[integrationService] Disconnect error:', err);
    return false;
  }
}

// Event notification listeners
const listeners = new Set();

export function subscribeToIntegrations(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyIntegrationListeners() {
  const all = getAllIntegrations();
  listeners.forEach(cb => {
    try {
      cb(all);
    } catch (err) {
      console.error('[integrationService] Listener error:', err);
    }
  });
}

/**
 * Test integration connection with real ping or high-fidelity simulated response
 */
export async function testIntegrationConnection(platformId, credentials = {}) {
  const startTime = performance.now();

  try {
    switch (platformId) {
      case 'github': {
        const token = credentials.token?.trim();
        if (!token) throw new Error('GitHub personal access token is required.');

        const res = await fetch('https://api.github.com/user', {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'AetherCraft-Integration-Verifier'
          }
        });
        const latency = Math.round(performance.now() - startTime);
        if (res.ok) {
          const data = await res.json();
          return {
            success: true,
            message: `Connected to GitHub as @${data.login}`,
            details: { username: data.login, avatarUrl: data.avatar_url, publicRepos: data.public_repos },
            latency
          };
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `GitHub verification failed (HTTP ${res.status})`);
      }

      case 'supabase': {
        const url = credentials.url?.trim();
        const anonKey = credentials.anonKey?.trim();
        if (!url || !anonKey) throw new Error('Supabase URL and Anon Key are required.');
        if (!url.startsWith('https://')) throw new Error('Supabase URL must start with https://');

        const cleanUrl = url.replace(/\/$/, '');
        const res = await fetch(`${cleanUrl}/rest/v1/`, {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`
          }
        });
        const latency = Math.round(performance.now() - startTime);
        if (res.ok || res.status === 200 || res.status === 404) {
          return {
            success: true,
            message: 'Supabase PostgreSQL & REST API Connected',
            details: { endpoint: cleanUrl },
            latency
          };
        }
        throw new Error(`Supabase verification failed (HTTP ${res.status}). Please check your Project URL and Anon Key.`);
      }

      case 'vercel': {
        const token = credentials.token?.trim();
        if (!token) throw new Error('Vercel Access Token is required.');

        const res = await fetch('https://api.vercel.com/v2/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const latency = Math.round(performance.now() - startTime);
        if (res.ok) {
          const data = await res.json();
          return {
            success: true,
            message: `Connected to Vercel account (@${data.user?.username || data.user?.email || 'Active'})`,
            details: { username: data.user?.username, email: data.user?.email },
            latency
          };
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Vercel token verification failed (HTTP ${res.status})`);
      }

      case 'netlify': {
        const token = credentials.token?.trim();
        if (!token) throw new Error('Netlify Access Token is required.');

        const res = await fetch('https://api.netlify.com/api/v1/user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const latency = Math.round(performance.now() - startTime);
        if (res.ok) {
          const data = await res.json();
          return {
            success: true,
            message: `Connected to Netlify (${data.full_name || data.email || 'Verified'})`,
            details: { email: data.email, full_name: data.full_name },
            latency
          };
        }
        throw new Error(`Netlify verification failed (HTTP ${res.status}). Verify your Personal Access Token.`);
      }

      case 'stripe': {
        const pk = credentials.publishableKey?.trim();
        const sk = credentials.secretKey?.trim();
        if (!pk || !sk) throw new Error('Both Stripe Publishable Key and Secret Key are required.');
        if (!pk.startsWith('pk_')) throw new Error('Publishable Key must start with pk_test_ or pk_live_');
        if (!sk.startsWith('sk_') && !sk.startsWith('rk_')) throw new Error('Secret Key must start with sk_ or rk_');

        // Test real credentials against Stripe balance endpoint
        const res = await fetch('https://api.stripe.com/v1/balance', {
          headers: {
            Authorization: `Bearer ${sk}`
          }
        });
        const latency = Math.round(performance.now() - startTime);
        if (res.ok) {
          const data = await res.json();
          const isLive = data.livemode;
          return {
            success: true,
            message: isLive ? 'Stripe Connected (Live Production Mode)' : 'Stripe Connected (Test Sandbox Mode)',
            details: { livemode: isLive },
            latency
          };
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Stripe secret key verification failed (HTTP ${res.status})`);
      }

      case 'resend': {
        const apiKey = credentials.apiKey?.trim();
        if (!apiKey) throw new Error('Resend API Key is required.');
        if (!apiKey.startsWith('re_')) throw new Error('Resend API key must start with re_');

        const res = await fetch('https://api.resend.com/api-keys', {
          headers: { Authorization: `Bearer ${apiKey}` }
        });
        const latency = Math.round(performance.now() - startTime);
        if (res.ok) {
          return {
            success: true,
            message: 'Resend Email API Connected & Verified',
            details: { verified: true, sender: credentials.senderEmail || 'Verified Domain' },
            latency
          };
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Resend API key verification failed (HTTP ${res.status})`);
      }

      default:
        throw new Error('Unsupported platform');
    }
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Connection test failed',
      latency: Math.round(performance.now() - startTime)
    };
  }
}
