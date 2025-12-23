# GitHub Actions Setup Guide

## Azure Credentials for GitHub Actions

To enable the CI/CD pipeline to build and deploy frontend apps (web, creator-portal, admin), you need to configure the `AZURE_CREDENTIALS` secret in your GitHub repository.

### Step 1: Go to GitHub Repository Settings

1. Navigate to: https://github.com/oks-citadel/UGC-Content-Creation-SaaS-Platform
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### Step 2: Add AZURE_CREDENTIALS Secret

**Name:** `AZURE_CREDENTIALS`

**Value:** (Copy the JSON below)

```json
{
  "clientId": "e44c83af-c15f-474e-9468-0d69c7ab7444",
  "clientSecret": "m648Q~2N8_TGRi_UDjlAcAkUTOb5sZ2b.HtI6bQP",
  "subscriptionId": "ba233460-2dbe-4603-a594-68f93ec9deb3",
  "tenantId": "ed27e9a3-1b1c-46c9-8a73-a4f3609d75c0"
}
```

### Step 3: Create Staging Environment (Optional)

For deployment approval gates:

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name it `staging`
4. Add required reviewers if desired

### Step 4: Trigger the Workflow

After adding the secret:

1. Go to **Actions** tab
2. Select "CI/CD Pipeline"
3. Click **Run workflow** → **Run workflow**

Or push any change to the `main` branch.

## Current ACR Images (29 images)

All backend services, AI services, and workers are already built:

### Backend Services (17)
- api-gateway, auth-service, user-service, campaign-service
- content-service, notification-service, rights-service, payout-service
- asset-service, billing-service, commerce-service, marketplace-service
- creator-service, compliance-service, workflow-service, integration-service
- analytics-service

### AI Services (7)
- ai-service, moderation-engine, recommendation-engine
- performance-predictor, video-generator, customer-agent, marketing-agent

### Workers (4)
- video-processor, social-publisher, analytics-aggregator, notification-dispatcher

### Frontend (1)
- brand-portal

### Pending (will build via GitHub Actions)
- web
- creator-portal
- admin

## Service Principal Details

- **Name:** github-actions-ugc-platform
- **Client ID:** e44c83af-c15f-474e-9468-0d69c7ab7444
- **Permissions:**
  - Contributor on marketing-staging-rg resource group
  - AcrPush on acrmktstagingravs container registry
