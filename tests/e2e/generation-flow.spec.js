import { test, expect } from '@playwright/test';

test.describe('Real Browser AI Generation Flow (Prompt -> Runtime Error -> Auto-Repair -> Mount)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Mock persistent authenticated session to access /studio
    await page.addInitScript(() => {
      localStorage.setItem('aethercraft_auth_session', JSON.stringify({
        id: 'usr_e2e_generator',
        email: 'alex@aethercraft.dev',
        name: 'Alex Rivera'
      }));
      localStorage.setItem('aethercraft_openrouter_key', 'test_key_dummy');
    });
  });

  test('successfully executes prompt -> initial build with runtime error -> auto-repair -> working preview', async ({ page }) => {
    test.setTimeout(60000);
    page.on('console', msg => console.log('[BROWSER]', msg.text()));
    page.on('response', res => { if (res.status() === 401) console.log('[401 URL]', res.url()); });
    let callCount = 0;
    const requestBodies = [];

    // 2. Intercept /api/generate calls with SSE stream responses
    await page.route('**/api/generate', async (route) => {
      callCount++;
      const postData = route.request().postDataJSON();
      requestBodies.push(postData);

      let sseBody = '';

      if (callCount === 1) {
        // Initial generation: returns component that intentionally throws runtime error on mount
        const badFileContent = [
          '<<<FILE:src/App.jsx>>>',
          'import React, { useEffect } from "react";',
          'export default function App() {',
          '  useEffect(() => {',
          '    throw new Error("Uncaught synthetic mount exception for E2E");',
          '  }, []);',
          '  return <div id="broken-screen">Rendering with error...</div>;',
          '}',
          '<<<END_FILE>>>'
        ].join('\n');

        sseBody = `: openrouter-sse\n\ndata: ${JSON.stringify({choices: [{delta: {content: badFileContent}}]})}\n\ndata: [DONE]\n\n`;
      } else {
        // Second call: Auto-repair response providing fixed, fully-functioning React component
        const fixedFileContent = [
          '<<<FILE:src/App.jsx>>>',
          'import React, { useState } from "react";',
          'export default function App() {',
          '  const [count, setCount] = useState(42);',
          '  return (',
          '    <div id="repaired-app" style={{ padding: 32, fontFamily: "sans-serif", textAlign: "center", color: "#fff" }}>',
          '      <h1 id="repaired-title">Repaired Application Online</h1>',
          '      <p id="counter-value">Count: {count}</p>',
          '      <button id="inc-btn" onClick={() => setCount(c => c + 1)}>Increment</button>',
          '    </div>',
          '  );',
          '}',
          '<<<END_FILE>>>'
        ].join('\n');

        sseBody = `: openrouter-sse\n\ndata: ${JSON.stringify({choices: [{delta: {content: fixedFileContent}}]})}\n\ndata: [DONE]\n\n`;
      }

      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: sseBody
      });
    });

    // 3. Open Studio view
    await page.goto('/studio');

    // Wait for Studio interface to initialize
    const promptInput = page.getByPlaceholder(/Type instructions or describe your changes|Describe what you want to build/i).first();
    await expect(promptInput).toBeVisible({ timeout: 15000 });

    // 4. Input generation prompt
    await promptInput.fill('Build a simple counter application with interactive buttons');

    // Submit prompt
    const sendBtn = page.locator('button[title="Send message"]').first();
    await sendBtn.click();

    // 5. Verify initial generation call was triggered
    await expect.poll(() => callCount, { timeout: 10000 }).toBeGreaterThanOrEqual(1);

    // 6. The synthetic runtime error triggers auto-repair
    // which initiates call 2 to /api/generate
    await expect.poll(() => callCount, { timeout: 25000 }).toBeGreaterThanOrEqual(2);

    // 7. Verify the repaired preview mounts inside the active slot iframe
    const previewFrame = page.frameLocator('iframe.z-10');
    await expect(previewFrame.locator('#repaired-title')).toBeVisible({ timeout: 25000 });
    await expect(previewFrame.locator('#repaired-title')).toHaveText('Repaired Application Online');
    await expect(previewFrame.locator('#counter-value')).toHaveText('Count: 42');

    // 8. Test user interactivity in the repaired component
    await previewFrame.locator('#inc-btn').click();
    await expect(previewFrame.locator('#counter-value')).toHaveText('Count: 43');
  });
});
