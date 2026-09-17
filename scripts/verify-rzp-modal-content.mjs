import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  const page = await browser.newPage();
  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });

  const nameInput = page.locator('input[placeholder*="Name"], input[name="fullName"], input[type="text"]').first();
  if (await nameInput.isVisible()) await nameInput.fill("Russell Test");

  const emailInput = page.locator('input[placeholder*="Email"], input[name="email"], input[type="email"]').first();
  if (await emailInput.isVisible()) await emailInput.fill("test@aethercraft.dev");

  const payBtn = page.locator('button:has-text("Razorpay"), button:has-text("Proceed"), button:has-text("Pay")').first();
  await payBtn.click();
  await page.waitForTimeout(5000);

  const frame = page.frameLocator('iframe.razorpay-checkout-frame, iframe[src*="razorpay.com"]').first();
  const bodyText = await frame.locator("body").innerText();
  console.log("\n=============================================");
  console.log("    Razorpay Modal Body Text Inside Frame    ");
  console.log("=============================================");
  console.log(bodyText.substring(0, 500));

  await browser.close();
}

run().catch(console.error);
