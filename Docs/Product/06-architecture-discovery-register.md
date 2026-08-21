# 06-architecture-discovery-register.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | Architecture Discovery Register |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Discovery Complete |
| Category | Solution Architecture |
| Type | Architecture Discovery & System Planning |

---

# Purpose

This document captures all major architectural decisions, assumptions, constraints, dependencies, scalability requirements, integration requirements, and technical considerations identified during the product discovery phase.

The objective is to create a blueprint that guides:

- System Architecture
- Database Design
- Backend Design
- Frontend Design
- Infrastructure Design
- Security Design
- API Design
- Deployment Planning

This document is intentionally technology-agnostic at the business layer while mapping to the approved implementation stack.

---

# Approved Technology Stack

## Frontend

### Framework

- Next.js

### Language

- TypeScript

### UI Library

- ShadCN UI

### Styling

- Tailwind CSS

### State Management

- Zustand

### Forms

- React Hook Form

### Validation

- Zod

---

## Backend

### Framework

- NestJS

### Language

- TypeScript

### API

- REST API

(GraphQL can be added later)

---

## Database

### Primary Database

- PostgreSQL

---

## Storage

### Object Storage

- Cloudflare R2

Used for:

- Documents
- Deliverables
- Attachments
- KYC Files
- Reports

---

## Hosting

### Frontend

- Vercel

### Backend

- Railway

### Database

- Railway PostgreSQL

---

## Authentication

- JWT
- Refresh Tokens
- RBAC

---

# Architectural Principles

---

## Principle 1

### CRM First

Everything begins from CRM.

```text
Lead
↓
Customer
↓
Application
↓
Workflow
↓
Completion
```

All modules must connect back to CRM.

---

## Principle 2

### Modular Architecture

Every business domain should be independently manageable.

Example:

```text
Tax Module
Finance Module
Insurance Module
Legal Module
```

Each module can evolve independently.

---

## Principle 3

### Domain Driven Structure

The platform should be structured around domains rather than pages.

Example:

```text
CRM
Workflow
Documents
Payments
Notifications
```

instead of

```text
Dashboard
Forms
Pages
Menus
```

---

## Principle 4

### Configuration Over Code

Admins should configure business behavior without developer intervention.

Examples:

- Workflow Setup
- Service Setup
- Pricing Rules
- Commission Rules
- Documents Required

---

## Principle 5

### Multi-Tenant Ready

Although Phase 1 is a single organization system, architecture must allow future support for:

- Franchises
- Regional Offices
- White Label Clients

---

# High-Level Architecture

```text
Frontend (Next.js)
        │
        ▼
API Gateway Layer
        │
        ▼
NestJS Backend
        │
 ┌──────┼────────┐
 │      │        │
 ▼      ▼        ▼

PostgreSQL
Cloudflare R2
Notification Services
```

---

# System Modules

The platform is composed of shared modules and business modules.

---

# Shared Core Modules

These modules are mandatory.

---

## CRM Module

Purpose:

Manage:

- Leads
- Customers
- Activities
- Interactions

Criticality:

★★★★★

---

## Workflow Engine

Purpose:

Manage:

- Applications
- Tasks
- Approvals
- Statuses

Criticality:

★★★★★

---

## Authentication Module

Purpose:

- Login
- Permissions
- Security

Criticality:

★★★★★

---

## User Management Module

Purpose:

Manage:

- Customers
- Partners
- Employees
- Admins

Criticality:

★★★★★

---

## Document Management Module

Purpose:

Manage:

- Uploads
- Verification
- Storage

Criticality:

★★★★★

---

## Notification Module

Purpose:

Manage:

- Email
- SMS
- WhatsApp
- In-App

Criticality:

★★★★★

---

## Reporting Module

Purpose:

Generate:

- Revenue Reports
- Operations Reports
- Partner Reports

Criticality:

★★★★☆

---

# Business Modules

---

## Service Catalog Module

Purpose:

Manage:

- Categories
- Services
- Pricing
- Service Visibility

---

## Application Module

Purpose:

Manage:

- Service Requests
- Applications
- Processing

---

## Commission Module

Purpose:

Manage:

- Partner Earnings
- Payouts
- Calculations

---

## CMS Module

Purpose:

Manage:

- Blogs
- Articles
- Pages
- Resources

---

## Branch Management Module

Purpose:

Manage:

- Branches
- Teams
- Performance

---

# Portal Architecture

---

## Public Website

Functions:

- Service Discovery
- Lead Generation
- Blogs
- Contact Forms

No login required.

---

## Customer Portal

Functions:

- Applications
- Documents
- Payments
- Support

---

## Partner Portal

Functions:

