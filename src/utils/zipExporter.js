import JSZip from 'jszip';
import fileSaver from 'file-saver';
const saveAs = fileSaver?.saveAs || fileSaver?.default?.saveAs || fileSaver;
import { buildPreviewDoc } from './previewBuilder.js';

/**
 * Packages project files into a JSZip instance
 */
export async function buildProjectZip(files, projectName = "aethercraft-app") {
  const zip = new JSZip();

  // Add all user workspace files
  for (const [filename, content] of Object.entries(files)) {
    zip.file(filename, content);
  }

  const isReact = Boolean(files['App.jsx'] || files['App.js'] || files['src/App.jsx']);

  // If it's a React project, also provide standard developer tooling
  if (isReact) {
    // 1. Ensure Vite production index.html without CDN
    if (files['index.html']) {
      let cleanedHtml = files['index.html'];
      cleanedHtml = cleanedHtml.replace(/<script[^>]*src=["']https:\/\/cdn\.tailwindcss\.com["'][^>]*><\/script>\s*/gi, '');
      cleanedHtml = cleanedHtml.replace(/<script[^>]*>\s*tailwind\.config\s*=\s*[\s\S]*?<\/script>\s*/gi, '');
      if (!cleanedHtml.includes('/src/main.jsx') && !cleanedHtml.includes('main.jsx')) {
        cleanedHtml = cleanedHtml.replace('</body>', '  <script type="module" src="/src/main.jsx"></script>\n  </body>');
      }
      zip.file("index.html", cleanedHtml);
    } else {
      zip.file("index.html", `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body class="bg-[#090a0f] text-zinc-100 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);
    }

    // 2. Ensure src/main.jsx exists for Vite
    if (!files['src/main.jsx'] && !files['main.jsx']) {
      zip.file("src/main.jsx", `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`);
    }

    // 3. Ensure src/index.css with standard Tailwind directives exists
    if (!files['src/index.css'] && !files['index.css'] && !files['styles.css']) {
      zip.file("src/index.css", `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  background-color: #090a0f;
  color: #f4f4f5;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}
`);
    }

    // 4. Production Tailwind Config
    if (!files['tailwind.config.js']) {
      zip.file("tailwind.config.js", `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fafafa',
          100: '#f4f4f5',
          500: '#71717a',
          900: '#18181b',
          950: '#090a0f'
        }
      }
    },
  },
  plugins: [],
};
`);
    }

    // 5. Production PostCSS Config
    if (!files['postcss.config.js']) {
      zip.file("postcss.config.js", `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`);
    }

    // 6. Production Vite Config
    if (!files['vite.config.js']) {
      zip.file("vite.config.js", `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`);
    }

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
  } else {
    // Vanilla project: ensure index.html exists
    if (!files['index.html']) {
      const standaloneHtml = buildPreviewDoc(files);
      zip.file("index.html", standaloneHtml);
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

  return zip;
}

/**
 * Packages and triggers browser download of project ZIP archive
 */
export async function downloadProjectZip(files, projectName = "aethercraft-app") {
  const zip = await buildProjectZip(files, projectName);
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${projectName}.zip`);
}
