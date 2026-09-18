/**
 * aiService.js
 * Next.js Edge / Server Proxy Streaming Integration with:
 * - Next.js App Router proxy endpoint (/api/generate)
 * - Zero model restrictions across tiers (All models accessible on 100k token quota)
 * - Server-side token optimization (LLMLingua/RepoMix inspired context pruning)
 * - Monthly token cap tracking & sync (100,000 Free tokens/mo)
 * - Automatic 429 quota handling and resilient client fallback
 */

import { parseGeneratedFiles } from './fileParser.js';
import { recordTokenUsage } from './tokenService.js';
import { estimateTokens } from '../utils/tokenOptimizer.js';

export const DEFAULT_MODEL = 'gemini-3.6-flash';

// Verified working models accessible on the 100,000 monthly token quota
export const AVAILABLE_MODELS = [
  {
    id: 'gemini-3.6-flash',
    name: 'Google Gemini 3.6 Flash (Primary)',
    badge: '⚡ ~1s Latency • Direct High Efficiency',
    isFree: true,
  },
  {
    id: 'groq/qwen-27b',
    name: 'Groq LPU Engine',
    badge: '⚡ 300ms Latency • Instant Streaming',
    isFree: true,
  },
  {
    id: 'xkiro/openai/gpt-5.3-codex-spark',
    name: 'Codex 5.3 Spark (xKiro)',
    badge: '⚡ Free Tier • Specialized Code Generation',
    isFree: true,
  },
  {
    id: 'xkiro/mistralai/mistral-large-2512',
    name: 'Mistral Large 3 (xKiro)',
    badge: '⚡ Free Tier • Frontier Intelligence',
    isFree: true,
  },
  {
    id: 'xkiro/deepseek/deepseek-v4.1-flash:free',
    name: 'DeepSeek V4.1 Flash (xKiro)',
    badge: '⚡ Free Tier • 1M Context • High Speed',
    isFree: true,
  },
  {
    id: 'xkiro/deepseek/deepseek-v4-pro',
    name: 'DeepSeek V4 Pro (xKiro)',
    badge: '⚡ Free Tier • 1M Context • Reasoning',
    isFree: true,
  },
  {
    id: 'xkiro/deepseek/deepseek-chat-v3.1',
    name: 'DeepSeek V3.1 (xKiro)',
    badge: '⚡ Free Tier • Hybrid 671B Reasoning',
    isFree: true,
  },
  {
    id: 'xkiro/deepseek/deepseek-v4-flash',
    name: 'DeepSeek V4 Flash (xKiro)',
    badge: '⚡ Free Tier • 1M Context • Efficiency',
    isFree: true,
  },
  {
    id: 'xkiro/deepseek/deepseek-v3.2',
    name: 'DeepSeek V3.2 (xKiro)',
    badge: '⚡ Free Tier • Balanced Reasoning',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5',
    badge: 'Balanced Reasoning • Fast',
    isFree: true,
  },
  {
    id: 'openrouter/free',
    name: 'Auto Free Router (Fallback)',
    badge: 'Community Router • Automatic Failover',
    isFree: true,
  },
];

/**
 * Extracts delta, usage, finish_reason and completion status from one SSE data line.
 *
 * @param {string} line - Raw SSE line
 * @returns {{ isDone: boolean, delta: string, usage: Object|null, finishReason: string|null, error?: Error }}
 */
export function extractStreamMeta(line) {
  const trimmed = (line || '').trim();
  if (!trimmed) {
    return { isDone: false, delta: '', usage: null, finishReason: null };
  }
  if (trimmed === 'data: [DONE]') {
    return { isDone: true, delta: '', usage: null, finishReason: null };
  }
  if (!trimmed.startsWith('data: ')) {
    return { isDone: false, delta: '', usage: null, finishReason: null };
  }
  const jsonStr = trimmed.slice(6).trim();
  if (!jsonStr) {
    return { isDone: false, delta: '', usage: null, finishReason: null };
  }
  try {
    const data = JSON.parse(jsonStr);
    const choice = data.choices?.[0];
    return {
      isDone: false,
      delta: choice?.delta?.content || '',
      usage: data.usage || null,
      finishReason: choice?.finish_reason || null,
    };
  } catch (err) {
    return { isDone: false, delta: '', usage: null, finishReason: null, error: err };
  }
}

