#!/bin/bash

# NEXUS Platform Kubernetes Verification Script
# Usage: ./verify.sh [environment]
# Environments: development, staging, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default environment
ENV=${1:-production}

# Validate environment
if [[ ! "$ENV" =~ ^(development|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be: development, staging, or production${NC}"
    exit 1
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

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}NEXUS Platform Health Check${NC}"
echo -e "${GREEN}Environment: ${ENV}${NC}"
echo -e "${GREEN}Namespace: ${NAMESPACE}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo -e "${RED}Error: Namespace ${NAMESPACE} does not exist${NC}"
    exit 1
fi

FAILED_CHECKS=0

# Check all pods are running
echo -e "${YELLOW}Checking pods status...${NC}"
NOT_RUNNING=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l)

if [ "$NOT_RUNNING" -gt 0 ]; then
    echo -e "${RED}✗ Found ${NOT_RUNNING} pods not in Running state:${NC}"
    kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    POD_COUNT=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ All ${POD_COUNT} pods are running${NC}"
fi
echo ""

# Check pod restarts
echo -e "${YELLOW}Checking for pod restarts...${NC}"
HIGH_RESTARTS=$(kubectl get pods -n "$NAMESPACE" -o json | jq -r '.items[] | select(.status.containerStatuses[].restartCount > 5) | .metadata.name' 2>/dev/null)

if [ -n "$HIGH_RESTARTS" ]; then
    echo -e "${YELLOW}⚠ Pods with high restart counts (>5):${NC}"
    echo "$HIGH_RESTARTS"
else
    echo -e "${GREEN}✓ No pods with excessive restarts${NC}"
fi
echo ""

# Check deployments
echo -e "${YELLOW}Checking deployments...${NC}"
DEPLOYMENTS=$(kubectl get deployments -n "$NAMESPACE" -o json | jq -r '.items[] | select(.status.availableReplicas != .status.replicas) | .metadata.name' 2>/dev/null)

if [ -n "$DEPLOYMENTS" ]; then
    echo -e "${RED}✗ Deployments with unavailable replicas:${NC}"
    echo "$DEPLOYMENTS"
    kubectl get deployments -n "$NAMESPACE"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    DEPLOYMENT_COUNT=$(kubectl get deployments -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ All ${DEPLOYMENT_COUNT} deployments are ready${NC}"
fi
echo ""

# Check services
echo -e "${YELLOW}Checking services...${NC}"
SERVICE_COUNT=$(kubectl get services -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Found ${SERVICE_COUNT} services${NC}"
kubectl get services -n "$NAMESPACE"
echo ""

# Check ingress
echo -e "${YELLOW}Checking ingress...${NC}"
INGRESS=$(kubectl get ingress -n "$NAMESPACE" --no-headers 2>/dev/null)

if [ -z "$INGRESS" ]; then
    echo -e "${RED}✗ No ingress found${NC}"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
else
    echo -e "${GREEN}✓ Ingress configured${NC}"
    kubectl get ingress -n "$NAMESPACE"
fi
echo ""

# Check HPA
echo -e "${YELLOW}Checking Horizontal Pod Autoscalers...${NC}"
HPA_COUNT=$(kubectl get hpa -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Found ${HPA_COUNT} HPAs${NC}"
kubectl get hpa -n "$NAMESPACE"
echo ""

# Check PDB
echo -e "${YELLOW}Checking Pod Disruption Budgets...${NC}"
PDB_COUNT=$(kubectl get pdb -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l)
echo -e "${GREEN}✓ Found ${PDB_COUNT} PDBs${NC}"
kubectl get pdb -n "$NAMESPACE"
echo ""

# Check certificates
echo -e "${YELLOW}Checking certificates...${NC}"
CERTS=$(kubectl get certificates -n "$NAMESPACE" --no-headers 2>/dev/null)

if [ -z "$CERTS" ]; then
    echo -e "${YELLOW}⚠ No certificates found (may not be using cert-manager)${NC}"
else
    NOT_READY_CERTS=$(kubectl get certificates -n "$NAMESPACE" -o json | jq -r '.items[] | select(.status.conditions[] | select(.type=="Ready" and .status!="True")) | .metadata.name' 2>/dev/null)

    if [ -n "$NOT_READY_CERTS" ]; then
        echo -e "${RED}✗ Certificates not ready:${NC}"
        echo "$NOT_READY_CERTS"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    else
        echo -e "${GREEN}✓ All certificates are ready${NC}"
    fi
fi
echo ""

# Check resource usage
echo -e "${YELLOW}Checking resource usage...${NC}"
if kubectl top nodes &> /dev/null; then
    echo -e "${YELLOW}Node resource usage:${NC}"
    kubectl top nodes
    echo ""

    echo -e "${YELLOW}Pod resource usage (top 10):${NC}"
    kubectl top pods -n "$NAMESPACE" --sort-by=cpu | head -11
else
    echo -e "${YELLOW}⚠ Metrics server not available, skipping resource usage check${NC}"
fi
echo ""

# Check recent events
echo -e "${YELLOW}Recent events (last 10):${NC}"
kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -10
echo ""

# Health endpoint checks (if available)
echo -e "${YELLOW}Checking service health endpoints...${NC}"

# Try to check API Gateway health
API_POD=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=api-gateway -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -n "$API_POD" ]; then
    if kubectl exec -n "$NAMESPACE" "$API_POD" -- wget -q -O- http://localhost:3000/health &> /dev/null; then
        echo -e "${GREEN}✓ API Gateway health check passed${NC}"
    else
        echo -e "${RED}✗ API Gateway health check failed${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
else
    echo -e "${YELLOW}⚠ API Gateway pod not found, skipping health check${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Verification Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Platform is healthy.${NC}"
    exit 0
else
    echo -e "${RED}✗ ${FAILED_CHECKS} check(s) failed. Please investigate.${NC}"
    exit 1
fi