- Lead Submission
- Case Tracking
- Commission Tracking

---

## Employee Portal

Functions:

- Lead Management
- Task Management
- Workflow Processing

---

## Admin Portal

Functions:

- Configuration
- Reporting
- Governance

---

# Database Architecture Discovery

---

## Core Business Entities

Identified entities:

### Users

```text
User
Role
Permission
```

---

### CRM

```text
Lead
Lead Activity
Customer
Customer Contact
```

---

### Services

```text
Category
Service
Pricing
```

---

### Workflow

```text
Workflow
Stage
Transition
Task
```

---

### Applications

```text
Application
Application Stage
Application Activity
```

---

### Documents

```text
Document
Document Type
Verification
```

---

### Payments

```text
Payment
Invoice
Transaction
```

---

### Partners

```text
Partner
Commission
Payout
```

---

### Organization

```text
Branch
Department
Team
```

---

# Integration Discovery

---

## Email Provider

Required.

Possible options:

- Resend
- SendGrid
- AWS SES

Recommended:

**Resend**

---

## SMS Provider

Required.

Possible options:

- MSG91
- Twilio
- Gupshup

Recommended:

**MSG91**

---

## WhatsApp Provider

Required.

Possible options:

- Interakt
- Gupshup
- Meta API

Recommended:

**Interakt**

---

## Payment Gateway

Required.

Possible options:

- Razorpay
- Cashfree

Recommended:

**Razorpay**

---

# Security Discovery

---

## Authentication

Requirements:

- JWT
- Refresh Token
- Secure Sessions

---

## Authorization

Requirements:

- RBAC
- Permission Groups
- Branch-Level Access

---

## Data Protection

Requirements:

- Encrypted Passwords
- Secure File URLs
- Audit Logging

---

# Scalability Discovery

---

## Phase 1 Target

Expected:

- 5,000 Customers
- 50 Employees
- 100 Partners

---

## Phase 2 Target

Expected:

- 50,000 Customers
- 500 Employees
- 1,000 Partners

---

## Phase 3 Target

Expected:

- 500,000+ Customers
- Nationwide Operations

---

# Performance Requirements

---

## API Response

Target:

```text
< 500 ms
```

for standard requests.

---

## Dashboard Load

Target:

```text
< 2 seconds
```

---

## File Upload

Target:

```text
< 10 seconds
```

for normal documents.

---

# Audit Requirements

Every critical action must be logged.

Examples:

- Login
- Lead Assignment
- Status Changes
- Workflow Updates
- Payments
- Commission Approval

---

# Observability Requirements

Must include:

- Error Logging
- Activity Logging
- Audit Logging

Recommended:

- Sentry
- BetterStack

---

# Future Architecture Considerations

---

## AI Assistant

Future capabilities:

- Service Recommendations
- Lead Qualification
- Customer Guidance

---

## Workflow Automation

Future capabilities:

- Auto Assignment
- Auto Escalation
- SLA Monitoring

---

## Mobile Apps

Future:

- Customer App
- Partner App
- Employee App

Architecture should remain API-first.

---

## Franchise Network

Future support:

```text
Organization
│
├── Branches
│
└── Franchise Units
```

---

# Architecture Risks

---

## Risk 1

Over-Customization

Mitigation:

- Configuration-driven design
- Standardized modules

---

## Risk 2

Workflow Complexity

Mitigation:

- Generic workflow engine
- Reusable stage templates

---

## Risk 3

Permission Complexity

Mitigation:

- RBAC-first approach
- Permission groups

---

## Risk 4

Document Storage Growth

Mitigation:

- Cloudflare R2
- Lifecycle policies

---

# Architecture Readiness Assessment

| Area | Status |
|--------|---------|
| Product Vision | ✅ Complete |
| Domains | ✅ Complete |
| Workflows | ✅ Complete |
| Business Rules | ✅ Complete |
| Access Discovery | ✅ Complete |
| Module Discovery | ✅ Complete |
| Architecture Discovery | ✅ Complete |
| Database Design | ⏳ Pending |
| API Design | ⏳ Pending |
| UI Design | ⏳ Pending |
| Development | ⏳ Pending |

---

# Summary

The Crazy Capital platform architecture is designed around a CRM-centric, workflow-driven, modular business operating system capable of supporting multiple service domains, customer types, partners, employees, and future national-scale expansion.

The architecture emphasizes:

- Modularity
- Configuration
- Scalability
- Security
- Automation
- Multi-branch readiness

while remaining simple enough for rapid Phase 1 development using Next.js, NestJS, PostgreSQL, Railway, Cloudflare R2, and Vercel.

---

**Crazy Capital**
**India's Business Operating System**
**Building India's Growth Story 🇮🇳**