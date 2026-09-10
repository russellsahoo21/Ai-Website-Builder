/**
 * Universal preview document builder
 * Supports native React 18 JSX applications with Babel standalone,
 * Lucide icons, Tailwind CSS, and vanilla HTML/CSS/JS applications.
 */

export function buildPreviewDoc(files) {
  if (!files || Object.keys(files).length === 0) return '';

  const isReact = Boolean(files['App.jsx'] || files['App.js'] || files['src/App.jsx'] || files['app.jsx']);
  const reactCode = files['App.jsx'] || files['App.js'] || files['src/App.jsx'] || files['app.jsx'] || '';
  const css = files['styles.css'] || files['src/styles.css'] || files['src/index.css'] || '';
  let html = files['index.html'] || '';

  // 1. Handle React 18 Applications
  if (isReact && reactCode.trim().length > 0) {
    const safeReactCode = reactCode.replace(/<\/script>/gi, '<\\/script>');

    // Pre-extract JSX tags and icon imports to provide automatic resolution
    const jsxTags = Array.from(new Set([...safeReactCode.matchAll(/<([A-Z][a-zA-Z0-9_]*)/g)].map(m => m[1])));

    // Extract any icon imports and aliases (e.g. import { Save, Download as SaveBtn } from 'lucide-react')
    const iconAliases = [];
    const iconImportRegex = /import\s*\{([\s\S]*?)\}\s*from\s*['"](?:lucide-react|@lucide\/react|react-icons[\/\w-]*)['"];?/g;
    let iconMatch;
    while ((iconMatch = iconImportRegex.exec(safeReactCode)) !== null) {
      const parts = iconMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      parts.forEach(p => {
        const aliasMatch = p.match(/^(\w+)\s+as\s+(\w+)$/);
        if (aliasMatch) {
          iconAliases.push({ orig: aliasMatch[1], alias: aliasMatch[2] });
        } else {
          const name = p.replace(/[^\w]/g, '');
          if (name) iconAliases.push({ orig: name, alias: name });
        }
      });
    }

    const aliasAssignments = iconAliases
      .map(({ orig, alias }) => `window['${alias}'] = LucideProxy['${orig}'] || LucideProxy['circle'];`)
      .join('\n    ');

    // Detect default export name if component was not named "App"
    let defaultExportName = '';
    const defMatch = safeReactCode.match(/export\s+default\s+(?:function\s+)?(\w+)/);
    if (defMatch) {
      defaultExportName = defMatch[1];
    }

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
  <!-- React 18 & ReactDOM UMD (Fast jsDelivr CDN with unpkg fallback) -->
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

  <div id="sandbox-error" style="display:none; padding:20px; margin:20px; background:#18181b; border:1px solid #ef4444; border-radius:8px; font-family:monospace; color:#f87171;">
    <h3 style="font-weight:bold; margin-bottom:8px; font-size:14px; color:#ef4444;">Runtime Error</h3>
    <pre id="sandbox-error-msg" style="white-space:pre-wrap; font-size:12px;"></pre>
  </div>

  <!-- Raw source preserved in plain text so Babel never misses DOMContentLoaded -->
  <script id="aethercraft-source" type="text/plain">
    const { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext, useReducer } = React;
    Object.assign(window, {
      useState, useEffect, useMemo, useRef, useCallback, useContext, createContext, useReducer,
      React, ReactDOM
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
        window[iconName] = LucideProxy[iconName];
      });
    }

    // 2. Pre-assign comprehensive list of top icons to window
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
    topIcons.forEach(name => {
      window[name] = LucideProxy[name];
    });

    // 3. Bind any imported icon aliases directly onto window
    ${aliasAssignments}

    // 4. Bind all detected JSX PascalCase tags onto window if undefined (fail-safe for unimported icons)
    const detectedTags = ${JSON.stringify(jsxTags)};
    detectedTags.forEach(tag => {
      if (typeof window[tag] === 'undefined' && tag !== 'App' && tag !== 'Fragment') {
        window[tag] = LucideProxy[tag];
      }
    });

    // 5. Standard library shims (framer-motion, clsx, twMerge, cn)
    window.motion = new Proxy({}, {
      get: (_, tag) => (props) => React.createElement(tag, props)
    });
    window.AnimatePresence = ({ children }) => children;
    window.clsx = (...args) => args.flat().filter(Boolean).join(' ');
    window.cn = window.clsx;
    window.twMerge = window.clsx;

    const {
      Plus, Trash2, Edit, Edit2, Edit3, Trash, Check, X, Search, Filter,
      DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
      Wallet, CreditCard, PieChart, BarChart, Calendar, Tag, ChevronDown,
      ChevronRight, ArrowLeft, ArrowRight, RefreshCw, Eye, EyeOff, Lock,
      Mail, User, Settings, Bell, Download, Upload, Shield, CheckCircle,
      CheckCircle2, AlertCircle, HelpCircle, Info, Sparkles, Moon, Sun, Layers, Home,
      Save, Folder, Clock, Zap, Cpu, Server, Database, Activity, Star, Heart,
      motion, AnimatePresence, clsx, cn
    } = window;

    // Safe useContext shim: prevents fatal TypeError when context hook is called outside provider
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
        console.error("ErrorBoundary caught:", error, errorInfo);
        const errBox = document.getElementById('sandbox-error');
        const errMsg = document.getElementById('sandbox-error-msg');
        if (errBox && errMsg) {
          errBox.style.display = 'block';
          errMsg.textContent = (error?.message || String(error)) + '\\n' + (error?.stack || '');
        }
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
          return (
            <div className="p-6 m-4 rounded-xl bg-zinc-900 border border-red-500/50 text-red-400 font-mono text-sm">
              <h3 className="font-bold text-base text-red-400 mb-2">Rendering Error</h3>
              <p className="text-xs text-zinc-300 mb-3">{this.state.error?.message || 'Component failed to render.'}</p>
              <pre className="text-[11px] text-zinc-500 overflow-x-auto whitespace-pre-wrap">{this.state.error?.stack || ''}</pre>
              <button
                onClick={() => {
                  try {
                    window.parent.postMessage({
                      type: 'TRIGGER_AUTO_FIX',
                      error: { message: this.state.error?.message || 'Rendering error' }
                    }, '*');
                  } catch (e) {}
                }}
                style={{ marginTop: 12, padding: '6px 14px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                ⚡ Auto-Fix with AI in Background
              </button>
            </div>
          );
        }
        return this.props.children;
      }
    }


    ${(() => {
      let cleaned = safeReactCode;
      // 0. Unescape any escaped newlines and quotes (handles models that emit JSON-encoded code)
      cleaned = cleaned
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '  ')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');

      // 1. Multi-line and single-line imports
      cleaned = cleaned.replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '// [import resolved via sandbox shim]');
      // 2. Side-effect imports
      cleaned = cleaned.replace(/import\s+['"].*?['"];?/g, '// [side-effect import resolved]');
      // 3. Normalize exports
      cleaned = cleaned.replace(/export\s+default\s+function\s+/g, 'function ');
      cleaned = cleaned.replace(/export\s+default\s+class\s+/g, 'class ');
      cleaned = cleaned.replace(/export\s+default\s+/g, '// export default ');
      cleaned = cleaned.replace(/export\s+(?:const|let|var)\s+/g, (m) => m.replace('export ', ''));
      cleaned = cleaned.replace(/export\s*\{[\s\S]*?\};?/g, '// [exports stripped]');
      return cleaned;
    })()}

    const defaultExp = '${defaultExportName}';
    const targetComponent = (typeof App !== 'undefined' ? App : null) ||
                            (defaultExp && typeof window[defaultExp] !== 'undefined' ? window[defaultExp] : null);
    if (targetComponent) {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(
        React.createElement(ErrorBoundary, null, React.createElement(targetComponent))
      );
      setTimeout(() => {
        if (window.lucide) window.lucide.createIcons();
      }, 150);
    } else {
      document.getElementById('sandbox-error').style.display = 'block';
      document.getElementById('sandbox-error-msg').textContent = 'Could not find root "App" component in App.jsx. Ensure your primary component is named "App" or exported as default.';
    }
  </script>

  <!-- Explicit Runner with Polling: Guarantees execution even if DOMContentLoaded already fired -->
  <script>
    window.addEventListener('error', function(e) {
      var errBox = document.getElementById('sandbox-error');
      var errMsg = document.getElementById('sandbox-error-msg');
      if (errBox && errMsg) {
        errBox.style.display = 'block';
        errMsg.textContent = (e.message || 'Script error') + '\\n' + (e.error ? e.error.stack : '');
      }
    });

    window.addEventListener('unhandledrejection', function(e) {
      var errBox = document.getElementById('sandbox-error');
      var errMsg = document.getElementById('sandbox-error-msg');
      if (errBox && errMsg) {
        errBox.style.display = 'block';
        errMsg.textContent = 'Unhandled Promise Rejection: ' + (e.reason ? (e.reason.message || e.reason) : 'Unknown');
      }
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
          presets: ['react']
        }).code;
        var runner = new Function(compiled);
        runner();
      } catch (err) {
        console.error('AetherCraft Sandbox Compilation Error:', err);
        var errBox = document.getElementById('sandbox-error');
        var errMsg = document.getElementById('sandbox-error-msg');
        if (errBox && errMsg) {
          errBox.style.display = 'block';
          errMsg.textContent = (err.name || 'SyntaxError') + ': ' + err.message + '\\n\\n' + (err.stack || '');
        }
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
  if (!html) return '';

  const js = files['script.js'] || '';

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

  return html;
}
