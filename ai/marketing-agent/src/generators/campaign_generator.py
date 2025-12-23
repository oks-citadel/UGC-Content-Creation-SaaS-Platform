"""Campaign strategy generator using OpenAI."""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any
from openai import AsyncOpenAI
import logging

from ..config import Settings
from ..models import (
    CampaignGenerateRequest,
    CampaignGenerateResponse,
    CampaignBrief,
    CampaignPhase,
    PlatformStrategy,
    Platform,
)

logger = logging.getLogger(__name__)


class CampaignGenerator:
    """Generate comprehensive marketing campaign strategies using AI."""

    def __init__(self, client: AsyncOpenAI, settings: Settings):
        self.client = client
        self.settings = settings

    async def generate(self, request: CampaignGenerateRequest) -> CampaignGenerateResponse:
        """Generate a complete campaign strategy."""
        campaign_id = str(uuid.uuid4())[:8]

        # Generate campaign brief using AI
        campaign_brief = await self._generate_campaign_brief(request, campaign_id)

        # Generate content calendar summary
        calendar_summary = await self._generate_content_calendar(request, campaign_brief)

        # Get creator recommendations
        creators = await self._recommend_creators(request)

        # Estimate reach
        estimated_reach = self._estimate_reach(request, campaign_brief)

        return CampaignGenerateResponse(
            campaign_brief=campaign_brief,
            content_calendar_summary=calendar_summary,
            recommended_creators=creators,
            estimated_reach=estimated_reach,
            confidence_score=0.85
        )

    async def _generate_campaign_brief(
        self, request: CampaignGenerateRequest, campaign_id: str
    ) -> CampaignBrief:
        """Generate the main campaign brief."""
        platforms_str = ", ".join([p.value for p in request.platforms])
        key_messages_str = "\n".join([f"- {m}" for m in request.key_messages]) if request.key_messages else "None specified"
        competitors_str = ", ".join(request.competitors) if request.competitors else "Not specified"

        prompt = f"""You are an expert marketing strategist. Create a comprehensive marketing campaign brief.

Brand: {request.brand_name}
Product/Service: {request.product_or_service}
Target Audience: {request.target_audience}
Campaign Objective: {request.objective.value}
Platforms: {platforms_str}
Budget Range: {request.budget_range or 'Not specified'}
Duration: {request.duration_days} days
Brand Voice: {request.brand_voice or 'Not specified'}
Key Messages:
{key_messages_str}
Competitors: {competitors_str}
Additional Context: {request.additional_context or 'None'}

Generate a detailed campaign brief in JSON format with the following structure:
{{
    "campaign_name": "Creative campaign name",
    "tagline": "Catchy campaign tagline",
    "executive_summary": "2-3 sentence overview",
    "target_audience_profile": "Detailed audience profile",
    "key_messages": ["message1", "message2", "message3"],
    "content_pillars": ["pillar1", "pillar2", "pillar3"],
    "phases": [
        {{
            "phase_number": 1,
            "name": "Phase name",
            "duration_days": 10,
            "objectives": ["obj1", "obj2"],
            "content_types": ["type1", "type2"],
            "key_activities": ["activity1", "activity2"],
            "success_metrics": ["metric1", "metric2"]
        }}
    ],
    "platform_strategies": [
        {{
            "platform": "tiktok",
            "content_mix": {{"video": 70, "duet": 20, "stitch": 10}},
            "posting_frequency": "2-3 times daily",
            "best_posting_times": ["6pm-9pm", "12pm-2pm"],
            "key_tactics": ["tactic1", "tactic2"],
            "hashtag_strategy": "Mix of trending and niche hashtags"
        }}
    ],
    "budget_allocation": {{"platform_name": 40.0, "another_platform": 60.0}},
    "success_metrics": {{"metric_name": "target_value"}},
    "risks_and_mitigations": [
        {{"risk": "Description", "mitigation": "Strategy"}}
    ]
}}

Ensure the campaign is creative, actionable, and aligned with the brand's objectives."""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are an expert marketing strategist specializing in digital and social media campaigns. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=self.settings.openai_temperature,
            max_tokens=self.settings.openai_max_tokens,
            response_format={"type": "json_object"}
        )

        try:
            brief_data = json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            logger.error("Failed to parse campaign brief JSON")
            brief_data = self._get_default_brief(request)

        # Convert to CampaignBrief model
        phases = [
            CampaignPhase(**phase) for phase in brief_data.get("phases", [])
        ]

        platform_strategies = []
        for ps in brief_data.get("platform_strategies", []):
            try:
                ps["platform"] = Platform(ps["platform"])
                platform_strategies.append(PlatformStrategy(**ps))
            except (ValueError, KeyError) as e:
                logger.warning(f"Skipping invalid platform strategy: {e}")

        return CampaignBrief(
            campaign_id=campaign_id,
            campaign_name=brief_data.get("campaign_name", f"{request.brand_name} Campaign"),
            tagline=brief_data.get("tagline", ""),
            executive_summary=brief_data.get("executive_summary", ""),
            target_audience_profile=brief_data.get("target_audience_profile", request.target_audience),
            key_messages=brief_data.get("key_messages", request.key_messages),
            content_pillars=brief_data.get("content_pillars", []),
            phases=phases,
            platform_strategies=platform_strategies,
            budget_allocation=brief_data.get("budget_allocation", {}),
            success_metrics=brief_data.get("success_metrics", {}),
            risks_and_mitigations=brief_data.get("risks_and_mitigations", []),
            generated_at=datetime.utcnow().isoformat()
        )

    async def _generate_content_calendar(
        self, request: CampaignGenerateRequest, brief: CampaignBrief
    ) -> str:
        """Generate a content calendar summary."""
        prompt = f"""Based on this campaign brief, create a high-level content calendar summary:

Campaign: {brief.campaign_name}
Duration: {request.duration_days} days
Platforms: {", ".join([p.value for p in request.platforms])}
Content Pillars: {", ".join(brief.content_pillars)}

Provide a concise 3-5 sentence summary of the content calendar including:
- Weekly content themes
- Content types distribution
- Key moments/milestones
- Posting cadence"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a content strategist. Provide concise, actionable content calendar summaries."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500
        )

        return response.choices[0].message.content.strip()

    async def _recommend_creators(self, request: CampaignGenerateRequest) -> List[str]:
        """Recommend types of creators for the campaign."""
        prompt = f"""For a {request.product_or_service} campaign targeting {request.target_audience} on {", ".join([p.value for p in request.platforms])},
        suggest 5 types of content creators/influencers that would be ideal partners.

