# NEXUS Database - Quick Start Guide

This guide will help you set up the NEXUS platform databases in 5 minutes.

## Prerequisites

Before you begin, ensure you have:

- ✅ **PostgreSQL 14+** installed and running
- ✅ **MongoDB 5.0+** installed and running
- ✅ **Redis 7.0+** installed and running
- ✅ **Node.js 18+** installed
- ✅ **pnpm 8+** installed

## Quick Setup (5 Minutes)

### Step 1: Install Dependencies (30 seconds)

```bash
cd database
pnpm install
```

### Step 2: Configure Environment (1 minute)

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your database credentials
# nano .env  # or use your preferred editor
```

**Minimum required configuration:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/nexus"
MONGODB_URL="mongodb://localhost:27017/nexus"
REDIS_URL="redis://localhost:6379"
ADMIN_EMAIL="admin@yourcompany.com"
ADMIN_PASSWORD="YourSecurePassword123!"
```

### Step 3: Verify Setup (30 seconds)

```bash
# Run the verification script
node verify-setup.js
```

This will check:
- All required files exist
- Environment variables are set
- Database connections work
- All services are accessible

### Step 4: Create Database (30 seconds)

```bash
# Create the PostgreSQL database
createdb nexus

# Or using psql:
# psql -U postgres -c "CREATE DATABASE nexus;"
```

### Step 5: Run Migrations (1 minute)

```bash
# Generate Prisma Client
pnpm db:generate

# Run database migrations
pnpm db:migrate:deploy
```

This creates all tables, indexes, and triggers in PostgreSQL.

### Step 6: Seed Database (1 minute)

```bash
# Seed subscription plans and admin user
pnpm db:seed
```

This creates:
- 7 subscription plans (Free, Starter, Professional, Enterprise)
- 1 admin user (check console output for credentials)
- 3 test users (development only)

### Step 7: Setup MongoDB Indexes (30 seconds)

```bash
# Create MongoDB indexes
pnpm mongodb:indexes
```

### Step 8: Start Redis (30 seconds)

```bash
# Start Redis with custom config
pnpm redis:start

# Or use system Redis:
# redis-server
```

## Verification

Run the verification script again to ensure everything is set up correctly:

```bash
node verify-setup.js
```

You should see all checks passing with green checkmarks ✅

## Next Steps

### Explore Your Database

**PostgreSQL:**
```bash
# Open Prisma Studio (visual database browser)
pnpm db:studio
```

**MongoDB:**
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/nexus

# List collections
show collections
```

**Redis:**
```bash
# Open Redis CLI
pnpm redis:cli

# Test connection
PING
```

### Common Commands

```bash
# PostgreSQL
pnpm db:migrate       # Create new migration
pnpm db:push          # Push schema changes without migration
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Reseed database

# MongoDB
pnpm mongodb:indexes  # Create/update indexes

# Redis
pnpm redis:start      # Start Redis
pnpm redis:cli        # Open Redis CLI
pnpm redis:monitor    # Monitor Redis commands
```

## Default Credentials

After seeding, you can log in with:

**Admin User:**
- Email: `admin@nexus.local` (or your ADMIN_EMAIL)
- Password: `Admin@123456` (or your ADMIN_PASSWORD)

**Test Users (Development):**
- Brand Manager: `brand@example.com` / `Test@123456`
- Content Creator: `creator@example.com` / `Test@123456`
- Agency Owner: `agency@example.com` / `Test@123456`

⚠️ **Important:** Change these passwords before deploying to production!

## Troubleshooting

### "Cannot connect to PostgreSQL"

```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Start PostgreSQL (Linux)
sudo systemctl start postgresql

# Start PostgreSQL (Windows)
# Use Services app or pg_ctl
```

### "Cannot connect to MongoDB"

```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Start MongoDB (Linux)
sudo systemctl start mongod

# Start MongoDB (Windows)
# Use Services app or mongod
```

### "Cannot connect to Redis"

```bash
# Check if Redis is running
redis-cli ping

# Start Redis (macOS with Homebrew)
brew services start redis

# Start Redis (Linux)
sudo systemctl start redis

# Start Redis (Windows)
# Download from https://redis.io/download
```

### "Prisma Client not generated"

```bash
# Generate Prisma Client
pnpm db:generate
```

### "Migration failed"

```bash
# Reset database (WARNING: Deletes all data!)
pnpm db:migrate:reset

# Then run migrations again
pnpm db:migrate:deploy
```

## Database URLs Format

**PostgreSQL:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**MongoDB:**
```
mongodb://[user]:[password]@[host]:[port]/[database]
```

**Redis:**
```
redis://[:password@][host]:[port]/[database]
```

## Production Deployment

For production deployments, see the full [README.md](./README.md) for:
- Connection pooling configuration
- SSL/TLS setup
- Backup strategies
- Performance tuning
- Security hardening
- Monitoring setup

## Support

If you encounter any issues:

1. Check the [README.md](./README.md) for detailed documentation
2. Run `node verify-setup.js` to diagnose issues
3. Check database service logs
4. Verify environment variables in `.env`

## Schema Overview

The database includes 60+ models across:

- **Auth & Users** (8 models): User management, sessions, MFA
- **Organizations** (4 models): Multi-tenant organization structure
- **Creators** (6 models): Creator profiles, portfolios, metrics
- **Campaigns** (6 models): Marketing campaigns, applications
- **Content** (4 models): UGC content library, rights management
- **Marketplace** (7 models): Opportunities, bids, contracts
- **Commerce** (5 models): Products, orders, attribution
- **Billing** (6 models): Subscriptions, invoices, payments
- **Analytics** (4 models): Metrics, dashboards, reports
- **Notifications** (2 models): User notifications, preferences
- **Integrations** (4 models): Third-party integrations, webhooks
- **Compliance** (3 models): GDPR, data exports, consent

For detailed schema documentation, see [schema.prisma](./postgres/schema.prisma).

---

**Time to complete:** ~5 minutes ⚡

**Questions?** Check the [README.md](./README.md) for comprehensive documentation.
