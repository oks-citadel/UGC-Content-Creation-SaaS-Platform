# NEXUS Platform

## Complete Setup & Installation Guide

---

## 1. Prerequisites

Before beginning the installation, ensure your development environment meets the following requirements.

### 1.1 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 4 cores | 8+ cores |
| RAM | 16 GB | 32+ GB |
| Storage | 50 GB SSD | 100+ GB SSD |
| OS | macOS 12+ / Ubuntu 22.04+ / Windows 11 | macOS / Linux |

### 1.2 Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 18.0+ (LTS) | https://nodejs.org |
| Python | 3.11+ | https://python.org |
| pnpm | 8.0+ | `npm install -g pnpm` |
| Docker | 24.0+ | https://docker.com |
| Docker Compose | 2.20+ | Included with Docker Desktop |
| Git | 2.40+ | https://git-scm.com |

---

## 2. Installation

### 2.1 Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/your-org/nexus-platform.git
cd nexus-platform
```

### 2.2 Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

> **Note:** This will install dependencies for all apps and packages in the monorepo using Turborepo's optimized caching.

### 2.3 Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Edit the `.env.local` file with your configuration:

```bash
# Database Configuration
DATABASE_URL=postgresql://user:pass@localhost:5432/nexus
MONGODB_URL=mongodb://localhost:27017/nexus
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
NEXTAUTH_SECRET=your-nextauth-secret-here

# External APIs
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Social Platform APIs
TIKTOK_CLIENT_KEY=...
META_APP_ID=...
YOUTUBE_API_KEY=...
```

---

## 3. Start Development Services

### 3.1 Start Infrastructure (Docker)

```bash
# Start PostgreSQL, MongoDB, Redis, Elasticsearch
docker-compose up -d
```

This starts all required database services in the background.

### 3.2 Run Database Migrations

```bash
# Apply database schema migrations
pnpm db:migrate

# Seed development data (optional)
pnpm db:seed
```

### 3.3 Start Development Servers

```bash
# Start all applications in development mode
pnpm dev
```

Or start specific applications:

```bash
# Start only the web app
pnpm dev --filter=web

# Start backend services only
pnpm dev --filter='./services/*'

# Start AI services only
pnpm dev --filter='./ai/*'
```

---

## 4. Development URLs

| Service | URL |
|---------|-----|
| Web Application | http://localhost:3000 |
| Creator Portal | http://localhost:3001 |
| Brand Portal | http://localhost:3002 |
| Admin Dashboard | http://localhost:3003 |
| API Gateway | http://localhost:4000 |
| API Documentation (Swagger) | http://localhost:4000/docs |
| GraphQL Playground | http://localhost:4000/graphql |
| Storybook (UI Components) | http://localhost:6006 |

---

## 5. AI Services Setup

The AI/ML services require additional setup for local development.

### 5.1 Python Environment

```bash
# Navigate to AI services directory
cd ai/

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 5.2 Start AI Services

```bash
# Start all AI services (from project root)
pnpm ai:dev

# Or start individual services
cd ai/video-generator && uvicorn main:app --reload --port 8001
cd ai/script-generator && uvicorn main:app --reload --port 8002
cd ai/performance-predictor && uvicorn main:app --reload --port 8003
```

### 5.3 AI Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Video Generator | 8001 | AI video creation |
| Script Generator | 8002 | AI script writing |
| Performance Predictor | 8003 | Content scoring |
| Recommendation Engine | 8004 | Creator/content matching |
| Content Moderation | 8005 | Safety & compliance |

---

## 6. Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all applications for production |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm lint` | Run ESLint across all packages |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed development data |
| `pnpm db:studio` | Open Prisma Studio (DB browser) |
| `pnpm storybook` | Start Storybook for UI components |
| `pnpm clean` | Clean all build artifacts |
| `docker-compose logs -f` | View Docker container logs |
| `docker-compose down` | Stop all Docker services |

---

## 7. Troubleshooting

### 7.1 Common Issues

#### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 pnpm dev --filter=web
```

#### Database Connection Failed

1. Ensure Docker containers are running:
```bash
docker-compose ps
```

2. Check database logs:
```bash
docker-compose logs postgres
docker-compose logs mongodb
```

3. Verify `DATABASE_URL` in `.env.local` matches Docker config

4. Reset database if needed:
```bash
docker-compose down -v
docker-compose up -d
pnpm db:migrate
```

#### Node Modules Issues

```bash
# Clean and reinstall dependencies
pnpm clean
rm -rf node_modules
rm -rf **/node_modules
pnpm install
```

#### Docker Memory Issues

Increase Docker Desktop memory allocation to at least 8GB in Docker settings.

#### AI Services Not Starting

1. Ensure Python virtual environment is activated
2. Check GPU drivers if using CUDA
3. Verify API keys are set in `.env.local`

```bash
# Test AI service health
curl http://localhost:8001/health
```

### 7.2 Getting Help

- **Internal Documentation:** Check the `/docs` folder for detailed guides
- **Slack Channel:** #nexus-dev-support
- **GitHub Issues:** Open an issue for bugs or feature requests
- **Engineering Lead:** Contact the tech lead for architectural questions

---

## 8. Production Deployment

### 8.1 Build for Production

```bash
# Build all applications
pnpm build

# Build specific application
pnpm build --filter=web
```

### 8.2 Deploy to Staging

```bash
# Deploy to staging environment
pnpm deploy:staging
```

### 8.3 Deploy to Production

```bash
# Deploy to production (requires approval)
pnpm deploy:production
```

### 8.4 Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -k infrastructure/kubernetes/overlays/production

# Check deployment status
kubectl get pods -n nexus
kubectl get services -n nexus
```

---

*— End of Setup Guide —*