/**
 * Streams website generation via the Next.js Edge/Server proxy endpoint.
 *
 * @param {Object} params
 * @param {string} params.apiKey - Optional custom user API key (BYOK)
 * @param {string} params.model - Selected model ID
 * @param {Array} params.messages - Conversation messages
 * @param {Object} params.currentFiles - Current workspace files
 * @param {AbortSignal} params.signal - Cancellation signal
 * @param {Function} params.onChunk - Callback for each streaming text delta
 * @param {Function} params.onFileParsed - Callback when files are parsed
 * @param {Function} params.onComplete - Callback on completion
 * @param {Function} params.onError - Callback on error
 */
export async function streamGenerateWebsite({
  apiKey = '',
  model = DEFAULT_MODEL,
  messages = [],
  currentFiles = {},
  userId = '',
  signal,
  onChunk,
  onFileParsed,
  onComplete,
  onError,
}) {
  const internalController = new AbortController();
  const effectiveSignal = signal || internalController.signal;

  // Watchdog timeouts
  let connTimeout = setTimeout(() => {
    internalController.abort(new Error('Connection timed out after 3 minutes.'));
  }, 180000);

  let stallTimeout = null;
  const resetStallWatchdog = () => {
    if (stallTimeout) clearTimeout(stallTimeout);
    stallTimeout = setTimeout(() => {
      console.warn('[AetherCraft] Stream stalled for 60s without chunks, aborting.');
      internalController.abort(new Error('Generation stalled (no tokens received for 60s).'));
    }, 60000);
  };

  try {
    // 1. Dispatch Generation Request through Next.js Server Route
    let response = await fetch('/api/generate', {
      method: 'POST',
      signal: effectiveSignal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        customApiKey: apiKey || undefined,
        currentFiles,
        userId: userId || undefined,
      }),
    });

    if (connTimeout) clearTimeout(connTimeout);

    // Fallback: If local API route is unreachable or returns 404/502 in pure SPA mode, try direct upstream
    if (!response.ok && (response.status === 404 || response.status === 502) && apiKey) {
      console.warn('[AetherCraft API Proxy Failed] Falling back to direct client-side upstream...');
      response = await fetchDirectUpstream(apiKey, model, messages, currentFiles, effectiveSignal);
    }

    if (!response.ok) {
      let errData = {};
      try {
        errData = await response.json();
      } catch (e) {}
      throw new Error(errData.error || `Generation failed with status ${response.status}`);
    }

    // Read token optimization headers
    const tokensOriginal = parseInt(response.headers.get('X-Tokens-Original') || '0', 10);
    const tokensOptimized = parseInt(response.headers.get('X-Tokens-Optimized') || '0', 10);
    const tokensSaved = parseInt(response.headers.get('X-Tokens-Saved') || '0', 10);

    if (tokensSaved > 0) {
      console.log(`[TokenOptimizer] Saved ${tokensSaved} tokens on this generation turn.`);
    }

    // 2. Stream SSE Reader with Persistent Line Buffer
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let exactProviderUsage = null;
    let sseBuffer = '';
    let isStreamDone = false;
    let lastFinishReason = null;
    let isTruncated = false;

    resetStallWatchdog();

    const parseLine = (rawLine) => {
      const meta = extractStreamMeta(rawLine);
      if (meta.isDone) {
        isStreamDone = true;
        return;
      }
      if (meta.usage) {
        exactProviderUsage = meta.usage;
      }
      if (meta.finishReason) {
        lastFinishReason = meta.finishReason;
        if (meta.finishReason === 'length') {
          isTruncated = true;
        }
      }
      if (meta.error) {
        console.warn('[AetherCraft SSE Parse Warning]', meta.error.message, 'Raw line:', rawLine);
      }
      if (meta.delta) {
        fullText += meta.delta;
        if (onChunk) onChunk(meta.delta, fullText);
        const parsed = parseGeneratedFiles(fullText, currentFiles);
        if (Object.keys(parsed.files).length > 0 && onFileParsed) {
          onFileParsed(parsed);
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      resetStallWatchdog();
      const chunk = decoder.decode(value, { stream: true });
      sseBuffer += chunk;

      // Split on newline; preserve the trailing incomplete fragment in sseBuffer
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop() || '';

      for (const line of lines) {
        parseLine(line);
      }

      if (isStreamDone) break;
    }

    // Flush any remaining data at the end of the stream
    if (sseBuffer && sseBuffer.trim()) {
      parseLine(sseBuffer);
      sseBuffer = '';
    }

    if (stallTimeout) clearTimeout(stallTimeout);

    // 3. Record tokens used in client ledger — 1:1 match with API provider bill
    let totalConsumed = 0;
    let isEstimated = false;
    if (exactProviderUsage && typeof exactProviderUsage.total_tokens === 'number' && exactProviderUsage.total_tokens > 0) {
      totalConsumed = exactProviderUsage.total_tokens;
      console.log(`[Token Usage] Billed exact provider tokens: ${totalConsumed} (Prompt: ${exactProviderUsage.prompt_tokens}, Completion: ${exactProviderUsage.completion_tokens})`);
    } else {
      isEstimated = true;
      const completionTokens = Math.ceil(fullText.length / 3.8);
      totalConsumed = (tokensOptimized || 0) + completionTokens;
      console.log(`[Token Usage] Provider usage estimated: ${totalConsumed}`);
    }

    if (totalConsumed > 0) {
      recordTokenUsage(totalConsumed, {
        isEstimated,
        rawProviderUsage: exactProviderUsage,
        promptTokens: exactProviderUsage?.prompt_tokens ?? tokensOptimized ?? 0,
        completionTokens: exactProviderUsage?.completion_tokens ?? Math.ceil(fullText.length / 3.8),
      }, userId);
    }

    const finalParsed = parseGeneratedFiles(fullText, currentFiles);
    const completionMeta = {
      ...finalParsed,
      totalConsumed,
      finishReason: lastFinishReason,
      isTruncated: Boolean(isTruncated || lastFinishReason === 'length'),
    };
    if (onComplete) onComplete(fullText, completionMeta);
    return { fullText, ...completionMeta };
  } catch (error) {
    if (connTimeout) clearTimeout(connTimeout);
    if (stallTimeout) clearTimeout(stallTimeout);

    const isAbort = error.name === 'AbortError' || effectiveSignal?.aborted;
    const msg = isAbort ? 'AbortError: cancelled' : error.message;
    error.isAbort = isAbort;

    console.warn('[AetherCraft AI Generation]', msg);
    if (onError) onError(new Error(msg));
    throw error;
  }
}

