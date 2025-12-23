from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Configuration settings for the customer agent service."""

    # Service settings
    service_name: str = "customer-agent"
    version: str = "1.0.0"
    debug: bool = False

    # API Keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

    # LLM Configuration
    llm_provider: str = "openai"  # Options: openai, anthropic
    openai_model: str = "gpt-4-turbo-preview"
    anthropic_model: str = "claude-3-sonnet-20240229"
    max_tokens: int = 1024
    temperature: float = 0.7

    # Redis settings
    redis_url: str = "redis://localhost:6379"
    cache_ttl: int = 3600
    conversation_ttl: int = 86400  # 24 hours

    # Vector database settings for RAG
    vector_db_type: str = "faiss"  # Options: faiss, pinecone, qdrant
    pinecone_api_key: Optional[str] = None
    pinecone_environment: Optional[str] = None
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None

    # Embedding settings
    embedding_model: str = "text-embedding-3-small"
    embedding_dimension: int = 1536

    # Sentiment analysis settings
    sentiment_threshold_negative: float = -0.5
    sentiment_threshold_escalation: float = -0.7

    # Escalation settings
    escalation_keywords: List[str] = [
        "speak to manager",
        "human agent",
        "real person",
        "supervisor",
        "complaint",
        "legal",
        "lawyer",
        "cancel subscription",
        "refund",
        "unacceptable"
    ]
    max_conversation_turns_before_escalation: int = 10

    # Notification service settings
    notification_service_url: str = "http://localhost:3006"

    # Ticket classification
    ticket_categories: List[str] = [
        "billing",
        "technical_support",
        "account_management",
        "content_issues",
        "platform_features",
        "partnership_inquiry",
        "bug_report",
        "feature_request",
        "general_inquiry"
    ]

    ticket_priorities: List[str] = [
        "low",
        "medium",
        "high",
        "urgent"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
