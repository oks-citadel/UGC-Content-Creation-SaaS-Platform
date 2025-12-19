-- NEXUS Platform - Initial Schema Migration
-- Generated: 2025-12-18
-- Database: PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'BRAND_MANAGER',
  'CREATOR',
  'AGENCY',
  'VIEWER'
);

CREATE TYPE user_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION',
  'DELETED'
);

CREATE TYPE member_role AS ENUM (
  'OWNER',
  'ADMIN',
  'MEMBER',
  'BILLING',
  'VIEWER'
);

CREATE TYPE organization_type AS ENUM (
  'BRAND',
  'AGENCY',
  'ENTERPRISE'
);

CREATE TYPE organization_status AS ENUM (
  'ACTIVE',
  'SUSPENDED',
  'TRIAL',
  'CANCELLED'
);

CREATE TYPE invite_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
  'REVOKED'
);

CREATE TYPE creator_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION'
);

CREATE TYPE verification_method AS ENUM (
  'SOCIAL_CONNECT',
  'DOCUMENT_UPLOAD',
  'VIDEO_VERIFICATION',
  'PHONE_VERIFICATION'
);

CREATE TYPE verification_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE campaign_type AS ENUM (
  'UGC',
  'BRAND_AMBASSADOR',
  'PRODUCT_REVIEW',
  'SOCIAL_MEDIA',
  'INFLUENCER',
  'EVENT',
  'CUSTOM'
);

CREATE TYPE campaign_status AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
  'ARCHIVED'
);

CREATE TYPE deliverable_type AS ENUM (
  'VIDEO',
  'IMAGE',
  'STORY',
  'REEL',
  'POST',
  'ARTICLE',
  'REVIEW',
  'TESTIMONIAL',
  'CUSTOM'
);

CREATE TYPE deliverable_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'SUBMITTED',
  'REVISION_REQUESTED',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE milestone_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE application_status AS ENUM (
  'PENDING',
  'REVIEWING',
  'SHORTLISTED',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN'
);

CREATE TYPE content_type AS ENUM (
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'DOCUMENT',
  'LINK'
);

CREATE TYPE moderation_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'FLAGGED',
  'REVIEWING'
);

CREATE TYPE rights_type AS ENUM (
  'EXCLUSIVE',
  'NON_EXCLUSIVE',
  'LIMITED',
  'PERPETUAL'
);

CREATE TYPE opportunity_type AS ENUM (
  'ONE_TIME',
  'RECURRING',
  'PROJECT',
  'RETAINER'
);

CREATE TYPE opportunity_status AS ENUM (
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE bid_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN'
);

CREATE TYPE contract_status AS ENUM (
  'DRAFT',
  'PENDING_SIGNATURE',
  'ACTIVE',
  'COMPLETED',
  'TERMINATED',
  'DISPUTED'
);

CREATE TYPE payout_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REFUNDED'
);

CREATE TYPE payout_method_type AS ENUM (
  'BANK_ACCOUNT',
  'PAYPAL',
  'STRIPE',
  'WISE',
  'CRYPTO'
);

CREATE TYPE dispute_status AS ENUM (
  'OPEN',
  'INVESTIGATING',
  'RESOLVED',
  'ESCALATED',
  'CLOSED'
);

CREATE TYPE ambassador_status AS ENUM (
  'PENDING',
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED'
);

CREATE TYPE order_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED'
);

CREATE TYPE attribution_model AS ENUM (
  'FIRST_CLICK',
  'LAST_CLICK',
  'LINEAR',
  'TIME_DECAY',
  'POSITION_BASED'
);

CREATE TYPE plan_interval AS ENUM (
  'MONTH',
  'YEAR'
);

CREATE TYPE plan_tier AS ENUM (
  'FREE',
  'STARTER',
  'PROFESSIONAL',
  'ENTERPRISE'
);

CREATE TYPE subscription_status AS ENUM (
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
  'TRIAL',
  'PAUSED'
);

