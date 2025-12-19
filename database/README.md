# NEXUS Platform - Database Documentation

## Overview

The NEXUS platform uses a polyglot persistence strategy to optimize for different data types and access patterns:

- **PostgreSQL**: Primary relational database for structured data
- **MongoDB**: Document store for flexible metadata and high-volume logs
- **Redis**: In-memory cache for sessions, caching, and real-time features

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Application Layer                   │
└─────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌────────────────┐ ┌──────────────┐ ┌──────────┐
│   PostgreSQL   │ │   MongoDB    │ │  Redis   │
│   (Primary)    │ │  (Metadata)  │ │ (Cache)  │
└────────────────┘ └──────────────┘ └──────────┘
```

## Database Structure

### PostgreSQL (Primary Database)

Location: `database/postgres/`

#### Schema (`schema.prisma`)
- Comprehensive Prisma schema with 60+ models
- Covers all core business entities
- Enforces data integrity with foreign keys and constraints
- Includes proper indexes for performance

#### Migrations (`migrations/`)
1. `001_initial_schema.sql` - Creates all tables and enums
2. `002_add_indexes.sql` - Performance optimization indexes
3. `003_add_triggers.sql` - Business logic automation

#### Seeds (`seeds/`)
- `plans.ts` - Subscription plan data
- `admin.ts` - Admin user and test accounts
- `index.ts` - Main seeding orchestrator

#### Key Features
- Row-level security (RLS) ready
- Soft deletes for users
- Audit logging via triggers
- Cascading deletes for data integrity
- Full-text search support
- JSON/JSONB for flexible metadata

### MongoDB (Document Store)

Location: `database/mongodb/schemas/`

#### Schemas

**1. Content Metadata** (`content-metadata.js`)
- Rich media metadata
- AI-generated insights
- Social media metrics
- Performance analytics
- Brand safety scores

**2. Analytics Events** (`analytics-events.js`)
- High-volume event tracking
- User behavior analytics
- Attribution tracking
- Funnel analysis
- Session tracking

**3. Audit Logs** (`audit-logs.js`)
- Immutable audit trail
- Compliance logging
- Security event tracking
- Change history

#### Key Features
- Flexible schema design
- TTL indexes for automatic cleanup
- Compound indexes for performance
- Text search capabilities
- Aggregation pipeline support

### Redis (Cache & Real-time)

Location: `database/redis/`

#### Configuration (`redis.conf`)
- Optimized for caching and sessions
- AOF and RDB persistence
- Memory management (2GB default)
- LRU eviction policy

#### Key Patterns (see `README.md`)
- **DB 0**: Sessions & Authentication
- **DB 1**: Application Cache
- **DB 2**: Rate Limiting
- **DB 3**: Real-time Features
- **DB 4**: Queue Management
- **DB 5**: Analytics Cache

## Getting Started

### Prerequisites
```bash
# PostgreSQL 14+
# MongoDB 5.0+
# Redis 7.0+
# Node.js 18+
# pnpm 8+
```

### Installation

#### 1. Install Dependencies
```bash
cd database
pnpm install
```

#### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

#### 3. PostgreSQL Setup
```bash
# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# Seed database
pnpm prisma db seed
```

#### 4. MongoDB Setup
```bash
# No migrations needed - schemas are flexible
# Indexes are created automatically on first connection
```

#### 5. Redis Setup
```bash
# Start Redis with custom config
redis-server ./redis/redis.conf
```

## Environment Variables

```bash
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/nexus"

# MongoDB
MONGODB_URL="mongodb://localhost:27017/nexus"

# Redis
REDIS_URL="redis://localhost:6379"

# Seed Data
ADMIN_EMAIL="admin@nexus.local"
ADMIN_PASSWORD="Admin@123456"
NODE_ENV="development"
```

## Database Schema Overview

### Core Models

#### Auth & Users (8 models)
- User, Session, RefreshToken
- VerificationCode, PasswordReset
- AuditLog, Organization, OrganizationMember

#### Creators (6 models)
- Creator, CreatorPortfolio, CreatorMetrics
- CreatorEarnings, CreatorReview, CreatorVerification

#### Campaigns (6 models)
- Campaign, CampaignBrief, Deliverable
- Milestone, CreatorApplication, CampaignContent

#### Content (4 models)
- Content, ContentTag, ContentRights
- ContentVersion

#### Marketplace (7 models)
- Opportunity, Bid, Contract
- Payout, PayoutMethod, Dispute
- AmbassadorProgram, Ambassador

#### Commerce (5 models)
- Product, ProductTag, ShoppableGallery
- Order, AttributionEvent

#### Billing (6 models)
- Plan, Subscription, Invoice
- PaymentMethod, UsageRecord, Entitlement

#### Analytics (4 models)
- MetricSnapshot, Dashboard, Report, Alert

#### Notifications (2 models)
- Notification, NotificationPreference

#### Integrations (4 models)
- Integration, IntegrationCredential
- Webhook, WebhookLog

#### Compliance (3 models)
- ConsentRecord, DataExportRequest
- RightsLedgerEntry

**Total: 60+ Models**

## Common Operations

### Development Workflow

```bash
# Create a new migration
pnpm prisma migrate dev --name your_migration_name

