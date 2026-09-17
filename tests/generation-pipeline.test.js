import test from 'node:test';
import assert from 'node:assert/strict';

import { createSseLineParser } from '../src/services/aiService.js';
import { parseGeneratedFiles } from '../src/services/fileParser.js';
import { validateSourceCode, validateProjectFiles } from '../src/utils/codeValidator.js';
import { buildPreviewDoc } from '../src/utils/previewBuilder.js';
import { recordTokenUsage, rollbackTokenUsage, getTokenUsage, resetTokenUsage } from '../src/services/tokenService.js';
import { parseSandboxError, buildFixPrompt } from '../src/sandbox/errorReporter.js';

test('Pipeline 1: SSE Parsing — JSON split across two network chunks', () => {
  const receivedLines = [];
  const parser = createSseLineParser((line) => receivedLines.push(line));

  // Chunk 1 has half of the JSON payload
  parser.feed('data: {"choices":[{"delta":{"content":"export default ');
  assert.equal(receivedLines.length, 0, 'Should not emit incomplete line');

  // Chunk 2 completes the line with a newline
  parser.feed('function App() { return <div>Ok</div>; }"}}]}\n');
  assert.equal(receivedLines.length, 1, 'Should emit line once complete');

  const parsed = JSON.parse(receivedLines[0].replace('data: ', ''));
  assert.equal(parsed.choices[0].delta.content, 'export default function App() { return <div>Ok</div>; }');
});

test('Pipeline 2: SSE Parsing — Multiple SSE messages in one chunk', () => {
  const receivedLines = [];
  const parser = createSseLineParser((line) => receivedLines.push(line));

  const multiChunk = [
    'data: {"choices":[{"delta":{"content":"Token1"}}]}',
    'data: {"choices":[{"delta":{"content":"Token2"}}]}',
    'data: {"choices":[{"delta":{"content":"Token3"}}]}',
    ''
  ].join('\n');

  parser.feed(multiChunk);
  assert.equal(receivedLines.length, 3, 'All 3 lines should be processed');
  assert.ok(receivedLines[0].includes('Token1'));
  assert.ok(receivedLines[1].includes('Token2'));
  assert.ok(receivedLines[2].includes('Token3'));
});

test('Pipeline 3: SSE Parsing — Final SSE line without trailing newline is flushed on EOF', () => {
  const receivedLines = [];
  const parser = createSseLineParser((line) => receivedLines.push(line));

  // Chunk without a trailing newline
  parser.feed('data: {"choices":[{"delta":{"content":"FinalToken"}}]}');
  assert.equal(receivedLines.length, 0, 'Line is buffered waiting for newline');

  // Flush on stream conclusion
  parser.flush();
  assert.equal(receivedLines.length, 1, 'Flushed trailing line at EOF');
  assert.ok(receivedLines[0].includes('FinalToken'));
});

test('Pipeline 4: File Parsing — Truncated <<<FILE>>> block without <<<END_FILE>>> is rejected', () => {
  const truncatedOutput = '\n<<<FILE:src/App.jsx>>>\nexport default function App() {\n  return <div>Halfway cut off...\n';
  const existingFiles = {
    'src/App.jsx': 'export default function App() { return <div>Previous Safe App</div>; }'
  };

  const parsed = parseGeneratedFiles(truncatedOutput, existingFiles);
  assert.equal(parsed.isComplete, false, 'Truncated output should not be marked complete');
  assert.ok(parsed.errors.length > 0, 'Should return structured error');
  assert.match(parsed.errors[0].reason, /Missing <<<END_FILE>>>/);
  // Preserves existing safe file
  assert.equal(parsed.files['src/App.jsx'], existingFiles['src/App.jsx']);
});

test('Pipeline 5: File Parsing — Missing <<<END_FILE>>> marker on one file rejects only the incomplete file', () => {
  const mixedOutput = '\n<<<FILE:src/components/Header.jsx>>>\nexport function Header() { return <header>Valid Header</header>; }\n<<<END_FILE>>>\n\n<<<FILE:src/App.jsx>>>\nexport default function App() { return <main>Broken No End\n';
  const existingFiles = {
    'src/App.jsx': 'export default function App() { return <div>Safe Old App</div>; }'
  };

  const parsed = parseGeneratedFiles(mixedOutput, existingFiles);
  assert.ok(parsed.files['src/components/Header.jsx'], 'Complete file should be parsed');
  assert.equal(parsed.files['src/App.jsx'], existingFiles['src/App.jsx'], 'Incomplete file preserves old code');
  assert.equal(parsed.isComplete, false);
});

