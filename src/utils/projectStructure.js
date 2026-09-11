/**
 * projectStructure.js
 * Enforces the authentic React 18 + Vite project directory structure:
 *
 * project-root/
 * ├── public/
 * │   └── vite.svg
 * ├── src/
 * │   ├── assets/
 * │   │   └── react.svg
 * │   ├── components/
 * │   │   └── ... (modular sub-components)
 * │   ├── App.jsx
 * │   ├── main.jsx
 * │   └── index.css
 * ├── index.html
 * ├── package.json
 * └── vite.config.js
 */

export const DEFAULT_MAIN_JSX = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

export const DEFAULT_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/public/vite.svg" />
    <title>React Application</title>
  </head>
  <body class="bg-[#090a0f] text-zinc-100 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

export const DEFAULT_VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});
`;

export const DEFAULT_REACT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348" width="100%" height="100%">
  <circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
  <g stroke="#61dafb" stroke-width="1" fill="none">
    <ellipse rx="11" ry="4.2"/>
    <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
    <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
  </g>
</svg>`;

export const DEFAULT_VITE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
  <path fill="#41D1FF" d="M29.6 4.8L16.8 28.5c-.3.6-1.2.6-1.5 0L2.4 4.8c-.4-.7.1-1.6.9-1.6h25.4c.8 0 1.3.9.9 1.6z"/>
  <path fill="#BD34FE" d="M21.5 3.2L16 13.8 10.5 3.2z"/>
</svg>`;

export const DEFAULT_INDEX_CSS = `/* Tailwind CSS & Application Global Styles */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #090a0f;
  color: #f4f4f5;
}
`;

export function getPackageJson(projectName = 'react-app') {
  const safeName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '') || 'react-app';

  return JSON.stringify(
    {
      name: safeName,
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        'lucide-react': '^0.475.0'
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.3.4',
        autoprefixer: '^10.4.20',
        postcss: '^8.4.49',
        tailwindcss: '^3.4.17',
        vite: '^6.0.0'
      }
    },
    null,
    2
  );
}

/**
 * Ensures project files conform to the authentic React + Vite directory structure.
 * Reorganizes legacy flat structures (App.jsx, styles.css) into nested
 * src/App.jsx, src/index.css, src/main.jsx, src/assets/, public/, etc.
 *
 * @param {Object} rawFiles Key-value map of file paths to contents
 * @param {string} projectName Name of the project for package.json
 * @returns {Object} Normalized file map with full React folder structure
 */
export function ensureStandardReactStructure(rawFiles = {}, projectName = 'React App') {
  const files = { ...rawFiles };

  // 1. Move root App.jsx / App.js to src/App.jsx
  if (files['App.jsx'] && !files['src/App.jsx']) {
    files['src/App.jsx'] = files['App.jsx'];
    delete files['App.jsx'];
  }
  if (files['App.js'] && !files['src/App.jsx']) {
    files['src/App.jsx'] = files['App.js'];
    delete files['App.js'];
  }

  // 2. Move styles.css / src/styles.css to src/index.css
  if (files['styles.css'] && !files['src/index.css']) {
    files['src/index.css'] = files['styles.css'];
    delete files['styles.css'];
  }
  if (files['src/styles.css'] && !files['src/index.css']) {
    files['src/index.css'] = files['src/styles.css'];
    delete files['src/styles.css'];
  }

  // 3. Move loose root components into src/components/
  for (const [key, val] of Object.entries({ ...files })) {
    if (!key.includes('/') && (key.endsWith('.jsx') || key.endsWith('.tsx')) && key !== 'App.jsx') {
      files[`src/components/${key}`] = val;
      delete files[key];
    }
  }

  // 4. Ensure src/App.jsx exists
  if (!files['src/App.jsx']) {
    files['src/App.jsx'] = `import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 text-2xl font-bold text-indigo-400 mb-2">
        <Sparkles className="w-8 h-8 text-indigo-400" />
        <h1>Welcome to ${projectName}</h1>
      </div>
      <p className="text-zinc-400">Ready for development.</p>
    </div>
  );
}
`;
  }

  // 5. Ensure src/main.jsx exists
  if (!files['src/main.jsx']) {
    files['src/main.jsx'] = DEFAULT_MAIN_JSX;
  }

  // 6. Ensure src/index.css exists
  if (!files['src/index.css']) {
    files['src/index.css'] = DEFAULT_INDEX_CSS;
  }

  // 7. Ensure index.html exists
  if (!files['index.html']) {
    files['index.html'] = DEFAULT_INDEX_HTML;
  }

  // 8. Ensure package.json exists
  if (!files['package.json']) {
    files['package.json'] = getPackageJson(projectName);
  }

  // 9. Ensure vite.config.js exists
  if (!files['vite.config.js']) {
    files['vite.config.js'] = DEFAULT_VITE_CONFIG;
  }

  // 10. Ensure standard SVG assets exist in src/assets and public
  if (!files['src/assets/react.svg']) {
    files['src/assets/react.svg'] = DEFAULT_REACT_SVG;
  }
  if (!files['public/vite.svg']) {
    files['public/vite.svg'] = DEFAULT_VITE_SVG;
  }

  return files;
}
