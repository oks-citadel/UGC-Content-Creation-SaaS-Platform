# Rollback Runbook

> **Emergency Recovery Procedures**
> Rapid rollback for Vercel, Railway, Database, and DNS

---

## Table of Contents

1. [Rollback Decision Framework](#rollback-decision-framework)
2. [Vercel Frontend Rollback](#vercel-frontend-rollback)
3. [Railway Backend Rollback](#railway-backend-rollback)
4. [Database Rollback](#database-rollback)
5. [DNS Rollback](#dns-rollback)
6. [Full System Rollback](#full-system-rollback)
7. [Post-Rollback Procedures](#post-rollback-procedures)

---

## Rollback Decision Framework

### Severity Classification

| Severity | Symptoms | Response Time | Action |
|----------|----------|---------------|--------|
| **SEV-1** | Complete outage, data loss risk | Immediate | Full rollback |
| **SEV-2** | Critical feature broken, 5xx > 5% | < 15 minutes | Component rollback |
| **SEV-3** | Non-critical bug, degraded UX | < 1 hour | Fix forward or rollback |
| **SEV-4** | Minor issue, cosmetic | Next business day | Fix forward |

### Decision Tree

```
                    ┌─────────────────┐
                    │ Issue Detected  │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ User Impacted?  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
         ┌────────┐    ┌──────────┐   ┌──────────┐
         │  Yes   │    │ Partial  │   │    No    │
         └───┬────┘    └────┬─────┘   └────┬─────┘
             │              │              │
             ▼              ▼              ▼
        ┌─────────┐   ┌──────────┐   ┌──────────┐
        │ SEV-1/2 │   │  SEV-3   │   │  SEV-4   │
        │ROLLBACK │   │ EVALUATE │   │FIX FWRD  │
        └─────────┘   └──────────┘   └──────────┘
```

### Rollback Triggers

**Immediate Rollback Required:**
- [ ] Application returning 5xx errors to > 5% of requests
- [ ] Authentication completely broken
- [ ] Payment processing failing
- [ ] Data corruption detected
- [ ] Security vulnerability exploited

**Evaluate for Rollback:**
- [ ] 5xx errors between 1-5%
- [ ] Single critical feature broken
- [ ] Performance degradation > 50%
- [ ] Third-party integration failing

**Fix Forward Preferred:**
- [ ] Non-critical feature bug
- [ ] UI/UX issues
- [ ] Performance degradation < 50%
- [ ] Errors isolated to single user segment

---

## Vercel Frontend Rollback

### Method 1: Instant Rollback (Recommended)

```bash
# List recent deployments
vercel ls

# Output:
# Age   Status  Name           URL
# 2h    Ready   production     your-app-abc123.vercel.app
# 5h    Ready   production     your-app-def456.vercel.app  ← rollback target
# 8h    Ready   production     your-app-ghi789.vercel.app

# Instant rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback your-app-def456.vercel.app
```

**Expected Result:**
- Rollback completes in < 10 seconds
- No re-build required
- Previous deployment becomes active immediately

### Method 2: Promote Previous Build

Via Vercel Dashboard:

1. Go to Project → Deployments
2. Find the last known good deployment
3. Click the three-dot menu (...)
4. Select "Promote to Production"
5. Confirm the promotion

### Method 3: Revert Git Commit

```bash
# Identify the problematic commit
git log --oneline -10

# Revert the commit (creates new commit)
git revert <commit-hash>

# Push to main (triggers new deployment)
git push origin main
```

**Note:** This creates a new deployment, not an instant rollback.

### Vercel Rollback Verification

```bash
# Check current production deployment
vercel inspect --prod

# Verify the correct deployment is active
curl -I https://app.example.com

# Check deployment SHA
curl -s https://app.example.com/api/health | jq '.version'
```

### Rollback Timeline

| Action | Duration |
|--------|----------|
| Initiate rollback | Instant |
| Global CDN propagation | < 30 seconds |
| Full rollback complete | < 1 minute |

---

## Railway Backend Rollback

### Method 1: Rollback to Previous Deployment

```bash
# List recent deployments
railway deployments

# Rollback to previous deployment
railway rollback

# Or via specific deployment ID
railway rollback --deployment <deployment-id>
```

### Method 2: Railway Dashboard Rollback

1. Go to Railway Dashboard → Project → Service
2. Click "Deployments" tab
3. Find last known good deployment
4. Click "Redeploy" on that deployment

### Method 3: Force Redeploy Previous Commit

```bash
# If CLI rollback not available, redeploy specific commit
git checkout <known-good-commit>

# Push to trigger deployment
git push origin main --force

# WARNING: Force push only if absolutely necessary
# Consider creating a revert commit instead
```

### Service-Specific Rollback

```bash
# Rollback only the API service
railway rollback --service api

# Rollback only the worker service
railway rollback --service worker

# Rollback multiple services
railway rollback --service api
railway rollback --service worker
```

### Railway Rollback Verification

```bash
# Check service health
curl https://api.example.com/health

# Check deployment version
curl -s https://api.example.com/health | jq '.version'

# View current deployment logs
railway logs --service api --limit 50
```

### Rollback Timeline

| Action | Duration |
|--------|----------|
| Initiate rollback | < 10 seconds |
| Container restart | 30-60 seconds |
| Health check pass | 30-60 seconds |
| **Total** | **1-2 minutes** |

---

## Database Rollback

### Decision Tree: Database Rollback

```
         ┌─────────────────────────┐
         │ Database Issue Detected │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │ Was there a migration?  │
         └───────────┬─────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
    ┌───────────┐        ┌───────────┐
    │    Yes    │        │    No     │
    └─────┬─────┘        └─────┬─────┘
          │                    │
          ▼                    ▼
    ┌───────────┐        ┌───────────┐
    │ Rollback  │        │ Check for │
    │ Migration │        │ data issue│
    └───────────┘        └───────────┘
```

### Method 1: Rollback Migration (Preferred)

```bash
# Connect to Railway database
railway connect postgres

# Check current migration status
npx prisma migrate status

# Or for Knex:
npx knex migrate:status

# Rollback last migration
npx prisma migrate reset --skip-seed  # Prisma
npx knex migrate:rollback             # Knex

# Verify rollback
npx prisma migrate status
```

### Method 2: Point-in-Time Recovery

If using Railway's PostgreSQL with backups:

1. **Contact Railway Support** for PITR assistance
2. Provide:
   - Project ID
   - Target timestamp (UTC)
   - Reason for recovery

### Method 3: Restore from Backup

```bash
# Download latest backup (if using pg_dump)
# From Railway or your backup service

# Restore to a new database first (safety)
pg_restore --dbname=railway_restore --verbose backup.dump

# Verify data integrity
psql railway_restore -c "SELECT COUNT(*) FROM users;"

# If verified, swap connection strings in Railway
```

### Database Rollback Checklist

- [ ] Notify all team members of database rollback
- [ ] Put application in maintenance mode (optional)
- [ ] Create current state backup before rollback
- [ ] Execute rollback
- [ ] Verify data integrity
- [ ] Test application connectivity
- [ ] Remove maintenance mode
- [ ] Monitor for issues

### Data Integrity Verification

```sql
-- Run after rollback to verify data
-- Adjust tables/counts based on your schema

-- Check row counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'payments', COUNT(*) FROM payments;

-- Check for orphaned records
SELECT COUNT(*) FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL;

-- Check recent activity
SELECT MAX(created_at) as last_record FROM users;
SELECT MAX(created_at) as last_record FROM orders;
```

---

## DNS Rollback

### When DNS Rollback is Needed

- SSL certificate issues after cutover
- Misconfigured DNS records
- Need to point back to previous infrastructure

### DNS Rollback Procedure

#### Step 1: Retrieve Backup Records

```bash
# From your backup files (created during cutover)
cat backup_dns_a.txt
cat backup_dns_cname_app.txt
cat backup_dns_cname_api.txt
```

#### Step 2: Update GoDaddy DNS

1. Log into GoDaddy → Domain Manager
2. Select domain → DNS → DNS Records
3. Restore original values:

```
# Example - restoring to previous hosting
Type: A
Host: @
Value: <previous-ip-address>
TTL: 300

Type: CNAME
Host: app
Value: <previous-cname-target>
TTL: 300
```

#### Step 3: Wait for Propagation

```bash
# Monitor propagation
watch -n 60 "dig example.com A +short"

# Check multiple DNS servers
for dns in 8.8.8.8 1.1.1.1 208.67.222.222; do
    echo "Checking $dns:"
    dig @$dns example.com A +short
done
```

### DNS Rollback Timeline

| Time | Expected State |
|------|----------------|
| T+0 | Records updated in GoDaddy |
| T+5 min | Some resolvers see old records |
| T+15 min | ~50% propagation |
| T+30 min | ~90% propagation |
| T+60 min | ~99% propagation |

**Note:** With TTL=300 (5 min), propagation is faster than default TTLs.

---

## Full System Rollback

### Nuclear Option: Complete Rollback

Use when multiple components are failing and individual rollbacks aren't resolving issues.

#### Sequence

```
1. Database Rollback (if migration involved)
   └── Restore to known good state
         │
2. Railway Backend Rollback
   └── Rollback API and worker services
         │
3. Vercel Frontend Rollback
   └── Instant rollback to previous deployment
         │
4. Verification
   └── Test all critical paths
         │
5. (Optional) DNS Rollback
   └── Only if infrastructure change was DNS-related
```

#### Full Rollback Commands

```bash
# === STEP 1: Database (if needed) ===
railway connect postgres
npx prisma migrate rollback  # or knex migrate:rollback

# === STEP 2: Railway Backend ===
railway rollback --service api
railway rollback --service worker
railway rollback --service cron

# Wait for health checks
sleep 60

# Verify backend
curl https://api.example.com/health

# === STEP 3: Vercel Frontend ===
vercel rollback

# Verify frontend
curl -I https://app.example.com

# === STEP 4: Verification ===
# Run smoke tests
./scripts/smoke-test.sh

# === STEP 5: DNS (if needed) ===
# Manual process in GoDaddy - see DNS Rollback section
```

### Communication During Rollback

```markdown
## Status Update Template

**Time:** [TIMESTAMP]
**Status:** ROLLBACK IN PROGRESS

**Issue:** [Brief description]

**Actions Taken:**
- [ ] Database rollback: [status]
- [ ] Backend rollback: [status]
- [ ] Frontend rollback: [status]
- [ ] DNS rollback: [status]

**ETA to Resolution:** [estimate]

**Next Update:** [time]
```

---

## Post-Rollback Procedures

### Immediate Actions (T+0 to T+15 min)

- [ ] Verify all services responding
- [ ] Check health endpoints
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Confirm rollback successful

### Short-Term Actions (T+15 min to T+2 hours)

- [ ] Document the incident
- [ ] Identify root cause
- [ ] Create fix branch
- [ ] Review logs for additional issues
- [ ] Notify stakeholders of resolution

### Post-Incident Actions (T+24 hours)

- [ ] Complete incident report
- [ ] Conduct blameless post-mortem
- [ ] Create action items for prevention
- [ ] Update runbooks if needed
- [ ] Schedule fix deployment

### Incident Report Template

```markdown
# Incident Report: [DATE] [TITLE]

## Summary
- **Duration:** [start time] to [end time]
- **Impact:** [user impact description]
- **Root Cause:** [brief description]

## Timeline
- **HH:MM** - Issue detected
- **HH:MM** - Rollback initiated
- **HH:MM** - Services restored
- **HH:MM** - Incident resolved

## Root Cause Analysis
[Detailed explanation]

## Resolution
[What was done to fix]

## Action Items
- [ ] [Action 1] - Owner - Due Date
- [ ] [Action 2] - Owner - Due Date

## Lessons Learned
- [Learning 1]
- [Learning 2]
```

---

## Quick Reference Card

### Emergency Commands

```bash
# VERCEL: Instant rollback
vercel rollback

# RAILWAY: Rollback backend
railway rollback --service api

# VERCEL: List deployments
vercel ls

# RAILWAY: View logs
railway logs --service api --limit 100

# DNS: Check propagation
dig example.com A +short

# TEST: Smoke test
curl -I https://app.example.com
curl https://api.example.com/health
```

### Emergency Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| On-Call Engineer | [contact] | First responder |
| Platform Lead | [contact] | Escalation |
| Database Admin | [contact] | DB rollbacks |
| Vercel Support | support@vercel.com | Platform issues |
| Railway Support | support@railway.app | Platform issues |
