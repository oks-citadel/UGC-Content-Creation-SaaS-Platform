"""
Model Trainer.

Orchestrates training of engagement prediction models with
hyperparameter tuning, cross-validation, and model evaluation.
"""

import logging
import os
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from datetime import datetime
import numpy as np
import joblib

try:
    import xgboost as xgb
except ImportError:
    xgb = None

from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestRegressor,
    HistGradientBoostingRegressor,
)
from sklearn.linear_model import Ridge, ElasticNet
from sklearn.model_selection import cross_val_score, GridSearchCV
from sklearn.metrics import (
    mean_squared_error,
    mean_absolute_error,
    r2_score,
    mean_absolute_percentage_error,
)

from .data_pipeline import TrainingDataset

logger = logging.getLogger(__name__)


@dataclass
class TrainingResult:
    """Results from model training."""
    model_name: str
    target: str
    best_params: Dict[str, Any]
    train_metrics: Dict[str, float]
    val_metrics: Dict[str, float]
    test_metrics: Dict[str, float]
    cv_scores: List[float]
    feature_importance: Dict[str, float]
    training_time: float
    model_path: Optional[str]


@dataclass
class ModelConfig:
    """Configuration for a model."""
    name: str
    model_class: Any
    param_grid: Dict[str, List[Any]]
    default_params: Dict[str, Any]


