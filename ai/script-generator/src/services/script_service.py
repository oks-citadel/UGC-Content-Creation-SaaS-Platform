"""
Script Generation Service for the Script Generator.

Handles generating platform-optimized UGC scripts with hooks, CTAs, and
content structure tailored to each social media platform.
"""

import logging
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
import asyncio

from openai import AsyncOpenAI

from ..config import settings
from ..models import (
    Platform,
    ContentType,
    ToneStyle,
    ScriptLength,
    CTAType,
    ScriptGenerationRequest,
    ScriptGenerationResponse,
    GeneratedScript,
    ScriptSection,
    ScriptEnhancementRequest,
    ScriptEnhancementResponse,
    EnhancedScript,
)
from .hook_generator import HookGenerator
from .cta_generator import CTAGenerator
from .platforms import get_platform_config

logger = logging.getLogger(__name__)


class ScriptGenerationService:
    """Service for generating platform-optimized UGC scripts."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.hook_generator = HookGenerator()
        self.cta_generator = CTAGenerator()

        # Script length mappings (in seconds)
        self._length_ranges = {
            ScriptLength.SHORT: (15, 30),
            ScriptLength.MEDIUM: (30, 60),
            ScriptLength.LONG: (60, 90),
            ScriptLength.EXTENDED: (90, 180),
        }

        # Words per second estimate for natural speech
        self._words_per_second = 2.5

    async def generate_scripts(
        self,
        request: ScriptGenerationRequest
    ) -> ScriptGenerationResponse:
        """
        Generate UGC scripts based on the request parameters.

        Args:
            request: Script generation parameters

        Returns:
            ScriptGenerationResponse with generated scripts
        """
        start_time = datetime.utcnow()
        request_id = str(uuid.uuid4())

        logger.info(f"Generating {request.num_variations} scripts for {request.product_name}")

        # Get platform-specific configuration
        platform_config = get_platform_config(request.platform)

        # Calculate target duration and word count
        min_duration, max_duration = self._length_ranges[request.length]
        target_duration = (min_duration + max_duration) / 2
        target_words = int(target_duration * self._words_per_second)

        # Generate scripts
        scripts = []
        tokens_used = 0

        for i in range(request.num_variations):
            script, tokens = await self._generate_single_script(
                request=request,
                platform_config=platform_config,
                target_words=target_words,
                target_duration=target_duration,
                variation_index=i
            )
            scripts.append(script)
            tokens_used += tokens

        generation_time = (datetime.utcnow() - start_time).total_seconds()

        return ScriptGenerationResponse(
            request_id=request_id,
            scripts=scripts,
            platform=request.platform,
            generation_time=generation_time,
            tokens_used=tokens_used,
            created_at=datetime.utcnow().isoformat()
        )

    async def _generate_single_script(
        self,
        request: ScriptGenerationRequest,
        platform_config: Dict[str, Any],
        target_words: int,
        target_duration: float,
        variation_index: int
    ) -> tuple[GeneratedScript, int]:
        """Generate a single script variation."""

        script_id = str(uuid.uuid4())

        # Build the prompt
        prompt = self._build_script_prompt(
            request=request,
            platform_config=platform_config,
            target_words=target_words,
            variation_index=variation_index
        )

        # Generate with OpenAI
        if self.client:
            response = await self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt(request.platform, request.tone)
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=settings.temperature + (variation_index * 0.05),  # Vary temperature slightly
                max_tokens=settings.max_script_tokens
            )

            raw_script = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else 0
        else:
            # Fallback to template-based generation
            raw_script = self._generate_template_script(request, platform_config, target_words)
            tokens_used = 0

        # Parse and structure the script
        sections = self._parse_script_sections(raw_script, request)

        # Calculate metrics
        word_count = len(raw_script.split())
        estimated_duration = word_count / self._words_per_second

        # Generate supporting content
        hooks_used = [s.content[:50] for s in sections if s.section_type == "hook"]
        cta_used = next((s.content for s in sections if s.section_type == "cta"), "")

        hashtags = self._generate_hashtags(request, platform_config)
        caption = self._generate_caption(request, raw_script, platform_config)
        tips = self._generate_posting_tips(request.platform, request.content_type)

        return GeneratedScript(
            id=script_id,
            full_script=raw_script,
            sections=sections,
            word_count=word_count,
            estimated_duration=estimated_duration,
            platform=request.platform,
            content_type=request.content_type,
            tone=request.tone,
            hooks_used=hooks_used,
            cta_used=cta_used,
            hashtag_suggestions=hashtags,
            caption_suggestion=caption,
            posting_tips=tips,
            confidence_score=self._calculate_confidence(sections, target_words, word_count)
        ), tokens_used

    def _build_script_prompt(
        self,
        request: ScriptGenerationRequest,
        platform_config: Dict[str, Any],
        target_words: int,
        variation_index: int
    ) -> str:
        """Build the prompt for script generation."""

        prompt_parts = [
            f"Create a {request.content_type.value.replace('_', ' ')} UGC script for {request.platform.value}.",
            f"\nProduct: {request.product_name}",
            f"Description: {request.product_description}",
            f"\nKey Benefits:\n" + "\n".join(f"- {b}" for b in request.key_benefits),
        ]

        if request.pain_points:
            prompt_parts.append(
                f"\nPain Points to Address:\n" + "\n".join(f"- {p}" for p in request.pain_points)
            )

        if request.target_audience:
            prompt_parts.append(f"\nTarget Audience: {request.target_audience}")

        if request.competitor_differentiators:
            prompt_parts.append(
                f"\nKey Differentiators:\n" + "\n".join(f"- {d}" for d in request.competitor_differentiators)
            )

        if request.brand_voice_notes:
            prompt_parts.append(f"\nBrand Voice Notes: {request.brand_voice_notes}")

        prompt_parts.extend([
            f"\nTone: {request.tone.value}",
            f"Target Word Count: ~{target_words} words",
            f"\nPlatform Requirements:",
            f"- Max duration: {platform_config.get('max_duration', 60)} seconds",
            f"- Optimal hashtags: {platform_config.get('optimal_hashtags', 5)}",
            f"- Best practices: {', '.join(platform_config.get('best_practices', [])[:3])}",
        ])

        if request.include_hook:
            prompt_parts.append("\nStart with a strong hook in the first 3 seconds that stops the scroll.")

        if request.include_cta:
            prompt_parts.append(f"\nEnd with a clear {request.cta_type.value.replace('_', ' ')} call-to-action.")

        if request.trending_sounds:
            prompt_parts.append(f"\nReference these trending sounds/formats: {', '.join(request.trending_sounds)}")

        prompt_parts.extend([
            "\n\nStructure the script with clear sections:",
            "1. HOOK (first 3 seconds - attention grabber)",
            "2. INTRO (introduce yourself/context)",
            "3. BODY (main content, benefits, demonstration)",
            "4. CTA (call-to-action)",
            "\nMark each section clearly with [SECTION_NAME].",
            "Include visual/B-roll suggestions in parentheses.",
            f"\nThis is variation #{variation_index + 1}, make it unique from other variations."
        ])

        return "\n".join(prompt_parts)

    def _get_system_prompt(self, platform: Platform, tone: ToneStyle) -> str:
        """Get the system prompt for the AI model."""

        platform_contexts = {
            Platform.TIKTOK: "TikTok content that feels native, authentic, and trend-aware",
            Platform.INSTAGRAM: "Instagram Reels content that's visually appealing and lifestyle-focused",
            Platform.YOUTUBE: "YouTube Shorts content that's informative and engaging",
            Platform.FACEBOOK: "Facebook Reels content that connects with a broader demographic",
            Platform.PINTEREST: "Pinterest video content that's inspirational and saves-worthy",
        }

        tone_guidelines = {
            ToneStyle.CONVERSATIONAL: "friendly, like talking to a friend",
            ToneStyle.ENTHUSIASTIC: "excited and energetic",
            ToneStyle.PROFESSIONAL: "polished and credible",
            ToneStyle.CASUAL: "relaxed and approachable",
            ToneStyle.URGENT: "time-sensitive and action-oriented",
            ToneStyle.EDUCATIONAL: "informative and helpful",
            ToneStyle.STORYTELLING: "narrative and engaging",
            ToneStyle.HUMOROUS: "witty and entertaining",
            ToneStyle.AUTHENTIC: "genuine and relatable",
            ToneStyle.LUXURY: "sophisticated and aspirational",
        }

        return f"""You are an expert UGC (User-Generated Content) script writer specializing in {platform_contexts.get(platform, 'social media content')}.

