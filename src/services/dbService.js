/**
 * dbService.js
 * Cloud database service managing User Profiles, Projects, and Chat Histories
 * backed by Supabase PostgreSQL with seamless offline/local-first fallback.
 */

import { supabase, isCloudDbConfigured } from './supabaseClient.js';
import { ensureStandardReactStructure } from '../utils/projectStructure.js';

export { isCloudDbConfigured };

const LOCAL_STORAGE_KEY = 'aethercraft_saved_projects';

/**
 * Sync or create user profile in Supabase matching Clerk user
 */
export async function syncUserProfile(user) {
  if (!isCloudDbConfigured() || !supabase || !user?.id) return null;

  try {
    const profile = {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || '',
      name: user.fullName || user.firstName || 'User',
      avatar_url: user.imageUrl || '',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('[dbService] Profile upsert notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[dbService] syncUserProfile failed:', err);
    return null;
  }
}

/**
 * Fetch all projects for a user from Supabase Cloud DB
 */
export async function fetchCloudProjects(userId) {
  if (!isCloudDbConfigured() || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
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
  if (!isCloudDbConfigured() || !supabase || !userId || !project?.id) return null;

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

    const { data, error } = await supabase
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
  if (!isCloudDbConfigured() || !supabase || !userId || !projectId) return false;

  try {
    const { error } = await supabase
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
