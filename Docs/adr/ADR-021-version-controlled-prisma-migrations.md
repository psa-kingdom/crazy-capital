# ADR-021 - Version-Controlled Prisma Migrations & Safe Deployment Workflow

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-09-09 |
| Decider | Architecture Team / Engineering Lead |
| Category | Database Infrastructure & Deployment Safety |

---

## Context

Previously, the production deployment pipeline on Railway relied on:
```bash
prisma db push --accept-data-loss
```
While `db push` is convenient for greenfield experimentation, in production it bypassed schema version tracking (`_prisma_migrations`), did not produce reproducible SQL audit trails, and presented a catastrophic risk of silent data loss or column/table drops during automatic deployments.

To achieve production stability and enterprise auditability, the database schema synchronization strategy must be transitioned to deterministic, version-controlled migrations executed via `prisma migrate deploy`.

## Decision

1. **Retire `db push --accept-data-loss` entirely**: Completely purge `--accept-data-loss` and `db push` from all production deployment scripts and container commands.
2. **Version-Controlled Baseline (`0_init`)**: Generate an initial baseline migration representing the active PostgreSQL schema using `prisma migrate diff`. This baseline file is checked into version control at `apps/api/prisma/migrations/0_init/migration.sql`.
3. **Safe Production Baselining (`migrate resolve`)**: For already-populated production databases, apply the baseline using `prisma migrate resolve --applied 0_init` rather than re-running `CREATE TABLE` statements, preventing collisions or data disruption.
4. **Automated Non-Destructive Deployment**: Configure the production release/startup process in `railway.json` to execute:
```bash
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```
This fails closed if unapplied migrations fail, and never drops data without explicit, reviewed SQL migration scripts.

## Consequences

### Development Workflow
Developers making schema changes must now:
1. Update `apps/api/prisma/schema.prisma`.
2. Generate migration locally:
   ```bash
   npx prisma migrate dev --name <descriptive_name> --schema=apps/api/prisma/schema.prisma
   ```
3. Inspect and verify the generated SQL in `apps/api/prisma/migrations/<timestamp>_<descriptive_name>/migration.sql`.
4. Commit the migration directory alongside code changes.

### Production Deployment
- CI/CD and Railway execute `npx prisma migrate deploy`.
- Unapplied migrations apply sequentially in a transaction.
- If a migration cannot be applied cleanly, deployment halts before runtime startup.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Retain `prisma db push` in production | Poses irreversible risk of accidental schema destruction and data loss. |
| External migration tool (e.g., Flyway, Liquibase) | Unnecessary operational complexity when Prisma's native migration engine is already integrated. |
