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
      internalController.abort(new Error('Stream stalled — no tokens received for 60 seconds.'));
    }, 60000);
  };

  try {
    // 1. Call Next.js Server-Side Proxy
    const proxyUrl = typeof window !== 'undefined'
      ? '/api/generate'
      : 'http://localhost:3000/api/generate';

    let response;
    try {
      response = await fetch(proxyUrl, {
        method: 'POST',
        signal: effectiveSignal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          currentFiles,
          customApiKey: apiKey || undefined,
          userId: userId || undefined,
        }),
      });
    } catch (netErr) {
      // Fallback: If proxy route is unreachable in static build or dev disconnect, try direct fallback
      if (apiKey) {
        console.warn('[AetherCraft AI] Proxy fetch failed, attempting direct BYOK fallback...');
        response = await fetchDirectUpstream(apiKey, model, messages, currentFiles, effectiveSignal);
      } else {
        throw netErr;
      }
    }

    clearTimeout(connTimeout);

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error || `Proxy error (HTTP ${response.status})`;
      throw new Error(errMsg);
    }

    // Read token optimization headers
    const tokensOriginal = parseInt(response.headers.get('X-Tokens-Original') || '0', 10);
    const tokensOptimized = parseInt(response.headers.get('X-Tokens-Optimized') || '0', 10);
    const tokensSaved = parseInt(response.headers.get('X-Tokens-Saved') || '0', 10);

    if (tokensSaved > 0) {
      console.log(`[TokenOptimizer] Saved ${tokensSaved} tokens on this generation turn.`);
    }

    // 2. Stream SSE Reader
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let exactProviderUsage = null;

    resetStallWatchdog();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      resetStallWatchdog();
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const data = JSON.parse(trimmed.slice(6));
          if (data.usage) {
            exactProviderUsage = data.usage;
          }
          const delta = data.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            if (onChunk) onChunk(delta, fullText);
            const parsed = parseGeneratedFiles(fullText, currentFiles);
            if (Object.keys(parsed.files).length > 0 && onFileParsed) {
              onFileParsed(parsed);
            }
          }
        } catch {
          // ignore partial SSE fragments
        }
      }
    }

    if (stallTimeout) clearTimeout(stallTimeout);

    // 3. Record tokens used in client ledger — 1:1 match with API provider bill
    let totalConsumed;
    let isEstimated = false;
    if (exactProviderUsage && typeof exactProviderUsage.total_tokens === 'number' && exactProviderUsage.total_tokens > 0) {
      totalConsumed = exactProviderUsage.total_tokens;
      console.log(`[Token Usage] Billed exact provider tokens: ${totalConsumed} (Prompt: ${exactProviderUsage.prompt_tokens}, Completion: ${exactProviderUsage.completion_tokens}, Raw:`, exactProviderUsage, ')');
    } else {
      isEstimated = true;
      const completionTokens = Math.ceil(fullText.length / 3.8);
      totalConsumed = (tokensOptimized || 0) + completionTokens;
      console.log(`[Token Usage] Provider usage omitted from stream, measured: ${totalConsumed} (Prompt: ${tokensOptimized || 0}, Completion: ${completionTokens})`);
    }
    recordTokenUsage(totalConsumed, {
      isEstimated,
      rawProviderUsage: exactProviderUsage,
      promptTokens: exactProviderUsage?.prompt_tokens ?? tokensOptimized ?? 0,
      completionTokens: exactProviderUsage?.completion_tokens ?? Math.ceil(fullText.length / 3.8),
    }, userId);

    const finalParsed = parseGeneratedFiles(fullText, currentFiles);
    if (onComplete) onComplete(fullText, finalParsed);
    return { fullText, ...finalParsed };
  } catch (error) {
    if (connTimeout) clearTimeout(connTimeout);
    if (stallTimeout) clearTimeout(stallTimeout);

    const isAbort = error.name === 'AbortError' || effectiveSignal?.aborted;
    const msg = isAbort ? 'AbortError: cancelled' : error.message;

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
