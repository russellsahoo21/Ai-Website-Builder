import test from 'node:test';
import assert from 'node:assert/strict';
import { ensureStandardReactStructure } from '../src/utils/projectStructure.js';
import { deriveProjectName, getDefaultStarterProjects } from '../src/services/projectService.js';

test('Project Structure — Normalization ensures standard files exist', () => {
  const rawFiles = {
    'src/App.jsx': 'export default function App() { return <div>Test</div>; }'
  };

  const normalized = ensureStandardReactStructure(rawFiles, 'Test Project');
  assert.ok(normalized['index.html'], 'Should ensure index.html exists');
  assert.ok(normalized['package.json'], 'Should ensure package.json exists');
  assert.ok(normalized['src/main.jsx'], 'Should ensure src/main.jsx exists');
  assert.ok(normalized['src/index.css'], 'Should ensure src/index.css exists');
  assert.ok(normalized['src/App.jsx'], 'Should preserve existing src/App.jsx');
});

test('Project Structure — Starter templates constraint enforces strictly 2 defaults', () => {
  const defaults = getDefaultStarterProjects();
  assert.equal(defaults.length, 2, 'Must provide strictly 2 curated default starter projects');
  assert.ok(defaults[0].id.startsWith('seeded_'));
  assert.ok(defaults[1].id.startsWith('seeded_'));
  assert.ok(defaults[0].files['src/App.jsx']);
  assert.ok(defaults[1].files['src/App.jsx']);
});

test('Project Sync — deriveProjectName cleans common command verbs', () => {
  assert.equal(deriveProjectName('build a crypto portfolio tracker'), 'Crypto portfolio tracker');
  assert.equal(deriveProjectName('create an e-commerce dashboard for shoes'), 'E-commerce dashboard for shoes');
  assert.equal(deriveProjectName('generate a luxury real estate showcase'), 'Luxury real estate showcase');
  assert.equal(deriveProjectName(''), 'Untitled Project');
});