CREATE TYPE invoice_status AS ENUM (
  'DRAFT',
  'OPEN',
  'PAID',
  'VOID',
  'UNCOLLECTIBLE'
);

CREATE TYPE payment_method_type_enum AS ENUM (
  'CARD',
  'BANK_ACCOUNT',
  'PAYPAL',
  'STRIPE'
);

CREATE TYPE report_type AS ENUM (
  'CAMPAIGN_PERFORMANCE',
  'CREATOR_ANALYTICS',
  'CONTENT_METRICS',
  'FINANCIAL',
  'CUSTOM'
);

CREATE TYPE report_status AS ENUM (
  'PENDING',
  'GENERATING',
  'COMPLETED',
  'FAILED'
);

CREATE TYPE alert_trigger AS ENUM (
  'THRESHOLD_EXCEEDED',
  'THRESHOLD_BELOW',
  'ANOMALY_DETECTED',
  'STATUS_CHANGE'
);

CREATE TYPE alert_severity AS ENUM (
  'INFO',
  'WARNING',
  'CRITICAL'
);

CREATE TYPE notification_type AS ENUM (
  'CAMPAIGN_UPDATE',
  'APPLICATION_STATUS',
  'CONTENT_APPROVED',
  'CONTENT_REJECTED',
  'PAYMENT_RECEIVED',
  'MESSAGE',
  'SYSTEM'
);

CREATE TYPE notification_channel AS ENUM (
  'IN_APP',
  'EMAIL',
  'SMS',
  'PUSH'
);

CREATE TYPE integration_type AS ENUM (
  'SOCIAL_MEDIA',
  'PAYMENT',
  'ANALYTICS',
  'STORAGE',
  'CRM',
  'EMAIL',
  'CUSTOM'
);

CREATE TYPE integration_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'ERROR',
  'PENDING'
);

CREATE TYPE webhook_event AS ENUM (
  'CAMPAIGN_CREATED',
  'CAMPAIGN_UPDATED',
  'APPLICATION_SUBMITTED',
  'CONTENT_UPLOADED',
  'PAYMENT_COMPLETED',
  'ALL'
);

CREATE TYPE webhook_log_status AS ENUM (
  'SUCCESS',
  'FAILED',
  'RETRY'
);

CREATE TYPE consent_type AS ENUM (
  'MARKETING',
  'ANALYTICS',
  'DATA_PROCESSING',
  'THIRD_PARTY_SHARING'
);

CREATE TYPE data_export_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

CREATE TYPE rights_event_type AS ENUM (
  'GRANTED',
  'REVOKED',
  'TRANSFERRED',
  'EXPIRED'
);

-- ============================================================================
-- TABLES - AUTH & USERS
-- ============================================================================

