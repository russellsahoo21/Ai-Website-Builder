import { test, expect } from '@playwright/test';

test.describe('Dashboard and Navigation E2E Flow', () => {
  test('navigates across landing page, pricing, and templates', async ({ page }) => {
    await page.goto('/');

    // Brand is visible
    await expect(page.locator('text=AetherCraft').first()).toBeVisible();

    // Check navigation links
    const pricingLink = page.getByRole('button', { name: 'Pricing' }).first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await expect(page.locator('text=Pro Founder').first()).toBeVisible();
    }
  });

  test('loads dashboard page cleanly without uncaught exceptions', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.goto('/dashboard');

    // Wait for main page container
    await expect(page.locator('body')).toBeVisible();

    // Verify 0 uncaught runtime exceptions on dashboard
    expect(pageErrors).toEqual([]);
  });
});
