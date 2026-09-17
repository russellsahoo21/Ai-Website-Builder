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
  await page.locator('input[placeholder*="98765"]').fill("9999999999");

  const payBtn = page.locator('button:has-text("Razorpay"), button:has-text("Proceed"), button:has-text("Pay")').first();
  await payBtn.click();
  await page.waitForTimeout(6000);

  const screenshotPath = "C:\\Users\\RUSSELL\\.gemini\\antigravity\\brain\\5d85e45d-e1d2-4482-8c20-c327c7903673\\rzp_prefilled.png";
  await page.screenshot({ path: screenshotPath });
  console.log("Screenshot saved to:", screenshotPath);

  await browser.close();
}

run().catch(console.error);
