import React, { useState, useMemo } from 'react';
import { 
  X, 
  FolderKanban, 
  Plus, 
  Search, 
  Trash2, 
  Download, 
  Copy, 
  ExternalLink, 
  Clock, 
  FileCode, 
  Code2, 
  Palette, 
  Globe, 
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatTimeAgo } from '../services/projectService.js';
import { downloadProjectZip } from '../utils/zipExporter.js';

export default function ProjectsModal({
  isOpen,
  onClose,
  projects = [],
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onDeleteProject,
  onDuplicateProject
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.prompt && p.prompt.toLowerCase().includes(q))
    );
  }, [projects, searchQuery]);

  if (!isOpen) return null;

  const handleExportZip = (project, e) => {
    e.stopPropagation();
    downloadProjectZip(project.files || {}, project.name || 'aethercraft-app');
  };

  const handleDuplicate = (project, e) => {
    e.stopPropagation();
    if (onDuplicateProject) {
      onDuplicateProject(project.id);
    }
  };

  const handleDelete = (project, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete project "${project.name}"? This action cannot be undone.`)) {
      if (onDeleteProject) {
        onDeleteProject(project.id);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn select-none">
      <div 
        className="w-full max-w-4xl bg-[#0b0d13] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#08090e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shadow-inner">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white tracking-tight">Project Library</h2>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-[11px] font-mono text-zinc-300">
                  {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Switch between, view, or export previously created web applications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onCreateNewProject) onCreateNewProject();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-xs font-semibold text-black transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-5 py-3 border-b border-zinc-800/60 bg-[#090b10] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search previous projects by name or prompt..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
            />
          </div>

          <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
            Saved automatically in local browser storage
          </span>
        </div>

        {/* Projects Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredProjects.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-3">
                <FolderKanban className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-300 mb-1">
                {searchQuery ? 'No matching projects found' : 'No previous projects yet'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-xs mb-4">
                {searchQuery ? 'Try searching with a different keyword.' : 'Generate software in the studio or start a new project to see it here.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    if (onCreateNewProject) onCreateNewProject();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition border border-zinc-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Start New Project
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => {
                const isActive = activeProjectId === project.id;
                const fileList = Object.keys(project.files || {});
                const hasReact = fileList.some(f => f.endsWith('.jsx') || f.endsWith('.tsx'));

                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      onSelectProject(project);
                      onClose();
                    }}
                    className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer border flex flex-col justify-between ${
                      isActive
                        ? 'bg-zinc-900/90 border-cyan-500/60 shadow-lg shadow-cyan-950/20'
                        : 'bg-zinc-900/40 hover:bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      {/* Card Top Row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${
                            isActive 
                              ? 'bg-cyan-950/60 border-cyan-800/80 text-cyan-400' 
                              : 'bg-zinc-800 border-zinc-700/80 text-zinc-400'
                          }`}>
                            <Code2 className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                            {project.name}
                          </h3>
                        </div>

                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-[10px] font-mono text-cyan-400 font-medium shrink-0">
                            Active in Studio
                          </span>
                        )}
                      </div>

                      {/* Prompt Snippet */}
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3 leading-relaxed font-light">
                        {project.prompt || 'Custom synthesized application'}
                      </p>
                    </div>

                    {/* Card Footer & Actions */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-3 border-t border-zinc-800/60">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-600" />
                            {formatTimeAgo(project.updatedAt)}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span>{fileList.length} {fileList.length === 1 ? 'file' : 'files'}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => handleExportZip(project, e)}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                            title="Download ZIP"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDuplicate(project, e)}
                            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                            title="Duplicate Project"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(project, e)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition"
                            title="Delete Project"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#08090e] px-5 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-mono text-[11px]">Ready • Click any project to open in Studio</span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition border border-zinc-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
