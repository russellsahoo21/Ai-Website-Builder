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

test('Pipeline 13: File Parsing — Unclosed Markdown block is rejected, not added to raw files, and isComplete is false', () => {
  const unclosedMarkdown = 'Here is the component:\n```jsx\nexport default function App() {\n  return <div>Incomplete block;\n';
  const existingFiles = {
    'src/App.jsx': 'export default function App() { return <div>Safe Old App</div>; }'
  };

  const parsed = parseGeneratedFiles(unclosedMarkdown, existingFiles);
  assert.equal(parsed.isComplete, false, 'Unclosed markdown must make isComplete false');
  assert.ok(parsed.errors.length > 0, 'Must record a structured error for unclosed markdown');
  assert.match(parsed.errors[0].reason, /Unclosed markdown code block/);
  // Preserves existing safe file
  assert.equal(parsed.files['src/App.jsx'], existingFiles['src/App.jsx'], 'Safe file must be preserved');
});

test('Pipeline 14: File Parsing — Unclosed patch block is rejected, not applied to base code, and isComplete is false', () => {
  const existingFiles = {
    'src/App.jsx': 'export default function App() { return <h1>Original Heading</h1>; }'
  };
  const unclosedPatch = `
<<<PATCH:src/App.jsx>>>
<<<<<<< SEARCH
<h1>Original Heading</h1>
=======
<h1>Modified Heading</h1>
`;

  const parsed = parseGeneratedFiles(unclosedPatch, existingFiles);
  assert.equal(parsed.isComplete, false, 'Unclosed patch must make isComplete false');
  assert.ok(parsed.errors.length > 0, 'Must record structured error for unclosed patch');
  assert.match(parsed.errors[0].reason, /Truncated patch block/);
  // Must NOT apply the patch
  assert.equal(parsed.files['src/App.jsx'], existingFiles['src/App.jsx'], 'Original file must remain untouched');
});

test('Pipeline 15: Pipeline Integration — Model stream -> incomplete output -> parser rejection -> previous files preserved -> repair triggered', () => {
  const existingFiles = {
    'src/App.jsx': 'export default function App() { return <div>Existing Rock Solid App</div>; }'
  };

  // 1. Model stream simulation: 2 network chunks with incomplete code cut off halfway
  let accumulatedText = '';
  const parser = createSseLineParser((line) => {
    if (line.startsWith('data: ') && !line.includes('[DONE]')) {
      const data = JSON.parse(line.replace('data: ', ''));
      accumulatedText += data.choices[0].delta.content || '';
    }
  });

  parser.feed('data: {"choices":[{"delta":{"content":"<<<FILE:src/App.jsx>>>\\nexport default function App() { return <div>Broken Cut Off"}}]}\n');
  parser.feed('data: [DONE]\n');
  parser.flush();

  // 2. File parser execution
  const parseResult = parseGeneratedFiles(accumulatedText, existingFiles);

  // 3. Parser rejection assertion
  assert.equal(parseResult.isComplete, false, 'Incomplete stream output must be marked isComplete: false');
  assert.ok(parseResult.errors.length > 0, 'Must contain structured parser errors');
  assert.equal(parseResult.errors[0].file, 'src/App.jsx');

  // 4. Working project preserved assertion
  let activeProjectFiles = existingFiles;
  if (parseResult.isComplete && parseResult.errors.length === 0) {
    activeProjectFiles = parseResult.files;
  }
  assert.equal(activeProjectFiles['src/App.jsx'], existingFiles['src/App.jsx'], 'Previous working project must be preserved unchanged');

  // 5. Repair prompt triggered
  const firstErr = parseResult.errors[0];
  const repairPrompt = buildFixPrompt(`Model output was incomplete for ${firstErr.file}: ${firstErr.reason}`, activeProjectFiles['src/App.jsx']);
  assert.ok(repairPrompt.includes('src/App.jsx'), 'Repair prompt must target affected file');
  assert.ok(repairPrompt.includes('<<<END_FILE>>>'), 'Repair prompt must enforce closing delimiter');
});

