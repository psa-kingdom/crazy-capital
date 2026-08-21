# 03-identity-authentication-and-authorization.md

---

# Document Information

| Field | Value |
|---------|---------|
| Document Name | Identity, Authentication & Authorization |
| Product | Crazy Capital |
| Version | 1.0 |
| Status | Approved |
| Category | Security Architecture |
| Type | Identity & Access Management (IAM) Design |

---

# Purpose

This document defines how users are identified, authenticated, authorized, and managed across the Crazy Capital platform.

It establishes:

- User Identity Model
- Authentication Strategy
- Authorization Model
- Role-Based Access Control (RBAC)
- Session Management
- Permission Framework
- Security Controls

This document serves as the foundation for:

- Login System
- User Management
- Access Control
- API Security
- Portal Security
- Audit Compliance

---

# IAM Vision

The platform must ensure that:

- Every user has a unique identity
- Authentication is secure
- Authorization is granular
- Access follows least-privilege principles
- Every action is auditable
- Security scales with platform growth

---

# Identity Architecture

---

## Identity Principle

Every individual interacting with the platform is represented as a User.

Examples:

```text
Customer
Partner
Employee
Admin
Super Admin
```

All users exist in a common identity system.

---

# User Hierarchy

```text
User
│
├── Customer
├── Partner
├── Employee
├── Branch Manager
├── Admin
└── Super Admin
```

---

# Identity Model

---

## Core User Entity

Every user will have a master identity record.

### users

```sql
id UUID
organization_id UUID
branch_id UUID

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

## User Characteristics

A user can:

- Have one role
- Have multiple permissions
- Belong to a branch
- Belong to an organization
- Access one or more portals

---

# Authentication Architecture

---

# Supported Login Methods

---

## Method 1

### Email + Password

Supported For:

- Customers
- Partners
- Employees
- Admins

Example:

```text
user@example.com
password
```

---

## Method 2

### Mobile OTP

Supported For:

- Customers

Example:

```text
Mobile Number
↓
OTP
↓
Login
```

---

## Method 3

### Email OTP

Supported For:

- Customers

Future Enhancement.

---

## Method 4

### Google Login

Future Enhancement.

---

## Method 5

### Microsoft Login

Future Enhancement.

---

# Authentication Flow

---

## Email Login

```text
Email
↓
Password
↓
Identity Validation
↓
Access Token
↓
Refresh Token
↓
Portal Access
```

---

## OTP Login

```text
Mobile
↓
OTP Request
↓
OTP Verification
↓
Token Generation
↓
Portal Access
```

---

# Password Security

---

## Hashing Algorithm

Approved:

```text
Argon2
```

Never store plain-text passwords.

---

## Password Rules

Minimum:

```text
8 Characters
```

Recommended:

```text
12+ Characters
```

Must include:

- Uppercase
- Lowercase
- Number
- Special Character

---

## Password Storage

```text
password_hash
```

Only.

Never store:

```text
password
```

---

# Token Architecture

---

## Access Token

Purpose:

Authenticate API requests.

Format:

```text
JWT
```

Lifetime:

```text
15 Minutes
```

---

## Refresh Token

Purpose:

Generate new access tokens.

Lifetime:

```text
30 Days
```

Stored:

```text
Database
```

and

```text
HttpOnly Cookie
```

---

# Session Architecture

---

## Session Rules

A user may:

- Login from multiple devices
- View active sessions
- Revoke sessions

---

## Session Table

### user_sessions

```sql
id UUID

user_id

device_name
browser
ip_address

refresh_token

expires_at

created_at
```

---

# Authorization Architecture

---

## Authorization Principle

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
What can you do?
```

---

# Authorization Model

Approved:

```text
RBAC
```

(Role Based Access Control)

---

# RBAC Structure

```text
User
↓
Role
↓
Permissions
↓
Actions
```

---

# Platform Roles

---

## Customer

Can:

- View Own Profile
- Upload Documents
- Track Applications
- Make Payments

Cannot:

- View Other Customers

---

## Partner

Can:

- Submit Leads
- Track Cases
- Track Commissions

Cannot:

- Access Other Partners

---

## Employee

Can:

- Process Cases
- Manage Leads
- Execute Workflows

Cannot:

- Access Platform Configuration

---

## Branch Manager

Can:

- Manage Branch Operations
- View Branch Reports
- Assign Resources

Cannot:

- Access Other Branch Data

---

## Admin

Can:

- Configure Services
- Manage Users
- Configure Workflows
- View Reports

---

## Super Admin

Can:

- Access Everything
- Manage Security
- Manage Organization

---

# Permission Framework

Permissions are granular.

---

## CRM Permissions

Examples:

```text
lead.create
lead.view
lead.edit
lead.assign
lead.delete
```

---

## Customer Permissions

Examples:

