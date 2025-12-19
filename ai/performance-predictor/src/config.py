from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuration settings for the performance predictor service."""

    # Service settings
    service_name: str = "performance-predictor"
    version: str = "2.0.0"  # Updated for advanced features
    debug: bool = False

    # API Keys
    openai_api_key: Optional[str] = None

    # Redis settings
    redis_url: str = "redis://localhost:6379"
    cache_ttl: int = 3600

    # Database settings for historical learning
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/performance_predictor"
    database_echo: bool = False  # Set True to log SQL queries
    database_pool_size: int = 5
    database_max_overflow: int = 10

    # Model settings
    models_dir: str = "./models"
    clip_model_name: str = "openai/clip-vit-base-patch32"

    # Prediction thresholds
    high_engagement_threshold: float = 0.7
    viral_potential_threshold: float = 0.8
    min_confidence_score: float = 0.6

    # Feature weights for scoring
    visual_quality_weight: float = 0.25
    content_relevance_weight: float = 0.25
    emotional_impact_weight: float = 0.20
    trending_alignment_weight: float = 0.15
    creator_authority_weight: float = 0.15

    # Learning settings
    learning_enabled: bool = True
    min_outcomes_for_learning: int = 10  # Minimum outcomes before adjusting weights
    learning_rate: float = 0.1  # How much to adjust weights based on outcomes
    prediction_cache_ttl: int = 86400  # 24 hours in seconds

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
