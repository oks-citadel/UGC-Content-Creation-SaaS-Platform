# CreatorBridge Monitoring & Alerting Runbook

## Overview

This runbook covers monitoring, alerting, and observability for the CreatorBridge platform.

---

## Monitoring Stack

| Component | Purpose | URL |
|-----------|---------|-----|
| Azure Monitor | Metrics & alerts | Azure Portal |
| Application Insights | APM & tracing | Azure Portal |
| Log Analytics | Centralized logging | Azure Portal |
| Grafana (optional) | Dashboards | grafana.creatorbridge.com |

---

## Key Dashboards

### Platform Overview Dashboard

**Location:** Azure Portal > Monitor > Dashboards > CreatorBridge Overview

**Key Metrics:**
- Total active users (DAU/MAU)
- API requests per minute
- Error rate (5xx responses)
- Average response time (p50, p95, p99)
- Active campaigns
- Content submissions/hour

### Service Health Dashboard

**Location:** Azure Portal > Monitor > Dashboards > Service Health

**Per-Service Metrics:**
- Pod count and status
- CPU/memory utilization
- Request rate
- Error rate
- Response latency

---

## Alert Configuration

### Critical Alerts (PagerDuty)

| Alert | Threshold | Action |
|-------|-----------|--------|
| API Error Rate > 5% | 5 min sustained | Page on-call |
| Service Down | 3 failed health checks | Page on-call |
| Database Connection Failures | 10/min | Page on-call |
| Payment Failures | 5/min | Page on-call |
| SSL Certificate Expiry | < 14 days | Page on-call |

### Warning Alerts (Slack)

| Alert | Threshold | Channel |
|-------|-----------|---------|
| High CPU Usage | > 80% for 10 min | #alerts |
| High Memory Usage | > 85% for 10 min | #alerts |
| Response Time p95 > 2s | 5 min sustained | #alerts |
| Queue Depth > 1000 | 15 min sustained | #alerts |
| Disk Usage > 80% | Immediate | #alerts |

### Informational Alerts (Email)

| Alert | Frequency |
|-------|-----------|
| Daily health summary | 9 AM UTC |
| Weekly performance report | Monday 9 AM UTC |
| Monthly cost report | 1st of month |

---

## Viewing Logs

### Application Logs (Log Analytics)

```kusto
// All errors in last hour
AppTraces
| where TimeGenerated > ago(1h)
| where SeverityLevel >= 3
| project TimeGenerated, Message, ServiceName, OperationId
| order by TimeGenerated desc

// Errors by service
AppTraces
| where TimeGenerated > ago(1h)
| where SeverityLevel >= 3
| summarize ErrorCount = count() by ServiceName
| order by ErrorCount desc

// Specific operation trace
AppTraces
| where OperationId == "abc123"
| order by TimeGenerated asc
```

### Kubernetes Logs

```bash
# Stream logs from service
kubectl logs -f -l app=asset-service -n creatorbridge-production

# Logs from specific pod
kubectl logs asset-service-abc123 -n creatorbridge-production

# Previous container logs (after restart)
kubectl logs asset-service-abc123 -n creatorbridge-production --previous

# Logs with timestamps
kubectl logs -l app=asset-service -n creatorbridge-production --timestamps
```

### Container Insights

```kusto
// Container CPU usage
Perf
| where ObjectName == "K8SContainer"
| where CounterName == "cpuUsageNanoCores"
| summarize AvgCPU = avg(CounterValue) by bin(TimeGenerated, 5m), InstanceName
| render timechart

// Container memory usage
Perf
| where ObjectName == "K8SContainer"
| where CounterName == "memoryRssBytes"
| summarize AvgMemory = avg(CounterValue) by bin(TimeGenerated, 5m), InstanceName
| render timechart
```

---

## Performance Investigation

### Identify Slow Requests

```kusto
// Slowest requests in last hour
requests
| where timestamp > ago(1h)
| where duration > 1000
| project timestamp, name, duration, resultCode, cloud_RoleName
| order by duration desc
| take 50
```

### Dependency Analysis

```kusto
// Slow external dependencies
dependencies
| where timestamp > ago(1h)
| where duration > 500
| summarize AvgDuration = avg(duration), Count = count() by target, type
| order by AvgDuration desc
```

### Database Query Performance

```kusto
// Slow SQL queries
dependencies
| where timestamp > ago(1h)
| where type == "SQL"
| where duration > 100
| project timestamp, target, data, duration
| order by duration desc
| take 20
```

---

## Health Check Endpoints

### Service Health URLs

