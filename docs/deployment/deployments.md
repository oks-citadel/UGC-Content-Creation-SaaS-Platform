# Deployments Guide

> **Platform-Managed Deployment Strategy**
> Vercel for Frontend | Railway for Backend | GitHub for Quality Gates

---

## Table of Contents

1. [Deployment Philosophy](#deployment-philosophy)
2. [Branch Strategy](#branch-strategy)
3. [Vercel Frontend Deployment](#vercel-frontend-deployment)
4. [Railway Backend Deployment](#railway-backend-deployment)
5. [GitHub Actions (Quality Gates)](#github-actions-quality-gates)
6. [Environment Configuration](#environment-configuration)
7. [Deployment Checklist](#deployment-checklist)

---

## Deployment Philosophy

### Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Platform-Managed Deploys** | Vercel and Railway handle deployments, not CI/CD |
| **GitHub Actions = Quality Gates** | CI runs tests/lint only; does NOT deploy |
| **Promotion by Merge** | Production deploys triggered by merge to `main` |
| **No Manual Production Edits** | All changes via PR → merge workflow |
| **Immutable Deployments** | Each deploy creates a new immutable artifact |

### Deployment Triggers

```
┌────────────┐     ┌────────────┐     ┌────────────┐
│   PR       │     │   Merge    │     │  Platform  │
│  Created   │────►│   to main  │────►│  Deploys   │
└────────────┘     └────────────┘     └────────────┘
      │                                      │
      ▼                                      ▼
┌────────────┐                        ┌────────────┐
│  Preview   │                        │ Production │
│  Deploy    │                        │  Deploy    │
└────────────┘                        └────────────┘
```

---

## Branch Strategy

### Branch Mapping

| Branch | Environment | Frontend (Vercel) | Backend (Railway) |
|--------|-------------|-------------------|-------------------|
| `main` | Production | Production deploy | Production deploy |
| `develop` | Staging | Staging deploy | Staging deploy |
| `feature/*` | Preview | Preview deploy | — |
| PR branches | Preview | Preview deploy | — |

### Branch Protection Rules

**`main` branch:**
```yaml
# Required settings in GitHub
Branch protection:
  - Require pull request reviews: 1
  - Require status checks:
    - lint
    - test
    - security
  - Require branches to be up to date
  - Include administrators: true
  - Allow force pushes: false
  - Allow deletions: false
```

**`develop` branch:**
```yaml
Branch protection:
  - Require pull request reviews: 1
  - Require status checks:
    - lint
    - test
  - Allow force pushes: false
```

---

## Vercel Frontend Deployment

### Project Setup

#### 1. Connect Repository

```bash
# Via Vercel CLI
npm i -g vercel
vercel login
vercel link

# Select:
# - Scope: Your team
# - Link to existing project: Yes (or create new)
# - Project name: your-project-frontend
```

#### 2. Configure Git Integration

In Vercel Dashboard → Project → Settings → Git:

```
Production Branch: main
Preview Branches: All branches
Ignored Build Step: (leave empty for auto-build)
```

#### 3. Framework Settings

```
Framework Preset: Next.js (auto-detected)
Build Command: pnpm build (or npm run build)
Output Directory: .next (auto-detected)
Install Command: pnpm install (or npm install)
```

### Environment Variables

#### Production Environment

In Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com

# Authentication
NEXTAUTH_URL=https://app.example.com
NEXTAUTH_SECRET=<generated-secret>

# Analytics (client-side OK)
NEXT_PUBLIC_MIXPANEL_TOKEN=<token>
NEXT_PUBLIC_SENTRY_DSN=<dsn>

# Feature Flags
NEXT_PUBLIC_FEATURE_AI=true
```

**Environment Scope:**
- Production: `main` branch only
- Preview: All other branches
- Development: Local only

#### Staging Environment

```bash
# Create staging environment in Vercel
NEXT_PUBLIC_API_URL=https://api-staging.example.com
NEXT_PUBLIC_APP_URL=https://staging.example.com
NEXTAUTH_URL=https://staging.example.com
```

### Custom Domain Configuration

#### Production Domains

```
Vercel Dashboard → Project → Settings → Domains

Add:
1. example.com (root)
2. app.example.com (application)
3. www.example.com (redirect to root)
```

#### Domain Verification

```bash
# Vercel will provide verification TXT record
# Add to GoDaddy:
Type: TXT
Host: _vercel
Value: <provided-verification-code>
TTL: 300
```

### Preview Deployments

Every PR gets an automatic preview:

```
PR #123 → https://your-project-git-feature-xyz-team.vercel.app
```

**Preview Environment Variables:**
- Inherit from Preview scope
- Can override per-deployment via `vercel.json`

### Deployment Commands

```bash
# Manual deploy (development)
vercel

# Manual deploy (production) - use sparingly
vercel --prod

# Rollback to previous deployment
vercel rollback

# List deployments
vercel ls

# Inspect deployment
vercel inspect <deployment-url>
```

---

## Railway Backend Deployment

### Project Setup

#### 1. Create Railway Project

```bash
# Via Railway CLI
npm i -g @railway/cli
railway login
railway init

# Creates new project in Railway dashboard
```

#### 2. Connect Repository

In Railway Dashboard → Project → New Service → GitHub Repo:

```
Repository: your-org/your-backend-repo
Branch: main (for production)
Root Directory: / (or /apps/api if monorepo)
```

### Service Configuration

#### API Service

```
Railway Dashboard → Service → Settings

Service Name: api
Start Command: npm start
Health Check Path: /health
Port: 8000 (Railway auto-detects)
```

#### Worker Services

```
Service Name: worker-queue
Start Command: npm run worker:queue
Health Check Path: (none for workers)
Replicas: 1
```

#### Cron Services

```
Service Name: cron-cleanup
Start Command: npm run cron:cleanup
Schedule: 0 2 * * * (2 AM daily)
```

### Database Provisioning

#### PostgreSQL

```bash
# Via CLI
railway add --plugin postgresql

# Or via Dashboard:
# Project → New → Database → PostgreSQL
```

**Connection String:**
```bash
# Automatically available as:
DATABASE_URL=postgresql://user:pass@host:5432/railway

# Access in code:
process.env.DATABASE_URL
```

#### Redis

```bash
# Via CLI
railway add --plugin redis

# Connection available as:
REDIS_URL=redis://default:pass@host:6379
```

### Environment Variables

#### Production Variables

```bash
# Railway Dashboard → Service → Variables

# Application
NODE_ENV=production
PORT=8000

# Database (auto-injected by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Authentication
JWT_SECRET=<generated-secret>
JWT_ISSUER=your-platform

# CORS
CORS_ALLOWED_ORIGINS=https://example.com,https://app.example.com

# External Services
STRIPE_SECRET_KEY=<secret>
SENDGRID_API_KEY=<secret>
```

#### Staging Variables

Create separate Railway project for staging, or use environments:

```bash
# If using Railway Environments feature
railway environment staging

# Set staging-specific variables
railway variables set NODE_ENV=staging
railway variables set CORS_ALLOWED_ORIGINS=https://staging.example.com
```

### Custom Domain Configuration

```
Railway Dashboard → Service → Settings → Domains

Add Custom Domain:
1. api.example.com

Railway provides:
- CNAME target: <project>.up.railway.app
- SSL certificate (auto-provisioned)
```

### Deployment Commands

```bash
# Deploy current directory
railway up

# Deploy specific service
railway up --service api

# View logs
railway logs

# View logs for specific service
railway logs --service api

# Open Railway dashboard
railway open

# Check deployment status
railway status
```

### Health Checks

Configure in service settings:

```
Health Check Path: /health
Health Check Timeout: 30s
Health Check Interval: 10s
```

**Health Endpoint Implementation:**

```javascript
// /health endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.raw('SELECT 1');

    // Check Redis connection
    await redis.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

---

## GitHub Actions (Quality Gates)

### Workflow Configuration

GitHub Actions **ONLY** runs quality gates. Deployment is handled by platforms.

```yaml
# .github/workflows/ci.yml
name: CI Quality Gates

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - uses: codecov/codecov-action@v4
        if: always()

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
```

### Required Status Checks

Configure in GitHub → Repository → Settings → Branches → main:

```
Required status checks:
✓ lint
✓ typecheck
✓ test
✓ security
```

### PR Labels for Deployment Control

```yaml
# Optional: Control deployments via labels
# .github/workflows/deploy-control.yml
name: Deployment Control

on:
  pull_request:
    types: [labeled, unlabeled]

jobs:
  skip-preview:
    if: contains(github.event.pull_request.labels.*.name, 'skip-preview')
    runs-on: ubuntu-latest
    steps:
      - run: echo "Preview deployment skipped via label"
```

---

## Environment Configuration

### Environment Matrix

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `NODE_ENV` | development | staging | production |
| `API_URL` | localhost:8000 | api-staging.example.com | api.example.com |
| `APP_URL` | localhost:3000 | staging.example.com | app.example.com |
| `LOG_LEVEL` | debug | info | warn |
| `DATABASE_URL` | local postgres | staging DB | production DB |

### Secret Management

**Never in Git:**
- API keys
- Database credentials
- JWT secrets
- OAuth secrets
- Encryption keys

**Platform Secret Storage:**

| Platform | Secret Location | Access Method |
|----------|-----------------|---------------|
| Vercel | Project → Settings → Environment Variables | `process.env.VAR` |
| Railway | Service → Variables | `process.env.VAR` |
| GitHub | Repo → Settings → Secrets | `${{ secrets.VAR }}` |

### Generating Secrets

```bash
# JWT Secret (64 bytes, base64)
openssl rand -base64 64

# NextAuth Secret (32 bytes, base64)
openssl rand -base64 32

# API Key (32 bytes, hex)
openssl rand -hex 32

# Session Secret (32 bytes, base64)
openssl rand -base64 32
```

---

## Deployment Checklist

### Pre-Deployment (PR Created)

- [ ] All status checks passing (lint, test, security)
- [ ] Preview deployment verified (Vercel)
- [ ] No console errors in preview
- [ ] Feature tested in preview environment
- [ ] PR description includes test plan

### Pre-Merge (Ready for Production)

- [ ] Code review approved
- [ ] All conversations resolved
- [ ] Branch up-to-date with main
- [ ] No merge conflicts
- [ ] Breaking changes documented

### Post-Merge (Production Deploy)

- [ ] Monitor Vercel deployment status
- [ ] Monitor Railway deployment status
- [ ] Check production health endpoints
- [ ] Verify critical user flows
- [ ] Check error tracking (Sentry)
- [ ] Monitor metrics for anomalies

### Rollback Decision Points

| Condition | Action |
|-----------|--------|
| 5xx errors > 1% | Investigate, consider rollback |
| 5xx errors > 5% | Immediate rollback |
| Critical feature broken | Immediate rollback |
| Database migration failed | Rollback + investigate |
| Third-party integration failed | Fix forward if possible |

---

## Troubleshooting

### Vercel Build Failing

```bash
# Check build logs
vercel logs <deployment-url>

# Common issues:
# 1. Missing environment variables
# 2. Build command incorrect
# 3. Dependency installation failed
# 4. Out of memory during build
```

### Railway Deploy Failing

```bash
# Check deploy logs
railway logs --service api

# Common issues:
# 1. Health check failing
# 2. Port not correctly configured
# 3. Database connection failed
# 4. Missing environment variables
```

### Environment Variable Not Available

```bash
# Vercel: Check scope (Production/Preview/Development)
# Railway: Check service assignment

# Debug in application:
console.log('Available env:', Object.keys(process.env).filter(k => !k.startsWith('npm_')));
```

### Preview Not Updating

```bash
# Force redeploy via Vercel CLI
vercel --force

# Or trigger via empty commit
git commit --allow-empty -m "Trigger redeploy"
git push
```
