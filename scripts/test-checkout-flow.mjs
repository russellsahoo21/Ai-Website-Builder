import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  page.on("console", msg => console.log(`[Browser Console ${msg.type()}]:`, msg.text()));

  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });

  const nameInput = page.locator('input[placeholder*="Name"], input[name="fullName"], input[type="text"]').first();
  if (await nameInput.isVisible()) await nameInput.fill("Russell Sahoo");

  const emailInput = page.locator('input[placeholder*="Email"], input[name="email"], input[type="email"]').first();
  if (await emailInput.isVisible()) await emailInput.fill("russellsahoo24@gmail.com");

  const payBtn = page.locator('button:has-text("Razorpay"), button:has-text("Proceed"), button:has-text("Pay")').first();
  await payBtn.click();
  await page.waitForTimeout(5000);

  const frame = page.frameLocator('iframe.razorpay-checkout-frame, iframe[src*="razorpay.com"]').first();

  console.log("Looking for phone input in Razorpay modal...");
  const phoneInput = frame.locator('input[type="tel"], input[name="contact"], input[placeholder*="Mobile"], input[placeholder*="number"]').first();
  if (await phoneInput.isVisible({ timeout: 5000 })) {
    console.log("Entering test phone number...");
    await phoneInput.fill("9876543210");
    await page.waitForTimeout(1000);

    const continueBtn = frame.locator('button:has-text("Continue"), button:has-text("Proceed"), button[type="submit"]').first();
    if (await continueBtn.isVisible()) {
      console.log("Clicking Continue in contact details...");
      await continueBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  // Save screenshot of payment methods view
  await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_methods.png" });
  console.log("Methods screenshot saved.");

  await browser.close();
}

run().catch(console.error);
