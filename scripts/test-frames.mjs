import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on("console", msg => console.log("[BROWSER CONSOLE]", msg.type(), msg.text()));

  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });
  await page.locator('input[placeholder*="Russell Sahoo"]').fill("Russell Sahoo");
  await page.locator('input[placeholder*="company.com"]').fill("russellsahoo24@gmail.com");

  const payBtn = page.locator('button:has-text("Razorpay"), button:has-text("Proceed"), button:has-text("Pay")').first();
  await payBtn.click();
  await page.waitForTimeout(4000);

  console.log("Frames count:", page.frames().length);
  for (let i = 0; i < page.frames().length; i++) {
    const f = page.frames()[i];
    console.log(`Frame ${i}: ${f.name()} | ${f.url()}`);
  }

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

  // Let's test UPI option! UPI in Razorpay test mode allows entering `success@razorpay` VPA and immediately captures payment!
  console.log("Looking for UPI option...");
  const upiBtn = rzpFrame.locator('text="UPI"').first();
  if (await upiBtn.isVisible()) {
    console.log("UPI button is visible. Clicking UPI...");
    await upiBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_upi_screen.png" });

    // Look for UPI ID / VPA field or QR code
    const vpaInput = rzpFrame.locator('input[placeholder*="UPI ID"], input[placeholder*="VPA"], input[name*="vpa"]').first();
    if (await vpaInput.isVisible()) {
      console.log("Filling success@razorpay VPA...");
      await vpaInput.fill("success@razorpay");
      await page.waitForTimeout(500);
      const payNow = rzpFrame.locator('button:has-text("Pay"), button:has-text("Verify")').first();
      await payNow.click();
      console.log("Clicked Pay with success@razorpay VPA!");
      await page.waitForTimeout(8000);
    } else {
      console.log("VPA input not found directly, let's log all inputs and buttons in frame");
      const inputs = await rzpFrame.locator('input').all();
      for (const inp of inputs) {
        console.log("Input:", await inp.getAttribute("placeholder"), await inp.getAttribute("name"));
      }
      const buttons = await rzpFrame.locator('button, div[role="button"]').all();
      for (const btn of buttons) {
        console.log("Button/Role:", (await btn.innerText()).slice(0, 30));
      }
    }
  }

  await page.waitForTimeout(4000);
  await page.screenshot({ path: "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_upi_after.png" });

  await browser.close();
}

run().catch(console.error);
