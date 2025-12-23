"""
Fast Inference Predictor.

Provides optimized inference engine for real-time predictions
with caching, batching, and model versioning support.
"""

import logging
import os
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from datetime import datetime
import hashlib
import json
import numpy as np
import joblib
from collections import OrderedDict
from threading import Lock

logger = logging.getLogger(__name__)


@dataclass
class PredictionResult:
    """Result of a prediction."""
    content_id: str
    predictions: Dict[str, float]
    confidence: float
    model_version: str
    latency_ms: float
    cached: bool


@dataclass
class ModelVersion:
    """Model version metadata."""
    version: str
    created_at: datetime
    metrics: Dict[str, float]
    is_active: bool


class LRUCache:
    """Thread-safe LRU cache for predictions."""

    def __init__(self, maxsize: int = 1000):
        self.cache: OrderedDict = OrderedDict()
        self.maxsize = maxsize
        self.lock = Lock()
        self.hits = 0
        self.misses = 0

    def get(self, key: str) -> Optional[Any]:
        """Get item from cache."""
        with self.lock:
            if key in self.cache:
                self.cache.move_to_end(key)
                self.hits += 1
                return self.cache[key]
            self.misses += 1
            return None

    def set(self, key: str, value: Any) -> None:
        """Set item in cache."""
        with self.lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            else:
                if len(self.cache) >= self.maxsize:
                    self.cache.popitem(last=False)
            self.cache[key] = value

    def clear(self) -> None:
        """Clear cache."""
        with self.lock:
            self.cache.clear()
            self.hits = 0
            self.misses = 0

    @property
    def hit_rate(self) -> float:
        """Calculate cache hit rate."""
        total = self.hits + self.misses
        return self.hits / total if total > 0 else 0.0


