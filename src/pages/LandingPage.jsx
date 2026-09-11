import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Terminal, 
  Check, 
  ChevronDown,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { useUser, SignUpButton, SignInButton } from '@clerk/react';
import { STARTER_TEMPLATES } from '../templates/starterTemplates';
import { getCuratedExampleSpec, enhanceUserPrompt } from '../utils/promptEnhancer';

const TYPEWRITER_PHRASES = [
  "a modern fintech app with interactive portfolio charts...",
  "a minimalist architecture studio portfolio with image gallery...",
  "a luxury real estate showcase with a mortgage estimator...",
  "a high-performance sneaker e-commerce store with cart drawer...",
  "an AI audio mastering tool with waveform visualizer..."
];

const FAQS = [
  {
    q: "How does AetherCraft build software from text?",
    a: "AetherCraft uses an integrated code synthesis engine tuned specifically for fullstack web development. It translates natural language prompts into semantic HTML5, modern Tailwind CSS, and reactive JavaScript, streaming the output directly into a live sandbox."
  },
  {
    q: "Can I export the code and host it anywhere?",
    a: "Yes. Every project generated is 100% standard web code. You can download the complete source code as a ZIP archive and deploy it directly to Vercel, Netlify, Cloudflare Pages, or your own servers."
  },
  {
    q: "Can I edit the code manually after generation?",
    a: "Absolutely. The integrated Code Inspector allows you to view and directly edit HTML, CSS, and JavaScript files with live preview synchronization."
  },
  {
    q: "How does project versioning work?",
    a: "AetherCraft supports multi-turn conversational edits. You can ask for iterative refinements—such as adjusting color schemes, making navigation bars sticky, or adding form validation—without losing your existing code structure."
  }
];

