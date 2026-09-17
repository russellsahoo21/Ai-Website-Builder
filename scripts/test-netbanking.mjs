import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on("console", msg => console.log("[PAGE LOG]", msg.type(), msg.text()));

  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });
  await page.locator('input[placeholder*="Russell Sahoo"]').fill("Russell Sahoo");
  await page.locator('input[placeholder*="company.com"]').fill("russellsahoo24@gmail.com");

  const payBtn = page.locator('button:has-text("Razorpay"), button:has-text("Proceed"), button:has-text("Pay")').first();
  await payBtn.click();
  await page.waitForTimeout(4000);

  const rzpFrame = page.frameLocator('iframe.razorpay-checkout-frame, iframe[src*="razorpay.com"]').first();

  const phoneInput = rzpFrame.locator('input[placeholder*="Mobile"], input[type="tel"]').first();
  if (await phoneInput.isVisible()) {
    await phoneInput.fill("9820098200");
    const continueBtn = rzpFrame.locator('button:has-text("Continue")').first();
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  // Click Netbanking
  console.log("Selecting Netbanking...");
  await rzpFrame.locator('text="Netbanking"').first().click();
  await page.waitForTimeout(2000);

  // Take screenshot of bank list
  await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_banks_list.png" });

  // Listen for popup page (Netbanking in Razorpay always opens bank simulator in popup or new tab)
  const popupPromise = context.waitForEvent("page", { timeout: 15000 }).catch(err => {
    console.log("Popup wait error or timeout:", err.message);
    return null;
  });

  // Click on Bank of Baroda or Punjab National Bank
  console.log("Clicking Bank of Baroda option...");
  const bankOption = rzpFrame.locator(':text("Bank of Baroda")').first();
  await bankOption.click();
  await page.waitForTimeout(2000);

  // Also look if there's a "Pay Now" or "Proceed" button that appeared
  const payNow = rzpFrame.locator('button:has-text("Pay")').first();
  if (await payNow.isVisible()) {
    console.log("Found Pay button after bank selection, clicking...");
    await payNow.click();
  }

  const popup = await popupPromise;
  if (popup) {
    console.log("POPUP OPENED! URL:", popup.url());
    await popup.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await popup.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_bank_popup.png" });
    console.log("Bank popup screenshot saved. Page title:", await popup.title());

    // In Razorpay test mode bank simulator, look for Success button
    const successBtn = popup.locator('button:has-text("Success"), input[value="Success"], a:has-text("Success"), button.btn-success, button.success').first();
    if (await successBtn.isVisible({ timeout: 5000 })) {
      console.log("Found Success button on bank simulator! Clicking...");
      await successBtn.click();
      await page.waitForTimeout(6000);
    } else {
      console.log("Success button not found immediately, checking all buttons on popup:");
      const allBtns = await popup.locator('button, input[type="submit"], input[type="button"], a').all();
      for (const b of allBtns) {
        console.log("Popup button/link:", (await b.innerText().catch(() => '')) || (await b.getAttribute('value').catch(() => '')));
      }
    }
  } else {
    console.log("No popup opened; checking if redirect occurred in main page or frame...");
    await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_no_popup_state.png" });
  }

  console.log("Waiting for checkout page to complete confirmation and render success card...");
  // Wait for the success heading or container
  try {
    await page.waitForSelector('text="Welcome to "', { timeout: 20000 });
    console.log("SUCCESS CARD DETECTED ON SCREEN!");
  } catch (e) {
    console.log("Timed out waiting for Welcome to, waiting 5 more seconds...");
    await page.waitForTimeout(5000);
  }

  await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_final_test_outcome.png" });
  console.log("Final outcome screenshot saved.");

  await browser.close();
}

run().catch(console.error);
