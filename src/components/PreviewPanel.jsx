import React, { useRef, useEffect, useState, useCallback } from 'react';
import SatisfyingLoader from './SatisfyingLoader';
import SandboxIframe from '../sandbox/SandboxIframe';
import { buildPreviewDoc } from '../utils/previewBuilder';
import { parseSandboxError } from '../sandbox/errorReporter';
import { AlertTriangle, Wrench, FileCode, X, Sparkles } from 'lucide-react';

export default function PreviewPanel({ 
  files, 
  viewport, 
  keyTrigger, 
  isGenerating, 
  telemetry, 
  promptText, 
  onCancel, 
  onSandboxError,
  onAutoFix,
  onViewCode,
  onMountSuccess,
  onPreviewStaged
}) {
  const [activeError, setActiveError] = useState(null);

  // Clear error whenever files or keyTrigger change (e.g. successful generation / edit)
  useEffect(() => {
    setActiveError(null);
  }, [files, keyTrigger]);

  const handleSandboxError = useCallback((err) => {
    const parsed = parseSandboxError(err);
    setActiveError(parsed);
    onSandboxError?.(err);
  }, [onSandboxError]);
  const getViewportClass = () => {
    switch (viewport) {
      case 'mobile': return 'w-[375px] h-[667px] my-auto rounded-[36px] border-[10px] border-zinc-800 shadow-2xl';
      case 'tablet': return 'w-[768px] h-[92%] my-auto rounded-2xl border-4 border-zinc-800 shadow-2xl';
      default: return 'w-full h-full';
    }
  };

  const hasFiles = Boolean(
    files &&
    Object.keys(files).length > 0 &&
    Object.values(files).some(v => typeof v === 'string' && v.trim().length > 0)
  );

  const hasValidApp = Boolean(
    files && (
      (files['src/App.jsx'] && files['src/App.jsx'].trim().length > 30) ||
      (files['App.jsx'] && files['App.jsx'].trim().length > 30) ||
      (files['index.html'] && files['index.html'].trim().length > 30)
    )
  );

  const shouldShowLoader = isGenerating || (hasFiles && !hasValidApp);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#07090e] overflow-hidden p-2 sm:p-4">
      {shouldShowLoader ? (
        <div className="w-full h-full animate-fadeIn flex items-center justify-center">
          <SatisfyingLoader promptText={promptText} onCancel={onCancel} telemetry={telemetry} />
        </div>
      ) : !hasFiles ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 select-none">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500 shadow-inner">
            <span className="font-mono text-xl font-bold text-zinc-400">&lt;/&gt;</span>
          </div>
          <h3 className="text-base font-semibold text-zinc-200 mb-1">Sandbox Environment Ready</h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            Enter a prompt in the terminal panel on the left to synthesize a complete web application.
          </p>
        </div>
      ) : (
        <div className={`transition-all duration-300 relative overflow-hidden bg-[#090a0f] ${getViewportClass()}`}>
          <SandboxIframe
            files={files}
            keyTrigger={keyTrigger}
            onError={handleSandboxError}
            onMountSuccess={onMountSuccess}
            onPreviewStaged={onPreviewStaged}
          />

          {/* Floating Actionable Diagnostic Banner */}
          {activeError && !isGenerating && (
            <div className="absolute bottom-3 inset-x-3 sm:inset-x-6 z-30 p-3.5 rounded-xl bg-[#12141c]/95 border border-amber-500/40 shadow-2xl backdrop-blur-md animate-fadeIn">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">
                        {activeError.errorType}
                      </span>
                      {activeError.detectedFile && (
                        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.2 rounded">
                          {activeError.detectedFile}{activeError.lineNumber ? `:${activeError.lineNumber}` : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                      {activeError.friendlyReason}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-mono mt-1">
                      💡 {activeError.actionableGuidance}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onAutoFix && (
                    <button
                      onClick={() => onAutoFix(activeError.raw)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold transition shadow-md cursor-pointer"
                      title="Automatically repair using AI"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Fix</span>
                    </button>
                  )}
                  {onViewCode && (
                    <button
                      onClick={() => onViewCode(activeError.detectedFile, activeError.lineNumber)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition border border-zinc-700"
                      title="Inspect code in editor"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Inspect</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveError(null)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

