import { useEffect } from 'react';

/**
 * useSandboxMessages
 * Listens for postMessage events from the sandbox iframe.
 * Calls appropriate handlers for runtime errors and manual fix triggers.
 *
 * @param {Object} params
 * @param {Function} params.onRuntimeError - Called with (errorMsg) on SANDBOX_RUNTIME_ERROR
 * @param {Function} params.onManualFix - Called with (errorMsg) on TRIGGER_AUTO_FIX
 */
export function useSandboxMessages({ onRuntimeError, onManualFix }) {
  useEffect(() => {
    const handler = (event) => {
      // Security: only trust messages from our own sandboxed iframes
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'TRIGGER_AUTO_FIX') {
        const msg = event.data.error?.message || 'Rendering error';
        onManualFix?.(msg);
      } else if (event.data.type === 'SANDBOX_RUNTIME_ERROR') {
        const msg = event.data.error?.message || 'Runtime error';
        onRuntimeError?.(msg);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onRuntimeError, onManualFix]);
}
