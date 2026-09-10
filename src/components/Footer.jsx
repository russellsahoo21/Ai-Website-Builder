import React from 'react';

export default function Footer({ navigateTo }) {
  return (
    <footer className="border-t border-zinc-800 bg-[#090a0d] text-zinc-500 text-xs py-12 select-none">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 mb-10 text-left">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center font-bold text-[10px] text-black">A</div>
            <span className="font-semibold text-white">AetherCraft</span>
          </div>
          <p className="text-zinc-500 text-xs max-w-xs font-light leading-relaxed">
            The full-stack software development engine. Generate, preview, and deploy production software from natural language.
          </p>
        </div>

        <div>
          <div className="font-semibold text-zinc-300 text-xs mb-3">Product</div>
          <ul className="space-y-2">
            <li><button onClick={() => navigateTo('landing')} className="hover:text-zinc-300 transition">Home</button></li>
            <li><button onClick={() => navigateTo('templates')} className="hover:text-zinc-300 transition">Templates</button></li>
            <li><button onClick={() => navigateTo('showcase')} className="hover:text-zinc-300 transition">Showcase</button></li>
            <li><button onClick={() => navigateTo('integrations')} className="hover:text-zinc-300 transition">Integrations</button></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-zinc-300 text-xs mb-3">Resources</div>
          <ul className="space-y-2">
            <li><button onClick={() => navigateTo('docs')} className="hover:text-zinc-300 transition">Documentation</button></li>
            <li><button onClick={() => navigateTo('changelog')} className="hover:text-zinc-300 transition">Changelog</button></li>
            <li><button onClick={() => navigateTo('pricing')} className="hover:text-zinc-300 transition">Pricing</button></li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-zinc-300 text-xs mb-3">Legal</div>
          <ul className="space-y-2 text-zinc-500">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
            <li>Security Overview</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-600">
        <div>© 2026 AetherCraft Systems Inc. All rights reserved.</div>
        <div>v2.5.0 Production Build</div>
      </div>
    </footer>
  );
}
