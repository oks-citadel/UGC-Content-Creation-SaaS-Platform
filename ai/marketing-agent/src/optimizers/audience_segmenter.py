"""AI-driven audience segmentation."""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any
from openai import AsyncOpenAI
import logging

from ..config import Settings
from ..models import (
    AudienceSegmentRequest,
    AudienceSegmentResponse,
    AudienceSegment,
    AudienceSegmentType,
    Platform,
)

logger = logging.getLogger(__name__)


class AudienceSegmenter:
    """Generate AI-driven audience segments for targeted marketing."""

    def __init__(self, client: AsyncOpenAI, settings: Settings):
        self.client = client
        self.settings = settings

    async def segment(self, request: AudienceSegmentRequest) -> AudienceSegmentResponse:
        """Generate audience segments."""
        segmentation_id = str(uuid.uuid4())[:8]

        # Generate segments
        segments = await self._generate_segments(request)

        # Analyze segment overlap
        overlap_analysis = self._analyze_segment_overlap(segments)

        # Generate prioritization
        prioritization = await self._generate_prioritization(request, segments)

        # Generate cross-segment strategies
        cross_strategies = await self._generate_cross_segment_strategies(segments)

        # Generate personalization opportunities
        personalization = await self._generate_personalization_opportunities(request, segments)

        return AudienceSegmentResponse(
            segmentation_id=segmentation_id,
            brand_name=request.brand_name,
            total_segments=len(segments),
            segments=segments,
            segment_overlap_analysis=overlap_analysis,
            prioritization_recommendation=prioritization,
            cross_segment_strategies=cross_strategies,
            personalization_opportunities=personalization,
            generated_at=datetime.utcnow().isoformat()
        )

    async def _generate_segments(self, request: AudienceSegmentRequest) -> List[AudienceSegment]:
        """Generate audience segments using AI."""
        platforms_str = ", ".join([p.value for p in request.platforms])
        segment_types_str = ", ".join([s.value for s in request.segment_focus])
        existing_data_str = json.dumps(request.existing_audience_data) if request.existing_audience_data else "None"

        prompt = f"""Create {request.max_segments} distinct audience segments for this brand:

Brand: {request.brand_name}
Product Category: {request.product_category}
Platforms: {platforms_str}
Segment Focus: {segment_types_str}
Existing Audience Data: {existing_data_str}

Return JSON with segments:
{{
    "segments": [
        {{
            "segment_name": "Creative name for the segment",
            "segment_type": "demographic|behavioral|psychographic|geographic|interest_based",
            "description": "2-3 sentence description of this segment",
            "demographics": {{
                "age_range": "25-34",
                "gender_split": "60% female, 40% male",
                "income_level": "middle to upper-middle",
                "education": "college educated",
                "occupation": "professionals, entrepreneurs"
            }},
            "psychographics": {{
                "values": ["value1", "value2"],
                "lifestyle": "description",
                "personality_traits": ["trait1", "trait2"],
                "attitudes": ["attitude1", "attitude2"]
            }},
            "behaviors": ["behavior1", "behavior2", "behavior3"],
            "pain_points": ["pain1", "pain2", "pain3"],
            "motivations": ["motivation1", "motivation2", "motivation3"],
            "preferred_content_types": ["video", "carousel", "stories"],
            "preferred_platforms": ["instagram", "tiktok"],
            "messaging_approach": "How to communicate with this segment",
            "content_themes": ["theme1", "theme2", "theme3"],
            "estimated_size_percentage": 25.0
        }}
    ]
}}

Guidelines:
1. Make segments distinct and actionable
2. Base segments on realistic market understanding
3. Ensure segments are large enough to target effectively
4. Include specific content recommendations for each
5. Consider platform preferences for each segment"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a market research and audience segmentation expert. Create distinct, actionable audience segments. Return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
            segments = []
            for i, s in enumerate(data.get("segments", [])):
                try:
                    # Parse segment type
                    segment_type_str = s.get("segment_type", "interest_based").lower()
                    segment_type = AudienceSegmentType.INTEREST_BASED
                    for st in AudienceSegmentType:
                        if st.value == segment_type_str:
                            segment_type = st
                            break

                    # Parse preferred platforms
                    preferred_platforms = []
                    for p in s.get("preferred_platforms", []):
                        try:
                            preferred_platforms.append(Platform(p.lower()))
                        except ValueError:
                            pass

                    segments.append(AudienceSegment(
                        segment_id=f"seg_{i+1}",
                        segment_name=s.get("segment_name", f"Segment {i+1}"),
                        segment_type=segment_type,
                        description=s.get("description", ""),
                        demographics=s.get("demographics", {}),
                        psychographics=s.get("psychographics", {}),
                        behaviors=s.get("behaviors", []),
                        pain_points=s.get("pain_points", []),
                        motivations=s.get("motivations", []),
                        preferred_content_types=s.get("preferred_content_types", []),
                        preferred_platforms=preferred_platforms if preferred_platforms else request.platforms,
                        messaging_approach=s.get("messaging_approach", ""),
                        content_themes=s.get("content_themes", []),
                        estimated_size_percentage=s.get("estimated_size_percentage", 100 / request.max_segments)
                    ))
                except (ValueError, KeyError) as e:
                    logger.warning(f"Skipping invalid segment: {e}")

            return segments[:request.max_segments]
        except json.JSONDecodeError:
            return self._get_default_segments(request)

    def _analyze_segment_overlap(self, segments: List[AudienceSegment]) -> Dict[str, List[str]]:
        """Analyze overlap between segments."""
        overlap = {}

        for seg in segments:
            overlapping = []
            for other_seg in segments:
                if seg.segment_id == other_seg.segment_id:
                    continue

                # Check for common platforms
                common_platforms = set(seg.preferred_platforms) & set(other_seg.preferred_platforms)

                # Check for common content types
                common_content = set(seg.preferred_content_types) & set(other_seg.preferred_content_types)

                if len(common_platforms) > 0 and len(common_content) > 0:
                    overlapping.append(other_seg.segment_name)

            if overlapping:
                overlap[seg.segment_name] = overlapping

        return overlap

    async def _generate_prioritization(
        self, request: AudienceSegmentRequest, segments: List[AudienceSegment]
    ) -> List[str]:
        """Generate segment prioritization recommendations."""
        segments_summary = "\n".join([
            f"- {s.segment_name}: {s.estimated_size_percentage}% of audience, Platforms: {', '.join([p.value for p in s.preferred_platforms])}"
            for s in segments
        ])

        prompt = f"""Prioritize these audience segments for {request.brand_name} in {request.product_category}:

