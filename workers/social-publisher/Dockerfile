# =============================================================================
# NEXUS Social Publisher Worker - Dockerfile (Monorepo Compatible)
# =============================================================================

FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++ openssl libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8 --activate

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/

COPY workers/social-publisher/package.json workers/social-publisher/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/types packages/types
COPY packages/utils packages/utils
COPY workers/social-publisher/src workers/social-publisher/src
COPY workers/social-publisher/tsconfig.json workers/social-publisher/

RUN cd packages/types && pnpm tsc --outDir dist || true
RUN cd packages/utils && pnpm tsc --outDir dist || true
RUN cd workers/social-publisher && pnpm tsc --outDir dist

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nexus

RUN corepack enable && corepack prepare pnpm@8 --activate

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/pnpm-lock.yaml ./

COPY --from=builder /app/packages/types/package.json packages/types/
COPY --from=builder /app/packages/types/dist packages/types/dist

COPY --from=builder /app/packages/utils/package.json packages/utils/
COPY --from=builder /app/packages/utils/dist packages/utils/dist

COPY --from=builder /app/workers/social-publisher/package.json workers/social-publisher/
COPY --from=builder /app/workers/social-publisher/dist workers/social-publisher/dist

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

RUN chown -R nexus:nodejs /app

USER nexus

ENV NODE_ENV=production
ENV PORT=4002

EXPOSE 4002

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4002/health || exit 1

CMD ["node", "workers/social-publisher/dist/index.js"]
