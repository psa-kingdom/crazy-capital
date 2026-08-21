# 02-user-journeys-and-workflows.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | User Journeys & Workflows |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Product Design |
| Type | User Experience & Operational Workflows |

---

# Purpose

This document defines how different user types interact with the Crazy Capital platform and how service requests move through the system from inquiry to completion.

The objective is to standardize customer journeys while allowing configurable workflows for different services.

This document serves as the foundation for:

- CRM Design
- Workflow Engine Design
- Portal Design
- Automation Design
- Notification Design
- Service Management

---

# User Types

The platform supports four primary user groups.

## 1. Customer

Individuals and businesses purchasing services.

Examples:

- Salaried Individuals
- Professionals
- Startups
- MSMEs
- Enterprises

---

## 2. Partner

Users referring or acquiring customers.

Examples:

- CA
- Lawyer
- Insurance Advisor
- Loan Consultant
- Referral Partner
- Franchise Partner

---

## 3. Employee

Internal operational users.

Examples:

- Sales Executive
- Relationship Manager
- Compliance Executive
- Operations Team
- Service Specialists

---

## 4. Admin

Platform owners and managers.

Examples:

- Founder
- Operations Head
- Branch Manager
- Super Admin

---

# Customer Journey

---

# Journey 1

## Service Inquiry Journey

Most common customer flow.

### Step 1

Customer visits website.

Possible entry points:

- Homepage
- Service Page
- Blog
- Landing Page
- Advertisement
- Referral Link

---

### Step 2

Customer explores services.

Examples:

- Company Registration
- GST Registration
- Business Loan
- Insurance
- Trademark

---

### Step 3

Customer submits inquiry.

Methods:

- Contact Form
- Get Started Form
- Consultation Form
- Callback Request
- WhatsApp

---

### Step 4

Lead is created automatically.

```text
Website Inquiry
↓
Lead Created
↓
CRM
```

---

### Step 5

Lead enters Central Queue.

Status:

```text
New Lead
```

---

### Step 6

Central team reviews lead.

Possible actions:

- Assign Employee
- Assign Team
- Assign Partner
- Reject Lead

---

### Step 7

Sales discussion occurs.

Goals:

- Understand requirement
- Explain service
- Collect information
- Build trust

---

### Step 8

Lead becomes Qualified.

Status:

```text
Qualified
```

---

### Step 9

Customer proceeds with service.

Possible outcomes:

```text
Converted
```

or

```text
Lost
```

---

# Journey 2

## Customer Registration Journey

After qualification.

### Step 1

Customer receives invitation.

---

### Step 2

Customer creates account.

Information:

- Name
- Email
- Mobile Number
- Password

---

### Step 3

Customer verifies account.

Methods:

- Email OTP
- SMS OTP

---

### Step 4

Customer accesses portal.

Dashboard becomes available.

---

# Journey 3

## Service Application Journey

After customer decides to proceed.

### Step 1

Service selected.

Example:

```text
Private Limited Company
```

---

### Step 2

Application created.

```text
Customer
↓
Application
↓
Workflow
```

---

### Step 3

Required documents requested.

Example:

- PAN
- Aadhaar
- Address Proof

---

### Step 4

Documents uploaded.

---

### Step 5

Documents verified.

Possible outcomes:

```text
Approved
```

or

```text
Rejected
```

---

### Step 6

Payment requested.

If applicable.

---

### Step 7

Processing begins.

---

### Step 8

Service completed.

Deliverables issued.

---

### Step 9

Application closed.

---

# Journey 4

## Customer Tracking Journey

Customer logs into portal.

Can view:

- Active Applications
- Documents
- Payments
- Notifications
- Support Tickets

---

# Journey 5

## Customer Support Journey

### Step 1

Customer raises ticket.

---

### Step 2

Ticket assigned.

---

### Step 3

Employee responds.

---

### Step 4

Issue resolved.

---

### Step 5

Ticket closed.

---

# Partner Journey

---

# Journey 6

## Partner Onboarding Journey

### Step 1

Partner applies.

Information:

- Name
- Organization
- Category
- Experience

---

### Step 2

Verification.

---

### Step 3

Approval.

---

### Step 4

Partner account activated.

---

# Journey 7

## Lead Submission Journey

### Step 1

Partner logs in.

---

### Step 2

Partner creates lead.

Information:

