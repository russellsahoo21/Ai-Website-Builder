import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

const INTEGRATIONS = [
  {
    name: "GitHub",
    category: "Version Control",
    desc: "Two-way continuous synchronization. Commit changes, trigger actions, and branch seamlessly.",
    status: "Live",
    badge: "Official"
  },
  {
    name: "Supabase",
    category: "Database & Auth",
    desc: "Provision relational PostgreSQL databases, secure user authentication, and edge functions automatically.",
    status: "Live",
    badge: "Official"
  },
  {
    name: "Vercel",
    category: "Deployment",
    desc: "Instant worldwide edge deployment with automated preview branches and custom domain SSL.",
    status: "Live",
    badge: "1-Click"
  },
  {
    name: "Netlify",
    category: "Hosting",
    desc: "Drag-and-drop instant deployments or continuous deployment pipeline integration.",
    status: "Live",
    badge: "1-Click"
  },
  {
    name: "Stripe",
    category: "Payments",
    desc: "Generate subscription checkouts, billing portals, and recurring payment webhook handlers.",
    status: "Beta",
    badge: "New"
  },
  {
    name: "Resend",
    category: "Email",
    desc: "Modern transactional email delivery with React-based email templates and domain verification.",
    status: "Live",
    badge: "Verified"
  }
];

export default function IntegrationsPage({ navigateTo }) {
  return (
    <div className="min-h-screen bg-[#090a0d] text-zinc-100 py-16 px-6 max-w-6xl mx-auto select-none">
      <div className="max-w-2xl mb-12 text-left">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Ecosystem</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          Platform Integrations
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Connect your favorite developer tools, databases, and deployment platforms directly to your studio workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {INTEGRATIONS.map((item, idx) => (
          <div
            key={idx}
            className="rounded-xl bg-[#111318] border border-zinc-800/80 p-6 flex flex-col justify-between hover:border-zinc-700 transition"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {item.category}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  {item.status}
                </span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{item.name}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">{item.desc}</p>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">{item.badge}</span>
              <button
                onClick={() => navigateTo('studio')}
                className="text-xs font-medium text-white hover:text-zinc-300 flex items-center gap-1"
              >
                <span>Connect</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
