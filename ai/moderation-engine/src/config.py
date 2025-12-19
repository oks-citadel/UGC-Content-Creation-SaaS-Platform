from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Configuration settings for the moderation engine service."""

    # Service settings
    service_name: str = "moderation-engine"
    version: str = "1.0.0"
    debug: bool = False

    # API Keys
    openai_api_key: Optional[str] = None

    # Redis settings
    redis_url: str = "redis://localhost:6379"
    cache_ttl: int = 3600

    # Moderation settings
    brand_safety_threshold: float = 0.7
    compliance_threshold: float = 0.8

    # FTC Compliance keywords
    ftc_disclosure_terms: List[str] = [
        "ad", "sponsored", "partner", "paid", "gifted",
        "#ad", "#sponsored", "#partner", "#paidpartnership"
    ]

    # Inappropriate content categories
    inappropriate_categories: List[str] = [
        "violence",
        "hate_speech",
        "profanity",
        "adult_content",
        "drugs",
        "weapons",
        "illegal_activity"
    ]

    # Competitor detection
    competitor_detection_enabled: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
