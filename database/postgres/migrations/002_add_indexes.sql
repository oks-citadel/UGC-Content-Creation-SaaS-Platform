-- NEXUS Platform - Indexes Migration
-- Performance optimization indexes
-- Generated: 2025-12-18

-- ============================================================================
-- USER & AUTH INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

CREATE INDEX idx_verification_codes_user_id_type ON verification_codes(user_id, type);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);

CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- ORGANIZATION INDEXES
-- ============================================================================

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_type ON organizations(type);

CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);

CREATE INDEX idx_organization_invites_email ON organization_invites(email);
CREATE INDEX idx_organization_invites_token ON organization_invites(token);
CREATE INDEX idx_organization_invites_org_id ON organization_invites(organization_id);
CREATE INDEX idx_organization_invites_status ON organization_invites(status);

CREATE INDEX idx_api_keys_key ON api_keys(key);
CREATE INDEX idx_api_keys_org_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- ============================================================================
-- CREATOR INDEXES
-- ============================================================================

CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_creators_verified ON creators(verified);
CREATE INDEX idx_creators_status ON creators(status);
CREATE INDEX idx_creators_reputation_score ON creators(reputation_score);
CREATE INDEX idx_creators_niche ON creators USING GIN(niche);

CREATE INDEX idx_creator_portfolio_creator_id ON creator_portfolio(creator_id);
CREATE INDEX idx_creator_portfolio_featured ON creator_portfolio(featured);
CREATE INDEX idx_creator_portfolio_platform ON creator_portfolio(platform);

CREATE INDEX idx_creator_metrics_creator_id ON creator_metrics(creator_id);
CREATE INDEX idx_creator_metrics_platform ON creator_metrics(platform);
CREATE INDEX idx_creator_metrics_recorded_at ON creator_metrics(recorded_at);
CREATE INDEX idx_creator_metrics_creator_platform ON creator_metrics(creator_id, platform);

CREATE INDEX idx_creator_earnings_creator_id ON creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_status ON creator_earnings(status);
CREATE INDEX idx_creator_earnings_created_at ON creator_earnings(created_at);
CREATE INDEX idx_creator_earnings_source ON creator_earnings(source, source_id);

CREATE INDEX idx_creator_reviews_creator_id ON creator_reviews(creator_id);
CREATE INDEX idx_creator_reviews_rating ON creator_reviews(rating);
CREATE INDEX idx_creator_reviews_campaign_id ON creator_reviews(campaign_id);

CREATE INDEX idx_creator_verifications_creator_id ON creator_verifications(creator_id);
CREATE INDEX idx_creator_verifications_status ON creator_verifications(status);

-- ============================================================================
-- CAMPAIGN INDEXES
-- ============================================================================

CREATE INDEX idx_campaigns_org_id ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX idx_campaigns_start_date ON campaigns(start_date);
CREATE INDEX idx_campaigns_end_date ON campaigns(end_date);
CREATE INDEX idx_campaigns_tags ON campaigns USING GIN(tags);
CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);

CREATE INDEX idx_campaign_briefs_campaign_id ON campaign_briefs(campaign_id);

CREATE INDEX idx_deliverables_campaign_id ON deliverables(campaign_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);
CREATE INDEX idx_deliverables_type ON deliverables(type);
CREATE INDEX idx_deliverables_due_date ON deliverables(due_date);

