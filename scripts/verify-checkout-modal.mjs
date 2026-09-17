import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  const page = await browser.newPage();
  
  // Hook Razorpay property setter before page scripts load
  await page.addInitScript(() => {
    let _rzp = undefined;
    Object.defineProperty(window, "Razorpay", {
      configurable: true,
      get() {
        return _rzp;
      },
      set(val) {
        _rzp = function(options) {
          window.__razorpay_captured_options = {
            key: options.key,
            amount: options.amount,
            currency: options.currency,
            name: options.name,
            description: options.description,
            prefill: options.prefill,
            notes: options.notes,
            theme: options.theme,
            hasHandler: typeof options.handler === "function"
          };
          return new val(options);
        };
        _rzp.prototype = val.prototype;
      }
    });
  });

  console.log("Navigating to http://localhost:3000/checkout ...");
  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });

  // Fill in required fields
  const nameInput = page.locator('input[placeholder*="Name"], input[name="fullName"], input[type="text"]').first();
  if (await nameInput.isVisible()) {
    await nameInput.fill("Russell Test");
  }

  const emailInput = page.locator('input[placeholder*="Email"], input[name="email"], input[type="email"]').first();
  if (await emailInput.isVisible()) {
    await emailInput.fill("test@aethercraft.dev");
  }

  // Click Pay button
  const payBtn = page.locator('button:has-text("Razorpay"), button:has-text("Proceed"), button:has-text("Pay")').first();
  await payBtn.click();
  await page.waitForTimeout(3000);

  const captured = await page.evaluate(() => window.__razorpay_captured_options);
  console.log("\n=======================================================");
  console.log("       CAPTURED RAZORPAY CHECKOUT OPTIONS              ");
  console.log("=======================================================");
  console.log("Razorpay Key ID:", captured?.key);
  console.log("Key Starts with rzp_test_:", captured?.key?.startsWith("rzp_test_"));
  console.log("Amount (in paise):", captured?.amount);
  console.log("Currency:", captured?.currency);
  console.log("Plan Name:", captured?.description);
  console.log("Notes object:", JSON.stringify(captured?.notes, null, 2));
  console.log("Handler callback present:", captured?.hasHandler);

  const iframeCount = await page.locator('iframe[src*="razorpay.com"], iframe.razorpay-checkout-frame').count();
  console.log("Actual Razorpay Modal iframe count:", iframeCount);

  // Check iframe URL
  if (iframeCount > 0) {
    const iframeSrc = await page.locator('iframe[src*="razorpay.com"], iframe.razorpay-checkout-frame').first().getAttribute("src");
    console.log("Razorpay Checkout URL:", iframeSrc?.substring(0, 60) + "...");
  }

  await browser.close();
}

run().catch(console.error);
