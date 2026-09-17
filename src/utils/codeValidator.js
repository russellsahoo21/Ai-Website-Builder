import Babel from '@babel/standalone';

const ALLOWED_EXTERNAL_PACKAGES = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  'lucide-react',
  '@heroicons/react',
  'canvas-confetti',
  'framer-motion',
  'recharts',
  'clsx',
  'tailwind-merge',
]);

const SAFE_GLOBALS = new Set([
  'React', 'ReactDOM', 'console', 'window', 'document', 'navigator', 'location',
  'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'requestAnimationFrame', 'cancelAnimationFrame',
  'Math', 'Date', 'JSON', 'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp',
  'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Error', 'TypeError', 'RangeError',
  'SyntaxError', 'URIError', 'undefined', 'null', 'Infinity', 'NaN', 'isNaN', 'isFinite',
  'parseInt', 'parseFloat', 'encodeURI', 'encodeURIComponent', 'decodeURI', 'decodeURIComponent',
  'alert', 'prompt', 'confirm', 'localStorage', 'sessionStorage', 'history',
  'URL', 'URLSearchParams', 'Blob', 'File', 'FileReader', 'FormData', 'Headers', 'Request', 'Response',
  'Event', 'CustomEvent', 'MessageEvent', 'MouseEvent', 'KeyboardEvent', 'Element', 'HTMLElement', 'Node',
  'MutationObserver', 'ResizeObserver', 'IntersectionObserver',
  'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext', 'useReducer', 'useId',
  'lucide'
]);

function resolveLocalPath(currentFile, importPath) {
  const currentDir = currentFile.includes('/') ? currentFile.slice(0, currentFile.lastIndexOf('/')) : '';
  const parts = currentDir ? currentDir.split('/') : [];
  const importParts = importPath.split('/');

  for (const part of importParts) {
    if (part === '.' || part === '') continue;
    if (part === '..') {
      if (parts.length > 0) parts.pop();
    } else {
      parts.push(part);
    }
  }
  return parts.join('/');
}

/**
 * Validates a single JS/JSX/TSX source file for both syntax and semantics.
 * Returns { isValid: boolean, error?: Object, imports?: Array }
 */
export function validateSourceCode(code, filename = 'src/App.jsx') {
  if (!code || typeof code !== 'string') {
    return {
      isValid: false,
      error: { file: filename, line: 1, column: 1, message: 'File content is empty or invalid string.', errorStage: 'validation' }
    };
  }

  const lower = filename.toLowerCase();
  const isScript = lower.endsWith('.jsx') || lower.endsWith('.js') || lower.endsWith('.tsx') || lower.endsWith('.ts');
  if (!isScript) {
    return { isValid: true, imports: [] };
  }

  const imports = [];
  const undefinedVars = new Set();
  const semanticErrors = [];

  try {
    Babel.transform(code, {
      presets: [
        ['react', { runtime: 'classic' }],
        'typescript'
      ],
      filename,
      plugins: [
        () => ({
          visitor: {
            ImportDeclaration(path) {
              const src = path.node.source.value;
              imports.push({
                source: src,
                line: path.node.loc?.start?.line || 1,
                column: path.node.loc?.start?.column || 1
              });

              // Check for unsupported external packages
              if (!src.startsWith('.') && !src.startsWith('/')) {
                const basePkg = src.startsWith('@') ? src.split('/').slice(0, 2).join('/') : src.split('/')[0];
                if (!ALLOWED_EXTERNAL_PACKAGES.has(basePkg) && !ALLOWED_EXTERNAL_PACKAGES.has(src)) {
                  semanticErrors.push({
                    file: filename,
                    line: path.node.loc?.start?.line || 1,
                    column: path.node.loc?.start?.column || 1,
                    message: `Unsupported external package "${src}". The preview sandbox supports "react", "lucide-react", and native browser APIs.`,
                    errorStage: 'validation'
                  });
                }
              }
            },
            ReferencedIdentifier(path) {
              const name = path.node.name;
              // Ignore standard JSX member expressions or already declared/imported bindings
              if (!path.scope.hasBinding(name) && !SAFE_GLOBALS.has(name) && !undefinedVars.has(name)) {
                // Ensure this isn't a property access like obj.name
                if (path.parent && path.parent.type === 'MemberExpression' && path.parent.property === path.node && !path.parent.computed) {
                  return;
                }
                undefinedVars.add(name);
                semanticErrors.push({
                  file: filename,
                  line: path.node.loc?.start?.line || 1,
                  column: path.node.loc?.start?.column || 1,
                  message: `Undefined variable or component "${name}" in ${filename}. Did you forget to import or declare it?`,
                  errorStage: 'validation'
                });
              }
            }
          }
        })
      ]
    });

    if (semanticErrors.length > 0) {
      return {
        isValid: false,
        error: semanticErrors[0],
        errors: semanticErrors,
        imports
      };
    }

    return { isValid: true, imports };
  } catch (err) {
    const loc = err.loc || {};
    const line = loc.line || 1;
    const column = loc.column || 1;
    const message = err.message || 'Syntax error';

    return {
      isValid: false,
      error: {
        file: filename,
        line,
        column,
        message,
        snippet: err.codeFrame || '',
        errorStage: 'compilation'
      },
      imports
    };
  }
}

