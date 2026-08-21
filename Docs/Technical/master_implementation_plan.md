# Crazy Capital — Master Implementation Plan
**Comprehensive Roadmap Divided into Strategic Phases & End-to-End Vertical Slices**  
*Building India's Growth Story 🇮🇳*

---

## Executive Summary & Architecture Philosophy

Crazy Capital is architected around the core flow:
$$\text{Visitor} \longrightarrow \text{Lead} \longrightarrow \text{Customer} \longrightarrow \text{Application} \longrightarrow \text{Workflow} \longrightarrow \text{Payment} \longrightarrow \text{Delivery} \longrightarrow \text{Retention}$$

The implementation follows a **Strict Vertical Slice Architecture**:
- Each slice delivers a complete, independently testable, user-facing capability.
- Every slice encompasses: **Database Models $\rightarrow$ Business Logic $\rightarrow$ API Endpoints $\rightarrow$ Security Guards $\rightarrow$ UI Interfaces $\rightarrow$ Automated Tests**.
- Adheres strictly to **Configuration Before Code**, **Data Isolation by Default**, and **Audit Immutability**.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             MASTER PHASE TIMELINE                                │
├───────────────────┬───────────────────┬───────────────────┬──────────────────────┤
│ Phase 1: MVP      │ Phase 2: Ops      │ Phase 3: Partner  │ Phase 4: AI & Auto   │
│ Weeks 1–14        │ Weeks 15–26       │ Weeks 27–36       │ Weeks 37–50          │
│ (Core Operations) │ (SLA & Workflows) │ (Franchise/Scale) │ (Intelligence/OCR)   │
└───────────────────┴───────────────────┴───────────────────┴──────────────────────┘
```

---

# PHASE 1: Foundation & Operational Platform (MVP)
**Duration:** 10 – 14 Weeks (Sprints 1 – 8)  
**Primary Objective:** Launch Crazy Capital to acquire leads, onboard customers, process service applications via workflows, manage partners, collect payments, and generate revenue.

---

### Vertical Slice 1.1: Foundation, IAM & Multi-Tenancy Scaffold
- **Status:** ✅ **COMPLETED (Milestone 1)**
- **Objective:** Establish monorepo, database layer, Argon2 authentication, JWT/Refresh tokens, session management, and RBAC guards.
- **Layers Delivered:**
  - **Database:** Prisma schema with 10 domains, multi-tenancy columns (`organization_id`, `branch_id`, `deleted_at`).
  - **Backend API:** NestJS Auth module (`/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`, `/auth/me`).
  - **Security:** Global `JwtAuthGuard`, `RbacGuard` (`@RequirePermissions`), `ResponseInterceptor`, `HttpExceptionFilter`.
  - **Frontend:** Next.js 15 apps (`apps/web`, `apps/admin`) with Turborepo build pipeline.

---

### Vertical Slice 1.2: CRM Engine & Configurable Lead Lifecycle
- **Timeline:** Sprint 2 (Weeks 3 – 4)
- **Objective:** Enable multi-channel lead capture, status state machine, assignment tracking, and dynamic lead sources.
- **Key Architectural Decisions:**
  - **ADR-013:** Lead sources stored in `lead_sources` table and managed by Admin (no hardcoded enums).
  - Leads belong to **Crazy Capital**, not partners or employees.
- **Components to Deliver:**
  - **Database:** `leads`, `lead_sources`, `lead_activities`, `lead_assignments`.
  - **Backend API:**
    - `POST /api/v1/leads` (Public capture & authenticated manual creation)
    - `GET /api/v1/leads` (Filter by status, branch, source, assigned employee, date range with pagination)
    - `GET /api/v1/leads/:id` (Lead detail with activity timeline)
    - `PATCH /api/v1/leads/:id/status` (State machine: `NEW → CONTACTED → QUALIFIED → PROPOSAL → CONVERTED/LOST`)
    - `POST /api/v1/leads/:id/assign` (Reassign to employee/branch manager with assignment audit)
    - `POST /api/v1/leads/:id/activities` (Log call, email, meeting, note)
    - `GET /api/v1/lead-sources`, `POST /api/v1/lead-sources` (Admin lead source manager)
  - **UI (Employee & Admin Portals):**
    - Lead Kanban board & data table with fast filtering and search
    - Lead Detail View: Contact card, lead score, timeline activity feed, quick notes
    - Quick Assignment modal with branch employee directory
  - **Acceptance Criteria:**
    - [ ] Public inquiry form creates lead with assigned `WEBSITE` source.
    - [ ] Employees can only view leads assigned to their branch/user scope.
    - [ ] State transitions update status and record an immutable activity log entry.
    - [ ] Admin can create a custom lead source (e.g. `INSTAGRAM_CAMPAIGN`) and immediately use it.

---

### Vertical Slice 1.3: Customer 360 & Conversion System
- **Timeline:** Sprint 2 (Weeks 3 – 4)
- **Objective:** Convert qualified leads into verified customers with addresses, contacts, and unified account profiles.
- **Components to Deliver:**
  - **Database:** `customers`, `customer_addresses`, `customer_contacts` with `(organization_id, email)` and `(organization_id, mobile)` unique constraints.
  - **Backend API:**
    - `POST /api/v1/leads/:id/convert` (Atomic lead $\rightarrow$ customer conversion transaction)
    - `POST /api/v1/customers` (Direct customer creation)
    - `GET /api/v1/customers` (Paginated search by name, email, mobile, PAN, GSTIN)
    - `GET /api/v1/customers/:id` (Customer 360 view: applications, docs, invoices)
    - `PATCH /api/v1/customers/:id` (Profile update, address management)
  - **UI (Employee & Admin Portals):**
    - Customer Directory with search, status badges, and export
    - Customer 360 Profile: Personal/business info, linked applications, document repository, payment history
  - **Acceptance Criteria:**
    - [ ] Lead conversion creates customer record and sets `lead.status = CONVERTED` atomically.
    - [ ] Duplicate email/mobile customer creation is blocked with explicit error message.
    - [ ] Customer profile displays all past interactions and applications in one unified tab.

---

### Vertical Slice 1.4: Service Catalog & Configuration Engine
- **Timeline:** Sprint 3 (Weeks 5 – 6)
- **Objective:** Admins configure hierarchical service categories, service items, pricing models, and mandatory document requirements.
- **Key Architectural Decisions:**
  - Services are organization-global; cannot be purchased if inactive.
  - Mandatory document checklist defined per service.
- **Components to Deliver:**
  - **Database:** `service_categories`, `services`, `service_pricing`, `service_documents`, `document_types`.
  - **Backend API:**
    - `GET /api/v1/service-categories` (Hierarchical category tree for public website & catalog)
    - `POST /api/v1/service-categories`, `PATCH /api/v1/service-categories/:id`
    - `GET /api/v1/services` (Public catalog list & internal management list)
    - `POST /api/v1/services`, `PATCH /api/v1/services/:id`
    - `POST /api/v1/services/:id/pricing` (Configure standard & partner pricing)
    - `POST /api/v1/services/:id/documents` (Configure mandatory/optional document types)
  - **UI (Public Website & Admin Portal):**
    - Public Service Directory & Detail pages (SEO-optimized)
    - Admin Service Manager: Category manager, pricing table, document checklist builder
  - **Acceptance Criteria:**
    - [ ] Admin creates service with pricing and mandatory documents without developer intervention.
    - [ ] Public website dynamically renders service catalog from backend API.

---

### Vertical Slice 1.5: Configurable Workflow Engine
- **Timeline:** Sprints 3 – 4 (Weeks 5 – 8)
- **Objective:** State machine executing business processes with stage validation, transition rules, and immutable history.
- **Key Architectural Decisions:**
  - **ADR-012:** 1:1 service-to-workflow mapping.
  - Stage Gates: Document gate, Payment gate, Approval gate.
- **Components to Deliver:**
  - **Database:** `workflows`, `workflow_stages`, `workflow_transitions`, `workflow_rules`, `workflow_instances`, `workflow_history`.
  - **Backend API:**
    - `POST /api/v1/workflows` (Create workflow template for a service)
    - `POST /api/v1/workflows/:id/stages` (Add ordered stages: Start, Processing, Approval, Completion, Rejection)
    - `POST /api/v1/workflows/:id/transitions` (Define allowable transitions between stages)
    - `POST /api/v1/workflows/:id/rules` (Configure document and payment gates)
    - `POST /api/v1/workflow-instances/:id/transition` (Execute stage transition with gate checks)
    - `GET /api/v1/workflow-instances/:id/history` (Audit log of all transitions)
  - **UI (Admin & Employee Portals):**
    - Admin Workflow Blueprint Configurator
    - Employee Workflow Execution Stepper with validation blockers and remarks
  - **Acceptance Criteria:**
    - [ ] Invalid stage transitions are blocked by the state machine with 400 Bad Request.
    - [ ] Document Gate prevents moving to next stage if mandatory documents are missing/unverified.
    - [ ] Every transition writes an immutable record to `workflow_history`.

---

### Vertical Slice 1.6: Application Lifecycle & Processing Matrix
- **Timeline:** Sprints 3 – 4 (Weeks 5 – 8)
- **Objective:** Customer service requests linking Customer $\rightarrow$ Service $\rightarrow$ Workflow Instance $\rightarrow$ Assigned Operations Employee.
- **Components to Deliver:**
  - **Database:** `applications`, `application_activities`, `tasks`, `approvals`.
  - **Backend API:**
    - `POST /api/v1/applications` (Create service request; generates `CC-YYYY-XXXXXX` and instantiates workflow)
    - `GET /api/v1/applications` (Filter by customer, branch, service, stage, employee)
    - `GET /api/v1/applications/:id` (Full application hub: workflow stepper, docs, tasks, notes)
    - `POST /api/v1/applications/:id/tasks` (Create operational task)
    - `PATCH /api/v1/applications/:id/assign` (Reassign processing employee)
  - **UI (Employee & Admin Portals):**
    - Application Operations Dashboard (Active, In-Review, Pending Approval, Delivered)
    - Application Detail Hub: Live workflow progress, task checklist, internal notes, documents
  - **Acceptance Criteria:**
    - [ ] Creating an application automatically creates a linked `workflow_instance` starting at stage 1.
    - [ ] Operations executive can advance stages only if authorized.

---

### Vertical Slice 1.7: Secure Document Vault (Cloudflare R2)
- **Timeline:** Sprint 4 (Weeks 7 – 8)
- **Objective:** Secure upload, storage, verification, and signed URL generation for customer compliance documents.
- **Key Architectural Decisions:**
  - Cloudflare R2 bucket has **no public access**.
  - All file access is governed by temporary signed URLs generated by the API.
- **Components to Deliver:**
  - **Database:** `document_types`, `documents`, `document_verifications`.
  - **Backend API:**
    - `POST /api/v1/documents/upload` (Upload multipart file to R2; path: `/orgs/{org}/branches/{branch}/...`)
    - `GET /api/v1/documents/:id/download-url` (Generate signed URL with 15-minute expiry)
    - `PATCH /api/v1/documents/:id/verify` (Operations employee marks document `VERIFIED` or `REJECTED` with remarks)
  - **UI (Customer, Employee & Admin Portals):**
    - Document Upload Component with drag-and-drop, format validation, and size checks
    - Document Verification Tray for operations staff with PDF/image preview
  - **Acceptance Criteria:**
    - [ ] Direct R2 bucket URLs return 403 Forbidden.
    - [ ] Signed URL allows authenticated preview/download and expires after 15 minutes.
    - [ ] Rejection triggers a status update and customer notification.

---

### Vertical Slice 1.8: Payment Gateway & Invoicing (Razorpay)
- **Timeline:** Sprint 5 (Weeks 9 – 10)
- **Objective:** Online service payment collection, automatic invoicing, and idempotent webhook processing.
- **Key Architectural Decisions:**
  - **ADR-014:** Full collection model via Razorpay Orders.
  - Idempotent webhook handling via unique `gateway_reference`.
- **Components to Deliver:**
  - **Database:** `invoices`, `payments`.
  - **Backend API:**
    - `POST /api/v1/invoices` (Generate invoice for application)
    - `POST /api/v1/payments/create-order` (Create Razorpay order linked to invoice)
    - `POST /api/v1/payments/webhook` (Razorpay signature verification + idempotent event handler)
    - `GET /api/v1/invoices/:id/pdf` (Generate PDF invoice receipt)
  - **UI (Customer & Employee Portals):**
    - Razorpay Checkout modal integration
    - Invoice summary with GST breakdown and download receipt button
  - **Acceptance Criteria:**
    - [ ] Successful Razorpay payment updates invoice to `PAID` and advances workflow if a payment gate exists.
    - [ ] Duplicate webhook delivery does not result in duplicate records or transitions.

---

### Vertical Slice 1.9: Partner Management & Commission Engine
- **Timeline:** Sprint 6 (Weeks 11 – 12)
- **Objective:** Partner onboarding, partner lead routing, commission calculation, and Admin approval flow.
- **Key Architectural Decisions:**
  - **ADR-011:** Commission approval is **Admin-only**; Branch Managers cannot approve.
  - **ADR-014:** Full collection $\rightarrow$ separate commission payout.
- **Components to Deliver:**
  - **Database:** `commissions`, `payouts`, `user_roles` (`PARTNER`).
  - **Backend API:**
    - `POST /api/v1/partners/leads` (Partner submits lead into central CRM)
    - `GET /api/v1/partners/cases` (Partner tracks status of referred cases without internal notes)
    - `GET /api/v1/partners/commissions` (Partner views pending & approved earnings)
    - `PATCH /api/v1/commissions/:id/approve` (Admin-only approval)
    - `PATCH /api/v1/commissions/:id/reject` (Admin-only rejection with reason)
    - `POST /api/v1/payouts` (Record manual UTR payout)
  - **UI (Partner & Admin Portals):**
    - Partner Portal: Referral form, active cases list, earnings dashboard
    - Admin Commission Approval Queue: Multi-branch commission review with approve/reject actions
  - **Acceptance Criteria:**
    - [ ] Partner cannot view internal employee remarks or customer payment amounts.
    - [ ] Non-Admin attempting to approve commission receives 403 Forbidden.
    - [ ] Commission is only calculated once the application reaches completion stage.

---

### Vertical Slice 1.10: Multi-Channel Notifications (Resend, MSG91, Interakt)
- **Timeline:** Sprint 5 (Weeks 9 – 10)
- **Objective:** Event-driven communication delivering transactional emails, SMS OTPs, WhatsApp updates, and in-app alerts.
- **Components to Deliver:**
  - **Database:** `notification_logs`.
  - **Backend API:**
    - Centralized `NotificationService` with adapters for Resend (Email), MSG91 (SMS), and Interakt (WhatsApp)
    - Event triggers: `lead.assigned`, `application.created`, `workflow.stage_changed`, `payment.success`, `commission.approved`
  - **Acceptance Criteria:**
    - [ ] Notification errors are caught and logged in `notification_logs` without failing the parent transaction.
    - [ ] Customer receives automated email + WhatsApp notification on stage advancement.

---

### Vertical Slice 1.11: Customer Self-Service Portal
- **Timeline:** Sprint 7 (Weeks 13 – 14)
- **Objective:** Dedicated portal for customers to track application stages, upload documents, pay invoices, and view receipts.
- **Components to Deliver:**
  - **UI (`apps/web` under `/customer`):**
    - Customer Dashboard: Active applications with visual progress bar
    - Document Vault: Missing document alerts, upload tray, verification status
    - Billing & Invoices: Unpaid invoice alerts, instant Razorpay checkout, downloadable tax receipts
  - **Acceptance Criteria:**
    - [ ] Customer only accesses data where `customer_id == user.id`.
    - [ ] Uploading required document automatically reflects in the operations queue.

---

### Vertical Slice 1.12: Operational Dashboards & Reporting Engine
- **Timeline:** Sprint 7 (Weeks 13 – 14)
- **Objective:** Real-time business metrics, branch performance, revenue analytics, and CSV/PDF export.
- **Components to Deliver:**
  - **Backend API:**
    - `GET /api/v1/reports/revenue` (Daily/monthly revenue, collection by service)
    - `GET /api/v1/reports/leads` (Conversion rates, lead sources breakdown)
    - `GET /api/v1/reports/operations` (Average turnaround time, active cases by stage)
    - `GET /api/v1/reports/export` (Streamed CSV / Excel export)
  - **UI (Admin & Branch Manager Portals):**
    - Executive Dashboard with KPI cards, revenue charts, and lead funnels
    - Branch-scoped performance views for Branch Managers
  - **Acceptance Criteria:**
    - [ ] Branch Managers only see metrics aggregated for their assigned branch.
    - [ ] Super Admins see organization-wide consolidated revenue and conversion numbers.

---

### Vertical Slice 1.13: CMS & Public Website Experience
- **Timeline:** Sprint 8 (Weeks 13 – 14)
- **Objective:** High-conversion public web presence, blog publishing system, and SEO metadata management.
- **Components to Deliver:**
  - **UI (`apps/web`):**
    - Landing pages for 14 service verticals
    - Blog & Knowledge Center with search and category filters
    - Lead capture forms with branch and UTM routing
  - **UI (`apps/admin`):**
    - Admin Blog Editor & SEO meta tags configurator
  - **Acceptance Criteria:**
    - [ ] Public website loads in $< 1.5$ seconds with valid SEO OpenGraph tags.
    - [ ] Inquiries submitted from vertical landing pages are routed to correct CRM queue.

---

# PHASE 2: Operational Excellence & Advanced Workflow Engine
**Duration:** 8 – 12 Weeks (Weeks 15 – 26)  
**Primary Objective:** Eliminate manual operational bottlenecks, automate task assignment, enforce strict SLAs with auto-escalation, and streamline branch management.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 2 OPERATIONAL CORE                                │
├──────────────────────────┬────────────────────────────┬───────────────────────────┤
│ SLA & Escalation Engine  │ Task Balancing Engine      │ Branch Hierarchy & Hubs   │
│ - Timers on stages       │ - Skill-based routing      │ - Multi-branch visibility │
│ - 4-Level auto-escalate  │ - Workload distribution    │ - Regional performance    │
└──────────────────────────┴────────────────────────────┴───────────────────────────┘
```

