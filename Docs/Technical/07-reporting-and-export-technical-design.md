# 07-reporting-and-export-technical-design.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | Reporting & Export Technical Design |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Analytics & Reporting Architecture |
| Type | Reporting System Design |

---

# Purpose

This document defines the reporting, analytics, dashboarding, export, and business intelligence architecture for Crazy Capital.

The reporting system will provide visibility into:

- Leads
- Customers
- Applications
- Revenue
- Services
- Partners
- Employees
- Operations
- Compliance
- Business Performance

The goal is to create a centralized reporting framework that supports operational decision-making and executive insights.

---

# Reporting Vision

Every stakeholder should have access to relevant insights.

```text
Executive
↓
Organization Reports

Branch Manager
↓
Branch Reports

Employee
↓
Personal Performance

Partner
↓
Partner Earnings
```

---

# Reporting Architecture Overview

```text
Operational Database
        │
        ▼

Reporting Service
        │
        ▼

Report Engine
        │
 ┌──────┼──────┐
 │      │      │
 ▼      ▼      ▼

Dashboards
Exports
Scheduled Reports

        │

        ▼

User Portal
```

---

# Reporting Principles

---

## Principle 1

### Single Source of Truth

All reports must derive data from:

```text
PostgreSQL
```

No duplicate reporting database in Phase 1.

---

## Principle 2

### Role-Based Visibility

Users only see reports they are authorized to access.

---

## Principle 3

### Real-Time Reporting

Phase 1 reports should use live operational data.

---

## Principle 4

### Export Everywhere

Most reports should support:

- Excel
- CSV
- PDF

---

## Principle 5

### Dashboard First

Important metrics should be visible through dashboards before exports.

---

# Reporting Domains

---

## CRM Reporting

Metrics:

```text
Lead Volume

Lead Sources

Lead Conversion

Lead Status Distribution

Lead Assignment

Lead Aging
```

---

## Customer Reporting

Metrics:

```text
Customer Growth

Active Customers

Customer Type Distribution

Retention
```

---

## Application Reporting

Metrics:

```text
Applications Created

Applications Completed

Applications Pending

Application Aging

Workflow Status
```

---

## Revenue Reporting

Metrics:

```text
Revenue

Revenue By Service

Revenue By Branch

Revenue By Partner

Revenue Trends
```

---

## Service Reporting

Metrics:

```text
Popular Services

Service Revenue

Service Conversion

Service Completion Rate
```

---

## Partner Reporting

Metrics:

```text
Partner Leads

Partner Revenue

Partner Conversion

Commission Earned

Commission Paid
```

---

## Employee Reporting

Metrics:

```text
Assigned Leads

Completed Applications

Pending Tasks

Productivity

SLA Performance
```

---

## Workflow Reporting

Metrics:

```text
Current Stage

Stage Duration

SLA Breaches

Workflow Completion Time
```

---

# Dashboard Architecture

---

## Dashboard Types

### Executive Dashboard

Visible To:

```text
Admin
Super Admin
```

---

### Branch Dashboard

Visible To:

```text
Branch Manager
```

---

### Employee Dashboard

Visible To:

```text
Employee
```

---

### Partner Dashboard

Visible To:

```text
Partner
```

---

### Customer Dashboard

Visible To:

```text
Customer
```

---

# Executive Dashboard

KPIs:

```text
Total Leads

Total Customers

Applications

Revenue

Collections

Partner Performance

Service Performance
```

---

# Branch Dashboard

KPIs:

```text
Branch Revenue

Branch Leads

Branch Applications

Employee Productivity
```

---

# Employee Dashboard

KPIs:

```text
Assigned Leads

Tasks

Applications

SLA Alerts
```

---

# Partner Dashboard

KPIs:

```text
Submitted Leads

Converted Leads

Commission

Payout Status
```

---

# Customer Dashboard

KPIs:

```text
Applications

Documents

Invoices

Support Tickets
```

---

# Reporting Data Sources

---

## CRM Tables

```text
leads
lead_activities
lead_assignments
```

---

## Customer Tables

```text
customers
customer_contacts
```

---

## Application Tables

```text
applications
workflow_instances
workflow_history
```

---

## Revenue Tables

```text
payments
invoices
refunds
```

---

## Partner Tables

```text
partners
commissions
payouts
```

---

## User Tables

```text
users
tasks
```

---

# Report Categories

---

## Operational Reports

Used daily.

Examples:

```text
Lead Report

Task Report

Pending Applications
```

---

## Management Reports

Used weekly.

Examples:

```text
Branch Revenue

Employee Performance

Service Performance
```

---

## Executive Reports

Used monthly.

Examples:

```text
Revenue Trends

Growth Metrics

Business Performance
```

---

## Compliance Reports

Used for audits.

Examples:

```text
Audit Logs

User Activity

Document Verification
```

---

# Report Engine Design

---

## Report Definition

Every report should have:

```sql
id

name

code

description

module

is_active
```

---

## report_definitions

```sql
id UUID

name

code

module

description

query_config JSONB

created_at
```

---

# Dynamic Filters

All major reports should support filters.

Examples:

```text
Date Range

Branch

Employee

Partner

Service

Status
```

