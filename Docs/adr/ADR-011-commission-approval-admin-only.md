# ADR-011 — Commission Approval is Admin-Only

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-21 |
| Decider | Founder |
| Category | Commission Module |

---

## Context

The commission module calculates partner earnings when a service is completed.
Before a commission becomes payable, it requires an explicit approval step to
prevent incorrect payouts and maintain financial governance.

The open question was: Admin only, or can Branch Managers also approve
commissions for cases within their branch?

## Decision

Commission approval is exclusively an Admin-level action.
Branch Managers cannot approve commissions, even for their own branch.

## Commission State Machine

```
Service Completed
  -> Commission Calculated  (status: PENDING)
  -> Admin Reviews
  -> APPROVED  -> Payout Generated
  -> REJECTED  -> Partner Notified (no payout)
```

## Consequences

### Database
- commissions.status  enum: PENDING | APPROVED | REJECTED | PAID
- commissions.approved_by  UUID FK -> users  (must be Admin-role user)
- commissions.approved_at  TIMESTAMP
- commissions.rejection_reason  TEXT (nullable)

### API Permissions
- PATCH /api/v1/commissions/:id/approve  ->  permission: commission.approve
- PATCH /api/v1/commissions/:id/reject   ->  permission: commission.approve
- Roles with commission.approve: Super Admin, Admin only
- Branch Manager role: commission.view (branch-scoped) only — NOT commission.approve

### Partner Portal
- Partners see status: Pending / Approved / Rejected
- Partners receive notification on approval or rejection

### Admin Portal
- Commission approval queue is an Admin dashboard feature
- Filterable by branch, partner, service, date range

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Branch Manager approves for their branch | Risk of conflict of interest; Admin oversight required for all payouts |
| Auto-approve all commissions | No safeguard against calculation errors or disputes |
| Two-level approval (Branch Mgr -> Admin) | Adds process complexity; unnecessary for Phase 1 team size |
