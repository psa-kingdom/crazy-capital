# 12-api-integration-catalog.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | API Integration Catalog |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Integration Architecture |
| Type | External Systems Integration Catalog |

---

# Purpose

This document defines all external APIs, third-party services, government systems, communication channels, payment gateways, document providers, and future ecosystem integrations that will be used by the Crazy Capital platform.

The goal is to provide:

- Standardized Integrations
- Vendor Management
- Integration Architecture
- Security Standards
- Future Expansion Strategy

---

# Integration Philosophy

Every external integration must be:

```text
Loosely Coupled
Secure
Auditable
Replaceable
Configurable
```

The platform should never be tightly dependent on a single vendor.

---

# Integration Architecture

```text
Frontend
    │
    ▼

Backend API
    │
    ▼

Integration Layer
    │

 ┌─────────────┬─────────────┬─────────────┐
 │             │             │

Payments   Communication   Government

 │             │             │

 └─────────────┴─────────────┴─────────────┘

External APIs
```

---

# Integration Categories

---

## Category 1

### Communication APIs

Purpose:

```text
Email
SMS
WhatsApp
Notifications
```

---

## Category 2

### Payment APIs

Purpose:

```text
Payments
Invoices
Collections
Refunds
```

---

## Category 3

### Identity & Verification APIs

Purpose:

```text
KYC
PAN
GST
Verification
```

---

## Category 4

### Government APIs

Purpose:

```text
Compliance
Registrations
Tax
Filings
```

---

## Category 5

### Storage & Documents

Purpose:

```text
Documents
Reports
Exports
```

---

## Category 6

### Analytics & Monitoring

Purpose:

```text
Product Analytics
Monitoring
Observability
```

---

# COMMUNICATION INTEGRATIONS

---

# Integration 1

## Resend

Purpose:

```text
Transactional Emails
```

Examples:

- OTP
- Welcome Email
- Application Updates
- Invoice Emails

---

### Integration Type

```text
REST API
```

---

### Key APIs

```text
Send Email
Email Status
```

---

### Data Flow

```text
Application Event
↓
Notification Service
↓
Resend
↓
Customer
```

---

### Security

Store:

```text
RESEND_API_KEY
```

---

# Integration 2

## MSG91

Purpose:

```text
SMS Delivery
OTP
```

---

### Use Cases

- Login OTP
- Registration OTP
- Application Updates

---

### APIs

```text
Send SMS
Send OTP
Verify OTP
```

---

### Security

Store:

```text
MSG91_API_KEY
```

---

# Integration 3

## Interakt

Purpose:

```text
WhatsApp Business Messaging
```

---

### Use Cases

- Application Updates
- Payment Updates
- Lead Follow-Ups
- Workflow Alerts

---

### APIs

```text
Send Template Message
Send Notification
```

---

### Security

Store:

```text
INTERAKT_API_KEY
```

---

# PAYMENT INTEGRATIONS

---

# Integration 4

## Razorpay

Purpose:

```text
Online Payments
```

---

### Use Cases

- Service Fees
- Consultation Fees
- Processing Charges

---

### APIs

```text
Create Order

Capture Payment

Refund Payment

Webhook
```

---

### Data Flow

```text
Customer
↓
Razorpay Checkout
↓
Payment Success
↓
Webhook
↓
Application Updated
```

---

### Security

Store:

```text
RAZORPAY_KEY_ID

RAZORPAY_SECRET
```

---

### Webhooks

Events:

```text
payment.captured

payment.failed

refund.processed
```

---

# Integration 5

## RazorpayX (Future)

Purpose:

```text
Partner Payouts
```

---

### Use Cases

- Commission Settlement
- Vendor Payments

---

# DOCUMENT & STORAGE

---

# Integration 6

## Cloudflare R2

Purpose:

```text
Document Storage
```

---

### Stores

- PAN
- Aadhaar
- GST Certificates
- Invoices
- Reports

---

### Operations

```text
Upload

Download

Delete
```

---

### Security

Use:

```text
Signed URLs
```

Only.

---

# IDENTITY & VERIFICATION

---

# Integration 7

## Digilocker (Phase 3)

Purpose:

```text
Document Fetching
```

---

### Documents

- Aadhaar
- PAN
- Driving License
- Education Certificates

---

### Benefits

```text
Reduced Manual Uploads
```

---

# Integration 8

## CKYC (Future)

Purpose:

```text
Customer Verification
```

---

### Use Cases

- KYC Validation
- Identity Verification

---

# Integration 9

## PAN Verification API

Purpose:

```text
PAN Validation
```

---

### Use Cases

- Loan Applications
- Financial Products

---

### Expected Data

```json
{
  "pan": "ABCDE1234F",
  "name": "John Doe",
  "status": "VALID"
}
```

---

# Integration 10

## GST Verification API

Purpose:

```text
GST Validation
```

---

### Use Cases

- Business Registration
- GST Services
- Loan Processing

---

### Expected Data

```json
{
  "gstin": "22AAAAA0000A1Z5",
  "legalName": "ABC Pvt Ltd",
  "status": "ACTIVE"
}
```

---

# GOVERNMENT & COMPLIANCE INTEGRATIONS

---

# Integration 11

## MCA (Future)

Purpose:

```text
Company Incorporation
```

---

### Services

- Company Search
- Director Verification
- Company Status

---

# Integration 12

## GST Portal (Future)

Purpose:

```text
GST Related Services
```