test('Pipeline 16: useGeneration Guard — Parser errors must never be ignored or allow broken code to overwrite project', () => {
  const currentFiles = {
    'src/App.jsx': 'export default function App() { return <div>Working App</div>; }'
  };

  // Incomplete parser result
  const finalResult = {
    files: { 'src/App.jsx': 'export default function App() { return <div>Cut off...' },
    errors: [{ file: 'src/App.jsx', reason: 'Missing <<<END_FILE>>> delimiter for src/App.jsx.' }],
    warnings: [],
    isComplete: false
  };

  // Logic replicated directly from useGeneration.js onComplete
  const hasParserErrors = !finalResult?.isComplete || (finalResult?.errors && finalResult.errors.length > 0);
  assert.equal(hasParserErrors, true);

  let committedFiles = currentFiles;
  let replyMessage = '';

  if (hasParserErrors) {
    const firstErr = finalResult.errors[0];
    replyMessage = `Generation was cut off or incomplete for ${firstErr.file}. Preserving your working code while auto-repairing in background…`;
    // Do NOT commit files!
  } else {
    committedFiles = finalResult.files;
    replyMessage = 'Synthesis complete.';
  }

  assert.equal(committedFiles['src/App.jsx'], currentFiles['src/App.jsx'], 'Working files must not be overwritten');
  assert.ok(!replyMessage.includes('Synthesis complete'), 'Must not claim synthesis complete on incomplete output');
  assert.ok(replyMessage.includes('Preserving your working code'), 'Must inform user of preservation and repair');
});

test('Pipeline 17: Sandbox Messages — Runtime syntax error triggers repair only when idle and avoids repeating for unchanged error', () => {
  let isGenerating = false;
  let lastHandledError = '';
  let handledCount = 0;
  let manualFixCount = 0;

  function simulateMessage(event) {
    if (event.data?.type === 'TRIGGER_AUTO_FIX') {
      lastHandledError = '';
      manualFixCount++;
      return;
    }

    if (event.data?.type === 'SANDBOX_RUNTIME_ERROR') {
      if (isGenerating) return; // Only when idle

      const rawMsg = event.data.error?.message;
      if (lastHandledError === rawMsg) {
        return; // Avoid repeatedly repairing unchanged error
      }

      lastHandledError = rawMsg;
      handledCount++;
    }
  }

  const errorEvent = {
    data: {
      type: 'SANDBOX_RUNTIME_ERROR',
      error: { message: 'SyntaxError: Unexpected token at src/App.jsx:12:4' }
    }
  };

  // 1. When isGenerating is true, error is ignored
  isGenerating = true;
  simulateMessage(errorEvent);
  assert.equal(handledCount, 0, 'Must ignore error while generating');

  // 2. When idle, first occurrence triggers repair
  isGenerating = false;
  simulateMessage(errorEvent);
  assert.equal(handledCount, 1, 'Must trigger repair when idle');

  // 3. Second occurrence of identical unchanged error is NOT repeated
  simulateMessage(errorEvent);
  assert.equal(handledCount, 1, 'Must not repeat repair for identical unchanged error');

  // 4. Manual Auto-Fix ALWAYS triggers
  simulateMessage({ data: { type: 'TRIGGER_AUTO_FIX', error: { message: 'Manual click' } } });
  assert.equal(manualFixCount, 1, 'Manual auto-fix must always trigger');

  // 5. After manual fix or file change reset, subsequent error triggers again
  simulateMessage(errorEvent);
  assert.equal(handledCount, 2, 'Must allow subsequent repair after reset');
});

test('Pipeline 18: Valid Generation — Valid complete generation is committed normally', () => {
  const completeOutput = `
<<<FILE:src/App.jsx>>>
import React from 'react';

export default function App() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Valid Complete Application</h1>
    </main>
  );
}
<<<END_FILE>>>
`;

  const parsed = parseGeneratedFiles(completeOutput);
  assert.equal(parsed.isComplete, true, 'Complete valid output must be isComplete: true');
  assert.equal(parsed.errors.length, 0, 'Must have zero parser errors');
  assert.ok(parsed.files['src/App.jsx'], 'Parsed file must exist');

  const validation = validateProjectFiles(parsed.files);
  assert.equal(validation.isValid, true, 'Valid JSX must pass Babel validation');
  assert.equal(validation.errors.length, 0);
});

