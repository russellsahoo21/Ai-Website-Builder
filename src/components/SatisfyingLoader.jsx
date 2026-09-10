import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Activity, CheckCircle2, ShieldCheck, Box } from 'lucide-react';

const COMPILATION_PHASES = [
  { id: 1, name: "Deconstructing prompt & layout hierarchy", time: 0 },
  { id: 2, name: "Synthesizing semantic HTML5 & responsive grid", time: 3 },
  { id: 3, name: "Configuring Tailwind design system & tokens", time: 6 },
  { id: 4, name: "Injecting interactive JavaScript controllers & state", time: 10 },
  { id: 5, name: "Mounting isolated client-side sandbox runtime", time: 14 }
];

const CODE_STREAM_SNIPPETS = [
  "const engine = AetherCraft.sandbox.createEnvironment();",
  "<div class=\"w-full max-w-7xl mx-auto px-6 py-12\">",
  "tailwind.config = { theme: { extend: { colors: { ... } } } };",
  "document.querySelectorAll('[data-interactive]').forEach(initController);",
  "renderChart({ type: 'portfolio', resolution: 'high-precision' });",
  "window.addEventListener('DOMContentLoaded', () => sandbox.mount());",
  "bundle.optimize({ minified: false, hotReload: true });",
  "<<<FILE:index.html>>> compiling DOM tree [OK]",
  "<<<FILE:styles.css>>> compiling custom keyframes [OK]",
  "<<<FILE:script.js>>> assembling interactive event listeners [OK]"
];

export default function SatisfyingLoader({ promptText, onCancel }) {
  const [elapsed, setElapsed] = useState(0);
  const [activeSnippetIdx, setActiveSnippetIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    const snippetTimer = setInterval(() => {
      setActiveSnippetIdx(prev => (prev + 1) % CODE_STREAM_SNIPPETS.length);
    }, 1400);

    return () => {
      clearInterval(timer);
      clearInterval(snippetTimer);
    };
  }, []);

  // Calculate current active phase
  const currentPhaseIndex = COMPILATION_PHASES.slice().reverse().find(p => elapsed >= p.time)?.id || 1;

  // Estimated progress percentage based on 18s typical cycle
  const progressPercent = Math.min(95, Math.floor(15 + (elapsed * 4.5)));

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#07090e] overflow-hidden select-none font-sans">
      {/* Background Architectural Blueprint Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, #27272a 1px, transparent 1px),
            linear-gradient(to bottom, #27272a 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Subtle Radial Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,#07090e_85%)]" />

      {/* Sweeping Radar / Scanline Laser */}
      <div className="absolute inset-x-0 h-40 pointer-events-none animate-scanline bg-gradient-to-b from-transparent via-zinc-500/10 to-transparent" />

      <div className="relative z-10 w-full max-w-xl px-6 flex flex-col items-center">
        
        {/* Satisfying Concentric Geometric Animation */}
        <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
          {/* Outer Rotating Dashed Ring */}
          <div className="absolute inset-0 rounded-2xl border border-dashed border-zinc-700 animate-[spin_16s_linear_infinite]" />
          
          {/* Second Counter-Rotating Square */}
          <div className="absolute inset-2 rounded-xl border border-zinc-600/60 rotate-45 animate-[spin_10s_linear_infinite_reverse]" />
          
          {/* Third Pulsing Ring */}
          <div className="absolute inset-5 rounded-lg border border-zinc-400/40 animate-ping opacity-25" />

          {/* Central Solid Core */}
          <div className="relative w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-700 shadow-2xl flex items-center justify-center">
            <Cpu className="w-6 h-6 text-zinc-200 animate-pulse" />
          </div>

          {/* Orbiting Satellite Node */}
          <div className="absolute inset-0 animate-[spin_4s_linear_infinite]">
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_#ffffff] -top-1 left-1/2 -translate-x-1/2" />
          </div>
        </div>

        {/* Status Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-3 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AetherCraft Compiler // Sandbox Engine</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-200 font-semibold">{elapsed}s elapsed</span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight mb-1.5">
            Architecting Your Experience
          </h2>
          
          {promptText ? (
            <p className="text-xs text-zinc-400 font-mono max-w-md mx-auto truncate px-3 py-1 rounded bg-zinc-900/60 border border-zinc-800/80">
              "{promptText}"
            </p>
          ) : (
            <p className="text-xs text-zinc-500 font-mono">
              Synthesizing full-stack application code into live sandbox...
            </p>
          )}
        </div>

        {/* Progress Bar with Shimmer */}
        <div className="w-full mb-6">
          <div className="flex justify-between items-center text-[11px] font-mono text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-zinc-300" />
              <span>Compilation Telemetry</span>
            </span>
            <span className="text-zinc-200 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden relative">
            <div 
              className="h-full bg-white transition-all duration-500 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Interactive Compilation Phases */}
        <div className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800/80 p-3.5 mb-4 shadow-xl backdrop-blur-sm">
          <div className="space-y-2">
            {COMPILATION_PHASES.map((phase) => {
              const isDone = phase.id < currentPhaseIndex;
              const isCurrent = phase.id === currentPhaseIndex;

              return (
                <div 
                  key={phase.id}
                  className={`flex items-center gap-2.5 text-xs transition-colors duration-300 ${
                    isDone 
                      ? 'text-zinc-400' 
                      : isCurrent 
                        ? 'text-zinc-100 font-medium' 
                        : 'text-zinc-600'
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-300" />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500">[{String(phase.id).padStart(2, '0')}]</span>
                  <span className="truncate flex-1">{phase.name}</span>
                  {isCurrent && (
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded animate-pulse">
                      ACTIVE
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Code Stream Terminal Ticker */}
        <div className="w-full rounded-xl bg-black/80 border border-zinc-800/80 p-3 shadow-inner">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2 border-b border-zinc-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-zinc-400" />
              <span>LIVE_STREAM_BUFFER</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-zinc-400">READY</span>
            </div>
          </div>
          <div className="font-mono text-[11px] text-zinc-300 truncate h-5 flex items-center">
            <span className="text-zinc-600 mr-2">&gt;</span>
            <span className="animate-fadeIn">{CODE_STREAM_SNIPPETS[activeSnippetIdx]}</span>
          </div>
        </div>

        {/* Footer Hardware / Sandbox Specs */}
        <div className="mt-4 flex items-center justify-center gap-6 text-[10px] font-mono text-zinc-600">
          <span className="flex items-center gap-1">
            <Box className="w-3 h-3" /> DOM SANDBOX v2
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> ZERO-LATENCY HOT RELOAD
          </span>
        </div>

        {/* Cancel Synthesis Action */}
        {onCancel && (
          <div className="mt-5">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700/80 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-mono transition shadow-sm"
            >
              <span className="w-2 h-2 rounded-sm bg-rose-500" />
              <span>Cancel Synthesis</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
