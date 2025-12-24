-- NEXUS Platform - API Keys Migration
-- Enhanced API keys with hashed keys, permissions/scopes, and usage tracking
-- Generated: 2025-12-23

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE api_key_type AS ENUM (
  'PERSONAL',
  'ORGANIZATION',
  'SERVICE',
  'WEBHOOK',
  'INTEGRATION'
);

CREATE TYPE api_key_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'EXPIRED',
  'REVOKED',
  'SUSPENDED'
);

CREATE TYPE api_scope AS ENUM (
  -- Read scopes
  'READ:USERS',
  'READ:ORGANIZATIONS',
  'READ:CAMPAIGNS',
  'READ:CREATORS',
  'READ:CONTENT',
  'READ:ANALYTICS',
  'READ:BILLING',
  'READ:WEBHOOKS',

  -- Write scopes
  'WRITE:USERS',
  'WRITE:ORGANIZATIONS',
  'WRITE:CAMPAIGNS',
  'WRITE:CREATORS',
  'WRITE:CONTENT',
  'WRITE:BILLING',
  'WRITE:WEBHOOKS',

  -- Admin scopes
  'ADMIN:USERS',
  'ADMIN:ORGANIZATIONS',
  'ADMIN:SYSTEM',

  -- Special scopes
  'FULL_ACCESS',
  'PUBLIC_READ'
);

