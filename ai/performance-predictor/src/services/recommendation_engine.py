"""
Advanced Recommendation Engine for Performance Predictor.

Provides detailed, actionable recommendations with specific implementation steps,
platform-specific strategies, templates, and expected impact calculations.
"""

import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum

from ..models import Platform, ContentAnalysis, PredictionRequest

# Import platform optimizers
from .platforms import (
    TikTokOptimizer,
    InstagramOptimizer,
    YouTubeOptimizer,
    FacebookOptimizer,
    PinterestOptimizer,
    BasePlatformOptimizer
)

logger = logging.getLogger(__name__)


class RecommendationCategory(str, Enum):
    """Categories of recommendations."""
    HOOK = "hook"
    CAPTION = "caption"
    HASHTAGS = "hashtags"
    AUDIO = "audio"
    TIMING = "timing"
    FORMAT = "format"
    VISUAL = "visual"
    CTA = "call_to_action"
    TRENDING = "trending"
    PACING = "pacing"


class Priority(str, Enum):
    """Recommendation priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Difficulty(str, Enum):
    """Implementation difficulty levels."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


@dataclass
class ActionStep:
    """A single actionable step within a recommendation."""
    step_number: int
    action: str
    details: str
    time_estimate: str  # e.g., "5 minutes", "30 minutes"


@dataclass
class Template:
    """A template or example for implementing a recommendation."""
    name: str
    example: str
    platform_notes: Optional[str] = None


@dataclass
class DetailedRecommendation:
    """A detailed, actionable recommendation."""
    id: str
    category: RecommendationCategory
    priority: Priority
    title: str
    description: str
    current_score: float
    target_score: float
    expected_impact: float  # 0.0 to 1.0
    difficulty: Difficulty
    action_steps: List[ActionStep]
    templates: List[Template]
    platform_specific: Dict[str, str]
    metrics_affected: List[str]
    estimated_time: str
    reasoning: str


@dataclass
class DetailedRecommendationResponse:
    """Response containing all detailed recommendations."""
    content_id: str
    platform: Platform
    current_overall_score: float
    potential_score: float
    recommendations: List[DetailedRecommendation]
    priority_summary: Dict[str, int]
    quick_wins: List[str]
    high_impact_actions: List[str]
    estimated_total_time: str


