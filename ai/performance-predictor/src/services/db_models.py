"""
SQLAlchemy database models for the Performance Predictor service.

These models store prediction outcomes, recommendation effectiveness,
and learning data to improve predictions over time.
"""

from datetime import datetime
from typing import Optional, List
import uuid

from sqlalchemy import (
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Text,
    JSON,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from .database import Base


class PredictionOutcome(Base):
    """
    Stores prediction results and actual outcomes for learning.

    Used to track prediction accuracy and adjust model weights.
    """

    __tablename__ = "prediction_outcomes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    content_id: Mapped[str] = mapped_column(String(255), index=True)
    prediction_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    # Platform and content info
    platform: Mapped[str] = mapped_column(String(50))
    content_type: Mapped[str] = mapped_column(String(50))

    # Predicted values
    predicted_views: Mapped[int] = mapped_column(Integer)
    predicted_likes: Mapped[int] = mapped_column(Integer)
    predicted_comments: Mapped[int] = mapped_column(Integer)
    predicted_shares: Mapped[int] = mapped_column(Integer)
    predicted_engagement_rate: Mapped[float] = mapped_column(Float)
    predicted_overall_score: Mapped[float] = mapped_column(Float)
    prediction_confidence: Mapped[float] = mapped_column(Float)

    # Actual values (filled in when outcome is reported)
    actual_views: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_likes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_comments: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_shares: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    actual_engagement_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Accuracy metrics (calculated when outcome is reported)
    accuracy_views: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    accuracy_likes: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    accuracy_comments: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    accuracy_shares: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    accuracy_engagement: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    overall_accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Content analysis scores at time of prediction
    visual_quality_score: Mapped[float] = mapped_column(Float)
    hook_strength_score: Mapped[float] = mapped_column(Float)
    trending_alignment_score: Mapped[float] = mapped_column(Float)
    caption_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Creator info
    creator_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    creator_followers: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Timestamps
    predicted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    outcome_reported_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Status
    outcome_received: Mapped[bool] = mapped_column(Boolean, default=False)
    used_for_learning: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    recommendations_followed: Mapped[List["RecommendationEffectiveness"]] = relationship(
        "RecommendationEffectiveness",
        back_populates="prediction_outcome",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_prediction_outcomes_platform_date", "platform", "predicted_at"),
        Index("ix_prediction_outcomes_creator_date", "creator_id", "predicted_at"),
    )


class RecommendationEffectiveness(Base):
    """
    Tracks which recommendations were followed and their impact.

    Used to improve recommendation quality over time.
    """

    __tablename__ = "recommendation_effectiveness"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    prediction_outcome_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("prediction_outcomes.id", ondelete="CASCADE"),
        index=True
    )

    # Recommendation info
    recommendation_id: Mapped[str] = mapped_column(String(255))
    recommendation_category: Mapped[str] = mapped_column(String(100))
    recommendation_priority: Mapped[str] = mapped_column(String(50))
    expected_impact: Mapped[float] = mapped_column(Float)

    # Tracking
    was_followed: Mapped[bool] = mapped_column(Boolean, default=False)
    actual_impact: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    impact_accuracy: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationship
    prediction_outcome: Mapped["PredictionOutcome"] = relationship(
        "PredictionOutcome",
        back_populates="recommendations_followed"
    )

    __table_args__ = (
        Index(
            "ix_rec_effectiveness_category_followed",
            "recommendation_category",
            "was_followed"
        ),
    )


class CreatorBaseline(Base):
    """
    Stores creator-specific performance baselines.

    Used to personalize predictions based on creator history.
    """

    __tablename__ = "creator_baselines"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    creator_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)

    # Platform-specific baselines
    platform: Mapped[str] = mapped_column(String(50), index=True)

    # Baseline metrics
    avg_views: Mapped[float] = mapped_column(Float, default=0.0)
    avg_likes: Mapped[float] = mapped_column(Float, default=0.0)
    avg_comments: Mapped[float] = mapped_column(Float, default=0.0)
    avg_shares: Mapped[float] = mapped_column(Float, default=0.0)
    avg_engagement_rate: Mapped[float] = mapped_column(Float, default=0.0)

    # Performance ranges
    min_views: Mapped[int] = mapped_column(Integer, default=0)
    max_views: Mapped[int] = mapped_column(Integer, default=0)
    std_views: Mapped[float] = mapped_column(Float, default=0.0)

    # Content patterns
    best_posting_times: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    best_hashtag_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    best_caption_length: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Sample size
    total_outcomes: Mapped[int] = mapped_column(Integer, default=0)
    outcomes_last_30_days: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (
        Index("ix_creator_baselines_platform", "platform"),
    )


class PlatformBenchmark(Base):
    """
    Stores rolling platform benchmarks.

    Used to compare content against platform averages.
    """

    __tablename__ = "platform_benchmarks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    platform: Mapped[str] = mapped_column(String(50), index=True)
    content_type: Mapped[str] = mapped_column(String(50))

    # Benchmark period
    period_start: Mapped[datetime] = mapped_column(DateTime)
    period_end: Mapped[datetime] = mapped_column(DateTime)

    # Average metrics
    avg_views: Mapped[float] = mapped_column(Float)
    avg_likes: Mapped[float] = mapped_column(Float)
    avg_comments: Mapped[float] = mapped_column(Float)
    avg_shares: Mapped[float] = mapped_column(Float)
    avg_engagement_rate: Mapped[float] = mapped_column(Float)

    # Percentile thresholds
    p25_views: Mapped[int] = mapped_column(Integer)
    p50_views: Mapped[int] = mapped_column(Integer)
    p75_views: Mapped[int] = mapped_column(Integer)
    p90_views: Mapped[int] = mapped_column(Integer)

    p25_engagement: Mapped[float] = mapped_column(Float)
    p50_engagement: Mapped[float] = mapped_column(Float)
    p75_engagement: Mapped[float] = mapped_column(Float)
    p90_engagement: Mapped[float] = mapped_column(Float)

    # Sample info
    sample_size: Mapped[int] = mapped_column(Integer)

    # Timestamps
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_platform_benchmarks_period", "platform", "period_start"),
    )


class ModelWeightHistory(Base):
    """
    Tracks changes to model weights over time.

    Used for auditing and rolling back weight changes if needed.
    """

    __tablename__ = "model_weight_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Weight category
    weight_name: Mapped[str] = mapped_column(String(100))
    platform: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Values
    old_value: Mapped[float] = mapped_column(Float)
    new_value: Mapped[float] = mapped_column(Float)

    # Reason for change
    change_reason: Mapped[str] = mapped_column(Text)
    outcomes_used: Mapped[int] = mapped_column(Integer)  # How many outcomes informed this change
    accuracy_before: Mapped[float] = mapped_column(Float)
    accuracy_after: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Timestamps
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    applied: Mapped[bool] = mapped_column(Boolean, default=True)
    rolled_back: Mapped[bool] = mapped_column(Boolean, default=False)
    rolled_back_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_model_weight_history_weight", "weight_name", "changed_at"),
    )
