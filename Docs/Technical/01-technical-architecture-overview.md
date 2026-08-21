# 01-technical-architecture-overview.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | Technical Architecture Overview |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Technical Architecture |
| Type | System Architecture Overview |

---

# Purpose

This document defines the overall technical architecture for Crazy Capital.

It provides a high-level view of:

- System Components
- Technology Stack
- Infrastructure
- Application Layers
- Data Flow
- Deployment Strategy
- Scalability Model

This document serves as the master technical reference for all engineering teams before detailed design and implementation begin.

---

# Architecture Vision

The platform should be:

- Cloud Native
- API First
- Modular
- Secure
- Scalable
- Multi-Branch Ready
- Automation Ready
- AI Ready
- Mobile Ready

while remaining simple enough for rapid development and deployment.

---

# Architecture Principles

---

## Principle 1

### CRM-Centric Architecture

The CRM acts as the central business engine.

Every business process originates from:

```text
Lead
↓
Customer
↓
Application
↓
Workflow
↓
Service Delivery
```

All modules integrate with CRM.

---

## Principle 2

### Modular Architecture

Each module should operate independently.

Examples:

```text
CRM Module
Workflow Module
Document Module
Notification Module
CMS Module
```

Benefits:

- Easier maintenance
- Faster development
- Better scalability

---

## Principle 3

### Domain-Driven Design

Architecture should be organized by business domains.

Examples:

```text
CRM
Services
Workflow
Documents
Payments
Partners
```

Not by UI screens.

---

## Principle 4

### Configuration Over Custom Code

Business users should configure:

- Services
- Workflows
- Pricing
- Documents
- Notifications
- Commissions

without engineering changes.

---

## Principle 5

### API First

All functionality must be accessible through APIs.

Benefits:

- Mobile apps
- Partner integrations
- Future AI integrations
- Third-party systems

---

# Approved Technology Stack

---

# Frontend Layer

### Framework

Next.js 15+

### Language

TypeScript

### Styling

Tailwind CSS

### UI Components

ShadCN UI

### State Management

Zustand

### Form Handling

React Hook Form

### Validation

Zod

### Data Fetching

TanStack Query

---

# Backend Layer

### Framework

NestJS

### Language

TypeScript

### API Style

REST API

(GraphQL optional in future)

### ORM

Prisma

### Validation

Class Validator

### Documentation

Swagger OpenAPI

---

# Database Layer

### Primary Database

PostgreSQL

### Hosting

Railway PostgreSQL

### Purpose

Stores:

- Users
- Leads
- Customers
- Applications
- Workflows
- Payments
- Commissions
- Audit Logs

---

# File Storage Layer

### Provider

Cloudflare R2

### Stores

- KYC Documents
- Service Documents
- Deliverables
- Certificates
- Reports
- Attachments

---

# Infrastructure Layer

### Frontend Hosting

Vercel

### Backend Hosting

Railway

### Database Hosting

Railway PostgreSQL

### Storage

Cloudflare R2

### DNS

Cloudflare

### CDN

Cloudflare

---

# External Services Layer

### Email

Resend

### SMS

MSG91

### WhatsApp

Interakt

### Payments

Razorpay

### Analytics

PostHog

### Error Monitoring

Sentry

### Logging

BetterStack

---

# High-Level Architecture

```text
                    USERS
                       │
        ┌──────────────┼──────────────┐
        │              │              │

   Website      Customer Portal   Partner Portal
        │              │              │
        └──────────────┼──────────────┘
                       │

                 Next.js Frontend
                       │
                       ▼

                  API Gateway
                       │
                       ▼

                 NestJS Backend
                       │

 ┌──────────┬──────────┬──────────┬──────────┐
 │          │          │          │
 ▼          ▼          ▼          ▼

CRM     Workflow   Documents   Payments

 │          │          │          │

 └──────────┼──────────┼──────────┘
            │
            ▼

       PostgreSQL Database

            │
            ▼

      Cloudflare R2 Storage

            │
            ▼

     External Service Layer
```

---

# System Layers

---

# Layer 1

## Presentation Layer

User-facing interfaces.

Includes:

### Public Website

Marketing and lead generation.

### Customer Portal

Customer operations.

### Partner Portal

Partner operations.

### Employee Portal

Internal operations.

### Admin Portal

Administration and configuration.

---

# Layer 2

## API Layer

Handles:

- Authentication
- Authorization
- Validation
- Routing
- API Versioning

Implemented using NestJS.

---

# Layer 3

## Business Logic Layer

Contains:

- CRM Logic
- Workflow Logic
- Commission Logic
- Payment Logic
- Service Logic

No UI code allowed.

---

# Layer 4

## Data Layer

Stores:

- Business Data
- User Data
- Application Data
- Logs

Implemented using PostgreSQL.

---

# Layer 5

## Integration Layer

Communicates with:

- Razorpay
- MSG91
- Resend
- Interakt
- Future APIs

