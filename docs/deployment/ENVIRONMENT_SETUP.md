# NEXUS Platform - Environment Setup Guide

This guide provides comprehensive instructions for setting up environment variables across all deployment environments for the NEXUS platform, including the new AI-powered features.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Environment Variables Reference](#environment-variables-reference)
4. [Local Development Setup](#local-development-setup)
5. [Staging Environment](#staging-environment)
6. [Production Configuration](#production-configuration)
7. [Obtaining API Keys](#obtaining-api-keys)
8. [Validation and Testing](#validation-and-testing)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The NEXUS platform uses environment variables for configuration management across different deployment environments. This approach provides:

- **Security**: Sensitive credentials are never committed to version control
- **Flexibility**: Easy configuration changes without code modifications
- **Environment Isolation**: Different configurations for development, staging, and production

### Environment Files

| File | Purpose |
|------|---------|
| `.env.example` | Master template with all variables documented |
| `.env.development.example` | Development environment template |
| `.env.staging.example` | Staging environment template |
| `.env.production.example` | Production environment template |
| `.env.local` | Your local configuration (git-ignored) |

---

## Quick Start

### 1. Copy the Example File

```bash
# For local development
cp .env.development.example .env.local

# Or use the master template
cp .env.example .env.local
```

### 2. Set Required Variables

At minimum, set these for local development:

```bash
# Database (using Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nexus_dev
MONGODB_URI=mongodb://localhost:27017/nexus_dev
REDIS_URL=redis://localhost:6379

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-development-secret-min-32-chars
JWT_SECRET=your-jwt-secret-min-32-chars

# AI Services (optional for development)
OPENAI_API_KEY=sk-your-openai-key
```

### 3. Validate Configuration

```bash
# Run validation script
node scripts/validate-env.js

# With connectivity checks
node scripts/validate-env.js --check-connectivity
```

---

## Environment Variables Reference

### Required vs Optional Variables

Variables are categorized by requirement level:

| Level | Description |
|-------|-------------|
| **REQUIRED** | Must be set for the application to start |
| **RECOMMENDED** | Should be set for full functionality |
| **OPTIONAL** | Can be left empty; feature will be disabled |
| **DEV-ONLY** | Only needed in development environment |

### Core Platform Variables

#### Application Settings

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Environment: development, staging, production |
| `APP_NAME` | Yes | `nexus-platform` | Application name for logs and metrics |
| `APP_URL` | Yes | `http://localhost:3000` | Base URL of the application |
| `APP_VERSION` | No | `1.0.0` | Application version |

#### Database Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `DATABASE_POOL_MIN` | No | `2` | Minimum pool connections |
| `DATABASE_POOL_MAX` | No | `10` | Maximum pool connections |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `REDIS_URL` | Yes | - | Redis connection URL |
| `REDIS_PASSWORD` | Staging/Prod | - | Redis password |

#### Authentication

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXTAUTH_URL` | Yes | - | NextAuth.js canonical URL |
| `NEXTAUTH_SECRET` | Yes | - | Session encryption key (min 32 chars) |
| `JWT_SECRET` | Yes | - | JWT signing key (min 32 chars) |
| `JWT_ISSUER` | No | `nexus-platform` | JWT issuer identifier |
| `JWT_AUDIENCE` | No | `nexus-platform-api` | JWT audience identifier |
| `JWT_ACCESS_TOKEN_EXPIRY` | No | `900` | Access token expiry (seconds) |
| `JWT_REFRESH_TOKEN_EXPIRY` | No | `604800` | Refresh token expiry (seconds) |

### New Feature Variables

#### AI Center Services

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_CENTER_URL` | Staging/Prod | `http://localhost:8005` | AI Center service URL |
| `OPENAI_API_KEY` | Recommended | - | OpenAI API key |
| `OPENAI_EMBEDDING_MODEL` | No | `text-embedding-3-small` | Embedding model |
| `OPENAI_ANALYSIS_MODEL` | No | `gpt-4o` | Analysis model |

#### Vector Database (Qdrant)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `QDRANT_URL` | Staging/Prod | `http://localhost:6333` | Qdrant server URL |
| `QDRANT_API_KEY` | Staging/Prod | - | Qdrant API key |
| `QDRANT_COLLECTION_PREFIX` | No | `nexus` | Collection name prefix |

#### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_AI_BRIEF_GENERATOR` | `true` | Enable AI Brief Generator |
| `FEATURE_CREATOR_DNA` | `true` | Enable Creator DNA profiling |
| `FEATURE_GAMIFICATION` | `true` | Enable gamification system |
| `FEATURE_PERSONALIZATION` | `true` | Enable personalization engine |

#### Personalization Engine

| Variable | Default | Description |
|----------|---------|-------------|
| `PERSONALIZATION_CACHE_TTL` | `300` | Cache TTL in seconds |
| `RECOMMENDATION_BATCH_SIZE` | `50` | Batch size for processing |
| `RECOMMENDATION_MIN_CONFIDENCE` | `0.5` | Minimum confidence score (0-1) |
| `RECOMMENDATION_MAX_RESULTS` | `20` | Max recommendations per request |
| `PERSONALIZATION_AB_TESTING` | `false` | Enable A/B testing |

#### Gamification System

| Variable | Default | Description |
|----------|---------|-------------|
| `XP_MULTIPLIER_DEFAULT` | `1.0` | Default XP multiplier |
| `LEADERBOARD_REFRESH_INTERVAL` | `3600` | Refresh interval in seconds |
| `STREAK_MAX_DAYS` | `365` | Maximum streak days |
| `DAILY_CHALLENGE_RESET_HOUR` | `0` | Reset hour (UTC, 24h format) |
| `GAMIFICATION_SEASONAL_EVENTS` | `true` | Enable seasonal events |

#### AI Brief Generator

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_BRIEF_RATE_LIMIT` | `10` | Requests per user per hour |
| `AI_BRIEF_MAX_LENGTH` | `5000` | Maximum brief length (chars) |
| `AI_BRIEF_TEMPLATES_ENABLED` | `true` | Enable brief templates |

#### Creator DNA

| Variable | Default | Description |
|----------|---------|-------------|
| `DNA_ANALYSIS_RATE_LIMIT` | `5` | Analyses per user per day |
| `DNA_RECALCULATION_INTERVAL` | `24` | Recalculation interval (hours) |
| `DNA_MIN_CONTENT_COUNT` | `10` | Min content for analysis |
| `DNA_EMBEDDING_DIMENSIONS` | `1536` | Embedding dimensions |

---

## Local Development Setup

### Prerequisites

1. **Docker & Docker Compose** - For local services
2. **Node.js 18+** - Runtime environment
3. **pnpm** - Package manager

### Step 1: Start Local Services

```bash
# Start all required services
docker-compose -f docker-compose.dev.yml up -d

# This starts:
# - PostgreSQL (localhost:5432)
# - MongoDB (localhost:27017)
# - Redis (localhost:6379)
# - Qdrant (localhost:6333)
# - MailHog (localhost:8025)
```

### Step 2: Create Configuration

```bash
# Copy development template
cp .env.development.example .env.local

# Generate secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 64  # For JWT_SECRET
```

### Step 3: Configure API Keys (Optional)

For AI features to work locally:

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env.local`:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

### Step 4: Validate Setup

```bash
# Check configuration
node scripts/validate-env.js

# Check with connectivity tests
node scripts/validate-env.js --check-connectivity

# View configuration summary
node scripts/validate-env.js --summary
```

### Development Convenience Settings

Development mode includes relaxed settings:

```bash
# Relaxed rate limits
AI_BRIEF_RATE_LIMIT=100
DNA_ANALYSIS_RATE_LIMIT=50

# Faster recalculations
DNA_RECALCULATION_INTERVAL=1
LEADERBOARD_REFRESH_INTERVAL=300

# Lower thresholds
DNA_MIN_CONTENT_COUNT=3
RECOMMENDATION_MIN_CONFIDENCE=0.3
```

---

## Staging Environment

### Staging Requirements

Staging mirrors production but uses:
- Test/sandbox API keys
- Separate database instances
- Staging domain (staging.nexusugc.com)

### Configuration

Use CI/CD secrets or Azure Key Vault to inject:

```yaml
# Example GitHub Actions secrets
AZURE_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID_STAGING }}
DATABASE_URL: ${{ secrets.DATABASE_URL_STAGING }}
QDRANT_API_KEY: ${{ secrets.QDRANT_API_KEY_STAGING }}
OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY_STAGING }}
JWT_SECRET: ${{ secrets.JWT_SECRET_STAGING }}
```

### Kubernetes Deployment

```bash
# Apply staging secrets
kubectl apply -f infrastructure/k8s/base/new-feature-secrets.yaml
kubectl apply -f infrastructure/k8s/staging/secrets-patch.yaml

# Verify secrets
kubectl get secrets -n creatorbridge
```

---

## Production Configuration

### Security Requirements

1. **All secrets must be stored in Azure Key Vault**
2. **Use External Secrets Operator** for Kubernetes
3. **Minimum 64-character secrets** for JWT and encryption
4. **HTTPS required** for all URLs

### Production Checklist

- [ ] `NODE_ENV=production`
- [ ] All URLs use HTTPS
- [ ] `SKIP_EMAIL_VERIFICATION=false`
- [ ] `HOT_RELOAD=false`
- [ ] `MOCK_EXTERNAL_APIS=false`
- [ ] JWT_SECRET is 64+ characters
- [ ] NEXTAUTH_SECRET is 32+ characters
- [ ] Stripe uses live keys (`sk_live_*`, `pk_live_*`)
- [ ] Qdrant API key configured
- [ ] OpenAI API key configured

### Azure Key Vault Integration

```bash
# Store secrets in Key Vault
az keyvault secret set --vault-name kv-nexus-prod \
  --name nexus-jwt-secret \
  --value "$(openssl rand -base64 64)"

az keyvault secret set --vault-name kv-nexus-prod \
  --name nexus-openai-api-key \
  --value "sk-your-production-key"

az keyvault secret set --vault-name kv-nexus-prod \
  --name nexus-qdrant-api-key \
  --value "your-qdrant-api-key"
```

### External Secrets Operator

See `infrastructure/k8s/base/new-feature-secrets.yaml` for the External Secrets template.

---

## Obtaining API Keys

### OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-`)

**Cost Considerations:**
- `text-embedding-3-small`: ~$0.00002 per 1K tokens
- `text-embedding-3-large`: ~$0.00013 per 1K tokens
- `gpt-4o`: ~$0.0025 per 1K input tokens

### Qdrant API Key

#### Qdrant Cloud

1. Go to [cloud.qdrant.io](https://cloud.qdrant.io)
2. Create a cluster
3. Navigate to **API Keys**
4. Create and copy the key

#### Self-Hosted Qdrant

```bash
# Generate API key
openssl rand -base64 32

# Configure in Qdrant
docker run -p 6333:6333 \
  -e QDRANT__SERVICE__API_KEY=your-key \
  qdrant/qdrant
```

### JWT Secret Generation

```bash
# Generate 64-byte secret (recommended for production)
openssl rand -base64 64

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## Validation and Testing

### Environment Validation Script

```bash
# Basic validation
node scripts/validate-env.js

# Validate for specific environment
node scripts/validate-env.js --env=production

# Show detailed summary
node scripts/validate-env.js --summary --verbose

# List required variables
node scripts/validate-env.js --required --env=staging
```

### Connectivity Checks

```bash
# Check all services
node scripts/validate-env.js --check-connectivity

# Check AI services only
node scripts/validate-env.js --check-ai

# Check Qdrant only
node scripts/validate-env.js --check-qdrant
```

### Programmatic Validation

```javascript
const { initializeConfig, validateEnvWithConnectivity } = require('@nexus/config');

// At application startup
try {
  const config = initializeConfig({
    environment: process.env.NODE_ENV,
    throwOnError: true,
    logWarnings: true,
  });

  console.log('Configuration loaded:', config.app.name);
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}

// With connectivity checks
const result = await validateEnvWithConnectivity('production', {
  checkConnectivity: true,
});

if (!result.isValid) {
  console.error('Validation failed:', result.errors);
}

if (result.connectivity.qdrant?.connected) {
  console.log('Qdrant is reachable');
}
```

---

## Troubleshooting

### Common Issues

#### "Required environment variable not set"

```bash
# Check which variables are missing
node scripts/validate-env.js --required

# View current values (redacted)
node scripts/validate-env.js --summary --verbose
```

#### "Qdrant connection failed"

1. Verify Qdrant is running:
   ```bash
   curl http://localhost:6333/collections
   ```

2. Check API key if using authentication:
   ```bash
   curl -H "api-key: YOUR_KEY" http://localhost:6333/collections
   ```

3. Verify network connectivity in Kubernetes:
   ```bash
   kubectl exec -it <pod> -- curl http://qdrant-service:6333/collections
   ```

#### "OpenAI API key invalid"

1. Verify key format (should start with `sk-`)
2. Check key hasn't expired
3. Verify billing is active on your OpenAI account

#### "JWT Secret too short"

Production requires minimum 32 characters. Generate a new one:
```bash
openssl rand -base64 64
```

### Debug Mode

Enable verbose logging:
```bash
LOG_LEVEL=debug node scripts/validate-env.js --verbose
```

### Support

For additional help:
1. Check the [main documentation](../README.md)
2. Review [architecture docs](../architecture/)
3. Contact the platform team

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-20 | Initial release with new feature variables |

---

*This document is maintained by the NEXUS Platform team. Last updated: January 2026*
