#!/bin/bash

# =============================================================================
# CreatorBridge Database Backup Script
# =============================================================================
# Usage: ./scripts/backup-databases.sh [environment] [backup-type]
# Environments: staging, production
# Backup Types: full, schema-only, data-only
# =============================================================================

set -e

ENVIRONMENT=${1:-staging}
BACKUP_TYPE=${2:-full}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/../backups/${ENVIRONMENT}/${TIMESTAMP}"

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
    RETENTION_DAYS=30
else
    K8S_NAMESPACE="creatorbridge-staging"
    AZURE_STORAGE_CONTAINER="backups-staging"
    RETENTION_DAYS=7
fi

# Database services to backup
DATABASES=(
    "auth-service"
    "user-service"
    "billing-service"
    "campaign-service"
    "creator-service"
    "content-service"
    "asset-service"
    "rights-service"
    "payout-service"
    "analytics-service"
)

# =============================================================================
# Main Functions
# =============================================================================

create_backup_directory() {
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
}

backup_database() {
    local service=$1
    local db_name="${service//-/_}_db"
    local backup_file="${BACKUP_DIR}/${service}_${TIMESTAMP}.sql"
    local compressed_file="${backup_file}.gz"

    log_info "Backing up database for $service..."

    # Get database connection details from Kubernetes secret
    local db_host=$(kubectl get secret ${service}-db-credentials -n $K8S_NAMESPACE -o jsonpath='{.data.host}' 2>/dev/null | base64 -d || echo "")
    local db_user=$(kubectl get secret ${service}-db-credentials -n $K8S_NAMESPACE -o jsonpath='{.data.username}' 2>/dev/null | base64 -d || echo "")
    local db_pass=$(kubectl get secret ${service}-db-credentials -n $K8S_NAMESPACE -o jsonpath='{.data.password}' 2>/dev/null | base64 -d || echo "")

    if [ -z "$db_host" ]; then
        log_warning "Database credentials not found for $service, skipping..."
        return 0
    fi

    # Set backup options based on type
    local pg_dump_opts=""
    case $BACKUP_TYPE in
        "schema-only")
            pg_dump_opts="--schema-only"
            ;;
        "data-only")
            pg_dump_opts="--data-only"
            ;;
        "full")
            pg_dump_opts=""
            ;;
    esac

    # Execute pg_dump through a Kubernetes job or direct connection
    if command -v pg_dump &> /dev/null; then
        # Direct connection (requires network access)
        PGPASSWORD="$db_pass" pg_dump -h "$db_host" -U "$db_user" -d "$db_name" $pg_dump_opts > "$backup_file"
    else
        # Execute via Kubernetes pod
        kubectl exec -n $K8S_NAMESPACE deploy/postgres -- \
            pg_dump -U "$db_user" -d "$db_name" $pg_dump_opts > "$backup_file"
    fi

    # Compress backup
    gzip "$backup_file"

    # Verify backup
    if [ -f "$compressed_file" ] && [ -s "$compressed_file" ]; then
        local size=$(du -h "$compressed_file" | cut -f1)
        log_success "Backup created: $compressed_file ($size)"
        return 0
    else
        log_error "Backup failed for $service"
        return 1
    fi
}

backup_redis() {
    log_info "Backing up Redis data..."
    local redis_backup="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb"

    # Trigger Redis BGSAVE
    kubectl exec -n $K8S_NAMESPACE deploy/redis -- redis-cli BGSAVE

    # Wait for save to complete
    sleep 5

    # Copy RDB file
    kubectl cp $K8S_NAMESPACE/redis-0:/data/dump.rdb "$redis_backup" 2>/dev/null || \
        log_warning "Redis backup skipped (not available or no data)"

    if [ -f "$redis_backup" ]; then
        gzip "$redis_backup"
        log_success "Redis backup created"
    fi
}

upload_to_azure() {
    log_info "Uploading backups to Azure Blob Storage..."

    if ! command -v az &> /dev/null; then
        log_warning "Azure CLI not found, skipping cloud upload"
        return 0
    fi

    for file in "$BACKUP_DIR"/*.gz; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            az storage blob upload \
                --container-name "$AZURE_STORAGE_CONTAINER" \
                --file "$file" \
                --name "${TIMESTAMP}/${filename}" \
                --auth-mode login \
                --only-show-errors

            log_success "Uploaded: $filename"
        fi
    done
}

cleanup_old_backups() {
    log_info "Cleaning up backups older than $RETENTION_DAYS days..."

    # Local cleanup
    find "${SCRIPT_DIR}/../backups/${ENVIRONMENT}" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "${SCRIPT_DIR}/../backups/${ENVIRONMENT}" -type d -empty -delete 2>/dev/null || true

    # Azure cleanup (if available)
    if command -v az &> /dev/null; then
        local cutoff_date=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%d 2>/dev/null || date -v-${RETENTION_DAYS}d +%Y-%m-%d)
        log_info "Removing Azure blobs older than $cutoff_date"
        # Azure blob lifecycle management handles this automatically
    fi
}

create_manifest() {
    local manifest="${BACKUP_DIR}/manifest.json"
    cat > "$manifest" << EOF
{
    "timestamp": "$TIMESTAMP",
    "environment": "$ENVIRONMENT",
    "backup_type": "$BACKUP_TYPE",
    "databases": [
$(printf '        "%s",\n' "${DATABASES[@]}" | sed '$ s/,$//')
    ],
    "created_by": "$(whoami)",
    "hostname": "$(hostname)",
    "kubernetes_namespace": "$K8S_NAMESPACE"
}
EOF
    log_success "Manifest created: $manifest"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║              CreatorBridge Database Backup                                ║"
    echo "╠═══════════════════════════════════════════════════════════════════════════╣"
    echo "║  Environment: $ENVIRONMENT"
    echo "║  Backup Type: $BACKUP_TYPE"
    echo "║  Timestamp: $TIMESTAMP"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo ""

    # Verify kubectl access
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    create_backup_directory

    # Backup each database
    local failed=0
    for db in "${DATABASES[@]}"; do
        if ! backup_database "$db"; then
            ((failed++))
        fi
    done

    # Backup Redis
    backup_redis

    # Create manifest
    create_manifest

    # Upload to cloud storage
    upload_to_azure

    # Cleanup old backups
    cleanup_old_backups

    # Summary
    echo ""
    echo "════════════════════════════════════════════════════════════════════════════"
    if [ $failed -eq 0 ]; then
        log_success "Backup completed successfully!"
    else
        log_warning "Backup completed with $failed failures"
    fi
    echo "Backup location: $BACKUP_DIR"
    echo "Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"
    echo "════════════════════════════════════════════════════════════════════════════"
}

main
