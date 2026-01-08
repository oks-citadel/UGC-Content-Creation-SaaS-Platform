# ECS Fargate Validation Checklist
## NEXUS Platform Migration Verification

**Version:** 1.0
**Date:** 2026-01-08

---

## Pre-Deployment Validation

### Infrastructure Validation

- [ ] **Terraform Plan Clean**
  ```bash
  cd infrastructure/terraform-aws/environments/staging
  terraform plan
  # Expected: No changes (or only expected changes)
  ```

- [ ] **ECS Cluster Created**
  ```bash
  aws ecs describe-clusters --clusters nexus-staging --query 'clusters[0].status'
  # Expected: "ACTIVE"
  ```

- [ ] **Service Connect Namespace Created**
  ```bash
  aws servicediscovery list-namespaces --query 'Namespaces[?Name==`nexus-staging`]'
  ```

- [ ] **ALB Created and Healthy**
  ```bash
  aws elbv2 describe-load-balancers --names nexus-staging-alb
  ```

- [ ] **Security Groups Configured**
  ```bash
  aws ec2 describe-security-groups --filters "Name=group-name,Values=nexus-staging-*"
  ```

---

## Service Deployment Validation

### Backend Services

| Service | Port | Health Check | Status |
|---------|------|--------------|--------|
| api-gateway | 3000 | /health | [ ] |
| auth-service | 3001 | /health | [ ] |
| user-service | 3002 | /health | [ ] |
| creator-service | 3003 | /health | [ ] |
| campaign-service | 3004 | /health | [ ] |
| content-service | 3005 | /health | [ ] |
| commerce-service | 3006 | /health | [ ] |
| analytics-service | 3007 | /health | [ ] |
| billing-service | 3008 | /health | [ ] |
| marketplace-service | 3009 | /health | [ ] |
| notification-service | 3010 | /health | [ ] |
| workflow-service | 3011 | /health | [ ] |
| compliance-service | 3012 | /health | [ ] |
| integration-service | 3013 | /health | [ ] |
| payout-service | 3014 | /health | [ ] |
| rights-service | 3015 | /health | [ ] |
| asset-service | 3016 | /health | [ ] |
| ai-service | 3017 | /health | [ ] |

### Frontend Apps

| App | Port | Health Check | Status |
|-----|------|--------------|--------|
| web | 3000 | / | [ ] |
| creator-portal | 3000 | / | [ ] |
| admin | 3000 | / | [ ] |
| brand-portal | 3000 | / | [ ] |

### Workers

| Worker | Port | Health Check | Status |
|--------|------|--------------|--------|
| video-processor | 4001 | /health | [ ] |
| social-publisher | 4002 | /health | [ ] |
| notification-dispatcher | 4003 | /health | [ ] |
| analytics-aggregator | 4004 | /health | [ ] |

### AI Services

| Service | Port | Health Check | Status |
|---------|------|--------------|--------|
| ai-center | 5001 | /health | [ ] |
| customer-agent | 5002 | /health | [ ] |
| marketing-agent | 5003 | /health | [ ] |
| moderation-engine | 5004 | /health | [ ] |
| performance-predictor | 5005 | /health | [ ] |
| recommendation-engine | 5006 | /health | [ ] |
| video-generator | 5007 | /health | [ ] |

---

## Health Check Commands

### Check All Services Status

```bash
# List all services and their status
aws ecs list-services --cluster nexus-staging --query 'serviceArns' --output table

# Check specific service health
aws ecs describe-services \
  --cluster nexus-staging \
  --services api-gateway auth-service user-service web \
  --query 'services[*].{Name:serviceName,Running:runningCount,Desired:desiredCount,Health:healthCheckGracePeriodSeconds}'
```

### Check ALB Target Health

```bash
# Get all target groups
aws elbv2 describe-target-groups \
  --load-balancer-arn $(aws elbv2 describe-load-balancers --names nexus-staging-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text) \
  --query 'TargetGroups[*].{Name:TargetGroupName,ARN:TargetGroupArn}'

# Check health of specific target group
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

### Check Service Logs

```bash
# View recent logs for a service
aws logs tail /ecs/nexus-staging/api-gateway --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /ecs/nexus-staging/api-gateway \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000
```

---

## Functional Testing

### API Endpoint Tests

```bash
ALB_DNS=$(aws elbv2 describe-load-balancers --names nexus-staging-alb --query 'LoadBalancers[0].DNSName' --output text)

# Test auth service
curl -f "https://${ALB_DNS}/api/v1/auth/health"

# Test user service
curl -f "https://${ALB_DNS}/api/v1/users/health"

# Test API gateway
curl -f "https://${ALB_DNS}/health"

# Test web app
curl -f "https://${ALB_DNS}/"
```

### Service-to-Service Communication

```bash
# Use ECS Exec to test internal communication
aws ecs execute-command \
  --cluster nexus-staging \
  --task <task-id> \
  --container api-gateway \
  --interactive \
  --command "/bin/sh"

# Inside container:
# curl http://auth-service:3001/health
# curl http://user-service:3002/health
```

---

## Performance Validation

### CPU/Memory Utilization

```bash
# Get cluster utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=nexus-staging \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

### ALB Response Times

```bash
# Check ALB latency
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=<alb-arn-suffix> \
  --start-time $(date -d '1 hour ago' -u +%Y-%m-%dT%H:%M:%SZ) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --period 300 \
  --statistics Average
```

---

## Auto Scaling Validation

### Test Scale Out

```bash
# Generate load to trigger scaling
# Use your load testing tool (k6, Artillery, etc.)

# Monitor scaling events
aws ecs describe-services \
  --cluster nexus-staging \
  --services api-gateway \
  --query 'services[0].events[0:5]'
```

### Verify Scaling Policies

```bash
# List auto scaling targets
aws application-autoscaling describe-scalable-targets \
  --service-namespace ecs \
  --resource-ids service/nexus-staging/api-gateway

# List scaling policies
aws application-autoscaling describe-scaling-policies \
  --service-namespace ecs \
  --resource-id service/nexus-staging/api-gateway
```

---

## Database Connectivity

### RDS Connection Test

```bash
# From inside ECS task
aws ecs execute-command \
  --cluster nexus-staging \
  --task <task-id> \
  --container auth-service \
  --interactive \
  --command "/bin/sh"

# Test database connection
# nc -zv <rds-endpoint> 5432
```

### Redis Connection Test

```bash
# From inside ECS task
# nc -zv <redis-endpoint> 6379
```

---

## Security Validation

### IAM Roles

- [ ] Task execution role can pull from ECR
- [ ] Task execution role can write to CloudWatch Logs
- [ ] Task execution role can read from Secrets Manager
- [ ] Task roles have appropriate S3 access
- [ ] Task roles have appropriate SQS access

### Network Security

- [ ] ALB security group allows 443 from internet
- [ ] ECS tasks security group allows traffic from ALB only
- [ ] Database security group allows traffic from ECS tasks only
- [ ] No public IPs assigned to ECS tasks

---

## Monitoring & Alerting

### CloudWatch Alarms

- [ ] CPU utilization alarm configured
- [ ] Memory utilization alarm configured
- [ ] 5xx error rate alarm configured
- [ ] Unhealthy host count alarm configured

### Dashboard

- [ ] ECS cluster dashboard created
- [ ] Service metrics visible
- [ ] ALB metrics visible
- [ ] Cost metrics visible

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Platform Engineer | | | |
| DevOps Lead | | | |
| Security | | | |
| QA Lead | | | |

---

**Validation Status:** [ ] PASSED / [ ] FAILED

**Notes:**
