#!/bin/bash

# =============================================================================
# CreatorBridge Database Restore Script
# =============================================================================
# Usage: ./scripts/restore-database.sh [environment] [backup-file|backup-timestamp]
# Examples:
#   ./scripts/restore-database.sh staging 20241218_120000
#   ./scripts/restore-database.sh production ./backups/production/20241218_120000/asset-service_20241218_120000.sql.gz
# =============================================================================

set -e

ENVIRONMENT=${1:-staging}
BACKUP_SOURCE=$2
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTORE_DIR="${SCRIPT_DIR}/../restore_temp"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration based on environment
if [ "$ENVIRONMENT" == "production" ]; then
    K8S_NAMESPACE="creatorbridge-production"
    AZURE_STORAGE_CONTAINER="backups-production"
else
    K8S_NAMESPACE="creatorbridge-staging"
    AZURE_STORAGE_CONTAINER="backups-staging"
fi

# =============================================================================
# Safety Checks
# =============================================================================

confirm_restore() {
    echo ""
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                          ⚠️  WARNING ⚠️                                    ║${NC}"
    echo -e "${RED}╠═══════════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${RED}║  You are about to restore databases in: $ENVIRONMENT${NC}"
    echo -e "${RED}║  This will OVERWRITE existing data!                                       ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ "$ENVIRONMENT" == "production" ]; then
        echo -e "${YELLOW}PRODUCTION RESTORE REQUIRES ADDITIONAL CONFIRMATION${NC}"
        read -p "Type 'RESTORE PRODUCTION' to continue: " confirm
        if [ "$confirm" != "RESTORE PRODUCTION" ]; then
            log_error "Restore cancelled"
            exit 1
        fi
    else
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_error "Restore cancelled"
            exit 1
        fi
    fi
}

# =============================================================================
# Main Functions
# =============================================================================

prepare_restore_directory() {
    log_info "Preparing restore directory..."
    rm -rf "$RESTORE_DIR"
    mkdir -p "$RESTORE_DIR"
}

download_from_azure() {
    local timestamp=$1
    log_info "Downloading backup from Azure: $timestamp"

    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not found"
        exit 1
    fi

    az storage blob download-batch \
        --source "$AZURE_STORAGE_CONTAINER" \
        --destination "$RESTORE_DIR" \
        --pattern "${timestamp}/*" \
        --auth-mode login \
        --only-show-errors

    log_success "Downloaded backup files"
}

