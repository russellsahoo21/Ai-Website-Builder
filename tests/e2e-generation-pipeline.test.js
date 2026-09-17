import test from 'node:test';
import assert from 'node:assert/strict';

import { createSseLineParser } from '../src/services/aiService.js';
import { parseGeneratedFiles } from '../src/services/fileParser.js';
import { validateProjectFiles, validateSourceCode } from '../src/utils/codeValidator.js';
import { buildPreviewDoc } from '../src/utils/previewBuilder.js';
import { parseSandboxError, buildFixPrompt } from '../src/sandbox/errorReporter.js';
import { rollbackTokenUsage, recordTokenUsage, getTokenUsage, resetTokenUsage } from '../src/services/tokenService.js';

test('E2E Pipeline: User prompt -> SSE chunks -> fileParser -> validation -> sandbox mount -> runtime error -> auto-repair -> repaired mount success', async (t) => {
  resetTokenUsage('e2e-test-user');

  // Step 1: User prompt
  const userPrompt = 'Create a SaaS Analytics Card with quick action buttons';
  assert.ok(userPrompt.length > 0, 'User prompt should be defined');

  // Step 2: SSE Stream simulating initial AI response with an intentional runtime error (references undefined helper)
  const initialGeneratedAppCode = [
    '<<<FILE:src/App.jsx>>>',
    'import React, { useState } from "react";',
    'import { Activity, ArrowUpRight } from "lucide-react";',
    '',
    'export default function App() {',
    '  const [count, setCount] = useState(120);',
    '  // Intentionally calling an unimported/undefined helper to simulate sandbox runtime failure',
    '  const formatted = computeAnalyticsRate(count);',
    '  return (',
    '    <div className="p-6 bg-zinc-900 text-white rounded-xl">',
    '      <h1 className="text-xl font-bold flex items-center gap-2">',
    '        <Activity className="w-5 h-5 text-cyan-400" /> Analytics Summary',
    '      </h1>',
    '      <p className="text-sm text-zinc-400 mt-2">Active Users: {formatted}</p>',
    '      <button onClick={() => setCount(c => c + 1)} className="mt-4 px-3 py-1.5 bg-cyan-500 text-black rounded font-medium">',
    '        Increment',
    '      </button>',
    '    </div>',
    '  );',
    '}',
    '<<<END_FILE>>>'
  ].join('\n');

  // Feed through SSE line parser chunk by chunk (including fragmented chunks)
  const sseLines = [];
  const sseParser = createSseLineParser((line) => {
    if (line.startsWith('data: ') && !line.includes('[DONE]')) {
      const json = JSON.parse(line.replace('data: ', ''));
      sseLines.push(json.choices[0].delta.content);
    }
  });

  const fullSsePayload = [
    `data: ${JSON.stringify({ choices: [{ delta: { content: initialGeneratedAppCode.slice(0, 150) } }] })}\n`,
    `data: ${JSON.stringify({ choices: [{ delta: { content: initialGeneratedAppCode.slice(150, 350) } }] })}\n`,
    `data: ${JSON.stringify({ choices: [{ delta: { content: initialGeneratedAppCode.slice(350) } }] })}\n`,
    'data: [DONE]\n'
  ];

  fullSsePayload.forEach(chunk => sseParser.feed(chunk));
  sseParser.flush();

  const streamedText = sseLines.join('');
  assert.equal(streamedText, initialGeneratedAppCode, 'SSE persistent stream reconstructed full text without corruption');

  // Step 3: File Parser
  const initialParsed = parseGeneratedFiles(streamedText);
  assert.equal(initialParsed.isComplete, true, 'Parser must confirm output has complete delimiters');
  assert.equal(initialParsed.errors.length, 0, 'No parser errors');
  assert.ok(initialParsed.files['src/App.jsx'], 'File src/App.jsx parsed successfully');

  // Step 4: Semantic Validation detects the undefined variable
  const validationResult = validateProjectFiles(initialParsed.files);
  assert.equal(validationResult.isValid, false, 'Semantic validator must catch undefined variable computeAnalyticsRate');
  assert.ok(validationResult.errors.some(e => e.message.includes('computeAnalyticsRate')), 'Identified failing symbol');
  assert.equal(validationResult.errors[0].errorStage, 'validation', 'Classified as validation error stage');

  // Step 5: Token reservation and rollback upon validation failure
  const mockStorage = new Map();
  globalThis.window = { dispatchEvent: () => {} };
  globalThis.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } };
  globalThis.localStorage = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key)
  };

  const testUserId = 'e2e_user_' + Date.now();
  resetTokenUsage(0, testUserId);

  const recorded = recordTokenUsage(1200, { isEstimated: true }, testUserId);
  assert.equal(recorded.used, 1200, 'Initial token reservation should be 1200');

  // Roll back tokens because pre-mount validation failed
  const rolledBack = rollbackTokenUsage(1200, testUserId);
  assert.equal(rolledBack.used, 0, 'Tokens rolled back after failed validation');
  assert.equal(rolledBack.lastTurn.rolledBack, true, 'Marked as rolledBack');

  delete globalThis.window;
  delete globalThis.CustomEvent;
  delete globalThis.localStorage;

  // Step 5: Test Sandbox Build and Error Mapping
  const previewId1 = 'prev_test_initial_123';
  const previewDoc1 = buildPreviewDoc(initialParsed.files, { previewId: previewId1 });
  assert.ok(previewDoc1.includes(previewId1), 'Preview document includes active previewId');
  assert.ok(previewDoc1.includes('SANDBOX_RUNTIME_ERROR'), 'ErrorBoundary includes runtime error handler');

  // Simulate Sandbox Runtime Error reported from iframe
  const mockSandboxError = {
    message: 'computeAnalyticsRate is not defined at src/App.jsx:7:21',
    stack: 'ReferenceError: computeAnalyticsRate is not defined\n    at App (src/App.jsx:7:21)',
    previewId: previewId1,
    errorStage: 'runtime'
  };

  const parsedDiagnostic = parseSandboxError(mockSandboxError);
  assert.equal(parsedDiagnostic.errorType, 'Undefined Variable');
  assert.equal(parsedDiagnostic.detectedFile, 'src/App.jsx');
  assert.equal(parsedDiagnostic.lineNumber, 7);
  assert.equal(parsedDiagnostic.errorStage, 'runtime');

  // Step 6: Targeted Automatic Repair Prompt Generation
  const repairPrompt = buildFixPrompt(mockSandboxError.message, initialParsed.files['src/App.jsx']);
  assert.ok(repairPrompt.includes('src/App.jsx'));
  assert.ok(repairPrompt.includes('computeAnalyticsRate is not defined'));
  assert.ok(repairPrompt.includes('<<<FILE:src/App.jsx>>> and <<<END_FILE>>>'));

  // Step 7: Repaired AI Stream synthesis
  const repairedAppCode = [
    '<<<FILE:src/App.jsx>>>',
    'import React, { useState } from "react";',
    'import { Activity, ArrowUpRight } from "lucide-react";',
    '',
    '// Fixed helper function declared in scope',
    'function computeAnalyticsRate(val) {',
    '  return (val * 1.15).toFixed(0) + " ops/sec";',
    '}',
    '',
    'export default function App() {',
    '  const [count, setCount] = useState(120);',
    '  const formatted = computeAnalyticsRate(count);',
    '  return (',
    '    <div className="p-6 bg-zinc-900 text-white rounded-xl">',
    '      <h1 className="text-xl font-bold flex items-center gap-2">',
    '        <Activity className="w-5 h-5 text-cyan-400" /> Analytics Summary',
    '      </h1>',
    '      <p className="text-sm text-zinc-400 mt-2">Active Users: {formatted}</p>',
    '      <button onClick={() => setCount(c => c + 1)} className="mt-4 px-3 py-1.5 bg-cyan-500 text-black rounded font-medium">',
    '        Increment',
    '      </button>',
    '    </div>',
    '  );',
    '}',
    '<<<END_FILE>>>'
  ].join('\n');

  // Step 8: Parse Repaired Stream
  const repairedParsed = parseGeneratedFiles(repairedAppCode);
  assert.equal(repairedParsed.isComplete, true);
  assert.equal(repairedParsed.errors.length, 0);

  // Step 9: Validate Repaired Code
  const repairedValidation = validateProjectFiles(repairedParsed.files);
  assert.equal(repairedValidation.isValid, true, 'Repaired code must pass all Babel and semantic checks');
  assert.equal(repairedValidation.errors.length, 0);

  // Step 10: Build Repaired Sandbox Preview
  const previewId2 = 'prev_test_repaired_456';
  const previewDoc2 = buildPreviewDoc(repairedParsed.files, { previewId: previewId2 });
  assert.ok(previewDoc2.includes(previewId2));
  assert.ok(previewDoc2.includes('SANDBOX_MOUNT_SUCCESS'));

  // Step 11: Simulate Sandbox Mounting & Transactional Commit
  let committedFiles = initialParsed.files;
  let activePreviewId = previewId1;

  // Staging simulator
  let stagedPreviewId = previewId2;
  let stagedFiles = repairedParsed.files;

  function handleMessage(event) {
    if (event.data?.type === 'SANDBOX_MOUNT_SUCCESS') {
      // Message Security: verify previewId matches staged preview
      if (event.data.previewId !== stagedPreviewId) {
        return false; // reject stale
      }
      committedFiles = stagedFiles;
      activePreviewId = stagedPreviewId;
      stagedPreviewId = null;
      stagedFiles = null;
      return true;
    }
    return false;
  }

  // Stale message with old previewId1 is ignored
  const staleAccepted = handleMessage({ data: { type: 'SANDBOX_MOUNT_SUCCESS', previewId: previewId1 } });
  assert.equal(staleAccepted, false, 'Stale mount success from previous preview must be ignored');
  assert.equal(activePreviewId, previewId1, 'Active preview must remain previewId1');

  // Genuine mount message for previewId2 succeeds
  const genuineAccepted = handleMessage({ data: { type: 'SANDBOX_MOUNT_SUCCESS', previewId: previewId2 } });
  assert.equal(genuineAccepted, true, 'Genuine mount success promotes staged preview');
  assert.equal(activePreviewId, previewId2, 'Preview updated to previewId2');
  assert.ok(committedFiles['src/App.jsx'].includes('computeAnalyticsRate(val)'), 'Repaired files committed to state');
});
