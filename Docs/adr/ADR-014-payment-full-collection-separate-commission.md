# ADR-014 — Full Payment Collection + Separate Commission Payout Model

| Field | Value |
|---|---|
| Status | Accepted |
| Date | 2026-08-21 |
| Decider | Founder |
| Category | Payments + Commission Modules |

---

## Context

When a partner refers a customer and the customer pays for a service, two
financial flows are involved:
  1. Customer pays for the service
  2. Partner earns a commission

The open question was: does Crazy Capital use a split payment (Razorpay collects
and splits at collection time), or does Crazy Capital collect the full amount and
pay the partner commission separately?

## Decision

Crazy Capital collects the full service fee from the customer via Razorpay.
The partner commission is calculated, approved by Admin, and paid out to the
partner as a separate transaction — not at the time of collection.

## Payment Flow (Phase 1)

```
Customer pays full amount (Razorpay)
  -> Payment captured
  -> Invoice marked PAID
  -> Workflow advanced (if payment_gate rule)
  -> Service delivered

                    (separately, after service completion)

Admin reviews commission
  -> Commission APPROVED
  -> Payout record created  (status: PENDING_PAYOUT)
  -> Manual bank transfer / Phase 2: RazorpayX automated payout
  -> Payout marked PAID
```

## Data Model

### invoices table
- customer_id, application_id, service_id
- amount   (full service fee — no deductions)
- status: DRAFT | SENT | PAID | CANCELLED

### payments table
- invoice_id, gateway: RAZORPAY, gateway_reference (UNIQUE — idempotency)
- amount, status: PENDING | CAPTURED | FAILED | REFUNDED

### commissions table
- application_id, partner_id, service_id
- base_amount    (the invoice amount used for calculation)
- commission_rate, commission_amount
- status: PENDING | APPROVED | REJECTED | PAID

### payouts table (Phase 1: manual tracking)
- commission_id, partner_id
- amount, payment_method: BANK_TRANSFER | RAZORPAYX
- status: PENDING_PAYOUT | PAID | FAILED
- paid_at, reference_number (UTR / transaction ID)
- notes

## Phase Roadmap

| Phase | Commission Payout Method |
|---|---|
| Phase 1 (MVP) | Manual bank transfer; Admin records payout manually in system |
| Phase 2 | RazorpayX integration for automated NEFT/IMPS payouts to partners |

## What this explicitly excludes

- No split payment at Razorpay order level (Razorpay Route not used)
- No real-time commission disbursement at payment time
- No escrow or hold model

## Consequences

### Razorpay integration
- Use standard Razorpay Orders API only (not Route/Marketplace API)
- Webhook events: payment.captured, payment.failed, refund.processed
- gateway_reference must have UNIQUE DB constraint for idempotency

### Commission timing
- Commission is created AFTER service is marked Complete (not at payment time)
- Commission amount = base_amount * commission_rate (flat or percentage, per ADR-011)

### Partner transparency
- Partners see: "Commission Earned: Rs X — Status: Pending Approval"
- Partners do NOT see the customer payment amount
- Partners receive notification when commission is Approved or Rejected

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Razorpay Route (split at collection) | Requires marketplace account; complex partner onboarding; overkill for Phase 1 |
| Real-time auto-payout | Requires Admin approval first (ADR-011); cannot be instant |
