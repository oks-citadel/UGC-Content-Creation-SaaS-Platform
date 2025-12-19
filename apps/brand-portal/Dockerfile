# =============================================================================
# NEXUS Brand Portal (Next.js) - Dockerfile
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
COPY apps/brand-portal ./apps/brand-portal

# Install dependencies
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 3001

# Development mode with hot reload
ENV NODE_ENV=development
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

CMD ["pnpm", "--filter", "@nexus/brand-portal", "dev"]

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
COPY apps/brand-portal/package.json apps/brand-portal/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/types packages/types
COPY packages/utils packages/utils
COPY packages/ui packages/ui
COPY apps/brand-portal apps/brand-portal

# Build packages
RUN pnpm --filter @nexus/types build
RUN pnpm --filter @nexus/utils build
RUN pnpm --filter @nexus/ui build

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @nexus/brand-portal build

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
COPY --from=builder /app/apps/brand-portal/package.json apps/brand-portal/
COPY --from=builder /app/apps/brand-portal/next.config.js apps/brand-portal/
COPY --from=builder /app/apps/brand-portal/public apps/brand-portal/public
COPY --from=builder /app/apps/brand-portal/.next apps/brand-portal/.next

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/brand-portal/.next/standalone/apps/brand-portal/server.js"]
