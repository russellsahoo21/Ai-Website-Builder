import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { buildPreviewDoc } from './previewBuilder';

/**
 * Packages project files into a downloadable, production-ready ZIP archive
 */
export async function downloadProjectZip(files, projectName = "aethercraft-app") {
  const zip = new JSZip();

  // Add all user workspace files
  for (const [filename, content] of Object.entries(files)) {
    zip.file(filename, content);
  }

  const isReact = Boolean(files['App.jsx'] || files['App.js'] || files['src/App.jsx']);

  // Ensure index.html exists for instant execution
  if (!files['index.html']) {
    const standaloneHtml = buildPreviewDoc(files);
    zip.file("index.html", standaloneHtml);
  }

  // If it's a React project, also provide standard developer tooling
  if (isReact) {
    if (!files['package.json']) {
      zip.file("package.json", JSON.stringify({
        name: projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        private: true,
        version: "1.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview"
        },
        dependencies: {
          react: "^18.3.1",
          "react-dom": "^18.3.1",
          "lucide-react": "^0.475.0"
        },
        devDependencies: {
          "@vitejs/plugin-react": "^4.3.4",
          autoprefixer: "^10.4.20",
          postcss: "^8.4.49",
          tailwindcss: "^3.4.17",
          vite: "^6.0.0"
        }
      }, null, 2));
    }
  }

  // Add a helpful README.md
  zip.file("README.md", `# ${projectName}
Synthesized by AetherCraft Studio (https://aethercraft.dev)

## Running Your Application

### Option 1: Instant Browser Execution (Zero Setup)
Simply double-click \`index.html\` in this folder to open the fully functioning application in any modern web browser!

### Option 2: Modern Developer Workflow (Vite + React)
\`\`\`bash
# 1. Install dependencies
npm install

# 2. Run local dev server with HMR
npm run dev

# 3. Build optimized production bundle
npm run build
\`\`\`

## Deploying to Production
You can drag and drop this project folder directly to:
- [Netlify Drop](https://app.netlify.com/drop)
- [Vercel](https://vercel.com)
- [GitHub Pages](https://pages.github.com)
`);

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${projectName}.zip`);
}
