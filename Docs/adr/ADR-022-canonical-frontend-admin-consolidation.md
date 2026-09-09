# ADR-022 - Canonical Frontend and Admin Consolidation

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-09 |
| Decider | Architecture Team / Engineering Lead |
| Category | Monorepo Structure & Frontend Topology |

---

## Context

The repository historically contained two administrative web interfaces:
1. `apps/web/app/admin`: Integrated directly within the unified Next.js 15 App Router frontend (`@cc/web`), featuring all Phase 1–6 features (Lead Kanban, Customer 360, Service Catalog, Workflow Management, Document Vault, Commission Approvals, Mandates, Compliance, Telemetry, White-Labeling, and Copilot).
2. `apps/admin`: A legacy, standalone Next.js application listening on port `3001` that was frozen at early Phase 2/3 state, lacking multiple production modules and creating duplicate maintenance overhead, split deployment pipelines, and configuration drift.

## Decision

1. **Retire Standalone `apps/admin`**: Completely remove the `apps/admin` workspace from the repository.
2. **Standardize on `apps/web/app/admin`**: Declare `apps/web` as the single canonical frontend application hosting the public landing pages, customer portal, partner portal, employee desk, and admin cockpit.
3. **Consolidate Local Development**: Standardize local development ports:
   - `apps/web` on `http://localhost:3000` (serving `/admin/*`, `/partner/*`, `/customer/*`, etc.)
   - `apps/api` on `http://localhost:4000`
4. **Update Workspace Scripts**: Remove `@cc/admin` workspace scripts from root `package.json` while maintaining developer aliases (`dev:admin` seamlessly runs `@cc/web dev`).

## Consequences

### Monorepo Simplicity
- Turborepo graph simplified to two main applications (`@cc/api`, `@cc/web`) and 5 shared packages (`@cc/ui`, `@cc/types`, `@cc/validation`, `@cc/shared`, `@cc/config`).
- Build and CI times significantly reduced by eliminating redundant Next.js compilation and bundle packaging.
- Eliminated cross-app sync issues for shared components, state stores, and session tokens.

### Security and Sessions
- Admin users and standard users authenticate through unified cookie and session storage, avoiding cross-domain / cross-port iframe and CORS token synchronizations.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Retain dual applications (`apps/admin` and `apps/web`) | High maintenance overhead, constant feature drift, and duplicated deployment costs. |
| Separate micro-frontends with Subdomain Routing | Over-engineering for current scale; App Router within `@cc/web` already provides clean route-group isolation (`app/admin/(authenticated)/...`). |
