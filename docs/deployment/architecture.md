# Architecture Overview

> **Business-Agnostic SaaS Deployment Architecture**
> GoDaddy DNS → Vercel Frontend → Railway Backend

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Current State → Target State](#current-state--target-state)
3. [Component Topology](#component-topology)
4. [Request Flow](#request-flow)
5. [Dependency Map](#dependency-map)
6. [Environment Strategy](#environment-strategy)

---

## System Overview

This architecture defines a production-grade SaaS deployment using:

| Layer | Provider | Responsibility |
|-------|----------|----------------|
| **DNS** | GoDaddy | Domain registration, DNS management, SSL via providers |
| **Frontend** | Vercel | Static assets, SSR, edge functions, preview deployments |
| **Backend** | Railway | API services, databases, Redis, workers, cron jobs |
| **Source Control** | GitHub | Repository, PR workflow, CI quality gates |

### Design Principles

- **Zero-downtime deployments** via staged validation
- **Environment parity** across staging and production
- **Platform-native observability** (no external APM required)
- **Secrets never in Git** - environment-based injection only
- **Immutable deployments** - rollback by promoting previous builds

---

## Current State → Target State

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CURRENT STATE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Domain Registrar]     [Hosting Provider]     [Database/Services]      │
│         │                      │                       │                 │
│         ▼                      ▼                       ▼                 │
│    DNS Records ──────► Legacy Platform ◄────── Mixed Providers          │
│                              │                                           │
│                        (Monolithic)                                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           TARGET STATE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐                                                       │
│   │   GoDaddy    │                                                       │
│   │     DNS      │                                                       │
│   └──────┬───────┘                                                       │
│          │                                                               │
│          ├────────────────────┬────────────────────┐                     │
│          ▼                    ▼                    ▼                     │
│   ┌──────────────┐     ┌──────────────┐    ┌──────────────┐             │
│   │    Vercel    │     │    Vercel    │    │   Railway    │             │
│   │   (Root @)   │     │   (app.*)    │    │   (api.*)    │             │
│   │  Marketing   │     │   Frontend   │    │   Backend    │             │
│   └──────────────┘     └──────────────┘    └──────┬───────┘             │
│                                                    │                     │
│                         ┌──────────────────────────┼──────────────────┐  │
│                         ▼                          ▼                  ▼  │
│                  ┌────────────┐           ┌────────────┐     ┌─────────┐│
│                  │ PostgreSQL │           │   Redis    │     │ Workers ││
│                  │  (Railway) │           │ (Railway)  │     │(Railway)││
│                  └────────────┘           └────────────┘     └─────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Topology

### Frontend Layer (Vercel)

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Marketing     │  │   Application   │  │    Admin     │ │
│  │   Site (SSG)    │  │   (SSR/SPA)     │  │  Dashboard   │ │
│  │                 │  │                 │  │    (SPA)     │ │
│  │   example.com   │  │ app.example.com │  │admin.example │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┤
│  │ VERCEL FEATURES                                          │
│  ├──────────────────────────────────────────────────────────┤
│  │ • Edge Functions (middleware, auth checks)               │
│  │ • Preview Deployments (per PR)                           │
│  │ • Automatic HTTPS                                        │
│  │ • Global CDN                                             │
│  │ • Web Analytics                                          │
│  │ • Speed Insights                                         │
│  └──────────────────────────────────────────────────────────┘
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Backend Layer (Railway)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           RAILWAY PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                        API SERVICES                                  ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               ││
│  │  │ API Gateway  │  │ Auth Service │  │ User Service │  ...          ││
│  │  │   (main)     │  │              │  │              │               ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘               ││
│  │                                                                      ││
│  │  Exposed at: api.example.com                                         ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                        DATA LAYER                                    ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               ││
│  │  │  PostgreSQL  │  │    Redis     │  │   MongoDB    │               ││
│  │  │  (Primary)   │  │   (Cache)    │  │ (Documents)  │               ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘               ││
│  │                                                                      ││
│  │  Internal only - not exposed externally                              ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      BACKGROUND WORKERS                              ││
│  ├─────────────────────────────────────────────────────────────────────┤│
│  │                                                                      ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               ││
│  │  │   Worker 1   │  │   Worker 2   │  │   Cron Job   │  ...          ││
│  │  │ (Queue Proc) │  │(Notifications)│  │  (Cleanup)  │               ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘               ││
│  │                                                                      ││
│  │  No external exposure - triggered by queues/schedules                ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow

### User Authentication Flow

```
┌────────┐         ┌─────────┐         ┌─────────┐         ┌──────────┐
│  User  │         │ Vercel  │         │ Railway │         │ Database │
│Browser │         │Frontend │         │   API   │         │PostgreSQL│
└───┬────┘         └────┬────┘         └────┬────┘         └────┬─────┘
    │                   │                   │                   │
    │  1. GET /login    │                   │                   │
    │──────────────────►│                   │                   │
    │                   │                   │                   │
    │  2. Login Page    │                   │                   │
    │◄──────────────────│                   │                   │
    │                   │                   │                   │
    │  3. POST /api/auth/login              │                   │
    │──────────────────────────────────────►│                   │
    │                   │                   │                   │
    │                   │                   │  4. Verify Creds  │
    │                   │                   │──────────────────►│
    │                   │                   │                   │
    │                   │                   │  5. User Record   │
    │                   │                   │◄──────────────────│
    │                   │                   │                   │
    │  6. Set-Cookie + JWT                  │                   │
    │◄──────────────────────────────────────│                   │
    │                   │                   │                   │
    │  7. GET /dashboard│                   │                   │
    │──────────────────►│                   │                   │
    │                   │                   │                   │
    │  8. SSR with auth │                   │                   │
    │   (Edge function) │                   │                   │
    │                   │  9. GET /api/user │                   │
    │                   │──────────────────►│                   │
    │                   │                   │                   │
    │                   │  10. User data    │                   │
    │                   │◄──────────────────│                   │
    │                   │                   │                   │
    │  11. Rendered Page│                   │                   │
    │◄──────────────────│                   │                   │
    │                   │                   │                   │
```

### Webhook Processing Flow

```
┌──────────────┐    ┌─────────┐    ┌─────────┐    ┌───────┐    ┌────────┐
│   External   │    │ Railway │    │  Redis  │    │Worker │    │Database│
│   Service    │    │   API   │    │  Queue  │    │       │    │        │
└──────┬───────┘    └────┬────┘    └────┬────┘    └───┬───┘    └───┬────┘
       │                 │              │             │            │
       │  1. POST /webhooks/payment     │             │            │
       │────────────────►│              │             │            │
       │                 │              │             │            │
       │                 │  2. Validate signature     │            │
       │                 │  3. Enqueue job            │            │
       │                 │─────────────►│             │            │
       │                 │              │             │            │
       │  4. 200 OK      │              │             │            │
       │◄────────────────│              │             │            │
       │                 │              │             │            │
       │                 │              │  5. Dequeue │            │
       │                 │              │◄────────────│            │
       │                 │              │             │            │
       │                 │              │             │  6. Update │
       │                 │              │             │───────────►│
       │                 │              │             │            │
       │                 │              │             │  7. Done   │
       │                 │              │             │◄───────────│
       │                 │              │             │            │
```

---

## Dependency Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEPENDENCY HIERARCHY                              │
└─────────────────────────────────────────────────────────────────────────┘

Level 0 - Infrastructure (No dependencies)
┌─────────────────────────────────────────────────────────────────────────┐
│  GoDaddy DNS    │    GitHub Repo    │    Railway Project                │
└─────────────────────────────────────────────────────────────────────────┘
         │                  │                       │
         ▼                  ▼                       ▼
Level 1 - Data Layer (Depends on: Railway Project)
┌─────────────────────────────────────────────────────────────────────────┐
│  PostgreSQL     │    Redis          │    MongoDB (if used)              │
│  (Railway)      │    (Railway)      │    (Railway)                      │
└─────────────────────────────────────────────────────────────────────────┘
         │                  │                       │
         ▼                  ▼                       ▼
Level 2 - Backend Services (Depends on: Data Layer)
┌─────────────────────────────────────────────────────────────────────────┐
│  API Gateway    │    Auth Service   │    Core Services                  │
│  (Railway)      │    (Railway)      │    (Railway)                      │
└─────────────────────────────────────────────────────────────────────────┘
         │                  │                       │
         ▼                  ▼                       ▼
Level 3 - Workers (Depends on: Backend Services + Data Layer)
┌─────────────────────────────────────────────────────────────────────────┐
│  Queue Workers  │    Cron Jobs      │    Background Processors          │
│  (Railway)      │    (Railway)      │    (Railway)                      │
└─────────────────────────────────────────────────────────────────────────┘
         │                  │                       │
         ▼                  ▼                       ▼
Level 4 - Frontend (Depends on: Backend Services + DNS)
┌─────────────────────────────────────────────────────────────────────────┐
│  Marketing Site │    Application    │    Admin Dashboard                │
│  (Vercel)       │    (Vercel)       │    (Vercel)                       │
└─────────────────────────────────────────────────────────────────────────┘
         │                  │                       │
         ▼                  ▼                       ▼
Level 5 - DNS Resolution (Final layer)
┌─────────────────────────────────────────────────────────────────────────┐
│  @ → Vercel     │    app.* → Vercel │    api.* → Railway               │
│  (GoDaddy)      │    (GoDaddy)      │    (GoDaddy)                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Startup Order

1. **PostgreSQL** → Must be healthy before API services start
2. **Redis** → Must be healthy before API services start
3. **API Services** → Must be healthy before frontend can function
4. **Workers** → Can start after API services (graceful degradation)
5. **Frontend** → Deploys independently, depends on API at runtime
6. **DNS** → Updated last, after all services are validated

---

## Environment Strategy

### Environment Mapping

| Environment | Branch | Frontend URL | API URL | Database |
|-------------|--------|--------------|---------|----------|
| **Development** | `feature/*` | localhost:3000 | localhost:8000 | Local Docker |
| **Preview** | PR branches | `*.vercel.app` | staging API | Staging DB |
| **Staging** | `develop` | `staging.example.com` | `api-staging.example.com` | Staging DB |
| **Production** | `main` | `example.com` | `api.example.com` | Production DB |

### Deployment Pipeline

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│  Feature   │    │    PR      │    │  Staging   │    │ Production │
│  Branch    │───►│  Created   │───►│   Merge    │───►│   Merge    │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
      │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│   Local    │    │  Preview   │    │  Staging   │    │ Production │
│    Dev     │    │  Deploy    │    │  Deploy    │    │  Deploy    │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
                        │                 │                 │
                        ▼                 ▼                 ▼
                  ┌────────────┐    ┌────────────┐    ┌────────────┐
                  │  Lint +    │    │  Full      │    │  Blue-     │
                  │  Tests     │    │  E2E Tests │    │  Green     │
                  └────────────┘    └────────────┘    └────────────┘
```

---

## Cross-Cutting Concerns

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   AUTH ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User authenticates via Frontend (Vercel)                 │
│  2. Frontend calls /api/auth/* on Railway                    │
│  3. Railway issues JWT + Refresh Token                       │
│  4. JWT stored in httpOnly cookie (SameSite=Strict)          │
│  5. Refresh token stored in Redis with user session          │
│  6. Frontend includes cookie on all API requests             │
│  7. Railway validates JWT on each request                    │
│                                                              │
│  CORS Configuration:                                         │
│  - Origin: https://example.com, https://app.example.com      │
│  - Credentials: true                                         │
│  - Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Session Handling

| Aspect | Configuration |
|--------|---------------|
| **Session Store** | Redis (Railway) |
| **Token Type** | JWT (access) + Opaque (refresh) |
| **Access Token TTL** | 15 minutes |
| **Refresh Token TTL** | 7 days |
| **Cookie Settings** | `HttpOnly`, `Secure`, `SameSite=Strict` |
| **Session Revocation** | Redis-based blocklist |

---

## Assumptions

> ⚠️ **MARKED ASSUMPTIONS** - Validate before implementation

| ID | Assumption | Validation Command |
|----|------------|-------------------|
| A1 | Single PostgreSQL instance sufficient for initial load | `railway logs --service postgres` |
| A2 | Redis available in Railway region | `railway add --plugin redis` |
| A3 | Vercel Pro plan for team features | Check Vercel dashboard |
| A4 | GoDaddy supports required record types | GoDaddy DNS console |
| A5 | GitHub Actions minutes sufficient | GitHub billing page |

---

## Next Steps

1. Review [DNS Cutover Plan](./dns-cutover.md)
2. Configure [Deployments](./deployments.md)
3. Prepare [Rollback Procedures](./rollback.md)
4. Set up [Observability](./observability.md)
5. Implement [Security Baseline](./security-baseline.md)
6. Audit [Environment Variables](./env-vars-inventory.md)