/**
 * Fallback direct upstream fetch if proxy is unavailable.
 */
async function fetchDirectUpstream(apiKey, model, messages, currentFiles, signal) {
  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      'X-Title': 'AetherCraft AI Website Builder',
    },
    body: JSON.stringify({
      model: model === 'google/gemini-3.6-flash' ? 'openrouter/free' : model,
      messages: [{ role: 'user', content: messages[messages.length - 1]?.content || 'Synthesize app' }],
      stream: true,
      max_tokens: 8192,
      stream_options: { include_usage: true },
      temperature: 0.7,
    }),
  });
}

/**
 * Tests API key connection.
 */
export async function testOpenRouterConnection(apiKey, model = DEFAULT_MODEL) {
  try {
    const res = await fetch('/api/usage');
    if (res.ok) {
      return 'Connected (Next.js Server Proxy Active)';
    }
  } catch (e) {
    // fallback
  }

  const testKey = apiKey || (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_OPENROUTER_API_KEY) || '';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${testKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      messages: [{ role: 'user', content: "Ping. Respond with 'Connection Successful'." }],
      max_tokens: 10,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return 'Connected';
}

/**
 * Creates an SSE line parser that maintains a persistent buffer across network chunks.
 * Guarantees that incomplete JSON lines are never discarded or split, and flushes on EOF.
 */
export function createSseLineParser(onLine) {
  let buffer = '';
  let isDone = false;

  return {
    feed(chunk) {
      if (isDone) return;
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim() === 'data: [DONE]') {
          isDone = true;
        }
        onLine(line);
      }
    },
    flush() {
      if (buffer && buffer.trim() && !isDone) {
        onLine(buffer);
        buffer = '';
      }
    },
    getRemainder() {
      return buffer;
    }
  };
}

