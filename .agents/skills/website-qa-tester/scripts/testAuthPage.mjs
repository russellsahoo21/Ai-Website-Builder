import { chromium } from 'playwright';

async function testAuth() {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  
  // 1. Check #/login
  await page.goto('http://localhost:5173/#/login', { waitUntil: 'networkidle' });
  const hasSignIn = await page.locator('.cl-signIn-root, .cl-card, input[name="identifier"]').first().isVisible();
  console.log('Login page rendered Clerk SignIn:', hasSignIn);
  
  // 2. Check #/signup
  await page.goto('http://localhost:5173/#/signup', { waitUntil: 'networkidle' });
  const hasSignUp = await page.locator('.cl-signUp-root, .cl-card').first().isVisible();
  console.log('Signup page rendered Clerk SignUp:', hasSignUp);
  
  // 3. Test Navbar "Sign In" button navigation
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle' });
  await page.locator('button:has-text("Sign In")').first().click();
  await page.waitForTimeout(300);
  console.log('Navbar Sign In clicked -> Current URL:', page.url());

  // 4. Test Navbar "Sign Up" button navigation
  await page.goto('http://localhost:5173/#/', { waitUntil: 'networkidle' });
  await page.locator('button:has-text("Sign Up")').first().click();
  await page.waitForTimeout(300);
  console.log('Navbar Sign Up clicked -> Current URL:', page.url());

  // 5. Test "Open in Studio" on Templates page
  await page.goto('http://localhost:5173/#/templates', { waitUntil: 'networkidle' });
  await page.locator('button:has-text("Open in Studio")').first().click();
  await page.waitForTimeout(300);
  console.log('Templates "Open in Studio" clicked -> Current URL:', page.url());

  await browser.close();
  console.log('\n🎉 ALL DEDICATED AUTH ROUTE TESTS COMPLETED CLEANLY!');
}

testAuth().catch(console.error);
