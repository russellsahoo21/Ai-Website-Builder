/**
 * Universal preview document builder
 * Supports native React 18 JSX applications with Babel standalone,
 * Lucide icons, Tailwind CSS, and vanilla HTML/CSS/JS applications.
 */

export function buildPreviewDoc(files) {
  if (!files || Object.keys(files).length === 0) return '';

  const isHtmlDoc = (code) => {
    if (!code || typeof code !== 'string') return false;
    const trimmed = code.trim().toLowerCase();
    return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.includes('<!doctype html');
  };

  const workingFiles = { ...files };

  // If App.jsx is actually an HTML document, promote it to index.html and remove from App.jsx!
  if (workingFiles['App.jsx'] && isHtmlDoc(workingFiles['App.jsx'])) {
    if (!workingFiles['index.html']) {
      workingFiles['index.html'] = workingFiles['App.jsx'];
    }
    delete workingFiles['App.jsx'];
  }
  if (workingFiles['App.js'] && isHtmlDoc(workingFiles['App.js'])) {
    if (!workingFiles['index.html']) {
      workingFiles['index.html'] = workingFiles['App.js'];
    }
    delete workingFiles['App.js'];
  }

  const reactCode = workingFiles['src/App.jsx'] || workingFiles['App.jsx'] || workingFiles['App.js'] || workingFiles['app.jsx'] || '';
  const isReact = Boolean(reactCode && !isHtmlDoc(reactCode));
  const css = workingFiles['src/index.css'] || workingFiles['styles.css'] || workingFiles['src/styles.css'] || '';
  let html = workingFiles['index.html'] || '';

  // 1. Handle React 18 Applications
  if (isReact && reactCode.trim().length > 0) {
    const safeReactCode = reactCode.replace(/<\/script>/gi, '<\\/script>');

    function cleanJsxModule(rawCode) {
      if (!rawCode) return '';
      const safe = rawCode.replace(/<\/script>/gi, '<\\/script>');
      let cl = safe
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '  ')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');

      // 1. Strip TypeScript type imports & all imports
      cl = cl.replace(/import\s+type\s+[\s\S]*?from\s+['"\\].*?['"\\];?/g, '// [type import stripped]');
      cl = cl.replace(/import\s+type\s*\{[\s\S]*?\}\s*from\s+['"\\].*?['"\\];?/g, '// [type import stripped]');
      cl = cl.replace(/import\s+[\s\S]*?from\s+['"\\].*?['"\\];?/g, '// [import resolved via sandbox shim]');
      cl = cl.replace(/import\s+['"\\].*?['"\\];?/g, '// [side-effect import resolved]');

      // 2. Normalize exports
      cl = cl.replace(/export\s*\*\s*from\s+['"\\].*?['"\\];?/g, '// [export * stripped]');
      cl = cl.replace(/export\s+(?:default\s+)?(?:async\s+)?function\s+/g, 'function ');
      cl = cl.replace(/export\s+(?:default\s+)?class\s+/g, 'class ');
      cl = cl.replace(/export\s+(?:default\s+)?(?:const|let|var)\s+/g, (m) => m.replace(/export\s+(?:default\s+)?/, ''));
      cl = cl.replace(/export\s+default\s+/g, '// export default ');
      cl = cl.replace(/export\s*\{[\s\S]*?\};?/g, '// [exports stripped]');
      return cl;
    }

    const appFileKey = ['src/App.jsx', 'App.jsx', 'App.js', 'app.jsx', 'src/App.js'].find(k => workingFiles[k]);
    const userDeclaredNames = new Set();
    const jsxTagsSet = new Set();

    const IGNORED_SUB_FILES = new Set([
      'main.jsx', 'main.js', 'src/main.jsx', 'src/main.js',
      'vite.config.js', 'vite.config.ts', 'tailwind.config.js',
      'postcss.config.js', 'package.json'
    ]);

    // Process all modular sub-components (e.g. src/components/Navbar.jsx, components/Gallery.jsx, utils/helpers.js)
    const subComponentFiles = Object.entries(workingFiles).filter(([name, code]) => {
      if (name === appFileKey) return false;
      if (IGNORED_SUB_FILES.has(name)) return false;
      if (name.includes('vite.config') || name.includes('postcss.config') || name.includes('tailwind.config')) return false;
      if (!code || typeof code !== 'string') return false;
      const lower = name.toLowerCase();
      return (lower.endsWith('.jsx') || lower.endsWith('.tsx') || lower.endsWith('.js')) && !isHtmlDoc(code);
    });

    let subComponentsBundle = '';
    subComponentFiles.forEach(([filename, content]) => {
      const cleanedSub = cleanJsxModule(content);
      const modDeclared = [...cleanedSub.matchAll(/(?:function|const|let|var|class)\s+([A-Za-z0-9_]+)/g)].map(m => m[1]);
      modDeclared.forEach(name => userDeclaredNames.add(name));

      [...content.matchAll(/<([A-Z][a-zA-Z0-9_]*)/g)].forEach(m => jsxTagsSet.add(m[1]));

      // Auto-bind components to window so any component or App can access them
      const windowBinds = modDeclared
        .filter(name => /^[A-Z]/.test(name))
        .map(name => `if (typeof ${name} !== 'undefined') { window['${name}'] = ${name}; }`)
        .join('\n    ');

      subComponentsBundle += `\n    // [Modular Component: ${filename}]\n    ${cleanedSub}\n    ${windowBinds}\n`;
    });

    const cleaned = cleanJsxModule(reactCode);
    const appDeclared = [...cleaned.matchAll(/(?:function|const|let|var|class)\s+([A-Za-z0-9_]+)/g)].map(m => m[1]);
    appDeclared.forEach(name => userDeclaredNames.add(name));
    [...safeReactCode.matchAll(/<([A-Z][a-zA-Z0-9_]*)/g)].forEach(m => jsxTagsSet.add(m[1]));

    const jsxTags = Array.from(jsxTagsSet).filter(tag => !userDeclaredNames.has(tag) && tag !== 'App' && tag !== 'Fragment');

    // Extract icon imports & aliases from all files
    const iconAliases = [];
    const iconImportRegex = /import\s*\{([\s\S]*?)\}\s*from\s*['"\\].*?(?:lucide-react|@lucide\/react|react-icons[\/\w-]*).*?['"\\];?/g;
    
    // Check all JSX files for icon imports
    const allCodeSources = [reactCode, ...subComponentFiles.map(f => f[1])];
    allCodeSources.forEach(source => {
      let iconMatch;
      while ((iconMatch = iconImportRegex.exec(source)) !== null) {
        const parts = iconMatch[1].split(',').map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          const aliasMatch = p.match(/^(\w+)\s+as\s+(\w+)$/);
          if (aliasMatch) {
            if (!userDeclaredNames.has(aliasMatch[2])) {
              iconAliases.push({ orig: aliasMatch[1], alias: aliasMatch[2] });
            }
          } else {
            const name = p.replace(/[^\w]/g, '');
            if (name && !userDeclaredNames.has(name)) {
              iconAliases.push({ orig: name, alias: name });
            }
          }
        });
      }
    });

    const aliasAssignments = iconAliases
      .map(({ orig, alias }) => `window['${alias}'] = LucideProxy['${orig}'] || LucideProxy['circle'];`)
      .join('\n    ');

    // Detect default export name if component was not named "App"
    let defaultExportName = '';
    const defMatch = safeReactCode.match(/export\s+default\s+(?:function\s+|class\s+)?([A-Za-z0-9_]+)/);
    if (defMatch) {
      defaultExportName = defMatch[1];
    }

    // Filter top icons against user declarations to prevent shadowing collisions
    const topIcons = [
      'Save', 'Plus', 'Trash', 'Trash2', 'Edit', 'Edit2', 'Edit3', 'Check', 'X', 'Search', 'Filter',
      'DollarSign', 'TrendingUp', 'TrendingDown', 'ArrowUpRight', 'ArrowDownRight', 'ArrowLeft', 'ArrowRight',
      'ArrowUp', 'ArrowDown', 'Wallet', 'CreditCard', 'PieChart', 'BarChart', 'BarChart2', 'Calendar',
      'Tag', 'ChevronDown', 'ChevronRight', 'ChevronLeft', 'ChevronUp', 'RefreshCw', 'RotateCcw',
      'Eye', 'EyeOff', 'Lock', 'Unlock', 'Mail', 'User', 'Users', 'UserPlus', 'UserCheck', 'Settings', 'Bell',
      'Download', 'Upload', 'Shield', 'ShieldCheck', 'CheckCircle', 'CheckCircle2', 'AlertCircle',
      'AlertTriangle', 'HelpCircle', 'Info', 'Sparkles', 'Moon', 'Sun', 'Layers', 'Home', 'Folder',
      'FolderPlus', 'FolderOpen', 'File', 'FileText', 'FileCode', 'Code', 'Terminal', 'Cpu', 'Database',
      'Server', 'HardDrive', 'Wifi', 'WifiOff', 'Clock', 'Compass', 'MapPin', 'Globe', 'Link', 'ExternalLink',
      'Copy', 'Clipboard', 'Share', 'Share2', 'Send', 'MessageSquare', 'MessageCircle', 'Phone',
      'Play', 'Pause', 'Square', 'Circle', 'CheckSquare', 'Bookmark', 'Star', 'Heart', 'ThumbsUp',
      'ThumbsDown', 'Award', 'Zap', 'Activity', 'Sliders', 'Maximize', 'Minimize', 'MoreHorizontal',
      'MoreVertical', 'Menu', 'Grid', 'List', 'Package', 'ShoppingCart', 'ShoppingBag', 'Truck',
      'Percent', 'Receipt', 'Printer', 'Camera', 'Image', 'Video', 'Music', 'Volume2', 'VolumeX',
      'LogOut', 'LogIn', 'Key', 'Briefcase', 'BookOpen', 'Book', 'FileSpreadsheet', 'PenTool', 'Paperclip'
    ];
    const safeTopIcons = topIcons.filter(name => !userDeclaredNames.has(name));

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AetherCraft Application Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#fafafa',
              100: '#f4f4f5',
              500: '#71717a',
              900: '#18181b',
              950: '#090a0f'
            }
          }
        }
      }
    }
  </script>
  <!-- React 18 & ReactDOM UMD (Fast jsDelivr CDN) -->
  <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <!-- Lucide Icons -->
  <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js"></script>
  <!-- Babel Standalone -->
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.0/babel.min.js"></script>
  <style>
    body { background-color: #090a0f; color: #f4f4f5; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #090a0f; }
    ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
    ${css}
  </style>
</head>
<body class="min-h-screen bg-[#090a0f] text-zinc-100 antialiased selection:bg-zinc-700">
  <div id="root"></div>

  <!-- Raw source preserved in plain text so Babel never misses DOMContentLoaded -->
  <script id="aethercraft-source" type="text/plain">
    Object.assign(window, {
      React,
      ReactDOM,
      useState: React.useState,
      useEffect: React.useEffect,
      useMemo: React.useMemo,
      useRef: React.useRef,
      useCallback: React.useCallback,
      useContext: React.useContext,
      createContext: React.createContext,
      useReducer: React.useReducer
    });

    const LucideIcon = ({ name, size = 18, className = '', color = 'currentColor', ...props }) => {
      const iconRef = React.useRef(null);
      React.useEffect(() => {
        if (window.lucide && iconRef.current) {
          window.lucide.createIcons({ root: iconRef.current });
        }
      }, [name]);
      const kebabName = (name || 'circle').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      return (
        <span ref={iconRef} className={className} style={{ display: 'inline-flex', alignItems: 'center' }} {...props}>
          <i data-lucide={kebabName} style={{ width: size, height: size, stroke: color }}></i>
        </span>
      );
    };

    const LucideProxy = new Proxy({}, {
      get: (_, prop) => {
        if (prop === '$$typeof' || typeof prop === 'symbol') return undefined;
        return (props) => <LucideIcon name={String(prop)} {...props} />;
      }
    });

    window.LucideProxy = LucideProxy;

    // 1. Populate all icons from window.lucide if available
    if (window.lucide && window.lucide.icons) {
      Object.keys(window.lucide.icons).forEach(iconName => {
        if (typeof window[iconName] === 'undefined') {
          window[iconName] = LucideProxy[iconName];
        }
      });
    }

    // 2. Pre-assign safe list of top icons to window
    const safeTopIconsList = ${JSON.stringify(safeTopIcons)};
    safeTopIconsList.forEach(name => {
      window[name] = LucideProxy[name];
    });

    // 3. Bind any imported icon aliases directly onto window
    ${aliasAssignments}

    // 4. Bind detected JSX PascalCase tags onto window if undefined (fail-safe for unimported icons)
    const detectedTags = ${JSON.stringify(jsxTags)};
    detectedTags.forEach(tag => {
      if (typeof window[tag] === 'undefined') {
        window[tag] = LucideProxy[tag];
      }
    });

    // 5. Standard library shims (framer-motion, clsx, twMerge, cn, axios, uuid)
    window.motion = new Proxy({}, {
      get: (_, tag) => (props) => React.createElement(tag, props)
    });
    window.AnimatePresence = ({ children }) => children;
    window.clsx = (...args) => args.flat().filter(Boolean).join(' ');
    window.cn = window.clsx;
    window.twMerge = window.clsx;
    window.axios = {
      get: async () => ({ data: [] }),
      post: async (_, data) => ({ data }),
      put: async (_, data) => ({ data }),
      delete: async () => ({ data: { success: true } }),
      create: () => window.axios
    };
    window.uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    window.v4 = window.uuid;
    window.confetti = () => {};


    // Safe createContext & useContext shims: guarantees destructuring never fails
    const _origCreateContext = React.createContext;
    if (_origCreateContext) {
      React.createContext = function(defaultValue = {}) {
        return _origCreateContext.call(React, defaultValue !== undefined ? defaultValue : {});
      };
    }

    const _origUseContext = React.useContext;
    React.useContext = function(context) {
      const result = _origUseContext.apply(this, arguments);
      if (result === undefined || result === null) {
        return new Proxy({}, {
          get: (target, prop) => {
            if (prop === Symbol.toPrimitive) return () => '';
            if (prop === 'toString') return () => '[SafeContextFallback]';
            return undefined;
          }
        });
      }
      return result;
    };

    // React ErrorBoundary to catch, render, and notify parent of runtime errors
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
      }
      static getDerivedStateFromError(error) {
        return { hasError: true, error };
      }
      componentDidCatch(error, errorInfo) {
        console.error('[Sandbox ErrorBoundary]', error.message);
        try {
          window.parent.postMessage({
            type: 'SANDBOX_RUNTIME_ERROR',
            error: {
              message: error?.message || String(error),
              stack: error?.stack || ''
            }
          }, '*');
        } catch (e) {}
      }
      render() {
        if (this.state.hasError) {
          // Show nothing — BTS repair handles this silently in the background.
          // Returning null keeps the last rendered state visible.
          return null;
        }
        return this.props.children;
      }
    }


    // --- Modular Sub-Components Bundle ---
    ${subComponentsBundle}

    // --- Root App Component ---
    ${cleaned}

    const defaultExp = '${defaultExportName}';
    let targetComponent = (typeof App !== 'undefined' ? App : null);
    if (!targetComponent && defaultExp) {
      try { targetComponent = eval(defaultExp); } catch (e) {}
    }
    if (!targetComponent && defaultExp && typeof window[defaultExp] !== 'undefined') {
      targetComponent = window[defaultExp];
    }
    if (targetComponent) {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        React.createElement(ErrorBoundary, null, React.createElement(targetComponent))
      );
      setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
      }, 150);
    } else {
      // No App component found — notify parent silently for BTS repair
      try {
        window.parent.postMessage({
          type: 'SANDBOX_RUNTIME_ERROR',
          error: { message: 'App component not found. Ensure primary component is named "App".' }
        }, '*');
      } catch (e) {}
    }
  </script>

  <!-- Explicit Runner with Polling: Guarantees execution even if DOMContentLoaded already fired -->
  <script>
    // Silent global error capture — postMessage to parent for BTS repair
    window.addEventListener('error', function(e) {
      try {
        window.parent.postMessage({
          type: 'SANDBOX_RUNTIME_ERROR',
          error: { message: e.message || 'Script error', stack: e.error ? e.error.stack : '' }
        }, '*');
      } catch (err) {}
    });

    window.addEventListener('unhandledrejection', function(e) {
      try {
        window.parent.postMessage({
          type: 'SANDBOX_RUNTIME_ERROR',
          error: { message: 'Promise rejection: ' + (e.reason ? (e.reason.message || String(e.reason)) : 'Unknown') }
        }, '*');
      } catch (err) {}
    });

    function launchAetherCraft() {
      if (typeof Babel === 'undefined' || typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        setTimeout(launchAetherCraft, 40);
        return;
      }
      try {
        var sourceEl = document.getElementById('aethercraft-source');
        if (!sourceEl) return;
        var rawCode = sourceEl.textContent;
        var compiled = Babel.transform(rawCode, {
          presets: ['react', 'typescript'],
          filename: 'App.tsx'
        }).code;
        var runner = new Function(compiled);
        runner();
      } catch (err) {
        console.error('[AetherCraft] Compilation error:', err.message);
        try {
          window.parent.postMessage({
            type: 'SANDBOX_RUNTIME_ERROR',
            error: { message: err.message, stack: err.stack || '' }
          }, '*');
        } catch (e) {}
      }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      launchAetherCraft();
    } else {
      window.addEventListener('DOMContentLoaded', launchAetherCraft);
      window.addEventListener('load', launchAetherCraft);
    }
  </script>
</body>
</html>`;
  }

  // 2. Handle Vanilla HTML/CSS/JS Applications
  if (!html) {
    if (Object.keys(workingFiles).length > 0) {
      return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #090a0f; color: #f4f4f5; font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; }
    ${css}
  </style>
</head>
<body class="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-6 text-center select-none">
  <div class="max-w-md p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-2xl flex flex-col items-center">
    <div class="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 animate-pulse">
      <svg class="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    </div>
    <h3 class="text-base font-semibold text-white mb-1.5">Mounting Application Structure</h3>
    <p class="text-xs text-zinc-400 leading-relaxed mb-4">
      Synthesizing modular components into the in-memory React runtime...
    </p>
    <div class="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
      <div class="bg-indigo-500 h-full rounded-full animate-pulse" style="width: 75%"></div>
    </div>
  </div>
</body>
</html>`;
    }
    return '';
  }

  const js = workingFiles['script.js'] || '';

  // Inject Tailwind CDN if missing
  if (!html.includes('cdn.tailwindcss.com') && !html.includes('tailwind')) {
    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>\n  <script src="https://cdn.tailwindcss.com"></script>');
    } else {
      html = '<script src="https://cdn.tailwindcss.com"></script>\n' + html;
    }
  }

  // Inject Chart.js if referenced and missing
  if ((html.includes('chart') || html.includes('Chart')) && !html.includes('chart.js') && !html.includes('chartjs')) {
    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>\n  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>');
    } else {
      html = '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>\n' + html;
    }
  }

  // Inject Lucide icons CDN if referenced and missing
  if ((html.includes('lucide') || html.includes('data-lucide')) && !html.includes('lucide.min.js')) {
    if (html.includes('<head>')) {
      html = html.replace('<head>', '<head>\n  <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js"></script>');
    } else {
      html = '<script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js"></script>\n' + html;
    }
  }

  if (css) {
    if (html.includes('</head>')) {
      html = html.replace('</head>', `<style>\n${css}\n</style></head>`);
    } else {
      html = `<style>\n${css}\n</style>` + html;
    }
  }

  if (js) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', `<script>\n${js}\n</script></body>`);
    } else {
      html = html + `<script>\n${js}\n</script>`;
    }
  }

  // Inject runtime error handling & Lucide initialization into HTML applications
  const runnerScript = `
  <script>
    if (window.lucide) {
      window.lucide.createIcons();
      window.addEventListener('DOMContentLoaded', function() { if (window.lucide) window.lucide.createIcons(); });
      window.addEventListener('load', function() { if (window.lucide) window.lucide.createIcons(); });
    }
    window.addEventListener('error', function(e) {
      console.error('Sandbox runtime error:', e);
      try {
        window.parent.postMessage({
          type: 'SANDBOX_RUNTIME_ERROR',
          error: { message: e.message || 'Runtime error in script', stack: e.error ? e.error.stack : '' }
        }, '*');
      } catch (err) {}
    });
  </script>`;

  if (html.includes('</body>')) {
    html = html.replace('</body>', `${runnerScript}\n</body>`);
  } else {
    html += runnerScript;
  }

  return html;
}
