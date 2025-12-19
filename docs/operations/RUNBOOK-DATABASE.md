# CreatorBridge Database Operations Runbook

## Overview

This runbook covers database operations for the CreatorBridge platform running on Azure PostgreSQL Flexible Server.

---

## Database Architecture

| Service | Database Name | Size Estimate |
|---------|---------------|---------------|
| auth-service | auth_service_db | Small |
| user-service | user_service_db | Medium |
| billing-service | billing_service_db | Medium |
| campaign-service | campaign_service_db | Large |
| creator-service | creator_service_db | Medium |
| content-service | content_service_db | Large |
| asset-service | asset_service_db | Large |
| rights-service | rights_service_db | Medium |
| payout-service | payout_service_db | Medium |
| analytics-service | analytics_service_db | Very Large |

---

## Connection Information

### Production
```
Host: creatorbridge-db.postgres.database.azure.com
Port: 5432
SSL: Required
```

### Staging
```
Host: creatorbridge-db-staging.postgres.database.azure.com
Port: 5432
SSL: Required
```

### Connecting via kubectl

```bash
# Port forward to access database locally
kubectl port-forward svc/postgres 5432:5432 -n creatorbridge-production

# Then connect
psql "host=localhost port=5432 user=dbadmin dbname=asset_service_db sslmode=require"
```

---

## Daily Operations

### Health Check

```bash
# Check database status
az postgres flexible-server show \
  --resource-group creatorbridge-production \
  --name creatorbridge-db \
  --query "{State:state, Version:version, SKU:sku.name}"

# Check replication lag (if replicas exist)
az postgres flexible-server replica list \
  --resource-group creatorbridge-production \
  --name creatorbridge-db
```

### Monitor Connections

```sql
-- Active connections by database
SELECT datname, count(*)
FROM pg_stat_activity
GROUP BY datname
ORDER BY count DESC;

-- Long-running queries (>30 seconds)
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '30 seconds'
  AND state != 'idle'
ORDER BY duration DESC;

-- Blocked queries
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

### Monitor Table Sizes

```sql
-- Table sizes
SELECT
    schemaname || '.' || tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
    pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) AS index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;
```

---

## Backup Operations

### Automated Backups

Azure PostgreSQL Flexible Server provides:
- Point-in-time recovery (PITR) for 7-35 days
- Geo-redundant backups (if enabled)

```bash
# Check backup configuration
az postgres flexible-server show \
  --resource-group creatorbridge-production \
  --name creatorbridge-db \
  --query "backup"
```

### Manual Backup

```bash
# Run manual backup script
./scripts/backup-databases.sh production full

# Backup specific service
pg_dump -h creatorbridge-db.postgres.database.azure.com \
  -U dbadmin \
  -d asset_service_db \
  -F c \
  -f asset_service_$(date +%Y%m%d).dump
```

### Backup to Azure Storage

```bash
# Upload backup to Azure Blob Storage
az storage blob upload \
  --container-name backups-production \
  --file ./backups/production/20241218/asset_service.sql.gz \
  --name "20241218/asset_service.sql.gz" \
  --account-name creatorbridgebackups
```

---

## Restore Operations

### Point-in-Time Restore

```bash
# Restore to specific point in time
az postgres flexible-server restore \
  --resource-group creatorbridge-production \
  --name creatorbridge-db-restored \
  --source-server creatorbridge-db \
  --restore-time "2024-12-18T10:00:00Z"
```

### Restore from Backup File

```bash
# Full restore process
./scripts/restore-database.sh production 20241218_120000

# Manual restore of specific database
pg_restore -h creatorbridge-db.postgres.database.azure.com \
  -U dbadmin \
  -d asset_service_db \
  -c \
  asset_service_20241218.dump
```

---

## Migration Operations

### Running Prisma Migrations

```bash
# Deploy migrations for all services
make db-migrate ENV=production

# Deploy for specific service
cd services/asset-service
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### Creating New Migrations

