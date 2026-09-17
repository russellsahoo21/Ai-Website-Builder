/**
 * Client-Side Monitoring & Telemetry Service
 *
 * Captures sandbox runtime errors, AST syntax errors, and generation anomalies.
 * Batches and deduplicates client-side reports before forwarding them to
 * the /api/monitoring telemetry endpoint.
 */

const recentReports = new Map();
const DEDUPE_WINDOW_MS = 5000;

/**
 * Report a client-side error (sandbox runtime crash, compiler error, etc.)
 *
 * @param {Object} report
 * @param {string} report.type - Error category (e.g. 'SANDBOX_RUNTIME_ERROR', 'BABEL_TRANSPILE_ERROR')
 * @param {string|Error} report.error - Error message or Error object
 * @param {string} [report.previewId] - Preview identifier associated with the error
 * @param {Object} [report.context] - Additional diagnostics context
 * @returns {Promise<boolean>}
 */
export async function reportClientError({ type, error, previewId, context }) {
  if (!type || !error) return false;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const dedupeKey = `${type}:${previewId || 'global'}:${errorMessage.slice(0, 100)}`;
  const now = Date.now();

  // Deduplicate errors within the deduplication window
  if (recentReports.has(dedupeKey)) {
    const lastReportedAt = recentReports.get(dedupeKey);
    if (now - lastReportedAt < DEDUPE_WINDOW_MS) {
      return false;
    }
  }
  recentReports.set(dedupeKey, now);

  // Prune stale cache entries
  if (recentReports.size > 200) {
    for (const [key, timestamp] of recentReports.entries()) {
      if (now - timestamp > DEDUPE_WINDOW_MS) {
        recentReports.delete(key);
      }
    }
  }

  const payload = {
    type,
    error: errorMessage,
    previewId: previewId || null,
    context: context || null,
    timestamp: new Date().toISOString(),
  };

  try {
    const fetchFn = typeof window !== 'undefined' && typeof window.fetch === 'function'
      ? window.fetch
      : (typeof globalThis.fetch === 'function' ? globalThis.fetch : null);

    if (fetchFn) {
      const response = await fetchFn('/api/monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        ...(typeof window !== 'undefined' ? { keepalive: true } : {}),
      });
      return Boolean(response?.ok);
    }
  } catch (err) {
    // Telemetry reporting should never throw or disrupt application flow
    if (process.env.NODE_ENV === 'development') {
      console.warn('[monitoringService] Failed to dispatch error report:', err?.message || err);
    }
  }

  return false;
}

/**
 * Record a telemetry event for pipeline tracing
 *
 * @param {string} eventName
 * @param {Object} [eventData]
 */
export function recordTelemetry(eventName, eventData = {}) {
  if (typeof window !== 'undefined' && window.__AETHERCRAFT_TELEMETRY__) {
    try {
      window.__AETHERCRAFT_TELEMETRY__.push({
        event: eventName,
        data: eventData,
        timestamp: Date.now(),
      });
    } catch (_) {}
  }
}

/**
 * Query current system health and infrastructure status
 *
 * @returns {Promise<{ status: string, providers: Object }|null>}
 */
export async function checkSystemHealth() {
  try {
    const res = await fetch('/api/monitoring');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
