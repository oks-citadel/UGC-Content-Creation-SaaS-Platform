"""Competitor content strategy analyzer."""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any
from openai import AsyncOpenAI
import logging

from ..config import Settings
from ..models import (
    CompetitorAnalyzeRequest,
    CompetitorAnalyzeResponse,
    CompetitorInsight,
    Platform,
)

logger = logging.getLogger(__name__)


class CompetitorAnalyzer:
    """Analyze competitor content strategies using AI."""

    def __init__(self, client: AsyncOpenAI, settings: Settings):
        self.client = client
        self.settings = settings

    async def analyze(self, request: CompetitorAnalyzeRequest) -> CompetitorAnalyzeResponse:
        """Analyze competitors and generate insights."""
        analysis_id = str(uuid.uuid4())[:8]

        # Analyze each competitor
        competitor_insights = []
        for competitor in request.competitors[:self.settings.max_competitors_to_analyze]:
            insight = await self._analyze_competitor(
                competitor, request.platforms, request.analysis_depth, request.focus_areas
            )
            competitor_insights.append(insight)

        # Generate market positioning
        positioning = await self._generate_positioning_map(
            request.brand_name, competitor_insights
        )

        # Identify gaps and opportunities
        gaps_and_opportunities = await self._identify_gaps_and_opportunities(
            request.brand_name, competitor_insights
        )

        # Generate strategic recommendations
        recommendations = await self._generate_recommendations(
            request.brand_name, competitor_insights, gaps_and_opportunities
        )

        return CompetitorAnalyzeResponse(
            analysis_id=analysis_id,
            your_brand=request.brand_name,
            competitors_analyzed=competitor_insights,
            market_positioning_map=positioning,
            content_gaps=gaps_and_opportunities.get("gaps", []),
            differentiation_opportunities=gaps_and_opportunities.get("opportunities", []),
            recommended_strategies=recommendations.get("strategies", []),
            competitive_advantages=recommendations.get("advantages", []),
            threats_to_address=recommendations.get("threats", []),
            action_items=recommendations.get("actions", []),
            generated_at=datetime.utcnow().isoformat()
        )

    async def _analyze_competitor(
        self,
        competitor: str,
        platforms: List[Platform],
        depth: str,
        focus_areas: List[str]
    ) -> CompetitorInsight:
        """Analyze a single competitor."""
        platforms_str = ", ".join([p.value for p in platforms])
        focus_str = ", ".join(focus_areas)

        prompt = f"""Analyze this competitor's social media content strategy:

Competitor: {competitor}
Platforms to Analyze: {platforms_str}
Analysis Depth: {depth}
Focus Areas: {focus_str}

Based on common industry knowledge and best practices, provide an analysis in JSON format:
{{
    "content_strategy_summary": "2-3 sentence overview of their content strategy",
    "posting_frequency": "Estimated posting frequency",
    "top_performing_content_types": ["type1", "type2", "type3"],
    "engagement_rate_estimate": "Estimated engagement rate range",
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"],
    "opportunities_for_you": ["opportunity1", "opportunity2", "opportunity3"]
}}

Consider:
1. Content themes and pillars
2. Visual style and branding
3. Posting consistency
4. Audience engagement patterns
5. Platform-specific tactics
6. Unique value propositions"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a competitive intelligence analyst specializing in social media marketing. Provide insightful, actionable analysis. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse competitor analysis for {competitor}")
            data = self._get_default_competitor_data(competitor)

        return CompetitorInsight(
            competitor_name=competitor,
            content_strategy_summary=data.get("content_strategy_summary", ""),
            posting_frequency=data.get("posting_frequency", "Unknown"),
            top_performing_content_types=data.get("top_performing_content_types", []),
            engagement_rate_estimate=data.get("engagement_rate_estimate", "N/A"),
            strengths=data.get("strengths", []),
            weaknesses=data.get("weaknesses", []),
            opportunities_for_you=data.get("opportunities_for_you", [])
        )

    async def _generate_positioning_map(
        self, brand_name: str, competitors: List[CompetitorInsight]
    ) -> Dict[str, str]:
        """Generate market positioning analysis."""
        competitors_summary = "\n".join([
            f"- {c.competitor_name}: {c.content_strategy_summary}"
            for c in competitors
        ])

        prompt = f"""Based on these competitor analyses, create a positioning map for {brand_name}.

