import React, { useState } from 'react';
import { Copy, Check, FileCode, Edit3 } from 'lucide-react';

export default function CodeInspector({ files, onFileUpdate }) {
  const fileNames = Object.keys(files);
  const [activeFile, setActiveFile] = useState(fileNames[0] || 'index.html');
  const [copied, setCopied] = useState(false);

  // If the active file was removed, fallback to the first available file
  const currentFile = files[activeFile] !== undefined ? activeFile : fileNames[0] || 'index.html';
  const content = files[currentFile] || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCodeChange = (e) => {
    if (onFileUpdate) {
      onFileUpdate(currentFile, e.target.value);
    }
  };

  if (fileNames.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#07090e] text-zinc-500 font-mono text-xs select-none">
        <FileCode className="w-8 h-8 text-zinc-700 mb-2" />
        <span>No files synthesized in workspace yet.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#090c10] text-zinc-200">
      {/* File Tabs Toolbar */}
      <div className="h-10 bg-[#0d0f14] border-b border-zinc-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto">
          {fileNames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveFile(name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-mono font-medium transition border-b-2 ${
                currentFile === name
                  ? 'bg-zinc-800 text-white border-white'
                  : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-500 hidden sm:inline flex items-center gap-1">
            <Edit3 className="w-3 h-3" /> Live Editable
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition"
            title="Copy current file code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-zinc-100" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code Editor Body */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Line Numbers Simulation */}
        <div className="w-12 bg-[#07090e] border-r border-zinc-800 py-4 select-none font-mono text-[11px] text-zinc-600 text-right pr-3 leading-6 overflow-hidden">
          {content.split('\n').map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={content}
          onChange={handleCodeChange}
          spellCheck="false"
          className="flex-1 w-full h-full p-4 bg-transparent font-mono text-[12px] text-zinc-200 leading-6 resize-none focus:outline-none focus:ring-0 selection:bg-zinc-700"
        />
      </div>
    </div>
  );
}