### Vertical Slice 2.1: Visual Workflow Builder
- **Objective:** Drag-and-drop workflow designer allowing Admins to build stages, transitions, conditions, and gate rules visually without JSON configs.
- **Components:** Canvas visualizer, stage connector, condition node editor, stage property drawer.

### Vertical Slice 2.2: SLA Tracking & 4-Level Auto-Escalation Engine
- **Objective:** Automatic SLA timer calculation per stage, breach warning notifications, and automated escalation to assigned executives, team leads, branch managers, and admins.
- **Components:** Background queue worker (BullMQ), breach detection job, escalation notification triggers.

### Vertical Slice 2.3: Intelligent Task Engine & Workload Balancing
- **Objective:** Automatically create and assign tasks when an application enters a stage based on employee capacity, department, and service specialization.

### Vertical Slice 2.4: Branch Hierarchy & Regional Operations Hubs
- **Objective:** Multi-branch operational management, department teams, branch targets, and regional performance reviews.

### Vertical Slice 2.5: RazorpayX Automated Partner Payouts
- **Objective:** Direct bank transfer (NEFT/IMPS) payout execution via RazorpayX APIs upon Admin commission approval.

---

# PHASE 3: Nationwide Partner Ecosystem & Franchise Expansion
**Duration:** 8 – 10 Weeks (Weeks 27 – 36)  
**Primary Objective:** Build India's largest financial services distribution network through franchises, multi-tier referral programs, and instant verification APIs.

