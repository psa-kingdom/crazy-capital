# 04-business-rules-and-access-discovery.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | Business Rules & Access Discovery |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Product Governance |
| Type | Business Rules, Permissions & Access Control Discovery |

---

# Purpose

This document defines the business rules, operational constraints, access boundaries, ownership models, visibility rules, permissions, and governance policies that govern the Crazy Capital platform.

The objective is to establish:

- Who can perform actions
- What data users can access
- How workflows are controlled
- How ownership is assigned
- How revenue is managed
- How security and compliance are enforced

This document serves as the foundation for:

- RBAC (Role Based Access Control)
- Authentication Design
- Authorization Design
- Data Isolation
- Workflow Governance
- CRM Ownership
- Commission Management
- Multi-Branch Operations

---

# Access Philosophy

The platform follows the principle:

> Users should only access information required to perform their responsibilities.

No user should gain access to unrelated customer, financial, operational, or administrative information.

---

# Ownership Philosophy

All business assets belong to Crazy Capital.

Business assets include:

- Leads
- Customers
- Cases
- Applications
- Documents
- Revenue Records
- Workflows
- Service Data

Partners and employees operate on behalf of Crazy Capital.

---

# Lead Ownership Rules

## Rule 1

Every lead belongs to Crazy Capital.

```text
Lead Created
↓
Central Queue
↓
Assignment
```

---

## Rule 2

Lead ownership is not automatically transferred.

Assignment does not imply ownership.

---

## Rule 3

Partners do not own customer records.

Partners may manage assigned customers but do not control customer ownership.

---

## Rule 4

Employees do not own customer records.

Customers remain organizational assets.

---

## Rule 5

Only admins can permanently reassign lead ownership.

---

# Customer Ownership Rules

## Rule 1

Customer records belong to the organization.

---

## Rule 2

A customer can have multiple services.

Example:

```text
Customer
├── GST
├── ITR
├── Loan
└── Insurance
```

---

## Rule 3

A customer must have a single master profile.

Duplicate customer creation should be prevented.

---

## Rule 4

Customers can be associated with:

- Branch
- Employee
- Partner
- Service

simultaneously.

---

# Service Rules

## Rule 1

Every service must belong to a category.

Example:

```text
Tax & Compliance
└── GST Registration
```

---

## Rule 2

Every service must have:

- Workflow
- Documents
- SLA
- Status Definitions

configured before activation.

---

## Rule 3

Inactive services cannot be purchased.

---

## Rule 4

Service pricing may vary.

Pricing should support:

- Standard Pricing
- Branch Pricing
- Partner Pricing
- Promotional Pricing

---

# Workflow Rules

## Rule 1

Every application must have a workflow.

---

## Rule 2

Applications cannot exist without workflow tracking.

---

## Rule 3

Workflow stages must be sequential.

---

## Rule 4

Mandatory stages cannot be skipped.

---

## Rule 5

Workflow changes must be logged.

---

## Rule 6

Workflow completion requires final approval.

---

## Rule 7

Only authorized users may transition workflow stages.

---

# Document Rules

## Rule 1

Documents must be linked to:

- Customer
- Application
- Service

---

## Rule 2

Documents cannot exist independently.

---

## Rule 3

Documents may have statuses:

```text
Pending
Uploaded
Verified
Rejected
Expired
```

---

## Rule 4

Only authorized personnel can verify documents.

---

## Rule 5

Every document action must be audited.

---

# Communication Rules

## Rule 1

System-generated communications must be logged.

---

## Rule 2

Communication channels include:

- Email
- SMS
- WhatsApp
- In-App Notifications

---

## Rule 3

Communication history must remain accessible.

---

## Rule 4

Critical events trigger notifications automatically.

Examples:

- Lead Assignment
- Document Request
- Payment Request
- Status Change
- Service Completion

---

# Branch Rules

## Rule 1

The platform supports multiple branches.

---

## Rule 2

Each branch may contain:

- Employees
- Leads
- Customers
- Revenue

---

## Rule 3

Branch managers may view branch-specific data.

---

## Rule 4

Branch users should not access unrelated branch data.

Unless granted explicitly.

---

# Commission Rules

## Rule 1

Commission is generated only from approved services.

---

## Rule 2

