"""
Hook Generator Service for creating viral UGC hooks.

Generates attention-grabbing opening lines optimized for each platform
and designed to maximize retention in the first 3 seconds.
"""

import logging
import uuid
from datetime import datetime
from typing import List, Dict, Optional
import random

from openai import AsyncOpenAI

from ..config import settings
from ..models import (
    Platform,
    HookStyle,
    HookGenerationRequest,
    HookGenerationResponse,
    GeneratedHook,
)

logger = logging.getLogger(__name__)


class HookGenerator:
    """Service for generating viral UGC hooks."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

        # Hook templates by style
        self._hook_templates = {
            HookStyle.QUESTION: [
                "Wait, did you know {topic}?",
                "Why is nobody talking about {topic}?",
                "Am I the only one who {action}?",
                "Have you tried {topic} yet?",
                "What if I told you {claim}?",
                "Is {topic} actually worth it?",
                "You know what nobody tells you about {topic}?",
            ],
            HookStyle.BOLD_CLAIM: [
                "This {topic} changed my life",
                "I found the best {topic} and I'm obsessed",
                "This is THE {topic} you need right now",
                "I've tried everything and THIS is it",
                "Okay this {topic} is actually insane",
                "Best {topic} I've ever used, no cap",
            ],
            HookStyle.PROBLEM_AGITATE: [
                "Struggling with {problem}? I was too until...",
                "If you hate {problem}, you NEED this",
                "POV: You finally solve {problem}",
                "Stop doing {wrong_thing}. Try this instead.",
                "The reason your {problem} isn't working",
            ],
            HookStyle.CURIOSITY_GAP: [
                "I tried {topic} for 30 days and...",
                "The thing about {topic} nobody mentions",
                "What happens when you {action}",
                "I found out why {topic} actually works",
                "The secret to {topic} that changed everything",
            ],
            HookStyle.SOCIAL_PROOF: [
                "Over {number} people asked me about this",
                "There's a reason this has {number} reviews",
                "Everyone's been asking about this {topic}",
                "This went viral for a reason",
                "My followers made me post this again",
            ],
            HookStyle.CONTROVERSIAL: [
                "Unpopular opinion: {opinion}",
                "This might be controversial but {opinion}",
                "I don't care what anyone says, {opinion}",
                "Hot take: {opinion}",
                "People are gonna hate me for this but...",
            ],
            HookStyle.RELATABLE: [
                "POV: You finally found {topic}",
                "When {relatable_situation}",
                "Tell me you {action} without telling me",
                "That feeling when {situation}",
                "Me when I discovered {topic}",
            ],
            HookStyle.SHOCK: [
                "STOP! Before you scroll...",
                "Wait wait wait - you need to see this",
                "I can't believe I'm just finding out about this",
                "Okay but WHY didn't anyone tell me this sooner",
                "This literally shocked me",
            ],
            HookStyle.SECRET: [
                "The {topic} hack that nobody talks about",
                "Industry secret: {secret}",
                "I wasn't supposed to share this but...",
                "The hidden feature of {topic} you're missing",
                "Insider tip about {topic}",
            ],
            HookStyle.TRANSFORMATION: [
                "Before and after {topic}",
                "How {topic} transformed my {result}",
                "Day 1 vs Day 30 of using {topic}",
                "Watch what happens when you try {topic}",
                "The glow-up is real with {topic}",
            ],
        }

        # Emotional triggers by style
        self._emotional_triggers = {
            HookStyle.QUESTION: "curiosity",
            HookStyle.BOLD_CLAIM: "desire",
            HookStyle.PROBLEM_AGITATE: "frustration/relief",
            HookStyle.CURIOSITY_GAP: "intrigue",
            HookStyle.SOCIAL_PROOF: "trust/FOMO",
            HookStyle.CONTROVERSIAL: "engagement/debate",
            HookStyle.RELATABLE: "connection",
            HookStyle.SHOCK: "surprise",
            HookStyle.SECRET: "exclusivity",
            HookStyle.TRANSFORMATION: "aspiration",
        }

    async def generate_hooks(
        self,
        request: HookGenerationRequest
    ) -> HookGenerationResponse:
        """
        Generate viral hooks based on the request parameters.

        Args:
            request: Hook generation parameters

        Returns:
            HookGenerationResponse with generated hooks
        """
        request_id = str(uuid.uuid4())
        logger.info(f"Generating {request.num_hooks} hooks for topic: {request.topic}")

        hooks = []

        # Generate hooks for each requested style
        hooks_per_style = max(1, request.num_hooks // len(request.hook_styles))
        remaining = request.num_hooks - (hooks_per_style * len(request.hook_styles))

        for i, style in enumerate(request.hook_styles):
            count = hooks_per_style + (1 if i < remaining else 0)

            if self.client:
                style_hooks = await self._generate_ai_hooks(
                    topic=request.topic,
                    style=style,
                    platform=request.platform,
                    target_audience=request.target_audience,
                    pain_points=request.pain_points,
                    count=count,
                    max_words=request.max_words,
                    include_emoji=request.include_emoji
                )
            else:
                style_hooks = self._generate_template_hooks(
                    topic=request.topic,
                    style=style,
                    platform=request.platform,
                    count=count,
                    max_words=request.max_words,
                    include_emoji=request.include_emoji
                )

            hooks.extend(style_hooks)

        # Sort by estimated retention boost
        hooks.sort(key=lambda h: h.estimated_retention_boost, reverse=True)

        return HookGenerationResponse(
            request_id=request_id,
            hooks=hooks[:request.num_hooks],
            topic=request.topic,
            platform=request.platform,
            created_at=datetime.utcnow().isoformat()
        )

    async def _generate_ai_hooks(
        self,
        topic: str,
        style: HookStyle,
        platform: Platform,
        target_audience: Optional[str],
        pain_points: Optional[List[str]],
        count: int,
        max_words: int,
        include_emoji: bool
    ) -> List[GeneratedHook]:
        """Generate hooks using AI."""

        prompt = f"""Generate {count} viral hooks for UGC content about "{topic}" on {platform.value}.