find_backup_files() {
    local source=$1

    if [ -f "$source" ]; then
        # Single file specified
        cp "$source" "$RESTORE_DIR/"
    elif [ -d "$source" ]; then
        # Directory specified
        cp "$source"/*.sql.gz "$RESTORE_DIR/" 2>/dev/null || true
    elif [[ "$source" =~ ^[0-9]{8}_[0-9]{6}$ ]]; then
        # Timestamp format - look in local backups or download from Azure
        local local_path="${SCRIPT_DIR}/../backups/${ENVIRONMENT}/${source}"
        if [ -d "$local_path" ]; then
            cp "$local_path"/*.sql.gz "$RESTORE_DIR/" 2>/dev/null || true
        else
            download_from_azure "$source"
        fi
    else
        log_error "Invalid backup source: $source"
        exit 1
    fi

    # Check if we have backup files
    if ! ls "$RESTORE_DIR"/*.sql.gz 1>/dev/null 2>&1; then
        log_error "No backup files found"
        exit 1
    fi
}

scale_down_services() {
    log_info "Scaling down services to prevent writes during restore..."

    # Get list of deployments
    local deployments=$(kubectl get deployments -n $K8S_NAMESPACE -o jsonpath='{.items[*].metadata.name}')

    for deployment in $deployments; do
        kubectl scale deployment/$deployment --replicas=0 -n $K8S_NAMESPACE
    done

    log_success "All services scaled down"

    # Wait for pods to terminate
    log_info "Waiting for pods to terminate..."
    kubectl wait --for=delete pod -l app -n $K8S_NAMESPACE --timeout=120s 2>/dev/null || true
}

restore_database() {
    local backup_file=$1
    local service_name=$(basename "$backup_file" | cut -d'_' -f1-2 | sed 's/_/-/g')
    local db_name="${service_name//-/_}_db"

    log_info "Restoring database for $service_name..."

    # Decompress if needed
    local sql_file="${backup_file%.gz}"
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" > "$sql_file"
    fi

    # Get database connection details
    local db_host=$(kubectl get secret ${service_name}-db-credentials -n $K8S_NAMESPACE -o jsonpath='{.data.host}' 2>/dev/null | base64 -d || echo "")
    local db_user=$(kubectl get secret ${service_name}-db-credentials -n $K8S_NAMESPACE -o jsonpath='{.data.username}' 2>/dev/null | base64 -d || echo "")
    local db_pass=$(kubectl get secret ${service_name}-db-credentials -n $K8S_NAMESPACE -o jsonpath='{.data.password}' 2>/dev/null | base64 -d || echo "")

    if [ -z "$db_host" ]; then
        log_warning "Database credentials not found for $service_name, skipping..."
        return 0
    fi

    # Drop existing database and recreate
    log_info "Dropping and recreating database: $db_name"

    if command -v psql &> /dev/null; then
        PGPASSWORD="$db_pass" psql -h "$db_host" -U "$db_user" -d postgres << EOF
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db_name';
DROP DATABASE IF EXISTS $db_name;
CREATE DATABASE $db_name;
EOF

        # Restore data
        PGPASSWORD="$db_pass" psql -h "$db_host" -U "$db_user" -d "$db_name" < "$sql_file"
    else
        # Execute via Kubernetes pod
        kubectl exec -n $K8S_NAMESPACE deploy/postgres -- psql -U "$db_user" -d postgres -c "
            SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$db_name';
            DROP DATABASE IF EXISTS $db_name;
            CREATE DATABASE $db_name;
        "

        kubectl exec -i -n $K8S_NAMESPACE deploy/postgres -- psql -U "$db_user" -d "$db_name" < "$sql_file"
    fi

    log_success "Database restored: $db_name"

    # Cleanup
    rm -f "$sql_file"
}

scale_up_services() {
    log_info "Scaling services back up..."

    # Get deployment replicas from backup or use defaults
    local deployments=$(kubectl get deployments -n $K8S_NAMESPACE -o jsonpath='{.items[*].metadata.name}')

    for deployment in $deployments; do
        # Default to 2 replicas
        kubectl scale deployment/$deployment --replicas=2 -n $K8S_NAMESPACE
    done

    log_success "Services scaling up"

    # Wait for pods to be ready
    log_info "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod -l app -n $K8S_NAMESPACE --timeout=300s 2>/dev/null || true
}

verify_restore() {
    log_info "Verifying restore..."

    # Run deployment verification
    if [ -f "${SCRIPT_DIR}/verify-deployment.sh" ]; then
        bash "${SCRIPT_DIR}/verify-deployment.sh" "$ENVIRONMENT"
    else
        # Basic health check
        sleep 30
        local health_response=$(curl -s -o /dev/null -w "%{http_code}" "https://api.creatorbridge.com/health" 2>/dev/null || echo "000")
        if [ "$health_response" == "200" ]; then
            log_success "Health check passed"
        else
            log_warning "Health check returned: $health_response"
        fi
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    if [ -z "$BACKUP_SOURCE" ]; then
        log_error "Usage: $0 [environment] [backup-file|backup-timestamp]"
        echo ""
        echo "Examples:"
        echo "  $0 staging 20241218_120000"
        echo "  $0 production ./backups/production/20241218_120000/"
        exit 1
    fi

    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║              CreatorBridge Database Restore                               ║"
    echo "╠═══════════════════════════════════════════════════════════════════════════╣"
    echo "║  Environment: $ENVIRONMENT"
    echo "║  Backup Source: $BACKUP_SOURCE"
    echo "║  Timestamp: $(date)"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo ""

    # Safety confirmation
    confirm_restore

    # Verify kubectl access
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    prepare_restore_directory
    find_backup_files "$BACKUP_SOURCE"

    # Show files to be restored
    log_info "Backup files to restore:"
    ls -la "$RESTORE_DIR"/*.sql.gz 2>/dev/null || ls -la "$RESTORE_DIR"/*.sql 2>/dev/null
    echo ""

    read -p "Continue with restore? (yes/no): " final_confirm
    if [ "$final_confirm" != "yes" ]; then
        log_error "Restore cancelled"
        exit 1
    fi

    # Execute restore
    scale_down_services

    for backup_file in "$RESTORE_DIR"/*.sql.gz "$RESTORE_DIR"/*.sql; do
        if [ -f "$backup_file" ]; then
            restore_database "$backup_file"
        fi
    done

    scale_up_services
    verify_restore

    # Cleanup
    rm -rf "$RESTORE_DIR"

    # Summary
    echo ""
    echo "════════════════════════════════════════════════════════════════════════════"
    log_success "Restore completed!"
    echo "Please verify application functionality manually."
    echo "════════════════════════════════════════════════════════════════════════════"
}

main
