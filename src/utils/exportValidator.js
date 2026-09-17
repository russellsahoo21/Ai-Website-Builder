/**
 * exportValidator.js
 * Validates that generated project files build cleanly before export.
 * Verifies JSX/JS syntax using Babel Standalone, validates primary root entry points,
 * and detects broken relative imports.
 */

import * as Babel from '@babel/standalone';

/**
 * Validates a project workspace before exporting to ZIP or deployment.
 * @param {Object} files - Dictionary of workspace files { [path]: content }
 * @returns {{ isValid: boolean, errors: Array, warnings: Array, totalFiles: number }}
 */
export function validateProjectBuild(files = {}) {
  const errors = [];
  const warnings = [];
  const fileKeys = Object.keys(files || {});

  if (fileKeys.length === 0) {
    errors.push({
      file: 'workspace',
      message: 'Workspace is empty. No files found to export.'
    });
    return { isValid: false, errors, warnings, totalFiles: 0 };
  }

  // 1. Verify primary entry point
  const hasAppEntry = Boolean(
    files['src/App.jsx'] ||
    files['App.jsx'] ||
    files['src/App.tsx'] ||
    files['App.tsx'] ||
    files['index.html']
  );

  if (!hasAppEntry) {
    errors.push({
      file: 'src/App.jsx',
      message: 'Missing primary entry point component (src/App.jsx or index.html).'
    });
  }

  // 2. Syntax check JS, JSX, TS, TSX files
  for (const [filename, content] of Object.entries(files)) {
    if (typeof content !== 'string') continue;
    const lower = filename.toLowerCase();
    const isCodeFile = lower.endsWith('.jsx') || lower.endsWith('.tsx') || lower.endsWith('.js') || lower.endsWith('.ts');

    if (isCodeFile && content.trim().length > 0) {
      try {
        if (Babel && typeof Babel.transform === 'function') {
          Babel.transform(content, {
            presets: ['react'],
            filename: filename,
            sourceType: 'module'
          });
        }
      } catch (err) {
        const line = err.loc?.line || (err.message.match(/:(\d+):/)?.[1] ? parseInt(err.message.match(/:(\d+):/)[1], 10) : null);
        const col = err.loc?.column || null;
        const cleanMsg = (err.message || 'Syntax error')
          .replace(/^.*?:\s*/, '')
          .replace(/\(\d+:\d+\)/, '')
          .trim();

        errors.push({
          file: filename,
          line,
          column: col,
          message: cleanMsg || 'Syntax or JSX parsing error'
        });
      }
    }

    // 3. Detect broken local relative imports
    if (isCodeFile && content.includes('import')) {
      const importRegex = /import\s+(?:[\w\s{},*]+from\s+)?['"](\.[^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const relImport = match[1];
        if (relImport.endsWith('.css') || relImport.endsWith('.svg') || relImport.endsWith('.png')) {
          continue; // Static asset
        }

        // Normalize import path relative to current file
        const currentDir = filename.includes('/') ? filename.substring(0, filename.lastIndexOf('/')) : '';
        let targetBase = currentDir ? `${currentDir}/${relImport}` : relImport;
        targetBase = targetBase.replace(/\/\.\//g, '/').replace(/^\.\//, '');

        const possibleTargets = [
          targetBase,
          `${targetBase}.jsx`,
          `${targetBase}.js`,
          `${targetBase}.tsx`,
          `${targetBase}.ts`,
          `${targetBase}/index.jsx`,
          `${targetBase}/index.js`,
          `src/${targetBase}`.replace(/^src\/src\//, 'src/'),
          `src/${targetBase}.jsx`.replace(/^src\/src\//, 'src/'),
          `src/${targetBase}.js`.replace(/^src\/src\//, 'src/')
        ];

        const targetExists = possibleTargets.some(p => files[p] !== undefined);
        if (!targetExists) {
          warnings.push({
            file: filename,
            importPath: relImport,
            message: `Imported module "${relImport}" was not found in project workspace.`
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    totalFiles: fileKeys.length
  };
}
