# =============================================================================
# NEXUS Campaign Service - Dockerfile (Monorepo Compatible)
# =============================================================================

FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8 --activate

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

COPY packages/types/package.json packages/types/
COPY packages/utils/package.json packages/utils/

COPY services/campaign-service/package.json services/campaign-service/
COPY services/campaign-service/prisma services/campaign-service/prisma/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/types packages/types
COPY packages/utils packages/utils
COPY services/campaign-service/src services/campaign-service/src
COPY services/campaign-service/tsconfig.json services/campaign-service/

RUN cd services/campaign-service && npx prisma generate

RUN cd packages/types && pnpm tsc --outDir dist || true
RUN cd packages/utils && pnpm tsc --outDir dist || true
RUN cd services/campaign-service && pnpm tsc --outDir dist

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

COPY --from=builder /app/services/campaign-service/package.json services/campaign-service/
COPY --from=builder /app/services/campaign-service/dist services/campaign-service/dist
COPY --from=builder /app/services/campaign-service/prisma services/campaign-service/prisma
COPY --from=builder /app/services/campaign-service/node_modules/.prisma services/campaign-service/node_modules/.prisma

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

RUN chown -R nexus:nodejs /app

USER nexus

ENV NODE_ENV=production
ENV PORT=3004

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

CMD ["node", "services/campaign-service/dist/index.js"]
