const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '..', 'artifacts', 'browser-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

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

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBrowserAcceptance() {
  console.log('================================================================');
  console.log('🚀 CRAZY CAPITAL — PHASE 1 REAL BROWSER ACCEPTANCE QA SUITE');
  console.log('================================================================');

  const results = {
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    failures: [],
    timings: {},
  };

  function assert(condition, name, details = '') {
    results.totalChecks++;
    if (condition) {
      results.passedChecks++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      results.failedChecks++;
      results.failures.push({ name, details });
      console.error(`  ❌ [FAIL] ${name} — ${details}`);
    }
  }

  // Launch real Google Chrome
  console.log('\n[1/7] Launching Google Chrome Browser (Host Native)...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });
  console.log(`  Connected to Chrome Version: ${browser.version()}`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 CrazyCapitalQA/1.0',
  });

  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  // Track console errors and network failures
  const consoleErrors = [];
  const networkFailures = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', (req) => {
    networkFailures.push(`${req.method()} ${req.url()} - ${req.failure()?.errorText}`);
  });

  // -------------------------------------------------------------
  // TEST 1: Public Root Homepage (http://localhost:3000)
  // -------------------------------------------------------------
  console.log('\n[2/7] Testing Public Root Homepage (http://localhost:3000)...');
  const homeRes = await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  
  // Warm reload to test real browser navigation performance
  const startPerf = Date.now();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  const homeLoadTime = Date.now() - startPerf;
  results.timings['homepage'] = homeLoadTime;

  assert(homeRes && homeRes.status() === 200, 'Homepage responds with HTTP 200');
  assert(homeLoadTime < 1500, `Homepage loads in < 1.5s (Actual: ${homeLoadTime}ms)`);

  const pageTitle = await page.title();
  assert(pageTitle.includes('Crazy Capital'), `Homepage title correct ("${pageTitle}")`);

  const heroHeading = await page.textContent('h1');
  assert(heroHeading.includes('14 Corporate & Financial Verticals'), 'Hero heading highlights all 14 service verticals');

  // Verify all 14 service links exist on homepage
  for (const slug of SERVICE_SLUGS) {
    const linkExists = await page.$(`a[href*="/services/${slug}"]`);
    assert(!!linkExists, `Homepage links to vertical "/services/${slug}"`);
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_homepage.png'), fullPage: true });

  // -------------------------------------------------------------
  // TEST 2: All 14 Service Vertical Landing Pages
  // -------------------------------------------------------------
  console.log('\n[3/7] Testing All 14 Service Vertical Landing Pages (/services/[slug])...');
  for (const slug of SERVICE_SLUGS) {
    const startService = Date.now();
    const res = await page.goto(`http://localhost:3000/services/${slug}`, { waitUntil: 'domcontentloaded' });
    const serviceLoadTime = Date.now() - startService;
    results.timings[`service_${slug}`] = serviceLoadTime;

    assert(res && res.status() === 200, `Vertical /services/${slug} status 200`);

    // Verify Title & Meta Tags
    const sTitle = await page.title();
    assert(sTitle.includes('Crazy Capital'), `/services/${slug} has SEO title ("${sTitle}")`);

    const metaDesc = await page.$eval('meta[name="description"]', (el) => el.content).catch(() => null);
    assert(!!metaDesc && metaDesc.length > 20, `/services/${slug} has meta description`);

    const ogTitle = await page.$eval('meta[property="og:title"]', (el) => el.content).catch(() => null);
    assert(!!ogTitle, `/services/${slug} has og:title`);

    // Check pricing and elements
    const priceText = await page.textContent('body');
    assert(priceText.includes('Starting Professional Fee') || priceText.includes('₹'), `/services/${slug} renders pricing`);
    assert(priceText.includes('Step-by-Step Execution Lifecycle'), `/services/${slug} renders 4-stage execution stepper`);
    assert(priceText.includes('Mandatory Documents Checklist'), `/services/${slug} renders documents checklist`);
    assert(priceText.includes('Frequently Asked Questions'), `/services/${slug} renders FAQs`);

    // Check lead form presence
    const leadForm = await page.$('form');
    assert(!!leadForm, `/services/${slug} embeds public lead capture form`);
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_service_pvt_ltd.png'), fullPage: true });

  // -------------------------------------------------------------
  // TEST 3: Lead Capture Submission with UTM & Branch Attribution
  // -------------------------------------------------------------
  console.log('\n[4/7] Testing Lead Capture Interaction with UTM & Branch Routing...');
  await page.goto('http://localhost:3000/services/pvt-ltd-incorporation?utm_source=google_ads&utm_medium=cpc&utm_campaign=diwali_launch_2026&branch_id=b-noida', {
    waitUntil: 'networkidle',
  });

  // Fill in form inputs
  await page.fill('input[placeholder*="Rahul"]', 'Vikas');
  await page.fill('input[placeholder*="Sharma"]', 'Malhotra');
  await page.fill('input[placeholder*="9876543210"]', '9811223344');
  await page.fill('input[placeholder*="rahul@company.in"]', 'vikas.malhotra@vikastech.in');
  await page.fill('input[placeholder*="Apex Technologies"]', 'Vikas Cloud Systems Pvt Ltd');
  await page.fill('input[placeholder*="Noida"]', 'Noida Sector 62');
  await page.fill('textarea[placeholder*="specific"]', 'Looking for 3-day fast-track incorporation with 2 directors.');

  // Click Submit button
  const submitBtn = await page.$('button[type="submit"]');
  assert(!!submitBtn, 'Submit inquiry button found');
  await submitBtn.click();
  await wait(1000);

  // Check success card
  const successCard = await page.waitForSelector('text=Inquiry Received Successfully!', { timeout: 5000 }).catch(() => null);
  assert(!!successCard, 'Lead form submission displays success card');

  const pageContent = await page.textContent('body');
  assert(pageContent.includes('Vikas'), 'Success card personalizes with lead name');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_lead_submission_success.png') });

  // -------------------------------------------------------------
  // TEST 4: Blog & Knowledge Center (/blog and /blog/[slug])
  // -------------------------------------------------------------
  console.log('\n[5/7] Testing Blog & Knowledge Center (/blog and /blog/[slug])...');
  await page.goto('http://localhost:3000/blog', { waitUntil: 'domcontentloaded' });

  const blogHeader = await page.textContent('h1');
  assert(blogHeader.includes('Insights, Regulations & Growth Playbooks'), 'Blog index rendered with Knowledge Hub title');

  // Verify category filter buttons exist
  const catButtons = await page.$$('button:has-text("Categories"), button:has-text("Incorporation"), button:has-text("Tax"), button:has-text("All Categories")');
  assert(catButtons.length >= 1, 'Category filter buttons exist in Knowledge Center');

  // Search input interaction
  const searchInput = await page.$('input[placeholder*="Search by topic"]');
  assert(!!searchInput, 'Article search bar rendered');
  await searchInput.fill('Private Limited');
  await wait(300);

  // Navigate to published article
  await page.goto('http://localhost:3000/blog/how-to-register-pvt-ltd-company-india', { waitUntil: 'domcontentloaded' });
  const articleTitle = await page.textContent('h1');
  assert(articleTitle.includes('How to Register a Private Limited Company'), 'Article detail page rendered with correct heading');

  // Check article metadata
  const artOgTitle = await page.$eval('meta[property="og:title"]', (el) => el.content).catch(() => null);
  assert(!!artOgTitle, 'Blog article has og:title');

  // Verify 404 behavior for invalid slug
  const notFoundRes = await page.goto('http://localhost:3000/blog/this-slug-definitely-does-not-exist-xyz-404', { waitUntil: 'domcontentloaded' });
  const notFoundText = await page.textContent('body');
  assert(notFoundRes.status() === 404 || notFoundText.includes('404') || notFoundText.includes('This page could not be found'), 'Invalid blog slug returns 404 Not Found');

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_blog_article.png'), fullPage: true });

  // -------------------------------------------------------------
  // TEST 5: Admin CMS Workbench (http://localhost:3001/cms)
  // -------------------------------------------------------------
  console.log('\n[6/7] Testing Admin CMS Workbench (http://localhost:3001/cms)...');
  await page.goto('http://localhost:3001/cms', { waitUntil: 'networkidle' });

  const adminHeader = await page.textContent('h1');
  assert(adminHeader.includes('CMS & Knowledge Base Engine'), 'Admin CMS Workbench loaded with header');

  const sliceBadge = await page.textContent('body');
  assert(sliceBadge.includes('Slice 1.13'), 'Slice 1.13 badge rendered on Admin CMS');

  // Verify filter tabs (ALL, PUBLISHED, DRAFT, ARCHIVED)
  assert(sliceBadge.includes('PUBLISHED') && sliceBadge.includes('DRAFT'), 'Article status filters rendered');

  // Verify "+ New Article" button opens authoring modal
  const newArticleBtn = await page.waitForSelector('button:has-text("New Article")', { timeout: 5000 });
  assert(!!newArticleBtn, '"+ New Article" button present');
  await newArticleBtn.click();
  await wait(500);

  const modalElement = await page.waitForSelector('text=Author New Blog Article', { timeout: 5000 }).catch(() => null);
  assert(!!modalElement, 'New Article modal opens upon click');

  // Test tabs inside modal
  const seoTabBtn = await page.$('button:has-text("SEO & OpenGraph")');
  if (seoTabBtn) {
    await seoTabBtn.click();
    await wait(200);
  }
  const metaTitleInput = await page.$('input[placeholder*="Title tag displayed"]');
  assert(!!metaTitleInput, 'Meta Title SEO input field accessible in modal');

  const previewTabBtn = await page.$('button:has-text("preview")');
  if (previewTabBtn) {
    await previewTabBtn.click();
    await wait(200);
  }
  assert(!!previewTabBtn, 'Live preview tab exists in authoring modal');

  // Close modal
  const closeBtn = await page.$('button:has-text("Cancel")');
  if (closeBtn) await closeBtn.click();
  await wait(300);

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_admin_cms.png'), fullPage: true });

  // -------------------------------------------------------------
  // TEST 6: Customer Portal & Operations Suite (Regression)
  // -------------------------------------------------------------
  console.log('\n[7/7] Testing Customer Self-Service Portal & Operational Dashboards...');
  
  // Customer Portal
  await page.goto('http://localhost:3000/customer', { waitUntil: 'domcontentloaded' });
  const custText = await page.textContent('body');
  assert(custText.includes('Customer Portal') || custText.includes('Active Applications') || custText.includes('Overview'), 'Customer Self-Service Portal (/customer) renders');

  // Admin Reports (Slice 1.12)
  await page.goto('http://localhost:3001/reports', { waitUntil: 'domcontentloaded' });
  const reportText = await page.textContent('body');
  assert(reportText.includes('Reports') || reportText.includes('Analytics') || reportText.includes('Executive'), 'Admin Reports & Analytics (/reports) renders');

  // Admin Leads (Slice 1.2)
  await page.goto('http://localhost:3001/leads', { waitUntil: 'domcontentloaded' });
  const leadsText = await page.textContent('body');
  assert(leadsText.includes('Leads') || leadsText.includes('CRM'), 'Admin Leads Hub (/leads) renders');

  // Admin Documents (Slice 1.7)
  await page.goto('http://localhost:3001/documents', { waitUntil: 'domcontentloaded' });
  const docText = await page.textContent('body');
  assert(docText.includes('Document') || docText.includes('Vault'), 'Admin Document Vault (/documents) renders');

  // Admin Invoices (Slice 1.8)
  await page.goto('http://localhost:3001/invoices', { waitUntil: 'domcontentloaded' });
  const invText = await page.textContent('body');
  assert(invText.includes('Invoices') || invText.includes('Billing'), 'Admin Invoices Hub (/invoices) renders');

  // Admin Commissions (Slice 1.9)
  await page.goto('http://localhost:3001/commissions', { waitUntil: 'domcontentloaded' });
  const commText = await page.textContent('body');
  assert(commText.includes('Commissions') || commText.includes('Payouts'), 'Admin Commissions Hub (/commissions) renders');

  // Admin Notifications (Slice 1.10)
  await page.goto('http://localhost:3001/notifications', { waitUntil: 'domcontentloaded' });
  const notifText = await page.textContent('body');
  assert(notifText.includes('Notifications') || notifText.includes('Alerts'), 'Admin Notification Matrix (/notifications) renders');

  // Sitemap & Robots
  await page.goto('http://localhost:3000/sitemap.xml');
  const sitemapContent = await page.content();
  assert(sitemapContent.includes('https://crazycapital.in') && sitemapContent.includes('/services/'), 'XML Sitemap generated with service URLs');

  await page.goto('http://localhost:3000/robots.txt');
  const robotsText = (await page.textContent('body') || '').toLowerCase();
  assert(robotsText.includes('user-agent') && robotsText.includes('sitemap.xml'), 'Robots.txt generated');

  await browser.close();

  // Summary Report
  console.log('\n================================================================');
  console.log(`🏁 REAL BROWSER QA ACCEPTANCE SUMMARY:`);
  console.log(`   Total Assertions: ${results.totalChecks}`);
  console.log(`   Passed:           ${results.passedChecks}`);
  console.log(`   Failed:           ${results.failedChecks}`);
  console.log(`   Console Errors:   ${consoleErrors.length}`);
  console.log(`   Network Failures: ${networkFailures.length}`);
  console.log('================================================================\n');

  if (results.failedChecks > 0) {
    console.error('FAILURES:');
    results.failures.forEach((f) => console.error(` - ${f.name}: ${f.details}`));
    process.exit(1);
  } else {
    console.log('🎉 ALL 169 REAL BROWSER ACCEPTANCE CHECKS PASSED PERFECTLY (100%)!');
  }
}

runBrowserAcceptance().catch((err) => {
  console.error('Browser QA Fatal Error:', err);
  process.exit(1);
});
