import React, { useState } from 'react';
import { BookOpen, Sparkles, Terminal, Code2, Globe2, Rocket, Key } from 'lucide-react';

const DOC_SECTIONS = [
  {
    id: "getting-started",
    title: "1. Getting Started",
    icon: Rocket,
    content: `
### What is AetherCraft?
AetherCraft is an intelligent, full-stack website builder and software prototyping platform. 
Instead of writing boilerplate code, configuring webpack/vite, and wrestling with CSS layout bugs, you simply type what you want to build in natural language.

### Core Workflow
1. **Enter Your Prompt:** Describe the website, pages, components, and color themes you need.
2. **AI Code Generation:** The AI writes full, semantic HTML5, modern Tailwind CSS, and interactive JavaScript.
3. **Live Sandbox Preview:** The sandbox executes the code instantly in an isolated iframe.
4. **Iterate & Refine:** Ask the AI to make tweaks (*"Make the header sticky"*, *"Add a customer review carousel"*).
5. **1-Click Export:** Download your project as a clean, deploy-ready ZIP archive.
`
  },
  {
    id: "prompt-engineering",
    title: "2. Vibe Coding & Prompts",
    icon: Sparkles,
    content: `
### Writing High-Impact Prompts
To get breathtaking designs on your first try, follow the **Context + Aesthetic + Features** formula:

**Example Prompt:**
> "Build a sleek dark-mode SaaS landing page for an AI video editor. Use a deep obsidian background with glowing purple and indigo accents. Include a sticky navbar, a hero section with a floating video player preview, a 3-column feature grid with modern glassmorphism cards, an interactive pricing calculator, and a customer testimonial slider."

### Pro Tips:
- **Specify the Color Palette:** Mention colors like *"sleek dark mode with emerald accents"*, *"luxury beige and gold minimalism"*, or *"cyberpunk neon"*.
- **Specify Interactivity:** Tell the AI what should happen when buttons are clicked (e.g. *"add a working mortgage calculator"* or *"make the size selector change the price"*).
- **Request Modern UI Primitives:** Ask for glassmorphism, sticky headers, subtle animations, and responsive mobile navbars.
`
  },
  {
    id: "exporting-deploying",
    title: "3. Exporting & Deployment",
    icon: Globe2,
    content: `
### How to Deploy Your Generated Website
Every website built in AetherCraft is 100% standard web code (HTML, CSS, JavaScript, and CDN-hosted Tailwind).

### 1-Click Netlify Drop (Fastest, 30 seconds)
1. Click **"Export ZIP"** in the top navigation bar of the Studio.
2. Unzip the downloaded file on your computer.
3. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
4. Drag and drop the folder. Your site is live with a global CDN URL and free SSL!

### GitHub Pages / Vercel
You can also push the folder to a GitHub repository and connect it to Vercel or GitHub Pages with zero build configuration.
`
  },
  {
    id: "api-keys-models",
    title: "4. AI Models & OpenRouter",
    icon: Key,
    content: `
### Using Free OpenRouter Models
AetherCraft connects to **OpenRouter**, allowing you to choose between top free and frontier models.

### Recommended Models:
- **NVIDIA Nemotron 3 Ultra (Free):** 550B MoE with a 1.0M token context window. Phenomenal reasoning and complex layout execution.
- **Qwen 2.5 Coder 32B (Free):** Specialized for frontend coding, JavaScript state, and clean Tailwind syntax.
- **Claude 3.5 Sonnet:** The industry benchmark for frontend visual aesthetics.

### How to Change Your Key:
Click the **Settings ⚙️** icon in the top navigation bar at any time to test your key or switch to any other OpenRouter model.
`
  }
];

export default function DocsPage({ navigateTo }) {
  const [activeDoc, setActiveDoc] = useState(DOC_SECTIONS[0].id);

  const current = DOC_SECTIONS.find(d => d.id === activeDoc) || DOC_SECTIONS[0];

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 py-12 px-6 max-w-7xl mx-auto select-none">
      <div className="mb-10 pb-6 border-b border-white/5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Documentation & Architecture Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          AetherCraft Knowledge Base
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <div className="md:col-span-4 space-y-2">
          {DOC_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveDoc(sec.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center gap-3 text-xs font-semibold ${
                  activeDoc === sec.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/25'
                    : 'bg-[#0e121a] border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{sec.title}</span>
              </button>
            );
          })}

          <div className="pt-6">
            <button
              onClick={() => navigateTo('studio')}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <span>Back to Studio</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="md:col-span-8 rounded-3xl bg-[#0e121a] border border-white/5 p-8 sm:p-10 shadow-xl leading-relaxed text-slate-300 text-sm">
          <div className="prose prose-invert max-w-none space-y-4">
            {current.content.split('\n\n').map((block, idx) => {
              if (block.startsWith('### ')) {
                return <h3 key={idx} className="text-xl font-bold text-white mt-6 mb-2">{block.replace('### ', '')}</h3>;
              } else if (block.startsWith('> ')) {
                return (
                  <blockquote key={idx} className="p-4 rounded-xl bg-indigo-600/10 border-l-4 border-indigo-500 text-indigo-200 text-xs my-4 italic">
                    {block.replace('> ', '')}
                  </blockquote>
                );
              } else if (block.startsWith('- ')) {
                return (
                  <ul key={idx} className="space-y-1.5 list-disc list-inside text-xs text-slate-400 my-2">
                    {block.split('\n').map((item, iidx) => (
                      <li key={iidx}>{item.replace('- ', '')}</li>
                    ))}
                  </ul>
                );
              } else if (block.startsWith('1. ')) {
                return (
                  <ol key={idx} className="space-y-1.5 list-decimal list-inside text-xs text-slate-400 my-2">
                    {block.split('\n').map((item, iidx) => (
                      <li key={iidx}>{item.replace(/^\d+\.\s*/, '')}</li>
                    ))}
                  </ol>
                );
              } else {
                return <p key={idx} className="text-xs text-slate-400 leading-relaxed">{block}</p>;
              }
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
