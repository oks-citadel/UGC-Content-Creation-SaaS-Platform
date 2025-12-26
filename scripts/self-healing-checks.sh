#!/bin/bash
# =============================================================================
# NEXUS Platform Self-Healing Validation
# Infrastructure + Identity + Authorization Checks
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration (override via environment)
PLATFORM_NAME="${PLATFORM_NAME:-nexus}"
DOMAIN="${DOMAIN:-}"
API_ENDPOINT="${API_ENDPOINT:-https://api.${DOMAIN}}"
B2C_TENANT="${B2C_TENANT:-}"
FRONT_DOOR_ID="${FRONT_DOOR_ID:-}"
ENVIRONMENT="${ENVIRONMENT:-staging}"

# Counters
PASSED=0
FAILED=0
WARNINGS=0
SKIPPED=0

# Logging functions
log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; ((PASSED++)); }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; ((FAILED++)); }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; ((WARNINGS++)); }
log_skip() { echo -e "${CYAN}[SKIP]${NC} $1"; ((SKIPPED++)); }
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_section() { echo -e "\n${BLUE}========== $1 ==========${NC}"; }

# =============================================================================
# INFRASTRUCTURE CHECKS
# =============================================================================

check_dns() {
    log_section "DNS CHECKS"

    if [[ -z "$DOMAIN" ]]; then
        log_skip "Domain not configured - skipping DNS checks"
        return
    fi

    # Check nameservers
    NS=$(dig NS "$DOMAIN" +short 2>/dev/null | head -1 || echo "")
    if [[ "$NS" == *"azure-dns"* ]]; then
        log_pass "Nameservers point to Azure DNS"
    elif [[ -n "$NS" ]]; then
        log_warn "Nameservers NOT Azure DNS: $NS"
    else
        log_fail "Could not resolve nameservers for $DOMAIN"
    fi

    # Check apex record
    APEX=$(dig A "$DOMAIN" +short 2>/dev/null || echo "")
    if [[ -n "$APEX" ]]; then
        log_pass "Apex A record exists: $APEX"
    else
        log_warn "Apex A record missing"
    fi

    # Check subdomains
    for subdomain in api app www; do
        RECORD=$(dig CNAME "${subdomain}.${DOMAIN}" +short 2>/dev/null || echo "")
        if [[ -n "$RECORD" ]]; then
            log_pass "${subdomain}.${DOMAIN} CNAME exists"
        else
            log_warn "${subdomain}.${DOMAIN} CNAME missing"
        fi
    done

    # Check email records
    MX=$(dig MX "$DOMAIN" +short 2>/dev/null || echo "")
    SPF=$(dig TXT "$DOMAIN" +short 2>/dev/null | grep -i "v=spf1" || echo "")
    DMARC=$(dig TXT "_dmarc.$DOMAIN" +short 2>/dev/null || echo "")

    [[ -n "$MX" ]] && log_pass "MX record exists" || log_warn "MX record missing"
    [[ -n "$SPF" ]] && log_pass "SPF record exists" || log_warn "SPF record missing"
    [[ -n "$DMARC" ]] && log_pass "DMARC record exists" || log_warn "DMARC record missing"
}

check_tls() {
    log_section "TLS CHECKS"

    if [[ -z "$DOMAIN" ]]; then
        log_skip "Domain not configured - skipping TLS checks"
        return
    fi

    # Check TLS certificate
    CERT_INFO=$(echo | timeout 5 openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null || echo "")

    if [[ -z "$CERT_INFO" ]]; then
        log_fail "Could not connect to $DOMAIN:443"
        return
    fi

    # Extract expiry date
    EXPIRY=$(echo "$CERT_INFO" | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "")

    if [[ -n "$EXPIRY" ]]; then
        log_pass "TLS certificate present"

        # Calculate days until expiry
        if command -v date &> /dev/null; then
            EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY" +%s 2>/dev/null || echo "0")
            if [[ "$EXPIRY_EPOCH" != "0" ]]; then
                DAYS_LEFT=$(( (EXPIRY_EPOCH - $(date +%s)) / 86400 ))

                if [[ $DAYS_LEFT -gt 30 ]]; then
                    log_pass "Certificate valid for $DAYS_LEFT days"
                elif [[ $DAYS_LEFT -gt 7 ]]; then
                    log_warn "Certificate expires in $DAYS_LEFT days"
                else
                    log_fail "Certificate expires in $DAYS_LEFT days (CRITICAL)"
                fi
            fi
        fi
    else
        log_fail "TLS certificate missing or invalid"
    fi

    # Check TLS version
    TLS_VERSION=$(echo "$CERT_INFO" | grep "Protocol" | head -1 || echo "")
    if [[ "$TLS_VERSION" == *"TLSv1.2"* ]] || [[ "$TLS_VERSION" == *"TLSv1.3"* ]]; then
        log_pass "TLS 1.2+ supported"
    elif [[ -n "$TLS_VERSION" ]]; then
        log_warn "TLS version: $TLS_VERSION"
    fi
}

