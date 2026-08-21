# 04-domain-model-and-database-design.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | Domain Model & Database Design |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Data Architecture |
| Type | Domain Model & Database Foundation |

---

# Purpose

This document defines the complete domain model and database architecture for Crazy Capital.

It establishes:

- Business Entities
- Relationships
- Aggregate Boundaries
- Database Structure
- Ownership Models
- Multi-Branch Support
- Scalability Strategy

This document serves as the master foundation for:

- PostgreSQL Schema Design
- Prisma Models
- NestJS Modules
- API Design
- Reporting Architecture

---

# Database Philosophy

The database must be:

- Normalized
- Scalable
- Audit Friendly
- Multi-Branch Ready
- Future Franchise Ready
- Future SaaS Ready

The architecture follows:

```text
Organization
↓
Users
↓
CRM
↓
Applications
↓
Workflow
↓
Service Delivery
```

---

# Domain Model Overview

```text
Organization Domain
│
├── User Domain
├── CRM Domain
├── Service Domain
├── Application Domain
├── Workflow Domain
├── Document Domain
├── Payment Domain
├── Commission Domain
├── Notification Domain
├── CMS Domain
├── Reporting Domain
└── Audit Domain
```

---

# Core Entity Relationships

```text
Organization
│
├── Branch
│
├── User
│
├── Lead
│
├── Customer
│
├── Application
│
├── Payment
│
└── Reports
```

---

# Domain 1

# Organization Domain

---

## Purpose

Represents business ownership structure.

---

## Tables

### organizations

```sql
id UUID PK

name
legal_name
code

status

created_at
updated_at
```

---

### branches

```sql
id UUID PK

organization_id FK

name
code

city
state

status

created_at
updated_at
```

---

### departments

```sql
id UUID PK

organization_id FK
branch_id FK

name
description
```

---

### teams

```sql
id UUID PK

department_id FK

name
description
```

---

# Domain 2

# Identity Domain

---

## Purpose

Authentication and authorization.

---

## Tables

### users

```sql
id UUID PK

organization_id FK
branch_id FK

first_name
last_name

email
mobile

password_hash

status

last_login_at

created_at
updated_at
```

---

### roles

```sql
id UUID PK

name
code

description
```

---

### permissions

```sql
id UUID PK

name
code

module
```

---

### user_roles

```sql
user_id FK
role_id FK
```

---

### role_permissions

```sql
role_id FK
permission_id FK
```

---

### user_sessions

```sql
id UUID PK

user_id FK

refresh_token

device_name
ip_address

expires_at
```

---

# Domain 3

# CRM Domain

---

## Purpose

Lead and customer management.

---

# Lead Aggregate

---

### leads

```sql
id UUID PK

organization_id FK
branch_id FK

assigned_to FK

source
campaign

first_name
last_name

email
mobile

status

lead_score

created_at
updated_at
```

---

### lead_activities

```sql
id UUID PK

lead_id FK

activity_type

notes

performed_by FK

created_at
```

---

### lead_assignments

```sql
id UUID PK

lead_id FK

assigned_from
assigned_to

assigned_at
```

---

### lead_tags

```sql
id UUID PK

name
```

---

### lead_tag_mapping

```sql
lead_id
tag_id
```

---

# Customer Aggregate

---

### customers

```sql
id UUID PK

organization_id FK
branch_id FK

customer_type

first_name
last_name

email
mobile

company_name

status

created_at
updated_at
```

---

### customer_addresses

```sql
id UUID PK

customer_id FK

type

address_line_1
address_line_2

city
state
country

pincode
```

---

### customer_contacts

```sql
id UUID PK

customer_id FK

name
mobile
email
designation
```

---

# Domain 4

# Service Catalog Domain

---

## Purpose

Manage services offered by platform.

---

### service_categories

```sql
id UUID PK

parent_id FK

name
slug

description
```

---

### services

```sql
id UUID PK

category_id FK

name
slug

description

is_active

created_at
updated_at
```

---

### service_pricing

```sql
id UUID PK

service_id FK

pricing_type

amount

effective_from
effective_to
```

---

### service_documents

```sql
id UUID PK

service_id FK

document_type_id FK

is_mandatory
```

---

# Domain 5

# Application Domain

---

## Purpose

Service request lifecycle.

---

### applications

```sql
id UUID PK

organization_id FK
branch_id FK

customer_id FK
service_id FK

application_number

status

assigned_to FK

created_at
updated_at
```

---

### application_activities

```sql
id UUID PK

application_id FK

activity_type

notes

performed_by FK

created_at
```

---

### application_assignments

```sql
id UUID PK

application_id FK

assigned_to

assigned_at
```

---

# Domain 6

# Workflow Domain

---

## Purpose

Configurable workflow engine.

---

### workflows

```sql
id UUID PK

service_id FK

name

is_active
```

---

### workflow_stages

```sql
id UUID PK

workflow_id FK

name

stage_order

is_mandatory
```

---

### workflow_transitions

```sql
id UUID PK

workflow_id FK

from_stage_id FK
to_stage_id FK
```

