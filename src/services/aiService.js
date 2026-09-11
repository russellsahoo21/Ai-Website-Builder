/**
 * aiService.js
 * OpenRouter API integration with:
 * - React-only enforcement in SYSTEM_PROMPT
 * - 3-minute connection timeout (free models are slow)
 * - 60-second stream stall watchdog
 * - Automatic 429 rate-limit retry (once, after 10s)
 */

export const DEFAULT_MODEL = 'openrouter/free';

export const AVAILABLE_MODELS = [
  {
    id: 'openrouter/free',
    name: 'Auto Free Router (Recommended)',
    badge: 'Instant Queue • Auto Selected',
    isFree: true,
  },
  {
    id: 'google/gemma-4-31b-it:free',
    name: 'Google Gemma 4 31B (Free)',
    badge: '1.4s Latency • High Speed',
    isFree: true,
  },
  {
    id: 'nvidia/nemotron-3.5-lightning:free',
    name: 'NVIDIA Nemotron 3.5 (Free)',
    badge: 'Balanced Reasoning',
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
    badge: 'Frontier Quality',
    isFree: false,
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (Paid)',
    badge: 'Multimodal Frontier',
    isFree: false,
  },
];

const SYSTEM_PROMPT = `You are AetherCraft Engine, an elite React 18 engineering system.
Your mission: generate production-grade, visually stunning, fully interactive React 18 SPAs.
Take as much time as needed to produce complete, correct, high-quality code.

OUTPUT FORMAT (MANDATORY):
You MUST ALWAYS wrap your complete code in these exact delimiters:

<<<FILE:components/Navbar.jsx>>>
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

<<<FILE:App.jsx>>>
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

<<<FILE:styles.css>>>
/* custom animations & keyframes */
<<<END_FILE>>>

CRITICAL RULES:
1. NEVER output a raw HTML document (<!DOCTYPE html>, <html>, <body>). ALWAYS output React 18 JSX only.
2. NEVER reply with only explanations or plans — always output the complete code files.
3. MODULAR ARCHITECTURE (CRITICAL):
   Organize applications modularly across multiple component files (e.g. components/Navbar.jsx, components/Sidebar.jsx, components/Gallery.jsx, components/Modal.jsx, App.jsx, styles.css).
   - Breaking code into separate component files keeps code readable, isolated, and easy to debug.
   - All exported components in components/ are automatically available throughout the application.
4. COMPONENT & IDENTIFIER NAMING:
   NEVER name a component, function, or variable: Filter, Search, Save, Tag, Star, Calendar, Settings, Info, Home, Lock, User, Database, Server. Use compound domain-specific names instead (FilterPanel, SearchBar, SaveButton, TagBadge).
5. REACT CONTEXT & HOOKS SAFETY:
   Always initialize createContext({ ... }) with realistic defaults. Never call useApp() inside the component that provides AppContext.
6. STYLING & ICONS:
   Use Tailwind CSS for all styling (dark obsidian/zinc palette, crisp borders). Use Lucide icons: import { IconName } from 'lucide-react'.
7. INTERACTIVITY & PERSISTENCE:
   Implement full interactivity with useState, useEffect, and localStorage persistence for any CRUD data so the app feels 100% production-ready.
8. Provide a 1-sentence friendly overview at the very start, then output the complete files immediately. No placeholders or TODO comments.`;

// --- Internal helpers ---

import { parseGeneratedFiles } from './fileParser.js';

function buildFormattedMessages(messages, currentFiles) {
  const formatted = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (Object.keys(currentFiles).length > 0) {
    let ctx = 'Current workspace files (for context):\n';
    for (const [name, content] of Object.entries(currentFiles)) {
      ctx += `<<<FILE:${name}>>>\n${content}\n<<<END_FILE>>>\n\n`;
    }
    ctx += 'When the user requests changes, output the complete updated file(s) inside <<<FILE:...>>> delimiters.';
    formatted.push({ role: 'system', content: ctx });
  }

  const REDO_WORDS = ['redo','rebuild','try again','again','restart','regenerate','re-do','fix'];
  messages.forEach((msg, idx) => {
    const isLast = idx === messages.length - 1;
    let content = msg.content;
    if (isLast && (msg.role === 'user' || !msg.role)) {
      const lower = content.trim().toLowerCase();
      if (REDO_WORDS.includes(lower)) {
        content = `User says: "${msg.content}". Re-synthesize and output the full complete working app inside <<<FILE:App.jsx>>> and <<<END_FILE>>>. React 18 JSX only — NO <!DOCTYPE html>.`;
      } else {
        content += '\n\n[INSTRUCTION: Output complete React 18 JSX code inside <<<FILE:App.jsx>>> and <<<END_FILE>>>. Do NOT output <!DOCTYPE html> or raw HTML. React components only.]';
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
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
  return res;
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
