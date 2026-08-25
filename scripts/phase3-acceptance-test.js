const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runPhase3Acceptance() {
  console.log('====================================================');
  console.log('CRAZY CAPITAL — PHASE 3 ACCEPTANCE TEST SUITE');
  console.log('Testing Slices 3.1, 3.2, 3.3, 3.4 & New Workbenches');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  const results = [];

  const checks = [
    {
      name: '1. Production Live Health & API Gateway',
      url: 'https://api.crazycapital.in/api/v1/health',
      validate: async (p, res) => {
        const text = await p.innerText('body');
        return text.includes('ok') || text.includes('healthy') || text.includes('status') || res?.status() === 200;
      },
    },
    {
      name: '2. Homepage Live Branding & SEO',
      url: 'https://crazycapital.in',
      validate: async (p) => {
        const title = await p.title();
        return title.includes('Crazy Capital') || (await p.isVisible('text=Crazy Capital'));
      },
    },
    {
      name: '3. Partner Portal V2 Interface',
      url: 'https://crazycapital.in/partner',
      validate: async (p) => {
        return (await p.isVisible('text=Partner')) || (await p.isVisible('text=Referral'));
      },
    },
    {
      name: '4. Service Catalog - Pvt Ltd Incorporation',
      url: 'https://crazycapital.in/services/pvt-ltd-incorporation',
      validate: async (p) => {
        return (await p.isVisible('text=Private Limited')) || (await p.isVisible('text=Incorporation'));
      },
    },
    {
      name: '5. Customer Self-Service Portal',
      url: 'https://crazycapital.in/customer',
      validate: async (p) => {
        return (await p.isVisible('text=Customer')) || (await p.isVisible('text=Application'));
      },
    },
  ];

  for (const check of checks) {
    try {
      console.log(`Testing: ${check.name} (${check.url})...`);
      const response = await page.goto(check.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const passed = await check.validate(page, response);

      if (passed) {
        console.log(`  ✓ PASS: ${check.name}`);
        results.push({ name: check.name, status: 'PASS' });
      } else {
        console.log(`  ✗ FAIL: Validation check failed for ${check.name}`);
        results.push({ name: check.name, status: 'FAIL' });
      }
    } catch (err) {
      console.log(`  ✗ ERROR on ${check.name}: ${err.message}`);
      results.push({ name: check.name, status: 'ERROR', error: err.message });
    }
  }

  await browser.close();

  console.log('\n====================================================');
  console.log(`Acceptance Summary: ${results.filter(r => r.status === 'PASS').length}/${results.length} checks passed.`);
  console.log('====================================================');
}

runPhase3Acceptance().catch(console.error);
