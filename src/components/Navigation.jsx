"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FolderKanban, Menu, X } from 'lucide-react';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/react';
import { dark } from '@clerk/themes';

export default function Navigation({ currentRoute, navigateTo, onOpenProjects, projectCount = 0 }) {
  const { isSignedIn, isLoaded } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 bg-[#090a0d]/90 backdrop-blur-md border-b border-zinc-800/80 select-none">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link
            role="button"
            href="/"
            onClick={() => navigateTo && navigateTo('landing')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-100 flex items-center justify-center text-black font-bold text-xs tracking-tighter">
              A
            </div>
            <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-300 transition">
              AetherCraft
            </span>
          </Link>

          {/* Clean Text-Only Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs text-zinc-400">
            {isSignedIn && (
              <Link
                role="button"
                href="/dashboard"
                onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('dashboard'); } }}
                className={`transition hover:text-white ${currentRoute === 'dashboard' ? 'text-white font-medium text-cyan-400' : ''}`}
              >
                Dashboard
              </Link>
            )}
            <Link
              role="button"
              href="/templates"
              onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('templates'); } }}
              className={`transition hover:text-white ${currentRoute === 'templates' ? 'text-white font-medium' : ''}`}
            >
              Templates
            </Link>
            <Link
              role="button"
              href="/showcase"
              onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('showcase'); } }}
              className={`transition hover:text-white ${currentRoute === 'showcase' ? 'text-white font-medium' : ''}`}
            >
              Showcase
            </Link>
            <Link
              role="button"
              href="/integrations"
              onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('integrations'); } }}
              className={`transition hover:text-white ${currentRoute === 'integrations' ? 'text-white font-medium' : ''}`}
            >
              Integrations
            </Link>
            <Link
              role="button"
              href="/changelog"
              onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('changelog'); } }}
              className={`transition hover:text-white ${currentRoute === 'changelog' ? 'text-white font-medium' : ''}`}
            >
              Changelog
            </Link>
            <Link
              role="button"
              href="/pricing"
              onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('pricing'); } }}
              className={`transition hover:text-white ${currentRoute === 'pricing' ? 'text-white font-medium' : ''}`}
            >
              Pricing
            </Link>
            <Link
              role="button"
              href="/docs"
              onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('docs'); } }}
              className={`transition hover:text-white ${currentRoute === 'docs' ? 'text-white font-medium' : ''}`}
            >
              Docs
            </Link>
            <Link
              role="button"
              href="/feedback"
              onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('feedback'); } }}
              className={`transition hover:text-white ${currentRoute === 'feedback' ? 'text-white font-medium' : ''}`}
            >
              Feedback
            </Link>
          </div>
        </div>

        {/* Right Clerk Auth & Studio CTAs */}
        <div className="flex items-center gap-3">
          {(!isLoaded || !isSignedIn) ? (
            <div className="flex items-center gap-1.5">
              <Link 
                role="button"
                href="/login"
                onClick={() => navigateTo && navigateTo('login')}
                className={`text-xs font-medium transition px-2.5 py-1.5 rounded-md cursor-pointer ${
                  currentRoute === 'login' 
                    ? 'text-white bg-zinc-800 border border-zinc-700 font-semibold' 
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                Sign In
              </Link>
              <Link 
                role="button"
                href="/signup"
                onClick={() => navigateTo && navigateTo('signup')}
                className={`text-xs font-medium transition px-2.5 py-1.5 rounded-md cursor-pointer ${
                  currentRoute === 'signup' 
                    ? 'text-white bg-zinc-800 border border-zinc-700 font-semibold' 
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                Sign Up
              </Link>
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
            <Link 
              role="button"
              href="/signup"
              onClick={() => navigateTo && navigateTo('signup')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-medium tracking-tight transition cursor-pointer"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                role="button"
                href="/dashboard"
                onClick={() => navigateTo && navigateTo('dashboard')}
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
              </Link>

              <Link
                role="button"
                href="/studio"
                onClick={() => navigateTo && navigateTo('studio')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-medium tracking-tight transition"
              >
                <span>Studio</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-800 bg-[#090a0d] px-6 py-4 space-y-3">
          {isSignedIn && (
            <Link
              role="button"
              href="/dashboard"
              onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('dashboard'); } setIsMobileMenuOpen(false); }}
              className={`block w-full text-left py-2 text-sm font-medium transition ${
                currentRoute === 'dashboard' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Dashboard ({projectCount} projects)
            </Link>
          )}
          <Link
            role="button"
            href="/templates"
            onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('templates'); } setIsMobileMenuOpen(false); }}
            className={`block w-full text-left py-2 text-sm font-medium transition ${
              currentRoute === 'templates' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Templates Explorer
          </Link>
          <Link
            role="button"
            href="/showcase"
            onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('showcase'); } setIsMobileMenuOpen(false); }}
            className={`block w-full text-left py-2 text-sm font-medium transition ${
              currentRoute === 'showcase' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Community Showcase
          </Link>
          <Link
            role="button"
            href="/integrations"
            onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('integrations'); } setIsMobileMenuOpen(false); }}
            className={`block w-full text-left py-2 text-sm font-medium transition ${
              currentRoute === 'integrations' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Integrations
          </Link>
          <Link
            role="button"
            href="/pricing"
            onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('pricing'); } setIsMobileMenuOpen(false); }}
            className={`block w-full text-left py-2 text-sm font-medium transition ${
              currentRoute === 'pricing' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pricing
          </Link>
          <Link
            role="button"
            href="/docs"
            onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('docs'); } setIsMobileMenuOpen(false); }}
            className={`block w-full text-left py-2 text-sm font-medium transition ${
              currentRoute === 'docs' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Documentation
          </Link>
          <Link
            role="button"
            href="/changelog"
            onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('changelog'); } setIsMobileMenuOpen(false); }}
            className={`block w-full text-left py-2 text-sm font-medium transition ${
              currentRoute === 'changelog' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Changelog
          </Link>
          <Link
            role="button"
            href="/feedback"
            onClick={(e) => { if (navigateTo) { e.preventDefault(); navigateTo('feedback'); } setIsMobileMenuOpen(false); }}
            className={`block w-full text-left py-2 text-sm font-medium transition ${
              currentRoute === 'feedback' ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Feedback
          </Link>
        </div>
      )}
    </nav>
  );
}
