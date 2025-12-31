from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    service_name: str = "ai-center"
    version: str = "1.0.0"
    debug: bool = False
    
    redis_url: str = "redis://localhost:6379"
    cache_ttl: int = 3600
    
    video_generator_url: str = "http://localhost:8000"
    performance_predictor_url: str = "http://localhost:8001"
    recommendation_engine_url: str = "http://localhost:8002"
    marketing_agent_url: str = "http://localhost:8003"
    customer_agent_url: str = "http://localhost:8004"
    moderation_engine_url: str = "http://localhost:8005"
    
    http_timeout: float = 60.0
    http_max_retries: int = 3
    
    openai_api_key: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
