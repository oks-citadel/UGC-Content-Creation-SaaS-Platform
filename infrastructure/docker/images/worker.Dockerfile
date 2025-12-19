# =============================================================================
# NEXUS Platform - Worker Image
# =============================================================================
# Multi-stage Docker image for background workers
# =============================================================================

ARG WORKER_NAME

# Build stage
FROM node:20-alpine AS builder

ARG WORKER_NAME
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy packages
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/config/package.json packages/config/

# Copy worker
COPY workers/${WORKER_NAME}/package.json workers/${WORKER_NAME}/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/types packages/types
COPY packages/utils packages/utils
COPY packages/config packages/config
COPY workers/${WORKER_NAME} workers/${WORKER_NAME}

# Build packages
RUN pnpm --filter @nexus/types build
RUN pnpm --filter @nexus/utils build
RUN pnpm --filter @nexus/config build

# Build worker
RUN pnpm --filter @nexus/${WORKER_NAME} build

# Production stage
FROM node:20-alpine AS runner

ARG WORKER_NAME
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    wget \
    tini \
    ffmpeg

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

COPY --from=builder /app/packages/config/package.json packages/config/
COPY --from=builder /app/packages/config/dist packages/config/dist

COPY --from=builder /app/workers/${WORKER_NAME}/package.json workers/${WORKER_NAME}/
COPY --from=builder /app/workers/${WORKER_NAME}/dist workers/${WORKER_NAME}/dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Set ownership
RUN chown -R nexus:nodejs /app

# Switch to non-root user
USER nexus

# Environment
ENV NODE_ENV=production
ENV WORKER_NAME=${WORKER_NAME}

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Health check (workers typically don't expose HTTP endpoints, so we check process)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD pgrep -f "node.*${WORKER_NAME}" || exit 1

# Start worker
CMD ["sh", "-c", "node workers/${WORKER_NAME}/dist/index.js"]
