/**
 * feedbackService.js
 * Comprehensive client-side and cloud-synced Bug Reporting & Feedback Vault.
 * Features:
 * - Local-first offline persistence in localStorage
 * - Automatic client system diagnostics capture (OS, Browser, Screen, Model, Online status)
 * - Cloud database sync with Supabase if configured
 * - GitHub Issue Markdown formatter for 1-click exporting to GitHub issues
 */

import { supabase, isCloudDbConfigured } from './supabaseClient.js';

const STORAGE_KEY = 'aethercraft_feedback_reports';

export const REPORT_TYPES = [
  { id: 'bug', label: 'Bug Report', icon: 'Bug', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  { id: 'feature', label: 'Feature Request', icon: 'Sparkles', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  { id: 'ui', label: 'UI / UX Polish', icon: 'Layout', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  { id: 'perf', label: 'Performance / Speed', icon: 'Zap', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { id: 'general', label: 'General Feedback', icon: 'MessageSquare', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
];

export const SEVERITY_LEVELS = [
  { id: 'critical', label: 'Critical (Blocker)', badge: 'bg-rose-950/80 text-rose-300 border-rose-800/80', dot: 'bg-rose-500' },
  { id: 'high', label: 'High Priority', badge: 'bg-orange-950/80 text-orange-300 border-orange-800/80', dot: 'bg-orange-500' },
  { id: 'medium', label: 'Medium', badge: 'bg-amber-950/80 text-amber-300 border-amber-800/80', dot: 'bg-amber-400' },
  { id: 'low', label: 'Low / Suggestion', badge: 'bg-zinc-800 text-zinc-300 border-zinc-700', dot: 'bg-zinc-400' },
];

export const STATUS_STATES = [
  { id: 'open', label: 'Open', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'in-review', label: 'In Review', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { id: 'resolved', label: 'Resolved', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'closed', label: 'Closed', color: 'text-zinc-400 bg-zinc-800 border-zinc-700' },
];

const SEED_REPORTS = [
  {
    id: 'rep_sample_01',
    type: 'feature',
    severity: 'medium',
    status: 'in-review',
    title: '1-Click Direct Deployment to Vercel and Netlify',
    description: 'Allow users to deploy generated React code directly to Vercel/Netlify without needing to download the ZIP file first.',
    stepsToReproduce: '1. Build project in Studio\n2. Open Export options\n3. Notice only ZIP download is supported currently',
    expectedBehavior: 'Direct deploy button that triggers git commit and Vercel hook.',
    actualBehavior: 'Only ZIP archive download available.',
    userEmail: 'alex.developer@techstart.io',
    userName: 'Alex Chen',
    userId: 'user_sample_alex',
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    diagnostics: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      os: 'macOS',
      screen: '2560x1440',
      viewport: '1440x900',
      activeModel: 'openrouter/free',
      online: true,
    }
  },
  {
    id: 'rep_sample_02',
    type: 'bug',
    severity: 'high',
    status: 'open',
    title: 'Monospace code block overflow on narrow mobile screens',
    description: 'When viewing synthesized code on a screen under 380px width, horizontal scrollbars cause layout clipping in the right drawer.',
    stepsToReproduce: '1. Switch preview device switcher to Mobile (375px)\n2. Inspect code tab\n3. Scroll horizontally',
    expectedBehavior: 'Code block should fit within container with touch scroll padding.',
    actualBehavior: 'Container right margin gets clipped by 8px.',
    userEmail: 'dev.sarah@acme.corp',
    userName: 'Sarah Miller',
    userId: 'user_sample_sarah',
    createdAt: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
    diagnostics: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      os: 'Windows 11',
      screen: '1920x1080',
      viewport: '375x667',
      activeModel: 'google/gemma-4-31b-it:free',
      online: true,
    }
  }
];

export function captureSystemDiagnostics() {
  if (typeof window === 'undefined') return {};
  const ua = navigator.userAgent || '';
  let os = 'Unknown OS';
  if (ua.includes('Win')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  let browser = 'Unknown Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Google Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';

  return {
    os,
    browser,
    userAgent: ua,
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    pixelRatio: window.devicePixelRatio || 1,
    activeModel: localStorage.getItem('aethercraft_model') || 'openrouter/free',
    online: navigator.onLine,
    timestamp: new Date().toISOString(),
  };
}

export function getAllFeedbackReports() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_REPORTS));
      return SEED_REPORTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_REPORTS;
  } catch (err) {
    console.warn('[FeedbackService] Failed to parse local feedback reports:', err);
    return SEED_REPORTS;
  }
}

export async function submitFeedbackReport(reportInput) {
  const current = getAllFeedbackReports();
  const diagnostics = reportInput.diagnostics || captureSystemDiagnostics();

  const newReport = {
    id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    type: reportInput.type || 'bug',
    severity: reportInput.severity || 'medium',
    status: 'open',
    title: reportInput.title?.trim() || 'Untitled Bug Report',
    description: reportInput.description?.trim() || '',
    stepsToReproduce: reportInput.stepsToReproduce?.trim() || '',
    expectedBehavior: reportInput.expectedBehavior?.trim() || '',
    actualBehavior: reportInput.actualBehavior?.trim() || '',
    userEmail: reportInput.userEmail || '',
    userName: reportInput.userName || 'Anonymous Creator',
    userId: reportInput.userId || 'anon',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    diagnostics,
  };

  const updated = [newReport, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // If Supabase is connected, attempt non-blocking sync
  if (isCloudDbConfigured() && supabase) {
    try {
      supabase.from('feedback_reports').insert([{
        id: newReport.id,
        user_id: newReport.userId,
        user_email: newReport.userEmail,
        user_name: newReport.userName,
        title: newReport.title,
        description: newReport.description,
        report_type: newReport.type,
        severity: newReport.severity,
        status: newReport.status,
        steps_to_reproduce: newReport.stepsToReproduce,
        expected_behavior: newReport.expectedBehavior,
        actual_behavior: newReport.actualBehavior,
        diagnostics: newReport.diagnostics,
        created_at: newReport.createdAt,
      }]).then(({ error }) => {
        if (error) console.info('[FeedbackService] Supabase sync notice:', error.message);
      });
    } catch (e) {
      // safe fallback
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aethercraft_feedback_updated', { detail: newReport }));
  }

  return newReport;
}

export function updateFeedbackStatus(id, newStatus) {
  const current = getAllFeedbackReports();
  const updated = current.map(item => {
    if (item.id === id) {
      return {
        ...item,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
    }
    return item;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aethercraft_feedback_updated', { detail: { id, newStatus } }));
  }
  return updated;
}

export function deleteFeedbackReport(id) {
  const current = getAllFeedbackReports();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aethercraft_feedback_updated', { detail: { id, deleted: true } }));
  }
  return updated;
}

export function formatReportAsMarkdown(report) {
  return `# [${report.type.toUpperCase()}] ${report.title}

**Report ID:** \`${report.id}\`
**Severity:** ${report.severity.toUpperCase()}
**Status:** ${report.status}
**Reported By:** ${report.userName} (${report.userEmail || 'Anonymous'})
**Submitted:** ${new Date(report.createdAt).toLocaleString()}

---

## 📝 Description
${report.description || 'No description provided.'}

${report.stepsToReproduce ? `## 🔁 Steps to Reproduce
${report.stepsToReproduce}` : ''}

${report.expectedBehavior ? `## ✅ Expected Behavior
${report.expectedBehavior}` : ''}

${report.actualBehavior ? `## ❌ Actual Behavior
${report.actualBehavior}` : ''}

---

## 💻 System Diagnostics
| Property | Value |
|---|---|
| **OS** | ${report.diagnostics?.os || 'Unknown'} |
| **Browser** | ${report.diagnostics?.browser || 'Unknown'} |
| **Screen Resolution** | ${report.diagnostics?.screen || 'N/A'} |
| **Viewport** | ${report.diagnostics?.viewport || 'N/A'} |
| **Active AI Model** | \`${report.diagnostics?.activeModel || 'openrouter/free'}\` |
| **Network Online** | ${report.diagnostics?.online ? 'Yes' : 'No'} |
| **User Agent** | \`${report.diagnostics?.userAgent || 'N/A'}\` |
`;
}

export function exportFeedbackReportsJson() {
  const data = getAllFeedbackReports();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aethercraft-feedback-reports-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
