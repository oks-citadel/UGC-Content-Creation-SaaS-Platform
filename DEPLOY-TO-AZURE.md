# CreatorBridge Azure Deployment Guide

## Prerequisites

### 1. Install Required Tools

```powershell
# Install Azure CLI
winget install Microsoft.AzureCLI

# Install Terraform
winget install Hashicorp.Terraform

# Install Docker Desktop
winget install Docker.DockerDesktop

# Install kubectl
winget install Kubernetes.kubectl

# Install Helm
winget install Helm.Helm

# Install Node.js (if not installed)
winget install OpenJS.NodeJS.LTS
```

### 2. Azure Account Setup

1. Create Azure account: https://azure.microsoft.com/free/
2. Ensure you have an active subscription

### 3. Login to Azure

```powershell
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account list --output table
az account set --subscription "Your Subscription Name"

# Verify
az account show
```

---

## Step 1: Create Azure Resources with Terraform

```powershell
# Navigate to terraform directory
cd infrastructure/terraform/staging

# Initialize Terraform
terraform init

# Review what will be created
terraform plan -out=tfplan

# Apply (this takes 15-30 minutes)
terraform apply tfplan
```

This creates:
- Resource Group
- AKS Kubernetes Cluster
- Azure PostgreSQL Flexible Server
- Azure Redis Cache
- Azure Container Registry (ACR)
- Azure Blob Storage
- Azure Key Vault
- Azure Front Door (CDN)
- Application Insights

---

## Step 2: Configure kubectl

```powershell
# Get AKS credentials
az aks get-credentials \
  --resource-group creatorbridge-staging \
  --name creatorbridge-staging-aks

# Verify connection
kubectl get nodes
```

---

## Step 3: Build and Push Docker Images

```powershell
# Login to Azure Container Registry
az acr login --name creatorbridgestaging

# Build all services
docker-compose -f infrastructure/docker/docker-compose.yml build

# Tag and push images
$services = @("api-gateway", "auth-service", "user-service", "billing-service",
              "campaign-service", "creator-service", "content-service",
              "asset-service", "rights-service", "payout-service",
              "notification-service", "analytics-service")

foreach ($svc in $services) {
    docker tag ${svc}:latest creatorbridgestaging.azurecr.io/${svc}:latest
    docker push creatorbridgestaging.azurecr.io/${svc}:latest
}
```

---

## Step 4: Configure Secrets in Key Vault

```powershell
# Set secrets
az keyvault secret set --vault-name creatorbridge-kv --name "jwt-secret" --value "your-jwt-secret-min-32-chars"
az keyvault secret set --vault-name creatorbridge-kv --name "stripe-secret-key" --value "sk_test_..."
az keyvault secret set --vault-name creatorbridge-kv --name "stripe-webhook-secret" --value "whsec_..."
az keyvault secret set --vault-name creatorbridge-kv --name "sendgrid-api-key" --value "SG...."
```

---

## Step 5: Run Database Migrations

```powershell
# Get database connection string from Terraform output
$DB_URL = terraform output -raw database_connection_string

# Run migrations for each service
$env:DATABASE_URL = $DB_URL
cd ../../services/auth-service && npx prisma migrate deploy
cd ../user-service && npx prisma migrate deploy
cd ../asset-service && npx prisma migrate deploy
cd ../rights-service && npx prisma migrate deploy
cd ../payout-service && npx prisma migrate deploy
# ... repeat for other services
```

---

## Step 6: Deploy to Kubernetes

```powershell
# Create namespace
kubectl create namespace creatorbridge-staging

# Apply Kubernetes manifests
kubectl apply -k infrastructure/k8s/staging/

# Wait for pods to be ready
kubectl get pods -n creatorbridge-staging -w
```

---

## Step 7: Configure DNS

After deployment, get the external IP:

```powershell
kubectl get ingress -n creatorbridge-staging
```

Then configure your DNS:
- `api-staging.creatorbridge.com` → External IP
- `app-staging.creatorbridge.com` → Frontend URL (if using Vercel)

---

## Step 8: Verify Deployment

```powershell
# Check all pods are running
kubectl get pods -n creatorbridge-staging

# Check services
kubectl get svc -n creatorbridge-staging

# Test health endpoint
curl https://api-staging.creatorbridge.com/health

# Run verification script
./scripts/verify-deployment.sh staging
```

---

## Estimated Costs (Staging)

| Resource | SKU | Monthly Cost |
|----------|-----|--------------|
| AKS (3 nodes) | Standard_D2s_v3 | ~$150 |
| PostgreSQL | Burstable B2s | ~$30 |
| Redis | Basic C0 | ~$16 |
| Storage | Standard | ~$5 |
| Container Registry | Basic | ~$5 |
| Front Door | Standard | ~$35 |
| **Total** | | **~$240/month** |

---

## Quick Deploy Script

Run everything with one command:

```powershell
./scripts/deploy.sh staging
```

---

## Troubleshooting

### Pods not starting
```powershell
kubectl describe pod <pod-name> -n creatorbridge-staging
kubectl logs <pod-name> -n creatorbridge-staging
```

### Database connection issues
```powershell
# Check secret exists
kubectl get secrets -n creatorbridge-staging

# Verify connection string
kubectl exec -it <pod-name> -n creatorbridge-staging -- env | grep DATABASE
```

### Image pull errors
```powershell
# Ensure ACR is linked to AKS
az aks update -n creatorbridge-staging-aks -g creatorbridge-staging --attach-acr creatorbridgestaging
```
