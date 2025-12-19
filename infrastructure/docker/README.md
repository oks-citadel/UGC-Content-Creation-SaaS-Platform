# NEXUS Platform - Docker Development Environment

Complete Docker-based local development environment for the NEXUS platform.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Services](#services)
- [Configuration](#configuration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Overview

This Docker setup provides a complete local development environment including:

- **Infrastructure Services**: PostgreSQL, MongoDB, Redis, Elasticsearch, MinIO, n8n, MailHog
- **Backend Services**: API Gateway, Auth, User, Content, Campaign, Creator, Billing, Analytics, Commerce, Marketplace, AI
- **Workers**: Video Processor, Social Publisher, Notification Dispatcher, Analytics Aggregator
- **Frontend Apps**: Web, Brand Portal, Creator Portal, Admin Dashboard

## Prerequisites

- Docker Desktop 4.20+ or Docker Engine 24.0+
- Docker Compose 2.20+
- At least 8GB RAM allocated to Docker
- At least 20GB free disk space

## Quick Start

### 1. Copy Environment File

```bash
cd infrastructure/docker
cp .env.example .env
```

### 2. Start All Services

```bash
# From project root
pnpm docker:up

# Or directly with docker-compose
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### 3. Initialize Database

```bash
# Wait for PostgreSQL to be ready, then run migrations
docker-compose -f infrastructure/docker/docker-compose.yml exec postgres /docker-entrypoint-initdb.d/init-db.sh

# Run application migrations
pnpm db:migrate

# Seed test data (optional)
docker-compose -f infrastructure/docker/docker-compose.yml exec -T postgres bash < infrastructure/docker/scripts/seed-data.sh
```

### 4. Access Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Web App | http://localhost:3000 | - |
| Brand Portal | http://localhost:3001 | - |
| Creator Portal | http://localhost:3002 | - |
| Admin Dashboard | http://localhost:3003 | - |
| API Gateway | http://localhost:4000 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| n8n Workflows | http://localhost:5678 | admin / admin |
| MailHog | http://localhost:8025 | - |
| Elasticsearch | http://localhost:9200 | - |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Applications                    │
│  ┌──────┐  ┌─────────┐  ┌────────┐  ┌───────┐             │
│  │ Web  │  │  Brand  │  │Creator │  │ Admin │             │
│  │ :3000│  │ :3001   │  │ :3002  │  │ :3003 │             │
│  └──┬───┘  └────┬────┘  └───┬────┘  └───┬───┘             │
└─────┼──────────┼────────────┼───────────┼──────────────────┘
      │          │            │           │
      └──────────┴────────────┴───────────┘
                      │
      ┌───────────────▼───────────────┐
      │     API Gateway :4000         │
      └───────────────┬───────────────┘
                      │
      ┌───────────────┴───────────────────────────────┐
      │                                               │
┌─────▼─────────────────────────────────────────────────────┐
│                   Backend Services                         │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌─────────┐ ┌────────┐    │
│  │ Auth │ │ User │ │Content │ │Campaign │ │Creator │    │
│  │:4001 │ │:4002 │ │ :4003  │ │  :4004  │ │ :4005  │    │
│  └──────┘ └──────┘ └────────┘ └─────────┘ └────────┘    │
│  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐     │
│  │Billing │ │Analytics │ │Commerce │ │Marketplace │     │
│  │ :4006  │ │  :4007   │ │  :4008  │ │   :4009    │     │
│  └────────┘ └──────────┘ └─────────┘ └────────────┘     │
│  ┌──────────┐                                             │
│  │AI Service│                                             │
│  │  :8000   │                                             │
│  └──────────┘                                             │
└────────────────────────────────────────────────────────────┘
      │                    │
┌─────▼─────────┐   ┌──────▼──────────────────────┐
│   Workers     │   │    Infrastructure           │
│ ┌───────────┐ │   │ ┌──────────┐ ┌────────┐    │
│ │  Video    │ │   │ │PostgreSQL│ │MongoDB │    │
│ │ Processor │ │   │ │  :5432   │ │ :27017 │    │
│ └───────────┘ │   │ └──────────┘ └────────┘    │
│ ┌───────────┐ │   │ ┌────────┐ ┌─────────────┐ │
│ │  Social   │ │   │ │ Redis  │ │Elasticsearch│ │
│ │ Publisher │ │   │ │ :6379  │ │   :9200     │ │
│ └───────────┘ │   │ └────────┘ └─────────────┘ │
│ ┌───────────┐ │   │ ┌──────┐ ┌─────┐ ┌───────┐ │
│ │Notification│ │   │ │MinIO │ │ n8n │ │Mailhog│ │
│ │ Dispatcher│ │   │ │:9000 │ │:5678│ │ :8025 │ │
│ └───────────┘ │   │ └──────┘ └─────┘ └───────┘ │
│ ┌───────────┐ │   │                             │
│ │ Analytics │ │   │                             │
│ │Aggregator │ │   │                             │
│ └───────────┘ │   │                             │
└───────────────┘   └─────────────────────────────┘
```

## Services

### Infrastructure Services

#### PostgreSQL (postgres:15-alpine)
- **Port**: 5432
- **Database**: nexus_dev
- **User/Password**: postgres/postgres
- **Features**: UUID, pgcrypto, pg_trgm extensions
- **Health Check**: pg_isready

#### MongoDB (mongo:7)
- **Port**: 27017
- **Database**: nexus_dev
- **User/Password**: mongo/mongo
- **Health Check**: mongosh ping

#### Redis (redis:7-alpine)
- **Port**: 6379
- **Max Memory**: 512MB
- **Eviction Policy**: allkeys-lru
- **Persistence**: Enabled (AOF)

#### Elasticsearch (8.11.0)
- **Port**: 9200, 9300
- **Cluster**: Single node
- **Memory**: 512MB heap
- **Security**: Disabled (dev only)

#### MinIO (S3-compatible storage)
- **API Port**: 9000
- **Console Port**: 9001
- **Credentials**: minioadmin/minioadmin
- **Buckets**: uploads, media, videos, thumbnails

#### n8n (Workflow Automation)
- **Port**: 5678
- **Credentials**: admin/admin
- **Use Case**: Automate workflows, integrations

#### MailHog (Email Testing)
- **SMTP Port**: 1025
- **Web UI Port**: 8025
- **Use Case**: Capture and view outgoing emails

### Backend Services

All backend services are built from the monorepo with shared packages.

- **API Gateway** (4000): Main entry point, routing, rate limiting
- **Auth Service** (4001): Authentication, JWT tokens, sessions
- **User Service** (4002): User management, profiles
- **Content Service** (4003): Content management, media handling
- **Campaign Service** (4004): Campaign management
- **Creator Service** (4005): Creator profiles, portfolios
- **Billing Service** (4006): Payments, subscriptions, invoicing
- **Analytics Service** (4007): Analytics, metrics, reporting
- **Commerce Service** (4008): E-commerce, product management
- **Marketplace Service** (4009): Creator marketplace
- **AI Service** (8000): AI/ML features, content generation (Python/FastAPI)

### Workers

Background workers for async processing:

- **Video Processor**: Video transcoding, thumbnail generation
- **Social Publisher**: Publish content to social platforms
- **Notification Dispatcher**: Email, SMS, push notifications
- **Analytics Aggregator**: Data aggregation, metrics calculation

### Frontend Applications

Next.js applications with hot-reload enabled:

- **Web App** (3000): Main user-facing application
- **Brand Portal** (3001): Brand management interface
- **Creator Portal** (3002): Creator dashboard
- **Admin Dashboard** (3003): Admin panel

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and customize:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/nexus_dev
MONGODB_URI=mongodb://mongo:mongo@mongodb:27017/nexus_dev?authSource=admin
REDIS_URL=redis://redis:6379

# Storage (MinIO)
STORAGE_ENDPOINT=http://minio:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin

# Azure Services (optional)
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_API_KEY=your-key

# External APIs (optional)
STRIPE_SECRET_KEY=sk_test_...
TIKTOK_CLIENT_KEY=...
META_APP_ID=...
```

### Volume Management

Persistent data is stored in named volumes:

- `nexus-postgres-data`: PostgreSQL data
- `nexus-mongodb-data`: MongoDB data
- `nexus-redis-data`: Redis data
- `nexus-elasticsearch-data`: Elasticsearch data
- `nexus-minio-data`: MinIO (S3) data
- `nexus-n8n-data`: n8n workflows

To reset all data:

```bash
docker-compose -f infrastructure/docker/docker-compose.yml down -v
```

## Usage

### Starting Services

```bash
# Start all services
pnpm docker:up

# Start specific service
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres redis

# Start with logs
pnpm docker:logs
```

### Stopping Services

```bash
# Stop all services
pnpm docker:down

# Stop and remove volumes
docker-compose -f infrastructure/docker/docker-compose.yml down -v
```

### Viewing Logs

```bash
# All services
pnpm docker:logs

# Specific service
docker-compose -f infrastructure/docker/docker-compose.yml logs -f api-gateway

# Last 100 lines
docker-compose -f infrastructure/docker/docker-compose.yml logs --tail=100
```

### Rebuilding Services

```bash
# Rebuild all
docker-compose -f infrastructure/docker/docker-compose.yml build

# Rebuild specific service
docker-compose -f infrastructure/docker/docker-compose.yml build api-gateway

# Rebuild and restart
docker-compose -f infrastructure/docker/docker-compose.yml up -d --build api-gateway
```

### Running Commands in Containers

```bash
# Execute command
docker-compose -f infrastructure/docker/docker-compose.yml exec api-gateway sh

# Run migrations
docker-compose -f infrastructure/docker/docker-compose.yml exec api-gateway pnpm db:migrate

# Access PostgreSQL
docker-compose -f infrastructure/docker/docker-compose.yml exec postgres psql -U postgres -d nexus_dev
```

### Testing

Use the test stack for running tests:

```bash
# Start test environment
docker-compose -f infrastructure/docker/docker-compose.test.yml up -d

# Run tests
docker-compose -f infrastructure/docker/docker-compose.test.yml run test-runner

# Run integration tests
docker-compose -f infrastructure/docker/docker-compose.test.yml run integration-test-runner

# Run E2E tests
docker-compose -f infrastructure/docker/docker-compose.test.yml run e2e-test-runner

# Cleanup
docker-compose -f infrastructure/docker/docker-compose.test.yml down -v
```

## Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml logs [service-name]
```

**Check health:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml ps
```

### Port Conflicts

If ports are already in use, modify the `.env` file:

```bash
# Change service ports
API_GATEWAY_PORT=4100
WEB_PORT=3100
```

### Out of Memory

Increase Docker memory limit:
- Docker Desktop: Settings > Resources > Memory (recommend 8GB+)

### Database Connection Issues

**Wait for database to be healthy:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml exec postgres pg_isready
```

**Reset database:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml down -v
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres
```

### Hot Reload Not Working

**Check volume mounts:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml config
```

**Restart service:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml restart [service-name]
```

### MinIO Bucket Issues

**Recreate buckets:**
```bash
docker-compose -f infrastructure/docker/docker-compose.yml restart minio-init
```

### Clean Slate

**Remove everything and start fresh:**
```bash
# Stop and remove containers, volumes, networks
docker-compose -f infrastructure/docker/docker-compose.yml down -v

# Remove images
docker-compose -f infrastructure/docker/docker-compose.yml down --rmi all

# Start fresh
pnpm docker:up
```

## Best Practices

1. **Always use docker-compose down -v** when resetting to avoid stale data
2. **Check health status** before running migrations or tests
3. **Use service names** (not localhost) in application configs for inter-service communication
4. **Monitor resources** using `docker stats`
5. **Keep .env file secure** - never commit actual secrets
6. **Use named volumes** for important data
7. **Enable health checks** for all services
8. **Use multi-stage builds** to optimize image sizes

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NEXUS Platform Documentation](../../docs/)
- [Development Guide](../../docs/development.md)

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review service logs
- Open an issue in the repository
