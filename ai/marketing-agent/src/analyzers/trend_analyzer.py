"""Trend analyzer for identifying trending topics and formats."""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any
from openai import AsyncOpenAI
import logging

from ..config import Settings
from ..models import (
    TrendAnalyzeRequest,
    TrendAnalyzeResponse,
    TrendingTopic,
    TrendingFormat,
    Platform,
    ContentType,
)

logger = logging.getLogger(__name__)


class TrendAnalyzer:
    """Analyze trends and identify viral content opportunities."""

    def __init__(self, client: AsyncOpenAI, settings: Settings):
        self.client = client
        self.settings = settings

    async def analyze(self, request: TrendAnalyzeRequest) -> TrendAnalyzeResponse:
        """Analyze trends for the specified niche and platforms."""
        analysis_id = str(uuid.uuid4())[:8]

        # Get trending topics
        trending_topics = await self._get_trending_topics(request)

        # Get trending hashtags
        trending_hashtags = await self._get_trending_hashtags(request) if request.include_hashtags else []

        # Get trending sounds
        trending_sounds = await self._get_trending_sounds(request) if request.include_sounds else []

        # Get trending formats
        trending_formats = await self._get_trending_formats(request) if request.include_formats else []

        # Identify emerging and declining trends
        trend_analysis = await self._analyze_trend_lifecycle(request.niche)

        # Generate content recommendations
        recommendations = await self._generate_content_recommendations(
            request, trending_topics, trending_formats
        )

        # Generate timing recommendations
        timing = await self._get_timing_recommendations(request.platforms)

        return TrendAnalyzeResponse(
            analysis_id=analysis_id,
            niche=request.niche,
            trending_topics=trending_topics,
            trending_hashtags=trending_hashtags,
            trending_sounds=trending_sounds,
            trending_formats=trending_formats,
            emerging_trends=trend_analysis.get("emerging", []),
            declining_trends=trend_analysis.get("declining", []),
            content_recommendations=recommendations,
            timing_recommendations=timing,
            generated_at=datetime.utcnow().isoformat()
        )

    async def _get_trending_topics(self, request: TrendAnalyzeRequest) -> List[TrendingTopic]:
        """Get trending topics for the niche."""
        platforms_str = ", ".join([p.value for p in request.platforms])

        prompt = f"""Identify trending topics in the {request.niche} niche for {platforms_str}.

Lookback Period: {request.lookback_days} days

Return JSON with trending topics:
{{
    "topics": [
        {{
            "topic": "Topic name/description",
            "trend_score": 0.85,
            "platforms": ["tiktok", "instagram"],
            "content_ideas": ["3-5 content ideas using this trend"],
            "estimated_lifespan": "1-2 weeks | 1 month | evergreen",
            "competition_level": "low | medium | high"
        }}
    ]
}}

Include:
1. Currently viral trends
2. Rising trends with potential
3. Evergreen topics with new angles
4. Seasonal/timely topics
5. Niche-specific trends

Focus on trends that are:
- Relevant to {request.niche}
- Actionable for content creation
- Appropriate for brand partnerships"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a social media trend analyst with expertise in viral content. Return valid JSON with current, relevant trends."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
            topics = []
            for t in data.get("topics", []):
                try:
                    topics.append(TrendingTopic(
                        topic=t.get("topic", ""),
                        trend_score=t.get("trend_score", 0.7),
                        platforms=[Platform(p) for p in t.get("platforms", []) if p in [p.value for p in Platform]],
                        content_ideas=t.get("content_ideas", []),
                        estimated_lifespan=t.get("estimated_lifespan", "1-2 weeks"),
                        competition_level=t.get("competition_level", "medium")
                    ))
                except (ValueError, KeyError) as e:
                    logger.warning(f"Skipping invalid trend topic: {e}")
            return topics[:10]
        except json.JSONDecodeError:
            return self._get_default_topics(request.niche)

    async def _get_trending_hashtags(self, request: TrendAnalyzeRequest) -> List[Dict[str, Any]]:
        """Get trending hashtags for the niche."""
        platforms_str = ", ".join([p.value for p in request.platforms])

        prompt = f"""Identify trending hashtags in the {request.niche} niche for {platforms_str}.

