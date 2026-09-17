import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getDefaultPersonalWorkspace,
  fetchUserWorkspaces,
  createWorkspace,
  inviteWorkspaceMember,
  getActiveWorkspaceId,
  setActiveWorkspaceId
} from '../src/services/workspaceService.js';

process.env.NODE_ENV = 'test';

test('Workspace Service — Generates valid default personal workspace', () => {
  const ws = getDefaultPersonalWorkspace('user_dev_1', 'Dev');
  assert.equal(ws.id, 'ws_personal_user_dev_1');
  assert.equal(ws.name, "Dev's Workspace");
  assert.equal(ws.owner_id, 'user_dev_1');
  assert.equal(ws.isPersonal, true);
  assert.equal(ws.plan, 'free');
  assert.ok(ws.created_at);
});

test('Workspace Service — fetchUserWorkspaces returns personal workspace for guest/user', async () => {
  const workspaces = await fetchUserWorkspaces('user_test_99');
  assert.ok(Array.isArray(workspaces));
  assert.ok(workspaces.length >= 1);
  assert.equal(workspaces[0].owner_id, 'user_test_99');
  assert.equal(workspaces[0].isPersonal, true);
});

test('Workspace Service — createWorkspace creates team workspace with validated parameters', async () => {
  // Missing fields return null
  assert.equal(await createWorkspace({ name: '', ownerId: 'user_1' }), null);
  assert.equal(await createWorkspace({ name: 'Alpha Team', ownerId: '' }), null);

  const teamWorkspace = await createWorkspace({
    name: '  Hyperion Studios  ',
    ownerId: 'user_founder_42',
    plan: 'enterprise'
  });

  assert.ok(teamWorkspace);
  assert.ok(teamWorkspace.id.startsWith('ws_'));
  assert.equal(teamWorkspace.name, 'Hyperion Studios');
  assert.equal(teamWorkspace.owner_id, 'user_founder_42');
  assert.equal(teamWorkspace.plan, 'enterprise');
  assert.equal(teamWorkspace.isPersonal, false);
  assert.ok(teamWorkspace.created_at);
});

test('Workspace Service — inviteWorkspaceMember creates invite record with normalized email and role', async () => {
  // Missing fields return null
  assert.equal(await inviteWorkspaceMember({ workspaceId: '', email: 'alice@test.com' }), null);
  assert.equal(await inviteWorkspaceMember({ workspaceId: 'ws_123', email: '' }), null);

  const invite = await inviteWorkspaceMember({
    workspaceId: 'ws_team_789',
    email: '  ALICE@company.io  ',
    role: 'editor'
  });

  assert.ok(invite);
  assert.equal(invite.workspace_id, 'ws_team_789');
  assert.equal(invite.email, 'alice@company.io');
  assert.equal(invite.role, 'editor');
  assert.ok(invite.invited_at);
});

test('Workspace Service — Active workspace ID getter/setter with window mock', () => {
  const mockStorage = new Map();
  globalThis.window = {};
  globalThis.localStorage = {
    getItem: (key) => mockStorage.get(key) || null,
    setItem: (key, val) => mockStorage.set(key, String(val)),
    removeItem: (key) => mockStorage.delete(key)
  };

  setActiveWorkspaceId('ws_active_test_456');
  assert.equal(getActiveWorkspaceId(), 'ws_active_test_456');

  setActiveWorkspaceId(null);
  assert.equal(getActiveWorkspaceId(), null);

  delete globalThis.window;
  delete globalThis.localStorage;
});
