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
  Share2
} from 'lucide-react';
import { useUser } from '@clerk/react';
import { formatTimeAgo, saveProject } from '../services/projectService.js';
import { downloadProjectZip } from '../utils/zipExporter.js';
import { buildPreviewDoc } from '../utils/previewBuilder.js';
import { STARTER_TEMPLATES } from '../templates/starterTemplates.js';

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
  navigateTo
}) {
  const { user, isLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'recent'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [quickPrompt, setQuickPrompt] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  // Total files count across all projects
  const totalFilesCount = useMemo(() => {
    return projects.reduce((acc, p) => acc + Object.keys(p.files || {}).length, 0);
  }, [projects]);

  // Filter projects by search query
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
    onLaunchWithPrompt(quickPrompt.trim());
    setQuickPrompt('');
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

  return (
    <div className="min-h-screen bg-[#080a0f] text-zinc-100 py-10 px-6 max-w-7xl mx-auto select-none">
      {/* ── Dashboard Hero Banner ── */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-zinc-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold mb-3 font-mono">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>PROJECT MANAGEMENT DASHBOARD</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Welcome back, {displayName}
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl font-light leading-relaxed">
            Manage your synthesized full-stack React applications, review component architecture, or spin up a new build.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onCreateNewProject('New Project', '')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition shadow-lg shadow-white/5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Projects</span>
            <FolderKanban className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{projects.length}</div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">Saved in local storage</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Total Files</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalFilesCount}</div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">Modular components & styles</div>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Workspace</span>
            <Code2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-semibold text-zinc-200 truncate mt-1">
            {projects.find(p => p.id === activeProjectId)?.name || 'None'}
          </div>
          <button 
            onClick={() => navigateTo('studio')}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono mt-1 text-left flex items-center gap-1"
          >
            Open Studio &rarr;
          </button>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Engine Status</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-sm font-semibold text-zinc-200">React 18 Ready</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">Free openrouter enabled</div>
        </div>
      </div>

      {/* ── Quick AI Prompt Launcher ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-900/90 via-[#0d1017] to-zinc-900/90 border border-zinc-800/80 mb-12 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Start Building Immediately</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-4 font-light">
          Describe what web application you want to build. AetherCraft will synthesize all modular components and take you straight into the live sandbox.
        </p>

        <form onSubmit={handleQuickPromptSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="e.g. Build an artisanal ceramic store with cart & interactive product gallery..."
              className="w-full px-4 py-3 bg-black/60 border border-zinc-700/80 rounded-xl text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>
          <button
            type="submit"
            disabled={!quickPrompt.trim()}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black font-semibold text-xs tracking-tight transition flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-cyan-950/40"
          >
            <span>Synthesize App</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* ── Main Projects Section ── */}
      <div className="mb-8">
        {/* Section Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">Your Projects</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-xs font-mono text-zinc-400 border border-zinc-700/60">
              {filteredProjects.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="pl-9 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition w-48 sm:w-64"
              />
            </div>

            {/* Grid / List View Switcher */}
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

        {/* ── Projects Display ── */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4 shadow-inner">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200 mb-1">
              {searchQuery ? 'No matching projects' : 'No projects created yet'}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mb-6 font-light">
              {searchQuery 
                ? 'Try searching with a different prompt or project title.' 
                : 'Start your first software build from the prompt bar above or launch a blank studio canvas.'}
            </p>
            <button
              onClick={() => onCreateNewProject('New Project', '')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Grid View ── */
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
                    {/* Top Row: Icon + Title + Active Pill */}
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

                    {/* Prompt Summary */}
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed font-light">
                      {project.prompt || 'Custom synthesized fullstack application.'}
                    </p>

                    {/* Files Tag Pills */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {fileList.slice(0, 4).map((fname, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/60 text-[10px] font-mono text-zinc-300">
                          {fname.split('/').pop()}
                        </span>
                      ))}
                      {fileList.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-500">
                          +{fileList.length - 4} more
                        </span>
                      )}
                      {hasModular && (
                        <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-[10px] font-mono text-purple-300">
                          Modular
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
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
          /* ── List View ── */
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

                  <div className="flex items-center gap-6 shrink-0">
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

      {/* ── Starter Templates Shelf ── */}
      <div className="pt-10 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Clone Starter Blueprints</h2>
            <p className="text-xs text-zinc-500 font-light">Explore pre-configured modular applications with rich client-side state.</p>
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
              className="p-4 rounded-xl bg-zinc-900/30 hover:bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer flex flex-col justify-between group"
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
                <h3 className="text-xs font-semibold text-zinc-200 group-hover:text-white mb-1">
                  {tmpl.name}
                </h3>
                <p className="text-[11px] text-zinc-500 line-clamp-2 mb-3">
                  {tmpl.description}
                </p>
              </div>

              <button
                onClick={() => onLoadTemplate(tmpl)}
                className="w-full py-1.5 rounded-lg bg-zinc-800/60 group-hover:bg-zinc-800 text-zinc-300 group-hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
              >
                <span>Clone into Studio</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
