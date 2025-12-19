"""Pydantic models for the Script Generator service."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class Platform(str, Enum):
    """Supported social media platforms."""
    TIKTOK = "tiktok"
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    FACEBOOK = "facebook"
    PINTEREST = "pinterest"


class ContentType(str, Enum):
    """Types of UGC content."""
    PRODUCT_REVIEW = "product_review"
    UNBOXING = "unboxing"
    TUTORIAL = "tutorial"
    TESTIMONIAL = "testimonial"
    LIFESTYLE = "lifestyle"
    COMPARISON = "comparison"
    HAUL = "haul"
    DAY_IN_LIFE = "day_in_life"
    GET_READY = "get_ready"
    STORY_TIME = "story_time"


class ToneStyle(str, Enum):
    """Voice tone styles for scripts."""
    CONVERSATIONAL = "conversational"
    ENTHUSIASTIC = "enthusiastic"
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    URGENT = "urgent"
    EDUCATIONAL = "educational"
    STORYTELLING = "storytelling"
    HUMOROUS = "humorous"
    AUTHENTIC = "authentic"
    LUXURY = "luxury"


class ScriptLength(str, Enum):
    """Script length options."""
    SHORT = "short"      # 15-30 seconds
    MEDIUM = "medium"    # 30-60 seconds
    LONG = "long"        # 60-90 seconds
    EXTENDED = "extended"  # 90-180 seconds


class HookStyle(str, Enum):
    """Hook style categories."""
    QUESTION = "question"
    BOLD_CLAIM = "bold_claim"
    PROBLEM_AGITATE = "problem_agitate"
    CURIOSITY_GAP = "curiosity_gap"
    SOCIAL_PROOF = "social_proof"
    CONTROVERSIAL = "controversial"
    RELATABLE = "relatable"
    SHOCK = "shock"
    SECRET = "secret"
    TRANSFORMATION = "transformation"


class CTAType(str, Enum):
    """Call-to-action types."""
    FOLLOW = "follow"
    LIKE = "like"
    COMMENT = "comment"
    SHARE = "share"
    SAVE = "save"
    LINK_IN_BIO = "link_in_bio"
    SWIPE_UP = "swipe_up"
    SHOP_NOW = "shop_now"
    LEARN_MORE = "learn_more"
    TRY_IT = "try_it"


# Request Models

class ScriptGenerationRequest(BaseModel):
    """Request to generate a UGC script."""
    product_name: str = Field(..., description="Name of the product or brand")
    product_description: str = Field(..., description="Brief product description")
    key_benefits: List[str] = Field(..., description="List of key product benefits")
    platform: Platform = Platform.TIKTOK
    content_type: ContentType = ContentType.PRODUCT_REVIEW
    tone: ToneStyle = ToneStyle.CONVERSATIONAL
    length: ScriptLength = ScriptLength.MEDIUM
    target_audience: Optional[str] = Field(None, description="Target audience description")
    pain_points: Optional[List[str]] = Field(None, description="Customer pain points to address")
    include_hook: bool = True
    include_cta: bool = True
    cta_type: CTAType = CTAType.LINK_IN_BIO
    brand_voice_notes: Optional[str] = Field(None, description="Specific brand voice guidelines")
    trending_sounds: Optional[List[str]] = Field(None, description="Trending sounds to reference")
    competitor_differentiators: Optional[List[str]] = Field(None, description="What makes this product different")
    num_variations: int = Field(default=1, ge=1, le=5, description="Number of script variations")


class HookGenerationRequest(BaseModel):
    """Request to generate viral hooks."""
    topic: str = Field(..., description="Main topic or product")
    platform: Platform = Platform.TIKTOK
    hook_styles: List[HookStyle] = Field(
        default_factory=lambda: [HookStyle.QUESTION, HookStyle.BOLD_CLAIM, HookStyle.CURIOSITY_GAP]
    )
    target_audience: Optional[str] = None
    pain_points: Optional[List[str]] = None
    num_hooks: int = Field(default=5, ge=1, le=20)
    max_words: int = Field(default=12, ge=5, le=25)
    include_emoji: bool = True


class CTAGenerationRequest(BaseModel):
    """Request to generate call-to-actions."""
    context: str = Field(..., description="What the script/video is about")
    platform: Platform = Platform.TIKTOK
    cta_types: List[CTAType] = Field(
        default_factory=lambda: [CTAType.FOLLOW, CTAType.LINK_IN_BIO, CTAType.COMMENT]
    )
    tone: ToneStyle = ToneStyle.CONVERSATIONAL
    product_name: Optional[str] = None
    num_variations: int = Field(default=3, ge=1, le=10)


class ScriptEnhancementRequest(BaseModel):
    """Request to enhance an existing script."""
    original_script: str = Field(..., description="The original script to enhance")
    platform: Platform = Platform.TIKTOK
    enhancements: List[str] = Field(
        default_factory=lambda: ["hook", "pacing", "cta"],
        description="What to enhance: hook, pacing, cta, emotional_triggers, storytelling"
    )
    target_length: Optional[ScriptLength] = None
    add_timestamps: bool = False


class TrendingFormatRequest(BaseModel):
    """Request to adapt script to trending format."""
    product_name: str
    product_description: str
    platform: Platform = Platform.TIKTOK
    trending_format: str = Field(..., description="Name or description of trending format")
    key_benefits: List[str] = Field(default_factory=list)


# Response Models

class ScriptSection(BaseModel):
    """A section of the generated script."""
    section_type: str  # hook, intro, body, benefits, cta, outro
    content: str
    duration_estimate: float = Field(..., description="Estimated duration in seconds")
    visual_suggestions: Optional[List[str]] = None
    b_roll_suggestions: Optional[List[str]] = None


class GeneratedScript(BaseModel):
    """A complete generated script."""
    id: str
    full_script: str
    sections: List[ScriptSection]
    word_count: int
    estimated_duration: float
    platform: Platform
    content_type: ContentType
    tone: ToneStyle
    hooks_used: List[str]
    cta_used: str
    hashtag_suggestions: List[str]
    caption_suggestion: str
    posting_tips: List[str]
    confidence_score: float = Field(..., ge=0.0, le=1.0)


class ScriptGenerationResponse(BaseModel):
    """Response with generated scripts."""
    request_id: str
    scripts: List[GeneratedScript]
    platform: Platform
    generation_time: float
    tokens_used: int
    created_at: str


class GeneratedHook(BaseModel):
    """A generated hook."""
    id: str
    hook_text: str
    style: HookStyle
    word_count: int
    estimated_retention_boost: float = Field(..., ge=0.0, le=1.0)
    platform_fit_score: float = Field(..., ge=0.0, le=1.0)
    emotional_trigger: str
    why_it_works: str


class HookGenerationResponse(BaseModel):
    """Response with generated hooks."""
    request_id: str
    hooks: List[GeneratedHook]
    topic: str
    platform: Platform
    created_at: str


class GeneratedCTA(BaseModel):
    """A generated call-to-action."""
    id: str
    cta_text: str
    cta_type: CTAType
    urgency_level: str  # low, medium, high
    platform_optimized: bool
    conversion_potential: float = Field(..., ge=0.0, le=1.0)
    placement_suggestion: str  # end, middle, throughout


class CTAGenerationResponse(BaseModel):
    """Response with generated CTAs."""
    request_id: str
    ctas: List[GeneratedCTA]
    context: str
    platform: Platform
    created_at: str


class EnhancedScript(BaseModel):
    """An enhanced version of a script."""
    original_script: str
    enhanced_script: str
    changes_made: List[str]
    improvement_score: float = Field(..., ge=0.0, le=1.0)
    before_after_comparison: Dict[str, Any]
    timestamps: Optional[List[Dict[str, Any]]] = None


class ScriptEnhancementResponse(BaseModel):
    """Response with enhanced script."""
    request_id: str
    enhanced: EnhancedScript
    platform: Platform
    created_at: str


class TrendingFormat(BaseModel):
    """Information about a trending format."""
    id: str
    name: str
    description: str
    platform: Platform
    example_structure: str
    popularity_score: float
    best_for: List[str]
    key_elements: List[str]


class TrendingFormatScript(BaseModel):
    """A script adapted to a trending format."""
    format_name: str
    adapted_script: str
    format_elements_used: List[str]
    estimated_engagement_boost: float


class TrendingFormatResponse(BaseModel):
    """Response with trending format adaptation."""
    request_id: str
    original_format: str
    adapted_script: TrendingFormatScript
    platform: Platform
    created_at: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    version: str
    models_available: Dict[str, bool]