/**
 * Validates all code files in a project workspace map:
 * - Checks syntax & semantic correctness per file
 * - Verifies local import targets exist
 * - Verifies primary App component export
 */
export function validateProjectFiles(files = {}) {
  const errors = [];
  const allImports = [];

  const fileKeys = Object.keys(files);
  if (fileKeys.length === 0) {
    return {
      isValid: false,
      errors: [{ file: 'src/App.jsx', line: 1, column: 1, message: 'Project workspace is empty.', errorStage: 'validation' }]
    };
  }

  // 1. Primary App component existence and export check
  const appFile = files['src/App.jsx'] ? 'src/App.jsx' : (files['App.jsx'] ? 'App.jsx' : null);
  if (!appFile) {
    errors.push({
      file: 'src/App.jsx',
      line: 1,
      column: 1,
      message: 'Missing primary component file "src/App.jsx". Workspace must contain an entry App component.',
      errorStage: 'validation'
    });
  } else {
    const appContent = files[appFile] || '';
    const hasAppExport = /(?:export\s+default\s+(?:function|class)|export\s+default\s+\w+|export\s+function\s+App\b|export\s+const\s+App\b|function\s+App\b)/.test(appContent);
    if (!hasAppExport) {
      errors.push({
        file: appFile,
        line: 1,
        column: 1,
        message: `Missing App component export in ${appFile}. Expected "export default function App() { ... }".`,
        errorStage: 'validation'
      });
    }
  }

  // 2. Validate individual files & collect local imports
  for (const [filename, content] of Object.entries(files)) {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.jsx') || lower.endsWith('.js') || lower.endsWith('.tsx') || lower.endsWith('.ts')) {
      const result = validateSourceCode(content, filename);
      if (!result.isValid) {
        errors.push(result.error);
      }
      if (result.imports) {
        allImports.push({ file: filename, imports: result.imports });
      }
    }
  }

  // 3. Verify that all local relative imports point to existing workspace files
  for (const { file, imports } of allImports) {
    for (const imp of imports) {
      if (imp.source.startsWith('.')) {
        const resolvedBase = resolveLocalPath(file, imp.source);
        const candidates = [
          resolvedBase,
          `${resolvedBase}.jsx`,
          `${resolvedBase}.js`,
          `${resolvedBase}.tsx`,
          `${resolvedBase}.ts`,
          `${resolvedBase}/index.jsx`,
          `${resolvedBase}/index.js`,
        ];

        const targetExists = candidates.some(c => files[c] !== undefined);
        if (!targetExists) {
          errors.push({
            file,
            line: imp.line,
            column: imp.column,
            message: `Missing local import: "${imp.source}" in ${file}. File does not exist in workspace.`,
            errorStage: 'validation'
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
