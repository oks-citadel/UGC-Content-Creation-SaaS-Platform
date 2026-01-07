# =============================================================================
# NEXUS User Service - Dockerfile (Monorepo Compatible)
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
COPY services/user-service/package.json services/user-service/
COPY services/user-service/prisma services/user-service/prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY packages/types packages/types
COPY packages/utils packages/utils
COPY services/user-service/src services/user-service/src
COPY services/user-service/tsconfig.json services/user-service/

# Generate Prisma Client
RUN cd services/user-service && npx prisma generate

# Build TypeScript
RUN cd packages/types && pnpm tsc --outDir dist || true
RUN cd packages/utils && pnpm tsc --outDir dist || true
RUN cd services/user-service && pnpm tsc --outDir dist

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

COPY --from=builder /app/services/user-service/package.json services/user-service/
COPY --from=builder /app/services/user-service/dist services/user-service/dist
COPY --from=builder /app/services/user-service/prisma services/user-service/prisma
COPY --from=builder /app/services/user-service/node_modules/.prisma services/user-service/node_modules/.prisma

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Set ownership
RUN chown -R nexus:nodejs /app

USER nexus

# Environment
ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Start application
CMD ["node", "services/user-service/dist/index.js"]
