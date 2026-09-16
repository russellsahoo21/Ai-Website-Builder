"use client";
import React, { useRef, useEffect } from 'react';
import SatisfyingLoader from './SatisfyingLoader';
import SandboxIframe from '../sandbox/SandboxIframe';
import { buildPreviewDoc } from '../utils/previewBuilder';

export default function PreviewPanel({ files, viewport, keyTrigger, isGenerating, telemetry, promptText, onCancel, onSandboxError }) {
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
            onError={onSandboxError}
          />
        </div>
      )}
    </div>
  );
}

