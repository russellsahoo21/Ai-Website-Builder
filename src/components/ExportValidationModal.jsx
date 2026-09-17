import React from 'react';
import { 
  AlertTriangle, 
  X, 
  Sparkles, 
  Download, 
  FileCode2, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';

export default function ExportValidationModal({
  isOpen,
  onClose,
  validationResult,
  onConfirmExport,
  onAutoFix
}) {
  if (!isOpen || !validationResult) return null;

  const { errors = [], warnings = [], totalFiles = 0 } = validationResult;
  const hasErrors = errors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-[#0f1117] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasErrors ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400' : 'bg-amber-500/10 border border-amber-500/30 text-amber-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                Export Build Check
                <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${hasErrors ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60' : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'}`}>
                  {hasErrors ? `${errors.length} build error${errors.length > 1 ? 's' : ''}` : `${warnings.length} warning${warnings.length > 1 ? 's' : ''}`}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                AetherCraft detected potential issues before exporting your {totalFiles} files.
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

        {/* Issue List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Errors */}
          {errors.map((err, idx) => (
            <div
              key={`err_${idx}`}
              className="rounded-xl bg-rose-950/20 border border-rose-900/40 p-3 text-xs space-y-1"
            >
              <div className="flex items-center justify-between text-rose-300 font-mono font-semibold text-[11px]">
                <span className="flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-rose-400" />
                  {err.file}{err.line ? `:${err.line}${err.column ? `:${err.column}` : ''}` : ''}
                </span>
                <span className="text-[10px] uppercase bg-rose-900/40 px-1.5 py-0.2 rounded text-rose-400">
                  Syntax Error
                </span>
              </div>
              <p className="text-zinc-300 font-mono text-[11px] leading-relaxed break-all">
                {err.message}
              </p>
            </div>
          ))}

          {/* Warnings */}
          {warnings.map((warn, idx) => (
            <div
              key={`warn_${idx}`}
              className="rounded-xl bg-amber-950/20 border border-amber-900/40 p-3 text-xs space-y-1"
            >
              <div className="flex items-center justify-between text-amber-300 font-mono font-semibold text-[11px]">
                <span className="flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
                  {warn.file}
                </span>
                <span className="text-[10px] uppercase bg-amber-900/40 px-1.5 py-0.2 rounded text-amber-400">
                  Missing Import
                </span>
              </div>
              <p className="text-zinc-300 font-mono text-[11px] leading-relaxed">
                {warn.message}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {onAutoFix && hasErrors && (
              <button
                onClick={() => {
                  onAutoFix(errors[0]?.message || 'Fix build error');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Fix with AI</span>
              </button>
            )}

            <button
              onClick={() => {
                onConfirmExport();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium transition"
              title="Download anyway"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Anyway</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
