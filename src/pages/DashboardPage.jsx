import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  Copy, 
  ExternalLink, 
  Clock, 
  Code2, 
  Palette, 
  Globe, 
  Sparkles, 
  ArrowRight, 
  LayoutDashboard,
  Layers,
  FileCode,
  LayoutGrid,
  List,
  Edit2,
  Check,
  Zap,
  CheckCircle2,
  Share2,
  Settings,
  BookOpen,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Key,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  User,
  LogOut,
  Sliders
} from 'lucide-react';
import { useUser, UserButton } from '@clerk/react';
import { formatTimeAgo } from '../services/projectService.js';
import { downloadProjectZip } from '../utils/zipExporter.js';
import { buildPreviewDoc } from '../utils/previewBuilder.js';
import { STARTER_TEMPLATES } from '../templates/starterTemplates.js';

export const MAX_FREE_PROJECTS = 5;

const PROMPT_CHIPS = [
  'Fintech Expense Tracker with Analytics',
  'Luxury Architecture Studio & Gallery',
  'SaaS Subscription & Analytics Dashboard',
  'Artisanal Ceramic Store with Cart'
];

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
  navigateTo
}) {
  const { user, isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'recent' | 'modular'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [quickPrompt, setQuickPrompt] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState('projects'); // 'projects' | 'templates'

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

  const displayName = isLoaded && user?.firstName ? user.firstName : 'Creator';
  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className="w-screen h-screen flex bg-[#07090e] text-zinc-100 overflow-hidden font-sans select-none">
      {/* ── Left Sidebar (Dashboard Navigation & Usage Tracker) ── */}
      <aside className={`${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      } bg-[#090b10] border-r border-zinc-800/80 flex flex-col justify-between transition-all duration-300 shrink-0 z-30`}>
        {/* Sidebar Top: Logo & Workspace Switcher */}
        <div>
          <div className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-xs text-black shadow-md">
                  A
                </div>
                <div>
                  <div className="font-bold text-xs tracking-tight text-white flex items-center gap-1.5">
                    <span>AetherCraft</span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-[9px] text-cyan-400 font-mono border border-cyan-800/60">
                      FREE
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                    {displayName}'s Workspace
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center font-bold text-xs text-black mx-auto">
                A
              </div>
            )}

            <button
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Sidebar Nav Items */}
          <div className="p-3 space-y-1">
            <button
              onClick={() => {
                setActiveSidebarTab('projects');
                setFilterType('all');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeSidebarTab === 'projects'
                  ? 'bg-zinc-800 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
              title="All Projects"
            >
              <div className="flex items-center gap-2.5">
                <FolderKanban className="w-4 h-4 text-cyan-400" />
                {!isSidebarCollapsed && <span>My Projects</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isAtProjectLimit 
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60' 
                    : 'bg-zinc-900 text-zinc-400'
                }`}>
                  {projectCount}/{MAX_FREE_PROJECTS}
                </span>
              )}
            </button>

            <button
              onClick={() => navigateTo('templates')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition"
              title="Starter Blueprints"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-purple-400" />
                {!isSidebarCollapsed && <span>Blueprints</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[10px] text-zinc-600 font-mono">
                  {STARTER_TEMPLATES.length}
                </span>
              )}
            </button>

            <button
              onClick={() => navigateTo('showcase')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition"
              title="Community Showcase"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              {!isSidebarCollapsed && <span>Showcase</span>}
            </button>

            <button
              onClick={() => {
                if (onOpenSettings) onOpenSettings();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition"
              title="Studio Settings & API Keys"
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              {!isSidebarCollapsed && <span>Settings</span>}
            </button>

            <button
              onClick={() => navigateTo('docs')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition"
              title="Documentation"
            >
              <BookOpen className="w-4 h-4 text-zinc-400" />
              {!isSidebarCollapsed && <span>Docs</span>}
            </button>
          </div>
        </div>

        {/* Sidebar Bottom: Free Tier Quota Tracker & User Profile */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#07080d]">
          {/* Project Usage Tracker Card */}
          {!isSidebarCollapsed && (
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 mb-3 select-none">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1.5">
                <span className="font-semibold text-zinc-300">Free Tier Usage</span>
                <span className={isAtProjectLimit ? "text-amber-400 font-bold" : "text-cyan-400"}>
                  {projectCount} / {MAX_FREE_PROJECTS}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isAtProjectLimit 
                      ? 'bg-amber-400' 
                      : quotaPercent > 60 
                      ? 'bg-cyan-400' 
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>

              <div className="text-[10px] text-zinc-500 font-mono leading-tight">
                {isAtProjectLimit ? (
                  <span className="text-amber-400/90 flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    <span>Max projects reached (5/5)</span>
                  </span>
                ) : (
                  <span>{MAX_FREE_PROJECTS - projectCount} project slots available</span>
                )}
              </div>
            </div>
          )}

          {/* User Profile & Studio CTA */}
          <div className="flex items-center justify-between gap-2">
            {!isSidebarCollapsed ? (
              <div className="flex items-center gap-2 min-w-0">
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-200 truncate">{displayName}</div>
                  <div className="text-[10px] text-zinc-500 font-mono truncate">Free Tier</div>
                </div>
              </div>
            ) : (
              <div className="mx-auto">
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
              </div>
            )}

            {!isSidebarCollapsed && (
              <button
                onClick={() => navigateTo('studio')}
                className="p-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black transition shrink-0"
                title="Launch Code Studio"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#080a0f]/90 backdrop-blur shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-white tracking-tight">Dashboard Overview</h1>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-400 font-light">Workspace Management</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateProjectSafe}
              disabled={isAtProjectLimit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-semibold text-xs transition shadow-sm"
              title={isAtProjectLimit ? "Limit reached (5/5)" : "Create a new project"}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>

            <button
              onClick={() => navigateTo('studio')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-medium transition"
            >
              <span>Code Studio</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </header>

        {/* Dashboard Main Scrollable Body */}
        <div className="p-6 md:p-8 max-w-6xl w-full mx-auto space-y-8">
          {/* ── Hero Welcome & Synthesizer Prompt Box ── */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0c0f17] via-[#090b10] to-[#0d111a] border border-zinc-800/80 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI SOFTWARE SYNTHESIZER</span>
                </div>

                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                  React 18 • Tailwind CSS • Lucide Icons
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                What do you want to build today?
              </h2>
              <p className="text-xs text-zinc-400 font-light mb-5 max-w-2xl">
                Type your requirements in plain English. AetherCraft generates complete, modular full-stack React applications with state management and persistent storage.
              </p>

              {/* Prompt Input Form */}
              <form onSubmit={handleQuickPromptSubmit} className="relative flex flex-col sm:flex-row gap-2 mb-4">
                <input
                  type="text"
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  placeholder="e.g. Build an expense tracker with income/expense filters, charts, and localStorage..."
                  className="w-full px-4 py-3 bg-black/60 border border-zinc-700/80 rounded-xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
                />
                <button
                  type="submit"
                  disabled={!quickPrompt.trim() || isAtProjectLimit}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black font-semibold text-xs tracking-tight transition flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-cyan-950/30"
                >
                  <span>Synthesize</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Suggested Prompt Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-zinc-500">Inspirations:</span>
                {PROMPT_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setQuickPrompt(chip)}
                    className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition truncate max-w-[240px]"
                  >
                    • {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Relevant Workspace Stats Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Free Tier Quota (Real, High-Value) */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Project Quota</span>
                <FolderKanban className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                  <span>{projectCount}</span>
                  <span className="text-xs font-mono text-zinc-500 font-normal">/ {MAX_FREE_PROJECTS} Free Max</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${isAtProjectLimit ? 'bg-amber-400' : 'bg-cyan-400'}`} 
                    style={{ width: `${quotaPercent}%` }} 
                  />
                </div>
              </div>
              <div className="text-[11px] text-zinc-500 font-mono mt-2">
                {MAX_FREE_PROJECTS - projectCount} slots remaining
              </div>
            </div>

            {/* Stat 2: Active Workspace */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Active Workspace</span>
                <Code2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm font-semibold text-zinc-200 truncate mt-1">
                {activeProject?.name || 'No active project'}
              </div>
              <button
                onClick={() => navigateTo('studio')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono mt-2 text-left flex items-center gap-1"
              >
                <span>Resume in Studio</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Stat 3: Total Files Generated */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Components & Files</span>
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-white">{totalFilesCount}</div>
              <div className="text-[11px] text-zinc-500 font-mono mt-1">Modular JSX, CSS, HTML</div>
            </div>

            {/* Stat 4: Fast Export */}
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-400 mb-2">
                <span className="text-xs font-mono uppercase tracking-wider">Production Export</span>
                <Download className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-sm font-semibold text-zinc-200">Instant ZIP Package</div>
              <div className="text-[11px] text-zinc-500 font-mono mt-1">Zero build setup required</div>
            </div>
          </div>

          {/* ── Project Library Section ── */}
          <div>
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
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
                  Modular Components
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className="pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition w-44 sm:w-60"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="List View"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quota Limit Warning Alert if 5/5 reached */}
            {isAtProjectLimit && (
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 mb-6 flex items-center justify-between text-xs text-amber-200 font-mono">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    You have reached the free tier limit of <strong>5 projects</strong>. To create or synthesize a new project, please export or delete an existing one.
                  </span>
                </div>
              </div>
            )}

            {/* Project Cards Grid / List */}
            {filteredProjects.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-16 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4 shadow-inner">
                  <FolderKanban className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-zinc-200 mb-1">
                  {searchQuery ? 'No matching projects found' : 'No projects created yet'}
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mb-6 font-light">
                  {searchQuery 
                    ? 'Try searching with different terms or clear filters.' 
                    : 'Use the synthesizer box above or launch a blank studio workspace.'}
                </p>
                <button
                  onClick={handleCreateProjectSafe}
                  disabled={isAtProjectLimit}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 disabled:opacity-40 text-black font-semibold text-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Project</span>
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => {
                  const isActive = activeProjectId === project.id;
                  const fileList = Object.keys(project.files || {});
                  const hasModular = fileList.some(f => f.includes('/'));

                  return (
                    <div
                      key={project.id}
                      onClick={() => onSelectProject(project)}
                      className={`group rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-2xl ${
                        isActive
                          ? 'bg-zinc-900/90 border-cyan-500/70 shadow-lg shadow-cyan-950/20'
                          : 'bg-[#0d0f15]/80 hover:bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div>
                        {/* Top: Icon + Title + Active Pill */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                              isActive
                                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-400'
                                : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                            }`}>
                              <Code2 className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              {editingId === project.id ? (
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="px-2 py-0.5 bg-black border border-cyan-400 rounded text-xs font-semibold text-white focus:outline-none"
                                    autoFocus
                                  />
                                  <button
                                    onClick={(e) => handleSaveRename(project, e)}
                                    className="p-1 rounded bg-cyan-500 text-black hover:bg-cyan-400"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 group/title">
                                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition truncate">
                                    {project.name}
                                  </h3>
                                  <button
                                    onClick={(e) => handleStartRename(project, e)}
                                    className="opacity-0 group-hover/title:opacity-100 p-0.5 text-zinc-500 hover:text-zinc-200"
                                    title="Rename project"
                                  >
                                    <Edit2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                                <span>{formatTimeAgo(project.updatedAt)}</span>
                                <span>•</span>
                                <span>{fileList.length} {fileList.length === 1 ? 'file' : 'files'}</span>
                              </div>
                            </div>
                          </div>

                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] font-mono text-cyan-400 font-medium shrink-0">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Prompt Description */}
                        <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed font-light">
                          {project.prompt || 'Custom synthesized fullstack React application.'}
                        </p>

                        {/* Component File Pills */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {fileList.slice(0, 4).map((fname, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/60 text-[10px] font-mono text-zinc-300">
                              {fname.split('/').pop()}
                            </span>
                          ))}
                          {fileList.length > 4 && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-500">
                              +{fileList.length - 4}
                            </span>
                          )}
                          {hasModular && (
                            <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-[10px] font-mono text-purple-300">
                              Modular
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenPreviewTab(project, e)}
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                            title="Preview in Standalone Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleExportZip(project, e)}
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                            title="Download ZIP Archive"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isAtProjectLimit) {
                                alert(`Cannot duplicate: Free tier maximum is ${MAX_FREE_PROJECTS} projects.`);
                                return;
                              }
                              onDuplicateProject(project.id);
                            }}
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
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
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => onSelectProject(project)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-800 group-hover:bg-cyan-500 text-zinc-300 group-hover:text-black text-xs font-semibold transition"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {filteredProjects.map((project) => {
                  const isActive = activeProjectId === project.id;
                  const fileList = Object.keys(project.files || {});

                  return (
                    <div
                      key={project.id}
                      onClick={() => onSelectProject(project)}
                      className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-zinc-900 border-cyan-500/80 shadow-md'
                          : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isActive ? 'bg-cyan-950 border-cyan-700 text-cyan-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}>
                          <Code2 className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold text-white truncate">{project.name}</h3>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-[9px] font-mono text-cyan-400">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate max-w-md">{project.prompt}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 shrink-0">
                        <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                          {formatTimeAgo(project.updatedAt)}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
                          {fileList.length} files
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleOpenPreviewTab(project, e)}
                            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                            title="Preview"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleExportZip(project, e)}
                            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white"
                            title="Download ZIP"
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
                            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectProject(project)}
                            className="ml-2 px-3 py-1 rounded bg-zinc-800 hover:bg-white text-zinc-200 hover:text-black text-xs font-semibold transition"
                          >
                            Open
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Starter Blueprints Shelf ── */}
          <div className="pt-8 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Starter Blueprints</h3>
                <p className="text-xs text-zinc-500 font-light">Clone fully-functional client-side React 18 applications.</p>
              </div>
              <button
                onClick={() => navigateTo('templates')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>View all templates</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STARTER_TEMPLATES.slice(0, 3).map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => onLoadTemplate(tmpl)}
                  className="p-4 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {tmpl.category}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {Object.keys(tmpl.files).length} files
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white mb-1">
                      {tmpl.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3">
                      {tmpl.description}
                    </p>
                  </div>

                  <button
                    onClick={() => onLoadTemplate(tmpl)}
                    className="w-full py-1.5 rounded-lg bg-zinc-800/60 group-hover:bg-zinc-800 text-zinc-300 group-hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <span>Clone Template</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
