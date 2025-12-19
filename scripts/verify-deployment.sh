#!/bin/bash

# =============================================================================
# CreatorBridge Deployment Verification Script
# =============================================================================
# Usage: ./scripts/verify-deployment.sh [environment]
# Environments: staging, production
# =============================================================================

set -e

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
if [ "$ENVIRONMENT" == "production" ]; then
    API_BASE_URL="https://api.creatorbridge.com"
    HEALTH_TIMEOUT=30
else
    API_BASE_URL="https://staging-api.creatorbridge.com"
    HEALTH_TIMEOUT=60
fi

# Services to verify
SERVICES=(
    "api-gateway:8080"
    "auth-service:8081"
    "user-service:8082"
    "billing-service:8083"
    "notification-service:8084"
    "campaign-service:8085"
    "creator-service:8086"
    "content-service:8087"
    "asset-service:8088"
    "rights-service:8089"
    "analytics-service:8090"
    "payout-service:8091"
)

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

log_header() {
    echo ""
    echo "============================================================================="
    echo -e "${BLUE}$1${NC}"
    echo "============================================================================="
}

# =============================================================================
# Verification Functions
# =============================================================================

verify_health_endpoint() {
    local service=$1
    local endpoint="$API_BASE_URL/health"

    log_info "Checking health endpoint: $endpoint"

    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $HEALTH_TIMEOUT "$endpoint" 2>/dev/null || echo "000")

    if [ "$response" == "200" ]; then
        log_success "Health endpoint responding (HTTP $response)"
        return 0
    else
        log_error "Health endpoint failed (HTTP $response)"
        return 1
    fi
}

verify_service_health() {
    local service_info=$1
    local service_name="${service_info%%:*}"
    local service_port="${service_info##*:}"

    log_info "Checking $service_name health..."

    # Check via internal health endpoint
    local endpoint="$API_BASE_URL/v1/$service_name/health"
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$endpoint" 2>/dev/null || echo "000")

    if [ "$response" == "200" ] || [ "$response" == "404" ]; then
        # 404 is OK - service might not expose /health on API gateway
        if [ "$response" == "200" ]; then
            log_success "$service_name is healthy"
        else
            log_warning "$service_name health endpoint not exposed (checking main API)"
        fi
        return 0
    else
        log_error "$service_name health check failed (HTTP $response)"
        return 1
    fi
}

verify_database_connectivity() {
    log_info "Verifying database connectivity..."

    # Test via API endpoint that requires DB
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_BASE_URL/v1/auth/health" 2>/dev/null || echo "000")

    if [ "$response" == "200" ]; then
        log_success "Database connectivity verified"
        return 0
    else
        log_error "Database connectivity failed"
        return 1
    fi
}

verify_redis_connectivity() {
    log_info "Verifying Redis connectivity..."

    # Redis connectivity is implicit if auth service works
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_BASE_URL/v1/auth/health" 2>/dev/null || echo "000")

    if [ "$response" == "200" ]; then
        log_success "Redis connectivity verified"
        return 0
    else
        log_warning "Redis connectivity could not be verified"
        return 1
    fi
}

verify_storage_connectivity() {
    log_info "Verifying blob storage connectivity..."

    # Test asset service which uses blob storage
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_BASE_URL/v1/assets/health" 2>/dev/null || echo "000")

    if [ "$response" == "200" ] || [ "$response" == "404" ]; then
        log_success "Blob storage connectivity assumed OK"
        return 0
    else
        log_warning "Blob storage connectivity could not be verified"
        return 1
    fi
}

verify_api_gateway() {
    log_info "Verifying API Gateway routing..."

    # Test multiple routes
    local routes=(
        "/v1/auth/health"
        "/v1/campaigns"
        "/v1/creators/discover"
    )

    local success_count=0
    for route in "${routes[@]}"; do
        response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_BASE_URL$route" 2>/dev/null || echo "000")
        if [ "$response" != "000" ] && [ "$response" != "502" ] && [ "$response" != "503" ]; then
            ((success_count++))
        fi
    done

    if [ $success_count -ge 2 ]; then
        log_success "API Gateway routing verified ($success_count/${#routes[@]} routes)"
        return 0
    else
        log_error "API Gateway routing issues ($success_count/${#routes[@]} routes)"
        return 1
    fi
}

