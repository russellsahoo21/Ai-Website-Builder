import { optimizePromptPayload } from '@/src/utils/tokenOptimizer.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_TIER_MONTHLY_TOKEN_CAP = 100000;

// In-memory token usage ledger per user/IP and billing period
// Structure: Map<"userId_YYYY-MM", number>
const tokenLedger = new Map();

function getCurrentPeriod() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getClientIdentifier(req, userId) {
  if (userId && typeof userId === 'string') return userId;
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'anonymous-user';
}

function checkAndRecordUsage(userKey, estimatedTokens, isByok) {
  if (isByok) return { allowed: true, quotaBypassed: true, currentUsage: 0, limit: Infinity };

  const currentUsage = tokenLedger.get(userKey) || 0;
  if (currentUsage >= FREE_TIER_MONTHLY_TOKEN_CAP) {
    return {
      allowed: false,
      quotaBypassed: false,
      currentUsage,
      limit: FREE_TIER_MONTHLY_TOKEN_CAP,
    };
  }

  // Tentatively record usage
  const updated = currentUsage + estimatedTokens;
  tokenLedger.set(userKey, updated);

  return {
    allowed: true,
    quotaBypassed: false,
    currentUsage: updated,
    limit: FREE_TIER_MONTHLY_TOKEN_CAP,
  };
}

const SYSTEM_PROMPT = `You are AetherCraft Engine, an elite React 18 & Full-Stack engineer. Generate production-grade, interactive applications.

OUTPUT FORMATS (MANDATORY):
1. FOR EDITS / UPDATES (DEFAULT WHEN MODIFYING EXISTING APPS):
Emit surgical SEARCH/REPLACE patches inside <<<PATCH:path/to/file>>> to minimize tokens:
<<<PATCH:src/App.jsx>>>
<<<< SEARCH
<h1 className="text-2xl font-bold">Old Title</h1>
==== REPLACE
<h1 className="text-2xl font-bold">New Title</h1>
>>>>
<<<END_PATCH>>>

2. FOR NEW APPS / COMPLETE REDO / NEW FILES:
Emit complete code inside <<<FILE:path/to/file>>> ... <<<END_FILE>>>.
src/App.jsx MUST be output first.

CRITICAL RULES:
1. React 18 JSX only (no <!DOCTYPE html>). Use Tailwind CSS & Lucide icons (import { IconName } from 'lucide-react').
2. Sub-components: use compound names (FilterPanel, SearchBar, SaveBtn) to avoid shadowing browser globals.
3. Images: ALWAYS use valid public HTTPS URLs (e.g. Unsplash). NEVER import local images like './assets/logo.svg'.
4. Full interactivity: wire state (useState, useEffect, localStorage) so UI is fully functional.
5. No conversational filler or explanations outside delimiters. Output code/patches immediately.`;

