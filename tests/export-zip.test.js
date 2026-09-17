import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProjectZip } from '../src/utils/zipExporter.js';

test('Export Zip — Production export bundles authentic Tailwind and Vite config without CDN', async () => {
  const userFiles = {
    'src/App.jsx': `import React from 'react';
export default function App() {
  return <div className="bg-zinc-950 text-white p-4">App Works</div>;
}`
  };

  const zip = await buildProjectZip(userFiles, 'my-test-app');

  // Check that index.html exists and DOES NOT use cdn.tailwindcss.com
  const indexHtml = await zip.file('index.html').async('string');
  assert.ok(indexHtml, 'index.html should be created');
  assert.ok(!indexHtml.includes('cdn.tailwindcss.com'), 'index.html must NOT use Tailwind CDN');
  assert.ok(indexHtml.includes('/src/main.jsx'), 'index.html should point to /src/main.jsx module');

  // Check tailwind.config.js
  const tailwindConfig = await zip.file('tailwind.config.js').async('string');
  assert.ok(tailwindConfig, 'tailwind.config.js should be created');
  assert.ok(tailwindConfig.includes('./src/**/*.{js,ts,jsx,tsx}'), 'Tailwind config includes source globs');

  // Check postcss.config.js
  const postcssConfig = await zip.file('postcss.config.js').async('string');
  assert.ok(postcssConfig, 'postcss.config.js should be created');
  assert.ok(postcssConfig.includes('tailwindcss'), 'PostCSS config includes tailwindcss');
  assert.ok(postcssConfig.includes('autoprefixer'), 'PostCSS config includes autoprefixer');

  // Check vite.config.js
  const viteConfig = await zip.file('vite.config.js').async('string');
  assert.ok(viteConfig, 'vite.config.js should be created');
  assert.ok(viteConfig.includes('@vitejs/plugin-react'), 'Vite config includes react plugin');

  // Check src/main.jsx
  const mainJsx = await zip.file('src/main.jsx').async('string');
  assert.ok(mainJsx, 'src/main.jsx should be created');
  assert.ok(mainJsx.includes('ReactDOM.createRoot'), 'main.jsx mounts root');

  // Check src/index.css
  const indexCss = await zip.file('src/index.css').async('string');
  assert.ok(indexCss, 'src/index.css should be created');
  assert.ok(indexCss.includes('@tailwind base;'), 'index.css includes @tailwind base');
  assert.ok(indexCss.includes('@tailwind components;'), 'index.css includes @tailwind components');
  assert.ok(indexCss.includes('@tailwind utilities;'), 'index.css includes @tailwind utilities');

  // Check package.json
  const pkgJsonRaw = await zip.file('package.json').async('string');
  const pkg = JSON.parse(pkgJsonRaw);
  assert.ok(pkg.devDependencies.tailwindcss, 'package.json has tailwindcss devDep');
  assert.ok(pkg.devDependencies.postcss, 'package.json has postcss devDep');
  assert.ok(pkg.devDependencies.autoprefixer, 'package.json has autoprefixer devDep');
  assert.ok(pkg.devDependencies.vite, 'package.json has vite devDep');
});

test('Export Zip — Strips cdn.tailwindcss.com and inline tailwind.config from existing index.html', async () => {
  const filesWithCdn = {
    'src/App.jsx': 'export default function App() { return <div>Hi</div>; }',
    'index.html': `<!DOCTYPE html>
<html>
  <head>
    <title>CDN App</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = { theme: { extend: {} } }
    </script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
  };

  const zip = await buildProjectZip(filesWithCdn, 'cdn-cleaned-app');
  const indexHtml = await zip.file('index.html').async('string');

  assert.ok(!indexHtml.includes('cdn.tailwindcss.com'), 'Tailwind CDN script must be stripped');
  assert.ok(!indexHtml.includes('tailwind.config ='), 'Inline tailwind.config script must be stripped');
  assert.ok(indexHtml.includes('/src/main.jsx'), 'Vite entry script must be injected');
});
