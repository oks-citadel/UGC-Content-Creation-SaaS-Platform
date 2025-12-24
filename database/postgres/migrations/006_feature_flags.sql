-- NEXUS Platform - Feature Flags Migration
-- Feature flag management with user/org overrides and rollout percentages
-- Generated: 2025-12-23

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE feature_flag_type AS ENUM (
  'BOOLEAN',
  'STRING',
  'NUMBER',
  'JSON',
  'PERCENTAGE'
);

CREATE TYPE feature_flag_status AS ENUM (
  'DISABLED',
  'ENABLED',
  'ROLLOUT',
  'TESTING',
  'DEPRECATED'
);

CREATE TYPE feature_environment AS ENUM (
  'DEVELOPMENT',
  'STAGING',
  'PRODUCTION'
);

CREATE TYPE override_type AS ENUM (
  'USER',
  'ORGANIZATION',
  'SEGMENT',
  'BETA_GROUP'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Feature flags definition
CREATE TABLE feature_flags (
  id VARCHAR(30) PRIMARY KEY,

  -- Identification
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Type and values
  flag_type feature_flag_type NOT NULL DEFAULT 'BOOLEAN',
  default_value JSONB NOT NULL DEFAULT 'false',

  -- Status per environment
  status feature_flag_status NOT NULL DEFAULT 'DISABLED',

  -- Rollout configuration
  rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  rollout_start_date TIMESTAMP,
  rollout_end_date TIMESTAMP,

  -- Targeting rules (JSON structure for complex rules)
  targeting_rules JSONB DEFAULT '[]',

  -- Categorization
  category VARCHAR(100),
  tags TEXT[],

  -- Ownership
  owner_id VARCHAR(30),
  team VARCHAR(100),

  -- Dependencies
  depends_on VARCHAR(100)[],
  conflicts_with VARCHAR(100)[],

  -- Metadata
  is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
  is_client_side BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,

  -- Audit
  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Environment-specific flag configurations
CREATE TABLE feature_flag_environments (
  id VARCHAR(30) PRIMARY KEY,
  flag_id VARCHAR(30) NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  environment feature_environment NOT NULL,

  -- Environment-specific status
  status feature_flag_status NOT NULL DEFAULT 'DISABLED',

  -- Environment-specific value
  value JSONB,

  -- Rollout
  rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(flag_id, environment)
);

-- User-level feature overrides
CREATE TABLE user_feature_overrides (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flag_id VARCHAR(30) NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,

  -- Override value
  value JSONB NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Reason for override
  reason TEXT,

  -- Expiration
  expires_at TIMESTAMP,

  -- Audit
  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, flag_id)
);

-- Organization-level feature overrides
CREATE TABLE organization_feature_overrides (
  id VARCHAR(30) PRIMARY KEY,
  organization_id VARCHAR(30) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flag_id VARCHAR(30) NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,

  -- Override value
  value JSONB NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Reason
  reason TEXT,

  -- Expiration
  expires_at TIMESTAMP,

  -- Audit
  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, flag_id)
);