### Vertical Slice 3.1: Partner Portal V2 & Tiered Commission Slabs
- **Objective:** Partner self-service onboarding, KYC verification, tiered commission rates (Silver, Gold, Platinum), and detailed earnings analytics.

### Vertical Slice 3.2: Franchise Management & Revenue Sharing
- **Objective:** Franchise onboarding, dedicated franchise sub-instances, localized service pricing, and automated franchise revenue sharing.

### Vertical Slice 3.3: Multi-Tier Referral & Incentive Engine
- **Objective:** Unique referral links, multi-tier commission sharing, and promotional coupon codes.

### Vertical Slice 3.4: DigiLocker & Identity Verification APIs
- **Objective:** Integration with DigiLocker for instant Aadhaar/PAN retrieval and PAN/GST verification APIs.

---

# PHASE 4: Automation, AI & Document Intelligence
**Duration:** 10 – 16 Weeks (Weeks 37 – 50)  
**Primary Objective:** Scale platform transaction volume without linear headcount growth using AI lead scoring, OCR document extraction, and predictive analytics.

### Vertical Slice 4.1: AI-Powered Lead Scoring & Priority Queue
- **Objective:** ML model analyzing lead parameters, engagement velocity, and ticket size to assign real-time conversion probability scores.

### Vertical Slice 4.2: Document OCR & Automated Verification Assistant
- **Objective:** OCR extraction on PAN, Aadhaar, GST certificates, and bank statements with cross-check against application fields to assist operations staff.