CREATE TABLE users (
  id VARCHAR(30) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(200),
  avatar TEXT,
  bio TEXT,
  phone VARCHAR(20),
  phone_verified TIMESTAMP,
  role user_role NOT NULL DEFAULT 'CREATOR',
  status user_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  locale VARCHAR(10) NOT NULL DEFAULT 'en',
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE TABLE sessions (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE TABLE refresh_tokens (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE TABLE verification_codes (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE password_resets (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(30),
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLES - ORGANIZATIONS
-- ============================================================================

CREATE TABLE organizations (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  type organization_type NOT NULL,
  status organization_status NOT NULL DEFAULT 'TRIAL',
  logo TEXT,
  website VARCHAR(255),
  description TEXT,
  industry VARCHAR(100),
  size VARCHAR(50),
  owner_id VARCHAR(30) NOT NULL REFERENCES users(id),
  billing_email VARCHAR(255),
  settings JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE organization_members (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'MEMBER',
  permissions JSONB,
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  invited_by VARCHAR(30),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE organization_invites (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role member_role NOT NULL DEFAULT 'MEMBER',
  invited_by VARCHAR(30) NOT NULL REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  status invite_status NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE api_keys (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key VARCHAR(255) UNIQUE NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  permissions JSONB,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLES - CREATORS
-- ============================================================================

CREATE TABLE creators (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  niche TEXT[],
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMP,
  reputation_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_response_time INTEGER,
  total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
  status creator_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
  social_handles JSONB,
  preferences JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE creator_portfolio (
  id VARCHAR(30) PRIMARY KEY,
  creator_id VARCHAR(30) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail TEXT,
  platform VARCHAR(50) NOT NULL,
  metrics JSONB,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE creator_metrics (
  id VARCHAR(30) PRIMARY KEY,
  creator_id VARCHAR(30) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  followers INTEGER NOT NULL DEFAULT 0,
  engagement DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_views INTEGER NOT NULL DEFAULT 0,
  avg_likes INTEGER NOT NULL DEFAULT 0,
  avg_comments INTEGER NOT NULL DEFAULT 0,
  avg_shares INTEGER NOT NULL DEFAULT 0,
  audience_demo JSONB,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE creator_earnings (
  id VARCHAR(30) PRIMARY KEY,
  creator_id VARCHAR(30) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  source VARCHAR(50) NOT NULL,
  source_id VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE creator_reviews (
  id VARCHAR(30) PRIMARY KEY,
  creator_id VARCHAR(30) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  campaign_id VARCHAR(30),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  reviewer_id VARCHAR(30) NOT NULL,
  response TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE creator_verifications (
  id VARCHAR(30) PRIMARY KEY,
  creator_id VARCHAR(30) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  method verification_method NOT NULL,
  status verification_status NOT NULL DEFAULT 'PENDING',
  data JSONB,
  verified_by VARCHAR(30),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLES - CAMPAIGNS
-- ============================================================================

CREATE TABLE campaigns (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  type campaign_type NOT NULL,
  status campaign_status NOT NULL DEFAULT 'DRAFT',
  description TEXT,
  objectives TEXT[],
  budget DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  timeline JSONB,
  requirements JSONB,
  tags TEXT[],
  visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  created_by VARCHAR(30) NOT NULL,
  settings JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

CREATE TABLE campaign_briefs (
  id VARCHAR(30) PRIMARY KEY,
  campaign_id VARCHAR(30) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE deliverables (
  id VARCHAR(30) PRIMARY KEY,
  campaign_id VARCHAR(30) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type deliverable_type NOT NULL,
  status deliverable_status NOT NULL DEFAULT 'PENDING',
  requirements JSONB,
  due_date TIMESTAMP,
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE milestones (
  id VARCHAR(30) PRIMARY KEY,
  campaign_id VARCHAR(30) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status milestone_status NOT NULL DEFAULT 'PENDING',
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  "order" INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE creator_applications (
  id VARCHAR(30) PRIMARY KEY,
  campaign_id VARCHAR(30) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id VARCHAR(30) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  status application_status NOT NULL DEFAULT 'PENDING',
  pitch TEXT,
  proposed_rate DECIMAL(10,2),
  portfolio JSONB,
  answers JSONB,
  reviewed_by VARCHAR(30),
  review_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, creator_id)
);

-- ============================================================================
-- TABLES - CONTENT
-- ============================================================================

CREATE TABLE content (
  id VARCHAR(30) PRIMARY KEY,
  creator_id VARCHAR(30) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  type content_type NOT NULL,
  title VARCHAR(255),
  description TEXT,
  url TEXT NOT NULL,
  thumbnail TEXT,
  duration INTEGER,
  file_size BIGINT,
  mime_type VARCHAR(100),
  dimensions JSONB,
  moderation_status moderation_status NOT NULL DEFAULT 'PENDING',
  moderated_at TIMESTAMP,
  moderated_by VARCHAR(30),
  moderation_notes TEXT,
  metadata JSONB,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  download_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE campaign_content (
  id VARCHAR(30) PRIMARY KEY,
  campaign_id VARCHAR(30) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  deliverable_id VARCHAR(30) REFERENCES deliverables(id) ON DELETE SET NULL,
  content_id VARCHAR(30) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  submitted_by VARCHAR(30) NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMP,
  approved_by VARCHAR(30),
  rejected_at TIMESTAMP,
  rejected_by VARCHAR(30),
  rejection_notes TEXT,
  metadata JSONB
);

CREATE TABLE content_tags (
  id VARCHAR(30) PRIMARY KEY,
  content_id VARCHAR(30) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(content_id, tag)
);

CREATE TABLE content_rights (
  id VARCHAR(30) PRIMARY KEY,
  content_id VARCHAR(30) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  rights_type rights_type NOT NULL,
  granted_to VARCHAR(30),
  territory TEXT[],
  channels TEXT[],
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  restrictions JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE content_versions (
  id VARCHAR(30) PRIMARY KEY,
  content_id VARCHAR(30) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  url TEXT NOT NULL,
  changes TEXT,
  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(content_id, version)
);

-- ============================================================================
-- TABLES - MARKETPLACE
-- ============================================================================

CREATE TABLE opportunities (
  id VARCHAR(30) PRIMARY KEY,
  campaign_id VARCHAR(30) REFERENCES campaigns(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type opportunity_type NOT NULL,
  status opportunity_status NOT NULL DEFAULT 'DRAFT',
  budget DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  requirements JSONB,
  deadline TIMESTAMP,
  published_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE bids (
  id VARCHAR(30) PRIMARY KEY,
  opportunity_id VARCHAR(30) NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  creator_id VARCHAR(30) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  proposal TEXT NOT NULL,
  timeline TEXT,
  status bid_status NOT NULL DEFAULT 'PENDING',
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP,
  response_notes TEXT,
  UNIQUE(opportunity_id, creator_id)
);

CREATE TABLE contracts (
  id VARCHAR(30) PRIMARY KEY,
  opportunity_id VARCHAR(30) REFERENCES opportunities(id) ON DELETE SET NULL,
  creator_id VARCHAR(30) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  terms TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status contract_status NOT NULL DEFAULT 'DRAFT',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  signed_at TIMESTAMP,
  completed_at TIMESTAMP,
  terminated_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE payout_methods (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL,
  type payout_method_type NOT NULL,
  details JSONB NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE payouts (
  id VARCHAR(30) PRIMARY KEY,
  contract_id VARCHAR(30) NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status payout_status NOT NULL DEFAULT 'PENDING',
  payout_method_id VARCHAR(30) REFERENCES payout_methods(id) ON DELETE SET NULL,
  transaction_id VARCHAR(255),
  scheduled_for TIMESTAMP,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE disputes (
  id VARCHAR(30) PRIMARY KEY,
  contract_id VARCHAR(30) NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  raised_by VARCHAR(30) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'OPEN',
  resolution TEXT,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(30),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ambassador_programs (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  benefits JSONB,
  requirements JSONB,
  commission DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE ambassadors (
  id VARCHAR(30) PRIMARY KEY,
  program_id VARCHAR(30) NOT NULL REFERENCES ambassador_programs(id) ON DELETE CASCADE,
  creator_id VARCHAR(30) NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  status ambassador_status NOT NULL DEFAULT 'PENDING',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metrics JSONB,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(program_id, creator_id)
);

-- ============================================================================
-- TABLES - COMMERCE
-- ============================================================================

CREATE TABLE products (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  images TEXT[],
  url TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE product_tags (
  id VARCHAR(30) PRIMARY KEY,
  product_id VARCHAR(30) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_id VARCHAR(30) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  position JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE shoppable_galleries (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content_ids TEXT[],
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE orders (
  id VARCHAR(30) PRIMARY KEY,
  product_id VARCHAR(30) NOT NULL REFERENCES products(id),
  customer_id VARCHAR(30),
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status order_status NOT NULL DEFAULT 'PENDING',
  shipping_info JSONB,
  tracking_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE attribution_events (
  id VARCHAR(30) PRIMARY KEY,
  content_id VARCHAR(30),
  creator_id VARCHAR(30),
  event_type VARCHAR(50) NOT NULL,
  attribution_model attribution_model NOT NULL DEFAULT 'LAST_CLICK',
  value DECIMAL(10,2),
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLES - BILLING & SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE plans (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tier plan_tier NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  interval plan_interval NOT NULL,
  features JSONB NOT NULL,
  limits JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  trial_days INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id VARCHAR(30) NOT NULL REFERENCES plans(id),
  status subscription_status NOT NULL DEFAULT 'TRIAL',
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id VARCHAR(30) REFERENCES subscriptions(id) ON DELETE SET NULL,
  number VARCHAR(50) UNIQUE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'OPEN',
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  due_date TIMESTAMP NOT NULL,
  paid_at TIMESTAMP,
  voided_at TIMESTAMP,
  line_items JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE payment_methods (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type payment_method_type_enum NOT NULL,
  last4 VARCHAR(4),
  brand VARCHAR(50),
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  billing_details JSONB,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE usage_records (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id VARCHAR(30) NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  metric VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE TABLE entitlements (
  id VARCHAR(30) PRIMARY KEY,
  subscription_id VARCHAR(30) NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL,
  "limit" INTEGER,
  is_unlimited BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, feature)
);

-- ============================================================================
-- TABLES - ANALYTICS
-- ============================================================================

CREATE TABLE metric_snapshots (
  id VARCHAR(30) PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(30) NOT NULL,
  metric VARCHAR(100) NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  dimensions JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE dashboards (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE reports (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type report_type NOT NULL,
  status report_status NOT NULL DEFAULT 'PENDING',
  parameters JSONB NOT NULL,
  result JSONB,
  file_url TEXT,
  generated_by VARCHAR(30) NOT NULL,
  generated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE alerts (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger alert_trigger NOT NULL,
  severity alert_severity NOT NULL,
  conditions JSONB NOT NULL,
  recipients TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_fired_at TIMESTAMP,
  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLES - NOTIFICATIONS
-- ============================================================================

CREATE TABLE notifications (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  email BOOLEAN NOT NULL DEFAULT TRUE,
  sms BOOLEAN NOT NULL DEFAULT FALSE,
  push BOOLEAN NOT NULL DEFAULT TRUE,
  in_app BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, type)
);

-- ============================================================================
-- TABLES - INTEGRATIONS
-- ============================================================================

CREATE TABLE integrations (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type integration_type NOT NULL,
  provider VARCHAR(100) NOT NULL,
  status integration_status NOT NULL DEFAULT 'PENDING',
  config JSONB,
  last_sync_at TIMESTAMP,
  last_error TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE integration_credentials (
  id VARCHAR(30) PRIMARY KEY,
  integration_id VARCHAR(30) NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(integration_id, key)
);

CREATE TABLE webhooks (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events webhook_event[],
  secret VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_logs (
  id VARCHAR(30) PRIMARY KEY,
  webhook_id VARCHAR(30) NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event webhook_event NOT NULL,
  payload JSONB NOT NULL,
  response JSONB,
  status webhook_log_status NOT NULL,
  status_code INTEGER,
  attempts INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLES - COMPLIANCE
-- ============================================================================

CREATE TABLE consent_records (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type consent_type NOT NULL,
  granted BOOLEAN NOT NULL,
  version VARCHAR(20) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  granted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE TABLE data_export_requests (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status data_export_status NOT NULL DEFAULT 'PENDING',
  download_url TEXT,
  expires_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE rights_ledger_entries (
  id VARCHAR(30) PRIMARY KEY,
  content_id VARCHAR(30) NOT NULL,
  event_type rights_event_type NOT NULL,
  "from" VARCHAR(30),
  "to" VARCHAR(30),
  rights_data JSONB NOT NULL,
  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Core user accounts and authentication';
COMMENT ON TABLE sessions IS 'Active user sessions';
COMMENT ON TABLE creators IS 'Creator profiles and metrics';
COMMENT ON TABLE campaigns IS 'Marketing campaigns and brand collaborations';
COMMENT ON TABLE content IS 'User-generated content library';
COMMENT ON TABLE subscriptions IS 'Organization subscription management';
COMMENT ON TABLE webhooks IS 'Webhook endpoints for integrations';