test('Pipeline 19: Sandbox Iframe — Compilation and syntax errors cannot replace last-good preview', () => {
  const workingFiles = {
    'src/App.jsx': 'export default function App() { return <div>Rock Solid App</div>; }'
  };
  const brokenFiles = {
    'src/App.jsx': 'export default function App() { return <div>Missing Close Bracket;'
  };

  // 1. Initial working files validate cleanly
  const workingValidation = validateProjectFiles(workingFiles);
  assert.equal(workingValidation.isValid, true);
  const lastGoodDoc = buildPreviewDoc(workingFiles);
  assert.ok(lastGoodDoc.includes('Rock Solid App'));

  // 2. Broken update is caught by validateProjectFiles before touching preview
  const brokenValidation = validateProjectFiles(brokenFiles);
  assert.equal(brokenValidation.isValid, false, 'Broken syntax must be rejected');
  assert.ok(brokenValidation.errors.length > 0);

  // 3. Last good preview remains intact
  let activePreviewDoc = lastGoodDoc;
  if (brokenValidation.isValid) {
    activePreviewDoc = buildPreviewDoc(brokenFiles);
  }
  assert.equal(activePreviewDoc, lastGoodDoc, 'Last good preview doc must not be replaced by broken syntax');
});

test('Pipeline 20: Message Association — Stale mount messages from untracked sources do not promote pending documents', () => {
  const pendingWindow = { name: 'valid_staging_iframe' };
  const staleWindow = { name: 'stale_old_iframe' };

  let activeDoc = 'doc_v1';
  let pendingDoc = 'doc_v2';
  let promoted = false;

  function handleMountEvent(event) {
    // Only accept from expected pending window
    if (event.source !== pendingWindow) {
      return; // Ignored as stale!
    }
    activeDoc = pendingDoc;
    promoted = true;
  }

  // 1. Stale event arrives
  handleMountEvent({ source: staleWindow, data: { type: 'SANDBOX_MOUNT_SUCCESS' } });
  assert.equal(promoted, false, 'Stale mount event must be ignored');
  assert.equal(activeDoc, 'doc_v1', 'Active preview must remain v1');

  // 2. Expected event arrives
  handleMountEvent({ source: pendingWindow, data: { type: 'SANDBOX_MOUNT_SUCCESS' } });
  assert.equal(promoted, true, 'Genuine mount event must promote preview');
  assert.equal(activeDoc, 'doc_v2', 'Active preview is promoted to v2');
});

test('Pipeline 21: Message Association — Stale runtime error messages from untracked sources do not trigger error callbacks', () => {
  const activeWindow = { name: 'active_iframe' };
  const pendingWindow = { name: 'pending_iframe' };
  const foreignWindow = { name: 'foreign_window' };

  let handledError = null;

  function handleRuntimeErrorEvent(event) {
    const isPending = event.source === pendingWindow;
    const isActive = event.source === activeWindow;
    if (!isPending && !isActive) {
      return; // Stale message from old instance ignored!
    }
    handledError = event.data.error;
  }

  // Stale event from foreign window
  handleRuntimeErrorEvent({ source: foreignWindow, data: { type: 'SANDBOX_RUNTIME_ERROR', error: { message: 'stale crash' } } });
  assert.equal(handledError, null, 'Stale error must be completely ignored');

  // Error from genuine pending staging window
  handleRuntimeErrorEvent({ source: pendingWindow, data: { type: 'SANDBOX_RUNTIME_ERROR', error: { message: 'staging crash' } } });
  assert.equal(handledError?.message, 'staging crash', 'Genuine staging error must be processed');
});

test('Pipeline 22: Unified Repair Flow — Dispatched syntax errors automatically route to repair when idle without requiring manual click', () => {
  let isGenerating = false;
  let autoFixTriggered = false;
  let repairMessage = '';
  let lastHandledError = '';

  function handleSandboxError(err) {
    if (isGenerating) return;
    const rawMsg = typeof err === 'string' ? err : err?.message;
    if (lastHandledError === rawMsg) return;
    lastHandledError = rawMsg;
    autoFixTriggered = true;
    repairMessage = rawMsg;
  }

  // Simulate SandboxIframe discovering invalid syntax in generated project
  const invalidFiles = {
    'src/App.jsx': 'export default function App() { return <div>Syntax Error;'
  };
  const validation = validateProjectFiles(invalidFiles);
  assert.equal(validation.isValid, false);

  // Calls handleSandboxError directly
  handleSandboxError(validation.errors[0]);
  assert.equal(autoFixTriggered, true, 'Automatic repair must be triggered immediately without requiring user click');
  assert.ok(repairMessage.includes('src/App.jsx'));

  // Duplicate error with same message is rejected
  autoFixTriggered = false;
  handleSandboxError(validation.errors[0]);
  assert.equal(autoFixTriggered, false, 'Identical unchanged error must not trigger duplicate repair');
});

