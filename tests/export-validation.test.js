import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProjectBuild } from '../src/utils/exportValidator.js';

test('Export Validator — Valid clean React project passes', () => {
  const cleanFiles = {
    'src/App.jsx': `import React from 'react';
export default function App() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Hello World</h1>
    </div>
  );
}`,
    'src/components/Header.jsx': `import React from 'react';
export default function Header() {
  return <header>AetherCraft</header>;
}`,
    'index.html': '<!DOCTYPE html><html><body><div id="root"></div></body></html>'
  };

  const res = validateProjectBuild(cleanFiles);
  assert.equal(res.isValid, true, 'Clean project should be valid');
  assert.equal(res.errors.length, 0, 'No errors in clean project');
});

test('Export Validator — Missing entry point produces error', () => {
  const filesWithoutApp = {
    'src/utils/helpers.js': 'export const add = (a, b) => a + b;'
  };

  const res = validateProjectBuild(filesWithoutApp);
  assert.equal(res.isValid, false, 'Project without App entry should be invalid');
  assert.ok(res.errors.some(e => e.message.includes('Missing primary entry point')), 'Error mentions missing entry point');
});

test('Export Validator — Syntax error in JSX is flagged with line number', () => {
  const brokenFiles = {
    'src/App.jsx': `import React from 'react';
export default function App() {
  return (
    <div>
      <button>Unclosed button
    </div>
  );
}`
  };

  const res = validateProjectBuild(brokenFiles);
  assert.equal(res.isValid, false, 'Syntax error project should be invalid');
  assert.ok(res.errors.length > 0, 'Should return syntax error');
  assert.equal(res.errors[0].file, 'src/App.jsx');
  assert.ok(res.errors[0].line !== null, 'Should detect error line');
});

test('Export Validator — Missing local relative imports generate warnings', () => {
  const filesWithBrokenImport = {
    'src/App.jsx': `import React from 'react';
import NonExistentModal from './components/NonExistentModal';
export default function App() {
  return <div><NonExistentModal /></div>;
}`
  };

  const res = validateProjectBuild(filesWithBrokenImport);
  assert.ok(res.warnings.length > 0, 'Should warn on missing local import');
  assert.ok(res.warnings[0].message.includes('NonExistentModal'));
});
