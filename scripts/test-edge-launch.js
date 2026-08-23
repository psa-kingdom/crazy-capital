const { chromium } = require('playwright-core');

async function testLaunchEdge() {
  console.log('Testing Playwright launch with local Microsoft Edge...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });
  console.log('Edge Browser launched successfully! Version:', browser.version());
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.setContent('<html><body><h1>Crazy Capital Edge Automation Active</h1></body></html>');
  const title = await page.evaluate(() => document.querySelector('h1').innerText);
  console.log('Page evaluated heading:', title);
  await browser.close();
  console.log('Edge browser closed cleanly. Local Edge integration VERIFIED!');
}

testLaunchEdge().catch((err) => {
  console.error('Edge Launch test failed:', err);
  process.exit(1);
});
