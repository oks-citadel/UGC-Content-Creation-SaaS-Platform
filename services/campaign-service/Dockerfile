# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

# Copy packages
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils

# Copy service
COPY services/campaign-service ./services/campaign-service

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
RUN cd services/campaign-service && pnpm db:generate

# Build packages
RUN pnpm --filter @nexus/types build
RUN pnpm --filter @nexus/utils build

# Build service
RUN pnpm --filter @nexus/campaign-service build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nexus

# Copy built files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules

# Copy packages
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/utils/package.json ./packages/utils/
COPY --from=builder /app/packages/utils/dist ./packages/utils/dist

# Copy service
COPY --from=builder /app/services/campaign-service/package.json ./services/campaign-service/
COPY --from=builder /app/services/campaign-service/dist ./services/campaign-service/dist
COPY --from=builder /app/services/campaign-service/prisma ./services/campaign-service/prisma
COPY --from=builder /app/services/campaign-service/node_modules ./services/campaign-service/node_modules

USER nexus

EXPOSE 3003

WORKDIR /app/services/campaign-service

CMD ["node", "dist/index.js"]
