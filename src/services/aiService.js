/**
 * AI Service for OpenRouter API integration
 * Handles streaming generation of full-stack website files
 */

export const DEFAULT_MODEL = "openrouter/free";

export const AVAILABLE_MODELS = [
  {
    id: "openrouter/free",
    name: "Auto Free Router (Recommended)",
    badge: "Instant Queue • Auto Selected",
    isFree: true
  },
  {
    id: "google/gemma-4-31b-it:free",
    name: "Google Gemma 4 31B (Free)",
    badge: "1.4s Latency • High Speed",
    isFree: true
  },
  {
    id: "nvidia/nemotron-3.5-lightning:free",
    name: "NVIDIA Nemotron 3.5 (Free)",
    badge: "Balanced Reasoning",
    isFree: true
  },
  {
    id: "cohere/north-mini-code:free",
    name: "Cohere North Mini Code (Free)",
    badge: "Code Specialist",
    isFree: true
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet (Paid)",
    badge: "Frontier Quality",
    isFree: false
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o (Paid)",
    badge: "Multimodal Frontier",
    isFree: false
  }
];

const SYSTEM_PROMPT = `You are AetherCraft Engine, an elite full-stack web application architect and React 18 engineering system.
Your mission is to generate production-grade, visually breathtaking, fully responsive, and interactive React 18 web applications from user prompts.

APPLICATION ARCHITECTURE & STANDARDS:
1. Modern React 18 Single-Page Application (SPA):
   - Output your main application code as "App.jsx".
   - Use standard React 18 functional components with hooks (useState, useEffect, useMemo, useRef).
   - Use Tailwind CSS for modern, high-contrast, clean UI styling (dark obsidian/zinc palette, subtle borders, sharp typography).
   - Use Lucide icons: import { Plus, Trash2, DollarSign, TrendingUp, Filter, Search, ... } from 'lucide-react';
   - For full-stack features (databases, CRUD, persistent state, expense tracking, authentication simulation), implement robust client-side state with localStorage persistence and mock API helpers so the app is 100% interactive and functional inside the browser sandbox.
2. Component & Identifier Naming (CRITICAL):
   - NEVER name a component, function, or variable one of these reserved words: Filter, Search, Save, Tag, Star, Calendar, Settings, Info, Home, Lock, User, Database, Server.
   - Always use domain-specific, compound names instead (e.g. "FilterPanel", "SearchBar", "SaveButton", "TagBadge", "UserProfile", "DatabaseManager").
3. React Context & Hooks Safety (CRITICAL):
   - Never call a context hook (e.g. useApp()) inside the component that declares or renders its own <AppContext.Provider>. Calling context outside its provider returns undefined and crashes destructuring.
   - If using React Context, always initialize React.createContext({ ... }) with realistic default values (e.g. createContext({ user: { name: 'Alex' }, expenses: [] })).
   - Write self-contained code: Declare all sub-components (Modal, Header, StatCard, Table) in the same App.jsx file.

CRITICAL OUTPUT FORMAT RULES:
1. NEVER reply with just conversational text, plans, or explanations without the code.
2. You MUST ALWAYS output the complete working code inside strict file delimiters:

<<<FILE:App.jsx>>>
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp, Filter, Search } from 'lucide-react';

export default function App() {
  // Complete working React code with state, full interactivity, and Tailwind
  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 p-6 font-sans">
      {/* semantic, beautiful components here */}
    </div>
  );
}
<<<END_FILE>>>

<<<FILE:styles.css>>>
/* Custom animations & design accents */
<<<END_FILE>>>

3. Provide a brief 1-line friendly summary at the very beginning of what you designed, followed immediately by the files.
4. Always write complete, working code without placeholders or 'TODO' comments.`;

/**
 * Parses the raw AI response text and extracts structured files
 */
export function parseGeneratedFiles(text) {
  const files = {};
  const fileRegex = /<<<FILE:([\w./-]+)>>>([\s\S]*?)<<<END_FILE>>>/g;
  let match;

  while ((match = fileRegex.exec(text)) !== null) {
    const filename = match[1].trim();
    const content = match[2].trim();
    files[filename] = content;
  }

  // Fallback 1: Unclosed stream or missing <<<END_FILE>>> at the end
  if (Object.keys(files).length === 0 && text.includes('<<<FILE:')) {
    const parts = text.split('<<<FILE:');
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const match = part.match(/^([\w./-]+)>>>([\s\S]*?)(?:<<<END_FILE>>>|$)/);
      if (match) {
        const filename = match[1].trim();
        const content = match[2].trim();
        if (content.length > 20) {
          files[filename] = content;
        }
      }
    }
  }

  // Fallback 2: if model formatted as markdown code blocks with filenames or languages
  if (Object.keys(files).length === 0) {
    const mdRegex = /```(?:html|css|javascript|js|jsx|tsx|react)?(?:\s+(?:filename="?([\w./-]+)"?|([\w./-]+)))?\n([\s\S]*?)(?:```|$)/gi;
    let mdMatch;
    let index = 0;
    while ((mdMatch = mdRegex.exec(text)) !== null) {
      let filename = mdMatch[1] || mdMatch[2];
      const content = mdMatch[3].trim();
      if (!filename) {
        if (content.includes('import React') || content.includes('useState') || content.includes('export default function') || content.includes('function App')) {
          filename = 'App.jsx';
        } else if (content.includes('<!DOCTYPE') || content.includes('<html')) {
          filename = 'index.html';
        } else if (content.includes('{') && (content.includes('margin') || content.includes('padding') || content.includes('color') || content.includes('@tailwind'))) {
          filename = 'styles.css';
        } else {
          filename = `App.jsx`;
        }
      }
      if (content.length > 20) {
        files[filename] = content;
      }
      index++;
    }
  }

  // Fallback 3: if response contains bare JSX / React code without delimiters or markdown tags
  if (Object.keys(files).length === 0) {
    if (text.includes('export default function') || text.includes('function App(') || text.includes('const App =') || text.includes('useState(')) {
      const startIdx = text.search(/(?:import\s+React|export\s+default\s+function|function\s+App|const\s+App)/);
      if (startIdx !== -1) {
        files['App.jsx'] = text.slice(startIdx).trim();
      }
    }
  }

  return files;
}

