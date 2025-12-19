# =============================================================================
# NEXUS Admin Dashboard (Next.js) - Dockerfile
# =============================================================================

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Install dependencies for development
RUN apk add --no-cache curl wget

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy packages
COPY packages ./packages

# Copy app
COPY apps/admin ./apps/admin

# Install dependencies
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 3003

# Development mode with hot reload
ENV NODE_ENV=development
ENV PORT=3003
ENV HOSTNAME=0.0.0.0

CMD ["pnpm", "--filter", "@nexus/admin", "dev"]

# =============================================================================
# Builder stage
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
COPY packages/ui/package.json packages/ui/

# Copy app
COPY apps/admin/package.json apps/admin/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/types packages/types
COPY packages/utils packages/utils
COPY packages/ui packages/ui
COPY apps/admin apps/admin

# Build packages
RUN pnpm --filter @nexus/types build
RUN pnpm --filter @nexus/utils build
RUN pnpm --filter @nexus/ui build

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @nexus/admin build

# =============================================================================
# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Copy necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy built packages
COPY --from=builder /app/packages/types/package.json packages/types/
COPY --from=builder /app/packages/types/dist packages/types/dist

COPY --from=builder /app/packages/utils/package.json packages/utils/
COPY --from=builder /app/packages/utils/dist packages/utils/dist

COPY --from=builder /app/packages/ui/package.json packages/ui/
COPY --from=builder /app/packages/ui/dist packages/ui/dist

# Copy Next.js build
COPY --from=builder /app/apps/admin/package.json apps/admin/
COPY --from=builder /app/apps/admin/next.config.js apps/admin/
COPY --from=builder /app/apps/admin/public apps/admin/public
COPY --from=builder /app/apps/admin/.next apps/admin/.next

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/admin/.next/standalone/apps/admin/server.js"]
