FROM node:18-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN pnpm install --prod --frozen-lockfile=false

# Copy built application
COPY dist ./dist

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Run as non-root user
USER node

# Expose health check port
EXPOSE 3003

CMD ["node", "dist/index.js"]
