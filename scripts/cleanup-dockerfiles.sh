#!/bin/bash
# =============================================================================
# NEXUS UGC Platform - Docker Cleanup Script
# Removes deprecated Dockerfile variants
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "==================================="
echo "NEXUS Docker Cleanup Script"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to count files
count_files() {
    local pattern=$1
    find "$PROJECT_ROOT/services" -name "$pattern" -type f 2>/dev/null | wc -l
}

# Function to list files
list_files() {
    local pattern=$1
    find "$PROJECT_ROOT/services" -name "$pattern" -type f 2>/dev/null
}

# Function to remove files
remove_files() {
    local pattern=$1
    local description=$2
    local files=$(list_files "$pattern")
    local count=$(echo "$files" | grep -c . || echo 0)

    if [ "$count" -gt 0 ]; then
        echo -e "${YELLOW}Found $count $description files:${NC}"
        echo "$files" | while read -r file; do
            echo "  - ${file#$PROJECT_ROOT/}"
        done

        if [ "$DRY_RUN" != "true" ]; then
            echo "$files" | while read -r file; do
                rm -f "$file"
                echo -e "${GREEN}Removed:${NC} ${file#$PROJECT_ROOT/}"
            done
        else
            echo -e "${YELLOW}[DRY RUN] Would remove $count files${NC}"
        fi
        echo ""
    else
        echo -e "${GREEN}No $description files found${NC}"
        echo ""
    fi
}

# Parse arguments
DRY_RUN="true"
if [ "$1" == "--execute" ] || [ "$1" == "-x" ]; then
    DRY_RUN="false"
    echo -e "${RED}EXECUTE MODE - Files will be deleted!${NC}"
    echo ""
    read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
else
    echo -e "${YELLOW}DRY RUN MODE - No files will be deleted${NC}"
    echo "Use --execute or -x flag to actually delete files"
    echo ""
fi

cd "$PROJECT_ROOT"

echo "Scanning for deprecated Dockerfile variants..."
echo ""

# Remove Dockerfile.v2 variants
remove_files "Dockerfile.v2" "Dockerfile.v2 (standalone)"

# Remove Dockerfile.acr variants
remove_files "Dockerfile.acr" "Dockerfile.acr (Azure specific)"

# Remove Dockerfile.npm variants
remove_files "Dockerfile.npm" "Dockerfile.npm"

# Remove Dockerfile.yarn variants
remove_files "Dockerfile.yarn" "Dockerfile.yarn"

# Remove Dockerfile.simple from services (but not apps)
simple_files=$(find "$PROJECT_ROOT/services" -name "Dockerfile.simple" -type f 2>/dev/null)
simple_count=$(echo "$simple_files" | grep -c . || echo 0)

if [ "$simple_count" -gt 0 ]; then
    echo -e "${YELLOW}Found $simple_count Dockerfile.simple files in services:${NC}"
    echo "$simple_files" | while read -r file; do
        echo "  - ${file#$PROJECT_ROOT/}"
    done

    if [ "$DRY_RUN" != "true" ]; then
        echo "$simple_files" | while read -r file; do
            rm -f "$file"
            echo -e "${GREEN}Removed:${NC} ${file#$PROJECT_ROOT/}"
        done
    else
        echo -e "${YELLOW}[DRY RUN] Would remove $simple_count files${NC}"
    fi
    echo ""
else
    echo -e "${GREEN}No Dockerfile.simple files found in services${NC}"
    echo ""
fi

# Summary
echo "==================================="
echo "Summary"
echo "==================================="

# Count remaining Dockerfiles
main_dockerfiles=$(find "$PROJECT_ROOT/services" "$PROJECT_ROOT/apps" "$PROJECT_ROOT/workers" "$PROJECT_ROOT/ai" -maxdepth 2 -name "Dockerfile" -type f 2>/dev/null | wc -l)
standalone_dockerfiles=$(find "$PROJECT_ROOT/apps" -name "Dockerfile.standalone" -type f 2>/dev/null | wc -l)

echo -e "Main Dockerfiles (keep): ${GREEN}$main_dockerfiles${NC}"
echo -e "Standalone Dockerfiles (keep): ${GREEN}$standalone_dockerfiles${NC}"

if [ "$DRY_RUN" == "true" ]; then
    echo ""
    echo -e "${YELLOW}This was a dry run. Run with --execute to delete files.${NC}"
fi

echo ""
echo "Done!"
