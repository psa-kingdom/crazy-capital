# 06-workflow-engine-technical-design.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | Workflow Engine Technical Design |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Core Platform Architecture |
| Type | Workflow Engine Design |

---

# Purpose

This document defines the technical design of the Crazy Capital Workflow Engine.

The Workflow Engine is the operational backbone of the platform and is responsible for managing:

- Service Execution
- Application Processing
- Task Management
- Status Transitions
- Approvals
- Escalations
- SLA Tracking
- Automation

Every service in Crazy Capital will be executed through the Workflow Engine.

---

# Why a Workflow Engine?

Every service has a different execution process.

Example:

### GST Registration

```text
Application
↓
Documents
↓
Verification
↓
Submission
↓
GST Issued
```

---

### Company Registration

```text
Application
↓
DSC
↓
DIN
↓
Name Approval
↓
Incorporation
```

---

### Business Loan

```text
Application
↓
Document Collection
↓
Credit Evaluation
↓
Bank Submission
↓
Approval
↓
Disbursement
```

Without a workflow engine, every service would require custom code.

With a workflow engine:

```text
Service
↓
Workflow Configuration
↓
Execution
```

---

# Workflow Philosophy

Approved Principle:

```text
Configuration Driven Workflow
```

Not:

```text
Hardcoded Workflow
```

Admins should create workflows without developer intervention.

---

# Workflow Architecture Overview

```text
Service
    │
    ▼

Workflow Definition
    │
    ▼

Workflow Stages
    │
    ▼

Workflow Transitions
    │
    ▼

Application Instance
    │
    ▼

Workflow Execution
```

---

# Core Workflow Components

---

## Workflow Template

Blueprint of execution.

Example:

```text
GST Registration Workflow
```

Contains:

- Stages
- Rules
- SLAs
- Permissions

---

## Workflow Stage

Represents a step.

Examples:

```text
Document Collection
Verification
Submission
Approval
Completed
```

---

## Workflow Transition

Defines movement.

Example:

```text
Documents Pending
↓
Documents Verified
```

---

## Workflow Instance

Live workflow running against an application.

Example:

```text
Application #APP-001
```

using:

```text
GST Workflow
```

---

## Workflow History

Stores complete audit trail.

---

# Workflow Entity Model

```text
Workflow
│
├── Stages
│
├── Transitions
│
├── Rules
│
└── SLA
```

---

# Database Design

---

## workflows

Master workflow definition.

```sql
id UUID

name
code

description

service_id

is_active

created_at
updated_at
```

---

## workflow_stages

```sql
id UUID

workflow_id

name
code

stage_order

is_start_stage
is_end_stage

is_mandatory

sla_hours

created_at
```

---

## workflow_transitions

```sql
id UUID

workflow_id

from_stage_id

to_stage_id

requires_approval

created_at
```

---

## workflow_rules

```sql
id UUID

workflow_id

stage_id

rule_type

rule_config JSONB
```

---

## workflow_instances

```sql
id UUID

workflow_id

application_id

current_stage_id

started_at

completed_at
```

---

## workflow_history

```sql
id UUID

workflow_instance_id

from_stage_id

to_stage_id

performed_by

remarks

created_at
```

---

# Workflow Configuration Model

---

## Example

GST Registration

```text
Workflow
│
├── Application Created
├── Documents Pending
├── Documents Verified
├── Submission
└── GST Approved
```

---

## Example

Business Loan

```text
Workflow
│
├── Lead Qualified
├── Document Collection
├── Credit Evaluation
├── Bank Submission
├── Sanction
└── Disbursement
```

---

# Stage Types

---

## Start Stage

Beginning of workflow.

Example:

```text
Application Created
```

Only one per workflow.

---

## Processing Stage

Work execution.

Example:

```text
Document Verification
```

---

## Approval Stage

Requires authorization.

Example:

```text
Manager Approval
```

---

## Completion Stage

Marks workflow complete.

Example:

```text
Service Delivered
```

---

## Rejection Stage

Marks workflow failed.

Example:

```text
Rejected
```

---

# Workflow State Machine

---

Example:

```text
Created
↓
Documents Pending
↓
Verification
↓
Approved
↓
Completed
```

Invalid transitions must be blocked.

Example:

```text
Created
↓
Completed
```

Not allowed.

---

# Workflow Execution Flow

```text
Application Created
↓
Workflow Loaded
↓
Start Stage Assigned
↓
Task Created
↓
User Action
↓
Stage Transition
↓
History Recorded
↓
Next Task
```

---

# Transition Rules

Each transition can define rules.

---

## Rule Type 1

Document Requirement

Example:

```text
Cannot move to Verification
until all mandatory documents uploaded.
```

---

## Rule Type 2

Payment Requirement

Example:

```text
Cannot process application
until payment completed.
```

---

## Rule Type 3

