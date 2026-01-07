#!/bin/bash
# =============================================================================
# NEXUS Platform - Unified Build & Push Script
# Builds all Docker images and pushes to Amazon ECR
# =============================================================================

set -e

# Configuration
ECR_REGISTRY="${AWS_ACCOUNT_ID:-992382449461}.dkr.ecr.${AWS_REGION:-us-east-1}.amazonaws.com"
ENVIRONMENT="${ENVIRONMENT:-staging}"
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
IMAGE_TAG="${ENVIRONMENT}-${COMMIT_HASH}"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "=============================================="
echo "NEXUS Platform - Unified Build Pipeline"
echo "=============================================="
echo "ECR Registry: $ECR_REGISTRY"
echo "Environment: $ENVIRONMENT"
echo "Image Tag: $IMAGE_TAG"
echo "Build Date: $BUILD_DATE"
echo "=============================================="

# Login to ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region ${AWS_REGION:-us-east-1} | docker login --username AWS --password-stdin $ECR_REGISTRY

# Backend Services
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

# Frontend Apps
FRONTEND_APPS=(
  "web"
  "creator-portal"
  "admin"
  "brand-portal"
)

# Workers
WORKERS=(
  "video-processor"
  "social-publisher"
  "notification-dispatcher"
  "analytics-aggregator"
)

# AI Services
AI_SERVICES=(
  "ai-center"
  "customer-agent"
  "marketing-agent"
  "moderation-engine"
  "performance-predictor"
  "recommendation-engine"
  "video-generator"
)

build_and_push() {
  local SERVICE_NAME=$1
  local DOCKERFILE_PATH=$2
  local BUILD_CONTEXT=$3

  echo ""
  echo ">>> Building $SERVICE_NAME..."

  if [ -f "$DOCKERFILE_PATH" ]; then
    docker build \
      --build-arg NODE_ENV=production \
      --build-arg BUILD_DATE=$BUILD_DATE \
      --build-arg VCS_REF=$COMMIT_HASH \
      -t $ECR_REGISTRY/nexus-$ENVIRONMENT/$SERVICE_NAME:$IMAGE_TAG \
      -t $ECR_REGISTRY/nexus-$ENVIRONMENT/$SERVICE_NAME:latest \
      -f $DOCKERFILE_PATH \
      $BUILD_CONTEXT

    echo ">>> Pushing $SERVICE_NAME..."
    docker push $ECR_REGISTRY/nexus-$ENVIRONMENT/$SERVICE_NAME:$IMAGE_TAG
    docker push $ECR_REGISTRY/nexus-$ENVIRONMENT/$SERVICE_NAME:latest

    echo ">>> $SERVICE_NAME completed!"
  else
    echo ">>> WARNING: Dockerfile not found for $SERVICE_NAME at $DOCKERFILE_PATH"
  fi
}

# Build Backend Services
echo ""
echo "=============================================="
echo "Building Backend Services (${#BACKEND_SERVICES[@]} total)"
echo "=============================================="
for SERVICE in "${BACKEND_SERVICES[@]}"; do
  build_and_push "$SERVICE" "services/$SERVICE/Dockerfile" "."
done

# Build Frontend Apps
echo ""
echo "=============================================="
echo "Building Frontend Apps (${#FRONTEND_APPS[@]} total)"
echo "=============================================="
for APP in "${FRONTEND_APPS[@]}"; do
  build_and_push "$APP" "apps/$APP/Dockerfile" "."
done

# Build Workers
echo ""
echo "=============================================="
echo "Building Workers (${#WORKERS[@]} total)"
echo "=============================================="
for WORKER in "${WORKERS[@]}"; do
  build_and_push "$WORKER" "workers/$WORKER/Dockerfile" "."
done

# Build AI Services
echo ""
echo "=============================================="
echo "Building AI Services (${#AI_SERVICES[@]} total)"
echo "=============================================="
for AI in "${AI_SERVICES[@]}"; do
  build_and_push "$AI" "ai/$AI/Dockerfile" "."
done

echo ""
echo "=============================================="
echo "Build Complete!"
echo "=============================================="
echo "Total images built: $((${#BACKEND_SERVICES[@]} + ${#FRONTEND_APPS[@]} + ${#WORKERS[@]} + ${#AI_SERVICES[@]}))"
echo "Image Tag: $IMAGE_TAG"
echo "ECR Registry: $ECR_REGISTRY"
echo "=============================================="

# Generate image definitions for EKS deployment
echo "Generating imagedefinitions.json..."
echo "[" > imagedefinitions.json
FIRST=true
for SERVICE in "${BACKEND_SERVICES[@]}"; do
  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    echo "," >> imagedefinitions.json
  fi
  echo "{\"name\":\"$SERVICE\",\"imageUri\":\"$ECR_REGISTRY/nexus-$ENVIRONMENT/$SERVICE:$IMAGE_TAG\"}" >> imagedefinitions.json
done
echo "]" >> imagedefinitions.json

echo "imagedefinitions.json generated!"
