#!/bin/bash

# =============================================================================
# CreatorBridge Master Deployment Script
# =============================================================================
# Usage: ./scripts/deploy.sh [environment] [options]
# Environments: staging, production
# Options:
#   --skip-backup    Skip database backup before deployment
#   --skip-tests     Skip running tests before deployment
#   --skip-verify    Skip deployment verification
#   --force          Force deployment without confirmations
#   --rollback       Rollback to previous version
# =============================================================================

set -e

# Configuration
ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${PROJECT_ROOT}/logs/deploy_${TIMESTAMP}.log"

# Parse options
SKIP_BACKUP=false
SKIP_TESTS=false
SKIP_VERIFY=false
FORCE_DEPLOY=false
ROLLBACK=false

shift || true
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-backup) SKIP_BACKUP=true; shift ;;
    --skip-tests) SKIP_TESTS=true; shift ;;
    --skip-verify) SKIP_VERIFY=true; shift ;;
    --force) FORCE_DEPLOY=true; shift ;;
    --rollback) ROLLBACK=true; shift ;;
    *) shift ;;
  esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1" | tee -a "$LOG_FILE"; }

# Environment configuration
if [ "$ENVIRONMENT" == "production" ]; then
    K8S_NAMESPACE="creatorbridge-production"
    K8S_CONTEXT="creatorbridge-prod-aks"
    DOCKER_REGISTRY="creatorbridge.azurecr.io"
    DOMAIN="api.creatorbridge.com"
else
    K8S_NAMESPACE="creatorbridge-staging"
    K8S_CONTEXT="creatorbridge-staging-aks"
    DOCKER_REGISTRY="creatorbridgestaging.azurecr.io"
    DOMAIN="api-staging.creatorbridge.com"
fi

# Services to deploy (in order)
SERVICES=(
    "auth-service"
    "user-service"
    "billing-service"
    "campaign-service"
    "creator-service"
    "content-service"
    "asset-service"
    "rights-service"
    "payout-service"
    "notification-service"
    "analytics-service"
    "api-gateway"
)

# =============================================================================
# Pre-deployment Checks
# =============================================================================