Return JSON:
{{
    "hashtags": [
        {{
            "hashtag": "#hashtag",
            "platform": "tiktok",
            "usage_count_estimate": "1M+ posts",
            "trend_velocity": "rising | stable | declining",
            "relevance_to_niche": 0.9
        }}
    ]
}}

Include 10-15 hashtags mixing:
- Currently viral hashtags
- Niche-specific hashtags
- Rising hashtags with potential"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a hashtag trend expert. Return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
            return data.get("hashtags", [])[:15]
        except json.JSONDecodeError:
            return []

    async def _get_trending_sounds(self, request: TrendAnalyzeRequest) -> List[Dict[str, Any]]:
        """Get trending sounds for TikTok and Reels."""
        # Only applicable for TikTok and Instagram
        applicable_platforms = [p for p in request.platforms if p in [Platform.TIKTOK, Platform.INSTAGRAM]]
        if not applicable_platforms:
            return []

        prompt = f"""Identify trending sounds/audio for {request.niche} content on TikTok and Instagram Reels.

Return JSON:
{{
    "sounds": [
        {{
            "sound_name": "Sound/song name",
            "artist_or_source": "Artist or original creator",
            "platform": "tiktok | instagram",
            "trend_type": "song | original_audio | voiceover | sound_effect",
            "usage_ideas": ["2-3 ways to use this sound"],
            "estimated_peak": "Now | This week | Fading"
        }}
    ]
}}

Include 8-10 sounds that are:
- Currently trending
- Versatile for brand content
- Appropriate for {request.niche}"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a TikTok and Reels trend expert. Return valid JSON with current trending sounds."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
            return data.get("sounds", [])[:10]
        except json.JSONDecodeError:
            return []

    async def _get_trending_formats(self, request: TrendAnalyzeRequest) -> List[TrendingFormat]:
        """Get trending content formats."""
        platforms_str = ", ".join([p.value for p in request.platforms])
        content_types_str = ", ".join([c.value for c in request.content_types]) if request.content_types else "all types"

        prompt = f"""Identify trending content formats for {request.niche} on {platforms_str}.

Content Types Focus: {content_types_str}

Return JSON:
{{
    "formats": [
        {{
            "format_name": "Format name",
            "description": "Brief description of the format",
            "platforms": ["tiktok", "instagram"],
            "example_ideas": ["3-5 specific content ideas using this format"],
            "implementation_tips": ["2-3 tips for executing this format well"]
        }}
    ]
}}

Include 6-8 formats such as:
- Viral video structures
- Carousel formats
- Story templates
- Interactive formats
- Trending editing styles"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a content format expert. Return valid JSON with actionable format recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
            formats = []
            for f in data.get("formats", []):
                try:
                    formats.append(TrendingFormat(
                        format_name=f.get("format_name", ""),
                        description=f.get("description", ""),
                        platforms=[Platform(p) for p in f.get("platforms", []) if p in [p.value for p in Platform]],
                        example_ideas=f.get("example_ideas", []),
                        implementation_tips=f.get("implementation_tips", [])
                    ))
                except (ValueError, KeyError) as e:
                    logger.warning(f"Skipping invalid format: {e}")
            return formats[:8]
        except json.JSONDecodeError:
            return self._get_default_formats()

    async def _analyze_trend_lifecycle(self, niche: str) -> Dict[str, List[str]]:
        """Analyze emerging and declining trends."""
        prompt = f"""For the {niche} niche, identify:

1. Emerging trends (gaining momentum)
2. Declining trends (losing momentum)

Return JSON:
{{
    "emerging": ["5 emerging trends to watch and potentially capitalize on"],
    "declining": ["5 declining trends to avoid or move away from"]
}}"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a trend lifecycle analyst. Return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=600,
            response_format={"type": "json_object"}
        )

        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return {"emerging": [], "declining": []}

    async def _generate_content_recommendations(
        self,
        request: TrendAnalyzeRequest,
        topics: List[TrendingTopic],
        formats: List[TrendingFormat]
    ) -> List[str]:
        """Generate actionable content recommendations."""
        topics_summary = ", ".join([t.topic for t in topics[:5]])
        formats_summary = ", ".join([f.format_name for f in formats[:3]])

        prompt = f"""Based on trending topics and formats in {request.niche}, provide 7 specific, actionable content recommendations.

