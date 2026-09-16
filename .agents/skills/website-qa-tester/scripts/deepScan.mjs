import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const ROUTES = [
  '#/',
  '#/templates',
  '#/showcase',
  '#/pricing',
  '#/integrations',
  '#/docs',
  '#/changelog',
  '#/checkout'
];

async function deepScan() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  const page = await browser.newPage();
  const issues = [];

  // Listen to console errors & warnings
  page.on('console', msg => {
    if (msg.type() === 'error') {
      issues.push({ type: 'CONSOLE_ERROR', text: msg.text(), url: page.url() });
    }
  });

  // Listen to failed requests
  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('chrome-extension')) {
      issues.push({ type: 'HTTP_ERROR', status: res.status(), url: res.url(), page: page.url() });
    }
  });

  // 1. Scan all routes for console errors, broken images & overflow
  for (const r of ROUTES) {
    await page.goto(`${BASE_URL}/${r}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);

    // Broken images check
    const brokenImages = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => ({ src: img.src, alt: img.alt }));
    });
    if (brokenImages.length > 0) {
      issues.push({ type: 'BROKEN_IMAGE', route: r, images: brokenImages });
    }

    // Broken <a> tags with empty or # href
    const brokenLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter(a => !a.href || a.getAttribute('href') === '#' || a.getAttribute('href') === '')
        .map(a => a.textContent.trim().slice(0, 30));
    });
    if (brokenLinks.length > 0) {
      issues.push({ type: 'EMPTY_OR_DEAD_LINK', route: r, count: brokenLinks.length, samples: brokenLinks.slice(0, 5) });
    }

    // Check horizontal scroll
    const hasScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (hasScroll) {
      issues.push({ type: 'HORIZONTAL_OVERFLOW', route: r });
    }
  }

  // 2. Pricing Toggle Test (Monthly vs Annual)
  await page.goto(`${BASE_URL}/#/pricing`, { waitUntil: 'networkidle' });
  const billingToggle = page.locator('button:has-text("Monthly"), button:has-text("Billed Monthly")').first();
  if (await billingToggle.isVisible()) {
    await billingToggle.click();
    await page.waitForTimeout(200);
  }

  // 3. Checkout Plan Loading
  await page.goto(`${BASE_URL}/#/checkout?plan=pro&cycle=monthly`, { waitUntil: 'networkidle' });
  const checkoutTitle = await page.evaluate(() => document.body.innerText.includes('Checkout') || document.body.innerText.includes('Subscription') || document.body.innerText.includes('Order'));
  if (!checkoutTitle) {
    issues.push({ type: 'CHECKOUT_PAGE_ISSUE', msg: 'Checkout page failed to display subscription details' });
  }

  await browser.close();

  console.log('DEEP SCAN RESULTS:');
  console.log('Issues found:', issues.length);
  console.log(JSON.stringify(issues, null, 2));
}

deepScan().catch(console.error);
