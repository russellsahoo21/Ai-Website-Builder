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
export function useSandboxMessages({ isGenerating = false, enabled = true, onRuntimeError, onManualFix, files = null }) {
  const lastHandledTimeRef = useRef(0);
  const lastHandledErrorRef = useRef('');
  const isGeneratingRef = useRef(isGenerating);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  // Reset handled error cache whenever files are updated/changed
  useEffect(() => {
    lastHandledErrorRef.current = '';
  }, [files]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (event) => {
      // Security: only trust messages from our own sandboxed iframes
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'TRIGGER_AUTO_FIX') {
        const msg = event.data.error?.message || 'Rendering error';
        // Manual Auto-Fix always works and clears the error lock
        lastHandledErrorRef.current = '';
        onManualFix?.(msg);
        return;
      }

      if (event.data.type === 'SANDBOX_RUNTIME_ERROR') {
        // 1. NEVER trigger auto-fix while code is actively streaming or compiling (only when idle)
        if (isGeneratingRef.current) {
          return;
        }

        const rawMsg = event.data.error?.message || 'Runtime error';

        // 2. Filter out non-fatal/benign errors
        const isBenign = BENIGN_ERROR_PATTERNS.some((re) => re.test(rawMsg));
        if (isBenign) {
          return;
        }

        // 3. Avoid repeatedly repairing the same unchanged error
        if (lastHandledErrorRef.current === rawMsg) {
          return;
        }

        const now = Date.now();
        // 4. Minimum 3.5s cooldown between any distinct errors
        if (now - lastHandledTimeRef.current < 3500) {
          return;
        }

        lastHandledErrorRef.current = rawMsg;
        lastHandledTimeRef.current = now;

        onRuntimeError?.(rawMsg);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [enabled, onRuntimeError, onManualFix]);
}
