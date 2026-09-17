import { test, expect } from '@playwright/test';

test.describe('Checkout Page E2E User Journey', () => {
  test('loads checkout page with Pro Founder plan and toggles annual/monthly pricing', async ({ page }) => {
    // Navigate to checkout with pro plan
    await page.goto('/checkout?plan=pro');

    // Verify title and plan details
    await expect(page.locator('text=AetherCraft Checkout').first()).toBeVisible();
    await expect(page.locator('text=Pro Founder').first()).toBeVisible();

    // Default annual billing in INR
    await expect(page.locator('text=₹15,588').first()).toBeVisible();

    // Toggle to Monthly billing
    const monthlyBtn = page.getByRole('button', { name: /^monthly/i });
    await monthlyBtn.click();

    // Pricing updates to monthly
    await expect(page.locator('text=₹1,599').first()).toBeVisible();

    // Verify billing form fields exist
    await expect(page.getByPlaceholder(/russell sahoo/i)).toBeVisible();
    await expect(page.getByPlaceholder(/name@company\.com/i)).toBeVisible();
  });

  test('applies promo discount code LAUNCH20', async ({ page }) => {
    await page.goto('/checkout?plan=pro');

    const promoInput = page.getByPlaceholder(/launch20/i);
    await promoInput.fill('LAUNCH20');

    const applyBtn = page.getByRole('button', { name: /apply/i });
    await applyBtn.click();

    // Verify promo discount applied confirmation
    await expect(page.locator('text=applied (20% OFF)')).toBeVisible();
  });
});
