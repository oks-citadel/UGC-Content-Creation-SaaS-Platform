"""
Data Pipeline for Training.

Handles data loading, preprocessing, feature extraction,
and dataset preparation for model training.
"""

import logging
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder

logger = logging.getLogger(__name__)


@dataclass
class TrainingDataset:
    """Prepared dataset for model training."""
    X_train: np.ndarray
    X_val: np.ndarray
    X_test: np.ndarray
    y_train: Dict[str, np.ndarray]
    y_val: Dict[str, np.ndarray]
    y_test: Dict[str, np.ndarray]
    feature_names: List[str]
    scaler: StandardScaler
    label_encoders: Dict[str, LabelEncoder]
    metadata: Dict[str, Any]


class DataPipeline:
    """
    Data pipeline for training preparation.

    Handles loading raw data, feature extraction, preprocessing,
    and splitting into train/val/test sets.
    """

    # Feature columns expected in raw data
    NUMERIC_FEATURES = [
        "follower_count",
        "caption_length",
        "hashtag_count",
        "post_hour",
        "post_day_of_week",
        "visual_quality_score",
        "hook_strength_score",
        "trending_alignment_score",
        "creator_avg_engagement",
        "creator_total_posts",
    ]

    CATEGORICAL_FEATURES = [
        "platform",
        "content_type",
        "has_cta",
        "is_weekend",
    ]

    TARGET_COLUMNS = [
        "views",
        "likes",
        "comments",
        "shares",
        "engagement_rate",
    ]

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.feature_names: List[str] = []

    def load_data(
        self,
        filepath: str = None,
        dataframe: pd.DataFrame = None,
    ) -> pd.DataFrame:
        """
        Load raw training data.

        Args:
            filepath: Path to CSV/parquet file
            dataframe: Pre-loaded DataFrame

        Returns:
            Loaded DataFrame
        """
        if dataframe is not None:
            df = dataframe.copy()
        elif filepath:
            if filepath.endswith(".parquet"):
                df = pd.read_parquet(filepath)
            else:
                df = pd.read_csv(filepath)
        else:
            raise ValueError("Must provide either filepath or dataframe")

        logger.info(f"Loaded {len(df)} records")
        return df

    def preprocess(
        self,
        df: pd.DataFrame,
        fit: bool = True,
    ) -> pd.DataFrame:
        """
        Preprocess raw data for training.

        Args:
            df: Raw DataFrame
            fit: Whether to fit encoders/scalers (True for training)

        Returns:
            Preprocessed DataFrame
        """
        df = df.copy()

        # Handle missing values
        df = self._handle_missing_values(df)

        # Extract temporal features
        df = self._extract_temporal_features(df)

        # Encode categorical variables
        df = self._encode_categoricals(df, fit=fit)

        # Calculate derived features
        df = self._calculate_derived_features(df)

        # Remove outliers (only during training)
        if fit:
            df = self._remove_outliers(df)

        logger.info(f"Preprocessed {len(df)} records")
        return df

    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in the data."""
        # Fill numeric with median
        for col in self.NUMERIC_FEATURES:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median())

        # Fill categorical with mode
        for col in self.CATEGORICAL_FEATURES:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].mode().iloc[0] if len(df[col].mode()) > 0 else "unknown")

        return df

    def _extract_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Extract temporal features from timestamp."""
        if "posted_at" in df.columns:
            df["posted_at"] = pd.to_datetime(df["posted_at"])
            df["post_hour"] = df["posted_at"].dt.hour
            df["post_day_of_week"] = df["posted_at"].dt.dayofweek
            df["is_weekend"] = df["post_day_of_week"].isin([5, 6]).astype(int)
            df["post_month"] = df["posted_at"].dt.month

        return df

    def _encode_categoricals(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        """Encode categorical variables."""
        for col in self.CATEGORICAL_FEATURES:
            if col not in df.columns:
                continue

            if fit:
                le = LabelEncoder()
                df[f"{col}_encoded"] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
            else:
                if col in self.label_encoders:
                    # Handle unseen categories
                    le = self.label_encoders[col]
                    df[f"{col}_encoded"] = df[col].apply(
                        lambda x: le.transform([str(x)])[0] if str(x) in le.classes_ else -1
                    )
                else:
                    df[f"{col}_encoded"] = 0

        return df

    def _calculate_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate derived features from raw data."""
        # Engagement rate if not present
        if "engagement_rate" not in df.columns and "views" in df.columns:
            total_engagement = df.get("likes", 0) + df.get("comments", 0) + df.get("shares", 0)
            df["engagement_rate"] = total_engagement / df["views"].clip(lower=1)

        # Log transformations for high-variance features
        if "follower_count" in df.columns:
            df["log_followers"] = np.log10(df["follower_count"].clip(lower=1))

        if "views" in df.columns:
            df["log_views"] = np.log10(df["views"].clip(lower=1))

        # Interaction features
        if "visual_quality_score" in df.columns and "hook_strength_score" in df.columns:
            df["quality_hook_interaction"] = df["visual_quality_score"] * df["hook_strength_score"]

        return df

    def _remove_outliers(self, df: pd.DataFrame, z_threshold: float = 3.0) -> pd.DataFrame:
        """Remove outliers based on z-score."""
        initial_len = len(df)

        for col in self.TARGET_COLUMNS:
            if col in df.columns:
                z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
                df = df[z_scores < z_threshold]

        removed = initial_len - len(df)
        if removed > 0:
            logger.info(f"Removed {removed} outliers ({removed/initial_len*100:.1f}%)")

        return df

    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """
        Prepare feature matrix for training.

        Args:
            df: Preprocessed DataFrame

        Returns:
            Tuple of (feature matrix, feature names)
        """
        feature_columns = []

        # Add numeric features
        for col in self.NUMERIC_FEATURES:
            if col in df.columns:
                feature_columns.append(col)

        # Add encoded categoricals
        for col in self.CATEGORICAL_FEATURES:
            encoded_col = f"{col}_encoded"
            if encoded_col in df.columns:
                feature_columns.append(encoded_col)

        # Add derived features
        derived = ["log_followers", "log_views", "quality_hook_interaction"]
        for col in derived:
            if col in df.columns:
                feature_columns.append(col)

        self.feature_names = feature_columns
        X = df[feature_columns].values

        return X, feature_columns

    def prepare_targets(self, df: pd.DataFrame) -> Dict[str, np.ndarray]:
        """
        Prepare target variables for training.

        Args:
            df: Preprocessed DataFrame

        Returns:
            Dictionary of target arrays
        """
        targets = {}

        for col in self.TARGET_COLUMNS:
            if col in df.columns:
                targets[col] = df[col].values

        return targets

    def create_dataset(
        self,
        df: pd.DataFrame,
        test_size: float = 0.15,
        val_size: float = 0.15,
        random_state: int = 42,
    ) -> TrainingDataset:
        """
        Create complete training dataset with train/val/test splits.

        Args:
            df: Raw DataFrame
            test_size: Fraction for test set
            val_size: Fraction for validation set
            random_state: Random seed for reproducibility

        Returns:
            TrainingDataset with all splits
        """
        # Preprocess
        df_processed = self.preprocess(df, fit=True)

        # Prepare features and targets
        X, feature_names = self.prepare_features(df_processed)
        y_dict = self.prepare_targets(df_processed)

        # First split: train+val and test
        train_val_size = 1 - test_size
        indices = np.arange(len(X))
        train_val_idx, test_idx = train_test_split(
            indices, test_size=test_size, random_state=random_state
        )

        # Second split: train and val
        val_fraction = val_size / train_val_size
        train_idx, val_idx = train_test_split(
            train_val_idx, test_size=val_fraction, random_state=random_state
        )

        # Split features
        X_train = X[train_idx]
        X_val = X[val_idx]
        X_test = X[test_idx]

        # Scale features
        X_train = self.scaler.fit_transform(X_train)
        X_val = self.scaler.transform(X_val)
        X_test = self.scaler.transform(X_test)

        # Split targets
        y_train = {k: v[train_idx] for k, v in y_dict.items()}
        y_val = {k: v[val_idx] for k, v in y_dict.items()}
        y_test = {k: v[test_idx] for k, v in y_dict.items()}

        # Metadata
        metadata = {
            "total_samples": len(X),
            "train_samples": len(train_idx),
            "val_samples": len(val_idx),
            "test_samples": len(test_idx),
            "num_features": X.shape[1],
            "created_at": datetime.utcnow().isoformat(),
        }

        logger.info(
            f"Created dataset: {metadata['train_samples']} train, "
            f"{metadata['val_samples']} val, {metadata['test_samples']} test samples"
        )

        return TrainingDataset(
            X_train=X_train,
            X_val=X_val,
            X_test=X_test,
            y_train=y_train,
            y_val=y_val,
            y_test=y_test,
            feature_names=feature_names,
            scaler=self.scaler,
            label_encoders=self.label_encoders,
            metadata=metadata,
        )

    def transform_inference_data(
        self,
        data: Dict[str, Any],
    ) -> np.ndarray:
        """
        Transform a single sample for inference.

        Args:
            data: Dictionary with feature values

        Returns:
            Transformed feature array
        """
        # Create single-row DataFrame
        df = pd.DataFrame([data])

        # Preprocess without fitting
        df_processed = self.preprocess(df, fit=False)

        # Prepare features
        X, _ = self.prepare_features(df_processed)

        # Scale
        X_scaled = self.scaler.transform(X)

        return X_scaled

    def get_feature_importance_names(self) -> List[str]:
        """Get human-readable feature names."""
        return self.feature_names
