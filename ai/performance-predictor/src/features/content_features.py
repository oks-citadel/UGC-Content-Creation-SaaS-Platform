"""
Content Feature Extractor.

Extracts features from content including visual quality, text analysis,
hashtag analysis, and content structure for engagement prediction.
"""

import logging
import re
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import numpy as np
from PIL import Image
import io

logger = logging.getLogger(__name__)


@dataclass
class ContentFeatureSet:
    """Complete set of extracted content features."""
    # Visual features
    visual_quality_score: float
    resolution_score: float
    aspect_ratio_score: float
    brightness_score: float
    contrast_score: float

    # Text features
    caption_length: int
    word_count: int
    hashtag_count: int
    mention_count: int
    emoji_count: int
    has_cta: bool
    question_count: int
    exclamation_count: int

    # Content structure
    hook_indicators: float
    content_length_seconds: Optional[float]
    estimated_reading_time: float

    # Hashtag analysis
    hashtag_diversity: float
    trending_hashtag_ratio: float
    niche_hashtag_ratio: float

    # Engagement indicators
    engagement_hooks: List[str]
    cta_type: Optional[str]
    sentiment_score: float

    # Metadata
    content_type: str
    platform: str


class ContentFeatureExtractor:
    """
    Extracts comprehensive features from content for ML prediction.

    Analyzes visual content, captions, hashtags, and structure to
    generate features for engagement and viral prediction.
    """

    # CTA patterns by type
    CTA_PATTERNS = {
        "follow": [r"follow\s*(me|us)?", r"hit\s*follow", r"follow\s*for"],
        "like": [r"like\s*(this)?", r"double\s*tap", r"smash\s*(the\s*)?like"],
        "comment": [r"comment\s*(below)?", r"let\s*me\s*know", r"tell\s*(me|us)"],
        "share": [r"share\s*(this)?", r"tag\s*(a\s*)?friend", r"send\s*(to|this)"],
        "save": [r"save\s*(this)?", r"bookmark", r"save\s*for\s*later"],
        "link": [r"link\s*in\s*bio", r"click\s*(the\s*)?link", r"check\s*(out\s*)?link"],
        "subscribe": [r"subscribe", r"turn\s*on\s*notifications", r"hit\s*(the\s*)?bell"],
    }

    # Engagement hook phrases
    HOOK_PHRASES = [
        r"wait\s*(for\s*it|till\s*(the\s*)?end)",
        r"you\s*won't\s*believe",
        r"watch\s*till\s*(the\s*)?end",
        r"stay\s*(till|to)\s*(the\s*)?end",
        r"this\s*(is\s*)?crazy",
        r"plot\s*twist",
        r"i\s*was\s*shocked",
        r"game\s*changer",
        r"life\s*hack",
        r"must\s*(see|watch|know)",
        r"secret\s*(tip|trick|hack)",
        r"unpopular\s*opinion",
    ]

    # Positive sentiment words
    POSITIVE_WORDS = [
        "love", "amazing", "awesome", "great", "best", "perfect", "beautiful",
        "incredible", "fantastic", "excellent", "wonderful", "brilliant", "superb",
        "happy", "excited", "grateful", "blessed", "inspired", "motivating"
    ]

    # Negative sentiment words
    NEGATIVE_WORDS = [
        "hate", "bad", "worst", "terrible", "awful", "horrible", "disgusting",
        "disappointing", "frustrating", "annoying", "angry", "sad", "failed"
    ]

    def __init__(self, trending_hashtags: Optional[List[str]] = None):
        self.trending_hashtags = set(h.lower() for h in (trending_hashtags or []))

    def extract(
        self,
        content_data: Optional[bytes] = None,
        caption: Optional[str] = None,
        hashtags: Optional[List[str]] = None,
        content_type: str = "video",
        platform: str = "instagram",
        duration_seconds: Optional[float] = None,
    ) -> ContentFeatureSet:
        """
        Extract comprehensive features from content.

        Args:
            content_data: Raw content bytes (image/video thumbnail)
            caption: Post caption text
            hashtags: List of hashtags
            content_type: Type of content (video, image, carousel)
            platform: Target platform
            duration_seconds: Video duration if applicable

        Returns:
            ContentFeatureSet with all extracted features
        """
        # Extract visual features
        visual_features = self._extract_visual_features(content_data) if content_data else {}

        # Extract text features
        text_features = self._extract_text_features(caption or "", hashtags or [])

        # Extract hashtag features
        hashtag_features = self._extract_hashtag_features(hashtags or [])

        # Extract engagement indicators
        engagement_features = self._extract_engagement_features(caption or "")

        return ContentFeatureSet(
            # Visual
            visual_quality_score=visual_features.get("quality_score", 0.7),
            resolution_score=visual_features.get("resolution_score", 0.7),
            aspect_ratio_score=visual_features.get("aspect_ratio_score", 0.8),
            brightness_score=visual_features.get("brightness_score", 0.7),
            contrast_score=visual_features.get("contrast_score", 0.7),
            # Text
            caption_length=text_features["caption_length"],
            word_count=text_features["word_count"],
            hashtag_count=text_features["hashtag_count"],
            mention_count=text_features["mention_count"],
            emoji_count=text_features["emoji_count"],
            has_cta=text_features["has_cta"],
            question_count=text_features["question_count"],
            exclamation_count=text_features["exclamation_count"],
            # Structure
            hook_indicators=engagement_features["hook_strength"],
            content_length_seconds=duration_seconds,
            estimated_reading_time=text_features["reading_time"],
            # Hashtags
            hashtag_diversity=hashtag_features["diversity"],
            trending_hashtag_ratio=hashtag_features["trending_ratio"],
            niche_hashtag_ratio=hashtag_features["niche_ratio"],
            # Engagement
            engagement_hooks=engagement_features["hooks_found"],
            cta_type=engagement_features["cta_type"],
            sentiment_score=engagement_features["sentiment"],
            # Metadata
            content_type=content_type,
            platform=platform,
        )

    def _extract_visual_features(self, content_data: bytes) -> Dict[str, float]:
        """Extract visual quality features from image data."""
        try:
            image = Image.open(io.BytesIO(content_data))

            # Convert to RGB if needed
            if image.mode != "RGB":
                image = image.convert("RGB")

            # Resolution score
            width, height = image.size
            pixel_count = width * height
            resolution_score = min(pixel_count / (1920 * 1080), 1.0)

            # Aspect ratio score (prefer vertical for social)
            aspect_ratio = width / height
            if 0.5 <= aspect_ratio <= 0.6:  # 9:16
                aspect_ratio_score = 1.0
            elif 0.9 <= aspect_ratio <= 1.1:  # 1:1
                aspect_ratio_score = 0.9
            elif 1.7 <= aspect_ratio <= 1.8:  # 16:9
                aspect_ratio_score = 0.7
            else:
                aspect_ratio_score = 0.6

            # Brightness and contrast from histogram
            img_array = np.array(image)
            brightness = np.mean(img_array) / 255
            brightness_score = 1.0 - abs(brightness - 0.5) * 2  # Prefer mid-brightness

            # Contrast score
            contrast = np.std(img_array) / 128
            contrast_score = min(contrast, 1.0)

            # Overall quality score
            quality_score = (
                resolution_score * 0.3 +
                aspect_ratio_score * 0.3 +
                brightness_score * 0.2 +
                contrast_score * 0.2
            )

            return {
                "quality_score": quality_score,
                "resolution_score": resolution_score,
                "aspect_ratio_score": aspect_ratio_score,
                "brightness_score": brightness_score,
                "contrast_score": contrast_score,
            }

        except Exception as e:
            logger.warning(f"Failed to extract visual features: {e}")
            return {
                "quality_score": 0.7,
                "resolution_score": 0.7,
                "aspect_ratio_score": 0.8,
                "brightness_score": 0.7,
                "contrast_score": 0.7,
            }

    def _extract_text_features(
        self,
        caption: str,
        hashtags: List[str],
    ) -> Dict[str, Any]:
        """Extract text-based features from caption."""
        # Basic counts
        caption_length = len(caption)
        words = caption.split()
        word_count = len(words)

        # Hashtag count (from caption + explicit list)
        caption_hashtags = re.findall(r"#\w+", caption)
        hashtag_count = len(set(caption_hashtags + hashtags))

        # Mention count
        mention_count = len(re.findall(r"@\w+", caption))

        # Emoji count (simplified pattern)
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # emoticons
            "\U0001F300-\U0001F5FF"  # symbols & pictographs
            "\U0001F680-\U0001F6FF"  # transport & map symbols
            "\U0001F1E0-\U0001F1FF"  # flags
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+",
            flags=re.UNICODE,
        )
        emoji_count = len(emoji_pattern.findall(caption))

        # CTA detection
        has_cta = any(
            re.search(pattern, caption.lower())
            for patterns in self.CTA_PATTERNS.values()
            for pattern in patterns
        )

        # Question and exclamation counts
        question_count = caption.count("?")
        exclamation_count = caption.count("!")

        # Estimated reading time (words per minute = 200)
        reading_time = word_count / 200

        return {
            "caption_length": caption_length,
            "word_count": word_count,
            "hashtag_count": hashtag_count,
            "mention_count": mention_count,
            "emoji_count": emoji_count,
            "has_cta": has_cta,
            "question_count": question_count,
            "exclamation_count": exclamation_count,
            "reading_time": reading_time,
        }

    def _extract_hashtag_features(self, hashtags: List[str]) -> Dict[str, float]:
        """Extract hashtag-related features."""
        if not hashtags:
            return {
                "diversity": 0.0,
                "trending_ratio": 0.0,
                "niche_ratio": 0.0,
            }

        hashtags_lower = [h.lower().strip("#") for h in hashtags]
        unique_count = len(set(hashtags_lower))

        # Diversity: unique hashtags / total
        diversity = unique_count / len(hashtags) if hashtags else 0

        # Trending ratio
        trending_count = sum(1 for h in hashtags_lower if h in self.trending_hashtags)
        trending_ratio = trending_count / len(hashtags) if hashtags else 0

        # Niche ratio (hashtags with < 10 chars often more niche)
        niche_count = sum(1 for h in hashtags_lower if len(h) > 15)
        niche_ratio = niche_count / len(hashtags) if hashtags else 0

        return {
            "diversity": diversity,
            "trending_ratio": trending_ratio,
            "niche_ratio": niche_ratio,
        }

    def _extract_engagement_features(self, caption: str) -> Dict[str, Any]:
        """Extract engagement-related features from caption."""
        caption_lower = caption.lower()

        # Find engagement hooks
        hooks_found = []
        for hook_pattern in self.HOOK_PHRASES:
            if re.search(hook_pattern, caption_lower):
                hooks_found.append(hook_pattern)

        hook_strength = min(len(hooks_found) / 3, 1.0)

        # Detect CTA type
        cta_type = None
        for cta_name, patterns in self.CTA_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, caption_lower):
                    cta_type = cta_name
                    break
            if cta_type:
                break

        # Sentiment analysis
        positive_count = sum(1 for word in self.POSITIVE_WORDS if word in caption_lower)
        negative_count = sum(1 for word in self.NEGATIVE_WORDS if word in caption_lower)

        if positive_count + negative_count == 0:
            sentiment = 0.5  # Neutral
        else:
            sentiment = (positive_count - negative_count + 1) / (positive_count + negative_count + 2)

        return {
            "hooks_found": hooks_found,
            "hook_strength": hook_strength,
            "cta_type": cta_type,
            "sentiment": sentiment,
        }

    def to_feature_array(self, features: ContentFeatureSet) -> np.ndarray:
        """Convert ContentFeatureSet to numpy array for ML models."""
        return np.array([
            features.visual_quality_score,
            features.resolution_score,
            features.aspect_ratio_score,
            features.brightness_score,
            features.contrast_score,
            features.caption_length / 500,  # Normalize
            features.word_count / 100,
            features.hashtag_count / 30,
            features.mention_count / 10,
            features.emoji_count / 20,
            float(features.has_cta),
            features.question_count / 5,
            features.exclamation_count / 5,
            features.hook_indicators,
            (features.content_length_seconds or 30) / 60,
            features.hashtag_diversity,
            features.trending_hashtag_ratio,
            features.niche_hashtag_ratio,
            features.sentiment_score,
        ])

    def update_trending_hashtags(self, hashtags: List[str]) -> None:
        """Update the list of trending hashtags."""
        self.trending_hashtags = set(h.lower() for h in hashtags)
