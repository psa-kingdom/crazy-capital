# ADR-015 — Master Vertical Slice Delivery Model (Phases 1–5)

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-21 |
| Decider | Engineering Team & Founder |
| Category | Delivery & Architecture Methodology |

---

## Context

To avoid disconnected frontends, mock data dead-ends, and unverified architecture, the development of Crazy Capital must follow a strict delivery model that ensures every sprint produces a fully functional, testable slice of the platform.

## Decision

All development across Crazy Capital will strictly adhere to the **5-Phase Vertical Slice Architecture Blueprint** documented in `Docs/Technical/13-master-implementation-plan-and-vertical-slices.md`.

### Delivery Invariant: The Complete Vertical Slice
Every feature/module must be built as an end-to-end vertical slice containing all layers:
1. **Prisma Models & Migrations** (Database schema & relations)
2. **NestJS Service & Business Logic** (Domain invariants & validations)
3. **Controller & REST Endpoints** (`/api/v1/` versioning + Swagger documentation)
4. **Security & Data Isolation** (RBAC guards + multi-tenancy filters)
5. **Shared Contracts** (Zod validation schemas + TypeScript types)
6. **Frontend UI Components & State** (Next.js 15 App Router + React Hook Form + TanStack Query)
7. **Automated Verification** (Tests confirming acceptance criteria)

### Phase Roadmap
- **Phase 1 (Sprints 1–8):** Core Operational Platform (Slices 1.1 to 1.13)
- **Phase 2 (Weeks 15–26):** Operational Excellence & SLA Escalation Engine (Slices 2.1 to 2.5)
- **Phase 3 (Weeks 27–36):** Nationwide Partner & Franchise Ecosystem (Slices 3.1 to 3.4)
- **Phase 4 (Weeks 37–50):** Automation, AI & Document Intelligence (Slices 4.1 to 4.4)
- **Phase 5 (Ongoing):** National Scale Platform & Enterprise SaaS (Slices 5.1 to 5.4)

## Consequences

- No feature is considered "Done" unless both API and UI are wired to PostgreSQL and passing tests.
- UI components will never rely on static mock data when an API slice is delivered.
- All future development prompts and sessions must reference `Docs/Technical/13-master-implementation-plan-and-vertical-slices.md` as the authoritative source of truth.
