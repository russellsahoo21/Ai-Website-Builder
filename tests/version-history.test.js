import test from 'node:test';
import assert from 'node:assert/strict';

// Set up browser-like localStorage mock for node test runner
const store = new Map();
global.window = {
  location: { pathname: '/', hash: '' }
};
global.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, val) => store.set(key, String(val)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear(),
};

import { 
  createNewProject, 
  createProjectVersion, 
  getProjectVersions, 
  restoreProjectVersion, 
  deleteProjectVersion,
  getProjectById
} from '../src/services/projectService.js';

test('Version History — Creates and tracks checkpoints', () => {
  store.clear();
  const project = createNewProject({
    name: 'Version Test App',
    files: { 'src/App.jsx': 'export default function App() { return <div>V1</div>; }' }
  });

  assert.ok(project?.id, 'Project created');

  // Checkpoint 1
  const v1 = createProjectVersion(project.id, 'V1 Initial', {
    'src/App.jsx': 'export default function App() { return <div>V1</div>; }'
  }, 'Initial prompt');

  assert.ok(v1?.id, 'Version 1 created');
  assert.equal(v1.label, 'V1 Initial');
  assert.equal(v1.fileCount >= 1, true);

  // Checkpoint 2
  const v2 = createProjectVersion(project.id, 'V2 Added Button', {
    'src/App.jsx': 'export default function App() { return <div><button>Click</button></div>; }'
  }, 'Add button');

  assert.ok(v2?.id, 'Version 2 created');

  const versions = getProjectVersions(project.id);
  assert.equal(versions.length, 2, 'Should have 2 checkpoints stored');
  assert.equal(versions[0].id, v2.id, 'Newest version should be first');
});

test('Version History — Restores previous version state', () => {
  const allProjects = store.get('aethercraft_saved_projects');
  const parsed = JSON.parse(allProjects);
  const proj = parsed[0];

  const versions = getProjectVersions(proj.id);
  const v1 = versions.find(v => v.label === 'V1 Initial');
  assert.ok(v1, 'Found V1 checkpoint');

  // Restore V1
  const restoreRes = restoreProjectVersion(proj.id, v1.id);
  assert.ok(restoreRes?.project, 'Restore succeeded');
  assert.ok(restoreRes.project.files['src/App.jsx'].includes('<div>V1</div>'), 'App restored to V1 code');

  // Verify saved project state
  const updatedProj = getProjectById(proj.id);
  assert.ok(updatedProj.files['src/App.jsx'].includes('<div>V1</div>'), 'Persisted project has V1 code');
});

test('Version History — Deletes specific checkpoint', () => {
  const allProjects = store.get('aethercraft_saved_projects');
  const parsed = JSON.parse(allProjects);
  const proj = parsed[0];

  const beforeVersions = getProjectVersions(proj.id);
  const toDelete = beforeVersions[0];

  const success = deleteProjectVersion(proj.id, toDelete.id);
  assert.equal(success, true, 'Delete succeeded');

  const afterVersions = getProjectVersions(proj.id);
  assert.equal(afterVersions.length, beforeVersions.length - 1, 'Version count reduced by 1');
  assert.ok(!afterVersions.some(v => v.id === toDelete.id), 'Deleted version no longer present');
});