---

## Example

```text
Revenue Report

Date:
01-Jan-2026 → 31-Jan-2026

Branch:
Noida

Service:
Business Loan
```

---

# Export Architecture

Supported Formats:

---

## CSV

Use For:

```text
Large Data Exports
```

---

## Excel

Use For:

```text
Business Reports
```

---

## PDF

Use For:

```text
Management Reports
```

---

# Export Workflow

```text
User Selects Report
↓
Applies Filters
↓
Generate Dataset
↓
Format Export
↓
Download File
```

---

# Export Service

Endpoints:

```http
POST /api/v1/reports/export
```

Request:

```json
{
  "reportCode": "LEAD_REPORT",
  "format": "xlsx",
  "filters": {
    "branchId": "uuid"
  }
}
```

---

Response:

```json
{
  "downloadUrl": "signed-url"
}
```

---

# Scheduled Reports

Phase 2 Feature.

Users can schedule:

```text
Daily

Weekly

Monthly
```

reports.

---

## Example

```text
Every Monday
Revenue Summary
```

sent via Email.

---

# Report Delivery Channels

Supported:

- Download
- Email
- In-App Notification

Future:

- WhatsApp Delivery

---

# Reporting APIs

---

## Dashboard Summary

```http
GET /api/v1/reports/dashboard
```

---

## Revenue Report

```http
GET /api/v1/reports/revenue
```

---

## Lead Report

```http
GET /api/v1/reports/leads
```

---

## Application Report

```http
GET /api/v1/reports/applications
```

---

## Employee Report

```http
GET /api/v1/reports/employees
```

---

## Partner Report

```http
GET /api/v1/reports/partners
```

---

## Export Report

```http
POST /api/v1/reports/export
```

---

# Visualization Components

Supported Charts:

---

## KPI Cards

```text
Total Revenue

Total Leads

Total Customers
```

---

## Line Charts

```text
Revenue Trend

Lead Growth
```

---

## Bar Charts

```text
Service Revenue

Branch Performance
```

---

## Pie Charts

```text
Lead Sources

Application Status
```

---

## Tables

```text
Lead Lists

Applications

Payments
```

---

# Performance Strategy

---

## Pagination

Mandatory.

Example:

```text
20 Records Per Page
```

---

## Aggregation Queries

Use:

```sql
GROUP BY
```

for metrics.

---

## Materialized Views

Phase 2.

For heavy reporting.

---

## Snapshot Tables

Phase 2.

For historical analytics.

---

# Security & Data Isolation

Reports must enforce:

---

## Organization Scope

Only organization data.

---

## Branch Scope

Only branch data.

---

## Role Scope

Only permitted reports.

---

## Export Permissions

Controlled by RBAC.

Example:

```text
report.export
```

---

# Audit Logging

Every report action must be logged.

Examples:

```text
Report Viewed

Report Exported

PDF Generated

Excel Downloaded
```

---

## report_audit_logs

```sql
id UUID

user_id

report_code

action

filters JSONB

created_at
```

---

# Report Caching Strategy

Phase 1:

```text
No Cache
```

Real-time data.

---

Phase 2:

```text
Redis Cache
```

for frequently accessed reports.

---

# NestJS Module Structure

```text
reports/

├── controllers
├── services
├── repositories
├── dto
├── exports
├── dashboards
├── analytics
├── filters
└── audit
```

---

# Future Enhancements

---

## Scheduled Reports

Automated report delivery.

---

## Data Warehouse

Dedicated analytics layer.

---

## AI Insights

Examples:

```text
Revenue Forecast

Lead Conversion Prediction

SLA Risk Detection
```

---

## Drill-Down Analytics

Example:

```text
Revenue
↓
Branch
↓
Service
↓
Application
```

---

## Self-Service Reports

Admin-configurable report builder.

---

# Architecture Decision Record

| Decision | Status |
|-----------|---------|
| Real-Time Reporting | ✅ Approved |
| PostgreSQL Reporting | ✅ Approved |
| Export Support | ✅ Approved |
| Dashboard First | ✅ Approved |
| Role-Based Visibility | ✅ Approved |
| Scheduled Reports | ⏳ Phase 2 |
| Materialized Views | ⏳ Phase 2 |
| Data Warehouse | ⏳ Future |
| AI Analytics | ⏳ Future |

---

# Reporting Readiness Matrix

| Capability | Status |
|------------|---------|
| Dashboards | ✅ |
| KPIs | ✅ |
| Exports | ✅ |
| Filters | ✅ |
| Role-Based Reports | ✅ |
| Branch Reports | ✅ |
| Partner Reports | ✅ |
| Employee Reports | ✅ |
| Audit Reporting | ✅ |
| Scheduled Reports | ⏳ |

---

# Conclusion

The Crazy Capital Reporting Architecture provides a scalable, secure, and role-aware reporting framework capable of delivering operational, managerial, executive, and compliance insights across the platform.

The design supports real-time dashboards, report exports, business intelligence, and future AI-driven analytics while maintaining strong security and multi-branch data isolation.

---

**Crazy Capital**
**Reporting & Analytics Foundation**
**Building India's Growth Story 🇮🇳**