{segments_summary}

Return JSON with prioritization:
{{"prioritization": ["5 prioritization recommendations explaining which segments to focus on first and why"]}}"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a marketing strategist. Provide clear prioritization recommendations. Return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=600,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
            return data.get("prioritization", [])[:5]
        except json.JSONDecodeError:
            return [
                "Focus on segments with highest estimated size first",
                "Prioritize segments aligned with your current platform strengths",
                "Target high-intent segments for immediate conversions",
                "Build awareness with broader segments for long-term growth",
                "Test messaging with smaller segments before scaling"
            ]

    async def _generate_cross_segment_strategies(
        self, segments: List[AudienceSegment]
    ) -> List[str]:
        """Generate strategies that work across multiple segments."""
        segments_info = "\n".join([
            f"- {s.segment_name}: Motivations: {', '.join(s.motivations[:2])}"
            for s in segments
        ])

        prompt = f"""Based on these audience segments, suggest cross-segment content strategies:

{segments_info}

Return JSON:
{{"strategies": ["5 content strategies that would appeal to multiple segments"]}}"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a content strategist. Suggest strategies that maximize reach. Return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
            return data.get("strategies", [])[:5]
        except json.JSONDecodeError:
            return [
                "Create value-driven educational content",
                "Use storytelling that resonates emotionally",
                "Develop interactive content for engagement",
                "Share authentic behind-the-scenes content",
                "Create content series with universal appeal"
            ]

    async def _generate_personalization_opportunities(
        self, request: AudienceSegmentRequest, segments: List[AudienceSegment]
    ) -> List[str]:
        """Generate personalization opportunities."""
        prompt = f"""Suggest personalization opportunities for {request.brand_name} targeting {len(segments)} audience segments.

