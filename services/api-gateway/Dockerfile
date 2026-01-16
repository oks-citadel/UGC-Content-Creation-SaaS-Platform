# =============================================================================
# NEXUS API Gateway - Dockerfile
# =============================================================================

# Build stage
FROM node:25-alpine AS builder

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
COPY services/api-gateway/package.json services/api-gateway/

# Install dependencies (skip postinstall to avoid build issues during install)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY packages/types packages/types
COPY packages/utils packages/utils
COPY services/api-gateway services/api-gateway

# Build TypeScript directly
RUN cd packages/types && pnpm tsc --outDir dist || true
RUN cd packages/utils && pnpm tsc --outDir dist || true
RUN cd services/api-gateway && pnpm tsc --outDir dist

# Production stage
FROM node:25-alpine AS runner

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

COPY --from=builder /app/services/api-gateway/package.json services/api-gateway/
COPY --from=builder /app/services/api-gateway/dist services/api-gateway/dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Set ownership
RUN chown -R nexus:nodejs /app

# Switch to non-root user
USER nexus

# Environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

# Start
CMD ["node", "services/api-gateway/dist/index.js"]
