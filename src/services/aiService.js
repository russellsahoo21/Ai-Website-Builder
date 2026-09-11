/**
 * aiService.js
 * OpenRouter API integration with:
 * - React-only enforcement in SYSTEM_PROMPT
 * - 3-minute connection timeout (free models are slow)
 * - 60-second stream stall watchdog
 * - Automatic 429 rate-limit retry (once, after 10s)
 */

export const DEFAULT_MODEL = 'google/gemini-3.6-flash';

export const AVAILABLE_MODELS = [
  {
    id: 'google/gemini-3.6-flash',
    name: 'Google Gemini 3.6 Flash (Recommended)',
    badge: '1s Latency • Superior UI Taste • Free',
    isFree: true,
  },
  {
    id: 'nvidia/deepseek-v4-pro-0813',
    name: 'DeepSeek V4 Pro (NVIDIA NIM Free)',
    badge: 'Frontier Architecture • Free API',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (High Value)',
    badge: '$0.001/site • Frontier Code',
    isFree: false,
  },
  {
    id: 'openrouter/free',
    name: 'OpenRouter Free Auto-Router',
    badge: 'Instant Queue • Multi-Provider',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    name: 'NVIDIA Nemotron 3 Ultra (550B Free)',
    badge: '550B Large Model',
    isFree: true,
  },
  {
    id: 'cohere/north-mini-code:free',
    name: 'Cohere North Mini Code (Free)',
    badge: 'Code Specialist',
    isFree: true,
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet (Paid)',
    badge: 'Industry Benchmark • v0 Standard',
    isFree: false,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (Paid)',
    badge: 'Multimodal Frontier',
    isFree: false,
  },
];


const SYSTEM_PROMPT = `You are AetherCraft Engine, an elite Full-Stack & React 18 software engineering system.
Your mission: generate production-grade, visually stunning, fully interactive applications.
Take as much time as needed to produce complete, correct, high-quality code.

OUTPUT FORMAT (MANDATORY):
You MUST ALWAYS wrap your complete code in these exact delimiters:

<<<FILE:src/App.jsx>>>
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { Plus, Trash2, DollarSign, TrendingUp } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 font-sans">
      <Navbar />
      <main className="p-6 max-w-7xl mx-auto">
        {/* modular interactive components */}
      </main>
    </div>
  );
}
<<<END_FILE>>>

<<<FILE:src/components/Navbar.jsx>>>
import React from 'react';
import { Compass, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, onSelectTab }) {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#090a0f]/80 backdrop-blur">
      <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-zinc-100">
        <Compass className="w-4 h-4 text-cyan-400" />
        <span>Studio</span>
      </div>
    </nav>
  );
}
<<<END_FILE>>>

<<<FILE:src/index.css>>>
/* custom animations & keyframes */
<<<END_FILE>>>

CRITICAL RULES:
1. MANDATORY FILE ORDER: src/App.jsx MUST ALWAYS BE THE VERY FIRST FILE GENERATED.
   NEVER output src/index.css, backend files, or sub-components before src/App.jsx. The primary frontend component must be emitted first to guarantee instant live preview mounting.
2. NEVER output a raw HTML document (<!DOCTYPE html>, <html>, <body>). ALWAYS output React 18 JSX for the frontend.
3. NEVER reply with only explanations or plans — always output the complete code files.
4. FULL-STACK & BACKEND ARCHITECTURE:
   When the user requests backend, API routes, database, or server capabilities:
   - Generate complete backend server files in <<<FILE:server/index.js>>> (Node.js/Express with CORS and JSON body parser).
   - Generate modular API routes in <<<FILE:server/routes/api.js>>> with RESTful endpoints (GET, POST, PUT, DELETE).
   - Generate database schema/seed data in <<<FILE:server/db/schema.sql>>> or Supabase/Prisma configuration.
   - In the frontend, generate <<<FILE:src/services/api.js>>> with a resilient client adapter that connects to the backend endpoints, while including graceful mock data/localStorage fallbacks so the in-browser live preview works instantly without network errors!
5. MODULAR FRONTEND ARCHITECTURE:
   - Primary component in src/App.jsx (MUST BE OUTPUT FIRST)
   - Sub-components inside src/components/ (e.g. src/components/Navbar.jsx, src/components/Sidebar.jsx, src/components/Card.jsx)
   - Global styles in src/index.css (output last)
6. REACT IDENTIFIER NAMING SAFETY:
   For React subcomponents, use compound domain-specific names (e.g. FilterPanel, SearchBar, SaveButton, TagBadge, ServerStatusCard, DatabaseTable) rather than single words like Filter or Search that collide with browser globals.
7. REACT CONTEXT & HOOKS SAFETY:
   Always initialize createContext({ ... }) with realistic defaults. Never call useApp() inside the component that provides AppContext.
8. STYLING & ICONS:
   Use Tailwind CSS for all styling (dark obsidian/zinc palette, crisp borders). Use Lucide icons: import { IconName } from 'lucide-react'.
9. INTERACTIVITY & PERSISTENCE:
   Implement full interactivity with useState, useEffect, and persistent data storage so the app feels 100% production-ready.
10. Provide a 1-sentence friendly overview at the very start, then output the complete files immediately. No placeholders or TODO comments.`;