class ModelTrainer:
    """
    Orchestrates training of prediction models.

    Supports multiple model types, hyperparameter tuning,
    cross-validation, and comprehensive evaluation.
    """

    # Model configurations
    MODEL_CONFIGS = {
        "xgboost": ModelConfig(
            name="XGBoost",
            model_class=xgb.XGBRegressor if xgb else GradientBoostingRegressor,
            param_grid={
                "n_estimators": [100, 200],
                "max_depth": [4, 6, 8],
                "learning_rate": [0.05, 0.1],
            },
            default_params={
                "n_estimators": 150,
                "max_depth": 6,
                "learning_rate": 0.1,
                "random_state": 42,
            },
        ),
        "gradient_boosting": ModelConfig(
            name="Gradient Boosting",
            model_class=GradientBoostingRegressor,
            param_grid={
                "n_estimators": [100, 200],
                "max_depth": [4, 6],
                "learning_rate": [0.05, 0.1],
            },
            default_params={
                "n_estimators": 150,
                "max_depth": 5,
                "learning_rate": 0.1,
                "random_state": 42,
            },
        ),
        "random_forest": ModelConfig(
            name="Random Forest",
            model_class=RandomForestRegressor,
            param_grid={
                "n_estimators": [100, 200],
                "max_depth": [10, 20, None],
                "min_samples_split": [2, 5],
            },
            default_params={
                "n_estimators": 150,
                "max_depth": 15,
                "random_state": 42,
            },
        ),
        "hist_gradient_boosting": ModelConfig(
            name="Hist Gradient Boosting",
            model_class=HistGradientBoostingRegressor,
            param_grid={
                "max_iter": [100, 200],
                "max_depth": [4, 6, 8],
                "learning_rate": [0.05, 0.1],
            },
            default_params={
                "max_iter": 150,
                "max_depth": 6,
                "learning_rate": 0.1,
                "random_state": 42,
            },
        ),
    }

    def __init__(
        self,
        models_dir: str = "./models",
        model_type: str = "xgboost",
    ):
        self.models_dir = models_dir
        self.model_type = model_type
        self.trained_models: Dict[str, Any] = {}
        self.training_results: Dict[str, TrainingResult] = {}

    def train(
        self,
        dataset: TrainingDataset,
        targets: List[str] = None,
        tune_hyperparams: bool = False,
        cv_folds: int = 5,
    ) -> Dict[str, TrainingResult]:
        """
        Train models for specified targets.

        Args:
            dataset: Training dataset
            targets: List of target columns to train for
            tune_hyperparams: Whether to perform hyperparameter tuning
            cv_folds: Number of cross-validation folds

        Returns:
            Dictionary of training results per target
        """
        if targets is None:
            targets = list(dataset.y_train.keys())

        results = {}

        for target in targets:
            if target not in dataset.y_train:
                logger.warning(f"Target '{target}' not found in dataset")
                continue

            logger.info(f"Training model for {target}...")
            start_time = datetime.utcnow()

            # Get model configuration
            config = self.MODEL_CONFIGS.get(
                self.model_type,
                self.MODEL_CONFIGS["gradient_boosting"]
            )

            # Train model
            if tune_hyperparams:
                model, best_params = self._train_with_tuning(
                    dataset, target, config, cv_folds
                )
            else:
                model = self._train_simple(dataset, target, config)
                best_params = config.default_params

            # Evaluate model
            train_metrics = self._evaluate(
                model, dataset.X_train, dataset.y_train[target]
            )
            val_metrics = self._evaluate(
                model, dataset.X_val, dataset.y_val[target]
            )
            test_metrics = self._evaluate(
                model, dataset.X_test, dataset.y_test[target]
            )

            # Cross-validation scores
            cv_scores = cross_val_score(
                model, dataset.X_train, dataset.y_train[target],
                cv=min(cv_folds, len(dataset.X_train) // 2),
                scoring="r2"
            ).tolist()

            # Feature importance
            feature_importance = self._get_feature_importance(
                model, dataset.feature_names
            )

            # Save model
            model_path = self._save_model(model, target)

            # Calculate training time
            training_time = (datetime.utcnow() - start_time).total_seconds()

            # Store results
            result = TrainingResult(
                model_name=config.name,
                target=target,
                best_params=best_params,
                train_metrics=train_metrics,
                val_metrics=val_metrics,
                test_metrics=test_metrics,
                cv_scores=cv_scores,
                feature_importance=feature_importance,
                training_time=training_time,
                model_path=model_path,
            )

            results[target] = result
            self.trained_models[target] = model
            self.training_results[target] = result

            logger.info(
                f"Trained {target}: R2={val_metrics['r2']:.4f}, "
                f"MAE={val_metrics['mae']:.4f}, Time={training_time:.1f}s"
            )

        return results

    def _train_simple(
        self,
        dataset: TrainingDataset,
        target: str,
        config: ModelConfig,
    ) -> Any:
        """Train model with default parameters."""
        model = config.model_class(**config.default_params)
        model.fit(dataset.X_train, dataset.y_train[target])
        return model

    def _train_with_tuning(
        self,
        dataset: TrainingDataset,
        target: str,
        config: ModelConfig,
        cv_folds: int,
    ) -> Tuple[Any, Dict[str, Any]]:
        """Train model with hyperparameter tuning."""
        base_model = config.model_class(**{
            k: v for k, v in config.default_params.items()
            if k not in config.param_grid
        })

        grid_search = GridSearchCV(
            base_model,
            config.param_grid,
            cv=min(cv_folds, len(dataset.X_train) // 2),
            scoring="r2",
            n_jobs=-1,
            verbose=0,
        )

        grid_search.fit(dataset.X_train, dataset.y_train[target])

        logger.info(f"Best params for {target}: {grid_search.best_params_}")

        return grid_search.best_estimator_, grid_search.best_params_

    def _evaluate(
        self,
        model: Any,
        X: np.ndarray,
        y: np.ndarray,
    ) -> Dict[str, float]:
        """Evaluate model on dataset."""
        predictions = model.predict(X)

        return {
            "mse": float(mean_squared_error(y, predictions)),
            "rmse": float(np.sqrt(mean_squared_error(y, predictions))),
            "mae": float(mean_absolute_error(y, predictions)),
            "r2": float(r2_score(y, predictions)),
            "mape": float(mean_absolute_percentage_error(y, predictions) * 100),
        }

    def _get_feature_importance(
        self,
        model: Any,
        feature_names: List[str],
    ) -> Dict[str, float]:
        """Extract feature importance from model."""
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            return dict(sorted(
                zip(feature_names, importances.tolist()),
                key=lambda x: x[1],
                reverse=True
            ))
        return {}

    def _save_model(self, model: Any, target: str) -> str:
        """Save trained model to disk."""
        os.makedirs(self.models_dir, exist_ok=True)
        model_path = os.path.join(self.models_dir, f"{target}_model.joblib")
        joblib.dump(model, model_path)
        return model_path

    def load_model(self, target: str) -> Optional[Any]:
        """Load trained model from disk."""
        model_path = os.path.join(self.models_dir, f"{target}_model.joblib")
        if os.path.exists(model_path):
            return joblib.load(model_path)
        return None

    def compare_models(
        self,
        dataset: TrainingDataset,
        target: str,
        model_types: List[str] = None,
    ) -> Dict[str, Dict[str, float]]:
        """
        Compare different model types on the same target.

        Args:
            dataset: Training dataset
            target: Target column
            model_types: List of model types to compare

        Returns:
            Dictionary of metrics per model type
        """
        if model_types is None:
            model_types = list(self.MODEL_CONFIGS.keys())

        results = {}

        for model_type in model_types:
            if model_type not in self.MODEL_CONFIGS:
                continue

            config = self.MODEL_CONFIGS[model_type]
            model = self._train_simple(dataset, target, config)
            metrics = self._evaluate(model, dataset.X_val, dataset.y_val[target])
            results[model_type] = metrics

            logger.info(f"{model_type}: R2={metrics['r2']:.4f}, MAE={metrics['mae']:.4f}")

        return results

    def get_best_model(self, target: str) -> Optional[Any]:
        """Get the best trained model for a target."""
        return self.trained_models.get(target)

    def predict(
        self,
        target: str,
        X: np.ndarray,
    ) -> Optional[np.ndarray]:
        """Make predictions using trained model."""
        model = self.trained_models.get(target)
        if model is None:
            model = self.load_model(target)

        if model is not None:
            return model.predict(X)
        return None

    def get_training_summary(self) -> Dict[str, Any]:
        """Get summary of all training results."""
        summary = {
            "models_trained": len(self.training_results),
            "targets": list(self.training_results.keys()),
            "model_type": self.model_type,
            "results": {},
        }

        for target, result in self.training_results.items():
            summary["results"][target] = {
                "val_r2": result.val_metrics["r2"],
                "val_mae": result.val_metrics["mae"],
                "test_r2": result.test_metrics["r2"],
                "cv_mean": np.mean(result.cv_scores),
                "cv_std": np.std(result.cv_scores),
                "training_time": result.training_time,
                "top_features": list(result.feature_importance.items())[:5],
            }

        return summary

    def retrain_with_new_data(
        self,
        new_data: TrainingDataset,
        targets: List[str] = None,
        incremental: bool = True,
    ) -> Dict[str, TrainingResult]:
        """
        Retrain models with new data.

        Args:
            new_data: New training dataset
            targets: Targets to retrain
            incremental: Whether to do incremental learning (if supported)

        Returns:
            New training results
        """
        if incremental and self.model_type == "xgboost" and xgb:
            # XGBoost supports incremental training
            return self._incremental_train(new_data, targets)
        else:
            # Full retrain
            return self.train(new_data, targets)

    def _incremental_train(
        self,
        new_data: TrainingDataset,
        targets: List[str],
    ) -> Dict[str, TrainingResult]:
        """Incrementally train XGBoost models with new data."""
        results = {}

        for target in targets or list(new_data.y_train.keys()):
            if target not in self.trained_models:
                # No existing model, do full train
                result = self.train(new_data, [target])
                results.update(result)
                continue

            # Continue training from existing model
            existing_model = self.trained_models[target]

            if hasattr(existing_model, "get_booster"):
                # XGBoost model
                dtrain = xgb.DMatrix(
                    new_data.X_train,
                    label=new_data.y_train[target]
                )

                # Continue training
                existing_model.fit(
                    new_data.X_train,
                    new_data.y_train[target],
                    xgb_model=existing_model.get_booster()
                )

                # Evaluate
                val_metrics = self._evaluate(
                    existing_model,
                    new_data.X_val,
                    new_data.y_val[target]
                )

                results[target] = TrainingResult(
                    model_name="XGBoost (incremental)",
                    target=target,
                    best_params={},
                    train_metrics={},
                    val_metrics=val_metrics,
                    test_metrics={},
                    cv_scores=[],
                    feature_importance={},
                    training_time=0,
                    model_path=self._save_model(existing_model, target),
                )

        return results
