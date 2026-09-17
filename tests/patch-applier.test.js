import test from 'node:test';
import assert from 'node:assert/strict';
import { applySearchReplacePatch, applyUnifiedDiffPatch } from '../src/utils/diffApplier.js';
import { parseGeneratedFiles } from '../src/services/fileParser.js';

test('Patch Applier — Exact search and replace match', () => {
  const baseCode = `
import React from 'react';
export default function App() {
  return <h1 className="text-xl">Old Heading</h1>;
}
`;

  const patchText = `
<<<< SEARCH
  return <h1 className="text-xl">Old Heading</h1>;
==== REPLACE
  return <h1 className="text-2xl font-bold">New Enhanced Heading</h1>;
>>>>
`;

  const result = applySearchReplacePatch(baseCode, patchText);
  assert.equal(result.success, true);
  assert.equal(result.appliedCount, 1);
  assert.match(result.content, /New Enhanced Heading/);
  assert.doesNotMatch(result.content, /Old Heading/);
});

test('Patch Applier — Whitespace-tolerant match with indent variations', () => {
  const baseCode = `
function Header() {
    return (
        <header className="header">
            <nav>Nav</nav>
        </header>
    );
}
`;

  const patchText = `
<<<< SEARCH
  <header className="header">
      <nav>Nav</nav>
  </header>
==== REPLACE
  <header className="header bg-black text-white">
      <nav>Nav Updated</nav>
  </header>
>>>>
`;

  const result = applySearchReplacePatch(baseCode, patchText);
  assert.equal(result.success, true);
  assert.match(result.content, /Nav Updated/);
});

test('Patch Applier — Unified diff fallback (@@ ... @@)', () => {
  const baseCode = `line 1
line 2
line 3`;

  const diffText = `@@ -1,3 +1,3 @@
 line 1
-line 2
+line 2 modified
 line 3`;

  const result = applyUnifiedDiffPatch(baseCode, diffText);
  assert.equal(result.success, true);
  assert.match(result.content, /line 2 modified/);
});

test('Patch Applier Integration — Surgical patch inside <<<PATCH:src/App.jsx>>>', () => {
  const existingFiles = {
    'src/App.jsx': `
import React from 'react';
export default function App() {
  return <div>Original App</div>;
}
`
  };

  const aiOutput = `
<<<PATCH:src/App.jsx>>>
<<<< SEARCH
  return <div>Original App</div>;
==== REPLACE
  return <div>Patched App Content</div>;
>>>>
<<<END_PATCH>>>
`;

  const parsed = parseGeneratedFiles(aiOutput, existingFiles);
  assert.ok(parsed.files['src/App.jsx'], 'Should patch and return src/App.jsx');
  assert.match(parsed.files['src/App.jsx'], /Patched App Content/);
  assert.doesNotMatch(parsed.files['src/App.jsx'], /Original App/);
});
