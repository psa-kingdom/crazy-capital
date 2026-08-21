# ADR-012 — Service to Workflow Cardinality is 1:1

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-21 |
| Decider | Founder |
| Category | Workflow Engine |

---

## Context

Every service on the Crazy Capital platform is executed through the workflow engine.
The open question was: can one service have multiple active workflows (e.g., Standard
vs Express variants), or does each service always map to exactly one workflow?

## Decision

One service maps to exactly one active workflow at any time (1:1 cardinality).
Multi-workflow-per-service is not supported in Phase 1.

## Data Model Implication

services table:
  workflow_id  UUID FK -> workflows  (nullable until workflow is assigned)

workflows table:
  service_id   UUID FK -> services   (unique — enforced by DB constraint)

```
Service (1)
  |
  v
Workflow (1) -- one active workflow per service
  |
  v
Workflow Stages (many)
```

### Constraint to enforce
```sql
ALTER TABLE workflows ADD CONSTRAINT uq_workflows_service_id UNIQUE (service_id);
```

## Consequences

### What this enables
- Simple, predictable workflow lookup: given application.service_id, load the
  one workflow, instantiate it
- Admin workflow configuration is straightforward — one workflow page per service
- No ambiguity about which workflow governs an application

### What this excludes (Phase 1)
- No Express/Standard/Premium variants of the same service via separate workflows
- No A/B testing of workflow paths

### Workaround for service variants
If a "GST Registration Express" service is needed, create it as a separate
service in the Service Catalog with its own workflow. The service name
communicates the variant; the workflow governs the process.

### Application creation
When an application is created:
  1. Load service.workflow_id
  2. Validate workflow is active (is_active = true)
  3. Instantiate workflow_instance linked to application + workflow
  4. Set current_stage to the workflow's is_start_stage = true stage

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| One service, multiple workflows | Adds complexity: which workflow to apply? Selection rules needed. Deferred to Phase 3+ |
| Workflow versioning (multiple versions of one workflow) | Reasonable future need; deferred — use new service entry as workaround |