check_prerequisites() {
    log_step "Checking prerequisites..."

    # Check required tools
    local required_tools=("kubectl" "docker" "az" "helm" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed"
            exit 1
        fi
    done

    # Check Kubernetes context
    if ! kubectl config use-context "$K8S_CONTEXT" &> /dev/null; then
        log_error "Cannot switch to Kubernetes context: $K8S_CONTEXT"
        exit 1
    fi

    # Check Azure login
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure. Run 'az login' first."
        exit 1
    fi

    # Check ACR login
    if ! az acr login --name "${DOCKER_REGISTRY%.azurecr.io}" &> /dev/null; then
        log_error "Cannot login to Azure Container Registry"
        exit 1
    fi

    log_success "All prerequisites met"
}

confirm_deployment() {
    if [ "$FORCE_DEPLOY" == "true" ]; then
        return 0
    fi

    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║              CreatorBridge Deployment                                     ║"
    echo "╠═══════════════════════════════════════════════════════════════════════════╣"
    echo "║  Environment: $ENVIRONMENT"
    echo "║  Namespace: $K8S_NAMESPACE"
    echo "║  Registry: $DOCKER_REGISTRY"
    echo "║  Domain: $DOMAIN"
    echo "║  Timestamp: $TIMESTAMP"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo ""

    if [ "$ENVIRONMENT" == "production" ]; then
        echo -e "${RED}⚠️  WARNING: You are deploying to PRODUCTION${NC}"
        read -p "Type 'DEPLOY PRODUCTION' to continue: " confirm
        if [ "$confirm" != "DEPLOY PRODUCTION" ]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    else
        read -p "Continue with deployment? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    fi
}

# =============================================================================
# Build Phase
# =============================================================================

run_tests() {
    if [ "$SKIP_TESTS" == "true" ]; then
        log_warning "Skipping tests (--skip-tests)"
        return 0
    fi

    log_step "Running tests..."

    cd "$PROJECT_ROOT"

    # Run unit tests
    log_info "Running unit tests..."
    if ! pnpm test:run 2>&1 | tee -a "$LOG_FILE"; then
        log_error "Unit tests failed"
        exit 1
    fi

    # Run type check
    log_info "Running type check..."
    if ! pnpm type-check 2>&1 | tee -a "$LOG_FILE"; then
        log_error "Type check failed"
        exit 1
    fi

    # Run linting
    log_info "Running linting..."
    if ! pnpm lint 2>&1 | tee -a "$LOG_FILE"; then
        log_error "Linting failed"
        exit 1
    fi

    log_success "All tests passed"
}

build_services() {
    log_step "Building services..."

    local failed=0
    local git_sha=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
    local image_tag="${TIMESTAMP}-${git_sha}"

    for service in "${SERVICES[@]}"; do
        log_info "Building $service..."

        local dockerfile="${PROJECT_ROOT}/services/${service}/Dockerfile"
        local image="${DOCKER_REGISTRY}/${service}:${image_tag}"

        if [ ! -f "$dockerfile" ]; then
            # Use default Dockerfile if service-specific one doesn't exist
            dockerfile="${PROJECT_ROOT}/infrastructure/docker/Dockerfile.service"
        fi

        if docker build \
            -f "$dockerfile" \
            -t "$image" \
            -t "${DOCKER_REGISTRY}/${service}:latest" \
            --build-arg SERVICE_NAME="${service}" \
            --build-arg BUILD_TIME="${TIMESTAMP}" \
            --build-arg GIT_SHA="${git_sha}" \
            "${PROJECT_ROOT}" 2>&1 | tee -a "$LOG_FILE"; then
            log_success "Built: $image"
        else
            log_error "Failed to build $service"
            ((failed++))
        fi
    done

    if [ $failed -gt 0 ]; then
        log_error "$failed service(s) failed to build"
        exit 1
    fi

    # Save image tag for later use
    echo "$image_tag" > "${PROJECT_ROOT}/.last-image-tag"
}

push_images() {
    log_step "Pushing images to registry..."

    local image_tag=$(cat "${PROJECT_ROOT}/.last-image-tag")

    for service in "${SERVICES[@]}"; do
        log_info "Pushing $service..."

        docker push "${DOCKER_REGISTRY}/${service}:${image_tag}" 2>&1 | tee -a "$LOG_FILE"
        docker push "${DOCKER_REGISTRY}/${service}:latest" 2>&1 | tee -a "$LOG_FILE"

        log_success "Pushed $service"
    done
}

# =============================================================================
# Database Phase
# =============================================================================

backup_databases() {
    if [ "$SKIP_BACKUP" == "true" ]; then
        log_warning "Skipping database backup (--skip-backup)"
        return 0
    fi

    log_step "Backing up databases..."

    if [ -f "${SCRIPT_DIR}/backup-databases.sh" ]; then
        bash "${SCRIPT_DIR}/backup-databases.sh" "$ENVIRONMENT"
    else
        log_warning "Backup script not found, skipping..."
    fi
}

run_migrations() {
    log_step "Running database migrations..."

    for service in "${SERVICES[@]}"; do
        local migration_dir="${PROJECT_ROOT}/services/${service}/prisma/migrations"

        if [ -d "$migration_dir" ]; then
            log_info "Running migrations for $service..."

            # Execute migrations via Kubernetes job
            kubectl run "${service}-migrate-${TIMESTAMP}" \
                --namespace="$K8S_NAMESPACE" \
                --image="${DOCKER_REGISTRY}/${service}:latest" \
                --restart=Never \
                --rm \
                --wait \
                -- npx prisma migrate deploy 2>&1 | tee -a "$LOG_FILE" || true

            log_success "Migrations complete for $service"
        fi
    done
}

# =============================================================================
# Deployment Phase
# =============================================================================

deploy_services() {
    log_step "Deploying services..."

    local image_tag=$(cat "${PROJECT_ROOT}/.last-image-tag")
    local failed=0

    for service in "${SERVICES[@]}"; do
        log_info "Deploying $service..."

        # Update deployment with new image
        if kubectl set image deployment/"$service" \
            "$service=${DOCKER_REGISTRY}/${service}:${image_tag}" \
            --namespace="$K8S_NAMESPACE" 2>&1 | tee -a "$LOG_FILE"; then

            # Wait for rollout
            if kubectl rollout status deployment/"$service" \
                --namespace="$K8S_NAMESPACE" \
                --timeout=300s 2>&1 | tee -a "$LOG_FILE"; then
                log_success "Deployed $service"
            else
                log_error "Rollout failed for $service"
                ((failed++))
            fi
        else
            log_warning "Deployment $service not found, creating..."
            kubectl apply -f "${PROJECT_ROOT}/infrastructure/k8s/${ENVIRONMENT}/${service}.yaml" \
                --namespace="$K8S_NAMESPACE" 2>&1 | tee -a "$LOG_FILE" || ((failed++))
        fi
    done

    if [ $failed -gt 0 ]; then
        log_error "$failed service(s) failed to deploy"
        return 1
    fi
}

# =============================================================================
# Verification Phase
# =============================================================================

verify_deployment() {
    if [ "$SKIP_VERIFY" == "true" ]; then
        log_warning "Skipping deployment verification (--skip-verify)"
        return 0
    fi

    log_step "Verifying deployment..."

    if [ -f "${SCRIPT_DIR}/verify-deployment.sh" ]; then
        bash "${SCRIPT_DIR}/verify-deployment.sh" "$ENVIRONMENT"
    else
        # Basic verification
        local failed=0

        for service in "${SERVICES[@]}"; do
            local ready=$(kubectl get deployment "$service" \
                --namespace="$K8S_NAMESPACE" \
                -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

            if [ "$ready" -gt 0 ]; then
                log_success "$service is ready ($ready replicas)"
            else
                log_error "$service is not ready"
                ((failed++))
            fi
        done

        if [ $failed -gt 0 ]; then
            log_error "$failed service(s) are not ready"
            return 1
        fi
    fi
}

# =============================================================================
# Rollback
# =============================================================================

rollback_deployment() {
    log_step "Rolling back deployment..."

    for service in "${SERVICES[@]}"; do
        log_info "Rolling back $service..."

        kubectl rollout undo deployment/"$service" \
            --namespace="$K8S_NAMESPACE" 2>&1 | tee -a "$LOG_FILE" || true

        kubectl rollout status deployment/"$service" \
            --namespace="$K8S_NAMESPACE" \
            --timeout=300s 2>&1 | tee -a "$LOG_FILE" || true
    done

    log_success "Rollback complete"
}

# =============================================================================
# Notifications
# =============================================================================

send_notification() {
    local status=$1
    local message=$2

    # Slack notification (if webhook configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        [ "$status" == "failure" ] && color="danger"

        curl -s -X POST "$SLACK_WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"CreatorBridge Deployment - $ENVIRONMENT\",
                    \"text\": \"$message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Timestamp\", \"value\": \"$TIMESTAMP\", \"short\": true}
                    ]
                }]
            }" 2>/dev/null || true
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    mkdir -p "$(dirname "$LOG_FILE")"

    echo ""
    echo "════════════════════════════════════════════════════════════════════════════"
    echo "   CreatorBridge Deployment - Started at $(date)"
    echo "════════════════════════════════════════════════════════════════════════════"
    echo ""

    # Handle rollback
    if [ "$ROLLBACK" == "true" ]; then
        confirm_deployment
        rollback_deployment
        send_notification "success" "Rollback completed successfully"
        exit 0
    fi

    # Normal deployment flow
    check_prerequisites
    confirm_deployment

    # Build phase
    run_tests
    build_services
    push_images

    # Database phase
    backup_databases
    run_migrations

    # Deploy phase
    if ! deploy_services; then
        log_error "Deployment failed"
        read -p "Rollback to previous version? (yes/no): " rollback_confirm
        if [ "$rollback_confirm" == "yes" ]; then
            rollback_deployment
        fi
        send_notification "failure" "Deployment failed"
        exit 1
    fi

    # Verify phase
    if ! verify_deployment; then
        log_warning "Verification failed"
        read -p "Rollback to previous version? (yes/no): " rollback_confirm
        if [ "$rollback_confirm" == "yes" ]; then
            rollback_deployment
            send_notification "failure" "Deployment verification failed, rolled back"
            exit 1
        fi
    fi

    # Success
    echo ""
    echo "════════════════════════════════════════════════════════════════════════════"
    log_success "Deployment completed successfully!"
    echo "  Environment: $ENVIRONMENT"
    echo "  Namespace: $K8S_NAMESPACE"
    echo "  Domain: https://$DOMAIN"
    echo "  Log file: $LOG_FILE"
    echo "════════════════════════════════════════════════════════════════════════════"

    send_notification "success" "Deployment completed successfully"
}

main
