import { chromium } from "playwright";

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: true
  });

  const page = await browser.newPage();
  
  // Collect postMessage events
  await page.addInitScript(() => {
    window.__posted_messages = [];
    const origPostMessage = Window.prototype.postMessage;
    window.addEventListener("message", (ev) => {
      try {
        const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
        window.__posted_messages.push(data);
      } catch (e) {
        window.__posted_messages.push(ev.data);
      }
    });
  });

  // Track network requests to razorpay.com
  const rzpRequests = [];
  page.on("request", req => {
    if (req.url().includes("razorpay.com")) {
      rzpRequests.push({ url: req.url(), method: req.method(), postData: req.postData() });
    }
  });

  await page.goto("http://localhost:3000/checkout", { waitUntil: "networkidle" });

  const nameInput = page.locator('input[placeholder*="Name"], input[name="fullName"], input[type="text"]').first();
  if (await nameInput.isVisible()) await nameInput.fill("Russell Test");

  const emailInput = page.locator('input[placeholder*="Email"], input[name="email"], input[type="email"]').first();
  if (await emailInput.isVisible()) await emailInput.fill("test@aethercraft.dev");

  const payBtn = page.locator('button:has-text("Razorpay"), button:has-text("Proceed"), button:has-text("Pay")').first();
  await payBtn.click();
  await page.waitForTimeout(4000);

  console.log("Network requests to Razorpay:", rzpRequests.length);
  for (const req of rzpRequests) {
    if (req.postData) {
      console.log("POST request to:", req.url.substring(0, 70));
      console.log("Payload:", req.postData.substring(0, 200));
    }
  }

  const posted = await page.evaluate(() => window.__posted_messages);
  console.log("Posted messages count:", posted.length);
  const relevant = posted.filter(m => m && (m.key || m.options || m.amount || (m.data && m.data.options)));
  console.log("Relevant postMessages:", JSON.stringify(relevant, null, 2));

  await browser.close();
}

run().catch(console.error);
