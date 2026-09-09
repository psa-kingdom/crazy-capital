# Crazy Capital — Project Migration & Agent Handoff Guide

**Product:** Crazy Capital — India's Business Operating System 🇮🇳  
**Current Milestone:** Slice A (Production Stabilization, Migration Safety & Monorepo Consolidation) Completed ✅  
**Architecture Status:** Monorepo Consolidated (`@cc/web`, `@cc/api`, 5 shared packages). Standalone `apps/admin` decommissioned (ADR-022).  
**Database Workflow:** Version-controlled Prisma migrations with `prisma migrate deploy` (ADR-021). `--accept-data-loss` eliminated.  
**Date:** September 2026

---

## 1. System Architecture & Topology

Crazy Capital operates as a high-performance Turborepo monorepo:

| Component | Directory | Local Port | Tech Stack | Purpose |
|---|---|---|---|---|
| **Platform API** | `apps/api` | `http://localhost:4000` | NestJS 10, Prisma 5, Passport JWT, Swagger | Central REST API, multi-tenant DB, domain services |
| **Unified Web App** | `apps/web` | `http://localhost:3000` | Next.js 15 (App Router), TailwindCSS, `@cc/ui` | Public landing, Customer Portal, Partner Hub, Employee Desk, and Admin Cockpit (`/admin`) |
| **Shared Types** | `packages/types` | N/A | TypeScript | Shared domain models, DTOs, and interfaces |
| **UI Primitives** | `packages/ui` | N/A | React 19, TailwindCSS | Semantic Design Tokens, Radix-based UI components |
| **Validation Schemas** | `packages/validation` | N/A | Zod, class-validator | Shared request and form validation schemas |
| **Shared Utilities** | `packages/shared` | N/A | TypeScript | Formatting, currency helpers (INR / ₹), date math |
| **Shared Config** | `packages/config` | N/A | TypeScript | ESLint, TypeScript base configurations |

> **Note on Admin App Consolidation (ADR-022):** The legacy duplicate workspace `apps/admin` (port 3001) was decommissioned. All admin routes reside canonically at `apps/web/app/admin/*` (`http://localhost:3000/admin`).

---

## 2. Completed Phase Implementations (Phases 1–6)

The project has advanced through all planned core phases:

### Phase 1: Core Foundation, IAM & CRM Engine
- **Auth & IAM**: Argon2 password hashing, stateless 15-min JWT access tokens, 30-day refresh tokens with rotation in HttpOnly cookies, RBAC permissions guard (`@RequirePermissions`).
- **Multi-Tenancy**: Shared schema with `organization_id UUID` + `branch_id UUID` + soft-delete (`deleted_at`) scoping.
- **CRM Core**: Public & authenticated lead intake, state machine (`NEW → CONTACTED → QUALIFIED → PROPOSAL → CONVERTED/LOST`), configurable lead sources (`lead_sources`), lead assignments, activity timeline, Customer 360 profile.

### Phase 2: Service Delivery & Workflow Engine
- **Service Catalog**: Configurable categories, services, document requirements, dynamic form schemas.
- **Workflow Engine**: 1:1 Service-to-Workflow cardinality (ADR-012), sequential stage transitions, gate evaluation.
- **Document Vault**: Presigned binary uploads to Cloudflare R2 (ADR-004, ADR-018), admin verification, `DOCUMENT_GATE`.
- **SLA Engine**: SLA tracking, breach evaluation, escalation triggers.

### Phase 3: Financial Infrastructure & Billing Engine
- **Invoicing**: Sequential Indian GST-compliant invoices (`INV-YYYY-XXXXXX`), 18% CGST/SGST/IGST breakdown.
- **Payment Processing**: Full collection via Razorpay Orders (ADR-005, ADR-014, ADR-019), HMAC-SHA256 webhook validation, offline UTR reconciliation, deterministic mock gateway fallback, `PAYMENT_GATE`.

### Phase 4: Partner Ecosystem & Growth Engine
- **Partner Portal**: Partner profile management, multi-tier commission rules, partner-submitted lead attribution.
- **Commissions**: Automatic calculation on service completion, strict **Admin-only** approval flow (ADR-011), payout logs.

### Phase 5: Compliance, Operations & Notification Engine
- **Compliance & Mandates**: Recurring regulatory filing tracking, mandate management, due-date alerting.
- **Notification Matrix**: Unified event-driven dispatcher (ADR-020) supporting Resend (Email), MSG91 (SMS), and Interakt (WhatsApp) with deterministic mock fallbacks and deduplication.
- **Telemetry & Audit**: Immutable `audit_logs` for sensitive mutations, system health telemetry.