```text
customer.create
customer.view
customer.update
```

---

## Workflow Permissions

Examples:

```text
workflow.view
workflow.execute
workflow.approve
workflow.configure
```

---

## Document Permissions

Examples:

```text
document.upload
document.view
document.verify
document.delete
```

---

## Payment Permissions

Examples:

```text
payment.view
payment.create
payment.refund
```

---

## User Permissions

Examples:

```text
user.create
user.edit
user.disable
```

---

# RBAC Database Structure

---

## Roles Table

### roles

```sql
id UUID

name
code

description

created_at
```

---

## Permissions Table

### permissions

```sql
id UUID

name
code

module

created_at
```

---

## Role Permissions

### role_permissions

```sql
role_id
permission_id
```

---

## User Roles

### user_roles

```sql
user_id
role_id
```

---

# Access Scope Architecture

Permissions alone are not sufficient.

Access must also respect scope.

---

# Organization Scope

Users may only access:

```text
Their Organization
```

---

# Branch Scope

Users may only access:

```text
Their Branch
```

unless explicitly granted.

---

# Assignment Scope

Employees may only access:

```text
Assigned Leads
Assigned Cases
Assigned Tasks
```

when configured.

---

# Authorization Flow

```text
Request
↓
Authenticate User
↓
Load Role
↓
Load Permissions
↓
Validate Scope
↓
Grant Access
```

---

# API Security Architecture

Every API request must pass:

---

## Step 1

Authentication

Validate:

```text
JWT Token
```

---

## Step 2

Authorization

Validate:

```text
Permission
```

---

## Step 3

Scope Validation

Validate:

```text
Organization
Branch
Assignment
```

---

## Step 4

Process Request

---

# Portal Access Matrix

| Portal | Customer | Partner | Employee | Admin |
|----------|----------|----------|----------|----------|
| Public Website | ✅ | ✅ | ✅ | ✅ |
| Customer Portal | ✅ | ❌ | ❌ | ❌ |
| Partner Portal | ❌ | ✅ | ❌ | ❌ |
| Employee Portal | ❌ | ❌ | ✅ | ❌ |
| Admin Portal | ❌ | ❌ | ❌ | ✅ |

---

# Password Reset Architecture

---

## Customer Flow

```text
Forgot Password
↓
OTP Verification
↓
New Password
↓
Login
```

---

## Employee/Admin Flow

```text
Forgot Password
↓
Email Link
↓
Reset Password
↓
Login
```

---

# Account Status Management

Supported Statuses:

```text
Active
Pending Verification
Inactive
Suspended
Locked
Deleted
```

---

# Login Protection

Mandatory Controls:

### Rate Limiting

Prevent brute-force attacks.

---

### Account Locking

Example:

```text
5 Failed Attempts
↓
Temporary Lock
```

---

### IP Monitoring

Detect suspicious activity.

---

### Device Tracking

Track active sessions.

---

# Audit Requirements

The following events must be logged:

- Login
- Logout
- Failed Login
- Password Change
- Permission Change
- Role Change
- Account Lock
- Session Revocation

---

# Future Security Enhancements

---

## Two Factor Authentication

Support:

```text
Email OTP
Authenticator App
```

---

## Passkeys

Future support.

---

## SSO

Support:

- Google Workspace
- Microsoft Entra ID

---

## Conditional Access

Examples:

- Country Restriction
- Device Restriction
- Time-Based Access

---

# Recommended NestJS Implementation

---

## Authentication Module

```text
/auth
```

Responsibilities:

- Login
- Logout
- Refresh Token
- Password Reset

---

## Authorization Module

```text
/iam
```

Responsibilities:

- Roles
- Permissions
- Access Validation

---

## Guards

```text
JwtAuthGuard
RolesGuard
PermissionsGuard
ScopeGuard
```

---

## Decorators

```typescript
@Roles()
@Permissions()
@CurrentUser()
```

---

# Architecture Decision Record

| Decision | Status |
|-----------|---------|
| JWT Authentication | ✅ Approved |
| Refresh Tokens | ✅ Approved |
| Argon2 Password Hashing | ✅ Approved |
| RBAC Authorization | ✅ Approved |
| Scope-Based Access | ✅ Approved |
| Session Tracking | ✅ Approved |
| Multi-Device Login | ✅ Approved |
| OAuth Login | ⏳ Future |
| Passkeys | ⏳ Future |

---

# Conclusion

The Crazy Capital Identity & Access Management architecture is built around secure authentication, role-based authorization, scope-aware access control, and comprehensive auditing.

This approach ensures:

- Strong security
- Clean user management
- Scalable permissions
- Multi-branch readiness
- Future enterprise capabilities

while remaining simple enough for Phase 1 implementation.

---

**Crazy Capital**
**Security Architecture Foundation**
**Building India's Growth Story 🇮🇳**