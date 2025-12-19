from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from enum import Enum


class Platform(str, Enum):
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    FACEBOOK = "facebook"
    PINTEREST = "pinterest"


class RecommendationCategory(str, Enum):
    """Categories of recommendations."""
    HOOK = "hook"
    CAPTION = "caption"
    HASHTAGS = "hashtags"
    AUDIO = "audio"
    TIMING = "timing"
    FORMAT = "format"
    VISUAL = "visual"
    CTA = "call_to_action"
    TRENDING = "trending"
    PACING = "pacing"


class RecommendationPriority(str, Enum):
    """Recommendation priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ImplementationDifficulty(str, Enum):
    """Implementation difficulty levels."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class ContentType(str, Enum):
    VIDEO = "video"
    IMAGE = "image"
    CAROUSEL = "carousel"


class PredictionRequest(BaseModel):
    content_url: str = Field(..., description="URL to the content to analyze")
    content_type: ContentType
    platform: Platform
    caption: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)
    target_audience: Optional[Dict[str, Any]] = None
    creator_metrics: Optional[Dict[str, float]] = None
    posting_time: Optional[str] = None


class EngagementPrediction(BaseModel):
    predicted_views: int
    predicted_likes: int
    predicted_comments: int
    predicted_shares: int
    engagement_rate: float = Field(..., ge=0.0, le=1.0)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    reasoning: str


class ViralityScore(BaseModel):
    viral_probability: float = Field(..., ge=0.0, le=1.0)
    viral_factors: Dict[str, float]
    predicted_reach: int
    peak_time_estimate: str
    confidence_score: float


class OptimizationSuggestion(BaseModel):
    category: str
    priority: str  # high, medium, low
    suggestion: str
    expected_impact: float
    implementation_difficulty: str  # easy, medium, hard


class ContentAnalysis(BaseModel):
    visual_quality_score: float
    content_relevance_score: float
    emotional_impact_score: float
    trending_alignment_score: float
    hook_strength: float
    pacing_score: float
    call_to_action_present: bool


class PredictionResponse(BaseModel):
    content_id: str
    platform: Platform
    engagement_prediction: EngagementPrediction
    virality_score: ViralityScore
    content_analysis: ContentAnalysis
    overall_score: float = Field(..., ge=0.0, le=100.0)
    analyzed_at: str


class OptimizationResponse(BaseModel):
    content_id: str
    current_score: float
    optimized_score_potential: float
    suggestions: List[OptimizationSuggestion]
    priority_actions: List[str]


class ComparisonRequest(BaseModel):
    variant_a: PredictionRequest
    variant_b: PredictionRequest
    comparison_metrics: List[str] = Field(
        default_factory=lambda: ["engagement", "virality", "quality"]
    )


class VariantComparison(BaseModel):
    variant_a_score: float
    variant_b_score: float
    winner: str  # "variant_a", "variant_b", or "tie"
    confidence: float
    key_differences: List[str]
    recommendation: str


class ComparisonResponse(BaseModel):
    comparison_id: str
    comparison: VariantComparison
    detailed_metrics: Dict[str, Any]
    analyzed_at: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    models_loaded: Dict[str, bool]


# =====================================================
# Detailed Recommendation Models (Advanced Predictor)
# =====================================================


class ActionStep(BaseModel):
    """A single actionable step within a recommendation."""
    step_number: int = Field(..., ge=1, description="Step order number")
    action: str = Field(..., description="Brief action title")
    details: str = Field(..., description="Detailed instructions")
    time_estimate: str = Field(..., description="Estimated time to complete (e.g., '5 minutes')")


class RecommendationTemplate(BaseModel):
    """A template or example for implementing a recommendation."""
    name: str = Field(..., description="Template name")
    example: str = Field(..., description="Example content or format")
    platform_notes: Optional[str] = Field(None, description="Platform-specific notes")


class DetailedRecommendation(BaseModel):
    """A detailed, actionable recommendation with implementation steps."""
    id: str = Field(..., description="Unique recommendation ID")
    category: RecommendationCategory
    priority: RecommendationPriority
    title: str = Field(..., description="Recommendation title")
    description: str = Field(..., description="Detailed description of the issue and solution")
    current_score: float = Field(..., ge=0.0, le=1.0, description="Current score in this area")
    target_score: float = Field(..., ge=0.0, le=1.0, description="Target score after implementation")
    expected_impact: float = Field(..., ge=0.0, le=1.0, description="Expected overall score improvement")
    difficulty: ImplementationDifficulty
    action_steps: List[ActionStep] = Field(..., description="Step-by-step implementation guide")
    templates: List[RecommendationTemplate] = Field(default_factory=list, description="Example templates")
    platform_specific: Dict[str, str] = Field(default_factory=dict, description="Platform-specific advice")
    metrics_affected: List[str] = Field(default_factory=list, description="Metrics this will improve")
    estimated_time: str = Field(..., description="Total time to implement")
    reasoning: str = Field(..., description="Why this recommendation matters")


class DetailedRecommendationRequest(BaseModel):
    """Request for detailed recommendations."""
    content_url: str = Field(..., description="URL to the content to analyze")
    content_type: ContentType
    platform: Platform
    caption: Optional[str] = None
    hashtags: List[str] = Field(default_factory=list)
    target_audience: Optional[Dict[str, Any]] = None
    creator_metrics: Optional[Dict[str, float]] = None
    posting_time: Optional[str] = None
    focus_areas: Optional[List[RecommendationCategory]] = Field(
        None,
        description="Optional: Focus on specific categories only"
    )


class DetailedRecommendationResponse(BaseModel):
    """Response containing all detailed recommendations."""
    content_id: str = Field(..., description="Analyzed content ID")
    platform: Platform
    current_overall_score: float = Field(..., ge=0.0, le=100.0)
    potential_score: float = Field(..., ge=0.0, le=100.0)
    recommendations: List[DetailedRecommendation]
    priority_summary: Dict[str, int] = Field(..., description="Count of recommendations by priority")
    quick_wins: List[str] = Field(..., description="Easy, high-impact actions")
    high_impact_actions: List[str] = Field(..., description="Highest impact actions regardless of difficulty")
    estimated_total_time: str = Field(..., description="Total time to implement all recommendations")
    analyzed_at: str


# =====================================================
# Learning & Outcome Tracking Models
# =====================================================


class OutcomeReport(BaseModel):
    """Report of actual content performance for learning."""
    content_id: str = Field(..., description="Content ID from prediction")
    prediction_id: str = Field(..., description="Original prediction ID")
    platform: Platform
    actual_views: int = Field(..., ge=0)
    actual_likes: int = Field(..., ge=0)
    actual_comments: int = Field(..., ge=0)
    actual_shares: int = Field(..., ge=0)
    actual_engagement_rate: float = Field(..., ge=0.0, le=1.0)
    published_at: str
    measured_at: str
    recommendations_followed: Optional[List[str]] = Field(
        None,
        description="List of recommendation IDs that were implemented"
    )


class OutcomeResponse(BaseModel):
    """Response after recording an outcome."""
    outcome_id: str
    content_id: str
    prediction_accuracy: float = Field(..., ge=0.0, le=1.0, description="How accurate the prediction was")
    accuracy_breakdown: Dict[str, float] = Field(..., description="Accuracy by metric")
    learning_impact: str = Field(..., description="How this outcome will improve future predictions")
    recorded_at: str