Trending Topics: {topics_summary}
Trending Formats: {formats_summary}
Platforms: {", ".join([p.value for p in request.platforms])}

Return JSON:
{{"recommendations": ["7 specific content recommendations with execution details"]}}"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a content strategist. Provide specific, actionable recommendations. Return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
            return data.get("recommendations", [])[:7]
        except json.JSONDecodeError:
            return [
                "Create a trending topic reaction video",
                "Use popular sounds in niche-relevant content",
                "Start a weekly content series",
                "Collaborate with micro-influencers",
                "Create educational carousel posts",
                "Share behind-the-scenes content",
                "Engage with trending hashtags authentically"
            ]

    async def _get_timing_recommendations(self, platforms: List[Platform]) -> Dict[str, str]:
        """Get optimal posting time recommendations."""
        timing = {}
        for platform in platforms:
            if platform == Platform.TIKTOK:
                timing["tiktok"] = "Best times: 7-9am, 12-3pm, 7-11pm (audience timezone)"
            elif platform == Platform.INSTAGRAM:
                timing["instagram"] = "Best times: 6-9am, 12-2pm, 5-9pm (weekdays); 9am-12pm (weekends)"
            elif platform == Platform.YOUTUBE:
                timing["youtube"] = "Best times: 2-4pm weekdays, 9-11am weekends for Shorts; varied for long-form"
            elif platform == Platform.FACEBOOK:
                timing["facebook"] = "Best times: 1-4pm late week; peak on Wednesday"
            elif platform == Platform.TWITTER:
                timing["twitter"] = "Best times: 8am-4pm weekdays; engagement peaks at 9am"
            elif platform == Platform.PINTEREST:
                timing["pinterest"] = "Best times: 8-11pm evenings; Saturdays most active"

        return timing

    def _get_default_topics(self, niche: str) -> List[TrendingTopic]:
        """Get default trending topics if AI fails."""
        return [
            TrendingTopic(
                topic=f"Behind-the-scenes in {niche}",
                trend_score=0.8,
                platforms=[Platform.TIKTOK, Platform.INSTAGRAM],
                content_ideas=["Day in the life", "Process videos", "Office tours"],
                estimated_lifespan="evergreen",
                competition_level="medium"
            ),
            TrendingTopic(
                topic=f"Tips and tutorials for {niche}",
                trend_score=0.85,
                platforms=[Platform.YOUTUBE, Platform.INSTAGRAM],
                content_ideas=["Quick tips", "How-to guides", "Common mistakes"],
                estimated_lifespan="evergreen",
                competition_level="high"
            )
        ]

    def _get_default_formats(self) -> List[TrendingFormat]:
        """Get default trending formats if AI fails."""
        return [
            TrendingFormat(
                format_name="3-Second Hook Videos",
                description="Short-form videos with an attention-grabbing hook in the first 3 seconds",
                platforms=[Platform.TIKTOK, Platform.INSTAGRAM],
                example_ideas=["Surprising facts", "Before/after reveals", "Challenge responses"],
                implementation_tips=["Start with a question or bold statement", "Use text overlays"]
            ),
            TrendingFormat(
                format_name="Educational Carousels",
                description="Swipeable multi-slide posts that teach something valuable",
                platforms=[Platform.INSTAGRAM, Platform.FACEBOOK],
                example_ideas=["Step-by-step guides", "Myth busters", "Industry insights"],
                implementation_tips=["Keep text readable", "Use consistent branding", "End with CTA"]
            )
        ]
