import React, { useState, useMemo } from 'react';
import { 
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  X,
  FolderKanban, 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  Copy, 
  ExternalLink, 
  Clock, 
  Code2, 
  Globe, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  LayoutGrid, 
  List, 
  Edit2, 
  Check, 
  Zap, 
  CheckCircle2, 
  Share2, 
  Settings, 
  BookOpen, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Key, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Sliders,
  Database,
  Boxes,
  Activity,
  Cpu,
  RefreshCw,
  Terminal,
  FileCode,
  CheckCircle,
  HelpCircle,
  Info,
  ChevronDown,
  Layout,
  Table,
  CreditCard,
  PieChart
} from 'lucide-react';
import { useUser } from '@clerk/react';
import { formatTimeAgo } from '../services/projectService.js';
import { downloadProjectZip } from '../utils/zipExporter.js';
import { buildPreviewDoc } from '../utils/previewBuilder.js';
import { STARTER_TEMPLATES } from '../templates/starterTemplates.js';
import { AVAILABLE_MODELS, testOpenRouterConnection } from '../services/aiService.js';

export const MAX_FREE_PROJECTS = 5;

const PROMPT_SUGGESTIONS = [
  { label: 'Fintech Expense Tracker', prompt: 'Fintech Expense Tracker with analytics, CRUD transactions, category filters, and localStorage' },
  { label: 'SaaS Billing & Team Dashboard', prompt: 'SaaS Subscription & Team Analytics dashboard with plan switcher, MRR charts, and members table' },
  { label: 'Luxury Architectural Studio', prompt: 'Minimalist Architecture portfolio with project showcase, masonry gallery, and client inquiry form' },
  { label: 'Artisanal Ceramic Store', prompt: 'E-commerce storefront with product grid, category tabs, slide-over shopping cart, and mock checkout' }
];

const MODULAR_COMPONENTS = [
  {
    id: 'stats-card',
    name: 'Metric & KPI StatCard',
    category: 'Metrics',
    badge: 'React 18',
    description: 'Compact KPI summary card with trend indicator, change percentage, and subtle gradient border.',
    code: 'export function StatCard({ title, value, change, isPositive, icon: Icon }) {\n  return (\n    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">\n      <div>\n        <p className="text-xs text-zinc-400 font-medium">{title}</p>\n        <p className="text-xl font-bold text-white mt-1">{value}</p>\n      </div>\n      {Icon && <div className="p-2.5 rounded-lg bg-zinc-800 text-zinc-300"><Icon className="w-5 h-5" /></div>}\n    </div>\n  );\n}'
  },
  {
    id: 'data-table',
    name: 'Interactive Data Table',
    category: 'Data Display',
    badge: 'Tailwind + State',
    description: 'Tabular data display with search query filter, status badges, row selection, and action buttons.',
    code: 'export function DataTable({ items = [] }) {\n  return (\n    <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950">\n      <table className="w-full text-left text-xs text-zinc-300">\n        <tbody className="divide-y divide-zinc-800/60">\n          {items.map((row) => (\n            <tr key={row.id}><td className="px-4 py-3">{row.name}</td></tr>\n          ))}\n        </tbody>\n      </table>\n    </div>\n  );\n}'
  },
  {
    id: 'filter-drawer',
    name: 'Category Filter Bar',
    category: 'Navigation',
    badge: 'Hooks',
    description: 'Filter bar with category tags selection, active status styling, and instant reset.',
    code: 'export function FilterBar({ categories, activeCategory, onSelect, onReset }) {\n  return (\n    <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">\n      {categories.map(c => <button key={c} onClick={() => onSelect(c)}>{c}</button>)}\n    </div>\n  );\n}'
  },
  {
    id: 'auth-modal',
    name: 'Action Modal Dialog',
    category: 'Overlay',
    badge: 'Portals / State',
    description: 'Clean backdrop-blurred modal dialog with title, close trigger, and responsive action footer.',
    code: 'export function ActionModal({ isOpen, onClose, title, children }) {\n  if (!isOpen) return null;\n  return (\n    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">\n      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">\n        <h3>{title}</h3>\n        <div>{children}</div>\n      </div>\n    </div>\n  );\n}'
  }
];


