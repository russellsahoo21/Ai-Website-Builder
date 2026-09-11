import React, { useState, useEffect } from 'react';
import {
  BookOpen, Sparkles, Terminal, Code2, Globe, Rocket, Key, Copy, Check,
  ChevronRight, ChevronLeft, ArrowRight, ExternalLink, Zap, HelpCircle,
  CheckCircle2, AlertCircle, ShieldCheck, ThumbsUp, ThumbsDown, X,
  Search, Command
} from 'lucide-react';

// ─── DOCUMENTATION CATEGORIES & SECTIONS ─────────────────────────────────────────

const DOC_CATEGORIES = [
  {
    id: "getting-started",
    name: "Getting Started",
    icon: Rocket,
    sections: [
      {
        id: "architecture",
        title: "System Architecture",
        badge: "Core",
        readTime: "3 min read",
        description: "How AetherCraft compiles, sandboxes, and renders React 18 applications in real-time.",
        headings: [
          { id: "overview", label: "Overview & Philosophy" },
          { id: "pipeline", label: "End-to-End Synthesis Pipeline" },
          { id: "virtual-dom", label: "Babel Sandboxing Architecture" },
          { id: "security-isolation", label: "Sandbox Security Model" }
        ],
        content: {
          overview: "AetherCraft is an intelligent, full-stack website builder and software prototyping platform engineered from the ground up for React 18 and Tailwind CSS. Unlike legacy AI builders that output static HTML strings or hallucinated scripts, AetherCraft treats your web app as a living, modular React application.",
          pipelineSteps: [
            {
              title: "1. Prompt Ingestion & Middleware",
              desc: "Your raw prompt is intercepted by the Smart Prompt Enhancer, which enriches it with architectural constraints, design tokens, and state management specifications."
            },
            {
              title: "2. OpenRouter Model Streaming",
              desc: "The enriched specification streams to elite coding models (Gemma 4 31B, Nemotron 3.5, Claude 3.5 Sonnet) over server-sent events (SSE)."
            },
            {
              title: "3. Incremental File Parsing",
              desc: "The streaming parser continuously extracts multi-file structures (<<<FILE:App.jsx>>>, <<<FILE:styles.css>>>) without waiting for completion."
            },
            {
              title: "4. Babel Standalone Compilation",
              desc: "The sandbox builds an in-memory bundle, compiles JSX into pure ECMAScript via @babel/standalone, and mounts it into an isolated iframe."
            },
            {
              title: "5. Behind-the-Scenes Error Guard",
              desc: "If any runtime error or syntax anomaly occurs, the sandbox catches it silently and initiates an automatic self-repair cycle without flashing red error boxes."
            }
          ],
          codeExample: `// Architecture Overview: The AetherCraft Compilation Pipeline
import { streamGenerateWebsite } from './services/aiService';
import { parseGeneratedFiles } from './services/fileParser';
import { buildPreviewDoc } from './utils/previewBuilder';

// 1. Enriched prompt streams from OpenRouter
const stream = await streamGenerateWebsite({
  apiKey: userApiKey,
  model: 'openrouter/free',
  messages: enrichedMessages,
  onFileParsed: ({ files }) => {
    // 2. Dynamic multi-file tree update
    updateVirtualFileSystem(files);
  },
  onComplete: (fullCode, finalFiles) => {
    // 3. Mounts directly into Sandboxed React 18 runtime
    const sandboxDoc = buildPreviewDoc(finalFiles);
    iframeRef.current.srcdoc = sandboxDoc;
  }
});`
        }
      },
      {
        id: "folder-structure",
        title: "Standard React Structure",
        badge: "Vite Ready",
        readTime: "2 min read",
        description: "Clean, production-grade folder structure conforming to Vite & React 18 standards.",
        headings: [
          { id: "structure-overview", label: "Workspace Layout" },
          { id: "file-roles", label: "File Responsibilities" },
          { id: "vite-compatibility", label: "100% Vite & CRA Compatibility" }
        ],
        content: {
          overview: "AetherCraft automatically maintains a clean, industry-standard React folder hierarchy. Whether you write one component or fifty, your code is always organized in a standard project structure ready for local development or CI/CD deployment.",
          codeStructure: `my-aethercraft-app/
├── index.html              # Standard HTML5 entry with #root mount point
├── package.json            # React 18, Lucide React, and Tailwind dependencies
├── vite.config.js          # Pre-configured Vite bundler settings
├── src/
│   ├── main.jsx            # React 18 createRoot bootstrap
│   ├── App.jsx             # Primary interactive SPA application component
│   └── index.css           # Tailwind directives & custom CSS animations
└── public/
    └── favicon.svg         # Default vector project favicon`
        }
      }
    ]
  },
  {
    id: "ai-workflow",
    name: "AI & Prompt Engineering",
    icon: Sparkles,
    sections: [
      {
        id: "prompt-enhancer",
        title: "Smart Prompt Enhancer",
        badge: "Middleware",
        readTime: "4 min read",
        description: "How our automatic prompt middleware converts brief ideas into world-class software specifications.",
        headings: [
          { id: "how-it-works", label: "How the Enhancer Works" },
          { id: "interactive-comparator", label: "Interactive Before & After" },
          { id: "enhancement-rules", label: "Automatic Augmentation Rules" }
        ],
        content: {
          overview: "Writing exhaustive prompts with color palettes, component trees, and accessibility constraints is tedious. AetherCraft features a Smart Prompt Enhancer Middleware that intercepts your natural query and automatically expands it with production-grade engineering guidelines before forwarding it to the AI model.",
          formula: "Context + Aesthetic Hierarchy + Component Decomposition + Interactivity Hooks + Production Polish",
          rawExample: "build a modern gym and fitness tracker dashboard",
          enhancedExample: `Build an elite, ultra-modern Fitness & Gym Performance Tracker SPA in React 18 with Tailwind CSS.

1. Visual Aesthetic & Theme:
- Theme: Deep obsidian (#090a0f) luxury dark mode with vibrant neon-emerald (#10b981) and cyan (#06b6d4) accent gradients.
- Cards: Sleek glassmorphism panels with bg-zinc-900/60, backdrop-blur-md, and subtle border-white/10 glow.
- Typography: Inter / system sans with clear hierarchy, tracking-tight numbers, and uppercase tracking-wider micro-badges.

2. Architecture & Components:
- WorkoutRoutinePlanner: Interactive split manager (Push/Pull/Legs) with exercise counters and target muscle tags.
- LiveCalorieProgress: Circular SVG ring progress indicators for Daily Calories, Protein (g), and Hydration (L).
- ActivityLogTable: Searchable, filterable workout history with date stamps, PR badges, and delete/edit actions.
- QuickLogModal: Pop-up modal with clean form inputs, reps/sets counters, and smooth entrance animation.

3. Interactivity & State:
- All data stored in localStorage for persistent session tracking.
- Interactive tab switching between 'Overview', 'Workouts', 'Analytics', and 'Settings'.
- Micro-interactions: hover:scale-[1.02] transitions, active click ripples, and toast notification on save.`
        }
      },
      {
        id: "vibe-coding",
        title: "The Art of Vibe Coding",
        badge: "Best Practices",
        readTime: "3 min read",
        description: "Techniques for iterating rapidly and getting pixel-perfect results in seconds.",
        headings: [
          { id: "vibe-principles", label: "Core Principles" },
          { id: "iteration-phrases", label: "High-Impact Iteration Commands" },
          { id: "color-palettes", label: "Recommended Color Tokens" }
        ],
        content: {
          overview: "Vibe Coding is the practice of directing software creation by describing the feel, energy, and visual rhythm of an application rather than manually typing syntax. The secret to phenomenal vibe coding is providing concrete aesthetic cues and specific interactive behaviors.",
          tips: [
            {
              title: "Specify Deep Dark Obsidian",
              desc: "Ask for 'deep obsidian background (#090a0f) with subtle radial mesh gradient' rather than generic 'dark theme'."
            },
            {
              title: "Demand Specific Micro-interactions",
              desc: "Mention 'animated hover states', 'smooth accordion expand/collapse', and 'confetti celebration on task completion'."
            },
            {
              title: "Request Realistic Mock Data",
              desc: "Prompt for 'realistic enterprise telemetry data with active timestamps, latency gauges, and revenue metrics'."
            }
          ]
        }
      },
      {
        id: "bts-auto-repair",
        title: "BTS Error Self-Healing",
        badge: "Auto-Fix",
        readTime: "3 min read",
        description: "Zero-friction error boundary and autonomous background code repair.",
        headings: [
          { id: "self-healing-concept", label: "Zero-Friction Concept" },
          { id: "error-reporter", label: "Friendly Message Transformation" },
          { id: "recovery-loop", label: "The Autonomous Healing Loop" }
        ],
        content: {
          overview: "Traditional sandbox environments show jarring red crash screens when the AI makes a typo or variable scoping mistake. AetherCraft implements Behind-The-Scenes (BTS) Auto-Repair: the sandbox keeps displaying the last good, working preview while silently dispatching a targeted self-healing prompt to fix the issue in the background.",
          codeSnippet: `// Sandbox Error Reporter: Maps raw JS errors to friendly statuses
const ERROR_PATTERNS = [
  { pattern: /Identifier.*already.*declared/i, message: 'Optimizing component structure…' },
  { pattern: /Cannot read properties/i,        message: 'Resolving state initialization…' },
  { pattern: /is not defined/i,                message: 'Resolving missing dependencies…' },
  { pattern: /SyntaxError/i,                   message: 'Recompiling application code…' }
];

// BTS Recovery Loop: Users never see red crash screens!`
        }
      }
    ]
  },
  {
    id: "runtime-tech",
    name: "Runtime & Shims",
    icon: Code2,
    sections: [
      {
        id: "react-lucide",
        title: "React 18 & Lucide Shims",
        badge: "Runtime",
        readTime: "4 min read",
        description: "Built-in React 18 hooks, global shims, and Lucide React icon resolution.",
        headings: [
          { id: "supported-hooks", label: "Supported React Hooks" },
          { id: "lucide-shims", label: "Dynamic Lucide Icon Shims" },
          { id: "naming-conventions", label: "Safe Component Naming Rules" }
        ],
        content: {
          overview: "The AetherCraft Sandbox mounts React 18 directly in an isolated virtual DOM using Babel Standalone. It includes built-in shims for popular libraries including Lucide React, allowing you to import any of the 1,000+ Lucide icons seamlessly.",
          hooksList: [
            "useState — Full interactive state management with object & array spreading",
            "useEffect — Lifecycle, interval timers, keyboard listeners, and event handlers",
            "useRef — Direct DOM references, audio/video playback, and measurement",
            "useMemo & useCallback — Performance optimization and memoized filters",
            "useContext — Global app themes, user cart, or notification providers"
          ],
          codeSnippet: `// Standard App.jsx Component using Lucide Icons & React 18
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Trash2, ArrowUpRight, 
  Search, Shield, CheckCircle 
} from 'lucide-react';

export default function App() {
  const [items, setItems] = useState([
    { id: 1, name: 'Quantum Core', status: 'Active' }
  ]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-white p-8">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-indigo-400" />
        <h1 className="text-2xl font-bold">AetherCraft Studio</h1>
      </div>
      {/* Interactive UI with working Lucide icons */}
    </div>
  );
}`
        }
      },
      {
        id: "openrouter-models",
        title: "AI Models & OpenRouter",
        badge: "API Security",
        readTime: "3 min read",
        description: "Supported LLM architectures, streaming watchdogs, and client-side key safety.",
        headings: [
          { id: "model-matrix", label: "Supported Model Matrix" },
          { id: "client-security", label: "Client-Side Security Model" },
          { id: "rate-limits", label: "Watchdog & 429 Retry Engine" }
        ],
        content: {
          overview: "AetherCraft connects directly to the OpenRouter unified API gateway. You can use completely free models or plug in your own key to leverage frontier foundation models.",
          models: [
            { name: "Auto Free Router", tier: "Free", latency: "Instant", desc: "Intelligent automatic load balancer across high-speed free coding endpoints." },
            { name: "Google Gemma 4 31B", tier: "Free", latency: "1.4s", desc: "Super-fast, high-accuracy reasoning model specialized in clean JSX syntax." },
            { name: "NVIDIA Nemotron 3.5", tier: "Free", latency: "2.1s", desc: "Balanced reasoning engine with strong architectural planning." },
            { name: "Claude 3.5 Sonnet", tier: "Paid", latency: "1.8s", desc: "Industry gold standard for frontend UI aesthetics and intricate animations." },
            { name: "OpenAI GPT-4o", tier: "Paid", latency: "1.6s", desc: "Multimodal frontier model with unmatched creative component generation." }
          ]
        }
      }
    ]
  },
  {
    id: "deployment-guide",
    name: "Export & Deployment",
    icon: Globe,
    sections: [
      {
        id: "deployment",
        title: "1-Click Netlify & Vercel",
        badge: "Deploy",
        readTime: "3 min read",
        description: "How to deploy your generated application live to the web in under 60 seconds.",
        headings: [
          { id: "netlify-drop", label: "Netlify Drop (30 Seconds)" },
          { id: "vercel-deploy", label: "Vercel & Next-Gen Hosts" },
          { id: "local-dev", label: "Running Locally via Vite" }
        ],
        content: {
          overview: "Every application generated in AetherCraft is 100% production-ready standard web code. When you click Export ZIP, you receive a standalone package that you can launch immediately without any proprietary locks or dependencies.",
          steps: [
            {
              title: "Step 1: Export ZIP Archive",
              desc: "In AetherCraft Studio, click the 'Export ZIP' button in the top navigation bar. Your complete project downloads instantly."
            },
            {
              title: "Step 2: Drag & Drop to Netlify",
              desc: "Navigate to app.netlify.com/drop in your browser. Drag the unzipped project folder directly into the browser window."
            },
            {
              title: "Step 3: Instant Live Production URL",
              desc: "Netlify provisions global edge CDN distribution and free automated SSL certificates in under 15 seconds. Your site is live worldwide!"
            }
          ],
          codeLocal: `# Run your exported AetherCraft project locally
cd my-aethercraft-app
npm install
npm run dev

# Starts instant Vite HMR dev server at http://localhost:5173`
        }
      },
      {
        id: "troubleshooting",
        title: "FAQs & Troubleshooting",
        badge: "FAQ",
        readTime: "2 min read",
        description: "Instant solutions to common queries and debugging techniques.",
        headings: [
          { id: "common-questions", label: "Frequently Asked Questions" },
          { id: "sandbox-tips", label: "Sandbox Optimization Tips" }
        ],
        content: {
          faqs: [
            {
              q: "Can I use external NPM libraries inside the sandbox?",
              a: "Yes! React 18, React DOM, Lucide React, and Tailwind CSS are built into the sandbox. In addition, standard CDN modules (such as Chart.js or Canvas-Confetti) can be loaded dynamically."
            },
            {
              q: "Where is my OpenRouter API key stored?",
              a: "Your API key is stored strictly in your browser's client-side localStorage. It is never logged, saved on any backend, or transmitted to any third party except OpenRouter."
            },
            {
              q: "What should I do if the preview looks blank or fails to render?",
              a: "Click the Refresh button (↻) in the studio toolbar. The AetherCraft engine will teardown and remount a clean virtual DOM. You can also click 'Open in New Tab' to view the app in a standalone window."
            },
            {
              q: "How many websites can I generate for free?",
              a: "You get 5 free generations on the Starter plan. Upgrading to Pro gives you unlimited generations, priority streaming queues, and access to all frontier AI models."
            }
          ]
        }
      }
    ]
  }
];

