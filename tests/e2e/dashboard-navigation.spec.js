import { test, expect } from '@playwright/test';

test.describe('Dashboard and Marketing Navigation E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock session so user is recognized and avoids redirects
    await page.addInitScript(() => {
      localStorage.setItem('aethercraft_auth_session', JSON.stringify({
        id: 'usr_e2e_test',
        email: 'tester@aethercraft.dev',
        name: 'E2E Tester'
      }));
    });
  });

  test('navigates to all marketing routes from header navigation buttons', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/');

    // Brand is visible
    await expect(page.locator('text=AetherCraft').first()).toBeVisible();

    const marketingLinks = [
      { name: 'Templates', urlPattern: /\/templates/, expectedText: 'Template Explorer' },
      { name: 'Showcase', urlPattern: /\/showcase/, expectedText: 'Built with AetherCraft' },
      { name: 'Integrations', urlPattern: /\/integrations/, expectedText: 'Platform Integrations' },
      { name: 'Changelog', urlPattern: /\/changelog/, expectedText: 'Product Changelog' },
      { name: 'Pricing', urlPattern: /\/pricing/, expectedText: 'Pro Founder' },
      { name: 'Docs', urlPattern: /\/docs/, expectedText: 'Docs AI' },
      { name: 'Feedback', urlPattern: /\/feedback/, expectedText: 'Report a Bug or Feedback' }
    ];

    for (const item of marketingLinks) {
      // Start from root if not already there
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('text=AetherCraft').first()).toBeVisible();

      // Click link in header
      const link = page.getByRole('button', { name: item.name, exact: true }).first();
      await expect(link).toBeVisible();
      await link.click();

      // Verify route change
      await expect(page).toHaveURL(item.urlPattern, { timeout: 15000 });
      // Verify page content renders
      await expect(page.getByText(item.expectedText).first()).toBeVisible({ timeout: 15000 });
    }

  });

  test('loads dashboard page cleanly with synchronized token metrics and zero uncaught exceptions', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/dashboard');

    // Wait for main page container
    await expect(page.locator('body')).toBeVisible();

    // Verify token quota elements render in sidebar and widget
    await expect(page.locator('text=AI Tokens / Mo').first()).toBeVisible();

    // Verify 0 uncaught runtime exceptions on dashboard
    expect(pageErrors).toEqual([]);
  });
});

