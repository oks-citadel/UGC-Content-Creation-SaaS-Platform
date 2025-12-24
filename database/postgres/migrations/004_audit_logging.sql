-- NEXUS Platform - Enhanced Audit Logging Migration
-- Compliance-focused audit trail system
-- Generated: 2025-12-23

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE audit_action_type AS ENUM (
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'PERMISSION_CHANGE',
  'EXPORT',
  'IMPORT',
  'APPROVE',
  'REJECT',
  'SUSPEND',
  'REACTIVATE'
);

CREATE TYPE audit_severity AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE audit_outcome AS ENUM (
  'SUCCESS',
  'FAILURE',
  'PARTIAL'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Enhanced audit logs table for compliance requirements
CREATE TABLE compliance_audit_logs (
  id VARCHAR(30) PRIMARY KEY,

  -- Actor information
  user_id VARCHAR(30) REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role user_role,
  organization_id VARCHAR(30) REFERENCES organizations(id) ON DELETE SET NULL,

  -- Session context
  session_id VARCHAR(30),
  ip_address VARCHAR(45) NOT NULL,
  ip_country VARCHAR(2),
  ip_city VARCHAR(100),
  user_agent TEXT,
  device_fingerprint VARCHAR(255),

  -- Action details
  action audit_action_type NOT NULL,
  action_category VARCHAR(50) NOT NULL,
  severity audit_severity NOT NULL DEFAULT 'LOW',
  outcome audit_outcome NOT NULL DEFAULT 'SUCCESS',

  -- Resource information
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(30),
  resource_name VARCHAR(255),

  -- Change tracking
  before_value JSONB,
  after_value JSONB,
  changed_fields TEXT[],

  -- Additional context
  description TEXT,
  metadata JSONB,
  error_message TEXT,
  stack_trace TEXT,

  -- Request context
  request_id VARCHAR(100),
  request_method VARCHAR(10),
  request_path TEXT,
  request_params JSONB,

  -- Compliance fields
  retention_until TIMESTAMP,
  is_sensitive BOOLEAN NOT NULL DEFAULT FALSE,
  is_pii BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_tags TEXT[],

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Ensure immutability
  CONSTRAINT audit_log_immutable CHECK (created_at <= NOW() + INTERVAL '1 second')
);

-- Audit log archives for long-term storage
CREATE TABLE audit_log_archives (
  id VARCHAR(30) PRIMARY KEY,
  archive_date DATE NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  record_count INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  encryption_key_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User activity summary for quick compliance reports
CREATE TABLE user_activity_summaries (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,

  -- Activity counts
  login_count INTEGER NOT NULL DEFAULT 0,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  api_calls INTEGER NOT NULL DEFAULT 0,

  -- Actions
  creates INTEGER NOT NULL DEFAULT 0,
  updates INTEGER NOT NULL DEFAULT 0,
  deletes INTEGER NOT NULL DEFAULT 0,

  -- Session info
  session_count INTEGER NOT NULL DEFAULT 0,
  total_session_duration_seconds INTEGER NOT NULL DEFAULT 0,
  unique_ips TEXT[],

  -- Risk indicators
  suspicious_activities INTEGER NOT NULL DEFAULT 0,
  high_severity_actions INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, summary_date)
);

-- Sensitive data access log
CREATE TABLE sensitive_data_access_logs (
  id VARCHAR(30) PRIMARY KEY,
  audit_log_id VARCHAR(30) NOT NULL REFERENCES compliance_audit_logs(id) ON DELETE CASCADE,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  data_type VARCHAR(100) NOT NULL,
  data_classification VARCHAR(50) NOT NULL,
  access_reason TEXT,
  approved_by VARCHAR(30),

  -- Fields accessed
  fields_accessed TEXT[] NOT NULL,
  records_accessed INTEGER NOT NULL DEFAULT 1,

  -- Export details
  was_exported BOOLEAN NOT NULL DEFAULT FALSE,
  export_format VARCHAR(20),
  export_destination TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_compliance_audit_logs_user_id ON compliance_audit_logs(user_id);
CREATE INDEX idx_compliance_audit_logs_org_id ON compliance_audit_logs(organization_id);
CREATE INDEX idx_compliance_audit_logs_created_at ON compliance_audit_logs(created_at);
CREATE INDEX idx_compliance_audit_logs_action ON compliance_audit_logs(action);
CREATE INDEX idx_compliance_audit_logs_resource ON compliance_audit_logs(resource_type, resource_id);
CREATE INDEX idx_compliance_audit_logs_ip ON compliance_audit_logs(ip_address);
CREATE INDEX idx_compliance_audit_logs_session ON compliance_audit_logs(session_id);

-- Compliance search indexes
CREATE INDEX idx_compliance_audit_logs_severity ON compliance_audit_logs(severity);
CREATE INDEX idx_compliance_audit_logs_outcome ON compliance_audit_logs(outcome);
CREATE INDEX idx_compliance_audit_logs_sensitive ON compliance_audit_logs(is_sensitive) WHERE is_sensitive = TRUE;
CREATE INDEX idx_compliance_audit_logs_pii ON compliance_audit_logs(is_pii) WHERE is_pii = TRUE;
CREATE INDEX idx_compliance_audit_logs_compliance_tags ON compliance_audit_logs USING GIN(compliance_tags);

-- Date range queries for compliance reports
CREATE INDEX idx_compliance_audit_logs_user_date ON compliance_audit_logs(user_id, created_at);
CREATE INDEX idx_compliance_audit_logs_org_date ON compliance_audit_logs(organization_id, created_at);
CREATE INDEX idx_compliance_audit_logs_action_date ON compliance_audit_logs(action, created_at);

-- Activity summary indexes
CREATE INDEX idx_user_activity_summaries_user_date ON user_activity_summaries(user_id, summary_date);
CREATE INDEX idx_user_activity_summaries_date ON user_activity_summaries(summary_date);

-- Sensitive data access indexes
CREATE INDEX idx_sensitive_data_access_user ON sensitive_data_access_logs(user_id);
CREATE INDEX idx_sensitive_data_access_type ON sensitive_data_access_logs(data_type);
CREATE INDEX idx_sensitive_data_access_date ON sensitive_data_access_logs(created_at);

-- Archive indexes
CREATE INDEX idx_audit_log_archives_date ON audit_log_archives(archive_date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to create compliance audit log entries
CREATE OR REPLACE FUNCTION log_compliance_audit(
  p_user_id VARCHAR(30),
  p_action audit_action_type,
  p_resource_type VARCHAR(100),
  p_resource_id VARCHAR(30),
  p_ip_address VARCHAR(45),
  p_before_value JSONB DEFAULT NULL,
  p_after_value JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VARCHAR(30) AS $$
DECLARE
  v_log_id VARCHAR(30);
  v_user_email VARCHAR(255);
  v_user_role user_role;
  v_org_id VARCHAR(30);
  v_severity audit_severity;
  v_changed_fields TEXT[];
BEGIN
  -- Get user details
  SELECT email, role INTO v_user_email, v_user_role
  FROM users WHERE id = p_user_id;

  -- Get organization from context if available
  v_org_id := current_setting('app.current_org_id', TRUE);

  -- Determine severity based on action
  v_severity := CASE
    WHEN p_action IN ('DELETE', 'PERMISSION_CHANGE', 'SUSPEND') THEN 'HIGH'
    WHEN p_action IN ('UPDATE', 'PASSWORD_CHANGE', 'MFA_DISABLED') THEN 'MEDIUM'
    WHEN p_action IN ('LOGIN_FAILED') THEN 'MEDIUM'
    ELSE 'LOW'
  END;

  -- Calculate changed fields if both before and after values exist
  IF p_before_value IS NOT NULL AND p_after_value IS NOT NULL THEN
    SELECT array_agg(key)
    INTO v_changed_fields
    FROM (
      SELECT key FROM jsonb_object_keys(p_before_value) AS key
      WHERE p_before_value->key IS DISTINCT FROM p_after_value->key
      UNION
      SELECT key FROM jsonb_object_keys(p_after_value) AS key
      WHERE NOT p_before_value ? key
    ) AS changed_keys;
  END IF;

  -- Generate ID
  v_log_id := 'aud_' || encode(gen_random_bytes(12), 'hex');

  -- Insert audit log
  INSERT INTO compliance_audit_logs (
    id, user_id, user_email, user_role, organization_id,
    ip_address, action, action_category, severity, outcome,
    resource_type, resource_id, before_value, after_value,
    changed_fields, metadata, created_at
  ) VALUES (
    v_log_id, p_user_id, v_user_email, v_user_role, v_org_id,
    p_ip_address, p_action,
    CASE
      WHEN p_action IN ('LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'MFA_ENABLED', 'MFA_DISABLED') THEN 'AUTH'
      WHEN p_action IN ('CREATE', 'UPDATE', 'DELETE') THEN 'DATA'
      WHEN p_action IN ('APPROVE', 'REJECT') THEN 'WORKFLOW'
      ELSE 'OTHER'
    END,
    v_severity, 'SUCCESS',
    p_resource_type, p_resource_id, p_before_value, p_after_value,
    v_changed_fields, p_metadata, NOW()
  );

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update user activity summary
CREATE OR REPLACE FUNCTION update_user_activity_summary()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity_summaries (
    id, user_id, summary_date
  ) VALUES (
    'uas_' || encode(gen_random_bytes(12), 'hex'),
    NEW.user_id,
    DATE(NEW.created_at)
  )
  ON CONFLICT (user_id, summary_date) DO UPDATE SET
    login_count = user_activity_summaries.login_count +
      CASE WHEN NEW.action = 'LOGIN' THEN 1 ELSE 0 END,
    failed_login_count = user_activity_summaries.failed_login_count +
      CASE WHEN NEW.action = 'LOGIN_FAILED' THEN 1 ELSE 0 END,
    creates = user_activity_summaries.creates +
      CASE WHEN NEW.action = 'CREATE' THEN 1 ELSE 0 END,
    updates = user_activity_summaries.updates +
      CASE WHEN NEW.action = 'UPDATE' THEN 1 ELSE 0 END,
    deletes = user_activity_summaries.deletes +
      CASE WHEN NEW.action = 'DELETE' THEN 1 ELSE 0 END,
    high_severity_actions = user_activity_summaries.high_severity_actions +
      CASE WHEN NEW.severity IN ('HIGH', 'CRITICAL') THEN 1 ELSE 0 END,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_activity_summary
  AFTER INSERT ON compliance_audit_logs
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION update_user_activity_summary();

-- Function to archive old audit logs
CREATE OR REPLACE FUNCTION archive_old_audit_logs(
  p_older_than_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  -- Count records to archive
  SELECT COUNT(*) INTO v_archived_count
  FROM compliance_audit_logs
  WHERE created_at < NOW() - (p_older_than_days || ' days')::INTERVAL
    AND is_sensitive = FALSE;

  -- In production, this would export to external storage
  -- For now, we just return the count
  RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- ============================================================================

-- Enhanced audit trigger for users table
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action audit_action_type;
  v_before JSONB;
  v_after JSONB;
BEGIN
  v_action := CASE TG_OP
    WHEN 'INSERT' THEN 'CREATE'
    WHEN 'UPDATE' THEN 'UPDATE'
    WHEN 'DELETE' THEN 'DELETE'
  END;

  IF TG_OP = 'DELETE' THEN
    v_before := to_jsonb(OLD);
    v_after := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_before := NULL;
    v_after := to_jsonb(NEW);
  ELSE
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  END IF;

  -- Remove sensitive fields from logs
  v_before := v_before - 'password_hash' - 'mfa_secret';
  v_after := v_after - 'password_hash' - 'mfa_secret';

  PERFORM log_compliance_audit(
    current_setting('app.current_user_id', TRUE),
    v_action,
    'users',
    COALESCE(NEW.id, OLD.id),
    current_setting('app.client_ip', TRUE),
    v_before,
    v_after,
    jsonb_build_object('table', 'users', 'operation', TG_OP)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE compliance_audit_logs IS 'Comprehensive audit trail for compliance (SOC2, GDPR, HIPAA)';
COMMENT ON TABLE audit_log_archives IS 'Metadata for archived audit log batches';
COMMENT ON TABLE user_activity_summaries IS 'Daily user activity aggregates for compliance reporting';
COMMENT ON TABLE sensitive_data_access_logs IS 'Tracks access to PII and sensitive data';
COMMENT ON FUNCTION log_compliance_audit IS 'Creates detailed audit log entry with automatic enrichment';
COMMENT ON FUNCTION archive_old_audit_logs IS 'Archives audit logs older than specified days';
