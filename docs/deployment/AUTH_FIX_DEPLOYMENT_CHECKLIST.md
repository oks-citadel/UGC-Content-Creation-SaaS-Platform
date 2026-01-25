# NEXUS Authentication Fixes - Pre-Deployment Checklist

**Version:** 1.0
**Last Updated:** 2026-01-19
**Owner:** DevOps Team

---

## Pre-Deployment Checklist

Use this checklist to ensure all prerequisites are met before deploying the NEXUS authentication fixes to any environment.

---

### 1. Access Requirements

Verify you have the necessary access and credentials before proceeding.

- [ ] AWS CLI configured with appropriate credentials (`aws sts get-caller-identity`)
- [ ] kubectl configured with correct cluster context (`kubectl config current-context`)
- [ ] Access to ECR repositories (`aws ecr describe-repositories`)
- [ ] Access to K8s namespace (`kubectl get pods -n <namespace>`)
- [ ] VPN connected (if required for internal resources)
- [ ] SSH keys configured for bastion host access (if applicable)

**Verification Commands:**
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Verify kubectl context
kubectl config current-context
kubectl cluster-info

# Verify ECR access
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

# Verify namespace access
kubectl auth can-i get pods -n nexus-production
```

---

### 2. Environment Variables

Ensure all required environment variables are configured in the deployment manifests or secrets.

#### Required Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT signing | `<32+ character random string>` | Yes |
| `JWT_ISSUER` | JWT token issuer identifier | `nexus-auth-service` | Yes |
| `JWT_EXPIRY` | JWT token expiration time | `3600` (seconds) | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret | `<32+ character random string>` | Yes |
| `NEXTAUTH_URL` | NextAuth.js callback URL | `https://app.nexus.io` | Yes |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` | Yes |
| `REDIS_URL` | Redis connection string | `redis://host:6379` | Yes |
| `SESSION_SECRET` | Session encryption secret | `<32+ character random string>` | Yes |
| `OAUTH_GOOGLE_CLIENT_ID` | Google OAuth client ID | `<client-id>.apps.googleusercontent.com` | If OAuth enabled |
| `OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `<client-secret>` | If OAuth enabled |
| `OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth client ID | `<client-id>` | If OAuth enabled |
| `OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | `<client-secret>` | If OAuth enabled |
| `MFA_ENCRYPTION_KEY` | MFA secret encryption key | `<32+ character random string>` | If MFA enabled |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` | Recommended |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `900000` | If rate limiting |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | If rate limiting |
| `LOG_LEVEL` | Logging verbosity | `info` | Yes |
| `NODE_ENV` | Environment identifier | `production` | Yes |

**Verification:**
```bash
# Check secrets exist in K8s
kubectl get secrets -n nexus-production nexus-auth-secrets -o yaml

# Verify environment variables in deployment
kubectl get deployment nexus-auth -n nexus-production -o jsonpath='{.spec.template.spec.containers[0].env[*].name}'
```

---

### 3. Terraform State

Verify Terraform backend configuration and state integrity.

- [ ] S3 backend bucket exists and is accessible
- [ ] DynamoDB lock table exists
- [ ] `terraform init` completed successfully
- [ ] `terraform plan` shows expected changes
- [ ] No conflicting state locks

**Verification Commands:**
```bash
# Check S3 bucket
aws s3 ls s3://nexus-terraform-state/

# Check DynamoDB table
aws dynamodb describe-table --table-name nexus-terraform-locks

# Initialize Terraform
cd infrastructure/terraform
terraform init

# Validate configuration
terraform validate

# Preview changes
terraform plan -out=tfplan

# Check for state locks
aws dynamodb scan --table-name nexus-terraform-locks --filter-expression "attribute_exists(LockID)"
```

---

### 4. Docker/Registry

Ensure Docker and container registry are properly configured.

- [ ] Docker daemon running locally
- [ ] ECR login successful
- [ ] Base images available and up to date
- [ ] New images built and tagged
- [ ] Images pushed to ECR
- [ ] Image vulnerability scan passed

**Verification Commands:**
```bash
# Check Docker daemon
docker info

# Login to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

# Build images
docker build -t nexus-auth-service:latest -f apps/auth-service/Dockerfile .

# Tag for ECR
docker tag nexus-auth-service:latest <account>.dkr.ecr.<region>.amazonaws.com/nexus-auth-service:<version>

# Push to ECR
docker push <account>.dkr.ecr.<region>.amazonaws.com/nexus-auth-service:<version>

# Check image scan results
aws ecr describe-image-scan-findings --repository-name nexus-auth-service --image-id imageTag=<version>
```

---

### 5. Database

Verify database readiness and take necessary precautions.

