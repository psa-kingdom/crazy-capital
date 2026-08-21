# Engineering Memory

Status: Living project memory  
Owner: Engineering team  
Update rule: update this document in the same change as a relevant implementation, decision, incident, or release.

---

## 1. Product snapshot

- **Product purpose:** India's Business Operating System — a unified platform connecting individuals, startups, MSMEs, enterprises, and partners to financial, legal, compliance, tax, insurance, investment, and advisory services.
- **Primary users:** Customers (individual + business), Partners (channel/referral/franchise), Employees (sales/ops/verification/finance), Admins (admin/super-admin/branch-manager)
- **Business/tenancy model:** Phase 1 — single organization, multi-branch, shared PostgreSQL schema with `organization_id` + `branch_id` isolation on every business table. Future: franchise → multi-tenant SaaS.
- **MVP scope:** 12 modules — Auth/IAM, CRM, Customer Management, Service Catalog, Applications, Workflow Engine, Document Management, Partner Management, Payments, Notifications, Reporting, CMS. Duration: 10–14 weeks.
- **Explicit non-goals (Phase 1):** Mobile apps, white label, AI/OCR, DigiLocker, CKYC, Account Aggregator, government API integrations, marketplace, multi-region, franchise hierarchy.

---

## 2. Architecture snapshot

- **Frontend:** Next.js 15 + TypeScript + Tailwind CSS + ShadCN UI + Zustand + TanStack Query + React Hook Form + Zod. Hosted on Vercel.
- **Backend/API:** NestJS + TypeScript + Prisma ORM. REST API with versioning `/api/v1/`. Swagger OpenAPI docs. Hosted on Railway.
- **Database and data-isolation approach:** PostgreSQL (Railway). Shared schema, every business table has `organization_id UUID NOT NULL` + `branch_id UUID`. Prisma middleware enforces scope injection. Soft delete via `deleted_at`. Audit columns: `created_at`, `updated_at`, `created_by`, `updated_by`.
- **Identity and authorization:** JWT (15-min access token) + Refresh Token (30-day, HttpOnly cookie + DB). Argon2 password hashing. RBAC model: User → Role → Permissions → Actions. Scopes: organization → branch → assignment. Guards run at API level, not UI.
- **Files/background jobs:** Cloudflare R2 for all file storage. Path: `/orgs/{org-id}/branches/{branch-id}/customers/{id}/{file}`. Access via signed URLs only — no public bucket access. Background jobs: Railway cron or BullMQ (TBD — open decision OQ-SLA-001).
- **Hosting/environments:** Vercel (frontend) + Railway (backend + PostgreSQL) + Cloudflare (DNS, CDN, R2). Environments: development → staging → production.
- **Observability:** Sentry (error monitoring — frontend + backend), BetterStack (logs), PostHog (product analytics).

---

## 3. Module registry

