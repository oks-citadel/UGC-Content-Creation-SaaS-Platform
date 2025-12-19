from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class CreatorProfile(BaseModel):
    creator_id: str
    niche: List[str]
    avg_engagement_rate: float
    follower_count: int
    content_style: List[str]
    past_performance: Dict[str, float]
    audience_demographics: Optional[Dict[str, Any]] = None
    location: Optional[str] = None
    languages: List[str] = Field(default_factory=lambda: ["en"])


class CampaignRequirements(BaseModel):
    campaign_id: str
    brand_name: str
    product_category: str
    target_audience: Dict[str, Any]
    required_niche: List[str]
    budget_range: Optional[Dict[str, float]] = None
    content_requirements: Dict[str, Any]
    min_engagement_rate: float = 0.02
    min_followers: int = 1000
    preferred_locations: Optional[List[str]] = None
    campaign_goals: List[str]


class ContentItem(BaseModel):
    content_id: str
    content_type: str
    description: str
    tags: List[str]
    visual_features: Optional[List[float]] = None
    engagement_metrics: Optional[Dict[str, int]] = None


class ProductInfo(BaseModel):
    product_id: str
    name: str
    category: str
    description: str
    target_audience: Dict[str, Any]
    keywords: List[str]


class CreatorMatch(BaseModel):
    creator_id: str
    match_score: float = Field(..., ge=0.0, le=1.0)
    reasoning: List[str]
    audience_overlap: float
    engagement_fit: float
    style_alignment: float
    estimated_performance: Dict[str, Any]


class CreatorMatchResponse(BaseModel):
    campaign_id: str
    matches: List[CreatorMatch]
    total_matches: int
    match_criteria: Dict[str, Any]


class ContentMatch(BaseModel):
    content_id: str
    product_id: str
    match_score: float
    reasoning: List[str]
    predicted_conversion: float
    audience_alignment: float


class ContentMatchResponse(BaseModel):
    product_id: str
    matches: List[ContentMatch]
    total_matches: int


class SimilarCreator(BaseModel):
    creator_id: str
    similarity_score: float
    shared_attributes: List[str]
    key_differences: List[str]


class SimilarCreatorsResponse(BaseModel):
    base_creator_id: str
    similar_creators: List[SimilarCreator]
    total_found: int


class TrendingContent(BaseModel):
    content_id: str
    trend_score: float
    engagement_velocity: float
    viral_probability: float
    trending_topics: List[str]
    platform: str
    published_at: str


class TrendingResponse(BaseModel):
    trending_content: List[TrendingContent]
    time_window: str
    total_trending: int
    top_topics: List[str]


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    vector_db_status: str
    embeddings_loaded: bool
