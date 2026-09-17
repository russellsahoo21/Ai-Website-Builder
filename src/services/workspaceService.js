/**
 * workspaceService.js
 * Multi-tenant team and workspace management for AetherCraft Studio.
 * Local-first with Supabase PostgreSQL cloud sync.
 */

import { supabase, isCloudDbConfigured, getServerDbClient } from './dbService.js';

const STORAGE_KEY_WORKSPACES = 'aethercraft_workspaces';
const STORAGE_KEY_ACTIVE_WORKSPACE = 'aethercraft_active_workspace_id';

/**
 * Creates default personal workspace for user
 */
export function getDefaultPersonalWorkspace(userId, userName = 'Personal') {
  return {
    id: `ws_personal_${userId || 'default'}`,
    name: `${userName}'s Workspace`,
    owner_id: userId || 'default',
    plan: 'free',
    isPersonal: true,
    created_at: new Date().toISOString()
  };
}

/**
 * Retrieve all workspaces the user belongs to
 */
export async function fetchUserWorkspaces(userId) {
  if (!userId) {
    return [getDefaultPersonalWorkspace('guest', 'Guest')];
  }

  // 1. In browser, route through authenticated API route
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/workspaces');
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.workspaces) && json.workspaces.length > 0) {
          localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(json.workspaces));
          return json.workspaces;
        }
      }
    } catch (e) {}

    // Fallback to localStorage cache or default
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WORKSPACES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    const defaultWs = getDefaultPersonalWorkspace(userId);
    localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify([defaultWs]));
    return [defaultWs];
  }

  // 2. Server-side fetch using service role client
  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      const { data: owned } = await client
        .from('workspaces')
        .select('*')
        .eq('owner_id', userId);

      const { data: memberOf } = await client
        .from('workspace_members')
        .select('workspace_id, role, workspaces(*)')
        .eq('user_id', userId);

      const list = [];
      if (Array.isArray(owned)) list.push(...owned);
      if (Array.isArray(memberOf)) {
        memberOf.forEach(m => {
          if (m.workspaces && !list.some(w => w.id === m.workspaces.id)) {
            list.push({ ...m.workspaces, role: m.role });
          }
        });
      }

      if (list.length > 0) return list;
    } catch (e) {}
  }

  return [getDefaultPersonalWorkspace(userId)];
}

/**
 * Create a new team workspace
 */
export async function createWorkspace({ name, ownerId, plan = 'pro' }) {
  if (!name || !ownerId) return null;

  const newWorkspace = {
    id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    owner_id: ownerId,
    plan,
    isPersonal: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 1. In browser, route through authenticated API route
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name, plan })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.workspace) {
          const raw = localStorage.getItem(STORAGE_KEY_WORKSPACES);
          const current = raw ? JSON.parse(raw) : [];
          current.push(json.workspace);
          localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(current));
          localStorage.setItem(STORAGE_KEY_ACTIVE_WORKSPACE, json.workspace.id);
          return json.workspace;
        }
      }
    } catch (e) {}

    // Offline cache fallback
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WORKSPACES);
      const current = raw ? JSON.parse(raw) : [];
      current.push(newWorkspace);
      localStorage.setItem(STORAGE_KEY_WORKSPACES, JSON.stringify(current));
      localStorage.setItem(STORAGE_KEY_ACTIVE_WORKSPACE, newWorkspace.id);
    } catch (e) {}
    return newWorkspace;
  }

  // 2. Server-side DB insertion using service role client
  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      await client.from('workspaces').insert(newWorkspace);
      await client.from('workspace_members').insert({
        workspace_id: newWorkspace.id,
        user_id: ownerId,
        role: 'owner'
      });
    } catch (e) {
      console.warn('[workspaceService] Cloud insert error:', e.message);
    }
  }

  return newWorkspace;
}

/**
 * Invite a member to a workspace
 */
export async function inviteWorkspaceMember({ workspaceId, email, role = 'member' }) {
  if (!workspaceId || !email) return null;

  const memberRecord = {
    workspace_id: workspaceId,
    email: email.trim().toLowerCase(),
    role,
    invited_at: new Date().toISOString()
  };

  // 1. In browser, route through authenticated API route
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'invite', workspaceId, email, role })
      });
      if (res.ok) {
        const json = await res.json();
        return json.invite || memberRecord;
      }
    } catch (e) {}
    return memberRecord;
  }

  // 2. Server-side insertion using service role client
  const client = getServerDbClient();
  if (isCloudDbConfigured() && client) {
    try {
      const { data, error } = await client
        .from('workspace_members')
        .insert(memberRecord)
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('[workspaceService] invite error:', e.message);
    }
  }

  return memberRecord;
}

/**
 * Get active workspace ID
 */
export function getActiveWorkspaceId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_ACTIVE_WORKSPACE);
}

/**
 * Set active workspace ID
 */
export function setActiveWorkspaceId(workspaceId) {
  if (typeof window === 'undefined') return;
  if (workspaceId) {
    localStorage.setItem(STORAGE_KEY_ACTIVE_WORKSPACE, workspaceId);
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_WORKSPACE);
  }
}
