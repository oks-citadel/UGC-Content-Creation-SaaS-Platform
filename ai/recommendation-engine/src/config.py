from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuration settings for the recommendation engine service."""

    # Service settings
    service_name: str = "recommendation-engine"
    version: str = "1.0.0"
    debug: bool = False

    # API Keys
    openai_api_key: Optional[str] = None
    pinecone_api_key: Optional[str] = None

    # Vector DB settings
    vector_db_type: str = "faiss"  # faiss, pinecone, qdrant
    qdrant_url: Optional[str] = None
    qdrant_api_key: Optional[str] = None
    pinecone_environment: Optional[str] = None

    # Redis settings
    redis_url: str = "redis://localhost:6379"
    cache_ttl: int = 1800  # 30 minutes

    # Embedding settings
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # Matching settings
    min_similarity_score: float = 0.6
    max_recommendations: int = 20
    diversity_factor: float = 0.3

    # Trending settings
    trending_time_window: int = 24  # hours
    trending_min_engagement: int = 1000

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
