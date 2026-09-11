/**
 * fileParser.js
 * Hardened AI response parser. Handles all output formats:
 * 1. <<<FILE:...>>> delimiters (primary)
 * 2. Tool-call patterns (e.g. [write(file="...", content="...")])
 * 3. Markdown code blocks with headers (e.g. ## components/Navbar.jsx)
 * 4. Bare JSX fallback
 * Preserves modular folder structures (e.g. components/Navbar.jsx)
 */

import { resolveFileConflicts, isHtmlDocument } from '../utils/fileConflictResolver.js';

const MIN_CONTENT_LENGTH = 20;

function cleanFilename(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let cleaned = raw
    .replace(/^[#\s*]+/, '')
    .replace(/^\d+[:.]\s*/, '')
    .replace(/[*'"`:]/g, '')
    .trim();
  // Strip any leading ./ or /
  cleaned = cleaned.replace(/^\.?\//, '');
  return cleaned;
}

function normalizeFilePath(name) {
  if (!name) return 'src/App.jsx';
  if (name === 'App.jsx' || name === 'App.js') return 'src/App.jsx';
  if (name === 'styles.css' || name === 'style.css' || name === 'src/styles.css') return 'src/index.css';
  if (name.startsWith('components/') || name.startsWith('hooks/') || name.startsWith('utils/') || name.startsWith('services/')) return `src/${name}`;
  // Explicitly preserve backend and database directories
  if (name.startsWith('server/') || name.startsWith('api/') || name.startsWith('db/') || name.startsWith('models/') || name === 'server.js') return name;
  return name;
}

function classifyContent(content) {
  if (!content) return 'src/App.jsx';
  if (isHtmlDocument(content)) return 'index.html';
  if (
    content.includes('express()') ||
    content.includes("require('express')") ||
    content.includes('require("express")') ||
    content.includes("from 'express'") ||
    content.includes('from "express"') ||
    content.includes('app.listen(')
  ) return 'server/index.js';
  if (
    content.includes('CREATE TABLE') ||
    content.includes('ALTER TABLE') ||
    content.includes('INSERT INTO')
  ) return 'server/db/schema.sql';
  if (
    content.includes('import React') ||
    content.includes('useState') ||
    content.includes('export default function') ||
    content.includes('function App')
  ) return 'src/App.jsx';
  if (
    content.includes('{') &&
    (content.includes('margin') || content.includes('padding') ||
     content.includes('@tailwind') || content.includes('color:'))
  ) return 'src/index.css';
  return 'src/App.jsx';
}

/**
 * Parses raw AI response text and extracts structured files.
 * @returns {{ files: Object, needsReactConversion: boolean }}
 */
export function parseGeneratedFiles(text) {
  if (!text || typeof text !== 'string') return { files: {}, needsReactConversion: false };

  const raw = {};

  // Strategy 1: <<<FILE:...>>> delimiters (with or without <<<END_FILE>>>)
  const fileRegex = /<<<FILE:\s*([^\r\n>]+?)\s*>>>([\s\S]*?)(?:<<<END_FILE>>>|$)/g;
  let match;
  while ((match = fileRegex.exec(text)) !== null) {
    const name = normalizeFilePath(cleanFilename(match[1]));
    const content = match[2].trim();
    if (name && content.length >= MIN_CONTENT_LENGTH) {
      raw[name] = content;
    }
  }

  // Strategy 2: Tool-call patterns e.g. [write(file="App.jsx", content="...")] or write(file='...')
  if (Object.keys(raw).length === 0 && (text.includes('write(file=') || text.includes('write(filename='))) {
    const toolRegex = /(?:\[\s*)?write\s*\(\s*(?:file|filename|path)\s*=\s*['"]([^'"]+)['"]\s*,\s*(?:content\s*=\s*)?['"]([\s\S]*?)['"]\s*\)(?:\s*\])?/gi;
    let toolMatch;
    while ((toolMatch = toolRegex.exec(text)) !== null) {
      const name = normalizeFilePath(cleanFilename(toolMatch[1]));
      let content = toolMatch[2]
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '  ')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");
      if (name && content.length >= MIN_CONTENT_LENGTH) {
        raw[name] = content;
      }
    }
  }

  // Strategy 3: Markdown code blocks with optional preceding header
  if (Object.keys(raw).length === 0) {
    const mdRe = /(?:(?:^|\n)(?:#{1,4}|\*\*|File:?)\s*(?:[0-9]+[:.]\s*)?([^\r\n`*]+?\.(?:jsx|js|html|css|tsx|ts))\*?:?\s*\n)?```(?:html|css|javascript|js|jsx|tsx|typescript|react)?(?:\s+(?:filename="?([^"\n]+)"?|([\w./-]+)))?\n([\s\S]*?)(?:```|$)/gi;
    let m;
    while ((m = mdRe.exec(text)) !== null) {
      const rawName = m[1] || m[2] || m[3];
      const content = m[4].trim();
      const name = normalizeFilePath(rawName ? cleanFilename(rawName) : classifyContent(content));
      if (name && content.length >= MIN_CONTENT_LENGTH) {
        raw[name] = content;
      }
    }
  }

  // Strategy 4: Bare React/JSX code without delimiters
  if (Object.keys(raw).length === 0) {
    const start = text.search(
      /(?:import\s+React|export\s+default\s+function|function\s+App\b|const\s+App\s*=)/
    );
    if (start !== -1) {
      const content = text.slice(start).trim();
      if (content.length >= MIN_CONTENT_LENGTH) {
        raw['src/App.jsx'] = content;
      }
    }
  }

  return resolveFileConflicts(raw);
}