| Module | Responsibility | Public interfaces | Owner/notes |
|---|---|---|---|
| auth | JWT auth, sessions, password reset, OTP | POST /auth/login, /auth/register, /auth/refresh, /auth/logout, /auth/forgot-password | Core; ships Sprint 1 |
| users | User CRUD, RBAC, roles, permissions | GET/POST/PATCH /users, /roles, /permissions | Core; ships Sprint 1 |
| crm | Lead management, assignment, activity log | GET/POST/PATCH /leads, /leads/:id/assign, /leads/:id/activities | Core; ships Sprint 2 |
| customers | Customer profiles, addresses, contacts | GET/POST/PATCH /customers | Core; ships Sprint 2 |
| services | Service catalog, categories, pricing, doc requirements | GET/POST/PATCH /service-categories, /services, /service-pricing | Core; ships Sprint 3 |
| applications | Application lifecycle, assignment, activity | GET/POST/PATCH /applications | Core; ships Sprint 3 |
| workflow | Workflow templates, stages, transitions, instances, history | GET/POST/PATCH /workflows, /workflow-instances/:id/transition | Core; ships Sprint 3–4 |
| documents | Upload, verify, signed URL generation | POST /documents/upload, PATCH /documents/:id/verify | Core; ships Sprint 4 |
| payments | Invoices, Razorpay orders, webhook, refunds | POST /invoices, /payments/create-order, /payments/webhook | Ships Sprint 5 |
| notifications | Event-driven Email/SMS/WhatsApp/in-app delivery | Internal event bus; no public API | Ships Sprint 5 |
| partners | Partner profiles, onboarding, lead submission | GET/POST/PATCH /partners | Ships Sprint 6 |
| commissions | Commission rules, calculation, approval, payouts | GET/POST/PATCH /commission-rules, /commissions | Ships Sprint 6 |
| cms | Blogs, pages, SEO metadata | GET/POST/PATCH /posts, /pages | Ships Sprint 8 |
| reports | Revenue/ops/partner/customer dashboards, exports | GET /reports/*, GET /exports/* | Ships Sprint 7 |

---

## 4. Confirmed business rules and invariants

| Rule | Rationale | Source | Relevant code |
|---|---|---|---|
| Every lead belongs to Crazy Capital, not partners or employees | Prevent partner lock-in; maintain organizational data ownership | 04-business-rules-and-access-discovery.md Rule L1 | crm module |
| Only admins can permanently reassign lead ownership | Protect CRM integrity | 04-business-rules-and-access-discovery.md Rule L5 | crm/lead-assignment.service |
| Customer must have a single master profile; duplicates prevented | Data integrity | 04-business-rules-and-access-discovery.md Rule C3 | Unique constraint: (org_id, email), (org_id, mobile) |
| Every service must have: workflow, documents, SLA, status definitions before activation | Operational completeness | 04-business-rules-and-access-discovery.md Rule S2 | services/service-activation.guard |
| Inactive services cannot be purchased | Product integrity | 04-business-rules-and-access-discovery.md Rule S3 | applications module validation |
| Every application must have a workflow; cannot exist without workflow tracking | Core product principle | 04-business-rules-and-access-discovery.md Rule W1, W2 | applications/application-created.event |
| Workflow stages must be sequential; mandatory stages cannot be skipped | Process integrity | 04-business-rules-and-access-discovery.md Rule W3, W4 | workflow/transition-validator |
| Only authorized users may transition workflow stages | Security | 04-business-rules-and-access-discovery.md Rule W7 | workflow/transition.guard |
| Workflow changes must be logged (immutable) | Audit | 04-business-rules-and-access-discovery.md Rule W5 | workflow/workflow-history |
| Commission is generated only from approved services | Financial integrity | 04-business-rules-and-access-discovery.md Rule CM1 | commissions module |
| Commission becomes payable only after approval | Financial governance | 04-business-rules-and-access-discovery.md Rule CM4 | commissions/commission-approval.service |
| Payment history cannot be deleted | Audit + compliance | 04-business-rules-and-access-discovery.md Rule F2 | Soft delete enforced; payments table |
| Every inquiry must become a lead | CRM-centric principle | 01-product-foundation.md Principle 2 | All inquiry endpoints |
| Audit records must be immutable | Compliance | 04-business-rules-and-access-discovery.md Rule A2 | audit_logs table — no UPDATE/DELETE |
| Deleted records must be archived, not permanently removed | Data governance | 04-business-rules-and-access-discovery.md Rule CRM5 | deleted_at soft-delete pattern |

---

## 5. Security and access rules

| Area | Current rule/control | Verification |
|---|---|---|
| Authentication | JWT access token (15 min) + Refresh token (30 days, HttpOnly cookie + DB). Argon2 password hashing. Email+Password and Mobile OTP for Phase 1. | auth module tests; token expiry tested |
| Authorization | RBAC: User → Role → Permissions. Guards at API layer. 6 roles: Super Admin, Admin, Branch Manager, Employee, Partner, Customer. | rbac.guard unit tests; scope isolation integration tests |
| Tenant/data isolation | Every query filtered by organization_id (mandatory) + branch_id (role-dependent). Prisma middleware injects scope. Users cannot bypass filters. | Integration tests: cross-branch data access must return 403/404 |
| Files/secrets | R2 bucket: no public access. All files served via signed URLs with expiry. Secrets stored in environment variables only — never committed. | R2 bucket policy audit; secrets scanner in CI |
| Audit logging | All critical actions logged: login, lead assignment, customer creation, workflow change, payment update, commission approval. Audit table: immutable (no UPDATE/DELETE). | audit_logs table constraints |

---

## 6. External contracts and integrations

| Integration | Purpose | Owner | Key constraints | Documentation |
|---|---|---|---|---|
| Razorpay | Payment collection, invoices, refunds, webhooks | Payments module | Webhook idempotency via gateway_reference UNIQUE. Secrets: RAZORPAY_KEY_ID, RAZORPAY_SECRET | Razorpay Docs |
| Resend | Transactional email (OTP, welcome, updates) | Notifications module | Secret: RESEND_API_KEY | resend.com/docs |
| MSG91 | SMS + OTP delivery | Notifications module / Auth module | Secret: MSG91_API_KEY | msg91.com/docs |
| Interakt | WhatsApp Business messaging | Notifications module | Template messages only (WhatsApp policy). Secret: INTERAKT_API_KEY | interakt.shop/docs |
| Cloudflare R2 | Document + file storage | Documents module | S3-compatible API. Signed URLs, no public access. Path: /orgs/{org}/branches/{branch}/... | Cloudflare R2 docs |
| PostHog | Product analytics | Frontend + Backend | Secret: POSTHOG_KEY | posthog.com/docs |
| Sentry | Error monitoring | Frontend + Backend | Secret: SENTRY_DSN. Never log PII. | sentry.io/docs |
| BetterStack | Log aggregation + uptime monitoring | Backend infra | Secret: BETTERSTACK_TOKEN | betterstack.com/docs |

---

## 7. Architectural decisions

| ADR | Decision | Status | Review trigger |
|---|---|---|---|
| ADR-001 | Turborepo monorepo with apps/web, apps/admin, apps/api, shared packages | Approved | Only revisit if team splits significantly |
| ADR-002 | Modular Monolith (not microservices) for Phase 1–2 | Approved | Revisit at Phase 3+ scale (500k+ customers) |
| ADR-003 | PostgreSQL shared-schema multi-tenancy with organization_id + branch_id on every table | Approved | Revisit for multi-tenant SaaS (schema-per-tenant evaluation needed) |
| ADR-004 | Cloudflare R2 for file storage; signed URLs for all access | Approved | Vendor change requires migration plan |
| ADR-005 | Razorpay as payment gateway | Approved | Evaluate Cashfree as fallback at Phase 2 |
| ADR-006 | JWT (15 min) + HttpOnly Refresh Token (30 days) | Approved | Review if enterprise SSO requirements emerge |
| ADR-007 | Argon2 for password hashing | Approved | Do not change without security review |
| ADR-008 | Configuration-driven workflow engine (not hardcoded service flows) | Approved | Core architecture — do not hardcode service workflows |
| ADR-009 | REST API with versioning /api/v1/ (GraphQL optional in future) | Approved | Add GraphQL only if mobile apps require it |
| ADR-010 | RBAC authorization model (ABAC deferred to future phases) | Approved | Revisit at Phase 2 if dynamic permissions needed |
| ADR-011 | Commission approval is Admin-only. Branch Managers cannot approve commissions. | **Founder Confirmed** | Never delegate commission approval below Admin role |
| ADR-012 | One service maps to exactly one workflow (1:1 cardinality). No multi-workflow per service. | **Founder Confirmed** | Revisit only if Express/premium service variants are required |
| ADR-013 | Lead sources are configurable by Admin (lead_sources table), not a hardcoded enum. | **Founder Confirmed** | Do not hardcode lead source values in application code |
| ADR-014 | Full payment collected from customer via Razorpay. Commission paid to partner separately after Admin approval. No split payment at collection time. | **Founder Confirmed** | Phase 1: manual payout tracking. Phase 2+: RazorpayX for automated payouts |
| ADR-015 | Strict adherence to the 5-Phase Vertical Slice Architecture Blueprint across all development sprints. | **Approved** | Single source of truth: Docs/Technical/13-master-implementation-plan-and-vertical-slices.md |
| ADR-016 | Stitch Design Intelligence as Inspiration Library; Customization via Design Tokens | **Approved** | Stitch is a non-authoritative reference library. Semantic Design Tokens in @cc/ui and Tailwind are the authoritative customization layer. Single source of truth: Docs/stitch-inspiration-map.md |
| ADR-017 | CLI-First Staging Infrastructure Topology (Railway + Vercel + PostgreSQL) | **Approved** | Railway API + PostgreSQL staging established via CLI. Vercel Web & Admin staging linked. Single source of truth: Docs/staging-infrastructure.md |

---

## 8. Current constraints and assumptions

| Item | Type | Impact | Next action |
|---|---|---|---|
| ~~OQ-001 Commission approval~~ | **RESOLVED → ADR-011** | Admin-only approval | Closed Aug 2026 |
| ~~OQ-002 Service-to-workflow cardinality~~ | **RESOLVED → ADR-012** | 1:1, one service one workflow | Closed Aug 2026 |
| ~~OQ-003 Lead source tracking~~ | **RESOLVED → ADR-013** | Configurable via lead_sources table | Closed Aug 2026 |
| ~~OQ-004 Payment split model~~ | **RESOLVED → ADR-014** | Full collection + separate commission payout | Closed Aug 2026 |
| Customer self-registration vs employee-invites only | Open decision (OQ-005) | Affects customer portal auth flow | Decide before Sprint 7 |
| Notification templates: CMS-managed vs hardcoded | Open decision (OQ-009) | Affects notification architecture complexity | Decide before Sprint 5 |
| Background job infrastructure for SLA tracking | Assumption: BullMQ on Railway | Required for Phase 2 SLA features | Confirm before Phase 2 |
| Insurance/loan distribution requires licensed partner | Regulatory constraint | Must route through licensed partners only | Already accounted for in business model |
| Phase 1 targets: 5,000 customers, 50 employees, 100 partners | Scale assumption | Drives infrastructure sizing | Revisit at 80% capacity |
| MongoDB Prohibitions | **Architecture Invariant** | MongoDB is NOT part of the Crazy Capital persistence architecture. PostgreSQL + Prisma is authoritative. MongoDB should not be introduced. | Enforce strictly |
| UI/UX Design Decisions | **Governance Invariant** | Stop and ask founder for design direction, references, and interaction preferences before implementing new UI/UX surfaces. | Enforce strictly |

---

## 8.1 Infrastructure & Dependency Activation Map

| Dependency | Activation Point | Current Status | Setup Trigger & Notes |
|---|---|---|---|
| **GitHub** | **Sprint 2 Gate (Now)** | **Active Baseline (main branch)** | Monorepo source control baseline committed (`origin/main`). |
| **PostgreSQL** | **Sprint 1 / 2 (Now)** | **Active (Railway Staging + Prisma)** | Authoritative relational persistence layer on Railway internal VPC. |
| **Railway** | **Staging Gate (Now)** | **Active Staging Project** | Project `crazy-capital` (staging env, API service, PostgreSQL 18 SSL). |
| **Vercel** | **Staging Gate (Now)** | **Active Staging Linked** | Projects `web` and `admin` linked with `NEXT_PUBLIC_API_URL`. |
| **Cloudflare R2** | Sprint 4 (Vertical Slice 1.7) | Not yet required | Activated when Document Vault S3-compatible signed URLs are needed. |
| **Razorpay** | Sprint 5 (Vertical Slice 1.8) | Not yet required | Activated when customer payment orders and invoice settlement begin. |
| **Resend** | Sprint 5 (Vertical Slice 1.9) | Not yet required | Activated when event-driven transactional email dispatch is required. |
| **MSG91** | Sprint 5 (Vertical Slice 1.9) | Not yet required | Activated when transactional SMS/OTP notification delivery is required. |
| **Interakt** | Sprint 5 (Vertical Slice 1.9) | Not yet required | Activated when WhatsApp template notifications are required. |
| **Redis / BullMQ** | Phase 2 (SLA & Background Tasks) | Not yet required | Activated only when SLA escalations and background job queues are built. |
| **RazorpayX** | Phase 2 (Partner Payouts) | Not yet required | Activated for automated channel partner commission disbursements. |
| **OCR / Document AI** | Phase 4 (AI Automations) | Not yet required | Activated during automated KYC document extraction. |
| **AI Infrastructure** | Phase 4 (AI Automations) | Not yet required | Activated for conversational AI advisors. |

---

## 9. Technical debt and known issues

| Item | Impact | Priority | Owner | Planned trigger/remedy |
|---|---|---|---|---|
| Workflow rule schema (JSONB) is untyped | Risk of runtime errors in rule evaluation | High | Workflow module owner | Define TypeScript discriminated union type before Sprint 3 coding |
| No background job infrastructure defined | SLA tracking deferred | Medium | DevOps | Implement BullMQ or Railway cron before Phase 2 |
| Pricing model (branch/promotional) deferred | Only standard + partner pricing in Phase 1 | Low | Services module | Implement at Phase 2 |
| Slab-based commission deferred | Only flat + percentage in Phase 1 | Low | Commissions module | Implement at Phase 3 |

---

## 10. Lessons learned and rejected ideas

| Date | Learning or rejected approach | Why | Future guidance |
|---|---|---|---|
| Aug 2026 | Microservices rejected for Phase 1 | Team size and complexity do not justify it; modular monolith is faster to deliver and easier to reason about | Re-evaluate only after 500k+ customers and dedicated service teams |
| Aug 2026 | Hardcoded service workflows rejected | Adding new services would require developer effort; configuration-driven engine is more scalable | All service workflows must be configurable by admins without code changes |

---

## 11. Operational notes

- **Environments and release process:** development → staging (auto-deploy on push) → production (manual approval). Branch strategy: feature/* → develop → staging → main.
- **Backup and restore status:** Railway PostgreSQL automatic backups. R2 versioning TBD.
- **Monitoring and alerts:** Sentry (errors), BetterStack (uptime + logs), PostHog (analytics). Alert thresholds TBD.
- **Incident/runbook links:** TBD — create before go-live.

---

## 12. Recent changes

| Date | Change | Related feature/ADR | Documentation updated |
|---|---|---|---|
| Aug 2026 | Initial engineering memory populated from documentation review | All ADRs 001–010 | This file |
| Aug 2026 | Founder confirmed OQ-001 through OQ-004 | ADR-011, ADR-012, ADR-013, ADR-014 | engineering-memory.md, adr/ADR-011 through ADR-014 |
| Aug 2026 | Master 5-Phase Vertical Slice Implementation Plan locked | ADR-015 | Docs/Technical/13-master-implementation-plan-and-vertical-slices.md |
| Aug 2026 | **Sprint 2 Completed**: CRM Lead Engine (Slice 1.2) & Customer 360 (Slice 1.3) delivered across API, Prisma, Admin & Web frontends (24 acceptance tests) | ADR-013, ADR-015, Rule L1, L5, C3 | engineering-memory.md, apps/api, apps/admin, apps/web |
| Aug 2026 | **Sprint 3 Core Delivered**: Service Catalog Engine (Slice 1.4), Configurable Workflow Engine (Slice 1.5 - ADR-012), Application Lifecycle Matrix (Slice 1.6 - CC-YYYY-XXXXXX). 54/54 automated tests passing across 6 suites. | ADR-012, ADR-015, Slice 1.4, 1.5, 1.6 | engineering-memory.md, apps/api, @cc/types, @cc/validation |
| Aug 2026 | **Design Intelligence & UI Foundation Gate Completed**: 13 Stitch references audited, inspiration map & when-to-use guide documented, semantic design token architecture established. | ADR-016 | Docs/stitch-inspiration-map.md, engineering-memory.md |
| Aug 2026 | **Staging Infrastructure & Token Activation Gate Completed**: Railway Staging Project & PostgreSQL 18 provisioned via CLI, Vercel web/admin linked, UI primitives harmonized in @cc/ui, Slice 1.7 prepared. | ADR-017 | Docs/staging-infrastructure.md, railway.json, @cc/ui |



