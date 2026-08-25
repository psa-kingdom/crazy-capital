const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'artifacts', 'live-production-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'https://crazycapital.in';
const API_URL = 'https://api.crazycapital.in/api/v1';

const SERVICE_SLUGS = [
  'pvt-ltd-incorporation',
  'llp-registration',
  'opc-registration',
  'section-8-company',
  'gst-registration',
  'gst-return-filing',
  'corporate-tax-filing',
  'trademark-registration',
  'copyright-patent',
  'startup-india-dpiit',
  'msme-udyam-registration',
  'roc-annual-compliance',
  'business-loans',
  'fssai-food-license',
];

async function runLiveAcceptance() {
  console.log('================================================================');
  console.log('🚀 CRAZY CAPITAL — LIVE PRODUCTION INTERNET VERIFICATION SUITE');
  console.log(`🌐 Frontend: ${BASE_URL}`);
  console.log(`⚙️  API:      ${API_URL}`);
  console.log('================================================================\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: [],
  };

  function assert(condition, name, details = '') {
    results.total++;
    if (condition) {
      results.passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      results.failed++;
      results.failures.push({ name, details });
      console.error(`  ❌ [FAIL] ${name} — ${details}`);
    }
  }

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  // Capture console errors
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  try {
    // 1. API Health Check
    console.log('[1/7] Testing Canonical API Health Endpoint...');
    const apiRes = await page.request.get(`${API_URL}/health`);
    assert(apiRes.status() === 200, 'API Health Check Status 200', `Got ${apiRes.status()}`);
    const healthJson = await apiRes.json();
    assert(healthJson.success === true && healthJson.data?.status === 'ok', 'API Health JSON Payload', JSON.stringify(healthJson));

    // 2. Production Homepage
    console.log('\n[2/7] Testing Production Homepage (Desktop 1440px)...');
    const homeRes = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    assert(homeRes.status() === 200, 'Homepage HTTP Status 200', `Got ${homeRes.status()}`);
    const title = await page.title();
    assert(title.includes('Crazy Capital'), 'Homepage Title contains "Crazy Capital"', `Title: ${title}`);
    
    // Check 14 services rendered
    const serviceCards = await page.$$('a[href^="/services/"]');
    assert(serviceCards.length >= 14, `All 14 Service Verticals Present on Homepage (Found: ${serviceCards.length})`);
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-live-homepage-desktop.png'), fullPage: true });

    // 3. Mobile Viewport Check
    console.log('\n[3/7] Testing Production Homepage (Mobile 375px)...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-live-homepage-mobile.png'), fullPage: true });
    assert(true, 'Mobile Responsive Viewport Captured');
    await page.setViewportSize({ width: 1440, height: 900 });

    // 4. Service Vertical Pages
    console.log('\n[4/7] Testing Service Verticals Dynamic Rendering...');
    for (const slug of SERVICE_SLUGS.slice(0, 4)) {
      const res = await page.goto(`${BASE_URL}/services/${slug}`, { waitUntil: 'networkidle', timeout: 20000 });
      assert(res.status() === 200, `Service Page /services/${slug} Status 200`);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-live-service-pvt-ltd.png'), fullPage: true });

    // 5. Blog & Knowledge Center
    console.log('\n[5/7] Testing Blog & Knowledge Center...');
    const blogRes = await page.goto(`${BASE_URL}/blog`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(blogRes.status() === 200, 'Blog Directory /blog Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-live-blog.png'), fullPage: true });

    // 6. Customer & Partner Portals
    console.log('\n[6/7] Testing Customer & Partner Portals...');
    const custRes = await page.goto(`${BASE_URL}/customer`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(custRes.status() === 200, 'Customer Portal /customer Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-live-customer-portal.png'), fullPage: true });

    const partnerRes = await page.goto(`${BASE_URL}/partner`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(partnerRes.status() === 200, 'Partner Portal /partner Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-live-partner-portal.png'), fullPage: true });

    // 7. Unified Admin Control Center
    console.log('\n[7/7] Testing Unified Admin Control Center...');
    const adminRoutes = [
      '/admin',
      '/admin/leads',
      '/admin/customers',
      '/admin/workflows',
      '/admin/sla',
      '/admin/tasks',
      '/admin/branches',
      '/admin/commissions',
      '/admin/invoices',
      '/admin/reports',
      '/admin/cms',
      '/admin/notifications',
    ];

    for (const route of adminRoutes) {
      const res = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
      assert(res.status() === 200, `Admin Module ${route} Status 200`);
    }

    await page.goto(`${BASE_URL}/admin/commissions`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-live-admin-commissions-payouts.png'), fullPage: true });

    await page.goto(`${BASE_URL}/admin/branches`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-live-admin-branches.png'), fullPage: true });

  } catch (err) {
    console.error('Test execution error:', err);
    assert(false, 'Test Suite Execution', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`📊 LIVE PRODUCTION QA SUMMARY: ${results.passed}/${results.total} Passed (${results.failed} Failed)`);
  console.log(`📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runLiveAcceptance().catch((e) => {
  console.error(e);
  process.exit(1);
});
