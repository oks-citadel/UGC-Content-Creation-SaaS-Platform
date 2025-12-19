#!/bin/bash

# NEXUS Platform Kubernetes Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: development, staging, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENV=${1:-development}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}NEXUS Platform Deployment${NC}"
echo -e "${GREEN}Environment: ${ENV}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Validate environment
if [[ ! "$ENV" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be: development, staging, or production${NC}"
    exit 1
fi

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed${NC}"
    exit 1
fi

if ! command -v kustomize &> /dev/null; then
    echo -e "${RED}Error: kustomize is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites checked${NC}"
echo ""

# Check cluster connection
echo -e "${YELLOW}Checking cluster connection...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

CLUSTER_NAME=$(kubectl config current-context)
echo -e "${GREEN}✓ Connected to cluster: ${CLUSTER_NAME}${NC}"
echo ""

# Confirmation for production
if [ "$ENV" = "production" ]; then
    echo -e "${RED}WARNING: You are about to deploy to PRODUCTION${NC}"
    echo -e "${YELLOW}Cluster: ${CLUSTER_NAME}${NC}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi
fi

# Set namespace based on environment
case $ENV in
    development)
        NAMESPACE="nexus-dev"
        ;;
    staging)
        NAMESPACE="nexus-staging"
        ;;
    production)
        NAMESPACE="nexus"
        ;;
esac

echo -e "${YELLOW}Target Namespace: ${NAMESPACE}${NC}"
echo ""

# Build manifests
echo -e "${YELLOW}Building Kubernetes manifests...${NC}"
OVERLAY_PATH="overlays/${ENV}"

if [ ! -d "$OVERLAY_PATH" ]; then
    echo -e "${RED}Error: Overlay path not found: ${OVERLAY_PATH}${NC}"
    exit 1
fi

kustomize build "$OVERLAY_PATH" > /tmp/nexus-${ENV}-manifests.yaml

echo -e "${GREEN}✓ Manifests built successfully${NC}"
echo ""

# Show what will be deployed
echo -e "${YELLOW}Resources to be deployed:${NC}"
kubectl apply -f /tmp/nexus-${ENV}-manifests.yaml --dry-run=client | grep -E "^(namespace|deployment|service|ingress|configmap|secret|hpa|pdb)" | head -20
echo "..."
echo ""

# Ask for final confirmation
read -p "Proceed with deployment? (yes/no): " PROCEED
if [ "$PROCEED" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Deploy
echo -e "${YELLOW}Deploying to ${ENV}...${NC}"
kubectl apply -f /tmp/nexus-${ENV}-manifests.yaml

echo -e "${GREEN}✓ Resources deployed${NC}"
echo ""

# Wait for rollout
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"

DEPLOYMENTS=$(kubectl get deployments -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')

for deployment in $DEPLOYMENTS; do
    echo -e "${YELLOW}Checking ${deployment}...${NC}"
    if kubectl rollout status deployment/"$deployment" -n "$NAMESPACE" --timeout=5m; then
        echo -e "${GREEN}✓ ${deployment} is ready${NC}"
    else
        echo -e "${RED}✗ ${deployment} failed to deploy${NC}"
        echo -e "${YELLOW}Recent events:${NC}"
        kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -10
        exit 1
    fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Show deployment status
echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -n "$NAMESPACE"
echo ""

echo -e "${YELLOW}Services:${NC}"
kubectl get services -n "$NAMESPACE"
echo ""

echo -e "${YELLOW}Ingresses:${NC}"
kubectl get ingress -n "$NAMESPACE"
echo ""

echo -e "${YELLOW}HPAs:${NC}"
kubectl get hpa -n "$NAMESPACE"
echo ""

# Show URLs
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Access URLs${NC}"
echo -e "${GREEN}========================================${NC}"

INGRESS_HOST=$(kubectl get ingress nexus-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[0].host}' 2>/dev/null || echo "Not configured")
echo -e "${YELLOW}Main URL: https://${INGRESS_HOST}${NC}"

API_HOST=$(kubectl get ingress nexus-ingress -n "$NAMESPACE" -o jsonpath='{.spec.rules[?(@.host=="api.*")].host}' 2>/dev/null || echo "Not configured")
echo -e "${YELLOW}API URL: https://${API_HOST}${NC}"

echo ""
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"

# Cleanup
rm -f /tmp/nexus-${ENV}-manifests.yaml