---

### Services

- GST Registration Tracking
- GST Status Verification

---

# Integration 13

## Income Tax Systems (Future)

Purpose:

```text
ITR Related Services
```

---

### Services

- Filing Status
- PAN Validation

---

# Integration 14

## Account Aggregator (Future)

Purpose:

```text
Financial Data Sharing
```

---

### Use Cases

- Loan Eligibility
- Credit Assessment

---

# BANKING & FINTECH INTEGRATIONS

---

# Integration 15

## Loan Aggregator APIs

Examples:

```text
Paisabazaar

LendingKart

Banking Partners
```

---

### Purpose

```text
Loan Processing
```

---

### Workflow

```text
Customer Application
↓
Partner API
↓
Loan Status
↓
Customer Update
```

---

# Integration 16

## Insurance APIs

Examples:

```text
PolicyBazaar Partner APIs

Insurance Company APIs
```

---

### Purpose

```text
Policy Issuance
Renewal Tracking
```

---

# ANALYTICS & OBSERVABILITY

---

# Integration 17

## PostHog

Purpose:

```text
Product Analytics
```

---

### Track

- User Journey
- Feature Usage
- Funnel Analysis

---

### Events

```text
Lead Created

Application Submitted

Payment Completed
```

---

# Integration 18

## Sentry

Purpose:

```text
Error Tracking
```

---

### Track

```text
Backend Errors

Frontend Errors

API Failures
```

---

# Integration 19

## BetterStack

Purpose:

```text
Logging & Monitoring
```

---

### Track

```text
Application Logs

Infrastructure Logs

Alerts
```

---

# INTERNAL INTEGRATION FRAMEWORK

---

# Integration Service Layer

All third-party integrations must go through:

```text
Integration Module
```

Never:

```text
Call Vendors Directly
Inside Business Logic
```

---

# Structure

```text
integrations/

├── resend/
├── msg91/
├── interakt/
├── razorpay/
├── gst/
├── pan/
├── digilocker/
├── mca/
└── shared/
```

---

# Integration Interface Pattern

Example:

```typescript
interface EmailProvider {
  sendEmail(payload): Promise<void>;
}
```

---

### Benefits

```text
Vendor Replacement
Easy Testing
Mocking Support
```

---

# Webhook Architecture

---

## Supported Webhooks

### Razorpay

```text
Payment Success
Payment Failure
Refund
```

---

### Interakt

```text
Message Delivered
Message Failed
```

---

# Webhook Flow

```text
Vendor
↓
Webhook Endpoint
↓
Validation
↓
Event Processing
↓
Database Update
```

---

# Webhook Security

Mandatory:

```text
Signature Validation
```

---

# API Rate Limiting

All external integrations should support:

```text
Retry Logic

Timeout Handling

Circuit Breaker
```

---

### Default Timeout

```text
10 Seconds
```

---

### Retry Count

```text
3 Retries
```

---

# Integration Audit Logs

All integration activity must be logged.

---

## integration_logs

```sql
id UUID

provider

request_type

status

reference_id

response_code

created_at
```

---

# Error Handling Standards

---

## Vendor Failure

System should:

```text
Retry
Log
Notify
```

---

## Vendor Timeout

System should:

```text
Fail Gracefully
```

---

## Webhook Failure

System should:

```text
Queue Retry
```

---

# API Versioning

Track:

```text
Provider Version

Internal Version
```

Example:

```text
Razorpay v1

Internal v1
```

---

# Future Integration Roadmap

---

## Phase 2

```text
RazorpayX

Advanced GST APIs

Partner APIs
```

---

## Phase 3

```text
Digilocker

MCA

CKYC

Account Aggregator
```

---

## Phase 4

```text
AI Services

OCR Services

Document Intelligence
```

---

## Phase 5

```text
Government Ecosystem APIs

Open Finance APIs

National Scale Integrations
```

---

# Architecture Decision Record

| Decision | Status |
|-----------|---------|
| Resend Email | ✅ Approved |
| MSG91 SMS | ✅ Approved |
| Interakt WhatsApp | ✅ Approved |
| Razorpay Payments | ✅ Approved |
| Cloudflare R2 | ✅ Approved |
| Integration Layer Pattern | ✅ Approved |
| Webhook Framework | ✅ Approved |
| Digilocker | ⏳ Future |
| CKYC | ⏳ Future |
| Account Aggregator | ⏳ Future |

---

# Integration Readiness Matrix

| Integration | Phase |
|-------------|--------|
| Resend | Phase 1 |
| MSG91 | Phase 1 |
| Interakt | Phase 1 |
| Razorpay | Phase 1 |
| Cloudflare R2 | Phase 1 |
| PostHog | Phase 1 |
| Sentry | Phase 1 |
| BetterStack | Phase 1 |
| GST Verification | Phase 2 |
| PAN Verification | Phase 2 |
| Digilocker | Phase 3 |
| CKYC | Phase 3 |
| MCA | Phase 3 |
| Account Aggregator | Phase 4 |

---

# Conclusion

The Crazy Capital API Integration Catalog establishes a standardized framework for connecting the platform with payment providers, communication systems, verification services, government ecosystems, analytics tools, and future fintech partners. The architecture ensures vendor independence, operational reliability, scalability, and auditability while enabling rapid expansion of services across India.

---

**Crazy Capital**
**Integration Architecture Framework**
**Building India's Growth Story 🇮🇳**