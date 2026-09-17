import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

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

  // Click Netbanking
  console.log("Selecting Netbanking...");
  const netbankingOption = frame.locator('text="Netbanking"').first();
  await netbankingOption.click();
  await page.waitForTimeout(1500);

  // Select Bank of Baroda
  console.log("Selecting Bank of Baroda...");
  const bankOption = frame.locator('text="Bank of Baroda"').first();
  await bankOption.click();
  await page.waitForTimeout(1500);

  // Look for Pay button in modal
  const payNowBtn = frame.locator('button:has-text("Pay"), button:has-text("Proceed")').first();
  console.log("Pay Now button in frame visible:", await payNowBtn.isVisible());

  // Listen for popup page
  const popupPromise = context.waitForEvent("page", { timeout: 15000 }).catch(() => null);

  if (await payNowBtn.isVisible()) {
    console.log("Clicking Pay Now button inside Razorpay modal...");
    await payNowBtn.click();
  }

  const popup = await popupPromise;
  if (popup) {
    console.log("Popup window detected! URL:", popup.url());
    await popup.waitForLoadState("networkidle");
    console.log("Popup page loaded:", await popup.title());
    await popup.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_bank_popup.png" });

    // Look for Success button in popup
    const successBtn = popup.locator('button:has-text("Success"), input[value="Success"], a:has-text("Success")').first();
    if (await successBtn.isVisible({ timeout: 5000 })) {
      console.log("Clicking SUCCESS button in Razorpay test simulator!");
      await successBtn.click();
      await page.waitForTimeout(5000);
    }
  } else {
    console.log("No external popup; checking if authorization happened in-frame or current page...");
  }

  await page.waitForTimeout(6000);
  await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_after_payment.png" });
  console.log("After-payment screenshot saved.");

  await browser.close();
}

run().catch(console.error);