check_https_enforcement() {
    log_section "HTTPS ENFORCEMENT"

    if [[ -z "$DOMAIN" ]]; then
        log_skip "Domain not configured - skipping HTTPS checks"
        return
    fi

    # Check HTTP redirect
    HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}|%{redirect_url}" "http://$DOMAIN" --max-time 10 2>/dev/null || echo "000|")
    HTTP_CODE=$(echo "$HTTP_RESPONSE" | cut -d'|' -f1)
    REDIRECT_URL=$(echo "$HTTP_RESPONSE" | cut -d'|' -f2)

    if [[ "$HTTP_CODE" == "301" ]] || [[ "$HTTP_CODE" == "302" ]] || [[ "$HTTP_CODE" == "308" ]]; then
        if [[ "$REDIRECT_URL" == *"https://"* ]]; then
            log_pass "HTTP redirects to HTTPS (${HTTP_CODE})"
        else
            log_warn "HTTP redirects but not to HTTPS: $REDIRECT_URL"
        fi
    elif [[ "$HTTP_CODE" == "000" ]]; then
        log_warn "HTTP connection failed (might be blocked, which is OK)"
    else
        log_fail "HTTP does NOT redirect: $HTTP_CODE"
    fi

    # Check HTTPS
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" --max-time 10 2>/dev/null || echo "000")

    if [[ "$HTTPS_CODE" == "200" ]] || [[ "$HTTPS_CODE" == "301" ]] || [[ "$HTTPS_CODE" == "302" ]]; then
        log_pass "HTTPS returns valid response: $HTTPS_CODE"
    elif [[ "$HTTPS_CODE" == "000" ]]; then
        log_fail "HTTPS connection failed"
    else
        log_fail "HTTPS returns: $HTTPS_CODE"
    fi
}

check_frontdoor() {
    log_section "FRONT DOOR CHECKS"

    if [[ -z "$DOMAIN" ]]; then
        log_skip "Domain not configured - skipping Front Door checks"
        return
    fi

    HEADERS=$(curl -s -I "https://$DOMAIN" --max-time 10 2>/dev/null || echo "")

    # Check for Azure Front Door headers
    if echo "$HEADERS" | grep -qi "x-azure-ref"; then
        log_pass "Traffic routed through Azure Front Door"
    else
        log_warn "Cannot confirm Front Door routing (x-azure-ref header missing)"
    fi

    # Check for WAF headers
    if echo "$HEADERS" | grep -qi "x-ms-defender"; then
        log_pass "WAF headers present"
    fi
}

# =============================================================================
# IDENTITY CHECKS
# =============================================================================

check_identity() {
    log_section "IDENTITY CHECKS"

    if [[ -z "$B2C_TENANT" ]]; then
        log_skip "B2C tenant not configured - skipping identity checks"
        return
    fi

    # Check B2C OpenID configuration
    B2C_POLICY="${B2C_POLICY:-B2C_1_SignUpSignIn}"
    OIDC_URL="https://${B2C_TENANT}.b2clogin.com/${B2C_TENANT}.onmicrosoft.com/${B2C_POLICY}/v2.0/.well-known/openid-configuration"

    B2C_META=$(curl -s "$OIDC_URL" --max-time 10 2>/dev/null || echo "")

    if [[ "$B2C_META" == *"authorization_endpoint"* ]]; then
        log_pass "B2C tenant accessible"
        log_pass "OpenID configuration available"
    else
        log_fail "B2C tenant not accessible or misconfigured"
        return
    fi

    # Check JWKS endpoint
    JWKS_URI=$(echo "$B2C_META" | grep -o '"jwks_uri":"[^"]*"' | cut -d'"' -f4 || echo "")
    if [[ -n "$JWKS_URI" ]]; then
        JWKS=$(curl -s "$JWKS_URI" --max-time 10 2>/dev/null || echo "")
        if [[ "$JWKS" == *"keys"* ]]; then
            log_pass "JWKS endpoint accessible"
        else
            log_fail "JWKS endpoint returned invalid response"
        fi
    fi
}

