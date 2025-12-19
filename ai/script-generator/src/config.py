"""Configuration settings for the Script Generator service."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuration settings for the script generator service."""

    # Service settings
    service_name: str = "script-generator"
    version: str = "1.0.0"
    debug: bool = False

    # API Keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

    # Redis settings for caching
    redis_url: str = "redis://localhost:6379"
    cache_ttl: int = 3600

    # Script generation settings
    default_script_length: str = "medium"  # short, medium, long
    max_script_tokens: int = 2000
    default_tone: str = "conversational"

    # Platform defaults
    default_platform: str = "tiktok"

    # Hook settings
    max_hook_variations: int = 10
    hook_max_words: int = 15

    # CTA settings
    max_cta_variations: int = 5

    # Model settings
    openai_model: str = "gpt-4o"
    temperature: float = 0.8

    # Rate limiting
    max_requests_per_minute: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
