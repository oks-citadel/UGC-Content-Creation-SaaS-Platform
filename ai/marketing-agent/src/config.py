from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Configuration settings for the AI Marketing Agent service."""

    # Service settings
    service_name: str = "marketing-agent"
    version: str = "1.0.0"
    debug: bool = False

    # API Keys
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4-turbo-preview"
    openai_temperature: float = 0.7
    openai_max_tokens: int = 4096

    # Redis settings
    redis_url: str = "redis://localhost:6379"
    cache_ttl: int = 3600

    # Platform configurations
    supported_platforms: List[str] = ["tiktok", "instagram", "youtube", "facebook", "pinterest", "twitter"]

    # Campaign generation settings
    max_campaign_variations: int = 5
    default_campaign_duration_days: int = 30

    # Copy generation settings
    max_copy_variations: int = 10
    max_headline_length: int = 100
    max_cta_length: int = 50

    # Hashtag generation settings
    max_hashtags_per_platform: int = 30
    min_hashtag_relevance_score: float = 0.6

    # Competitor analysis settings
    max_competitors_to_analyze: int = 10
    content_sample_size: int = 50

    # Trend analysis settings
    trend_lookback_days: int = 7
    min_trend_score: float = 0.5

    # A/B testing settings
    min_ab_test_variations: int = 2
    max_ab_test_variations: int = 5
    ab_test_confidence_level: float = 0.95

    # Audience segmentation settings
    max_audience_segments: int = 10
    min_segment_size_percentage: float = 5.0

    # Brand voice settings
    brand_voice_consistency_threshold: float = 0.8

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
