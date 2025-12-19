import logging
from typing import Dict, Any, List, Optional
import numpy as np
from PIL import Image
import io
import torch
from transformers import CLIPProcessor, CLIPModel
import openai

from ..config import settings

logger = logging.getLogger(__name__)


class MLModels:
    """Machine learning models for content analysis and prediction."""

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")

        # Load CLIP model for visual understanding
        self.clip_model = CLIPModel.from_pretrained(settings.clip_model_name).to(self.device)
        self.clip_processor = CLIPProcessor.from_pretrained(settings.clip_model_name)

        # Initialize OpenAI client if available
        self.openai_client = openai.OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    async def extract_visual_features(self, content_data: bytes) -> Dict[str, Any]:
        """Extract visual features from image/video using CLIP."""
        try:
            # Load image
            image = Image.open(io.BytesIO(content_data))

            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Process with CLIP
            inputs = self.clip_processor(images=image, return_tensors="pt").to(self.device)

            with torch.no_grad():
                image_features = self.clip_model.get_image_features(**inputs)

            # Normalize features
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)

            # Calculate quality metrics
            quality_score = self._assess_image_quality(image)
            hook_strength = self._assess_hook_strength(image)
            pacing_score = 0.7  # Default for static images

            return {
                "embeddings": image_features.cpu().numpy().tolist(),
                "quality_score": quality_score,
                "hook_strength": hook_strength,
                "pacing_score": pacing_score,
                "resolution": f"{image.width}x{image.height}",
                "aspect_ratio": image.width / image.height
            }

        except Exception as e:
            logger.error(f"Error extracting visual features: {str(e)}")
            # Return default features
            return {
                "embeddings": [],
                "quality_score": 0.5,
                "hook_strength": 0.5,
                "pacing_score": 0.5
            }

    async def extract_text_features(
        self,
        caption: Optional[str],
        hashtags: List[str]
    ) -> Dict[str, Any]:
        """Extract features from text content."""
        try:
            text = " ".join([caption or "", " ".join(hashtags)])

            if not text.strip():
                return self._default_text_features()

            # Process with CLIP
            inputs = self.clip_processor(text=[text], return_tensors="pt", padding=True).to(self.device)

            with torch.no_grad():
                text_features = self.clip_model.get_text_features(**inputs)

            # Normalize features
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)

            # Analyze text characteristics
            has_cta = self._detect_call_to_action(caption or "")
            sentiment = self._analyze_sentiment(caption or "")
            hashtag_count = len(hashtags)

            return {
                "embeddings": text_features.cpu().numpy().tolist(),
                "has_call_to_action": has_cta,
                "sentiment": sentiment,
                "hashtag_count": hashtag_count,
                "word_count": len((caption or "").split()),
                "has_question": "?" in (caption or "")
            }

        except Exception as e:
            logger.error(f"Error extracting text features: {str(e)}")
            return self._default_text_features()

    async def calculate_relevance_score(
        self,
        visual_features: Dict[str, Any],
        text_features: Dict[str, Any],
        target_audience: Optional[Dict[str, Any]]
    ) -> float:
        """Calculate content relevance to target audience."""
        try:
            if not target_audience:
                return 0.7  # Default relevance

            # Simple relevance calculation based on features
            # In production, this would use a trained model
            base_score = 0.7

            # Adjust based on audience preferences
            if "interests" in target_audience:
                # Check alignment with interests using embeddings
                base_score += 0.1

            # Adjust for demographic match
            if "demographics" in target_audience:
                base_score += 0.05

            return min(base_score, 1.0)

        except Exception as e:
            logger.error(f"Error calculating relevance: {str(e)}")
            return 0.5

    async def analyze_emotional_impact(
        self,
        visual_features: Dict[str, Any],
        text_features: Dict[str, Any]
    ) -> float:
        """Analyze emotional impact of content."""
        try:
            # Base emotional score
            sentiment = text_features.get("sentiment", 0.5)

            # Visual elements that enhance emotion
            quality = visual_features.get("quality_score", 0.5)

            # Combine factors
            emotional_score = (sentiment * 0.6 + quality * 0.4)

            # Boost if content has strong hook
            if visual_features.get("hook_strength", 0) > 0.7:
                emotional_score *= 1.2

            return min(emotional_score, 1.0)

        except Exception as e:
            logger.error(f"Error analyzing emotional impact: {str(e)}")
            return 0.5

    async def calculate_trending_score(
        self,
        text_features: Dict[str, Any],
        platform: str
    ) -> float:
        """Calculate alignment with trending topics."""
        try:
            # In production, this would check against real trending data
            # For now, use simple heuristics

            base_score = 0.5

            # Hashtags indicate trend awareness
            hashtag_count = text_features.get("hashtag_count", 0)
            if hashtag_count >= 3:
                base_score += 0.2

            # Questions tend to perform well
            if text_features.get("has_question", False):
                base_score += 0.1

            return min(base_score, 1.0)

        except Exception as e:
            logger.error(f"Error calculating trending score: {str(e)}")
            return 0.5

    async def predict_metrics(
        self,
        visual_features: Dict[str, Any],
        text_features: Dict[str, Any],
        temporal_features: Dict[str, Any],
        platform: str
    ) -> Dict[str, Any]:
        """Predict engagement metrics."""
        try:
            # Base predictions (would use trained model in production)
            quality = visual_features.get("quality_score", 0.5)
            hook = visual_features.get("hook_strength", 0.5)
            has_cta = text_features.get("has_call_to_action", False)

            # Platform-specific base rates
            platform_multipliers = {
                "tiktok": {"views": 5000, "engagement": 0.08},
                "instagram": {"views": 3000, "engagement": 0.05},
                "youtube": {"views": 2000, "engagement": 0.03},
                "facebook": {"views": 1500, "engagement": 0.02}
            }

            multiplier = platform_multipliers.get(platform, {"views": 3000, "engagement": 0.05})

            # Calculate predictions
            quality_factor = (quality + hook) / 2
            base_views = int(multiplier["views"] * quality_factor * np.random.uniform(0.8, 1.2))
            base_engagement = multiplier["engagement"] * quality_factor

            predicted_views = max(base_views, 100)
            predicted_likes = int(predicted_views * base_engagement * 0.6)
            predicted_comments = int(predicted_views * base_engagement * 0.2)
            predicted_shares = int(predicted_views * base_engagement * 0.2)

            # Boost if has CTA
            if has_cta:
                predicted_comments = int(predicted_comments * 1.3)

            # Boost if optimal timing
            if temporal_features.get("is_peak_time", False):
                predicted_views = int(predicted_views * 1.2)

            return {
                "views": predicted_views,
                "likes": predicted_likes,
                "comments": predicted_comments,
                "shares": predicted_shares,
                "confidence": quality_factor
            }

        except Exception as e:
            logger.error(f"Error predicting metrics: {str(e)}")
            return {
                "views": 1000,
                "likes": 50,
                "comments": 10,
                "shares": 5,
                "confidence": 0.5
            }

    def _assess_image_quality(self, image: Image.Image) -> float:
        """Assess technical quality of image."""
        # Simple quality assessment based on resolution and sharpness
        width, height = image.size

        # Resolution score
        pixel_count = width * height
        resolution_score = min(pixel_count / (1920 * 1080), 1.0)

        # Aspect ratio score (prefer vertical for social)
        aspect_ratio = width / height
        if 0.5 <= aspect_ratio <= 0.6:  # 9:16 vertical
            aspect_score = 1.0
        elif 0.9 <= aspect_ratio <= 1.1:  # 1:1 square
            aspect_score = 0.9
        else:
            aspect_score = 0.7

        return (resolution_score * 0.6 + aspect_score * 0.4)

    def _assess_hook_strength(self, image: Image.Image) -> float:
        """Assess strength of visual hook."""
        # Simple heuristic - in production would use trained model
        # Check for bright, contrasting elements
        return 0.6 + np.random.uniform(-0.1, 0.2)

    def _detect_call_to_action(self, text: str) -> bool:
        """Detect presence of call-to-action."""
        cta_phrases = [
            "follow", "like", "comment", "share", "subscribe",
            "click", "link in bio", "tag", "try", "shop",
            "learn more", "dm me", "check out"
        ]

        text_lower = text.lower()
        return any(phrase in text_lower for phrase in cta_phrases)

    def _analyze_sentiment(self, text: str) -> float:
        """Analyze sentiment of text (0-1, higher is more positive)."""
        # Simple sentiment analysis
        positive_words = ["love", "amazing", "great", "best", "awesome", "perfect", "excellent"]
        negative_words = ["hate", "bad", "worst", "terrible", "awful", "horrible"]

        text_lower = text.lower()

        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)

        if positive_count + negative_count == 0:
            return 0.5  # Neutral

        sentiment = (positive_count - negative_count) / (positive_count + negative_count + 1)
        return (sentiment + 1) / 2  # Normalize to 0-1

    def _default_text_features(self) -> Dict[str, Any]:
        """Return default text features."""
        return {
            "embeddings": [],
            "has_call_to_action": False,
            "sentiment": 0.5,
            "hashtag_count": 0,
            "word_count": 0,
            "has_question": False
        }
