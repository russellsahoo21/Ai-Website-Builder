"use client";
import React from 'react';

const RELEASES = [
  {
    version: "v2.5.0",
    date: "September 2026",
    title: "Zero-Latency Client Sandboxes & Viewports",
    summary: "Complete overhaul of the in-browser sandbox runtime with instant HTML/Tailwind/JS execution and responsive device framing.",
    items: [
      "Added Desktop (100%), Tablet (768px), and Mobile (375px) responsive frames",
      "Dynamic hot-reloading code inspector with line numbers and copy functionality",
      "Instant ZIP export containing production-ready standalone bundles"
    ]
  },
  {
    version: "v2.4.0",
    date: "August 2026",
    title: "Multi-Turn Project State & Refinement",
    summary: "Support for conversational iterative edits without losing prior project context.",
    items: [
      "Natural language UI refinement ('make the header sticky', 'change color scheme to slate')",
      "Persistent state in browser memory",
      "Automated prompt-to-file parsing pipeline"
    ]
  },
  {
    version: "v2.3.0",
    date: "July 2026",
    title: "Starter Templates Library & Showcase",
    summary: "Shipped 6+ production-grade starting points covering SaaS, Real Estate, E-Commerce, and Financial Dashboards.",
    items: [
      "1-click template cloning into the live studio",
      "Integrated mortgage and team savings calculators"
    ]
  }
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#090a0d] text-zinc-100 py-16 px-6 max-w-4xl mx-auto select-none">
      <div className="mb-12 text-left">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Updates</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          Product Changelog
        </h1>
        <p className="text-xs text-zinc-400">
          Continuous updates, performance optimizations, and new capabilities shipped to AetherCraft.
        </p>
      </div>

      <div className="space-y-10 border-l border-zinc-800 pl-6 ml-2">
        {RELEASES.map((rel, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-600 border-2 border-[#090a0d]"></div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                {rel.version}
              </span>
              <span className="text-xs text-zinc-500">{rel.date}</span>
            </div>
            <h3 className="text-base font-semibold text-zinc-200 mb-2 mt-2">{rel.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">{rel.summary}</p>
            <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside">
              {rel.items.map((it, iidx) => (
                <li key={iidx}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

