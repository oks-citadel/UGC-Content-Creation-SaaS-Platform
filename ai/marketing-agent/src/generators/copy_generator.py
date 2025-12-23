"""Marketing copy generator using OpenAI."""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any
from openai import AsyncOpenAI
import logging

from ..config import Settings
from ..models import (
    CopyGenerateRequest,
    CopyGenerateResponse,
    CopyVariation,
    Platform,
    ContentType,
    CopyTone,
)

logger = logging.getLogger(__name__)


class CopyGenerator:
    """Generate marketing copy with multiple variations using AI."""

    # Platform-specific guidelines
    PLATFORM_GUIDELINES = {
        Platform.TIKTOK: {
            "max_caption_length": 2200,
            "optimal_length": 150,
            "style": "casual, trendy, authentic",
            "hashtag_count": "3-5",
            "cta_style": "action-oriented, urgent"
        },
        Platform.INSTAGRAM: {
            "max_caption_length": 2200,
            "optimal_length": 200,
            "style": "polished, aspirational, lifestyle-focused",
            "hashtag_count": "10-15",
            "cta_style": "engaging, story-driven"
        },
        Platform.YOUTUBE: {
            "max_caption_length": 5000,
            "optimal_length": 300,
            "style": "informative, SEO-optimized, value-focused",
            "hashtag_count": "3-5",
            "cta_style": "subscribe-focused, community-building"
        },
        Platform.FACEBOOK: {
            "max_caption_length": 63206,
            "optimal_length": 250,
            "style": "conversational, community-oriented",
            "hashtag_count": "1-2",
            "cta_style": "soft-sell, relationship-building"
        },
        Platform.TWITTER: {
            "max_caption_length": 280,
            "optimal_length": 200,
            "style": "concise, witty, timely",
            "hashtag_count": "1-2",
            "cta_style": "direct, click-worthy"
        },
        Platform.PINTEREST: {
            "max_caption_length": 500,
            "optimal_length": 150,
            "style": "descriptive, SEO-rich, inspirational",
            "hashtag_count": "2-5",
            "cta_style": "action-oriented, save-worthy"
        }
    }

    def __init__(self, client: AsyncOpenAI, settings: Settings):
        self.client = client
        self.settings = settings

    async def generate(self, request: CopyGenerateRequest) -> CopyGenerateResponse:
        """Generate marketing copy variations."""
        request_id = str(uuid.uuid4())[:8]

        # Get platform guidelines
        guidelines = self.PLATFORM_GUIDELINES.get(request.platform, {})

        # Generate copy variations
        variations = await self._generate_variations(request, guidelines)

        # Check brand voice consistency
        consistency_score = await self._check_brand_voice_consistency(
            variations, request.brand_voice
        )

        # Find best variation
        best_variation_id = max(
            variations, key=lambda v: v.estimated_engagement_score
        ).variation_id

        # Generate optimization tips
        tips = await self._generate_optimization_tips(request, variations)

        return CopyGenerateResponse(
            request_id=request_id,
            platform=request.platform,
            content_type=request.content_type,
            variations=variations,
            brand_voice_consistency_score=consistency_score,
            best_variation_id=best_variation_id,
            optimization_tips=tips,
            generated_at=datetime.utcnow().isoformat()
        )

    async def _generate_variations(
        self, request: CopyGenerateRequest, guidelines: Dict[str, Any]
    ) -> List[CopyVariation]:
        """Generate multiple copy variations."""
        benefits_str = "\n".join([f"- {b}" for b in request.key_benefits]) if request.key_benefits else "Not specified"
        max_length = request.max_length or guidelines.get("optimal_length", 200)

        prompt = f"""You are an expert social media copywriter. Generate {request.variations} unique copy variations.

Product/Service: {request.product_or_service}
Platform: {request.platform.value}
Content Type: {request.content_type.value}
Tone: {request.tone.value}
Target Audience: {request.target_audience}
Key Benefits:
{benefits_str}
Desired CTA: {request.call_to_action or "Generate appropriate CTAs"}
Max Length: {max_length} characters
Include Emojis: {request.include_emojis}
Brand Voice: {request.brand_voice or "Not specified"}

Platform Guidelines:
- Style: {guidelines.get('style', 'engaging')}
- Optimal Length: {guidelines.get('optimal_length', 200)} characters
- Hashtag Count: {guidelines.get('hashtag_count', '5-10')}
- CTA Style: {guidelines.get('cta_style', 'action-oriented')}

Generate variations in JSON format:
{{
    "variations": [
        {{
            "headline": "Optional attention-grabbing headline",
            "body": "Main copy text",
            "call_to_action": "CTA text",
            "hashtags": ["hashtag1", "hashtag2"],
            "estimated_engagement_score": 0.75,
            "reasoning": "Why this variation works"
        }}
    ]
}}

Make each variation distinct in approach:
1. First variation: Hook-focused, attention-grabbing
2. Second variation: Benefit-focused, value proposition
3. Third variation: Story-driven, emotional connection
4. Additional variations: Mix of approaches

Ensure all copy is:
- Platform-appropriate
- Within character limits
- Authentic to the brand voice
- Action-oriented"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are an expert social media copywriter who creates high-converting, platform-optimized content. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=self.settings.openai_temperature,
            max_tokens=self.settings.openai_max_tokens,
            response_format={"type": "json_object"}
        )

        try:
            result = json.loads(response.choices[0].message.content)
            variations_data = result.get("variations", [])
        except json.JSONDecodeError:
            logger.error("Failed to parse copy variations JSON")
            variations_data = []

        variations = []
        for i, var_data in enumerate(variations_data):
            variation = CopyVariation(
                variation_id=f"copy_{i+1}",
                headline=var_data.get("headline"),
                body=var_data.get("body", ""),
                call_to_action=var_data.get("call_to_action", "Learn more"),
                hashtags=var_data.get("hashtags", []),
                estimated_engagement_score=var_data.get("estimated_engagement_score", 0.7),
                reasoning=var_data.get("reasoning", "")
            )
            variations.append(variation)

        # Ensure we have at least the requested number of variations
        while len(variations) < request.variations:
            variations.append(self._get_default_variation(request, len(variations) + 1))

        return variations[:request.variations]

    async def _check_brand_voice_consistency(
        self, variations: List[CopyVariation], brand_voice: str = None
    ) -> float:
        """Check brand voice consistency across variations."""
        if not brand_voice:
            return 0.85  # Default high score if no brand voice specified

        copy_samples = "\n".join([f"- {v.body}" for v in variations])

        prompt = f"""Rate the brand voice consistency of this copy on a scale of 0 to 1.

