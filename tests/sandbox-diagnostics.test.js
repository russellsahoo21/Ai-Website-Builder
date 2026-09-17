import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSandboxError } from '../src/sandbox/errorReporter.js';

test('Sandbox Diagnostics — Parses undefined variable error', () => {
  const raw = 'ReferenceError: activeUser is not defined at src/App.jsx:45:12';
  const parsed = parseSandboxError(raw);

  assert.equal(parsed.errorType, 'Undefined Variable');
  assert.ok(parsed.friendlyReason.includes('"activeUser"'));
  assert.equal(parsed.detectedFile, 'src/App.jsx');
  assert.equal(parsed.lineNumber, 45);
  assert.ok(parsed.actionableGuidance.includes('Import'));
});

test('Sandbox Diagnostics — Parses null property access error', () => {
  const raw = "TypeError: Cannot read properties of undefined (reading 'map')";
  const parsed = parseSandboxError(raw);

  assert.equal(parsed.errorType, 'Null Access Error');
  assert.ok(parsed.actionableGuidance.includes('optional chaining'));
});

test('Sandbox Diagnostics — Parses syntax error', () => {
  const raw = 'SyntaxError: Unexpected token, expected "}" at src/components/Card.jsx:18:5';
  const parsed = parseSandboxError(raw);

  assert.equal(parsed.errorType, 'Syntax Error');
  assert.equal(parsed.detectedFile, 'src/components/Card.jsx');
  assert.equal(parsed.lineNumber, 18);
});

test('Sandbox Diagnostics — Parses missing root component error', () => {
  const raw = 'App component not found. Ensure primary component is named "App".';
  const parsed = parseSandboxError(raw);

  assert.equal(parsed.errorType, 'Missing Root Component');
  assert.ok(parsed.actionableGuidance.includes('export default function App'));
});