-- User segments for feature targeting
CREATE TABLE feature_segments (
  id VARCHAR(30) PRIMARY KEY,

  -- Identification
  name VARCHAR(255) NOT NULL,
  key VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,

  -- Segment rules (JSON structure)
  rules JSONB NOT NULL DEFAULT '[]',

  -- Computed membership
  user_count INTEGER NOT NULL DEFAULT 0,
  last_computed_at TIMESTAMP,

  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Segment-level feature overrides
CREATE TABLE segment_feature_overrides (
  id VARCHAR(30) PRIMARY KEY,
  segment_id VARCHAR(30) NOT NULL REFERENCES feature_segments(id) ON DELETE CASCADE,
  flag_id VARCHAR(30) NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,

  -- Override value
  value JSONB NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Priority (higher = evaluated first)
  priority INTEGER NOT NULL DEFAULT 0,

  reason TEXT,
  expires_at TIMESTAMP,

  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(segment_id, flag_id)
);

-- Beta groups for controlled access
CREATE TABLE beta_groups (
  id VARCHAR(30) PRIMARY KEY,

  name VARCHAR(255) NOT NULL,
  key VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,

  -- Access limits
  max_members INTEGER,
  is_open BOOLEAN NOT NULL DEFAULT FALSE,

  -- Invite code
  invite_code VARCHAR(50) UNIQUE,

  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Beta group membership
CREATE TABLE beta_group_members (
  id VARCHAR(30) PRIMARY KEY,
  beta_group_id VARCHAR(30) NOT NULL REFERENCES beta_groups(id) ON DELETE CASCADE,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  invited_by VARCHAR(30),
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(beta_group_id, user_id)
);

-- Beta group feature overrides
CREATE TABLE beta_group_feature_overrides (
  id VARCHAR(30) PRIMARY KEY,
  beta_group_id VARCHAR(30) NOT NULL REFERENCES beta_groups(id) ON DELETE CASCADE,
  flag_id VARCHAR(30) NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,

  value JSONB NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  priority INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  expires_at TIMESTAMP,

  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(beta_group_id, flag_id)
);

-- Feature flag evaluation logs (for analytics)
CREATE TABLE feature_flag_evaluations (
  id VARCHAR(30) PRIMARY KEY,
  flag_id VARCHAR(30) NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  flag_key VARCHAR(100) NOT NULL,

  -- Context
  user_id VARCHAR(30),
  organization_id VARCHAR(30),
  environment feature_environment NOT NULL,

  -- Evaluation result
  value JSONB NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,

  -- How the value was determined
  evaluation_reason VARCHAR(50) NOT NULL,
  override_type override_type,
  override_id VARCHAR(30),

  -- Request context
  request_id VARCHAR(100),
  sdk_version VARCHAR(20),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Feature flag change history
CREATE TABLE feature_flag_history (
  id VARCHAR(30) PRIMARY KEY,
  flag_id VARCHAR(30) NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,

  -- What changed
  change_type VARCHAR(50) NOT NULL,
  old_value JSONB,
  new_value JSONB,

  -- Who and when
  changed_by VARCHAR(30) NOT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Context
  reason TEXT,
  metadata JSONB
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Feature flags
CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_status ON feature_flags(status);
CREATE INDEX idx_feature_flags_category ON feature_flags(category);
CREATE INDEX idx_feature_flags_tags ON feature_flags USING GIN(tags);
CREATE INDEX idx_feature_flags_owner ON feature_flags(owner_id);
CREATE INDEX idx_feature_flags_client_side ON feature_flags(is_client_side) WHERE is_client_side = TRUE;

-- Environment configs
CREATE INDEX idx_feature_flag_envs_flag ON feature_flag_environments(flag_id);
CREATE INDEX idx_feature_flag_envs_env ON feature_flag_environments(environment);

-- User overrides
CREATE INDEX idx_user_feature_overrides_user ON user_feature_overrides(user_id);
CREATE INDEX idx_user_feature_overrides_flag ON user_feature_overrides(flag_id);
CREATE INDEX idx_user_feature_overrides_active ON user_feature_overrides(user_id, is_enabled)
  WHERE is_enabled = TRUE AND (expires_at IS NULL OR expires_at > NOW());

-- Organization overrides
CREATE INDEX idx_org_feature_overrides_org ON organization_feature_overrides(organization_id);
CREATE INDEX idx_org_feature_overrides_flag ON organization_feature_overrides(flag_id);
CREATE INDEX idx_org_feature_overrides_active ON organization_feature_overrides(organization_id, is_enabled)
  WHERE is_enabled = TRUE AND (expires_at IS NULL OR expires_at > NOW());

-- Segments
CREATE INDEX idx_feature_segments_key ON feature_segments(key);

-- Segment overrides
CREATE INDEX idx_segment_feature_overrides_segment ON segment_feature_overrides(segment_id);
CREATE INDEX idx_segment_feature_overrides_flag ON segment_feature_overrides(flag_id);
CREATE INDEX idx_segment_feature_overrides_priority ON segment_feature_overrides(flag_id, priority DESC);

-- Beta groups
CREATE INDEX idx_beta_groups_key ON beta_groups(key);
CREATE INDEX idx_beta_groups_invite ON beta_groups(invite_code);

-- Beta group members
CREATE INDEX idx_beta_group_members_group ON beta_group_members(beta_group_id);
CREATE INDEX idx_beta_group_members_user ON beta_group_members(user_id);

-- Beta group overrides
CREATE INDEX idx_beta_group_overrides_group ON beta_group_feature_overrides(beta_group_id);
CREATE INDEX idx_beta_group_overrides_flag ON beta_group_feature_overrides(flag_id);

-- Evaluations (for analytics)
CREATE INDEX idx_feature_flag_evals_flag ON feature_flag_evaluations(flag_id);
CREATE INDEX idx_feature_flag_evals_user ON feature_flag_evaluations(user_id);
CREATE INDEX idx_feature_flag_evals_created ON feature_flag_evaluations(created_at);
CREATE INDEX idx_feature_flag_evals_flag_date ON feature_flag_evaluations(flag_id, created_at);

-- History
CREATE INDEX idx_feature_flag_history_flag ON feature_flag_history(flag_id);
CREATE INDEX idx_feature_flag_history_changed ON feature_flag_history(changed_at);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Evaluate feature flag for a user
CREATE OR REPLACE FUNCTION evaluate_feature_flag(
  p_flag_key VARCHAR(100),
  p_user_id VARCHAR(30) DEFAULT NULL,
  p_organization_id VARCHAR(30) DEFAULT NULL,
  p_environment feature_environment DEFAULT 'PRODUCTION'
)
RETURNS JSONB AS $$
DECLARE
  v_flag feature_flags%ROWTYPE;
  v_env_config feature_flag_environments%ROWTYPE;
  v_override_value JSONB;
  v_result JSONB;
  v_evaluation_reason VARCHAR(50);
  v_override_type override_type;
  v_rollout_hash INTEGER;
BEGIN
  -- Get flag definition
  SELECT * INTO v_flag FROM feature_flags WHERE key = p_flag_key;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('value', NULL, 'reason', 'FLAG_NOT_FOUND');
  END IF;

  -- Get environment-specific config
  SELECT * INTO v_env_config
  FROM feature_flag_environments
  WHERE flag_id = v_flag.id AND environment = p_environment;

  -- Check if flag is disabled at environment level
  IF FOUND AND v_env_config.status = 'DISABLED' THEN
    RETURN jsonb_build_object(
      'value', v_flag.default_value,
      'reason', 'ENVIRONMENT_DISABLED'
    );
  END IF;

  -- Check user-level override first (highest priority)
  IF p_user_id IS NOT NULL THEN
    SELECT value INTO v_override_value
    FROM user_feature_overrides
    WHERE user_id = p_user_id
      AND flag_id = v_flag.id
      AND is_enabled = TRUE
      AND (expires_at IS NULL OR expires_at > NOW());

    IF FOUND THEN
      RETURN jsonb_build_object(
        'value', v_override_value,
        'reason', 'USER_OVERRIDE'
      );
    END IF;

    -- Check beta group membership
    SELECT bgfo.value INTO v_override_value
    FROM beta_group_members bgm
    JOIN beta_group_feature_overrides bgfo ON bgm.beta_group_id = bgfo.beta_group_id
    WHERE bgm.user_id = p_user_id
      AND bgfo.flag_id = v_flag.id
      AND bgfo.is_enabled = TRUE
      AND (bgfo.expires_at IS NULL OR bgfo.expires_at > NOW())
    ORDER BY bgfo.priority DESC
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'value', v_override_value,
        'reason', 'BETA_GROUP_OVERRIDE'
      );
    END IF;
  END IF;

  -- Check organization-level override
  IF p_organization_id IS NOT NULL THEN
    SELECT value INTO v_override_value
    FROM organization_feature_overrides
    WHERE organization_id = p_organization_id
      AND flag_id = v_flag.id
      AND is_enabled = TRUE
      AND (expires_at IS NULL OR expires_at > NOW());

    IF FOUND THEN
      RETURN jsonb_build_object(
        'value', v_override_value,
        'reason', 'ORGANIZATION_OVERRIDE'
      );
    END IF;
  END IF;

  -- Get effective status and rollout percentage
  IF v_env_config IS NOT NULL THEN
    v_flag.status := v_env_config.status;
    v_flag.rollout_percentage := v_env_config.rollout_percentage;
    IF v_env_config.value IS NOT NULL THEN
      v_flag.default_value := v_env_config.value;
    END IF;
  END IF;

  -- Check status
  CASE v_flag.status
    WHEN 'DISABLED' THEN
      RETURN jsonb_build_object(
        'value', v_flag.default_value,
        'reason', 'FLAG_DISABLED'
      );
    WHEN 'ENABLED' THEN
      RETURN jsonb_build_object(
        'value', v_flag.default_value,
        'reason', 'FLAG_ENABLED'
      );
    WHEN 'ROLLOUT' THEN
      -- Calculate rollout inclusion based on user ID
      IF p_user_id IS NOT NULL THEN
        v_rollout_hash := abs(hashtext(p_user_id || v_flag.key)) % 100;
        IF v_rollout_hash < v_flag.rollout_percentage THEN
          RETURN jsonb_build_object(
            'value', COALESCE(v_env_config.value, v_flag.default_value),
            'reason', 'ROLLOUT_INCLUDED'
          );
        ELSE
          RETURN jsonb_build_object(
            'value', 'false'::jsonb,
            'reason', 'ROLLOUT_EXCLUDED'
          );
        END IF;
      ELSE
        -- No user ID, use default
        RETURN jsonb_build_object(
          'value', v_flag.default_value,
          'reason', 'ROLLOUT_NO_USER'
        );
      END IF;
    ELSE
      RETURN jsonb_build_object(
        'value', v_flag.default_value,
        'reason', 'DEFAULT'
      );
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Bulk evaluate multiple flags
CREATE OR REPLACE FUNCTION evaluate_feature_flags(
  p_flag_keys VARCHAR(100)[],
  p_user_id VARCHAR(30) DEFAULT NULL,
  p_organization_id VARCHAR(30) DEFAULT NULL,
  p_environment feature_environment DEFAULT 'PRODUCTION'
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}'::jsonb;
  v_flag_key VARCHAR(100);
  v_flag_result JSONB;
BEGIN
  FOREACH v_flag_key IN ARRAY p_flag_keys LOOP
    v_flag_result := evaluate_feature_flag(v_flag_key, p_user_id, p_organization_id, p_environment);
    v_result := v_result || jsonb_build_object(v_flag_key, v_flag_result);
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Get all client-side flags for a user
CREATE OR REPLACE FUNCTION get_client_flags(
  p_user_id VARCHAR(30) DEFAULT NULL,
  p_organization_id VARCHAR(30) DEFAULT NULL,
  p_environment feature_environment DEFAULT 'PRODUCTION'
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}'::jsonb;
  v_flag RECORD;
  v_flag_result JSONB;
BEGIN
  FOR v_flag IN
    SELECT key FROM feature_flags
    WHERE is_client_side = TRUE
    ORDER BY key
  LOOP
    v_flag_result := evaluate_feature_flag(v_flag.key, p_user_id, p_organization_id, p_environment);
    v_result := v_result || jsonb_build_object(v_flag.key, v_flag_result->'value');
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Record flag change history
CREATE OR REPLACE FUNCTION record_flag_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO feature_flag_history (
    id, flag_id, change_type, old_value, new_value, changed_by, reason
  ) VALUES (
    'ffh_' || encode(gen_random_bytes(12), 'hex'),
    NEW.id,
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    to_jsonb(NEW),
    current_setting('app.current_user_id', TRUE),
    current_setting('app.change_reason', TRUE)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flag_environments_updated_at
  BEFORE UPDATE ON feature_flag_environments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feature_overrides_updated_at
  BEFORE UPDATE ON user_feature_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_feature_overrides_updated_at
  BEFORE UPDATE ON organization_feature_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_segments_updated_at
  BEFORE UPDATE ON feature_segments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_segment_feature_overrides_updated_at
  BEFORE UPDATE ON segment_feature_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beta_groups_updated_at
  BEFORE UPDATE ON beta_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beta_group_feature_overrides_updated_at
  BEFORE UPDATE ON beta_group_feature_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Record history
CREATE TRIGGER trigger_record_flag_history
  AFTER INSERT OR UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION record_flag_history();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE feature_flags IS 'Feature flag definitions with rollout configuration';
COMMENT ON TABLE feature_flag_environments IS 'Environment-specific feature flag settings';
COMMENT ON TABLE user_feature_overrides IS 'Per-user feature flag overrides';
COMMENT ON TABLE organization_feature_overrides IS 'Per-organization feature flag overrides';
COMMENT ON TABLE feature_segments IS 'User segments for feature targeting';
COMMENT ON TABLE beta_groups IS 'Beta tester groups for early access features';
COMMENT ON TABLE feature_flag_evaluations IS 'Analytics log of flag evaluations';
COMMENT ON TABLE feature_flag_history IS 'Audit trail of flag changes';
COMMENT ON FUNCTION evaluate_feature_flag IS 'Evaluates a feature flag for a user with all override logic';
COMMENT ON FUNCTION get_client_flags IS 'Returns all client-side flags for SDK initialization';
