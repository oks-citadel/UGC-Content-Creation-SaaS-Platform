"""A/B test variation suggester."""

import json
import uuid
from datetime import datetime
from typing import List, Dict, Any
from openai import AsyncOpenAI
import logging

from ..config import Settings
from ..models import (
    ABTestSuggestRequest,
    ABTestSuggestResponse,
    ABTestVariation,
    Platform,
    ContentType,
)

logger = logging.getLogger(__name__)


class ABTestSuggester:
    """Suggest A/B test variations for content optimization."""

    # Elements that can be tested
    TESTABLE_ELEMENTS = {
        "headline": "The main headline or hook",
        "cta": "Call-to-action text and placement",
        "visual": "Images, thumbnails, or video elements",
        "copy": "Body text and caption",
        "format": "Content format and structure",
        "timing": "Posting time and frequency",
        "hashtags": "Hashtag selection and quantity",
        "thumbnail": "Video thumbnail design",
        "hook": "First 3 seconds of video",
        "length": "Content length and pacing"
    }

    def __init__(self, client: AsyncOpenAI, settings: Settings):
        self.client = client
        self.settings = settings

    async def suggest(self, request: ABTestSuggestRequest) -> ABTestSuggestResponse:
        """Generate A/B test suggestions."""
        test_id = str(uuid.uuid4())[:8]

        # Generate test variations
        variations = await self._generate_variations(request)

        # Calculate sample size and duration
        sample_size = self._calculate_sample_size(request)
        duration = self._calculate_test_duration(request, sample_size)

        # Define success metrics
        metrics = self._define_success_metrics(request)

        # Generate implementation guide
        guide = await self._generate_implementation_guide(request, variations)

        # Generate analysis framework
        framework = await self._generate_analysis_framework(request, metrics)

        return ABTestSuggestResponse(
            test_id=test_id,
            test_name=f"{request.element_to_test.title()} Test - {request.platform.value.title()}",
            element_tested=request.element_to_test,
            original_content=request.original_content,
            variations=variations,
            recommended_sample_size=sample_size,
            recommended_duration_days=duration,
            success_metrics=metrics,
            statistical_significance_target=self.settings.ab_test_confidence_level,
            implementation_guide=guide,
            analysis_framework=framework,
            generated_at=datetime.utcnow().isoformat()
        )

    async def _generate_variations(self, request: ABTestSuggestRequest) -> List[ABTestVariation]:
        """Generate test variations using AI."""
        element_desc = self.TESTABLE_ELEMENTS.get(
            request.element_to_test.lower(),
            request.element_to_test
        )

        prompt = f"""Generate {request.num_variations} A/B test variations for content optimization.

Original Content: {request.original_content}
Element to Test: {request.element_to_test} - {element_desc}
Content Type: {request.content_type.value}
Platform: {request.platform.value}
Test Objective: {request.objective}
Brand Guidelines: {request.brand_guidelines or "None specified"}

Return JSON with variations:
{{
    "variations": [
        {{
            "variation_name": "Variation A (Control is original)",
            "content": "The modified content/element",
            "changes_from_original": ["Specific change 1", "Specific change 2"],
            "hypothesis": "Why this variation might perform better",
            "expected_impact": "Expected change in metrics (e.g., +15% CTR)",
            "implementation_notes": "How to implement this variation"
        }}
    ]
}}

Guidelines:
1. Make each variation distinctly different
2. Keep brand guidelines in mind
3. Base variations on proven optimization principles
4. Include one safe variation and one bold variation
5. Ensure variations are testable and measurable"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a conversion rate optimization expert specializing in A/B testing. Return valid JSON with well-reasoned test variations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        try:
            data = json.loads(response.choices[0].message.content)
            variations = []
            for i, v in enumerate(data.get("variations", [])):
                variations.append(ABTestVariation(
                    variation_id=f"var_{chr(65 + i)}",  # A, B, C, etc.
                    variation_name=v.get("variation_name", f"Variation {chr(65 + i)}"),
                    content=v.get("content", ""),
                    changes_from_original=v.get("changes_from_original", []),
                    hypothesis=v.get("hypothesis", ""),
                    expected_impact=v.get("expected_impact", ""),
                    implementation_notes=v.get("implementation_notes", "")
                ))
            return variations[:request.num_variations]
        except json.JSONDecodeError:
            return self._get_default_variations(request)

    def _calculate_sample_size(self, request: ABTestSuggestRequest) -> int:
        """Calculate recommended sample size for statistical significance."""
        # Base sample size calculation
        # Assuming 5% minimum detectable effect and 80% power
        base_sample = 1000

        # Adjust based on platform
        platform_multipliers = {
            Platform.TIKTOK: 1.5,  # Higher variance
            Platform.INSTAGRAM: 1.2,
            Platform.YOUTUBE: 1.0,
            Platform.FACEBOOK: 1.1,
            Platform.TWITTER: 1.3,
            Platform.PINTEREST: 1.2
        }

        multiplier = platform_multipliers.get(request.platform, 1.0)

        # Adjust for number of variations
        variation_multiplier = 1 + (request.num_variations - 2) * 0.25

        return int(base_sample * multiplier * variation_multiplier)

    def _calculate_test_duration(self, request: ABTestSuggestRequest, sample_size: int) -> int:
        """Calculate recommended test duration in days."""
        # Estimate based on typical content reach
        daily_reach_estimates = {
            Platform.TIKTOK: 500,
            Platform.INSTAGRAM: 300,
            Platform.YOUTUBE: 200,
            Platform.FACEBOOK: 250,
            Platform.TWITTER: 400,
            Platform.PINTEREST: 150
        }

        daily_reach = daily_reach_estimates.get(request.platform, 250)

        # Calculate days needed, with minimum of 7 and maximum of 30
        days = max(7, min(30, (sample_size * request.num_variations) // daily_reach))

        return days

    def _define_success_metrics(self, request: ABTestSuggestRequest) -> List[str]:
        """Define success metrics based on the element being tested."""
        base_metrics = ["Overall engagement rate", "Statistical significance"]

        element_metrics = {
            "headline": ["Click-through rate", "Scroll stop rate", "Time to engagement"],
            "cta": ["Conversion rate", "Click-through rate", "Action completion rate"],
            "visual": ["View duration", "Save rate", "Share rate"],
            "copy": ["Comment rate", "Share rate", "Profile visit rate"],
            "format": ["Completion rate", "Engagement rate", "Follower conversion"],
            "timing": ["Reach", "Engagement rate", "Peak engagement time"],
            "hashtags": ["Discoverability", "Non-follower reach", "Hashtag page appearances"],
            "thumbnail": ["Click-through rate", "View duration", "Impression-to-view ratio"],
            "hook": ["3-second retention", "Watch time", "Completion rate"],
            "length": ["Completion rate", "Engagement rate", "Share rate"]
        }

        specific_metrics = element_metrics.get(
            request.element_to_test.lower(),
            ["Primary conversion metric", "Secondary engagement metric"]
        )

        return base_metrics + specific_metrics

    async def _generate_implementation_guide(
        self, request: ABTestSuggestRequest, variations: List[ABTestVariation]
    ) -> str:
        """Generate implementation guide for the test."""
        variations_summary = "\n".join([
            f"- {v.variation_name}: {v.changes_from_original[0] if v.changes_from_original else 'Modified version'}"
            for v in variations
        ])

        prompt = f"""Create a brief implementation guide for this A/B test:

Test: {request.element_to_test} on {request.platform.value}
Variations:
{variations_summary}

Provide a 3-4 sentence guide covering:
1. How to set up the test
2. How to ensure fair comparison
3. What to monitor during the test
4. When to make a decision"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are an A/B testing expert. Provide clear, actionable guidance."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=400
        )

        return response.choices[0].message.content.strip()

    async def _generate_analysis_framework(
        self, request: ABTestSuggestRequest, metrics: List[str]
    ) -> str:
        """Generate analysis framework for interpreting results."""
        prompt = f"""Create an analysis framework for this A/B test:

Element Tested: {request.element_to_test}
Objective: {request.objective}
Metrics: {', '.join(metrics)}

Provide a brief framework covering:
1. How to determine a winner
2. What level of improvement is meaningful
3. How to handle inconclusive results
4. Next steps after the test"""

        response = await self.client.chat.completions.create(
            model=self.settings.openai_model,
            messages=[
                {"role": "system", "content": "You are a data analysis expert. Provide clear analysis guidance."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=400
        )

        return response.choices[0].message.content.strip()

    def _get_default_variations(self, request: ABTestSuggestRequest) -> List[ABTestVariation]:
        """Get default variations if AI generation fails."""
        return [
            ABTestVariation(
                variation_id="var_A",
                variation_name="Variation A - Conservative",
                content=f"Modified {request.element_to_test} with subtle changes",
                changes_from_original=["Subtle modification to original element"],
                hypothesis="Minor improvements can lead to incremental gains",
                expected_impact="+5-10% improvement",
                implementation_notes="Implement with minimal deviation from brand guidelines"
            ),
            ABTestVariation(
                variation_id="var_B",
                variation_name="Variation B - Bold",
                content=f"Significantly different {request.element_to_test}",
                changes_from_original=["Major departure from original approach"],
                hypothesis="Bold changes can lead to breakthrough performance",
                expected_impact="+15-25% improvement or -10% decrease",
                implementation_notes="Test with smaller audience first"
            )
        ][:request.num_variations]