CREATE TYPE rate_limit_tier AS ENUM (
  'FREE',
  'BASIC',
  'STANDARD',
  'PREMIUM',
  'ENTERPRISE',
  'UNLIMITED'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Enhanced API keys table
CREATE TABLE enhanced_api_keys (
  id VARCHAR(30) PRIMARY KEY,

  -- Ownership
  organization_id VARCHAR(30) REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(30) REFERENCES users(id) ON DELETE CASCADE,

  -- Key identification
  name VARCHAR(255) NOT NULL,
  description TEXT,
  key_type api_key_type NOT NULL DEFAULT 'PERSONAL',

  -- Security
  key_prefix VARCHAR(12) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_last_four VARCHAR(4),

  -- Status
  status api_key_status NOT NULL DEFAULT 'ACTIVE',

  -- Scopes and permissions
  scopes api_scope[] NOT NULL DEFAULT ARRAY['PUBLIC_READ']::api_scope[],
  custom_permissions JSONB DEFAULT '{}',

  -- Restrictions
  allowed_ips TEXT[],
  allowed_domains TEXT[],
  allowed_origins TEXT[],
  allowed_user_agents TEXT[],

  -- Rate limiting
  rate_limit_tier rate_limit_tier NOT NULL DEFAULT 'STANDARD',
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_hour INTEGER DEFAULT 1000,
  requests_per_day INTEGER DEFAULT 10000,

  -- Expiration
  expires_at TIMESTAMP,
  never_expires BOOLEAN NOT NULL DEFAULT FALSE,

  -- Usage tracking
  last_used_at TIMESTAMP,
  last_used_ip VARCHAR(45),
  last_used_user_agent TEXT,
  total_requests BIGINT NOT NULL DEFAULT 0,

  -- Environment
  environment VARCHAR(20) NOT NULL DEFAULT 'production',
  is_test_key BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  tags TEXT[],
  metadata JSONB,

  -- Audit
  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP,
  revoked_by VARCHAR(30),
  revoke_reason TEXT,

  -- Constraints
  CONSTRAINT valid_ownership CHECK (
    (organization_id IS NOT NULL AND key_type IN ('ORGANIZATION', 'SERVICE', 'WEBHOOK', 'INTEGRATION'))
    OR (user_id IS NOT NULL AND key_type = 'PERSONAL')
  )
);

-- API key scopes definition (for dynamic scope management)
CREATE TABLE api_scope_definitions (
  id VARCHAR(30) PRIMARY KEY,

  -- Scope identification
  scope_name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Categorization
  category VARCHAR(50) NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,

  -- Access level
  is_admin_only BOOLEAN NOT NULL DEFAULT FALSE,
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  requires_mfa BOOLEAN NOT NULL DEFAULT FALSE,

  -- Dependencies
  implies_scopes VARCHAR(100)[],
  requires_scopes VARCHAR(100)[],

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- API key usage logs
CREATE TABLE api_key_usage_logs (
  id VARCHAR(30) PRIMARY KEY,
  api_key_id VARCHAR(30) NOT NULL REFERENCES enhanced_api_keys(id) ON DELETE CASCADE,

  -- Request info
  request_id VARCHAR(100),
  request_method VARCHAR(10) NOT NULL,
  request_path TEXT NOT NULL,
  request_query_params JSONB,

  -- Response info
  response_status INTEGER NOT NULL,
  response_time_ms INTEGER,
  response_size_bytes INTEGER,

  -- Client info
  ip_address VARCHAR(45) NOT NULL,
  ip_country VARCHAR(2),
  ip_city VARCHAR(100),
  user_agent TEXT,
  origin TEXT,
  referer TEXT,

  -- Scope used
  scopes_used api_scope[],

  -- Rate limiting
  was_rate_limited BOOLEAN NOT NULL DEFAULT FALSE,
  rate_limit_remaining INTEGER,

  -- Errors
  error_code VARCHAR(50),
  error_message TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- API key daily usage aggregates
CREATE TABLE api_key_usage_daily (
  id VARCHAR(30) PRIMARY KEY,
  api_key_id VARCHAR(30) NOT NULL REFERENCES enhanced_api_keys(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,

  -- Request counts
  total_requests BIGINT NOT NULL DEFAULT 0,
  successful_requests BIGINT NOT NULL DEFAULT 0,
  failed_requests BIGINT NOT NULL DEFAULT 0,
  rate_limited_requests BIGINT NOT NULL DEFAULT 0,

  -- Response stats
  avg_response_time_ms DECIMAL(10,2),
  p95_response_time_ms DECIMAL(10,2),
  total_response_bytes BIGINT DEFAULT 0,

  -- Breakdown by status
  status_2xx BIGINT NOT NULL DEFAULT 0,
  status_3xx BIGINT NOT NULL DEFAULT 0,
  status_4xx BIGINT NOT NULL DEFAULT 0,
  status_5xx BIGINT NOT NULL DEFAULT 0,

  -- Breakdown by endpoint
  endpoint_stats JSONB DEFAULT '{}',

  -- Unique metrics
  unique_ips INTEGER DEFAULT 0,
  unique_paths INTEGER DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(api_key_id, usage_date)
);

-- API key rate limit tracking (sliding window)
CREATE TABLE api_key_rate_limits (
  id VARCHAR(30) PRIMARY KEY,
  api_key_id VARCHAR(30) NOT NULL REFERENCES enhanced_api_keys(id) ON DELETE CASCADE,

  -- Window tracking
  window_type VARCHAR(20) NOT NULL,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,

  -- Counts
  request_count INTEGER NOT NULL DEFAULT 0,
  limit_value INTEGER NOT NULL,

  -- Exceeded tracking
  limit_exceeded BOOLEAN NOT NULL DEFAULT FALSE,
  exceeded_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(api_key_id, window_type, window_start)
);

-- API key rotation history
CREATE TABLE api_key_rotations (
  id VARCHAR(30) PRIMARY KEY,
  api_key_id VARCHAR(30) NOT NULL REFERENCES enhanced_api_keys(id) ON DELETE CASCADE,

  -- Old key info
  old_key_prefix VARCHAR(12) NOT NULL,
  old_key_hash VARCHAR(255) NOT NULL,

  -- Rotation details
  rotated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  rotated_by VARCHAR(30) NOT NULL,
  rotation_reason TEXT,

  -- Grace period
  old_key_valid_until TIMESTAMP,

  -- Metadata
  metadata JSONB
);

-- API key alerts
CREATE TABLE api_key_alerts (
  id VARCHAR(30) PRIMARY KEY,
  api_key_id VARCHAR(30) NOT NULL REFERENCES enhanced_api_keys(id) ON DELETE CASCADE,

  -- Alert type
  alert_type VARCHAR(50) NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'INFO',

  -- Alert details
  message TEXT NOT NULL,
  details JSONB,

  -- Status
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at TIMESTAMP,
  acknowledged_by VARCHAR(30),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Enhanced API keys
CREATE INDEX idx_enhanced_api_keys_org ON enhanced_api_keys(organization_id);
CREATE INDEX idx_enhanced_api_keys_user ON enhanced_api_keys(user_id);
CREATE INDEX idx_enhanced_api_keys_prefix ON enhanced_api_keys(key_prefix);
CREATE INDEX idx_enhanced_api_keys_hash ON enhanced_api_keys(key_hash);
CREATE INDEX idx_enhanced_api_keys_status ON enhanced_api_keys(status);
CREATE INDEX idx_enhanced_api_keys_type ON enhanced_api_keys(key_type);
CREATE INDEX idx_enhanced_api_keys_scopes ON enhanced_api_keys USING GIN(scopes);
CREATE INDEX idx_enhanced_api_keys_tags ON enhanced_api_keys USING GIN(tags);
CREATE INDEX idx_enhanced_api_keys_active ON enhanced_api_keys(status, expires_at)
  WHERE status = 'ACTIVE' AND (expires_at IS NULL OR expires_at > NOW());
CREATE INDEX idx_enhanced_api_keys_env ON enhanced_api_keys(environment);

-- Usage logs
CREATE INDEX idx_api_key_usage_logs_key ON api_key_usage_logs(api_key_id);
CREATE INDEX idx_api_key_usage_logs_created ON api_key_usage_logs(created_at);
CREATE INDEX idx_api_key_usage_logs_key_date ON api_key_usage_logs(api_key_id, created_at);
CREATE INDEX idx_api_key_usage_logs_status ON api_key_usage_logs(response_status);
CREATE INDEX idx_api_key_usage_logs_path ON api_key_usage_logs(request_path);
CREATE INDEX idx_api_key_usage_logs_ip ON api_key_usage_logs(ip_address);
CREATE INDEX idx_api_key_usage_logs_errors ON api_key_usage_logs(api_key_id, created_at)
  WHERE error_code IS NOT NULL;

-- Usage daily
CREATE INDEX idx_api_key_usage_daily_key ON api_key_usage_daily(api_key_id);
CREATE INDEX idx_api_key_usage_daily_date ON api_key_usage_daily(usage_date);
CREATE INDEX idx_api_key_usage_daily_key_date ON api_key_usage_daily(api_key_id, usage_date);

-- Rate limits
CREATE INDEX idx_api_key_rate_limits_key ON api_key_rate_limits(api_key_id);
CREATE INDEX idx_api_key_rate_limits_window ON api_key_rate_limits(api_key_id, window_type, window_end);

-- Rotations
CREATE INDEX idx_api_key_rotations_key ON api_key_rotations(api_key_id);
CREATE INDEX idx_api_key_rotations_date ON api_key_rotations(rotated_at);

-- Alerts
CREATE INDEX idx_api_key_alerts_key ON api_key_alerts(api_key_id);
CREATE INDEX idx_api_key_alerts_unack ON api_key_alerts(api_key_id, is_acknowledged)
  WHERE is_acknowledged = FALSE;
CREATE INDEX idx_api_key_alerts_created ON api_key_alerts(created_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate API key
CREATE OR REPLACE FUNCTION generate_api_key(
  p_prefix VARCHAR(10) DEFAULT 'nxs'
)
RETURNS TABLE (
  full_key TEXT,
  key_prefix VARCHAR(12),
  key_hash VARCHAR(255),
  key_last_four VARCHAR(4)
) AS $$
DECLARE
  v_key_body TEXT;
  v_full_key TEXT;
BEGIN
  -- Generate random key body (32 bytes = 64 hex chars)
  v_key_body := encode(gen_random_bytes(32), 'hex');

  -- Create full key with prefix
  v_full_key := p_prefix || '_' || v_key_body;

  RETURN QUERY SELECT
    v_full_key,
    (p_prefix || '_' || left(v_key_body, 8))::VARCHAR(12),
    encode(sha256(v_full_key::bytea), 'hex')::VARCHAR(255),
    right(v_key_body, 4)::VARCHAR(4);
END;
$$ LANGUAGE plpgsql;

-- Create API key
CREATE OR REPLACE FUNCTION create_api_key(
  p_organization_id VARCHAR(30),
  p_user_id VARCHAR(30),
  p_name VARCHAR(255),
  p_key_type api_key_type,
  p_scopes api_scope[],
  p_expires_at TIMESTAMP DEFAULT NULL,
  p_created_by VARCHAR(30) DEFAULT NULL
)
RETURNS TABLE (
  api_key_id VARCHAR(30),
  full_key TEXT
) AS $$
DECLARE
  v_key_id VARCHAR(30);
  v_key_data RECORD;
BEGIN
  -- Generate key
  SELECT * INTO v_key_data FROM generate_api_key('nxs');

  -- Generate ID
  v_key_id := 'apk_' || encode(gen_random_bytes(12), 'hex');

  -- Insert key
  INSERT INTO enhanced_api_keys (
    id, organization_id, user_id, name, key_type,
    key_prefix, key_hash, key_last_four,
    scopes, expires_at, never_expires,
    created_by
  ) VALUES (
    v_key_id, p_organization_id, p_user_id, p_name, p_key_type,
    v_key_data.key_prefix, v_key_data.key_hash, v_key_data.key_last_four,
    p_scopes, p_expires_at, (p_expires_at IS NULL),
    COALESCE(p_created_by, p_user_id)
  );

  RETURN QUERY SELECT v_key_id, v_key_data.full_key;
END;
$$ LANGUAGE plpgsql;

-- Validate API key
CREATE OR REPLACE FUNCTION validate_api_key(
  p_key TEXT,
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  api_key_id VARCHAR(30),
  organization_id VARCHAR(30),
  user_id VARCHAR(30),
  scopes api_scope[],
  rate_limit_tier rate_limit_tier,
  error_code VARCHAR(50),
  error_message TEXT
) AS $$
DECLARE
  v_key_hash VARCHAR(255);
  v_api_key enhanced_api_keys%ROWTYPE;
BEGIN
  -- Hash the provided key
  v_key_hash := encode(sha256(p_key::bytea), 'hex');

  -- Find the key
  SELECT * INTO v_api_key
  FROM enhanced_api_keys
  WHERE key_hash = v_key_hash;

  -- Key not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::VARCHAR(30), NULL::VARCHAR(30), NULL::VARCHAR(30),
      NULL::api_scope[], NULL::rate_limit_tier, 'INVALID_KEY'::VARCHAR(50), 'API key not found'::TEXT;
    RETURN;
  END IF;

  -- Check status
  IF v_api_key.status != 'ACTIVE' THEN
    RETURN QUERY SELECT FALSE, v_api_key.id, v_api_key.organization_id, v_api_key.user_id,
      v_api_key.scopes, v_api_key.rate_limit_tier, 'KEY_INACTIVE'::VARCHAR(50),
      ('API key is ' || v_api_key.status::TEXT)::TEXT;
    RETURN;
  END IF;

  -- Check expiration
  IF v_api_key.expires_at IS NOT NULL AND v_api_key.expires_at < NOW() THEN
    -- Mark as expired
    UPDATE enhanced_api_keys SET status = 'EXPIRED' WHERE id = v_api_key.id;

    RETURN QUERY SELECT FALSE, v_api_key.id, v_api_key.organization_id, v_api_key.user_id,
      v_api_key.scopes, v_api_key.rate_limit_tier, 'KEY_EXPIRED'::VARCHAR(50), 'API key has expired'::TEXT;
    RETURN;
  END IF;

  -- Check IP restrictions
  IF v_api_key.allowed_ips IS NOT NULL AND array_length(v_api_key.allowed_ips, 1) > 0 THEN
    IF p_ip_address IS NULL OR NOT (p_ip_address = ANY(v_api_key.allowed_ips)) THEN
      RETURN QUERY SELECT FALSE, v_api_key.id, v_api_key.organization_id, v_api_key.user_id,
        v_api_key.scopes, v_api_key.rate_limit_tier, 'IP_NOT_ALLOWED'::VARCHAR(50),
        'IP address not in allowed list'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Update usage
  UPDATE enhanced_api_keys
  SET last_used_at = NOW(),
      last_used_ip = p_ip_address,
      last_used_user_agent = p_user_agent,
      total_requests = total_requests + 1
  WHERE id = v_api_key.id;

  -- Return success
  RETURN QUERY SELECT TRUE, v_api_key.id, v_api_key.organization_id, v_api_key.user_id,
    v_api_key.scopes, v_api_key.rate_limit_tier, NULL::VARCHAR(50), NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Check API key has scope
CREATE OR REPLACE FUNCTION api_key_has_scope(
  p_api_key_id VARCHAR(30),
  p_scope api_scope
)
RETURNS BOOLEAN AS $$
DECLARE
  v_scopes api_scope[];
BEGIN
  SELECT scopes INTO v_scopes
  FROM enhanced_api_keys
  WHERE id = p_api_key_id AND status = 'ACTIVE';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- FULL_ACCESS includes all scopes
  IF 'FULL_ACCESS' = ANY(v_scopes) THEN
    RETURN TRUE;
  END IF;

  RETURN p_scope = ANY(v_scopes);
END;
$$ LANGUAGE plpgsql;

-- Rotate API key
CREATE OR REPLACE FUNCTION rotate_api_key(
  p_api_key_id VARCHAR(30),
  p_rotated_by VARCHAR(30),
  p_reason TEXT DEFAULT NULL,
  p_grace_period_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  new_full_key TEXT,
  old_key_valid_until TIMESTAMP
) AS $$
DECLARE
  v_old_key enhanced_api_keys%ROWTYPE;
  v_new_key RECORD;
  v_valid_until TIMESTAMP;
BEGIN
  -- Get old key
  SELECT * INTO v_old_key FROM enhanced_api_keys WHERE id = p_api_key_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'API key not found';
  END IF;

  -- Generate new key
  SELECT * INTO v_new_key FROM generate_api_key('nxs');

  v_valid_until := NOW() + (p_grace_period_hours || ' hours')::INTERVAL;

  -- Record rotation
  INSERT INTO api_key_rotations (
    id, api_key_id, old_key_prefix, old_key_hash,
    rotated_by, rotation_reason, old_key_valid_until
  ) VALUES (
    'akr_' || encode(gen_random_bytes(12), 'hex'),
    p_api_key_id, v_old_key.key_prefix, v_old_key.key_hash,
    p_rotated_by, p_reason, v_valid_until
  );

  -- Update key
  UPDATE enhanced_api_keys
  SET key_prefix = v_new_key.key_prefix,
      key_hash = v_new_key.key_hash,
      key_last_four = v_new_key.key_last_four,
      updated_at = NOW()
  WHERE id = p_api_key_id;

  RETURN QUERY SELECT v_new_key.full_key, v_valid_until;
END;
$$ LANGUAGE plpgsql;

-- Check rate limit
CREATE OR REPLACE FUNCTION check_api_key_rate_limit(
  p_api_key_id VARCHAR(30),
  p_window_type VARCHAR(20) DEFAULT 'minute'
)
RETURNS TABLE (
  is_allowed BOOLEAN,
  remaining INTEGER,
  reset_at TIMESTAMP
) AS $$
DECLARE
  v_api_key enhanced_api_keys%ROWTYPE;
  v_limit INTEGER;
  v_window_seconds INTEGER;
  v_window_start TIMESTAMP;
  v_current_count INTEGER;
BEGIN
  -- Get API key
  SELECT * INTO v_api_key FROM enhanced_api_keys WHERE id = p_api_key_id;

  -- Determine limit and window
  CASE p_window_type
    WHEN 'minute' THEN
      v_limit := v_api_key.requests_per_minute;
      v_window_seconds := 60;
    WHEN 'hour' THEN
      v_limit := v_api_key.requests_per_hour;
      v_window_seconds := 3600;
    WHEN 'day' THEN
      v_limit := v_api_key.requests_per_day;
      v_window_seconds := 86400;
    ELSE
      v_limit := v_api_key.requests_per_minute;
      v_window_seconds := 60;
  END CASE;

  v_window_start := date_trunc(p_window_type, NOW());

  -- Get or create rate limit record
  INSERT INTO api_key_rate_limits (
    id, api_key_id, window_type, window_start, window_end, request_count, limit_value
  ) VALUES (
    'arl_' || encode(gen_random_bytes(12), 'hex'),
    p_api_key_id, p_window_type, v_window_start,
    v_window_start + (v_window_seconds || ' seconds')::INTERVAL,
    1, v_limit
  )
  ON CONFLICT (api_key_id, window_type, window_start) DO UPDATE
  SET request_count = api_key_rate_limits.request_count + 1,
      updated_at = NOW()
  RETURNING request_count INTO v_current_count;

  -- Check if exceeded
  IF v_current_count > v_limit THEN
    UPDATE api_key_rate_limits
    SET limit_exceeded = TRUE, exceeded_at = NOW()
    WHERE api_key_id = p_api_key_id
      AND window_type = p_window_type
      AND window_start = v_window_start;

    RETURN QUERY SELECT FALSE, 0,
      (v_window_start + (v_window_seconds || ' seconds')::INTERVAL);
  END IF;

  RETURN QUERY SELECT TRUE, (v_limit - v_current_count),
    (v_window_start + (v_window_seconds || ' seconds')::INTERVAL);
END;
$$ LANGUAGE plpgsql;

-- Aggregate daily usage
CREATE OR REPLACE FUNCTION aggregate_api_key_daily_usage(
  p_date DATE DEFAULT CURRENT_DATE - 1
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO api_key_usage_daily (
    id, api_key_id, usage_date,
    total_requests, successful_requests, failed_requests, rate_limited_requests,
    avg_response_time_ms, p95_response_time_ms, total_response_bytes,
    status_2xx, status_3xx, status_4xx, status_5xx,
    unique_ips, unique_paths
  )
  SELECT
    'aud_' || encode(gen_random_bytes(12), 'hex'),
    api_key_id,
    p_date,
    COUNT(*),
    COUNT(*) FILTER (WHERE response_status >= 200 AND response_status < 300),
    COUNT(*) FILTER (WHERE response_status >= 400),
    COUNT(*) FILTER (WHERE was_rate_limited = TRUE),
    AVG(response_time_ms),
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms),
    SUM(COALESCE(response_size_bytes, 0)),
    COUNT(*) FILTER (WHERE response_status >= 200 AND response_status < 300),
    COUNT(*) FILTER (WHERE response_status >= 300 AND response_status < 400),
    COUNT(*) FILTER (WHERE response_status >= 400 AND response_status < 500),
    COUNT(*) FILTER (WHERE response_status >= 500),
    COUNT(DISTINCT ip_address),
    COUNT(DISTINCT request_path)
  FROM api_key_usage_logs
  WHERE created_at >= p_date
    AND created_at < p_date + 1
  GROUP BY api_key_id
  ON CONFLICT (api_key_id, usage_date) DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    successful_requests = EXCLUDED.successful_requests,
    failed_requests = EXCLUDED.failed_requests,
    rate_limited_requests = EXCLUDED.rate_limited_requests,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    p95_response_time_ms = EXCLUDED.p95_response_time_ms,
    total_response_bytes = EXCLUDED.total_response_bytes,
    status_2xx = EXCLUDED.status_2xx,
    status_3xx = EXCLUDED.status_3xx,
    status_4xx = EXCLUDED.status_4xx,
    status_5xx = EXCLUDED.status_5xx,
    unique_ips = EXCLUDED.unique_ips,
    unique_paths = EXCLUDED.unique_paths,
    updated_at = NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Revoke API key
CREATE OR REPLACE FUNCTION revoke_api_key(
  p_api_key_id VARCHAR(30),
  p_revoked_by VARCHAR(30),
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE enhanced_api_keys
  SET status = 'REVOKED',
      revoked_at = NOW(),
      revoked_by = p_revoked_by,
      revoke_reason = p_reason,
      updated_at = NOW()
  WHERE id = p_api_key_id AND status = 'ACTIVE';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Create alert
  INSERT INTO api_key_alerts (
    id, api_key_id, alert_type, severity, message, details
  ) VALUES (
    'aka_' || encode(gen_random_bytes(12), 'hex'),
    p_api_key_id, 'KEY_REVOKED', 'HIGH',
    'API key has been revoked',
    jsonb_build_object('revoked_by', p_revoked_by, 'reason', p_reason)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER update_enhanced_api_keys_updated_at
  BEFORE UPDATE ON enhanced_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_scope_definitions_updated_at
  BEFORE UPDATE ON api_scope_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_key_usage_daily_updated_at
  BEFORE UPDATE ON api_key_usage_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_key_rate_limits_updated_at
  BEFORE UPDATE ON api_key_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Alert on suspicious activity
CREATE OR REPLACE FUNCTION check_api_key_suspicious_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_failures INTEGER;
BEGIN
  -- Check for many failures in short time
  IF NEW.response_status >= 400 THEN
    SELECT COUNT(*) INTO v_recent_failures
    FROM api_key_usage_logs
    WHERE api_key_id = NEW.api_key_id
      AND created_at >= NOW() - INTERVAL '5 minutes'
      AND response_status >= 400;

    IF v_recent_failures >= 100 THEN
      INSERT INTO api_key_alerts (
        id, api_key_id, alert_type, severity, message, details
      ) VALUES (
        'aka_' || encode(gen_random_bytes(12), 'hex'),
        NEW.api_key_id, 'HIGH_ERROR_RATE', 'WARNING',
        'High error rate detected',
        jsonb_build_object('failures_last_5min', v_recent_failures)
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_suspicious_activity
  AFTER INSERT ON api_key_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION check_api_key_suspicious_activity();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert scope definitions
INSERT INTO api_scope_definitions (id, scope_name, display_name, description, category, resource, action, is_admin_only, is_sensitive) VALUES
  ('asd_001', 'READ:USERS', 'Read Users', 'View user profiles and basic information', 'users', 'users', 'read', FALSE, FALSE),
  ('asd_002', 'WRITE:USERS', 'Write Users', 'Create and update user profiles', 'users', 'users', 'write', FALSE, TRUE),
  ('asd_003', 'ADMIN:USERS', 'Administer Users', 'Full user management including deletion', 'users', 'users', 'admin', TRUE, TRUE),
  ('asd_004', 'READ:ORGANIZATIONS', 'Read Organizations', 'View organization information', 'organizations', 'organizations', 'read', FALSE, FALSE),
  ('asd_005', 'WRITE:ORGANIZATIONS', 'Write Organizations', 'Create and update organizations', 'organizations', 'organizations', 'write', FALSE, TRUE),
  ('asd_006', 'READ:CAMPAIGNS', 'Read Campaigns', 'View campaign details and metrics', 'campaigns', 'campaigns', 'read', FALSE, FALSE),
  ('asd_007', 'WRITE:CAMPAIGNS', 'Write Campaigns', 'Create and manage campaigns', 'campaigns', 'campaigns', 'write', FALSE, FALSE),
  ('asd_008', 'READ:CONTENT', 'Read Content', 'Access content library', 'content', 'content', 'read', FALSE, FALSE),
  ('asd_009', 'WRITE:CONTENT', 'Write Content', 'Upload and manage content', 'content', 'content', 'write', FALSE, FALSE),
  ('asd_010', 'READ:ANALYTICS', 'Read Analytics', 'View analytics and reports', 'analytics', 'analytics', 'read', FALSE, FALSE),
  ('asd_011', 'READ:BILLING', 'Read Billing', 'View billing information', 'billing', 'billing', 'read', FALSE, TRUE),
  ('asd_012', 'WRITE:BILLING', 'Write Billing', 'Manage billing and payments', 'billing', 'billing', 'write', FALSE, TRUE),
  ('asd_013', 'FULL_ACCESS', 'Full Access', 'Complete access to all resources', 'admin', 'all', 'all', TRUE, TRUE),
  ('asd_014', 'PUBLIC_READ', 'Public Read', 'Read publicly available data', 'public', 'public', 'read', FALSE, FALSE);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE enhanced_api_keys IS 'API keys with hashed storage, scopes, and rate limiting';
COMMENT ON TABLE api_scope_definitions IS 'Definition of available API scopes';
COMMENT ON TABLE api_key_usage_logs IS 'Detailed log of all API requests';
COMMENT ON TABLE api_key_usage_daily IS 'Daily aggregated usage statistics';
COMMENT ON TABLE api_key_rate_limits IS 'Sliding window rate limit tracking';
COMMENT ON TABLE api_key_rotations IS 'History of API key rotations';
COMMENT ON TABLE api_key_alerts IS 'Alerts for suspicious or notable activity';
COMMENT ON FUNCTION generate_api_key IS 'Generates a new secure API key with hash';
COMMENT ON FUNCTION create_api_key IS 'Creates a new API key with specified permissions';
COMMENT ON FUNCTION validate_api_key IS 'Validates an API key and returns its permissions';
COMMENT ON FUNCTION api_key_has_scope IS 'Checks if an API key has a specific scope';
COMMENT ON FUNCTION rotate_api_key IS 'Rotates an API key with optional grace period';
COMMENT ON FUNCTION check_api_key_rate_limit IS 'Checks and updates rate limiting for an API key';
COMMENT ON FUNCTION revoke_api_key IS 'Revokes an API key permanently';
