# Environment Variables Inventory

> **Complete Environment Variable Reference**
> Vercel Frontend + Railway Backend Configuration

---

## Table of Contents

1. [Variable Classification](#variable-classification)
2. [Frontend Variables (Vercel)](#frontend-variables-vercel)
3. [Backend Variables (Railway)](#backend-variables-railway)
4. [Shared Variables](#shared-variables)
5. [Environment Matrix](#environment-matrix)
6. [Migration Mapping](#migration-mapping)
7. [Validation Checklist](#validation-checklist)

---

## Variable Classification

### Security Levels

| Level | Description | Example | Storage |
|-------|-------------|---------|---------|
| **Public** | Safe for client-side | `NEXT_PUBLIC_*` | Git OK |
| **Private** | Server-side only | API keys | Platform env vars |
| **Secret** | Highly sensitive | DB passwords, JWT secrets | Platform env vars |

### Variable Prefix Convention

| Prefix | Meaning | Exposed To |
|--------|---------|------------|
| `NEXT_PUBLIC_` | Client-side accessible (Vercel) | Browser |
| `VITE_` | Client-side accessible (Vite) | Browser |
| (no prefix) | Server-side only | Node.js runtime |

---

## Frontend Variables (Vercel)

### Required Variables

| Variable | Description | Example | Scope |
|----------|-------------|---------|-------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.example.com` | Public |
| `NEXT_PUBLIC_APP_URL` | Frontend application URL | `https://app.example.com` | Public |
| `NEXTAUTH_URL` | NextAuth canonical URL | `https://app.example.com` | Private |
| `NEXTAUTH_SECRET` | NextAuth encryption secret | `<base64-string>` | Secret |

### Optional Variables

| Variable | Description | Example | Scope |
|----------|-------------|---------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error tracking | `https://xxx@sentry.io/xxx` | Public |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | `G-XXXXXXXXXX` | Public |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | Mixpanel analytics | `<token>` | Public |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_live_xxx` | Public |

### Feature Flags

| Variable | Description | Values |
|----------|-------------|--------|
| `NEXT_PUBLIC_FEATURE_AI` | Enable AI features | `true` / `false` |
| `NEXT_PUBLIC_FEATURE_ANALYTICS` | Enable analytics dashboard | `true` / `false` |
| `NEXT_PUBLIC_FEATURE_MARKETPLACE` | Enable marketplace | `true` / `false` |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | Show maintenance page | `true` / `false` |

### Vercel-Specific Variables

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `VERCEL` | Indicates Vercel environment | Yes |
| `VERCEL_ENV` | Environment name | Yes |
| `VERCEL_URL` | Deployment URL | Yes |
| `VERCEL_GIT_COMMIT_SHA` | Git commit SHA | Yes |
| `VERCEL_GIT_COMMIT_REF` | Git branch name | Yes |

---

## Backend Variables (Railway)

### Core Application

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | Yes |
| `PORT` | Application port | `8000` | Yes |
| `APP_NAME` | Application identifier | `api-service` | Yes |
| `APP_URL` | Backend service URL | `https://api.example.com` | Yes |
| `LOG_LEVEL` | Logging verbosity | `info` | No |

### Database

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://...` | Yes |
| `DATABASE_POOL_MIN` | Min pool connections | `5` | No |
| `DATABASE_POOL_MAX` | Max pool connections | `20` | No |
| `REDIS_URL` | Redis connection | `redis://...` | Yes |
| `MONGODB_URI` | MongoDB connection | `mongodb://...` | If used |

### Authentication

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | JWT signing key | `<base64-64-bytes>` | Yes |
| `JWT_ISSUER` | JWT issuer claim | `your-platform` | No |
| `JWT_AUDIENCE` | JWT audience claim | `your-platform-api` | No |
| `JWT_ACCESS_TOKEN_EXPIRY` | Access token TTL | `900` (seconds) | No |
| `JWT_REFRESH_TOKEN_EXPIRY` | Refresh token TTL | `604800` (seconds) | No |
| `SESSION_SECRET` | Session encryption | `<base64-32-bytes>` | Yes |

### CORS & Security

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CORS_ALLOWED_ORIGINS` | Allowed origins | `https://app.example.com,https://example.com` | Yes |
| `COOKIE_DOMAIN` | Cookie domain | `.example.com` | Yes |
| `RATE_LIMIT_MAX` | Max requests/minute | `100` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `60000` | No |

### External Services

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret | `sk_live_xxx` | If payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verify | `whsec_xxx` | If payments |
| `SENDGRID_API_KEY` | SendGrid email | `SG.xxx` | If email |
| `SENDGRID_FROM_EMAIL` | Sender email | `noreply@example.com` | If email |
| `TWILIO_ACCOUNT_SID` | Twilio SMS | `ACxxx` | If SMS |
| `TWILIO_AUTH_TOKEN` | Twilio auth | `<token>` | If SMS |
| `TWILIO_PHONE_NUMBER` | Twilio sender | `+1234567890` | If SMS |

### Social OAuth

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | Google OAuth | If Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | If Google login |
| `GITHUB_CLIENT_ID` | GitHub OAuth | If GitHub login |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth | If GitHub login |

### AI Services

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key | If AI features |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint | If Azure AI |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI key | If Azure AI |

### Railway-Specific Variables

| Variable | Description | Auto-Set |
|----------|-------------|----------|
| `RAILWAY_ENVIRONMENT` | Environment name | Yes |
| `RAILWAY_PROJECT_ID` | Project identifier | Yes |
| `RAILWAY_SERVICE_NAME` | Service name | Yes |
| `RAILWAY_GIT_COMMIT_SHA` | Git commit SHA | Yes |
| `RAILWAY_PUBLIC_DOMAIN` | Public domain | Yes |

---

## Shared Variables

Variables that must be consistent between frontend and backend:

| Variable (Frontend) | Variable (Backend) | Purpose |
|---------------------|-------------------|---------|
| `NEXT_PUBLIC_API_URL` | `APP_URL` | API base URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `STRIPE_SECRET_KEY` | Stripe (pub/secret pair) |
| — | `CORS_ALLOWED_ORIGINS` | Must include frontend URLs |
| `NEXTAUTH_SECRET` | — | Should match if using NextAuth |

---

## Environment Matrix

### Development

```bash
# .env.local (local development only, never commit)
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-not-for-production
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-jwt-secret-not-for-production
```

### Staging

```bash
# Vercel Staging Environment Variables
NEXT_PUBLIC_API_URL=https://api-staging.example.com
NEXT_PUBLIC_APP_URL=https://staging.example.com
NEXTAUTH_URL=https://staging.example.com
NEXTAUTH_SECRET=<staging-secret>

# Railway Staging Variables
NODE_ENV=staging
APP_URL=https://api-staging.example.com
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<staging-jwt-secret>
CORS_ALLOWED_ORIGINS=https://staging.example.com
```

### Production

```bash
# Vercel Production Environment Variables
NEXT_PUBLIC_API_URL=https://api.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com
NEXTAUTH_URL=https://app.example.com
NEXTAUTH_SECRET=<production-secret>
NEXT_PUBLIC_SENTRY_DSN=<sentry-dsn>
NEXT_PUBLIC_GA_ID=<ga-id>

# Railway Production Variables
NODE_ENV=production
PORT=8000
APP_URL=https://api.example.com
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<production-jwt-secret>
CORS_ALLOWED_ORIGINS=https://example.com,https://app.example.com
SENTRY_DSN=<sentry-dsn>
```

---

## Migration Mapping

### From Legacy Platform to Vercel/Railway

Use this mapping when migrating from an existing platform:

| Legacy Variable | Vercel Variable | Railway Variable |
|-----------------|-----------------|------------------|
| `API_BASE_URL` | `NEXT_PUBLIC_API_URL` | — |
| `FRONTEND_URL` | `NEXT_PUBLIC_APP_URL` | `CORS_ALLOWED_ORIGINS` |
| `AUTH_SECRET` | `NEXTAUTH_SECRET` | `JWT_SECRET` |
| `DB_CONNECTION` | — | `DATABASE_URL` |
| `CACHE_URL` | — | `REDIS_URL` |
| `STRIPE_KEY` | — | `STRIPE_SECRET_KEY` |
| `STRIPE_PK` | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | — |

### Variable Export Script

```bash
#!/bin/bash
# export-env.sh - Export variables from legacy platform

# Example: Export from Heroku
heroku config -a your-app --json > legacy-config.json

# Example: Export from Vercel
vercel env pull .env.legacy

# Parse and map to new format
node scripts/map-env-vars.js
```

**Mapping Script:**

```javascript
// scripts/map-env-vars.js
const legacyConfig = require('./legacy-config.json');

const mapping = {
  'API_BASE_URL': 'NEXT_PUBLIC_API_URL',
  'FRONTEND_URL': 'NEXT_PUBLIC_APP_URL',
  'AUTH_SECRET': 'NEXTAUTH_SECRET',
  'DB_CONNECTION': 'DATABASE_URL',
  // Add more mappings...
};

const vercelVars = {};
const railwayVars = {};

for (const [legacyKey, legacyValue] of Object.entries(legacyConfig)) {
  const newKey = mapping[legacyKey] || legacyKey;

  if (newKey.startsWith('NEXT_PUBLIC_') || newKey.startsWith('NEXTAUTH')) {
    vercelVars[newKey] = legacyValue;
  } else {
    railwayVars[newKey] = legacyValue;
  }
}

console.log('=== VERCEL VARIABLES ===');
console.log(JSON.stringify(vercelVars, null, 2));

console.log('\n=== RAILWAY VARIABLES ===');
console.log(JSON.stringify(railwayVars, null, 2));
```

---

## Validation Checklist

### Pre-Deployment Validation

```bash
#!/bin/bash
# validate-env.sh - Validate environment variables

REQUIRED_VERCEL=(
  "NEXT_PUBLIC_API_URL"
  "NEXT_PUBLIC_APP_URL"
  "NEXTAUTH_URL"
  "NEXTAUTH_SECRET"
)

REQUIRED_RAILWAY=(
  "NODE_ENV"
  "PORT"
  "DATABASE_URL"
  "REDIS_URL"
  "JWT_SECRET"
  "CORS_ALLOWED_ORIGINS"
)

echo "=== Vercel Environment Validation ==="
for var in "${REQUIRED_VERCEL[@]}"; do
  vercel env ls | grep -q "$var" && echo "✓ $var" || echo "✗ $var MISSING"
done

echo ""
echo "=== Railway Environment Validation ==="
for var in "${REQUIRED_RAILWAY[@]}"; do
  railway variables | grep -q "$var" && echo "✓ $var" || echo "✗ $var MISSING"
done
```

### Runtime Validation

```javascript
// config/validate-env.js
const requiredEnvVars = {
  frontend: [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ],
  backend: [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'CORS_ALLOWED_ORIGINS',
  ],
};

function validateEnv(type) {
  const required = requiredEnvVars[type];
  const missing = [];

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  console.log(`Environment validation passed for ${type}`);
}

module.exports = { validateEnv };
```

### Secrets Audit

```bash
# Check for exposed secrets in code
npx trufflehog filesystem --directory=. --only-verified

# Check for secrets in git history
npx trufflehog git file://. --only-verified
```

---

## Quick Reference

### Generate Secrets

```bash
# JWT Secret (64 bytes)
openssl rand -base64 64

# NextAuth Secret (32 bytes)
openssl rand -base64 32

# Session Secret (32 bytes)
openssl rand -base64 32

# API Key (32 bytes hex)
openssl rand -hex 32
```

### Vercel CLI Commands

```bash
# List all environment variables
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# Pull environment variables to local
vercel env pull .env.local
```

### Railway CLI Commands

```bash
# List all variables
railway variables

# Set a variable
railway variables set KEY=value

# Set multiple variables
railway variables set KEY1=value1 KEY2=value2

# Remove a variable
railway variables remove KEY

# Link variable from another service
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
```

---

## Variable Template Files

### `.env.example` (Git-committed template)

```bash
# Application
NODE_ENV=development
PORT=8000
APP_NAME=your-platform

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication (generate unique values)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
JWT_SECRET=generate-with-openssl-rand-base64-64

# Database (local development)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dev
REDIS_URL=redis://localhost:6379

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Optional: External Services
# STRIPE_SECRET_KEY=sk_test_xxx
# SENDGRID_API_KEY=SG.xxx
# SENTRY_DSN=https://xxx@sentry.io/xxx
```

### `.env.local.example` (Local overrides)

```bash
# Copy this to .env.local for local development
# Never commit .env.local to git

# Override any values from .env.example here
# DATABASE_URL=postgresql://user:pass@localhost:5432/mydb
```
