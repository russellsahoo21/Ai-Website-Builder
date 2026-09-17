"use client";
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  RefreshCw, 
  Trash2,
  ChevronRight,
  Sparkles,
  Square,
  ChevronDown,
  Check,
  Zap,
  ArrowUp
} from 'lucide-react';
import { STARTER_TEMPLATES } from '../templates/starterTemplates';
import { getCuratedExampleSpec, enhanceUserPrompt } from '../utils/promptEnhancer';

const PROMPT_SUGGESTIONS = [
  "Build a luxury modern real estate website with mortgage calculator",
  "Design a sleek dark-mode SaaS landing page with pricing grid",
  "Create an artisanal coffee shop menu with reservation form",
  "Make a minimal photographer portfolio with a masonry photo grid"
];

export function getProviderIconUrl(modelId = '') {
  const id = (modelId || '').toLowerCase();
  if (id.includes('gemini') || id.includes('google')) {
    return 'https://api.iconify.design/logos:google-gemini-icon.svg';
  }
  if (id.includes('groq')) {
    return 'https://unavatar.io/groq.com';
  }
  if (id.includes('mistral') || id.includes('codestral')) {
    return 'https://api.iconify.design/logos:mistral-ai-icon.svg';
  }
  if (id.includes('deepseek')) {
    return 'https://api.iconify.design/simple-icons:deepseek.svg?color=%234D6BFE';
  }
  if (id.includes('codex') || id.includes('openai') || id.includes('gpt')) {
    return 'https://api.iconify.design/simple-icons:openai.svg?color=white';
  }
  if (id.includes('xkiro')) {
    return '/xkiro.png';
  }
  if (id.includes('claude') || id.includes('anthropic')) {
    return 'https://api.iconify.design/simple-icons:anthropic.svg?color=%23d97706';
  }
  if (id.includes('llama') || id.includes('meta')) {
    return 'https://api.iconify.design/simple-icons:meta.svg?color=%230668E1';
  }
  if (id.includes('nemotron') || id.includes('nvidia')) {
    return 'https://api.iconify.design/simple-icons:nvidia.svg?color=%2376B900';
  }
  if (id.includes('cohere')) {
    return 'https://icons.duckduckgo.com/ip3/cohere.com.ico';
  }
  return 'https://api.iconify.design/tabler:sparkles.svg?color=%2338bdf8';
}

