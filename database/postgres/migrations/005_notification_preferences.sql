-- NEXUS Platform - Notification Preferences Migration
-- User notification preferences, email templates, and delivery logs
-- Generated: 2025-12-23

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE notification_frequency AS ENUM (
  'REALTIME',
  'HOURLY',
  'DAILY',
  'WEEKLY',
  'NEVER'
);

CREATE TYPE notification_priority AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

CREATE TYPE email_template_status AS ENUM (
  'DRAFT',
  'ACTIVE',
  'ARCHIVED'
);

CREATE TYPE delivery_status AS ENUM (
  'PENDING',
  'QUEUED',
  'SENDING',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
  'COMPLAINED',
  'UNSUBSCRIBED'
);

CREATE TYPE notification_category AS ENUM (
  'ACCOUNT',
  'SECURITY',
  'CAMPAIGNS',
  'CONTENT',
  'PAYMENTS',
  'MESSAGES',
  'MARKETING',
  'SYSTEM',
  'DIGEST'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Enhanced user notification preferences
CREATE TABLE user_notification_settings (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Global settings
  global_email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  global_sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  global_push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  global_in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Quiet hours
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone VARCHAR(50) DEFAULT 'UTC',

  -- Digest settings
  email_digest_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_digest_frequency notification_frequency NOT NULL DEFAULT 'DAILY',
  email_digest_time TIME DEFAULT '09:00:00',

  -- Marketing preferences
  marketing_emails_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  product_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  newsletter_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Language preferences
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Category-specific notification preferences
CREATE TABLE notification_category_preferences (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category notification_category NOT NULL,

  -- Channel preferences per category
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_frequency notification_frequency NOT NULL DEFAULT 'REALTIME',
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Priority threshold (only notify for this priority and above)
  min_priority notification_priority NOT NULL DEFAULT 'LOW',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, category)
);

-- Email templates
CREATE TABLE email_templates (
  id VARCHAR(30) PRIMARY KEY,

  -- Template identification
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category notification_category NOT NULL,

  -- Template content
  subject VARCHAR(500) NOT NULL,
  preview_text VARCHAR(255),
  html_body TEXT NOT NULL,
  text_body TEXT NOT NULL,

  -- Template variables
  variables JSONB NOT NULL DEFAULT '[]',
  default_values JSONB DEFAULT '{}',

  -- Styling
  header_image_url TEXT,
  footer_html TEXT,
  custom_css TEXT,

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  status email_template_status NOT NULL DEFAULT 'DRAFT',

  -- A/B testing
  is_ab_test BOOLEAN NOT NULL DEFAULT FALSE,
  ab_variant VARCHAR(10),
  ab_test_id VARCHAR(30),

  -- Ownership
  organization_id VARCHAR(30) REFERENCES organizations(id) ON DELETE CASCADE,
  created_by VARCHAR(30) NOT NULL,

  -- Localization
  locale VARCHAR(10) NOT NULL DEFAULT 'en',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email template versions for history
CREATE TABLE email_template_versions (
  id VARCHAR(30) PRIMARY KEY,
  template_id VARCHAR(30) NOT NULL REFERENCES email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,

  subject VARCHAR(500) NOT NULL,
  preview_text VARCHAR(255),
  html_body TEXT NOT NULL,
  text_body TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',

  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(template_id, version)
);

-- Notification delivery logs
CREATE TABLE notification_delivery_logs (
  id VARCHAR(30) PRIMARY KEY,

  -- Recipient
  user_id VARCHAR(30) REFERENCES users(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  recipient_device_token TEXT,

  -- Notification details
  notification_id VARCHAR(30) REFERENCES notifications(id) ON DELETE SET NULL,
  notification_type notification_type NOT NULL,
  category notification_category NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'NORMAL',

  -- Channel
  channel notification_channel NOT NULL,

  -- Template used
  template_id VARCHAR(30) REFERENCES email_templates(id) ON DELETE SET NULL,
  template_version INTEGER,

  -- Content
  subject VARCHAR(500),
  content_preview TEXT,
  content_hash VARCHAR(64),

  -- Delivery status
  status delivery_status NOT NULL DEFAULT 'PENDING',

  -- Provider details
  provider VARCHAR(50),
  provider_message_id VARCHAR(255),
  provider_response JSONB,

  -- Timing
  queued_at TIMESTAMP,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  failed_at TIMESTAMP,

  -- Error tracking
  error_code VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TIMESTAMP,

  -- Tracking
  open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  clicked_links JSONB DEFAULT '[]',

  -- Context
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Email unsubscribe records
CREATE TABLE email_unsubscribes (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,

  -- Unsubscribe scope
  category notification_category,
  unsubscribe_all BOOLEAN NOT NULL DEFAULT FALSE,

  -- Reason
  reason TEXT,
  feedback TEXT,

  -- Source
  delivery_log_id VARCHAR(30) REFERENCES notification_delivery_logs(id) ON DELETE SET NULL,
  unsubscribe_token VARCHAR(255),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(email, category)
);

-- Email bounces and complaints
CREATE TABLE email_deliverability_events (
  id VARCHAR(30) PRIMARY KEY,
  delivery_log_id VARCHAR(30) REFERENCES notification_delivery_logs(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,

  event_type VARCHAR(50) NOT NULL,
  bounce_type VARCHAR(50),
  bounce_subtype VARCHAR(50),

  complaint_type VARCHAR(50),
  complaint_feedback_type VARCHAR(50),

  diagnostic_code TEXT,

  provider VARCHAR(50),
  provider_event_id VARCHAR(255),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Push notification tokens
CREATE TABLE push_notification_tokens (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Token details
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL,
  device_id VARCHAR(255),
  device_name VARCHAR(255),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMP,

  -- App details
  app_version VARCHAR(20),
  os_version VARCHAR(20),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, token)
);

-- Scheduled notifications
CREATE TABLE scheduled_notifications (
  id VARCHAR(30) PRIMARY KEY,

  -- Target
  user_id VARCHAR(30) REFERENCES users(id) ON DELETE CASCADE,
  organization_id VARCHAR(30) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Notification details
  notification_type notification_type NOT NULL,
  category notification_category NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'NORMAL',

  -- Channels to use
  channels notification_channel[] NOT NULL,

  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,

  -- Template
  template_id VARCHAR(30) REFERENCES email_templates(id) ON DELETE SET NULL,
  template_data JSONB,

  -- Scheduling
  scheduled_for TIMESTAMP NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',

  -- Status
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMP,
  cancelled_at TIMESTAMP,

  -- Recurrence
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule TEXT,
  recurrence_end_date TIMESTAMP,

  created_by VARCHAR(30),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- User notification settings
CREATE INDEX idx_user_notification_settings_user ON user_notification_settings(user_id);

-- Category preferences
CREATE INDEX idx_notification_category_prefs_user ON notification_category_preferences(user_id);
CREATE INDEX idx_notification_category_prefs_category ON notification_category_preferences(category);

-- Email templates
CREATE INDEX idx_email_templates_slug ON email_templates(slug);
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_templates_status ON email_templates(status);
CREATE INDEX idx_email_templates_org ON email_templates(organization_id);
CREATE INDEX idx_email_templates_locale ON email_templates(locale);

-- Template versions
CREATE INDEX idx_email_template_versions_template ON email_template_versions(template_id);

-- Delivery logs
CREATE INDEX idx_notification_delivery_logs_user ON notification_delivery_logs(user_id);
CREATE INDEX idx_notification_delivery_logs_notification ON notification_delivery_logs(notification_id);
CREATE INDEX idx_notification_delivery_logs_status ON notification_delivery_logs(status);
CREATE INDEX idx_notification_delivery_logs_channel ON notification_delivery_logs(channel);
CREATE INDEX idx_notification_delivery_logs_created ON notification_delivery_logs(created_at);
CREATE INDEX idx_notification_delivery_logs_provider_msg ON notification_delivery_logs(provider_message_id);

-- Pending deliveries for processing
CREATE INDEX idx_notification_delivery_logs_pending ON notification_delivery_logs(status, next_retry_at)
  WHERE status IN ('PENDING', 'QUEUED', 'FAILED');

-- Unsubscribes
CREATE INDEX idx_email_unsubscribes_email ON email_unsubscribes(email);
CREATE INDEX idx_email_unsubscribes_user ON email_unsubscribes(user_id);
CREATE INDEX idx_email_unsubscribes_category ON email_unsubscribes(category);

-- Deliverability events
CREATE INDEX idx_email_deliverability_email ON email_deliverability_events(email);
CREATE INDEX idx_email_deliverability_type ON email_deliverability_events(event_type);
CREATE INDEX idx_email_deliverability_created ON email_deliverability_events(created_at);

-- Push tokens
CREATE INDEX idx_push_tokens_user ON push_notification_tokens(user_id);
CREATE INDEX idx_push_tokens_platform ON push_notification_tokens(platform);
CREATE INDEX idx_push_tokens_active ON push_notification_tokens(user_id, is_active) WHERE is_active = TRUE;

-- Scheduled notifications
CREATE INDEX idx_scheduled_notifications_user ON scheduled_notifications(user_id);
CREATE INDEX idx_scheduled_notifications_scheduled ON scheduled_notifications(scheduled_for);
CREATE INDEX idx_scheduled_notifications_pending ON scheduled_notifications(scheduled_for)
  WHERE is_sent = FALSE AND cancelled_at IS NULL;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Check if user should receive notification
CREATE OR REPLACE FUNCTION should_send_notification(
  p_user_id VARCHAR(30),
  p_category notification_category,
  p_channel notification_channel,
  p_priority notification_priority DEFAULT 'NORMAL'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_global_settings user_notification_settings%ROWTYPE;
  v_category_prefs notification_category_preferences%ROWTYPE;
  v_is_quiet_hours BOOLEAN;
  v_current_time TIME;
BEGIN
  -- Get global settings
  SELECT * INTO v_global_settings
  FROM user_notification_settings
  WHERE user_id = p_user_id;

  -- If no settings, use defaults (send notification)
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- Check global channel settings
  IF p_channel = 'EMAIL' AND NOT v_global_settings.global_email_enabled THEN
    RETURN FALSE;
  END IF;
  IF p_channel = 'SMS' AND NOT v_global_settings.global_sms_enabled THEN
    RETURN FALSE;
  END IF;
  IF p_channel = 'PUSH' AND NOT v_global_settings.global_push_enabled THEN
    RETURN FALSE;
  END IF;
  IF p_channel = 'IN_APP' AND NOT v_global_settings.global_in_app_enabled THEN
    RETURN FALSE;
  END IF;

  -- Check quiet hours (except for urgent notifications)
  IF v_global_settings.quiet_hours_enabled AND p_priority != 'URGENT' THEN
    v_current_time := (NOW() AT TIME ZONE v_global_settings.quiet_hours_timezone)::TIME;

    IF v_global_settings.quiet_hours_start < v_global_settings.quiet_hours_end THEN
      v_is_quiet_hours := v_current_time >= v_global_settings.quiet_hours_start
                         AND v_current_time < v_global_settings.quiet_hours_end;
    ELSE
      v_is_quiet_hours := v_current_time >= v_global_settings.quiet_hours_start
                         OR v_current_time < v_global_settings.quiet_hours_end;
    END IF;

    IF v_is_quiet_hours THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Check category-specific preferences
  SELECT * INTO v_category_prefs
  FROM notification_category_preferences
  WHERE user_id = p_user_id AND category = p_category;

  IF FOUND THEN
    -- Check channel enabled for category
    IF p_channel = 'EMAIL' AND NOT v_category_prefs.email_enabled THEN
      RETURN FALSE;
    END IF;
    IF p_channel = 'SMS' AND NOT v_category_prefs.sms_enabled THEN
      RETURN FALSE;
    END IF;
    IF p_channel = 'PUSH' AND NOT v_category_prefs.push_enabled THEN
      RETURN FALSE;
    END IF;
    IF p_channel = 'IN_APP' AND NOT v_category_prefs.in_app_enabled THEN
      RETURN FALSE;
    END IF;

    -- Check priority threshold
    IF p_priority::text < v_category_prefs.min_priority::text THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Check if email is unsubscribed
CREATE OR REPLACE FUNCTION is_email_unsubscribed(
  p_email VARCHAR(255),
  p_category notification_category DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_unsubscribes
    WHERE email = p_email
      AND (unsubscribe_all = TRUE OR category = p_category OR p_category IS NULL)
  );
END;
$$ LANGUAGE plpgsql;

-- Process delivery webhook events
CREATE OR REPLACE FUNCTION process_delivery_event(
  p_provider_message_id VARCHAR(255),
  p_event_type VARCHAR(50),
  p_event_data JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE notification_delivery_logs
  SET
    status = CASE p_event_type
      WHEN 'delivered' THEN 'DELIVERED'
      WHEN 'bounced' THEN 'BOUNCED'
      WHEN 'complained' THEN 'COMPLAINED'
      WHEN 'opened' THEN status
      WHEN 'clicked' THEN status
      ELSE status
    END,
    delivered_at = CASE WHEN p_event_type = 'delivered' THEN NOW() ELSE delivered_at END,
    opened_at = CASE WHEN p_event_type = 'opened' AND opened_at IS NULL THEN NOW() ELSE opened_at END,
    clicked_at = CASE WHEN p_event_type = 'clicked' AND clicked_at IS NULL THEN NOW() ELSE clicked_at END,
    open_count = CASE WHEN p_event_type = 'opened' THEN open_count + 1 ELSE open_count END,
    click_count = CASE WHEN p_event_type = 'clicked' THEN click_count + 1 ELSE click_count END,
    failed_at = CASE WHEN p_event_type = 'bounced' THEN NOW() ELSE failed_at END,
    provider_response = COALESCE(provider_response, '{}') || p_event_data,
    updated_at = NOW()
  WHERE provider_message_id = p_provider_message_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER update_user_notification_settings_updated_at
  BEFORE UPDATE ON user_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_category_preferences_updated_at
  BEFORE UPDATE ON notification_category_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_delivery_logs_updated_at
  BEFORE UPDATE ON notification_delivery_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_notification_tokens_updated_at
  BEFORE UPDATE ON push_notification_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_notifications_updated_at
  BEFORE UPDATE ON scheduled_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create template version on update
CREATE OR REPLACE FUNCTION create_template_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.subject != NEW.subject OR OLD.html_body != NEW.html_body OR OLD.text_body != NEW.text_body THEN
    INSERT INTO email_template_versions (
      id, template_id, version, subject, preview_text, html_body, text_body, variables, created_by
    ) VALUES (
      'etv_' || encode(gen_random_bytes(12), 'hex'),
      NEW.id,
      NEW.version,
      OLD.subject,
      OLD.preview_text,
      OLD.html_body,
      OLD.text_body,
      OLD.variables,
      current_setting('app.current_user_id', TRUE)
    );

    NEW.version := NEW.version + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_template_version
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION create_template_version();

-- ============================================================================
-- DEFAULT TEMPLATES
-- ============================================================================

-- Insert default email templates
INSERT INTO email_templates (id, name, slug, description, category, subject, preview_text, html_body, text_body, variables, status, created_by, locale)
VALUES
  ('emt_welcome', 'Welcome Email', 'welcome', 'Sent when a user signs up', 'ACCOUNT',
   'Welcome to NEXUS, {{first_name}}!',
   'Get started with your creator journey',
   '<html><body><h1>Welcome, {{first_name}}!</h1><p>Thank you for joining NEXUS.</p></body></html>',
   'Welcome, {{first_name}}!\n\nThank you for joining NEXUS.',
   '["first_name", "email"]',
   'ACTIVE', 'system', 'en'),

  ('emt_password_reset', 'Password Reset', 'password-reset', 'Password reset request', 'SECURITY',
   'Reset your NEXUS password',
   'Click to reset your password',
   '<html><body><h1>Password Reset</h1><p>Click <a href="{{reset_link}}">here</a> to reset your password.</p></body></html>',
   'Password Reset\n\nClick the link to reset your password: {{reset_link}}',
   '["reset_link", "first_name"]',
   'ACTIVE', 'system', 'en'),

  ('emt_campaign_invite', 'Campaign Invitation', 'campaign-invite', 'Invitation to join a campaign', 'CAMPAIGNS',
   'You''re invited to join {{campaign_name}}',
   '{{brand_name}} wants you for their campaign',
   '<html><body><h1>Campaign Invitation</h1><p>{{brand_name}} has invited you to {{campaign_name}}.</p></body></html>',
   'Campaign Invitation\n\n{{brand_name}} has invited you to {{campaign_name}}.',
   '["campaign_name", "brand_name", "campaign_link"]',
   'ACTIVE', 'system', 'en');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_notification_settings IS 'Global notification preferences per user';
COMMENT ON TABLE notification_category_preferences IS 'Category-specific notification settings';
COMMENT ON TABLE email_templates IS 'Email templates with versioning and A/B testing support';
COMMENT ON TABLE notification_delivery_logs IS 'Comprehensive log of all notification deliveries';
COMMENT ON TABLE email_unsubscribes IS 'Email unsubscribe records for compliance';
COMMENT ON TABLE push_notification_tokens IS 'Device tokens for push notifications';
COMMENT ON TABLE scheduled_notifications IS 'Queue for scheduled and recurring notifications';
COMMENT ON FUNCTION should_send_notification IS 'Determines if a notification should be sent based on user preferences';
COMMENT ON FUNCTION is_email_unsubscribed IS 'Checks if an email is unsubscribed from a category';
