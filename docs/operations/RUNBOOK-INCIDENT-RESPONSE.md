# CreatorBridge Incident Response Runbook

## Overview

This runbook provides step-by-step procedures for responding to incidents affecting the CreatorBridge platform.

---

## Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **SEV1** | Complete outage, data loss risk | 15 minutes | All services down, database corruption |
| **SEV2** | Major feature unavailable | 30 minutes | Payments failing, auth broken |
| **SEV3** | Degraded performance | 2 hours | Slow uploads, high latency |
| **SEV4** | Minor issue | 24 hours | UI glitch, non-critical bug |

---

## Incident Response Process

### 1. Detection & Alerting

**Automated Alerts (Azure Monitor)**
- Check #alerts Slack channel
- Review Azure Portal > Alerts
- Check Application Insights for exceptions

**Manual Detection**
- User reports via support tickets
- Social media mentions
- Partner notifications

### 2. Initial Assessment (5 minutes)

```bash
# Check overall platform health
curl -s https://api.creatorbridge.com/health | jq

# Check individual services
for svc in auth user billing campaign creator content asset rights payout analytics; do
  echo "=== $svc-service ==="
  curl -s https://api.creatorbridge.com/v1/$svc/health | jq '.status'
done
```

**Kubernetes Status**
```bash
# Set context
kubectl config use-context creatorbridge-prod-aks

# Check pod status
kubectl get pods -n creatorbridge-production

# Check for crash loops
kubectl get pods -n creatorbridge-production | grep -E "(CrashLoop|Error|Pending)"

# Recent events
kubectl get events -n creatorbridge-production --sort-by='.lastTimestamp' | tail -20
```

### 3. Declare Incident

**SEV1/SEV2: Immediate Actions**
1. Create incident channel: `#incident-YYYYMMDD-brief-description`
2. Page on-call engineer via PagerDuty
3. Post in #engineering: "Incident declared: [brief description]"
4. Start incident document (template below)

**Incident Document Template**
```markdown
# Incident: [Title]
**Severity:** SEV[1-4]
**Started:** YYYY-MM-DD HH:MM UTC
**Status:** Investigating | Identified | Monitoring | Resolved

## Timeline
- HH:MM - [Event description]

## Impact
- [Number] users affected
- [Features] unavailable

## Root Cause
[To be determined]

## Resolution
[Steps taken]

## Action Items
- [ ] [Follow-up task]
```

---

## Common Incident Scenarios

### Scenario 1: Database Connection Failures

**Symptoms**
- 503 errors from multiple services
- Health checks failing with "Database connection failed"
- Spike in connection errors in Application Insights

**Diagnosis**
```bash
# Check database connectivity
kubectl exec -it deploy/auth-service -n creatorbridge-production -- \
  sh -c 'nc -zv $DB_HOST 5432'

# Check connection pool
az postgres flexible-server show \
  --resource-group creatorbridge-production \
  --name creatorbridge-db \
  --query "state"

# View active connections
az postgres flexible-server execute \
  --name creatorbridge-db \
  --resource-group creatorbridge-production \
  --admin-user dbadmin \
  --admin-password "$DB_PASSWORD" \
  --querytext "SELECT count(*) FROM pg_stat_activity;"
```

**Resolution**
1. Check if database is in maintenance mode
2. Verify connection string in Key Vault
3. Scale up database if connection limit reached
4. Restart affected pods: `kubectl rollout restart deployment/<service> -n creatorbridge-production`

---

### Scenario 2: Payment Processing Failures

**Symptoms**
- Payout requests stuck in "pending"
- Stripe webhook errors in logs
- Creator complaints about missing payments

**Diagnosis**
```bash
# Check payout service logs
kubectl logs -l app=payout-service -n creatorbridge-production --tail=100

# Check Stripe webhook status
curl -s https://api.creatorbridge.com/v1/payouts/health | jq

# Verify Stripe connectivity
kubectl exec -it deploy/payout-service -n creatorbridge-production -- \
  curl -s https://api.stripe.com/v1/balance \
  -u "$STRIPE_SECRET_KEY:" | jq '.available'
```

**Resolution**
1. Check Stripe Dashboard for API status
2. Verify webhook secret matches
3. Check for stuck webhook events in Stripe Dashboard
4. Replay failed webhooks if needed
5. Manually process stuck payouts if critical

