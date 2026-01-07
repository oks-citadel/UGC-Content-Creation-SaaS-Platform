# =============================================================================
# NEXUS Billing Service - Dockerfile (Monorepo Compatible)
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

COPY services/billing-service/package.json services/billing-service/
COPY services/billing-service/prisma services/billing-service/prisma/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/types packages/types
COPY packages/utils packages/utils
COPY services/billing-service/src services/billing-service/src
COPY services/billing-service/tsconfig.json services/billing-service/

RUN cd services/billing-service && npx prisma generate

RUN cd packages/types && pnpm tsc --outDir dist || true
RUN cd packages/utils && pnpm tsc --outDir dist || true
RUN cd services/billing-service && pnpm tsc --outDir dist

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

COPY --from=builder /app/services/billing-service/package.json services/billing-service/
COPY --from=builder /app/services/billing-service/dist services/billing-service/dist
COPY --from=builder /app/services/billing-service/prisma services/billing-service/prisma
COPY --from=builder /app/services/billing-service/node_modules/.prisma services/billing-service/node_modules/.prisma

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

RUN chown -R nexus:nodejs /app

USER nexus

ENV NODE_ENV=production
ENV PORT=3008

EXPOSE 3008

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3008/health || exit 1

CMD ["node", "services/billing-service/dist/index.js"]
