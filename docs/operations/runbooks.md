# Operations Runbooks
# NEXUS Platform

**Version:** 1.0
**Last Updated:** December 18, 2025
**On-Call Rotation**: PagerDuty

---

## Table of Contents

1. [Deployment Procedures](#1-deployment-procedures)
2. [Incident Response](#2-incident-response)
3. [Scaling Procedures](#3-scaling-procedures)
4. [Backup & Recovery](#4-backup--recovery)
5. [Common Issues & Resolutions](#5-common-issues--resolutions)

---

## 1. Deployment Procedures

### 1.1 Production Deployment Checklist

**Pre-Deployment**:
- [ ] Code reviewed and approved
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security scan passed
- [ ] Database migrations tested in staging
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Deploy during maintenance window (if applicable)

**Deployment Steps**:
1. Merge PR to `main` branch
2. CI/CD pipeline auto-builds Docker images
3. Images pushed to ECR/GCR
4. ArgoCD detects changes
5. Apply to production cluster (rolling update)
6. Monitor deployment progress
7. Smoke tests run automatically
8. Verify key metrics in Datadog

**Post-Deployment**:
- [ ] Verify application health (`kubectl get pods`)
- [ ] Check error rates in Datadog
- [ ] Verify database migrations completed
- [ ] Test critical user flows
- [ ] Monitor for 30 minutes
- [ ] Update deployment log
- [ ] Notify team of successful deployment

### 1.2 Database Migration Procedure

**Prerequisites**:
- Backup database before migration
- Test migration in staging
- Estimate migration time
- Plan rollback if needed

**Migration Steps**:

```bash
# 1. Backup database
kubectl exec -it postgres-pod -- pg_dump -U postgres nexus_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migration (dry-run first)
npx prisma migrate deploy --preview-feature

# 3. Run actual migration
npx prisma migrate deploy

# 4. Verify migration
npx prisma migrate status

# 5. Restart affected services
kubectl rollout restart deployment/user-service
```

**Rollback**:
```bash
# If migration fails, restore from backup
kubectl exec -it postgres-pod -- psql -U postgres -d nexus_prod < backup_TIMESTAMP.sql
```

### 1.3 Hotfix Deployment

**When to use**: Critical bug in production requiring immediate fix

**Process**:
1. Create hotfix branch from `main`
2. Implement and test fix locally
3. Create PR with "HOTFIX" label
4. Fast-track review (1 reviewer minimum)
5. Merge to `main`
6. Deploy immediately (bypass normal window)
7. Monitor closely
8. Schedule post-mortem

### 1.4 Rollback Procedure

**Automated Rollback**:
```bash
# Rollback to previous deployment
kubectl rollout undo deployment/user-service

# Rollback to specific revision
kubectl rollout undo deployment/user-service --to-revision=42
```

**Manual Rollback**:
```bash
# 1. Identify last working version
kubectl rollout history deployment/user-service

# 2. Update ArgoCD to previous commit
argocd app set nexus-platform --revision <previous-git-sha>

# 3. Sync application
argocd app sync nexus-platform
```

---

## 2. Incident Response

### 2.1 Incident Severity Levels

| Severity | Definition | Response Time | Example |
|----------|------------|---------------|---------|
| **P0** | Complete outage, data breach | < 15 minutes | Platform down |
| **P1** | Major feature broken, degraded performance | < 1 hour | API errors, slow response |
| **P2** | Minor feature broken, some users affected | < 4 hours | Single feature not working |
| **P3** | Cosmetic issue, no user impact | < 24 hours | UI bug, typo |

### 2.2 Incident Response Process

**Step 1: Acknowledge**
- Incident detected (alert or user report)
- On-call engineer acknowledges in PagerDuty
- Create incident channel in Slack (#incident-YYYYMMDD-NNN)

**Step 2: Assess**
- Determine severity
- Identify affected systems
- Estimate user impact
- Assign incident commander (IC)

**Step 3: Communicate**
- Update status page (status.nexusugc.com)
- Notify stakeholders via Slack
- Post initial update within 15 minutes

**Step 4: Mitigate**
- Implement immediate fix or workaround
- Rollback if recent deployment
- Scale resources if capacity issue
- Update status page with progress

**Step 5: Resolve**
- Verify issue resolved
- Monitor for 30 minutes
- Update status page (resolved)
- Close PagerDuty incident

**Step 6: Post-Mortem**
- Schedule post-mortem within 48 hours
- Document root cause
- Identify action items
- Assign owners and due dates

### 2.3 Common Incident Scenarios

#### Scenario: Platform Down

**Symptoms**: Health check failing, 502/504 errors, no traffic

**Diagnosis**:
```bash
# Check pod status
kubectl get pods -n nexus-production

# Check recent deployments
kubectl rollout history deployment/api-gateway

# Check logs
kubectl logs -f deployment/api-gateway --tail=100
```

**Resolution**:
1. Check if recent deployment caused issue
2. Rollback if deployment-related
3. Check database connectivity
4. Check Redis connectivity
5. Restart affected pods if needed
6. Scale up if traffic spike

---

#### Scenario: High API Latency

**Symptoms**: Slow response times, timeout errors

**Diagnosis**:
```bash
# Check pod CPU/memory usage
kubectl top pods

# Check database slow queries
kubectl exec -it postgres-pod -- psql -U postgres -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check Redis performance
kubectl exec -it redis-pod -- redis-cli INFO stats
```

**Resolution**:
1. Identify slow endpoints in Datadog APM
2. Optimize database queries if needed
3. Scale up pods if CPU/memory high
4. Add caching if appropriate
5. Enable read replicas if database bottleneck

---

#### Scenario: Database Connection Pool Exhausted

**Symptoms**: "Too many connections" errors

**Diagnosis**:
```bash
# Check active connections
kubectl exec -it postgres-pod -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Check connection pool settings
kubectl get configmap user-service-config -o yaml
```

**Resolution**:
1. Increase database connection limit
2. Increase connection pool size in application
3. Restart affected services
4. Investigate connection leaks

---

#### Scenario: Out of Disk Space

**Symptoms**: Pods crashing, write errors

**Diagnosis**:
```bash
# Check disk usage
df -h

# Check pod storage
kubectl describe pod <pod-name>
```

**Resolution**:
1. Increase EBS volume size
2. Clean up old logs
3. Implement log rotation
4. Move old data to S3

---

### 2.4 Escalation Path

1. **On-Call Engineer**: First responder
2. **Engineering Manager**: If issue not resolved in 1 hour (P0/P1)
3. **CTO**: If issue not resolved in 2 hours (P0) or data breach
4. **CEO**: If major customer impact or data breach

---

## 3. Scaling Procedures

### 3.1 Horizontal Pod Autoscaling (HPA)

**Check current HPA status**:
```bash
kubectl get hpa
```

**Manual scaling**:
```bash
# Scale up
kubectl scale deployment user-service --replicas=10

# Scale down
kubectl scale deployment user-service --replicas=2
```

**Update HPA configuration**:
```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 3.2 Database Scaling

**Read Replicas** (for read-heavy workloads):
```bash
# Create read replica via AWS RDS console
# Update connection string to use read replica for read queries
```

**Vertical Scaling** (increase instance size):
1. Schedule maintenance window
2. Take snapshot
3. Modify instance class via AWS console
4. Monitor performance after resize

**Connection Pooling**:
```javascript
// Increase pool size in database config
pool: {
  min: 5,
  max: 30  // Increased from 20
}
```

### 3.3 Cache Scaling

**Redis Scaling**:
```bash
# Scale Redis cluster (ElastiCache)
# Via AWS console:
# 1. Select cluster
# 2. Modify > Add shards or increase node type
# 3. Apply changes
```

---

## 4. Backup & Recovery

### 4.1 Database Backup

**Automated Backups**:
- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Location**: AWS S3 `nexus-backups` bucket

**Manual Backup**:
```bash
# PostgreSQL
kubectl exec -it postgres-pod -- pg_dump -U postgres nexus_prod | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Upload to S3
aws s3 cp backup_*.sql.gz s3://nexus-backups/manual/

# MongoDB
kubectl exec -it mongo-pod -- mongodump --uri="mongodb://user:pass@localhost/nexus" --gzip --archive > mongo_backup_$(date +%Y%m%d_%H%M%S).gz
```

### 4.2 Restore Procedures

**Restore PostgreSQL from Backup**:
```bash
# 1. Download backup from S3
aws s3 cp s3://nexus-backups/manual/backup_TIMESTAMP.sql.gz ./

# 2. Restore database
gunzip < backup_TIMESTAMP.sql.gz | kubectl exec -i postgres-pod -- psql -U postgres -d nexus_prod

# 3. Restart services
kubectl rollout restart deployment/user-service
```

**Point-in-Time Recovery (PITR)**:
```bash
# Via AWS RDS console:
# 1. Select database
# 2. Actions > Restore to point in time
# 3. Select timestamp
# 4. Create new instance
# 5. Update connection strings
# 6. Test thoroughly before cutting over
```

### 4.3 S3 Media Files Backup

**Configuration**:
- **Versioning**: Enabled
- **Cross-Region Replication**: Enabled (us-east-1 → eu-west-1)
- **Lifecycle Policy**: Move to Glacier after 90 days

**Restore Deleted File**:
```bash
# List file versions
aws s3api list-object-versions --bucket nexus-media --prefix uploads/video_123.mp4

# Restore specific version
aws s3api get-object --bucket nexus-media --key uploads/video_123.mp4 --version-id <version-id> restored_video.mp4
```

### 4.4 Disaster Recovery Plan

**RTO (Recovery Time Objective)**: 1 hour
**RPO (Recovery Point Objective)**: 5 minutes

**DR Scenarios**:

1. **Single AZ Failure**:
   - Automatic failover to other AZs
   - No manual intervention needed

2. **Full Region Failure**:
   - Promote read replica in DR region to master
   - Update DNS to point to DR region
   - Restore from latest backup
   - Estimated time: 1 hour

3. **Database Corruption**:
   - Restore from latest backup
   - Apply WAL logs for PITR
   - Estimated time: 30 minutes

**DR Testing**:
- **Frequency**: Quarterly
- **Process**: Restore backup to staging environment
- **Verification**: Run smoke tests

---

## 5. Common Issues & Resolutions

### 5.1 Authentication Issues

**Problem**: Users unable to login

**Diagnosis**:
- Check auth service logs
- Verify JWT secret is correct
- Check Redis connection (session store)
- Verify OAuth provider status

**Resolution**:
```bash
# Restart auth service
kubectl rollout restart deployment/auth-service

# Check Redis connectivity
kubectl exec -it redis-pod -- redis-cli PING
```

---

### 5.2 File Upload Failures

**Problem**: Video upload fails

**Diagnosis**:
- Check S3 bucket permissions
- Verify file size within limits (500MB)
- Check multipart upload settings
- Review content-service logs

**Resolution**:
```bash
# Check S3 bucket policy
aws s3api get-bucket-policy --bucket nexus-uploads

# Verify IAM role permissions
aws iam get-role-policy --role-name nexus-content-service-role --policy-name S3Access
```

---

### 5.3 Email Delivery Issues

**Problem**: Emails not being delivered

**Diagnosis**:
- Check SendGrid status
- Verify API key is valid
- Check email queue in Redis
- Review notification-service logs

**Resolution**:
```bash
# Check email queue
kubectl exec -it redis-pod -- redis-cli LLEN email_queue

# Process stuck emails
kubectl exec -it notification-service-pod -- npm run process-email-queue
```

---

### 5.4 Stripe Payment Failures

**Problem**: Payment processing errors

**Diagnosis**:
- Check Stripe Dashboard for errors
- Verify webhook signatures
- Check billing-service logs
- Confirm Stripe API key is correct

**Resolution**:
```bash
# Test Stripe connection
kubectl exec -it billing-service-pod -- node -e "require('stripe')(process.env.STRIPE_SECRET_KEY).balance.retrieve().then(console.log)"

# Verify webhook endpoint
curl https://api.nexusugc.com/webhooks/stripe
```

---

## 6. Monitoring & Alerts

### 6.1 Key Metrics to Monitor

**Application Metrics**:
- API response time (p95, p99)
- Error rate (4xx, 5xx)
- Request throughput
- Active users

**Infrastructure Metrics**:
- CPU usage
- Memory usage
- Disk usage
- Network throughput

**Business Metrics**:
- User signups
- Campaigns created
- Content uploaded
- Revenue (MRR, ARR)

### 6.2 Alert Configuration

**Critical Alerts** (PagerDuty):
- Platform down (health check failing)
- Error rate > 5%
- API latency > 2s (p95)
- Database connections > 90%
- Disk usage > 85%

**Warning Alerts** (Slack):
- Error rate > 1%
- API latency > 1s (p95)
- CPU usage > 70%
- Memory usage > 80%

---

## 7. Maintenance Windows

**Scheduled Maintenance**:
- **Frequency**: Monthly (first Sunday, 2-4 AM UTC)
- **Purpose**: System updates, database maintenance
- **Notification**: 7 days advance notice
- **Status Page**: status.nexusugc.com

**Emergency Maintenance**:
- **Trigger**: Critical security patch or major incident
- **Notification**: 4 hours advance (if possible)
- **Approval**: CTO or VP Engineering

---

## 8. On-Call Procedures

### 8.1 On-Call Schedule

**Rotation**: Weekly rotation via PagerDuty
**Coverage**: 24/7/365
**Handoff**: Friday 9 AM Pacific

### 8.2 On-Call Responsibilities

- Respond to incidents within SLA
- Acknowledge alerts in PagerDuty
- Communicate in incident Slack channel
- Update status page
- Document incident in post-mortem
- Escalate if needed

### 8.3 On-Call Compensation

- $500/week on-call stipend
- Time-and-a-half for incident work
- Next-day flex time if overnight incident

---

## Appendix A: Useful Commands

**Kubernetes**:
```bash
# Get pod status
kubectl get pods -n nexus-production

# View logs
kubectl logs -f <pod-name> --tail=100

# Exec into pod
kubectl exec -it <pod-name> -- /bin/bash

# Port forward
kubectl port-forward svc/postgres 5432:5432

# Describe pod (for events)
kubectl describe pod <pod-name>

# Delete crashed pods
kubectl delete pod <pod-name>

# Scale deployment
kubectl scale deployment/user-service --replicas=5
```

**Database**:
```bash
# Connect to PostgreSQL
kubectl exec -it postgres-pod -- psql -U postgres -d nexus_prod

# Check active queries
SELECT pid, query, state FROM pg_stat_activity WHERE state = 'active';

# Kill long-running query
SELECT pg_terminate_backend(pid);
```

**Redis**:
```bash
# Connect to Redis
kubectl exec -it redis-pod -- redis-cli

# Check memory usage
INFO memory

# Flush cache (use with caution!)
FLUSHDB
```

---

**Document End**

*For operations support: ops@nexusugc.com*
*On-Call: PagerDuty*
