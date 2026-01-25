# DNS Cutover Plan (GoDaddy)

> **Zero-Downtime DNS Migration**
> Complete DNS record sets, TTL strategy, and rollback procedures

---

## Table of Contents

1. [Pre-Cutover Checklist](#pre-cutover-checklist)
2. [DNS Record Plan](#dns-record-plan)
3. [TTL Strategy](#ttl-strategy)
4. [Cutover Procedure](#cutover-procedure)
5. [Validation Commands](#validation-commands)
6. [Rollback Procedure](#rollback-procedure)
7. [Post-Cutover Verification](#post-cutover-verification)

---

## Pre-Cutover Checklist

### 72 Hours Before Cutover

- [ ] **Lower TTLs on existing records**
  ```
  Current TTL: 3600 (1 hour) → Target TTL: 300 (5 minutes)
  ```
- [ ] **Verify Vercel domain configuration**
  - Custom domain added in Vercel dashboard
  - SSL certificate pre-provisioned
- [ ] **Verify Railway domain configuration**
  - Custom domain added in Railway dashboard
  - SSL certificate pre-provisioned
- [ ] **Document current DNS records** (backup)
- [ ] **Notify stakeholders of maintenance window**

### 24 Hours Before Cutover

- [ ] **Verify TTL propagation** (should now be 5 minutes everywhere)
- [ ] **Run staging validation suite**
- [ ] **Confirm rollback contacts available**
- [ ] **Verify monitoring dashboards accessible**

### 1 Hour Before Cutover

- [ ] **Final staging validation**
- [ ] **Verify all team members online**
- [ ] **Open GoDaddy DNS console**
- [ ] **Open Vercel dashboard**
- [ ] **Open Railway dashboard**
- [ ] **Prepare rollback commands**

---

## DNS Record Plan

### Record Set Overview

Replace `example.com` with your actual domain.

| Host | Type | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| `@` | A | `76.76.21.21` | 300 | Root domain → Vercel |
| `www` | CNAME | `cname.vercel-dns.com` | 300 | www redirect → Vercel |
| `app` | CNAME | `cname.vercel-dns.com` | 300 | Application → Vercel |
| `api` | CNAME | `<project>.up.railway.app` | 300 | API → Railway |
| `staging` | CNAME | `cname.vercel-dns.com` | 300 | Staging → Vercel |
| `api-staging` | CNAME | `<staging-project>.up.railway.app` | 300 | Staging API → Railway |
| `ws` | CNAME | `<project>.up.railway.app` | 300 | WebSockets → Railway (optional) |

### Detailed Record Configuration

#### Root Domain (@)

```
Type:  A
Host:  @
Value: 76.76.21.21
TTL:   300
```

**Note:** Vercel requires an A record for apex domains. The IP `76.76.21.21` is Vercel's anycast IP.

#### WWW Subdomain

```
Type:  CNAME
Host:  www
Value: cname.vercel-dns.com
TTL:   300
```

#### Application Subdomain

```
Type:  CNAME
Host:  app
Value: cname.vercel-dns.com
TTL:   300
```

**Vercel Configuration Required:**
1. Add `app.example.com` as custom domain in Vercel project
2. Select "Production" as the branch
3. Wait for SSL certificate issuance

#### API Subdomain (Railway)

```
Type:  CNAME
Host:  api
Value: <your-railway-project>.up.railway.app
TTL:   300
```

**Finding Your Railway Domain:**
```bash
# Via Railway CLI
railway domain

# Output example:
# your-project-production.up.railway.app
```

**Railway Configuration Required:**
1. Go to Railway project → Settings → Domains
2. Add `api.example.com` as custom domain
3. Copy the provided CNAME target
4. Wait for SSL certificate issuance

#### Staging Subdomain

```
Type:  CNAME
Host:  staging
Value: cname.vercel-dns.com
TTL:   300
```

#### Staging API Subdomain

```
Type:  CNAME
Host:  api-staging
Value: <your-railway-staging-project>.up.railway.app
TTL:   300
```

### Optional Records

#### WebSocket Subdomain (if needed)

```
Type:  CNAME
Host:  ws
Value: <your-railway-project>.up.railway.app
TTL:   300
```

#### Email Records (Preserve Existing)

**Do not modify existing email records unless migrating email providers.**

```
# Example - keep existing MX records
Type:  MX
Host:  @
Value: (existing mail server)
Priority: 10
TTL:   3600

# SPF record
Type:  TXT
Host:  @
Value: "v=spf1 include:_spf.google.com ~all"
TTL:   3600

# DKIM record
Type:  TXT
Host:  google._domainkey
Value: (existing DKIM value)
TTL:   3600
```

---

## TTL Strategy

### Phase 1: Pre-Migration (72 hours before)

Lower TTLs to enable fast rollback:

| Current TTL | Target TTL | Purpose |
|-------------|------------|---------|
| 3600 (1 hr) | 300 (5 min) | Fast propagation |
| 86400 (1 day) | 300 (5 min) | Fast propagation |

**GoDaddy Steps:**
1. Log into GoDaddy Domain Manager
2. Select domain → DNS → DNS Records
3. Edit each record, change TTL to 300
4. Save changes

### Phase 2: Cutover Day

Maintain low TTLs during migration:

```
All records: TTL = 300 (5 minutes)
```

### Phase 3: Post-Migration (48 hours after)

After confirming stability, increase TTLs:

| Record Type | Production TTL | Rationale |
|-------------|----------------|-----------|
| A (root) | 3600 (1 hr) | Reduce DNS queries |
| CNAME (app) | 3600 (1 hr) | Stable routing |
| CNAME (api) | 600 (10 min) | Faster failover |
| CNAME (staging) | 300 (5 min) | Frequent changes OK |

---

## Cutover Procedure

### Step 1: Final Validation (T-30 minutes)

```bash
# Verify Vercel deployment health
curl -I https://<your-project>.vercel.app

# Verify Railway deployment health
curl -I https://<your-project>.up.railway.app/health

# Expected: HTTP 200 OK
```

### Step 2: Document Current Records (T-15 minutes)

```bash
# Export current DNS for rollback
dig example.com A +short > backup_dns_a.txt
dig www.example.com CNAME +short > backup_dns_www.txt
dig app.example.com CNAME +short > backup_dns_app.txt
dig api.example.com CNAME +short > backup_dns_api.txt

# Save output with timestamp
echo "Backup taken at $(date)" >> dns_backup_manifest.txt
```

### Step 3: Update DNS Records (T-0)

**In GoDaddy DNS Console:**

1. **Update A Record (Root)**
   - Find existing A record for `@`
   - Change value to `76.76.21.21`
   - Confirm TTL is 300
   - Save

2. **Update/Add CNAME Records**
   - `www` → `cname.vercel-dns.com`
   - `app` → `cname.vercel-dns.com`
   - `api` → `<project>.up.railway.app`
   - Save each record

3. **Verify in GoDaddy console**
   - All records show "Active" status

### Step 4: Wait for Initial Propagation (T+5 minutes)

```bash
# Check propagation from multiple locations
# Use: https://www.whatsmydns.net/

# Or via command line:
dig @8.8.8.8 example.com A +short
dig @1.1.1.1 example.com A +short
dig @208.67.222.222 example.com A +short

# Expected: 76.76.21.21
```

### Step 5: Verify SSL Certificates (T+10 minutes)

```bash
# Check root domain SSL
echo | openssl s_client -servername example.com -connect example.com:443 2>/dev/null | openssl x509 -noout -dates

# Check app subdomain SSL
echo | openssl s_client -servername app.example.com -connect app.example.com:443 2>/dev/null | openssl x509 -noout -dates

# Check API subdomain SSL
echo | openssl s_client -servername api.example.com -connect api.example.com:443 2>/dev/null | openssl x509 -noout -dates

# Expected: Valid certificate dates
```

---

## Validation Commands

### DNS Propagation Check

```bash
#!/bin/bash
# save as: check_dns_propagation.sh

DOMAIN="${1:-example.com}"

echo "=== DNS Propagation Check for $DOMAIN ==="
echo ""

# Check A record
echo "A Record (@):"
dig +short $DOMAIN A
echo ""

# Check CNAME records
for sub in www app api staging api-staging; do
    echo "CNAME Record ($sub):"
    dig +short $sub.$DOMAIN CNAME
    echo ""
done

# Check from multiple DNS servers
echo "=== Multi-DNS Check ==="
for dns in 8.8.8.8 1.1.1.1 208.67.222.222 9.9.9.9; do
    echo "DNS Server $dns:"
    dig @$dns +short $DOMAIN A
done
```

### HTTP Endpoint Validation

```bash
#!/bin/bash
# save as: validate_endpoints.sh

DOMAIN="${1:-example.com}"

echo "=== HTTP Endpoint Validation ==="
echo ""

# Root domain
echo "Root Domain (https://$DOMAIN):"
curl -sI https://$DOMAIN | head -3
echo ""

# App subdomain
echo "App Subdomain (https://app.$DOMAIN):"
curl -sI https://app.$DOMAIN | head -3
echo ""

# API health check
echo "API Health (https://api.$DOMAIN/health):"
curl -s https://api.$DOMAIN/health | head -1
echo ""

# Staging (if applicable)
echo "Staging (https://staging.$DOMAIN):"
curl -sI https://staging.$DOMAIN | head -3
echo ""
```

### Full Validation Suite

```bash
#!/bin/bash
# save as: full_validation.sh

DOMAIN="${1:-example.com}"
ERRORS=0

check() {
    local name=$1
    local cmd=$2
    local expected=$3

    result=$(eval $cmd 2>/dev/null)
    if echo "$result" | grep -q "$expected"; then
        echo "✓ $name"
    else
        echo "✗ $name (expected: $expected, got: $result)"
        ((ERRORS++))
    fi
}

echo "=== Full Validation Suite ==="
echo ""

# DNS Checks
echo "--- DNS ---"
check "Root A record" "dig +short $DOMAIN A" "76.76.21.21"
check "App CNAME" "dig +short app.$DOMAIN CNAME" "cname.vercel-dns.com"
check "API CNAME" "dig +short api.$DOMAIN CNAME" "railway.app"

echo ""
echo "--- HTTP Status ---"
check "Root HTTPS" "curl -sI https://$DOMAIN | head -1" "200"
check "App HTTPS" "curl -sI https://app.$DOMAIN | head -1" "200"
check "API Health" "curl -s https://api.$DOMAIN/health" "ok"

echo ""
echo "--- SSL Certificates ---"
check "Root SSL valid" "echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -checkend 86400" ""
check "App SSL valid" "echo | openssl s_client -servername app.$DOMAIN -connect app.$DOMAIN:443 2>/dev/null | openssl x509 -noout -checkend 86400" ""
check "API SSL valid" "echo | openssl s_client -servername api.$DOMAIN -connect api.$DOMAIN:443 2>/dev/null | openssl x509 -noout -checkend 86400" ""

echo ""
echo "=== Summary ==="
if [ $ERRORS -eq 0 ]; then
    echo "All checks passed!"
    exit 0
else
    echo "$ERRORS check(s) failed!"
    exit 1
fi
```

---

## Rollback Procedure

### When to Rollback

- [ ] DNS not propagating after 30 minutes
- [ ] SSL certificate errors persisting
- [ ] Application returning 5xx errors
- [ ] Critical user-facing functionality broken
- [ ] Stakeholder decision to revert

### Rollback Steps

#### Step 1: Decision Point

```
DECISION: Rollback Required?

If issues are:
- Transient → Wait 5-10 more minutes
- Configuration-related → Fix forward if possible
- Critical and unexplained → ROLLBACK
```

#### Step 2: Revert DNS Records

**In GoDaddy DNS Console:**

1. **Revert A Record**
   - Change `@` A record back to previous value
   - (Retrieve from backup_dns_a.txt)

2. **Revert CNAME Records**
   - Restore original CNAME targets from backup files

3. **Save all changes**

#### Step 3: Wait for Propagation

```bash
# Monitor propagation every 2 minutes
watch -n 120 "dig example.com A +short"

# Expected: Original IP address
```

#### Step 4: Verify Rollback

```bash
# Run validation against old infrastructure
curl -I https://example.com
# Expected: 200 OK from previous hosting
```

### Rollback Timeline

| Time | Expected State |
|------|----------------|
| T+0 | DNS records updated in GoDaddy |
| T+5 min | Some resolvers see old records |
| T+10 min | Most resolvers see old records |
| T+30 min | Near-complete propagation |
| T+60 min | Full propagation expected |

---

## Post-Cutover Verification

### Immediate Checks (T+15 minutes)

```bash
# 1. Verify all domains resolve correctly
dig example.com A +short           # → 76.76.21.21
dig app.example.com CNAME +short   # → cname.vercel-dns.com
dig api.example.com CNAME +short   # → *.railway.app

# 2. Verify HTTPS works
curl -I https://example.com
curl -I https://app.example.com
curl -I https://api.example.com/health

# 3. Verify no certificate warnings
echo | openssl s_client -connect example.com:443 2>/dev/null | grep "Verify return code"
# Expected: Verify return code: 0 (ok)
```

### Functional Checks (T+30 minutes)

- [ ] User can access marketing site
- [ ] User can log in via app.example.com
- [ ] API requests succeed from frontend
- [ ] Webhooks are receiving events
- [ ] File uploads working
- [ ] Email delivery working

### Extended Monitoring (T+24 hours)

- [ ] Error rates in Vercel Analytics
- [ ] Error rates in Railway Logs
- [ ] No SSL certificate warnings
- [ ] No CORS errors in browser console
- [ ] Session persistence working
- [ ] All cron jobs executed successfully

### TTL Restoration (T+48 hours)

After 48 hours of stability:

1. **Increase TTLs in GoDaddy:**
   ```
   A (@): 300 → 3600
   CNAME (app): 300 → 3600
   CNAME (api): 300 → 600
   CNAME (www): 300 → 3600
   ```

2. **Document final configuration**

---

## Troubleshooting

### DNS Not Propagating

```bash
# Check if GoDaddy shows correct records
# Verify no conflicting records exist

# Force local DNS cache clear (macOS)
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Force local DNS cache clear (Windows)
ipconfig /flushdns
```

### SSL Certificate Not Issued

**Vercel:**
1. Remove and re-add custom domain
2. Check domain ownership verification
3. Wait up to 24 hours for certificate

**Railway:**
1. Check Railway dashboard for certificate status
2. Ensure CNAME is correctly pointing
3. Contact Railway support if persistent

### CORS Errors After Cutover

```bash
# Verify API is returning correct CORS headers
curl -I -X OPTIONS https://api.example.com \
  -H "Origin: https://app.example.com" \
  -H "Access-Control-Request-Method: POST"

# Expected headers:
# Access-Control-Allow-Origin: https://app.example.com
# Access-Control-Allow-Credentials: true
```

**Fix:** Update CORS configuration in Railway environment variables.

---

## Contacts

| Role | Contact | Availability |
|------|---------|--------------|
| DNS Administrator | (your contact) | During cutover |
| Platform Lead | (your contact) | During cutover |
| On-Call Engineer | (your contact) | 24/7 |
| GoDaddy Support | 480-505-8877 | 24/7 |
| Vercel Support | support@vercel.com | Business hours |
| Railway Support | support@railway.app | Business hours |
