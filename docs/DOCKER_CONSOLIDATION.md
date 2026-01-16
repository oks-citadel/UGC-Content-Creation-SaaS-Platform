# Docker Consolidation Guide

This document explains the Docker build strategy for the NEXUS UGC Platform and identifies which Dockerfiles should be used.

## Recommended Dockerfiles

The platform uses a **monorepo approach with pnpm workspaces**. The primary `Dockerfile` in each service/app directory is the recommended version for production builds.

### Build Strategy

All services should use the monorepo-aware Dockerfile pattern:
- Build from the repository root context
- Use pnpm workspaces for dependency management
- Multi-stage builds (builder + runner)
- Non-root user for security
- Health checks included

## Deprecated Dockerfile Variants

The following variants were created for specific scenarios but should be **deprecated** in favor of the standard Dockerfile:

| Variant | Purpose | Status |
|---------|---------|--------|
| `Dockerfile.v2` | Standalone build without workspace deps | **DEPRECATED** |
| `Dockerfile.acr` | Azure Container Registry specific | **DEPRECATED** |
| `Dockerfile.npm` | npm instead of pnpm | **DEPRECATED** |
| `Dockerfile.yarn` | yarn instead of pnpm | **DEPRECATED** |
| `Dockerfile.simple` | Simplified build for debugging | **DEPRECATED** |
| `Dockerfile.standalone` | Standalone Next.js output | Keep for apps |

## Services with Redundant Files

The following services have redundant Dockerfile variants that can be removed:

### api-gateway
- `Dockerfile` (keep)
- `Dockerfile.v2` (remove)
- `Dockerfile.acr` (remove)
- `Dockerfile.npm` (remove)
- `Dockerfile.yarn` (remove)

### billing-service
- `Dockerfile` (keep)
- `Dockerfile.v2` (remove)
- `Dockerfile.acr` (remove)
- `Dockerfile.simple` (remove)

### Other Services with .v2 variants (remove .v2)
- analytics-service
- marketplace-service
- commerce-service
- creator-service
- compliance-service
- integration-service
- workflow-service
- campaign-service
- content-service
- user-service
- notification-service
- payout-service
- asset-service
- rights-service

### Frontend Apps
- `Dockerfile` (keep - monorepo build)
- `Dockerfile.standalone` (keep - for standalone deployment)
- `Dockerfile.simple` (remove if exists)

## Cleanup Commands

Run the following to remove deprecated Dockerfiles:

```bash
# From repository root
# Remove .v2 variants
find services -name "Dockerfile.v2" -type f -delete

# Remove .acr variants
find services -name "Dockerfile.acr" -type f -delete

# Remove .npm variants
find services -name "Dockerfile.npm" -type f -delete

# Remove .yarn variants
find services -name "Dockerfile.yarn" -type f -delete

# Remove .simple from services (keep in apps if needed)
find services -name "Dockerfile.simple" -type f -delete
```

## Standard Dockerfile Template

All services should follow this template:

```dockerfile
# =============================================================================
# NEXUS [SERVICE_NAME] - Dockerfile
# =============================================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

# Copy packages
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/

# Copy service
COPY services/[service-name]/package.json services/[service-name]/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY packages/types packages/types
COPY packages/utils packages/utils
COPY services/[service-name] services/[service-name]

# Build
RUN cd packages/types && pnpm tsc --outDir dist || true
RUN cd packages/utils && pnpm tsc --outDir dist || true
RUN cd services/[service-name] && pnpm tsc --outDir dist

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nexus

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Copy built application
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./

COPY --from=builder /app/packages/types/package.json packages/types/
COPY --from=builder /app/packages/types/dist packages/types/dist

COPY --from=builder /app/packages/utils/package.json packages/utils/
COPY --from=builder /app/packages/utils/dist packages/utils/dist

COPY --from=builder /app/services/[service-name]/package.json services/[service-name]/
COPY --from=builder /app/services/[service-name]/dist services/[service-name]/dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Set ownership
RUN chown -R nexus:nodejs /app

# Switch to non-root user
USER nexus

# Environment
ENV NODE_ENV=production
ENV PORT=[port]

EXPOSE [port]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:[port]/health || exit 1

# Start
CMD ["node", "services/[service-name]/dist/index.js"]
```

## Building Images

### Development
```bash
# Build specific service
docker build -t nexus-[service]:dev -f services/[service]/Dockerfile .
```

### Production
```bash
# Build with CI/CD pipeline
docker build -t nexus-[service]:$(git rev-parse --short HEAD) -f services/[service]/Dockerfile .
```

## Migration Notes

When migrating from deprecated variants:
1. Ensure all environment variables are properly set
2. Test health checks work correctly
3. Verify Prisma migrations run on startup if applicable
4. Check that all workspace dependencies resolve correctly