/**
 * Streams the website generation response from OpenRouter API
 */
export async function streamGenerateWebsite({
  apiKey,
  model = DEFAULT_MODEL,
  messages = [],
  currentFiles = {},
  signal,
  onChunk,
  onFileParsed,
  onComplete,
  onError
}) {
  const internalController = new AbortController();
  const effectiveSignal = signal || internalController.signal;

  // Watchdog 1: 45s connection timeout if endpoint doesn't respond
  let connectionTimeout = setTimeout(() => {
    internalController.abort(new Error("Connection timed out (45s). The AI provider is heavily queued or unresponsive."));
  }, 45000);

  // Watchdog 2: 30s inactivity timer if streaming stalls mid-response
  let streamInactivityTimeout = null;

  const resetInactivityWatchdog = () => {
    if (streamInactivityTimeout) clearTimeout(streamInactivityTimeout);
    streamInactivityTimeout = setTimeout(() => {
      internalController.abort(new Error("Stream stalled: no tokens received for 30s."));
    }, 30000);
  };

  try {
    const formattedMessages = [
      { role: "system", content: SYSTEM_PROMPT }
    ];

    // If there are existing files in workspace, provide them as context for multi-turn edits
    if (Object.keys(currentFiles).length > 0) {
      let contextMsg = "Current workspace files:\n";
      for (const [name, content] of Object.entries(currentFiles)) {
        contextMsg += `<<<FILE:${name}>>>\n${content}\n<<<END_FILE>>>\n\n`;
      }
      formattedMessages.push({
        role: "system",
        content: contextMsg + "\nWhen the user requests modifications or a redo, update the affected files and output the complete working versions with the <<<FILE:...>>> tags."
      });
    }

    // Append conversation history with smart prompt expansion for short instructions
    messages.forEach((msg, idx) => {
      const isLast = idx === messages.length - 1;
      let content = msg.content;
      if (isLast && (msg.role === 'user' || !msg.role)) {
        const lower = content.trim().toLowerCase();
        if (['redo', 'rebuild', 'try again', 'again', 'restart', 'regenerate', 're-do', 'fix'].includes(lower)) {
          content = `User instruction: "${msg.content}". Please re-synthesize and output the full, complete working application code inside <<<FILE:App.jsx>>> and <<<END_FILE>>>. Do NOT reply with plans or commentary alone.`;
        } else {
          content += "\n\n[Instruction: You must output complete, working code inside <<<FILE:...>>> and <<<END_FILE>>> delimiters.]";
        }
      }
      formattedMessages.push({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: content
      });
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: effectiveSignal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : "http://localhost:5173",
        "X-Title": "AetherCraft AI Website Builder"
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        stream: true,
        temperature: 0.7
      })
    });

    clearTimeout(connectionTimeout);

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `OpenRouter API returned status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";

    resetInactivityWatchdog();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      resetInactivityWatchdog();

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;

        if (trimmed.startsWith("data: ")) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta?.content || "";
            if (delta) {
              fullText += delta;
              if (onChunk) onChunk(delta, fullText);

              // Continuously parse files as they stream
              const files = parseGeneratedFiles(fullText);
              if (Object.keys(files).length > 0 && onFileParsed) {
                onFileParsed(files);
              }
            }
          } catch {
            // ignore partial JSON parse errors in stream
          }
        }
      }
    }

    if (streamInactivityTimeout) clearTimeout(streamInactivityTimeout);

    const finalFiles = parseGeneratedFiles(fullText);
    if (onComplete) onComplete(fullText, finalFiles);
    return { fullText, files: finalFiles };

  } catch (error) {
    if (connectionTimeout) clearTimeout(connectionTimeout);
    if (streamInactivityTimeout) clearTimeout(streamInactivityTimeout);

    const isAbort = error.name === 'AbortError' || effectiveSignal.aborted;
    const msg = isAbort 
      ? "Generation cancelled or provider timed out. You can retry with a different model from Settings."
      : error.message;

    console.error("AI Generation Error:", msg);
    if (onError) onError(new Error(msg));
    throw error;
  }
}

/**
 * Test OpenRouter API Key connection
 */
export async function testOpenRouterConnection(apiKey, model = DEFAULT_MODEL) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "user", content: "Ping. Respond with 'Connection Successful'." }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Connected";
}
