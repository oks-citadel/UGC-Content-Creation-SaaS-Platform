# =============================================================================
# CreatorBridge Rights Service - Dockerfile
# =============================================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy packages
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/

# Copy service
COPY services/rights-service/package.json services/rights-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/types packages/types
COPY packages/utils packages/utils
COPY services/rights-service services/rights-service

# Build packages
RUN pnpm --filter @nexus/types build
RUN pnpm --filter @nexus/utils build
RUN pnpm --filter @nexus/rights-service build

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

COPY --from=builder /app/services/rights-service/package.json services/rights-service/
COPY --from=builder /app/services/rights-service/dist services/rights-service/dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Set ownership
RUN chown -R nexus:nodejs /app

# Switch to non-root user
USER nexus

# Environment
ENV NODE_ENV=production
ENV PORT=8089

EXPOSE 8089

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8089/health || exit 1

# Start
CMD ["node", "services/rights-service/dist/index.js"]
