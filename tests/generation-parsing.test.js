import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGeneratedFiles } from '../src/services/fileParser.js';

test('Generation Parsing — <<<FILE:...>>> delimiters with multiple files', () => {
  const aiOutput = `
Here is your application:
<<<FILE:src/App.jsx>>>
import React from 'react';
export default function App() {
  return <h1 className="text-xl">Hello World</h1>;
}
<<<END_FILE>>>

<<<FILE:src/index.css>>>
@tailwind base;
@tailwind components;
@tailwind utilities;
<<<END_FILE>>>
`;

  const parsed = parseGeneratedFiles(aiOutput);
  assert.ok(parsed.files['src/App.jsx'], 'Should extract src/App.jsx');
  assert.ok(parsed.files['src/index.css'], 'Should extract src/index.css');
  assert.match(parsed.files['src/App.jsx'], /Hello World/);
  assert.match(parsed.files['src/index.css'], /@tailwind/);
  assert.equal(parsed.needsReactConversion, false);
});

test('Generation Parsing — Markdown code block fallback with filename annotation', () => {
  const aiOutput = `
\`\`\`jsx filename="src/components/Card.jsx"
import React from 'react';
export function Card({ title }) {
  return <div className="p-4 border">{title}</div>;
}
\`\`\`
`;

  const parsed = parseGeneratedFiles(aiOutput);
  assert.ok(parsed.files['src/components/Card.jsx'], 'Should extract Card component with filename');
  assert.match(parsed.files['src/components/Card.jsx'], /export function Card/);
});

test('Generation Parsing — Bare React/JSX code fallback', () => {
  const aiOutput = `
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
`;

  const parsed = parseGeneratedFiles(aiOutput);
  assert.ok(parsed.files['src/App.jsx'], 'Bare JSX should classify into src/App.jsx');
  assert.match(parsed.files['src/App.jsx'], /useState\(0\)/);
});

test('Generation Parsing — Full-Stack Node/Express and SQL schema preservation', () => {
  const aiOutput = `
<<<FILE:server/index.js>>>
const express = require('express');
const app = express();
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.listen(3001);
<<<END_FILE>>>

<<<FILE:server/db/schema.sql>>>
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL
);
<<<END_FILE>>>

<<<FILE:src/App.jsx>>>
import React from 'react';
export default function App() {
  return <div>Fullstack Client</div>;
}
<<<END_FILE>>>
`;

  const parsed = parseGeneratedFiles(aiOutput);
  assert.ok(parsed.files['server/index.js'], 'Should preserve server/index.js path');
  assert.ok(parsed.files['server/db/schema.sql'], 'Should preserve server/db/schema.sql path');
  assert.ok(parsed.files['src/App.jsx'], 'Should extract client App.jsx');
  assert.match(parsed.files['server/index.js'], /app\.listen/);
  assert.match(parsed.files['server/db/schema.sql'], /CREATE TABLE/);
});

test('Generation Parsing — Truncated file preserves partial content and marks isComplete false', () => {
  const truncatedOutput = `
<<<FILE:src/App.jsx>>>
import React, { useState } from 'react';

export default function App() {
  const [data, setData] = useState([]);
  return (
    <div className="p-4">
      <h1>Incomplete Page
`;
  const parsed = parseGeneratedFiles(truncatedOutput);
  assert.equal(parsed.isComplete, false, 'Should mark isComplete false for unclosed file');
  assert.equal(parsed.errors.length, 1, 'Should have 1 error for missing END_FILE');
  assert.match(parsed.errors[0].reason, /Missing <<<END_FILE>>> delimiter/);
  assert.ok(parsed.rawFiles['src/App.jsx'], 'Should store partial code in rawFiles');
  assert.match(parsed.rawFiles['src/App.jsx'], /Incomplete Page/);
  assert.equal(parsed.files['src/App.jsx'], undefined, 'Incomplete file should not be committed to files');
});

test('Stream Metadata — extractStreamMeta correctly parses finish_reason, usage, and done', async () => {
  const { extractStreamMeta } = await import('../src/services/aiService.js');

  // Normal chunk with content
  const chunkLine = 'data: {"choices":[{"delta":{"content":"export default"},"finish_reason":null}]}';
  const chunkMeta = extractStreamMeta(chunkLine);
  assert.equal(chunkMeta.delta, 'export default');
  assert.equal(chunkMeta.finishReason, null);
  assert.equal(chunkMeta.isDone, false);

  // Truncation finish_reason line
  const truncLine = 'data: {"choices":[{"delta":{},"finish_reason":"length"}]}';
  const truncMeta = extractStreamMeta(truncLine);
  assert.equal(truncMeta.finishReason, 'length');
  assert.equal(truncMeta.isDone, false);

  // Usage line
  const usageLine = 'data: {"choices":[],"usage":{"prompt_tokens":120,"completion_tokens":250,"total_tokens":370}}';
  const usageMeta = extractStreamMeta(usageLine);
  assert.equal(usageMeta.usage.total_tokens, 370);

  // Stream done
  const doneLine = 'data: [DONE]';
  const doneMeta = extractStreamMeta(doneLine);
  assert.equal(doneMeta.isDone, true);
});

test('Error Reporter — buildFixPrompt includes partialCode for truncation and currentCode for syntax errors', async () => {
  const { buildFixPrompt } = await import('../src/sandbox/errorReporter.js');

  const partialApp = 'export default function App() { return <div>Truncated';
  const truncPrompt = buildFixPrompt('Model output was incomplete for src/App.jsx: Generation reached token limit (finish_reason: length)', '', partialApp);
  assert.match(truncPrompt, /cut off or truncated before completion/);
  assert.match(truncPrompt, /Truncated/);
  assert.match(truncPrompt, /<<<FILE:src\/App\.jsx>>>/);

  const currentCode = 'function App() { return <div>Broken</div }';
  const syntaxPrompt = buildFixPrompt('SyntaxError: Unexpected token in src/App.jsx', currentCode);
  assert.match(syntaxPrompt, /SyntaxError/);
  assert.match(syntaxPrompt, /Broken/);
});