### Vertical Slice 4.3: Crazy Capital AI Operations Copilot
- **Objective:** Internal AI assistant suggesting next workflow steps, drafting customer follow-ups, and answering compliance questions.

### Vertical Slice 4.4: Predictive Revenue & Turnaround Analytics
- **Objective:** Predictive forecasting of monthly revenue, partner performance, and stage bottleneck prediction.

---

# PHASE 5: National Scale Platform & Enterprise Multi-Tenant SaaS
**Duration:** Ongoing Evolution  
**Primary Objective:** Become India's leading financial services ecosystem with mobile apps, developer APIs, white-label enterprise SaaS, and direct government integrations.

### Vertical Slice 5.1: Mobile Applications (iOS & Android)
- **Objective:** Native Flutter / React Native applications for Customers and Partners.

### Vertical Slice 5.2: Multi-Tenant SaaS & White-Label Theming
- **Objective:** Allow external accounting firms and enterprises to run their own branded Crazy Capital instance.

### Vertical Slice 5.3: Public Developer API & Webhooks Platform
- **Objective:** Public developer portal, API keys, webhook subscriptions, and sandbox environment.

### Vertical Slice 5.4: Government Systems Direct Integrations
- **Objective:** Direct system-to-system integrations with MCA Portal, GSTN Portal, Income Tax Department, and Account Aggregators.

