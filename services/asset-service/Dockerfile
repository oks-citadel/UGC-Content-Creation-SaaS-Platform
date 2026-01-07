# =============================================================================
# NEXUS Asset Service - Dockerfile (Monorepo Compatible)
# =============================================================================

FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat vips-dev

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8 --activate

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/

COPY services/asset-service/package.json services/asset-service/
COPY services/asset-service/prisma services/asset-service/prisma/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/types packages/types
COPY packages/utils packages/utils
COPY services/asset-service/src services/asset-service/src
COPY services/asset-service/tsconfig.json services/asset-service/

RUN cd services/asset-service && npx prisma generate

RUN cd packages/types && pnpm tsc --outDir dist || true
RUN cd packages/utils && pnpm tsc --outDir dist || true
RUN cd services/asset-service && pnpm tsc --outDir dist

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat vips-dev

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

COPY --from=builder /app/services/asset-service/package.json services/asset-service/
COPY --from=builder /app/services/asset-service/dist services/asset-service/dist
COPY --from=builder /app/services/asset-service/prisma services/asset-service/prisma
COPY --from=builder /app/services/asset-service/node_modules/.prisma services/asset-service/node_modules/.prisma

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

RUN chown -R nexus:nodejs /app

USER nexus

ENV NODE_ENV=production
ENV PORT=3016

EXPOSE 3016

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3016/health || exit 1

CMD ["node", "services/asset-service/dist/index.js"]
