import React from 'react';
import { 
  History, 
  X, 
  RotateCcw, 
  Clock, 
  FileCode2, 
  Trash2, 
  Sparkles,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { formatTimeAgo } from '../services/projectService.js';

export default function VersionHistoryModal({
  isOpen,
  onClose,
  versions = [],
  activeProjectName = '',
  onRestoreVersion,
  onDeleteVersion
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-[#0f1117] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                Version History
                <span className="text-[10px] font-mono text-zinc-400 font-normal bg-zinc-800 px-2 py-0.5 rounded">
                  {versions.length} {versions.length === 1 ? 'checkpoint' : 'checkpoints'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 truncate max-w-md">
                {activeProjectName || 'Current Project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Versions Timeline List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {versions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <History className="w-10 h-10 text-zinc-600 mx-auto mb-3 stroke-[1.5]" />
              <h4 className="text-sm font-medium text-zinc-300 mb-1">No Version Checkpoints Yet</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Checkpoints are automatically created every time the AI synthesizes files, or whenever you modify project code.
              </p>
            </div>
          ) : (
            versions.map((ver, idx) => {
              const fileKeys = Object.keys(ver.files || {});
              const isLatest = idx === 0;

              return (
                <div
                  key={ver.id || idx}
                  className="rounded-xl bg-zinc-900/50 border border-zinc-800/90 hover:border-zinc-700/80 p-3.5 transition group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="mt-0.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${isLatest ? 'bg-cyan-400 ring-4 ring-cyan-400/20' : 'bg-zinc-600'}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                            {ver.label || `Checkpoint #${versions.length - idx}`}
                          </span>
                          {isLatest && (
                            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        {ver.prompt && (
                          <div className="text-xs text-zinc-400 line-clamp-1 italic mt-0.5">
                            "{ver.prompt}"
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(ver.createdAt)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <FileCode2 className="w-3 h-3" />
                            {ver.fileCount || fileKeys.length} files
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onRestoreVersion?.(ver);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-cyan-600 hover:text-white text-zinc-200 text-xs font-medium transition border border-zinc-700 cursor-pointer group/btn"
                        title="Restore this version"
                      >
                        <RotateCcw className="w-3.5 h-3.5 group-hover/btn:-rotate-45 transition-transform" />
                        <span>Restore</span>
                      </button>
                      {onDeleteVersion && versions.length > 1 && (
                        <button
                          onClick={() => onDeleteVersion(ver.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/80 transition"
                          title="Delete checkpoint"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* File Chips */}
                  {fileKeys.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap gap-1.5">
                      {fileKeys.slice(0, 6).map((path) => (
                        <span
                          key={path}
                          className="text-[10px] font-mono text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-800 truncate max-w-[180px]"
                        >
                          {path}
                        </span>
                      ))}
                      {fileKeys.length > 6 && (
                        <span className="text-[10px] font-mono text-zinc-500 px-1 py-0.5">
                          +{fileKeys.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between text-xs text-zinc-500">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Checkpoints preserve entire workspace state, components, and styles.
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
