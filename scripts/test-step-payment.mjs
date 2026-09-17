import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });

  await page.locator('input[placeholder*="Russell Sahoo"]').fill("Russell Sahoo");
  await page.locator('input[placeholder*="company.com"]').fill("russellsahoo24@gmail.com");

  const payBtn = page.locator('button:has-text("Razorpay"), button:has-text("Proceed"), button:has-text("Pay")').first();
  await payBtn.click();
  await page.waitForTimeout(5000);

  const frame = page.frameLocator('iframe.razorpay-checkout-frame, iframe[src*="razorpay.com"]').first();

  // Try closing the contact details sub-popup
  const closeContactBtn = frame.locator('button[aria-label="Close"], button:has(svg.close), button.close-button, div[role="dialog"] button').first();
  if (await closeContactBtn.isVisible()) {
    console.log("Closing contact details dialog...");
    await closeContactBtn.click();
    await page.waitForTimeout(1000);
  }

  // If still visible, enter phone 9820098200 and click continue
  const phoneInput = frame.locator('input[placeholder*="Mobile"], input[type="tel"]').first();
  if (await phoneInput.isVisible()) {
    console.log("Filling mobile number...");
    await phoneInput.fill("9820098200");
    await page.waitForTimeout(500);
    const continueBtn = frame.locator('button:has-text("Continue")').first();
    if (await continueBtn.isVisible()) {
      console.log("Clicking Continue...");
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  const screenshotPath = "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_payment_options.png";
  await page.screenshot({ path: screenshotPath });
  console.log("Screenshot saved:", screenshotPath);

  await browser.close();
}

run().catch(console.error);