// ─── DOCS AI KNOWLEDGE BASE & QUICK ANSWERS ─────────────────────────────────────

const DOCS_AI_KNOWLEDGE = [
  {
    keywords: ["prompt", "enhancer", "middleware", "vibe", "better", "quality"],
    title: "Smart Prompt Enhancer Middleware",
    sectionId: "prompt-enhancer",
    summary: "The Prompt Enhancer automatically transforms brief user prompts into comprehensive, production-grade technical specifications.",
    details: "When you type a simple prompt like 'make a crypto dashboard', the middleware augments it with color tokens (obsidian #090a0f, emerald/cyan gradients), component hierarchies (WalletOverview, LiveTickerTable, TransactionHistory), and state requirements (localStorage persistence, real-time simulated price ticks).",
    codeSnippet: `// Prompt Enhancer Formula:
Context + Aesthetic Tokens + Component Architecture + Interactivity + Polish`
  },
  {
    keywords: ["netlify", "deploy", "export", "zip", "publish", "vercel", "hosting"],
    title: "1-Click Netlify Drop Deployment",
    sectionId: "deployment",
    summary: "Deploy your exported project live to the web in under 30 seconds with zero server configuration.",
    details: "Click 'Export ZIP' in the Studio top bar. Extract the ZIP on your computer. Open app.netlify.com/drop and drag the unzipped folder into the browser. Netlify automatically provides a global CDN URL and free SSL.",
    codeSnippet: `# For local development after unzipping:
npm install
npm run dev`
  },
  {
    keywords: ["hooks", "react", "lucide", "icons", "runtime", "sandbox", "babel"],
    title: "React 18 & Lucide Shim Runtime",
    sectionId: "react-lucide",
    summary: "AetherCraft runs authentic React 18 with full hook support and dynamic Lucide icon shims.",
    details: "Supported hooks include useState, useEffect, useRef, useCallback, useMemo, and useContext. Lucide icons are dynamically rendered as lightweight vector SVGs inside the sandboxed iframe without needing heavy bundle downloads.",
    codeSnippet: `import { Sparkles, Activity, ShieldCheck } from 'lucide-react';
// All 1,000+ Lucide icons are supported automatically!`
  },
  {
    keywords: ["repair", "error", "bts", "auto-fix", "crash", "healing", "broken"],
    title: "Behind-the-Scenes Error Self-Healing",
    sectionId: "bts-auto-repair",
    summary: "Runtime errors are caught silently and repaired by the AI in the background.",
    details: "If a syntax error or missing variable occurs in the sandbox, AetherCraft catches it via postMessage, maps it to a friendly message ('Optimizing application structure...'), keeps the last working preview visible, and dispatches a surgical fix prompt to the AI.",
    codeSnippet: `// Recovery Heuristic:
Last Good Preview Displayed -> Background AI Patch -> Hot Reload`
  },
  {
    keywords: ["model", "openrouter", "free", "gemma", "nemotron", "api", "key"],
    title: "AI Models & OpenRouter Free Tier",
    sectionId: "openrouter-models",
    summary: "Use top free coding models or connect your own API key for frontier access.",
    details: "AetherCraft includes Google Gemma 4 31B and NVIDIA Nemotron 3.5 for fast, free code generation. Your API key is stored purely in client-side localStorage and is never routed through intermediary servers.",
    codeSnippet: `// Selected Free Model:
'openrouter/free' (Auto load-balanced across high-speed coding endpoints)`
  }
];

