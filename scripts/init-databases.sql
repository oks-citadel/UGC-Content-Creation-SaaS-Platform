-- =============================================================================
-- CreatorBridge Database Initialization Script
-- =============================================================================
-- Creates separate databases for each microservice
-- Run automatically by PostgreSQL container on first startup
-- =============================================================================

-- Create databases for each service
CREATE DATABASE auth_service_db;
CREATE DATABASE user_service_db;
CREATE DATABASE billing_service_db;
CREATE DATABASE campaign_service_db;
CREATE DATABASE creator_service_db;
CREATE DATABASE content_service_db;
CREATE DATABASE asset_service_db;
CREATE DATABASE rights_service_db;
CREATE DATABASE payout_service_db;
CREATE DATABASE notification_service_db;
CREATE DATABASE analytics_service_db;
CREATE DATABASE marketplace_service_db;
CREATE DATABASE commerce_service_db;
CREATE DATABASE compliance_service_db;
CREATE DATABASE integration_service_db;
CREATE DATABASE workflow_service_db;

-- Create a test database
CREATE DATABASE creatorbridge_test;

-- Grant permissions to postgres user (for development)
GRANT ALL PRIVILEGES ON DATABASE auth_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE user_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE billing_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE campaign_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE creator_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE content_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE asset_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE rights_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE payout_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE notification_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE analytics_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE marketplace_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE commerce_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE compliance_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE integration_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE workflow_service_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE creatorbridge_test TO postgres;

-- Enable useful extensions in the main database
\c creatorbridge_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable extensions in each service database
\c auth_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c user_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c billing_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c campaign_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c creator_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c content_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c asset_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c rights_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c payout_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c notification_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c analytics_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c marketplace_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c commerce_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c compliance_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c integration_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c workflow_service_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c creatorbridge_test
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
