# 05-backend-architecture-and-api-contracts.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | Backend Architecture & API Contracts |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Backend Architecture |
| Type | Service Architecture & API Standards |

---

# Purpose

This document defines the backend architecture, module boundaries, service structure, API standards, communication patterns, validation strategy, and API contract design for the Crazy Capital platform.

This document serves as the implementation blueprint for:

- NestJS Development
- PostgreSQL Integration
- Prisma Models
- API Development
- Authentication
- Workflow Engine
- Integrations
- Future Mobile Applications

---

# Backend Vision

The backend should be:

- Modular
- Domain Driven
- API First
- Secure
- Scalable
- Testable
- Event Ready
- Multi-Branch Ready

The backend acts as the central business engine of Crazy Capital.

---

# Backend Architecture Overview

```text
Frontend (Next.js)
        │
        ▼

API Gateway Layer
        │
        ▼

NestJS Application
        │

 ┌───────────────┬───────────────┬───────────────┐
 │               │               │

CRM         Workflow       Services

 │               │               │

 └───────────────┼───────────────┘

        Shared Modules

Authentication
Notifications
Documents
Payments
Audit

        │

        ▼

PostgreSQL + Prisma
```

---

# Architecture Style

Approved Style:

## Modular Monolith

Phase 1:

```text
Single NestJS Application
Multiple Modules
Shared Database
```

Benefits:

- Faster Development
- Easier Deployment
- Lower Cost
- Simpler Maintenance

---

# Future Evolution

Phase 3+

Potential move toward:

```text
Microservices
```

for:

- Notifications
- Payments
- Workflow Automation
- AI Services

No changes required in API design.

---

# Module Structure

Recommended Folder Structure:

```text
src/

├── modules/
│
├── auth/
├── users/
├── organizations/
├── crm/
├── customers/
├── services/
├── applications/
├── workflow/
├── documents/
├── payments/
├── partners/
├── commissions/
├── notifications/
├── cms/
├── reports/
├── audit/
│
├── common/
├── config/
├── prisma/
├── integrations/
└── shared/
```

---

# Core Modules

---

# Module 1

## Auth Module

Responsibilities:

- Login
- Logout
- Refresh Token
- Password Reset
- OTP Verification

Endpoints:

```text
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/send-otp
POST /auth/verify-otp
```

---

# Module 2

## User Module

Responsibilities:

- User Management
- Role Assignment
- Session Tracking

Endpoints:

```text
GET    /users
GET    /users/:id
POST   /users
PATCH  /users/:id
DELETE /users/:id
```

---

# Module 3

## CRM Module

Responsibilities:

- Leads
- Activities
- Assignments

Endpoints:

```text
GET    /leads
GET    /leads/:id

POST   /leads

PATCH  /leads/:id

DELETE /leads/:id
```

---

## Lead Assignment

```text
POST /leads/:id/assign
```

Request:

```json
{
  "assignedTo": "uuid"
}
```

---

## Lead Activity

```text
POST /leads/:id/activities
```

Request:

```json
{
  "activityType": "CALL",
  "notes": "Interested in GST Registration"
}
```

---

# Module 4

## Customer Module

Responsibilities:

- Customer Profiles
- Contacts
- Addresses

Endpoints:

```text
GET    /customers
GET    /customers/:id

POST   /customers

PATCH  /customers/:id

DELETE /customers/:id
```

---

# Module 5

## Service Catalog Module

Responsibilities:

- Categories
- Services
- Pricing

Endpoints:

```text
GET    /services
GET    /services/:id

POST   /services

PATCH  /services/:id
```

---

# Module 6

## Application Module

Responsibilities:

- Service Applications
- Assignment
- Tracking

Endpoints:

```text
GET    /applications
GET    /applications/:id

POST   /applications

PATCH  /applications/:id
```

---

## Create Application

Request:

```json
{
  "customerId": "uuid",
  "serviceId": "uuid"
}
```

Response:

```json
{
  "id": "uuid",
  "applicationNumber": "APP-2026-0001",
  "status": "CREATED"
}
```

---

# Module 7

## Workflow Module

Responsibilities:

- Workflow Definitions
- Stage Transitions
- Approvals

Endpoints:

```text
GET /workflows

POST /workflows

PATCH /workflows/:id
```

---

## Move Stage

Endpoint:

```text
POST /applications/:id/transition
```

Request:

```json
{
  "toStageId": "uuid",
  "remarks": "Documents verified"
}
```

---

# Module 8

## Document Module

Responsibilities:

- Upload
- Verification
- Storage

Endpoints:

```text
POST /documents/upload

GET /documents/:id

PATCH /documents/:id/verify
```

---

## Upload Response

```json
{
  "documentId": "uuid",
  "fileUrl": "signed-url"
}
```

---

