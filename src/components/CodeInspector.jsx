import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  FileCode, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Code2, 
  Palette, 
  Globe, 
  Braces, 
  Edit3, 
  Search, 
  PanelLeftClose, 
  PanelLeftOpen, 
  RotateCcw,
  Sparkles,
  X,
  FilePlus,
  Layers,
  GitBranch
} from 'lucide-react';

// Get appropriate icon & color for each file type
function getFileIcon(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jsx') || lower.endsWith('.tsx')) {
    return <Code2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
  }
  if (lower.endsWith('.css')) {
    return <Palette className="w-3.5 h-3.5 text-purple-400 shrink-0" />;
  }
  if (lower.endsWith('.html')) {
    return <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  }
  if (lower.endsWith('.json')) {
    return <Braces className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (lower.endsWith('.js') || lower.endsWith('.ts')) {
    return <FileCode className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
  }
  return <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
}

// Get language mode label for status bar
function getLanguageLabel(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.jsx') || lower.endsWith('.tsx')) return 'React JSX';
  if (lower.endsWith('.css')) return 'CSS (Tailwind)';
  if (lower.endsWith('.html')) return 'HTML5';
  if (lower.endsWith('.json')) return 'JSON';
  if (lower.endsWith('.js') || lower.endsWith('.ts')) return 'JavaScript';
  return 'Plain Text';
}

