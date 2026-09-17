/**
 * errorReporter.js
 * Maps raw sandbox/API error strings to user-friendly messages.
 * Users never see stack traces or raw error text.
 */

const ERROR_PATTERNS = [
  {
    pattern: /Identifier.*already.*been.*declared/i,
    message: 'Optimizing component structure…',
    recoverable: true,
  },
  {
    pattern: /Cannot destructure|Cannot read prop|Cannot read properties/i,
    message: 'Resolving state initialization…',
    recoverable: true,
  },
  {
    pattern: /is not defined/i,
    message: 'Resolving missing dependencies…',
    recoverable: true,
  },
  {
    pattern: /Unexpected token|SyntaxError|Parse error/i,
    message: 'Recompiling application code…',
    recoverable: true,
  },
  {
    pattern: /<!DOCTYPE|<html/i,
    message: 'Converting output to React component…',
    recoverable: true,
  },
  {
    pattern: /must be signed in|sign in to generate|unauthorized.*sign in/i,
    message: 'You must be signed in to generate applications with AetherCraft. Please sign in to proceed.',
    recoverable: false,
  },
  {
    pattern: /401|403|Unauthorized|Forbidden|Invalid API/i,
    message: 'Please check your API key in Settings.',
    recoverable: false,
  },
  {
    pattern: /429|rate.?limit|too many/i,
    message: 'Usage limit reached — retrying in a moment…',
    recoverable: true,
  },
  {
    pattern: /timed.?out|timeout|ETIMEDOUT|stalled/i,
    message: 'Still generating — please wait…',
    recoverable: true,
  },
  {
    pattern: /AbortError|cancelled|canceled|abort/i,
    message: null, // null = do not display anything
    recoverable: false,
  },
  {
    pattern: /network|fetch|ECONNREFUSED|ERR_NETWORK/i,
    message: 'Network issue — please check your connection.',
    recoverable: false,
  },
];

/**
 * Returns a user-friendly message for a raw error string.
 * Returns null if the error should be silently ignored (e.g. user-cancelled).
 */
export function getFriendlyMessage(rawError = '') {
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (pattern.test(rawError)) return message;
  }
  return 'Optimizing application…';
}

/**
 * Returns true if BTS auto-repair should be attempted for this error.
 */
export function isRecoverable(rawError = '') {
  for (const { pattern, recoverable } of ERROR_PATTERNS) {
    if (pattern.test(rawError)) return recoverable;
  }
  return true;
}

/**
 * Builds a targeted fix prompt for the AI based on error type.
 */
export function buildFixPrompt(rawError, currentCode) {
  rawError = rawError || '';
  currentCode = currentCode || '';

  if (/Identifier.*already.*been.*declared/i.test(rawError)) {
    return (
      'Fix this error: ' + rawError + '\n\n' +
      'Rename any component that uses a reserved word (Filter, Search, Save, Tag, Star, Calendar, Settings, Info, Home, Lock, User, Database, Server) ' +
      'to a compound domain-specific name (e.g. FilterPanel, SearchBar). ' +
      'Return the complete corrected src/App.jsx inside <<<FILE:src/App.jsx>>> and <<<END_FILE>>>.'
    );
  }

  if (/<!DOCTYPE|<html/i.test(rawError) || currentCode.trim().toLowerCase().startsWith('<!doctype')) {
    return (
      'The previous output was a raw HTML document. ' +
      'Convert it into a fully functional React 18 component using Tailwind CSS and Lucide icons. ' +
      'Return the complete src/App.jsx inside <<<FILE:src/App.jsx>>> and <<<END_FILE>>>. ' +
      'Do NOT output <!DOCTYPE html> or <html> tags.'
    );
  }

  return (
    'Fix this runtime error in src/App.jsx: "' + rawError + '"\n\n' +
    'Ensure all context hooks have safe defaults, no component names shadow globals, ' +
    'and all referenced variables are declared. ' +
    'Return the complete corrected src/App.jsx inside <<<FILE:src/App.jsx>>> and <<<END_FILE>>>.'
  );
}

/**
 * Analyzes raw sandbox errors and produces clear, actionable diagnostics for the user and auto-fix engine.
 */
export function parseSandboxError(errorInput) {
  const message = typeof errorInput === 'string' ? errorInput : (errorInput?.message || 'Unknown sandbox runtime error');
  const stack = typeof errorInput === 'object' ? (errorInput?.stack || '') : '';

  let errorType = 'Runtime Error';
  let friendlyReason = 'An unexpected issue occurred while rendering component in the sandbox.';
  let actionableGuidance = 'Review recent edits or allow AI auto-repair to fix it automatically.';
  let detectedFile = 'src/App.jsx';
  let lineNumber = null;

  // Extract file and line from stack or message if available
  const lineMatch = message.match(/(?:at\s+|in\s+)?([\w/-]+\.(?:jsx|js|tsx|html)):(\d+)(?::(\d+))?/i) ||
                    stack.match(/(?:at\s+|in\s+)?([\w/-]+\.(?:jsx|js|tsx|html)):(\d+)(?::(\d+))?/i);
  if (lineMatch) {
    detectedFile = lineMatch[1];
    lineNumber = parseInt(lineMatch[2], 10);
  }

  if (/is not defined/i.test(message)) {
    errorType = 'Undefined Variable';
    const varMatch = message.match(/(\w+)\s+is not defined/i);
    const varName = varMatch ? varMatch[1] : 'A variable';
    friendlyReason = `"${varName}" is referenced in ${detectedFile} but has not been defined or imported.`;
    actionableGuidance = `Import "${varName}" from React or Lucide, or define it in component scope.`;
  } else if (/Cannot read propert|Cannot destructure/i.test(message)) {
    errorType = 'Null Access Error';
    friendlyReason = 'Attempted to access properties of null or undefined state.';
    actionableGuidance = 'Add optional chaining (?.) or initialize state with a safe default value.';
  } else if (/Identifier.*already.*been.*declared/i.test(message)) {
    errorType = 'Identifier Conflict';
    friendlyReason = 'A component, icon, or variable name conflicts with an existing import or keyword.';
    actionableGuidance = 'Rename the conflicting component or alias the imported icon.';
  } else if (/Unexpected token|SyntaxError/i.test(message)) {
    errorType = 'Syntax Error';
    friendlyReason = 'JSX or JavaScript syntax could not be parsed.';
    actionableGuidance = 'Check for unclosed tags, unmatched braces, or invalid syntax.';
  } else if (/App component not found/i.test(message)) {
    errorType = 'Missing Root Component';
    friendlyReason = 'Could not find an exported "App" component to render.';
    actionableGuidance = 'Ensure primary component is declared as "export default function App()".';
  }

  return {
    raw: message,
    errorType,
    friendlyReason,
    actionableGuidance,
    detectedFile,
    lineNumber,
  };
}

