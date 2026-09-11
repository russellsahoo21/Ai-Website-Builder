/**
 * fileParser.js
 * Hardened AI response parser. Handles all output formats:
 * 1. <<<FILE:...>>> delimiters (primary)
 * 2. Markdown code blocks with optional headers
 * 3. Bare JSX fallback
 * Enforces React-only via fileConflictResolver.
 */

import { resolveFileConflicts, isHtmlDocument } from '../utils/fileConflictResolver.js';

const MIN_CONTENT_LENGTH = 50;

function cleanFilename(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/^[#\s*]+/, '')
    .replace(/^\d+[:..]\s*/, '')
    .replace(/[*'"`:]/g, '')
    .trim();
}

function classifyContent(content) {
  if (!content) return 'App.jsx';
  if (isHtmlDocument(content)) return 'index.html';
  if (
    content.includes('import React') ||
    content.includes('useState') ||
    content.includes('export default function') ||
    content.includes('function App')
  ) return 'App.jsx';
  if (
    content.includes('{') &&
    (content.includes('margin') || content.includes('padding') ||
     content.includes('@tailwind') || content.includes('color:'))
  ) return 'styles.css';
  return 'App.jsx';
}

/**
 * Parses raw AI response text and extracts structured files.
 * @returns {{ files: Object, needsReactConversion: boolean }}
 */
export function parseGeneratedFiles(text) {
  if (!text || typeof text !== 'string') return { files: {}, needsReactConversion: false };

  const raw = {};

  // Strategy 1: <<<FILE:...>>> delimiters
  const fileRegex = /<<<FILE:\s*([^\r\n>]+?)\s*>>>(\s*[\s\S]*?)(?:<<<END_FILE>>>|$)/g;
  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    const name = cleanFilename(match[1]);
    const content = match[2].trim();
    if (name && content.length >= MIN_CONTENT_LENGTH) raw[name] = content;
  }

  // Strategy 2: Markdown code blocks with optional preceding header
  if (Object.keys(raw).length === 0) {
    const mdRe = /(?:(?:^|\n)(?:#{1,4}|\*\*|File:?)\s*(?:[0-9]+[:..]\s*)?([^\r\n*]+?\.(?:jsx|js|html|css|tsx|ts))\*?:?\s*\n)? + '`' + (?:html|css|javascript|js|jsx|tsx|typescript|react)?(?:\s+(?:filename="?([^"\n]+)"?|([\w./-]+)))?\n([\s\S]*?)(?: + '`' + |$)/gi;
    let m;
    while ((m = mdRe.exec(text)) !== null) {
      const rawName = m[1] || m[2] || m[3];
      const content = m[4].trim();
      const name = rawName ? cleanFilename(rawName) : classifyContent(content);
      if (name && content.length >= MIN_CONTENT_LENGTH) raw[name] = content;
    }
  }

  // Strategy 3: Bare React/JSX code without delimiters
  if (Object.keys(raw).length === 0) {
    const start = text.search(
      /(?:import\s+React|export\s+default\s+function|function\s+App\b|const\s+App\s*=)/
    );
    if (start !== -1) {
      const content = text.slice(start).trim();
      if (content.length >= MIN_CONTENT_LENGTH) raw['App.jsx'] = content;
    }
  }

  return resolveFileConflicts(raw);
}
