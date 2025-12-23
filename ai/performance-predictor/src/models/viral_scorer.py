"""
Viral Scorer Model.

Calculates viral potential score (0-100) for content based on
multiple factors including trending alignment, emotional resonance,
shareability, and platform-specific viral indicators.
"""

import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import numpy as np
from datetime import datetime
import joblib
import os

try:
    import xgboost as xgb
except ImportError:
    xgb = None

from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


@dataclass
class ViralScoreResult:
    """Viral potential scoring result."""
    viral_score: float  # 0-100
    viral_probability: float  # 0-1
    viral_factors: Dict[str, float]
    predicted_reach_multiplier: float
    peak_time_estimate: str
    confidence_score: float
    breakdown: Dict[str, float]
    recommendations: List[str]


@dataclass
class ViralFeatures:
    """Features for viral prediction."""
    trending_alignment: float
    emotional_intensity: float
    shareability_score: float
    novelty_score: float
    hook_strength: float
    controversy_level: float
    relatability_score: float
    timing_alignment: float
    platform: str
    content_type: str


class ViralScorer:
    """
    Calculates viral potential score for content.

    Uses multiple signals to predict likelihood of content going viral,
    including trending alignment, emotional resonance, and shareability.
    """

    # Viral thresholds by platform
    VIRAL_THRESHOLDS = {
        "tiktok": {"views": 1000000, "engagement_rate": 0.15},
        "instagram": {"views": 500000, "engagement_rate": 0.10},
        "youtube": {"views": 1000000, "engagement_rate": 0.08},
        "facebook": {"views": 500000, "engagement_rate": 0.05},
        "pinterest": {"views": 100000, "engagement_rate": 0.03},
    }

    # Feature weights for viral scoring
    FEATURE_WEIGHTS = {
        "trending_alignment": 0.20,
        "emotional_intensity": 0.18,
        "shareability_score": 0.15,
        "novelty_score": 0.12,
        "hook_strength": 0.15,
        "controversy_level": 0.05,
        "relatability_score": 0.10,
        "timing_alignment": 0.05,
    }

    def __init__(self, models_dir: str = "./models"):
        self.models_dir = models_dir
        self.scaler = StandardScaler()
        self.model = None
        self.is_trained = False
        self._initialize_model()

    def _initialize_model(self) -> None:
        """Initialize viral prediction model."""
        if self._load_model():
            logger.info("Loaded pre-trained viral scorer model")
            return

        logger.info("Initializing new viral scorer model")
        if xgb is not None:
            self.model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42,
                scale_pos_weight=10,  # Handle class imbalance (viral is rare)
            )
        else:
            self.model = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42,
            )

    def _load_model(self) -> bool:
        """Load pre-trained model from disk."""
        try:
            models_path = os.path.join(self.models_dir, "viral")
            model_file = os.path.join(models_path, "viral_model.joblib")
            scaler_file = os.path.join(models_path, "scaler.joblib")

            if os.path.exists(model_file) and os.path.exists(scaler_file):
                self.model = joblib.load(model_file)
                self.scaler = joblib.load(scaler_file)
                self.is_trained = True
                return True
            return False
        except Exception as e:
            logger.warning(f"Failed to load viral model: {e}")
            return False

    def save_model(self) -> None:
        """Save trained model to disk."""
        try:
            models_path = os.path.join(self.models_dir, "viral")
            os.makedirs(models_path, exist_ok=True)
            joblib.dump(self.model, os.path.join(models_path, "viral_model.joblib"))
            joblib.dump(self.scaler, os.path.join(models_path, "scaler.joblib"))
            logger.info("Saved viral model successfully")
        except Exception as e:
            logger.error(f"Failed to save viral model: {e}")

    def score(self, features: ViralFeatures) -> ViralScoreResult:
        """
        Calculate viral potential score for content.

        Args:
            features: Viral prediction features

        Returns:
            ViralScoreResult with score and detailed breakdown
        """
        # Calculate weighted score from features
        factor_scores = self._calculate_factor_scores(features)

        # Get base score from weighted factors
        base_score = sum(
            factor_scores[factor] * weight
            for factor, weight in self.FEATURE_WEIGHTS.items()
        )

        # Apply platform-specific adjustments
        platform_multiplier = self._get_platform_multiplier(features.platform)
        adjusted_score = base_score * platform_multiplier

        # Calculate viral probability
        if self.is_trained:
            viral_probability = self._predict_probability(features)
        else:
            viral_probability = self._heuristic_probability(adjusted_score)

        # Convert to 0-100 scale
        viral_score = min(100, max(0, adjusted_score * 100))

        # Calculate reach multiplier
        reach_multiplier = self._calculate_reach_multiplier(viral_score, features.platform)

        # Estimate peak time
        peak_time = self._estimate_peak_time(viral_probability)

        # Calculate confidence
        confidence = self._calculate_confidence(features)

        # Generate recommendations
        recommendations = self._generate_recommendations(factor_scores, features.platform)

        return ViralScoreResult(
            viral_score=viral_score,
            viral_probability=viral_probability,
            viral_factors=factor_scores,
            predicted_reach_multiplier=reach_multiplier,
            peak_time_estimate=peak_time,
            confidence_score=confidence,
            breakdown={
                "trending_contribution": factor_scores["trending_alignment"] * 100,
                "emotional_contribution": factor_scores["emotional_intensity"] * 100,
                "shareability_contribution": factor_scores["shareability_score"] * 100,
                "hook_contribution": factor_scores["hook_strength"] * 100,
            },
            recommendations=recommendations,
        )

    def _calculate_factor_scores(self, features: ViralFeatures) -> Dict[str, float]:
        """Calculate individual factor scores."""
        return {
            "trending_alignment": min(max(features.trending_alignment, 0), 1),
            "emotional_intensity": min(max(features.emotional_intensity, 0), 1),
            "shareability_score": min(max(features.shareability_score, 0), 1),
            "novelty_score": min(max(features.novelty_score, 0), 1),
            "hook_strength": min(max(features.hook_strength, 0), 1),
            "controversy_level": min(max(features.controversy_level, 0), 0.5),  # Cap controversy
            "relatability_score": min(max(features.relatability_score, 0), 1),
            "timing_alignment": min(max(features.timing_alignment, 0), 1),
        }

    def _get_platform_multiplier(self, platform: str) -> float:
        """Get platform-specific viral multiplier."""
        multipliers = {
            "tiktok": 1.2,  # TikTok has higher viral potential
            "instagram": 1.0,
            "youtube": 0.9,  # Longer content, harder to go viral
            "facebook": 0.8,
            "pinterest": 0.7,
        }
        return multipliers.get(platform.lower(), 1.0)

    def _predict_probability(self, features: ViralFeatures) -> float:
        """Predict viral probability using trained model."""
        feature_array = self._features_to_array(features)
        scaled_features = self.scaler.transform(feature_array)
        probabilities = self.model.predict_proba(scaled_features)[0]
        return float(probabilities[1])  # Probability of viral class

    def _heuristic_probability(self, score: float) -> float:
        """Calculate viral probability using heuristics."""
        # Sigmoid-like transformation
        if score < 0.3:
            return score * 0.1
        elif score < 0.5:
            return 0.03 + (score - 0.3) * 0.2
        elif score < 0.7:
            return 0.07 + (score - 0.5) * 0.4
        elif score < 0.85:
            return 0.15 + (score - 0.7) * 0.5
        else:
            return 0.225 + (score - 0.85) * 1.0

    def _calculate_reach_multiplier(self, viral_score: float, platform: str) -> float:
        """Calculate expected reach multiplier based on viral score."""
        if viral_score >= 80:
            return 10.0 + (viral_score - 80) * 0.5
        elif viral_score >= 60:
            return 3.0 + (viral_score - 60) * 0.35
        elif viral_score >= 40:
            return 1.5 + (viral_score - 40) * 0.075
        else:
            return 1.0 + viral_score * 0.0125

    def _estimate_peak_time(self, viral_probability: float) -> str:
        """Estimate time to peak engagement."""
        if viral_probability > 0.5:
            return "12-24 hours"
        elif viral_probability > 0.3:
            return "24-48 hours"
        elif viral_probability > 0.1:
            return "48-72 hours"
        else:
            return "3-7 days"

    def _calculate_confidence(self, features: ViralFeatures) -> float:
        """Calculate prediction confidence."""
        # Higher confidence when features are more extreme (clearly viral or not)
        feature_values = [
            features.trending_alignment,
            features.emotional_intensity,
            features.shareability_score,
            features.hook_strength,
        ]

        avg_score = np.mean(feature_values)
        variance = np.var(feature_values)

        # High confidence when score is extreme and variance is low
        if avg_score > 0.7 or avg_score < 0.3:
            base_confidence = 0.75
        else:
            base_confidence = 0.6

        # Reduce confidence with high variance
        confidence = base_confidence - min(variance * 0.5, 0.2)

        if self.is_trained:
            confidence += 0.1

        return min(confidence, 0.95)

    def _generate_recommendations(self, factor_scores: Dict[str, float], platform: str) -> List[str]:
        """Generate recommendations to improve viral potential."""
        recommendations = []

        if factor_scores["trending_alignment"] < 0.5:
            recommendations.append("Incorporate trending sounds or topics to boost algorithmic distribution")

        if factor_scores["emotional_intensity"] < 0.6:
            recommendations.append("Add stronger emotional elements - surprise, joy, or inspiration work best")

        if factor_scores["shareability_score"] < 0.5:
            recommendations.append("Make content more shareable - add quotable moments or relatable situations")

        if factor_scores["hook_strength"] < 0.6:
            recommendations.append("Strengthen first 3 seconds - use pattern interrupts or curiosity hooks")

        if factor_scores["novelty_score"] < 0.4:
            recommendations.append("Add a unique twist or perspective to stand out from similar content")

        if factor_scores["relatability_score"] < 0.5:
            recommendations.append("Make content more relatable to your target audience's experiences")

        return recommendations[:3]  # Top 3 recommendations

    def _features_to_array(self, features: ViralFeatures) -> np.ndarray:
        """Convert ViralFeatures to numpy array."""
        platform_encoding = {
            "tiktok": [1, 0, 0, 0, 0], "instagram": [0, 1, 0, 0, 0],
            "youtube": [0, 0, 1, 0, 0], "facebook": [0, 0, 0, 1, 0],
            "pinterest": [0, 0, 0, 0, 1],
        }
        content_encoding = {"video": [1, 0, 0], "image": [0, 1, 0], "carousel": [0, 0, 1]}

        platform_vec = platform_encoding.get(features.platform.lower(), [0, 0, 0, 0, 0])
        content_vec = content_encoding.get(features.content_type.lower(), [0, 0, 0])

        feature_array = np.array([
            features.trending_alignment,
            features.emotional_intensity,
            features.shareability_score,
            features.novelty_score,
            features.hook_strength,
            features.controversy_level,
            features.relatability_score,
            features.timing_alignment,
            *platform_vec,
            *content_vec,
        ])

        return feature_array.reshape(1, -1)

    def train(self, X: np.ndarray, y: np.ndarray) -> Dict[str, float]:
        """Train viral prediction model."""
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        train_score = self.model.score(X_scaled, y)
        self.is_trained = True
        self.save_model()
        return {"accuracy": train_score}

    def calculate_from_engagement(
        self,
        views: int,
        likes: int,
        comments: int,
        shares: int,
        platform: str,
    ) -> float:
        """Calculate viral score from actual engagement metrics."""
        thresholds = self.VIRAL_THRESHOLDS.get(platform.lower(), self.VIRAL_THRESHOLDS["instagram"])

        total_engagement = likes + comments + shares
        engagement_rate = total_engagement / max(views, 1)

        # Normalize against thresholds
        views_score = min(views / thresholds["views"], 1.0)
        engagement_score = min(engagement_rate / thresholds["engagement_rate"], 1.0)

        # Shares are strong viral indicator
        share_rate = shares / max(views, 1)
        share_score = min(share_rate * 100, 1.0)

        viral_score = (views_score * 0.4 + engagement_score * 0.35 + share_score * 0.25) * 100

        return min(100, max(0, viral_score))