class FastPredictor:
    """
    Fast inference engine for engagement predictions.

    Features:
    - Model caching and preloading
    - Prediction caching with LRU eviction
    - Batch prediction support
    - Model versioning and A/B testing
    - Feature importance reporting
    """

    def __init__(
        self,
        models_dir: str = "./models",
        cache_size: int = 1000,
        preload: bool = True,
    ):
        self.models_dir = models_dir
        self.models: Dict[str, Any] = {}
        self.scalers: Dict[str, Any] = {}
        self.model_versions: Dict[str, ModelVersion] = {}
        self.cache = LRUCache(maxsize=cache_size)
        self.ab_test_config: Dict[str, Dict[str, float]] = {}

        if preload:
            self._preload_models()

    def _preload_models(self) -> None:
        """Preload all available models into memory."""
        if not os.path.exists(self.models_dir):
            logger.warning(f"Models directory not found: {self.models_dir}")
            return

        for filename in os.listdir(self.models_dir):
            if filename.endswith("_model.joblib"):
                target = filename.replace("_model.joblib", "")
                try:
                    model_path = os.path.join(self.models_dir, filename)
                    self.models[target] = joblib.load(model_path)
                    logger.info(f"Preloaded model for {target}")
                except Exception as e:
                    logger.error(f"Failed to load model {filename}: {e}")

        # Load scalers
        scaler_path = os.path.join(self.models_dir, "scaler.joblib")
        if os.path.exists(scaler_path):
            self.scalers["default"] = joblib.load(scaler_path)

    def _get_model(self, target: str, version: str = None) -> Optional[Any]:
        """Get model for target, loading if necessary."""
        model_key = f"{target}_{version}" if version else target

        if model_key in self.models:
            return self.models[model_key]

        # Try to load model
        if version:
            model_path = os.path.join(
                self.models_dir, "versions", version, f"{target}_model.joblib"
            )
        else:
            model_path = os.path.join(self.models_dir, f"{target}_model.joblib")

        if os.path.exists(model_path):
            self.models[model_key] = joblib.load(model_path)
            return self.models[model_key]

        return None

    def _compute_cache_key(self, features: np.ndarray, targets: List[str]) -> str:
        """Compute cache key for prediction."""
        feature_hash = hashlib.md5(features.tobytes()).hexdigest()[:16]
        targets_str = ",".join(sorted(targets))
        return f"{feature_hash}_{targets_str}"

    def predict(
        self,
        features: np.ndarray,
        targets: List[str] = None,
        content_id: str = None,
        use_cache: bool = True,
        model_version: str = None,
    ) -> PredictionResult:
        """
        Make prediction for a single sample.

        Args:
            features: Feature array (1, n_features)
            targets: List of targets to predict
            content_id: Optional content identifier
            use_cache: Whether to use prediction cache
            model_version: Specific model version to use

        Returns:
            PredictionResult with predictions
        """
        start_time = datetime.utcnow()

        if targets is None:
            targets = list(self.models.keys())

        if content_id is None:
            content_id = hashlib.md5(features.tobytes()).hexdigest()[:12]

        # Check cache
        cache_key = self._compute_cache_key(features, targets)
        if use_cache:
            cached = self.cache.get(cache_key)
            if cached is not None:
                return PredictionResult(
                    content_id=content_id,
                    predictions=cached["predictions"],
                    confidence=cached["confidence"],
                    model_version=cached["version"],
                    latency_ms=0.1,
                    cached=True,
                )

        # Ensure features are 2D
        if features.ndim == 1:
            features = features.reshape(1, -1)

        # Scale features
        scaler = self.scalers.get("default")
        if scaler is not None:
            features = scaler.transform(features)

        # Make predictions
        predictions = {}
        for target in targets:
            model = self._get_model(target, model_version)
            if model is not None:
                pred = float(model.predict(features)[0])
                predictions[target] = max(0, pred)  # Ensure non-negative

        # Calculate confidence
        confidence = self._calculate_confidence(predictions)

        # Determine model version
        version = model_version or "default"

        # Cache result
        if use_cache:
            self.cache.set(cache_key, {
                "predictions": predictions,
                "confidence": confidence,
                "version": version,
            })

        # Calculate latency
        latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

        return PredictionResult(
            content_id=content_id,
            predictions=predictions,
            confidence=confidence,
            model_version=version,
            latency_ms=latency_ms,
            cached=False,
        )

    def predict_batch(
        self,
        features_batch: np.ndarray,
        targets: List[str] = None,
        content_ids: List[str] = None,
    ) -> List[PredictionResult]:
        """
        Make predictions for a batch of samples.

        Args:
            features_batch: Feature array (n_samples, n_features)
            targets: List of targets to predict
            content_ids: Optional list of content identifiers

        Returns:
            List of PredictionResult
        """
        start_time = datetime.utcnow()

        if targets is None:
            targets = list(self.models.keys())

        n_samples = features_batch.shape[0]

        if content_ids is None:
            content_ids = [
                hashlib.md5(features_batch[i].tobytes()).hexdigest()[:12]
                for i in range(n_samples)
            ]

        # Scale features
        scaler = self.scalers.get("default")
        if scaler is not None:
            features_batch = scaler.transform(features_batch)

        # Make batch predictions for each target
        all_predictions = {target: [] for target in targets}
        for target in targets:
            model = self._get_model(target)
            if model is not None:
                preds = model.predict(features_batch)
                all_predictions[target] = [max(0, float(p)) for p in preds]

        # Calculate latency
        total_latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        per_sample_latency = total_latency_ms / n_samples

        # Construct results
        results = []
        for i in range(n_samples):
            predictions = {
                target: all_predictions[target][i]
                for target in targets
                if all_predictions[target]
            }

            results.append(PredictionResult(
                content_id=content_ids[i],
                predictions=predictions,
                confidence=self._calculate_confidence(predictions),
                model_version="default",
                latency_ms=per_sample_latency,
                cached=False,
            ))

        return results

    def _calculate_confidence(self, predictions: Dict[str, float]) -> float:
        """Calculate confidence score for predictions."""
        if not predictions:
            return 0.5

        # Base confidence from model availability
        confidence = 0.7

        # Adjust based on prediction characteristics
        values = list(predictions.values())
        if len(values) >= 2:
            # Lower confidence for extreme predictions
            max_val = max(values)
            if max_val > 100000:  # Very high prediction
                confidence -= 0.1
            elif max_val < 100:  # Very low prediction
                confidence -= 0.05

        return min(max(confidence, 0.3), 0.95)

    def get_feature_importance(self, target: str) -> Dict[str, float]:
        """Get feature importance for a target model."""
        model = self._get_model(target)
        if model is None:
            return {}

        if hasattr(model, "feature_importances_"):
            # Get feature names from model or use defaults
            n_features = len(model.feature_importances_)
            feature_names = [f"feature_{i}" for i in range(n_features)]

            return dict(zip(feature_names, model.feature_importances_.tolist()))

        return {}

    def setup_ab_test(
        self,
        target: str,
        versions: Dict[str, float],
    ) -> None:
        """
        Set up A/B testing between model versions.

        Args:
            target: Target metric
            versions: Dictionary of version -> traffic percentage
        """
        total = sum(versions.values())
        if abs(total - 1.0) > 0.01:
            raise ValueError("Version weights must sum to 1.0")

        self.ab_test_config[target] = versions
        logger.info(f"A/B test configured for {target}: {versions}")

    def predict_with_ab_test(
        self,
        features: np.ndarray,
        target: str,
        content_id: str = None,
    ) -> Tuple[PredictionResult, str]:
        """
        Make prediction with A/B test version selection.

        Args:
            features: Feature array
            target: Target metric
            content_id: Content identifier for consistent bucketing

        Returns:
            Tuple of (PredictionResult, selected_version)
        """
        if target not in self.ab_test_config:
            return self.predict(features, [target], content_id), "default"

        versions = self.ab_test_config[target]

        # Consistent bucketing based on content_id
        if content_id:
            bucket = int(hashlib.md5(content_id.encode()).hexdigest(), 16) % 100
        else:
            bucket = np.random.randint(0, 100)

        cumulative = 0
        selected_version = "default"
        for version, weight in versions.items():
            cumulative += weight * 100
            if bucket < cumulative:
                selected_version = version
                break

        result = self.predict(
            features, [target], content_id,
            model_version=selected_version
        )

        return result, selected_version

    def register_model_version(
        self,
        target: str,
        version: str,
        model: Any,
        metrics: Dict[str, float],
    ) -> None:
        """Register a new model version."""
        version_dir = os.path.join(self.models_dir, "versions", version)
        os.makedirs(version_dir, exist_ok=True)

        model_path = os.path.join(version_dir, f"{target}_model.joblib")
        joblib.dump(model, model_path)

        self.model_versions[f"{target}_{version}"] = ModelVersion(
            version=version,
            created_at=datetime.utcnow(),
            metrics=metrics,
            is_active=True,
        )

        # Preload the new version
        self.models[f"{target}_{version}"] = model

        logger.info(f"Registered model version {version} for {target}")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "size": len(self.cache.cache),
            "max_size": self.cache.maxsize,
            "hits": self.cache.hits,
            "misses": self.cache.misses,
            "hit_rate": self.cache.hit_rate,
        }

    def clear_cache(self) -> None:
        """Clear the prediction cache."""
        self.cache.clear()
        logger.info("Prediction cache cleared")

    def warmup(self, sample_features: np.ndarray) -> None:
        """Warm up models with sample predictions."""
        logger.info("Warming up models...")
        for target in self.models.keys():
            if "_" not in target:  # Skip versioned models
                self.predict(sample_features, [target], use_cache=False)
        logger.info("Model warmup complete")

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models."""
        info = {
            "loaded_models": list(self.models.keys()),
            "versions": {},
            "ab_tests": self.ab_test_config,
        }

        for key, version in self.model_versions.items():
            info["versions"][key] = {
                "version": version.version,
                "created_at": version.created_at.isoformat(),
                "metrics": version.metrics,
                "is_active": version.is_active,
            }

        return info
