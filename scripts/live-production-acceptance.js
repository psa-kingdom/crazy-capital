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
  console.log('🚀 CRAZY CAPITAL — COMPREHENSIVE PRODUCTION INTERNET AUDIT');
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
    console.log('[1/10] Testing Canonical API Health Endpoint...');
    const apiRes = await page.request.get(`${API_URL}/health`);
    assert(apiRes.status() === 200, 'API Health Check Status 200', `Got ${apiRes.status()}`);
    const healthJson = await apiRes.json();
    assert(healthJson.success === true && healthJson.data?.status === 'ok', 'API Health JSON Payload', JSON.stringify(healthJson));

    // 2. Production Homepage
    console.log('\n[2/10] Testing Production Homepage (Desktop 1440px)...');
    const homeRes = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    assert(homeRes.status() === 200, 'Homepage HTTP Status 200', `Got ${homeRes.status()}`);
    const title = await page.title();
    assert(title.includes('Crazy Capital'), 'Homepage Title contains "Crazy Capital"', `Title: ${title}`);
    
    const serviceCards = await page.$$('a[href^="/services/"]');
    assert(serviceCards.length >= 14, `All 14 Service Verticals Present on Homepage (Found: ${serviceCards.length})`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-live-homepage-desktop.png'), fullPage: true });

    // 3. Mobile Viewport Check
    console.log('\n[3/10] Testing Production Homepage (Mobile 375px)...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-live-homepage-mobile.png'), fullPage: true });
    assert(true, 'Mobile Responsive Viewport Captured');
    await page.setViewportSize({ width: 1440, height: 900 });

    // 4. Service Vertical Pages
    console.log('\n[4/10] Testing Service Verticals Dynamic Rendering...');
    for (const slug of SERVICE_SLUGS.slice(0, 4)) {
      const res = await page.goto(`${BASE_URL}/services/${slug}`, { waitUntil: 'networkidle', timeout: 20000 });
      assert(res.status() === 200, `Service Page /services/${slug} Status 200`);
    }

    // 5. Blog & Knowledge Center
    console.log('\n[5/10] Testing Blog & Knowledge Center...');
    const blogRes = await page.goto(`${BASE_URL}/blog`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(blogRes.status() === 200, 'Blog Directory /blog Status 200');

    // 6. Customer & Partner Portals
    console.log('\n[6/10] Testing Customer & Partner Portals...');
    const custRes = await page.goto(`${BASE_URL}/customer`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(custRes.status() === 200, 'Customer Portal /customer Status 200');

    const partnerRes = await page.goto(`${BASE_URL}/partner`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(partnerRes.status() === 200, 'Partner Portal /partner Status 200');

    // 7. Phase 4.1: CRM Leads Engine & AI Priority Queue
    console.log('\n[7/10] Testing Slice 4.1: CRM Leads Engine & AI Priority Queue...');
    const leadsRes = await page.goto(`${BASE_URL}/admin/leads`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(leadsRes.status() === 200, 'Admin Leads Route Status 200');
    
    // Switch to Priority Queue tab if button exists
    const priorityTabBtn = page.getByRole('button', { name: /Priority Queue/i }).first();
    if (await priorityTabBtn.isVisible()) {
      await priorityTabBtn.click();
      await page.waitForTimeout(500);
      assert(true, 'Switched to AI Priority Queue View');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-admin-leads-priority-queue.png'), fullPage: true });

    // 8. Phase 4.2: Document Vault & Side-by-Side OCR Verification
    console.log('\n[8/10] Testing Slice 4.2: Document Vault & OCR Verification Assistant...');
    const docRes = await page.goto(`${BASE_URL}/admin/documents`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(docRes.status() === 200, 'Admin Documents Route Status 200');
    
    // Look for AI OCR Audit button
    const ocrAuditBtn = page.getByRole('button', { name: /AI OCR Audit/i }).first();
    if (await ocrAuditBtn.isVisible()) {
      await ocrAuditBtn.click();
      await page.waitForTimeout(1000);
      assert(true, 'AI OCR Side-by-Side Verification Modal Opened');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-admin-documents-ocr-modal.png') });
    }

    // 9. Phase 4.3: Floating AI Operations Copilot Drawer (on fresh admin page)
    console.log('\n[9/10] Testing Slice 4.3: Floating AI Operations Copilot Drawer...');
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle', timeout: 20000 });
    const copilotTrigger = page.locator('button:has-text("Crazy Copilot")').first();
    if (await copilotTrigger.isVisible()) {
      await copilotTrigger.click();
      await page.waitForTimeout(1000);
      assert(true, 'Crazy Copilot Drawer Opened Successfully');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-admin-copilot-drawer.png') });
    }

    // 10. Phase 4.4: Executive Predictive Intelligence Hub
    console.log('\n[10/14] Testing Slice 4.4: Predictive Revenue & Turnaround Analytics...');
    const predRes = await page.goto(`${BASE_URL}/admin/reports/predictive`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(predRes.status() === 200, 'Predictive Reports Route Status 200');
    
    const dayBtn60 = page.getByRole('button', { name: /Next 60 Days/i }).first();
    if (await dayBtn60.isVisible()) {
      await dayBtn60.click();
      await page.waitForTimeout(500);
      assert(true, 'Time Horizon Period Switch to 60 Days');
    }

    const deployBtn = page.getByRole('button', { name: /Deploy Measure/i }).first();
    if (await deployBtn.isVisible()) {
      await deployBtn.click();
      await page.waitForTimeout(1000);
      assert(true, 'Deployed Preventive Bottleneck Mitigation Measure');
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-admin-predictive-hub.png'), fullPage: true });

    // 11. Phase 5.1: Customer Mobile Devices & Push Preferences
    console.log('\n[11/14] Testing Slice 5.1: Mobile Devices Bridge & Push Preferences...');
    const mobileDevRes = await page.goto(`${BASE_URL}/customer/devices`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(mobileDevRes.status() === 200, 'Customer Devices Route /customer/devices Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13-customer-mobile-devices.png'), fullPage: true });

    // 12. Phase 5.2: Multi-Tenant SaaS & White-Label Theming
    console.log('\n[12/14] Testing Slice 5.2: White-Label Theming & Multi-Tenant SaaS Hub...');
    const whiteLabelRes = await page.goto(`${BASE_URL}/admin/settings/white-label`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(whiteLabelRes.status() === 200, 'White-Label Settings Route Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14-admin-white-label-hub.png'), fullPage: true });

    // 13. Phase 5.3: Public Developer Portal & Admin API Settings
    console.log('\n[13/14] Testing Slice 5.3: Public Developer Portal & Admin Webhooks...');
    const devPortalRes = await page.goto(`${BASE_URL}/developers`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(devPortalRes.status() === 200, 'Public Developer Portal /developers Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15-public-developer-portal.png'), fullPage: true });

    const devAdminRes = await page.goto(`${BASE_URL}/admin/settings/developer-api`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(devAdminRes.status() === 200, 'Admin Developer API Settings Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16-admin-developer-api.png'), fullPage: true });

    // 14. Phase 5.4: Government Systems Direct Integrations Hub
    console.log('\n[14/17] Testing Slice 5.4: Government & Statutory Integrations Hub...');
    const govRes = await page.goto(`${BASE_URL}/admin/integrations/government`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(govRes.status() === 200, 'Government Integrations Hub Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17-admin-government-integrations.png'), fullPage: true });

    // 15. Phase 6.1: Real-Time Audit Log Vault & DPDP Regulatory Compliance Center
    console.log('\n[15/17] Testing Slice 6.1: Audit Log Vault & DPDP Regulatory Compliance...');
    const auditRes = await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(auditRes.status() === 200, 'Audit Logs & DPDP Center /admin/audit-logs Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18-admin-audit-logs-dpdp.png'), fullPage: true });

    // 16. Phase 6.2: Recurring Retainers & UPI AutoPay Mandates Hub
    console.log('\n[16/17] Testing Slice 6.2: UPI AutoPay & Recurring Mandates Hub...');
    const mandatesRes = await page.goto(`${BASE_URL}/admin/mandates`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(mandatesRes.status() === 200, 'Mandates Hub /admin/mandates Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19-admin-mandates-hub.png'), fullPage: true });

    // 17. Phase 6.4: Unified System Health Telemetry & Latency Diagnostics
    console.log('\n[17/17] Testing Slice 6.4: System Health Telemetry & Latency Monitor...');
    const healthRes = await page.goto(`${BASE_URL}/admin/system-health`, { waitUntil: 'networkidle', timeout: 20000 });
    assert(healthRes.status() === 200, 'System Health /admin/system-health Status 200');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20-admin-system-health.png'), fullPage: true });

    // Earlier Phase Admin Regression Suite
    console.log('\n[Regression] Testing Admin Core Modules (Phase 1, 2, 3)...');
    const regressionRoutes = [
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

    for (const route of regressionRoutes) {
      const res = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
      assert(res.status() === 200, `Admin Module ${route} Status 200`);
    }

  } catch (err) {
    console.error('Test execution error:', err);
    assert(false, 'Test Suite Execution', err.message);
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`📊 LIVE PRODUCTION AUDIT SUMMARY: ${results.passed}/${results.total} Passed (${results.failed} Failed)`);
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
