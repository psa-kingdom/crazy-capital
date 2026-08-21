# 08-frontend-architecture-and-design-system.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | Frontend Architecture & Design System |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Frontend Architecture |
| Type | UI Architecture & Design System |

---

# Purpose

This document defines the frontend architecture, UI standards, component system, design principles, navigation structure, and implementation guidelines for the Crazy Capital platform.

The frontend must support:

- Public Website
- Customer Portal
- Partner Portal
- Employee Portal
- Admin Portal

while maintaining a consistent user experience, scalable component library, and enterprise-grade usability.

---

# Frontend Vision

The Crazy Capital frontend should feel like:

```text
Zerodha
+
Razorpay
+
CRED
+
Notion
```

Characteristics:

- Clean
- Premium
- Fast
- Professional
- Minimal
- Trustworthy
- Modern

---

# Frontend Technology Stack

---

## Framework

```text
Next.js 15+
```

---

## Language

```text
TypeScript
```

---

## Styling

```text
Tailwind CSS
```

---

## UI Component Library

```text
ShadCN UI
```

---

## Forms

```text
React Hook Form
```

---

## Validation

```text
Zod
```

---

## State Management

```text
Zustand
```

---

## API Layer

```text
TanStack Query
```

---

## Icons

```text
Lucide React
```

---

## Charts

```text
Recharts
```

---

## Rich Text Editor

```text
TipTap
```

---

# Application Architecture

---

## Frontend Structure

```text
apps/

website/
portal/

shared/
```

---

## Recommended Structure

```text
src/

├── app/
├── components/
├── features/
├── layouts/
├── hooks/
├── services/
├── stores/
├── types/
├── utils/
├── lib/
├── styles/
└── config/
```

---

# Frontend Domains

---

## Public Website

Purpose:

```text
Lead Generation
Brand Building
SEO
Content Marketing
```

---

## Customer Portal

Purpose:

```text
Customer Self-Service
```

---

## Partner Portal

Purpose:

```text
Lead Submission
Commission Tracking
```

---

## Employee Portal

Purpose:

```text
Case Processing
Workflow Execution
```

---

## Admin Portal

Purpose:

```text
Business Operations Control
```

---

# Design Philosophy

---

## Principle 1

### Clarity Over Decoration

Users should instantly understand:

- Where they are
- What they need to do
- What happens next

---

## Principle 2

### Reduce Cognitive Load

Avoid:

```text
Complex Screens
Excessive Inputs
Overloaded Dashboards
```

---

## Principle 3

### Consistency

Every page should feel connected.

Same:

- Buttons
- Tables
- Forms
- Layouts
- Navigation

---

## Principle 4

### Mobile Responsive

Even though Phase 1 is web-only.

---

## Principle 5

### Trust First

Financial platforms require trust.

UI should feel:

```text
Stable
Reliable
Professional
```

---

# Brand Design System

---

## Primary Brand Color

Deep Navy

```text
#041B4D
```

---

## Secondary Brand Color

Premium Gold

```text
#D4AF37
```

---

## Accent Blue

```text
#2563EB
```

---

## Success

```text
#16A34A
```

---

## Warning

```text
#F59E0B
```

---

## Danger

```text
#DC2626
```

---

## Neutral

```text
#F8FAFC
#E2E8F0
#64748B
#0F172A
```

---

# Typography

---

## Font Family

Recommended:

```text
Inter
```

Fallback:

```text
System UI
```

---

## Heading Sizes

```text
H1 48px

H2 36px

H3 30px

H4 24px

H5 20px

H6 18px
```

---

## Body

```text
16px
```

---

## Small Text

```text
14px
```

---

# Layout System

---

## Maximum Width

Website:

```text
1280px
```

---

## Dashboard Width

```text
100%
```

---

## Grid System

```text
12 Column Grid
```

---

# Spacing Scale

Use:

```text
4
8
12
16
24
32
48
64
```

Never random values.

---

# Border Radius

Cards:

```text
12px
```

Buttons:

```text
10px
```

Inputs:

```text
10px
```

---

# Shadows

Subtle only.

Example:

```css
shadow-sm
shadow-md
```

Avoid heavy shadows.

---

# Design Tokens

```typescript
colors.primary

colors.gold

colors.success

colors.warning

colors.danger

spacing.sm

spacing.md

spacing.lg
```

---

# Portal Navigation Architecture

---

# Customer Portal

---

## Navigation

```text
Dashboard

Applications

Documents

Payments

Support

Profile
```

---

# Partner Portal

---

## Navigation

```text
Dashboard

Submit Lead

My Leads

Cases

Commissions

Profile
```

---

# Employee Portal

---

## Navigation

```text
Dashboard

Leads

Applications

Tasks

Documents

Reports
```

---

# Admin Portal

---

## Navigation

```text
Dashboard

CRM

Customers

Services

Applications

Workflow

Partners

Reports

CMS

Settings
```

---

# Layout Architecture

---

## Website Layout