- [ ] Database accessible from deployment environment
- [ ] Database credentials valid
- [ ] Current schema version documented
- [ ] All migrations up to date
- [ ] **Backup taken before deployment**
- [ ] Backup verified and restorable
- [ ] Sufficient database connections available

**Verification Commands:**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check current migration status
npx prisma migrate status

# List pending migrations
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma

# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
pg_restore --list backup_*.sql | head -20

# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();"
```

---

### 6. Code Changes Summary

Document all files changed as part of this deployment.

#### Authentication Core Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/auth-service/src/auth/jwt.service.ts` | Modified | Fixed JWT token validation logic and expiry handling |
| `apps/auth-service/src/auth/session.service.ts` | Modified | Improved session management and invalidation |
| `apps/auth-service/src/auth/auth.controller.ts` | Modified | Added rate limiting and enhanced error responses |
| `apps/auth-service/src/auth/auth.middleware.ts` | Modified | Fixed token refresh flow and header parsing |
| `apps/auth-service/src/auth/mfa.service.ts` | New | Added MFA (TOTP) support |

#### Database Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `prisma/migrations/20260115_add_mfa_tables.sql` | New | Added MFA-related tables |
| `prisma/migrations/20260116_add_session_fields.sql` | New | Added session tracking fields |
| `prisma/schema.prisma` | Modified | Updated schema for new auth features |

#### Configuration Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `infrastructure/kubernetes/auth-service/deployment.yaml` | Modified | Updated environment variables and resource limits |
| `infrastructure/kubernetes/auth-service/configmap.yaml` | Modified | Added new configuration options |
| `infrastructure/terraform/modules/auth/variables.tf` | Modified | Added new Terraform variables |

#### Frontend Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/web/app/(auth)/login/page.tsx` | Modified | Updated login flow for MFA support |
| `apps/web/app/(auth)/mfa/page.tsx` | New | Added MFA verification page |
| `apps/web/lib/auth.ts` | Modified | Updated NextAuth configuration |

---

### 7. Rollback Plan

In case of deployment failure, follow these rollback procedures.

#### 7.1 Kubernetes Deployment Rollback

```bash
# Check rollout status
kubectl rollout status deployment/nexus-auth-service -n nexus-production

# View rollout history
kubectl rollout history deployment/nexus-auth-service -n nexus-production

# Rollback to previous version
kubectl rollout undo deployment/nexus-auth-service -n nexus-production

# Rollback to specific revision
kubectl rollout undo deployment/nexus-auth-service -n nexus-production --to-revision=<revision-number>

# Verify rollback
kubectl get pods -n nexus-production -l app=nexus-auth-service
kubectl logs -f deployment/nexus-auth-service -n nexus-production
```

#### 7.2 Terraform Rollback

```bash
# Navigate to terraform directory
cd infrastructure/terraform

# Check state history (if using versioned S3)
aws s3api list-object-versions --bucket nexus-terraform-state --prefix auth/

# Restore previous state version
aws s3api get-object --bucket nexus-terraform-state --key auth/terraform.tfstate --version-id <previous-version-id> terraform.tfstate.backup

# Apply previous configuration
git checkout HEAD~1 -- infrastructure/terraform/
terraform init
terraform plan
terraform apply
```

#### 7.3 Database Rollback (if migrations applied)

```bash
# Rollback last migration (Prisma)
npx prisma migrate reset --skip-seed

# Or restore from backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM sessions;"
```

#### 7.4 Emergency Contacts

| Role | Contact | Phone |
|------|---------|-------|
| On-Call Engineer | oncall@nexus.io | +1-XXX-XXX-XXXX |
| DevOps Lead | devops-lead@nexus.io | +1-XXX-XXX-XXXX |
| Database Admin | dba@nexus.io | +1-XXX-XXX-XXXX |

---

### 8. Verification Steps

Post-deployment verification to ensure successful deployment.

#### 8.1 Service Health Checks

```bash
# Check pod status
kubectl get pods -n nexus-production -l app=nexus-auth-service

# Check pod logs for errors
kubectl logs -f deployment/nexus-auth-service -n nexus-production --tail=100

# Check service endpoints
kubectl get endpoints nexus-auth-service -n nexus-production

# Health endpoint check
curl -s https://api.nexus.io/auth/health | jq .

# Readiness check
kubectl exec -it deployment/nexus-auth-service -n nexus-production -- curl localhost:3000/health/ready
```

#### 8.2 Authentication Flow Tests

```bash
# Test login endpoint
curl -X POST https://api.nexus.io/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Test token validation
curl -X GET https://api.nexus.io/auth/validate \
  -H "Authorization: Bearer <token>" \
  -w "\nHTTP Status: %{http_code}\n"

# Test token refresh
curl -X POST https://api.nexus.io/auth/refresh \
  -H "Authorization: Bearer <refresh-token>" \
  -w "\nHTTP Status: %{http_code}\n"

# Test logout
curl -X POST https://api.nexus.io/auth/logout \
  -H "Authorization: Bearer <token>" \
  -w "\nHTTP Status: %{http_code}\n"
```