- Customer Name
- Mobile
- Email
- Service Required

---

### Step 3

Lead enters CRM.

```text
Partner Lead
↓
Central Queue
```

---

### Step 4

Lead assigned.

---

### Step 5

Service delivered.

---

### Step 6

Commission generated.

---

# Journey 8

## Commission Tracking Journey

Partner can view:

- Pending Commission
- Approved Commission
- Paid Commission
- Commission History

---

# Employee Journey

---

# Journey 9

## Lead Processing Journey

### Step 1

Employee receives assigned lead.

---

### Step 2

Customer contacted.

---

### Step 3

Requirement discussed.

---

### Step 4

Lead qualified.

---

### Step 5

Application initiated.

---

### Step 6

Case handed to operations.

---

# Journey 10

## Case Processing Journey

### Step 1

Case assigned.

---

### Step 2

Documents verified.

---

### Step 3

Workflow initiated.

---

### Step 4

Tasks completed.

---

### Step 5

Deliverables generated.

---

### Step 6

Case closed.

---

# Admin Journey

---

# Journey 11

## Service Configuration Journey

### Step 1

Admin creates service.

---

### Step 2

Configure:

- Category
- Price
- Workflow
- Documents
- SLA

---

### Step 3

Publish service.

---

# Journey 12

## Workflow Configuration Journey

### Step 1

Admin creates workflow.

---

### Step 2

Add stages.

Example:

```text
Lead
↓
Document Collection
↓
Verification
↓
Payment
↓
Processing
↓
Completion
```

---

### Step 3

Map workflow to service.

---

### Step 4

Activate workflow.

---

# Journey 13

## Commission Configuration Journey

Admin defines:

- Fixed Commission
- Percentage Commission
- Service Wise Commission
- Partner Wise Commission
- Branch Wise Commission

---

# Core Workflow Architecture

Every service follows:

```text
Lead
↓
Qualification
↓
Application
↓
Document Collection
↓
Verification
↓
Payment
↓
Processing
↓
Delivery
↓
Completion
```

However workflow stages remain configurable.

---

# Example Workflow

## Company Registration

```text
Lead
↓
Requirement Discussion
↓
Document Collection
↓
Name Approval
↓
Payment
↓
Filing
↓
Certificate Issued
↓
Completed
```

---

# Example Workflow

## GST Registration

```text
Lead
↓
Document Collection
↓
Verification
↓
Payment
↓
GST Filing
↓
GST Issued
↓
Completed
```

---

# Example Workflow

## Business Loan

```text
Lead
↓
Eligibility Check
↓
Document Collection
↓
Bank Assignment
↓
Verification
↓
Approval
↓
Disbursement
↓
Completed
```

---

# Example Workflow

## Trademark Registration

```text
Lead
↓
Trademark Search
↓
Document Collection
↓
Payment
↓
Application Filing
↓
Government Review
↓
Completed
```

---

# Workflow Rules

## Rule 1

Every service must have an active workflow.

---

## Rule 2

Every workflow must have at least:

```text
Start Stage
Middle Stage(s)
Completion Stage
```

---

## Rule 3

Applications cannot skip mandatory stages.

---

## Rule 4

Status changes must be logged.

---

## Rule 5

Workflow transitions trigger notifications.

---

## Rule 6

All workflow actions must be auditable.

---

# Notification Triggers

Events:

- Lead Created
- Lead Assigned
- Documents Requested
- Documents Uploaded
- Payment Requested
- Payment Received
- Status Changed
- Service Completed

Channels:

- Email
- SMS
- WhatsApp
- In-App

---

# Future Workflow Enhancements

Planned:

- Workflow Automation
- Auto Assignment
- SLA Escalations
- Reminder Engine
- AI Recommendations
- Auto Status Updates

---

# Success Criteria

A user journey is considered successful when:

1. Lead is captured.
2. Customer is onboarded.
3. Service is initiated.
4. Workflow progresses correctly.
5. Deliverables are generated.
6. Customer receives updates.
7. Service is completed.
8. Customer remains engaged.

---

# Closing Statement

All customer, partner, employee, and admin interactions within Crazy Capital must ultimately be represented as structured workflows.

The workflow engine becomes the operational backbone of the platform, ensuring consistency, transparency, scalability, and accountability across every service offered by Crazy Capital.

**Building India's Growth Story**