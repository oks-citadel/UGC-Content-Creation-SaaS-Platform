# Observability Guide

> **Platform-Native Monitoring and Incident Response**
> Vercel Analytics + Railway Metrics + Application Monitoring

---

## Table of Contents

1. [Observability Strategy](#observability-strategy)
2. [Vercel Frontend Observability](#vercel-frontend-observability)
3. [Railway Backend Observability](#railway-backend-observability)
4. [Application-Level Monitoring](#application-level-monitoring)
5. [Uptime Monitoring](#uptime-monitoring)
6. [Alerting Configuration](#alerting-configuration)
7. [Incident Response Runbook](#incident-response-runbook)

---

## Observability Strategy

### Platform Ownership

| Layer | Platform | What It Monitors |
|-------|----------|------------------|
| **Frontend** | Vercel | Edge metrics, Web Vitals, deployment status |
| **Backend** | Railway | Container metrics, logs, health probes |
| **Application** | Sentry (optional) | Errors, exceptions, performance |
| **Uptime** | External monitor | Endpoint availability, latency |

### Observability Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OBSERVABILITY LAYERS                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                    INFRASTRUCTURE LAYER                              ││
│  │                    (Platform-Managed)                                ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  ┌──────────────────┐          ┌──────────────────┐                 ││
│  │  │ VERCEL ANALYTICS │          │ RAILWAY METRICS  │                 ││
│  │  │                  │          │                  │                 ││
│  │  │ • Web Vitals     │          │ • CPU/Memory     │                 ││
│  │  │ • Edge Latency   │          │ • Network I/O    │                 ││
│  │  │ • Page Views     │          │ • Deploy Status  │                 ││
│  │  │ • Error Rates    │          │ • Container Logs │                 ││
│  │  └──────────────────┘          └──────────────────┘                 ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                     APPLICATION LAYER                                ││
│  │                     (Optional - Sentry)                              ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  ┌──────────────────┐          ┌──────────────────┐                 ││
│  │  │ ERROR TRACKING   │          │ PERFORMANCE      │                 ││
│  │  │                  │          │                  │                 ││
│  │  │ • Exceptions     │          │ • Transactions   │                 ││
│  │  │ • Stack Traces   │          │ • DB Queries     │                 ││
│  │  │ • User Context   │          │ • HTTP Requests  │                 ││
│  │  │ • Release Track  │          │ • Spans/Traces   │                 ││
│  │  └──────────────────┘          └──────────────────┘                 ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      UPTIME LAYER                                    ││
│  │                      (External Monitor)                              ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  • HTTPS availability checks                                         ││
│  │  • Response time monitoring                                          ││
│  │  • SSL certificate expiry                                            ││
│  │  • Multi-region probes                                               ││
│  │                                                                      ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Vercel Frontend Observability

### Vercel Analytics (Built-in)

Enable in Vercel Dashboard → Project → Analytics:

```
✓ Web Vitals (Core Web Vitals tracking)
✓ Audiences (Real user metrics)
✓ Speed Insights (Performance analysis)
```

#### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **LCP** (Largest Contentful Paint) | < 2.5s | > 4.0s |
| **FID** (First Input Delay) | < 100ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | > 0.25 |
| **TTFB** (Time to First Byte) | < 200ms | > 600ms |
| **INP** (Interaction to Next Paint) | < 200ms | > 500ms |

### Vercel Logs

Access logs via Vercel Dashboard → Project → Logs:

```
Filter options:
- Function (serverless function logs)
- Edge (edge function logs)
- Build (build-time logs)
- Static (CDN access logs - Pro plan)
```

#### Log Query Examples

```
# Filter by HTTP status
level:error

# Filter by function name
source:api/auth

# Filter by time range
timestamp:>2024-01-15T00:00:00Z

# Filter by request path
message:/api/webhook
```

### Vercel Deployment Monitoring

```bash
# Check deployment status via CLI
vercel ls --scope your-team

# Get deployment details
vercel inspect https://your-deployment.vercel.app

# View deployment logs
vercel logs https://your-deployment.vercel.app
```

### Frontend Code Instrumentation

```javascript
// next.config.js - Enable Vercel Analytics
module.exports = {
  // ...
}

// _app.tsx - Add Analytics component
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </>
  );
}
```

---

## Railway Backend Observability

### Railway Metrics Dashboard

Access via Railway Dashboard → Project → Service → Metrics:

| Metric | What It Shows | Alert When |
|--------|---------------|------------|
| **CPU** | Container CPU usage % | > 80% sustained |
| **Memory** | Container RAM usage | > 85% |
| **Network In/Out** | Bandwidth consumption | Anomalies |
| **Restart Count** | Container restart events | > 0 |

### Railway Logs

```bash
# View live logs
railway logs --service api

# View logs with timestamp
railway logs --service api --timestamps

# Filter by time (last 2 hours)
railway logs --service api --since 2h

# View specific number of lines
railway logs --service api --limit 500

# Follow logs (tail -f equivalent)
railway logs --service api --follow
```

#### Log Output Format

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "api",
  "message": "Request processed",
  "requestId": "abc-123",
  "method": "POST",
  "path": "/api/users",
  "statusCode": 200,
  "duration": 45
}
```

### Health Check Configuration

```yaml
# Railway service settings
healthcheck:
  path: /health
  timeout: 30
  interval: 10
  retries: 3
```

**Health Endpoint Implementation:**

```javascript
// health.js - Comprehensive health check
const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
    environment: process.env.NODE_ENV,
    checks: {}
  };

  // Database check
  try {
    await db.raw('SELECT 1');
    health.checks.database = { status: 'ok' };
  } catch (error) {
    health.checks.database = { status: 'error', message: error.message };
    health.status = 'degraded';
  }

  // Redis check
  try {
    await redis.ping();
    health.checks.redis = { status: 'ok' };
  } catch (error) {
    health.checks.redis = { status: 'error', message: error.message };
    health.status = 'degraded';
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  health.checks.memory = {
    status: memUsedMB < 450 ? 'ok' : 'warning',
    usedMB: memUsedMB
  };

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
```

### Structured Logging

```javascript
// logger.js - Production-ready logger
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: process.env.RAILWAY_SERVICE_NAME || 'api',
    env: process.env.NODE_ENV,
    version: process.env.RAILWAY_GIT_COMMIT_SHA,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      requestId: req.headers['x-request-id'],
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};

module.exports = { logger, requestLogger };
```

---

## Application-Level Monitoring

### Sentry Integration (Optional)

#### Frontend Setup (Next.js)

```bash
# Install Sentry
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

#### Backend Setup (Node.js)

```javascript
// sentry.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.RAILWAY_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Postgres(),
  ],
});

// Express middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Error handler (must be last)
app.use(Sentry.Handlers.errorHandler());
```

### Custom Metrics

```javascript
// metrics.js - Application metrics
const metrics = {
  counters: {},
  gauges: {},
  histograms: {},
};

// Increment counter
function incrementCounter(name, value = 1, tags = {}) {
  const key = `${name}:${JSON.stringify(tags)}`;
  metrics.counters[key] = (metrics.counters[key] || 0) + value;
}

// Set gauge
function setGauge(name, value, tags = {}) {
  const key = `${name}:${JSON.stringify(tags)}`;
  metrics.gauges[key] = value;
}

// Record histogram
function recordHistogram(name, value, tags = {}) {
  const key = `${name}:${JSON.stringify(tags)}`;
  if (!metrics.histograms[key]) {
    metrics.histograms[key] = [];
  }
  metrics.histograms[key].push(value);
}

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(metrics);
});

// Usage
incrementCounter('api.requests', 1, { method: 'POST', path: '/users' });
setGauge('api.active_connections', activeConnections);
recordHistogram('api.response_time', responseTime, { endpoint: '/users' });
```

---

## Uptime Monitoring

### Recommended Monitors

| Endpoint | Check Interval | Timeout | Alert After |
|----------|----------------|---------|-------------|
| `https://example.com` | 1 min | 10s | 2 failures |
| `https://app.example.com` | 1 min | 10s | 2 failures |
| `https://api.example.com/health` | 1 min | 5s | 1 failure |
| `https://api.example.com` | 5 min | 10s | 2 failures |

### Free Uptime Monitoring Options

1. **UptimeRobot** (free tier: 50 monitors)
2. **Better Stack (formerly Better Uptime)** (free tier available)
3. **Checkly** (free tier: 5 checks)
4. **Freshping** (free tier: 50 checks)

### UptimeRobot Configuration Example

```
Monitor 1: Production App
- URL: https://app.example.com
- Type: HTTPS
- Interval: 1 minute
- Alert contacts: [team email, Slack webhook]

Monitor 2: Production API
- URL: https://api.example.com/health
- Type: HTTPS (keyword)
- Keyword: "ok"
- Interval: 1 minute
- Alert contacts: [team email, Slack webhook, PagerDuty]

Monitor 3: SSL Certificate
- URL: https://example.com
- Type: SSL Certificate
- Alert before expiry: 14 days
- Alert contacts: [team email]
```

### Health Check Script

```bash
#!/bin/bash
# health-check.sh - Run as cron job or external monitor

ENDPOINTS=(
  "https://example.com"
  "https://app.example.com"
  "https://api.example.com/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
  response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$endpoint")

  if [ "$response" != "200" ]; then
    echo "ALERT: $endpoint returned $response"
    # Send alert (customize based on your alerting system)
    # curl -X POST https://your-webhook.com/alert -d "endpoint=$endpoint&status=$response"
  else
    echo "OK: $endpoint"
  fi
done
```

---

## Alerting Configuration

### Alert Priority Levels

| Priority | Response Time | Examples |
|----------|---------------|----------|
| **P1 - Critical** | Immediate | Complete outage, data loss |
| **P2 - High** | < 15 min | Partial outage, 5xx errors |
| **P3 - Medium** | < 1 hour | Performance degradation |
| **P4 - Low** | Next business day | Non-critical warnings |

### Alert Routing

```
┌─────────────────┐
│  Alert Source   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Priority Check  │
└────────┬────────┘
         │
    ┌────┴────┬─────────┬─────────┐
    │         │         │         │
    ▼         ▼         ▼         ▼
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│  P1   │ │  P2   │ │  P3   │ │  P4   │
│       │ │       │ │       │ │       │
│Slack  │ │Slack  │ │Slack  │ │Email  │
│Phone  │ │Email  │ │Email  │ │Only   │
│Email  │ │       │ │       │ │       │
└───────┘ └───────┘ └───────┘ └───────┘
```

### Slack Alert Integration

```javascript
// alerts.js - Slack webhook alerts
const axios = require('axios');

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;

async function sendAlert(severity, title, message, fields = []) {
  const colors = {
    critical: '#FF0000',
    warning: '#FFA500',
    info: '#0000FF',
    ok: '#00FF00',
  };

  const payload = {
    attachments: [{
      color: colors[severity] || colors.info,
      title: `[${severity.toUpperCase()}] ${title}`,
      text: message,
      fields: fields.map(f => ({
        title: f.title,
        value: f.value,
        short: true,
      })),
      footer: `Environment: ${process.env.NODE_ENV}`,
      ts: Math.floor(Date.now() / 1000),
    }],
  };

  try {
    await axios.post(SLACK_WEBHOOK, payload);
  } catch (error) {
    console.error('Failed to send Slack alert:', error.message);
  }
}

// Usage
sendAlert('critical', 'API Outage', 'Health check failing', [
  { title: 'Service', value: 'api' },
  { title: 'Region', value: 'us-east-1' },
]);
```

---

## Incident Response Runbook

### Incident Detection

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INCIDENT DETECTION                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Automated Alerts:                                                       │
│  • Uptime monitor fails                                                  │
│  • Error rate > 5%                                                       │
│  • Response time > 2x baseline                                           │
│  • Health check fails                                                    │
│                                                                          │
│  User Reports:                                                           │
│  • Support tickets                                                       │
│  • Social media                                                          │
│  • Direct customer contact                                               │
│                                                                          │
│  Internal Discovery:                                                     │
│  • Team member notices issue                                             │
│  • Failed deployment                                                     │
│  • Log anomalies                                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Incident Response Flow

```
Step 1: ACKNOWLEDGE (< 5 min)
├── Acknowledge alert in monitoring system
├── Join incident Slack channel
└── Assign incident commander

Step 2: ASSESS (< 10 min)
├── Determine scope and impact
├── Classify severity (P1-P4)
├── Identify affected services
└── Initial customer communication (if P1/P2)

Step 3: MITIGATE (varies)
├── Attempt quick fixes
├── Consider rollback
├── Enable maintenance mode if needed
└── Regular status updates

Step 4: RESOLVE
├── Confirm fix deployed
├── Verify all monitors green
├── Customer all-clear communication
└── Begin post-incident work

Step 5: POST-INCIDENT (< 48 hours)
├── Timeline documentation
├── Root cause analysis
├── Action items created
└── Post-mortem meeting scheduled
```

### Triage Checklist

```markdown
## Incident Triage Checklist

### Initial Assessment
- [ ] What is broken? (specific error/symptom)
- [ ] When did it start? (check deploy history)
- [ ] Who is affected? (all users, subset, specific region)
- [ ] What changed? (recent deployments, config changes)

### Quick Diagnostics
- [ ] Check health endpoints:
      curl https://api.example.com/health
- [ ] Check Vercel deployment status
- [ ] Check Railway service status
- [ ] Check error logs (last 30 min)
- [ ] Check database connectivity
- [ ] Check external service status (Stripe, etc.)

### Severity Determination
- [ ] P1: Complete outage or data loss risk
- [ ] P2: Major feature broken, significant user impact
- [ ] P3: Minor feature broken, workaround exists
- [ ] P4: Cosmetic issue, no user impact
```

### Escalation Matrix

| Severity | First Responder | Escalate To | Time to Escalate |
|----------|-----------------|-------------|------------------|
| P1 | On-Call Engineer | Engineering Lead + CTO | Immediate |
| P2 | On-Call Engineer | Engineering Lead | 15 minutes |
| P3 | On-Call Engineer | Team Lead | 1 hour |
| P4 | On-Call Engineer | — | Next standup |

### Communication Templates

**Initial Incident Communication:**
```
🔴 [INVESTIGATING] Service Degradation

We are aware of issues affecting [service/feature].

Impact: [description of what users experience]
Status: Investigating
Started: [time]

We will provide updates every [15/30] minutes.
```

**Resolution Communication:**
```
🟢 [RESOLVED] Service Restored

The issue affecting [service/feature] has been resolved.

Duration: [start time] to [end time]
Root Cause: [brief explanation]
Resolution: [what was done]

We apologize for any inconvenience.
```

---

## Dashboards

### Key Metrics Dashboard

Create a central dashboard with:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SaaS HEALTH DASHBOARD                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────┐ │
│  │ Uptime        │  │ Error Rate    │  │ Response Time │  │ Active    │ │
│  │    99.9%      │  │     0.1%      │  │    145ms      │  │ Users: 42 │ │
│  │    ▲ 0.1%     │  │    ▼ 0.05%    │  │    ▼ 12ms     │  │   ▲ 5     │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────┘ │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                     Request Volume (24h)                             ││
│  │  ████████████████████████████████████████████████████████████████   ││
│  │  ▲ Peak: 1,234 req/min   ▼ Low: 89 req/min   Avg: 456 req/min       ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────┐
│  │ Top Errors (24h)            │  │ Slowest Endpoints                   │
│  │ 1. 500 /api/payment (12)    │  │ 1. POST /api/upload (2.3s)          │
│  │ 2. 404 /api/user (8)        │  │ 2. GET /api/report (1.8s)           │
│  │ 3. 403 /api/admin (3)       │  │ 3. POST /api/process (1.2s)         │
│  └─────────────────────────────┘  └─────────────────────────────────────┘
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Service Status Page

Consider using:
- **Statuspage** (Atlassian)
- **Instatus** (free tier available)
- **Cachet** (self-hosted, open source)

For a simple status page, expose `/status` endpoint:

```javascript
app.get('/status', async (req, res) => {
  const services = {
    api: await checkHealth('https://api.example.com/health'),
    web: await checkHealth('https://app.example.com'),
    database: await checkDatabase(),
  };

  const allHealthy = Object.values(services).every(s => s.status === 'ok');

  res.json({
    status: allHealthy ? 'operational' : 'degraded',
    services,
    lastUpdated: new Date().toISOString(),
  });
});
```