# Module 9

## Payment Module

Responsibilities:

- Invoices
- Payments
- Refunds

Endpoints:

```text
GET /payments

POST /payments/create-order

POST /payments/webhook

POST /refunds
```

---

## Razorpay Order Creation

Request:

```json
{
  "applicationId": "uuid",
  "amount": 4999
}
```

Response:

```json
{
  "orderId": "order_xxx",
  "amount": 4999
}
```

---

# Module 10

## Partner Module

Responsibilities:

- Partners
- Referrals
- Cases

Endpoints:

```text
GET /partners

POST /partners

GET /partners/:id
```

---

## Submit Lead

```text
POST /partners/leads
```

Request:

```json
{
  "name": "John Doe",
  "mobile": "9999999999",
  "serviceId": "uuid"
}
```

---

# Module 11

## Commission Module

Responsibilities:

- Earnings
- Payouts
- Calculations

Endpoints:

```text
GET /commissions

GET /commissions/me

POST /commissions/calculate
```

---

# Module 12

## Notification Module

Responsibilities:

- Email
- SMS
- WhatsApp
- In-App

Endpoints:

```text
POST /notifications/send

GET /notifications
```

---

# Module 13

## CMS Module

Responsibilities:

- Blogs
- Pages
- Resources

Endpoints:

```text
GET /cms/articles

POST /cms/articles

PATCH /cms/articles/:id
```

---

# Module 14

## Report Module

Responsibilities:

- Revenue Reports
- Operational Reports

Endpoints:

```text
GET /reports/revenue

GET /reports/operations

GET /reports/partners
```

---

# API Standards

---

# URL Structure

Use:

```text
/api/v1/
```

Example:

```text
/api/v1/leads
/api/v1/customers
```

---

# HTTP Methods

Use:

```text
GET
POST
PATCH
DELETE
```

Only.

---

# Success Response Format

Standard:

```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {}
}
```

---

# Error Response Format

Standard:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# Pagination Standard

Request:

```text
?page=1&limit=20
```

Response:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 500
  }
}
```

---

# Filtering Standard

Example:

```text
/leads?status=NEW

/customers?branchId=xyz
```

---

# Sorting Standard

Example:

```text
/leads?sortBy=createdAt&order=desc
```

---

# Validation Architecture

Validation Library:

```text
class-validator
```

Example DTO:

```typescript
export class CreateLeadDto {
  @IsString()
  firstName: string;

  @IsEmail()
  email: string;
}
```

---

# Authentication Middleware

Every protected API must validate:

```text
JWT
```

---

# Authorization Middleware

Every protected API must validate:

```text
Permission
```

Example:

```typescript
@Permissions("lead.create")
```

---

# Scope Middleware

Must validate:

```text
Organization Scope
Branch Scope
```

before returning data.

---

# Event Architecture

Phase 1:

Simple Domain Events.

Examples:

```text
LeadCreated
LeadAssigned

ApplicationCreated

PaymentCompleted

DocumentVerified
```

---

# Event Flow

```text
Action
↓
Domain Event
↓
Notification
↓
Audit Log
```

---

# File Upload Architecture

Flow:

```text
Frontend
↓
Backend
↓
Cloudflare R2
↓
Store Metadata
```

Store only:

```text
URL
Metadata
```

inside PostgreSQL.

---

# API Documentation

Tool:

```text
Swagger OpenAPI
```

Route:

```text
/api/docs
```

Mandatory for every endpoint.

---

# Logging Strategy

Must Log:

- Requests
- Errors
- Exceptions
- Critical Actions

Recommended:

```text
Pino Logger
```

---

# Monitoring Strategy

Tools:

```text
Sentry
BetterStack
```

Monitor:

- Errors
- Latency
- Failed Jobs
- Failed Integrations

---

# API Versioning

Format:

```text
/api/v1/
```

Future:

```text
/api/v2/
```

Never break existing clients.

---

# Backend Readiness Matrix

| Module | Status |
|----------|---------|
| Auth | ✅ |
| Users | ✅ |
| CRM | ✅ |
| Customers | ✅ |
| Services | ✅ |
| Applications | ✅ |
| Workflow | ✅ |
| Documents | ✅ |
| Payments | ✅ |
| Partners | ✅ |
| Notifications | ✅ |
| CMS | ✅ |
| Reports | ✅ |

---

# Conclusion

The Crazy Capital backend architecture is designed as a modular NestJS application with domain-driven modules, standardized API contracts, secure authentication, RBAC authorization, event-driven workflows, and PostgreSQL persistence.

The architecture supports rapid Phase 1 development while providing a clean path toward automation, mobile applications, AI integrations, and future microservice adoption.

---

**Crazy Capital**
**Backend Architecture Foundation**
**Building India's Growth Story 🇮🇳**