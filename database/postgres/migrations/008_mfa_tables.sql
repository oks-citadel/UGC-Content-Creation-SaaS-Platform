-- NEXUS Platform - MFA Tables Migration
-- Multi-factor authentication methods, recovery codes, and verification logs
-- Generated: 2025-12-23

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE mfa_method_type AS ENUM (
  'TOTP',
  'SMS',
  'EMAIL',
  'WEBAUTHN',
  'PUSH',
  'BACKUP_CODE'
);

CREATE TYPE mfa_method_status AS ENUM (
  'PENDING_SETUP',
  'ACTIVE',
  'DISABLED',
  'LOCKED'
);

CREATE TYPE mfa_verification_result AS ENUM (
  'SUCCESS',
  'FAILED',
  'EXPIRED',
  'LOCKED_OUT',
  'RATE_LIMITED'
);

CREATE TYPE mfa_event_type AS ENUM (
  'SETUP_STARTED',
  'SETUP_COMPLETED',
  'SETUP_FAILED',
  'VERIFICATION_SUCCESS',
  'VERIFICATION_FAILED',
  'METHOD_DISABLED',
  'METHOD_ENABLED',
  'RECOVERY_USED',
  'RECOVERY_REGENERATED',
  'LOCKOUT_TRIGGERED',
  'LOCKOUT_CLEARED'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- MFA methods configured per user
CREATE TABLE mfa_methods (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Method type
  method_type mfa_method_type NOT NULL,
  status mfa_method_status NOT NULL DEFAULT 'PENDING_SETUP',

  -- Method-specific configuration (encrypted)
  secret_encrypted TEXT,
  config JSONB DEFAULT '{}',

  -- For TOTP
  totp_algorithm VARCHAR(10) DEFAULT 'SHA1',
  totp_digits INTEGER DEFAULT 6,
  totp_period INTEGER DEFAULT 30,

  -- For SMS/Email
  phone_number VARCHAR(20),
  email_address VARCHAR(255),

  -- For WebAuthn
  credential_id TEXT,
  public_key TEXT,
  attestation_type VARCHAR(50),
  authenticator_aaguid VARCHAR(36),
  device_name VARCHAR(255),

  -- Priority and defaults
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  priority INTEGER NOT NULL DEFAULT 0,

  -- Verification tracking
  last_verified_at TIMESTAMP,
  verification_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,

  -- Setup tracking
  setup_completed_at TIMESTAMP,
  setup_ip_address VARCHAR(45),

  -- Metadata
  nickname VARCHAR(100),
  metadata JSONB,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  disabled_at TIMESTAMP,

  UNIQUE(user_id, method_type, credential_id)
);

-- Recovery codes for MFA backup
CREATE TABLE mfa_recovery_codes (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Code (hashed for security)
  code_hash VARCHAR(255) NOT NULL,
  code_hint VARCHAR(4),

  -- Usage tracking
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP,
  used_ip_address VARCHAR(45),
  used_user_agent TEXT,

  -- Generation batch
  batch_id VARCHAR(30) NOT NULL,
  code_index INTEGER NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,

  UNIQUE(user_id, code_hash)
);

-- Recovery code batches
CREATE TABLE mfa_recovery_code_batches (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Batch info
  total_codes INTEGER NOT NULL,
  used_codes INTEGER NOT NULL DEFAULT 0,
  remaining_codes INTEGER NOT NULL,

  -- Generation context
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  generated_ip_address VARCHAR(45),
  regeneration_reason TEXT,

  -- Previous batch
  replaces_batch_id VARCHAR(30),

  -- Expiration
  expires_at TIMESTAMP,
  invalidated_at TIMESTAMP,
  invalidated_reason TEXT
);

-- MFA verification logs
CREATE TABLE mfa_verification_logs (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Method used
  method_id VARCHAR(30) REFERENCES mfa_methods(id) ON DELETE SET NULL,
  method_type mfa_method_type NOT NULL,

  -- Verification result
  result mfa_verification_result NOT NULL,

  -- Context
  session_id VARCHAR(30),
  request_id VARCHAR(100),
  ip_address VARCHAR(45) NOT NULL,
  ip_country VARCHAR(2),
  ip_city VARCHAR(100),
  user_agent TEXT,
  device_fingerprint VARCHAR(255),

  -- Timing
  challenge_sent_at TIMESTAMP,
  response_received_at TIMESTAMP,
  verification_latency_ms INTEGER,

  -- Error details
  error_code VARCHAR(50),
  error_message TEXT,

  -- Risk assessment
  risk_score DECIMAL(5,4),
  risk_factors JSONB,

  -- For analytics
  was_remembered BOOLEAN DEFAULT FALSE,
  trust_device_requested BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- MFA event audit log
CREATE TABLE mfa_events (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Event details
  event_type mfa_event_type NOT NULL,
  method_id VARCHAR(30),
  method_type mfa_method_type,

  -- Context
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,

  -- Additional data
  event_data JSONB,

  -- Admin actions
  performed_by VARCHAR(30),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Trusted devices for "remember this device"
CREATE TABLE mfa_trusted_devices (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Device identification
  device_token VARCHAR(255) UNIQUE NOT NULL,
  device_fingerprint VARCHAR(255),
  device_name VARCHAR(255),

  -- Device info
  browser VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  os_version VARCHAR(50),
  device_type VARCHAR(50),

  -- Trust context
  trusted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  trusted_ip_address VARCHAR(45) NOT NULL,
  trusted_location VARCHAR(255),

  -- Usage tracking
  last_used_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_ip_address VARCHAR(45),
  use_count INTEGER NOT NULL DEFAULT 1,

  -- Trust duration
  expires_at TIMESTAMP NOT NULL,

  -- Revocation
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMP,
  revoked_reason TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- MFA rate limiting
CREATE TABLE mfa_rate_limits (
  id VARCHAR(30) PRIMARY KEY,

  -- Rate limit key (user_id, ip, method, etc.)
  rate_limit_key VARCHAR(255) NOT NULL,
  rate_limit_type VARCHAR(50) NOT NULL,

  -- Counters
  attempt_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Lockout
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  locked_until TIMESTAMP,
  lockout_count INTEGER NOT NULL DEFAULT 0,

  -- Context
  user_id VARCHAR(30),
  ip_address VARCHAR(45),
  method_type mfa_method_type,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(rate_limit_key, rate_limit_type)
);

-- MFA configuration per organization
CREATE TABLE organization_mfa_policies (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Requirements
  mfa_required BOOLEAN NOT NULL DEFAULT FALSE,
  mfa_required_for_roles user_role[],
  grace_period_days INTEGER DEFAULT 7,

  -- Allowed methods
  allowed_methods mfa_method_type[] NOT NULL DEFAULT ARRAY['TOTP', 'EMAIL']::mfa_method_type[],
  preferred_method mfa_method_type DEFAULT 'TOTP',

  -- Security settings
  max_failed_attempts INTEGER NOT NULL DEFAULT 5,
  lockout_duration_minutes INTEGER NOT NULL DEFAULT 30,
  code_validity_seconds INTEGER NOT NULL DEFAULT 300,

  -- Trust settings
  allow_trusted_devices BOOLEAN NOT NULL DEFAULT TRUE,
  trusted_device_duration_days INTEGER NOT NULL DEFAULT 30,
  max_trusted_devices INTEGER NOT NULL DEFAULT 5,

  -- Recovery settings
  recovery_codes_count INTEGER NOT NULL DEFAULT 10,
  recovery_codes_validity_days INTEGER,

  -- Notification settings
  notify_on_new_device BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_mfa_change BOOLEAN NOT NULL DEFAULT TRUE,

  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- MFA Methods
CREATE INDEX idx_mfa_methods_user ON mfa_methods(user_id);
CREATE INDEX idx_mfa_methods_type ON mfa_methods(method_type);
CREATE INDEX idx_mfa_methods_status ON mfa_methods(status);
CREATE INDEX idx_mfa_methods_primary ON mfa_methods(user_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_mfa_methods_active ON mfa_methods(user_id, status) WHERE status = 'ACTIVE';
CREATE INDEX idx_mfa_methods_credential ON mfa_methods(credential_id) WHERE credential_id IS NOT NULL;

-- Recovery codes
CREATE INDEX idx_mfa_recovery_codes_user ON mfa_recovery_codes(user_id);
CREATE INDEX idx_mfa_recovery_codes_batch ON mfa_recovery_codes(batch_id);
CREATE INDEX idx_mfa_recovery_codes_available ON mfa_recovery_codes(user_id, is_used) WHERE is_used = FALSE;

-- Recovery code batches
CREATE INDEX idx_mfa_recovery_batches_user ON mfa_recovery_code_batches(user_id);
CREATE INDEX idx_mfa_recovery_batches_active ON mfa_recovery_code_batches(user_id, invalidated_at)
  WHERE invalidated_at IS NULL;

-- Verification logs
CREATE INDEX idx_mfa_verification_logs_user ON mfa_verification_logs(user_id);
CREATE INDEX idx_mfa_verification_logs_method ON mfa_verification_logs(method_id);
CREATE INDEX idx_mfa_verification_logs_result ON mfa_verification_logs(result);
CREATE INDEX idx_mfa_verification_logs_created ON mfa_verification_logs(created_at);
CREATE INDEX idx_mfa_verification_logs_ip ON mfa_verification_logs(ip_address);
CREATE INDEX idx_mfa_verification_logs_user_date ON mfa_verification_logs(user_id, created_at);

-- Failed verifications for security monitoring
CREATE INDEX idx_mfa_verification_logs_failed ON mfa_verification_logs(user_id, created_at)
  WHERE result = 'FAILED';

-- Events
CREATE INDEX idx_mfa_events_user ON mfa_events(user_id);
CREATE INDEX idx_mfa_events_type ON mfa_events(event_type);
CREATE INDEX idx_mfa_events_created ON mfa_events(created_at);

-- Trusted devices
CREATE INDEX idx_mfa_trusted_devices_user ON mfa_trusted_devices(user_id);
CREATE INDEX idx_mfa_trusted_devices_token ON mfa_trusted_devices(device_token);
CREATE INDEX idx_mfa_trusted_devices_active ON mfa_trusted_devices(user_id, expires_at)
  WHERE is_revoked = FALSE;
CREATE INDEX idx_mfa_trusted_devices_fingerprint ON mfa_trusted_devices(device_fingerprint);

-- Rate limits
CREATE INDEX idx_mfa_rate_limits_key ON mfa_rate_limits(rate_limit_key);
CREATE INDEX idx_mfa_rate_limits_locked ON mfa_rate_limits(is_locked, locked_until)
  WHERE is_locked = TRUE;

-- Organization policies
CREATE INDEX idx_org_mfa_policies_org ON organization_mfa_policies(organization_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Check if user has MFA enabled
CREATE OR REPLACE FUNCTION user_has_mfa_enabled(p_user_id VARCHAR(30))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM mfa_methods
    WHERE user_id = p_user_id
      AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql;

-- Get active MFA methods for user
CREATE OR REPLACE FUNCTION get_user_mfa_methods(p_user_id VARCHAR(30))
RETURNS TABLE (
  method_id VARCHAR(30),
  method_type mfa_method_type,
  is_primary BOOLEAN,
  nickname VARCHAR(100),
  last_verified_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.method_type,
    m.is_primary,
    m.nickname,
    m.last_verified_at
  FROM mfa_methods m
  WHERE m.user_id = p_user_id
    AND m.status = 'ACTIVE'
  ORDER BY m.is_primary DESC, m.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- Generate recovery codes
CREATE OR REPLACE FUNCTION generate_recovery_codes(
  p_user_id VARCHAR(30),
  p_code_count INTEGER DEFAULT 10,
  p_ip_address VARCHAR(45) DEFAULT NULL
)
RETURNS TABLE (code TEXT, hint TEXT) AS $$
DECLARE
  v_batch_id VARCHAR(30);
  v_code TEXT;
  v_i INTEGER;
BEGIN
  -- Create batch record
  v_batch_id := 'rcb_' || encode(gen_random_bytes(12), 'hex');

  -- Invalidate previous batches
  UPDATE mfa_recovery_code_batches
  SET invalidated_at = NOW(),
      invalidated_reason = 'Replaced by new batch'
  WHERE user_id = p_user_id
    AND invalidated_at IS NULL;

  -- Mark old codes as expired
  UPDATE mfa_recovery_codes
  SET expires_at = NOW()
  WHERE user_id = p_user_id
    AND is_used = FALSE
    AND (expires_at IS NULL OR expires_at > NOW());

  -- Insert batch record
  INSERT INTO mfa_recovery_code_batches (
    id, user_id, total_codes, remaining_codes,
    generated_ip_address
  ) VALUES (
    v_batch_id, p_user_id, p_code_count, p_code_count,
    p_ip_address
  );

  -- Generate codes
  FOR v_i IN 1..p_code_count LOOP
    v_code := upper(encode(gen_random_bytes(5), 'hex'));

    INSERT INTO mfa_recovery_codes (
      id, user_id, code_hash, code_hint, batch_id, code_index
    ) VALUES (
      'rc_' || encode(gen_random_bytes(12), 'hex'),
      p_user_id,
      encode(sha256(v_code::bytea), 'hex'),
      left(v_code, 4),
      v_batch_id,
      v_i
    );

    RETURN QUERY SELECT v_code, left(v_code, 4);
  END LOOP;

  -- Log event
  INSERT INTO mfa_events (
    id, user_id, event_type, ip_address, event_data
  ) VALUES (
    'mev_' || encode(gen_random_bytes(12), 'hex'),
    p_user_id, 'RECOVERY_REGENERATED', COALESCE(p_ip_address, '0.0.0.0'),
    jsonb_build_object('batch_id', v_batch_id, 'code_count', p_code_count)
  );

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Verify recovery code
CREATE OR REPLACE FUNCTION verify_recovery_code(
  p_user_id VARCHAR(30),
  p_code TEXT,
  p_ip_address VARCHAR(45),
  p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_code_id VARCHAR(30);
  v_code_hash VARCHAR(255);
BEGIN
  v_code_hash := encode(sha256(upper(p_code)::bytea), 'hex');

  -- Find and use the code
  UPDATE mfa_recovery_codes
  SET is_used = TRUE,
      used_at = NOW(),
      used_ip_address = p_ip_address,
      used_user_agent = p_user_agent
  WHERE user_id = p_user_id
    AND code_hash = v_code_hash
    AND is_used = FALSE
    AND (expires_at IS NULL OR expires_at > NOW())
  RETURNING id INTO v_code_id;

  IF v_code_id IS NOT NULL THEN
    -- Update batch remaining count
    UPDATE mfa_recovery_code_batches
    SET used_codes = used_codes + 1,
        remaining_codes = remaining_codes - 1
    WHERE id = (
      SELECT batch_id FROM mfa_recovery_codes WHERE id = v_code_id
    );

    -- Log event
    INSERT INTO mfa_events (
      id, user_id, event_type, ip_address, user_agent, event_data
    ) VALUES (
      'mev_' || encode(gen_random_bytes(12), 'hex'),
      p_user_id, 'RECOVERY_USED', p_ip_address, p_user_agent,
      jsonb_build_object('code_id', v_code_id)
    );

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Check rate limit
CREATE OR REPLACE FUNCTION check_mfa_rate_limit(
  p_rate_limit_key VARCHAR(255),
  p_rate_limit_type VARCHAR(50),
  p_max_attempts INTEGER DEFAULT 5,
  p_window_seconds INTEGER DEFAULT 300,
  p_lockout_seconds INTEGER DEFAULT 1800
)
RETURNS TABLE (
  is_allowed BOOLEAN,
  remaining_attempts INTEGER,
  locked_until TIMESTAMP
) AS $$
DECLARE
  v_rate_limit mfa_rate_limits%ROWTYPE;
  v_window_start TIMESTAMP;
BEGIN
  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- Get or create rate limit record
  INSERT INTO mfa_rate_limits (
    id, rate_limit_key, rate_limit_type, attempt_count, window_start
  ) VALUES (
    'mrl_' || encode(gen_random_bytes(12), 'hex'),
    p_rate_limit_key, p_rate_limit_type, 1, NOW()
  )
  ON CONFLICT (rate_limit_key, rate_limit_type) DO UPDATE SET
    attempt_count = CASE
      WHEN mfa_rate_limits.window_start < v_window_start THEN 1
      ELSE mfa_rate_limits.attempt_count + 1
    END,
    window_start = CASE
      WHEN mfa_rate_limits.window_start < v_window_start THEN NOW()
      ELSE mfa_rate_limits.window_start
    END,
    updated_at = NOW()
  RETURNING * INTO v_rate_limit;

  -- Check if locked
  IF v_rate_limit.is_locked AND v_rate_limit.locked_until > NOW() THEN
    RETURN QUERY SELECT FALSE, 0, v_rate_limit.locked_until;
    RETURN;
  END IF;

  -- Clear expired lockout
  IF v_rate_limit.is_locked AND v_rate_limit.locked_until <= NOW() THEN
    UPDATE mfa_rate_limits
    SET is_locked = FALSE, locked_until = NULL, attempt_count = 1, window_start = NOW()
    WHERE id = v_rate_limit.id;

    v_rate_limit.is_locked := FALSE;
    v_rate_limit.attempt_count := 1;
  END IF;

  -- Check if should lock
  IF v_rate_limit.attempt_count >= p_max_attempts THEN
    UPDATE mfa_rate_limits
    SET is_locked = TRUE,
        locked_until = NOW() + (p_lockout_seconds || ' seconds')::INTERVAL,
        lockout_count = lockout_count + 1
    WHERE id = v_rate_limit.id
    RETURNING locked_until INTO v_rate_limit.locked_until;

    RETURN QUERY SELECT FALSE, 0, v_rate_limit.locked_until;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, p_max_attempts - v_rate_limit.attempt_count, NULL::TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Trust a device
CREATE OR REPLACE FUNCTION trust_device(
  p_user_id VARCHAR(30),
  p_device_token VARCHAR(255),
  p_device_fingerprint VARCHAR(255),
  p_device_name VARCHAR(255),
  p_ip_address VARCHAR(45),
  p_user_agent TEXT,
  p_duration_days INTEGER DEFAULT 30
)
RETURNS VARCHAR(30) AS $$
DECLARE
  v_device_id VARCHAR(30);
BEGIN
  v_device_id := 'mtd_' || encode(gen_random_bytes(12), 'hex');

  INSERT INTO mfa_trusted_devices (
    id, user_id, device_token, device_fingerprint, device_name,
    trusted_ip_address, expires_at
  ) VALUES (
    v_device_id, p_user_id, p_device_token, p_device_fingerprint, p_device_name,
    p_ip_address, NOW() + (p_duration_days || ' days')::INTERVAL
  )
  ON CONFLICT (device_token) DO UPDATE SET
    last_used_at = NOW(),
    last_used_ip_address = p_ip_address,
    use_count = mfa_trusted_devices.use_count + 1;

  RETURN v_device_id;
END;
$$ LANGUAGE plpgsql;

-- Check if device is trusted
CREATE OR REPLACE FUNCTION is_device_trusted(
  p_user_id VARCHAR(30),
  p_device_token VARCHAR(255)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_trusted BOOLEAN;
BEGIN
  SELECT TRUE INTO v_is_trusted
  FROM mfa_trusted_devices
  WHERE user_id = p_user_id
    AND device_token = p_device_token
    AND is_revoked = FALSE
    AND expires_at > NOW();

  IF v_is_trusted THEN
    -- Update last used
    UPDATE mfa_trusted_devices
    SET last_used_at = NOW(),
        use_count = use_count + 1
    WHERE user_id = p_user_id AND device_token = p_device_token;
  END IF;

  RETURN COALESCE(v_is_trusted, FALSE);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER update_mfa_methods_updated_at
  BEFORE UPDATE ON mfa_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mfa_rate_limits_updated_at
  BEFORE UPDATE ON mfa_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_mfa_policies_updated_at
  BEFORE UPDATE ON organization_mfa_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one primary method per user
CREATE OR REPLACE FUNCTION ensure_single_primary_mfa()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE mfa_methods
    SET is_primary = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_primary_mfa
  BEFORE INSERT OR UPDATE ON mfa_methods
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION ensure_single_primary_mfa();

-- Update user mfa_enabled flag
CREATE OR REPLACE FUNCTION sync_user_mfa_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET mfa_enabled = EXISTS (
    SELECT 1 FROM mfa_methods
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND status = 'ACTIVE'
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_user_mfa_status
  AFTER INSERT OR UPDATE OR DELETE ON mfa_methods
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_mfa_status();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE mfa_methods IS 'MFA methods configured for each user (TOTP, SMS, Email, WebAuthn)';
COMMENT ON TABLE mfa_recovery_codes IS 'Backup recovery codes for MFA, hashed for security';
COMMENT ON TABLE mfa_recovery_code_batches IS 'Tracks recovery code generation batches';
COMMENT ON TABLE mfa_verification_logs IS 'Log of all MFA verification attempts';
COMMENT ON TABLE mfa_events IS 'Audit trail for MFA-related events';
COMMENT ON TABLE mfa_trusted_devices IS 'Devices that can skip MFA for a period';
COMMENT ON TABLE mfa_rate_limits IS 'Rate limiting for MFA attempts to prevent brute force';
COMMENT ON TABLE organization_mfa_policies IS 'Organization-level MFA requirements and settings';
COMMENT ON FUNCTION user_has_mfa_enabled IS 'Check if user has any active MFA method';
COMMENT ON FUNCTION generate_recovery_codes IS 'Generate new set of recovery codes for user';
COMMENT ON FUNCTION verify_recovery_code IS 'Verify and consume a recovery code';
COMMENT ON FUNCTION check_mfa_rate_limit IS 'Check and update rate limiting for MFA attempts';
COMMENT ON FUNCTION trust_device IS 'Add or update a trusted device for user';
COMMENT ON FUNCTION is_device_trusted IS 'Check if a device is trusted for MFA skip';
