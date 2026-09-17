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
  await page.waitForTimeout(3000);

  const iframe = page.locator('iframe[src*="razorpay.com"], iframe.razorpay-checkout-frame').first();
  const src = await iframe.getAttribute("src");
  console.log("Full Razorpay iframe src:", src);

  const url = new URL(src);
  console.log("\n=============================================");
  console.log("    Verified Razorpay Modal Query Params     ");
  console.log("=============================================");
  console.log("key_id:", url.searchParams.get("key"));
  console.log("name:", url.searchParams.get("name"));
  console.log("description:", url.searchParams.get("description"));
  console.log("amount:", url.searchParams.get("amount"));
  console.log("currency:", url.searchParams.get("currency"));
  console.log("notes[plan_id]:", url.searchParams.get("notes[plan_id]"));
  console.log("notes[billing_cycle]:", url.searchParams.get("notes[billing_cycle]"));
  console.log("notes[user_id]:", url.searchParams.get("notes[user_id]"));

  await browser.close();
}

run().catch(console.error);
