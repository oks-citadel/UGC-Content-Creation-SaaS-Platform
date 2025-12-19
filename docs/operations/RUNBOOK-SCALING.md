# CreatorBridge Scaling Runbook

## Overview

This runbook provides procedures for scaling the CreatorBridge platform to handle increased traffic or reduce costs during low-traffic periods.

---

## Automatic Scaling (HPA)

All services are configured with Horizontal Pod Autoscaler (HPA) that automatically scales based on CPU and memory usage.

### Current HPA Configuration

| Service | Min Replicas | Max Replicas | CPU Target | Memory Target |
|---------|--------------|--------------|------------|---------------|
| api-gateway | 3 | 20 | 70% | 80% |
| auth-service | 3 | 15 | 70% | 80% |
| user-service | 2 | 10 | 70% | 80% |
| campaign-service | 2 | 10 | 70% | 80% |
| creator-service | 2 | 10 | 70% | 80% |
| content-service | 3 | 15 | 70% | 80% |
| asset-service | 3 | 20 | 70% | 80% |
| rights-service | 2 | 8 | 70% | 80% |
| payout-service | 2 | 8 | 70% | 80% |
| analytics-service | 2 | 10 | 70% | 80% |

### Check HPA Status

```bash
# View all HPA status
kubectl get hpa -n creatorbridge-production

# Detailed HPA info
kubectl describe hpa asset-service -n creatorbridge-production

# Watch HPA scaling in real-time
kubectl get hpa -n creatorbridge-production -w
```

---

## Manual Scaling Procedures

### Scale Up for Expected Traffic Surge

**Use Case:** Marketing campaign, product launch, viral content

```bash
# Pre-scale critical services
kubectl scale deployment/api-gateway --replicas=10 -n creatorbridge-production
kubectl scale deployment/auth-service --replicas=8 -n creatorbridge-production
kubectl scale deployment/asset-service --replicas=10 -n creatorbridge-production
kubectl scale deployment/content-service --replicas=8 -n creatorbridge-production

# Verify scaling
kubectl get pods -n creatorbridge-production | grep -E "(api-gateway|auth|asset|content)"
```

### Scale Down for Cost Optimization

**Use Case:** Off-peak hours, weekends (if applicable)

```bash
# Reduce replicas (respect PDB minimums)
kubectl scale deployment/api-gateway --replicas=3 -n creatorbridge-production
kubectl scale deployment/auth-service --replicas=3 -n creatorbridge-production
kubectl scale deployment/asset-service --replicas=3 -n creatorbridge-production

# Never scale below PDB minimums
kubectl get pdb -n creatorbridge-production
```

---

## Database Scaling

### Azure PostgreSQL Flexible Server

**Scale Up (Vertical)**
```bash
# Check current SKU
az postgres flexible-server show \
  --resource-group creatorbridge-production \
  --name creatorbridge-db \
  --query "sku"

# Scale to higher tier (causes brief restart)
az postgres flexible-server update \
  --resource-group creatorbridge-production \
  --name creatorbridge-db \
  --sku-name Standard_D4s_v3 \
  --storage-size 256

# Monitor scaling progress
az postgres flexible-server show \
  --resource-group creatorbridge-production \
  --name creatorbridge-db \
  --query "state"
```

**Add Read Replicas (Horizontal)**
```bash
# Create read replica
az postgres flexible-server replica create \
  --resource-group creatorbridge-production \
  --source-server creatorbridge-db \
  --replica-name creatorbridge-db-replica-1 \
  --location eastus
```

### Connection Pool Tuning

```bash
# Check current connections
az postgres flexible-server execute \
  --name creatorbridge-db \
  --admin-user dbadmin \
  --querytext "SELECT count(*) as connections FROM pg_stat_activity;"

# Update max connections (requires restart)
az postgres flexible-server parameter set \
  --resource-group creatorbridge-production \
  --server-name creatorbridge-db \
  --name max_connections \
  --value 500
```

---

## Redis Scaling

### Check Redis Memory

```bash
# Connect to Redis
kubectl exec -it deploy/redis -n creatorbridge-production -- redis-cli

# Check memory usage
INFO memory

# Check key distribution
DBSIZE

# Find large keys
redis-cli --bigkeys
```

