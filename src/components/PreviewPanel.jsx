import React, { useRef, useEffect } from 'react';
import SatisfyingLoader from './SatisfyingLoader';
import { buildPreviewDoc } from '../utils/previewBuilder';

export default function PreviewPanel({ files, viewport, keyTrigger, isGenerating, promptText, onCancel }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!iframeRef.current || isGenerating) return;
    const doc = buildPreviewDoc(files);
    iframeRef.current.srcdoc = doc;
  }, [files, keyTrigger, isGenerating]);

  const getViewportWidth = () => {
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

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#07090e] overflow-hidden p-2 sm:p-4">
      {/* Satisfying Compilation Screen while Generating */}
      {isGenerating ? (
        <div className="w-full h-full animate-fadeIn flex items-center justify-center">
          <SatisfyingLoader promptText={promptText} onCancel={onCancel} />
        </div>
      ) : !hasFiles ? (
        /* Clean Ready State when workspace is empty */
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 select-none">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 text-zinc-500 shadow-inner">
            <span className="font-mono text-xl font-bold text-zinc-400">&lt;/&gt;</span>
          </div>
          <h3 className="text-base font-semibold text-zinc-200 mb-1">Sandbox Environment Ready</h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            Enter a prompt in the terminal panel on the left to synthesize a complete full-stack web application.
          </p>
        </div>
      ) : (
        /* Sandboxed Iframe with responsive container */
        <div className={`transition-all duration-300 relative overflow-hidden bg-white ${getViewportWidth()}`}>
          <iframe
            ref={iframeRef}
            title="Sandbox Preview"
            sandbox="allow-scripts allow-modals allow-same-origin allow-forms"
            className="w-full h-full border-0 bg-white"
          />
        </div>
      )}
    </div>
  );
}
