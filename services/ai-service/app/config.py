from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Service
    service_name: str = "ai-service"
    environment: str = "development"
    debug: bool = False
    port: int = 8000

    # Database
    database_url: str = ""

    # Redis
    redis_url: str = ""

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4-turbo-preview"
    openai_vision_model: str = "gpt-4-vision-preview"

    # Anthropic
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-3-opus-20240229"

    # Azure OpenAI (optional alternative)
    azure_openai_endpoint: str = ""
    azure_openai_api_key: str = ""
    azure_openai_deployment: str = ""

    # Azure Storage
    azure_storage_connection_string: str = ""
    azure_storage_container: str = "ai-outputs"

    # Replicate (for video generation)
    replicate_api_token: str = ""

    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60

    # CORS
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