test('Pipeline 6: Validation — Malformed JSX detected with exact line and column', () => {
  const brokenCode = 'export default function App() {\n  return (\n    <div>\n      <span>Missing closing tag\n    </div>\n  );\n}';
  const validation = validateSourceCode(brokenCode, 'src/App.jsx');
  assert.equal(validation.isValid, false);
  assert.equal(validation.error.file, 'src/App.jsx');
  assert.ok(typeof validation.error.line === 'number' && validation.error.line > 0);
  assert.ok(typeof validation.error.column === 'number' && validation.error.column > 0);
  assert.ok(validation.error.message.includes('src/App.jsx'));
});

test('Pipeline 7: Validation — Valid JSX with multiple files passes validation', () => {
  const project = {
    'src/App.jsx': 'import React from "react"; export default function App() { return <div>App</div>; }',
    'src/components/Nav.jsx': 'export function Nav() { return <nav className="p-4">Navigation</nav>; }',
    'src/index.css': '@tailwind base;\n@tailwind utilities;'
  };
  const validation = validateProjectFiles(project);
  assert.equal(validation.isValid, true);
  assert.equal(validation.errors.length, 0);
});

test('Pipeline 8: Validation — Failed validation preserves the previous project', () => {
  const currentProject = {
    'src/App.jsx': 'export default function App() { return <div>Working App</div>; }'
  };
  const incomingGenerated = {
    'src/App.jsx': 'export default function App() { return <div>Syntax Error; }'
  };

  const validation = validateProjectFiles(incomingGenerated);
  assert.equal(validation.isValid, false);

  // Logic: only apply if valid
  let activeFiles = currentProject;
  if (validation.isValid) {
    activeFiles = incomingGenerated;
  }
  assert.equal(activeFiles['src/App.jsx'], currentProject['src/App.jsx'], 'Working project must not be replaced');
});

test('Pipeline 9: Repair — Error Reporter builds targeted fix prompt for syntax error', () => {
  const syntaxErr = 'SyntaxError: Unexpected token, expected "}" at src/components/Sidebar.jsx:32:10';
  const prompt = buildFixPrompt(syntaxErr, '');

  assert.ok(prompt.includes('src/components/Sidebar.jsx'), 'Prompt must target the affected file');
  assert.ok(prompt.includes('<<<FILE:src/components/Sidebar.jsx>>>'), 'Prompt must specify correct file delimiter');
  assert.ok(prompt.includes('<<<END_FILE>>>'), 'Prompt must require closing delimiter');
});

test('Pipeline 10: Repair — parseSandboxError normalizes min.js and App.tsx to src/App.jsx', () => {
  const minError = 'TypeError: undefined is not a function at min.js:1:450';
  const parsedMin = parseSandboxError(minError);
  assert.equal(parsedMin.detectedFile, 'src/App.jsx', 'min.js should normalize to src/App.jsx');

  const appTsxError = 'SyntaxError: Unexpected token in App.tsx:1:10';
  const parsedTsx = parseSandboxError(appTsxError);
  assert.equal(parsedTsx.detectedFile, 'src/App.jsx', 'App.tsx should normalize to src/App.jsx');
});

test('Pipeline 11: Preview — Preview HTML includes SANDBOX_MOUNT_SUCCESS and sourceURL', () => {
  const files = {
    'src/App.jsx': 'export default function App() { return <h1>Test Mount</h1>; }'
  };
  const html = buildPreviewDoc(files);

  assert.ok(html.includes('SANDBOX_MOUNT_SUCCESS'), 'HTML must emit SANDBOX_MOUNT_SUCCESS on clean mount');
  assert.ok(html.includes('//# sourceURL=src/App.jsx'), 'Must include sourceURL for stack trace clarity');
  assert.ok(html.includes("filename: 'src/App.jsx'"), 'Babel filename must be src/App.jsx, not App.tsx');
});

test('Pipeline 12: Token Rollback — Token rollback occurs after failed generation', () => {
  const mockStorage = new Map();
  globalThis.window = { dispatchEvent: () => {} };
  globalThis.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } };
  globalThis.localStorage = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key)
  };

  const testUserId = 'test_rollback_user_' + Date.now();
  resetTokenUsage(0, testUserId);

  // Initial consumption
  const recorded = recordTokenUsage(1200, {}, testUserId);
  assert.equal(recorded.used, 1200, 'Recorded 1200 tokens');

  // Rollback on validation failure
  const rolledBack = rollbackTokenUsage(1200, testUserId);
  assert.equal(rolledBack.used, 0, 'Tokens should be refunded to 0');
  assert.equal(rolledBack.lastTurn.rolledBack, true);

  delete globalThis.window;
  delete globalThis.CustomEvent;
  delete globalThis.localStorage;
});
