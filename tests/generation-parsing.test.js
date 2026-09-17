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