```bash
# Development only - creates new migration
cd services/asset-service
npx prisma migrate dev --name add_new_field

# Generate Prisma client
npx prisma generate
```

### Rollback Migration

Prisma doesn't support automatic rollback. Manual steps:

1. Create reverse migration SQL
2. Apply manually or create new migration
3. Update schema.prisma to match

```sql
-- Example: Rollback add column
ALTER TABLE assets DROP COLUMN IF EXISTS new_field;
```

---

## Performance Tuning

### Index Analysis

```sql
-- Unused indexes
SELECT
    schemaname || '.' || relname AS table,
    indexrelname AS index,
    pg_size_pretty(pg_relation_size(i.indexrelid)) AS index_size,
    idx_scan as index_scans
FROM pg_stat_user_indexes ui
JOIN pg_index i ON ui.indexrelid = i.indexrelid
WHERE NOT indisunique AND idx_scan < 50
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- Missing indexes (slow queries)
SELECT
    schemaname || '.' || relname AS table,
    seq_scan,
    seq_tup_read,
    idx_scan,
    n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;
```

### Query Performance

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top slow queries
SELECT
    query,
    calls,
    round(total_exec_time::numeric, 2) as total_time_ms,
    round(mean_exec_time::numeric, 2) as mean_time_ms,
    rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

### VACUUM and ANALYZE

```sql
-- Check for bloated tables
SELECT
    schemaname || '.' || relname AS table_name,
    n_dead_tup,
    n_live_tup,
    round(n_dead_tup::numeric / nullif(n_live_tup, 0) * 100, 2) AS dead_ratio
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Manual vacuum (for specific table)
VACUUM ANALYZE assets;

-- Full vacuum (locks table - use carefully)
VACUUM FULL assets;
```

---

## Maintenance Windows

### Recommended Schedule

| Task | Frequency | Time (UTC) |
|------|-----------|------------|
| VACUUM ANALYZE | Daily | 03:00 |
| Full backup | Daily | 02:00 |
| Index rebuild | Weekly | Sunday 04:00 |
| Statistics update | Hourly | :30 |

### Maintenance Mode

```bash
# Scale down services before maintenance
kubectl scale deployment --all --replicas=0 -n creatorbridge-production

# Perform maintenance

# Scale back up
kubectl scale deployment --all --replicas=2 -n creatorbridge-production
```

---

## Emergency Procedures

### Kill Long-Running Query

```sql
-- Find the PID
SELECT pid, query, state, query_start
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;

-- Cancel query (graceful)
SELECT pg_cancel_backend(PID);

-- Terminate connection (force)
SELECT pg_terminate_backend(PID);
```

### Connection Pool Exhaustion

```sql
-- Check max connections
SHOW max_connections;

-- Current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
  AND query_start < now() - interval '10 minutes';
```

### Disk Space Emergency

```bash
# Check disk usage
az postgres flexible-server show \
  --resource-group creatorbridge-production \
  --name creatorbridge-db \
  --query "storage"

# Increase storage (no downtime)
az postgres flexible-server update \
  --resource-group creatorbridge-production \
  --name creatorbridge-db \
  --storage-size 512
```

```sql
-- Find largest tables
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- Truncate old audit logs (if applicable)
DELETE FROM audit_logs WHERE created_at < now() - interval '90 days';
VACUUM audit_logs;
```

---

## Security

### Rotate Database Password

```bash
# Update password in Azure
az postgres flexible-server update \
  --resource-group creatorbridge-production \
  --name creatorbridge-db \
  --admin-password "NewSecurePassword123!"

# Update in Key Vault
az keyvault secret set \
  --vault-name creatorbridge-keyvault \
  --name "db-admin-password" \
  --value "NewSecurePassword123!"

# Restart all services to pick up new credentials
kubectl rollout restart deployment --all -n creatorbridge-production
```

### Audit User Access

```sql
-- List all roles
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb
FROM pg_roles
WHERE rolname NOT LIKE 'pg_%';

-- Check role memberships
SELECT r.rolname AS role, m.rolname AS member
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member;
```
