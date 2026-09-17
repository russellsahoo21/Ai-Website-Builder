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
  await page.waitForTimeout(4000);

  const frame = page.frameLocator('iframe.razorpay-checkout-frame, iframe[src*="razorpay.com"]').first();

  // Mobile fill if needed
  const phoneInput = frame.locator('input[placeholder*="Mobile"], input[type="tel"]').first();
  if (await phoneInput.isVisible()) {
    await phoneInput.fill("9820098200");
    await page.waitForTimeout(500);
    const continueBtn = frame.locator('button:has-text("Continue")').first();
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Click Cards
  console.log("Selecting Cards option...");
  const cardsOption = frame.locator('text="Cards"').first();
  await cardsOption.click();
  await page.waitForTimeout(2000);

  await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_cards.png" });
  console.log("Cards screenshot saved.");

  await browser.close();
}

run().catch(console.error);
