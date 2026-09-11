import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Terminal, 
  RefreshCw, 
  Trash2,
  ChevronRight,
  Sparkles,
  Square,
  Zap
} from 'lucide-react';
import { STARTER_TEMPLATES } from '../templates/starterTemplates';
import { getCuratedExampleSpec, enhanceUserPrompt } from '../utils/promptEnhancer';

const PROMPT_SUGGESTIONS = [
  "Build a luxury modern real estate website with mortgage calculator",
  "Design a sleek dark-mode SaaS landing page with pricing grid",
  "Create an artisanal coffee shop menu with reservation form",
  "Make a minimal photographer portfolio with a masonry photo grid"
];

export default function ChatPanel({
  messages,
  onSendMessage,
  onLoadTemplate,
  onClearWorkspace,
  isGenerating,
  onCancelGeneration
}) {
  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [enhancerEnabled, setEnhancerEnabled] = useState(true);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    const userText = input.trim();
    if (enhancerEnabled) {
      const enriched = getCuratedExampleSpec(userText) || enhanceUserPrompt(userText);
      onSendMessage(userText, enriched);
    } else {
      onSendMessage(userText, userText);
    }
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
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs shadow-sm">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-100" />
              <span>Synthesizing code into sandbox...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                {elapsed}s
              </span>
              {onCancelGeneration && (
                <button
                  type="button"
                  onClick={onCancelGeneration}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-mono transition border border-zinc-700"
                  title="Stop code generation"
                >
                  <Square className="w-2.5 h-2.5 fill-current text-rose-400" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-[#090a0d]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#0e1017] border-b border-zinc-800/80 text-[11px]">
          <button
            type="button"
            onClick={() => setEnhancerEnabled(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition cursor-pointer border ${
              enhancerEnabled 
                ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25' 
                : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-500 hover:text-zinc-400'
            }`}
            title={enhancerEnabled ? "Smart Prompt Enhancer active (enriches user prompts with full React specs)" : "Smart Prompt Enhancer paused"}
          >
            <Zap className={`w-3 h-3 ${enhancerEnabled ? 'text-indigo-400 fill-indigo-400/30' : 'text-zinc-500'}`} />
            <span className="font-medium text-[10px]">{enhancerEnabled ? '⚡ Prompt Enhancer: Active' : 'Prompt Enhancer: Off'}</span>
          </button>
          <span className="text-[10px] text-zinc-500 font-mono">React 18 Engine</span>
        </div>

        <div className="p-3">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder="Type instructions or describe your changes..."
              rows={3}
              className="w-full px-3 py-2 pr-9 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-xs focus:border-zinc-500 focus:outline-none transition resize-none font-mono"
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="absolute right-2 bottom-3 p-1 rounded bg-white hover:bg-zinc-200 disabled:opacity-20 text-black transition cursor-pointer"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
          <div className="mt-1 text-[10px] font-mono text-zinc-500 text-right">
            Enter to send
          </div>
        </div>
      </div>
    </div>
  );
}
