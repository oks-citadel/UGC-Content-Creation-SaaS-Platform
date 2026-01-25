# Deployment Quick Start Guide

> **Get your SaaS deployed to Vercel + Railway in 30 minutes**

---

## Prerequisites

```bash
# Install CLI tools
npm install -g vercel @railway/cli

# Login to platforms
vercel login
railway login
```

---

## Step 1: Configure Frontend (Vercel)

### Option A: Automatic (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select `apps/web` as the root directory
4. Vercel auto-detects Next.js settings
5. Add environment variables:

```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
NEXTAUTH_URL=https://app.yourdomain.com
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
```

6. Deploy!

### Option B: CLI

```bash
cd apps/web
vercel link
vercel env add NEXT_PUBLIC_API_URL
vercel deploy --prod
```

### Repeat for other apps:
- `apps/admin` → admin.yourdomain.com
- `apps/creator-portal` → creators.yourdomain.com
- `apps/brand-portal` → brands.yourdomain.com

---

## Step 2: Configure Backend (Railway)

### Create Railway Project

1. Go to [railway.app/new](https://railway.app/new)
2. Select "Empty Project"
3. Add services:

```
+ New → GitHub Repo → Select repo → services/api-gateway
+ New → GitHub Repo → Select repo → services/auth-service
+ New → Database → PostgreSQL
+ New → Database → Redis
```

### Configure Service

For each service, set:

**Settings → General:**
- Root Directory: `services/<service-name>`
- Build Command: `pnpm install && pnpm build`
- Start Command: `node dist/index.js`

**Settings → Networking:**
- Generate Domain (for api-gateway)

**Variables:**
```
NODE_ENV=production
PORT=4000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<your-jwt-secret>
CORS_ALLOWED_ORIGINS=https://app.yourdomain.com
```

### Quick CLI Setup

```bash
# Link to Railway project
railway link

# Deploy API Gateway
cd services/api-gateway
railway up

# Check logs
railway logs
```

---

## Step 3: Configure DNS (GoDaddy)

In GoDaddy DNS Manager, add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | `76.76.21.21` | 300 |
| CNAME | www | `cname.vercel-dns.com` | 300 |
| CNAME | app | `cname.vercel-dns.com` | 300 |
| CNAME | api | `<your-project>.up.railway.app` | 300 |

### Add Custom Domains

**Vercel:**
1. Project Settings → Domains → Add `app.yourdomain.com`

**Railway:**
1. Service Settings → Domains → Add `api.yourdomain.com`

---

## Step 4: Verify Deployment

```bash
# Check frontend
curl -I https://app.yourdomain.com

# Check API
curl https://api.yourdomain.com/health

# Verify SSL
echo | openssl s_client -connect api.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Step 5: Set Up GitHub Secrets

Go to GitHub → Repository → Settings → Secrets → Actions:

| Secret | Where to get it |
|--------|-----------------|
| `VERCEL_TOKEN` | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel Project Settings |
| `RAILWAY_TOKEN` | railway.app/account/tokens |

---

## Deployment Commands

### Frontend (Vercel)

```bash
# Deploy preview
vercel

# Deploy production
vercel --prod

# Rollback
vercel rollback

# View logs
vercel logs <deployment-url>
```

### Backend (Railway)

```bash
# Deploy
railway up

# View logs
railway logs --service api-gateway

# Rollback
railway rollback

# Connect to database
railway connect postgres
```

---

## Troubleshooting

### Build fails on Vercel
```bash
# Check build logs
vercel logs <deployment-url>

# Ensure dependencies are installed
pnpm install
```

### Service not starting on Railway
```bash
# Check logs
railway logs --service <service-name>

# Verify environment variables
railway variables

# Check health endpoint
railway run curl http://localhost:$PORT/health
```

### DNS not resolving
```bash
# Check propagation
dig yourdomain.com A +short

# Force DNS refresh
dig @8.8.8.8 yourdomain.com A +short
```

### CORS errors
- Verify `CORS_ALLOWED_ORIGINS` includes frontend URL
- Check that credentials: true is set
- Ensure protocol matches (https)

---

## Monitoring

### Vercel Analytics
- Project → Analytics → Enable

### Railway Observability
- Project → Observability → View Metrics

### Health Endpoints
```bash
# API health
curl https://api.yourdomain.com/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "version": "abc123"
}
```

---

## Next Steps

1. ✅ Complete [Staging Validation](./staging-validation.md)
2. ✅ Review [Security Baseline](./security-baseline.md)
3. ✅ Configure [Observability](./observability.md)
4. ✅ Prepare [Rollback Procedures](./rollback.md)

---

## Quick Reference

| Component | Production URL | Dashboard |
|-----------|----------------|-----------|
| Web App | app.yourdomain.com | vercel.com/dashboard |
| Admin | admin.yourdomain.com | vercel.com/dashboard |
| API | api.yourdomain.com | railway.app/dashboard |
| Database | (internal) | railway.app/dashboard |

| Action | Command |
|--------|---------|
| Deploy frontend | `vercel --prod` |
| Deploy backend | `railway up` |
| View frontend logs | `vercel logs` |
| View backend logs | `railway logs` |
| Rollback frontend | `vercel rollback` |
| Rollback backend | `railway rollback` |
