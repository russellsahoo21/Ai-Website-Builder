import React from 'react';
import { ArrowRight, FolderKanban } from 'lucide-react';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { dark } from '@clerk/themes';

export default function Navigation({ currentRoute, navigateTo, onOpenProjects, projectCount = 0 }) {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <nav className="sticky top-0 z-40 bg-[#090a0d]/90 backdrop-blur-md border-b border-zinc-800/80 select-none">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigateTo('landing')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-black font-bold text-xs tracking-tighter">
              A
            </div>
            <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-300 transition">
              AetherCraft
            </span>
          </button>

          {/* Clean Text-Only Links */}
          <div className="hidden md:flex items-center gap-6 text-xs text-zinc-400">
            {isSignedIn && (
              <button
                onClick={() => navigateTo('dashboard')}
                className={`transition hover:text-white ${currentRoute === 'dashboard' ? 'text-white font-medium text-cyan-400' : ''}`}
              >
                Dashboard
              </button>
            )}
            <button
              onClick={() => navigateTo('templates')}
              className={`transition hover:text-white ${currentRoute === 'templates' ? 'text-white font-medium' : ''}`}
            >
              Templates
            </button>
            <button
              onClick={() => navigateTo('showcase')}
              className={`transition hover:text-white ${currentRoute === 'showcase' ? 'text-white font-medium' : ''}`}
            >
              Showcase
            </button>
            <button
              onClick={() => navigateTo('integrations')}
              className={`transition hover:text-white ${currentRoute === 'integrations' ? 'text-white font-medium' : ''}`}
            >
              Integrations
            </button>
            <button
              onClick={() => navigateTo('changelog')}
              className={`transition hover:text-white ${currentRoute === 'changelog' ? 'text-white font-medium' : ''}`}
            >
              Changelog
            </button>
            <button
              onClick={() => navigateTo('pricing')}
              className={`transition hover:text-white ${currentRoute === 'pricing' ? 'text-white font-medium' : ''}`}
            >
              Pricing
            </button>
            <button
              onClick={() => navigateTo('docs')}
              className={`transition hover:text-white ${currentRoute === 'docs' ? 'text-white font-medium' : ''}`}
            >
              Docs
            </button>
          </div>
        </div>

        {/* Right Clerk Auth & Studio CTAs */}
        <div className="flex items-center gap-3">
          {(!isLoaded || !isSignedIn) ? (
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="text-xs font-medium text-zinc-300 hover:text-white transition px-2.5 py-1.5 rounded-md hover:bg-zinc-800">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-xs font-medium text-zinc-300 hover:text-white transition px-2.5 py-1.5 rounded-md hover:bg-zinc-800">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          ) : (
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                baseTheme: dark,
                elements: {
                  avatarBox: "w-7 h-7"
                }
              }}
              userProfileProps={{
                appearance: {
                  baseTheme: dark,
                  variables: {
                    colorBackground: '#0d0f14',
                    colorNeutral: '#ffffff',
                    colorForeground: '#ffffff',
                    colorText: '#ffffff',
                    colorTextSecondary: '#a1a1aa',
                  }
                }
              }}
            />
          )}

          {(!isLoaded || !isSignedIn) ? (
            <SignUpButton mode="modal">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-medium tracking-tight transition">
                <span>Launch Studio</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </SignUpButton>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateTo('dashboard')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border ${
                  currentRoute === 'dashboard'
                    ? 'bg-zinc-800 text-white border-zinc-700'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                }`}
                title="Go to Projects Dashboard"
              >
                <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
                <span>Dashboard</span>
                {projectCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                    {projectCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigateTo('studio')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-medium tracking-tight transition"
              >
                <span>Studio</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
