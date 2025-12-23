"""Hashtag generator with platform optimization."""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any
from openai import AsyncOpenAI
import logging

from ..config import Settings
from ..models import (
    HashtagGenerateRequest,
    HashtagGenerateResponse,
    HashtagCategory,
    Platform,
)

logger = logging.getLogger(__name__)


class HashtagGenerator:
    """Generate platform-optimized hashtags using AI."""

    # Platform-specific hashtag best practices
    PLATFORM_HASHTAG_LIMITS = {
        Platform.TIKTOK: {"min": 3, "max": 5, "optimal": 4},
        Platform.INSTAGRAM: {"min": 5, "max": 30, "optimal": 15},
        Platform.YOUTUBE: {"min": 3, "max": 15, "optimal": 5},
        Platform.FACEBOOK: {"min": 1, "max": 3, "optimal": 2},
        Platform.TWITTER: {"min": 1, "max": 3, "optimal": 2},
        Platform.PINTEREST: {"min": 2, "max": 20, "optimal": 5},
    }

    def __init__(self, client: AsyncOpenAI, settings: Settings):
        self.client = client
        self.settings = settings

    async def generate(self, request: HashtagGenerateRequest) -> HashtagGenerateResponse:
        """Generate optimized hashtags for content."""
        request_id = str(uuid.uuid4())[:8]

        # Get platform limits
        limits = self.PLATFORM_HASHTAG_LIMITS.get(request.platform, {"min": 3, "max": 15, "optimal": 10})

        # Generate hashtags using AI
        hashtag_data = await self._generate_hashtags(request, limits)

        # Categorize hashtags
        categories = self._categorize_hashtags(hashtag_data)

        # Generate usage strategy
        usage_strategy = await self._generate_usage_strategy(request, hashtag_data, limits)

        return HashtagGenerateResponse(
            request_id=request_id,
            platform=request.platform,
            primary_hashtags=hashtag_data.get("primary", [])[:5],
            secondary_hashtags=hashtag_data.get("secondary", [])[:10],
            niche_hashtags=hashtag_data.get("niche", [])[:10],
            trending_hashtags=hashtag_data.get("trending", [])[:5] if request.include_trending else [],
            branded_hashtags=hashtag_data.get("branded", []) + request.brand_hashtags,
            categories=categories,
            optimal_hashtag_count=limits["optimal"],
            usage_strategy=usage_strategy,
            generated_at=datetime.utcnow().isoformat()
        )

    async def _generate_hashtags(
        self, request: HashtagGenerateRequest, limits: Dict[str, int]
    ) -> Dict[str, List[str]]:
        """Generate hashtags using AI."""
        prompt = f"""You are a social media hashtag strategist. Generate optimized hashtags for this content.

Content Description: {request.content_description}
Platform: {request.platform.value}
Niche: {request.niche}
Target Audience: {request.target_audience or "General"}
Include Branded: {request.include_branded}
Include Trending: {request.include_trending}
Max Hashtags: {request.max_hashtags}

Platform Guidelines:
- Minimum: {limits['min']} hashtags
- Maximum: {limits['max']} hashtags
- Optimal: {limits['optimal']} hashtags

Generate hashtags in JSON format:
{{
    "primary": ["5 high-impact, broad-reach hashtags"],
    "secondary": ["10 medium-reach, category-specific hashtags"],
    "niche": ["10 low-competition, highly-targeted hashtags"],
    "trending": ["5 currently trending relevant hashtags"],
    "branded": ["3-5 brand-specific hashtags if include_branded is true"],
    "hashtag_analysis": [
        {{
            "hashtag": "#example",
            "category": "primary|secondary|niche|trending",
            "estimated_reach": "high|medium|low",
            "competition": "high|medium|low",
            "relevance_score": 0.9
        }}
    ]
}}

Rules:
1. All hashtags should be lowercase without # symbol
2. Prioritize relevance over popularity
3. Mix broad and niche hashtags
4. Include platform-specific trending hashtags
5. Ensure hashtags are appropriate and brand-safe
6. Consider searchability and discoverability"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a hashtag strategist expert. Generate relevant, high-performing hashtags. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        try:
            result = json.loads(response.choices[0].message.content)
            return {
                "primary": [h.replace("#", "").lower() for h in result.get("primary", [])],
                "secondary": [h.replace("#", "").lower() for h in result.get("secondary", [])],
                "niche": [h.replace("#", "").lower() for h in result.get("niche", [])],
                "trending": [h.replace("#", "").lower() for h in result.get("trending", [])],
                "branded": [h.replace("#", "").lower() for h in result.get("branded", [])],
                "analysis": result.get("hashtag_analysis", [])
            }
        except json.JSONDecodeError:
            logger.error("Failed to parse hashtag JSON")
            return self._get_default_hashtags(request)

    def _categorize_hashtags(self, hashtag_data: Dict[str, List[str]]) -> List[HashtagCategory]:
        """Categorize hashtags into groups."""
        categories = []

        if hashtag_data.get("primary"):
            categories.append(HashtagCategory(
                category_name="High-Reach",
                hashtags=["#" + h for h in hashtag_data["primary"]],
                avg_engagement_potential=0.85
            ))

        if hashtag_data.get("secondary"):
            categories.append(HashtagCategory(
                category_name="Category-Specific",
                hashtags=["#" + h for h in hashtag_data["secondary"]],
                avg_engagement_potential=0.75
            ))

        if hashtag_data.get("niche"):
            categories.append(HashtagCategory(
                category_name="Niche-Targeted",
                hashtags=["#" + h for h in hashtag_data["niche"]],
                avg_engagement_potential=0.70
            ))

        if hashtag_data.get("trending"):
            categories.append(HashtagCategory(
                category_name="Trending",
                hashtags=["#" + h for h in hashtag_data["trending"]],
                avg_engagement_potential=0.90
            ))

        if hashtag_data.get("branded"):
            categories.append(HashtagCategory(
                category_name="Branded",
                hashtags=["#" + h for h in hashtag_data["branded"]],
                avg_engagement_potential=0.60
            ))

        return categories

    async def _generate_usage_strategy(
        self, request: HashtagGenerateRequest,
        hashtag_data: Dict[str, List[str]],
        limits: Dict[str, int]
    ) -> str:
        """Generate a hashtag usage strategy."""
        total_hashtags = sum(len(v) for k, v in hashtag_data.items() if k != "analysis")

        prompt = f"""Create a brief hashtag usage strategy for {request.platform.value}.

Available Hashtags: {total_hashtags} total
Optimal Count: {limits['optimal']}
Niche: {request.niche}

Primary Hashtags: {', '.join(hashtag_data.get('primary', [])[:3])}
Niche Hashtags: {', '.join(hashtag_data.get('niche', [])[:3])}

Provide a 2-3 sentence strategy on:
1. How to mix hashtag types
2. Placement recommendations
3. Rotation strategy"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a social media strategist. Provide concise, actionable advice."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )

        return response.choices[0].message.content.strip()

    def _get_default_hashtags(self, request: HashtagGenerateRequest) -> Dict[str, List[str]]:
        """Get default hashtags if AI generation fails."""
        niche_clean = request.niche.lower().replace(" ", "")
        return {
            "primary": ["fyp", "viral", "trending", "explore", "content"],
            "secondary": [niche_clean, f"{niche_clean}content", f"{niche_clean}tips", f"{niche_clean}life"],
            "niche": [f"{niche_clean}community", f"{niche_clean}creator"],
            "trending": ["trendingnow", "viralcontent"],
            "branded": [],
            "analysis": []
        }
