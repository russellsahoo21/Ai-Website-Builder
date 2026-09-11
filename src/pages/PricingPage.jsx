import React, { useState } from 'react';
import { CheckCircle2, Tag, HelpCircle, ArrowRight } from 'lucide-react';

export default function PricingPage({ navigateTo }) {
  const [billingCycle, setBillingCycle] = useState('annual');

  const plans = [
    {
      id: "free",
      name: "Developer Free",
      price: "$0",
      period: "forever",
      desc: "For prototyping personal ideas.",
      features: [
        "5 free generations",
        "In-memory live sandbox",
        "1-Click ZIP export",
        "Unlimited Free OpenRouter Models",
        "Community Discord support"
      ],
      cta: "Get Started Free",
      featured: false
    },
    {
      id: "pro",
      name: "Pro Founder",
      price: billingCycle === 'annual' ? "$16" : "$20",
      period: "per month",
      desc: "For indie makers shipping commercial products.",
      features: [
        "Unlimited generations",
        "Priority synthesis speed",
        "Custom domain publishing",
        "Multi-turn architectural memory",
        "Unlimited persistent project saves",
        "Priority engineering support"
      ],
      cta: "Start Pro Plan",
      featured: true
    },
    {
      id: "team",
      name: "Team Workspace",
      price: billingCycle === 'annual' ? "$40" : "$49",
      period: "per month",
      desc: "For agencies and digital teams.",
      features: [
        "5 team member seats",
        "Shared workspace sync",
        "White-label export options",
        "Shared custom API keys pool",
        "Dedicated account manager & SLA"
      ],
      cta: "Contact Team Sales",
      featured: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 py-16 px-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-4">
          <Tag className="w-3.5 h-3.5" />
          <span>Flexible Plans for Every Creator</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-slate-400 text-sm">
          Start for free with open models. Scale as your creations turn into profitable businesses.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center p-1 rounded-xl bg-white/5 border border-white/10 mt-8">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition ${
              billingCycle === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              billingCycle === 'annual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
        {plans.map((p, i) => (
          <div
            key={i}
            className={`rounded-3xl p-8 flex flex-col justify-between transition duration-300 ${
              p.featured
                ? 'bg-gradient-to-b from-indigo-950/50 via-[#0e121a] to-[#0e121a] border-2 border-indigo-500 shadow-2xl shadow-indigo-950/60 relative'
                : 'bg-[#0e121a] border border-white/5 shadow-xl'
            }`}
          >
            {p.featured && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-widest">
                Recommended
              </div>
            )}

            <div>
              <div className="text-sm font-bold text-slate-300 mb-1">{p.name}</div>
              <div className="text-4xl font-black text-white mb-1">
                {p.price} <span className="text-xs font-normal text-slate-400">/{p.period}</span>
              </div>
              <p className="text-xs text-slate-400 mb-8 leading-relaxed font-light">{p.desc}</p>

              <div className="border-t border-white/5 pt-6 mb-8">
                <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Included Features:</div>
                <ul className="space-y-3 text-xs text-slate-300">
                  {p.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-center gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${p.featured ? 'text-indigo-400' : 'text-emerald-400'}`} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => {
                if (p.id === 'free') {
                  navigateTo('studio');
                } else if (p.id === 'pro') {
                  navigateTo('checkout', { plan: 'pro', cycle: billingCycle });
                } else {
                  window.location.href = 'mailto:sales@aethercraft.io?subject=Inquiry%20about%20Team%20Workspace%20Plan';
                }
              }}
              className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer ${
                p.featured
                  ? 'bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/10 font-semibold'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'
              }`}
            >
              {p.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="max-w-4xl mx-auto rounded-3xl bg-[#0e121a] border border-white/5 p-8 mb-16">
        <h3 className="text-xl font-bold text-white mb-6 text-center">Feature Matrix Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="pb-4 font-semibold">Capability</th>
                <th className="pb-4 font-semibold text-center">Starter</th>
                <th className="pb-4 font-semibold text-center text-indigo-400">Pro</th>
                <th className="pb-4 font-semibold text-center">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              <tr>
                <td className="py-3 font-medium">Free OpenRouter Models</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Unlimited</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Unlimited</td>
                <td className="py-3 text-center text-emerald-400 font-bold">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">NVIDIA Nemotron 3 Ultra (1M Context)</td>
                <td className="py-3 text-center text-emerald-400">Included</td>
                <td className="py-3 text-center text-emerald-400">Included</td>
                <td className="py-3 text-center text-emerald-400">Included</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Frontier Models (Claude 3.5 / GPT-4o)</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-indigo-400 font-bold">Yes</td>
                <td className="py-3 text-center text-indigo-400 font-bold">Yes</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Live Sandboxed Preview</td>
                <td className="py-3 text-center text-emerald-400">Yes</td>
                <td className="py-3 text-center text-emerald-400">Yes</td>
                <td className="py-3 text-center text-emerald-400">Yes</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">1-Click ZIP Code Export</td>
                <td className="py-3 text-center text-emerald-400">Yes</td>
                <td className="py-3 text-center text-emerald-400">Yes</td>
                <td className="py-3 text-center text-emerald-400">Yes</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">Custom Domain Publishing</td>
                <td className="py-3 text-center text-slate-600">—</td>
                <td className="py-3 text-center text-indigo-400">3 Domains</td>
                <td className="py-3 text-center text-indigo-400">Unlimited</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
