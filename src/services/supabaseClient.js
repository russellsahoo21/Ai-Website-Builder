/**
 * supabaseClient.js
 * Configures the Supabase client for Cloud Database synchronization.
 */
import { createClient } from '@supabase/supabase-js';

function getEnvVar(name) {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
      return import.meta.env[name];
    }
  } catch (e) {}
  return '';
}

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL') || 'https://rxmzcabkbxgtxblooreu.supabase.co';
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY') || '';
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || '';

export const isCloudDbConfigured = () => {
  const activeKey = supabaseServiceKey || supabaseAnonKey;
  return Boolean(
    supabaseUrl &&
    activeKey &&
    activeKey.length > 20 &&
    !activeKey.includes('placeholder')
  );
};

export const isServiceRoleConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseServiceKey &&
    supabaseServiceKey.length > 20
  );
};

// Anonymous Supabase client for public / unprivileged operations
export const supabase = isCloudDbConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

export const getServiceSupabase = () => {
  if (!isServiceRoleConfigured()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required on the server');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
