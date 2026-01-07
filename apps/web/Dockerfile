# =============================================================================
# NEXUS Web App (Next.js) - Dockerfile
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
COPY apps/web ./apps/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Expose port
EXPOSE 3000

# Development mode with hot reload
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["pnpm", "--filter", "@nexus/web", "dev"]

# =============================================================================
# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY turbo.json ./
COPY tsconfig.json ./

# Copy packages
COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/
COPY packages/ui/package.json packages/ui/

# Copy app
COPY apps/web/package.json apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY packages/types packages/types
COPY packages/utils packages/utils
COPY packages/ui packages/ui
COPY apps/web apps/web

# Build packages
RUN pnpm --filter @nexus/types build
RUN pnpm --filter @nexus/utils build
RUN pnpm --filter @nexus/ui build

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @nexus/web build

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
COPY --from=builder /app/apps/web/package.json apps/web/
COPY --from=builder /app/apps/web/next.config.js apps/web/
COPY --from=builder /app/apps/web/public apps/web/public
COPY --from=builder /app/apps/web/.next apps/web/.next

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/.next/standalone/apps/web/server.js"]
