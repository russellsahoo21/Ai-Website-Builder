/**
 * fileConflictResolver.js
 * Detects file type conflicts and enforces React-only output.
 * HTML content in App.jsx triggers re-generation, never renders.
 */

const MIN_VALID_LENGTH = 50;

export function isHtmlDocument(content) {
  if (!content || typeof content !== 'string') return false;
  const t = content.trim().toLowerCase();
  return t.startsWith('<!doctype') || t.startsWith('<html') || t.includes('<!doctype html');
}

export function isReactComponent(content) {
  if (!content || typeof content !== 'string') return false;
  return (
    content.includes('import React') ||
    content.includes('useState') ||
    content.includes('export default function') ||
    content.includes('function App') ||
    content.includes('const App =') ||
    content.includes('React.createElement') ||
    content.includes('return (') ||
    content.includes('return(<')
  );
}

/**
 * Resolves workspace file conflicts. Enforces React-only.
 * @returns {{ files: Object, needsReactConversion: boolean }}
 */
export function resolveFileConflicts(rawFiles) {
  const files = {};
  let needsReactConversion = false;

  for (const [name, content] of Object.entries(rawFiles)) {
    if (!content || typeof content !== 'string') continue;
    if (content.trim().length < MIN_VALID_LENGTH) continue;

    const isApp = ['App.jsx','App.js','app.jsx','src/App.jsx'].includes(name);
    const isHtml = name === 'index.html';

    if (isApp && isHtmlDocument(content)) {
      // Model emitted <!DOCTYPE html> inside App.jsx — flag for re-gen
      needsReactConversion = true;
      continue; // never render HTML as App.jsx
    }

    if (isHtml) {
      if (isReactComponent(content) && !isHtmlDocument(content)) {
        // JSX was accidentally placed in index.html — promote it
        files['src/App.jsx'] = content;
      } else {
        // HTML-only app — flag for React re-gen
        needsReactConversion = true;
      }
      continue;
    }

    files[name] = content;
  }

  return { files, needsReactConversion };
}
