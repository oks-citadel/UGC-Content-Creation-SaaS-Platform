"""
Trend Feature Extractor.

Extracts features related to trending topics, sounds, and formats
for viral potential prediction.
"""

import logging
from typing import Dict, Any, Optional, List, Set
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np
import re

logger = logging.getLogger(__name__)


@dataclass
class TrendFeatureSet:
    """Complete set of extracted trend features."""
    # Overall alignment
    overall_trend_score: float
    trending_momentum: float  # How fast trend is growing

    # Hashtag trends
    hashtag_trend_score: float
    trending_hashtags_used: List[str]
    hashtag_trend_velocity: float

    # Sound/Audio trends (for video)
    sound_trend_score: float
    trending_sound_used: bool
    sound_id: Optional[str]

    # Format trends
    format_trend_score: float
    uses_trending_format: bool
    format_type: Optional[str]

    # Topic trends
    topic_trend_score: float
    trending_topics_aligned: List[str]

    # Temporal factors
    trend_freshness: float  # How new the trend is
    trend_saturation: float  # How oversaturated
    optimal_timing_score: float

    # Platform specifics
    platform: str
    platform_trend_boost: float


@dataclass
class TrendingItem:
    """A trending item (hashtag, sound, topic, etc.)."""
    item_id: str
    item_type: str  # hashtag, sound, topic, format
    name: str
    trend_score: float  # 0-1
    velocity: float  # Rate of growth
    saturation: float  # How oversaturated
    started_trending: datetime
    category: Optional[str] = None