#### 8.3 Metrics and Monitoring

```bash
# Check Prometheus metrics
curl -s https://api.nexus.io/auth/metrics | grep auth_

# Verify Grafana dashboard loads
# Dashboard URL: https://grafana.nexus.io/d/auth-service

# Check error rates in logs
kubectl logs deployment/nexus-auth-service -n nexus-production --since=5m | grep -i error | wc -l

# Check response times
kubectl top pod -n nexus-production -l app=nexus-auth-service
```

#### 8.4 Integration Tests

```bash
# Run smoke tests
npm run test:smoke --filter=auth

# Run integration tests
npm run test:integration --filter=auth

# Run E2E auth flow tests
npm run test:e2e -- --spec="cypress/e2e/auth/**/*"
```

---

### 9. Communication

Ensure proper communication before, during, and after deployment.

#### Pre-Deployment

- [ ] Notify engineering team of deployment window via Slack (#deployments)
- [ ] Update status page with scheduled maintenance (if applicable)
- [ ] Notify on-call engineer of upcoming changes
- [ ] Send deployment notification email to stakeholders
- [ ] Update incident management system with deployment ticket

#### During Deployment

- [ ] Post deployment start message in #deployments
- [ ] Monitor #alerts channel for any automated alerts
- [ ] Keep stakeholders updated on progress

#### Post-Deployment

- [ ] Confirm successful deployment in #deployments
- [ ] Update status page to operational
- [ ] Close deployment ticket
- [ ] Send deployment summary to stakeholders

#### Communication Templates

**Pre-Deployment Message:**
```
:rocket: NEXUS Auth Service Deployment Starting
Environment: Production
Version: <version>
Changes: Authentication fixes including JWT validation, session management, and MFA support
ETA: ~30 minutes
Contact: @deployer
```

**Post-Deployment Message:**
```
:white_check_mark: NEXUS Auth Service Deployment Complete
Environment: Production
Version: <version>
Duration: XX minutes
Status: Successful
All health checks passing
```

---

### 10. Sign-off

All items must be checked and signed off before proceeding to production deployment.

#### Development

- [ ] All unit tests passing
- [ ] Code review completed and approved
- [ ] No critical or high-severity linting errors
- [ ] Documentation updated

**Dev Sign-off:** _________________ Date: _________

#### Staging Verification

- [ ] Deployed to staging environment
- [ ] Integration tests passing on staging
- [ ] Manual QA testing completed
- [ ] Performance testing completed (no regression)
- [ ] Security scan completed (no new vulnerabilities)

**QA Sign-off:** _________________ Date: _________

#### Security Review

- [ ] Security review completed (if required)
- [ ] No exposed secrets or credentials
- [ ] Authentication logic reviewed
- [ ] Session management reviewed
- [ ] Input validation verified

**Security Sign-off:** _________________ Date: _________

#### Production Approval

- [ ] Change request approved
- [ ] Rollback plan reviewed
- [ ] On-call aware and available
- [ ] Deployment window confirmed

**Manager Sign-off:** _________________ Date: _________

---

## Deployment Commands Quick Reference

```bash
# Full deployment sequence
cd infrastructure/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Build and push Docker image
docker build -t nexus-auth-service:$VERSION .
docker tag nexus-auth-service:$VERSION $ECR_REPO/nexus-auth-service:$VERSION
docker push $ECR_REPO/nexus-auth-service:$VERSION

# Deploy to Kubernetes
kubectl apply -f infrastructure/kubernetes/auth-service/
kubectl rollout status deployment/nexus-auth-service -n nexus-production

# Run migrations
kubectl exec -it deployment/nexus-auth-service -n nexus-production -- npx prisma migrate deploy

# Verify deployment
kubectl get pods -n nexus-production -l app=nexus-auth-service
curl -s https://api.nexus.io/auth/health | jq .
```

---

## Appendix

### A. Related Documentation

- [NEXUS Authentication Architecture](../architecture/AUTH_ARCHITECTURE.md)
- [JWT Token Specification](../specs/JWT_SPEC.md)
- [Session Management Guide](../guides/SESSION_MANAGEMENT.md)
- [MFA Implementation Guide](../guides/MFA_IMPLEMENTATION.md)

### B. Useful Links

- [Kubernetes Dashboard](https://k8s-dashboard.nexus.io)
- [Grafana Monitoring](https://grafana.nexus.io)
- [AWS Console](https://console.aws.amazon.com)
- [Incident Management](https://incidents.nexus.io)

### C. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | DevOps Team | Initial checklist creation |

---

**Note:** This checklist should be reviewed and updated before each deployment to ensure all items remain relevant and accurate.
