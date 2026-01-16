# GitHub Actions Setup Guide

## CI/CD Pipeline Overview

The NEXUS UGC Platform uses GitHub Actions for continuous integration and deployment. All container images are stored in GitHub Container Registry (ghcr.io).

## Required Permissions

The CI/CD pipeline uses the built-in `GITHUB_TOKEN` which is automatically provided. No additional secrets are required for basic builds.

### Repository Settings

1. Go to **Settings** → **Actions** → **General**
2. Under "Workflow permissions", select **Read and write permissions**
3. Check **Allow GitHub Actions to create and approve pull requests**

## Pipeline Structure

The main workflow (`.github/workflows/ci-cd.yml`) includes:

### Jobs

1. **Security Scan** - Vulnerability scanning with Trivy and TruffleHog
2. **Lint & Type Check** - ESLint and TypeScript checking
3. **Unit Tests** - Runs all test suites
4. **Build Frontend Apps** - Builds web, creator-portal, admin
5. **Build Backend Services** - Builds all 17 backend services
6. **Build AI Services** - Builds all 6 AI services
7. **Build Workers** - Builds all 4 worker services
8. **Deployment Summary** - Creates summary of built images

### Triggers

- **Push to main** - Full build and push to registry
- **Pull Request** - Lint, type check, and tests only
- **Manual** - Can be triggered via workflow_dispatch

## Container Images

All images are pushed to GitHub Container Registry:

```
ghcr.io/oks-citadel/nexus-{service-name}:latest
ghcr.io/oks-citadel/nexus-{service-name}:{commit-sha}
```

### Frontend Apps (3)
- nexus-web
- nexus-creator-portal
- nexus-admin

### Backend Services (17)
- nexus-api-gateway
- nexus-auth-service
- nexus-user-service
- nexus-campaign-service
- nexus-content-service
- nexus-notification-service
- nexus-rights-service
- nexus-payout-service
- nexus-asset-service
- nexus-billing-service
- nexus-commerce-service
- nexus-marketplace-service
- nexus-creator-service
- nexus-compliance-service
- nexus-workflow-service
- nexus-integration-service
- nexus-analytics-service

### AI Services (6)
- nexus-moderation-engine
- nexus-recommendation-engine
- nexus-performance-predictor
- nexus-video-generator
- nexus-customer-agent
- nexus-marketing-agent

### Workers (4)
- nexus-video-processor
- nexus-social-publisher
- nexus-analytics-aggregator
- nexus-notification-dispatcher

## Manual Workflow Trigger

To manually trigger the workflow:

1. Go to **Actions** tab
2. Select **CI/CD Pipeline**
3. Click **Run workflow** → **Run workflow**

Or use GitHub CLI:
```bash
gh workflow run ci-cd.yml
```

## Viewing Container Images

To see all published images:

```bash
gh api /orgs/oks-citadel/packages?package_type=container
```

Or visit: https://github.com/orgs/oks-citadel/packages

## Deployment

For deployment to Kubernetes:

1. Create a `ghcr-secret` in your cluster:
```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT
```

2. Use Helm to deploy:
```bash
helm upgrade --install nexus ./infrastructure/helm/nexus-platform \
  --set global.image.registry=ghcr.io \
  --set global.image.tag=latest
```

## Dependabot

Dependabot is configured to automatically create PRs for:
- npm packages (weekly)
- Python packages (weekly)
- Docker base images (weekly)
- GitHub Actions (weekly)
- Terraform modules (weekly)

See `.github/dependabot.yml` for configuration.