---

## Phase 1 Sprint-by-Sprint Execution Summary

| Sprint | Weeks | Primary Slices Delivered | Deliverables & Milestones |
|---|---|---|---|
| **Sprint 1** | 1 – 2 | **Slice 1.1** | Monorepo scaffold, PostgreSQL Prisma schema, NestJS JWT Auth, RBAC guards, seed script. *(Verified ✅)* |
| **Sprint 2** | 3 – 4 | **Slice 1.2, 1.3** | CRM Lead engine, status state machine, configurable lead sources (**ADR-013**), lead assignment, Customer 360 profile, conversion flow. |
| **Sprint 3** | 5 – 6 | **Slice 1.4, 1.5, 1.6** | Service catalog, 1:1 service workflow (**ADR-012**), application lifecycle (`CC-YYYY-XXXXXX`), workflow stage transitions. |
| **Sprint 4** | 7 – 8 | **Slice 1.5, 1.6, 1.7** | Workflow gate rules (Document/Payment gates), Cloudflare R2 secure document vault, signed URLs, document verification tray. |
| **Sprint 5** | 9 – 10 | **Slice 1.8, 1.10** | Razorpay order creation & checkout, idempotent webhook handler (**ADR-014**), invoice PDF, multi-channel notification service. |
| **Sprint 6** | 11 – 12 | **Slice 1.9** | Partner onboarding, partner referral submission, commission calculation, Admin-only commission approval queue (**ADR-011**), manual payout tracking. |
| **Sprint 7** | 13 – 14 | **Slice 1.11, 1.12** | Customer self-service portal, operational metrics, revenue reports, branch-scoped analytics, Excel/PDF export. |
| **Sprint 8** | 13 – 14 | **Slice 1.13** | CMS blog & vertical landing pages, SEO optimization, end-to-end security & load testing, production staging deployment. |

---

*Authored by Principal Software Architect & Staff Engineer*  
*Crazy Capital — Building India's Growth Story 🇮🇳*
