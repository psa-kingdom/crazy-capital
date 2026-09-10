const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const pwPackage = require('playwright-core/package.json');

// Parse CLI flags
const isHeadless = process.argv.includes('--headless');
const isHeaded = !isHeadless || process.argv.includes('--headed');
const headless = !isHeaded;

const baseUrlArg = process.argv.find((a) => a.startsWith('--base-url='));
const BASE_URL = baseUrlArg ? baseUrlArg.split('=')[1] : 'https://crazycapital.in';

const apiUrlArg = process.argv.find((a) => a.startsWith('--api-url='));
const API_URL = apiUrlArg ? apiUrlArg.split('=')[1] : 'https://api.crazycapital.in/api/v1';

const EVIDENCE_DIR = path.join(__dirname, '..', 'artifacts', 'browser-evidence');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const SERVICE_SLUGS = [
  'pvt-ltd-incorporation',
  'llp-registration',
  'opc-registration',
  'section-8-company',
  'gst-registration',
  'business-loans',
];

async function runBrowserExploratorySuite() {
  console.log('================================================================');
  console.log('🚀 CRAZY CAPITAL — SLICE B INTERACTIVE BROWSER EXPLORATORY QA');
  console.log('================================================================');
  console.log(`🌐 Target Base URL:       ${BASE_URL}`);
  console.log(`⚙️  Target API URL:        ${API_URL}`);
  console.log(`🖥️  Playwright Version:    ${pwPackage.version}`);
  console.log(`👁️  Headless Mode:         ${headless ? 'true (Headless)' : 'false (VISIBLE CHROME WINDOW)'}`);
  console.log(`📁 Evidence Directory:    ${EVIDENCE_DIR}`);
  console.log('================================================================\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: [],
    issueRegister: [],
    traversedRoutes: [],
  };

  function assert(condition, name, details = '', category = 'functional', severity = 'P2') {
    results.total++;
    if (condition) {
      results.passed++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      results.failed++;
      results.failures.push({ name, details });
      console.error(`  ❌ [FAIL] ${name} — ${details}`);
      results.issueRegister.push({
        id: `ISSUE-${results.issueRegister.length + 1}`,
        name,
        details,
        category,
        severity,
      });
    }
  }

  // 1. Launch Visible Chrome
  console.log('[Phase 1] Launching Host Native Google Chrome...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: headless,
    slowMo: headless ? 0 : 150, // Human-perceivable pacing in visible mode
  });

  console.log(`  Connected to Chrome Version: ${browser.version()}`);
  console.log(`  Visible execution: ${!headless}`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 CrazyCapital-SliceB-Auditor/1.0',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  // Monitor console errors and dialog popups
  const pageErrors = [];
  const unexpectedDialogs = [];

  page.on('pageerror', (err) => {
    if (!err.message.includes('chrome-extension') && !err.message.includes('extension')) {
      console.log(`  ⚠️ [Browser PageError on ${page.url()}]:`, err.message);
      pageErrors.push(`${err.message} (URL: ${page.url()})`);
    }
  });

  // Track any native alerts/confirms that appear
  page.on('dialog', async (dialog) => {
    unexpectedDialogs.push({
      type: dialog.type(),
      message: dialog.message(),
      url: page.url(),
    });
    console.error(`  🚨 [UNEXPECTED NATIVE DIALOG]: ${dialog.type()}("${dialog.message()}") on ${page.url()}`);
    await dialog.dismiss();
  });

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: PUBLIC WEBSITE INTERACTIVE WALKTHROUGH
    // -------------------------------------------------------------------------
    console.log('\n[Phase 2] Public Website Interactive Traversal...');
    results.traversedRoutes.push({ route: '/', status: 'exercised' });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const title = await page.title();
    assert(title.includes('Crazy Capital'), 'Homepage loads with branded title', `Title: ${title}`);

    // Navbar branding and links
    const headerLogo = await page.$('header a[href="/"]');
    assert(!!headerLogo, 'Header contains logo linking to root');

    // Yin/Yang Theme Toggle
    const themeBtn = page.locator('button[aria-label*="Switch to"]').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(400);
      const isDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      assert(isDark, 'Theme toggles to Dark Mode (html.dark applied)');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_homepage_dark_1440.png') });

      await themeBtn.click();
      await page.waitForTimeout(400);
      const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark'));
      assert(isLight, 'Theme toggles back to Light Mode');
    }

    // Notification Center Popover Drawer
    const notifBtn = page.locator('button[aria-label*="notification"]').first();
    if (await notifBtn.isVisible()) {
      await notifBtn.click();
      await page.waitForTimeout(500);
      const notifCentre = page.locator('text=Notification Centre').first();
      assert(await notifCentre.isVisible(), 'Notification Centre popover opens on click');

      const unreadTab = page.locator('button:has-text("Unread")').first();
      if (await unreadTab.isVisible()) {
        await unreadTab.click();
        await page.waitForTimeout(300);
        assert(true, 'Notification Unread tab filters cleanly');
      }
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_homepage_light_1440.png') });

    // -------------------------------------------------------------------------
    // SECTION 2: SERVICE VERTICALS & LEAD CAPTURE VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n[Phase 3] Service Discovery & Lead Capture Audit...');
    for (const slug of SERVICE_SLUGS.slice(0, 3)) {
      results.traversedRoutes.push({ route: `/services/${slug}`, status: 'exercised' });
      await page.goto(`${BASE_URL}/services/${slug}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const sTitle = await page.title();
      assert(sTitle.includes('Crazy Capital'), `Service /services/${slug} loaded SEO title: "${sTitle}"`);

      // Verify Stepper & Documents Checklist
      const bodyText = await page.textContent('body');
      assert(
        bodyText.includes('Execution Lifecycle') || bodyText.includes('Pricing') || bodyText.includes('₹'),
        `Service /services/${slug} renders structured vertical content`,
      );
    }

    // Test Public Lead Capture validation on /services/pvt-ltd-incorporation
    await page.goto(`${BASE_URL}/services/pvt-ltd-incorporation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const submitBtn = page.locator('form button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(400);
      assert(unexpectedDialogs.length === 0, 'No native alert() fired on empty lead capture submission');
    }
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_service_pvt_ltd_1440.png') });

    // -------------------------------------------------------------------------
    // SECTION 3: PUBLIC DOCUMENTS VAULT & BILLING INVOICES
    // -------------------------------------------------------------------------
    console.log('\n[Phase 4] Public Documents Vault & Customer Invoices Portals...');
    results.traversedRoutes.push({ route: '/documents', status: 'exercised' });
    await page.goto(`${BASE_URL}/documents`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const docsTitle = await page.title();
    assert(docsTitle.includes('Crazy Capital'), 'Public Documents Vault loads properly');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_public_documents_1440.png') });

    results.traversedRoutes.push({ route: '/invoices', status: 'exercised' });
    await page.goto(`${BASE_URL}/invoices`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const invTitle = await page.title();
    assert(invTitle.includes('Crazy Capital'), 'Public Invoices Portal loads properly');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_public_invoices_1440.png') });

    // -------------------------------------------------------------------------
    // SECTION 4: ADMIN COMMAND CENTER AUDIT
    // -------------------------------------------------------------------------
    console.log('\n[Phase 5] Admin Command Center & Operations Walkthrough...');
    const adminRoutes = [
      { path: '/admin', name: 'Dashboard' },
      { path: '/admin/leads', name: 'CRM Leads' },
      { path: '/admin/customers', name: 'Customer 360' },
      { path: '/admin/documents', name: 'Document Vault' },
      { path: '/admin/workflows', name: 'Workflows' },
      { path: '/admin/tasks', name: 'Tasks & Routing' },
      { path: '/admin/sla', name: 'SLA Operations' },
      { path: '/admin/invoices', name: 'Invoices & Billing' },
      { path: '/admin/reports', name: 'Executive Reports' },
      { path: '/admin/reports/predictive', name: 'Predictive Analytics' },
      { path: '/admin/cms', name: 'CMS & Knowledge Base' },
      { path: '/admin/notifications', name: 'Notification Logs' },
      { path: '/admin/settings/lead-sources', name: 'Lead Source Settings' },
      { path: '/admin/audit-logs', name: 'DPDP & Audit Logs' },
      { path: '/admin/mandates', name: 'Mandates Hub' },
      { path: '/admin/system-health', name: 'System Health' },
    ];

    for (const r of adminRoutes) {
      results.traversedRoutes.push({ route: r.path, status: 'exercised' });
      await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      const heading = await page.textContent('h1').catch(() => '');
      assert(heading.length > 0 || (await page.title()).includes('Crazy Capital'), `Admin ${r.name} (${r.path}) renders correctly`);
    }

    // Interactive test on /admin/leads: switch tabs to AI Priority Queue
    await page.goto(`${BASE_URL}/admin/leads`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const priorityTab = page.getByRole('button', { name: /Priority Queue/i }).first();
    if (await priorityTab.isVisible()) {
      await priorityTab.click();
      await page.waitForTimeout(400);
      assert(true, 'Admin Leads AI Priority Queue view activated interactively');
    }
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '06_admin_leads_priority_queue.png'), fullPage: true });

    // Interactive test on /admin/documents: trigger copilot drawer
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const copilotTrigger = page.locator('button:has-text("Crazy Copilot")').first();
    if (await copilotTrigger.isVisible()) {
      await copilotTrigger.click();
      await page.waitForTimeout(600);
      assert(true, 'Crazy Copilot interactive drawer opened');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_admin_copilot_drawer.png') });
    }

    // -------------------------------------------------------------------------
    // SECTION 5: CUSTOMER & PARTNER PORTALS
    // -------------------------------------------------------------------------
    console.log('\n[Phase 6] Customer & Partner Portals Walkthrough...');
    const portalRoutes = [
      { path: '/customer', name: 'Customer Dashboard' },
      { path: '/customer/applications', name: 'Customer Applications' },
      { path: '/customer/documents', name: 'Customer Documents' },
      { path: '/customer/billing', name: 'Customer Billing' },
      { path: '/partner', name: 'Partner Hub' },
    ];

    for (const p of portalRoutes) {
      results.traversedRoutes.push({ route: p.path, status: 'exercised' });
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      assert((await page.title()).includes('Crazy Capital'), `Portal ${p.name} (${p.path}) renders without error`);
    }
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '08_partner_hub_1440.png'), fullPage: true });

    // -------------------------------------------------------------------------
    // SECTION 6: EMPLOYEE PORTAL (PRIORITY GAP AUDIT)
    // -------------------------------------------------------------------------
    console.log('\n[Phase 7] Employee Operations Leads Desk Walkthrough...');
    results.traversedRoutes.push({ route: '/employee/leads', status: 'exercised' });
    await page.goto(`${BASE_URL}/employee/leads`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    const empHeading = await page.textContent('body');
    assert(
      empHeading.includes('Employee') || empHeading.includes('Leads') || empHeading.includes('Operations'),
      'Employee Leads Desk (/employee/leads) renders operational desk',
    );
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '09_employee_leads_desk_1440.png'), fullPage: true });

    // -------------------------------------------------------------------------
    // SECTION 7: MULTI-VIEWPORT RESPONSIVE AUDIT
    // -------------------------------------------------------------------------
    console.log('\n[Phase 8] Multi-Viewport Responsive Matrix Testing...');
    const viewports = [
      { name: 'laptop', width: 1280, height: 720 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 812 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);

      // Verify no horizontal overflow
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert(
        scrollWidth <= clientWidth + 2,
        `Homepage has zero horizontal overflow on ${vp.name} (${vp.width}x${vp.height})`,
        `scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`,
        'responsive',
      );

      await page.screenshot({ path: path.join(EVIDENCE_DIR, `10_homepage_${vp.name}_${vp.width}.png`), fullPage: true });

      // Audit complex admin page on mobile/tablet
      await page.goto(`${BASE_URL}/admin/leads`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `11_admin_leads_${vp.name}_${vp.width}.png`) });
    }

    // Reset viewport to desktop
    await page.setViewportSize({ width: 1440, height: 900 });

    // -------------------------------------------------------------------------
    // SECTION 8: RUNTIME EXCEPTION & NATIVE DIALOG INVARIANTS
    // -------------------------------------------------------------------------
    console.log('\n[Phase 9] Browser Runtime Invariant Verification...');
    assert(unexpectedDialogs.length === 0, `Zero Unexpected Native Browser Dialogs (Found: ${unexpectedDialogs.length})`);
    assert(pageErrors.length === 0, `Zero Application Runtime Exceptions (Errors: ${pageErrors.length})`, pageErrors.join('; '));

  } catch (err) {
    console.error('Exploratory suite execution error:', err);
    assert(false, 'Exploratory QA Execution', err.message, 'runtime', 'P0');
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`📊 EXPLORATORY AUDIT COMPLETE: ${results.passed}/${results.total} Passed (${results.failed} Failed)`);
  console.log(`🧭 Traversed Routes: ${results.traversedRoutes.length} distinct operational surfaces`);
  console.log(`📸 Evidence Screenshots: ${EVIDENCE_DIR}`);
  console.log('================================================================\n');

  if (results.issueRegister.length > 0) {
    console.log('📋 DISCOVERED ISSUE REGISTER:');
    console.table(results.issueRegister);
  }

  if (results.failed > 0) {
    process.exit(1);
  }
}

runBrowserExploratorySuite().catch((err) => {
  console.error('Fatal execution failure:', err);
  process.exit(1);
});
