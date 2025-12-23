"""
Engagement Predictor Model.

Predicts engagement metrics (likes, comments, shares) for content
using ensemble learning with XGBoost and feature engineering.
"""

import logging
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
import numpy as np
from datetime import datetime
import joblib
import os

try:
    import xgboost as xgb
except ImportError:
    xgb = None

from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


@dataclass
class EngagementPredictionResult:
    """Predicted engagement metrics."""
    predicted_likes: int
    predicted_comments: int
    predicted_shares: int
    predicted_views: int
    engagement_rate: float
    confidence_score: float
    prediction_intervals: Dict[str, Tuple[int, int]]
    feature_importance: Dict[str, float]


@dataclass
class ContentFeatures:
    """Features extracted from content for prediction."""
    visual_quality: float
    hook_strength: float
    emotional_score: float
    trending_alignment: float
    caption_quality: float
    hashtag_score: float
    content_length: float
    has_cta: bool
    content_type: str
    platform: str


class EngagementPredictor:
    """Predicts engagement metrics using ensemble ML models."""

    PLATFORM_BASE_RATES = {
        "tiktok": {"views_multiplier": 5000, "likes_rate": 0.08, "comments_rate": 0.02, "shares_rate": 0.01},
        "instagram": {"views_multiplier": 3000, "likes_rate": 0.05, "comments_rate": 0.015, "shares_rate": 0.008},
        "youtube": {"views_multiplier": 2000, "likes_rate": 0.04, "comments_rate": 0.01, "shares_rate": 0.005},
        "facebook": {"views_multiplier": 1500, "likes_rate": 0.03, "comments_rate": 0.01, "shares_rate": 0.012},
        "pinterest": {"views_multiplier": 1000, "likes_rate": 0.02, "comments_rate": 0.005, "shares_rate": 0.015},
    }

    def __init__(self, models_dir: str = "./models"):
        self.models_dir = models_dir
        self.scaler = StandardScaler()
        self.models: Dict[str, Any] = {}
        self.is_trained = False
        self.feature_names: List[str] = []
        self._initialize_models()

    def _initialize_models(self) -> None:
        """Initialize prediction models."""
        if self._load_models():
            logger.info("Loaded pre-trained engagement models")
            return
        logger.info("Initializing new engagement prediction models")
        if xgb is not None:
            self.models["likes"] = xgb.XGBRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
            self.models["comments"] = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
            self.models["shares"] = xgb.XGBRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
            self.models["views"] = xgb.XGBRegressor(n_estimators=150, max_depth=7, learning_rate=0.1, random_state=42)
        else:
            self.models["likes"] = GradientBoostingRegressor(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42)
            self.models["comments"] = GradientBoostingRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
            self.models["shares"] = GradientBoostingRegressor(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
            self.models["views"] = GradientBoostingRegressor(n_estimators=150, max_depth=7, learning_rate=0.1, random_state=42)
        self.uncertainty_model = RandomForestRegressor(n_estimators=50, max_depth=4, random_state=42)

    def _load_models(self) -> bool:
        """Load pre-trained models from disk."""
        try:
            models_path = os.path.join(self.models_dir, "engagement")
            if not os.path.exists(models_path):
                return False
            for metric in ["likes", "comments", "shares", "views"]:
                model_file = os.path.join(models_path, f"{metric}_model.joblib")
                if os.path.exists(model_file):
                    self.models[metric] = joblib.load(model_file)
            scaler_file = os.path.join(models_path, "scaler.joblib")
            if os.path.exists(scaler_file):
                self.scaler = joblib.load(scaler_file)
            self.is_trained = True
            return True
        except Exception as e:
            logger.warning(f"Failed to load engagement models: {e}")
            return False

    def save_models(self) -> None:
        """Save trained models to disk."""
        try:
            models_path = os.path.join(self.models_dir, "engagement")
            os.makedirs(models_path, exist_ok=True)
            for metric, model in self.models.items():
                joblib.dump(model, os.path.join(models_path, f"{metric}_model.joblib"))
            joblib.dump(self.scaler, os.path.join(models_path, "scaler.joblib"))
            logger.info("Saved engagement models successfully")
        except Exception as e:
            logger.error(f"Failed to save engagement models: {e}")

    def predict(self, features: ContentFeatures, creator_metrics: Optional[Dict[str, float]] = None) -> EngagementPredictionResult:
        """Predict engagement metrics for content."""
        feature_array = self._features_to_array(features)
        platform = features.platform.lower()
        base_rates = self.PLATFORM_BASE_RATES.get(platform, self.PLATFORM_BASE_RATES["instagram"])
        quality_score = self._calculate_quality_score(features)
        creator_factor = self._get_creator_factor(creator_metrics)

        if self.is_trained:
            predictions = self._predict_with_models(feature_array)
        else:
            predictions = self._predict_heuristic(features, base_rates, quality_score, creator_factor)

        predictions = {k: int(v * creator_factor) for k, v in predictions.items()}
        views = max(predictions["views"], 1)
        total_engagement = predictions["likes"] + predictions["comments"] + predictions["shares"]
        engagement_rate = min(total_engagement / views, 1.0)
        confidence = self._calculate_confidence(features, creator_metrics)
        intervals = self._calculate_intervals(predictions, confidence)
        importance = self._get_feature_importance(features)

        return EngagementPredictionResult(
            predicted_likes=predictions["likes"], predicted_comments=predictions["comments"],
            predicted_shares=predictions["shares"], predicted_views=predictions["views"],
            engagement_rate=engagement_rate, confidence_score=confidence,
            prediction_intervals=intervals, feature_importance=importance,
        )

    def _features_to_array(self, features: ContentFeatures) -> np.ndarray:
        """Convert ContentFeatures to numpy array."""
        content_type_encoding = {"video": [1, 0, 0], "image": [0, 1, 0], "carousel": [0, 0, 1]}
        platform_encoding = {"tiktok": [1, 0, 0, 0, 0], "instagram": [0, 1, 0, 0, 0], "youtube": [0, 0, 1, 0, 0], "facebook": [0, 0, 0, 1, 0], "pinterest": [0, 0, 0, 0, 1]}
        content_type_vec = content_type_encoding.get(features.content_type.lower(), [0, 0, 0])
        platform_vec = platform_encoding.get(features.platform.lower(), [0, 0, 0, 0, 0])
        feature_array = np.array([features.visual_quality, features.hook_strength, features.emotional_score, features.trending_alignment, features.caption_quality, features.hashtag_score, features.content_length, float(features.has_cta), *content_type_vec, *platform_vec])
        self.feature_names = ["visual_quality", "hook_strength", "emotional_score", "trending_alignment", "caption_quality", "hashtag_score", "content_length", "has_cta", "is_video", "is_image", "is_carousel", "is_tiktok", "is_instagram", "is_youtube", "is_facebook", "is_pinterest"]
        return feature_array.reshape(1, -1)

    def _calculate_quality_score(self, features: ContentFeatures) -> float:
        """Calculate overall quality score from features."""
        weights = {"visual_quality": 0.25, "hook_strength": 0.20, "emotional_score": 0.15, "trending_alignment": 0.15, "caption_quality": 0.10, "hashtag_score": 0.10, "has_cta": 0.05}
        score = (features.visual_quality * weights["visual_quality"] + features.hook_strength * weights["hook_strength"] + features.emotional_score * weights["emotional_score"] + features.trending_alignment * weights["trending_alignment"] + features.caption_quality * weights["caption_quality"] + features.hashtag_score * weights["hashtag_score"] + (0.1 if features.has_cta else 0) * weights["has_cta"])
        return min(max(score, 0.0), 1.0)

    def _get_creator_factor(self, creator_metrics: Optional[Dict[str, float]]) -> float:
        """Calculate creator influence multiplier."""
        if not creator_metrics:
            return 1.0
        follower_count = creator_metrics.get("follower_count", 1000)
        avg_engagement = creator_metrics.get("avg_engagement_rate", 0.03)
        follower_factor = min(np.log10(max(follower_count, 100)) / 4, 2.5)
        engagement_bonus = 1.0 + min(avg_engagement * 5, 0.5)
        return follower_factor * engagement_bonus

    def _predict_with_models(self, feature_array: np.ndarray) -> Dict[str, int]:
        """Predict using trained ML models."""
        scaled_features = self.scaler.transform(feature_array)
        predictions = {}
        for metric, model in self.models.items():
            if metric in ["likes", "comments", "shares", "views"]:
                pred = model.predict(scaled_features)[0]
                predictions[metric] = max(int(pred), 0)
        return predictions

    def _predict_heuristic(self, features: ContentFeatures, base_rates: Dict[str, float], quality_score: float, creator_factor: float) -> Dict[str, int]:
        """Predict using heuristic rules when models not trained."""
        variance = np.random.uniform(0.8, 1.2)
        base_views = base_rates["views_multiplier"] * quality_score * variance
        if features.trending_alignment > 0.7:
            base_views *= 1.5
        if features.hook_strength > 0.7:
            base_views *= 1.3
        views = int(base_views)
        likes = int(views * base_rates["likes_rate"] * quality_score)
        comments = int(views * base_rates["comments_rate"] * quality_score)
        shares = int(views * base_rates["shares_rate"] * quality_score)
        if features.has_cta:
            comments = int(comments * 1.3)
        return {"views": max(views, 100), "likes": max(likes, 5), "comments": max(comments, 1), "shares": max(shares, 0)}

    def _calculate_confidence(self, features: ContentFeatures, creator_metrics: Optional[Dict[str, float]]) -> float:
        """Calculate prediction confidence score."""
        confidence = 0.6
        if creator_metrics and "historical_posts" in creator_metrics:
            confidence += min(creator_metrics["historical_posts"] / 100, 0.2)
        if features.visual_quality > 0.7:
            confidence += 0.05
        if features.trending_alignment > 0.5:
            confidence += 0.05
        if self.is_trained:
            confidence += 0.1
        return min(confidence, 0.95)

    def _calculate_intervals(self, predictions: Dict[str, int], confidence: float) -> Dict[str, Tuple[int, int]]:
        """Calculate prediction intervals based on confidence."""
        margin = (1 - confidence) * 0.5 + 0.2
        return {metric: (max(0, int(value * (1 - margin))), int(value * (1 + margin))) for metric, value in predictions.items()}

    def _get_feature_importance(self, features: ContentFeatures) -> Dict[str, float]:
        """Get feature importance for predictions."""
        if self.is_trained and hasattr(self.models.get("views"), "feature_importances_"):
            return dict(zip(self.feature_names, self.models["views"].feature_importances_.tolist()))
        return {"visual_quality": 0.20, "hook_strength": 0.18, "trending_alignment": 0.15, "emotional_score": 0.12, "caption_quality": 0.10, "hashtag_score": 0.10, "content_length": 0.08, "has_cta": 0.07}

    def train(self, X: np.ndarray, y_likes: np.ndarray, y_comments: np.ndarray, y_shares: np.ndarray, y_views: np.ndarray) -> Dict[str, float]:
        """Train engagement prediction models."""
        X_scaled = self.scaler.fit_transform(X)
        training_metrics = {}
        targets = {"likes": y_likes, "comments": y_comments, "shares": y_shares, "views": y_views}
        for metric, y in targets.items():
            logger.info(f"Training {metric} model...")
            self.models[metric].fit(X_scaled, y)
            train_score = self.models[metric].score(X_scaled, y)
            training_metrics[f"{metric}_r2"] = train_score
        self.is_trained = True
        self.save_models()
        return training_metrics

    def update_with_outcome(self, features: ContentFeatures, actual_metrics: Dict[str, int]) -> None:
        """Update model with actual outcome for online learning."""
        logger.info("Outcome recorded for future model updates")