class RecommendationEngine:
    """
    Advanced recommendation engine that generates detailed, actionable recommendations.

    Features:
    - Specific action steps (not generic advice)
    - Platform-specific strategies
    - Templates and examples
    - Expected impact calculations
    - Implementation time estimates
    """

    def __init__(self):
        self._platform_configs = self._load_platform_configs()

        # Initialize platform-specific optimizers
        self._platform_optimizers: Dict[Platform, BasePlatformOptimizer] = {
            Platform.TIKTOK: TikTokOptimizer(),
            Platform.INSTAGRAM: InstagramOptimizer(),
            Platform.YOUTUBE: YouTubeOptimizer(),
            Platform.FACEBOOK: FacebookOptimizer(),
            Platform.PINTEREST: PinterestOptimizer(),
        }

    def get_platform_optimizer(self, platform: Platform) -> BasePlatformOptimizer:
        """Get the optimizer for a specific platform."""
        return self._platform_optimizers.get(platform, self._platform_optimizers[Platform.TIKTOK])

    def generate_recommendations(
        self,
        content_analysis: ContentAnalysis,
        request: PredictionRequest,
        current_score: float
    ) -> DetailedRecommendationResponse:
        """
        Generate detailed, actionable recommendations based on content analysis.

        Args:
            content_analysis: Analysis results from the content
            request: Original prediction request
            current_score: Current overall performance score

        Returns:
            DetailedRecommendationResponse with all recommendations
        """
        recommendations: List[DetailedRecommendation] = []

        # Generate recommendations for each category
        if content_analysis.hook_strength < 0.7:
            recommendations.append(
                self._generate_hook_recommendation(
                    content_analysis, request.platform, content_analysis.hook_strength
                )
            )

        if not content_analysis.call_to_action_present or True:  # Always suggest CTA improvements
            recommendations.append(
                self._generate_cta_recommendation(
                    content_analysis, request.platform
                )
            )

        if len(request.hashtags) < 5 or content_analysis.trending_alignment_score < 0.6:
            recommendations.append(
                self._generate_hashtag_recommendation(
                    request.hashtags, request.platform, content_analysis.trending_alignment_score
                )
            )

        if content_analysis.visual_quality_score < 0.8:
            recommendations.append(
                self._generate_visual_recommendation(
                    content_analysis, request.platform
                )
            )

        if content_analysis.pacing_score < 0.7:
            recommendations.append(
                self._generate_pacing_recommendation(
                    content_analysis, request.platform
                )
            )

        # Always generate caption and timing recommendations
        recommendations.append(
            self._generate_caption_recommendation(
                request.caption, request.platform
            )
        )

        recommendations.append(
            self._generate_timing_recommendation(
                request.posting_time, request.platform
            )
        )

        # Audio recommendation for video content
        if request.content_type.value == "video":
            recommendations.append(
                self._generate_audio_recommendation(request.platform)
            )

        # Trending content recommendation
        if content_analysis.trending_alignment_score < 0.6:
            recommendations.append(
                self._generate_trending_recommendation(
                    request.platform, content_analysis.trending_alignment_score
                )
            )

        # Sort by priority and impact
        recommendations = sorted(
            recommendations,
            key=lambda r: (
                self._priority_weight(r.priority),
                r.expected_impact
            ),
            reverse=True
        )

        # Calculate potential score
        potential_score = self._calculate_potential_score(current_score, recommendations)

        # Generate summary
        priority_summary = self._count_priorities(recommendations)
        quick_wins = self._identify_quick_wins(recommendations)
        high_impact_actions = self._identify_high_impact(recommendations)
        total_time = self._estimate_total_time(recommendations)

        return DetailedRecommendationResponse(
            content_id=request.content_url,  # Will be replaced with actual content ID
            platform=request.platform,
            current_overall_score=current_score,
            potential_score=potential_score,
            recommendations=recommendations,
            priority_summary=priority_summary,
            quick_wins=quick_wins,
            high_impact_actions=high_impact_actions,
            estimated_total_time=total_time
        )

    def _generate_hook_recommendation(
        self,
        analysis: ContentAnalysis,
        platform: Platform,
        current_score: float
    ) -> DetailedRecommendation:
        """Generate hook improvement recommendation."""

        platform_hooks = {
            Platform.TIKTOK: {
                "strategy": "Use pattern interrupts and curiosity gaps in the first 0.5 seconds",
                "examples": [
                    "Start with an unexpected visual or sound",
                    "Use text overlay: 'Wait for it...' or 'Watch till the end'",
                    "Begin mid-action rather than with setup"
                ]
            },
            Platform.INSTAGRAM: {
                "strategy": "Lead with the most visually striking moment",
                "examples": [
                    "Show the transformation/result first, then the process",
                    "Use bold text overlays that create curiosity",
                    "Start with direct eye contact and a question"
                ]
            },
            Platform.YOUTUBE: {
                "strategy": "Establish value proposition within 5 seconds",
                "examples": [
                    "State what viewers will learn/see immediately",
                    "Use a cold open (start mid-story, then intro)",
                    "Show a preview of the best moment"
                ]
            },
            Platform.FACEBOOK: {
                "strategy": "Optimize for sound-off viewing with visual hooks",
                "examples": [
                    "Use captions from the first frame",
                    "Lead with emotional or surprising visuals",
                    "Include movement in the first 2 seconds"
                ]
            },
            Platform.PINTEREST: {
                "strategy": "Lead with the aspirational end result",
                "examples": [
                    "Show the finished product/look first",
                    "Use text overlay with the benefit",
                    "Start with lifestyle context"
                ]
            }
        }

        platform_config = platform_hooks.get(platform, platform_hooks[Platform.TIKTOK])

        return DetailedRecommendation(
            id=f"hook_{platform.value}",
            category=RecommendationCategory.HOOK,
            priority=Priority.CRITICAL if current_score < 0.5 else Priority.HIGH,
            title="Strengthen Your Opening Hook",
            description=f"Your opening hook scores {current_score:.0%}. The first 3 seconds are critical for retention. {platform_config['strategy']}.",
            current_score=current_score,
            target_score=0.85,
            expected_impact=0.25,
            difficulty=Difficulty.MEDIUM,
            action_steps=[
                ActionStep(
                    step_number=1,
                    action="Identify your strongest moment",
                    details="Review your content and find the most engaging, surprising, or valuable moment. This should become your opening.",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=2,
                    action="Restructure to front-load value",
                    details="Move your best content to the first 3 seconds. Start mid-action or with the payoff rather than buildup.",
                    time_estimate="15 minutes"
                ),
                ActionStep(
                    step_number=3,
                    action="Add a pattern interrupt",
                    details="Include an unexpected element (sound, visual effect, or text) in the first 0.5 seconds to stop scrollers.",
                    time_estimate="10 minutes"
                ),
                ActionStep(
                    step_number=4,
                    action="Test with the sound off",
                    details="Ensure your hook works visually since 85% of social video is watched without sound initially.",
                    time_estimate="5 minutes"
                )
            ],
            templates=[
                Template(
                    name="Curiosity Gap Hook",
                    example="'You won't believe what happened when...' [show unexpected result]",
                    platform_notes="Works best on TikTok and Instagram"
                ),
                Template(
                    name="Transformation Hook",
                    example="[Before: problem state] → [After: solution state] in 2 seconds",
                    platform_notes="High performance on all platforms"
                ),
                Template(
                    name="Direct Address Hook",
                    example="'Stop scrolling if you...' [identify viewer's problem]",
                    platform_notes="Effective on TikTok, use sparingly on YouTube"
                )
            ],
            platform_specific={
                "tiktok": "Use trending sounds in the first second. The algorithm prioritizes early audio engagement.",
                "instagram": "First frame is the thumbnail for Reels. Make it visually compelling even as a still image.",
                "youtube": "Shorts algorithm heavily weights first 2-second retention. Avoid any intro or logo.",
                "facebook": "Auto-play is sound-off. Use large text overlays for the hook.",
                "pinterest": "Vertical format with clean, aspirational first frame. Text overlays work well."
            },
            metrics_affected=["retention_rate", "watch_time", "engagement_rate"],
            estimated_time="35 minutes",
            reasoning="Hook strength directly impacts algorithmic distribution. Videos with strong hooks see 40-60% higher retention and 2-3x more reach."
        )

    def _generate_cta_recommendation(
        self,
        analysis: ContentAnalysis,
        platform: Platform
    ) -> DetailedRecommendation:
        """Generate call-to-action recommendation."""

        platform_ctas = {
            Platform.TIKTOK: [
                "Follow for Part 2",
                "Save this for later",
                "Duet this with your reaction",
                "Comment your answer below",
                "Tag someone who needs this"
            ],
            Platform.INSTAGRAM: [
                "Save this post",
                "Share to your story",
                "Double tap if you agree",
                "Link in bio for more",
                "DM me 'START' for the guide"
            ],
            Platform.YOUTUBE: [
                "Subscribe and hit the bell",
                "Watch this video next [end screen]",
                "Join the membership for extras",
                "Leave a comment with your question",
                "Like if this helped you"
            ],
            Platform.FACEBOOK: [
                "Share with a friend who needs this",
                "React with your favorite",
                "Join our group for more tips",
                "Click the link in comments",
                "Tag someone in your life"
            ],
            Platform.PINTEREST: [
                "Save this Pin for later",
                "Follow for more ideas",
                "Click through for the full tutorial",
                "Check out my other boards",
                "Shop this look (link in description)"
            ]
        }

        ctas = platform_ctas.get(platform, platform_ctas[Platform.TIKTOK])
        has_cta = analysis.call_to_action_present

        return DetailedRecommendation(
            id=f"cta_{platform.value}",
            category=RecommendationCategory.CTA,
            priority=Priority.HIGH if not has_cta else Priority.MEDIUM,
            title="Optimize Your Call-to-Action",
            description=f"{'No CTA detected.' if not has_cta else 'CTA detected but can be improved.'} A strong CTA can increase engagement by 30-50%.",
            current_score=0.3 if not has_cta else 0.6,
            target_score=0.9,
            expected_impact=0.15,
            difficulty=Difficulty.EASY,
            action_steps=[
                ActionStep(
                    step_number=1,
                    action="Choose a single, clear CTA",
                    details=f"Select one primary action. For {platform.value}, best options are: {', '.join(ctas[:3])}",
                    time_estimate="2 minutes"
                ),
                ActionStep(
                    step_number=2,
                    action="Place CTA at the right moment",
                    details="Add your CTA after delivering value (not before). For videos, place at the 60-80% mark when engagement peaks.",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=3,
                    action="Make it visually prominent",
                    details="Use text overlay, verbal mention, AND visual gesture pointing to the action (like pointing at the follow button).",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=4,
                    action="Add urgency or exclusivity",
                    details="Add time pressure ('Before I take this down') or exclusivity ('Only for my followers') to increase action rate.",
                    time_estimate="3 minutes"
                )
            ],
            templates=[
                Template(
                    name="Value-First CTA",
                    example="'If this helped you, follow for more tips like this'",
                    platform_notes="Works across all platforms"
                ),
                Template(
                    name="Engagement CTA",
                    example="'Comment [KEYWORD] and I'll send you the full guide'",
                    platform_notes="High engagement on Instagram and TikTok"
                ),
                Template(
                    name="Social Proof CTA",
                    example="'Join the 10,000+ people who saved this post'",
                    platform_notes="Builds credibility and FOMO"
                )
            ],
            platform_specific={
                "tiktok": "Use 'Follow for Part 2' to create series. Duet/Stitch CTAs drive viral potential.",
                "instagram": "Save CTAs boost algorithm ranking. Use Stories CTAs for link clicks.",
                "youtube": "End screens with subscribe + video recommendations. Verbal CTAs at value peaks.",
                "facebook": "Share CTAs perform best. Group join CTAs for community building.",
                "pinterest": "Save CTAs are native behavior. Link clicks need compelling value proposition."
            },
            metrics_affected=["followers", "engagement_rate", "saves", "shares"],
            estimated_time="15 minutes",
            reasoning="CTAs convert passive viewers into active engagers. Content with clear CTAs sees 50% higher engagement actions."
        )

    def _generate_hashtag_recommendation(
        self,
        current_hashtags: List[str],
        platform: Platform,
        trending_score: float
    ) -> DetailedRecommendation:
        """Generate hashtag strategy recommendation."""

        hashtag_strategies = {
            Platform.TIKTOK: {
                "count": "3-5 hashtags",
                "mix": "1 broad + 2 niche + 1-2 trending",
                "avoid": "Don't use #fyp #foryou - they're saturated"
            },
            Platform.INSTAGRAM: {
                "count": "5-10 hashtags (in caption or first comment)",
                "mix": "3 broad + 4 niche + 2-3 branded/community",
                "avoid": "Avoid banned hashtags - check before using"
            },
            Platform.YOUTUBE: {
                "count": "3-5 hashtags (max 15 in description)",
                "mix": "Focus on searchable terms, not trendy ones",
                "avoid": "Don't overuse - looks spammy to algorithm"
            },
            Platform.FACEBOOK: {
                "count": "1-3 hashtags",
                "mix": "Only highly relevant hashtags",
                "avoid": "Overusing hashtags hurts reach on Facebook"
            },
            Platform.PINTEREST: {
                "count": "2-5 hashtags in description",
                "mix": "Descriptive, searchable terms",
                "avoid": "Trending hashtags don't work well here"
            }
        }

        strategy = hashtag_strategies.get(platform, hashtag_strategies[Platform.TIKTOK])

        return DetailedRecommendation(
            id=f"hashtags_{platform.value}",
            category=RecommendationCategory.HASHTAGS,
            priority=Priority.HIGH if len(current_hashtags) < 3 else Priority.MEDIUM,
            title="Optimize Your Hashtag Strategy",
            description=f"Current: {len(current_hashtags)} hashtags (trending alignment: {trending_score:.0%}). Recommended: {strategy['count']}.",
            current_score=trending_score,
            target_score=0.8,
            expected_impact=0.12,
            difficulty=Difficulty.EASY,
            action_steps=[
                ActionStep(
                    step_number=1,
                    action="Research trending hashtags in your niche",
                    details=f"Use {platform.value}'s search/explore to find currently trending hashtags in your content category.",
                    time_estimate="10 minutes"
                ),
                ActionStep(
                    step_number=2,
                    action="Create your hashtag mix",
                    details=f"Structure: {strategy['mix']}. This balances discoverability with targeted reach.",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=3,
                    action="Analyze competitor hashtags",
                    details="Look at top-performing content in your niche. Note which hashtags appear consistently.",
                    time_estimate="10 minutes"
                ),
                ActionStep(
                    step_number=4,
                    action="Test and rotate",
                    details="Create 3-4 hashtag sets and rotate them. Track which combinations drive the most reach.",
                    time_estimate="5 minutes"
                )
            ],
            templates=[
                Template(
                    name="Niche Content Mix",
                    example="#YourNiche #NicheSubtopic #TrendingInNiche #BrandedHashtag",
                    platform_notes="Adjust count per platform"
                ),
                Template(
                    name="Trending + Evergreen",
                    example="#TrendingSound #YourTopic #EverGreenTopic #Location",
                    platform_notes="Replace trending weekly"
                )
            ],
            platform_specific={
                "tiktok": f"{strategy['count']}. {strategy['avoid']}. Focus on niche communities.",
                "instagram": f"{strategy['count']}. Place in caption for better reach. {strategy['avoid']}.",
                "youtube": f"{strategy['count']}. First hashtag appears above title. Use search terms.",
                "facebook": f"{strategy['count']}. Less is more here. {strategy['avoid']}.",
                "pinterest": f"{strategy['count']}. Think SEO - what would people search? {strategy['avoid']}."
            },
            metrics_affected=["reach", "impressions", "discoverability"],
            estimated_time="30 minutes",
            reasoning="Hashtags are the primary discovery mechanism. Optimized hashtag strategy can increase reach by 30-100%."
        )

    def _generate_visual_recommendation(
        self,
        analysis: ContentAnalysis,
        platform: Platform
    ) -> DetailedRecommendation:
        """Generate visual quality recommendation."""

        current_score = analysis.visual_quality_score

        return DetailedRecommendation(
            id=f"visual_{platform.value}",
            category=RecommendationCategory.VISUAL,
            priority=Priority.HIGH if current_score < 0.6 else Priority.MEDIUM,
            title="Improve Visual Quality",
            description=f"Visual quality score: {current_score:.0%}. Higher quality visuals correlate with 40% better engagement.",
            current_score=current_score,
            target_score=0.9,
            expected_impact=0.18,
            difficulty=Difficulty.MEDIUM,
            action_steps=[
                ActionStep(
                    step_number=1,
                    action="Optimize lighting",
                    details="Use natural light (facing a window) or a ring light. Ensure your face/subject is well-lit without harsh shadows.",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=2,
                    action="Improve resolution and stability",
                    details="Record in 1080p minimum (4K preferred). Use a tripod or stabilizer. Avoid digital zoom.",
                    time_estimate="2 minutes"
                ),
                ActionStep(
                    step_number=3,
                    action="Enhance colors and contrast",
                    details="Apply subtle color grading in editing. Increase contrast slightly. Ensure consistent color temperature.",
                    time_estimate="10 minutes"
                ),
                ActionStep(
                    step_number=4,
                    action="Clean up the frame",
                    details="Remove distracting elements from background. Ensure the subject fills appropriate frame space (rule of thirds).",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=5,
                    action="Add text overlays properly",
                    details="Use bold, readable fonts. Ensure contrast with background. Keep text within safe zones (not at edges).",
                    time_estimate="10 minutes"
                )
            ],
            templates=[
                Template(
                    name="Optimal Video Settings",
                    example="1080p @ 30fps, 9:16 aspect ratio, good lighting, stable shot",
                    platform_notes="4K for YouTube, 1080p sufficient for TikTok/Instagram"
                ),
                Template(
                    name="Text Overlay Style",
                    example="Bold sans-serif font, white text with black stroke/shadow, centered",
                    platform_notes="Match your brand colors if established"
                )
            ],
            platform_specific={
                "tiktok": "9:16 vertical format. High saturation and contrast perform well. Fast cuts maintain attention.",
                "instagram": "9:16 for Reels, 1:1 or 4:5 for feed. Clean, aesthetic look preferred. Consistent filter style.",
                "youtube": "16:9 for regular videos, 9:16 for Shorts. Thumbnails are critical. Higher production value expected.",
                "facebook": "9:16 vertical or 1:1 square. Captions essential (85% watch silent). Bright, attention-grabbing visuals.",
                "pinterest": "2:3 vertical format optimal. Clean, minimal, aspirational aesthetic. Text overlays with value prop."
            },
            metrics_affected=["watch_time", "engagement_rate", "saves"],
            estimated_time="32 minutes",
            reasoning="Visual quality signals professionalism and earns trust. The algorithm also favors clear, well-produced content."
        )

    def _generate_pacing_recommendation(
        self,
        analysis: ContentAnalysis,
        platform: Platform
    ) -> DetailedRecommendation:
        """Generate pacing and editing recommendation."""

        current_score = analysis.pacing_score

        return DetailedRecommendation(
            id=f"pacing_{platform.value}",
            category=RecommendationCategory.PACING,
            priority=Priority.MEDIUM,
            title="Optimize Video Pacing",
            description=f"Pacing score: {current_score:.0%}. Faster pacing with strategic cuts improves retention by 25-35%.",
            current_score=current_score,
            target_score=0.85,
            expected_impact=0.15,
            difficulty=Difficulty.MEDIUM,
            action_steps=[
                ActionStep(
                    step_number=1,
                    action="Cut dead space",
                    details="Remove all pauses, 'ums', and slow moments. Every second should deliver value or entertainment.",
                    time_estimate="15 minutes"
                ),
                ActionStep(
                    step_number=2,
                    action="Add jump cuts",
                    details="Cut between sentences to maintain energy. Aim for a cut every 2-3 seconds for fast-paced content.",
                    time_estimate="10 minutes"
                ),
                ActionStep(
                    step_number=3,
                    action="Vary shot angles",
                    details="Switch between angles/zooms to add visual interest. Use 2-3 different framings throughout.",
                    time_estimate="10 minutes"
                ),
                ActionStep(
                    step_number=4,
                    action="Add visual punctuation",
                    details="Use zooms, screen shakes, or transitions to emphasize key points. Don't overuse - 2-4 per video.",
                    time_estimate="10 minutes"
                )
            ],
            templates=[
                Template(
                    name="Fast-Paced Educational",
                    example="Cut every 1-2 seconds, zoom on key words, b-roll inserts every 5-10 seconds",
                    platform_notes="Ideal for TikTok tutorials"
                ),
                Template(
                    name="Story-Driven Pacing",
                    example="Slower intro (3-5 sec cuts) → Build tension (2-3 sec) → Climax (rapid 1 sec cuts) → Resolution",
                    platform_notes="Works for narrative content"
                )
            ],
            platform_specific={
                "tiktok": "Maximum 3-second cuts. Quick zooms popular. Match cuts to trending sounds/beats.",
                "instagram": "Slightly slower than TikTok acceptable. Smooth transitions preferred. Match brand aesthetic.",
                "youtube": "Shorts need TikTok-like pacing. Long-form can be slower but cut dead space.",
                "facebook": "Medium pacing works. Focus on captions since most watch silent.",
                "pinterest": "Slower, more deliberate pacing. Focus on clearly showing steps/details."
            },
            metrics_affected=["watch_time", "retention_rate", "completion_rate"],
            estimated_time="45 minutes",
            reasoning="Attention spans are short. Videos with optimized pacing see 30-50% higher completion rates."
        )

    def _generate_caption_recommendation(
        self,
        caption: Optional[str],
        platform: Platform
    ) -> DetailedRecommendation:
        """Generate caption optimization recommendation."""

        caption_length = len(caption) if caption else 0
        has_caption = caption_length > 0

        optimal_lengths = {
            Platform.TIKTOK: (100, 150),
            Platform.INSTAGRAM: (150, 300),
            Platform.YOUTUBE: (100, 200),
            Platform.FACEBOOK: (100, 250),
            Platform.PINTEREST: (100, 500)
        }

        min_len, max_len = optimal_lengths.get(platform, (100, 200))

        return DetailedRecommendation(
            id=f"caption_{platform.value}",
            category=RecommendationCategory.CAPTION,
            priority=Priority.MEDIUM,
            title="Optimize Your Caption",
            description=f"Caption length: {caption_length} chars. Optimal for {platform.value}: {min_len}-{max_len} chars.",
            current_score=0.5 if not has_caption else min(caption_length / max_len, 1.0),
            target_score=0.85,
            expected_impact=0.10,
            difficulty=Difficulty.EASY,
            action_steps=[
                ActionStep(
                    step_number=1,
                    action="Lead with the hook",
                    details="First line should create curiosity or state value. This shows in preview before 'See more'.",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=2,
                    action="Add value or context",
                    details="Expand on the video content. Add tips, backstory, or insights not in the video.",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=3,
                    action="Include a question",
                    details="Ask viewers a question to encourage comments. Questions boost engagement by 20-40%.",
                    time_estimate="2 minutes"
                ),
                ActionStep(
                    step_number=4,
                    action="End with CTA + hashtags",
                    details="Clear call-to-action followed by your hashtag strategy (in caption or first comment).",
                    time_estimate="3 minutes"
                )
            ],
            templates=[
                Template(
                    name="Hook + Value + Question + CTA",
                    example="[Hook: 'This changed everything for me...']\n\n[Value: 2-3 sentences of insight]\n\n[Question: 'What's your experience with this?']\n\n[CTA: 'Follow for more tips!']\n\n[Hashtags]",
                    platform_notes="Universal template, adjust length per platform"
                ),
                Template(
                    name="Story Caption",
                    example="[Opening line hooks interest]\n\n[Brief story/context]\n\n[Key takeaway]\n\n[Engagement question]",
                    platform_notes="Great for personal/lifestyle content"
                )
            ],
            platform_specific={
                "tiktok": f"Keep to {min_len}-{max_len} chars. First line is crucial - appears as video caption.",
                "instagram": f"Up to {max_len}+ chars fine. Longer captions can boost time-on-post. Use line breaks.",
                "youtube": f"Description important for SEO. {min_len}+ chars with keywords. Include links.",
                "facebook": f"Medium length performs best. {min_len}-{max_len} chars. Include question for engagement.",
                "pinterest": f"SEO-focused. Use keywords naturally. {min_len}-{max_len} chars with relevant terms."
            },
            metrics_affected=["engagement_rate", "comments", "saves"],
            estimated_time="15 minutes",
            reasoning="Captions provide context and drive engagement. Optimized captions increase comments by 30-50%."
        )

    def _generate_timing_recommendation(
        self,
        posting_time: Optional[str],
        platform: Platform
    ) -> DetailedRecommendation:
        """Generate posting time recommendation."""

        # Platform-specific optimal times (general guidelines)
        optimal_times = {
            Platform.TIKTOK: "7-9 AM, 12-3 PM, 7-9 PM (audience timezone)",
            Platform.INSTAGRAM: "11 AM-1 PM, 7-9 PM weekdays; 10 AM-12 PM weekends",
            Platform.YOUTUBE: "2-4 PM for Shorts; Friday-Sunday for long-form",
            Platform.FACEBOOK: "1-4 PM weekdays; 12-1 PM weekends",
            Platform.PINTEREST: "8-11 PM and 2-4 AM; Saturdays peak"
        }

        return DetailedRecommendation(
            id=f"timing_{platform.value}",
            category=RecommendationCategory.TIMING,
            priority=Priority.MEDIUM,
            title="Optimize Posting Time",
            description=f"Posting at optimal times can increase reach by 20-40%. Best times for {platform.value}: {optimal_times[platform]}.",
            current_score=0.6,
            target_score=0.85,
            expected_impact=0.08,
            difficulty=Difficulty.EASY,
            action_steps=[
                ActionStep(
                    step_number=1,
                    action="Check your analytics",
                    details=f"Review your {platform.value} analytics to see when YOUR audience is most active.",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=2,
                    action="Test different times",
                    details="Post similar content at different times over 2 weeks. Track which times get best initial engagement.",
                    time_estimate="Ongoing"
                ),
                ActionStep(
                    step_number=3,
                    action="Consider time zones",
                    details="If your audience is global, prioritize your largest audience segment's timezone.",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=4,
                    action="Schedule consistently",
                    details="Use scheduling tools to post consistently at your optimal times. Consistency helps the algorithm.",
                    time_estimate="5 minutes"
                )
            ],
            templates=[
                Template(
                    name="Testing Schedule",
                    example="Week 1: Post at 9 AM\nWeek 2: Post at 12 PM\nWeek 3: Post at 7 PM\nCompare reach after each week",
                    platform_notes="Control content quality to isolate timing variable"
                )
            ],
            platform_specific={
                "tiktok": optimal_times[Platform.TIKTOK] + ". Post 1-3x daily for best results.",
                "instagram": optimal_times[Platform.INSTAGRAM] + ". Reels best posted when followers active.",
                "youtube": optimal_times[Platform.YOUTUBE] + ". Initial 1-hour engagement crucial.",
                "facebook": optimal_times[Platform.FACEBOOK] + ". Avoid early morning and late night.",
                "pinterest": optimal_times[Platform.PINTEREST] + ". Evening and weekend pinning performs best."
            },
            metrics_affected=["reach", "impressions", "initial_engagement"],
            estimated_time="15 minutes",
            reasoning="Posting when your audience is active maximizes initial engagement, which signals the algorithm to push content further."
        )

    def _generate_audio_recommendation(
        self,
        platform: Platform
    ) -> DetailedRecommendation:
        """Generate audio/music recommendation for video content."""

        return DetailedRecommendation(
            id=f"audio_{platform.value}",
            category=RecommendationCategory.AUDIO,
            priority=Priority.HIGH if platform in [Platform.TIKTOK, Platform.INSTAGRAM] else Priority.MEDIUM,
            title="Optimize Audio & Music Selection",
            description="Using trending sounds can increase reach by 50-100%. Audio is a key discovery signal on short-form platforms.",
            current_score=0.5,
            target_score=0.85,
            expected_impact=0.20,
            difficulty=Difficulty.EASY,
            action_steps=[
                ActionStep(
                    step_number=1,
                    action="Research trending sounds",
                    details=f"Check {platform.value}'s trending sounds page or creative center. Look for rising sounds in your niche.",
                    time_estimate="10 minutes"
                ),
                ActionStep(
                    step_number=2,
                    action="Match sound to content",
                    details="Choose sounds that fit your content's energy and message. Don't force mismatched trending sounds.",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=3,
                    action="Optimize audio levels",
                    details="If using voiceover, keep at 70-80% with music at 20-30%. Both should be clearly audible.",
                    time_estimate="5 minutes"
                ),
                ActionStep(
                    step_number=4,
                    action="Time your cuts to the beat",
                    details="Edit video cuts to match audio beats. This creates a more professional, engaging feel.",
                    time_estimate="15 minutes"
                )
            ],
            templates=[
                Template(
                    name="Voiceover + Trending Sound",
                    example="Trending sound at 20% volume + voiceover at 80% volume + sound peaks at video climax",
                    platform_notes="Works great for educational content"
                ),
                Template(
                    name="Full Trending Sound",
                    example="Use trending sound at full volume, lip sync or match actions to audio",
                    platform_notes="Best for entertainment/trend participation"
                )
            ],
            platform_specific={
                "tiktok": "Trending sounds are CRITICAL. Use TikTok Creative Center to find rising sounds. Save sounds to use later.",
                "instagram": "Reels audio library includes trending. Original audio also ranks well if engaging.",
                "youtube": "Copyright-free music important. Epidemic Sound, Artlist for licensing. Audio quality matters for long-form.",
                "facebook": "Less sound-dependent due to autoplay mute. Captions more important than audio.",
                "pinterest": "Audio less important. Focus on visual impact. Simple, ambient music if used."
            },
            metrics_affected=["reach", "discoverability", "engagement_rate"],
            estimated_time="35 minutes",
            reasoning="On TikTok and Instagram, trending sounds directly boost algorithmic distribution. Early adoption of trending sounds sees highest returns."
        )

    def _generate_trending_recommendation(
        self,
        platform: Platform,
        current_score: float
    ) -> DetailedRecommendation:
        """Generate trending content alignment recommendation."""

        return DetailedRecommendation(
            id=f"trending_{platform.value}",
            category=RecommendationCategory.TRENDING,
            priority=Priority.HIGH,
            title="Align with Current Trends",
            description=f"Trending alignment score: {current_score:.0%}. Trend participation can 3-5x your normal reach.",
            current_score=current_score,
            target_score=0.8,
            expected_impact=0.22,
            difficulty=Difficulty.MEDIUM,
            action_steps=[
                ActionStep(
                    step_number=1,
                    action="Identify relevant trends",
                    details=f"Spend 15-20 minutes daily on {platform.value}'s For You/Explore page. Note recurring formats, sounds, and topics.",
                    time_estimate="20 minutes"
                ),
                ActionStep(
                    step_number=2,
                    action="Put your unique spin",
                    details="Don't copy trends exactly. Adapt them to your niche/expertise. Add your unique value or perspective.",
                    time_estimate="15 minutes"
                ),
                ActionStep(
                    step_number=3,
                    action="Act quickly",
                    details="Trends have 3-7 day windows typically. Create and post within 24-48 hours of spotting a trend.",
                    time_estimate="Varies"
                ),
                ActionStep(
                    step_number=4,
                    action="Use trend signals",
                    details="Include trending sounds, hashtags, and formats to signal to the algorithm that you're participating.",
                    time_estimate="5 minutes"
                )
            ],
            templates=[
                Template(
                    name="Niche + Trend Format",
                    example="[Trending format/sound] + [Your niche topic] = Unique content that rides the trend wave",
                    platform_notes="This is the sweet spot for growth"
                ),
                Template(
                    name="Educational Trend Take",
                    example="Take a trending topic and provide expert insight, tips, or analysis",
                    platform_notes="Great for building authority"
                )
            ],
            platform_specific={
                "tiktok": "Trends move fastest here. Check Creative Center, For You page, and trending sounds daily.",
                "instagram": "Reels trends often lag TikTok by 1-2 weeks. Explore page shows what's working.",
                "youtube": "Shorts trends follow TikTok. Also check trending tab for broader cultural moments.",
                "facebook": "News/events drive Facebook trends. Reels trends follow Instagram.",
                "pinterest": "Seasonal trends matter most. Check Pinterest Trends tool for upcoming interest spikes."
            },
            metrics_affected=["reach", "impressions", "follower_growth"],
            estimated_time="40 minutes",
            reasoning="The algorithm actively promotes trend-participating content. Trend alignment is the fastest path to viral reach."
        )

    def _load_platform_configs(self) -> Dict[str, Dict]:
        """Load platform-specific configuration data."""
        return {
            "tiktok": {
                "optimal_duration": "15-60 seconds",
                "hashtag_count": "3-5",
                "posting_frequency": "1-3x daily"
            },
            "instagram": {
                "optimal_duration": "15-90 seconds",
                "hashtag_count": "5-10",
                "posting_frequency": "1-2x daily"
            },
            "youtube": {
                "optimal_duration": "Under 60 seconds (Shorts)",
                "hashtag_count": "3-5",
                "posting_frequency": "1x daily for Shorts"
            },
            "facebook": {
                "optimal_duration": "15-60 seconds",
                "hashtag_count": "1-3",
                "posting_frequency": "1-2x daily"
            },
            "pinterest": {
                "optimal_duration": "15-60 seconds",
                "hashtag_count": "2-5",
                "posting_frequency": "5-10x daily"
            }
        }

    def _priority_weight(self, priority: Priority) -> int:
        """Convert priority to numeric weight for sorting."""
        weights = {
            Priority.CRITICAL: 4,
            Priority.HIGH: 3,
            Priority.MEDIUM: 2,
            Priority.LOW: 1
        }
        return weights.get(priority, 0)

    def _calculate_potential_score(
        self,
        current_score: float,
        recommendations: List[DetailedRecommendation]
    ) -> float:
        """Calculate potential score if recommendations are implemented."""
        # Sum impacts with diminishing returns
        total_impact = 0
        for i, rec in enumerate(recommendations):
            # Each subsequent recommendation has diminishing returns
            diminishing_factor = 0.9 ** i
            total_impact += rec.expected_impact * diminishing_factor * 100

        potential = current_score + (total_impact * 0.7)  # 70% of theoretical max
        return min(potential, 100.0)

    def _count_priorities(self, recommendations: List[DetailedRecommendation]) -> Dict[str, int]:
        """Count recommendations by priority level."""
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for rec in recommendations:
            counts[rec.priority.value] += 1
        return counts

    def _identify_quick_wins(self, recommendations: List[DetailedRecommendation]) -> List[str]:
        """Identify quick wins (high impact, easy to implement)."""
        quick_wins = [
            rec.title for rec in recommendations
            if rec.difficulty == Difficulty.EASY and rec.expected_impact >= 0.10
        ]
        return quick_wins[:3]

    def _identify_high_impact(self, recommendations: List[DetailedRecommendation]) -> List[str]:
        """Identify highest impact actions regardless of difficulty."""
        sorted_recs = sorted(recommendations, key=lambda r: r.expected_impact, reverse=True)
        return [rec.title for rec in sorted_recs[:3]]

    def _estimate_total_time(self, recommendations: List[DetailedRecommendation]) -> str:
        """Estimate total time to implement all recommendations."""
        total_minutes = 0
        for rec in recommendations:
            # Parse time string like "35 minutes" or "1 hour"
            time_str = rec.estimated_time.lower()
            if "hour" in time_str:
                hours = int(time_str.split()[0])
                total_minutes += hours * 60
            elif "minute" in time_str:
                minutes = int(time_str.split()[0])
                total_minutes += minutes

        if total_minutes >= 60:
            hours = total_minutes // 60
            mins = total_minutes % 60
            return f"{hours}h {mins}m" if mins > 0 else f"{hours}h"
        return f"{total_minutes} minutes"