---

### application_workflow_instances

```sql
id UUID PK

application_id FK

workflow_id FK

current_stage_id FK
```

---

### workflow_history

```sql
id UUID PK

application_id FK

from_stage_id
to_stage_id

performed_by

remarks

created_at
```

---

# Domain 7

# Document Domain

---

## Purpose

Manage customer and service documents.

---

### document_types

```sql
id UUID PK

name

code

description
```

---

### documents

```sql
id UUID PK

organization_id FK
branch_id FK

customer_id FK

application_id FK

document_type_id FK

file_name
file_path

status

uploaded_by

created_at
```

---

### document_verifications

```sql
id UUID PK

document_id FK

verified_by

status

remarks

verified_at
```

---

# Domain 8

# Payment Domain

---

## Purpose

Financial transactions.

---

### invoices

```sql
id UUID PK

customer_id FK

application_id FK

invoice_number

amount

status
```

---

### payments

```sql
id UUID PK

invoice_id FK

gateway

gateway_reference

amount

status

paid_at
```

---

### refunds

```sql
id UUID PK

payment_id FK

amount

reason

status
```

---

# Domain 9

# Partner Domain

---

## Purpose

Partner network management.

---

### partners

```sql
id UUID PK

organization_id FK

name

partner_type

email
mobile

status
```

---

### partner_leads

```sql
id UUID PK

partner_id FK

lead_id FK
```

---

### commissions

```sql
id UUID PK

partner_id FK

application_id FK

amount

status
```

---

### payouts

```sql
id UUID PK

partner_id FK

amount

status

paid_at
```

---

# Domain 10

# Notification Domain

---

## Purpose

Communication engine.

---

### notification_templates

```sql
id UUID PK

name

channel

subject

content
```

---

### notifications

```sql
id UUID PK

user_id FK

channel

template_id FK

status

sent_at
```

---

# Domain 11

# CMS Domain

---

## Purpose

Website and content management.

---

### cms_categories

```sql
id UUID PK

name
slug
```

---

### cms_articles

```sql
id UUID PK

category_id FK

title
slug

content

status

published_at
```

---

### cms_pages

```sql
id UUID PK

title
slug

content

status
```

---

# Domain 12

# Reporting Domain

---

## Purpose

Analytics and business intelligence.

---

### report_snapshots

```sql
id UUID PK

report_type

snapshot_date

payload JSONB
```

---

# Domain 13

# Audit Domain

---

## Purpose

Platform accountability.

---

### audit_logs

```sql
id UUID PK

organization_id FK

user_id FK

module

action

entity_type
entity_id

old_values JSONB
new_values JSONB

ip_address

created_at
```

---

# Standard Fields

Every transactional table should contain:

```sql
id UUID

created_at TIMESTAMP
updated_at TIMESTAMP

created_by UUID
updated_by UUID

organization_id UUID
branch_id UUID
```

where applicable.

---

# Recommended PostgreSQL Conventions

---

## Primary Keys

```sql
UUID
```

Use:

```sql
gen_random_uuid()
```

---

## Timestamps

Use:

```sql
TIMESTAMPTZ
```

---

## Soft Deletes

Use:

```sql
deleted_at TIMESTAMPTZ
```

instead of hard deletion.

---

## JSON Storage

Use:

```sql
JSONB
```

for:

- Metadata
- Dynamic Forms
- Workflow Configurations
- Reporting Payloads

---

# Prisma Structure

Recommended:

```text
prisma/

schema.prisma

modules/

crm.prisma
users.prisma
services.prisma
workflow.prisma
documents.prisma
payments.prisma
partners.prisma
cms.prisma
audit.prisma
```

---

# Indexing Strategy

Mandatory Indexes:

```sql
email
mobile
status

organization_id
branch_id

customer_id
application_id

created_at
```

Composite Indexes:

```sql
organization_id + branch_id

customer_id + status

application_id + status
```

---

# Future Database Expansion

Planned:

### franchise_id

```sql
franchise_id UUID
```

---

### tenant_id

```sql
tenant_id UUID
```

---

### ai_interactions

Future AI assistant logs.

---

### automation_jobs

Workflow automation engine.

---

# Database Design Readiness

| Area | Status |
|--------|---------|
| Organizations | ✅ |
| Branches | ✅ |
| Users | ✅ |
| CRM | ✅ |
| Services | ✅ |
| Applications | ✅ |
| Workflow | ✅ |
| Documents | ✅ |
| Payments | ✅ |
| Partners | ✅ |
| CMS | ✅ |
| Audit | ✅ |

---

# Conclusion

The Crazy Capital domain model establishes a scalable, modular, CRM-centric data architecture capable of supporting all business domains, configurable workflows, partner ecosystems, multi-branch operations, future franchise networks, and eventual SaaS expansion.

This database foundation is optimized for PostgreSQL, Prisma, NestJS, and long-term national-scale growth.

---

**Crazy Capital**
**Data Architecture Foundation**
**Building India's Growth Story 🇮🇳**