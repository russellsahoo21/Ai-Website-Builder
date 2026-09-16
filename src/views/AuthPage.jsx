"use client";
import React, { useEffect } from 'react';
import { SignIn, SignUp, useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Terminal, ShieldCheck, Zap, Layers, Rocket, RefreshCw } from 'lucide-react';

export default function AuthPage({ mode = 'login', navigateTo }) {
  const isLogin = mode === 'login';
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const redirectUrl = searchParams.get('redirect_url');
      if (redirectUrl) {
        try {
          const parsed = new URL(redirectUrl, window.location.origin);
          if (parsed.origin === window.location.origin) {
            router.replace(parsed.pathname + parsed.search);
            return;
          }
        } catch (e) {
          if (redirectUrl.startsWith('/')) {
            router.replace(redirectUrl);
            return;
          }
        }
      }
      router.replace('/dashboard');
    }
  }, [isLoaded, isSignedIn, router, searchParams]);

  return (
    <div className="h-[calc(100vh-3.5rem)] max-h-[calc(100vh-3.5rem)] flex-1 flex flex-col justify-between select-none relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/6 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-2 sm:right-6 w-[450px] h-[450px] bg-gradient-to-bl from-cyan-600/15 via-indigo-600/10 to-transparent rounded-full blur-[140px] pointer-events-none"></div>

      {/* Main Split Content */}
      <main className="min-h-0 flex-1 flex items-center justify-center px-4 sm:px-6 py-1 z-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Hero Pitch Column (Desktop Only) */}
          <div className="hidden lg:flex lg:col-span-6 flex-col justify-center pr-4 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold w-max shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full-Stack AI Software Studio</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-snug">
              Turn ideas into production{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                React 18 apps
              </span>{' '}
              in seconds.
            </h1>

            <p className="text-xs xl:text-sm text-zinc-400 font-light leading-relaxed">
              Experience the frontier code synthesis engine. Generate modular React SPAs, test in a 60 FPS live sandbox, and export clean Vite projects with 1 click.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-900/40 border border-white/5 transition hover:border-white/10">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
                  <Terminal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200">React 18 & Tailwind CSS Native</div>
                  <div className="text-[11px] text-zinc-400 font-light">Outputs production-grade components, complete styling, and zero legacy HTML.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-900/40 border border-white/5 transition hover:border-white/10">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200">BTS Auto-Repair System</div>
                  <div className="text-[11px] text-zinc-400 font-light">Zero red error screens. Runtime glitches are auto-healed silently in the background.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-zinc-900/40 border border-white/5 transition hover:border-white/10">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-zinc-200">Multi-Model Engine</div>
                  <div className="text-[11px] text-zinc-400 font-light">Pre-configured with Groq LPU (~300 tok/s), Google Gemini, and NVIDIA NIM.</div>
                </div>
              </div>
            </div>

            {/* Micro Quote */}
            <div className="p-3 rounded-xl bg-zinc-900/30 border border-white/5 text-xs text-zinc-400 italic">
              "AetherCraft gives founders the ability to prototype full-stack SaaS apps faster than any traditional IDE."
            </div>
          </div>

          {/* Right Auth Box Column - Unified Glassmorphic Card */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center w-full relative lg:translate-x-14">
            <div className="w-full max-w-[420px] relative">
              {/* Ambient backlight glow tightly hugging the card */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-cyan-500/20 rounded-[2rem] blur-2xl opacity-75 pointer-events-none"></div>

              <div className="w-full relative rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900/90 via-zinc-950/95 to-[#090b10] backdrop-blur-xl p-5 sm:p-6 shadow-2xl shadow-black/80">
                {/* Subtle top edge highlight beam */}
                <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent pointer-events-none"></div>

                {/* Embedded Clerk Form */}
                <div className="w-full">
                {isLoaded && isSignedIn ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3 text-center">
                    <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                    <p className="text-sm font-semibold text-white">Authentication Successful</p>
                    <p className="text-xs text-zinc-400">Redirecting to your dashboard...</p>
                  </div>
                ) : isLogin ? (
                  <SignIn 
                    routing="path"
                    path="/login"
                    signUpUrl="/signup"
                    fallbackRedirectUrl="/dashboard"
                    forceRedirectUrl="/dashboard"
                    afterSignInUrl="/dashboard"
                    afterSignUpUrl="/dashboard"
                    appearance={{
                      elements: {
                        rootBox: 'w-full',
                        cardBox: 'w-full bg-transparent border-0 shadow-none p-0',
                        card: 'w-full bg-transparent border-0 shadow-none p-0',
                        header: 'mb-2.5',
                        headerTitle: 'text-base font-bold text-white tracking-tight',
                        headerSubtitle: 'text-xs text-zinc-400',
                        socialButtonsBlockButton: 'h-9 text-xs',
                        socialButtonsIconButton: 'h-9',
                        dividerRow: 'my-1.5',
                        formFieldRow: 'mb-1.5',
                        formFieldLabel: 'text-[11px] text-zinc-300 mb-0.5',
                        formFieldInput: 'h-8 text-xs bg-zinc-900/80 border-zinc-700/70 text-white rounded-lg px-2.5 focus:border-indigo-500',
                        formButtonPrimary: 'h-8 text-xs font-semibold mt-1 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 shadow-md shadow-white/10 transition',
                        footerAction: 'pt-1.5 text-xs text-zinc-400',
                        footer: 'pt-2 pb-0 mt-2 border-t border-white/5',
                      }
                    }}
                  />
                ) : (
                  <SignUp 
                    routing="path"
                    path="/signup"
                    signInUrl="/login"
                    fallbackRedirectUrl="/dashboard"
                    forceRedirectUrl="/dashboard"
                    afterSignInUrl="/dashboard"
                    afterSignUpUrl="/dashboard"
                    appearance={{
                      elements: {
                        rootBox: 'w-full',
                        cardBox: 'w-full bg-transparent border-0 shadow-none p-0',
                        card: 'w-full bg-transparent border-0 shadow-none p-0',
                        header: 'mb-2.5',
                        headerTitle: 'text-base font-bold text-white tracking-tight',
                        headerSubtitle: 'text-xs text-zinc-400',
                        socialButtonsBlockButton: 'h-9 text-xs',
                        socialButtonsIconButton: 'h-9',
                        dividerRow: 'my-1.5',
                        formFieldRow: 'mb-1.5',
                        formFieldLabel: 'text-[11px] text-zinc-300 mb-0.5',
                        formFieldInput: 'h-8 text-xs bg-zinc-900/80 border-zinc-700/70 text-white rounded-lg px-2.5 focus:border-indigo-500',
                        formButtonPrimary: 'h-8 text-xs font-semibold mt-1 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 shadow-md shadow-white/10 transition',
                        footerAction: 'pt-1.5 text-xs text-zinc-400',
                        footer: 'pt-2 pb-0 mt-2 border-t border-white/5',
                      }
                    }}
                  />
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </main>

      {/* Footer copyright */}
      <footer className="py-2.5 text-center text-[10px] text-zinc-600 z-10 shrink-0">
        © 2026 AetherCraft Systems Inc. All rights reserved.
      </footer>
    </div>
  );
}