```text
Header

Hero

Services

Trust

Content

Footer
```

---

## Portal Layout

```text
Sidebar
Header
Content
```

---

# Core Components

---

## Buttons

Variants:

```text
Primary

Secondary

Outline

Ghost

Danger
```

---

## Inputs

Types:

```text
Text

Email

Phone

Currency

Date

Search
```

---

## Select

Reusable dropdown.

---

## Modal

Reusable modal system.

---

## Drawer

Mobile interaction.

---

## Toast

Notifications.

---

## Tabs

Section navigation.

---

## Badge

Status display.

---

## Tooltip

Additional information.

---

## Breadcrumb

Navigation hierarchy.

---

# CRM Components

---

## Lead Card

Shows:

```text
Lead Name

Source

Status

Assigned User
```

---

## Lead Table

Columns:

```text
Lead

Mobile

Source

Status

Assigned To
```

---

# Workflow Components

---

## Stage Timeline

Example:

```text
Created
↓
Documents
↓
Verification
↓
Completed
```

---

## Workflow Status Card

Displays:

```text
Current Stage

SLA

Owner
```

---

# Reporting Components

---

## KPI Cards

Example:

```text
Revenue

Leads

Applications
```

---

## Charts

Types:

```text
Line

Bar

Pie
```

---

## Report Tables

Support:

```text
Sorting

Filtering

Export
```

---

# Form Design Standards

---

## Form Layout

Maximum:

```text
2 Columns
```

---

## Section Based Forms

Example:

```text
Personal Details

Business Details

Documents
```

---

## Validation

Real-time validation.

---

## Error Messaging

Example:

```text
Enter valid PAN number
```

Never:

```text
Invalid Input
```

---

# Table Design Standards

---

## Features

Mandatory:

```text
Pagination

Sorting

Filtering

Search
```

---

## Bulk Actions

Supported where applicable.

---

# Dashboard Standards

---

## Dashboard Layout

```text
KPI Cards

Charts

Tables

Activities
```

---

## Avoid

```text
10+ Charts

Overloaded Screens
```

---

# Notification Design

---

## Notification Center

Categories:

```text
System

Workflow

Payments

Tasks
```

---

## In-App Toasts

Success:

```text
Application Created
```

Error:

```text
Payment Failed
```

---

# Accessibility Standards

Minimum:

---

## Keyboard Navigation

Supported.

---

## Screen Reader Labels

Supported.

---

## Color Contrast

WCAG AA Compliant.

---

# Frontend Security

---

## Protected Routes

```text
/authenticated
```

only.

---

## Role-Based Navigation

Hide unauthorized menus.

---

## Secure Storage

Never store:

```text
JWT
```

in localStorage.

Use:

```text
HttpOnly Cookies
```

---

# API Integration Pattern

---

## Query Example

```typescript
const { data } = useQuery({
  queryKey: ["leads"],
  queryFn: fetchLeads
});
```

---

## Mutation Example

```typescript
const mutation = useMutation({
  mutationFn: createLead
});
```

---

# Error Handling

---

## Global Error Boundary

Required.

---

## API Errors

Display friendly messages.

Example:

```text
Unable to load applications.
Please try again.
```

---

# Loading States

Every page should support:

```text
Skeleton Loader
```

Avoid:

```text
Blank Screens
```

---

# Empty States

Example:

```text
No applications found.
Create your first application.
```

---

# Future Enhancements

---

## Dark Mode

Phase 2.

---

## Mobile App Design System

Phase 2.

---

## White Label Themes

Phase 3.

---

## Design Token Management

Phase 3.

---

# Architecture Decision Record

| Decision | Status |
|-----------|---------|
| Next.js 15 | ✅ Approved |
| TypeScript | ✅ Approved |
| Tailwind CSS | ✅ Approved |
| ShadCN UI | ✅ Approved |
| TanStack Query | ✅ Approved |
| Zustand | ✅ Approved |
| Inter Font | ✅ Approved |
| Deep Navy + Gold Branding | ✅ Approved |
| Dark Mode | ⏳ Phase 2 |
| White Label Themes | ⏳ Future |

---

# Frontend Readiness Matrix

| Area | Status |
|---------|---------|
| Website | ✅ |
| Customer Portal | ✅ |
| Partner Portal | ✅ |
| Employee Portal | ✅ |
| Admin Portal | ✅ |
| Design System | ✅ |
| Component Library | ✅ |
| Responsive Design | ✅ |
| Accessibility | ✅ |
| Security Standards | ✅ |

---

# Conclusion

The Crazy Capital Frontend Architecture is designed to provide a premium, scalable, and consistent user experience across all platform touchpoints. Built on Next.js, TypeScript, Tailwind CSS, and ShadCN UI, the design system ensures maintainability, rapid development, strong branding, and enterprise-grade usability while supporting future expansion into mobile applications, white-label deployments, and AI-driven experiences.

---

**Crazy Capital**
**Frontend Architecture Foundation**
**Building India's Growth Story 🇮🇳**