# Reset database (WARNING: Deletes all data)
pnpm prisma migrate reset

# View database in Prisma Studio
pnpm prisma studio

# Format schema
pnpm prisma format

# Validate schema
pnpm prisma validate
```

### Production Workflow

```bash
# Deploy migrations
pnpm prisma migrate deploy

# Seed production database
NODE_ENV=production pnpm prisma db seed

# Generate optimized client
pnpm prisma generate --no-engine
```

### Backup & Restore

#### PostgreSQL
```bash
# Backup
pg_dump -h localhost -U user nexus > backup.sql

# Restore
psql -h localhost -U user nexus < backup.sql
```

#### MongoDB
```bash
# Backup
mongodump --db nexus --out ./backup

# Restore
mongorestore --db nexus ./backup/nexus
```

#### Redis
```bash
# Backup (RDB)
redis-cli BGSAVE

# Restore
# Copy dump.rdb to Redis data directory and restart
```

## Performance Optimization

### PostgreSQL
1. **Indexes**: All foreign keys and frequently queried fields are indexed
2. **Partial Indexes**: Used for filtered queries (e.g., active campaigns)
3. **Full-text Search**: Enabled with pg_trgm extension
4. **Connection Pooling**: Use PgBouncer in production
5. **Query Optimization**: Use EXPLAIN ANALYZE for slow queries

### MongoDB
1. **Compound Indexes**: Created for common query patterns
2. **TTL Indexes**: Automatic cleanup of old data
3. **Aggregation Pipeline**: Used for complex analytics
4. **Sharding**: Ready for horizontal scaling
5. **Read Preferences**: Configure for read-heavy workloads

### Redis
1. **Memory Management**: LRU eviction policy configured
2. **Persistence**: Both RDB and AOF enabled
3. **Pipelining**: Batch operations for better performance
4. **Lua Scripts**: Atomic operations for rate limiting
5. **Clustering**: Ready for high availability

## Monitoring

### PostgreSQL
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### MongoDB
```javascript
// Database stats
db.stats()

// Collection stats
db.content_metadata.stats()

// Current operations
db.currentOp()

// Slow queries
db.system.profile.find().sort({ millis: -1 }).limit(10)
```

### Redis
```bash
# Info
redis-cli INFO

# Memory usage
redis-cli INFO memory

# Slow log
redis-cli SLOWLOG GET 10

# Monitor commands
redis-cli MONITOR
```

## Security

### PostgreSQL
- Use SSL connections in production
- Implement row-level security (RLS)
- Rotate credentials regularly
- Use read-only users for analytics
- Enable audit logging

### MongoDB
- Enable authentication
- Use SSL/TLS for connections
- Implement role-based access control
- Enable audit logging
- Regular security updates

### Redis
- Set strong password (requirepass)
- Disable dangerous commands
- Use SSL/TLS in production
- Implement firewall rules
- Regular security updates

## Scaling Strategy

### Vertical Scaling
1. Increase CPU and RAM
2. Use faster storage (NVMe SSD)
3. Optimize queries and indexes

### Horizontal Scaling

#### PostgreSQL
- Read replicas for read-heavy workloads
- Partitioning for large tables
- Citus for distributed PostgreSQL
- Connection pooling with PgBouncer

#### MongoDB
- Replica sets for high availability
- Sharding for horizontal scaling
- Read preferences for load distribution

#### Redis
- Redis Cluster for sharding
- Sentinel for high availability
- Read replicas for read scaling

## Troubleshooting

### Connection Issues
```bash
# PostgreSQL
psql -h localhost -U user -d nexus

# MongoDB
mongosh mongodb://localhost:27017/nexus

# Redis
redis-cli ping
```

### Migration Issues
```bash
# Check migration status
pnpm prisma migrate status

# Resolve migration conflicts
pnpm prisma migrate resolve

# Reset and retry
pnpm prisma migrate reset
```

### Performance Issues
1. Check slow query logs
2. Analyze query execution plans
3. Review and optimize indexes
4. Monitor connection pool usage
5. Check for lock contention

## Support

For issues and questions:
- Review this documentation
- Check Prisma docs: https://www.prisma.io/docs
- Check MongoDB docs: https://docs.mongodb.com
- Check Redis docs: https://redis.io/docs

## License

Proprietary - NEXUS Platform
