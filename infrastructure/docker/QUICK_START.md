# NEXUS Platform - Docker Quick Start Guide

Get the NEXUS platform running locally in 5 minutes.

## Prerequisites

- Docker Desktop 4.20+ (with Docker Compose)
- 8GB+ RAM allocated to Docker
- 20GB+ free disk space

## Step 1: Copy Environment File

```bash
cd infrastructure/docker
cp .env.example .env
```

## Step 2: Start Infrastructure Services

```bash
# From infrastructure/docker directory
make up-infra

# Or from project root
docker-compose -f infrastructure/docker/docker-compose.yml up -d postgres mongodb redis elasticsearch minio mailhog
```

Wait 30 seconds for services to initialize.

## Step 3: Initialize Database

```bash
# From infrastructure/docker directory
make db-init

# Or manually
docker-compose -f infrastructure/docker/docker-compose.yml exec postgres /docker-entrypoint-initdb.d/init-db.sh
```

## Step 4: Start Backend Services

```bash
# From infrastructure/docker directory
make services-restart

# Or from project root
docker-compose -f infrastructure/docker/docker-compose.yml up -d api-gateway auth-service user-service content-service
```

## Step 5: Start Frontend Apps

```bash
# From infrastructure/docker directory
make frontend

# Or from project root
docker-compose -f infrastructure/docker/docker-compose.yml up -d web brand-portal creator-portal admin
```

## Step 6: Access Applications

Open your browser:

| Application | URL |
|-------------|-----|
| Web App | http://localhost:3000 |
| Brand Portal | http://localhost:3001 |
| Creator Portal | http://localhost:3002 |
| Admin Dashboard | http://localhost:3003 |
| API Gateway | http://localhost:4000/health |
| MinIO Console | http://localhost:9001 |
| MailHog | http://localhost:8025 |

## Verify Everything is Running

```bash
# Check service status
make status

# Or
docker-compose -f infrastructure/docker/docker-compose.yml ps
```

All services should show "healthy" or "running".

## Common Commands

```bash
# View logs
make logs                # All services
make logs-api           # API Gateway only
make logs-web           # Web app only

# Restart services
make restart            # All services
make api-restart        # API Gateway only
make web-restart        # Web app only

# Stop everything
make down

# Fresh start (removes all data)
make fresh
```

## Next Steps

1. **Seed Test Data** (optional):
   ```bash
   make db-seed
   ```

2. **Run Migrations**:
   ```bash
   make db-migrate
   ```

3. **Start Workers** (for background jobs):
   ```bash
   docker-compose -f infrastructure/docker/docker-compose.yml up -d video-processor notification-dispatcher
   ```

## Troubleshooting

### Services won't start
```bash
# Check logs
make logs

# Check Docker resources
docker stats
```

### Port conflicts
Edit `.env` file and change ports:
```bash
WEB_PORT=3100
API_GATEWAY_PORT=4100
```

### Database connection errors
```bash
# Wait for database to be ready
docker-compose -f infrastructure/docker/docker-compose.yml exec postgres pg_isready

# Restart database
make restart-postgres
```

### Fresh restart
```bash
# Remove everything and start over
make clean-volumes
make fresh
```

## Development Workflow

### Working on Backend Service

1. Start infrastructure:
   ```bash
   make up-infra
   ```

2. Run the service locally (outside Docker) for faster development:
   ```bash
   cd services/api-gateway
   pnpm dev
   ```

   Or run in Docker with hot-reload:
   ```bash
   docker-compose -f infrastructure/docker/docker-compose.yml up api-gateway
   ```

### Working on Frontend App

1. Start backend services:
   ```bash
   make up-infra
   make backend
   ```

2. Run the app locally:
   ```bash
   cd apps/web
   pnpm dev
   ```

   Or in Docker:
   ```bash
   docker-compose -f infrastructure/docker/docker-compose.yml up web
   ```

## Useful Tips

1. **Use Makefile commands** - They're shortcuts for common operations
2. **Check health before debugging** - Use `make health` to see service status
3. **Monitor resources** - Use `docker stats` to check CPU/memory usage
4. **Use service names in configs** - Services communicate using names (e.g., `postgres:5432`, not `localhost:5432`)
5. **Keep Docker Desktop updated** - Newer versions have better performance

## Getting Help

- Read the full [Docker README](./README.md)
- Check service logs: `make logs-[service]`
- View service health: `make health`
- Inspect containers: `make status`

## Quick Reference

| Command | Description |
|---------|-------------|
| `make up` | Start all services |
| `make down` | Stop all services |
| `make logs` | View all logs |
| `make status` | Check service status |
| `make clean` | Remove containers |
| `make fresh` | Fresh start with clean data |
| `make help` | Show all available commands |

Happy coding!
