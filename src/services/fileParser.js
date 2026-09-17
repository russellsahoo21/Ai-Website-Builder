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
import { applySearchReplacePatch } from '../utils/diffApplier.js';

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
  const lower = name.toLowerCase().replace(/^[./\\]+/, '');
  if (lower === 'app.jsx' || lower === 'app.js' || lower === 'srcapp.jsx' || lower === 'src/app.jsx' || lower === 'src/app.js') return 'src/App.jsx';
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
 * Supports both full file generation (<<<FILE:...>>>) and surgical diffs (<<<PATCH:...>>>).
 *
 * @param {string} text
 * @param {Object} existingFiles - Map of current workspace files to apply patches onto
 * @returns {{ files: Object, needsReactConversion: boolean }}
 */
export function parseGeneratedFiles(text, existingFiles = {}) {
  if (!text || typeof text !== 'string') {
    return { files: {}, errors: [], warnings: [], needsReactConversion: false, isComplete: false };
  }

  const raw = {};
  const errors = [];
  const warnings = [];

  // Strategy 0: <<<PATCH:...>>> or <<<DIFF:...>>> delimiters (for surgical edits)
  const patchRegex = /<<<(?:PATCH|DIFF)(?::\s*([^\r\n>]+?))?\s*>>>([\s\S]*?)(?:<<<END_(?:PATCH|DIFF)>*|(?=<<<(?:PATCH|DIFF|FILE):)|\s*$)/g;
  let patchMatch;
  while ((patchMatch = patchRegex.exec(text)) !== null) {
    const rawTarget = patchMatch[1] ? cleanFilename(patchMatch[1]) : 'src/App.jsx';
    const name = normalizeFilePath(rawTarget);
    const fullBlock = patchMatch[0];
    const isClosed = fullBlock.includes('<<<END_PATCH') || fullBlock.includes('<<<END_DIFF');

    if (!isClosed) {
      warnings.push({ file: name, reason: 'Truncated patch block: missing <<<END_PATCH>>> delimiter.' });
    }

    let patchContent = patchMatch[2].trim().replace(/<<<END_(?:PATCH|DIFF)>*/g, '').trim();
    if (name && patchContent) {
      // Find existing base file content (checking normalized paths)
      const baseCode = existingFiles[name] ||
        existingFiles[name.replace(/^src\//, '')] ||
        (name.includes('App') ? (existingFiles['src/App.jsx'] || existingFiles['App.jsx']) : '') ||
        '';

      if (baseCode) {
        const patchResult = applySearchReplacePatch(baseCode, patchContent);
        if (patchResult.success && patchResult.content.length >= MIN_CONTENT_LENGTH) {
          raw[name] = patchResult.content;
        } else {
          errors.push({ file: name, reason: 'Search-replace patch failed to match target text.' });
        }
      } else {
        errors.push({ file: name, reason: `Cannot patch ${name}: base file not found in workspace.` });
      }
    }
  }

  // Strategy 1: <<<FILE:...>>> delimiters (Strictly requiring <<<END_FILE>>>)
  if (text.includes('<<<FILE:')) {
    const fileOpenings = [...text.matchAll(/<<<FILE:\s*([^\r\n>]+?)\s*>>>/g)];

    for (let i = 0; i < fileOpenings.length; i++) {
      const opening = fileOpenings[i];
      const filenameRaw = opening[1];
      const name = normalizeFilePath(cleanFilename(filenameRaw));
      const startIndex = opening.index + opening[0].length;

      // Look for the matching <<<END_FILE>>> before the next <<<FILE: or end of text
      const nextOpeningIndex = (i + 1 < fileOpenings.length) ? fileOpenings[i + 1].index : text.length;
      const fileSegment = text.slice(startIndex, nextOpeningIndex);

      const endMarkerIndex = fileSegment.indexOf('<<<END_FILE>>>');
      if (endMarkerIndex === -1) {
        // Missing <<<END_FILE>>> delimiter — file block was cut off / truncated
        errors.push({
          file: name,
          reason: `Missing <<<END_FILE>>> delimiter for ${name}. Model output was truncated or incomplete.`
        });
        // Preserve existing file if available
        if (existingFiles[name]) {
          raw[name] = existingFiles[name];
        }
        continue;
      }

      const content = fileSegment.slice(0, endMarkerIndex).trim();
      if (content.length < MIN_CONTENT_LENGTH) {
        warnings.push({
          file: name,
          reason: `File ${name} is suspiciously short (< ${MIN_CONTENT_LENGTH} chars).`
        });
        if (existingFiles[name]) {
          raw[name] = existingFiles[name];
        }
      } else {
        raw[name] = content;
      }
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
  if (Object.keys(raw).length === 0 && text.includes('```')) {
    const mdRe = /(?:(?:^|\n)(?:#{1,4}|\*\*|File:?)\s*(?:[0-9]+[:.]\s*)?([^\r\n`*]+?\.(?:jsx|js|html|css|tsx|ts))\*?:?\s*\n)?```(?:html|css|javascript|js|jsx|tsx|typescript|react)?(?:\s+(?:filename="?([^"\n]+)"?|([\w./-]+)))?\n([\s\S]*?)(?:```|$)/gi;
    let m;
    while ((m = mdRe.exec(text)) !== null) {
      const rawName = m[1] || m[2] || m[3];
      const content = m[4].trim();
      const isClosed = m[0].trimEnd().endsWith('```');
      const name = normalizeFilePath(rawName ? cleanFilename(rawName) : classifyContent(content));

      if (!isClosed) {
        warnings.push({ file: name, reason: `Unclosed markdown code block for ${name}.` });
      }
      if (name && content.length >= MIN_CONTENT_LENGTH) {
        raw[name] = content;
      }
    }
  }

  // Strategy 4: Bare React/JSX code without delimiters
  if (Object.keys(raw).length === 0 && errors.length === 0) {
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

  const resolved = resolveFileConflicts(raw);
  const isComplete = errors.length === 0 && Object.keys(resolved.files).length > 0;

  return {
    ...resolved,
    errors,
    warnings,
    isComplete,
  };
}
