#!/bin/bash
# =============================================================================
# NEXUS Platform - Convert Dockerfiles to Monorepo Compatible
# =============================================================================

set -e

# Services with their ports
declare -A SERVICE_PORTS=(
  ["api-gateway"]="3000"
  ["auth-service"]="3001"
  ["user-service"]="3002"
  ["creator-service"]="3003"
  ["campaign-service"]="3004"
  ["content-service"]="3005"
  ["commerce-service"]="3006"
  ["analytics-service"]="3007"
  ["billing-service"]="3008"
  ["marketplace-service"]="3009"
  ["notification-service"]="3010"
  ["workflow-service"]="3011"
  ["compliance-service"]="3012"
  ["integration-service"]="3013"
  ["payout-service"]="3014"
  ["rights-service"]="3015"
  ["asset-service"]="3016"
  ["ai-service"]="3017"
)

generate_service_dockerfile() {
  local SERVICE=$1
  local PORT=${SERVICE_PORTS[$SERVICE]:-3000}
  local DOCKERFILE="services/$SERVICE/Dockerfile"

  echo "Generating monorepo Dockerfile for $SERVICE (port $PORT)..."

  cat > "$DOCKERFILE" << 'DOCKERFILE_CONTENT'
# =============================================================================
# NEXUS SERVICE_NAME_PLACEHOLDER - Dockerfile (Monorepo Compatible)
# =============================================================================

# Build stage
FROM node:20-alpine AS builder

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

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
COPY services/SERVICE_DIR_PLACEHOLDER/package.json services/SERVICE_DIR_PLACEHOLDER/

# Copy prisma if exists
COPY services/SERVICE_DIR_PLACEHOLDER/prisma services/SERVICE_DIR_PLACEHOLDER/prisma/ 2>/dev/null || true

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY packages/types packages/types
COPY packages/utils packages/utils
COPY services/SERVICE_DIR_PLACEHOLDER/src services/SERVICE_DIR_PLACEHOLDER/src
COPY services/SERVICE_DIR_PLACEHOLDER/tsconfig.json services/SERVICE_DIR_PLACEHOLDER/

# Generate Prisma Client if prisma exists
RUN if [ -d "services/SERVICE_DIR_PLACEHOLDER/prisma" ]; then cd services/SERVICE_DIR_PLACEHOLDER && npx prisma generate; fi

# Build TypeScript
RUN cd packages/types && pnpm tsc --outDir dist || true
RUN cd packages/utils && pnpm tsc --outDir dist || true
RUN cd services/SERVICE_DIR_PLACEHOLDER && pnpm tsc --outDir dist

# Production stage
FROM node:20-alpine AS runner

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl libc6-compat

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

COPY --from=builder /app/services/SERVICE_DIR_PLACEHOLDER/package.json services/SERVICE_DIR_PLACEHOLDER/
COPY --from=builder /app/services/SERVICE_DIR_PLACEHOLDER/dist services/SERVICE_DIR_PLACEHOLDER/dist

# Copy prisma if exists
COPY --from=builder /app/services/SERVICE_DIR_PLACEHOLDER/prisma services/SERVICE_DIR_PLACEHOLDER/prisma/ 2>/dev/null || true
COPY --from=builder /app/services/SERVICE_DIR_PLACEHOLDER/node_modules/.prisma services/SERVICE_DIR_PLACEHOLDER/node_modules/.prisma/ 2>/dev/null || true

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Set ownership
RUN chown -R nexus:nodejs /app

USER nexus

# Environment
ENV NODE_ENV=production
ENV PORT=PORT_PLACEHOLDER

EXPOSE PORT_PLACEHOLDER

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:PORT_PLACEHOLDER/health || exit 1

# Start application
CMD ["node", "services/SERVICE_DIR_PLACEHOLDER/dist/index.js"]
DOCKERFILE_CONTENT

  # Replace placeholders
  sed -i "s/SERVICE_NAME_PLACEHOLDER/$SERVICE/g" "$DOCKERFILE"
  sed -i "s/SERVICE_DIR_PLACEHOLDER/$SERVICE/g" "$DOCKERFILE"
  sed -i "s/PORT_PLACEHOLDER/$PORT/g" "$DOCKERFILE"
}

# Generate Dockerfiles for all services
for SERVICE in "${!SERVICE_PORTS[@]}"; do
  if [ "$SERVICE" != "api-gateway" ] && [ "$SERVICE" != "auth-service" ] && [ "$SERVICE" != "user-service" ]; then
    generate_service_dockerfile "$SERVICE"
  fi
done

echo "All service Dockerfiles converted!"
