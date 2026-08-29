const { chromium } = require('playwright-core');

async function debugHydration() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  let ssrHtml = '';
  page.on('response', async (res) => {
    if (res.url().includes('/admin') && res.request().resourceType() === 'document') {
      try {
        ssrHtml = await res.text();
      } catch (e) {}
    }
  });

  page.on('console', (msg) => {
    console.log(`[Console ${msg.type()}]:`, msg.text());
  });

  page.on('pageerror', (err) => {
    console.log('[PageError Stack]:', err.stack || err.message);
  });

  console.log('Navigating to https://crazycapital.in/admin ...');
  await page.goto('https://crazycapital.in/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const clientHtml = await page.content();
  console.log('SSR HTML length:', ssrHtml.length, 'Client HTML length:', clientHtml.length);
  
  // Find difference in text content
  const fs = require('fs');
  fs.writeFileSync('scripts/ssr.html', ssrHtml);
  fs.writeFileSync('scripts/client.html', clientHtml);
  console.log('Saved ssr.html and client.html for comparison');

  await browser.close();
}

debugHydration().catch(console.error);
