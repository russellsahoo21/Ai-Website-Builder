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
10. Provide a 1-sentence friendly overview at the very start, then output the complete files immediately. No placeholders or TODO comments.
11. ZERO LOCAL ASSET IMPORTS: NEVER write "import logo from './assets/logo.svg'" or import local image files. In the in-browser sandbox, local asset files do not exist. ALWAYS use valid public HTTPS URLs directly in JSX (e.g. Unsplash, Wikimedia: <img src="https://images.unsplash.com/photo-..." />) or Lucide SVG icons.
12. SURGICAL EDITS FOR MINOR CHANGES: When modifying an image, text, button, or small feature, only output the updated file (usually src/App.jsx). DO NOT output package.json, vite.config.js, index.html, or dummy asset files. Keep output minimal and fast.`;

function buildFormattedMessages(messages, currentFiles, manifestFiles = []) {
  const formatted = [{ role: 'system', content: SYSTEM_PROMPT }];

  if (currentFiles && Object.keys(currentFiles).length > 0) {
    let ctx = 'Relevant active files:\n';
    for (const [name, content] of Object.entries(currentFiles)) {
      ctx += `<<<FILE:${name}>>>\n${content}\n<<<END_FILE>>>\n\n`;
    }
    if (manifestFiles && manifestFiles.length > 0) {
      ctx += `Existing workspace files (preserved in project - do not re-output unless modifying):\n- ${manifestFiles.slice(0, 40).join('\n- ')}\n\n`;
    }
    ctx += 'When modifying or synthesizing, output complete files inside <<<FILE:...>>> delimiters with src/App.jsx first. ZERO conversation or explanations outside delimiters.';
    formatted.push({ role: 'system', content: ctx });
  }

  const REDO_WORDS = ['redo', 'rebuild', 'try again', 'again', 'restart', 'regenerate', 're-do', 'fix'];
  messages.forEach((msg, idx) => {
    const isLast = idx === messages.length - 1;
    let content = msg.content || '';
    if (isLast && (msg.role === 'user' || !msg.role)) {
      const lower = content.trim().toLowerCase();
      if (REDO_WORDS.includes(lower)) {
        content = `User says: "${msg.content}". Re-synthesize and output the full complete working app inside <<<FILE:src/App.jsx>>> FIRST. Use public HTTPS Unsplash image URLs for any hero/gallery graphics. React 18 JSX only — NO <!DOCTYPE html>. Do NOT output package.json or vite.config.js.`;
      } else if (/img|image|picture|photo|logo/i.test(lower) && /change|replace|update|broken|fix|exist/i.test(lower)) {
        content = `User says: "${msg.content}". Update the image src with a high-resolution, working public HTTPS Unsplash URL (e.g. https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1200 for comic/superhero themes, or topic-appropriate Unsplash photo). Output ONLY the updated <<<FILE:src/App.jsx>>>. Do NOT output package.json or extra files.`;
      } else {
        const isBackendReq = /backend|server|api|database|express|endpoint|sql|postgres|route|fullstack|full-stack/i.test(content);
        if (isBackendReq) {
          content += '\n\n[INSTRUCTION: User requested backend/full-stack features. Output complete full-stack code. Emit <<<FILE:src/App.jsx>>> FIRST for instant preview, followed by backend files (<<<FILE:server/index.js>>>, <<<FILE:server/routes/api.js>>>, <<<FILE:server/db/schema.sql>>>) and <<<FILE:src/services/api.js>>>. Include working mock fallbacks in api.js so the live preview functions without network errors.]';
        } else {
          content += '\n\n[INSTRUCTION: Output complete React 18 JSX code inside <<<FILE:src/App.jsx>>> as the VERY FIRST file, followed by <<<FILE:src/index.css>>>. Do NOT output CSS before src/App.jsx. Zero chatter.]';
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