Segments: {', '.join([s.segment_name for s in segments])}
Platforms: {', '.join([p.value for p in request.platforms])}

Return JSON:
{{"opportunities": ["5 specific personalization opportunities for content and messaging"]}}"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a personalization expert. Suggest specific, implementable opportunities. Return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
            return data.get("opportunities", [])[:5]
        except json.JSONDecodeError:
            return [
                "Tailor headline messaging per segment",
                "Use segment-specific visual styles",
                "Customize CTAs based on motivations",
                "Adjust posting times per segment preferences",
                "Create segment-specific content series"
            ]

    def _get_default_segments(self, request: AudienceSegmentRequest) -> List[AudienceSegment]:
        """Get default segments if AI generation fails."""
        return [
            AudienceSegment(
                segment_id="seg_1",
                segment_name="Core Enthusiasts",
                segment_type=AudienceSegmentType.INTEREST_BASED,
                description=f"Highly engaged fans of {request.product_category} who actively seek out content and products.",
                demographics={"age_range": "25-40", "education": "varied"},
                psychographics={"values": ["quality", "authenticity"]},
                behaviors=["Regular content consumers", "Active commenters", "Brand advocates"],
                pain_points=["Finding quality products", "Information overload"],
                motivations=["Stay informed", "Connect with community"],
                preferred_content_types=["video", "carousel"],
                preferred_platforms=request.platforms,
                messaging_approach="Expert, insider knowledge with exclusive insights",
                content_themes=["Tips and tricks", "Behind the scenes", "Product deep-dives"],
                estimated_size_percentage=35.0
            ),
            AudienceSegment(
                segment_id="seg_2",
                segment_name="Casual Explorers",
                segment_type=AudienceSegmentType.BEHAVIORAL,
                description="New or occasional consumers who are discovering the category.",
                demographics={"age_range": "18-35", "education": "varied"},
                psychographics={"values": ["discovery", "value"]},
                behaviors=["Occasional browsers", "Trend followers"],
                pain_points=["Not knowing where to start", "Budget constraints"],
                motivations=["Learn something new", "Find good deals"],
                preferred_content_types=["short video", "stories"],
                preferred_platforms=request.platforms,
                messaging_approach="Welcoming, educational, accessible",
                content_themes=["Beginner guides", "Trending topics", "Value picks"],
                estimated_size_percentage=40.0
            ),
            AudienceSegment(
                segment_id="seg_3",
                segment_name="Premium Seekers",
                segment_type=AudienceSegmentType.PSYCHOGRAPHIC,
                description="Quality-focused consumers willing to invest in premium experiences.",
                demographics={"age_range": "30-50", "income_level": "upper-middle to high"},
                psychographics={"values": ["quality", "exclusivity", "craftsmanship"]},
                behaviors=["Research-heavy buyers", "Brand loyal"],
                pain_points=["Finding authentic premium options", "Justifying purchases"],
                motivations=["Best quality", "Status", "Investment value"],
                preferred_content_types=["long-form video", "carousel"],
                preferred_platforms=request.platforms,
                messaging_approach="Sophisticated, value-focused, exclusive",
                content_themes=["Premium features", "Craftsmanship stories", "Exclusive access"],
                estimated_size_percentage=25.0
            )
        ][:request.max_segments]
