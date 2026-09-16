import { useEffect, useRef } from 'react';

const BENIGN_ERROR_PATTERNS = [
  /ResizeObserver/i,
  /Script error/i,
  /Failed to fetch/i,
  /NetworkError/i,
  /Load failed/i,
  /AbortError/i,
  /Promise rejection/i,
  /net::ERR_/i,
  /favicon/i,
  /404/i,
  /Loading chunk.*failed/i,
];

/**
 * useSandboxMessages
 * Listens for postMessage events from the sandbox iframe.
 * Calls appropriate handlers for runtime errors and manual fix triggers.
 *
 * @param {Object} params
 * @param {boolean} params.isGenerating - Whether generation is actively running
 * @param {boolean} [params.enabled] - Whether message listening is active
 * @param {Function} params.onRuntimeError - Called with (errorMsg) on SANDBOX_RUNTIME_ERROR
 * @param {Function} params.onManualFix - Called with (errorMsg) on TRIGGER_AUTO_FIX
 */
export function useSandboxMessages({ isGenerating = false, enabled = true, onRuntimeError, onManualFix }) {
  const lastHandledTimeRef = useRef(0);
  const isGeneratingRef = useRef(isGenerating);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (event) => {
      // Security: only trust messages from our own sandboxed iframes
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'TRIGGER_AUTO_FIX') {
        const msg = event.data.error?.message || 'Rendering error';
        onManualFix?.(msg);
        return;
      }

      if (event.data.type === 'SANDBOX_RUNTIME_ERROR') {
        // 1. NEVER trigger auto-fix while code is actively streaming or compiling
        if (isGeneratingRef.current) {
          return;
        }

        const rawMsg = event.data.error?.message || 'Runtime error';

        // 2. Filter out non-fatal/benign errors
        const isBenign = BENIGN_ERROR_PATTERNS.some((re) => re.test(rawMsg));
        if (isBenign) {
          return;
        }

        // 3. Debounce rapid-fire duplicate errors (minimum 3.5s cooldown)
        const now = Date.now();
        if (now - lastHandledTimeRef.current < 3500) {
          return;
        }
        lastHandledTimeRef.current = now;

        onRuntimeError?.(rawMsg);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onRuntimeError, onManualFix]);
}
