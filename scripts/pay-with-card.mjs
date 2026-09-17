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

  // Click Cards
  console.log("Clicking Cards...");
  await frame.locator('text="Cards"').first().click();
  await page.waitForTimeout(1500);

  // Fill Card Number
  console.log("Filling test card number...");
  const cardInput = frame.locator('input[placeholder*="Card Number"], input[name*="number"]').first();
  await cardInput.fill("4111111111111111");
  await page.waitForTimeout(500);

  // Fill Expiry
  console.log("Filling expiry...");
  const expiryInput = frame.locator('input[placeholder*="MM / YY"], input[name*="exp"]').first();
  await expiryInput.fill("1228");
  await page.waitForTimeout(500);

  // Fill CVV
  console.log("Filling CVV...");
  const cvvInput = frame.locator('input[placeholder*="CVV"], input[name*="cvv"]').first();
  await cvvInput.fill("123");
  await page.waitForTimeout(500);

  // Click Continue / Pay
  console.log("Clicking Continue in Card form...");
  const cardPayBtn = frame.locator('button:has-text("Continue"), button:has-text("Pay")').first();
  await cardPayBtn.click();
  await page.waitForTimeout(4000);

  await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_tokenization_prompt.png" });
  console.log("Tokenization prompt screenshot saved.");

  // Click "Maybe later" if visible
  const maybeLaterBtn = frame.locator('button:has-text("Maybe later")').first();
  if (await maybeLaterBtn.isVisible({ timeout: 5000 })) {
    console.log("Clicking 'Maybe later' on RBI card save prompt...");
    await maybeLaterBtn.click();
    await page.waitForTimeout(3000);
  }

  // Check for any popup window (some bank OTP pages open in popups)
  const popupPromise = context.waitForEvent("page", { timeout: 10000 }).catch(() => null);

  // Take screenshot of OTP state
  await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_otp_screen.png" });
  console.log("OTP/Simulator screen screenshot saved.");

  const popup = await popupPromise;
  if (popup) {
    console.log("Popup detected:", popup.url());
    await popup.waitForLoadState("networkidle");
    await popup.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_bank_popup.png" });
    const successBtn = popup.locator('button:has-text("Success"), input[value="Success"], a:has-text("Success")').first();
    if (await successBtn.isVisible({ timeout: 5000 })) {
      console.log("Clicking Success button in popup...");
      await successBtn.click();
      await page.waitForTimeout(5000);
    }
  } else {
    console.log("No popup; checking for Success button in main frame or nested iframes...");
    // Check main frame first
    const successBtn = frame.locator('button:has-text("Success"), input[value="Success"], button.btn-success').first();
    if (await successBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("Clicking Success button in Razorpay frame!");
      await successBtn.click();
      await page.waitForTimeout(5000);
    } else {
      // Check sub-iframes (like 3ds / bank iframe inside razorpay frame)
      for (const childFrame of frame.childFrames ? frame.childFrames() : []) {
        console.log("Found child frame:", childFrame.url());
        const childSuccess = childFrame.locator('button:has-text("Success"), input[value="Success"]').first();
        if (await childSuccess.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log("Found Success button in child frame! Clicking...");
          await childSuccess.click();
          await page.waitForTimeout(5000);
          break;
        }
      }
    }
  }

  // Also check top-level page in case Razorpay redirected the main window
  const topSuccess = page.locator('button:has-text("Success"), input[value="Success"]').first();
  if (await topSuccess.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log("Found Success button on top-level page! Clicking...");
    await topSuccess.click();
    await page.waitForTimeout(5000);
  }

  await page.waitForTimeout(6000);
  await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_final_success.png" });
  console.log("Final screenshot saved.");

  await browser.close();
}

run().catch(console.error);
