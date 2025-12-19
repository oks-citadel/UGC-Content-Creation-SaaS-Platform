"""
YouTube Platform Optimizer

Provides YouTube-specific optimization strategies for both Shorts and long-form content.
"""

from typing import List, Dict, Optional, Any
from .base_optimizer import (
    BasePlatformOptimizer,
    PlatformConfig,
    PlatformAnalysis,
    OptimizationTip,
    TrendingElement,
    ContentFormat,
)


class YouTubeOptimizer(BasePlatformOptimizer):
    """
    YouTube-specific optimization strategies.

    YouTube's algorithm prioritizes:
    - Watch time and session time
    - Click-through rate (CTR) on thumbnails
    - Engagement (likes, comments, shares)
    - Subscriber conversion
    - For Shorts: Swipe-away rate, loop completions
    """

    def _get_platform_config(self) -> PlatformConfig:
        return PlatformConfig(
            platform_name="YouTube",
            optimal_video_duration=(15, 60),  # For Shorts; long-form is different
            optimal_aspect_ratio="9:16",  # For Shorts; 16:9 for long-form
            optimal_hashtag_count=(3, 5),
            optimal_caption_length=(100, 200),  # Title is more important
            supported_formats=[ContentFormat.VIDEO, ContentFormat.SHORT],
            posting_frequency="1x daily for Shorts, 2-3x weekly for long-form",
            peak_posting_times=[
                "2 PM - 4 PM (weekdays)",
                "Friday evening",
                "Saturday and Sunday afternoon"
            ],
            algorithm_priorities=[
                "Watch time (total minutes watched)",
                "Click-through rate (CTR)",
                "Engagement rate",
                "Session time (keeps viewers on YouTube)",
                "Subscriber notification clicks",
                "For Shorts: Loop completions, swipe-away rate"
            ],
            unique_features=[
                "Shorts",
                "Community posts",
                "Premieres",
                "Chapters",
                "Cards and end screens",
                "Memberships"
            ]
        )

    def analyze_content(
        self,
        content_type: str,
        duration: Optional[float],
        caption: Optional[str],
        hashtags: List[str],
        visual_features: Dict[str, Any],
        text_features: Dict[str, Any]
    ) -> PlatformAnalysis:
        """Analyze content for YouTube optimization."""

        is_shorts = content_type == "short" or (duration and duration <= 60)

        format_score = self.calculate_format_score(duration, "9:16" if is_shorts else "16:9")
        hashtag_score = self.calculate_hashtag_score(len(hashtags))
        hook_score = visual_features.get("hook_strength", 0.5)

        algorithm_alignment = (
            hook_score * 0.35 +
            format_score * 0.25 +
            visual_features.get("quality_score", 0.5) * 0.25 +
            hashtag_score * 0.15
        )

        return PlatformAnalysis(
            platform_score=algorithm_alignment * 100,
            format_optimization={
                "content_type": "Shorts" if is_shorts else "Long-form",
                "optimal_duration": "Under 60 seconds" if is_shorts else "8-15 minutes",
                "aspect_ratio": "9:16 vertical" if is_shorts else "16:9 horizontal"
            },
            timing_optimization={
                "optimal_times": self.config.peak_posting_times,
                "posting_frequency": self.config.posting_frequency
            },
            content_optimization={
                "hook_score": hook_score,
                "hashtag_score": hashtag_score,
                "quality_score": visual_features.get("quality_score", 0.5)
            },
            trending_opportunities=self.get_trending_sounds(),
            platform_specific_tips=self.get_algorithm_tips(),
            algorithm_alignment_score=algorithm_alignment,
            competitive_analysis={
                "avg_shorts_duration": "30-45 seconds",
                "top_shorts_formats": ["Tutorial", "Before/After", "POV", "Reaction"]
            }
        )

    def get_hook_recommendations(
        self,
        current_hook_score: float,
        content_type: str
    ) -> List[OptimizationTip]:
        """Get YouTube-specific hook recommendations."""

        tips = []

        tips.append(OptimizationTip(
            category="hook",
            tip="Skip intros for Shorts",
            impact="high",
            implementation="Shorts viewers swipe away in 1-2 seconds. No logos, no 'hey guys', straight to content.",
            example="Start mid-action or with the most compelling visual immediately"
        ))

        tips.append(OptimizationTip(
            category="hook",
            tip="First 5 seconds determine everything",
            impact="high",
            implementation="YouTube measures how many people leave in the first 5 seconds. Front-load value.",
            example="State what viewers will learn or see in the first sentence"
        ))

        tips.append(OptimizationTip(
            category="hook",
            tip="Use pattern interrupts for Shorts",
            impact="high",
            implementation="Movement, sound, or visual change in the first frame stops the scroll.",
            example="Quick zoom, hand gesture, or bold text appearing"
        ))

        return tips

    def get_hashtag_strategy(
        self,
        current_hashtags: List[str],
        content_category: Optional[str]
    ) -> Dict[str, Any]:
        """Get YouTube-specific hashtag strategy."""

        return {
            "optimal_count": "3-5 hashtags",
            "placement": "First 3 hashtags appear above the title",
            "shorts_specific": "#Shorts is NOT required anymore but doesn't hurt",
            "strategy": "Use searchable keywords as hashtags",
            "tips": [
                "First hashtag appears as a clickable link above your title",
                "Use hashtags that people actually search for",
                "Don't use hashtags just to game the system",
                "Category hashtags help YouTube understand your content"
            ]
        }

    def get_optimal_posting_times(
        self,
        target_audience: Optional[Dict[str, Any]],
        content_type: str
    ) -> Dict[str, Any]:
        """Get YouTube-specific optimal posting times."""

        return {
            "shorts": {
                "best_times": ["12 PM - 3 PM", "6 PM - 9 PM"],
                "frequency": "1-3 per day for maximum growth",
                "note": "Shorts can go viral at any time, consistency matters more"
            },
            "long_form": {
                "best_times": ["2 PM - 4 PM weekdays", "Friday 5 PM", "Weekend afternoons"],
                "frequency": "1-3 per week for quality",
                "note": "Post 2-3 hours before peak viewing time for best initial push"
            },
            "best_days": {
                "shorts": "Consistent daily posting beats specific days",
                "long_form": "Friday, Saturday, Sunday typically perform best"
            }
        }

    def get_format_recommendations(
        self,
        current_format: str,
        duration: Optional[float],
        aspect_ratio: Optional[str]
    ) -> List[OptimizationTip]:
        """Get YouTube-specific format recommendations."""

        tips = []

        tips.append(OptimizationTip(
            category="format",
            tip="Shorts must be under 60 seconds",
            impact="high",
            implementation="Videos over 60 seconds are not eligible for the Shorts shelf.",
            example="Keep Shorts between 30-59 seconds for optimal performance"
        ))

        tips.append(OptimizationTip(
            category="format",
            tip="9:16 vertical for Shorts",
            impact="high",
            implementation="Vertical video is required for Shorts. Horizontal video won't be pushed as a Short.",
            example="1080x1920 pixels minimum"
        ))

        tips.append(OptimizationTip(
            category="format",
            tip="Loop your Shorts",
            impact="high",
            implementation="Design the ending to seamlessly lead back to the beginning for re-watches.",
            example="End on a cliffhanger or with a visual that matches your opening"
        ))

        return tips

    def get_trending_sounds(self) -> List[TrendingElement]:
        """Get currently trending YouTube elements."""

        return [
            TrendingElement(
                element_type="format",
                name="Reply to Comments",
                trend_strength=0.85,
                relevance_score=0.8,
                usage_suggestion="Create Shorts replying to comments on your videos. Drives engagement loop."
            ),
            TrendingElement(
                element_type="sound",
                name="Trending Audio",
                trend_strength=0.75,
                relevance_score=0.7,
                usage_suggestion="Use trending audio from other Shorts. Check 'Audio' tab when creating."
            ),
            TrendingElement(
                element_type="format",
                name="Tutorial/How-to",
                trend_strength=0.9,
                relevance_score=0.85,
                usage_suggestion="Quick tutorial Shorts perform consistently well. Show one clear tip."
            )
        ]

    def get_cta_recommendations(
        self,
        current_cta: Optional[str],
        content_type: str
    ) -> List[OptimizationTip]:
        """Get YouTube-specific CTA recommendations."""

        return [
            OptimizationTip(
                category="cta",
                tip="Subscribe CTA at value peaks",
                impact="high",
                implementation="Ask for subscription after delivering value, not before.",
                example="'If this helped, subscribe for more tips like this'"
            ),
            OptimizationTip(
                category="cta",
                tip="Use pinned comments",
                impact="medium",
                implementation="Pin a comment with additional value or a question to drive engagement.",
                example="Pin a comment asking viewers to share their experience"
            ),
            OptimizationTip(
                category="cta",
                tip="Comment engagement CTA",
                impact="high",
                implementation="Ask specific questions to drive comments. Comments boost algorithm ranking.",
                example="'Drop a comment with your biggest [topic] challenge'"
            )
        ]

    def get_algorithm_tips(self) -> List[OptimizationTip]:
        """Get tips for optimizing for YouTube's algorithm."""

        return [
            OptimizationTip(
                category="algorithm",
                tip="Optimize for swipe-away rate",
                impact="high",
                implementation="If viewers swipe away quickly, Shorts die. Make every second valuable.",
                example="No dead space, no slow moments, constant value delivery"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Encourage loops",
                impact="high",
                implementation="Videos that loop multiple times signal high engagement.",
                example="Create curiosity that makes viewers want to watch again"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Post Shorts consistently",
                impact="high",
                implementation="1-3 Shorts daily teaches the algorithm about your content.",
                example="Batch create 7 Shorts and schedule one per day"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Cross-promote with long-form",
                impact="medium",
                implementation="Shorts can drive viewers to your long-form content and vice versa.",
                example="Tease long-form content in Shorts with 'Full video on my channel'"
            )
        ]
