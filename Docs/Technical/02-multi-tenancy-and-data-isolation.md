# 02-multi-tenancy-and-data-isolation.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | Multi-Tenancy & Data Isolation Strategy |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Technical Architecture |
| Type | Multi-Tenancy, Data Ownership & Isolation Design |

---

# Purpose

This document defines how Crazy Capital will handle:

- Organization Structure
- Branch Management
- Data Isolation
- User Segregation
- Access Boundaries
- Future Franchise Support
- Future White-Label Support

while maintaining a single platform architecture.

The goal is to build Phase 1 as a centralized system while ensuring future scalability toward multi-branch, franchise, and SaaS models.

---

# Multi-Tenancy Vision

Phase 1 is a:

```text
Single Organization
Multi Branch
Shared Platform
```

architecture.

Future phases may support:

```text
Multiple Organizations
Multiple Franchises
White Label Customers
```

without requiring major architectural redesign.

---

# Tenancy Evolution Strategy

---

## Phase 1

### Single Tenant

```text
Crazy Capital
│
├── Head Office
├── Noida
├── Delhi
├── Mumbai
└── Bangalore
```

Characteristics:

- Single Database
- Single Organization
- Shared Services
- Branch-Level Segregation

---

## Phase 2

### Multi Branch Enterprise

```text
Crazy Capital
│
├── Branch A
├── Branch B
├── Branch C
└── Branch D
```

Characteristics:

- Branch Isolation
- Branch Reporting
- Branch Permissions

---

## Phase 3

### Franchise Model

```text
Crazy Capital
│
├── Franchise A
├── Franchise B
├── Franchise C
└── Franchise D
```

Characteristics:

- Franchise Data Segregation
- Franchise Reporting
- Franchise Revenue Tracking

---

## Phase 4

### Multi-Tenant SaaS

```text
Tenant A
Tenant B
Tenant C
Tenant D
```

Characteristics:

- Tenant Isolation
- Tenant Branding
- Tenant Billing
- Tenant Configuration

---

# Recommended Strategy

---

## Shared Database

### Shared Schema

For Phase 1 and Phase 2.

Architecture:

```text
Single PostgreSQL Database
Single Schema
Tenant Aware Tables
```

Every business table includes:

```sql
organization_id
branch_id
```

Benefits:

- Faster Development
- Lower Cost
- Easier Reporting
- Easier Maintenance

---

# Organizational Hierarchy

---

## Organization

Top-level business entity.

Example:

```text
Crazy Capital
```

Table:

```text
organizations
```

---

## Branch

Operational unit.

Examples:

```text
Noida
Delhi
Mumbai
Bangalore
```

Table:

```text
branches
```

---

## Department

Business unit.

Examples:

```text
Sales
Operations
Compliance
Finance
Support
```

Table:

```text
departments
```

---

## Team

Optional operational grouping.

Examples:

```text
Loan Team
GST Team
Insurance Team
```

Table:

```text
teams
```

---

# Future Hierarchy

---

## Franchise

Future support.

```text
Crazy Capital
│
├── Franchise North
├── Franchise West
├── Franchise South
```

Table:

```text
franchises
```

---

# Data Isolation Model

---

## Isolation Principle

Users should only access data they are authorized to view.

Every query must be filtered.

Example:

```sql
WHERE organization_id = ?
```

and

```sql
WHERE branch_id = ?
```

when applicable.

---

# Data Ownership Structure

---

## Organization Owned

Always global.

Examples:

- Services
- Categories
- Workflows
- Templates
- Roles

Visibility:

```text
All Branches
```

---

## Branch Owned

Examples:

- Leads
- Customers
- Revenue
- Employees

Visibility:

```text
Assigned Branch
```

---

## User Owned

Examples:

- Tasks
- Activities
- Notes

Visibility:

```text
Assigned User
```

---

# Isolation Levels

---

# Level 1

## Organization Level

Visible To:

- Super Admin

Example:

```text
All Customers
All Leads
All Revenue
```

---

# Level 2

## Branch Level

Visible To:

- Branch Manager

Example:

```text
Branch Customers
Branch Revenue
Branch Employees
```

---

# Level 3

## Team Level

Visible To:

- Team Leads

Example:

```text
Assigned Team Cases
```

---

# Level 4

## User Level

Visible To:

- Assigned User

Example:

```text
Assigned Tasks
Assigned Leads
Assigned Cases
```

---

# Portal Data Isolation

---

# Customer Portal

Customers can access:

✅ Own Profile

✅ Own Applications

✅ Own Documents

✅ Own Payments

❌ Other Customer Data

---

# Partner Portal

Partners can access:

✅ Own Leads

✅ Own Cases

