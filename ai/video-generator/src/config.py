from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuration settings for the video generator service."""

    # Service settings
    service_name: str = "video-generator"
    version: str = "1.0.0"
    debug: bool = False

    # API Keys
    openai_api_key: Optional[str] = None
    replicate_api_token: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None

    # Storage settings
    s3_bucket: Optional[str] = None
    aws_region: str = "us-east-1"
    temp_dir: str = "/tmp/video-generator"

    # Redis settings for caching
    redis_url: str = "redis://localhost:6379"
    cache_ttl: int = 3600

    # Video generation settings
    default_resolution: str = "1080x1920"  # Vertical for social media
    default_fps: int = 30
    max_video_duration: int = 180  # 3 minutes
    default_format: str = "mp4"

    # Processing settings
    max_concurrent_jobs: int = 5
    job_timeout: int = 600  # 10 minutes

    # Template settings
    templates_dir: str = "./templates"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
