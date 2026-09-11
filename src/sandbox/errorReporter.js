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
