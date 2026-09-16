import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const ROUTES = [
  { name: 'Landing', hash: '#/' },
  { name: 'Templates', hash: '#/templates' },
  { name: 'Showcase', hash: '#/showcase' },
  { name: 'Pricing', hash: '#/pricing' },
  { name: 'Integrations', hash: '#/integrations' },
  { name: 'Docs', hash: '#/docs' },
  { name: 'Changelog', hash: '#/changelog' },
  { name: 'Checkout', hash: '#/checkout' },
];

const VIEWPORTS = [
  { name: 'Mobile (375px)', width: 375, height: 812 },
  { name: 'Tablet (768px)', width: 768, height: 1024 },
  { name: 'Desktop (1440px)', width: 1440, height: 900 },
];

async function stressTest() {
  console.log('🔬 Starting Rigorous Deep Stress Test & Bug Hunt...');
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const findings = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      findings.push({ category: 'CONSOLE_ERROR', text: msg.text(), url: page.url() });
    }
  });

  page.on('pageerror', err => {
    findings.push({ category: 'UNCAUGHT_EXCEPTION', message: err.message, stack: err.stack, url: page.url() });
  });

  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('chrome-extension')) {
      findings.push({ category: 'NETWORK_FAILURE', status: res.status(), url: res.url() });
    }
  });

  // TEST 1: Horizontal scroll check on EVERY page across ALL viewports
  console.log('--- 1. Testing Horizontal Overflows on ALL Pages across Viewports ---');
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const r of ROUTES) {
      await page.goto(`${BASE_URL}/${r.hash}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(100);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      if (hasOverflow) {
        const offenders = await page.evaluate(() => {
          const docW = document.documentElement.clientWidth;
          const els = Array.from(document.querySelectorAll('*'));
          return els
            .filter(e => e.getBoundingClientRect().right > docW + 1)
            .map(e => ({ tag: e.tagName, cls: typeof e.className === 'string' ? e.className.slice(0, 50) : '', diff: Math.round(e.getBoundingClientRect().right - docW) }))
            .slice(0, 3);
        });
        findings.push({
          category: 'HORIZONTAL_OVERFLOW',
          viewport: vp.name,
          route: r.name,
          offenders
        });
      }
    }
  }

  // Set back to Desktop for functional testing
  await page.setViewportSize({ width: 1440, height: 900 });

  // TEST 2: Every Clickable Button on Landing Page
  console.log('--- 2. Fuzzing & Clicking Interactive Buttons on Landing Page ---');
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle' });
  const landingButtons = await page.locator('button').all();
  console.log(`Found ${landingButtons.length} buttons on Landing Page. Testing clicks...`);
  for (let i = 0; i < landingButtons.length; i++) {
    const btn = landingButtons[i];
    try {
      if (await btn.isVisible()) {
        await btn.click({ timeout: 1000, force: true }).catch(() => {});
        await page.keyboard.press('Escape');
      }
    } catch (e) {}
  }

  // TEST 3: Pricing Page Interactivity
  console.log('--- 3. Testing Pricing Page Toggles & Checkout Navigation ---');
  await page.goto(`${BASE_URL}/#/pricing`, { waitUntil: 'networkidle' });
  const billingBtns = await page.locator('button:has-text("Monthly"), button:has-text("Annual")').all();
  for (const b of billingBtns) {
    await b.click({ force: true }).catch(() => {});
    await page.waitForTimeout(150);
  }

  const subscribeBtns = await page.locator('button:has-text("Subscribe"), button:has-text("Get Started"), button:has-text("Upgrade")').all();
  for (const b of subscribeBtns) {
    try {
      if (await b.isVisible()) {
        await b.click({ timeout: 1000, force: true }).catch(() => {});
        await page.waitForTimeout(150);
        await page.keyboard.press('Escape');
      }
    } catch (e) {}
  }

  // TEST 4: Checkout Page Parameter Resilience
  console.log('--- 4. Testing Checkout Page Edge Case URLs ---');
  const checkoutUrls = [
    '#/checkout',
    '#/checkout?plan=invalid_plan',
    '#/checkout?plan=enterprise&cycle=annual',
    '#/checkout?plan=pro&cycle=invalid_cycle',
  ];
  for (const u of checkoutUrls) {
    await page.goto(`${BASE_URL}/${u}`, { waitUntil: 'networkidle' });
    const content = await page.evaluate(() => document.body.innerText);
    if (!content.includes('Checkout') && !content.includes('Summary') && !content.includes('Order')) {
      findings.push({ category: 'BROKEN_CHECKOUT_STATE', url: u, sample: content.slice(0, 100) });
    }
  }

  // TEST 5: Docs Page Nav & Sections
  console.log('--- 5. Testing Docs Page Nav & Sections ---');
  await page.goto(`${BASE_URL}/#/docs`, { waitUntil: 'networkidle' });
  const docLinks = await page.locator('button, a').all();
  for (const l of docLinks.slice(0, 20)) {
    try {
      if (await l.isVisible()) {
        await l.click({ timeout: 500, force: true }).catch(() => {});
      }
    } catch (e) {}
  }

  // TEST 6: Templates Code & Structure Integrity
  console.log('--- 6. Testing Templates Structure & Syntax ---');
  await page.goto(`${BASE_URL}/#/templates`, { waitUntil: 'networkidle' });
  const buttonsCount = await page.locator('button:has-text("Open in Studio")').count();
  if (buttonsCount === 0) {
    findings.push({ category: 'EMPTY_TEMPLATES_PAGE', message: 'No template cards rendered!' });
  }

  await browser.close();

  console.log('\n==================================================');
  console.log(`🏁 DEEP AUDIT COMPLETE: Found ${findings.length} issues.`);
  console.log('==================================================');
  console.log(JSON.stringify(findings, null, 2));
}

stressTest().catch(console.error);