export default function CodeInspector({ files = {}, onFileUpdate, onFileCreate, onFileDelete }) {
  const fileNames = Object.keys(files);
  const [activeFile, setActiveFile] = useState(fileNames[0] || 'App.jsx');
  const [openTabs, setOpenTabs] = useState(() => {
    return fileNames.length > 0 ? [fileNames[0]] : ['App.jsx'];
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [copied, setCopied] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  
  const textareaRef = useRef(null);
  const newFileInputRef = useRef(null);

  // Synchronize active file if files change
  useEffect(() => {
    if (fileNames.length > 0 && !files[activeFile]) {
      const fallback = fileNames.includes('App.jsx') ? 'App.jsx' : fileNames[0];
      setActiveFile(fallback);
      if (!openTabs.includes(fallback)) {
        setOpenTabs(prev => [...prev, fallback]);
      }
    }
  }, [files, fileNames, activeFile, openTabs]);

  // Focus input when creating file
  useEffect(() => {
    if (isCreatingFile) {
      setTimeout(() => newFileInputRef.current?.focus(), 50);
    }
  }, [isCreatingFile]);

  const currentFile = files[activeFile] !== undefined ? activeFile : fileNames[0] || 'App.jsx';
  const content = files[currentFile] || '';

  // Select file from explorer or tabs
  const handleSelectFile = (name) => {
    setActiveFile(name);
    if (!openTabs.includes(name)) {
      setOpenTabs(prev => [...prev, name]);
    }
  };

  // Close tab
  const handleCloseTab = (name, e) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter(t => t !== name);
    setOpenTabs(nextTabs);
    if (activeFile === name) {
      if (nextTabs.length > 0) {
        setActiveFile(nextTabs[nextTabs.length - 1]);
      } else if (fileNames.length > 0) {
        setActiveFile(fileNames[0]);
        setOpenTabs([fileNames[0]]);
      }
    }
  };

  // Toggle folder collapse
  const toggleFolder = (folderPath) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Create new file
  const handleCreateFileSubmit = (e) => {
    e.preventDefault();
    const name = newFileName.trim().replace(/^[\\/]+/, '');
    if (!name) {
      setIsCreatingFile(false);
      return;
    }

    let initialTemplate = '// ' + name + '\n';
    if (name.endsWith('.jsx') || name.endsWith('.tsx')) {
      const componentName = name.split('/').pop().replace(/\.[^.]+$/, '');
      initialTemplate = `import React from 'react';\n\nexport default function ${componentName}() {\n  return (\n    <div className="p-4">\n      <h2 className="text-lg font-bold">${componentName}</h2>\n    </div>\n  );\n}\n`;
    } else if (name.endsWith('.css')) {
      initialTemplate = `/* Custom styles for ${name} */\n`;
    }

    if (onFileCreate) {
      onFileCreate(name, initialTemplate);
    }
    handleSelectFile(name);
    setNewFileName('');
    setIsCreatingFile(false);
  };

  // Delete file
  const handleDeleteFile = (name, e) => {
    e.stopPropagation();
    if (fileNames.length <= 1) return; // Prevent deleting the last file
    if (window.confirm(`Delete ${name}? This cannot be undone.`)) {
      if (onFileDelete) {
        onFileDelete(name);
      }
      setOpenTabs(prev => prev.filter(t => t !== name));
      if (activeFile === name) {
        const remaining = fileNames.filter(f => f !== name);
        if (remaining.length > 0) setActiveFile(remaining[0]);
      }
    }
  };

  // Copy active file code
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Download active file
  const handleDownloadFile = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.split('/').pop() || 'code.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Live edit code
  const handleCodeChange = (e) => {
    if (onFileUpdate) {
      onFileUpdate(currentFile, e.target.value);
    }
  };

  // Handle Tab key in editor (inserts 2 spaces)
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;

      const updated = val.substring(0, start) + '  ' + val.substring(end);
      if (onFileUpdate) {
        onFileUpdate(currentFile, updated);
      }

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Track cursor position for status bar
  const updateCursorPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, pos);
    const lines = textBefore.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCursorPos({ line, col });
  };

  // Build Folder Tree structure from flat paths
  const fileTree = useMemo(() => {
    const root = { name: 'root', folders: {}, files: [] };
    const filteredFiles = searchQuery
      ? fileNames.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
      : fileNames;

    filteredFiles.forEach(path => {
      const parts = path.split('/');
      if (parts.length === 1) {
        root.files.push({ name: parts[0], fullPath: path });
      } else {
        let curr = root;
        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i];
          const folderPath = parts.slice(0, i + 1).join('/');
          if (!curr.folders[folderName]) {
            curr.folders[folderName] = { 
              name: folderName, 
              fullPath: folderPath, 
              folders: {}, 
              files: [] 
            };
          }
          curr = curr.folders[folderName];
        }
        curr.files.push({ name: parts[parts.length - 1], fullPath: path });
      }
    });

    return root;
  }, [fileNames, searchQuery]);

  // Recursive folder renderer
  const renderFolder = (folder, depth = 0) => {
    const isCollapsed = Boolean(collapsedFolders[folder.fullPath]);
    const totalItems = Object.keys(folder.folders).length + folder.files.length;

    return (
      <div key={folder.fullPath} className="select-none">
        <div 
          onClick={() => toggleFolder(folder.fullPath)}
          className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-zinc-800/60 cursor-pointer text-xs group text-zinc-300 transition"
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            )}
            {isCollapsed ? (
              <Folder className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            )}
            <span className="truncate font-mono font-medium text-zinc-300">{folder.name}/</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-400 px-1">
            {totalItems}
          </span>
        </div>

        {!isCollapsed && (
          <div>
            {Object.values(folder.folders).map(subFolder => renderFolder(subFolder, depth + 1))}
            {folder.files.map(file => renderFileItem(file, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // File item renderer
  const renderFileItem = (file, depth = 0) => {
    const isActive = activeFile === file.fullPath;
    const lineCount = (files[file.fullPath] || '').split('\n').length;

    return (
      <div
        key={file.fullPath}
        onClick={() => handleSelectFile(file.fullPath)}
        className={`group flex items-center justify-between py-1 px-2 rounded-md cursor-pointer text-xs font-mono transition border-l-2 ${
          isActive
            ? 'bg-zinc-800/90 text-white border-cyan-400 shadow-sm font-medium'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border-transparent'
        }`}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {getFileIcon(file.name)}
          <span className="truncate">{file.name}</span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <span className="text-[10px] text-zinc-600">{lineCount}L</span>
          {fileNames.length > 1 && (
            <button
              onClick={(e) => handleDeleteFile(file.fullPath, e)}
              className="p-0.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-700/50"
              title={`Delete ${file.name}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  };

  const lineCount = content.split('\n').length;

  return (
    <div className="w-full h-full flex bg-[#090b10] text-zinc-200 overflow-hidden font-sans select-none">
      {/* ── Left Thin Activity Bar (VS Code style) ── */}
      <div className="w-11 bg-[#07090e] border-r border-zinc-800/80 flex flex-col items-center justify-between py-3 shrink-0">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(prev => !prev)}
            className={`p-2 rounded-md transition ${
              isSidebarOpen ? 'text-cyan-400 bg-zinc-800/60' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Explorer Sidebar (Ctrl+B)"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsSidebarOpen(true);
              setIsCreatingFile(true);
            }}
            className="p-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition"
            title="New Component / File"
          >
            <FilePlus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="text-[10px] font-mono text-zinc-600">v1.0</div>
        </div>
      </div>

      {/* ── Collapsible Explorer Sidebar (VS Code style) ── */}
      {isSidebarOpen && (
        <div className="w-60 md:w-64 bg-[#0a0c12] border-r border-zinc-800/80 flex flex-col shrink-0 animate-fadeIn overflow-hidden">
          {/* Explorer Header */}
          <div className="p-2.5 border-b border-zinc-800/80 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase font-mono">
              Explorer
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsCreatingFile(true)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
                title="New File..."
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCollapsedFolders({})}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition"
                title="Expand All"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition md:hidden"
                title="Close Explorer"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Filter Search */}
          <div className="px-2 py-1.5 border-b border-zinc-800/60">
            <div className="relative flex items-center">
              <Search className="w-3 h-3 text-zinc-500 absolute left-2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter files..."
                className="w-full pl-6 pr-2 py-1 bg-zinc-900/80 border border-zinc-800 rounded text-[11px] font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Project Structure Section */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            <div className="flex items-center justify-between px-1 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-1">
              <span>PROJECT // FILES</span>
              <span className="bg-zinc-800/80 px-1.5 py-0.2 rounded text-[9px] text-zinc-400">
                {fileNames.length}
              </span>
            </div>

            {/* Inline New File Creator */}
            {isCreatingFile && (
              <form onSubmit={handleCreateFileSubmit} className="mb-2 p-1.5 bg-zinc-900 rounded border border-cyan-500/50">
                <div className="text-[10px] font-mono text-cyan-400 mb-1 flex items-center gap-1">
                  <Plus className="w-2.5 h-2.5" /> New File (e.g. components/Header.jsx)
                </div>
                <input
                  ref={newFileInputRef}
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsCreatingFile(false);
                      setNewFileName('');
                    }
                  }}
                  placeholder="components/Button.jsx"
                  className="w-full px-2 py-1 bg-black border border-zinc-700 rounded text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
                <div className="flex items-center justify-between mt-1 text-[9px] font-mono text-zinc-500">
                  <span>Enter to save • Esc to cancel</span>
                </div>
              </form>
            )}

            {/* Render Folders & Files */}
            {Object.values(fileTree.folders).map(folder => renderFolder(folder, 0))}
            {fileTree.files.map(file => renderFileItem(file, 0))}
          </div>

          {/* Explorer Bottom Meta */}
          <div className="p-2 border-t border-zinc-800/80 bg-[#07090e] text-[10px] font-mono text-zinc-500 flex items-center justify-between">
            <span>Modular Workspace</span>
            <span className="text-cyan-400">React 18</span>
          </div>
        </div>
      )}

      {/* ── Main Code Editor Pane ── */}
      <div className="flex-1 flex flex-col bg-[#090b10] overflow-hidden">
        {/* Top Tab Strip (VS Code style) */}
        <div className="h-9 bg-[#07090e] border-b border-zinc-800/80 px-2 flex items-center justify-between overflow-hidden shrink-0">
          <div className="flex items-center gap-0.5 overflow-x-auto h-full scrollbar-none">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 mr-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition"
                title="Open Explorer"
              >
                <PanelLeftOpen className="w-3.5 h-3.5" />
              </button>
            )}

            {openTabs.map((name) => {
              const isActive = activeFile === name;
              const shortName = name.split('/').pop();
              return (
                <div
                  key={name}
                  onClick={() => handleSelectFile(name)}
                  className={`group h-full flex items-center gap-1.5 px-3 border-t-2 text-xs font-mono transition cursor-pointer select-none ${
                    isActive
                      ? 'bg-[#090b10] text-zinc-100 border-cyan-400 font-medium'
                      : 'bg-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 border-transparent'
                  }`}
                  title={name}
                >
                  {getFileIcon(name)}
                  <span className="truncate max-w-[130px]">{shortName}</span>
                  <button
                    onClick={(e) => handleCloseTab(name, e)}
                    className="p-0.5 rounded hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition ml-1"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-1.5 pl-2">
            <span className="text-[11px] font-mono text-emerald-400/90 hidden lg:flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/30 border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Editable
            </span>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white transition"
              title="Copy code"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition"
              title="Download file"
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Breadcrumbs Bar */}
        <div className="h-6 bg-[#090b10] border-b border-zinc-800/40 px-4 flex items-center text-[11px] font-mono text-zinc-500 select-none shrink-0">
          <span className="hover:text-zinc-300 cursor-pointer">aethercraft-app</span>
          {currentFile.split('/').map((part, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 mx-1 text-zinc-700 shrink-0" />
              <span className={idx === currentFile.split('/').length - 1 ? 'text-zinc-300 font-medium' : 'hover:text-zinc-300 cursor-pointer'}>
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Editor Area with Line Numbers */}
        <div className="flex-1 relative overflow-hidden flex bg-[#090b10]">
          {/* Line Numbers Gutter */}
          <div className="w-12 bg-[#07090e] border-r border-zinc-800/80 py-4 select-none font-mono text-[11px] text-zinc-600 text-right pr-3 leading-6 overflow-hidden shrink-0">
            {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
              <div 
                key={i}
                className={cursorPos.line === i + 1 ? 'text-cyan-400 font-bold' : ''}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Textarea Code Input */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleCodeChange}
            onKeyDown={handleKeyDown}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onSelect={updateCursorPosition}
            spellCheck="false"
            className="flex-1 w-full h-full p-4 bg-transparent font-mono text-[13px] text-zinc-200 leading-6 resize-none focus:outline-none focus:ring-0 selection:bg-cyan-900/60 selection:text-white"
          />
        </div>

        {/* Bottom Status Bar (VS Code style) */}
        <div className="h-6 bg-[#07090e] border-t border-zinc-800/80 px-3 flex items-center justify-between text-[11px] font-mono text-zinc-500 select-none shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-zinc-400">
              <GitBranch className="w-3 h-3 text-cyan-400" /> main
            </span>
            <span className="hidden sm:inline text-zinc-600">•</span>
            <span className="hidden sm:inline text-emerald-400/80 flex items-center gap-1">
              ✓ Ready
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            <span className="hidden md:inline">Spaces: 2</span>
            <span className="hidden sm:inline">UTF-8</span>
            <span className="text-zinc-300 font-medium">{getLanguageLabel(currentFile)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
