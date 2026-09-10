# AetherCraft // AI Web Application Studio

A production-grade, full-stack AI web application builder. Synthesize, edit, test, and export interactive React 18 applications in real time with live browser sandbox execution, automated self-healing, and zero dependencies required on the host system.

![AetherCraft Studio](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80)

## Features

- **Live In-Browser Sandboxing:** Compiles React 18 JSX, Tailwind CSS, and Lucide icons directly in the client via Babel Standalone and high-performance CDNs.
- **Behind-The-Scenes Auto-Healing:** Automatic telemetry intercepts runtime and rendering errors, notifying the AI engine to repair and hot-reload the preview seamlessly.
- **Dynamic Icon & Hook Shims:** All 2,000+ Lucide icons and common helper libraries (`framer-motion`, `clsx`, `cn`) are automatically proxied and guarded against missing import crashes.
- **Multi-Model Support:** Built-in support for OpenRouter, NVIDIA NIM, Google Gemma, Cohere, and Claude models.
- **Responsive Canvas:** Switch between Desktop, Tablet, and Mobile viewports with live aspect-ratio simulation.
- **Code Inspector & ZIP Exporter:** Inspect generated source files with Monaco-style tabs and download a standalone, ready-to-run ZIP containing HTML, package manifests, and styles.
- **Enterprise Authentication:** Integrated with Clerk Authentication for secure user onboarding and workspace management.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Icons:** Lucide React (with in-sandbox dynamic proxy)
- **Auth:** Clerk React (`@clerk/react`)
- **AI Streaming:** OpenRouter API (Server-Sent Events with active watchdog controls)
- **Compression:** JSZip & FileSaver for standalone project exports

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/russellsahoo21/Ai-Website-Builder.git
   cd Ai-Website-Builder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your OpenRouter / NVIDIA API key and Clerk credentials to `.env`.

4. Launch development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173/` in your browser.

5. Build for production:
   ```bash
   npm run build
   ```

## License

MIT License. Crafted with precision for high-performance software architects.
