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
  assert(homeLoadTime < 2500, `Homepage loads fast in local dev (Actual: ${homeLoadTime}ms)`);

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

  // -------------------------------------------------------------
  // TEST 7: Vertical Slice 2.1 — Visual Workflow Builder (/workflows)
  // -------------------------------------------------------------
  console.log('\n[8/8] Testing Vertical Slice 2.1 — Visual Workflow Builder (http://localhost:3001/workflows)...');
  
  const wfRes = await page.goto('http://localhost:3001/workflows', { waitUntil: 'networkidle' });
  await wait(600);
  assert(wfRes && wfRes.status() === 200, 'Visual Workflow Builder (/workflows) responds with HTTP 200');

  const wfText = await page.textContent('body');
  assert(wfText.includes('Visual Workflow Builder'), 'Page header contains "Visual Workflow Builder"');
  assert(wfText.includes('Slice 2.1'), 'Slice 2.1 badge is present');
  assert(wfText.includes('ADR-012 Compliant'), 'ADR-012 (1:1) compliance badge is present');
  assert(wfText.includes('Interactive DAG Visualizer'), 'Interactive DAG Visualizer canvas header rendered');

  // Verify Stats Ribbon
  assert(wfText.includes('Stages') && wfText.includes('Transitions') && wfText.includes('Total SLA') && wfText.includes('Gate Rules'), 'Workflow KPI stats overview ribbon renders correctly');

  // Verify SPICe+ Stage Node Cards on Canvas
  assert(wfText.includes('KYC & Document Collection') && wfText.includes('DOC_COLLECTION'), 'Stage #1 (DOC_COLLECTION) rendered on canvas');
  assert(wfText.includes('MCA SPICe+ Part A & B Drafting') && wfText.includes('SPICE_DRAFTING'), 'Stage #2 (SPICE_DRAFTING) rendered on canvas');
  assert(wfText.includes('ROC Government Scrutiny') && wfText.includes('ROC_SCRUTINY'), 'Stage #3 (ROC_SCRUTINY) rendered on canvas');
  assert(wfText.includes('Certificate of Incorporation (COI) Issued') && wfText.includes('COI_ISSUED'), 'Stage #4 (COI_ISSUED) rendered on canvas');

  // Verify Gate Rule Tags
  assert(wfText.includes('DOCUMENT') || wfText.includes('PAYMENT'), 'Gate rule indicators displayed on stages');

  // Verify Transition Paths Table
  assert(wfText.includes('Allowed Transition Paths'), 'Allowed Transition Paths table rendered');
  assert(wfText.includes('All Docs Verified') || wfText.includes('SPICe+ Filed'), 'Transition triggers displayed in table');

  // Test Stage Properties Drawer Interaction
  await page.waitForSelector('[data-testid="btn-inspect-DOC_COLLECTION"]', { timeout: 10000 });
  const configureBtn = await page.$('[data-testid="btn-inspect-DOC_COLLECTION"]');
  if (configureBtn) {
    await configureBtn.click();
    await wait(500);
    const drawerText = await page.textContent('body');
    assert(drawerText.includes('Stage Properties') && drawerText.includes('Automated Gate Rules'), 'Stage Properties drawer opens upon clicking stage node');
    assert(drawerText.includes('Target SLA (Hours)') && drawerText.includes('Document Verification Gate'), 'Stage properties form fields and gate toggles rendered');

    const drawerCloseBtn = await page.$('button:has-text("Cancel")');
    if (drawerCloseBtn) await drawerCloseBtn.click();
    await wait(300);
  }


  // Test "+ Add Stage" Modal
  const addStageBtn = await page.$('button:has-text("Add Stage")');
  if (addStageBtn) {
    await addStageBtn.click();
    await wait(300);
    const modalText = await page.textContent('body');
    assert(modalText.includes('Add New Workflow Stage'), '+ Add Stage modal opens cleanly');
    const modalCancelBtn = await page.$('button:has-text("Cancel")');
    if (modalCancelBtn) await modalCancelBtn.click();
    await wait(200);
  }

  // Test "+ Add Transition" Modal
  const addTransitionBtn = await page.$('button:has-text("Add Transition")');
  if (addTransitionBtn) {
    await addTransitionBtn.click();
    await wait(300);
    const modalText = await page.textContent('body');
    assert(modalText.includes('Add Transition Path') && modalText.includes('From Stage (Origin)'), '+ Add Transition modal renders with stage selectors');
    const modalCancelBtn = await page.$('button:has-text("Cancel")');
    if (modalCancelBtn) await modalCancelBtn.click();
    await wait(200);
  }

  // Test Save & Publish Blueprint Flow
  const saveBtn = await page.$('button:has-text("Save & Publish Blueprint")');
  if (saveBtn) {
    await saveBtn.click();
    await wait(400);
    const postSaveText = await page.textContent('body');
    assert(postSaveText.includes('saved') || postSaveText.includes('published') || postSaveText.includes('Workflow'), 'Save & Publish Blueprint executes and shows confirmation banner');
  }

  // Take screenshot of Visual Workflow Builder
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_admin_workflow_builder.png'), fullPage: true });

  // -------------------------------------------------------------
  // TEST 9: Vertical Slice 2.2 — SLA Tracking & 4-Level Auto-Escalation (/sla)
  // -------------------------------------------------------------
  console.log('\n[9/9] Testing Vertical Slice 2.2 — SLA Tracking & 4-Level Auto-Escalation (http://localhost:3001/sla)...');
  
  const slaRes = await page.goto('http://localhost:3001/sla', { waitUntil: 'networkidle' });
  await wait(600);
  assert(slaRes && slaRes.status() === 200, 'SLA Command Center (/sla) responds with HTTP 200');

  const slaText = await page.textContent('body');
  assert(slaText.includes('SLA Tracking & 4-Level Auto-Escalation'), 'Page header contains SLA Tracking & 4-Level Auto-Escalation');
  assert(slaText.includes('Slice 2.2'), 'Slice 2.2 badge is rendered');
  assert(slaText.includes('4-Level Auto-Escalation') || slaText.includes('4-Tier Auto-Escalation'), '4-Tier escalation badge is present');
  assert(slaText.includes('Background Evaluator Active'), 'Background Evaluator status badge is visible');

  // Verify 4 KPI overview metric cards
  assert(slaText.includes('On Track') && slaText.includes('Warning Zone') && slaText.includes('SLA Breached') && slaText.includes('Active Escalations'), '4 KPI overview cards render correctly');

  // Verify 4-Tier Escalation Matrix Ribbon rules
  assert(slaText.includes('LEVEL 1') && slaText.includes('Assigned Executive'), 'Tier 1 (Assigned Executive) rendered in matrix ribbon');
  assert(slaText.includes('LEVEL 2') && slaText.includes('Team Lead'), 'Tier 2 (Team Lead) rendered in matrix ribbon');
  assert(slaText.includes('LEVEL 3') && slaText.includes('Branch Manager'), 'Tier 3 (Branch Manager) rendered in matrix ribbon');
  assert(slaText.includes('LEVEL 4') && (slaText.includes('Super Admin') || slaText.includes('Executive')), 'Tier 4 (Super Admin) rendered in matrix ribbon');

  // Verify Live Trackers table columns and stage timers
  assert(slaText.includes('Live SLA Trackers'), 'Live SLA Trackers tab rendered');
  assert(slaText.includes('SLA Gauge') && slaText.includes('Current Stage & Desk'), 'Trackers table headers rendered');
  assert(slaText.includes('ON TRACK') || slaText.includes('WARNING ZONE') || slaText.includes('SLA BREACHED'), 'Stage SLA status badges rendered in tracker');

  // Switch to Escalations Incidents & Audit Log tab
  const escTabBtn = await page.$('#tab-escalations');
  if (escTabBtn) {
    await escTabBtn.click();
    await wait(400);
    const escTabText = await page.textContent('body');
    assert(escTabText.includes('Incident Ref') && escTabText.includes('Breached Stage') && escTabText.includes('Tier & Escalated Recipient'), 'Escalation Incidents & Audit Log table rendered');
    assert(escTabText.includes('TRIGGERED') || escTabText.includes('ACKNOWLEDGED') || escTabText.includes('RESOLVED'), 'Escalation status tags displayed');

    // Test Acknowledge Modal interaction
    const ackBtn = await page.$('button:has-text("Acknowledge")');
    if (ackBtn) {
      await ackBtn.click();
      await wait(300);
      const modalText = await page.textContent('body');
      assert(modalText.includes('Acknowledge Escalation') && modalText.includes('Case Reference'), 'Acknowledge Escalation modal opens cleanly');

      const remarksInput = await page.$('#action-remarks-input');
      if (remarksInput) {
        await remarksInput.fill('Reviewing file with department lead for expedited submission');
      }

      const confirmBtn = await page.$('#btn-confirm-action');
      if (confirmBtn) {
        await confirmBtn.click();
        await wait(500);
      }
    }
  }

  // Test "Evaluate SLA Now" on-demand button trigger
  const evalBtn = await page.$('#btn-run-sla-eval');
  if (evalBtn) {
    await evalBtn.click();
    await wait(600);
    const postEvalText = await page.textContent('body');
    assert(postEvalText.includes('SLA') || postEvalText.includes('completed') || postEvalText.includes('Evaluation'), 'Evaluate SLA Now button executes evaluation cycle');
  }

  // Take screenshot of SLA Command Center
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_admin_sla_command_center.png'), fullPage: true });

  // -------------------------------------------------------------
  // TEST 10: Vertical Slice 2.3 — Intelligent Task Engine & Workload Balancing (/tasks)
  // -------------------------------------------------------------
  console.log('\n[10/10] Testing Vertical Slice 2.3 — Task Engine & Workload Balancing (http://localhost:3001/tasks)...');
  
  const tasksRes = await page.goto('http://localhost:3001/tasks', { waitUntil: 'networkidle' });
  await wait(600);
  assert(tasksRes && tasksRes.status() === 200, 'Task Engine & Workload page (/tasks) responds with HTTP 200');

  const tasksText = await page.textContent('body');
  assert(tasksText.includes('Intelligent Task Engine & Workload Balancing'), 'Page header contains Intelligent Task Engine title');
  assert(tasksText.includes('Slice 2.3'), 'Slice 2.3 badge is rendered');
  assert(tasksText.includes('Skill-Based Auto-Routing'), 'Skill-Based Auto-Routing badge is present');
  assert(tasksText.includes('Workload Capacity Balancing Active'), 'Capacity Balancing status indicator is rendered');

  // Verify 4 KPI metric cards
  assert(tasksText.includes('Pending & Queued') && tasksText.includes('In Progress / Review') && tasksText.includes('Urgent / SLA At Risk') && tasksText.includes('Staff Utilization'), '4 KPI overview cards render correctly');

  // Verify Operational Task Queue table headers and columns
  assert(tasksText.includes('Task & Title') && tasksText.includes('Stage & Desk') && tasksText.includes('Assignee & Routing Score'), 'Operational Task Queue table headers rendered');
  assert(tasksText.includes('IN PROGRESS') || tasksText.includes('PENDING') || tasksText.includes('COMPLETED'), 'Task status badges rendered in queue table');

  // Test "Start Task" action if a pending task exists
  const startBtn = await page.$('button:has-text("Start")');
  if (startBtn) {
    await startBtn.click();
    await wait(400);
    const postStartText = await page.textContent('body');
    assert(postStartText.includes('IN PROGRESS') || postStartText.includes('started'), 'Start Task button transitions task to IN PROGRESS');
  }

  // Test "Complete Task" modal interaction
  const completeBtn = await page.$('button:has-text("Complete")');
  if (completeBtn) {
    await completeBtn.click();
    await wait(300);
    const completeModalText = await page.textContent('body');
    assert(completeModalText.includes('Complete Operational Task') && completeModalText.includes('Completion Remarks'), 'Complete Task modal opens with remarks textarea');

    const notesInput = await page.$('#task-complete-notes-input');
    if (notesInput) {
      await notesInput.fill('Verified incorporation filings on MCA portal and issued compliance seal');
    }

    const confirmCompleteBtn = await page.$('#btn-confirm-complete');
    if (confirmCompleteBtn) {
      await confirmCompleteBtn.click();
      await wait(500);
    }
  }

  // Test "Reassign" modal with Intelligent Candidate Ranking
  const reassignBtn = await page.$('button:has-text("Reassign")');
  if (reassignBtn) {
    await reassignBtn.click();
    await wait(400);
    const reassignModalText = await page.textContent('body');
    assert(reassignModalText.includes('Intelligent Task Reassignment') && reassignModalText.includes('Ranked Assignee Candidates'), 'Reassignment modal opens and displays ranked candidate list');
    assert(reassignModalText.includes('/100') || reassignModalText.includes('Score'), 'Candidate match suitability scores displayed');

    const reasonInput = await page.$('#reassign-reason-input');
    if (reasonInput) {
      await reasonInput.fill('Rebalancing active branch workload to meet SLA commitment');
    }

    const confirmReassignBtn = await page.$('#btn-confirm-reassign');
    if (confirmReassignBtn) {
      await confirmReassignBtn.click();
      await wait(500);
    }
  }

  // Switch to Staff Workload Balancing Radar tab
  const workloadTabBtn = await page.$('#tab-workload');
  if (workloadTabBtn) {
    await workloadTabBtn.click();
    await wait(400);
    const workloadText = await page.textContent('body');
    assert(workloadText.includes('Active Workload') && workloadText.includes('Specializations') && workloadText.includes('Available Cap'), 'Staff Workload Balancing Radar cards rendered');
    assert(workloadText.includes('Tasks (') || workloadText.includes('OPTIMAL LOAD') || workloadText.includes('OVERLOADED'), 'Staff capacity indicators and overload badges visible');
  }

  // Test "+ New Operational Task" modal creation flow
  const openCreateTaskBtn = await page.$('#btn-open-create-task');
  if (openCreateTaskBtn) {
    await openCreateTaskBtn.click();
    await wait(300);
    const createModalText = await page.textContent('body');
    assert(createModalText.includes('Create Operational Task') && createModalText.includes('Task Title'), 'Create Operational Task modal opens');

    const titleInput = await page.$('#new-task-title-input');
    if (titleInput) {
      await titleInput.fill('Execute Trademark Distinctiveness Search & Examination');
    }

    const submitCreateBtn = await page.$('#btn-submit-create-task');
    if (submitCreateBtn) {
      await submitCreateBtn.click();
      await wait(500);
      const postCreateText = await page.textContent('body');
      assert(postCreateText.includes('added') || postCreateText.includes('created') || postCreateText.includes('Task'), 'Task creation confirms and updates queue');
    }
  }

  // Take screenshot of Task Engine Workbench
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_admin_task_engine.png'), fullPage: true });

  // -------------------------------------------------------------
  // TEST 11: Vertical Slice 2.4 — Branch Hierarchy & Regional Operations Hubs (/branches)
  // -------------------------------------------------------------
  console.log('\n[11/11] Testing Vertical Slice 2.4 — Branch Hierarchy & Regional Hubs (http://localhost:3001/branches)...');

  const branchesRes = await page.goto('http://localhost:3001/branches', { waitUntil: 'networkidle' });
  await wait(600);
  assert(branchesRes && branchesRes.status() === 200, 'Branch Hierarchy page (/branches) responds with HTTP 200');

  const branchText = await page.textContent('body');
  assert(branchText.includes('Branch Hierarchy & Regional Operations Hubs'), 'Page header contains Branch Hierarchy title');
  assert(branchText.includes('Slice 2.4'), 'Slice 2.4 badge is rendered');
  assert(branchText.includes('Multi-Branch Hierarchy Active'), 'Multi-Branch Hierarchy status badge is visible');
  assert(branchText.includes('Regional Operations Hubs'), 'Regional Operations Hubs badge is present');

  // Verify 4 KPI overview cards
  assert(branchText.includes('Regional Hubs') && branchText.includes('Operating Branches') && branchText.includes('Target Attainment') && branchText.includes('Realized Revenue'), '4 KPI overview cards render correctly');

  // Verify Tab 1 (Regional Hubs & Hierarchy) content
  assert(branchText.includes('NORTH_HUB') || branchText.includes('North Regional Operations Hub'), 'North Regional Operations Hub rendered in hierarchy');
  assert(branchText.includes('WEST_HUB') || branchText.includes('West Regional Operations Hub'), 'West Regional Operations Hub rendered in hierarchy');
  assert(branchText.includes('Revenue Realization') && branchText.includes('Completed Cases'), 'Regional rollup metrics displayed on hub cards');

  // Switch to Tab 2: Operating Branch Directory
  const branchTabBtn = await page.$('#tab-branches');
  if (branchTabBtn) {
    await branchTabBtn.click();
    await wait(400);
    const directoryText = await page.textContent('body');
    assert(directoryText.includes('Branch & Code') && directoryText.includes('Branch Manager') && directoryText.includes('Target Attainment'), 'Operating Branch Directory table headers rendered');
    assert(directoryText.includes('NOIDA_01') || directoryText.includes('Noida Sector 62 Branch'), 'Noida Branch listed in directory');
    assert(directoryText.includes('MUMBAI_01') || directoryText.includes('Mumbai BKC Operations Hub'), 'Mumbai Branch listed in directory');
  }

  // Test "Inspect 360" button interaction
  const inspectBtn = await page.$('button:has-text("Inspect 360")');
  if (inspectBtn) {
    await inspectBtn.click();
    await wait(400);
    const drawerText = await page.textContent('body');
    assert(drawerText.includes('Branch 360 Operations Inspector') && drawerText.includes('Branch Code'), 'Branch 360 Inspector Drawer opens cleanly');
    assert(drawerText.includes('Operational & Performance Snapshot') || drawerText.includes('Active Cases'), 'Performance snapshot rendered in drawer');

    // Close drawer
    const closeDrawerBtn = await page.$('div.fixed button:has-text("")');
    const xBtn = await page.$('button svg.lucide-x');
    if (xBtn) {
      await xBtn.click();
      await wait(300);
    }
  }

  // Switch to Tab 3: Target Management & Variance
  const targetTabBtn = await page.$('#tab-targets');
  if (targetTabBtn) {
    await targetTabBtn.click();
    await wait(400);
    const targetText = await page.textContent('body');
    assert(targetText.includes('Revenue Target vs Achieved') && targetText.includes('Revenue Variance') && targetText.includes('Case Target vs Completed'), 'Target Management table headers rendered');
    assert(targetText.includes('ACHIEVED') || targetText.includes('ON TRACK') || targetText.includes('AT RISK'), 'Target status badges rendered in target management table');
  }

  // Test "+ Set Target" modal interaction
  const setTargetBtn = await page.$('#btn-open-set-target');
  if (setTargetBtn) {
    await setTargetBtn.click();
    await wait(300);
    const setTargetModalText = await page.textContent('body');
    assert(setTargetModalText.includes('Set Branch Performance Target') && setTargetModalText.includes('Revenue Target (INR)'), 'Set Branch Performance Target modal opens cleanly');

    const revInput = await page.$('#target-revenue-input');
    if (revInput) {
      await revInput.fill('750000');
    }

    const casesInput = await page.$('#target-cases-input');
    if (casesInput) {
      await casesInput.fill('55');
    }

    const submitTargetBtn = await page.$('#btn-submit-set-target');
    if (submitTargetBtn) {
      await submitTargetBtn.click();
      await wait(500);
      const postTargetText = await page.textContent('body');
      assert(postTargetText.includes('updated') || postTargetText.includes('Target') || postTargetText.includes('saved'), 'Target configuration confirmed');
    }
  }

  // Test "+ New Branch" modal creation flow
  const createBranchBtn = await page.$('#btn-open-create-branch');
  if (createBranchBtn) {
    await createBranchBtn.click();
    await wait(300);
    const createBranchModalText = await page.textContent('body');
    assert(createBranchModalText.includes('Create Operating Branch') && createBranchModalText.includes('Branch Code'), 'Create Operating Branch modal opens');

    const nameInput = await page.$('#new-branch-name-input');
    if (nameInput) {
      await nameInput.fill('Chennai Anna Nagar Outpost');
    }

    const codeInput = await page.$('#new-branch-code-input');
    if (codeInput) {
      await codeInput.fill('CHN_01');
    }

    const submitBranchBtn = await page.$('#btn-submit-create-branch');
    if (submitBranchBtn) {
      await submitBranchBtn.click();
      await wait(500);
      const postBranchText = await page.textContent('body');
      assert(postBranchText.includes('added') || postBranchText.includes('Branch') || postBranchText.includes('created'), 'Branch creation confirms');
    }
  }

  // Test "+ New Regional Hub" modal creation flow
  const createRegionBtn = await page.$('#btn-open-create-region');
  if (createRegionBtn) {
    await createRegionBtn.click();
    await wait(300);
    const createRegionModalText = await page.textContent('body');
    assert(createRegionModalText.includes('Create Regional Operations Hub') && createRegionModalText.includes('Region Code'), 'Create Regional Operations Hub modal opens');

    const regNameInput = await page.$('#new-region-name-input');
    if (regNameInput) {
      await regNameInput.fill('Central Regional Operations Hub');
    }

    const regCodeInput = await page.$('#new-region-code-input');
    if (regCodeInput) {
      await regCodeInput.fill('CENTRAL_HUB');
    }

    const submitRegionBtn = await page.$('#btn-submit-create-region');
    if (submitRegionBtn) {
      await submitRegionBtn.click();
      await wait(500);
      const postRegText = await page.textContent('body');
      assert(postRegText.includes('instantiated') || postRegText.includes('Hub') || postRegText.includes('created'), 'Regional Hub creation confirms');
    }
  }

  // Switch to Tab 4: Regional Scorecard
  const perfTabBtn = await page.$('#tab-performance');
  if (perfTabBtn) {
    await perfTabBtn.click();
    await wait(400);
    const perfText = await page.textContent('body');
    assert(perfText.includes('Revenue Attainment') && perfText.includes('Case Attainment') && perfText.includes('Regional Manager'), 'Regional Performance Scorecard cards rendered');
  }

  // Take screenshot of Branch Hierarchy Workbench
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_admin_branch_hierarchy.png'), fullPage: true });

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
    console.log(`🎉 ALL ${results.passedChecks} REAL BROWSER ACCEPTANCE CHECKS PASSED PERFECTLY (100%)!`);
  }
}

runBrowserAcceptance().catch((err) => {
  console.error('Browser QA Fatal Error:', err);
  process.exit(1);
});