check_security_groups() {
    log_section "SECURITY GROUPS"

    if ! command -v az &> /dev/null; then
        log_skip "Azure CLI not available - skipping group checks"
        return
    fi

    if ! az account show &> /dev/null 2>&1; then
        log_skip "Azure CLI not authenticated - skipping group checks"
        return
    fi

    log_info "Checking security groups for ${PLATFORM_NAME}-${ENVIRONMENT}..."

    # Check subscription tier groups
    for TIER in free starter growth pro business enterprise; do
        GROUP_NAME="${PLATFORM_NAME}-${TIER}-${ENVIRONMENT}"
        COUNT=$(az ad group list --display-name "$GROUP_NAME" --query "length(@)" -o tsv 2>/dev/null || echo "0")
        if [[ "$COUNT" -gt 0 ]]; then
            log_pass "Group exists: $GROUP_NAME"
        else
            log_fail "Group missing: $GROUP_NAME"
        fi
    done

    # Check special groups
    for GROUP in verified support admin suspended; do
        GROUP_NAME="${PLATFORM_NAME}-${GROUP}-${ENVIRONMENT}"
        COUNT=$(az ad group list --display-name "$GROUP_NAME" --query "length(@)" -o tsv 2>/dev/null || echo "0")
        if [[ "$COUNT" -gt 0 ]]; then
            log_pass "Group exists: $GROUP_NAME"
        else
            log_fail "Group missing: $GROUP_NAME"
        fi
    done
}

# =============================================================================
# API HEALTH CHECKS
# =============================================================================

check_api() {
    log_section "API HEALTH CHECKS"

    if [[ -z "$API_ENDPOINT" ]] || [[ "$API_ENDPOINT" == "https://api." ]]; then
        log_skip "API endpoint not configured - skipping API checks"
        return
    fi

    # Health endpoint
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT/health" --max-time 10 2>/dev/null || echo "000")

    if [[ "$HEALTH" == "200" ]]; then
        log_pass "API health endpoint OK"
    elif [[ "$HEALTH" == "000" ]]; then
        log_fail "API health endpoint unreachable"
    else
        log_fail "API health endpoint: $HEALTH"
    fi

    # Readiness endpoint
    READY=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT/health/ready" --max-time 10 2>/dev/null || echo "000")

    if [[ "$READY" == "200" ]]; then
        log_pass "API readiness endpoint OK"
    elif [[ "$READY" == "404" ]]; then
        log_warn "API readiness endpoint not found (optional)"
    else
        log_fail "API readiness endpoint: $READY"
    fi

    # Auth check (should return 401 without token)
    AUTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT/api/v1/me" --max-time 10 2>/dev/null || echo "000")

    if [[ "$AUTH_CHECK" == "401" ]]; then
        log_pass "API properly rejects unauthenticated requests"
    elif [[ "$AUTH_CHECK" == "404" ]]; then
        log_warn "API /me endpoint not found"
    elif [[ "$AUTH_CHECK" == "200" ]]; then
        log_fail "API allows unauthenticated access to protected endpoint!"
    else
        log_warn "API auth check returned: $AUTH_CHECK"
    fi

    # Origin protection check (should fail without Front Door header)
    if [[ -n "$FRONT_DOOR_ID" ]]; then
        ORIGIN_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT/health" -H "X-Azure-FDID: invalid-id" --max-time 10 2>/dev/null || echo "000")
        if [[ "$ORIGIN_CHECK" == "403" ]]; then
            log_pass "API validates origin protection header"
        else
            log_warn "API may not validate origin protection (returned: $ORIGIN_CHECK)"
        fi
    fi
}

# =============================================================================
# KUBERNETES CHECKS
# =============================================================================