Return as a JSON array of strings, each describing a creator type:
["Creator type 1: description", "Creator type 2: description", ...]"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are an influencer marketing expert. Return only a JSON array."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500,
            response_format={"type": "json_object"}
        )

        try:
            result = json.loads(response.choices[0].message.content)
            if isinstance(result, dict) and "creators" in result:
                return result["creators"][:5]
            elif isinstance(result, list):
                return result[:5]
        except (json.JSONDecodeError, KeyError):
            pass

        return [
            "Micro-influencers (10K-50K followers) in the niche",
            "UGC creators specializing in authentic content",
            "Industry thought leaders",
            "Entertainment creators with high engagement",
            "Brand ambassadors with loyal communities"
        ]

    def _estimate_reach(self, request: CampaignGenerateRequest, brief: CampaignBrief) -> str:
        """Estimate potential campaign reach."""
        # Simple estimation based on platforms and duration
        base_reach = 10000
        platform_multipliers = {
            Platform.TIKTOK: 3.0,
            Platform.INSTAGRAM: 2.5,
            Platform.YOUTUBE: 2.0,
            Platform.FACEBOOK: 1.5,
            Platform.TWITTER: 1.5,
            Platform.PINTEREST: 1.2
        }

        total_multiplier = sum(
            platform_multipliers.get(p, 1.0) for p in request.platforms
        )

        duration_multiplier = min(request.duration_days / 30, 3.0)
        estimated = int(base_reach * total_multiplier * duration_multiplier)

        if estimated < 50000:
            return f"{estimated:,} - {estimated * 2:,} potential impressions"
        elif estimated < 500000:
            return f"{estimated // 1000}K - {estimated * 2 // 1000}K potential impressions"
        else:
            return f"{estimated // 1000000:.1f}M - {estimated * 2 // 1000000:.1f}M potential impressions"

    def _get_default_brief(self, request: CampaignGenerateRequest) -> Dict[str, Any]:
        """Get a default brief structure if AI generation fails."""
        return {
            "campaign_name": f"{request.brand_name} {request.objective.value.title()} Campaign",
            "tagline": f"Elevate Your {request.product_or_service} Experience",
            "executive_summary": f"A {request.duration_days}-day campaign to drive {request.objective.value} for {request.brand_name}.",
            "target_audience_profile": request.target_audience,
            "key_messages": request.key_messages or ["Quality", "Value", "Trust"],
            "content_pillars": ["Education", "Entertainment", "Engagement"],
            "phases": [
                {
                    "phase_number": 1,
                    "name": "Launch",
                    "duration_days": request.duration_days // 3,
                    "objectives": ["Build awareness", "Create buzz"],
                    "content_types": ["Teaser content", "Announcements"],
                    "key_activities": ["Influencer seeding", "Paid promotion"],
                    "success_metrics": ["Reach", "Impressions"]
                }
            ],
            "platform_strategies": [],
            "budget_allocation": {p.value: 100 / len(request.platforms) for p in request.platforms},
            "success_metrics": {"engagement_rate": "3%+", "reach": "100K+"},
            "risks_and_mitigations": [
                {"risk": "Low engagement", "mitigation": "A/B test content variations"}
            ]
        }