// --- Internal helpers ---

import { parseGeneratedFiles } from './fileParser.js';

function buildFormattedMessages(messages, currentFiles) {
  const formatted = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (Object.keys(currentFiles).length > 0) {
    let ctx = 'Current workspace files (for context):\n';
    for (const [name, content] of Object.entries(currentFiles)) {
      ctx += `<<<FILE:${name}>>>\n${content}\n<<<END_FILE>>>\n\n`;
    }
    ctx += 'When the user requests changes, output the complete updated file(s) inside <<<FILE:...>>> delimiters with src/App.jsx first.';
    formatted.push({ role: 'system', content: ctx });
  }

  const REDO_WORDS = ['redo','rebuild','try again','again','restart','regenerate','re-do','fix'];
  messages.forEach((msg, idx) => {
    const isLast = idx === messages.length - 1;
    let content = msg.content;
    if (isLast && (msg.role === 'user' || !msg.role)) {
      const lower = content.trim().toLowerCase();
      if (REDO_WORDS.includes(lower)) {
        content = `User says: "${msg.content}". Re-synthesize and output the full complete working app inside <<<FILE:src/App.jsx>>> FIRST, then any components/styles. React 18 JSX only — NO <!DOCTYPE html>.`;
      } else {
        const isBackendReq = /backend|server|api|database|express|endpoint|sql|postgres|route|fullstack|full-stack/i.test(content);
        if (isBackendReq) {
          content += '\n\n[INSTRUCTION: User requested backend/full-stack features. Output complete full-stack code. Emit <<<FILE:src/App.jsx>>> FIRST for instant preview, followed by backend files (<<<FILE:server/index.js>>>, <<<FILE:server/routes/api.js>>>, <<<FILE:server/db/schema.sql>>>) and <<<FILE:src/services/api.js>>>. Include working mock fallbacks in api.js so the live preview functions without network errors.]';
        } else {
          content += '\n\n[INSTRUCTION: Output complete React 18 JSX code inside <<<FILE:src/App.jsx>>> as the VERY FIRST file, followed by <<<FILE:src/index.css>>>. Do NOT output CSS before src/App.jsx.]';
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

async function fetchStream(apiKey, model, formattedMessages, signal) {
  const isGemini = model.includes('gemini');
  const isNvidia = model.includes('nvidia') || model.includes('deepseek-v4');

  if (isGemini) {
    const geminiKey = (apiKey && (apiKey.startsWith('AQ.') || apiKey.startsWith('AIzaSy')))
      ? apiKey
      : (import.meta.env.VITE_GEMINI_API_KEY || '');

    return fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${geminiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-3.6-flash',
        messages: formattedMessages,
        stream: true,
        temperature: 0.7,
      }),
    });
  }

  if (isNvidia) {
    const nvidiaKey = (apiKey && apiKey.startsWith('nvapi-'))
      ? apiKey
      : (import.meta.env.VITE_NVIDIA_API_KEY || '');

    const nvidiaUrl = typeof window !== 'undefined'
      ? '/api/nvidia/v1/chat/completions'
      : 'https://integrate.api.nvidia.com/v1/chat/completions';

    return fetch(nvidiaUrl, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${nvidiaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-v4-pro-0813',
        messages: formattedMessages,
        stream: true,
        temperature: 0.7,
        chat_template_kwargs: { thinking: false },
      }),
    });
  }

  return fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
      'X-Title': 'AetherCraft AI Website Builder',
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      stream: true,
      temperature: 0.7,
    }),
  });
}