function buildFormattedMessages(messages, currentFiles, manifestFiles = []) {
  // Static SYSTEM_PROMPT as message 0 enables provider prompt caching (Gemini, Claude, DeepSeek cache_read)
  const formatted = [{ role: 'system', content: SYSTEM_PROMPT }];

  const hasExistingCode = currentFiles && Object.keys(currentFiles).length > 0;
  if (hasExistingCode) {
    let ctx = 'Relevant active workspace files:\n';
    for (const [name, content] of Object.entries(currentFiles)) {
      ctx += `<<<FILE:${name}>>>\n${content}\n<<<END_FILE>>>\n\n`;
    }
    if (manifestFiles && manifestFiles.length > 0) {
      ctx += `Preserved workspace files (do not touch unless needed):\n- ${manifestFiles.slice(0, 30).join('\n- ')}\n\n`;
    }
    ctx += 'For modifications, emit ONLY <<<PATCH:...>>> blocks using <<<< SEARCH ... ==== REPLACE ... >>>>. Never re-emit full unchanged files.';
    formatted.push({ role: 'system', content: ctx });
  }

  const REDO_WORDS = ['redo', 'rebuild', 'try again', 'again', 'restart', 'regenerate', 're-do', 'fix from scratch'];
  messages.forEach((msg, idx) => {
    const isLast = idx === messages.length - 1;
    let content = msg.content || '';
    if (isLast && (msg.role === 'user' || !msg.role)) {
      const lower = content.trim().toLowerCase();
      if (REDO_WORDS.some(w => lower.includes(w))) {
        content = `User says: "${msg.content}". Re-synthesize and output the full complete working app inside <<<FILE:src/App.jsx>>> FIRST. Use public HTTPS Unsplash image URLs for graphics. React 18 JSX only — NO <!DOCTYPE html>.`;
      } else if (/img|image|picture|photo|logo/i.test(lower) && /change|replace|update|broken|fix|exist/i.test(lower)) {
        content = `User says: "${msg.content}". Update the image src with a high-resolution, working public HTTPS Unsplash URL. Output ONLY a surgical patch inside <<<PATCH:src/App.jsx>>> using <<<< SEARCH ... ==== REPLACE ... >>>>.`;
      } else {
        const isBackendReq = /backend|server|api|database|express|endpoint|sql|postgres|route|fullstack|full-stack/i.test(content);
        if (isBackendReq) {
          content += '\n\n[INSTRUCTION: User requested backend/full-stack features. Emit <<<FILE:src/App.jsx>>> FIRST, then backend files (<<<FILE:server/index.js>>>, <<<FILE:server/routes/api.js>>>, <<<FILE:server/db/schema.sql>>>) and <<<FILE:src/services/api.js>>> with graceful mock fallbacks.]';
        } else if (hasExistingCode) {
          content += '\n\n[INSTRUCTION: You are updating existing code. Output ONLY surgical search-replace patches inside <<<PATCH:filepath>>> using <<<< SEARCH ... ==== REPLACE ... >>>> blocks. Keep changes minimal to conserve tokens. Do NOT re-emit full files.]';
        } else {
          content += '\n\n[INSTRUCTION: Output complete React 18 JSX code inside <<<FILE:src/App.jsx>>> as the VERY FIRST file, followed by <<<FILE:src/index.css>>>. Zero chatter outside delimiters.]';
        }
      }
    }
    formatted.push({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content,
    });
  });

  return formatted;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      messages = [],
      currentFiles = {},
      model = 'openrouter/free',
      customApiKey = '',
      userId = '',
    } = body;

    const isByok = Boolean(customApiKey && customApiKey.trim().length > 5);
    const clientId = getClientIdentifier(req, userId);
    const userLedgerKey = `${clientId}_${getCurrentPeriod()}`;

    // 1. Run Caveman + Graphify Context Optimizer
    const { optimizedMessages, optimizedFiles, manifestFiles, stats } = optimizePromptPayload({
      messages,
      currentFiles,
      model,
      systemPrompt: SYSTEM_PROMPT,
    });

    console.log(`[TokenOptimizer] Graphify Pruning: ${stats.originalTokens} -> ${stats.optimizedTokens} tokens (Saved: ${stats.tokensSaved} tok / ${stats.savingsPercent}%)`);

    // 2. Enforce 100k Free Tier Quota on optimized tokens
    const quotaResult = checkAndRecordUsage(userLedgerKey, stats.optimizedTokens, isByok);
    if (!quotaResult.allowed) {
      return Response.json(
        {
          error: `Monthly free tier token quota (100,000 tokens) reached. Please upgrade to Pro or provide your own API key in Settings.`,
          code: 'TOKEN_QUOTA_EXCEEDED',
          usage: quotaResult.currentUsage,
          limit: quotaResult.limit,
        },
        { status: 429 }
      );
    }

    // 3. Format messages with Graphify context and manifest
    const formattedMessages = buildFormattedMessages(optimizedMessages, optimizedFiles, manifestFiles);

    // 4. Resolve Upstream Provider (Zero model restrictions!)
    // If user provided a custom key, check provider prefix
    const groqEnvKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    const geminiEnvKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const isDirectGroq = (isByok && customApiKey.startsWith('gsk_')) || (model.startsWith('groq/') && Boolean(groqEnvKey));
    const isDirectGemini = (isByok && (customApiKey.startsWith('AIzaSy') || customApiKey.startsWith('AQ.'))) ||
      ((model.includes('gemini') || model === 'gemini-3.6-flash' || model === 'google/gemini-3.6-flash') && Boolean(geminiEnvKey));
    const xkiroEnvKey = process.env.XKIRO_API_KEY || process.env.NEXT_PUBLIC_XKIRO_API_KEY || process.env.VITE_XKIRO_API_KEY;
    const isDirectXkiro = (isByok && customApiKey.startsWith('sk-xt-')) || (model.startsWith('xkiro/') && Boolean(xkiroEnvKey));
    const isDirectNvidia = isByok && customApiKey.startsWith('nvapi-');

    let upstreamUrl = 'https://openrouter.ai/api/v1/chat/completions';
    let upstreamKey = '';
    let upstreamBody = {
      model,
      messages: formattedMessages,
      stream: true,
      temperature: 0.7,
      stream_options: { include_usage: true },
    };

    if (isDirectGemini) {
      upstreamUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      upstreamKey = (isByok && (customApiKey.startsWith('AIzaSy') || customApiKey.startsWith('AQ.'))) ? customApiKey : geminiEnvKey;
      upstreamBody.model = 'gemini-3.6-flash';
    } else if (isDirectGroq) {
      upstreamUrl = 'https://api.groq.com/openai/v1/chat/completions';
      upstreamKey = (isByok && customApiKey.startsWith('gsk_')) ? customApiKey : groqEnvKey;
      upstreamBody.model = 'qwen/qwen3.8-27b';
    } else if (isDirectXkiro) {
      upstreamUrl = 'https://api.xkiro.com/v1/chat/completions';
      upstreamKey = (isByok && customApiKey.startsWith('sk-xt-')) ? customApiKey : xkiroEnvKey;
      upstreamBody.model = model.replace(/^xkiro\//, '');
    } else if (isDirectNvidia) {
      upstreamUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
      upstreamKey = customApiKey;
      upstreamBody.model = 'deepseek-ai/deepseek-v4-pro-0813';
      upstreamBody.chat_template_kwargs = { thinking: false };
    } else {
      // Default router: OpenRouter handles ALL models
      upstreamKey = isByok ? customApiKey : (process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY);
      if (model === 'google/gemini-3.6-flash' || model === 'gemini-3.6-flash') {
        upstreamBody.model = 'google/gemini-2.0-flash-001';
      }
    }

    if (!upstreamKey) {
      return Response.json(
        {
          error: 'Platform API service key is not configured for this model provider. Please add your own API key in Settings.',
          code: 'MISSING_API_KEY',
        },
        { status: 500 }
      );
    }

    let headers = {
      Authorization: `Bearer ${upstreamKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://aethercraft.app',
      'X-Title': 'AetherCraft AI Studio',
    };

    let upstreamRes;
    try {
      upstreamRes = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(upstreamBody),
      });
    } catch (fetchErr) {
      console.warn('[Generate Route] Primary fetch error:', fetchErr.message);
    }

    // Auto-fallback: If direct Gemini fails or quota is exhausted (429/404/500), automatically fail over to OpenRouter Auto!
    if ((!upstreamRes || !upstreamRes.ok) && isDirectGemini) {
      const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
      if (openRouterKey) {
        console.warn('[Generate Route] Gemini quota exhausted or error. Seamlessly falling back to OpenRouter Auto...');
        upstreamUrl = 'https://openrouter.ai/api/v1/chat/completions';
        upstreamKey = openRouterKey;
        upstreamBody.model = 'openrouter/free';
        headers.Authorization = `Bearer ${openRouterKey}`;
        try {
          upstreamRes = await fetch(upstreamUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(upstreamBody),
          });
        } catch (fbErr) {
          console.error('[Generate Route Fallback Error]', fbErr);
        }
      }
    }

    if (!upstreamRes || !upstreamRes.ok) {
      const errJson = await upstreamRes?.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `Upstream provider error (HTTP ${upstreamRes?.status || 500})`;
      console.error('[Generate Route Upstream Error]', upstreamRes?.status, errMsg);
      return Response.json({ error: errMsg, status: upstreamRes?.status || 500 }, { status: upstreamRes?.status || 500 });
    }

    // 5. Direct Streaming Pipe
    return new Response(upstreamRes.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Tokens-Original': String(stats.originalTokens),
        'X-Tokens-Optimized': String(stats.optimizedTokens),
        'X-Tokens-Saved': String(stats.tokensSaved),
        'X-Savings-Percent': String(stats.savingsPercent),
      },
    });
  } catch (error) {
    console.error('[Generate Route Fatal]', error);
    return Response.json(
      { error: error.message || 'Internal proxy synthesis error' },
      { status: 500 }
    );
  }
}