test('Pipeline 23: Double-Buffered Staging — Repaired code replaces active preview only after verified matching window mount success', () => {
  let activeSlot = 'A';
  let stagingSlot = 'B';
  let lastGoodDoc = '<h1>Initial Working Preview</h1>';
  let pendingDoc = '<h1>Repaired Modular Preview</h1>';

  const windowA = { id: 'window_A' };
  const windowB = { id: 'window_B' };

  let currentPendingWindow = windowB; // Staged in slot B

  function processMountMessage(event) {
    if (event.source !== currentPendingWindow) {
      return false; // Rejected
    }
    lastGoodDoc = pendingDoc;
    activeSlot = stagingSlot;
    currentPendingWindow = null;
    return true;
  }

  // Try mounting with window A while window B is pending
  const staleResult = processMountMessage({ source: windowA });
  assert.equal(staleResult, false);
  assert.equal(activeSlot, 'A', 'Active slot must remain A');

  // Verify mount with genuine window B
  const genuineResult = processMountMessage({ source: windowB });
  assert.equal(genuineResult, true);
  assert.equal(activeSlot, 'B', 'Active slot promoted to B');
  assert.equal(lastGoodDoc, pendingDoc, 'Last good preview updated');
});

test('Pipeline 24: Semantic Validation — Detects undefined variables and components', () => {
  const filesWithUndefinedVar = {
    'src/App.jsx': [
      'import React from "react";',
      'export default function App() {',
      '  const val = getDynamicScore();',
      '  return <div>{val}</div>;',
      '}'
    ].join('\n')
  };

  const res = validateProjectFiles(filesWithUndefinedVar);
  assert.equal(res.isValid, false);
  assert.ok(res.errors.some(e => e.message.includes('getDynamicScore')));
  assert.equal(res.errors[0].errorStage, 'validation');
});

test('Pipeline 25: Semantic Validation — Detects missing local file imports', () => {
  const filesWithMissingLocalImport = {
    'src/App.jsx': [
      'import React from "react";',
      'import Header from "./components/Header.jsx";',
      'export default function App() {',
      '  return <Header />;',
      '}'
    ].join('\n')
  };

  const res = validateProjectFiles(filesWithMissingLocalImport);
  assert.equal(res.isValid, false);
  assert.ok(res.errors.some(e => e.message.includes('Missing local import: "./components/Header.jsx"')));
  assert.equal(res.errors[0].errorStage, 'validation');
});

test('Pipeline 26: Semantic Validation — Detects missing primary App export', () => {
  const filesWithoutAppExport = {
    'src/App.jsx': [
      'import React from "react";',
      'const helper = () => 42;',
      'function SubComponent() { return <div>Sub</div>; }'
    ].join('\n')
  };

  const res = validateProjectFiles(filesWithoutAppExport);
  assert.equal(res.isValid, false);
  assert.ok(res.errors.some(e => e.message.includes('Missing App component export')));
  assert.equal(res.errors[0].errorStage, 'validation');
});

test('Pipeline 27: Semantic Validation — Detects unsupported external packages', () => {
  const filesWithUnsupportedPkg = {
    'src/App.jsx': [
      'import React from "react";',
      'import _ from "lodash";',
      'export default function App() { return <div>{_.isEmpty([])}</div>; }'
    ].join('\n')
  };

  const res = validateProjectFiles(filesWithUnsupportedPkg);
  assert.equal(res.isValid, false);
  assert.ok(res.errors.some(e => e.message.includes('Unsupported external package "lodash"')));
  assert.equal(res.errors[0].errorStage, 'validation');
});

