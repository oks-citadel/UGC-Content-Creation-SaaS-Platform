import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import numpy as np
import httpx
from PIL import Image
import io

from ..config import settings
from ..models import (
    PredictionRequest,
    PredictionResponse,
    EngagementPrediction,
    ViralityScore,
    ContentAnalysis,
    OptimizationResponse,
    OptimizationSuggestion,
    ComparisonRequest,
    ComparisonResponse,
    VariantComparison,
    Platform,
    ContentType,
    DetailedRecommendationRequest,
    DetailedRecommendationResponse,
    DetailedRecommendation as DetailedRecommendationModel,
    ActionStep as ActionStepModel,
    RecommendationTemplate,
    RecommendationCategory,
    RecommendationPriority,
    ImplementationDifficulty,
    OutcomeReport,
    OutcomeResponse,
)
from .ml_models import MLModels
from .recommendation_engine import RecommendationEngine, DetailedRecommendation, ActionStep, Template
from .learning_service import LearningService
from ..config import settings

logger = logging.getLogger(__name__)


class PerformancePredictorService:
    """Service for predicting content performance and engagement."""

    def __init__(self):
        self.ml_models = MLModels()
        self.recommendation_engine = RecommendationEngine()
        self.learning_service = LearningService() if settings.learning_enabled else None
        self._prediction_cache: Dict[str, Any] = {}  # In-memory cache for quick lookups

    async def predict_engagement(self, request: PredictionRequest) -> PredictionResponse:
        """
        Predict engagement metrics for content before publishing.

        Analyzes:
        - Visual quality
        - Content relevance
        - Emotional impact
        - Trending alignment
        - Hook strength

        Returns predicted views, likes, comments, shares, and engagement rate.
        """
        try:
            content_id = str(uuid.uuid4())
            logger.info(f"Predicting engagement for content {content_id} on {request.platform}")

            # Download and analyze content
            content_data = await self._download_content(request.content_url)

            # Extract features
            visual_features = await self._extract_visual_features(content_data, request.content_type)
            text_features = await self._extract_text_features(request.caption, request.hashtags)
            temporal_features = self._extract_temporal_features(request.posting_time)

            # Analyze content quality
            content_analysis = await self._analyze_content(
                visual_features,
                text_features,
                request
            )

            # Predict engagement metrics
            engagement = await self._predict_engagement_metrics(
                visual_features,
                text_features,
                temporal_features,
                request.platform,
                request.creator_metrics
            )

            # Predict virality
            virality = await self._predict_virality(
                content_analysis,
                engagement,
                request.platform
            )

            # Calculate overall score
            overall_score = self._calculate_overall_score(
                content_analysis,
                engagement,
                virality
            )

            return PredictionResponse(
                content_id=content_id,
                platform=request.platform,
                engagement_prediction=engagement,
                virality_score=virality,
                content_analysis=content_analysis,
                overall_score=overall_score,
                analyzed_at=datetime.utcnow().isoformat()
            )

        except Exception as e:
            logger.error(f"Error predicting engagement: {str(e)}", exc_info=True)
            raise

    async def predict_virality(self, request: PredictionRequest) -> ViralityScore:
        """
        Predict viral potential of content.

        Considers:
        - Trending topics alignment
        - Emotional resonance
        - Shareability factors
        - Timing optimization
        - Creator influence
        """
        try:
            logger.info(f"Predicting virality for content on {request.platform}")

            # Download and analyze content
            content_data = await self._download_content(request.content_url)
            visual_features = await self._extract_visual_features(content_data, request.content_type)
            text_features = await self._extract_text_features(request.caption, request.hashtags)

            # Analyze content
            content_analysis = await self._analyze_content(visual_features, text_features, request)

            # Predict engagement for virality calculation
            engagement = await self._predict_engagement_metrics(
                visual_features,
                text_features,
                {},
                request.platform,
                request.creator_metrics
            )

            # Predict virality
            virality = await self._predict_virality(
                content_analysis,
                engagement,
                request.platform
            )

            return virality

        except Exception as e:
            logger.error(f"Error predicting virality: {str(e)}", exc_info=True)
            raise

    async def get_optimization_suggestions(
        self,
        request: PredictionRequest
    ) -> OptimizationResponse:
        """
        Get specific suggestions to optimize content performance.

        Provides actionable recommendations for:
        - Visual improvements
        - Caption optimization
        - Hashtag strategy
        - Posting timing
        - Hook enhancement
        """
        try:
            content_id = str(uuid.uuid4())
            logger.info(f"Generating optimization suggestions for content {content_id}")

            # Get current prediction
            prediction = await self.predict_engagement(request)

            # Generate suggestions
            suggestions = await self._generate_optimization_suggestions(
                prediction.content_analysis,
                prediction.engagement_prediction,
                request
            )

            # Estimate optimized score
            optimized_score = self._estimate_optimized_score(
                prediction.overall_score,
                suggestions
            )

            # Prioritize actions
            priority_actions = self._prioritize_actions(suggestions)

            return OptimizationResponse(
                content_id=content_id,
                current_score=prediction.overall_score,
                optimized_score_potential=optimized_score,
                suggestions=suggestions,
                priority_actions=priority_actions
            )

        except Exception as e:
            logger.error(f"Error generating optimization suggestions: {str(e)}", exc_info=True)
            raise

    async def compare_variants(self, request: ComparisonRequest) -> ComparisonResponse:
        """
        Compare two content variants to predict which will perform better.

        Useful for A/B testing decisions before publishing.
        """
        try:
            comparison_id = str(uuid.uuid4())
            logger.info(f"Comparing variants {comparison_id}")

            # Predict performance for both variants
            prediction_a = await self.predict_engagement(request.variant_a)
            prediction_b = await self.predict_engagement(request.variant_b)

            # Compare metrics
            comparison = self._compare_predictions(
                prediction_a,
                prediction_b,
                request.comparison_metrics
            )

            # Detailed metrics
            detailed_metrics = {
                "variant_a": {
                    "overall_score": prediction_a.overall_score,
                    "engagement_rate": prediction_a.engagement_prediction.engagement_rate,
                    "viral_probability": prediction_a.virality_score.viral_probability,
                    "quality_score": prediction_a.content_analysis.visual_quality_score
                },
                "variant_b": {
                    "overall_score": prediction_b.overall_score,
                    "engagement_rate": prediction_b.engagement_prediction.engagement_rate,
                    "viral_probability": prediction_b.virality_score.viral_probability,
                    "quality_score": prediction_b.content_analysis.visual_quality_score
                }
            }

            return ComparisonResponse(
                comparison_id=comparison_id,
                comparison=comparison,
                detailed_metrics=detailed_metrics,
                analyzed_at=datetime.utcnow().isoformat()
            )

        except Exception as e:
            logger.error(f"Error comparing variants: {str(e)}", exc_info=True)
            raise

    # Private helper methods

    async def _download_content(self, url: str) -> bytes:
        """Download content from URL."""
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content

    async def _extract_visual_features(
        self,
        content_data: bytes,
        content_type: ContentType
    ) -> Dict[str, Any]:
        """Extract visual features from content using CLIP."""
        features = await self.ml_models.extract_visual_features(content_data)
        return features

    async def _extract_text_features(
        self,
        caption: Optional[str],
        hashtags: List[str]
    ) -> Dict[str, Any]:
        """Extract features from text content."""
        features = await self.ml_models.extract_text_features(caption, hashtags)
        return features

    def _extract_temporal_features(self, posting_time: Optional[str]) -> Dict[str, Any]:
        """Extract temporal features from posting time."""
        if not posting_time:
            return {}

        # Parse posting time and extract features
        # Day of week, time of day, season, etc.
        return {
            "day_of_week": 0,  # Monday = 0
            "hour_of_day": 12,
            "is_weekend": False,
            "is_peak_time": True
        }

    async def _analyze_content(
        self,
        visual_features: Dict[str, Any],
        text_features: Dict[str, Any],
        request: PredictionRequest
    ) -> ContentAnalysis:
        """Analyze content quality and attributes."""

        # Visual quality score (0-1)
        visual_quality = visual_features.get("quality_score", 0.7)

        # Content relevance (how relevant to target audience)
        content_relevance = await self.ml_models.calculate_relevance_score(
            visual_features,
            text_features,
            request.target_audience
        )

        # Emotional impact
        emotional_impact = await self.ml_models.analyze_emotional_impact(
            visual_features,
            text_features
        )

        # Trending alignment
        trending_alignment = await self.ml_models.calculate_trending_score(
            text_features,
            request.platform
        )

        # Hook strength (first 3 seconds engagement)
        hook_strength = visual_features.get("hook_strength", 0.6)

        # Pacing score
        pacing_score = visual_features.get("pacing_score", 0.7)

        # Check for CTA
        cta_present = text_features.get("has_call_to_action", False)

        return ContentAnalysis(
            visual_quality_score=visual_quality,
            content_relevance_score=content_relevance,
            emotional_impact_score=emotional_impact,
            trending_alignment_score=trending_alignment,
            hook_strength=hook_strength,
            pacing_score=pacing_score,
            call_to_action_present=cta_present
        )

    async def _predict_engagement_metrics(
        self,
        visual_features: Dict[str, Any],
        text_features: Dict[str, Any],
        temporal_features: Dict[str, Any],
        platform: Platform,
        creator_metrics: Optional[Dict[str, float]]
    ) -> EngagementPrediction:
        """Predict specific engagement metrics."""

        # Base predictions from ML models
        predictions = await self.ml_models.predict_metrics(
            visual_features,
            text_features,
            temporal_features,
            platform
        )

        # Adjust based on creator metrics if provided
        if creator_metrics:
            follower_count = creator_metrics.get("follower_count", 1000)
            avg_engagement_rate = creator_metrics.get("avg_engagement_rate", 0.03)

            # Scale predictions based on creator influence
            scale_factor = min(follower_count / 10000, 10)  # Cap at 10x
            predictions["views"] = int(predictions["views"] * scale_factor)
            predictions["likes"] = int(predictions["likes"] * scale_factor)
            predictions["comments"] = int(predictions["comments"] * scale_factor)
            predictions["shares"] = int(predictions["shares"] * scale_factor)

        # Calculate engagement rate
        views = max(predictions["views"], 1)
        total_engagements = (
            predictions["likes"] +
            predictions["comments"] +
            predictions["shares"]
        )
        engagement_rate = min(total_engagements / views, 1.0)

        # Generate reasoning
        reasoning = self._generate_engagement_reasoning(predictions, engagement_rate)

        return EngagementPrediction(
            predicted_views=predictions["views"],
            predicted_likes=predictions["likes"],
            predicted_comments=predictions["comments"],
            predicted_shares=predictions["shares"],
            engagement_rate=engagement_rate,
            confidence_score=predictions.get("confidence", 0.75),
            reasoning=reasoning
        )

    async def _predict_virality(
        self,
        content_analysis: ContentAnalysis,
        engagement: EngagementPrediction,
        platform: Platform
    ) -> ViralityScore:
        """Predict viral potential."""

        # Calculate viral factors
        viral_factors = {
            "emotional_impact": content_analysis.emotional_impact_score,
            "trending_alignment": content_analysis.trending_alignment_score,
            "hook_strength": content_analysis.hook_strength,
            "shareability": min(engagement.predicted_shares / max(engagement.predicted_views, 1) * 100, 1.0),
            "engagement_velocity": engagement.engagement_rate
        }

        # Calculate overall viral probability
        viral_probability = np.mean(list(viral_factors.values()))

        # Predict reach
        base_reach = engagement.predicted_views
        if viral_probability > settings.viral_potential_threshold:
            predicted_reach = int(base_reach * (1 + viral_probability * 10))
        else:
            predicted_reach = base_reach

        # Estimate peak time
        peak_time_estimate = "24-48 hours" if viral_probability > 0.7 else "48-72 hours"

        return ViralityScore(
            viral_probability=viral_probability,
            viral_factors=viral_factors,
            predicted_reach=predicted_reach,
            peak_time_estimate=peak_time_estimate,
            confidence_score=engagement.confidence_score
        )

    def _calculate_overall_score(
        self,
        content_analysis: ContentAnalysis,
        engagement: EngagementPrediction,
        virality: ViralityScore
    ) -> float:
        """Calculate overall content score (0-100)."""

        scores = [
            content_analysis.visual_quality_score * settings.visual_quality_weight,
            content_analysis.content_relevance_score * settings.content_relevance_weight,
            content_analysis.emotional_impact_score * settings.emotional_impact_weight,
            content_analysis.trending_alignment_score * settings.trending_alignment_weight,
            engagement.engagement_rate * 0.2,
            virality.viral_probability * 0.15
        ]

        overall = sum(scores) * 100
        return min(overall, 100.0)

    async def _generate_optimization_suggestions(
        self,
        content_analysis: ContentAnalysis,
        engagement: EngagementPrediction,
        request: PredictionRequest
    ) -> List[OptimizationSuggestion]:
        """Generate actionable optimization suggestions."""

        suggestions = []

        # Visual quality suggestions
        if content_analysis.visual_quality_score < 0.7:
            suggestions.append(OptimizationSuggestion(
                category="visual_quality",
                priority="high",
                suggestion="Improve video resolution and lighting. Consider using better equipment or natural lighting.",
                expected_impact=0.15,
                implementation_difficulty="medium"
            ))

        # Hook strength suggestions
        if content_analysis.hook_strength < 0.6:
            suggestions.append(OptimizationSuggestion(
                category="hook",
                priority="high",
                suggestion="Strengthen the opening 3 seconds with a compelling visual or statement to reduce drop-off.",
                expected_impact=0.20,
                implementation_difficulty="easy"
            ))

        # CTA suggestions
        if not content_analysis.call_to_action_present:
            suggestions.append(OptimizationSuggestion(
                category="call_to_action",
                priority="medium",
                suggestion="Add a clear call-to-action (e.g., 'Follow for more', 'Link in bio', 'Comment below').",
                expected_impact=0.10,
                implementation_difficulty="easy"
            ))

        # Hashtag optimization
        if len(request.hashtags) < 3:
            suggestions.append(OptimizationSuggestion(
                category="hashtags",
                priority="medium",
                suggestion="Add more relevant hashtags (3-5 recommended) to improve discoverability.",
                expected_impact=0.12,
                implementation_difficulty="easy"
            ))

        # Trending alignment
        if content_analysis.trending_alignment_score < 0.5:
            suggestions.append(OptimizationSuggestion(
                category="trending",
                priority="high",
                suggestion="Incorporate current trending topics, sounds, or formats to increase algorithmic favor.",
                expected_impact=0.18,
                implementation_difficulty="medium"
            ))

        # Pacing suggestions
        if content_analysis.pacing_score < 0.6:
            suggestions.append(OptimizationSuggestion(
                category="pacing",
                priority="medium",
                suggestion="Improve video pacing with quicker cuts and scene transitions to maintain attention.",
                expected_impact=0.13,
                implementation_difficulty="medium"
            ))

        return sorted(suggestions, key=lambda x: x.expected_impact, reverse=True)

    def _estimate_optimized_score(
        self,
        current_score: float,
        suggestions: List[OptimizationSuggestion]
    ) -> float:
        """Estimate potential score after optimizations."""

        # Sum expected impacts from high priority suggestions
        high_priority_impact = sum(
            s.expected_impact for s in suggestions if s.priority == "high"
        )

        # Apply diminishing returns
        potential_gain = high_priority_impact * 100 * 0.7  # 70% of theoretical max

        return min(current_score + potential_gain, 100.0)

    def _prioritize_actions(
        self,
        suggestions: List[OptimizationSuggestion]
    ) -> List[str]:
        """Get top priority actions."""

        # Sort by impact and ease of implementation
        def score_suggestion(s: OptimizationSuggestion) -> float:
            difficulty_scores = {"easy": 1.0, "medium": 0.7, "hard": 0.4}
            return s.expected_impact * difficulty_scores[s.implementation_difficulty]

        sorted_suggestions = sorted(suggestions, key=score_suggestion, reverse=True)

        return [s.suggestion for s in sorted_suggestions[:3]]

    def _compare_predictions(
        self,
        pred_a: PredictionResponse,
        pred_b: PredictionResponse,
        metrics: List[str]
    ) -> VariantComparison:
        """Compare two predictions."""

        scores_a = []
        scores_b = []

        if "engagement" in metrics:
            scores_a.append(pred_a.engagement_prediction.engagement_rate)
            scores_b.append(pred_b.engagement_prediction.engagement_rate)

        if "virality" in metrics:
            scores_a.append(pred_a.virality_score.viral_probability)
            scores_b.append(pred_b.virality_score.viral_probability)

        if "quality" in metrics:
            scores_a.append(pred_a.content_analysis.visual_quality_score)
            scores_b.append(pred_b.content_analysis.visual_quality_score)

        avg_a = np.mean(scores_a) * 100
        avg_b = np.mean(scores_b) * 100

        # Determine winner
        diff = abs(avg_a - avg_b)
        if diff < 5:  # Less than 5% difference
            winner = "tie"
        else:
            winner = "variant_a" if avg_a > avg_b else "variant_b"

        # Calculate confidence
        confidence = min(diff / 100, 1.0)

        # Identify key differences
        key_differences = self._identify_key_differences(pred_a, pred_b)

        # Generate recommendation
        recommendation = self._generate_comparison_recommendation(
            winner,
            key_differences,
            avg_a,
            avg_b
        )

        return VariantComparison(
            variant_a_score=avg_a,
            variant_b_score=avg_b,
            winner=winner,
            confidence=confidence,
            key_differences=key_differences,
            recommendation=recommendation
        )

    def _identify_key_differences(
        self,
        pred_a: PredictionResponse,
        pred_b: PredictionResponse
    ) -> List[str]:
        """Identify key differences between variants."""

        differences = []

        # Compare visual quality
        quality_diff = abs(
            pred_a.content_analysis.visual_quality_score -
            pred_b.content_analysis.visual_quality_score
        )
        if quality_diff > 0.1:
            better = "A" if pred_a.content_analysis.visual_quality_score > pred_b.content_analysis.visual_quality_score else "B"
            differences.append(f"Variant {better} has significantly better visual quality")

        # Compare engagement
        engagement_diff = abs(
            pred_a.engagement_prediction.engagement_rate -
            pred_b.engagement_prediction.engagement_rate
        )
        if engagement_diff > 0.05:
            better = "A" if pred_a.engagement_prediction.engagement_rate > pred_b.engagement_prediction.engagement_rate else "B"
            differences.append(f"Variant {better} is predicted to have {engagement_diff*100:.1f}% higher engagement")

        # Compare virality
        viral_diff = abs(
            pred_a.virality_score.viral_probability -
            pred_b.virality_score.viral_probability
        )
        if viral_diff > 0.1:
            better = "A" if pred_a.virality_score.viral_probability > pred_b.virality_score.viral_probability else "B"
            differences.append(f"Variant {better} has higher viral potential")

        return differences[:3]  # Top 3 differences

    def _generate_comparison_recommendation(
        self,
        winner: str,
        differences: List[str],
        score_a: float,
        score_b: float
    ) -> str:
        """Generate recommendation based on comparison."""

        if winner == "tie":
            return "Both variants are predicted to perform similarly. Consider testing both or combining their best elements."

        winning_variant = "A" if winner == "variant_a" else "B"
        score = score_a if winner == "variant_a" else score_b

        return f"Recommend publishing Variant {winning_variant} (score: {score:.1f}/100). {differences[0] if differences else 'Overall metrics favor this variant.'}"

    def _generate_engagement_reasoning(
        self,
        predictions: Dict[str, int],
        engagement_rate: float
    ) -> str:
        """Generate human-readable reasoning for predictions."""

        if engagement_rate > 0.1:
            quality = "excellent"
        elif engagement_rate > 0.05:
            quality = "good"
        elif engagement_rate > 0.02:
            quality = "moderate"
        else:
            quality = "low"

        return (
            f"Predicted {quality} engagement based on content quality, trending alignment, "
            f"and platform-specific factors. Expected {predictions['views']:,} views with "
            f"{engagement_rate*100:.1f}% engagement rate."
        )

    # =========================================================================
    # Advanced Recommendation Methods
    # =========================================================================

    async def get_detailed_recommendations(
        self,
        request: DetailedRecommendationRequest
    ) -> DetailedRecommendationResponse:
        """
        Get detailed, actionable recommendations for content optimization.

        Uses the advanced recommendation engine to provide:
        - Specific action steps
        - Platform-specific strategies
        - Templates and examples
        - Expected impact calculations
        """
        try:
            content_id = str(uuid.uuid4())
            logger.info(f"Generating detailed recommendations for content {content_id}")

            # Convert request to PredictionRequest for analysis
            prediction_request = PredictionRequest(
                content_url=request.content_url,
                content_type=request.content_type,
                platform=request.platform,
                caption=request.caption,
                hashtags=request.hashtags,
                target_audience=request.target_audience,
                creator_metrics=request.creator_metrics,
                posting_time=request.posting_time
            )

            # Get prediction first
            prediction = await self.predict_engagement(prediction_request)

            # Store prediction for later outcome learning
            self._prediction_cache[content_id] = {
                "prediction": prediction,
                "request": request,
                "timestamp": datetime.utcnow().isoformat()
            }

            # Store prediction in database for persistent learning
            if self.learning_service:
                try:
                    await self.learning_service.store_prediction(
                        prediction_id=content_id,
                        content_id=content_id,
                        platform=request.platform,
                        content_type=request.content_type.value,
                        predicted_metrics={
                            "views": prediction.engagement_prediction.predicted_views,
                            "likes": prediction.engagement_prediction.predicted_likes,
                            "comments": prediction.engagement_prediction.predicted_comments,
                            "shares": prediction.engagement_prediction.predicted_shares,
                            "engagement_rate": prediction.engagement_prediction.engagement_rate,
                            "overall_score": prediction.overall_score,
                            "confidence": prediction.engagement_prediction.confidence_score,
                        },
                        content_analysis={
                            "visual_quality_score": prediction.content_analysis.visual_quality_score,
                            "hook_strength": prediction.content_analysis.hook_strength,
                            "trending_alignment_score": prediction.content_analysis.trending_alignment_score,
                            "caption_score": prediction.content_analysis.content_relevance_score,
                        },
                        creator_id=request.creator_metrics.get("creator_id") if request.creator_metrics else None,
                        creator_followers=int(request.creator_metrics.get("follower_count", 0)) if request.creator_metrics else None,
                    )
                except Exception as e:
                    logger.warning(f"Failed to store prediction in database: {e}")

            # Generate detailed recommendations using the engine
            engine_response = self.recommendation_engine.generate_recommendations(
                content_analysis=prediction.content_analysis,
                request=prediction_request,
                current_score=prediction.overall_score
            )

            # Convert engine response to Pydantic models
            recommendations = [
                self._convert_recommendation(rec)
                for rec in engine_response.recommendations
            ]

            return DetailedRecommendationResponse(
                content_id=content_id,
                platform=request.platform,
                current_overall_score=engine_response.current_overall_score,
                potential_score=engine_response.potential_score,
                recommendations=recommendations,
                priority_summary=engine_response.priority_summary,
                quick_wins=engine_response.quick_wins,
                high_impact_actions=engine_response.high_impact_actions,
                estimated_total_time=engine_response.estimated_total_time,
                analyzed_at=datetime.utcnow().isoformat()
            )

        except Exception as e:
            logger.error(f"Error generating detailed recommendations: {str(e)}", exc_info=True)
            raise

    def _convert_recommendation(self, rec: DetailedRecommendation) -> DetailedRecommendationModel:
        """Convert engine recommendation dataclass to Pydantic model."""
        return DetailedRecommendationModel(
            id=rec.id,
            category=RecommendationCategory(rec.category.value),
            priority=RecommendationPriority(rec.priority.value),
            title=rec.title,
            description=rec.description,
            current_score=rec.current_score,
            target_score=rec.target_score,
            expected_impact=rec.expected_impact,
            difficulty=ImplementationDifficulty(rec.difficulty.value),
            action_steps=[
                ActionStepModel(
                    step_number=step.step_number,
                    action=step.action,
                    details=step.details,
                    time_estimate=step.time_estimate
                )
                for step in rec.action_steps
            ],
            templates=[
                RecommendationTemplate(
                    name=t.name,
                    example=t.example,
                    platform_notes=t.platform_notes
                )
                for t in rec.templates
            ],
            platform_specific=rec.platform_specific,
            metrics_affected=rec.metrics_affected,
            estimated_time=rec.estimated_time,
            reasoning=rec.reasoning
        )

    # =========================================================================
    # Outcome Learning Methods
    # =========================================================================

    async def record_outcome(self, request: OutcomeReport) -> OutcomeResponse:
        """
        Record actual content performance for learning.

        Compares predicted vs actual metrics to:
        - Calculate prediction accuracy
        - Track recommendation effectiveness
        - Improve future predictions
        """
        try:
            logger.info(f"Recording outcome for content {request.content_id}")

            # Use LearningService for database-backed learning if available
            if self.learning_service:
                try:
                    response = await self.learning_service.record_outcome(request)
                    return response
                except Exception as e:
                    logger.warning(f"Database learning failed, falling back to cache: {e}")

            # Fallback to in-memory cache if learning service unavailable
            outcome_id = str(uuid.uuid4())
            cached = self._prediction_cache.get(request.content_id)

            if cached:
                prediction = cached["prediction"]

                # Calculate accuracy for each metric
                accuracy_breakdown = self._calculate_accuracy(
                    predicted={
                        "views": prediction.engagement_prediction.predicted_views,
                        "likes": prediction.engagement_prediction.predicted_likes,
                        "comments": prediction.engagement_prediction.predicted_comments,
                        "shares": prediction.engagement_prediction.predicted_shares,
                        "engagement_rate": prediction.engagement_prediction.engagement_rate
                    },
                    actual={
                        "views": request.actual_views,
                        "likes": request.actual_likes,
                        "comments": request.actual_comments,
                        "shares": request.actual_shares,
                        "engagement_rate": request.actual_engagement_rate
                    }
                )

                prediction_accuracy = np.mean(list(accuracy_breakdown.values()))

                learning_impact = self._determine_learning_impact(
                    accuracy_breakdown,
                    request.recommendations_followed
                )
            else:
                accuracy_breakdown = {}
                prediction_accuracy = 0.0
                learning_impact = "Outcome recorded for general learning. No matching prediction found in cache."

            return OutcomeResponse(
                outcome_id=outcome_id,
                content_id=request.content_id,
                prediction_accuracy=prediction_accuracy,
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
            actual_val = actual[metric]

            if actual_val == 0:
                # Avoid division by zero
                accuracy[metric] = 1.0 if pred_val == 0 else 0.0
            else:
                # Calculate percentage accuracy (capped at 1.0)
                error_ratio = abs(pred_val - actual_val) / max(actual_val, 1)
                accuracy[metric] = max(0.0, 1.0 - error_ratio)

        return accuracy

    def _determine_learning_impact(
        self,
        accuracy_breakdown: Dict[str, float],
        recommendations_followed: Optional[List[str]]
    ) -> str:
        """Determine how this outcome will improve future predictions."""

        avg_accuracy = np.mean(list(accuracy_breakdown.values())) if accuracy_breakdown else 0

        if avg_accuracy > 0.8:
            accuracy_msg = "Predictions were highly accurate."
        elif avg_accuracy > 0.6:
            accuracy_msg = "Predictions were moderately accurate."
        elif avg_accuracy > 0.4:
            accuracy_msg = "Predictions had room for improvement."
        else:
            accuracy_msg = "Predictions differed significantly from actual results."

        # Identify which metrics need adjustment
        weak_metrics = [
            metric for metric, acc in accuracy_breakdown.items()
            if acc < 0.5
        ]

        if weak_metrics:
            adjustment_msg = f" Model weights for {', '.join(weak_metrics)} will be adjusted."
        else:
            adjustment_msg = " No significant weight adjustments needed."

        # Recommendation effectiveness
        if recommendations_followed:
            rec_msg = f" Tracking effectiveness of {len(recommendations_followed)} followed recommendations."
        else:
            rec_msg = ""

        return f"{accuracy_msg}{adjustment_msg}{rec_msg}"