| Service | Health Endpoint |
|---------|-----------------|
| API Gateway | https://api.creatorbridge.com/health |
| Auth Service | https://api.creatorbridge.com/v1/auth/health |
| Asset Service | https://api.creatorbridge.com/v1/assets/health |
| Payout Service | https://api.creatorbridge.com/v1/payouts/health |

### Automated Health Check Script

```bash
#!/bin/bash
SERVICES=(
  "https://api.creatorbridge.com/health"
  "https://api.creatorbridge.com/v1/auth/health"
  "https://api.creatorbridge.com/v1/assets/health"
  "https://api.creatorbridge.com/v1/payouts/health"
)

for url in "${SERVICES[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$response" == "200" ]; then
    echo "✓ $url - OK"
  else
    echo "✗ $url - FAILED ($response)"
  fi
done
```

---

## Custom Metrics

### Application Metrics

| Metric | Description | Unit |
|--------|-------------|------|
| `creatorbridge.users.active` | Active users | Count |
| `creatorbridge.campaigns.created` | Campaigns created | Count/hour |
| `creatorbridge.content.submitted` | Content submissions | Count/hour |
| `creatorbridge.payouts.processed` | Payouts processed | USD/hour |
| `creatorbridge.uploads.size` | Upload sizes | Bytes |

### Query Custom Metrics

```kusto
customMetrics
| where name startswith "creatorbridge"
| where timestamp > ago(1h)
| summarize avg(value) by bin(timestamp, 5m), name
| render timechart
```

---

## SLO Tracking

### Service Level Objectives

| SLO | Target | Measurement |
|-----|--------|-------------|
| Availability | 99.9% | Uptime of /health endpoint |
| API Latency (p95) | < 500ms | Request duration |
| Error Rate | < 0.1% | 5xx responses / total |
| Asset Upload Success | > 99% | Successful uploads / attempts |
| Payment Success | > 99.5% | Successful payouts / attempts |

### SLO Dashboard Query

```kusto
// Calculate availability
requests
| where timestamp > ago(30d)
| summarize
    TotalRequests = count(),
    SuccessfulRequests = countif(resultCode < 500)
| extend Availability = (SuccessfulRequests * 100.0) / TotalRequests

// Calculate error budget remaining
let target = 99.9;
let errorBudget = 100 - target;
requests
| where timestamp > ago(30d)
| summarize ErrorRate = countif(resultCode >= 500) * 100.0 / count()
| extend ErrorBudgetRemaining = errorBudget - ErrorRate
```

---

## Troubleshooting Common Issues

### High Error Rate

1. Check recent deployments: `kubectl rollout history deployment/<service>`
2. Check error logs: See Viewing Logs section
3. Check dependencies: Database, Redis, external APIs
4. Check resource utilization: CPU, memory, connections

### High Latency

1. Check database query times
2. Check Redis cache hit rate
3. Check external API latency
4. Check pod resource limits
5. Profile specific slow endpoints

### Memory Issues

```bash
# Check pod memory
kubectl top pods -n creatorbridge-production

# Get heap dump (Node.js)
kubectl exec -it <pod> -n creatorbridge-production -- \
  node --inspect --heapsnapshot-signal=SIGUSR2
```

### Connection Pool Exhaustion

```sql
-- Check PostgreSQL connections
SELECT count(*) FROM pg_stat_activity;

-- Check by state
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
```

---

## Creating Custom Alerts

### Azure Monitor Alert Rule

```bash
# Create alert rule via CLI
az monitor metrics alert create \
  --name "High Error Rate" \
  --resource-group creatorbridge-production \
  --scopes "/subscriptions/.../providers/Microsoft.Insights/components/creatorbridge-appinsights" \
  --condition "avg requests/failed > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --action-group "/subscriptions/.../actionGroups/OnCall" \
  --severity 2
```

### Silence Alert (Maintenance)

```bash
# Create maintenance window
az monitor action-rule create \
  --resource-group creatorbridge-production \
  --name "Maintenance Window" \
  --rule-type Suppression \
  --scope "/subscriptions/.../resourceGroups/creatorbridge-production" \
  --suppression-recurrence-type Once \
  --suppression-start-time "2024-12-20T02:00:00" \
  --suppression-end-time "2024-12-20T04:00:00"
```

---

## On-Call Procedures

### Shift Handoff Checklist

- [ ] Review open incidents
- [ ] Check alert trends from last 24h
- [ ] Verify PagerDuty contact info
- [ ] Review any scheduled maintenance
- [ ] Check deployment calendar

### Escalation Path

1. **L1 (On-Call):** First responder, initial triage
2. **L2 (Senior Engineer):** Complex issues, 30 min escalation
3. **L3 (Team Lead):** Major incidents, 1 hour escalation
4. **Executive:** Customer-impacting outages > 1 hour
