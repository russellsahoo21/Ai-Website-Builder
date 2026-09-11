import React, { useState } from 'react';
import { Layers, Search, Star, ArrowRight, Sparkles, Filter, ExternalLink } from 'lucide-react';
import { STARTER_TEMPLATES } from '../templates/starterTemplates';

const CATEGORIES = ["All", "Gaming & Media", "React Web Apps", "SaaS & AI", "Real Estate", "E-Commerce", "Dashboards"];

export default function TemplatesPage({ onLoadTemplate, navigateTo }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = STARTER_TEMPLATES.filter((tmpl) => {
    const matchesCat = selectedCategory === "All" || tmpl.category === selectedCategory;
    const matchesSearch = tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tmpl.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 py-16 px-6 max-w-7xl mx-auto select-none">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-xs font-semibold mb-4">
          <Layers className="w-3.5 h-3.5" />
          <span>Curated Starters & Fullstack Prototypes</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">
          Template Explorer
        </h1>
        <p className="text-zinc-400 text-sm">
          Jumpstart your next project with production-grade templates. Every template can be customized, edited with AI, and exported with 1 click.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-zinc-800">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates, tags..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredTemplates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="rounded-3xl bg-[#0e121a] border border-white/5 overflow-hidden hover:border-indigo-500/40 transition duration-300 flex flex-col justify-between group shadow-xl"
          >
            <div className="p-7">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold uppercase tracking-wider">
                  {tmpl.category}
                </span>
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <Star className="w-3.5 h-3.5 fill-zinc-400" />
                  <span className="font-semibold text-zinc-300">{tmpl.stars}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-zinc-200 transition">
                {tmpl.name}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                {tmpl.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {tmpl.tags?.map((t, idx) => (
                  <span key={idx} className="text-[10px] px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-5 bg-zinc-900/40 border-t border-zinc-800 flex items-center justify-between">
              <div className="text-xs text-zinc-400">
                {tmpl.sourceUrl ? (
                  <a
                    href={tmpl.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white hover:underline flex items-center gap-1 transition"
                    title={`View original repo by ${tmpl.author}`}
                  >
                    <span>By {tmpl.author}</span>
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                ) : (
                  <span>By {tmpl.author}</span>
                )}
              </div>
              <button
                onClick={() => onLoadTemplate(tmpl)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-semibold text-black transition shadow-sm"
              >
                <span>Open in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
