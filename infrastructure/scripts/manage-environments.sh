#!/bin/bash
# =============================================================================
# Environment Management Script
# Manages staging/development environments to save costs when production is live
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform/environments"
SUBSCRIPTION_ID="ba233460-2dbe-4603-a594-68f93ec9deb3"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Azure CLI is logged in
check_azure_login() {
    if ! az account show &>/dev/null; then
        print_error "Not logged into Azure. Please run 'az login' first."
        exit 1
    fi

    # Set the correct subscription
    az account set --subscription "$SUBSCRIPTION_ID"
    print_success "Using subscription: $SUBSCRIPTION_ID"
}

# Destroy staging environment
destroy_staging() {
    print_header "Destroying Staging Environment"

    print_warning "This will permanently delete ALL staging resources!"
    read -p "Are you sure you want to continue? (yes/no): " confirm

    if [[ "$confirm" != "yes" ]]; then
        print_warning "Aborted."
        exit 0
    fi

    cd "$TERRAFORM_DIR/staging"

    # Initialize Terraform
    terraform init

    # Destroy all resources
    terraform destroy -auto-approve

    print_success "Staging environment destroyed successfully!"

    # Calculate estimated savings
    echo ""
    print_header "Estimated Monthly Savings"
    echo "  - AKS Nodes:      ~\$150/month"
    echo "  - PostgreSQL:     ~\$50/month"
    echo "  - Redis Cache:    ~\$25/month"
    echo "  - Storage:        ~\$5/month"
    echo "  - Networking:     ~\$10/month"
    echo "  --------------------------------"
    echo "  Total:            ~\$240/month"
}

# Deploy staging environment
deploy_staging() {
    print_header "Deploying Staging Environment"

    cd "$TERRAFORM_DIR/staging"

    # Initialize Terraform
    terraform init

    # Plan the deployment
    terraform plan -out=tfplan

    read -p "Review the plan above. Continue with apply? (yes/no): " confirm

    if [[ "$confirm" != "yes" ]]; then
        print_warning "Aborted."
        exit 0
    fi

    # Apply the plan
    terraform apply tfplan

    print_success "Staging environment deployed successfully!"
}

# Deploy production environment
deploy_production() {
    print_header "Deploying Production Environment"

    cd "$TERRAFORM_DIR/prod"

    # Initialize Terraform
    terraform init

    # Plan the deployment
    terraform plan -out=tfplan

    read -p "Review the plan above. Continue with apply? (yes/no): " confirm

    if [[ "$confirm" != "yes" ]]; then
        print_warning "Aborted."
        exit 0
    fi

    # Apply the plan
    terraform apply tfplan

    print_success "Production environment deployed successfully!"
}

# Stop AKS cluster (cost-saving for staging)
stop_aks() {
    local env="${1:-staging}"
    print_header "Stopping AKS Cluster ($env)"

    local rg_name="marketing-${env}-rg"

    # Find AKS cluster in resource group
    local aks_name=$(az aks list --resource-group "$rg_name" --query "[0].name" -o tsv 2>/dev/null)

    if [[ -z "$aks_name" ]]; then
        print_error "No AKS cluster found in $rg_name"
        exit 1
    fi

    print_warning "Stopping AKS cluster: $aks_name"
    az aks stop --resource-group "$rg_name" --name "$aks_name"

    print_success "AKS cluster stopped. Estimated savings: ~\$100/month"
}

# Start AKS cluster
start_aks() {
    local env="${1:-staging}"
    print_header "Starting AKS Cluster ($env)"

    local rg_name="marketing-${env}-rg"

    # Find AKS cluster in resource group
    local aks_name=$(az aks list --resource-group "$rg_name" --query "[0].name" -o tsv 2>/dev/null)

    if [[ -z "$aks_name" ]]; then
        print_error "No AKS cluster found in $rg_name"
        exit 1
    fi

    print_warning "Starting AKS cluster: $aks_name"
    az aks start --resource-group "$rg_name" --name "$aks_name"

    print_success "AKS cluster started successfully!"
}

# Show current costs
show_costs() {
    print_header "Current Azure Costs (Last 30 Days)"

    # Get cost for staging
    echo ""
    echo "Staging Environment:"
    az cost management query --type ActualCost --timeframe MonthToDate \
        --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/marketing-staging-rg" \
        --query "rows" 2>/dev/null || echo "  Cost data unavailable"

    # Get cost for production
    echo ""
    echo "Production Environment:"
    az cost management query --type ActualCost --timeframe MonthToDate \
        --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/marketing-prod-rg" \
        --query "rows" 2>/dev/null || echo "  Cost data unavailable"
}

# Show help
show_help() {
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  destroy-staging     Destroy all staging resources (saves ~\$240/month)"
    echo "  deploy-staging      Deploy staging environment"
    echo "  deploy-production   Deploy production environment"
    echo "  stop-aks [env]      Stop AKS cluster to save costs (default: staging)"
    echo "  start-aks [env]     Start AKS cluster (default: staging)"
    echo "  show-costs          Show current Azure costs"
    echo ""
    echo "Cost-Saving Best Practices:"
    echo "  1. Run 'destroy-staging' when production goes live"
    echo "  2. Use 'stop-aks staging' during off-hours if staging is needed"
    echo "  3. Monitor costs regularly with 'show-costs'"
    echo ""
}

# Main script
main() {
    check_azure_login

    case "${1:-help}" in
        destroy-staging)
            destroy_staging
            ;;
        deploy-staging)
            deploy_staging
            ;;
        deploy-production)
            deploy_production
            ;;
        stop-aks)
            stop_aks "${2:-staging}"
            ;;
        start-aks)
            start_aks "${2:-staging}"
            ;;
        show-costs)
            show_costs
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