Commission calculation must be configurable.

Supported Models:

- Flat
- Percentage
- Slab Based

---

## Rule 3

Commission can vary by:

- Partner
- Branch
- Service
- Category

---

## Rule 4

Commission becomes payable only after approval.

---

## Rule 5

Commission changes must be auditable.

---

# Financial Rules

## Rule 1

Every payment must have a transaction record.

---

## Rule 2

Payment history cannot be deleted.

---

## Rule 3

Refunds must remain traceable.

---

## Rule 4

Revenue reporting should support:

- Service Wise
- Branch Wise
- Partner Wise
- Employee Wise

analysis.

---

# CRM Rules

## Rule 1

Every inquiry becomes a lead.

---

## Rule 2

Every lead must have a status.

Examples:

```text
New
Contacted
Qualified
Converted
Lost
```

---

## Rule 3

Lead history must be preserved.

---

## Rule 4

Lead ownership changes must be tracked.

---

## Rule 5

Deleted leads should be archived.

Not permanently removed.

---

# Audit Rules

## Rule 1

Every critical action should be audited.

Examples:

- Lead Assignment
- Customer Creation
- Workflow Change
- Payment Update
- Commission Approval

---

## Rule 2

Audit records should be immutable.

---

## Rule 3

Audit logs should remain searchable.

---

# User Types

The platform contains four primary user groups.

```text
Customer
Partner
Employee
Admin
```

---

# Customer Access Discovery

Customers can access:

✅ Own Profile

✅ Own Applications

✅ Own Documents

✅ Own Payments

✅ Own Notifications

✅ Own Tickets

Customers cannot access:

❌ Other Customers

❌ Internal Notes

❌ Employee Notes

❌ Commissions

❌ Internal Reports

---

# Partner Access Discovery

Partners can access:

✅ Submitted Leads

✅ Assigned Customers

✅ Assigned Cases

✅ Commission Records

✅ Partner Reports

Partners cannot access:

❌ Other Partner Data

❌ Organization Revenue

❌ Employee Records

❌ Global Reports

❌ System Settings

---

# Employee Access Discovery

Employees can access:

✅ Assigned Leads

✅ Assigned Customers

✅ Assigned Applications

✅ Tasks

✅ Workflow Actions

Employees cannot access:

❌ System Configuration

❌ Global Revenue

❌ Security Settings

❌ Platform Configuration

unless explicitly authorized.

---

# Admin Access Discovery

Admins can access:

✅ CRM

✅ Customers

✅ Leads

✅ Services

✅ Workflows

✅ Employees

✅ Partners

✅ Revenue

✅ Reports

✅ CMS

✅ Notifications

✅ Settings

---

# Super Admin Access Discovery

Super Admin can access:

- Entire Organization
- All Branches
- All Users
- Security Configuration
- Platform Configuration
- Audit Logs
- Revenue Data

without restriction.

---

# Role Hierarchy

```text
Super Admin
│
├── Admin
│
├── Branch Manager
│
├── Employee
│
├── Partner
│
└── Customer
```

---

# Permission Model

The platform uses RBAC.

Permissions are assigned through:

```text
Role
↓
Permission Set
↓
User
```

Examples:

### CRM Permissions

- Lead Create
- Lead View
- Lead Assign
- Lead Edit
- Lead Delete

### Customer Permissions

- Customer View
- Customer Create
- Customer Update

### Workflow Permissions

- Workflow View
- Workflow Execute
- Workflow Configure

---

# Future Access Controls

Future releases may support:

- ABAC (Attribute Based Access Control)
- Dynamic Permissions
- Geo Restrictions
- Time-Based Access
- Temporary Access Grants

---

# Governance Principles

1. Customer data is protected.
2. Lead ownership remains centralized.
3. Access follows least privilege.
4. Every action is auditable.
5. Sensitive data requires authorization.
6. Business operations remain transparent.
7. Platform governance remains centralized.

---

# Summary

Crazy Capital operates using centralized ownership, role-based access control, auditable workflows, branch-aware visibility, configurable permissions, and strict governance policies.

These business rules ensure scalability, security, accountability, operational control, and long-term maintainability across the entire platform.

---

**Crazy Capital**
**Building India's Growth Story 🇮🇳**