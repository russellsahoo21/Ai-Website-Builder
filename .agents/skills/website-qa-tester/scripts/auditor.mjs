import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const ROUTES = [
  { name: 'Landing Page', path: '/' },
  { name: 'Templates Explorer', path: '/templates' },
  { name: 'Showcase Gallery', path: '/showcase' },
  { name: 'Pricing Page', path: '/pricing' },
  { name: 'Integrations Page', path: '/integrations' },
  { name: 'Docs Page', path: '/docs' },
  { name: 'Changelog Page', path: '/changelog' },
  { name: 'Feedback Page', path: '/feedback' },
  { name: 'Protected: Studio Route (/studio)', path: '/studio' },
  { name: 'Protected: Dashboard Route (/dashboard)', path: '/dashboard' },
];

const VIEWPORTS = [
  { name: 'Mobile (375px)', width: 375, height: 812 },
  { name: 'Tablet (768px)', width: 768, height: 1024 },
  { name: 'Desktop (1440px)', width: 1440, height: 900 },
];

async function runAudit() {
  console.log('🚀 Starting AetherCraft Automated QA & Bug Hunter Audit...');
  console.log(`🌐 Target: ${BASE_URL}\n`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  }

  const report = {
    criticalBugs: [],
    uiIssues: [],
    networkErrors: [],
    consoleErrors: [],
    passedChecks: [],
  };

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('clerk_catchall_check') && !text.includes('404')) {
        report.consoleErrors.push({ text, location: page.url() });
      }
    }
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      const url = res.url();
      if (!url.includes('chrome-extension://') && !url.includes('favicon.ico') && !url.includes('clerk_catchall_check')) {
        report.networkErrors.push({ url, status: res.status(), page: page.url() });
      }
    }
  });

  // 1. ROUTE AUDIT
  console.log('--- 1. Testing Route Transitions & Page Loads ---');
  for (const r of ROUTES) {
    const targetUrl = new URL(r.path, BASE_URL).href;
    try {
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      // Wait for dynamic React content to mount
      await page.waitForFunction(
        () => (document.body?.innerText || '').trim().length > 10,
        { timeout: 10000 }
      ).catch(() => {});
      await page.waitForTimeout(300);

      const pageText = await page.evaluate(() => document.body?.innerText || '');
      if (!pageText || pageText.trim().length < 20) {
        report.criticalBugs.push(`Blank or empty page rendered on route: ${r.name} (${r.path})`);
      } else {
        report.passedChecks.push(`Route loaded successfully: ${r.name}`);
      }
    } catch (err) {
      report.criticalBugs.push(`Failed to load ${r.name}: ${err.message}`);
    }
  }

  // 2. TEMPLATE MODAL TRIGGER AUDIT (New isolated context so no modal leftovers)
  console.log('\n--- 2. Testing Auth Prompts on Template Actions ---');
  try {
    const testPage = await context.newPage();
    await testPage.goto(new URL('/templates', BASE_URL).href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const btn = testPage.locator(':is(button, a):has-text("Open in Studio")').first();
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    await Promise.all([
      testPage.waitForURL(url => url.pathname.includes('signup') || url.pathname.includes('login'), { timeout: 10000 }).catch(() => {}),
      btn.click({ force: true })
    ]);
    await testPage.waitForTimeout(1000);

    const modalAppeared = await testPage.evaluate(() => {
      return Boolean(
        document.querySelector('.cl-modalContent') || 
        document.querySelector('.cl-modalBackdrop') || 
        document.querySelector('.cl-signIn-root') || 
        document.querySelector('.cl-signUp-root') || 
        document.querySelector('.cl-card') ||
        window.location.pathname.includes('login') ||
        window.location.pathname.includes('signup')
      );
    });

    if (modalAppeared) {
      report.passedChecks.push('Templates Page: "Open in Studio" successfully triggers Auth Modal or Redirect for logged-out users.');
    } else {
      report.criticalBugs.push('Templates Page: "Open in Studio" failed to trigger Auth Modal or redirect when logged out.');
    }
    await testPage.close();
  } catch (err) {
    report.uiIssues.push(`Error testing template buttons: ${err.message}`);
  }

  // 3. SHOWCASE PAGE MODAL TRIGGER AUDIT
  console.log('\n--- 3. Testing Showcase Page Auth Prompts ---');
  try {
    const testPage = await context.newPage();
    await testPage.goto(new URL('/showcase', BASE_URL).href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const btn = testPage.locator(':is(button, a):has-text("Clone & Edit Project")').first();
    await btn.waitFor({ state: 'visible', timeout: 8000 });
    await Promise.all([
      testPage.waitForURL(url => url.pathname.includes('signup') || url.pathname.includes('login'), { timeout: 10000 }).catch(() => {}),
      btn.click({ force: true })
    ]);
    await testPage.waitForTimeout(1000);

    const modalAppeared = await testPage.evaluate(() => {
      return Boolean(
        document.querySelector('.cl-modalContent') || 
        document.querySelector('.cl-modalBackdrop') || 
        document.querySelector('.cl-signIn-root') || 
        document.querySelector('.cl-signUp-root') || 
        document.querySelector('.cl-card') ||
        window.location.pathname.includes('login') ||
        window.location.pathname.includes('signup')
      );
    });

    if (modalAppeared) {
      report.passedChecks.push('Showcase Page: "Clone & Edit Project" successfully triggers Auth Modal or Redirect for logged-out users.');
    } else {
      report.criticalBugs.push('Showcase Page: "Clone & Edit Project" failed to trigger Auth Modal or redirect when logged out.');
    }
    await testPage.close();
  } catch (err) {
    report.uiIssues.push(`Error testing showcase buttons: ${err.message}`);
  }

  // 4. RESPONSIVE VIEWPORT & HORIZONTAL OVERFLOW AUDIT
  console.log('\n--- 4. Auditing Responsive Layout & Horizontal Overflow ---');
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(new URL('/', BASE_URL).href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(500);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      report.uiIssues.push(`Horizontal overflow detected at viewport ${vp.name} on Landing Page!`);
    } else {
      report.passedChecks.push(`No horizontal overflow on Landing Page at ${vp.name}.`);
    }
  }

  // 5. INTERACTIVE SEARCH & FILTERING IN TEMPLATES
  console.log('\n--- 5. Testing Interactive Filters on Templates ---');
  const searchPage = await context.newPage();
  await searchPage.goto(new URL('/templates', BASE_URL).href, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await searchPage.waitForSelector(':is(button, a):has-text("Open in Studio")', { timeout: 10000 });
  await searchPage.waitForTimeout(1200);

  const initialCards = await searchPage.locator(':is(button, a):has-text("Open in Studio")').count();
  const searchInput = searchPage.locator('input[placeholder*="Search"]');
  if (await searchInput.isVisible()) {
    await searchInput.click();
    await searchInput.fill('Spider');
    await searchPage.waitForTimeout(600);
    const filteredCards = await searchPage.locator(':is(button, a):has-text("Open in Studio")').count();
    if (filteredCards >= 1 && filteredCards < initialCards) {
      report.passedChecks.push(`Template search filter passed (Filtered ${initialCards} items down to ${filteredCards} for query 'Spider').`);
    } else {
      report.uiIssues.push(`Template search count: Initial=${initialCards}, Filtered=${filteredCards}`);
    }
  }
  await searchPage.close();

  await browser.close();

  return report;
}

runAudit().then(r => {
  console.log('\n==================================================');
  console.log('🏁 FINAL AUDIT SUMMARY:');
  console.log('==================================================');
  console.log(`Passed Checks: ${r.passedChecks.length}`);
  console.log(`Critical Bugs: ${r.criticalBugs.length}`);
  console.log(`UI Issues: ${r.uiIssues.length}`);
  console.log(`Console Errors: ${r.consoleErrors.length}`);
  console.log(`Network Failures: ${r.networkErrors.length}`);
  console.log(JSON.stringify(r, null, 2));
}).catch(console.error);