---

# Core System Modules

---

## CRM Module

Manages:

- Leads
- Customers
- Activities
- Follow-Ups

Priority:

★★★★★

---

## Workflow Engine

Manages:

- Applications
- Tasks
- Stages
- Approvals

Priority:

★★★★★

---

## User Management

Manages:

- Customers
- Partners
- Employees
- Admins

Priority:

★★★★★

---

## Document Management

Manages:

- Upload
- Storage
- Verification

Priority:

★★★★★

---

## Notification Engine

Manages:

- Email
- SMS
- WhatsApp
- In-App

Priority:

★★★★★

---

## Service Management

Manages:

- Categories
- Services
- Pricing

Priority:

★★★★★

---

## CMS

Manages:

- Blogs
- Resources
- Landing Pages

Priority:

★★★★☆

---

## Commission Engine

Manages:

- Commission Rules
- Payouts
- Earnings

Priority:

★★★★☆

---

## Reporting Engine

Manages:

- Revenue
- Performance
- Productivity

Priority:

★★★★☆

---

# Portal Architecture

---

## Public Website

Purpose:

Lead generation.

Functions:

- Service Discovery
- Blogs
- Landing Pages
- Contact Forms

---

## Customer Portal

Purpose:

Self-service experience.

Functions:

- Applications
- Documents
- Payments
- Support Tickets

---

## Partner Portal

Purpose:

Partner operations.

Functions:

- Lead Submission
- Commission Tracking
- Case Tracking

---

## Employee Portal

Purpose:

Operations execution.

Functions:

- Lead Processing
- Workflow Management
- Task Management

---

## Admin Portal

Purpose:

Business control center.

Functions:

- Services
- Workflows
- Users
- Reports
- CMS
- Configuration

---

# Authentication Architecture

---

## Login Methods

Supported:

- Email + Password
- Mobile + OTP
- Google Login (Future)

---

## Security Mechanism

JWT Access Token

```text
15 Minutes
```

Refresh Token

```text
30 Days
```

---

## Session Management

- Token Rotation
- Device Tracking
- Session Revocation

---

# Authorization Architecture

Model:

RBAC

```text
Role
↓
Permissions
↓
User
```

Roles:

- Customer
- Partner
- Employee
- Branch Manager
- Admin
- Super Admin

---

# File Architecture

Storage:

Cloudflare R2

Files:

```text
/customer-documents
/service-documents
/deliverables
/reports
/uploads
```

Access:

- Signed URLs
- Role-Based Access

---

# Notification Architecture

Supported Channels:

- Email
- SMS
- WhatsApp
- In-App

Architecture:

```text
Event
↓
Notification Queue
↓
Channel Selection
↓
Delivery
```

---

# Scalability Model

---

## Phase 1

Expected Capacity:

- 5,000 Customers
- 50 Employees
- 100 Partners

---

## Phase 2

Expected Capacity:

- 50,000 Customers
- 500 Employees
- 1,000 Partners

---

## Phase 3

Expected Capacity:

- 500,000+ Customers
- Nationwide Operations

---

# Security Requirements

Mandatory:

- HTTPS Everywhere
- Password Hashing (Argon2)
- JWT Authentication
- Audit Logging
- Input Validation
- SQL Injection Protection
- Rate Limiting

---

# Monitoring & Observability

---

## Error Monitoring

Sentry

---

## Application Logs

BetterStack

---

## Product Analytics

PostHog

---

## Audit Logs

PostgreSQL

---

# Deployment Strategy

---

## Development

```text
Local Machine
↓
GitHub
↓
Preview Environment
```

---

## Staging

```text
GitHub
↓
Railway Staging
↓
Vercel Preview
```

---

## Production

```text
GitHub Main
↓
Railway Production
↓
Vercel Production
```

---

# Future Technical Roadmap

---

## Phase 2

- Payment Automation
- Workflow Automation
- Commission Automation
- Advanced Reporting

---

## Phase 3

- Mobile Applications
- AI Assistant
- Chatbot
- Auto Lead Qualification

---

## Phase 4

- Franchise Architecture
- Multi-Tenant Platform
- White Label Solutions
- SaaS Products

---

# Technical Success Criteria

The platform architecture should:

✅ Support all business domains

✅ Support multiple user types

✅ Support configurable workflows

✅ Support future mobile apps

✅ Support AI integrations

✅ Scale nationally

✅ Remain maintainable

✅ Minimize operational complexity

---

# Conclusion

The Crazy Capital technical architecture is designed as a modern cloud-native platform built on Next.js, NestJS, PostgreSQL, Railway, Cloudflare R2, and Vercel.

The architecture prioritizes modularity, scalability, security, configurability, and rapid development while establishing a strong foundation for future automation, AI capabilities, mobile applications, and nationwide expansion.

---

**Crazy Capital**
**Technical Architecture Foundation**
**Building India's Growth Story 🇮🇳**