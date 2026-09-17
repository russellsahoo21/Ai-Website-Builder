import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });

  const nameInput = page.locator('input[placeholder*="Name"], input[name="fullName"], input[type="text"]').first();
  if (await nameInput.isVisible()) await nameInput.fill("Russell Test");

  const emailInput = page.locator('input[placeholder*="Email"], input[name="email"], input[type="email"]').first();
  if (await emailInput.isVisible()) await emailInput.fill("test@aethercraft.dev");

  const payBtn = page.locator('button:has-text("Razorpay"), button:has-text("Proceed"), button:has-text("Pay")').first();
  await payBtn.click();
  await page.waitForTimeout(6000);

  const screenshotPath = "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\razorpay_modal.png";
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log("Screenshot saved to:", screenshotPath);

  await browser.close();
}

run().catch(console.error);