function ProjectPreviewThumbnail({ files, title, onQuickPreview, onOpenStudio }) {
  const doc = useMemo(() => {
    try {
      return files ? buildPreviewDoc(files) : '';
    } catch (err) {
      console.warn('[ProjectPreviewThumbnail doc error]', err);
      return '';
    }
  }, [files]);
  const hasFiles = Boolean(files && Object.keys(files).length > 0 && doc);

  return (
    <div className="relative w-full h-44 bg-[#090b10] rounded-xl overflow-hidden border border-zinc-800/80 mb-3 group/thumb">
      {hasFiles ? (
        <div className="w-full h-full overflow-hidden relative pointer-events-none select-none bg-[#090a0f]">
          <iframe
            srcDoc={doc}
            title={title || 'App Preview'}
            sandbox="allow-scripts"
            tabIndex={-1}
            loading="lazy"
            className="w-[850px] h-[500px] origin-top-left scale-[0.38] border-0 select-none bg-[#090a0f] pointer-events-none"
          />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-950/60 p-4">
          <Code2 className="w-8 h-8 mb-1.5 opacity-40" />
          <span className="text-[11px] font-mono">Ready for code synthesis</span>
        </div>
      )}

      {/* Top subtle badge */}
      <div className="absolute top-2 left-2 pointer-events-none">
        <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-mono text-zinc-300 border border-white/10">
          React 18 Preview
        </span>
      </div>

      {/* Hover action overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover/thumb:opacity-100 transition-all flex items-center justify-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickPreview();
          }}
          className="px-3 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center gap-1.5 border border-zinc-600 transition"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Preview</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenStudio();
          }}
          className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-zinc-200 transition shadow"
        >
          <Code2 className="w-3.5 h-3.5 text-black" />
          <span>Studio</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage({
  projects = [],
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onDeleteProject,
  onDuplicateProject,
  onRenameProject,
  onLoadTemplate,
  onLaunchWithPrompt,
  onOpenSettings,
  navigateTo,
  apiKey = '',
  setApiKey,
  selectedModel = 'openrouter/free',
  setSelectedModel
}) {
  const { user, isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'recent' | 'modular'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [quickPrompt, setQuickPrompt] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [previewModalProject, setPreviewModalProject] = useState(null);
  const [previewDeviceMode, setPreviewDeviceMode] = useState('desktop');
  
  // Persistent Sidebar View State
  const [activeSidebarTab, setActiveSidebarTab] = useState('projects'); 
  // 'projects' | 'blueprints' | 'components' | 'storage' | 'deployments' | 'activity' | 'showcase' | 'settings' | 'docs'

  // Settings State for inline settings view
  const [tempKey, setTempKey] = useState(apiKey);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [copiedComponentId, setCopiedComponentId] = useState(null);

  // Quota calculations
  const projectCount = projects.length;
  const isAtProjectLimit = projectCount >= MAX_FREE_PROJECTS;
  const quotaPercent = Math.min(Math.round((projectCount / MAX_FREE_PROJECTS) * 100), 100);

  // Total files count across all projects
  const totalFilesCount = useMemo(() => {
    return projects.reduce((acc, p) => acc + Object.keys(p.files || {}).length, 0);
  }, [projects]);

  // Filter projects by search and category
  const filteredProjects = useMemo(() => {
    let list = [...projects];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.prompt && p.prompt.toLowerCase().includes(q))
      );
    }
    if (filterType === 'recent') {
      list = list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else if (filterType === 'modular') {
      list = list.filter(p => Object.keys(p.files || {}).some(f => f.includes('/')));
    }
    return list;
  }, [projects, searchQuery, filterType]);

  // Handle opening preview in standalone browser tab
  const handleOpenPreviewTab = (project, e) => {
    e.stopPropagation();
    const doc = buildPreviewDoc(project.files || {});
    if (!doc) return;
    const blob = new Blob([doc], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  };

  // Handle Export ZIP
  const handleExportZip = (project, e) => {
    e.stopPropagation();
    downloadProjectZip(project.files || {}, project.name || 'aethercraft-app');
  };

  // Handle Quick Prompt submission from Dashboard
  const handleQuickPromptSubmit = (e) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    if (isAtProjectLimit) {
      alert(`Free tier limit reached (${MAX_FREE_PROJECTS}/${MAX_FREE_PROJECTS} projects). Please delete or export an existing project to synthesize a new one.`);
      return;
    }
    onLaunchWithPrompt(quickPrompt.trim());
    setQuickPrompt('');
  };

  // Handle Create Project with limit check
  const handleCreateProjectSafe = () => {
    if (isAtProjectLimit) {
      alert(`Free tier limit reached (${MAX_FREE_PROJECTS}/${MAX_FREE_PROJECTS} projects). Delete an existing project to create a new one.`);
      return;
    }
    onCreateNewProject('New Project', '');
  };

  // Handle inline rename
  const handleStartRename = (project, e) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditingName(project.name);
  };

  const handleSaveRename = (project, e) => {
    e.stopPropagation();
    if (editingName.trim() && editingName !== project.name) {
      if (onRenameProject) {
        onRenameProject(project.id, editingName.trim());
      }
    }
    setEditingId(null);
  };

  const handleCopyCode = (comp) => {
    navigator.clipboard.writeText(comp.code);
    setCopiedComponentId(comp.id);
    setTimeout(() => setCopiedComponentId(null), 2000);
  };

  const handleSaveInlineSettings = () => {
    if (setApiKey) setApiKey(tempKey);
    localStorage.setItem('aethercraft_openrouter_key', tempKey);
    localStorage.setItem('aethercraft_model', selectedModel);
    setTestResult({ success: true, msg: 'Settings successfully saved to local workspace.' });
  };

  const handleTestApiKey = async () => {
    if (!tempKey) {
      setTestResult({ success: false, msg: 'Enter an OpenRouter API key first' });
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    try {
      await testOpenRouterConnection(tempKey, selectedModel);
      setTestResult({ success: true, msg: 'Connection verified! Model ready for synthesis.' });
    } catch (err) {
      setTestResult({ success: false, msg: err.message || 'Connection failed' });
    } finally {
      setTestingKey(false);
    }
  };

  const displayName = isLoaded && user?.firstName ? user.firstName : 'Creator';
  const activeProject = projects.find(p => p.id === activeProjectId);

  // Sidebar navigation structure
  const sidebarNavGroups = [
    {
      group: 'WORKSPACE',
      items: [
        { id: 'projects', label: 'My Projects', icon: FolderKanban, badge: `${projectCount}/${MAX_FREE_PROJECTS}` },
        { id: 'blueprints', label: 'Blueprints', icon: Layers, badge: `${STARTER_TEMPLATES.length}` },
        { id: 'components', label: 'Component Library', icon: Boxes, badge: '4' },
      ]
    },
    {
      group: 'SYSTEM & DATA',
      items: [
        { id: 'storage', label: 'Storage & State', icon: Database },
        { id: 'deployments', label: 'Deployments & ZIP', icon: Globe },
        { id: 'activity', label: 'Activity Log', icon: Activity },
        { id: 'showcase', label: 'Showcase', icon: Sparkles },
      ]
    },
    {
      group: 'CONFIGURATION',
      items: [
        { id: 'settings', label: 'Engine Settings', icon: Sliders },
        { id: 'docs', label: 'Documentation', icon: BookOpen },
      ]
    }
  ];

  return (
    <div className="w-screen h-screen flex bg-[#07090e] text-zinc-100 overflow-hidden font-sans select-none">
      {/* ── Left Sidebar (Permanent Across All Views) ── */}
      <aside 
        className={`${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } bg-[#090b10] border-r border-zinc-800/80 flex flex-col justify-between transition-all duration-200 shrink-0 z-30 relative`}
      >
        {/* Top Branding Section */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="h-14 border-b border-zinc-800/80 px-3 flex items-center justify-between shrink-0">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Logo Box - strict aspect-square & shrink-0 to prevent any squishing */}
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-xs text-black shrink-0 aspect-square shadow-sm">
                  A
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs tracking-tight text-white flex items-center gap-1.5 truncate">
                    <span>AetherCraft</span>
                    <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[9px] text-zinc-300 font-mono border border-zinc-700/80">
                      FREE
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    {displayName}'s Workspace
                  </div>
                </div>
              </div>
            ) : (
              /* Centered crisp logo in collapsed mode */
              <div 
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-xs text-black mx-auto shrink-0 aspect-square cursor-pointer hover:bg-white transition"
                title="Expand Workspace Sidebar"
              >
                A
              </div>
            )}

            {!isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 transition shrink-0"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Floating Expand Tab when collapsed */}
          {isSidebarCollapsed && (
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="absolute -right-3 top-4 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center shadow-lg z-40 transition"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Quick Launch Studio Shortcut */}
          <div className="p-2.5 shrink-0">
            <button
              onClick={() => navigateTo('studio')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800/90 text-zinc-100 hover:bg-zinc-700/80 hover:text-white border border-zinc-700/50 transition group ${
                isSidebarCollapsed ? 'justify-center px-0' : ''
              }`}
              title="Launch Code Studio"
            >
              <Code2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between w-full min-w-0">
                  <span className="truncate">Open Code Studio</span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              )}
            </button>
          </div>

          {/* Sidebar Nav Items Divided into Organized Sections */}
          <div className="flex-1 overflow-y-auto px-2.5 py-1 space-y-4 min-h-0">
            {sidebarNavGroups.map((grp) => (
              <div key={grp.group}>
                {!isSidebarCollapsed && (
                  <div className="px-2 mb-1.5 text-[10px] font-mono tracking-wider text-zinc-500 font-semibold uppercase">
                    {grp.group}
                  </div>
                )}
                <div className="space-y-0.5">
                  {grp.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSidebarTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSidebarTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition ${
                          isActive
                            ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700/60'
                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent'
                        } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
                        title={item.label}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-zinc-100' : 'text-zinc-400'
                          }`} />
                          {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!isSidebarCollapsed && item.badge && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono shrink-0 ${
                            item.id === 'projects' && isAtProjectLimit
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                              : 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/40'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer: Real Quota Tracker + User Profile */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#080a0e] shrink-0 space-y-3">
          {/* Free Tier Project Quota */}
          {!isSidebarCollapsed ? (
            <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/90">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-300 text-[11px]">Free Tier Usage</span>
                <span className={`font-mono text-[11px] font-bold ${
                  isAtProjectLimit ? 'text-amber-400' : 'text-zinc-400'
                }`}>
                  {projectCount} / {MAX_FREE_PROJECTS}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-1.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAtProjectLimit 
                      ? 'bg-amber-500' 
                      : 'bg-zinc-200'
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                <span>{MAX_FREE_PROJECTS - projectCount} project slots available</span>
                <button 
                  onClick={() => setActiveSidebarTab('settings')}
                  className="text-zinc-400 hover:text-white underline text-[10px]"
                >
                  Manage
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="w-full flex flex-col items-center justify-center p-1 cursor-pointer"
              onClick={() => setIsSidebarCollapsed(false)}
              title={`Project quota: ${projectCount}/${MAX_FREE_PROJECTS}`}
            >
              <span className="text-[10px] font-mono text-zinc-400 font-bold">{projectCount}/{MAX_FREE_PROJECTS}</span>
              <div className="w-6 h-1 rounded-full bg-zinc-800 mt-1 overflow-hidden">
                <div className="h-full bg-zinc-300" style={{ width: `${quotaPercent}%` }} />
              </div>
            </div>
          )}

          {/* User Profile Footer */}
          <div className="flex items-center justify-between pt-1">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow">
                  {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {user?.fullName || displayName}
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate">
                    Personal Plan
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-xs text-white mx-auto shadow shrink-0">
                {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
            )}

            {!isSidebarCollapsed && (
              <button
                onClick={() => setActiveSidebarTab('settings')}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
                title="Account Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Content Area (Swaps based on activeSidebarTab with Persistent Sidebar) ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#07090e] overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between shrink-0 bg-[#080a0f]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span className="text-zinc-200 font-semibold uppercase tracking-wider">
                {activeSidebarTab === 'projects' && 'Projects & Apps'}
                {activeSidebarTab === 'blueprints' && 'Starter Blueprints'}
                {activeSidebarTab === 'components' && 'Modular UI Components'}
                {activeSidebarTab === 'storage' && 'Storage & State'}
                {activeSidebarTab === 'deployments' && 'Deployments & Production'}
                {activeSidebarTab === 'activity' && 'Workspace Activity Log'}
                {activeSidebarTab === 'showcase' && 'Community Showcase'}
                {activeSidebarTab === 'settings' && 'Engine & API Settings'}
                {activeSidebarTab === 'docs' && 'Developer Documentation'}
              </span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-500">
                {activeSidebarTab === 'projects' ? `${projects.length} Total` : 'Workspace Management'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateProjectSafe}
              disabled={isAtProjectLimit}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                isAtProjectLimit
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/40'
                  : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm active:scale-95'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>

            <button
              onClick={() => navigateTo('studio')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Studio</span>
            </button>
          </div>
        </header>

        {/* Dynamic Content View Router */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* TAB 1: MY PROJECTS */}
          {activeSidebarTab === 'projects' && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              {/* Sleek Synthesis Command Bar (Replaced AI Slop Hero) */}
              <div className="rounded-2xl bg-[#0d1017] border border-zinc-800/90 p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Fast Synthesizer
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      React 18 • Tailwind CSS • Lucide Icons
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Model: <span className="text-zinc-200 font-semibold">{selectedModel}</span>
                  </span>
                </div>

                <form onSubmit={handleQuickPromptSubmit} className="space-y-3">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={quickPrompt}
                      onChange={(e) => setQuickPrompt(e.target.value)}
                      placeholder="Describe what to generate (e.g. Minimalist crypto portfolio with price alert drawer and sparkline chart)..."
                      className="w-full h-12 bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 pr-32 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!quickPrompt.trim() || isAtProjectLimit}
                      className={`absolute right-1.5 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        !quickPrompt.trim() || isAtProjectLimit
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                          : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-md active:scale-95'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-zinc-950" />
                      <span>Synthesize</span>
                    </button>
                  </div>

                  {/* Prompt Preset Chips */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] text-zinc-500 font-mono">Presets:</span>
                    {PROMPT_SUGGESTIONS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setQuickPrompt(item.prompt)}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800/80 transition"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </form>
              </div>

              {/* Developer Telemetry & Quota Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-[#0c0e14] border border-zinc-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400 font-medium">Project Quota</span>
                    <FolderKanban className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {projectCount} <span className="text-xs text-zinc-500 font-normal">/ {MAX_FREE_PROJECTS} Max</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 mt-2.5 overflow-hidden">
                    <div className="h-full bg-zinc-300 rounded-full" style={{ width: `${quotaPercent}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0c0e14] border border-zinc-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400 font-medium">Active Workspace</span>
                    <Code2 className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-100 truncate">
                    {activeProject ? activeProject.name : 'No Project Active'}
                  </div>
                  <button 
                    onClick={() => navigateTo('studio')}
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-2 font-medium"
                  >
                    <span>Resume in Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#0c0e14] border border-zinc-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400 font-medium">Total Files</span>
                    <FileCode className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="text-xl font-bold text-white font-mono">
                    {totalFilesCount} <span className="text-xs text-zinc-500 font-normal">JSX, CSS, HTML</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-2">Compiled across workspace</p>
                </div>

                <div className="p-4 rounded-xl bg-[#0c0e14] border border-zinc-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400 font-medium">Production Export</span>
                    <Download className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-100">
                    Zero Setup ZIP
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-2">Self-contained Vite bundle</p>
                </div>
              </div>

              {/* Projects Library Filter Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterType === 'all'
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    All Projects ({projects.length})
                  </button>
                  <button
                    onClick={() => setFilterType('recent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterType === 'recent'
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Recently Updated
                  </button>
                  <button
                    onClick={() => setFilterType('modular')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      filterType === 'modular'
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Modular
                  </button>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search projects..."
                      className="w-full h-8 pl-8 pr-3 text-xs bg-zinc-900/60 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                    />
                  </div>

                  <div className="flex items-center bg-zinc-900/60 border border-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                      title="List View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Projects Grid / List Display */}
              {filteredProjects.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-800/80 bg-zinc-950/40">
                  <FolderKanban className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-white">No projects found</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                    {searchQuery ? 'No projects match your search query.' : 'Create your first project or launch a starter blueprint.'}
                  </p>
                  <button
                    onClick={handleCreateProjectSafe}
                    disabled={isAtProjectLimit}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 text-black hover:bg-white transition"
                  >
                    + Create Project
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                  {filteredProjects.map((project) => {
                    const isActive = project.id === activeProjectId;
                    const fileCount = Object.keys(project.files || {}).length;
                    const isEditing = editingId === project.id;

                    return (
                      <div
                        key={project.id}
                        onClick={() => onSelectProject(project)}
                        className={`group rounded-xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          isActive
                            ? 'bg-[#0f121a] border-cyan-700/50 shadow-md'
                            : 'bg-[#0b0d13] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#0e1017]'
                        }`}
                      >
                        <div>
                          {/* Live Visual Preview of what was built */}
                          <ProjectPreviewThumbnail
                            files={project.files}
                            title={project.name}
                            onQuickPreview={() => setPreviewModalProject(project)}
                            onOpenStudio={() => onSelectProject(project)}
                          />

                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-zinc-800/90 flex items-center justify-center text-zinc-300 shrink-0 border border-zinc-700/50">
                                <Code2 className="w-3.5 h-3.5" />
                              </div>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onBlur={(e) => handleSaveRename(project, e)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(project, e)}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-semibold bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white focus:outline-none"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition">
                                  {project.name}
                                </span>
                              )}
                            </div>

                            {isActive && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shrink-0">
                                Active
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3 min-h-[32px]">
                            {project.prompt || 'Synthesized React 18 Application with modular architecture.'}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{fileCount} {fileCount === 1 ? 'file' : 'files'}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(project.updatedAt)}</span>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => handleStartRename(project, e)}
                              className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-200"
                              title="Rename Project"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleOpenPreviewTab(project, e)}
                              className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-200"
                              title="Open Standalone Preview"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleExportZip(project, e)}
                              className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-200"
                              title="Export Project ZIP"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateProject(project.id);
                              }}
                              className="p-1 rounded hover:bg-zinc-800 hover:text-zinc-200"
                              title="Duplicate Project"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete "${project.name}"?`)) {
                                  onDeleteProject(project.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-rose-950/60 hover:text-rose-400"
                              title="Delete Project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="rounded-xl border border-zinc-800/80 bg-[#090b10] divide-y divide-zinc-800/60 pb-12 overflow-hidden">
                  {filteredProjects.map((project) => {
                    const isActive = project.id === activeProjectId;
                    const fileCount = Object.keys(project.files || {}).length;

                    return (
                      <div
                        key={project.id}
                        onClick={() => onSelectProject(project)}
                        className={`px-4 py-3 flex items-center justify-between hover:bg-zinc-900/60 cursor-pointer transition ${
                          isActive ? 'bg-zinc-900/40' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Code2 className="w-4 h-4 text-zinc-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate flex items-center gap-2">
                              <span>{project.name}</span>
                              {isActive && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 truncate max-w-md">
                              {project.prompt || 'React 18 Application'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                          <span className="font-mono text-[11px]">{fileCount} files</span>
                          <span className="text-[11px]">{formatTimeAgo(project.updatedAt)}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewModalProject(project);
                              }}
                              className="p-1.5 rounded hover:bg-zinc-800 hover:text-cyan-400 transition"
                              title="Live Interactive Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleOpenPreviewTab(project, e)}
                              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white"
                              title="Preview in Tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleExportZip(project, e)}
                              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white"
                              title="Export ZIP"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete "${project.name}"?`)) {
                                  onDeleteProject(project.id);
                                }
                              }}
                              className="p-1.5 rounded hover:bg-rose-950/60 hover:text-rose-400"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: STARTER BLUEPRINTS */}
          {activeSidebarTab === 'blueprints' && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Production Starter Blueprints</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Verified modular React 18 templates ready for instant launch in Studio.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
                {STARTER_TEMPLATES.map((tmpl) => (
                  <div 
                    key={tmpl.id}
                    className="p-5 rounded-2xl bg-[#0a0d14] border border-zinc-800/80 hover:border-zinc-700 flex flex-col justify-between transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-900 text-[10px] font-mono text-zinc-300 border border-zinc-800">
                          {tmpl.category}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">React 18</span>
                      </div>
                      <ProjectPreviewThumbnail
                        files={tmpl.files}
                        title={tmpl.name}
                        onQuickPreview={() => setPreviewModalProject({ ...tmpl, files: tmpl.files })}
                        onOpenStudio={() => onLoadTemplate(tmpl)}
                      />
                      <h4 className="text-sm font-bold text-white mb-1.5">{tmpl.name}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4">{tmpl.description}</p>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {tmpl.tags?.map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded-md bg-zinc-900/80 text-[10px] text-zinc-400 border border-zinc-800/60">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const doc = buildPreviewDoc(tmpl.files || {});
                          if (!doc) return;
                          const blob = new Blob([doc], { type: 'text/html' });
                          window.open(URL.createObjectURL(blob), '_blank');
                        }}
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => onLoadTemplate(tmpl)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition flex items-center gap-1.5"
                      >
                        <span>Use Blueprint</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COMPONENT LIBRARY */}
          {activeSidebarTab === 'components' && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Modular UI Components</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Production components engineered for React 18 & Tailwind CSS. Copy clean JSX into your apps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-12">
                {MODULAR_COMPONENTS.map((comp) => (
                  <div key={comp.id} className="p-5 rounded-2xl bg-[#0b0e15] border border-zinc-800/90 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">{comp.name}</span>
                        <span className="px-2 py-0.5 rounded bg-zinc-900 text-[10px] font-mono text-zinc-300 border border-zinc-800">
                          {comp.badge}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-3">{comp.description}</p>
                      <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-48 mb-3">
                        {comp.code}
                      </pre>
                    </div>
                    <div className="flex items-center justify-end pt-2 border-t border-zinc-800/60">
                      <button
                        onClick={() => handleCopyCode(comp)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition"
                      >
                        {copiedComponentId === comp.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Copied to Clipboard</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy JSX Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: STORAGE & STATE INSPECTOR */}
          {activeSidebarTab === 'storage' && (
            <div className="p-6 max-w-5xl mx-auto space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Storage & State Inspector</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Inspect and manage local workspace state, project records, and cached browser keys.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0c0f16] border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Local Workspace Storage</h4>
                    <p className="text-xs text-zinc-400">Contains {projects.length} project models and active settings.</p>
                  </div>
                  <button
                    onClick={() => {
                      const data = JSON.stringify(projects, null, 2);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `aethercraft_workspace_backup_${Date.now()}.json`;
                      a.click();
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Workspace JSON</span>
                  </button>
                </div>

                <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-4 font-mono text-xs text-zinc-300">
                  <div className="text-zinc-500 mb-2">// Current Projects JSON Schema</div>
                  <pre className="max-h-72 overflow-y-auto">
                    {JSON.stringify(projects.map(p => ({ id: p.id, name: p.name, filesCount: Object.keys(p.files || {}).length, updatedAt: p.updatedAt })), null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DEPLOYMENTS & EXPORTS */}
          {activeSidebarTab === 'deployments' && (
            <div className="p-6 max-w-5xl mx-auto space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Deployments & Production Bundles</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Export standard Vite + React packages for deployment on Vercel, Netlify, or AWS.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#0c0f16] border border-zinc-800/80 flex flex-col justify-between">
                  <div>
                    <Globe className="w-6 h-6 text-cyan-400 mb-3" />
                    <h4 className="text-sm font-bold text-white">Instant ZIP Package</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Generates a complete project directory with package.json, vite.config.js, index.html, Tailwind CSS, and all modular JSX components.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (activeProject) {
                        handleExportZip(activeProject, { stopPropagation: () => {} });
                      } else {
                        alert('Select an active project first.');
                      }
                    }}
                    className="mt-6 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Active App ZIP</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c0f16] border border-zinc-800/80 flex flex-col justify-between">
                  <div>
                    <Code2 className="w-6 h-6 text-purple-400 mb-3" />
                    <h4 className="text-sm font-bold text-white">One-Command Dev Server</h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Run locally with standard Node.js & npm:
                    </p>
                    <pre className="mt-3 p-3 rounded-lg bg-zinc-950 font-mono text-[11px] text-zinc-300 border border-zinc-800">
                      unzip app.zip
cd app
npm install
npm run dev
                    </pre>
                  </div>
                  <div className="mt-4 text-[11px] text-zinc-500">
                    Compatible with Node 18+, Vite 5+, React 18+.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ACTIVITY LOG */}
          {activeSidebarTab === 'activity' && (
            <div className="p-6 max-w-4xl mx-auto space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Workspace Activity Log</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Timestamped audit trail of app creations, blueprint imports, and exports.
                </p>
              </div>

              <div className="rounded-2xl bg-[#0b0e15] border border-zinc-800/80 divide-y divide-zinc-800/60 p-4">
                {projects.map((p, idx) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <div>
                        <span className="text-white font-medium">Updated "{p.name}"</span>
                        <span className="text-zinc-500 ml-2 font-mono text-[10px]">
                          {Object.keys(p.files || {}).length} files compiled
                        </span>
                      </div>
                    </div>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      {formatTimeAgo(p.updatedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SHOWCASE */}
          {activeSidebarTab === 'showcase' && (
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div>
                <h3 className="text-base font-bold text-white">Community & Featured Showcase</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Curated applications created with AetherCraft React 18 synthesizer.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
                {STARTER_TEMPLATES.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-zinc-800/80 bg-[#0c0f16] p-5 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-mono text-zinc-500 uppercase mb-1">{item.category}</div>
                      <h4 className="text-sm font-bold text-white mb-2">{item.name}</h4>
                      <p className="text-xs text-zinc-400 mb-4">{item.tagline}</p>
                    </div>
                    <button
                      onClick={() => onLoadTemplate(item)}
                      className="w-full py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Fork into Workspace</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: ENGINE SETTINGS (INLINE DEVELOPER PANEL) */}
          {activeSidebarTab === 'settings' && (
            <div className="p-6 max-w-4xl mx-auto space-y-6 pb-12">
              <div>
                <h3 className="text-base font-bold text-white">Engine Configuration & API Keys</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure your OpenRouter API key and preferred synthesis model.
                </p>
              </div>

              {/* API Key Input */}
              <div className="p-5 rounded-2xl bg-[#0c0f16] border border-zinc-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-zinc-400" />
                    <h4 className="text-xs font-bold text-white uppercase font-mono">OpenRouter API Key</h4>
                  </div>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 underline"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="flex-1 h-10 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                  <button
                    onClick={handleTestApiKey}
                    disabled={testingKey}
                    className="px-4 h-10 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition flex items-center gap-1.5 shrink-0"
                  >
                    {testingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Test Connection</span>
                  </button>
                </div>

                {testResult && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                  }`}>
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                    <span>{testResult.msg}</span>
                  </div>
                )}
              </div>

              {/* Model Selector */}
              <div className="p-5 rounded-2xl bg-[#0c0f16] border border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className="w-4 h-4 text-zinc-400" />
                  <h4 className="text-xs font-bold text-white uppercase font-mono">Synthesis Engine Model</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AVAILABLE_MODELS.map((m) => {
                    const isSelected = selectedModel === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedModel(m.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-zinc-800/90 border-white/60 shadow-sm'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{m.name}</span>
                          {m.isFree ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                              FREE
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                              PAID
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-mono">{m.badge}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Save Settings Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveInlineSettings}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition shadow"
                >
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* TAB 9: DOCUMENTATION & ENGINE SPECS */}
          {activeSidebarTab === 'docs' && (
            <div className="p-6 max-w-4xl mx-auto space-y-6 pb-12">
              <div>
                <h3 className="text-base font-bold text-white">Developer Documentation & Architecture</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Reference guide for the AetherCraft React 18 compilation engine and code conventions.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-[#0c0f16] border border-zinc-800/80 space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    1. React 18 Compilation Engine
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    AetherCraft executes a real-time Babel standalone transform on generated JSX. All components are mounted inside an isolated sandbox iframe with full React 18 Concurrent features, StrictMode emulation, and Tailwind CSS 3.x CDN injection.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c0f16] border border-zinc-800/80 space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    2. Lucide Icon Integration
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    You can import any Lucide icon directly using standard ES module syntax:
                  </p>
                  <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300">
                    import &#123; Plus, Trash2, Search, Filter &#125; from 'lucide-react';
                  </pre>
                </div>

                <div className="p-5 rounded-2xl bg-[#0c0f16] border border-zinc-800/80 space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    3. State & Persistence Pattern
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Always use safe lazy initialization for localStorage in your generated components:
                  </p>
                  <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-300">
                    const [items, setItems] = useState(() =&gt; &#123;\n  try &#123;\n    const saved = localStorage.getItem('app_items');\n    return saved ? JSON.parse(saved) : DEFAULT_ITEMS;\n  &#125; catch &#123;\n    return DEFAULT_ITEMS;\n  &#125;\n&#125;);
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      
      {/* ── Interactive Live Preview Modal (Desktop / Tablet / Mobile) ── */}
      {previewModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-5xl h-[85vh] bg-[#0b0e15] border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Top Bar */}
            <div className="h-12 border-b border-zinc-800 px-4 flex items-center justify-between shrink-0 bg-[#090b10]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                  {previewModalProject.name}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700 shrink-0">
                  Interactive Live Sandbox
                </span>
              </div>

              {/* Device Switcher */}
              <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setPreviewDeviceMode('desktop')}
                  className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition ${
                    previewDeviceMode === 'desktop' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setPreviewDeviceMode('tablet')}
                  className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition ${
                    previewDeviceMode === 'tablet' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet</span>
                </button>
                <button
                  onClick={() => setPreviewDeviceMode('mobile')}
                  className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition ${
                    previewDeviceMode === 'mobile' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenPreviewTab(previewModalProject, { stopPropagation: () => {} });
                  }}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                  title="Open in new browser tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onSelectProject(previewModalProject);
                    setPreviewModalProject(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition"
                >
                  Edit in Studio
                </button>
                <button
                  onClick={() => setPreviewModalProject(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Iframe Sandbox Container */}
            <div className="flex-1 bg-[#07090e] p-4 flex items-center justify-center overflow-hidden">
              <div className={`h-full transition-all duration-300 rounded-xl overflow-hidden border border-zinc-800 shadow-2xl bg-white ${
                previewDeviceMode === 'mobile' 
                  ? 'w-[375px]' 
                  : previewDeviceMode === 'tablet' 
                  ? 'w-[768px]' 
                  : 'w-full'
              }`}>
                <iframe
                  srcDoc={(() => { try { return buildPreviewDoc(previewModalProject.files || {}); } catch { return ''; } })()}
                  title={previewModalProject.name}
                  sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
