# CreatorBridge Platform - Deployment Checklist

**Version:** 1.0
**Last Updated:** December 18, 2024
**Target Environment:** Production / Staging

---

## Pre-Deployment Checklist

### 1. Code Review & Testing
- [ ] All feature branches merged to `main`
- [ ] Pull request approved by at least 2 reviewers
- [ ] All CI checks passing (lint, type-check, unit tests)
- [ ] Integration tests passing
- [ ] E2E tests passing on staging
- [ ] Security scan (CodeQL) passed
- [ ] No critical/high vulnerabilities in dependencies

### 2. Database Preparation
- [ ] Database migrations tested in staging
- [ ] Migration rollback scripts prepared
- [ ] Database backup taken before migration
- [ ] Connection pool settings verified
- [ ] Read replica sync status confirmed

### 3. Infrastructure Verification
- [ ] Kubernetes cluster health verified
- [ ] Node capacity sufficient for deployment
- [ ] Container registry (ACR) accessible
- [ ] Helm charts updated with new image tags
- [ ] ConfigMaps and Secrets updated
- [ ] Persistent volume claims verified

### 4. External Services
- [ ] Stripe API keys verified (test/live)
- [ ] Azure Blob Storage accessible
- [ ] Redis cluster healthy
- [ ] SendGrid/email service configured
- [ ] CDN configuration verified

### 5. Monitoring & Alerting
- [ ] Application Insights configured
- [ ] Alert rules active
- [ ] On-call engineer notified
- [ ] Status page prepared for maintenance window

---

## Deployment Execution

### Step 1: Pre-Deployment Backup (15 min)
```bash
# 1. Backup PostgreSQL databases
./scripts/backup-databases.sh production

# 2. Export current Kubernetes state
kubectl get all -n creatorbridge-production -o yaml > k8s-backup-$(date +%Y%m%d).yaml

# 3. Note current deployment versions
kubectl get deployments -n creatorbridge-production -o wide
```

### Step 2: Database Migrations (10-30 min)
```bash
# Run migrations for each service
for service in asset-service rights-service payout-service; do
  echo "Running migrations for $service..."
  kubectl exec -it deploy/$service -n creatorbridge-production -- npx prisma migrate deploy
done
```

### Step 3: Deploy Services (20-40 min)

#### Option A: Helm Deployment (Recommended)
```bash
# Update Helm release
helm upgrade creatorbridge ./helm/creatorbridge \
  --namespace creatorbridge-production \
  --set image.tag=${NEW_VERSION} \
  --wait \
  --timeout 10m
```

#### Option B: Rolling Update
```bash
# Update each deployment
for service in api-gateway auth-service user-service billing-service \
  notification-service campaign-service creator-service content-service \
  asset-service rights-service analytics-service payout-service; do
  echo "Deploying $service..."
  kubectl set image deployment/$service \
    $service=creatorbridge.azurecr.io/$service:${NEW_VERSION} \
    -n creatorbridge-production
  kubectl rollout status deployment/$service -n creatorbridge-production --timeout=5m
done
```

### Step 4: Verification (15 min)
```bash
# Run deployment verification script
./scripts/verify-deployment.sh production

# Check all pods are running
kubectl get pods -n creatorbridge-production

# Check recent logs for errors
kubectl logs -l app=api-gateway --tail=100 -n creatorbridge-production
```

### Step 5: Smoke Tests (10 min)
```bash
# Run automated smoke tests
npm run test:smoke -- --env=production

# Manual verification checklist:
# - [ ] Login flow works
# - [ ] Campaign creation works
# - [ ] Content upload works
# - [ ] Creator discovery works
# - [ ] Payment flow works (test mode)
```

---

## Post-Deployment Tasks

### Immediate (0-30 min)
- [ ] Verify all health endpoints responding
- [ ] Check error rates in Application Insights
- [ ] Verify database connections stable
- [ ] Test critical user flows manually
- [ ] Monitor CPU/memory usage

### Short-term (30 min - 2 hours)
- [ ] Review application logs for warnings
- [ ] Verify async job processing (queues)
- [ ] Check webhook deliveries
- [ ] Verify email notifications working
- [ ] Monitor API response times

