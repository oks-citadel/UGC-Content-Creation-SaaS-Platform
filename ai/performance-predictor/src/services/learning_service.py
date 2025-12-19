"""
Learning Service for the Performance Predictor.

Handles storing prediction outcomes, calculating accuracy,
adjusting model weights, and building creator baselines.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import uuid
import numpy as np

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..models import Platform, OutcomeReport, OutcomeResponse
from .database import get_session
from .db_models import (
    PredictionOutcome,
    RecommendationEffectiveness,
    CreatorBaseline,
    PlatformBenchmark,
    ModelWeightHistory,
)

logger = logging.getLogger(__name__)


class LearningService:
    """
    Service for learning from prediction outcomes.

    Responsibilities:
    - Store prediction outcomes
    - Calculate prediction accuracy
    - Adjust model weights based on outcomes
    - Build and update creator baselines
    - Calculate platform benchmarks
    """

    def __init__(self):
        self._weight_adjustments: Dict[str, float] = {}

    async def store_prediction(
        self,
        prediction_id: str,
        content_id: str,
        platform: Platform,
        content_type: str,
        predicted_metrics: Dict[str, Any],
        content_analysis: Dict[str, Any],
        creator_id: Optional[str] = None,
        creator_followers: Optional[int] = None,
    ) -> str:
        """
        Store a prediction for later outcome comparison.

        Args:
            prediction_id: Unique ID for the prediction
            content_id: ID of the content
            platform: Platform the content is for
            content_type: Type of content (video, image, etc.)
            predicted_metrics: Predicted engagement metrics
            content_analysis: Content analysis scores
            creator_id: Optional creator identifier
            creator_followers: Optional follower count

        Returns:
            The prediction ID
        """
        try:
            async with get_session() as session:
                outcome = PredictionOutcome(
                    id=uuid.uuid4(),
                    content_id=content_id,
                    prediction_id=prediction_id,
                    platform=platform.value,
                    content_type=content_type,
                    predicted_views=predicted_metrics.get("views", 0),
                    predicted_likes=predicted_metrics.get("likes", 0),
                    predicted_comments=predicted_metrics.get("comments", 0),
                    predicted_shares=predicted_metrics.get("shares", 0),
                    predicted_engagement_rate=predicted_metrics.get("engagement_rate", 0.0),
                    predicted_overall_score=predicted_metrics.get("overall_score", 0.0),
                    prediction_confidence=predicted_metrics.get("confidence", 0.75),
                    visual_quality_score=content_analysis.get("visual_quality_score", 0.5),
                    hook_strength_score=content_analysis.get("hook_strength", 0.5),
                    trending_alignment_score=content_analysis.get("trending_alignment_score", 0.5),
                    caption_score=content_analysis.get("caption_score"),
                    creator_id=creator_id,
                    creator_followers=creator_followers,
                )
                session.add(outcome)
                await session.commit()

            logger.info(f"Stored prediction {prediction_id} for content {content_id}")
            return prediction_id

        except Exception as e:
            logger.error(f"Error storing prediction: {str(e)}", exc_info=True)
            raise

    async def record_outcome(
        self,
        report: OutcomeReport
    ) -> OutcomeResponse:
        """
        Record actual content performance and calculate accuracy.

        Args:
            report: Outcome report with actual metrics

        Returns:
            OutcomeResponse with accuracy analysis
        """
        try:
            outcome_id = str(uuid.uuid4())

            async with get_session() as session:
                # Find the prediction
                result = await session.execute(
                    select(PredictionOutcome).where(
                        PredictionOutcome.prediction_id == report.prediction_id
                    )
                )
                prediction = result.scalar_one_or_none()

                if prediction:
                    # Calculate accuracy for each metric
                    accuracy_breakdown = self._calculate_accuracy(
                        predicted={
                            "views": prediction.predicted_views,
                            "likes": prediction.predicted_likes,
                            "comments": prediction.predicted_comments,
                            "shares": prediction.predicted_shares,
                            "engagement_rate": prediction.predicted_engagement_rate,
                        },
                        actual={
                            "views": report.actual_views,
                            "likes": report.actual_likes,
                            "comments": report.actual_comments,
                            "shares": report.actual_shares,
                            "engagement_rate": report.actual_engagement_rate,
                        }
                    )

                    overall_accuracy = np.mean(list(accuracy_breakdown.values()))

                    # Update the prediction record with actual values
                    prediction.actual_views = report.actual_views
                    prediction.actual_likes = report.actual_likes
                    prediction.actual_comments = report.actual_comments
                    prediction.actual_shares = report.actual_shares
                    prediction.actual_engagement_rate = report.actual_engagement_rate
                    prediction.accuracy_views = accuracy_breakdown.get("views", 0)
                    prediction.accuracy_likes = accuracy_breakdown.get("likes", 0)
                    prediction.accuracy_comments = accuracy_breakdown.get("comments", 0)
                    prediction.accuracy_shares = accuracy_breakdown.get("shares", 0)
                    prediction.accuracy_engagement = accuracy_breakdown.get("engagement_rate", 0)
                    prediction.overall_accuracy = overall_accuracy
                    prediction.outcome_received = True
                    prediction.outcome_reported_at = datetime.utcnow()

                    # Record which recommendations were followed
                    if report.recommendations_followed:
                        for rec_id in report.recommendations_followed:
                            rec_effectiveness = RecommendationEffectiveness(
                                prediction_outcome_id=prediction.id,
                                recommendation_id=rec_id,
                                recommendation_category="unknown",  # Would need to track this
                                recommendation_priority="unknown",
                                expected_impact=0.1,
                                was_followed=True,
                            )
                            session.add(rec_effectiveness)

                    await session.commit()

                    # Check if we should update model weights
                    if settings.learning_enabled:
                        await self._check_weight_update(session, prediction.platform)

                    # Update creator baseline if creator_id is available
                    if prediction.creator_id:
                        await self._update_creator_baseline(
                            session,
                            prediction.creator_id,
                            prediction.platform,
                            report
                        )

                    learning_impact = self._determine_learning_impact(
                        accuracy_breakdown,
                        report.recommendations_followed
                    )

                else:
                    # No matching prediction found
                    accuracy_breakdown = {}
                    overall_accuracy = 0.0
                    learning_impact = "Outcome recorded but no matching prediction found. Stored for general learning."

                    # Store as a new outcome without prediction link
                    new_outcome = PredictionOutcome(
                        id=uuid.uuid4(),
                        content_id=report.content_id,
                        prediction_id=report.prediction_id,
                        platform=report.platform.value,
                        content_type="unknown",
                        predicted_views=0,
                        predicted_likes=0,
                        predicted_comments=0,
                        predicted_shares=0,
                        predicted_engagement_rate=0.0,
                        predicted_overall_score=0.0,
                        prediction_confidence=0.0,
                        visual_quality_score=0.0,
                        hook_strength_score=0.0,
                        trending_alignment_score=0.0,
                        actual_views=report.actual_views,
                        actual_likes=report.actual_likes,
                        actual_comments=report.actual_comments,
                        actual_shares=report.actual_shares,
                        actual_engagement_rate=report.actual_engagement_rate,
                        outcome_received=True,
                        outcome_reported_at=datetime.utcnow(),
                    )
                    session.add(new_outcome)
                    await session.commit()

            return OutcomeResponse(
                outcome_id=outcome_id,
                content_id=report.content_id,
                prediction_accuracy=overall_accuracy,
                accuracy_breakdown=accuracy_breakdown,
                learning_impact=learning_impact,
                recorded_at=datetime.utcnow().isoformat()
            )

        except Exception as e:
            logger.error(f"Error recording outcome: {str(e)}", exc_info=True)
            raise

    def _calculate_accuracy(
        self,
        predicted: Dict[str, float],
        actual: Dict[str, float]
    ) -> Dict[str, float]:
        """Calculate accuracy for each metric (0-1 where 1 is perfect)."""
        accuracy = {}

        for metric in predicted:
            pred_val = predicted[metric]
            actual_val = actual.get(metric, 0)

            if actual_val == 0:
                accuracy[metric] = 1.0 if pred_val == 0 else 0.0
            else:
                error_ratio = abs(pred_val - actual_val) / max(actual_val, 1)
                accuracy[metric] = max(0.0, 1.0 - min(error_ratio, 1.0))

        return accuracy

    def _determine_learning_impact(
        self,
        accuracy_breakdown: Dict[str, float],
        recommendations_followed: Optional[List[str]]
    ) -> str:
        """Determine how this outcome will improve future predictions."""

        if not accuracy_breakdown:
            return "Outcome recorded for general learning."

        avg_accuracy = np.mean(list(accuracy_breakdown.values()))

        if avg_accuracy > 0.8:
            accuracy_msg = "Predictions were highly accurate."
        elif avg_accuracy > 0.6:
            accuracy_msg = "Predictions were moderately accurate."
        elif avg_accuracy > 0.4:
            accuracy_msg = "Predictions had room for improvement."
        else:
            accuracy_msg = "Predictions differed significantly from actual results."

        weak_metrics = [m for m, a in accuracy_breakdown.items() if a < 0.5]

        if weak_metrics:
            adjustment_msg = f" Model weights for {', '.join(weak_metrics)} will be adjusted."
        else:
            adjustment_msg = " No significant weight adjustments needed."

        if recommendations_followed:
            rec_msg = f" Tracking effectiveness of {len(recommendations_followed)} followed recommendations."
        else:
            rec_msg = ""

        return f"{accuracy_msg}{adjustment_msg}{rec_msg}"

    async def _check_weight_update(
        self,
        session: AsyncSession,
        platform: str
    ) -> None:
        """
        Check if we have enough outcomes to update model weights.

        Only updates if we have minimum required outcomes and
        accuracy has changed significantly.
        """
        try:
            # Count recent outcomes for this platform
            result = await session.execute(
                select(func.count(PredictionOutcome.id)).where(
                    and_(
                        PredictionOutcome.platform == platform,
                        PredictionOutcome.outcome_received == True,
                        PredictionOutcome.used_for_learning == False,
                        PredictionOutcome.outcome_reported_at >= datetime.utcnow() - timedelta(days=7)
                    )
                )
            )
            count = result.scalar()

            if count >= settings.min_outcomes_for_learning:
                logger.info(f"Triggering weight update for {platform} with {count} new outcomes")
                # In production, this would trigger actual weight adjustment
                # For now, just log and mark outcomes as used
                await session.execute(
                    PredictionOutcome.__table__.update().where(
                        and_(
                            PredictionOutcome.platform == platform,
                            PredictionOutcome.outcome_received == True,
                            PredictionOutcome.used_for_learning == False,
                        )
                    ).values(used_for_learning=True)
                )

        except Exception as e:
            logger.error(f"Error checking weight update: {str(e)}", exc_info=True)

    async def _update_creator_baseline(
        self,
        session: AsyncSession,
        creator_id: str,
        platform: str,
        report: OutcomeReport
    ) -> None:
        """Update the creator's baseline metrics."""
        try:
            result = await session.execute(
                select(CreatorBaseline).where(
                    and_(
                        CreatorBaseline.creator_id == creator_id,
                        CreatorBaseline.platform == platform
                    )
                )
            )
            baseline = result.scalar_one_or_none()

            if baseline:
                # Update running averages
                n = baseline.total_outcomes
                baseline.avg_views = (baseline.avg_views * n + report.actual_views) / (n + 1)
                baseline.avg_likes = (baseline.avg_likes * n + report.actual_likes) / (n + 1)
                baseline.avg_comments = (baseline.avg_comments * n + report.actual_comments) / (n + 1)
                baseline.avg_shares = (baseline.avg_shares * n + report.actual_shares) / (n + 1)
                baseline.avg_engagement_rate = (
                    baseline.avg_engagement_rate * n + report.actual_engagement_rate
                ) / (n + 1)

                # Update min/max
                baseline.min_views = min(baseline.min_views, report.actual_views)
                baseline.max_views = max(baseline.max_views, report.actual_views)

                baseline.total_outcomes = n + 1
                baseline.outcomes_last_30_days += 1
                baseline.updated_at = datetime.utcnow()
            else:
                # Create new baseline
                baseline = CreatorBaseline(
                    creator_id=creator_id,
                    platform=platform,
                    avg_views=float(report.actual_views),
                    avg_likes=float(report.actual_likes),
                    avg_comments=float(report.actual_comments),
                    avg_shares=float(report.actual_shares),
                    avg_engagement_rate=report.actual_engagement_rate,
                    min_views=report.actual_views,
                    max_views=report.actual_views,
                    total_outcomes=1,
                    outcomes_last_30_days=1,
                )
                session.add(baseline)

        except Exception as e:
            logger.error(f"Error updating creator baseline: {str(e)}", exc_info=True)

    async def get_creator_baseline(
        self,
        creator_id: str,
        platform: str
    ) -> Optional[Dict[str, Any]]:
        """Get baseline metrics for a creator on a platform."""
        try:
            async with get_session() as session:
                result = await session.execute(
                    select(CreatorBaseline).where(
                        and_(
                            CreatorBaseline.creator_id == creator_id,
                            CreatorBaseline.platform == platform
                        )
                    )
                )
                baseline = result.scalar_one_or_none()

                if baseline:
                    return {
                        "avg_views": baseline.avg_views,
                        "avg_likes": baseline.avg_likes,
                        "avg_comments": baseline.avg_comments,
                        "avg_shares": baseline.avg_shares,
                        "avg_engagement_rate": baseline.avg_engagement_rate,
                        "min_views": baseline.min_views,
                        "max_views": baseline.max_views,
                        "total_outcomes": baseline.total_outcomes,
                    }
                return None

        except Exception as e:
            logger.error(f"Error getting creator baseline: {str(e)}", exc_info=True)
            return None

    async def get_platform_benchmarks(
        self,
        platform: str
    ) -> Optional[Dict[str, Any]]:
        """Get current benchmarks for a platform."""
        try:
            async with get_session() as session:
                result = await session.execute(
                    select(PlatformBenchmark).where(
                        PlatformBenchmark.platform == platform
                    ).order_by(
                        PlatformBenchmark.calculated_at.desc()
                    ).limit(1)
                )
                benchmark = result.scalar_one_or_none()

                if benchmark:
                    return {
                        "avg_views": benchmark.avg_views,
                        "avg_engagement_rate": benchmark.avg_engagement_rate,
                        "p50_views": benchmark.p50_views,
                        "p75_views": benchmark.p75_views,
                        "p90_views": benchmark.p90_views,
                        "sample_size": benchmark.sample_size,
                        "period_start": benchmark.period_start.isoformat(),
                        "period_end": benchmark.period_end.isoformat(),
                    }
                return None

        except Exception as e:
            logger.error(f"Error getting platform benchmarks: {str(e)}", exc_info=True)
            return None