### Phase 6: Platform Scale & Value-Add Capabilities
- **Advanced Reporting**: Revenue, operations, customer conversion, and partner performance dashboards.
- **CMS**: SEO-optimized blogs, articles, dynamic page management.
- **Copilot & AI Assist**: Contextual AI assist surfaces.
- **White-Labeling**: Tenant branding, logo overrides, custom styling tokens.
- **Gov Integrations**: DigiLocker & SurePass verification client adapters with mock fallback.

### Slice A: Production Stabilization (Completed)
- **Database Safety (ADR-021)**: Versioned baseline migration (`0_init`), safe deploy via `prisma migrate deploy`, complete elimination of `--accept-data-loss`.
- **CORS Hardening (ADR-023)**: Removed raw wildcard origin reflection; implemented strict regex-based origin validation (`isOriginAllowed`) with credential protection.
- **Production Validation**: Fail-closed validation for `JWT_SECRET` and `JWT_REFRESH_SECRET` when `NODE_ENV=production`.
- **Environment Contract**: Aligned `.env.example` with code expectations (`RAZORPAY_KEY_SECRET`, `MSG91_AUTH_KEY`, `MSG91_DLT_TE_ID`, etc.) with non-breaking fallbacks.
- **Monorepo Consolidation (ADR-022)**: Removed obsolete `apps/admin`, synchronized workspace dependencies and scripts.

---

## 3. Database Migration Workflow & Production Setup

### Fresh Environment (Local / CI / Staging)
```bash
# Apply all pending migrations sequentially:
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Seed initial organization, branches, roles, permissions, admin user:
npx ts-node apps/api/prisma/seed.ts
```

### Existing Pre-Populated Production Database (One-Time Baseline)
Because previous deployments synchronized schema via `db push`, the production database already contains tables. Running `migrate deploy` directly would conflict with existing tables.
**One-Time Safe Baseline Command:**
```bash
npx prisma migrate resolve --applied 0_init --schema=apps/api/prisma/schema.prisma
```
*After executing this once, all subsequent deployments will run `npx prisma migrate deploy` safely without any data loss.*

### Future Schema Changes
1. Edit `apps/api/prisma/schema.prisma`.
2. Generate migration locally:
   ```bash
   npx prisma migrate dev --name <feature_name> --schema=apps/api/prisma/schema.prisma
   ```
3. Inspect the generated SQL in `apps/api/prisma/migrations/<timestamp>_<feature_name>/migration.sql`.
4. Commit the migration directory to git.
5. Railway/CI executes `prisma migrate deploy` automatically on release.

---

## 4. Local Development Guide

### Prerequisites
- **Node.js**: `>= 20.x` (LTS recommended)
- **npm**: `>= 10.x`
- **PostgreSQL**: Local instance or remote development connection string.

### Environment Setup
Copy `.env.example` in `apps/api`:
```bash
cp apps/api/.env.example apps/api/.env
```
Key configuration values for development:
```env
PORT=4000
NODE_ENV=development
API_PREFIX=api/v1
CORS_ORIGIN=http://localhost:3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crazy_capital?schema=public"
JWT_SECRET="local-dev-secret-key-minimum-32-characters-long"
JWT_REFRESH_SECRET="local-dev-refresh-secret-key-minimum-32-chars"
```
*(All third-party integrations: Razorpay, Resend, MSG91, Interakt, Cloudflare R2, DigiLocker, and SurePass have deterministic mock fallbacks for zero-dependency offline development).*

### Daily Commands
```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate --workspace=@cc/api

# Run local development servers (API: 4000, Web: 3000)
npm run dev

# Run individual apps
npm run dev:api    # NestJS API on http://localhost:4000 (Swagger: /api/docs)
npm run dev:web    # Next.js 15 Web & Admin on http://localhost:3000

# Full Quality Checks
npm test --workspace=@cc/api    # Run 38 unit test suites (251 tests)
npm run typecheck               # TypeScript verification across monorepo
npm run lint                    # ESLint across all workspaces
npm run build                   # Production builds for API and Web
```

---

## 5. Deployment Architecture

- **Web Frontend**: Hosted on Vercel, pointing to `apps/web`. Serves `https://crazycapital.in` and all sub-routes (`/admin/*`, `/partner/*`, `/customer/*`).
- **Backend API**: Hosted on Railway (`railway.json`).
  - Deploy command: `npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma && node apps/api/dist/apps/api/src/main.js`
  - Health check: `GET /api/v1/health`
- **Database**: PostgreSQL hosted on Railway.
- **Object Storage**: Cloudflare R2 bucket with signed URLs (private bucket).

---

## 6. Known Remaining Product Backlog

1. **Employee Leads Desk**: Fine-tune lead assignment queues and quick-dial action panels for telecallers.
2. **Native Dialog Replacements**: Replace legacy browser `alert()` and `confirm()` calls in older views with `@cc/ui` toast and dialog components.
3. **External Provider Live Activation**: When business licensing is finalized, transition SurePass, DigiLocker, and Razorpay credentials from test/mock mode to production credentials in Railway environment settings.
