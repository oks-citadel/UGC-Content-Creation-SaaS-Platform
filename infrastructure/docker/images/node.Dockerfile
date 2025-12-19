# =============================================================================
# NEXUS Platform - Base Node.js Image
# =============================================================================
# Multi-stage base image for Node.js services
# =============================================================================

# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Install common dependencies
RUN apk add --no-cache \
    curl \
    wget \
    git \
    bash

# Install global tools
RUN pnpm add -g turbo nodemon ts-node typescript

# Set up pnpm store
RUN pnpm config set store-dir ~/.pnpm-store

# Default development user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nexus

# Set ownership
RUN chown -R nexus:nodejs /app

# Environment
ENV NODE_ENV=development
ENV PNPM_HOME=/home/nexus/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

USER nexus

CMD ["pnpm", "dev"]

# =============================================================================
# Builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy workspace files
COPY --chown=node:node pnpm-workspace.yaml ./
COPY --chown=node:node package.json pnpm-lock.yaml* ./

# Copy all packages
COPY --chown=node:node packages packages
COPY --chown=node:node services services
COPY --chown=node:node workers workers
COPY --chown=node:node apps apps

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build packages in order
RUN pnpm --filter @nexus/types build
RUN pnpm --filter @nexus/utils build
RUN pnpm --filter @nexus/config build

# This stage is used as a base for service-specific builds

# =============================================================================
# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    wget \
    tini

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nexus

# Set up tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

USER nexus

# Default command (should be overridden)
CMD ["node", "index.js"]
