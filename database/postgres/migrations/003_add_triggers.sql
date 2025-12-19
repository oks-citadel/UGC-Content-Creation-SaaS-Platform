-- NEXUS Platform - Triggers Migration
-- Automated workflows and data integrity
-- Generated: 2025-12-18

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent updates to immutable fields
CREATE OR REPLACE FUNCTION prevent_id_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.id != NEW.id THEN
    RAISE EXCEPTION 'Cannot update ID field';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Creators
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Campaigns
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Campaign Briefs
CREATE TRIGGER update_campaign_briefs_updated_at
  BEFORE UPDATE ON campaign_briefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Deliverables
CREATE TRIGGER update_deliverables_updated_at
  BEFORE UPDATE ON deliverables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Milestones
CREATE TRIGGER update_milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Creator Applications
CREATE TRIGGER update_creator_applications_updated_at
  BEFORE UPDATE ON creator_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Content
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Creator Reviews
CREATE TRIGGER update_creator_reviews_updated_at
  BEFORE UPDATE ON creator_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Creator Verifications
CREATE TRIGGER update_creator_verifications_updated_at
  BEFORE UPDATE ON creator_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Opportunities
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Contracts
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Payouts
CREATE TRIGGER update_payouts_updated_at
  BEFORE UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Payout Methods
CREATE TRIGGER update_payout_methods_updated_at
  BEFORE UPDATE ON payout_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Disputes
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ambassador Programs
CREATE TRIGGER update_ambassador_programs_updated_at
  BEFORE UPDATE ON ambassador_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ambassadors
CREATE TRIGGER update_ambassadors_updated_at
  BEFORE UPDATE ON ambassadors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Shoppable Galleries
CREATE TRIGGER update_shoppable_galleries_updated_at
  BEFORE UPDATE ON shoppable_galleries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Orders
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Plans
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Payment Methods
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Entitlements
CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Dashboards
CREATE TRIGGER update_dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Alerts
CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Integrations
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Integration Credentials
CREATE TRIGGER update_integration_credentials_updated_at
  BEFORE UPDATE ON integration_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Webhooks
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- BUSINESS LOGIC TRIGGERS
-- ============================================================================

-- Update creator reputation score when review is added
CREATE OR REPLACE FUNCTION update_creator_reputation()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creators
  SET reputation_score = (
    SELECT COALESCE(AVG(rating), 0)
    FROM creator_reviews
    WHERE creator_id = NEW.creator_id
  ),
  updated_at = NOW()
  WHERE id = NEW.creator_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creator_reputation
  AFTER INSERT OR UPDATE ON creator_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_reputation();

-- Update creator total earnings
CREATE OR REPLACE FUNCTION update_creator_total_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PAID' THEN
    UPDATE creators
    SET total_earnings = total_earnings + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.creator_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creator_earnings
  AFTER UPDATE ON creator_earnings
  FOR EACH ROW
  WHEN (OLD.status != NEW.status AND NEW.status = 'PAID')
  EXECUTE FUNCTION update_creator_total_earnings();

-- Auto-verify creator when verification is approved
CREATE OR REPLACE FUNCTION auto_verify_creator()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
    UPDATE creators
    SET verified = TRUE,
        verified_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.creator_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_verify_creator
  AFTER UPDATE ON creator_verifications
  FOR EACH ROW
  EXECUTE FUNCTION auto_verify_creator();

-- Lock user account after failed login attempts
CREATE OR REPLACE FUNCTION check_failed_logins()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.failed_login_count >= 5 THEN
    NEW.locked_until = NOW() + INTERVAL '30 minutes';
    NEW.status = 'SUSPENDED';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_failed_logins
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.failed_login_count != OLD.failed_login_count)
  EXECUTE FUNCTION check_failed_logins();

-- Reset failed login count on successful login
CREATE OR REPLACE FUNCTION reset_failed_logins()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET failed_login_count = 0,
      locked_until = NULL,
      updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_failed_logins
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION reset_failed_logins();

-- Set organization status based on subscription
CREATE OR REPLACE FUNCTION sync_organization_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE organizations
  SET status = CASE
    WHEN NEW.status = 'ACTIVE' THEN 'ACTIVE'::organization_status
    WHEN NEW.status = 'TRIAL' THEN 'TRIAL'::organization_status
    WHEN NEW.status = 'CANCELLED' THEN 'CANCELLED'::organization_status
    WHEN NEW.status = 'PAST_DUE' THEN 'SUSPENDED'::organization_status
    ELSE status
  END,
  updated_at = NOW()
  WHERE id = NEW.organization_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_org_subscription_status
  AFTER UPDATE ON subscriptions
  FOR EACH ROW
  WHEN (OLD.status != NEW.status)
  EXECUTE FUNCTION sync_organization_subscription_status();

