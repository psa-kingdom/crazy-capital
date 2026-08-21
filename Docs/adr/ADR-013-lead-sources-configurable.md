# ADR-013 — Lead Sources are Admin-Configurable (Not a Hardcoded Enum)

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-21 |
| Decider | Founder |
| Category | CRM Module |

---

## Context

Every lead in the system must record how it was acquired (its source).
The open question was: should lead sources be a hardcoded application enum
(Website, Partner, Walk-in, etc.), or should they be configurable by an Admin
without requiring a code change?

## Decision

Lead sources are stored in a dedicated lead_sources table and managed by Admin
through the admin panel. No lead source values are hardcoded in application code.

## Data Model

### lead_sources table
```sql
id           UUID PRIMARY KEY
name         TEXT NOT NULL         -- e.g. "Website", "WhatsApp", "Walk-in"
code         TEXT NOT NULL UNIQUE  -- e.g. "WEBSITE", "WHATSAPP", "WALK_IN"
is_active    BOOLEAN DEFAULT true
created_at   TIMESTAMP
```

### leads table change
```sql
-- Instead of: source TEXT (hardcoded enum)
-- Use:
source_id    UUID FK -> lead_sources
```

## Seed Data (Initial lead sources to create on first migration)

| name | code |
|---|---|
| Website | WEBSITE |
| WhatsApp | WHATSAPP |
| Partner Referral | PARTNER_REFERRAL |
| Walk-in | WALK_IN |
| Cold Call | COLD_CALL |
| Social Media | SOCIAL_MEDIA |
| Email Campaign | EMAIL_CAMPAIGN |
| Event / Exhibition | EVENT |
| Employee Referral | EMPLOYEE_REFERRAL |
| Direct Call | DIRECT_CALL |

## API

- GET /api/v1/lead-sources           -- list all active sources (used in lead creation dropdowns)
- POST /api/v1/lead-sources          -- Admin creates new source
- PATCH /api/v1/lead-sources/:id     -- Admin updates source name / toggles active

## Consequences

### What this enables
- Marketing can add new sources (e.g., "Instagram Campaign") without a deployment
- Reporting can slice leads by source with full flexibility
- UTM parameter mapping: URL utm_source can be mapped to a lead_source code

### What this excludes
- Hard-typed source values in TypeScript enums or database CHECK constraints

### Code guidance
- NEVER use a TypeScript enum or string literal union for lead sources
- Always load sources from the database and pass source_id on lead creation
- Lead source report: JOIN leads ON lead_sources for human-readable names

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Hardcoded enum in DB (CHECK constraint) | Adding a new source requires a migration and deployment |
| Hardcoded TypeScript enum | Same problem; also breaks if DB and code fall out of sync |