export default function ChatPanel({
  messages,
  onSendMessage,
  onLoadTemplate,
  onClearWorkspace,
  isGenerating,
  onCancelGeneration,
  selectedModel = 'gemini-3.6-flash',
  onSelectModel,
  availableModels = [],
  telemetry = {}
}) {
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let timer;
    if (isGenerating) {
      setElapsed(0);
      timer = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    }
    if (isModelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isModelDropdownOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    const userText = input.trim();
    const enriched = getCuratedExampleSpec(userText) || enhanceUserPrompt(userText);
    onSendMessage(userText, enriched);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full md:w-[360px] lg:w-[400px] h-full flex flex-col bg-[#0b0c10] border-r border-zinc-800 shrink-0 select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-300 tracking-tight">Prompt Architect</span>
        </div>
        <button
          onClick={onClearWorkspace}
          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 transition"
          title="Clear Project"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-6 pt-2">
            <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 leading-relaxed font-light">
              Enter a description of what to build or refine. The compiler generates semantic HTML5, modern Tailwind CSS, and interactive JavaScript.
            </div>

            {/* Quick Starter Templates */}
            <div>
              <div className="text-[10px] font-mono font-medium text-zinc-500 uppercase mb-2">
                Starter Templates
              </div>
              <div className="space-y-1.5">
                {STARTER_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => onLoadTemplate(tmpl)}
                    className="w-full text-left p-2 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-medium text-zinc-300 group-hover:text-white">{tmpl.name}</div>
                      <div className="text-[10px] text-zinc-500 line-clamp-1">{tmpl.tagline}</div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition" />
                  </button>
                ))}
              </div>
            </div>

            {/* Ideas */}
            <div>
              <div className="text-[10px] font-mono font-medium text-zinc-500 uppercase mb-2">
                Suggested Prompts
              </div>
              <div className="space-y-1">
                {PROMPT_SUGGESTIONS.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(sug)}
                    className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-zinc-900 text-xs text-zinc-400 hover:text-zinc-200 transition truncate"
                  >
                    • {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          msg.role === 'system' ? (
            <div key={idx} className="w-full flex justify-center my-1.5 animate-fadeIn">
              <div className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-[11px] text-zinc-300 flex items-center gap-1.5 shadow-sm font-mono">
                <Sparkles className="w-3 h-3 text-zinc-200" />
                <span>{msg.content}</span>
              </div>
            </div>
          ) : (
            <div
              key={idx}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-xl p-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-100 text-black font-medium shadow-sm'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                }`}
              >
                {msg.role === 'ai' && (
                  <div className="text-[10px] font-mono text-zinc-500 mb-1">AETHERCRAFT // COMPILER</div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          )
        ))}

        {isGenerating && (
          <div className="rounded-xl bg-zinc-900/90 border border-zinc-700/80 p-3 shadow-lg backdrop-blur-sm space-y-2.5 animate-fadeIn">
            {/* Top row: Phase badge and elapsed time */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-cyan-300">
                  {telemetry?.phase || 'Synthesizing'}
                </span>
                {telemetry?.activeFile && (
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                    {telemetry.activeFile}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-700/50">
                  {elapsed}s
                </span>
                {onCancelGeneration && (
                  <button
                    type="button"
                    onClick={onCancelGeneration}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-300 text-[10px] font-mono transition border border-zinc-700 hover:border-rose-700/50"
                    title="Stop code generation"
                  >
                    <Square className="w-2.5 h-2.5 fill-current text-rose-400" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>

            {/* Middle row: Phase message description */}
            <div className="text-xs text-zinc-300 font-medium leading-snug">
              {telemetry?.phaseMessage || 'Generating application components...'}
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  style={{ width: `${Math.max(5, telemetry?.progressPercent || 15)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>
                  {telemetry?.tokens ? `${telemetry.tokens.toLocaleString()} tokens` : '0 tokens'}
                  {telemetry?.tokenSpeed ? ` • ${telemetry.tokenSpeed} tok/s` : ''}
                </span>
                <span>{telemetry?.progressPercent || 15}%</span>
              </div>
            </div>

            {/* Live streamed line preview */}
            {telemetry?.latestLine && (
              <div className="text-[10px] font-mono text-zinc-400 truncate bg-black/40 px-2 py-1 rounded border border-zinc-800/80">
                <span className="text-cyan-400 mr-1.5">&gt;</span>
                {telemetry.latestLine}
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Antigravity-Style Prompt Console */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#090a0e]/95 backdrop-blur-md">
        <form 
          onSubmit={handleSubmit}
          className="relative rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl transition-all focus-within:border-cyan-500/40 focus-within:ring-1 focus-within:ring-cyan-500/20"
        >
          {/* Textarea */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Type instructions or describe your changes..."
            rows={3}
            className="w-full px-3.5 pt-3 pb-1 bg-transparent text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none transition resize-none font-sans leading-relaxed"
          />

          {/* Bottom Toolbar inside the box */}
          <div className="px-2.5 pb-2 pt-1 flex items-center justify-between gap-2 border-t border-zinc-800/40 mt-1">
            {/* Left: Model Selector Dropdown with Provider Icon */}
            <div className="relative flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-[11px] font-medium text-zinc-200 hover:text-white transition shadow-sm group cursor-pointer"
                title="Select AI Model"
              >
                <img 
                  src={getProviderIconUrl(selectedModel)} 
                  alt="" 
                  className="w-3.5 h-3.5 object-contain shrink-0" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="max-w-[140px] truncate font-mono text-[11px]">
                  {availableModels.find(m => m.id === selectedModel)?.name?.replace(/\s*\(.*?\)/, '') || 'Gemini 3.6 Flash'}
                </span>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isModelDropdownOpen ? 'rotate-180 text-cyan-400' : ''}`} />
              </button>

              {/* Floating Dropdown Menu with Provider Icons */}
              {isModelDropdownOpen && (
                <div 
                  ref={dropdownRef}
                  className="absolute left-0 bottom-full mb-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-[#0e1017] border border-zinc-700 shadow-2xl p-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 space-y-1"
                >
                  <div className="px-2 py-1 text-[10px] font-mono text-zinc-400 uppercase tracking-wider border-b border-zinc-800/80 mb-1 flex items-center justify-between">
                    <span>Inference Models</span>
                    <span className="text-cyan-400">100k Free Quota</span>
                  </div>
                  {availableModels.map((m) => {
                    const isSelected = m.id === selectedModel;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onSelectModel?.(m.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition flex items-start justify-between gap-2.5 group cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/10 border border-cyan-500/30 text-white'
                            : 'hover:bg-zinc-800/70 text-zinc-300 hover:text-white border border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <img 
                            src={getProviderIconUrl(m.id)} 
                            alt="" 
                            className="w-4 h-4 object-contain shrink-0 mt-0.5 rounded-sm"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 font-medium truncate">
                              <span>{m.name}</span>
                            </div>
                            {m.badge && (
                              <div className="text-[10px] text-zinc-500 group-hover:text-zinc-400 truncate mt-0.5">
                                {m.badge}
                              </div>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Action Button (Send / Stop) */}
            <div className="flex items-center gap-2">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={onCancelGeneration}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition cursor-pointer"
                  title="Stop generation"
                >
                  <Square className="w-3 h-3 fill-current text-rose-400" />
                  <span className="text-[11px] font-mono">Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-7 h-7 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-20 disabled:hover:bg-cyan-500 text-black flex items-center justify-center transition-all shadow-md cursor-pointer disabled:cursor-not-allowed group"
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

