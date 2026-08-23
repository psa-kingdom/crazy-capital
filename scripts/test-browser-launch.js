const { chromium } = require('playwright-core');

async function testLaunch() {
  console.log('Testing Playwright launch with local Google Chrome...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });
  console.log('Browser launched successfully! Version:', browser.version());
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setContent('<html><body><h1>Crazy Capital Browser Automation Active</h1></body></html>');
  const title = await page.evaluate(() => document.querySelector('h1').innerText);
  console.log('Page evaluated heading:', title);
  await browser.close();
  console.log('Browser closed cleanly. Local Chrome integration VERIFIED!');
}

testLaunch().catch((err) => {
  console.error('Launch test failed:', err);
  process.exit(1);
});
