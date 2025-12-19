#!/bin/bash
# =============================================================================
# NEXUS Platform - Database Initialization Script
# =============================================================================
# This script initializes PostgreSQL databases and schemas for development
# =============================================================================

set -e

echo "========================================="
echo "NEXUS Database Initialization"
echo "========================================="

# Default database name
DB_NAME=${POSTGRES_DB:-nexus_dev}
DB_USER=${POSTGRES_USER:-postgres}

echo "Database: $DB_NAME"
echo "User: $DB_USER"

# Create database if it doesn't exist
psql -v ON_ERROR_STOP=1 --username "$DB_USER" <<-EOSQL
    SELECT 'CREATE DATABASE $DB_NAME'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec
EOSQL

echo "Database '$DB_NAME' created or already exists."

# Connect to the database and create extensions
psql -v ON_ERROR_STOP=1 --username "$DB_USER" --dbname "$DB_NAME" <<-EOSQL
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Enable pgcrypto for password hashing
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- Enable pg_trgm for full-text search
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";

    -- Enable btree_gin for multi-column indexes
    CREATE EXTENSION IF NOT EXISTS "btree_gin";

    -- Enable unaccent for search
    CREATE EXTENSION IF NOT EXISTS "unaccent";

    -- Create schemas for different services
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS users;
    CREATE SCHEMA IF NOT EXISTS content;
    CREATE SCHEMA IF NOT EXISTS campaigns;
    CREATE SCHEMA IF NOT EXISTS creators;
    CREATE SCHEMA IF NOT EXISTS billing;
    CREATE SCHEMA IF NOT EXISTS analytics;
    CREATE SCHEMA IF NOT EXISTS commerce;
    CREATE SCHEMA IF NOT EXISTS marketplace;

    -- Grant permissions
    GRANT ALL PRIVILEGES ON SCHEMA auth TO $DB_USER;
    GRANT ALL PRIVILEGES ON SCHEMA users TO $DB_USER;
    GRANT ALL PRIVILEGES ON SCHEMA content TO $DB_USER;
    GRANT ALL PRIVILEGES ON SCHEMA campaigns TO $DB_USER;
    GRANT ALL PRIVILEGES ON SCHEMA creators TO $DB_USER;
    GRANT ALL PRIVILEGES ON SCHEMA billing TO $DB_USER;
    GRANT ALL PRIVILEGES ON SCHEMA analytics TO $DB_USER;
    GRANT ALL PRIVILEGES ON SCHEMA commerce TO $DB_USER;
    GRANT ALL PRIVILEGES ON SCHEMA marketplace TO $DB_USER;
EOSQL

echo "Database extensions and schemas created successfully."

# Create test database for testing
TEST_DB_NAME="${DB_NAME}_test"
psql -v ON_ERROR_STOP=1 --username "$DB_USER" <<-EOSQL
    SELECT 'CREATE DATABASE $TEST_DB_NAME'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$TEST_DB_NAME')\gexec
EOSQL

echo "Test database '$TEST_DB_NAME' created or already exists."

# Set up test database with same extensions
psql -v ON_ERROR_STOP=1 --username "$DB_USER" --dbname "$TEST_DB_NAME" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    CREATE EXTENSION IF NOT EXISTS "btree_gin";
    CREATE EXTENSION IF NOT EXISTS "unaccent";

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS users;
    CREATE SCHEMA IF NOT EXISTS content;
    CREATE SCHEMA IF NOT EXISTS campaigns;
    CREATE SCHEMA IF NOT EXISTS creators;
    CREATE SCHEMA IF NOT EXISTS billing;
    CREATE SCHEMA IF NOT EXISTS analytics;
    CREATE SCHEMA IF NOT EXISTS commerce;
    CREATE SCHEMA IF NOT EXISTS marketplace;
EOSQL

echo "========================================="
echo "Database Initialization Complete!"
echo "========================================="
echo ""
echo "Available databases:"
echo "  - $DB_NAME (development)"
echo "  - $TEST_DB_NAME (testing)"
echo ""
echo "Next steps:"
echo "  1. Run migrations: pnpm db:migrate"
echo "  2. Seed data: pnpm db:seed"
echo "========================================="