export default function LandingPage({ navigateTo, onLaunchWithPrompt, onLoadTemplate }) {
  const { isSignedIn, isLoaded } = useUser();

  const [heroPrompt, setHeroPrompt] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [billingCycle, setBillingCycle] = useState('annual');

  // Typewriter effect state
  const [placeholderText, setPlaceholderText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    const typingSpeed = isDeleting ? 25 : 50;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentPhrase.length) {
          setPlaceholderText(currentPhrase.substring(0, charIndex + 1));
          setCharIndex(prev => prev + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 2200);
        }
      } else {
        if (charIndex > 0) {
          setPlaceholderText(currentPhrase.substring(0, charIndex - 1));
          setCharIndex(prev => prev - 1);
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, phraseIndex]);

  const handleHeroSubmit = (e) => {
    e.preventDefault();
    const promptToUse = heroPrompt.trim() || placeholderText.replace('...', '');
    if (!promptToUse) return;
    const detailedSpec = getCuratedExampleSpec(promptToUse) || enhanceUserPrompt(promptToUse);
    onLaunchWithPrompt(promptToUse, detailedSpec);
  };

  return (
    <div className="min-h-screen bg-[#090a0d] text-zinc-100 font-sans selection:bg-zinc-800 selection:text-white">
      {/* Subtle architectural grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f242d10_1px,transparent_1px),linear-gradient(to_bottom,#1f242d10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/70 text-zinc-400 text-xs font-mono mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>AetherCraft 2.5 Software Engine</span>
        </div>

        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.08] mb-6">
          Build fullstack software <br className="hidden sm:inline" />
          <span className="text-zinc-400 font-normal">at the speed of thought</span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed font-light">
          Describe any web application, dashboard, or digital interface in natural language. AetherCraft architects, designs, and compiles production-ready code with instant preview.
        </p>

        {/* Clean, Spacious Hero Prompt Box */}
        <div className="max-w-3xl mx-auto mb-8">
          <form
            onSubmit={handleHeroSubmit}
            className="p-2 rounded-xl bg-[#111317] border border-zinc-800 shadow-2xl flex flex-col sm:flex-row items-center gap-2 transition focus-within:border-zinc-500"
          >
            <div className="flex-1 flex items-center gap-3 w-full px-3">
              <Terminal className="w-4 h-4 text-zinc-500 shrink-0 font-mono" />
              <input
                type="text"
                value={heroPrompt}
                onChange={(e) => setHeroPrompt(e.target.value)}
                placeholder={`Ask AetherCraft to build ${placeholderText}`}
                className="w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none py-2.5 font-mono"
              />
            </div>

            {(!isLoaded || !isSignedIn) ? (
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold tracking-tight transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Build Application</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </SignUpButton>
            ) : (
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-semibold tracking-tight transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>Build Application</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Quick Idea Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
            <span className="text-zinc-600 text-xs font-mono mr-1">Examples:</span>
            {TYPEWRITER_PHRASES.slice(0, 3).map((phrase, i) => {
              const cleaned = phrase.replace('...', '');
              return (!isLoaded || !isSignedIn) ? (
                <SignUpButton key={i} mode="modal">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition text-xs font-mono cursor-pointer"
                  >
                    {cleaned}
                  </button>
                </SignUpButton>
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setHeroPrompt(cleaned);
                    const detailedSpec = getCuratedExampleSpec(cleaned) || enhanceUserPrompt(cleaned);
                    onLaunchWithPrompt(cleaned, detailedSpec);
                  }}
                  className="px-3 py-1.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition text-xs font-mono cursor-pointer"
                >
                  {cleaned}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product Preview Mockup */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="rounded-xl border border-zinc-800 bg-[#0e1014] overflow-hidden shadow-2xl">
          <div className="h-11 bg-zinc-950 border-b border-zinc-800/80 px-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
              <span className="text-xs font-mono text-zinc-500 ml-2">aethercraft-studio // active session</span>
            </div>

            {(!isLoaded || !isSignedIn) ? (
              <SignUpButton mode="modal">
                <button className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer">
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </SignUpButton>
            ) : (
              <button
                onClick={() => navigateTo('studio')}
                className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Open Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
            {/* Left Prompt Log */}
            <div className="md:col-span-4 border-r border-zinc-800/80 p-6 bg-[#090a0d] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
                  <div className="text-[10px] text-zinc-500 font-mono uppercase mb-1">Specification</div>
                  "Build a modern dark-mode AI SaaS landing page with responsive cards and team savings estimator."
                </div>
                <div className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 font-mono">
                  <div className="text-[10px] text-emerald-400 font-mono uppercase mb-1">Compiler Output</div>
                  ✓ index.html generated<br />
                  ✓ styles.css optimized<br />
                  ✓ script.js bundled (0 errors)
                </div>
              </div>

              {(!isLoaded || !isSignedIn) ? (
                <SignUpButton mode="modal">
                  <button className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition mt-4 cursor-pointer">
                    Inspect Project in Studio
                  </button>
                </SignUpButton>
              ) : (
                <button
                  onClick={() => navigateTo('studio')}
                  className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition mt-4 cursor-pointer"
                >
                  Inspect Project in Studio
                </button>
              )}
            </div>

            {/* Right Live Preview Canvas */}
            <div className="md:col-span-8 p-10 flex flex-col items-center justify-center text-center bg-[#0d0f14]">
              <div className="max-w-lg">
                <div className="inline-block px-3 py-1 rounded bg-zinc-800 text-xs font-mono text-zinc-400 mb-4">
                  Live 60 FPS Sandbox Preview
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">NexusAI — Software Systems</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mb-8 font-light leading-relaxed">
                  Enterprise-grade neural synthesis engine for modern engineering teams.
                </p>
                <div className="flex justify-center gap-3">
                  {(!isLoaded || !isSignedIn) ? (
                    <SignUpButton mode="modal">
                      <button className="px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-medium transition cursor-pointer">
                        Launch Live Demo
                      </button>
                    </SignUpButton>
                  ) : (
                    <button
                      onClick={() => onLoadTemplate(STARTER_TEMPLATES[0])}
                      className="px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-medium transition cursor-pointer"
                    >
                      Launch Live Demo
                    </button>
                  )}
                  <button
                    onClick={() => navigateTo('templates')}
                    className="px-5 py-2.5 rounded-lg border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-medium transition cursor-pointer"
                  >
                    View Templates
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-800/80">
        <div className="mb-12 text-left">
          <div className="text-xs font-mono uppercase text-zinc-500 mb-1">Architecture</div>
          <h2 className="text-3xl font-bold text-white">Engineered for builders</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-xl bg-[#101216] border border-zinc-800 hover:border-zinc-700 transition">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-4 font-mono text-xs">
              01
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Natural Language Synthesis</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Translate plain English descriptions into clean semantic HTML5, modern Tailwind CSS, and interactive JavaScript without writing boilerplate.
            </p>
          </div>

          <div className="p-7 rounded-xl bg-[#101216] border border-zinc-800 hover:border-zinc-700 transition">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-4 font-mono text-xs">
              02
            </div>
            <h3 className="text-base font-semibold text-white mb-2">In-Memory Sandboxed Preview</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Test your designs in real-time across Desktop, Tablet, and Mobile viewports with zero network lag or cloud container overhead.
            </p>
          </div>

          <div className="p-7 rounded-xl bg-[#101216] border border-zinc-800 hover:border-zinc-700 transition">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 mb-4 font-mono text-xs">
              03
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Production Export</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Own 100% of your code. Download complete ZIP bundles ready for drag-and-drop hosting on Vercel, Netlify, or GitHub Pages.
            </p>
          </div>
        </div>
      </section>

      {/* Templates Teaser */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Starter Templates</h2>
            <p className="text-xs text-zinc-400 mt-1">Production-ready starting points for web apps.</p>
          </div>
          <button
            onClick={() => navigateTo('templates')}
            className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>All templates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {STARTER_TEMPLATES.slice(0, 3).map((tmpl) => (
            <div
              key={tmpl.id}
              className="rounded-xl bg-[#111317] border border-zinc-800 p-6 flex flex-col justify-between hover:border-zinc-700 transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3 text-xs font-mono text-zinc-500">
                  <span>{tmpl.category}</span>
                  <span>★ {tmpl.stars}</span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{tmpl.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 mb-6 font-light leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              {(!isLoaded || !isSignedIn) ? (
                <SignUpButton mode="modal">
                  <button className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition text-center cursor-pointer">
                    Open in Studio
                  </button>
                </SignUpButton>
              ) : (
                <button
                  onClick={() => onLoadTemplate(tmpl)}
                  className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-white transition text-center cursor-pointer"
                >
                  Open in Studio
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Transparent Pricing Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-zinc-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-4">
            <Tag className="w-3.5 h-3.5" />
            <span>Flexible Plans for Every Creator</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Simple, Transparent Pricing
          </h2>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-10">
          {/* Developer Free */}
          <div className="rounded-3xl p-8 flex flex-col justify-between transition duration-300 bg-[#0e121a] border border-white/5 shadow-xl">
            <div>
              <div className="text-sm font-bold text-slate-300 mb-1">Developer Free</div>
              <div className="text-4xl font-black text-white mb-1">
                $0 <span className="text-xs font-normal text-slate-400">/forever</span>
              </div>
              <p className="text-xs text-slate-400 mb-8 leading-relaxed font-light">For prototyping personal ideas.</p>

              <div className="border-t border-white/5 pt-6 mb-8">
                <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Included Features:</div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>5 free generations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>In-memory live sandbox</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>1-Click ZIP export</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Unlimited Free OpenRouter Models</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Community Discord support</span>
                  </li>
                </ul>
              </div>
            </div>

            {(!isLoaded || !isSignedIn) ? (
              <SignUpButton mode="modal">
                <button className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white">
                  Get Started Free
                </button>
              </SignUpButton>
            ) : (
              <button
                onClick={() => navigateTo('studio')}
                className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Get Started Free
              </button>
            )}
          </div>

          {/* Pro Founder */}
          <div className="rounded-3xl p-8 flex flex-col justify-between transition duration-300 bg-gradient-to-b from-indigo-950/50 via-[#0e121a] to-[#0e121a] border-2 border-indigo-500 shadow-2xl shadow-indigo-950/60 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-widest">
              Recommended
            </div>

            <div>
              <div className="text-sm font-bold text-slate-300 mb-1">Pro Founder</div>
              <div className="text-4xl font-black text-white mb-1">
                {billingCycle === 'annual' ? '$16' : '$20'} <span className="text-xs font-normal text-slate-400">/per month</span>
              </div>
              <p className="text-xs text-slate-400 mb-8 leading-relaxed font-light">For indie makers shipping commercial products.</p>

              <div className="border-t border-white/5 pt-6 mb-8">
                <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Included Features:</div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>Unlimited generations</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>Priority synthesis speed</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>Custom domain publishing</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>Multi-turn architectural memory</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>Unlimited persistent project saves</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>Priority engineering support</span>
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => navigateTo('checkout', { plan: 'pro', cycle: billingCycle })}
              className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer bg-white hover:bg-zinc-200 text-black shadow-lg shadow-white/10 font-semibold"
            >
              Start Pro Plan
            </button>
          </div>

          {/* Team Workspace */}
          <div className="rounded-3xl p-8 flex flex-col justify-between transition duration-300 bg-[#0e121a] border border-white/5 shadow-xl">
            <div>
              <div className="text-sm font-bold text-slate-300 mb-1">Team Workspace</div>
              <div className="text-4xl font-black text-white mb-1">
                {billingCycle === 'annual' ? '$40' : '$49'} <span className="text-xs font-normal text-slate-400">/per month</span>
              </div>
              <p className="text-xs text-slate-400 mb-8 leading-relaxed font-light">For agencies and digital teams.</p>

              <div className="border-t border-white/5 pt-6 mb-8">
                <div className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">Included Features:</div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>5 team member seats</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Shared workspace sync</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>White-label export options</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Shared custom API keys pool</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Dedicated account manager & SLA</span>
                  </li>
                </ul>
              </div>
            </div>

            <a
              href="mailto:sales@aethercraft.io?subject=Inquiry%20about%20Team%20Workspace%20Plan"
              className="w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-white text-center block"
            >
              Contact Team Sales
            </a>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-zinc-800/80">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-lg border border-zinc-800/80 bg-[#111318] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-medium text-zinc-200 hover:text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition duration-200 ${openFaq === i ? 'rotate-180 text-white' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-xs text-zinc-400 font-light leading-relaxed border-t border-zinc-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
