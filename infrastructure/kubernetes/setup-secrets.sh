#!/bin/bash

# NEXUS Platform Secrets Setup Script
# Usage: ./setup-secrets.sh [environment]
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
echo -e "${GREEN}NEXUS Platform Secrets Setup${NC}"
echo -e "${GREEN}Environment: ${ENV}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

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

echo -e "${YELLOW}Target Namespace: ${NAMESPACE}${NC}"
echo ""

# Check if namespace exists
if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    echo -e "${YELLOW}Namespace ${NAMESPACE} does not exist. Creating...${NC}"
    kubectl create namespace "$NAMESPACE"
fi

# Check for .env file
ENV_FILE=".env.${ENV}"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}Environment file ${ENV_FILE} not found.${NC}"
    echo -e "${YELLOW}Creating template...${NC}"

    cat > "$ENV_FILE" << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://username:password@postgres-service:5432/nexus

# Redis Configuration
REDIS_URL=redis://:password@redis-service:6379/0

# JWT Configuration
JWT_SECRET=GENERATE_SECURE_RANDOM_STRING_32_CHARS
JWT_REFRESH_SECRET=GENERATE_SECURE_RANDOM_STRING_32_CHARS

# Encryption
ENCRYPTION_KEY=GENERATE_SECURE_RANDOM_STRING_32_CHARS

# Cloud Storage (S3/GCS/etc)
STORAGE_BUCKET=YOUR_STORAGE_BUCKET_NAME
STORAGE_ACCESS_KEY=YOUR_STORAGE_ACCESS_KEY_HERE
STORAGE_SECRET_KEY=YOUR_STORAGE_SECRET_KEY_HERE

# SendGrid
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY_HERE

# Stripe
STRIPE_SECRET_KEY=YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=YOUR_STRIPE_WEBHOOK_SECRET_HERE

# OpenAI
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE

# Social Media OAuth
INSTAGRAM_CLIENT_ID=YOUR_INSTAGRAM_CLIENT_ID_HERE
INSTAGRAM_CLIENT_SECRET=YOUR_INSTAGRAM_CLIENT_SECRET_HERE
TIKTOK_CLIENT_ID=YOUR_TIKTOK_CLIENT_ID_HERE
TIKTOK_CLIENT_SECRET=YOUR_TIKTOK_CLIENT_SECRET_HERE
YOUTUBE_CLIENT_ID=YOUR_YOUTUBE_CLIENT_ID_HERE
YOUTUBE_CLIENT_SECRET=YOUR_YOUTUBE_CLIENT_SECRET_HERE

# RabbitMQ
RABBITMQ_URL=amqp://username:password@rabbitmq-service:5672

# Session
SESSION_SECRET=GENERATE_SECURE_RANDOM_STRING_32_CHARS
EOF

    echo -e "${GREEN}✓ Template created: ${ENV_FILE}${NC}"
    echo -e "${YELLOW}Please edit ${ENV_FILE} with your actual values, then run this script again.${NC}"
    exit 0
fi

echo -e "${YELLOW}Reading secrets from ${ENV_FILE}...${NC}"

# Function to generate random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Create secret
echo -e "${YELLOW}Creating Kubernetes secret...${NC}"

kubectl create secret generic nexus-secrets \
    --namespace="$NAMESPACE" \
    --from-env-file="$ENV_FILE" \
    --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✓ Secrets created/updated successfully${NC}"
echo ""

# Verify
echo -e "${YELLOW}Verifying secret...${NC}"
SECRET_EXISTS=$(kubectl get secret nexus-secrets -n "$NAMESPACE" -o jsonpath='{.metadata.name}' 2>/dev/null || echo "")

if [ -n "$SECRET_EXISTS" ]; then
    echo -e "${GREEN}✓ Secret 'nexus-secrets' exists in namespace '${NAMESPACE}'${NC}"

    # Show secret keys (not values)
    echo -e "${YELLOW}Secret contains the following keys:${NC}"
    kubectl get secret nexus-secrets -n "$NAMESPACE" -o jsonpath='{.data}' | jq -r 'keys[]' | while read key; do
        echo "  - $key"
    done
else
    echo -e "${RED}✗ Failed to create secret${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Security Reminders${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}1. Never commit .env files to Git${NC}"
echo -e "${YELLOW}2. Rotate secrets regularly${NC}"
echo -e "${YELLOW}3. Use external secret management in production (AWS Secrets Manager, HashiCorp Vault)${NC}"
echo -e "${YELLOW}4. Restrict access to secrets using RBAC${NC}"
echo -e "${YELLOW}5. Monitor secret access and usage${NC}"
echo ""

# Production warning
if [ "$ENV" = "production" ]; then
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}PRODUCTION ENVIRONMENT${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${RED}For production, consider using:${NC}"
    echo -e "${YELLOW}- AWS Secrets Manager or Parameter Store${NC}"
    echo -e "${YELLOW}- External Secrets Operator${NC}"
    echo -e "${YELLOW}- HashiCorp Vault${NC}"
    echo -e "${YELLOW}- Sealed Secrets${NC}"
    echo ""
fi

echo -e "${GREEN}✓ Setup complete!${NC}"
