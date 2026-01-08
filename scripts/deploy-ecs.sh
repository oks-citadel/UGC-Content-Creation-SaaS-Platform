#!/bin/bash
# =============================================================================
# NEXUS Platform - ECS Fargate Deployment Script
# =============================================================================
# This script deploys services to ECS Fargate clusters.
# Usage: ./deploy-ecs.sh <environment> <service|all> [image_tag]
#
# Examples:
#   ./deploy-ecs.sh staging all staging-abc1234
#   ./deploy-ecs.sh prod api-gateway prod-abc1234
#   ./deploy-ecs.sh staging auth-service latest
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REGISTRY="${ECR_REGISTRY:-992382449461.dkr.ecr.us-east-1.amazonaws.com}"

# Service lists
BACKEND_SERVICES=(
    "api-gateway"
    "auth-service"
    "user-service"
    "creator-service"
    "campaign-service"
    "content-service"
    "commerce-service"
    "analytics-service"
    "billing-service"
    "marketplace-service"
    "notification-service"
    "workflow-service"
    "compliance-service"
    "integration-service"
    "payout-service"
    "rights-service"
    "asset-service"
    "ai-service"
)

FRONTEND_APPS=(
    "web"
    "creator-portal"
    "admin"
    "brand-portal"
)

WORKERS=(
    "video-processor"
    "social-publisher"
    "notification-dispatcher"
    "analytics-aggregator"
)

AI_SERVICES=(
    "ai-center"
    "customer-agent"
    "marketing-agent"
    "moderation-engine"
    "performance-predictor"
    "recommendation-engine"
    "video-generator"
)

# All services combined
ALL_SERVICES=("${BACKEND_SERVICES[@]}" "${FRONTEND_APPS[@]}" "${WORKERS[@]}" "${AI_SERVICES[@]}")

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

usage() {
    echo "Usage: $0 <environment> <service|all> [image_tag]"
    echo ""
    echo "Arguments:"
    echo "  environment   Target environment: dev, staging, or prod"
    echo "  service       Service name or 'all' for all services"
    echo "  image_tag     Docker image tag (optional, defaults to 'latest')"
    echo ""
    echo "Examples:"
    echo "  $0 staging all staging-abc1234"
    echo "  $0 prod api-gateway prod-abc1234"
    echo "  $0 staging auth-service latest"
    echo ""
    echo "Available services:"
    echo "  Backend: ${BACKEND_SERVICES[*]}"
    echo "  Frontend: ${FRONTEND_APPS[*]}"
    echo "  Workers: ${WORKERS[*]}"
    echo "  AI: ${AI_SERVICES[*]}"
    exit 1
}

deploy_service() {
    local cluster=$1
    local service=$2
    local image_tag=$3
    local environment=$4

    log_info "Deploying $service to cluster $cluster..."

    # Check if service exists
    if ! aws ecs describe-services --cluster "$cluster" --services "$service" --region "$AWS_REGION" &>/dev/null; then
        log_warning "Service $service does not exist in cluster $cluster. Skipping."
        return 0
    fi

    # Force new deployment
    if aws ecs update-service \
        --cluster "$cluster" \
        --service "$service" \
        --force-new-deployment \
        --region "$AWS_REGION" \
        --output text &>/dev/null; then
        log_success "Deployment initiated for $service"
    else
        log_error "Failed to deploy $service"
        return 1
    fi
}

wait_for_service() {
    local cluster=$1
    local service=$2

    log_info "Waiting for $service to stabilize..."

    if aws ecs wait services-stable \
        --cluster "$cluster" \
        --services "$service" \
        --region "$AWS_REGION" 2>/dev/null; then
        log_success "$service is stable"
    else
        log_warning "Timeout waiting for $service to stabilize"
    fi
}

get_service_status() {
    local cluster=$1
    local service=$2

    aws ecs describe-services \
        --cluster "$cluster" \
        --services "$service" \
        --region "$AWS_REGION" \
        --query 'services[0].{DesiredCount:desiredCount,RunningCount:runningCount,Status:status}' \
        --output table
}

# Main script
main() {
    # Validate arguments
    if [[ $# -lt 2 ]]; then
        usage
    fi

    local environment=$1
    local target_service=$2
    local image_tag=${3:-latest}

    # Validate environment
    case $environment in
        dev|staging|prod)
            local cluster="nexus-${environment}"
            ;;
        *)
            log_error "Invalid environment: $environment. Must be dev, staging, or prod."
            exit 1
            ;;
    esac

    log_info "========================================"
    log_info "NEXUS ECS Deployment"
    log_info "========================================"
    log_info "Environment: $environment"
    log_info "Cluster: $cluster"
    log_info "Target: $target_service"
    log_info "Image Tag: $image_tag"
    log_info "========================================"

    # Check AWS credentials
    if ! aws sts get-caller-identity &>/dev/null; then
        log_error "AWS credentials not configured. Please configure AWS CLI."
        exit 1
    fi

    # Deploy services
    local services_to_deploy=()

    if [[ "$target_service" == "all" ]]; then
        services_to_deploy=("${ALL_SERVICES[@]}")
    elif [[ "$target_service" == "backend" ]]; then
        services_to_deploy=("${BACKEND_SERVICES[@]}")
    elif [[ "$target_service" == "frontend" ]]; then
        services_to_deploy=("${FRONTEND_APPS[@]}")
    elif [[ "$target_service" == "workers" ]]; then
        services_to_deploy=("${WORKERS[@]}")
    elif [[ "$target_service" == "ai" ]]; then
        services_to_deploy=("${AI_SERVICES[@]}")
    else
        services_to_deploy=("$target_service")
    fi

    log_info "Deploying ${#services_to_deploy[@]} service(s)..."

    local failed_services=()
    local successful_services=()

    for service in "${services_to_deploy[@]}"; do
        if deploy_service "$cluster" "$service" "$image_tag" "$environment"; then
            successful_services+=("$service")
        else
            failed_services+=("$service")
        fi
    done

    # Wait for critical services
    log_info "Waiting for services to stabilize..."
    local critical_services=("api-gateway" "auth-service" "user-service" "web")

    for service in "${critical_services[@]}"; do
        if [[ " ${successful_services[*]} " =~ " ${service} " ]]; then
            wait_for_service "$cluster" "$service"
        fi
    done

    # Summary
    echo ""
    log_info "========================================"
    log_info "Deployment Summary"
    log_info "========================================"

    if [[ ${#successful_services[@]} -gt 0 ]]; then
        log_success "Successful deployments: ${successful_services[*]}"
    fi

    if [[ ${#failed_services[@]} -gt 0 ]]; then
        log_error "Failed deployments: ${failed_services[*]}"
        exit 1
    fi

    log_success "All deployments completed successfully!"
}

# Run main function
main "$@"