Brand Voice Guidelines: {brand_voice}

Copy Samples:
{copy_samples}

Return a JSON object with the consistency score:
{{"consistency_score": 0.85, "feedback": "Brief feedback"}}"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a brand consistency expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200,
            response_format={"type": "json_object"}
        )

        try:
            result = json.loads(response.choices[0].message.content)
            return min(max(result.get("consistency_score", 0.8), 0.0), 1.0)
        except (json.JSONDecodeError, KeyError):
            return 0.8

    async def _generate_optimization_tips(
        self, request: CopyGenerateRequest, variations: List[CopyVariation]
    ) -> List[str]:
        """Generate optimization tips for the copy."""
        prompt = f"""Based on this copy for {request.platform.value}, provide 5 specific optimization tips.

Target Audience: {request.target_audience}
Content Type: {request.content_type.value}
Sample Copy: {variations[0].body if variations else 'N/A'}

Return a JSON array of tips:
["Tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"]"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a social media optimization expert. Return only a JSON object with a 'tips' array."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500,
            response_format={"type": "json_object"}
        )

        try:
            result = json.loads(response.choices[0].message.content)
            if isinstance(result, dict) and "tips" in result:
                return result["tips"][:5]
            elif isinstance(result, list):
                return result[:5]
        except (json.JSONDecodeError, KeyError):
            pass

        return [
            f"Use platform-specific features for {request.platform.value}",
            "Test different hook styles in the first line",
            "Include a clear value proposition",
            "Add a sense of urgency when appropriate",
            "Engage with comments to boost algorithm visibility"
        ]

    def _get_default_variation(self, request: CopyGenerateRequest, index: int) -> CopyVariation:
        """Get a default copy variation."""
        return CopyVariation(
            variation_id=f"copy_{index}",
            headline=None,
            body=f"Discover the amazing {request.product_or_service} that's changing the game for {request.target_audience}.",
            call_to_action=request.call_to_action or "Learn more",
            hashtags=["trending", request.platform.value],
            estimated_engagement_score=0.65,
            reasoning="Default variation - AI generation fallback"
        )