check_kubernetes() {
    log_section "KUBERNETES CHECKS"

    if ! command -v kubectl &> /dev/null; then
        log_skip "kubectl not available - skipping K8s checks"
        return
    fi

    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null 2>&1; then
        log_skip "Kubernetes cluster not accessible"
        return
    fi

    NAMESPACE="${PLATFORM_NAME}"

    # Check namespace exists
    if kubectl get namespace "$NAMESPACE" &> /dev/null 2>&1; then
        log_pass "Namespace exists: $NAMESPACE"
    else
        log_warn "Namespace not found: $NAMESPACE"
        return
    fi

    # Check pod health
    UNHEALTHY=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null | grep -v "Running\|Completed" | wc -l || echo "0")

    if [[ "$UNHEALTHY" -eq 0 ]]; then
        log_pass "All pods healthy"
    else
        log_fail "$UNHEALTHY unhealthy pods"
        kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null | grep -v "Running\|Completed" || true
    fi

    # Check deployments
    READY_DEPS=$(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].status.readyReplicas}' 2>/dev/null | tr ' ' '+' || echo "0")
    TOTAL_DEPS=$(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].status.replicas}' 2>/dev/null | tr ' ' '+' || echo "0")

    log_info "Deployments: ready replicas check"

    # Check network policies
    NETPOL=$(kubectl get networkpolicies -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l || echo "0")

    if [[ "$NETPOL" -gt 0 ]]; then
        log_pass "Network policies configured: $NETPOL"
    else
        log_warn "No network policies found"
    fi

    # Check secrets exist
    SECRETS=$(kubectl get secrets -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l || echo "0")
    if [[ "$SECRETS" -gt 0 ]]; then
        log_pass "Secrets configured: $SECRETS"
    else
        log_warn "No secrets found in namespace"
    fi
}

# =============================================================================
# DATABASE CHECKS
# =============================================================================

check_databases() {
    log_section "DATABASE CHECKS"

    # PostgreSQL check (if psql available)
    if command -v psql &> /dev/null && [[ -n "${DATABASE_URL:-}" ]]; then
        if psql "$DATABASE_URL" -c "SELECT 1" &> /dev/null 2>&1; then
            log_pass "PostgreSQL connection OK"
        else
            log_fail "PostgreSQL connection failed"
        fi
    else
        log_skip "PostgreSQL check skipped (psql not available or DATABASE_URL not set)"
    fi

    # Redis check (if redis-cli available)
    if command -v redis-cli &> /dev/null && [[ -n "${REDIS_URL:-}" ]]; then
        if redis-cli -u "$REDIS_URL" ping &> /dev/null 2>&1; then
            log_pass "Redis connection OK"
        else
            log_fail "Redis connection failed"
        fi
    else
        log_skip "Redis check skipped (redis-cli not available or REDIS_URL not set)"
    fi
}

# =============================================================================
# SUMMARY
# =============================================================================

print_summary() {
    echo ""
    echo "============================================"
    echo "   ${PLATFORM_NAME^^} VALIDATION SUMMARY"
    echo "   Environment: ${ENVIRONMENT}"
    echo "   Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "============================================"
    echo -e "Passed:   ${GREEN}$PASSED${NC}"
    echo -e "Failed:   ${RED}$FAILED${NC}"
    echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
    echo -e "Skipped:  ${CYAN}$SKIPPED${NC}"
    echo "============================================"

    if [[ $FAILED -gt 0 ]]; then
        echo -e "${RED}VALIDATION FAILED${NC}"
        echo ""
        echo "Please address the failed checks before proceeding."
        exit 1
    elif [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}PASSED WITH WARNINGS${NC}"
        echo ""
        echo "Review warnings to ensure they are expected."
        exit 0
    else
        echo -e "${GREEN}ALL CHECKS PASSED${NC}"
        exit 0
    fi
}

# =============================================================================
# MAIN
# =============================================================================

main() {
    echo "============================================"
    echo "  ${PLATFORM_NAME^^} Self-Healing Validation"
    echo "  Environment: ${ENVIRONMENT}"
    echo "  Domain: ${DOMAIN:-'not configured'}"
    echo "  Time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "============================================"

    check_dns
    check_tls
    check_https_enforcement
    check_frontdoor
    check_identity
    check_security_groups
    check_api
    check_kubernetes
    check_databases

    print_summary
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --b2c-tenant)
            B2C_TENANT="$2"
            shift 2
            ;;
        --api-endpoint)
            API_ENDPOINT="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --domain DOMAIN           Primary domain name"
            echo "  --environment ENV         Environment (staging/prod)"
            echo "  --b2c-tenant TENANT       B2C tenant name"
            echo "  --api-endpoint URL        API endpoint URL"
            echo "  --help                    Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

main "$@"