---

### Scenario 3: High Latency / Slow Performance

**Symptoms**
- Response times > 2 seconds
- Timeout errors
- User complaints about slow uploads

**Diagnosis**
```bash
# Check pod resource usage
kubectl top pods -n creatorbridge-production

# Check HPA status
kubectl get hpa -n creatorbridge-production

# Check Redis latency
kubectl exec -it deploy/redis -n creatorbridge-production -- \
  redis-cli --latency

# Check slow queries
az postgres flexible-server execute \
  --name creatorbridge-db \
  --querytext "SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**Resolution**
1. Scale up deployments if CPU/memory high
2. Clear Redis cache if memory full
3. Kill long-running queries
4. Enable query optimization hints
5. Consider database read replicas

---

### Scenario 4: Asset Upload Failures

**Symptoms**
- 500 errors on file uploads
- "Storage unavailable" errors
- Processing jobs stuck

**Diagnosis**
```bash
# Check asset service logs
kubectl logs -l app=asset-service -n creatorbridge-production --tail=100

# Check Azure Storage status
az storage account show \
  --name creatorbridgestorage \
  --query "statusOfPrimary"

# Check blob container access
az storage container exists \
  --name uploads \
  --account-name creatorbridgestorage
```

**Resolution**
1. Verify storage connection string
2. Check storage account network rules
3. Verify container exists and has correct permissions
4. Check CDN endpoint health
5. Restart asset-service pods

---

### Scenario 5: Authentication Failures

**Symptoms**
- Users cannot log in
- 401 errors across all services
- JWT validation failures

**Diagnosis**
```bash
# Check auth service
kubectl logs -l app=auth-service -n creatorbridge-production --tail=100

# Verify JWT secret is accessible
kubectl get secret shared-secrets -n creatorbridge-production -o jsonpath='{.data.jwt-secret}' | base64 -d | head -c 10

# Check Redis session store
kubectl exec -it deploy/redis -n creatorbridge-production -- \
  redis-cli DBSIZE
```

**Resolution**
1. Verify JWT secrets match across all services
2. Check Redis connectivity
3. Clear session cache if corrupted
4. Rotate JWT secret if compromised (requires all users to re-login)

---

## Rollback Procedures

### Application Rollback

```bash
# Rollback specific service
kubectl rollout undo deployment/asset-service -n creatorbridge-production

# Rollback to specific revision
kubectl rollout undo deployment/asset-service --to-revision=2 -n creatorbridge-production

# Verify rollback
kubectl rollout status deployment/asset-service -n creatorbridge-production
```

### Database Rollback

**WARNING: Destructive operation - requires approval from 2 engineers**

```bash
# 1. Scale down all services
./scripts/deploy.sh production --rollback

# 2. Restore from backup
./scripts/restore-database.sh production [backup-timestamp]

# 3. Scale up services
kubectl scale deployment --all --replicas=2 -n creatorbridge-production
```

---

## Post-Incident

### Immediate (within 24 hours)
1. Update incident document with resolution
2. Notify stakeholders of resolution
3. Create follow-up tickets for action items

### Post-Mortem (within 5 days)
1. Schedule post-mortem meeting
2. Complete post-mortem document
3. Identify preventive measures
4. Update runbooks if needed

### Post-Mortem Template
```markdown
# Post-Mortem: [Incident Title]

## Summary
[1-2 sentence description]

## Impact
- Duration: X hours Y minutes
- Users affected: N
- Revenue impact: $X

## Timeline
[Detailed timeline of events]

## Root Cause
[Technical explanation]

## What Went Well
- [Item]

## What Went Wrong
- [Item]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Task] | [Name] | [Date] | [ ] |

## Lessons Learned
[Key takeaways]
```

---

## Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| On-Call Primary | Rotation | PagerDuty | @oncall-primary |
| On-Call Secondary | Rotation | PagerDuty | @oncall-secondary |
| Engineering Manager | TBD | TBD | @eng-manager |
| Database Admin | TBD | TBD | @dba |
| Security | TBD | TBD | @security |

## External Contacts

| Service | Support URL | Status Page |
|---------|-------------|-------------|
| Azure | https://portal.azure.com | https://status.azure.com |
| Stripe | https://support.stripe.com | https://status.stripe.com |
| SendGrid | https://support.sendgrid.com | https://status.sendgrid.com |