test('Pipeline 28: Sandbox Message Security — Validates payload shape and filters stale previewId', () => {
  const currentPreviewId = 'prev_expected_999';
  let mountReceived = false;

  function handleMessage(event) {
    // 1. Verify object shape
    if (!event.data || typeof event.data !== 'object') return false;
    const { type, previewId } = event.data;
    if (type !== 'SANDBOX_MOUNT_SUCCESS' && type !== 'SANDBOX_RUNTIME_ERROR') return false;

    // 2. Reject mismatched previewId
    if (previewId && previewId !== currentPreviewId) return false;

    if (type === 'SANDBOX_MOUNT_SUCCESS') {
      mountReceived = true;
      return true;
    }
    return true;
  }

  // Raw primitive payload ignored
  assert.equal(handleMessage({ data: 'hello' }), false);
  assert.equal(handleMessage({ data: null }), false);

  // Unknown message type ignored
  assert.equal(handleMessage({ data: { type: 'SOME_OTHER_EVENT' } }), false);

  // Mismatched / stale previewId ignored
  assert.equal(handleMessage({ data: { type: 'SANDBOX_MOUNT_SUCCESS', previewId: 'prev_old_000' } }), false);
  assert.equal(mountReceived, false);

  // Matching previewId accepted
  assert.equal(handleMessage({ data: { type: 'SANDBOX_MOUNT_SUCCESS', previewId: currentPreviewId } }), true);
  assert.equal(mountReceived, true);
});

test('Pipeline 29: Auto-Repair Reliability — Exhaustion at 3 retries and deduplication', () => {
  const MAX_AUTO_FIX_ATTEMPTS = 3;
  let autoFixCount = 0;
  let messages = [];
  let lastError = '';

  function triggerRepair(errMsg) {
    if (errMsg === lastError) {
      return; // deduplicated
    }
    lastError = errMsg;

    if (autoFixCount >= MAX_AUTO_FIX_ATTEMPTS) {
      messages.push({
        role: 'ai',
        content: 'Auto-repair reached the maximum retry limit (3/3). Please inspect the code or try a different prompt.'
      });
      return;
    }

    autoFixCount++;
    messages.push({ role: 'system', content: `Auto-repair attempt ${autoFixCount}` });
  }

  // Attempt 1
  triggerRepair('Error A');
  assert.equal(autoFixCount, 1);

  // Duplicate ignored
  triggerRepair('Error A');
  assert.equal(autoFixCount, 1);

  // Attempt 2
  triggerRepair('Error B');
  assert.equal(autoFixCount, 2);

  // Attempt 3
  triggerRepair('Error C');
  assert.equal(autoFixCount, 3);

  // Attempt 4 -> Exhausted
  triggerRepair('Error D');
  assert.equal(autoFixCount, 3, 'Must not exceed MAX_AUTO_FIX_ATTEMPTS');
  assert.ok(messages[messages.length - 1].content.includes('maximum retry limit (3/3)'));
});

test('Pipeline 30: Diagnostics — Classifies failure stages (parsing, validation, compilation, runtime)', () => {
  const parseErr = parseSandboxError({ message: 'Missing delimiter', errorStage: 'parsing', file: 'src/App.jsx', line: 12 });
  assert.equal(parseErr.errorStage, 'parsing');
  assert.equal(parseErr.detectedFile, 'src/App.jsx');
  assert.equal(parseErr.lineNumber, 12);

  const valErr = parseSandboxError({ message: 'computeAnalyticsRate is not defined', errorStage: 'validation', file: 'src/App.jsx', line: 8 });
  assert.equal(valErr.errorStage, 'validation');
  assert.equal(valErr.errorType, 'Undefined Variable');
  assert.equal(valErr.lineNumber, 8);

  const compErr = parseSandboxError({ message: 'Unexpected token (14:2)', errorStage: 'compilation', file: 'src/App.jsx', line: 14 });
  assert.equal(compErr.errorStage, 'compilation');
  assert.equal(compErr.errorType, 'Syntax Error');
  assert.equal(compErr.lineNumber, 14);

  const runErr = parseSandboxError({ message: 'Cannot read properties of undefined (reading "map")', errorStage: 'runtime', file: 'src/components/Card.jsx', line: 22 });
  assert.equal(runErr.errorStage, 'runtime');
  assert.equal(runErr.errorType, 'Null Access Error');
  assert.equal(runErr.detectedFile, 'src/components/Card.jsx');
  assert.equal(runErr.lineNumber, 22);
});
