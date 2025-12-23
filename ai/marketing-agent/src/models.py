from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class Platform(str, Enum):
    """Supported social media platforms."""
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    FACEBOOK = "facebook"
    PINTEREST = "pinterest"
    TWITTER = "twitter"


class ContentType(str, Enum):
    """Types of marketing content."""
    VIDEO = "video"
    IMAGE = "image"
    CAROUSEL = "carousel"
    STORY = "story"
    REEL = "reel"
    SHORT = "short"
    POST = "post"


class CampaignObjective(str, Enum):
    """Campaign objectives."""
    AWARENESS = "awareness"
    ENGAGEMENT = "engagement"
    TRAFFIC = "traffic"
    CONVERSIONS = "conversions"
    LEADS = "leads"
    APP_INSTALLS = "app_installs"
    VIDEO_VIEWS = "video_views"


class CopyTone(str, Enum):
    """Tone of marketing copy."""
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    HUMOROUS = "humorous"
    URGENT = "urgent"
    INSPIRATIONAL = "inspirational"
    EDUCATIONAL = "educational"
    FRIENDLY = "friendly"


class AudienceSegmentType(str, Enum):
    """Types of audience segments."""
    DEMOGRAPHIC = "demographic"
    BEHAVIORAL = "behavioral"
    PSYCHOGRAPHIC = "psychographic"
    GEOGRAPHIC = "geographic"
    INTEREST_BASED = "interest_based"


# ===================
# Request Models
# ===================


class CampaignGenerateRequest(BaseModel):
    """Request for generating campaign strategy."""
    brand_name: str = Field(..., description="Name of the brand")
    product_or_service: str = Field(..., description="Product or service being promoted")
    target_audience: str = Field(..., description="Target audience description")
    objective: CampaignObjective = Field(..., description="Campaign objective")
    platforms: List[Platform] = Field(..., description="Target platforms")
    budget_range: Optional[str] = Field(None, description="Budget range (e.g., '$1000-$5000')")
    duration_days: int = Field(default=30, description="Campaign duration in days")
    brand_voice: Optional[str] = Field(None, description="Brand voice description")
    key_messages: List[str] = Field(default_factory=list, description="Key messages to convey")
    competitors: List[str] = Field(default_factory=list, description="Known competitors")
    additional_context: Optional[str] = Field(None, description="Additional context")


class CopyGenerateRequest(BaseModel):
    """Request for generating marketing copy."""
    product_or_service: str = Field(..., description="Product or service")
    platform: Platform = Field(..., description="Target platform")
    content_type: ContentType = Field(..., description="Type of content")
    tone: CopyTone = Field(default=CopyTone.PROFESSIONAL, description="Desired tone")
    target_audience: str = Field(..., description="Target audience")
    key_benefits: List[str] = Field(default_factory=list, description="Key benefits to highlight")
    call_to_action: Optional[str] = Field(None, description="Desired CTA")
    max_length: Optional[int] = Field(None, description="Maximum character length")
    include_emojis: bool = Field(default=True, description="Include emojis")
    variations: int = Field(default=3, ge=1, le=10, description="Number of variations")
    brand_voice: Optional[str] = Field(None, description="Brand voice guidelines")


class HashtagGenerateRequest(BaseModel):
    """Request for generating hashtags."""
    content_description: str = Field(..., description="Description of content")
    platform: Platform = Field(..., description="Target platform")
    niche: str = Field(..., description="Content niche/industry")
    include_branded: bool = Field(default=True, description="Include branded hashtags")
    brand_hashtags: List[str] = Field(default_factory=list, description="Brand-specific hashtags")
    max_hashtags: int = Field(default=15, ge=1, le=30, description="Maximum hashtags")
    include_trending: bool = Field(default=True, description="Include trending hashtags")
    target_audience: Optional[str] = Field(None, description="Target audience")


