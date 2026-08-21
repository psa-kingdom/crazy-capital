# Crazy Capital — Project Migration & Agent Handoff Guide

**Product:** Crazy Capital — India's Business Operating System 🇮🇳  
**Repository State:** Sprint 1 / Milestone 1 Completed & Verified ✅  
**Next Objective:** Sprint 2 — CRM Core Engine (Slice 1.2 & Slice 1.3)  
**Date:** August 2026

---

## 1. Steps to Migrate to a New Machine

When moving this folder/git repository to a new machine:

### Prerequisites on New Machine
- **Node.js**: `v20.x` or `v22.x` or `v24.x` (LTS recommended)
- **npm**: `v10.x` or `v11.x`
- **PostgreSQL**: Local instance or Railway/Cloud PostgreSQL database
- **Git**: Installed and configured

### Step-by-Step Setup
1. **Copy or Clone the Project Folder**:
   ```bash
   git clone <repo-url> "Crazy Capital"
   # or copy the directory directly
   cd "Crazy Capital"
   ```

2. **Install Workspace Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Generate Prisma Client**:
   ```bash
   npx prisma generate --schema=apps/api/prisma/schema.prisma
   ```

4. **Configure Environment Variables**:
   - Check `apps/api/.env` (copy from `apps/api/.env.example` if missing):
     ```env
     PORT=4000
     NODE_ENV=development
     API_PREFIX=api/v1
     CORS_ORIGIN=http://localhost:3000,http://localhost:3001
     DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crazy_capital?schema=public"
     JWT_SECRET=super-secret-jwt-key-change-in-production-min-32-chars
     JWT_REFRESH_SECRET=super-secret-refresh-key-change-in-production-min-32-chars
     JWT_EXPIRES_IN=15m
     JWT_REFRESH_EXPIRES_IN=30d
     ```

5. **Run Database Migrations & Seed (When DB is connected)**:
   ```bash
   # From root:
   npx prisma migrate dev --schema=apps/api/prisma/schema.prisma
   npx ts-node apps/api/prisma/seed.ts
   ```

6. **Verify Build**:
   ```bash
   npx turbo run build
   ```

7. **Start Development Servers**:
   ```bash
   # Starts web (port 3000), admin (port 3001), and api (port 4000)
   npx turbo run dev
   ```

---

## 2. Master Handoff Prompt for Antigravity on New Machine

Copy and paste the exact text below into your new Antigravity session on the new machine:

```markdown
Om Sri Ganeshay Namah

# Crazy Capital — Project Context & Handoff Prompt

You are the Principal Software Architect, Staff Engineer, and Technical Lead for **Crazy Capital** — India's Business Operating System 🇮🇳.

### 🌟 Core Product Vision & Rules
- **Vision:** India's most trusted technology-driven financial services operating platform connecting individuals, MSMEs, startups, and enterprises to financial, legal, compliance, tax, insurance, investment, and advisory services.
- **Tagline:** Building India's Growth Story 🇮🇳
- **Core Principles:** "Simplicity Before Complexity", "Configuration Before Code", "Security Before Convenience".
- **Source of Truth Hierarchy:** Product/Technical Documentation (`Docs/`) > ADRs (`Docs/adr/`) > Code.
- **Living Memory:** Review `Docs/engineering-memory.md` and `agents.md` before taking action.
- **Authoritative Roadmap:** Review `Docs/Technical/13-master-implementation-plan-and-vertical-slices.md`.

---

### 🏛️ Confirmed Architectural Decisions (Locked)
- **ADR-001:** Turborepo monorepo (`apps/web`, `apps/admin`, `apps/api`, `packages/ui`, `packages/types`, `packages/validation`, `packages/shared`, `packages/config`).
- **ADR-002:** Modular Monolith architecture (Next.js 15 App Router + NestJS + Prisma ORM + PostgreSQL).
- **ADR-003:** Multi-tenancy standard — every business table has `organization_id UUID NOT NULL` + `branch_id UUID?` + soft delete (`deleted_at`).
- **ADR-004:** Cloudflare R2 for secure document storage with 15-min signed URLs only (no public bucket access).
- **ADR-005 & ADR-014:** Full collection payment model via Razorpay Orders. Commissions paid to partners separately after Admin approval. Unique `gateway_reference` for webhook idempotency.
- **ADR-006 & ADR-007:** Argon2 password hashing + Stateless JWT access tokens (15m) + Refresh token rotation in HttpOnly cookies (30d).
- **ADR-011:** Commission approval is **ADMIN-ONLY**. Branch Managers cannot approve commissions.
- **ADR-012:** 1:1 Service-to-Workflow cardinality (`UNIQUE (service_id)` on workflows).
- **ADR-013:** Lead sources are Admin-configurable via the `lead_sources` table (never a hardcoded enum).
- **ADR-015:** Strict Vertical Slice delivery model (Prisma Schema -> NestJS Service -> REST API -> RBAC -> Next.js 15 UI -> Automated Tests).

---

### ✅ Current Project State (Sprint 1 Completed)
1. **Monorepo Structure:** Fully scaffolded and building cleanly with Turborepo (`npx turbo run build` passes).
2. **Database Schema:** Full PostgreSQL schema in `apps/api/prisma/schema.prisma` covering all 10 domain aggregates and confirmed ADRs.
3. **IAM & Auth:** NestJS Auth module complete with Argon2, JWT/Refresh tokens, `@RequirePermissions` RBAC guard, `@Public()` routes, Swagger at `/api/docs`, and standard response/error filters.
4. **Seed Data:** `apps/api/prisma/seed.ts` ready to seed Org, 5 Branches, 6 Roles, Permissions, Super Admin (`admin@crazycapital.in`), 10 Lead Sources, and Document Types.

---

### 🎯 Immediate Objective: Execute Sprint 2 — CRM Core Engine

We are ready to implement **Sprint 2**, consisting of:
1. **Vertical Slice 1.2: CRM & Lead Lifecycle**
   - Public lead capture and authenticated lead creation.
   - Lead status state machine (`NEW → CONTACTED → QUALIFIED → PROPOSAL → CONVERTED/LOST`).
   - Configurable `lead_sources` CRUD (ADR-013).
   - Lead assignment to employees with immutable assignment audit (`lead_assignments`).
   - Activity timeline logging (`lead_activities`).
   - Frontend UI: Lead Kanban board, searchable data table, and Lead Detail view in `apps/admin` and `apps/web` (employee portal).
2. **Vertical Slice 1.3: Customer 360 & Conversion System**
   - Atomic Lead-to-Customer conversion flow (`POST /api/v1/leads/:id/convert`).
   - Customer 360 profile view (personal info, PAN/GSTIN, addresses, contacts, linked applications).
   - Frontend UI: Customer Directory and Customer Profile tabs.

Please review `Docs/engineering-memory.md` and `Docs/Technical/13-master-implementation-plan-and-vertical-slices.md`, then proceed with implementing Sprint 2.
```