### Documentation
- [ ] Update deployment log
- [ ] Document any manual interventions
- [ ] Update runbook if issues encountered
- [ ] Notify team of successful deployment

---

## Rollback Procedure

### Quick Rollback (< 5 min)
```bash
# Rollback to previous deployment
kubectl rollout undo deployment/api-gateway -n creatorbridge-production
kubectl rollout undo deployment/auth-service -n creatorbridge-production
# ... repeat for all services

# Or rollback Helm release
helm rollback creatorbridge -n creatorbridge-production
```

### Database Rollback (if needed)
```bash
# 1. Scale down services
kubectl scale deployment --all --replicas=0 -n creatorbridge-production

# 2. Restore database from backup
./scripts/restore-database.sh production backup_20241218_120000.sql

# 3. Rollback migrations (if migration scripts support down)
kubectl exec -it deploy/asset-service -- npx prisma migrate reset --force

# 4. Scale services back up
kubectl scale deployment --all --replicas=2 -n creatorbridge-production
```

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| On-Call Engineer | (Rotation) | PagerDuty |
| Engineering Lead | TBD | Slack: @eng-lead |
| DevOps Lead | TBD | Slack: @devops-lead |
| Database Admin | TBD | Slack: @dba |

---

## Service Dependencies

```
                    ┌─────────────────┐
                    │   API Gateway   │
                    │     :8080       │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Service  │   │ User Service  │   │Campaign Svc   │
│    :8081      │   │    :8082      │   │    :8085      │
└───────┬───────┘   └───────────────┘   └───────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────┐
│                    Dependencies                        │
├───────────────┬───────────────┬───────────────────────┤
│  PostgreSQL   │     Redis     │   Azure Blob Storage  │
│    :5432      │    :6379      │                       │
└───────────────┴───────────────┴───────────────────────┘
```

### Startup Order
1. **Infrastructure**: PostgreSQL, Redis, Blob Storage (always available)
2. **Core Services**: auth-service, user-service
3. **Business Services**: campaign-service, creator-service, content-service
4. **Extended Services**: asset-service, rights-service, payout-service
5. **Gateway**: api-gateway (last, after all backend services)

---

## Health Check Endpoints

| Service | Health Endpoint | Expected Response |
|---------|-----------------|-------------------|
| API Gateway | `/health` | `{"status":"healthy"}` |
| Auth Service | `/v1/auth/health` | `{"status":"healthy"}` |
| User Service | `/v1/users/health` | `{"status":"healthy"}` |
| Campaign Service | `/v1/campaigns/health` | `{"status":"healthy"}` |
| Creator Service | `/v1/creators/health` | `{"status":"healthy"}` |
| Content Service | `/v1/content/health` | `{"status":"healthy"}` |
| Asset Service | `/v1/assets/health` | `{"status":"healthy"}` |
| Rights Service | `/v1/rights/health` | `{"status":"healthy"}` |
| Payout Service | `/v1/payouts/health` | `{"status":"healthy"}` |
| Analytics Service | `/v1/analytics/health` | `{"status":"healthy"}` |

---

## Environment Variables Checklist

### Required for All Services
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `REDIS_URL` - Redis connection string
- [ ] `JWT_SECRET` - JWT signing secret
- [ ] `NODE_ENV` - Environment (production/staging)

### Service-Specific
- [ ] `STRIPE_SECRET_KEY` - Stripe API key (billing, payout)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- [ ] `AZURE_STORAGE_CONNECTION_STRING` - Blob storage (asset)
- [ ] `SENDGRID_API_KEY` - Email service (notification)
- [ ] `AZURE_CONTENT_MODERATOR_KEY` - Content moderation (content)

---

## Maintenance Window

**Preferred Times:**
- Staging: Anytime
- Production: Sundays 2:00 AM - 6:00 AM UTC

**Notification Requirements:**
- 24 hours advance notice for planned maintenance
- Status page update before and after
- Slack announcement to #engineering

---

*Document maintained by DevOps Team*
*Last successful production deployment: TBD*
