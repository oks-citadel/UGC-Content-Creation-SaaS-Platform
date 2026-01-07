# =============================================================================
# NEXUS Video Processor Worker - Dockerfile (Monorepo Compatible)
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

COPY workers/video-processor/package.json workers/video-processor/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY packages/types packages/types
COPY packages/utils packages/utils
COPY workers/video-processor/src workers/video-processor/src
COPY workers/video-processor/tsconfig.json workers/video-processor/

RUN cd packages/types && pnpm tsc --outDir dist || true
RUN cd packages/utils && pnpm tsc --outDir dist || true
RUN cd workers/video-processor && pnpm tsc --outDir dist

FROM node:20-alpine AS runner

RUN apk add --no-cache ffmpeg openssl libc6-compat

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

COPY --from=builder /app/workers/video-processor/package.json workers/video-processor/
COPY --from=builder /app/workers/video-processor/dist workers/video-processor/dist

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

RUN mkdir -p /app/temp && chown -R nexus:nodejs /app

USER nexus

ENV NODE_ENV=production
ENV PORT=4001

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4001/health || exit 1

CMD ["node", "workers/video-processor/dist/index.js"]