// --- Main export ---

export async function streamGenerateWebsite({
  apiKey,
  model = DEFAULT_MODEL,
  messages = [],
  currentFiles = {},
  signal,
  onChunk,
  onFileParsed,
  onComplete,
  onError,
}) {
  const internalController = new AbortController();
  const effectiveSignal = signal || internalController.signal;

  // Connection timeout: 3 minutes (free models can be slow)
  let connTimeout = setTimeout(() => {
    internalController.abort(new Error('Connection timed out after 3 minutes.'));
  }, 180000);

  // Stream stall watchdog: 60 seconds of silence aborts
  let stallTimeout = null;
  const resetStallWatchdog = () => {
    if (stallTimeout) clearTimeout(stallTimeout);
    stallTimeout = setTimeout(() => {
      internalController.abort(new Error('Stream stalled — no tokens for 60 seconds.'));
    }, 60000);
  };

  const formattedMessages = buildFormattedMessages(messages, currentFiles);

  const attemptStream = async (retryOnRateLimit = true) => {
    let response;
    try {
      response = await fetchStream(apiKey, model, formattedMessages, effectiveSignal);
    } catch (fetchErr) {
      throw fetchErr;
    }

    clearTimeout(connTimeout);

    // Handle 429 rate limit with one automatic retry
    if (response.status === 429 && retryOnRateLimit) {
      await new Promise(r => setTimeout(r, 10000));
      connTimeout = setTimeout(() => internalController.abort(new Error('Retry timed out.')), 180000);
      return attemptStream(false);
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `OpenRouter API error: HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';

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
          const delta = data.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            if (onChunk) onChunk(delta, fullText);
            const parsed = parseGeneratedFiles(fullText);
            if (Object.keys(parsed.files).length > 0 && onFileParsed) {
              onFileParsed(parsed);
            }
          }
        } catch {
          // ignore partial SSE JSON
        }
      }
    }

    if (stallTimeout) clearTimeout(stallTimeout);

    const finalParsed = parseGeneratedFiles(fullText);
    if (onComplete) onComplete(fullText, finalParsed);
    return { fullText, ...finalParsed };
  };

  try {
    return await attemptStream(true);
  } catch (error) {
    if (connTimeout) clearTimeout(connTimeout);
    if (stallTimeout) clearTimeout(stallTimeout);

    const isAbort = error.name === 'AbortError' || effectiveSignal?.aborted;
    const msg = isAbort ? 'AbortError: cancelled' : error.message;

    console.error('[AetherCraft AI]', msg);
    if (onError) onError(new Error(msg));
    throw error;
  }
}

export async function testOpenRouterConnection(apiKey, model = DEFAULT_MODEL) {
  if (model.includes('gemini')) {
    const geminiKey = (apiKey && (apiKey.startsWith('AQ.') || apiKey.startsWith('AIzaSy')))
      ? apiKey
      : (import.meta.env.VITE_GEMINI_API_KEY || '');

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${geminiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-3.6-flash',
        messages: [{ role: 'user', content: "Ping. Respond with 'Connection Successful'." }],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Google Gemini API error: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Connected';
  }

  if (model.includes('nvidia') || model.includes('deepseek-v4')) {
    const nvidiaKey = (apiKey && apiKey.startsWith('nvapi-'))
      ? apiKey
      : (import.meta.env.VITE_NVIDIA_API_KEY || '');

    const nvidiaUrl = typeof window !== 'undefined'
      ? '/api/nvidia/v1/chat/completions'
      : 'https://integrate.api.nvidia.com/v1/chat/completions';

    const res = await fetch(nvidiaUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${nvidiaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-ai/deepseek-v4-pro-0813',
        messages: [{ role: 'user', content: "Ping. Respond with 'Connection Successful'." }],
        chat_template_kwargs: { thinking: false },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `NVIDIA NIM API error: HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'Connected';
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: "Ping. Respond with 'Connection Successful'." }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Connected';
}
