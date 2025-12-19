"""
Base Platform Optimizer

Abstract base class that defines the interface for platform-specific optimizers.
Each platform (TikTok, Instagram, YouTube, Facebook, Pinterest) implements this
interface with their specific strategies and best practices.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any
from enum import Enum


class ContentFormat(str, Enum):
    """Supported content formats."""
    VIDEO = "video"
    IMAGE = "image"
    CAROUSEL = "carousel"
    STORY = "story"
    REEL = "reel"
    SHORT = "short"
    PIN = "pin"


@dataclass
class PlatformConfig:
    """Configuration and best practices for a platform."""
    platform_name: str
    optimal_video_duration: tuple  # (min_seconds, max_seconds)
    optimal_aspect_ratio: str  # e.g., "9:16", "1:1", "16:9"
    optimal_hashtag_count: tuple  # (min, max)
    optimal_caption_length: tuple  # (min_chars, max_chars)
    supported_formats: List[ContentFormat]
    posting_frequency: str  # e.g., "1-3x daily"
    peak_posting_times: List[str]  # e.g., ["7-9 AM", "12-3 PM"]
    algorithm_priorities: List[str]  # What the algorithm values most
    unique_features: List[str]  # Platform-specific features to leverage


@dataclass
class OptimizationTip:
    """A specific optimization tip for the platform."""
    category: str
    tip: str
    impact: str  # "high", "medium", "low"
    implementation: str
    example: Optional[str] = None


@dataclass
class TrendingElement:
    """A trending element on the platform."""
    element_type: str  # "sound", "hashtag", "format", "effect"
    name: str
    trend_strength: float  # 0.0 to 1.0
    relevance_score: float  # How relevant to the content
    usage_suggestion: str


@dataclass
class PlatformAnalysis:
    """Analysis results specific to a platform."""
    platform_score: float  # 0-100
    format_optimization: Dict[str, Any]
    timing_optimization: Dict[str, Any]
    content_optimization: Dict[str, Any]
    trending_opportunities: List[TrendingElement]
    platform_specific_tips: List[OptimizationTip]
    algorithm_alignment_score: float
    competitive_analysis: Dict[str, Any]


class BasePlatformOptimizer(ABC):
    """
    Abstract base class for platform-specific optimization strategies.

    Each platform optimizer must implement these methods to provide
    platform-specific recommendations and analysis.
    """

    def __init__(self):
        self.config = self._get_platform_config()

    @abstractmethod
    def _get_platform_config(self) -> PlatformConfig:
        """Return the platform configuration and best practices."""
        pass

    @abstractmethod
    def analyze_content(
        self,
        content_type: str,
        duration: Optional[float],
        caption: Optional[str],
        hashtags: List[str],
        visual_features: Dict[str, Any],
        text_features: Dict[str, Any]
    ) -> PlatformAnalysis:
        """
        Analyze content specifically for this platform.

        Returns platform-specific scores and recommendations.
        """
        pass

    @abstractmethod
    def get_hook_recommendations(
        self,
        current_hook_score: float,
        content_type: str
    ) -> List[OptimizationTip]:
        """Get platform-specific hook recommendations."""
        pass

    @abstractmethod
    def get_hashtag_strategy(
        self,
        current_hashtags: List[str],
        content_category: Optional[str]
    ) -> Dict[str, Any]:
        """Get platform-specific hashtag strategy."""
        pass

    @abstractmethod
    def get_optimal_posting_times(
        self,
        target_audience: Optional[Dict[str, Any]],
        content_type: str
    ) -> Dict[str, Any]:
        """Get platform-specific optimal posting times."""
        pass

    @abstractmethod
    def get_format_recommendations(
        self,
        current_format: str,
        duration: Optional[float],
        aspect_ratio: Optional[str]
    ) -> List[OptimizationTip]:
        """Get platform-specific format recommendations."""
        pass

    @abstractmethod
    def get_trending_sounds(self) -> List[TrendingElement]:
        """Get currently trending sounds/audio for the platform."""
        pass

    @abstractmethod
    def get_cta_recommendations(
        self,
        current_cta: Optional[str],
        content_type: str
    ) -> List[OptimizationTip]:
        """Get platform-specific CTA recommendations."""
        pass

    @abstractmethod
    def get_algorithm_tips(self) -> List[OptimizationTip]:
        """Get tips for optimizing for the platform's algorithm."""
        pass

    # Common helper methods that can be used by all platform optimizers

    def calculate_format_score(
        self,
        duration: Optional[float],
        aspect_ratio: Optional[str]
    ) -> float:
        """Calculate how well the format matches platform best practices."""
        score = 0.5  # Base score

        if duration:
            min_dur, max_dur = self.config.optimal_video_duration
            if min_dur <= duration <= max_dur:
                score += 0.3
            elif duration < min_dur * 0.5 or duration > max_dur * 1.5:
                score -= 0.2

        if aspect_ratio == self.config.optimal_aspect_ratio:
            score += 0.2

        return max(0.0, min(1.0, score))

    def calculate_hashtag_score(self, hashtag_count: int) -> float:
        """Calculate how well the hashtag count matches platform best practices."""
        min_tags, max_tags = self.config.optimal_hashtag_count

        if min_tags <= hashtag_count <= max_tags:
            return 1.0
        elif hashtag_count < min_tags:
            return max(0.3, hashtag_count / min_tags)
        else:
            # Too many hashtags
            return max(0.5, 1.0 - (hashtag_count - max_tags) * 0.1)

    def calculate_caption_score(self, caption_length: int) -> float:
        """Calculate how well the caption length matches platform best practices."""
        min_len, max_len = self.config.optimal_caption_length

        if min_len <= caption_length <= max_len:
            return 1.0
        elif caption_length < min_len:
            return max(0.3, caption_length / min_len)
        else:
            # Slightly over is okay, way over is not
            over_ratio = (caption_length - max_len) / max_len
            return max(0.5, 1.0 - over_ratio * 0.3)

    def get_platform_name(self) -> str:
        """Get the platform name."""
        return self.config.platform_name

    def get_supported_formats(self) -> List[ContentFormat]:
        """Get supported content formats for this platform."""
        return self.config.supported_formats
