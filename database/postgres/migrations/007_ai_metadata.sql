-- NEXUS Platform - AI Metadata Migration
-- AI model versions, prediction logs, and performance metrics
-- Generated: 2025-12-23

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE ai_model_type AS ENUM (
  'CONTENT_MODERATION',
  'SENTIMENT_ANALYSIS',
  'CREATOR_MATCHING',
  'CONTENT_RECOMMENDATION',
  'FRAUD_DETECTION',
  'QUALITY_SCORING',
  'TREND_PREDICTION',
  'PRICE_OPTIMIZATION',
  'IMAGE_RECOGNITION',
  'VIDEO_ANALYSIS',
  'NLP',
  'CUSTOM'
);

CREATE TYPE ai_model_status AS ENUM (
  'DEVELOPMENT',
  'TESTING',
  'STAGING',
  'PRODUCTION',
  'DEPRECATED',
  'RETIRED'
);

CREATE TYPE ai_prediction_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'TIMEOUT'
);

CREATE TYPE ai_feedback_type AS ENUM (
  'CORRECT',
  'INCORRECT',
  'PARTIALLY_CORRECT',
  'UNSURE',
  'APPEALED'
);

CREATE TYPE ai_model_provider AS ENUM (
  'OPENAI',
  'ANTHROPIC',
  'GOOGLE',
  'AWS',
  'AZURE',
  'HUGGINGFACE',
  'CUSTOM',
  'INTERNAL'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- AI Model registry
CREATE TABLE ai_models (
  id VARCHAR(30) PRIMARY KEY,

  -- Identification
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,

  -- Model type and provider
  model_type ai_model_type NOT NULL,
  provider ai_model_provider NOT NULL,
  provider_model_id VARCHAR(255),

  -- Status
  status ai_model_status NOT NULL DEFAULT 'DEVELOPMENT',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,

  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',
  hyperparameters JSONB DEFAULT '{}',
  input_schema JSONB,
  output_schema JSONB,

  -- Endpoints
  endpoint_url TEXT,
  api_key_secret_name VARCHAR(255),

  -- Performance thresholds
  min_confidence_threshold DECIMAL(5,4) DEFAULT 0.5,
  max_latency_ms INTEGER DEFAULT 5000,

  -- Cost tracking
  cost_per_prediction DECIMAL(10,6) DEFAULT 0,
  monthly_budget DECIMAL(10,2),

  -- Training info
  training_dataset_id VARCHAR(30),
  training_started_at TIMESTAMP,
  training_completed_at TIMESTAMP,
  training_metrics JSONB,

  -- Metadata
  tags TEXT[],
  metadata JSONB,

  -- Audit
  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deprecated_at TIMESTAMP,

  UNIQUE(slug, version)
);

-- Model version history
CREATE TABLE ai_model_versions (
  id VARCHAR(30) PRIMARY KEY,
  model_id VARCHAR(30) NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,

  version VARCHAR(50) NOT NULL,
  release_notes TEXT,

  -- Comparison metrics
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  auc_roc DECIMAL(5,4),

  -- Custom metrics
  custom_metrics JSONB,

  -- A/B test results
  ab_test_id VARCHAR(30),
  ab_test_results JSONB,

  -- Status
  is_promoted BOOLEAN NOT NULL DEFAULT FALSE,
  promoted_at TIMESTAMP,
  promoted_by VARCHAR(30),

  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(model_id, version)
);

-- AI Prediction logs
CREATE TABLE ai_predictions (
  id VARCHAR(30) PRIMARY KEY,

  -- Model reference
  model_id VARCHAR(30) NOT NULL REFERENCES ai_models(id) ON DELETE SET NULL,
  model_version VARCHAR(50) NOT NULL,

  -- Request context
  request_id VARCHAR(100),
  user_id VARCHAR(30),
  organization_id VARCHAR(30),

  -- Input/Output
  input_data JSONB NOT NULL,
  input_hash VARCHAR(64),
  output_data JSONB,

  -- Prediction details
  prediction_type VARCHAR(100),
  prediction_result JSONB,
  confidence_score DECIMAL(5,4),
  confidence_breakdown JSONB,

  -- Alternative predictions
  alternatives JSONB,

  -- Status
  status ai_prediction_status NOT NULL DEFAULT 'PENDING',

  -- Performance
  latency_ms INTEGER,
  tokens_used INTEGER,

  -- Cost
  cost DECIMAL(10,6),

  -- Error handling
  error_code VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Resource references
  resource_type VARCHAR(50),
  resource_id VARCHAR(30),

  -- Metadata
  metadata JSONB,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Human feedback on predictions
CREATE TABLE ai_prediction_feedback (
  id VARCHAR(30) PRIMARY KEY,
  prediction_id VARCHAR(30) NOT NULL REFERENCES ai_predictions(id) ON DELETE CASCADE,

  -- Feedback
  feedback_type ai_feedback_type NOT NULL,
  correct_output JSONB,
  feedback_notes TEXT,

  -- Source
  provided_by VARCHAR(30) NOT NULL,
  provided_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Used for retraining
  used_for_training BOOLEAN NOT NULL DEFAULT FALSE,
  training_batch_id VARCHAR(30)
);

-- Model performance metrics (time-series)
CREATE TABLE ai_model_metrics (
  id VARCHAR(30) PRIMARY KEY,
  model_id VARCHAR(30) NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,

  -- Time bucket
  recorded_at TIMESTAMP NOT NULL,
  bucket_size VARCHAR(20) NOT NULL DEFAULT 'hour',

  -- Volume metrics
  total_predictions INTEGER NOT NULL DEFAULT 0,
  successful_predictions INTEGER NOT NULL DEFAULT 0,
  failed_predictions INTEGER NOT NULL DEFAULT 0,

  -- Performance metrics
  avg_latency_ms DECIMAL(10,2),
  p50_latency_ms DECIMAL(10,2),
  p95_latency_ms DECIMAL(10,2),
  p99_latency_ms DECIMAL(10,2),

  -- Accuracy metrics
  avg_confidence DECIMAL(5,4),
  feedback_correct INTEGER DEFAULT 0,
  feedback_incorrect INTEGER DEFAULT 0,

  -- Cost metrics
  total_cost DECIMAL(10,4) DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Resource utilization
  cpu_usage_avg DECIMAL(5,2),
  memory_usage_avg DECIMAL(5,2),
  gpu_usage_avg DECIMAL(5,2),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(model_id, recorded_at, bucket_size)
);

-- A/B test configurations for models
CREATE TABLE ai_model_experiments (
  id VARCHAR(30) PRIMARY KEY,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Models being compared
  control_model_id VARCHAR(30) NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
  treatment_model_id VARCHAR(30) NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,

  -- Traffic split
  control_traffic_percentage INTEGER NOT NULL DEFAULT 50 CHECK (control_traffic_percentage >= 0 AND control_traffic_percentage <= 100),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,

  -- Results
  winner_model_id VARCHAR(30),
  results JSONB,
  statistical_significance DECIMAL(5,4),

  -- Configuration
  success_metric VARCHAR(100) NOT NULL,
  min_sample_size INTEGER DEFAULT 1000,

  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Content moderation results
CREATE TABLE ai_content_moderation_results (
  id VARCHAR(30) PRIMARY KEY,
  prediction_id VARCHAR(30) NOT NULL REFERENCES ai_predictions(id) ON DELETE CASCADE,

  -- Content reference
  content_id VARCHAR(30) NOT NULL,
  content_type content_type NOT NULL,

  -- Moderation results
  is_safe BOOLEAN NOT NULL,
  is_auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
  requires_review BOOLEAN NOT NULL DEFAULT FALSE,

  -- Category scores
  adult_score DECIMAL(5,4) DEFAULT 0,
  violence_score DECIMAL(5,4) DEFAULT 0,
  hate_speech_score DECIMAL(5,4) DEFAULT 0,
  harassment_score DECIMAL(5,4) DEFAULT 0,
  self_harm_score DECIMAL(5,4) DEFAULT 0,
  sexual_score DECIMAL(5,4) DEFAULT 0,
  dangerous_score DECIMAL(5,4) DEFAULT 0,

  -- Detected issues
  detected_categories TEXT[],
  detected_labels JSONB,

  -- Review
  reviewed_by VARCHAR(30),
  reviewed_at TIMESTAMP,
  review_decision moderation_status,
  review_notes TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Creator matching scores
CREATE TABLE ai_creator_match_scores (
  id VARCHAR(30) PRIMARY KEY,
  prediction_id VARCHAR(30) NOT NULL REFERENCES ai_predictions(id) ON DELETE CASCADE,

  -- Match context
  campaign_id VARCHAR(30) NOT NULL,
  creator_id VARCHAR(30) NOT NULL,

  -- Overall score
  match_score DECIMAL(5,4) NOT NULL,
  rank INTEGER,

  -- Component scores
  niche_score DECIMAL(5,4),
  audience_score DECIMAL(5,4),
  engagement_score DECIMAL(5,4),
  quality_score DECIMAL(5,4),
  reliability_score DECIMAL(5,4),
  value_score DECIMAL(5,4),

  -- Breakdown
  score_breakdown JSONB,

  -- Recommendations
  recommendation_notes TEXT,
  suggested_rate DECIMAL(10,2),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(prediction_id, campaign_id, creator_id)
);

-- Training datasets
CREATE TABLE ai_training_datasets (
  id VARCHAR(30) PRIMARY KEY,

  name VARCHAR(255) NOT NULL,
  description TEXT,
  model_type ai_model_type NOT NULL,

  -- Dataset info
  record_count INTEGER NOT NULL DEFAULT 0,
  feature_count INTEGER,
  label_count INTEGER,

  -- Storage
  storage_path TEXT NOT NULL,
  storage_format VARCHAR(50) NOT NULL,
  size_bytes BIGINT,

  -- Versioning
  version VARCHAR(50) NOT NULL,
  parent_dataset_id VARCHAR(30),

  -- Quality metrics
  quality_score DECIMAL(5,4),
  label_accuracy DECIMAL(5,4),

  -- Splits
  train_percentage INTEGER DEFAULT 70,
  validation_percentage INTEGER DEFAULT 15,
  test_percentage INTEGER DEFAULT 15,

  -- Metadata
  schema_definition JSONB,
  statistics JSONB,

  created_by VARCHAR(30) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- AI Models
CREATE INDEX idx_ai_models_slug ON ai_models(slug);
CREATE INDEX idx_ai_models_type ON ai_models(model_type);
CREATE INDEX idx_ai_models_status ON ai_models(status);
CREATE INDEX idx_ai_models_active ON ai_models(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ai_models_primary ON ai_models(model_type, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_ai_models_provider ON ai_models(provider);
CREATE INDEX idx_ai_models_tags ON ai_models USING GIN(tags);

-- Model versions
CREATE INDEX idx_ai_model_versions_model ON ai_model_versions(model_id);
CREATE INDEX idx_ai_model_versions_promoted ON ai_model_versions(model_id, is_promoted) WHERE is_promoted = TRUE;

-- Predictions
CREATE INDEX idx_ai_predictions_model ON ai_predictions(model_id);
CREATE INDEX idx_ai_predictions_status ON ai_predictions(status);
CREATE INDEX idx_ai_predictions_user ON ai_predictions(user_id);
CREATE INDEX idx_ai_predictions_org ON ai_predictions(organization_id);
CREATE INDEX idx_ai_predictions_created ON ai_predictions(created_at);
CREATE INDEX idx_ai_predictions_resource ON ai_predictions(resource_type, resource_id);
CREATE INDEX idx_ai_predictions_request ON ai_predictions(request_id);
CREATE INDEX idx_ai_predictions_input_hash ON ai_predictions(input_hash);

-- Time-range queries for predictions
CREATE INDEX idx_ai_predictions_model_date ON ai_predictions(model_id, created_at);

-- Feedback
CREATE INDEX idx_ai_prediction_feedback_prediction ON ai_prediction_feedback(prediction_id);
CREATE INDEX idx_ai_prediction_feedback_type ON ai_prediction_feedback(feedback_type);
CREATE INDEX idx_ai_prediction_feedback_training ON ai_prediction_feedback(used_for_training) WHERE used_for_training = FALSE;

-- Metrics
CREATE INDEX idx_ai_model_metrics_model ON ai_model_metrics(model_id);
CREATE INDEX idx_ai_model_metrics_time ON ai_model_metrics(recorded_at);
CREATE INDEX idx_ai_model_metrics_model_time ON ai_model_metrics(model_id, recorded_at);

-- Experiments
CREATE INDEX idx_ai_model_experiments_active ON ai_model_experiments(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_ai_model_experiments_control ON ai_model_experiments(control_model_id);
CREATE INDEX idx_ai_model_experiments_treatment ON ai_model_experiments(treatment_model_id);

-- Content moderation
CREATE INDEX idx_ai_content_moderation_content ON ai_content_moderation_results(content_id);
CREATE INDEX idx_ai_content_moderation_review ON ai_content_moderation_results(requires_review) WHERE requires_review = TRUE;
CREATE INDEX idx_ai_content_moderation_created ON ai_content_moderation_results(created_at);

-- Creator matching
CREATE INDEX idx_ai_creator_match_campaign ON ai_creator_match_scores(campaign_id);
CREATE INDEX idx_ai_creator_match_creator ON ai_creator_match_scores(creator_id);
CREATE INDEX idx_ai_creator_match_score ON ai_creator_match_scores(campaign_id, match_score DESC);

-- Training datasets
CREATE INDEX idx_ai_training_datasets_type ON ai_training_datasets(model_type);
CREATE INDEX idx_ai_training_datasets_version ON ai_training_datasets(version);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get primary model for a type
CREATE OR REPLACE FUNCTION get_primary_model(
  p_model_type ai_model_type
)
RETURNS ai_models AS $$
DECLARE
  v_model ai_models%ROWTYPE;
BEGIN
  SELECT * INTO v_model
  FROM ai_models
  WHERE model_type = p_model_type
    AND is_primary = TRUE
    AND is_active = TRUE
    AND status = 'PRODUCTION';

  RETURN v_model;
END;
$$ LANGUAGE plpgsql;

-- Record prediction and return ID
CREATE OR REPLACE FUNCTION record_ai_prediction(
  p_model_id VARCHAR(30),
  p_input_data JSONB,
  p_user_id VARCHAR(30) DEFAULT NULL,
  p_organization_id VARCHAR(30) DEFAULT NULL,
  p_resource_type VARCHAR(50) DEFAULT NULL,
  p_resource_id VARCHAR(30) DEFAULT NULL
)
RETURNS VARCHAR(30) AS $$
DECLARE
  v_prediction_id VARCHAR(30);
  v_model_version VARCHAR(50);
BEGIN
  -- Get model version
  SELECT version INTO v_model_version FROM ai_models WHERE id = p_model_id;

  -- Generate prediction ID
  v_prediction_id := 'prd_' || encode(gen_random_bytes(12), 'hex');

  -- Insert prediction record
  INSERT INTO ai_predictions (
    id, model_id, model_version, input_data, input_hash,
    user_id, organization_id, resource_type, resource_id,
    status, created_at
  ) VALUES (
    v_prediction_id, p_model_id, v_model_version, p_input_data,
    encode(sha256(p_input_data::text::bytea), 'hex'),
    p_user_id, p_organization_id, p_resource_type, p_resource_id,
    'PROCESSING', NOW()
  );

  RETURN v_prediction_id;
END;
$$ LANGUAGE plpgsql;

-- Complete prediction with results
CREATE OR REPLACE FUNCTION complete_ai_prediction(
  p_prediction_id VARCHAR(30),
  p_output_data JSONB,
  p_prediction_result JSONB,
  p_confidence_score DECIMAL(5,4),
  p_latency_ms INTEGER,
  p_tokens_used INTEGER DEFAULT NULL,
  p_cost DECIMAL(10,6) DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE ai_predictions
  SET
    output_data = p_output_data,
    prediction_result = p_prediction_result,
    confidence_score = p_confidence_score,
    latency_ms = p_latency_ms,
    tokens_used = p_tokens_used,
    cost = p_cost,
    status = 'COMPLETED',
    completed_at = NOW()
  WHERE id = p_prediction_id;
END;
$$ LANGUAGE plpgsql;

-- Aggregate model metrics
CREATE OR REPLACE FUNCTION aggregate_model_metrics(
  p_model_id VARCHAR(30),
  p_start_time TIMESTAMP,
  p_end_time TIMESTAMP,
  p_bucket_size VARCHAR(20) DEFAULT 'hour'
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_model_metrics (
    id, model_id, recorded_at, bucket_size,
    total_predictions, successful_predictions, failed_predictions,
    avg_latency_ms, p50_latency_ms, p95_latency_ms, p99_latency_ms,
    avg_confidence, total_cost, total_tokens
  )
  SELECT
    'amm_' || encode(gen_random_bytes(12), 'hex'),
    p_model_id,
    date_trunc(p_bucket_size, created_at),
    p_bucket_size,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'COMPLETED'),
    COUNT(*) FILTER (WHERE status = 'FAILED'),
    AVG(latency_ms),
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms),
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms),
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms),
    AVG(confidence_score),
    SUM(COALESCE(cost, 0)),
    SUM(COALESCE(tokens_used, 0))
  FROM ai_predictions
  WHERE model_id = p_model_id
    AND created_at >= p_start_time
    AND created_at < p_end_time
  GROUP BY date_trunc(p_bucket_size, created_at)
  ON CONFLICT (model_id, recorded_at, bucket_size) DO UPDATE SET
    total_predictions = EXCLUDED.total_predictions,
    successful_predictions = EXCLUDED.successful_predictions,
    failed_predictions = EXCLUDED.failed_predictions,
    avg_latency_ms = EXCLUDED.avg_latency_ms,
    p50_latency_ms = EXCLUDED.p50_latency_ms,
    p95_latency_ms = EXCLUDED.p95_latency_ms,
    p99_latency_ms = EXCLUDED.p99_latency_ms,
    avg_confidence = EXCLUDED.avg_confidence,
    total_cost = EXCLUDED.total_cost,
    total_tokens = EXCLUDED.total_tokens;
END;
$$ LANGUAGE plpgsql;

-- Calculate model accuracy from feedback
CREATE OR REPLACE FUNCTION calculate_model_accuracy(
  p_model_id VARCHAR(30),
  p_days INTEGER DEFAULT 30
)
RETURNS DECIMAL(5,4) AS $$
DECLARE
  v_total INTEGER;
  v_correct INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE f.feedback_type = 'CORRECT')
  INTO v_total, v_correct
  FROM ai_predictions p
  JOIN ai_prediction_feedback f ON p.id = f.prediction_id
  WHERE p.model_id = p_model_id
    AND p.created_at >= NOW() - (p_days || ' days')::INTERVAL;

  IF v_total = 0 THEN
    RETURN NULL;
  END IF;

  RETURN v_correct::DECIMAL / v_total::DECIMAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_model_experiments_updated_at
  BEFORE UPDATE ON ai_model_experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_training_datasets_updated_at
  BEFORE UPDATE ON ai_training_datasets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure only one primary model per type
CREATE OR REPLACE FUNCTION ensure_single_primary_model()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = TRUE THEN
    UPDATE ai_models
    SET is_primary = FALSE
    WHERE model_type = NEW.model_type
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_primary_model
  BEFORE INSERT OR UPDATE ON ai_models
  FOR EACH ROW
  WHEN (NEW.is_primary = TRUE)
  EXECUTE FUNCTION ensure_single_primary_model();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_models IS 'Registry of AI/ML models with versioning and configuration';
COMMENT ON TABLE ai_model_versions IS 'Version history and metrics for AI models';
COMMENT ON TABLE ai_predictions IS 'Log of all AI predictions with inputs and outputs';
COMMENT ON TABLE ai_prediction_feedback IS 'Human feedback for model improvement';
COMMENT ON TABLE ai_model_metrics IS 'Time-series performance metrics for models';
COMMENT ON TABLE ai_model_experiments IS 'A/B testing configuration for model comparison';
COMMENT ON TABLE ai_content_moderation_results IS 'Detailed content moderation analysis results';
COMMENT ON TABLE ai_creator_match_scores IS 'Creator-campaign matching scores and breakdown';
COMMENT ON TABLE ai_training_datasets IS 'Training dataset registry and metadata';
COMMENT ON FUNCTION get_primary_model IS 'Returns the primary production model for a given type';
COMMENT ON FUNCTION record_ai_prediction IS 'Creates a new prediction record and returns its ID';
COMMENT ON FUNCTION complete_ai_prediction IS 'Updates prediction with results after model inference';
COMMENT ON FUNCTION aggregate_model_metrics IS 'Aggregates prediction data into time-bucketed metrics';