// ─── REUSABLE UI COMPONENTS ─────────────────────────────────────────────────────

function CodeBlock({ code, language = "javascript", filename }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 rounded-2xl overflow-hidden border border-white/10 bg-[#07090e] shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/5 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono font-medium text-zinc-300">{filename || language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition text-[11px] font-medium"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto font-mono text-xs text-zinc-300 leading-relaxed">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

function Callout({ type = "tip", title, children }) {
  const configs = {
    tip: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-300",
      icon: Zap,
      badge: "PRO TIP"
    },
    important: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      text: "text-indigo-300",
      icon: Sparkles,
      badge: "IMPORTANT"
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-300",
      icon: AlertCircle,
      badge: "NOTE"
    },
    security: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      text: "text-cyan-300",
      icon: ShieldCheck,
      badge: "SECURITY"
    }
  };

  const c = configs[type] || configs.tip;
  const Icon = c.icon;

  return (
    <div className={`my-5 p-4 sm:p-5 rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${c.text}`} />
        <span className={`text-[11px] font-extrabold tracking-wider uppercase ${c.text}`}>{c.badge}</span>
        {title && <span className="text-xs font-bold text-white ml-1.5">• {title}</span>}
      </div>
      <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function PromptComparator({ rawPrompt, enhancedPrompt }) {
  const [activeTab, setActiveTab] = useState('enhanced');
  const [copied, setCopied] = useState(false);

  const textToCopy = activeTab === 'enhanced' ? enhancedPrompt : rawPrompt;

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 rounded-2xl border border-white/10 bg-[#0a0d14] overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-3 bg-white/[0.02] border-b border-white/5">
        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'raw'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Raw User Input
          </button>
          <button
            onClick={() => setActiveTab('enhanced')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'enhanced'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>AI Enhanced Output</span>
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
        </button>
      </div>

      <div className="p-5 font-mono text-xs sm:text-[13px] leading-relaxed">
        {activeTab === 'raw' ? (
          <div className="text-zinc-400 italic bg-black/30 p-4 rounded-xl border border-white/5">
            "{rawPrompt}"
          </div>
        ) : (
          <div className="text-zinc-200 whitespace-pre-line bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/20">
            {enhancedPrompt}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN DOCS AI COMPONENT ────────────────────────────────────────────────────

export default function DocsPage({ navigateTo }) {
  // Navigation State
  const [activeSectionId, setActiveSectionId] = useState('architecture');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [articleFeedback, setArticleFeedback] = useState({});

  // Keyboard shortcut (⌘K or Ctrl+K) to open Docs AI
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsAiModalOpen(true);
      }
      if (e.key === 'Escape' && isAiModalOpen) {
        setIsAiModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAiModalOpen]);

  // Find active section and category
  let activeCategory = null;
  let activeSection = null;

  for (const cat of DOC_CATEGORIES) {
    const found = cat.sections.find(s => s.id === activeSectionId);
    if (found) {
      activeCategory = cat;
      activeSection = found;
      break;
    }
  }

  if (!activeSection) {
    activeCategory = DOC_CATEGORIES[0];
    activeSection = DOC_CATEGORIES[0].sections[0];
  }

  // Flattened sections for Next / Prev navigation
  const allSections = DOC_CATEGORIES.flatMap(cat => cat.sections);
  const currentIndex = allSections.findIndex(s => s.id === activeSection.id);
  const prevSection = currentIndex > 0 ? allSections[currentIndex - 1] : null;
  const nextSection = currentIndex < allSections.length - 1 ? allSections[currentIndex + 1] : null;

  // Handle Ask Docs AI Query
  const handleAskDocsAi = (customQuery = null) => {
    const query = (customQuery || aiQuestion || searchQuery).trim();
    if (!query) return;

    setIsAiThinking(true);
    setAiAnswer(null);

    setTimeout(() => {
      const qLower = query.toLowerCase();
      // Look for best match in knowledge base
      let bestMatch = DOCS_AI_KNOWLEDGE.find(item =>
        item.keywords.some(k => qLower.includes(k)) ||
        qLower.includes(item.title.toLowerCase())
      );

      if (!bestMatch) {
        // Fallback match based on sections
        const sectionMatch = allSections.find(s =>
          s.title.toLowerCase().includes(qLower) ||
          s.description.toLowerCase().includes(qLower)
        );
        if (sectionMatch) {
          bestMatch = {
            title: sectionMatch.title,
            sectionId: sectionMatch.id,
            summary: sectionMatch.description,
            details: "This topic is covered in depth inside the " + sectionMatch.title + " article. AetherCraft ensures standard React 18 syntax, responsive Tailwind styling, and automated deployment.",
            codeSnippet: "// Refer to the full documentation for interactive examples."
          };
        } else {
          bestMatch = {
            title: "AetherCraft React 18 Engine",
            sectionId: "architecture",
            summary: "AetherCraft automatically builds and iterates full-stack React 18 SPAs from natural language prompts.",
            details: "You can ask about the Prompt Enhancer, React 18 shims, 1-Click Netlify deployment, or OpenRouter free models.",
            codeSnippet: "// Try asking: 'How do I deploy to Netlify?' or 'What React hooks are supported?'"
          };
        }
      }

      setAiAnswer(bestMatch);
      setIsAiThinking(false);
    }, 400);
  };

  const handleFeedback = (val) => {
    setArticleFeedback(prev => ({ ...prev, [activeSection.id]: val }));
  };

  const scrollToHeading = (headingId) => {
    const el = document.getElementById(headingId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* ─── STICKY HEADER & BREADCRUMBS ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Breadcrumbs & Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
              <span className="flex items-center gap-1 text-indigo-400">
                <BookOpen className="w-4 h-4" />
                <span>Docs AI</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-zinc-400 hidden sm:inline">{activeCategory.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-600 hidden sm:inline" />
              <span className="text-zinc-100 truncate max-w-[160px] sm:max-w-xs">{activeSection.title}</span>
            </div>
            <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              v2.4 Engine
            </span>
          </div>

          {/* Center/Right: Omnibar Trigger */}
          <div className="flex-1 max-w-md mx-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 text-xs text-zinc-400 transition group shadow-inner"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-400 transition" />
                <span className="truncate">Ask Docs AI or search docs...</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-zinc-300 border border-white/10">
                  <Command className="w-2.5 h-2.5" /> K
                </kbd>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              </div>
            </button>
          </div>

          {/* Right Action: Back to Studio */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigateTo('studio')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/25"
            >
              <span>Back to Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN 3-COLUMN LAYOUT ──────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ─── LEFT SIDEBAR: NAVIGATION ────────────────────────────────────────── */}
        <aside className="lg:col-span-3 space-y-6">
          {/* Quick AI Search Trigger Pill */}
          <div
            onClick={() => setIsAiModalOpen(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-[#0e121a] to-[#0e121a] border border-indigo-500/20 cursor-pointer hover:border-indigo-500/40 transition group"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition" />
              </div>
              <span className="text-xs font-bold text-white">Ask Docs AI Assistant</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Instant answers on hooks, prompt formulas, and Netlify deployment.
            </p>
          </div>

          {/* Grouped Category Nav */}
          <nav className="space-y-6">
            {DOC_CATEGORIES.map(category => {
              const CategoryIcon = category.icon;
              return (
                <div key={category.id} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-2 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                    <CategoryIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{category.name}</span>
                  </div>

                  <div className="space-y-1">
                    {category.sections.map(section => {
                      const isActive = activeSection.id === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSectionId(section.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl transition flex items-center justify-between text-xs font-medium ${
                            isActive
                              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                          }`}
                        >
                          <span className="truncate">{section.title}</span>
                          {section.badge && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                              isActive
                                ? 'bg-indigo-500/20 text-indigo-200'
                                : 'bg-white/5 text-zinc-500'
                            }`}>
                              {section.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* ─── CENTER COLUMN: MAIN CONTENT ─────────────────────────────────────── */}
        <main className="lg:col-span-6 xl:col-span-6 space-y-8 min-w-0">
          {/* Article Header */}
          <div className="border-b border-white/10 pb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-2">
              <span>{activeCategory.name}</span>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <span className="text-zinc-300">{activeSection.badge || 'Guide'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
              {activeSection.title}
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {activeSection.description}
            </p>
            <div className="flex items-center gap-4 mt-4 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeSection.readTime}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified React 18 Engine</span>
              </span>
            </div>
          </div>

          {/* SECTION CONTENT SWITCHER */}
          <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
            {/* 1. Architecture Section */}
            {activeSection.id === 'architecture' && (
              <div className="space-y-6">
                <div id="overview">
                  <h2 className="text-lg font-bold text-white mb-2">Overview & Philosophy</h2>
                  <p>{activeSection.content.overview}</p>
                </div>

                <Callout type="important" title="Isolated Virtual DOM Sandbox">
                  AetherCraft executes compiled code inside an isolated <code className="text-indigo-200">iframe</code> with strict sandbox attributes. The host SaaS dashboard is completely decoupled from the generated user code, guaranteeing that even complex infinite loops or syntax errors cannot crash your workspace.
                </Callout>

                <div id="pipeline" className="space-y-4">
                  <h2 className="text-lg font-bold text-white">End-to-End Synthesis Pipeline</h2>
                  <div className="space-y-3">
                    {activeSection.content.pipelineSteps.map((step, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <div className="font-semibold text-white text-xs sm:text-sm">{step.title}</div>
                        <div className="text-xs text-zinc-400 leading-relaxed">{step.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div id="virtual-dom">
                  <h2 className="text-lg font-bold text-white mb-2">Babel Sandboxing Architecture</h2>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    The code preview builder assembles React 18, React DOM, Tailwind CSS CDN, and Lucide React shims dynamically into an in-memory document:
                  </p>
                  <CodeBlock
                    code={activeSection.content.codeExample}
                    language="javascript"
                    filename="src/services/aiService.js"
                  />
                </div>
              </div>
            )}

            {/* 2. Folder Structure Section */}
            {activeSection.id === 'folder-structure' && (
              <div className="space-y-6">
                <div id="structure-overview">
                  <h2 className="text-lg font-bold text-white mb-2">Workspace Layout</h2>
                  <p>{activeSection.content.overview}</p>
                </div>

                <CodeBlock
                  code={activeSection.content.codeStructure}
                  language="text"
                  filename="Project Root Directory"
                />

                <div id="file-roles" className="space-y-3">
                  <h2 className="text-lg font-bold text-white">File Responsibilities</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="font-mono text-indigo-400 font-bold">src/App.jsx</span>
                      <p className="text-zinc-400 mt-1">Main SPA interactive component containing state hooks, modal flows, and Lucide icon imports.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="font-mono text-indigo-400 font-bold">src/index.css</span>
                      <p className="text-zinc-400 mt-1">Global Tailwind directives, keyframe animations, glassmorphism filters, and custom scrollbars.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="font-mono text-indigo-400 font-bold">index.html</span>
                      <p className="text-zinc-400 mt-1">HTML5 shell loading fonts (Inter, Plus Jakarta Sans) and the root React mounting point.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="font-mono text-indigo-400 font-bold">package.json</span>
                      <p className="text-zinc-400 mt-1">Declares dependencies for React 18, React DOM, Lucide React, and Vite development scripts.</p>
                    </div>
                  </div>
                </div>

                <Callout type="tip" title="100% Vite & CRA Compatible">
                  You can copy the generated code directly into any existing Vite or Next.js project with zero modification.
                </Callout>
              </div>
            )}

            {/* 3. Prompt Enhancer Section */}
            {activeSection.id === 'prompt-enhancer' && (
              <div className="space-y-6">
                <div id="how-it-works">
                  <h2 className="text-lg font-bold text-white mb-2">How the Enhancer Works</h2>
                  <p>{activeSection.content.overview}</p>
                </div>

                <Callout type="tip" title="The 5-Point Quality Formula">
                  <span className="font-mono text-xs">{activeSection.content.formula}</span>
                </Callout>

                <div id="interactive-comparator">
                  <h2 className="text-lg font-bold text-white mb-1">Interactive Before & After</h2>
                  <p className="text-xs text-zinc-400 mb-2">
                    Toggle between the raw prompt and the enhanced output generated by AetherCraft's middleware:
                  </p>
                  <PromptComparator
                    rawPrompt={activeSection.content.rawExample}
                    enhancedPrompt={activeSection.content.enhancedExample}
                  />
                </div>

                <div id="enhancement-rules" className="space-y-3">
                  <h2 className="text-lg font-bold text-white">Automatic Augmentation Rules</h2>
                  <ul className="space-y-2 text-xs sm:text-sm text-zinc-400 list-disc list-inside">
                    <li><strong className="text-white">Color Token Injection:</strong> Replaces generic colors with modern obsidian (#090a0f), slate-900, indigo, and emerald accents.</li>
                    <li><strong className="text-white">Component Decomposition:</strong> Breaks the page down into header, feature grid, modal, and stateful widgets.</li>
                    <li><strong className="text-white">Interactivity Enforcement:</strong> Explicitly demands useState, localStorage persistence, and realistic mock metrics.</li>
                    <li><strong className="text-white">Micro-Interactions:</strong> Requires hover transitions, focus rings, and responsive drawer navbars.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. Vibe Coding Section */}
            {activeSection.id === 'vibe-coding' && (
              <div className="space-y-6">
                <div id="vibe-principles">
                  <h2 className="text-lg font-bold text-white mb-2">Core Principles</h2>
                  <p>{activeSection.content.overview}</p>
                </div>

                <div id="iteration-phrases" className="space-y-3">
                  <h2 className="text-lg font-bold text-white">High-Impact Iteration Commands</h2>
                  <div className="space-y-2">
                    {activeSection.content.tips.map((tip, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <span className="font-semibold text-indigo-300 text-xs sm:text-sm">{tip.title}</span>
                        <p className="text-xs text-zinc-400">{tip.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Callout type="tip" title="Compound Component Naming">
                  To avoid shadowing global DOM APIs, name your components with descriptive compound names: <code className="text-indigo-200">SearchBar</code> instead of <code className="text-red-300">Search</code>, and <code className="text-indigo-200">FilterPanel</code> instead of <code className="text-red-300">Filter</code>.
                </Callout>
              </div>
            )}

            {/* 5. BTS Auto-Repair Section */}
            {activeSection.id === 'bts-auto-repair' && (
              <div className="space-y-6">
                <div id="self-healing-concept">
                  <h2 className="text-lg font-bold text-white mb-2">Zero-Friction Concept</h2>
                  <p>{activeSection.content.overview}</p>
                </div>

                <Callout type="important" title="Continuous Preview Preservation">
                  The user preview never crashes or goes white. The sandbox locks to the <code className="text-indigo-200">lastGoodDoc</code> while the AI recompiles the repaired component.
                </Callout>

                <div id="error-reporter">
                  <h2 className="text-lg font-bold text-white mb-2">Friendly Message Transformation</h2>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    Users never see raw stack traces or internal compiler warnings:
                  </p>
                  <CodeBlock
                    code={activeSection.content.codeSnippet}
                    language="javascript"
                    filename="src/sandbox/errorReporter.js"
                  />
                </div>
              </div>
            )}

            {/* 6. React 18 & Lucide Shims Section */}
            {activeSection.id === 'react-lucide' && (
              <div className="space-y-6">
                <div id="supported-hooks">
                  <h2 className="text-lg font-bold text-white mb-2">Supported React Hooks</h2>
                  <p>{activeSection.content.overview}</p>
                  <ul className="space-y-2 mt-4 text-xs sm:text-sm text-zinc-400 list-disc list-inside">
                    {activeSection.content.hooksList.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>

                <div id="lucide-shims">
                  <h2 className="text-lg font-bold text-white mb-2">Dynamic Lucide Icon Shims</h2>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    You can import any Lucide icon in <code className="text-indigo-300">App.jsx</code>:
                  </p>
                  <CodeBlock
                    code={activeSection.content.codeSnippet}
                    language="javascript"
                    filename="src/App.jsx"
                  />
                </div>

                <Callout type="warning" title="No Heavy Node Dependencies">
                  Keep imports restricted to standard React and <code className="text-indigo-200">lucide-react</code>. For charts and canvas animations, use HTML5 Canvas or SVG primitives for maximum runtime speed.
                </Callout>
              </div>
            )}

            {/* 7. OpenRouter Models Section */}
            {activeSection.id === 'openrouter-models' && (
              <div className="space-y-6">
                <div id="model-matrix">
                  <h2 className="text-lg font-bold text-white mb-2">Supported Model Matrix</h2>
                  <p>{activeSection.content.overview}</p>
                  <div className="space-y-2.5 mt-4">
                    {activeSection.content.models.map((m, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white text-xs sm:text-sm">{m.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              m.tier === 'Free' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}>
                              {m.tier}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">{m.desc}</p>
                        </div>
                        <span className="text-xs font-mono text-zinc-500 shrink-0">{m.latency}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div id="client-security">
                  <Callout type="security" title="Zero Server Logging">
                    Your OpenRouter API key is saved exclusively in your local browser storage (<code className="text-cyan-200">localStorage.getItem('aethercraft_api_key')</code>). We do not store, proxy, or log your keys on any cloud server.
                  </Callout>
                </div>
              </div>
            )}

            {/* 8. Deployment Section */}
            {activeSection.id === 'deployment' && (
              <div className="space-y-6">
                <div id="netlify-drop">
                  <h2 className="text-lg font-bold text-white mb-2">Netlify Drop (30 Seconds)</h2>
                  <p>{activeSection.content.overview}</p>
                  <div className="space-y-3 mt-4">
                    {activeSection.content.steps.map((step, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                        <div className="font-bold text-indigo-300 text-xs sm:text-sm">{step.title}</div>
                        <div className="text-xs text-zinc-400">{step.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div id="local-dev">
                  <h2 className="text-lg font-bold text-white mb-2">Running Locally via Vite</h2>
                  <p className="text-xs sm:text-sm text-zinc-400">
                    To continue development on your local machine:
                  </p>
                  <CodeBlock
                    code={activeSection.content.codeLocal}
                    language="bash"
                    filename="Terminal"
                  />
                </div>
              </div>
            )}

            {/* 9. Troubleshooting Section */}
            {activeSection.id === 'troubleshooting' && (
              <div className="space-y-6">
                <div id="common-questions">
                  <h2 className="text-lg font-bold text-white mb-4">Frequently Asked Questions</h2>
                  <div className="space-y-4">
                    {activeSection.content.faqs.map((faq, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 font-semibold text-white text-xs sm:text-sm">
                          <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>{faq.q}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pl-6">
                          {faq.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── WAS THIS ARTICLE HELPFUL? ────────────────────────────────────── */}
          <div className="border-t border-white/10 pt-6 mt-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <span className="text-xs font-bold text-white block">Was this article helpful?</span>
                <span className="text-[11px] text-zinc-500">Your feedback helps improve our documentation and AI prompt engine.</span>
              </div>
              <div className="flex items-center gap-2">
                {articleFeedback[activeSection.id] ? (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Thanks for your feedback!</span>
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleFeedback('yes')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 text-zinc-300 text-xs font-semibold transition border border-white/5"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>Yes</span>
                    </button>
                    <button
                      onClick={() => handleFeedback('no')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 text-zinc-300 text-xs font-semibold transition border border-white/5"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>No</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ─── BOTTOM PAGINATION (PREV / NEXT ARTICLE) ──────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {prevSection ? (
              <button
                onClick={() => setActiveSectionId(prevSection.id)}
                className="text-left p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition flex items-center gap-3 group"
              >
                <ChevronLeft className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Previous Article</span>
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate block">{prevSection.title}</span>
                </div>
              </button>
            ) : <div />}

            {nextSection ? (
              <button
                onClick={() => setActiveSectionId(nextSection.id)}
                className="text-right p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition flex items-center justify-end gap-3 group sm:col-start-2"
              >
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Next Article</span>
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white truncate block">{nextSection.title}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition shrink-0" />
              </button>
            ) : <div />}
          </div>
        </main>

        {/* ─── RIGHT COLUMN: ON THIS PAGE & ASK AI CARD ───────────────────────── */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Table of Contents */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 block mb-3">
                On This Page
              </span>
              <ul className="space-y-2 text-xs">
                {activeSection.headings.map(h => (
                  <li key={h.id}>
                    <button
                      onClick={() => scrollToHeading(h.id)}
                      className="text-left text-zinc-400 hover:text-indigo-300 transition block leading-relaxed"
                    >
                      {h.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ask Docs AI Quick Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-black/60 border border-indigo-500/20 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">Need Quick Answers?</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Docs AI can answer technical questions directly based on AetherCraft's architecture.
              </p>
              <button
                onClick={() => {
                  setIsAiModalOpen(true);
                  handleAskDocsAi(activeSection.title);
                }}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <span>Ask AI about {activeSection.title}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── ASK DOCS AI MODAL / DRAWER (INTERACTIVE Q&A) ───────────────────── */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-[#0e121a] border border-indigo-500/30 shadow-2xl shadow-indigo-950/50 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header & Input */}
            <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Ask Docs AI anything (e.g., 'How do I deploy to Netlify?')..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskDocsAi();
                }}
                className="flex-1 bg-transparent border-0 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-0"
              />
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="px-4 py-2.5 bg-black/30 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-[11px] text-zinc-400">
              <span className="shrink-0 text-zinc-500 font-semibold">Suggested:</span>
              <button
                onClick={() => {
                  setAiQuestion("How does the Prompt Enhancer work?");
                  handleAskDocsAi("How does the Prompt Enhancer work?");
                }}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 hover:text-indigo-300 transition"
              >
                ⚡ Prompt Enhancer
              </button>
              <button
                onClick={() => {
                  setAiQuestion("How do I deploy to Netlify in 30 seconds?");
                  handleAskDocsAi("How do I deploy to Netlify in 30 seconds?");
                }}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 hover:text-indigo-300 transition"
              >
                🚀 Netlify Drop
              </button>
              <button
                onClick={() => {
                  setAiQuestion("What React hooks and Lucide icons are supported?");
                  handleAskDocsAi("What React hooks and Lucide icons are supported?");
                }}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 hover:text-indigo-300 transition"
              >
                ⚛️ React 18 & Lucide
              </button>
              <button
                onClick={() => {
                  setAiQuestion("How does BTS Error Auto-Fix work?");
                  handleAskDocsAi("How does BTS Error Auto-Fix work?");
                }}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 hover:text-indigo-300 transition"
              >
                🛡️ BTS Auto-Repair
              </button>
            </div>

            {/* Modal Body: Answer or Results */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {isAiThinking ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span className="text-xs font-medium">Docs AI is searching the knowledge base…</span>
                </div>
              ) : aiAnswer ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Docs AI Verified Answer
                    </span>
                    <button
                      onClick={() => {
                        setActiveSectionId(aiAnswer.sectionId);
                        setIsAiModalOpen(false);
                      }}
                      className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition"
                    >
                      <span>Jump to full section</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white">{aiAnswer.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">{aiAnswer.summary}</p>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    {aiAnswer.details}
                  </p>

                  {aiAnswer.codeSnippet && (
                    <CodeBlock code={aiAnswer.codeSnippet} language="javascript" />
                  )}
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto opacity-60" />
                  <h4 className="text-sm font-semibold text-white">Ask anything about AetherCraft</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Type a question or select a suggested topic above to receive instant technical answers.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">ESC</kbd> to exit</span>
              <button
                onClick={() => handleAskDocsAi()}
                disabled={!aiQuestion.trim()}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold transition flex items-center gap-1.5"
              >
                <span>Ask Docs AI</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
