const { chromium } = require('playwright');

async function testFrontend() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Take screenshot of landing
  await page.screenshot({ path: '/tmp/landing.png' });
  console.log('✔ Landing screenshot taken');

  // Click Login
  await page.click('button:has-text("Log in")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/login.png' });
  console.log('✔ Login screen screenshot taken');

  // Submit Login
  await page.fill('input[placeholder="Seu login global ou email"]', 'admin');
  await page.fill('input[placeholder="••••••••"]', '123456');
  await page.click('button:has-text("Logar")');
  await page.waitForTimeout(1000);

  // Take screenshot of Main Dashboard / Clientes
  await page.screenshot({ path: '/tmp/main_system.png' });
  console.log('✔ Main system screenshot taken');

  await browser.close();
}

testFrontend().catch(console.error);