class TrendFeatureExtractor:
    """
    Extracts trend-related features from content.

    Analyzes alignment with trending hashtags, sounds, topics,
    and formats to predict viral potential.
    """

    # Common trending format patterns
    TRENDING_FORMATS = {
        "get_ready_with_me": ["grwm", "get ready with me", "get ready"],
        "day_in_life": ["day in my life", "day in the life", "ditl"],
        "storytime": ["storytime", "story time", "let me tell you"],
        "tutorial": ["tutorial", "how to", "diy", "step by step"],
        "transformation": ["before and after", "glow up", "transformation"],
        "reaction": ["reacting to", "reaction", "watching"],
        "pov": ["pov", "point of view"],
        "outfit_check": ["ootd", "outfit of the day", "outfit check"],
        "unboxing": ["unboxing", "haul", "what i got"],
        "challenge": ["challenge", "trend", "trying"],
    }

    def __init__(self):
        self.trending_hashtags: Dict[str, TrendingItem] = {}
        self.trending_sounds: Dict[str, TrendingItem] = {}
        self.trending_topics: Dict[str, TrendingItem] = {}
        self.last_update: Optional[datetime] = None

    def update_trends(
        self,
        hashtags: List[Dict[str, Any]] = None,
        sounds: List[Dict[str, Any]] = None,
        topics: List[Dict[str, Any]] = None,
    ) -> None:
        """Update the trending data."""
        now = datetime.utcnow()

        if hashtags:
            for h in hashtags:
                self.trending_hashtags[h["name"].lower()] = TrendingItem(
                    item_id=h.get("id", h["name"]),
                    item_type="hashtag",
                    name=h["name"],
                    trend_score=h.get("score", 0.5),
                    velocity=h.get("velocity", 0.0),
                    saturation=h.get("saturation", 0.3),
                    started_trending=h.get("started", now - timedelta(days=3)),
                    category=h.get("category"),
                )

        if sounds:
            for s in sounds:
                self.trending_sounds[s["id"]] = TrendingItem(
                    item_id=s["id"],
                    item_type="sound",
                    name=s.get("name", ""),
                    trend_score=s.get("score", 0.5),
                    velocity=s.get("velocity", 0.0),
                    saturation=s.get("saturation", 0.3),
                    started_trending=s.get("started", now - timedelta(days=3)),
                    category=s.get("category"),
                )

        if topics:
            for t in topics:
                self.trending_topics[t["name"].lower()] = TrendingItem(
                    item_id=t.get("id", t["name"]),
                    item_type="topic",
                    name=t["name"],
                    trend_score=t.get("score", 0.5),
                    velocity=t.get("velocity", 0.0),
                    saturation=t.get("saturation", 0.3),
                    started_trending=t.get("started", now - timedelta(days=3)),
                    category=t.get("category"),
                )

        self.last_update = now

    def extract(
        self,
        caption: Optional[str] = None,
        hashtags: Optional[List[str]] = None,
        sound_id: Optional[str] = None,
        content_type: str = "video",
        platform: str = "tiktok",
    ) -> TrendFeatureSet:
        """
        Extract trend-related features from content.

        Args:
            caption: Content caption text
            hashtags: List of hashtags used
            sound_id: ID of sound/audio used (for video)
            content_type: Type of content
            platform: Target platform

        Returns:
            TrendFeatureSet with all trend features
        """
        caption_lower = (caption or "").lower()
        hashtags_lower = [h.lower().strip("#") for h in (hashtags or [])]

        # Hashtag trend analysis
        hashtag_features = self._analyze_hashtag_trends(hashtags_lower)

        # Sound trend analysis
        sound_features = self._analyze_sound_trends(sound_id)

        # Format trend analysis
        format_features = self._analyze_format_trends(caption_lower)

        # Topic trend analysis
        topic_features = self._analyze_topic_trends(caption_lower, hashtags_lower)

        # Calculate overall trend score
        weights = {"hashtag": 0.3, "sound": 0.3, "format": 0.2, "topic": 0.2}

        if content_type != "video":
            weights["sound"] = 0.0
            weights["hashtag"] = 0.4
            weights["format"] = 0.3
            weights["topic"] = 0.3

        overall_score = (
            hashtag_features["score"] * weights["hashtag"] +
            sound_features["score"] * weights["sound"] +
            format_features["score"] * weights["format"] +
            topic_features["score"] * weights["topic"]
        )

        # Calculate momentum
        momentum = np.mean([
            hashtag_features["velocity"],
            sound_features.get("velocity", 0),
            topic_features.get("velocity", 0),
        ])

        # Calculate optimal timing
        optimal_timing = self._calculate_timing_score(
            hashtag_features, sound_features, topic_features
        )

        # Platform trend boost
        platform_boost = self._get_platform_boost(platform, overall_score)

        return TrendFeatureSet(
            overall_trend_score=overall_score,
            trending_momentum=momentum,
            hashtag_trend_score=hashtag_features["score"],
            trending_hashtags_used=hashtag_features["matching"],
            hashtag_trend_velocity=hashtag_features["velocity"],
            sound_trend_score=sound_features["score"],
            trending_sound_used=sound_features["is_trending"],
            sound_id=sound_id,
            format_trend_score=format_features["score"],
            uses_trending_format=format_features["is_trending"],
            format_type=format_features["format_type"],
            topic_trend_score=topic_features["score"],
            trending_topics_aligned=topic_features["matching"],
            trend_freshness=self._calculate_freshness(hashtag_features, sound_features),
            trend_saturation=self._calculate_saturation(hashtag_features, sound_features),
            optimal_timing_score=optimal_timing,
            platform=platform,
            platform_trend_boost=platform_boost,
        )

    def _analyze_hashtag_trends(self, hashtags: List[str]) -> Dict[str, Any]:
        """Analyze hashtag trend alignment."""
        if not hashtags:
            return {
                "score": 0.3,
                "matching": [],
                "velocity": 0.0,
                "saturation": 0.5,
            }

        matching = []
        velocities = []
        saturations = []

        for hashtag in hashtags:
            if hashtag in self.trending_hashtags:
                trend = self.trending_hashtags[hashtag]
                matching.append(hashtag)
                velocities.append(trend.velocity)
                saturations.append(trend.saturation)

        if not matching:
            return {
                "score": 0.3,
                "matching": [],
                "velocity": 0.0,
                "saturation": 0.5,
            }

        # Score based on how many trending hashtags are used
        coverage = len(matching) / max(len(hashtags), 1)

        # Weight by trend scores
        trend_scores = [self.trending_hashtags[h].trend_score for h in matching]
        avg_trend_score = np.mean(trend_scores)

        score = min(coverage * 0.5 + avg_trend_score * 0.5, 1.0)

        return {
            "score": score,
            "matching": matching,
            "velocity": np.mean(velocities) if velocities else 0.0,
            "saturation": np.mean(saturations) if saturations else 0.5,
        }

    def _analyze_sound_trends(self, sound_id: Optional[str]) -> Dict[str, Any]:
        """Analyze sound/audio trend alignment."""
        if not sound_id:
            return {
                "score": 0.5,
                "is_trending": False,
                "velocity": 0.0,
            }

        if sound_id in self.trending_sounds:
            trend = self.trending_sounds[sound_id]
            return {
                "score": trend.trend_score,
                "is_trending": True,
                "velocity": trend.velocity,
                "saturation": trend.saturation,
            }

        return {
            "score": 0.4,
            "is_trending": False,
            "velocity": 0.0,
        }

    def _analyze_format_trends(self, caption: str) -> Dict[str, Any]:
        """Analyze content format trend alignment."""
        detected_format = None
        is_trending = False

        for format_name, patterns in self.TRENDING_FORMATS.items():
            for pattern in patterns:
                if pattern in caption:
                    detected_format = format_name
                    is_trending = True
                    break
            if detected_format:
                break

        if is_trending:
            # Some formats trend more than others
            format_popularity = {
                "get_ready_with_me": 0.85,
                "pov": 0.8,
                "day_in_life": 0.75,
                "storytime": 0.7,
                "tutorial": 0.65,
                "transformation": 0.8,
                "reaction": 0.6,
                "outfit_check": 0.7,
                "unboxing": 0.6,
                "challenge": 0.75,
            }
            score = format_popularity.get(detected_format, 0.6)
        else:
            score = 0.4

        return {
            "score": score,
            "is_trending": is_trending,
            "format_type": detected_format,
        }

    def _analyze_topic_trends(
        self,
        caption: str,
        hashtags: List[str],
    ) -> Dict[str, Any]:
        """Analyze topic trend alignment."""
        matching = []
        velocities = []

        # Check topics in caption and hashtags
        combined_text = caption + " " + " ".join(hashtags)

        for topic_name, trend in self.trending_topics.items():
            if topic_name in combined_text:
                matching.append(topic_name)
                velocities.append(trend.velocity)

        if not matching:
            return {
                "score": 0.4,
                "matching": [],
                "velocity": 0.0,
            }

        topic_scores = [self.trending_topics[t].trend_score for t in matching]
        score = min(np.mean(topic_scores) * 1.2, 1.0)  # Slight boost for topic alignment

        return {
            "score": score,
            "matching": matching,
            "velocity": np.mean(velocities) if velocities else 0.0,
        }

    def _calculate_freshness(
        self,
        hashtag_features: Dict[str, Any],
        sound_features: Dict[str, Any],
    ) -> float:
        """Calculate trend freshness (newer = better potential)."""
        now = datetime.utcnow()
        freshness_scores = []

        # Check hashtag freshness
        for hashtag in hashtag_features.get("matching", []):
            if hashtag in self.trending_hashtags:
                trend = self.trending_hashtags[hashtag]
                if trend.started_trending:
                    days_old = (now - trend.started_trending).days
                    freshness = max(0, 1 - (days_old / 14))  # 2 weeks decay
                    freshness_scores.append(freshness)

        if freshness_scores:
            return np.mean(freshness_scores)
        return 0.5

    def _calculate_saturation(
        self,
        hashtag_features: Dict[str, Any],
        sound_features: Dict[str, Any],
    ) -> float:
        """Calculate trend saturation (less saturated = better potential)."""
        saturation_scores = []

        # Get saturation from hashtags
        if "saturation" in hashtag_features:
            saturation_scores.append(hashtag_features["saturation"])

        # Get saturation from sound
        if "saturation" in sound_features:
            saturation_scores.append(sound_features["saturation"])

        if saturation_scores:
            return np.mean(saturation_scores)
        return 0.5

    def _calculate_timing_score(
        self,
        hashtag_features: Dict[str, Any],
        sound_features: Dict[str, Any],
        topic_features: Dict[str, Any],
    ) -> float:
        """Calculate optimal timing score based on trend lifecycle."""
        # Best timing: catching rising trends early
        velocity = np.mean([
            hashtag_features.get("velocity", 0),
            sound_features.get("velocity", 0),
            topic_features.get("velocity", 0),
        ])

        saturation = self._calculate_saturation(hashtag_features, sound_features)

        # High velocity + low saturation = optimal timing
        if velocity > 0.5 and saturation < 0.4:
            return 0.9
        elif velocity > 0.3 and saturation < 0.6:
            return 0.7
        elif velocity > 0 and saturation < 0.8:
            return 0.5
        else:
            return 0.3

    def _get_platform_boost(self, platform: str, base_score: float) -> float:
        """Get platform-specific trend boost."""
        # Some platforms reward trend participation more
        platform_multipliers = {
            "tiktok": 1.3,
            "instagram": 1.1,
            "youtube": 1.0,
            "facebook": 0.9,
            "pinterest": 0.8,
        }
        multiplier = platform_multipliers.get(platform.lower(), 1.0)

        return min(base_score * multiplier, 1.0)

    def to_feature_array(self, features: TrendFeatureSet) -> np.ndarray:
        """Convert TrendFeatureSet to numpy array for ML models."""
        return np.array([
            features.overall_trend_score,
            features.trending_momentum,
            features.hashtag_trend_score,
            len(features.trending_hashtags_used) / 10,  # Normalize
            features.hashtag_trend_velocity,
            features.sound_trend_score,
            float(features.trending_sound_used),
            features.format_trend_score,
            float(features.uses_trending_format),
            features.topic_trend_score,
            len(features.trending_topics_aligned) / 5,  # Normalize
            features.trend_freshness,
            features.trend_saturation,
            features.optimal_timing_score,
            features.platform_trend_boost,
        ])

    def get_trending_hashtags(self, limit: int = 20) -> List[TrendingItem]:
        """Get top trending hashtags."""
        sorted_hashtags = sorted(
            self.trending_hashtags.values(),
            key=lambda x: x.trend_score,
            reverse=True,
        )
        return sorted_hashtags[:limit]

    def get_trending_sounds(self, limit: int = 20) -> List[TrendingItem]:
        """Get top trending sounds."""
        sorted_sounds = sorted(
            self.trending_sounds.values(),
            key=lambda x: x.trend_score,
            reverse=True,
        )
        return sorted_sounds[:limit]
