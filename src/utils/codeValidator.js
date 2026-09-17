import Babel from '@babel/standalone';

/**
 * Validates a single JS/JSX/TSX source file using Babel transform.
 * Returns { isValid: true } or { isValid: false, error: { file, line, column, message, snippet } }
 */
export function validateSourceCode(code, filename = 'src/App.jsx') {
  if (!code || typeof code !== 'string') {
    return {
      isValid: false,
      error: { file: filename, line: 1, column: 1, message: 'File content is empty or invalid string.' }
    };
  }

  const lower = filename.toLowerCase();
  const isScript = lower.endsWith('.jsx') || lower.endsWith('.js') || lower.endsWith('.tsx') || lower.endsWith('.ts');
  if (!isScript) {
    return { isValid: true };
  }

  try {
    Babel.transform(code, {
      presets: [
        ['react', { runtime: 'classic' }],
        'typescript'
      ],
      filename
    });
    return { isValid: true };
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
        snippet: err.codeFrame || ''
      }
    };
  }
}

/**
 * Validates all code files in a project workspace map.
 * Returns { isValid: boolean, errors: Array<{ file, line, column, message, snippet }> }
 */
export function validateProjectFiles(files = {}) {
  const errors = [];

  for (const [filename, content] of Object.entries(files)) {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.jsx') || lower.endsWith('.js') || lower.endsWith('.tsx') || lower.endsWith('.ts')) {
      const result = validateSourceCode(content, filename);
      if (!result.isValid) {
        errors.push(result.error);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