### Scale Redis Cluster

```bash
# Scale Azure Redis Cache
az redis update \
  --resource-group creatorbridge-production \
  --name creatorbridge-redis \
  --sku Premium \
  --vm-size P2

# Enable clustering (Enterprise tier)
az redis update \
  --resource-group creatorbridge-production \
  --name creatorbridge-redis \
  --shard-count 3
```

---

## Azure Blob Storage Scaling

Storage automatically scales, but optimize for performance:

### Enable CDN for High Traffic

```bash
# Check CDN endpoint status
az cdn endpoint show \
  --resource-group creatorbridge-production \
  --profile-name creatorbridge-cdn \
  --name assets

# Purge CDN cache if needed
az cdn endpoint purge \
  --resource-group creatorbridge-production \
  --profile-name creatorbridge-cdn \
  --name assets \
  --content-paths "/*"
```

### Storage Account Performance

```bash
# Check storage metrics
az monitor metrics list \
  --resource /subscriptions/{sub}/resourceGroups/creatorbridge-production/providers/Microsoft.Storage/storageAccounts/creatorbridgestorage \
  --metric "Transactions" \
  --interval PT1H
```

---

## AKS Node Pool Scaling

### Add Nodes to Existing Pool

```bash
# Check current node count
az aks nodepool show \
  --resource-group creatorbridge-production \
  --cluster-name creatorbridge-aks \
  --name agentpool \
  --query "count"

# Scale node pool
az aks nodepool scale \
  --resource-group creatorbridge-production \
  --cluster-name creatorbridge-aks \
  --name agentpool \
  --node-count 5

# Enable cluster autoscaler
az aks nodepool update \
  --resource-group creatorbridge-production \
  --cluster-name creatorbridge-aks \
  --name agentpool \
  --enable-cluster-autoscaler \
  --min-count 3 \
  --max-count 10
```

### Add Specialized Node Pool

```bash
# Add high-memory pool for asset processing
az aks nodepool add \
  --resource-group creatorbridge-production \
  --cluster-name creatorbridge-aks \
  --name assetpool \
  --node-count 2 \
  --node-vm-size Standard_E4s_v3 \
  --labels workload=asset-processing \
  --node-taints workload=asset-processing:NoSchedule
```

---

## Load Testing Before Scaling

Always validate scaling decisions with load testing:

```bash
# Run smoke test
k6 run --vus 10 --duration 30s tests/load/k6-config.js

# Run load test
k6 run --vus 100 --duration 5m tests/load/k6-config.js

# Run stress test
k6 run --vus 500 --duration 10m tests/load/k6-config.js
```

---

## Scaling Checklist

### Before Scaling Up
- [ ] Check current resource utilization
- [ ] Verify budget availability
- [ ] Notify team in #engineering
- [ ] Have rollback plan ready

### After Scaling Up
- [ ] Verify new resources are healthy
- [ ] Update monitoring thresholds
- [ ] Document reason for scaling
- [ ] Schedule scale-down if temporary

### Before Scaling Down
- [ ] Verify traffic patterns support reduction
- [ ] Check for scheduled events/campaigns
- [ ] Ensure minimums meet SLA requirements
- [ ] Test with reduced capacity first

---

## Cost Monitoring

```bash
# Check current AKS costs
az consumption usage list \
  --start-date 2024-12-01 \
  --end-date 2024-12-18 \
  --query "[?contains(instanceName, 'creatorbridge')].{Name:instanceName, Cost:pretaxCost}" \
  --output table

# Set budget alerts
az consumption budget create \
  --budget-name creatorbridge-monthly \
  --amount 10000 \
  --time-grain Monthly \
  --category Cost \
  --resource-group creatorbridge-production
```

---

## Emergency Scaling

For sudden traffic spikes (>5x normal):

```bash
# Emergency scale-up script
#!/bin/bash
NAMESPACE="creatorbridge-production"

# Scale all services to maximum
kubectl scale deployment --all --replicas=10 -n $NAMESPACE

# Scale node pool
az aks nodepool scale \
  --resource-group creatorbridge-production \
  --cluster-name creatorbridge-aks \
  --name agentpool \
  --node-count 10

# Alert team
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"🚨 Emergency scaling triggered for CreatorBridge"}'
```