Competitors:
{competitors_summary}

Return a JSON object with positioning for each competitor and recommendations:
{{
    "competitor_name": "positioning_description",
    "{brand_name}_recommendation": "suggested positioning for the brand"
}}"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a brand strategist. Provide clear market positioning insights. Return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )

        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return {c.competitor_name: "Analysis pending" for c in competitors}

    async def _identify_gaps_and_opportunities(
        self, brand_name: str, competitors: List[CompetitorInsight]
    ) -> Dict[str, List[str]]:
        """Identify content gaps and differentiation opportunities."""
        weaknesses = []
        for c in competitors:
            weaknesses.extend(c.weaknesses)

        opportunities_from_competitors = []
        for c in competitors:
            opportunities_from_competitors.extend(c.opportunities_for_you)

        prompt = f"""Based on competitor analysis for {brand_name}, identify content gaps and opportunities.

Competitor Weaknesses:
{json.dumps(weaknesses[:15])}

Opportunities Identified:
{json.dumps(opportunities_from_competitors[:15])}

Return JSON:
{{
    "gaps": ["5 content gaps {brand_name} can fill"],
    "opportunities": ["5 differentiation opportunities"]
}}"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a content strategy expert. Identify actionable gaps and opportunities. Return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=800,
            response_format={"type": "json_object"}
        )

        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return {
                "gaps": ["Content consistency", "Community engagement", "Video content", "Educational content", "Behind-the-scenes"],
                "opportunities": ["Unique brand voice", "Customer stories", "Interactive content", "Platform-native features", "Micro-content series"]
            }

    async def _generate_recommendations(
        self, brand_name: str, competitors: List[CompetitorInsight],
        gaps_and_opportunities: Dict[str, List[str]]
    ) -> Dict[str, List[str]]:
        """Generate strategic recommendations."""
        prompt = f"""Generate strategic recommendations for {brand_name} based on competitive analysis.

Content Gaps: {json.dumps(gaps_and_opportunities.get('gaps', []))}
Opportunities: {json.dumps(gaps_and_opportunities.get('opportunities', []))}
Top Competitor Strengths: {json.dumps([s for c in competitors for s in c.strengths[:2]])}

Return JSON:
{{
    "strategies": ["5 content strategies to implement"],
    "advantages": ["3 competitive advantages to leverage"],
    "threats": ["3 competitive threats to address"],
    "actions": ["5 immediate action items with priority"]
}}"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a strategic marketing consultant. Provide specific, prioritized recommendations. Return valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )

        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return {
                "strategies": [
                    "Develop a consistent content calendar",
                    "Focus on community building",
                    "Create platform-native content",
                    "Leverage user-generated content",
                    "Establish thought leadership"
                ],
                "advantages": [
                    "Authentic brand voice",
                    "Agility and responsiveness",
                    "Customer relationships"
                ],
                "threats": [
                    "Competitor content volume",
                    "Market saturation",
                    "Changing platform algorithms"
                ],
                "actions": [
                    "HIGH: Audit current content performance",
                    "HIGH: Define content pillars",
                    "MEDIUM: Create content templates",
                    "MEDIUM: Establish engagement protocol",
                    "LOW: Develop influencer partnerships"
                ]
            }

    def _get_default_competitor_data(self, competitor: str) -> Dict[str, Any]:
        """Get default competitor data if AI analysis fails."""
        return {
            "content_strategy_summary": f"{competitor} has an established presence with regular content updates.",
            "posting_frequency": "1-2 posts per day",
            "top_performing_content_types": ["Videos", "Carousel posts", "Stories"],
            "engagement_rate_estimate": "2-4%",
            "strengths": ["Consistent branding", "Regular posting", "Community engagement"],
            "weaknesses": ["Generic content", "Limited innovation", "Low video content"],
            "opportunities_for_you": ["Unique content angles", "Underserved audience segments", "New content formats"]
        }
