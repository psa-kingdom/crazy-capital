# Crazy Capital — Local Development & QA Guide

> **Authoritative Local Development & Human Acceptance Reference**  
> Current Checkpoint: **Vertical Slice 1.12 Delivered (Commit: `d6c32ba`)**  
> Covers: Local Environment Setup, Synthetic Seed Accounts, Full Browser QA Checklists, Security & Data Scoping Validation.

---

## 1. System Architecture & Topology

Crazy Capital is structured as a high-performance **Turborepo monorepo** consisting of 3 applications and 5 shared packages:

| Service / App | Directory | Default Port | Technology Stack | Purpose |
|---|---|---|---|---|
| **Platform API** | `apps/api` | `http://localhost:4000` | NestJS, Prisma, Passport JWT, Swagger | Central backend REST API & business engine |
| **Admin Cockpit** | `apps/admin` | `http://localhost:3001` | Next.js 15 (App Router), TailwindCSS, `@cc/ui` | Executive dashboards, CRM, SLA operations, reports |
| **Customer & Partner Portal** | `apps/web` | `http://localhost:3000` | Next.js 15 (App Router), TailwindCSS, `@cc/ui` | Customer Self-Service Cockpit & Partner Growth Hub |
| **Shared Types** | `packages/types` | N/A | TypeScript | Shared domain models, DTOs, and interfaces |
| **UI Primitives** | `packages/ui` | N/A | React 19, TailwindCSS | Harmonized UI components (Card, Button, Badge, Modal) |
| **Validation Schemas** | `packages/validation` | N/A | Zod, class-validator | Shared request and form validation schemas |
| **Shared Utilities** | `packages/shared` | N/A | TypeScript | Formatting, currency helpers (INR / ₹), date math |
| **Shared Config** | `packages/config` | N/A | TypeScript | ESLint, TypeScript base configurations |

---

## 2. Local Environment Setup

### A. Prerequisites
- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`
- **PostgreSQL**: PostgreSQL 15+ running locally (or connection string to development/staging database)

### B. Environment Variables Setup
1. Copy `.env.example` to `.env` in `apps/api`:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
2. Configure standard development variables:
   ```ini
   PORT=4000
   NODE_ENV=development
   API_PREFIX=api/v1
   CORS_ORIGIN=http://localhost:3000,http://localhost:3001
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crazy_capital?schema=public"
   JWT_SECRET="local-dev-secret-key-minimum-32-characters-long"
   JWT_REFRESH_SECRET="local-dev-refresh-secret-key-minimum-32-chars"
   ```
   *(Note: Cloudflare R2, Razorpay, Resend, MSG91, and Interakt have automatic deterministic mock fallbacks for safe offline local development).*

3. `apps/admin` and `apps/web` automatically point to `http://localhost:4000/api/v1` by default.

### C. Database Migration & Synthetic Seed Execution
Run from the workspace root:
```bash
# 1. Generate Prisma Client
npm run --workspace=@cc/api prisma:generate

# 2. Push schema to database
npx --workspace=@cc/api prisma db push

# 3. Seed comprehensive synthetic test data
npm run --workspace=@cc/api prisma:seed
```

### D. Starting the Local Development Servers
Start all applications concurrently using Turborepo:
```bash
npm run dev
```

Or start applications individually in dedicated terminal windows:
```bash
# Terminal 1: Platform API (:4000)
npm run --workspace=@cc/api dev

# Terminal 2: Admin Cockpit (:3001)
npm run --workspace=@cc/admin dev

# Terminal 3: Customer & Partner Portal (:3000)
npm run --workspace=@cc/web dev
```

---

## 3. Local URLs Reference

