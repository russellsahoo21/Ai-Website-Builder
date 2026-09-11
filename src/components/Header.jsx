import React from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Code2, 
  Eye, 
  Download, 
  ExternalLink, 
  RotateCcw, 
  Settings2,
  ArrowLeft,
  FolderKanban
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  viewport,
  setViewport,
  onRefresh,
  onOpenNewTab,
  onDownloadZip,
  onOpenSettings,
  onOpenProjects,
  projectCount = 0,
  activeProjectName = '',
  onBackToHome,
  isGenerating
}) {
  return (
    <header className="h-12 border-b border-zinc-800 bg-[#0d0f14] px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Back to Home & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition border border-zinc-800"
          title="Return to Home"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>

        <div className="h-3.5 w-px bg-zinc-800 hidden sm:block"></div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center font-bold text-[11px] text-black">
            A
          </div>
          <span className="font-semibold text-xs tracking-tight text-white hidden md:inline">AetherCraft Studio</span>
        </div>

        <div className="h-3.5 w-px bg-zinc-800 hidden sm:block"></div>

        {/* Projects Library Button */}
        <button
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition border border-zinc-800 group"
          title="View and Switch Previous Projects"
        >
          <FolderKanban className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-105 transition" />
          <span className="hidden sm:inline">Projects</span>
          {projectCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 border border-zinc-700/60 text-[10px] text-zinc-400 font-mono">
              {projectCount}
            </span>
          )}
        </button>
      </div>

      {/* View Mode & Viewport Switchers */}
      <div className="flex items-center gap-2">
        {/* Tab Switcher: Preview vs Code */}
        <div className="flex p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              activeTab === 'preview'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${
              activeTab === 'code'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code</span>
          </button>
        </div>

        {/* Device Viewport Switcher */}
        {activeTab === 'preview' && (
          <div className="hidden md:flex p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setViewport('desktop')}
              className={`p-1 rounded-md transition ${
                viewport === 'desktop' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              className={`p-1 rounded-md transition ${
                viewport === 'tablet' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              className={`p-1 rounded-md transition ${
                viewport === 'mobile' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-md border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition"
          title="Refresh Preview Sandbox"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onOpenNewTab}
          className="p-1.5 rounded-md border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition"
          title="Open in Full Browser Tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onDownloadZip}
          disabled={isGenerating}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-zinc-200 disabled:opacity-50 text-xs font-semibold text-black transition"
          title="Export Production ZIP"
        >
          <Download className="w-3 h-3" />
          <span className="hidden sm:inline">Export ZIP</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md border border-zinc-800 hover:bg-zinc-900 text-zinc-400 hover:text-white transition"
          title="Studio Settings"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