class CompetitorAnalyzeRequest(BaseModel):
    """Request for competitor analysis."""
    brand_name: str = Field(..., description="Your brand name")
    competitors: List[str] = Field(..., min_length=1, description="Competitors to analyze")
    platforms: List[Platform] = Field(..., description="Platforms to analyze")
    analysis_depth: str = Field(default="standard", description="Analysis depth: basic, standard, deep")
    focus_areas: List[str] = Field(
        default_factory=lambda: ["content_strategy", "engagement", "posting_frequency"],
        description="Areas to focus analysis on"
    )


class TrendAnalyzeRequest(BaseModel):
    """Request for trend analysis."""
    niche: str = Field(..., description="Industry/niche")
    platforms: List[Platform] = Field(..., description="Platforms to analyze")
    content_types: List[ContentType] = Field(default_factory=list, description="Content types to focus on")
    lookback_days: int = Field(default=7, ge=1, le=30, description="Days to look back")
    include_hashtags: bool = Field(default=True, description="Include trending hashtags")
    include_sounds: bool = Field(default=True, description="Include trending sounds (for TikTok/Reels)")
    include_formats: bool = Field(default=True, description="Include trending content formats")


class ABTestSuggestRequest(BaseModel):
    """Request for A/B test suggestions."""
    original_content: str = Field(..., description="Original content or concept")
    content_type: ContentType = Field(..., description="Type of content")
    platform: Platform = Field(..., description="Target platform")
    element_to_test: str = Field(..., description="Element to test (headline, CTA, visual, etc.)")
    objective: str = Field(..., description="Test objective")
    num_variations: int = Field(default=2, ge=2, le=5, description="Number of variations")
    brand_guidelines: Optional[str] = Field(None, description="Brand guidelines to follow")


class AudienceSegmentRequest(BaseModel):
    """Request for audience segmentation."""
    brand_name: str = Field(..., description="Brand name")
    product_category: str = Field(..., description="Product category")
    existing_audience_data: Optional[Dict[str, Any]] = Field(None, description="Existing audience data")
    platforms: List[Platform] = Field(..., description="Target platforms")
    max_segments: int = Field(default=5, ge=2, le=10, description="Maximum segments to generate")
    segment_focus: List[AudienceSegmentType] = Field(
        default_factory=lambda: [AudienceSegmentType.DEMOGRAPHIC, AudienceSegmentType.INTEREST_BASED],
        description="Types of segments to focus on"
    )


# ===================
# Response Models
# ===================


class CampaignPhase(BaseModel):
    """A phase of a marketing campaign."""
    phase_number: int
    name: str
    duration_days: int
    objectives: List[str]
    content_types: List[str]
    key_activities: List[str]
    success_metrics: List[str]


class PlatformStrategy(BaseModel):
    """Platform-specific strategy."""
    platform: Platform
    content_mix: Dict[str, int]  # content type -> percentage
    posting_frequency: str
    best_posting_times: List[str]
    key_tactics: List[str]
    hashtag_strategy: str


class CampaignBrief(BaseModel):
    """Generated campaign brief."""
    campaign_id: str
    campaign_name: str
    tagline: str
    executive_summary: str
    target_audience_profile: str
    key_messages: List[str]
    content_pillars: List[str]
    phases: List[CampaignPhase]
    platform_strategies: List[PlatformStrategy]
    budget_allocation: Dict[str, float]
    success_metrics: Dict[str, str]
    risks_and_mitigations: List[Dict[str, str]]
    generated_at: str


class CampaignGenerateResponse(BaseModel):
    """Response for campaign generation."""
    campaign_brief: CampaignBrief
    content_calendar_summary: str
    recommended_creators: List[str]
    estimated_reach: str
    confidence_score: float


class CopyVariation(BaseModel):
    """A variation of marketing copy."""
    variation_id: str
    headline: Optional[str] = None
    body: str
    call_to_action: str
    hashtags: List[str]
    estimated_engagement_score: float
    reasoning: str


class CopyGenerateResponse(BaseModel):
    """Response for copy generation."""
    request_id: str
    platform: Platform
    content_type: ContentType
    variations: List[CopyVariation]
    brand_voice_consistency_score: float
    best_variation_id: str
    optimization_tips: List[str]
    generated_at: str