| Endpoint / Page | URL | Description |
|---|---|---|
| **Swagger API Docs** | [http://localhost:4000/api/docs](http://localhost:4000/api/docs) | Interactive OpenAPI documentation for all endpoints |
| **API Healthcheck** | [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health) | API health & system status probe |
| **Admin Command Center** | [http://localhost:3001](http://localhost:3001) | Executive Dashboard with live operational metrics |
| **Admin Reports & Analytics** | [http://localhost:3001/reports](http://localhost:3001/reports) | Tabbed analytics engine, branch comparisons & CSV export |
| **Admin CRM Leads Board** | [http://localhost:3001/leads](http://localhost:3001/leads) | Multi-channel CRM Kanban board & lead lifecycle |
| **Admin Customer 360** | [http://localhost:3001/customers](http://localhost:3001/customers) | Master customer registry and 360-degree profile hub |
| **Admin Document Vault** | [http://localhost:3001/documents](http://localhost:3001/documents) | Document verification, audit log, rejection workbench |
| **Admin Invoices & Billing** | [http://localhost:3001/invoices](http://localhost:3001/invoices) | 18% GST invoices, settlement ledger, offline UTR entry |
| **Admin Notification Matrix** | [http://localhost:3001/notifications](http://localhost:3001/notifications) | Event logs, delivery simulator, test dispatch |
| **Admin Commissions Hub** | [http://localhost:3001/commissions](http://localhost:3001/commissions) | ADR-011 Admin commission approval & bank payouts |
| **Customer Self-Service** | [http://localhost:3000/customer](http://localhost:3000/customer) | Client overview, active case progress, compliance alerts |
| **Customer Application View**| [http://localhost:3000/customer/applications](http://localhost:3000/customer/applications) | Multi-case tracker with 4-stage sequential progress |
| **Customer Vault** | [http://localhost:3000/customer/documents](http://localhost:3000/customer/documents) | Client document repository & presigned download links |
| **Customer Billing Hub** | [http://localhost:3000/customer/billing](http://localhost:3000/customer/billing) | GST invoices, receipts, and Razorpay checkout triggers |
| **Partner Growth Hub** | [http://localhost:3000/partner](http://localhost:3000/partner) | Partner lead submission, commission earnings, payouts |

---

## 4. Synthetic Demo Test Accounts

The following deterministic, synthetic demo users are seeded for testing:

| Role | Email | Intended QA Test Scope |
|---|---|---|
| **Super Admin / Executive** | `admin@crazycapital.in` | Full system access across all 5 branches, organizational reporting, commission approvals, system configuration. |
| **Branch Manager (Noida)** | `bm.noida@crazycapital.in` | Scoped strictly to Noida Branch (`NOIDA_01`). Verifies branch isolation rules on dashboards and exports. |
| **Branch Manager (HO)** | `amit.kumar@crazycapital.in` | Scoped to Head Office (`HO`). Lead assignments, case transitions. |
| **Operations Executive** | `priya.verma@crazycapital.in` | Operations staff assigned to Noida cases and leads. |
| **Operations Executive** | `suresh.nair@crazycapital.in` | Operations staff assigned to Delhi cases and leads. |
| **Channel Partner** | `partner@apexadvisors.in` | External referral partner. Accesses `/partner` on `:3000` to submit leads and track commission payouts. |
| **Customer Client** | `client@kapoorenterprises.com` | Business client. Accesses `/customer` on `:3000` for application status, document uploads, and billing. |

*(Standard seed password pattern configured in `seed.ts` for safe local testing).*

---

## 5. Step-by-Step Human Acceptance / QA Checklist

### Phase A: Executive Dashboards & Operational Reporting (Slice 1.12)
1. **Executive Command Center ([http://localhost:3001](http://localhost:3001))**:
   - [ ] Verify that financial KPIs (**Total Invoiced**, **Total Collected**, **Active Filings**, **Commissions**) display live aggregated numbers.
   - [ ] Verify the **CRM Lead State Pipeline** renders status distribution tiles (`CONVERTED`, `QUALIFIED`, `PROPOSAL`, `CONTACTED`, `NEW`).
   - [ ] Verify the **Live Activity Feed** displays recent operational events with timestamps.
2. **Reports & Analytics Hub ([http://localhost:3001/reports](http://localhost:3001/reports))**:
   - [ ] **Date Filters**: Click through `7D`, `30D`, `90D`, `All Time`. Verify metric cards recalculate instantly.
   - [ ] **Tab 1: Executive Overview**: Inspect financial collection totals, top revenue services, and lead status funnel progress bars.
   - [ ] **Tab 2: Revenue & Billing**: Verify total invoiced, settled collections, 18% GST tax liability component, and breakdown by service and branch.
   - [ ] **Tab 3: CRM & Lead Funnel**: Verify inbound channel attribution table (`WEBSITE`, `WHATSAPP`, `PARTNER_REFERRAL`, `DIRECT_CALL`) and staff conversion velocity.
   - [ ] **Tab 4: Fulfillment & Stages**: Inspect active applications grouped by sequential workflow stage and Document Vault audit stats (**Verified**, **In Review**, **Rejected**).
   - [ ] **Tab 5: Branch Comparisons**: Inspect multi-branch benchmarking table (HO, Noida, Delhi, Mumbai, BLR).
   - [ ] **CSV Export**: Click **Export CSV** button in the header. Verify browser triggers download of `crazy_capital_overview_report.csv` (or selected tab report) with proper headers and numbers.

### Phase B: Role-Based Access Control & Branch Data Isolation
1. **Branch Manager Scoping**:
   - [ ] Log in / switch context to `bm.noida@crazycapital.in`.
   - [ ] Open [http://localhost:3001/reports](http://localhost:3001/reports).
   - [ ] Verify banner indicates `Branch-Scoped View`.
   - [ ] Verify metrics reflect strictly Noida branch records.
   - [ ] Attempt to query another branch via API parameter (`GET /api/v1/reports/dashboard?branchId=b-delhi`). Verify the backend service forces `branchId = user.branchId` to prevent cross-branch leakage.
2. **Unauthorized Role Protection**:
   - [ ] Attempt to query `/api/v1/reports/dashboard` as an Employee (`priya.verma@crazycapital.in`) or Partner (`partner@apexadvisors.in`).
   - [ ] Verify backend returns `403 Forbidden` (`You do not have permission to view organizational reports`).

### Phase C: Customer Self-Service Portal (Slice 1.11)
1. Open [http://localhost:3000/customer](http://localhost:3000/customer):
   - [ ] Verify customer overview displays active filings count, missing documents alert banner, and unpaid invoice balance.
2. Open [http://localhost:3000/customer/applications](http://localhost:3000/customer/applications):
   - [ ] Click on active filing `CC-2026-000101`.
   - [ ] Inspect the **Sequential 4-Stage Stepper** (`Document Collection` → `MCA SPICe+ Filing` → `Officer Review` → `Delivered`).
   - [ ] Verify document checklist indicates verification badges.
3. Open [http://localhost:3000/customer/documents](http://localhost:3000/customer/documents):
   - [ ] Verify uploaded documents list with presigned download action.
4. Open [http://localhost:3000/customer/billing](http://localhost:3000/customer/billing):
   - [ ] Verify GST invoice ledger with `PAID` / `SENT` status and **Pay Now via Razorpay** action.

### Phase D: Partner Growth Hub & Referral Engine (Slice 1.9)
1. Open [http://localhost:3000/partner](http://localhost:3000/partner):
   - [ ] Verify total commission earnings, paid payouts, and active referral counts.
   - [ ] Test the **Submit Client Referral** modal form.
   - [ ] Verify referred client appears in the referral pipeline table without internal operations notes leakage.

### Phase E: Admin Operations & Workbenches (Slices 1.2–1.10)
1. **CRM Kanban Engine ([http://localhost:3001/leads](http://localhost:3001/leads))**:
   - [ ] View leads categorized by status columns.
   - [ ] Click a lead card to inspect activity timeline, contact details, and assignment dropdown.
2. **Document Vault ([http://localhost:3001/documents](http://localhost:3001/documents))**:
   - [ ] Test document status toggle (**Verify** / **Reject with Remarks**).
3. **Billing Workbench ([http://localhost:3001/invoices](http://localhost:3001/invoices))**:
   - [ ] Inspect sequential `INV-2026-XXXXXX` numbering and 18% GST tax computation.
   - [ ] Test manual offline bank payment reconciliation (UTR entry).
4. **Commissions & Payouts ([http://localhost:3001/commissions](http://localhost:3001/commissions))**:
   - [ ] Verify Admin-only **Approve** / **Reject** buttons on pending commissions (ADR-011).
   - [ ] Test **Record Bank Payout (UTR)** modal (ADR-014).
5. **Notification Matrix ([http://localhost:3001/notifications](http://localhost:3001/notifications))**:
   - [ ] Inspect delivery audit logs across Email, SMS, WhatsApp.
   - [ ] Trigger test dispatch modal.

---

## 6. Staging Infrastructure Reference

- **Railway Staging API**: `https://api-staging-41ee.up.railway.app`
- **Cloudflare R2 Bucket**: `crazy-capital-staging-documents` (ACTIVE & VERIFIED)
- **Vercel Admin Staging**: `https://crazy-capital-admin.vercel.app` (linked)
- **Vercel Web Staging**: `https://crazy-capital-web.vercel.app` (linked)
- **Security Policy**: Zero credentials committed to Git. All secrets managed via Railway CLI and Vercel Environment Configuration.
