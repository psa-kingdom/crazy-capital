# 🚀 Crazy Capital — Staging Infrastructure & Deployment Architecture

---

## 1. Overview & Domain Strategy

Crazy Capital operates on a **CLI-First, Domain-Agnostic Staging Architecture**.
Custom production domains are intentionally deferred until purchase/DNS readiness.

Staging environments use secure, provider-generated HTTPS endpoints:
- **Backend API (Railway):** `https://api-staging-41ee.up.railway.app`
- **Admin Portal (Vercel):** `https://admin-*-psumanassociates-9980s-projects.vercel.app`
- **Customer / Web Portal (Vercel):** `https://web-*-psumanassociates-9980s-projects.vercel.app`

---

## 2. Infrastructure Topology

```
                               GitHub Repository
                       (psa-kingdom/crazy-capital @ main)
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
        Vercel Staging Projects                 Railway Staging Project
        (psa-kingdom Account)                     (crazy-capital)
                 │                                         │
     ┌───────────┴───────────┐                 ┌───────────┴───────────┐
     │                       │                 │                       │
  @cc/web                 @cc/admin         @cc/api                PostgreSQL
 (apps/web)             (apps/admin)       (apps/api)             (Internal VPC)
     │                       │                 │                       │
     └─────── HTTPS REST ────┴─────────────────┘                       │
                                               └────── Prisma Client ──┘
```

---

## 3. Railway Configuration (Backend & Persistence)

### 3.1 Project & Services
- **Project Name:** `crazy-capital`
- **Project ID:** `ced170ab-7db9-4e56-8cab-a552467b25ee`
- **Environment:** `staging` (`4ce91013-0ec9-44b4-8b4b-91efdf0ee6de`)
- **Persistence Layer:** PostgreSQL 18 SSL (`Postgres` service, Volume: `postgres-volume`)
- **Backend Service:** `api` (`107ab6c8-4359-4f50-908a-4ebcc610d639`)
- **Connected Repository:** `psa-kingdom/crazy-capital` (Branch: `main`)
- **Service Domain:** `https://api-staging-41ee.up.railway.app`

### 3.2 Monorepo Deployment Config (`railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npx prisma generate --schema=apps/api/prisma/schema.prisma && npx turbo run build --filter=@cc/api..."
  },
  "deploy": {
    "startCommand": "npx prisma db push --schema=apps/api/prisma/schema.prisma --skip-generate && node apps/api/dist/main.js",
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 120,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 3.3 Configured Staging Environment Variables
| Variable Name | Purpose | Value / Mapping |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `${{Postgres.DATABASE_URL}}` (private internal VPC) |
| `NODE_ENV` | Runtime environment | `staging` |
| `PORT` | API listen port | `4000` |
| `API_PREFIX` | Global API version prefix | `api/v1` |
| `JWT_SECRET` | 32+ char cryptographic secret for access tokens | *Secure Staging Secret* |
| `JWT_REFRESH_SECRET` | 32+ char cryptographic secret for refresh tokens | *Secure Staging Secret* |
| `CORS_ORIGIN` | Allowed frontend origins | `https://crazy-capital-web.vercel.app,https://crazy-capital-admin.vercel.app,http://localhost:3000,http://localhost:3001` |

---

## 4. Vercel Configuration (Frontend Applications)

### 4.1 Project Matrix
| App | Vercel Project Name | Root Directory | Environment Variable |
|---|---|---|---|
| `@cc/web` (Customer & Public) | `psumanassociates-9980s-projects/web` | `apps/web` | `NEXT_PUBLIC_API_URL=https://api-staging-41ee.up.railway.app/api/v1` |
| `@cc/admin` (Admin & Operations) | `psumanassociates-9980s-projects/admin` | `apps/admin` | `NEXT_PUBLIC_API_URL=https://api-staging-41ee.up.railway.app/api/v1` |

### 4.2 Monorepo Build Execution
- Both projects compile via Next.js 15 App Router using Turborepo workspaces.
- Shared workspace dependencies (`@cc/ui`, `@cc/types`, `@cc/validation`, `@cc/shared`) are resolved automatically.

---

## 5. CLI-First Operational Commands

### Railway CLI Commands
```powershell
# Check project status and active environment
npx @railway/cli status --json

# View live deployment logs for backend API
npx @railway/cli logs --service api

# Redeploy latest commit
npx @railway/cli redeploy --service api
```

### Vercel CLI Commands
```powershell
# Deploy Web staging preview
vercel --cwd apps/web

# Deploy Admin staging preview
vercel --cwd apps/admin

# List environment variables
vercel env ls --cwd apps/web
```

---

## 6. Database Migration & Schema Workflow

1. **Local Development:** Developers edit `apps/api/prisma/schema.prisma` and run `npm --prefix apps/api run prisma:migrate`.
2. **Staging Pipeline:** During Railway build/deploy, `npx prisma db push --schema=apps/api/prisma/schema.prisma` automatically applies structural updates to Railway PostgreSQL.
3. **Rollback Safety:** Schema additions are strictly additive (no destructive column drops without deprecation windows).

---

## 7. Preparation for Vertical Slice 1.7 (Secure Document Vault)

### 7.1 Architecture & Storage Abstraction
```
Customer Upload Flow:
1. Client requests upload URL (POST /api/v1/documents/presigned-upload)
2. API validates file type (PDF/JPG/PNG) + size (<10MB) + tenant permissions
3. API generates short-lived signed S3/R2 PUT URL (valid 15 mins)
4. Client uploads file directly to Object Storage
5. Client confirms upload (POST /api/v1/documents/:id/complete-upload)
6. Backend marks document as PENDING_VERIFICATION
```

### 7.2 Storage Provider Interface
```typescript
export interface ObjectStorageProvider {
  getPresignedUploadUrl(key: string, mimeType: string, expiresInSec?: number): Promise<string>;
  getPresignedDownloadUrl(key: string, expiresInSec?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}
```

### 7.3 Activation Requirements
- **Cloudflare R2:** Activated at Sprint 4 kickoff.
- **Security Invariant:** Raw binary files are NEVER stored in PostgreSQL; database stores metadata, storage key, SHA-256 hash, and verification status.

---
*Document maintained by Crazy Capital Engineering Architecture Team.*