class HashtagCategory(BaseModel):
    """Category of hashtags."""
    category_name: str
    hashtags: List[str]
    avg_engagement_potential: float


class HashtagGenerateResponse(BaseModel):
    """Response for hashtag generation."""
    request_id: str
    platform: Platform
    primary_hashtags: List[str]
    secondary_hashtags: List[str]
    niche_hashtags: List[str]
    trending_hashtags: List[str]
    branded_hashtags: List[str]
    categories: List[HashtagCategory]
    optimal_hashtag_count: int
    usage_strategy: str
    generated_at: str


class CompetitorInsight(BaseModel):
    """Insights about a competitor."""
    competitor_name: str
    content_strategy_summary: str
    posting_frequency: str
    top_performing_content_types: List[str]
    engagement_rate_estimate: str
    strengths: List[str]
    weaknesses: List[str]
    opportunities_for_you: List[str]


class CompetitorAnalyzeResponse(BaseModel):
    """Response for competitor analysis."""
    analysis_id: str
    your_brand: str
    competitors_analyzed: List[CompetitorInsight]
    market_positioning_map: Dict[str, str]
    content_gaps: List[str]
    differentiation_opportunities: List[str]
    recommended_strategies: List[str]
    competitive_advantages: List[str]
    threats_to_address: List[str]
    action_items: List[str]
    generated_at: str


class TrendingTopic(BaseModel):
    """A trending topic."""
    topic: str
    trend_score: float
    platforms: List[Platform]
    content_ideas: List[str]
    estimated_lifespan: str
    competition_level: str


class TrendingFormat(BaseModel):
    """A trending content format."""
    format_name: str
    description: str
    platforms: List[Platform]
    example_ideas: List[str]
    implementation_tips: List[str]


class TrendAnalyzeResponse(BaseModel):
    """Response for trend analysis."""
    analysis_id: str
    niche: str
    trending_topics: List[TrendingTopic]
    trending_hashtags: List[Dict[str, Any]]
    trending_sounds: List[Dict[str, Any]]
    trending_formats: List[TrendingFormat]
    emerging_trends: List[str]
    declining_trends: List[str]
    content_recommendations: List[str]
    timing_recommendations: Dict[str, str]
    generated_at: str


class ABTestVariation(BaseModel):
    """A variation for A/B testing."""
    variation_id: str
    variation_name: str
    content: str
    changes_from_original: List[str]
    hypothesis: str
    expected_impact: str
    implementation_notes: str


class ABTestSuggestResponse(BaseModel):
    """Response for A/B test suggestions."""
    test_id: str
    test_name: str
    element_tested: str
    original_content: str
    variations: List[ABTestVariation]
    recommended_sample_size: int
    recommended_duration_days: int
    success_metrics: List[str]
    statistical_significance_target: float
    implementation_guide: str
    analysis_framework: str
    generated_at: str


class AudienceSegment(BaseModel):
    """An audience segment."""
    segment_id: str
    segment_name: str
    segment_type: AudienceSegmentType
    description: str
    demographics: Dict[str, Any]
    psychographics: Dict[str, Any]
    behaviors: List[str]
    pain_points: List[str]
    motivations: List[str]
    preferred_content_types: List[str]
    preferred_platforms: List[Platform]
    messaging_approach: str
    content_themes: List[str]
    estimated_size_percentage: float


class AudienceSegmentResponse(BaseModel):
    """Response for audience segmentation."""
    segmentation_id: str
    brand_name: str
    total_segments: int
    segments: List[AudienceSegment]
    segment_overlap_analysis: Dict[str, List[str]]
    prioritization_recommendation: List[str]
    cross_segment_strategies: List[str]
    personalization_opportunities: List[str]
    generated_at: str


# ===================
# Health Check Model
# ===================


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    version: str
    openai_connected: bool
    capabilities: List[str]