✅ Own Commissions

❌ Other Partner Data

❌ Global Revenue

---

# Employee Portal

Employees can access:

✅ Assigned Leads

✅ Assigned Cases

✅ Assigned Tasks

❌ Organization Revenue

❌ Global Settings

---

# Branch Manager Portal

Can access:

✅ Entire Branch

✅ Branch Reports

✅ Branch Revenue

❌ Other Branch Data

---

# Admin Portal

Can access:

✅ Organization Data

✅ Services

✅ Users

✅ Workflows

---

# Super Admin Portal

Can access:

✅ Everything

without restriction.

---

# Data Isolation Rules

---

## Rule 1

Every record must belong to an organization.

Example:

```sql
organization_id UUID NOT NULL
```

---

## Rule 2

Business records should belong to a branch.

Example:

```sql
branch_id UUID
```

---

## Rule 3

Users cannot bypass organization filters.

---

## Rule 4

APIs must validate scope before returning data.

---

## Rule 5

Audit logs should capture unauthorized attempts.

---

# Recommended Core Tables

---

## Organizations

```text
organizations
```

Fields:

```text
id
name
status
created_at
```

---

## Branches

```text
branches
```

Fields:

```text
id
organization_id
name
code
city
status
```

---

## Departments

```text
departments
```

Fields:

```text
id
organization_id
branch_id
name
```

---

## Teams

```text
teams
```

Fields:

```text
id
department_id
name
```

---

# Multi-Tenant Table Standard

Every business table should include:

```sql
id UUID
organization_id UUID
branch_id UUID
created_at
updated_at
```

Example:

```sql
leads
customers
applications
payments
documents
commissions
```

---

# Authorization Architecture

---

## Access Check Flow

```text
User
↓
Role
↓
Permissions
↓
Organization Scope
↓
Branch Scope
↓
Data Access
```

---

## Example

Employee:

```text
Role:
Operations Executive

Branch:
Noida

Permission:
View Assigned Cases
```

Can only view:

```text
Noida Cases
Assigned Cases
```

---

# Reporting Isolation

---

## Super Admin

Can view:

```text
Organization Revenue
Organization Leads
Organization Performance
```

---

## Branch Manager

Can view:

```text
Branch Revenue
Branch Leads
Branch Performance
```

---

## Employee

Can view:

```text
Own Performance
Own Cases
```

---

## Partner

Can view:

```text
Own Commissions
Own Leads
```

---

# File Storage Isolation

Cloudflare R2 Structure:

```text
/orgs/

   /org-001/

      /branch-noida/
      /branch-delhi/

         /customers/
         /documents/
         /deliverables/
```

Example:

```text
/orgs/org-001/branch-noida/customers/123/pan-card.pdf
```

---

# Future Franchise Support

Future structure:

```text
Organization
│
├── Franchise
│      │
│      ├── Branch
│      ├── Users
│      ├── Customers
│      └── Revenue
```

Additional field:

```sql
franchise_id UUID
```

No schema redesign required.

---

# Future White Label Support

Future structure:

```text
Tenant A
Tenant B
Tenant C
```

Additional entity:

```sql
tenant_id UUID
```

Every table becomes:

```sql
tenant_id
organization_id
branch_id
```

---

# Security Considerations

Mandatory:

- RBAC
- Organization Scoping
- Branch Scoping
- Audit Logs
- Row-Level Access Validation
- Signed File URLs

---

# Recommended Implementation

For Phase 1:

✅ Shared PostgreSQL Database

✅ Shared Schema

✅ Organization Scoped Data

✅ Branch Scoped Data

✅ RBAC

✅ API-Level Isolation

Do NOT build separate databases per branch.

Do NOT build separate schemas per branch.

Keep architecture simple and scalable.

---

# Architecture Decision Record

| Decision | Status |
|-----------|---------|
| Single PostgreSQL Database | ✅ Approved |
| Shared Schema | ✅ Approved |
| Branch Isolation | ✅ Approved |
| Organization Isolation | ✅ Approved |
| Franchise Ready | ✅ Approved |
| White Label Ready | ✅ Approved |
| Separate DB Per Branch | ❌ Rejected |
| Separate Schema Per Branch | ❌ Rejected |

---

# Conclusion

Crazy Capital will initially operate as a single-organization, multi-branch platform using a shared PostgreSQL database and shared schema architecture.

Every business record will be organization-aware and branch-aware, enabling strong data isolation, centralized governance, simplified operations, and future expansion into franchise networks, white-label deployments, and full multi-tenant SaaS offerings without major architectural changes.

---

**Crazy Capital**
**Technical Architecture**
**Building India's Growth Story 🇮🇳**