/**
 * projectService.js
 * Manages persistent storage, retrieval, creation, and management
 * of user projects in localStorage.
 */

import { STARTER_TEMPLATES } from '../templates/starterTemplates.js';

const STORAGE_KEY = 'aethercraft_saved_projects';
const ACTIVE_ID_KEY = 'aethercraft_active_project_id';

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

// Get all saved projects from localStorage
export function getAllProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial template projects if none exist
      const seeded = (STARTER_TEMPLATES || []).slice(0, 2).map((tmpl, idx) => ({
        id: `seeded_${tmpl.id}`,
        name: tmpl.name,
        prompt: tmpl.tagline || tmpl.description,
        files: tmpl.files || {},
        messages: [
          { role: 'ai', content: `Starter template "${tmpl.name}" ready to inspect and customize.` }
        ],
        createdAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
        fileCount: Object.keys(tmpl.files || {}).length
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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

// Save or update a project
export function saveProject(project) {
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
    return updatedProject;
  } catch (err) {
    console.error('Failed to save project:', err);
    return null;
  }
}

// Create a new project
export function createNewProject({ name, prompt = '', files = {}, messages = [] } = {}) {
  const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const finalName = name || deriveProjectName(prompt) || 'New Project';
  const newProj = {
    id,
    name: finalName,
    prompt: prompt || 'Custom application project',
    files: files || {},
    messages: messages || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fileCount: Object.keys(files || {}).length
  };

  const all = getAllProjects();
  all.unshift(newProj);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  setActiveProjectId(id);
  return newProj;
}

// Delete project
export function deleteProject(id) {
  try {
    const all = getAllProjects();
    const filtered = all.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    if (getActiveProjectId() === id) {
      setActiveProjectId(filtered.length > 0 ? filtered[0].id : null);
    }
    return filtered;
  } catch (err) {
    console.error('Failed to delete project:', err);
    return getAllProjects();
  }
}

// Duplicate an existing project
export function duplicateProject(id) {
  const orig = getProjectById(id);
  if (!orig) return null;
  const newProj = {
    ...orig,
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: `${orig.name} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const all = getAllProjects();
  all.unshift(newProj);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return newProj;
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