CREATE INDEX idx_milestones_campaign_id ON milestones(campaign_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_milestones_due_date ON milestones(due_date);

CREATE INDEX idx_creator_applications_campaign_id ON creator_applications(campaign_id);
CREATE INDEX idx_creator_applications_creator_id ON creator_applications(creator_id);
CREATE INDEX idx_creator_applications_status ON creator_applications(status);
CREATE INDEX idx_creator_applications_created_at ON creator_applications(created_at);

-- ============================================================================
-- CONTENT INDEXES
-- ============================================================================

CREATE INDEX idx_content_creator_id ON content(creator_id);
CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_moderation_status ON content(moderation_status);
CREATE INDEX idx_content_created_at ON content(created_at);
CREATE INDEX idx_content_is_public ON content(is_public);

CREATE INDEX idx_campaign_content_campaign_id ON campaign_content(campaign_id);
CREATE INDEX idx_campaign_content_content_id ON campaign_content(content_id);
CREATE INDEX idx_campaign_content_deliverable_id ON campaign_content(deliverable_id);
CREATE INDEX idx_campaign_content_submitted_by ON campaign_content(submitted_by);

CREATE INDEX idx_content_tags_tag ON content_tags(tag);
CREATE INDEX idx_content_tags_content_id ON content_tags(content_id);

CREATE INDEX idx_content_rights_content_id ON content_rights(content_id);
CREATE INDEX idx_content_rights_granted_to ON content_rights(granted_to);
CREATE INDEX idx_content_rights_dates ON content_rights(start_date, end_date);

CREATE INDEX idx_content_versions_content_id ON content_versions(content_id);

-- ============================================================================
-- MARKETPLACE INDEXES
-- ============================================================================

CREATE INDEX idx_opportunities_campaign_id ON opportunities(campaign_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_published_at ON opportunities(published_at);
CREATE INDEX idx_opportunities_deadline ON opportunities(deadline);

CREATE INDEX idx_bids_opportunity_id ON bids(opportunity_id);
CREATE INDEX idx_bids_creator_id ON bids(creator_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_submitted_at ON bids(submitted_at);

CREATE INDEX idx_contracts_opportunity_id ON contracts(opportunity_id);
CREATE INDEX idx_contracts_creator_id ON contracts(creator_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_dates ON contracts(start_date, end_date);

CREATE INDEX idx_payout_methods_user_id ON payout_methods(user_id);
CREATE INDEX idx_payout_methods_is_default ON payout_methods(is_default);

CREATE INDEX idx_payouts_contract_id ON payouts(contract_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_scheduled_for ON payouts(scheduled_for);
CREATE INDEX idx_payouts_payout_method_id ON payouts(payout_method_id);

CREATE INDEX idx_disputes_contract_id ON disputes(contract_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);

CREATE INDEX idx_ambassador_programs_org_id ON ambassador_programs(organization_id);
CREATE INDEX idx_ambassador_programs_is_active ON ambassador_programs(is_active);

CREATE INDEX idx_ambassadors_program_id ON ambassadors(program_id);
CREATE INDEX idx_ambassadors_creator_id ON ambassadors(creator_id);
CREATE INDEX idx_ambassadors_status ON ambassadors(status);

-- ============================================================================
-- COMMERCE INDEXES
-- ============================================================================

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_created_at ON products(created_at);

CREATE INDEX idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX idx_product_tags_content_id ON product_tags(content_id);

CREATE INDEX idx_shoppable_galleries_slug ON shoppable_galleries(slug);
CREATE INDEX idx_shoppable_galleries_is_public ON shoppable_galleries(is_public);

CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_attribution_events_content_id ON attribution_events(content_id);
CREATE INDEX idx_attribution_events_creator_id ON attribution_events(creator_id);
CREATE INDEX idx_attribution_events_event_type ON attribution_events(event_type);
CREATE INDEX idx_attribution_events_created_at ON attribution_events(created_at);

-- ============================================================================
-- BILLING & SUBSCRIPTIONS INDEXES
-- ============================================================================

CREATE INDEX idx_plans_tier ON plans(tier);
CREATE INDEX idx_plans_is_active ON plans(is_active);
CREATE INDEX idx_plans_interval ON plans(interval);

CREATE INDEX idx_subscriptions_org_id ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

CREATE INDEX idx_invoices_org_id ON invoices(organization_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(number);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

CREATE INDEX idx_payment_methods_org_id ON payment_methods(organization_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default);

CREATE INDEX idx_usage_records_org_id ON usage_records(organization_id);
CREATE INDEX idx_usage_records_subscription_metric ON usage_records(subscription_id, metric);
CREATE INDEX idx_usage_records_timestamp ON usage_records(timestamp);

CREATE INDEX idx_entitlements_subscription_id ON entitlements(subscription_id);

-- ============================================================================
-- ANALYTICS INDEXES
-- ============================================================================

CREATE INDEX idx_metric_snapshots_entity ON metric_snapshots(entity_type, entity_id);
CREATE INDEX idx_metric_snapshots_metric ON metric_snapshots(metric);
CREATE INDEX idx_metric_snapshots_timestamp ON metric_snapshots(timestamp);
CREATE INDEX idx_metric_snapshots_entity_metric ON metric_snapshots(entity_type, entity_id, metric);

CREATE INDEX idx_dashboards_org_id ON dashboards(organization_id);
CREATE INDEX idx_dashboards_created_by ON dashboards(created_by);

CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_generated_by ON reports(generated_by);
CREATE INDEX idx_reports_created_at ON reports(created_at);

CREATE INDEX idx_alerts_is_active ON alerts(is_active);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_by ON alerts(created_by);

-- ============================================================================
-- NOTIFICATION INDEXES
-- ============================================================================

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ============================================================================
-- INTEGRATION INDEXES
-- ============================================================================

CREATE INDEX idx_integrations_org_id ON integrations(organization_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_integrations_type ON integrations(type);

CREATE INDEX idx_integration_credentials_integration_id ON integration_credentials(integration_id);

CREATE INDEX idx_webhooks_org_id ON webhooks(organization_id);
CREATE INDEX idx_webhooks_is_active ON webhooks(is_active);

CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

-- ============================================================================
-- COMPLIANCE INDEXES
-- ============================================================================

CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_type ON consent_records(type);
CREATE INDEX idx_consent_records_granted_at ON consent_records(granted_at);

CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);

CREATE INDEX idx_rights_ledger_content_id ON rights_ledger_entries(content_id);
CREATE INDEX idx_rights_ledger_event_type ON rights_ledger_entries(event_type);
CREATE INDEX idx_rights_ledger_created_at ON rights_ledger_entries(created_at);

-- ============================================================================
-- FULL TEXT SEARCH INDEXES
-- ============================================================================

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full text search on campaigns
CREATE INDEX idx_campaigns_name_trgm ON campaigns USING gin(name gin_trgm_ops);
CREATE INDEX idx_campaigns_description_trgm ON campaigns USING gin(description gin_trgm_ops);

-- Full text search on creators
CREATE INDEX idx_creators_bio_trgm ON creators USING gin(bio gin_trgm_ops);

-- Full text search on content
CREATE INDEX idx_content_title_trgm ON content USING gin(title gin_trgm_ops);
CREATE INDEX idx_content_description_trgm ON content USING gin(description gin_trgm_ops);

-- Full text search on opportunities
CREATE INDEX idx_opportunities_title_trgm ON opportunities USING gin(title gin_trgm_ops);
CREATE INDEX idx_opportunities_description_trgm ON opportunities USING gin(description gin_trgm_ops);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Campaign filtering
CREATE INDEX idx_campaigns_org_status_type ON campaigns(organization_id, status, type);

-- Creator search
CREATE INDEX idx_creators_status_verified ON creators(status, verified);

-- Content moderation queue
CREATE INDEX idx_content_moderation_created ON content(moderation_status, created_at);

-- Active subscriptions
CREATE INDEX idx_subscriptions_org_status ON subscriptions(organization_id, status);

-- Pending payouts
CREATE INDEX idx_payouts_status_scheduled ON payouts(status, scheduled_for);

-- Unread notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, created_at) WHERE read_at IS NULL;

-- Active sessions
CREATE INDEX idx_sessions_active ON sessions(user_id, expires_at) WHERE revoked_at IS NULL;

-- ============================================================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Only index active campaigns
CREATE INDEX idx_campaigns_active ON campaigns(organization_id, created_at)
  WHERE status IN ('PUBLISHED', 'ACTIVE');

-- Only index pending applications
CREATE INDEX idx_applications_pending ON creator_applications(campaign_id, created_at)
  WHERE status = 'PENDING';

-- Only index pending content moderation
CREATE INDEX idx_content_pending_moderation ON content(created_at)
  WHERE moderation_status = 'PENDING';

-- Only index active contracts
CREATE INDEX idx_contracts_active ON contracts(creator_id, start_date)
  WHERE status = 'ACTIVE';

-- Only index pending payouts
CREATE INDEX idx_payouts_pending ON payouts(scheduled_for)
  WHERE status IN ('PENDING', 'PROCESSING');

-- ============================================================================
-- STATISTICS & MAINTENANCE
-- ============================================================================

-- Analyze tables to update query planner statistics
ANALYZE users;
ANALYZE creators;
ANALYZE campaigns;
ANALYZE content;
ANALYZE subscriptions;

-- Comments on indexes
COMMENT ON INDEX idx_campaigns_org_status_type IS 'Optimizes campaign filtering by organization, status, and type';
COMMENT ON INDEX idx_content_moderation_created IS 'Speeds up moderation queue queries';
COMMENT ON INDEX idx_notifications_user_unread IS 'Efficiently retrieves unread notifications';