-- Create audit log for sensitive operations
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id VARCHAR(30);
BEGIN
  -- Get current user from session (placeholder - implement based on your auth system)
  current_user_id := current_setting('app.current_user_id', TRUE);

  INSERT INTO audit_logs (
    id,
    user_id,
    action,
    resource,
    resource_id,
    metadata,
    created_at
  ) VALUES (
    gen_random_uuid()::text,
    current_user_id,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    ),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit logging to sensitive tables
CREATE TRIGGER audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_organizations
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_api_keys
  AFTER INSERT OR UPDATE OR DELETE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_contracts
  AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_payouts
  AFTER INSERT OR UPDATE OR DELETE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION create_audit_log();

-- Update content view count
CREATE OR REPLACE FUNCTION increment_content_views()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'VIEW' AND NEW.content_id IS NOT NULL THEN
    UPDATE content
    SET view_count = view_count + 1,
        updated_at = NOW()
    WHERE id = NEW.content_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_content_views
  AFTER INSERT ON attribution_events
  FOR EACH ROW
  EXECUTE FUNCTION increment_content_views();

-- Ensure only one default payment method per organization
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE payment_methods
    SET is_default = FALSE
    WHERE organization_id = NEW.organization_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_default_payment_method
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- Ensure only one default payout method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payout_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE payout_methods
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_default_payout_method
  BEFORE INSERT OR UPDATE ON payout_methods
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_payout_method();

-- Update campaign content counts
CREATE OR REPLACE FUNCTION update_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder for campaign metric calculations
  -- Add specific metric calculations as needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_metrics
  AFTER INSERT OR UPDATE ON campaign_content
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_metrics();

-- Validate deliverable submission
CREATE OR REPLACE FUNCTION validate_deliverable_submission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'SUBMITTED' AND OLD.status != 'SUBMITTED' THEN
    NEW.submitted_at = NOW();
  END IF;

  IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
    NEW.approved_at = NOW();
  END IF;

  IF NEW.status = 'REJECTED' AND OLD.status != 'REJECTED' THEN
    NEW.rejected_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_deliverable_submission
  BEFORE UPDATE ON deliverables
  FOR EACH ROW
  EXECUTE FUNCTION validate_deliverable_submission();

-- Soft delete implementation
CREATE OR REPLACE FUNCTION soft_delete_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'DELETED' AND OLD.status != 'DELETED' THEN
    NEW.deleted_at = NOW();
    -- Anonymize personal data
    NEW.email = 'deleted_' || NEW.id || '@deleted.local';
    NEW.first_name = NULL;
    NEW.last_name = NULL;
    NEW.phone = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_soft_delete_user
  BEFORE UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.status = 'DELETED')
  EXECUTE FUNCTION soft_delete_user();

-- Update invoice status when paid
CREATE OR REPLACE FUNCTION update_invoice_paid_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'PAID' AND OLD.status != 'PAID' THEN
    NEW.paid_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_paid_status
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_paid_status();

-- Track webhook trigger timestamps
CREATE OR REPLACE FUNCTION update_webhook_last_triggered()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE webhooks
  SET last_triggered_at = NOW(),
      updated_at = NOW()
  WHERE id = NEW.webhook_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_webhook_last_triggered
  AFTER INSERT ON webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_webhook_last_triggered();

-- ============================================================================
-- DATA VALIDATION TRIGGERS
-- ============================================================================

-- Validate email format
CREATE OR REPLACE FUNCTION validate_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format: %', NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_user_email
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION validate_email();

-- Validate rating range
CREATE OR REPLACE FUNCTION validate_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_creator_review_rating
  BEFORE INSERT OR UPDATE ON creator_reviews
  FOR EACH ROW
  EXECUTE FUNCTION validate_rating();

-- Validate campaign dates
CREATE OR REPLACE FUNCTION validate_campaign_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
    IF NEW.end_date < NEW.start_date THEN
      RAISE EXCEPTION 'End date cannot be before start date';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_campaign_dates
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION validate_campaign_dates();

-- Validate contract dates
CREATE OR REPLACE FUNCTION validate_contract_dates()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'Contract end date cannot be before start date';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_contract_dates
  BEFORE INSERT OR UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION validate_contract_dates();

-- ============================================================================
-- CLEANUP TRIGGERS
-- ============================================================================

-- Clean expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Clean expired verification codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Clean expired password resets
CREATE OR REPLACE FUNCTION cleanup_expired_password_resets()
RETURNS void AS $$
BEGIN
  DELETE FROM password_resets
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp';
COMMENT ON FUNCTION update_creator_reputation() IS 'Calculates and updates creator reputation based on reviews';
COMMENT ON FUNCTION create_audit_log() IS 'Creates audit trail for sensitive operations';
COMMENT ON FUNCTION validate_email() IS 'Validates email format using regex';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Removes old expired sessions for cleanup';
