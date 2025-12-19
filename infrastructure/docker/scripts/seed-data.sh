#!/bin/bash
# =============================================================================
# NEXUS Platform - Seed Data Script
# =============================================================================
# This script seeds the database with test data for development
# =============================================================================

set -e

echo "========================================="
echo "NEXUS Database Seeding"
echo "========================================="

# Environment variables
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${POSTGRES_DB:-nexus_dev}
DB_USER=${POSTGRES_USER:-postgres}
DB_PASSWORD=${POSTGRES_PASSWORD:-postgres}

echo "Connecting to: $DB_HOST:$DB_PORT/$DB_NAME"

# Wait for database to be ready
echo "Waiting for database to be ready..."
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# Seed test data
echo ""
echo "Seeding test data..."

PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<-EOSQL
    -- Insert test users
    INSERT INTO users.users (id, email, username, first_name, last_name, role, email_verified, created_at, updated_at)
    VALUES
        (uuid_generate_v4(), 'admin@nexus.local', 'admin', 'Admin', 'User', 'ADMIN', true, NOW(), NOW()),
        (uuid_generate_v4(), 'brand@nexus.local', 'brand_user', 'Brand', 'Manager', 'BRAND', true, NOW(), NOW()),
        (uuid_generate_v4(), 'creator@nexus.local', 'content_creator', 'Content', 'Creator', 'CREATOR', true, NOW(), NOW()),
        (uuid_generate_v4(), 'user@nexus.local', 'regular_user', 'Regular', 'User', 'USER', true, NOW(), NOW())
    ON CONFLICT (email) DO NOTHING;

    -- Insert test brands
    INSERT INTO users.brands (id, name, slug, description, industry, website, created_at, updated_at)
    VALUES
        (uuid_generate_v4(), 'Demo Brand', 'demo-brand', 'A demonstration brand for testing', 'Fashion', 'https://demo-brand.com', NOW(), NOW()),
        (uuid_generate_v4(), 'Test Company', 'test-company', 'Test company for development', 'Technology', 'https://test-company.com', NOW(), NOW())
    ON CONFLICT (slug) DO NOTHING;

    -- Insert test creator profiles
    INSERT INTO creators.profiles (id, user_id, display_name, bio, niche, created_at, updated_at)
    SELECT
        uuid_generate_v4(),
        u.id,
        'Pro Creator',
        'Professional content creator specializing in lifestyle and fashion',
        ARRAY['Fashion', 'Lifestyle']::text[],
        NOW(),
        NOW()
    FROM users.users u
    WHERE u.email = 'creator@nexus.local'
    ON CONFLICT DO NOTHING;

    -- Insert test campaigns
    INSERT INTO campaigns.campaigns (id, name, slug, description, status, budget, start_date, end_date, created_at, updated_at)
    VALUES
        (uuid_generate_v4(), 'Summer Campaign 2024', 'summer-campaign-2024', 'Summer product launch campaign', 'ACTIVE', 50000.00, NOW(), NOW() + INTERVAL '30 days', NOW(), NOW()),
        (uuid_generate_v4(), 'Holiday Special', 'holiday-special', 'Holiday season special campaign', 'DRAFT', 75000.00, NOW() + INTERVAL '60 days', NOW() + INTERVAL '90 days', NOW(), NOW())
    ON CONFLICT (slug) DO NOTHING;

    -- Insert test content
    INSERT INTO content.videos (id, title, description, status, duration, created_at, updated_at)
    VALUES
        (uuid_generate_v4(), 'Demo Video 1', 'A sample demonstration video', 'PUBLISHED', 120, NOW(), NOW()),
        (uuid_generate_v4(), 'Test Video 2', 'Another test video for development', 'DRAFT', 90, NOW(), NOW())
    ON CONFLICT DO NOTHING;

EOSQL

echo ""
echo "========================================="
echo "Database Seeding Complete!"
echo "========================================="
echo ""
echo "Test accounts created:"
echo "  Admin:   admin@nexus.local"
echo "  Brand:   brand@nexus.local"
echo "  Creator: creator@nexus.local"
echo "  User:    user@nexus.local"
echo ""
echo "Default password: Test123!"
echo "(You'll need to set this via the auth service)"
echo "========================================="