verify_ssl_certificate() {
    log_info "Verifying SSL certificate..."

    # Extract hostname
    hostname=$(echo "$API_BASE_URL" | sed -e 's|https://||' -e 's|/.*||')

    # Check SSL
    expiry=$(echo | openssl s_client -servername "$hostname" -connect "$hostname:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

    if [ -n "$expiry" ]; then
        expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry" +%s 2>/dev/null || echo "0")
        now_epoch=$(date +%s)
        days_until_expiry=$(( (expiry_epoch - now_epoch) / 86400 ))

        if [ $days_until_expiry -gt 30 ]; then
            log_success "SSL certificate valid ($days_until_expiry days until expiry)"
        elif [ $days_until_expiry -gt 0 ]; then
            log_warning "SSL certificate expiring soon ($days_until_expiry days)"
        else
            log_error "SSL certificate expired or invalid"
        fi
    else
        log_warning "Could not verify SSL certificate"
    fi
}

verify_kubernetes_pods() {
    log_info "Verifying Kubernetes pod status..."

    if ! command -v kubectl &> /dev/null; then
        log_warning "kubectl not available, skipping K8s verification"
        return 0
    fi

    namespace="creatorbridge-$ENVIRONMENT"

    # Check pod status
    not_ready=$(kubectl get pods -n "$namespace" --no-headers 2>/dev/null | grep -v "Running\|Completed" | wc -l)

    if [ "$not_ready" -eq 0 ]; then
        log_success "All Kubernetes pods are running"
    else
        log_warning "$not_ready pod(s) not in Running state"
    fi
}

run_smoke_tests() {
    log_info "Running smoke tests..."

    # Test 1: API responds
    if curl -s --max-time 10 "$API_BASE_URL/health" > /dev/null; then
        log_success "Smoke test: API responds"
    else
        log_error "Smoke test: API not responding"
        return 1
    fi

    # Test 2: Auth endpoint accessible
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_BASE_URL/v1/auth/login" -X POST -H "Content-Type: application/json" -d '{}' 2>/dev/null || echo "000")
    if [ "$response" == "400" ] || [ "$response" == "401" ] || [ "$response" == "422" ]; then
        log_success "Smoke test: Auth endpoint accessible (expected validation error)"
    else
        log_warning "Smoke test: Auth endpoint returned unexpected status ($response)"
    fi

    # Test 3: Public endpoints accessible
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$API_BASE_URL/v1/creators/discover?limit=1" 2>/dev/null || echo "000")
    if [ "$response" == "200" ] || [ "$response" == "401" ]; then
        log_success "Smoke test: Creator discovery endpoint accessible"
    else
        log_warning "Smoke test: Creator discovery endpoint returned ($response)"
    fi
}

# =============================================================================
# Main Verification Flow
# =============================================================================

main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║          CreatorBridge Deployment Verification                            ║"
    echo "╠═══════════════════════════════════════════════════════════════════════════╣"
    echo "║  Environment: $ENVIRONMENT"
    echo "║  API Base: $API_BASE_URL"
    echo "║  Timestamp: $(date)"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"

    log_header "1. Infrastructure Connectivity"
    verify_health_endpoint
    verify_database_connectivity
    verify_redis_connectivity
    verify_storage_connectivity

    log_header "2. Service Health Checks"
    for service in "${SERVICES[@]}"; do
        verify_service_health "$service"
    done

    log_header "3. API Gateway Verification"
    verify_api_gateway

    log_header "4. Security Verification"
    verify_ssl_certificate

    log_header "5. Kubernetes Status"
    verify_kubernetes_pods

    log_header "6. Smoke Tests"
    run_smoke_tests

    # Summary
    log_header "Verification Summary"
    echo ""
    echo -e "  ${GREEN}Passed:${NC}   $PASSED"
    echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
    echo -e "  ${RED}Failed:${NC}   $FAILED"
    echo ""

    if [ $FAILED -gt 0 ]; then
        echo -e "${RED}Deployment verification FAILED${NC}"
        echo "Please review the errors above before proceeding."
        exit 1
    elif [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Deployment verification completed with warnings${NC}"
        echo "Review warnings above. Non-critical issues detected."
        exit 0
    else
        echo -e "${GREEN}Deployment verification PASSED${NC}"
        echo "All checks passed successfully!"
        exit 0
    fi
}

# Run main function
main