Hook style: {style.value.replace('_', ' ')}
Maximum words: {max_words}
Include emoji: {include_emoji}

{f"Target audience: {target_audience}" if target_audience else ""}
{f"Pain points to address: {', '.join(pain_points)}" if pain_points else ""}

Requirements:
- Each hook must grab attention in under 3 seconds when spoken
- Use conversational, spoken language
- Make it feel authentic, not scripted
- Optimize for {platform.value}'s audience

Return each hook on a new line, numbered 1-{count}."""

        try:
            response = await self.client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert UGC content creator who specializes in viral hooks that stop the scroll."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.9,
                max_tokens=500
            )

            raw_hooks = response.choices[0].message.content
            hook_lines = [
                line.strip().lstrip('0123456789.-) ')
                for line in raw_hooks.split('\n')
                if line.strip() and not line.strip().startswith('#')
            ]

            hooks = []
            for i, hook_text in enumerate(hook_lines[:count]):
                hooks.append(GeneratedHook(
                    id=str(uuid.uuid4()),
                    hook_text=hook_text,
                    style=style,
                    word_count=len(hook_text.split()),
                    estimated_retention_boost=self._estimate_retention_boost(style, platform),
                    platform_fit_score=self._calculate_platform_fit(hook_text, platform),
                    emotional_trigger=self._emotional_triggers.get(style, "curiosity"),
                    why_it_works=self._explain_hook_effectiveness(style)
                ))

            return hooks

        except Exception as e:
            logger.error(f"Error generating AI hooks: {e}")
            return self._generate_template_hooks(
                topic, style, platform, count, max_words, include_emoji
            )

    def _generate_template_hooks(
        self,
        topic: str,
        style: HookStyle,
        platform: Platform,
        count: int,
        max_words: int,
        include_emoji: bool
    ) -> List[GeneratedHook]:
        """Generate hooks using templates when API unavailable."""

        templates = self._hook_templates.get(style, self._hook_templates[HookStyle.QUESTION])
        hooks = []

        # Randomly select templates
        selected_templates = random.sample(
            templates,
            min(count, len(templates))
        )

        # Platform-specific emojis
        emojis = {
            Platform.TIKTOK: ["", "", "", ""],
            Platform.INSTAGRAM: ["", "", "", ""],
            Platform.YOUTUBE: ["", "", "", ""],
            Platform.FACEBOOK: ["", "", "", ""],
            Platform.PINTEREST: ["", "", "", ""],
        }

        platform_emojis = emojis.get(platform, emojis[Platform.TIKTOK])

        for template in selected_templates:
            # Fill template
            hook_text = template.format(
                topic=topic,
                action=f"use {topic}",
                claim=f"{topic} is a game changer",
                problem=f"finding the right {topic}",
                wrong_thing=f"ignoring {topic}",
                opinion=f"{topic} is underrated",
                relatable_situation=f"you discover {topic}",
                situation=f"you try {topic}",
                number="10k+",
                secret=f"{topic} works better this way",
                result="routine"
            )

            # Add emoji if requested
            if include_emoji:
                emoji = random.choice(platform_emojis)
                hook_text = f"{emoji} {hook_text}" if random.choice([True, False]) else f"{hook_text} {emoji}"

            # Ensure within word limit
            words = hook_text.split()
            if len(words) > max_words:
                hook_text = ' '.join(words[:max_words]) + "..."

            hooks.append(GeneratedHook(
                id=str(uuid.uuid4()),
                hook_text=hook_text,
                style=style,
                word_count=len(hook_text.split()),
                estimated_retention_boost=self._estimate_retention_boost(style, platform),
                platform_fit_score=self._calculate_platform_fit(hook_text, platform),
                emotional_trigger=self._emotional_triggers.get(style, "curiosity"),
                why_it_works=self._explain_hook_effectiveness(style)
            ))

        return hooks

    def _estimate_retention_boost(self, style: HookStyle, platform: Platform) -> float:
        """Estimate retention boost for a hook style on a platform."""

        # Base scores by style
        style_scores = {
            HookStyle.QUESTION: 0.75,
            HookStyle.BOLD_CLAIM: 0.80,
            HookStyle.PROBLEM_AGITATE: 0.78,
            HookStyle.CURIOSITY_GAP: 0.85,
            HookStyle.SOCIAL_PROOF: 0.72,
            HookStyle.CONTROVERSIAL: 0.70,
            HookStyle.RELATABLE: 0.77,
            HookStyle.SHOCK: 0.82,
            HookStyle.SECRET: 0.83,
            HookStyle.TRANSFORMATION: 0.79,
        }

        # Platform modifiers
        platform_mods = {
            Platform.TIKTOK: {
                HookStyle.CURIOSITY_GAP: 0.05,
                HookStyle.SHOCK: 0.03,
                HookStyle.RELATABLE: 0.04,
            },
            Platform.INSTAGRAM: {
                HookStyle.TRANSFORMATION: 0.05,
                HookStyle.BOLD_CLAIM: 0.03,
            },
            Platform.YOUTUBE: {
                HookStyle.QUESTION: 0.04,
                HookStyle.CURIOSITY_GAP: 0.03,
            },
        }

        base = style_scores.get(style, 0.7)
        modifier = platform_mods.get(platform, {}).get(style, 0)

        return min(base + modifier + random.uniform(-0.05, 0.05), 1.0)

    def _calculate_platform_fit(self, hook_text: str, platform: Platform) -> float:
        """Calculate how well a hook fits a platform's style."""

        score = 0.7  # Base score

        # Word count scoring
        word_count = len(hook_text.split())

        optimal_words = {
            Platform.TIKTOK: 10,
            Platform.INSTAGRAM: 12,
            Platform.YOUTUBE: 15,
            Platform.FACEBOOK: 14,
            Platform.PINTEREST: 12,
        }

        optimal = optimal_words.get(platform, 12)
        word_diff = abs(word_count - optimal)
        score += max(0, 0.15 - (word_diff * 0.02))

        # Check for platform-relevant phrases
        tiktok_phrases = ["pov", "wait", "stop", "okay", "viral", "fyp"]
        instagram_phrases = ["aesthetic", "vibe", "inspo", "goals", "love"]
        youtube_phrases = ["subscribe", "watch", "video", "channel", "how to"]

        lower_hook = hook_text.lower()

        if platform == Platform.TIKTOK:
            if any(phrase in lower_hook for phrase in tiktok_phrases):
                score += 0.1
        elif platform == Platform.INSTAGRAM:
            if any(phrase in lower_hook for phrase in instagram_phrases):
                score += 0.1
        elif platform == Platform.YOUTUBE:
            if any(phrase in lower_hook for phrase in youtube_phrases):
                score += 0.1

        return min(score, 1.0)

    def _explain_hook_effectiveness(self, style: HookStyle) -> str:
        """Explain why a hook style works."""

        explanations = {
            HookStyle.QUESTION: "Questions create curiosity and engage viewers by making them want to know the answer.",
            HookStyle.BOLD_CLAIM: "Bold claims grab attention and set high expectations that viewers want to verify.",
            HookStyle.PROBLEM_AGITATE: "Addressing pain points creates emotional connection and positions the solution.",
            HookStyle.CURIOSITY_GAP: "Information gaps create tension that viewers need to resolve by watching.",
            HookStyle.SOCIAL_PROOF: "Social proof builds trust and triggers FOMO (fear of missing out).",
            HookStyle.CONTROVERSIAL: "Controversial takes generate engagement through comments and shares.",
            HookStyle.RELATABLE: "Relatable content creates connection and makes viewers feel understood.",
            HookStyle.SHOCK: "Unexpected statements pattern-interrupt and demand attention.",
            HookStyle.SECRET: "Exclusive information appeals to viewers' desire for insider knowledge.",
            HookStyle.TRANSFORMATION: "Before/after framing shows clear value and results.",
        }

        return explanations.get(style, "Creates engagement through proven UGC patterns.")

    def get_hook_templates(self, style: Optional[HookStyle] = None) -> Dict[str, List[str]]:
        """Get available hook templates, optionally filtered by style."""

        if style:
            return {style.value: self._hook_templates.get(style, [])}

        return {k.value: v for k, v in self._hook_templates.items()}
