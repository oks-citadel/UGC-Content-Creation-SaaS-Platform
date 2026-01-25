# Staging Validation Plan

> **Pre-Production Validation Checklist**
> Complete testing before DNS cutover

---

## Table of Contents

1. [Staging Environment Setup](#staging-environment-setup)
2. [Validation Test Plan](#validation-test-plan)
3. [Test Execution](#test-execution)
4. [Sign-Off Criteria](#sign-off-criteria)

---

## Staging Environment Setup

### Infrastructure Checklist

- [ ] **Vercel Staging**
  - Project connected to `develop` branch
  - Staging domain configured: `staging.example.com`
  - Environment variables set for staging
  - SSL certificate provisioned

- [ ] **Railway Staging**
  - Separate project or environment for staging
  - Staging domain configured: `api-staging.example.com`
  - PostgreSQL provisioned with test data
  - Redis provisioned
  - Environment variables set for staging

- [ ] **DNS (GoDaddy)**
  - Staging CNAME records created
  - SSL certificates verified

### Staging URLs

| Service | URL |
|---------|-----|
| Frontend | `https://staging.example.com` |
| API | `https://api-staging.example.com` |
| API Health | `https://api-staging.example.com/health` |

### Verify Staging Connectivity

```bash
# Frontend accessibility
curl -I https://staging.example.com

# API health check
curl https://api-staging.example.com/health

# SSL verification
echo | openssl s_client -connect staging.example.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Validation Test Plan

### Test Categories

| Category | Priority | Estimated Time |
|----------|----------|----------------|
| Authentication | P0 | 30 min |
| Core API Flows | P0 | 45 min |
| Payments | P0 | 30 min |
| File Uploads | P1 | 20 min |
| Webhooks | P1 | 30 min |
| Email Delivery | P1 | 20 min |
| Edge Cases | P2 | 30 min |

### P0: Authentication Tests

| Test ID | Test Case | Expected Result | Pass/Fail |
|---------|-----------|-----------------|-----------|
| AUTH-001 | User registration with email | Account created, verification email sent | ☐ |
| AUTH-002 | Email verification | Account activated | ☐ |
| AUTH-003 | User login (email/password) | JWT issued, session created | ☐ |
| AUTH-004 | Login with incorrect password | 401 error, not locked out | ☐ |
| AUTH-005 | Login with incorrect password (5x) | Account temporarily locked | ☐ |
| AUTH-006 | MFA setup (TOTP) | QR code generated, recovery codes issued | ☐ |
| AUTH-007 | MFA login flow | Second factor required and validated | ☐ |
| AUTH-008 | Password reset request | Reset email sent | ☐ |
| AUTH-009 | Password reset completion | Password changed, sessions invalidated | ☐ |
| AUTH-010 | OAuth login (Google) | Account linked/created | ☐ |
| AUTH-011 | OAuth login (GitHub) | Account linked/created | ☐ |
| AUTH-012 | Logout | Session destroyed, JWT invalidated | ☐ |
| AUTH-013 | Token refresh | New access token issued | ☐ |
| AUTH-014 | Session persistence | User remains logged in after refresh | ☐ |

### P0: Core API Flows

| Test ID | Test Case | Expected Result | Pass/Fail |
|---------|-----------|-----------------|-----------|
| API-001 | GET user profile | User data returned | ☐ |
| API-002 | UPDATE user profile | Profile updated, changes persisted | ☐ |
| API-003 | Create resource (e.g., campaign) | Resource created with ID | ☐ |
| API-004 | List resources with pagination | Paginated results returned | ☐ |
| API-005 | Update resource | Resource updated | ☐ |
| API-006 | Delete resource | Resource soft-deleted | ☐ |
| API-007 | Search/filter resources | Filtered results returned | ☐ |
| API-008 | API rate limiting | 429 after limit exceeded | ☐ |
| API-009 | Unauthorized access | 401 for unauthenticated requests | ☐ |
| API-010 | Forbidden access | 403 for unauthorized resources | ☐ |

### P0: Payments (Stripe Test Mode)

| Test ID | Test Case | Expected Result | Pass/Fail |
|---------|-----------|-----------------|-----------|
| PAY-001 | Create subscription (test card) | Subscription active | ☐ |
| PAY-002 | Webhook: subscription created | Local DB updated | ☐ |
| PAY-003 | Process payment (test card) | Payment succeeded | ☐ |
| PAY-004 | Webhook: payment succeeded | Invoice marked paid | ☐ |
| PAY-005 | Cancel subscription | Subscription cancelled | ☐ |
| PAY-006 | Webhook: subscription cancelled | Access revoked at period end | ☐ |
| PAY-007 | Failed payment (4000 0000 0000 0002) | Payment failed gracefully | ☐ |
| PAY-008 | Upgrade subscription | Plan changed, prorated | ☐ |
| PAY-009 | Downgrade subscription | Plan changed at renewal | ☐ |
| PAY-010 | View billing history | Invoices displayed | ☐ |

**Stripe Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

### P1: File Uploads

| Test ID | Test Case | Expected Result | Pass/Fail |
|---------|-----------|-----------------|-----------|
| FILE-001 | Upload image (< 5MB) | File uploaded, URL returned | ☐ |
| FILE-002 | Upload video (< 100MB) | File uploaded, processing started | ☐ |
| FILE-003 | Upload oversized file | 413 error, rejected | ☐ |
| FILE-004 | Upload invalid file type | 400 error, rejected | ☐ |
| FILE-005 | Retrieve uploaded file | File served with correct content-type | ☐ |
| FILE-006 | Delete uploaded file | File removed | ☐ |

### P1: Webhooks

| Test ID | Test Case | Expected Result | Pass/Fail |
|---------|-----------|-----------------|-----------|
| WH-001 | Stripe webhook signature valid | Webhook processed | ☐ |
| WH-002 | Stripe webhook signature invalid | 400 error, rejected | ☐ |
| WH-003 | Webhook retry handling | Idempotent processing | ☐ |
| WH-004 | Social platform callback | OAuth flow completed | ☐ |

### P1: Email Delivery

| Test ID | Test Case | Expected Result | Pass/Fail |
|---------|-----------|-----------------|-----------|
| EMAIL-001 | Welcome email | Email received within 5 min | ☐ |
| EMAIL-002 | Password reset email | Email received with valid link | ☐ |
| EMAIL-003 | Email verification | Email received with valid link | ☐ |
| EMAIL-004 | Notification email | Email received | ☐ |
| EMAIL-005 | Email unsubscribe | Preferences updated | ☐ |

### P2: Edge Cases

| Test ID | Test Case | Expected Result | Pass/Fail |
|---------|-----------|-----------------|-----------|
| EDGE-001 | Concurrent session from multiple devices | Both sessions valid | ☐ |
| EDGE-002 | Session invalidation (password change) | Other sessions logged out | ☐ |
| EDGE-003 | Database connection failure | Graceful error, retry | ☐ |
| EDGE-004 | Redis connection failure | Fallback behavior | ☐ |
| EDGE-005 | Long-running request timeout | 504 returned, request aborted | ☐ |
| EDGE-006 | Special characters in input | Properly escaped, no injection | ☐ |
| EDGE-007 | XSS attempt | Sanitized, no execution | ☐ |
| EDGE-008 | SQL injection attempt | Blocked, logged | ☐ |

---

## Test Execution

### Automated Test Suite

```bash
# Run integration tests against staging
NEXT_PUBLIC_API_URL=https://api-staging.example.com \
  npm run test:e2e

# Run API tests
API_URL=https://api-staging.example.com \
  npm run test:api

# Run security tests
npm run test:security -- --target=https://api-staging.example.com
```

### Manual Test Script

```bash
#!/bin/bash
# staging-smoke-test.sh

API_URL="https://api-staging.example.com"
APP_URL="https://staging.example.com"

echo "=== Staging Smoke Test ==="

# Health checks
echo "Testing health endpoints..."
curl -sf "$API_URL/health" | jq .
curl -sfI "$APP_URL" | head -1

# Auth flow test (requires test credentials)
echo "Testing authentication..."
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!"}' \
  | jq -r '.accessToken')

if [ "$TOKEN" != "null" ]; then
  echo "✓ Authentication successful"

  # Test authenticated endpoint
  curl -sf "$API_URL/api/user/profile" \
    -H "Authorization: Bearer $TOKEN" | jq .
else
  echo "✗ Authentication failed"
fi

# Database connectivity (via API)
echo "Testing database..."
curl -sf "$API_URL/health" | jq '.checks.database'

# Redis connectivity (via API)
echo "Testing Redis..."
curl -sf "$API_URL/health" | jq '.checks.redis'

echo "=== Smoke Test Complete ==="
```

### CORS Validation

```bash
# Test CORS from staging frontend
curl -I -X OPTIONS "https://api-staging.example.com/api/users" \
  -H "Origin: https://staging.example.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization"

# Expected headers:
# Access-Control-Allow-Origin: https://staging.example.com
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# Access-Control-Allow-Credentials: true
```

### Webhook Testing

```bash
# Use Stripe CLI to test webhooks
stripe listen --forward-to https://api-staging.example.com/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
stripe trigger customer.subscription.deleted
```

---

## Sign-Off Criteria

### Go/No-Go Checklist

| Category | Criteria | Required | Status |
|----------|----------|----------|--------|
| **Infrastructure** | All services healthy | Yes | ☐ |
| **Infrastructure** | SSL certificates valid | Yes | ☐ |
| **Infrastructure** | DNS resolving correctly | Yes | ☐ |
| **Authentication** | All P0 tests passing | Yes | ☐ |
| **Core API** | All P0 tests passing | Yes | ☐ |
| **Payments** | All P0 tests passing | Yes | ☐ |
| **File Uploads** | All P1 tests passing | Yes | ☐ |
| **Webhooks** | All P1 tests passing | Yes | ☐ |
| **Email** | Delivery confirmed | Yes | ☐ |
| **Performance** | Response time < 500ms | Yes | ☐ |
| **Errors** | Error rate < 0.1% | Yes | ☐ |

### Sign-Off Form

```markdown
## Staging Validation Sign-Off

**Date:** ____________________
**Validated By:** ____________________

### Test Results Summary

| Category | Passed | Failed | Blocked |
|----------|--------|--------|---------|
| Authentication | ____ | ____ | ____ |
| Core API | ____ | ____ | ____ |
| Payments | ____ | ____ | ____ |
| File Uploads | ____ | ____ | ____ |
| Webhooks | ____ | ____ | ____ |
| Email | ____ | ____ | ____ |
| Edge Cases | ____ | ____ | ____ |

### Known Issues (if any)
1. ____________________
2. ____________________

### Decision
- [ ] **GO** - Proceed with production cutover
- [ ] **NO-GO** - Issues must be resolved

### Signatures
- QA Lead: ____________________ Date: ________
- Engineering Lead: ____________________ Date: ________
- Product Owner: ____________________ Date: ________
```

### Failure Handling

If validation fails:

1. **Document the failure**
   - Test ID
   - Expected vs actual result
   - Screenshots/logs

2. **Classify severity**
   - Blocker: Must fix before cutover
   - Major: Should fix, can workaround
   - Minor: Can fix post-cutover

3. **Create fix branch**
   - Fix issue in staging first
   - Re-run failed tests
   - Update sign-off form

4. **Re-schedule cutover**
   - If blockers exist, postpone cutover
   - Communicate new timeline to stakeholders

---

## Test Data Setup

### Seed Data Script

```bash
#!/bin/bash
# seed-staging.sh

# Run database seeds
railway run npm run db:seed:staging

# Create test accounts
railway run npm run create-test-users

# Import sample data
railway run npm run import-sample-data
```

### Test User Accounts

| Role | Email | Password | MFA |
|------|-------|----------|-----|
| Admin | admin@staging.example.com | (staging-admin-pw) | Enabled |
| User | user@staging.example.com | (staging-user-pw) | Disabled |
| Creator | creator@staging.example.com | (staging-creator-pw) | Disabled |

**Note:** Use different passwords in actual implementation. Store securely.

### Cleanup Script

```bash
#!/bin/bash
# cleanup-staging.sh

# Reset database to clean state
railway run npm run db:reset:staging

# Clear Redis cache
railway run npm run cache:clear

# Remove test uploads
railway run npm run cleanup:uploads
```

---

## Performance Validation

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run --vus 50 --duration 5m scripts/load-test.js
```

**k6 Script Example:**

```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 50,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% failure rate
  },
};

const BASE_URL = 'https://api-staging.example.com';

export default function () {
  // Health check
  const health = http.get(`${BASE_URL}/health`);
  check(health, {
    'health check status is 200': (r) => r.status === 200,
  });

  // API endpoint
  const users = http.get(`${BASE_URL}/api/users`, {
    headers: { Authorization: `Bearer ${__ENV.TEST_TOKEN}` },
  });
  check(users, {
    'users endpoint status is 200': (r) => r.status === 200,
    'users response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Performance Baseline

| Metric | Target | Acceptable | Current |
|--------|--------|------------|---------|
| API p50 latency | < 100ms | < 200ms | ____ms |
| API p95 latency | < 300ms | < 500ms | ____ms |
| API p99 latency | < 500ms | < 1000ms | ____ms |
| Error rate | < 0.1% | < 1% | ____% |
| Throughput | > 100 rps | > 50 rps | ____ rps |
