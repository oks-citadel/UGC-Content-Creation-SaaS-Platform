# UGC Creator Pro - Setup Guide

This guide provides comprehensive instructions for setting up the UGC Creator Pro platform for local development, staging, and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Service Configuration](#service-configuration)
6. [Azure Infrastructure Setup](#azure-infrastructure-setup)
7. [Kubernetes Deployment](#kubernetes-deployment)
8. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
9. [Monitoring and Observability](#monitoring-and-observability)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

Install the following tools before proceeding:

**Development Tools**
- Node.js 20+ LTS ([nodejs.org](https://nodejs.org))
- Go 1.21+ ([golang.org](https://golang.org))
- Python 3.11+ ([python.org](https://python.org))
- pnpm 8+ (recommended) or npm 10+
- Git 2.40+

**Containerization**
- Docker Desktop 4.25+ ([docker.com](https://docker.com))
- Docker Compose v2

**Cloud & Infrastructure**
- Azure CLI 2.55+ ([Microsoft Docs](https://docs.microsoft.com/cli/azure/install-azure-cli))
- Terraform 1.6+ ([terraform.io](https://terraform.io))
- kubectl 1.28+ ([kubernetes.io](https://kubernetes.io/docs/tasks/tools/))
- Helm 3.13+ ([helm.sh](https://helm.sh))

**Verification Commands**

```bash
# Verify installations
node --version          # Should be v20.x.x
go version              # Should be go1.21.x
python3 --version       # Should be Python 3.11.x
docker --version        # Should be Docker 24.x.x
az --version            # Azure CLI version
terraform --version     # Should be Terraform v1.6.x
kubectl version --client # Client Version: v1.28.x
helm version            # Version: v3.13.x
```

### System Requirements

**Development Machine**
- CPU: 4+ cores (8 recommended)
- RAM: 16GB minimum (32GB recommended)
- Storage: 50GB free space
- OS: macOS 13+, Windows 11 with WSL2, or Ubuntu 22.04+

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/ugc-creator-pro.git
cd ugc-creator-pro

# Install dependencies
pnpm install

# Or with npm
npm install
```

### Step 2: Set Up Environment Variables

```bash
# Copy example environment files
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
cp services/script-studio/.env.example services/script-studio/.env
```

### Step 3: Start Infrastructure Services

```bash
# Start local infrastructure (PostgreSQL, MongoDB, Redis, Elasticsearch)
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Step 4: Initialize Databases

```bash
# Run database migrations
pnpm db:migrate

# Seed development data
pnpm db:seed
```

### Step 5: Start Development Servers

```bash
# Start all services in development mode
pnpm dev

# Or start specific services
pnpm --filter @ugc/web dev           # Web application only
pnpm --filter @ugc/script-studio dev # Script service only
```

### Step 6: Access the Application

- **Web Application**: http://localhost:3000
- **API Gateway**: http://localhost:4000
- **Script Service**: http://localhost:4001
- **Video Service**: http://localhost:4002
- **API Documentation**: http://localhost:4000/docs

---

## Environment Configuration

### Core Environment Variables

Create `.env.local` in the project root:

```env
# ============================================
# APPLICATION SETTINGS
# ============================================
NODE_ENV=development
APP_NAME=ugc-creator-pro
APP_URL=http://localhost:3000
API_URL=http://localhost:4000

# ============================================
# DATABASE CONFIGURATION
# ============================================
# PostgreSQL (Primary Database)
DATABASE_URL=postgresql://ugc_user:ugc_password@localhost:5432/ugc_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# MongoDB (Content Metadata)
MONGODB_URI=mongodb://localhost:27017/ugc_content
MONGODB_DATABASE=ugc_content

# Redis (Cache & Sessions)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_TLS_ENABLED=false

# Elasticsearch (Search)
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX_PREFIX=ugc_

# ============================================
# AUTHENTICATION
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth (Microsoft)
AZURE_AD_CLIENT_ID=your-azure-ad-client-id
AZURE_AD_CLIENT_SECRET=your-azure-ad-client-secret
AZURE_AD_TENANT_ID=your-azure-ad-tenant-id

# ============================================
# AI SERVICES
# ============================================
# Claude API (Anthropic)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# OpenAI (Fallback)
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-4o

# ElevenLabs (Voice Synthesis)
ELEVENLABS_API_KEY=xxxxx
ELEVENLABS_DEFAULT_VOICE=adam

# Azure AI Speech (Voice Alternative)
AZURE_SPEECH_KEY=xxxxx
AZURE_SPEECH_REGION=eastus

# ============================================
# AZURE STORAGE
# ============================================
AZURE_STORAGE_ACCOUNT=ugccreatorstorage
AZURE_STORAGE_KEY=xxxxx
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=xxx
AZURE_CONTAINER_VIDEOS=videos
AZURE_CONTAINER_IMAGES=images
AZURE_CONTAINER_ASSETS=assets
AZURE_CDN_ENDPOINT=https://ugccreator.azureedge.net

# ============================================
# PAYMENT PROCESSING
# ============================================
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_STARTER=price_xxxxx
STRIPE_PRICE_GROWTH=price_xxxxx
STRIPE_PRICE_STUDIO=price_xxxxx

# ============================================
# EXTERNAL INTEGRATIONS
# ============================================
# Meta (Facebook/Instagram)
META_APP_ID=xxxxx
META_APP_SECRET=xxxxx

# TikTok
TIKTOK_CLIENT_KEY=xxxxx
TIKTOK_CLIENT_SECRET=xxxxx

# Google Ads
GOOGLE_ADS_CLIENT_ID=xxxxx
GOOGLE_ADS_CLIENT_SECRET=xxxxx
GOOGLE_ADS_DEVELOPER_TOKEN=xxxxx

# ============================================
# EMAIL SERVICE
# ============================================
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@ugccreatorpro.com
EMAIL_FROM_NAME=UGC Creator Pro

# ============================================
# MONITORING & LOGGING
# ============================================
LOG_LEVEL=debug
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
APPLICATION_INSIGHTS_KEY=xxxxx

# ============================================
# FEATURE FLAGS
# ============================================
FEATURE_MARKETPLACE=false
FEATURE_MOBILE_APP=false
FEATURE_AI_AVATARS=true
FEATURE_PERFORMANCE_PREDICTION=false
```

### Service-Specific Configuration

Each microservice has its own `.env` file. Example for `services/script-studio/.env`:

```env
PORT=4001
SERVICE_NAME=script-studio
DATABASE_URL=${DATABASE_URL}
REDIS_URL=${REDIS_URL}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
MESSAGE_QUEUE_URL=amqp://localhost:5672
```

---

## Database Setup

### PostgreSQL Schema Migration

```bash
# Navigate to database migrations
cd infrastructure/database

# Run migrations using Prisma
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio
```

### MongoDB Collections Setup

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/ugc_content

# Create collections with validation
db.createCollection("scripts", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "title", "content", "createdAt"],
      properties: {
        userId: { bsonType: "string" },
        title: { bsonType: "string" },
        content: { bsonType: "string" }
      }
    }
  }
});

db.createCollection("videos", { /* similar schema */ });
db.createCollection("assets", { /* similar schema */ });
```

### Redis Configuration

```bash
# Connect to Redis CLI
redis-cli

# Verify connection
PING  # Should return PONG

# Set up key prefixes for namespacing
# The application handles this automatically
```

### Elasticsearch Index Setup

```bash
# Create indices for search
curl -X PUT "localhost:9200/ugc_scripts" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  },
  "mappings": {
    "properties": {
      "title": { "type": "text" },
      "content": { "type": "text" },
      "userId": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "createdAt": { "type": "date" }
    }
  }
}'
```

---

## Service Configuration

### Script Studio Service

```bash
cd services/script-studio

# Install dependencies
pnpm install

# Copy environment
cp .env.example .env

# Start in development
pnpm dev
```

### Video Generator Service

```bash
cd services/video-generator

# Install dependencies
pnpm install

# Install FFmpeg (required for video processing)
# macOS
brew install ffmpeg

# Ubuntu
sudo apt update && sudo apt install ffmpeg

# Start service
pnpm dev
```

### AI/ML Components

```bash
cd ai/performance-ml

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start ML service
python src/api/server.py
```

---

## Azure Infrastructure Setup

### Step 1: Azure CLI Authentication

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your-Subscription-Name"

# Verify
az account show
```

### Step 2: Create Resource Group

```bash
# Create resource group
az group create \
  --name rg-ugc-creator-prod \
  --location eastus

# Create service principal for Terraform
az ad sp create-for-rbac \
  --name "sp-ugc-terraform" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/rg-ugc-creator-prod
```

### Step 3: Initialize Terraform

```bash
cd infrastructure/terraform/environments/dev

# Initialize Terraform
terraform init

# Review plan
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

### Step 4: Configure Azure Resources

The Terraform configuration creates:
- Azure Kubernetes Service (AKS) cluster
- Azure Container Registry (ACR)
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Azure Blob Storage accounts
- Azure CDN profiles
- Azure Key Vault
- Azure Monitor workspace
- Virtual Network and subnets

---

## Kubernetes Deployment

### Step 1: Connect to AKS

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group rg-ugc-creator-prod \
  --name aks-ugc-creator-prod

# Verify connection
kubectl get nodes
```

### Step 2: Create Namespaces

```bash
# Create namespaces
kubectl create namespace ugc-dev
kubectl create namespace ugc-staging
kubectl create namespace ugc-production

# Set default namespace
kubectl config set-context --current --namespace=ugc-dev
```

### Step 3: Deploy Secrets

```bash
# Create secrets from Key Vault
kubectl create secret generic ugc-secrets \
  --from-literal=database-url="$(az keyvault secret show --name db-url --vault-name kv-ugc-creator --query value -o tsv)" \
  --from-literal=jwt-secret="$(az keyvault secret show --name jwt-secret --vault-name kv-ugc-creator --query value -o tsv)"
```

### Step 4: Deploy Services

```bash
# Deploy using Kustomize
kubectl apply -k infrastructure/kubernetes/overlays/dev

# Or deploy with Helm
helm upgrade --install ugc-creator ./helm/ugc-creator \
  --namespace ugc-dev \
  --values ./helm/ugc-creator/values-dev.yaml
```

### Step 5: Verify Deployment

```bash
# Check pod status
kubectl get pods -n ugc-dev

# Check services
kubectl get services -n ugc-dev

# Check ingress
kubectl get ingress -n ugc-dev

# View logs
kubectl logs -f deployment/script-studio -n ugc-dev
```

---

## CI/CD Pipeline Setup

### Azure DevOps Configuration

1. Create a new project in Azure DevOps
2. Connect to your Git repository
3. Create service connections for Azure and ACR

### Pipeline Configuration

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - develop

variables:
  - group: ugc-creator-variables
  - name: dockerRegistry
    value: 'acr-ugc-creator.azurecr.io'

stages:
  - stage: Build
    jobs:
      - job: BuildAndTest
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'
          - script: |
              pnpm install
              pnpm test
              pnpm build
            displayName: 'Install, Test, Build'

  - stage: Deploy_Dev
    condition: eq(variables['Build.SourceBranch'], 'refs/heads/develop')
    jobs:
      - deployment: DeployToDev
        environment: 'ugc-dev'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: KubernetesManifest@0
                  inputs:
                    action: 'deploy'
                    namespace: 'ugc-dev'
                    manifests: |
                      $(Pipeline.Workspace)/k8s/dev/*.yaml
```

---

## Monitoring and Observability

### Application Insights Setup

```bash
# Install Application Insights agent
npm install applicationinsights --save

# Configure in your application
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPLICATION_INSIGHTS_KEY)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true)
  .start();
```

### Prometheus & Grafana

```bash
# Deploy Prometheus stack using Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
```

### Log Analytics

```bash
# Enable Container Insights
az aks enable-addons \
  --resource-group rg-ugc-creator-prod \
  --name aks-ugc-creator-prod \
  --addons monitoring \
  --workspace-resource-id /subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.OperationalInsights/workspaces/{workspace}
```

---

## Troubleshooting

### Common Issues

**Issue: Database connection refused**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart service
docker-compose restart postgres
```

**Issue: Redis connection timeout**
```bash
# Verify Redis is accessible
redis-cli ping

# Check Redis logs
docker-compose logs redis
```

**Issue: Build failures**
```bash
# Clear node modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install

# Clear Turbo cache
pnpm turbo daemon stop
rm -rf .turbo
```

**Issue: Kubernetes pods not starting**
```bash
# Describe pod for events
kubectl describe pod <pod-name> -n ugc-dev

# Check resource quotas
kubectl describe resourcequota -n ugc-dev

# Check node resources
kubectl top nodes
```

### Getting Help

- Check the [FAQ](./docs/faq.md)
- Join our [Discord community](https://discord.gg/ugccreatorpro)
- Open an issue on GitHub
- Contact support at support@ugccreatorpro.com

---

## Next Steps

After completing the setup:

1. Review the [Architecture Documentation](./ARCHITECTURAL-DIAGRAM.md)
2. Explore the [API Reference](./docs/api/README.md)
3. Read the [Contributing Guide](./CONTRIBUTING.md)
4. Set up your development workflow with the recommended VS Code extensions

Happy building!