Your tone should be {tone_guidelines.get(tone, 'conversational')}.

Key principles:
1. Hook viewers in the first 3 seconds
2. Keep content concise and value-packed
3. Use natural, spoken language (not written)
4. Include strategic pauses for impact
5. Make it feel authentic, not scripted
6. Optimize for the platform's algorithm and audience
7. Include clear visual cues and B-roll suggestions

Format scripts for speaking out loud, using:
- Short sentences
- Natural contractions ("I'm" not "I am")
- Emphasis markers for important words
- Timing notes where relevant
- [SECTION] markers for structure"""

    def _generate_template_script(
        self,
        request: ScriptGenerationRequest,
        platform_config: Dict[str, Any],
        target_words: int
    ) -> str:
        """Generate a script using templates when API is unavailable."""

        templates = {
            ContentType.PRODUCT_REVIEW: """[HOOK]
Stop scrolling if you've been looking for {product}!

[INTRO]
Okay so I've been using {product} for about a week now and I have THOUGHTS.

[BODY]
First off, {benefit_1} - and that alone is worth it.
(show product close-up)

But here's what really got me - {benefit_2}.
(demonstrate feature)

And {benefit_3}? Game changer.
(reaction shot)

[CTA]
{cta} - seriously, you won't regret it.""",

            ContentType.UNBOXING: """[HOOK]
My {product} finally arrived and I'm so excited!

[INTRO]
Okay let's see what's inside this box.
(opening package)

[BODY]
Oh wow, look at this packaging. Already impressed.
(reveal product)

So this is {product} and {benefit_1}.
(product examination)

The quality is actually insane - {benefit_2}.

[CTA]
{cta} to get yours!""",

            ContentType.TUTORIAL: """[HOOK]
Here's how to {main_benefit} in under 60 seconds.

[INTRO]
I'm gonna show you exactly what I do.
(setup shot)

[BODY]
Step one: {step_1}
(demonstrate)

Step two: {step_2}
(demonstrate)

And that's literally it. {result}

[CTA]
{cta} for more tips like this!""",
        }

        template = templates.get(request.content_type, templates[ContentType.PRODUCT_REVIEW])

        # Fill in template
        benefits = request.key_benefits + ["amazing quality", "great value", "total game changer"]

        cta_texts = {
            CTAType.FOLLOW: "Follow for more reviews",
            CTAType.LINK_IN_BIO: "Link in bio",
            CTAType.COMMENT: "Comment below if you want to try this",
            CTAType.SHOP_NOW: "Tap to shop",
        }

        filled_script = template.format(
            product=request.product_name,
            benefit_1=benefits[0] if len(benefits) > 0 else "the quality is amazing",
            benefit_2=benefits[1] if len(benefits) > 1 else "it's so easy to use",
            benefit_3=benefits[2] if len(benefits) > 2 else "worth every penny",
            main_benefit=benefits[0] if benefits else "get results",
            step_1="Start with the basics",
            step_2="Apply the technique",
            result="You'll see the difference immediately",
            cta=cta_texts.get(request.cta_type, "Link in bio")
        )

        return filled_script

    def _parse_script_sections(
        self,
        raw_script: str,
        request: ScriptGenerationRequest
    ) -> List[ScriptSection]:
        """Parse a raw script into structured sections."""

        sections = []
        current_section = None
        current_content = []

        lines = raw_script.split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check for section markers
            if line.startswith('[') and line.endswith(']'):
                # Save previous section
                if current_section and current_content:
                    content = '\n'.join(current_content)
                    sections.append(ScriptSection(
                        section_type=current_section.lower(),
                        content=content,
                        duration_estimate=len(content.split()) / self._words_per_second,
                        visual_suggestions=self._extract_visual_suggestions(content),
                        b_roll_suggestions=self._extract_broll_suggestions(content)
                    ))

                current_section = line[1:-1]
                current_content = []
            else:
                current_content.append(line)

        # Add final section
        if current_section and current_content:
            content = '\n'.join(current_content)
            sections.append(ScriptSection(
                section_type=current_section.lower(),
                content=content,
                duration_estimate=len(content.split()) / self._words_per_second,
                visual_suggestions=self._extract_visual_suggestions(content),
                b_roll_suggestions=self._extract_broll_suggestions(content)
            ))

        # If no sections found, create a single body section
        if not sections:
            sections.append(ScriptSection(
                section_type="body",
                content=raw_script,
                duration_estimate=len(raw_script.split()) / self._words_per_second,
                visual_suggestions=[],
                b_roll_suggestions=[]
            ))

        return sections

    def _extract_visual_suggestions(self, content: str) -> List[str]:
        """Extract visual suggestions from parenthetical notes."""
        import re
        suggestions = re.findall(r'\(([^)]+)\)', content)
        return [s for s in suggestions if any(kw in s.lower() for kw in
            ['show', 'shot', 'close', 'wide', 'reaction', 'product', 'demo', 'reveal'])]

    def _extract_broll_suggestions(self, content: str) -> List[str]:
        """Extract B-roll suggestions from content."""
        import re
        suggestions = re.findall(r'\(([^)]+)\)', content)
        return [s for s in suggestions if any(kw in s.lower() for kw in
            ['b-roll', 'broll', 'footage', 'clip', 'stock'])]

    def _generate_hashtags(
        self,
        request: ScriptGenerationRequest,
        platform_config: Dict[str, Any]
    ) -> List[str]:
        """Generate relevant hashtags for the content."""

        base_hashtags = []

        # Platform-specific hashtags
        platform_tags = {
            Platform.TIKTOK: ["#fyp", "#foryou", "#viral"],
            Platform.INSTAGRAM: ["#reels", "#explore", "#instagood"],
            Platform.YOUTUBE: ["#shorts", "#ytshorts"],
            Platform.FACEBOOK: ["#reels", "#facebook"],
            Platform.PINTEREST: ["#pinterest", "#pinterestidea"],
        }
        base_hashtags.extend(platform_tags.get(request.platform, [])[:2])

        # Content type hashtags
        content_tags = {
            ContentType.PRODUCT_REVIEW: ["#review", "#honest_review", "#productreview"],
            ContentType.UNBOXING: ["#unboxing", "#haul", "#newpurchase"],
            ContentType.TUTORIAL: ["#tutorial", "#howto", "#tips"],
            ContentType.TESTIMONIAL: ["#testimonial", "#results", "#transformation"],
        }
        base_hashtags.extend(content_tags.get(request.content_type, [])[:2])

        # Product-specific hashtags
        product_tag = f"#{request.product_name.replace(' ', '').lower()}"
        base_hashtags.append(product_tag)

        # Add niche hashtags based on benefits
        for benefit in request.key_benefits[:2]:
            words = benefit.lower().split()
            if len(words) <= 3:
                tag = '#' + ''.join(words)
                base_hashtags.append(tag)

        return base_hashtags[:platform_config.get('optimal_hashtags', 5)]

    def _generate_caption(
        self,
        request: ScriptGenerationRequest,
        script: str,
        platform_config: Dict[str, Any]
    ) -> str:
        """Generate a caption for the video."""

        # Get hook from script
        hook_line = script.split('\n')[1] if len(script.split('\n')) > 1 else script[:50]
        hook_line = hook_line.strip()

        # Build caption
        caption_parts = [
            hook_line,
            "",
            f"Trying out {request.product_name}!",
            "",
        ]

        # Add benefit teaser
        if request.key_benefits:
            caption_parts.append(f"The {request.key_benefits[0].lower()} is everything")
            caption_parts.append("")

        # Add CTA
        cta_captions = {
            CTAType.FOLLOW: "Follow for more reviews!",
            CTAType.LINK_IN_BIO: "Link in bio for details",
            CTAType.COMMENT: "Drop a comment if you want to try this!",
            CTAType.SAVE: "Save this for later!",
        }
        caption_parts.append(cta_captions.get(request.cta_type, "Link in bio"))

        return "\n".join(caption_parts)

    def _generate_posting_tips(
        self,
        platform: Platform,
        content_type: ContentType
    ) -> List[str]:
        """Generate platform-specific posting tips."""

        tips = {
            Platform.TIKTOK: [
                "Post between 7-9 PM in your target audience's timezone",
                "Use trending sounds to boost discoverability",
                "Reply to comments quickly to boost engagement",
                "Post consistently (1-3x daily for best results)",
                "Use the green screen effect for added engagement",
            ],
            Platform.INSTAGRAM: [
                "Post Reels between 9 AM - 12 PM or 7-9 PM",
                "Use 3-5 relevant hashtags in the caption",
                "Share to Stories for additional reach",
                "Respond to comments within the first hour",
                "Use trending audio when possible",
            ],
            Platform.YOUTUBE: [
                "Post Shorts during peak hours (12-3 PM or 7-9 PM)",
                "Use #shorts in title or description",
                "Keep titles under 40 characters",
                "Add end screens to drive subscriptions",
                "Pin a comment with additional info",
            ],
            Platform.FACEBOOK: [
                "Post between 1-4 PM for best reach",
                "Share to relevant groups for more visibility",
                "Ask a question to encourage comments",
                "Use native upload instead of links",
                "Cross-post to Instagram Reels",
            ],
            Platform.PINTEREST: [
                "Post between 8-11 PM for highest engagement",
                "Use keyword-rich descriptions",
                "Create multiple pins for the same video",
                "Add to relevant boards",
                "Use Pinterest trends for timing",
            ],
        }

        return tips.get(platform, tips[Platform.TIKTOK])[:4]

    def _calculate_confidence(
        self,
        sections: List[ScriptSection],
        target_words: int,
        actual_words: int
    ) -> float:
        """Calculate confidence score for the generated script."""

        score = 0.5  # Base score

        # Check section completeness
        required_sections = {"hook", "body", "cta"}
        found_sections = {s.section_type for s in sections}
        section_coverage = len(required_sections & found_sections) / len(required_sections)
        score += section_coverage * 0.25

        # Check word count accuracy
        word_accuracy = 1 - min(abs(actual_words - target_words) / target_words, 0.5)
        score += word_accuracy * 0.25

        return min(score, 1.0)

    async def enhance_script(
        self,
        request: ScriptEnhancementRequest
    ) -> ScriptEnhancementResponse:
        """Enhance an existing script with improvements."""

        request_id = str(uuid.uuid4())
        logger.info(f"Enhancing script with: {', '.join(request.enhancements)}")

        platform_config = get_platform_config(request.platform)

        # Build enhancement prompt
        prompt = f"""Improve the following UGC script for {request.platform.value}.

Original Script:
{request.original_script}

Enhancements needed:
{', '.join(request.enhancements)}

Platform best practices:
{', '.join(platform_config.get('best_practices', [])[:3])}

Return the enhanced script with [SECTION] markers and explain changes made."""

        if self.client:
            response = await self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert UGC script editor. Improve scripts while maintaining authenticity."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=settings.max_script_tokens
            )

            enhanced_script = response.choices[0].message.content
        else:
            enhanced_script = request.original_script  # Fallback

        # Parse changes
        changes_made = []
        if "hook" in request.enhancements:
            changes_made.append("Strengthened opening hook for better retention")
        if "pacing" in request.enhancements:
            changes_made.append("Improved pacing with shorter sentences")
        if "cta" in request.enhancements:
            changes_made.append("Enhanced call-to-action clarity")
        if "emotional_triggers" in request.enhancements:
            changes_made.append("Added emotional triggers for connection")
        if "storytelling" in request.enhancements:
            changes_made.append("Improved narrative structure")

        # Calculate improvement score
        original_words = len(request.original_script.split())
        enhanced_words = len(enhanced_script.split())
        improvement_score = 0.7 + (len(changes_made) * 0.05)

        enhanced = EnhancedScript(
            original_script=request.original_script,
            enhanced_script=enhanced_script,
            changes_made=changes_made,
            improvement_score=min(improvement_score, 1.0),
            before_after_comparison={
                "original_words": original_words,
                "enhanced_words": enhanced_words,
                "enhancements_applied": request.enhancements
            },
            timestamps=None
        )

        return ScriptEnhancementResponse(
            request_id=request_id,
            enhanced=enhanced,
            platform=request.platform,
            created_at=datetime.utcnow().isoformat()
        )
