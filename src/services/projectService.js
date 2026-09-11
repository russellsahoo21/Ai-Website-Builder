/**
 * projectService.js
 * Manages persistent storage, retrieval, creation, and management
 * of user projects with dual-tier storage:
 * - Ultra-fast Local Cache (instant UI rendering)
 * - Cloud Database Sync via Supabase PostgreSQL (cross-device sync & permanence)
 */

import { STARTER_TEMPLATES } from '../templates/starterTemplates.js';
import { ensureStandardReactStructure } from '../utils/projectStructure.js';
import { 
  saveCloudProject, 
  deleteCloudProject, 
  fetchCloudProjects, 
  migrateLocalProjectsToCloud,
  isCloudDbConfigured 
} from './dbService.js';

export { ensureStandardReactStructure };

const STORAGE_KEY = 'aethercraft_saved_projects';
const ACTIVE_ID_KEY = 'aethercraft_active_project_id';

// Current authenticated user ID ref for background cloud sync
let currentUserId = null;

export function setCurrentUserId(userId) {
  currentUserId = userId || null;
}

export function getCurrentUserId() {
  return currentUserId;
}

// Generate clean title from prompt if no name provided
export function deriveProjectName(prompt) {
  if (!prompt || typeof prompt !== 'string') return 'Untitled Project';
  const clean = prompt
    .replace(/^(build|create|design|make|generate)\s+(a|an|the)?\s*/i, '')
    .trim();
  if (!clean) return 'Untitled Project';
  const words = clean.split(/\s+/).slice(0, 5).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Get all saved projects from local cache
export function getAllProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial template projects if none exist
      const seeded = (STARTER_TEMPLATES || []).slice(0, 2).map((tmpl, idx) => ({
        id: `seeded_${tmpl.id}`,
        name: tmpl.name,
        prompt: tmpl.tagline || tmpl.description,
        files: ensureStandardReactStructure(tmpl.files || {}),
        messages: [
          { role: 'ai', content: `Starter template "${tmpl.name}" ready to inspect and customize.` }
        ],
        createdAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
        fileCount: Object.keys(tmpl.files || {}).length,
        synced: false
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Automatically upgrade any legacy flat project to standard React structure
    let hasUpgrades = false;
    const upgraded = parsed.map(p => {
      const hasFlat = p.files && (p.files['App.jsx'] || p.files['styles.css'] || !p.files['src/App.jsx']);
      if (hasFlat) {
        hasUpgrades = true;
        const normalizedFiles = ensureStandardReactStructure(p.files || {});
        return {
          ...p,
          files: normalizedFiles,
          fileCount: Object.keys(normalizedFiles).length
        };
      }
      return p;
    });

    if (hasUpgrades) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
    }
    return upgraded;
  } catch (err) {
    console.error('Failed to load projects from storage:', err);
    return [];
  }
}

// Get project by ID
export function getProjectById(id) {
  const all = getAllProjects();
  return all.find(p => p.id === id) || null;
}

// Get the active project ID
export function getActiveProjectId() {
  return localStorage.getItem(ACTIVE_ID_KEY) || null;
}

// Set active project ID
export function setActiveProjectId(id) {
  if (id) {
    localStorage.setItem(ACTIVE_ID_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_ID_KEY);
  }
}

// Save or update a project (Local-first + Background Cloud Sync)
export function saveProject(project, userId = currentUserId) {
  if (!project || !project.id) return null;
  try {
    const all = getAllProjects();
    const existingIdx = all.findIndex(p => p.id === project.id);
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
      fileCount: Object.keys(project.files || {}).length
    };

    if (existingIdx >= 0) {
      all[existingIdx] = { ...all[existingIdx], ...updatedProject };
    } else {
      all.unshift(updatedProject);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // Background cloud sync if user is signed in
    if (userId && isCloudDbConfigured()) {
      saveCloudProject(userId, updatedProject).catch(err => 
        console.warn('[projectService] Background cloud save warning:', err.message)
      );
    }

    return updatedProject;
  } catch (err) {
    console.error('Failed to save project:', err);
    return null;
  }
}

// Create a new project
export function createNewProject({ name, prompt = '', files = {}, messages = [] } = {}, userId = currentUserId) {
  const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const finalName = name || deriveProjectName(prompt) || 'New Project';
  const structuredFiles = ensureStandardReactStructure(files || {});
  const newProj = {
    id,
    name: finalName,
    prompt: prompt || 'Custom application project',
    files: structuredFiles,
    messages: messages || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fileCount: Object.keys(structuredFiles).length,
    synced: false
  };

  const all = getAllProjects();
  all.unshift(newProj);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  setActiveProjectId(id);

  // Background cloud sync
  if (userId && isCloudDbConfigured()) {
    saveCloudProject(userId, newProj).catch(err => 
      console.warn('[projectService] Background cloud create warning:', err.message)
    );
  }

  return newProj;
}

// Delete project
export function deleteProject(id, userId = currentUserId) {
  try {
    const all = getAllProjects();
    const filtered = all.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (getActiveProjectId() === id) {
      setActiveProjectId(filtered.length > 0 ? filtered[0].id : null);
    }

    // Cloud delete
    if (userId && isCloudDbConfigured()) {
      deleteCloudProject(userId, id).catch(err =>
        console.warn('[projectService] Cloud delete warning:', err.message)
      );
    }

    return filtered;
  } catch (err) {
    console.error('Failed to delete project:', err);
    return getAllProjects();
  }
}

// Duplicate an existing project
export function duplicateProject(id, userId = currentUserId) {
  const orig = getProjectById(id);
  if (!orig) return null;
  const newProj = {
    ...orig,
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `${orig.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    synced: false
  };
  const all = getAllProjects();
  all.unshift(newProj);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

  if (userId && isCloudDbConfigured()) {
    saveCloudProject(userId, newProj).catch(err =>
      console.warn('[projectService] Cloud duplicate warning:', err.message)
    );
  }

  return newProj;
}

// Synchronize all user projects with Supabase Cloud DB
export async function syncProjectsWithCloud(userId) {
  if (!userId || !isCloudDbConfigured()) return getAllProjects();

  try {
    setCurrentUserId(userId);

    // 1. Auto-migrate any un-synced local projects to Cloud DB
    await migrateLocalProjectsToCloud(userId);

    // 2. Fetch full list of projects from Cloud DB
    const cloudProjects = await fetchCloudProjects(userId);

    if (cloudProjects && cloudProjects.length > 0) {
      // Overwrite / merge into local storage cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudProjects));
      return cloudProjects;
    }

    return getAllProjects();
  } catch (err) {
    console.error('[projectService] syncProjectsWithCloud error:', err);
    return getAllProjects();
  }
}

// Format relative time (e.g. "2 mins ago", "Yesterday")
export function formatTimeAgo(isoString) {
  if (!isoString) return 'Recently';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const secDiff = Math.floor((now - date) / 1000);

    if (secDiff < 60) return 'Just now';
    const minDiff = Math.floor(secDiff / 60);
    if (minDiff < 60) return `${minDiff}m ago`;
    const hourDiff = Math.floor(minDiff / 60);
    if (hourDiff < 24) return `${hourDiff}h ago`;
    const dayDiff = Math.floor(hourDiff / 24);
    if (dayDiff === 1) return 'Yesterday';
    if (dayDiff < 30) return `${dayDiff}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
}
