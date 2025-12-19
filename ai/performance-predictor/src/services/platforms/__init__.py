"""
Platform-specific optimization strategies for the Performance Predictor.

Each platform has unique algorithm behaviors, best practices, and optimal
content parameters. These optimizers provide platform-specific recommendations.
"""

from .base_optimizer import BasePlatformOptimizer, PlatformConfig
from .tiktok_optimizer import TikTokOptimizer
from .instagram_optimizer import InstagramOptimizer
from .youtube_optimizer import YouTubeOptimizer
from .facebook_optimizer import FacebookOptimizer
from .pinterest_optimizer import PinterestOptimizer

__all__ = [
    "BasePlatformOptimizer",
    "PlatformConfig",
    "TikTokOptimizer",
    "InstagramOptimizer",
    "YouTubeOptimizer",
    "FacebookOptimizer",
    "PinterestOptimizer",
]