Approval Requirement

Example:

```text
Manager approval required.
```

---

## Rule Type 4

Custom Validation

Future support.

---

# Task Engine Integration

Every stage may generate tasks.

---

## Example

```text
Document Collection
↓
Task Created
↓
Assigned Employee
```

---

## tasks

```sql
id UUID

application_id

workflow_stage_id

assigned_to

status

due_date

completed_at
```

---

# Task Statuses

```text
Pending
In Progress
Completed
Cancelled
```

---

# Assignment Model

Workflow stages may be assigned to:

---

## User

```text
Operations Executive
```

---

## Team

```text
GST Team
```

---

## Role

```text
Branch Manager
```

---

# SLA Management

Every stage can define SLA.

Example:

```text
Document Verification
24 Hours
```

---

## workflow_stage_slas

```sql
stage_id

sla_hours

warning_hours
```

---

# SLA Tracking

```text
Task Created
↓
Timer Starts
↓
Warning Trigger
↓
SLA Breach
↓
Escalation
```

---

# Escalation Engine

When SLA is breached:

```text
Stage Breach
↓
Notification
↓
Manager
↓
Escalation
```

---

# Escalation Levels

Level 1:

Assigned User

Level 2:

Team Lead

Level 3:

Branch Manager

Level 4:

Admin

---

# Approval Engine

Certain stages require approval.

Example:

```text
Loan Sanction
```

---

## approvals

```sql
id UUID

workflow_instance_id

stage_id

requested_by

approved_by

status

remarks

approved_at
```

---

# Approval Status

```text
Pending
Approved
Rejected
```

---

# Notification Integration

Events trigger notifications.

Examples:

```text
Application Created

Stage Changed

Task Assigned

Approval Requested

SLA Breached
```

Channels:

- Email
- SMS
- WhatsApp
- In-App

---

# Audit Requirements

Every workflow action must be recorded.

Examples:

```text
Stage Change

Task Assignment

Approval

Rejection

Escalation
```

---

# Audit Record

```sql
action

old_stage

new_stage

performed_by

timestamp
```

---

# Workflow Builder (Admin)

Phase 2 Feature.

Admins should create workflows visually.

---

## Workflow Builder Features

Create:

- Workflow
- Stages
- Transitions
- Rules
- SLA

without code.

---

## Visual Representation

```text
Start
  │
  ▼

Documents
  │
  ▼

Verification
  │
  ▼

Approval
  │
  ▼

Completed
```

---

# Workflow APIs

---

## Get Workflow

```http
GET /api/v1/workflows/:id
```

---

## Create Workflow

```http
POST /api/v1/workflows
```

---

## Update Workflow

```http
PATCH /api/v1/workflows/:id
```

---

## Transition Workflow

```http
POST /api/v1/applications/:id/transition
```

Request:

```json
{
  "toStageId": "uuid",
  "remarks": "Documents verified"
}
```

---

## Workflow History

```http
GET /api/v1/applications/:id/history
```

---

# NestJS Module Structure

```text
workflow/

├── controllers
├── services
├── repositories
├── dto
├── entities
├── validators
├── rules
├── approvals
├── sla
└── history
```

---

# Future Enhancements

---

## Workflow Automation

Examples:

```text
Auto Assign

Auto Approve

Auto Escalate
```

---

## AI Assistance

Examples:

```text
Suggest Next Action

Detect Delays

Predict SLA Breach
```

---

## Drag & Drop Workflow Builder

Visual workflow designer.

---

## BPMN Support

Enterprise-grade workflow modeling.

---

# Architecture Decision Record

| Decision | Status |
|-----------|---------|
| Configuration Driven Workflows | ✅ Approved |
| Generic Workflow Engine | ✅ Approved |
| Task Integration | ✅ Approved |
| SLA Tracking | ✅ Approved |
| Approval Engine | ✅ Approved |
| Audit History | ✅ Approved |
| Workflow Templates | ✅ Approved |
| BPMN Engine | ⏳ Future |
| Visual Builder | ⏳ Future |

---

# Workflow Readiness Matrix

| Component | Status |
|------------|---------|
| Workflow Definitions | ✅ |
| Stages | ✅ |
| Transitions | ✅ |
| Rules | ✅ |
| Instances | ✅ |
| Tasks | ✅ |
| Approvals | ✅ |
| SLA Tracking | ✅ |
| Escalations | ✅ |
| Audit History | ✅ |

---

# Conclusion

The Crazy Capital Workflow Engine is designed as a configurable, reusable, and scalable execution framework capable of supporting every service offered by the platform.

By separating workflow definitions from business logic, the platform can onboard new services rapidly, standardize operations, automate execution, and scale nationwide without requiring service-specific code changes.

---

**Crazy Capital**
**Workflow Engine Foundation**
**Building India's Growth Story 🇮🇳**