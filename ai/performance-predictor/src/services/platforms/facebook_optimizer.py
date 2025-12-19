"""
Facebook Platform Optimizer

Provides Facebook-specific optimization strategies for Reels, Stories, and Feed content.
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


class FacebookOptimizer(BasePlatformOptimizer):
    """
    Facebook-specific optimization strategies.

    Facebook's algorithm prioritizes:
    - Meaningful interactions (comments, shares)
    - Content from friends and family
    - Watch time for video
    - Group engagement
    - For Reels: Similar to Instagram but different audience behavior
    """

    def _get_platform_config(self) -> PlatformConfig:
        return PlatformConfig(
            platform_name="Facebook",
            optimal_video_duration=(15, 60),
            optimal_aspect_ratio="9:16",  # For Reels; 1:1 works for Feed
            optimal_hashtag_count=(1, 3),  # Less is more on Facebook
            optimal_caption_length=(100, 250),
            supported_formats=[
                ContentFormat.VIDEO,
                ContentFormat.IMAGE,
                ContentFormat.CAROUSEL,
                ContentFormat.STORY,
                ContentFormat.REEL
            ],
            posting_frequency="1-2x daily",
            peak_posting_times=[
                "1 PM - 4 PM (weekdays)",
                "12 PM - 1 PM (lunch)",
                "Weekends: 12 PM - 1 PM"
            ],
            algorithm_priorities=[
                "Meaningful interactions",
                "Shares to Messenger/Groups",
                "Comments with replies",
                "Watch time for video",
                "Content from friends over Pages"
            ],
            unique_features=[
                "Facebook Reels",
                "Stories",
                "Groups",
                "Events",
                "Messenger sharing",
                "Watch parties"
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
        """Analyze content for Facebook optimization."""

        format_score = self.calculate_format_score(duration, "9:16")
        hashtag_score = self.calculate_hashtag_score(len(hashtags))
        caption_score = self.calculate_caption_score(len(caption) if caption else 0)

        # Facebook values shareability highly
        algorithm_alignment = (
            visual_features.get("quality_score", 0.5) * 0.2 +
            format_score * 0.2 +
            caption_score * 0.3 +  # Captions more important on Facebook
            hashtag_score * 0.1 +
            text_features.get("has_call_to_action", False) * 0.2
        )

        return PlatformAnalysis(
            platform_score=algorithm_alignment * 100,
            format_optimization={
                "optimal_duration": "15-60 seconds for Reels",
                "aspect_ratio": "9:16 for Reels, 1:1 for Feed",
                "sound_off_design": "85% watch without sound initially"
            },
            timing_optimization={
                "optimal_times": self.config.peak_posting_times,
                "posting_frequency": self.config.posting_frequency,
                "best_days": ["Wednesday", "Thursday", "Friday"]
            },
            content_optimization={
                "caption_importance": "High - Facebook users read captions",
                "shareability_focus": "Create content people want to share with friends"
            },
            trending_opportunities=self.get_trending_sounds(),
            platform_specific_tips=self.get_algorithm_tips(),
            algorithm_alignment_score=algorithm_alignment,
            competitive_analysis={
                "top_content_types": ["Relatable humor", "Heartwarming stories", "Useful tips"]
            }
        )

    def get_hook_recommendations(
        self,
        current_hook_score: float,
        content_type: str
    ) -> List[OptimizationTip]:
        """Get Facebook-specific hook recommendations."""

        return [
            OptimizationTip(
                category="hook",
                tip="Design for sound-off viewing",
                impact="high",
                implementation="85% of Facebook video is watched without sound. Use captions and visual hooks.",
                example="Bold text overlay in the first frame explaining the value"
            ),
            OptimizationTip(
                category="hook",
                tip="Lead with emotion",
                impact="high",
                implementation="Facebook's older demographic responds well to emotional content.",
                example="Heartwarming, inspiring, or nostalgic openings perform best"
            ),
            OptimizationTip(
                category="hook",
                tip="Movement in frame one",
                impact="medium",
                implementation="Auto-play is silent, so movement catches attention in the feed.",
                example="Start with action, gestures, or dynamic visuals"
            )
        ]

    def get_hashtag_strategy(
        self,
        current_hashtags: List[str],
        content_category: Optional[str]
    ) -> Dict[str, Any]:
        """Get Facebook-specific hashtag strategy."""

        return {
            "optimal_count": "1-3 hashtags (less is more)",
            "strategy": "Only use highly relevant hashtags",
            "why_minimal": "Facebook isn't hashtag-driven like Instagram. Overuse looks spammy.",
            "tips": [
                "Use branded hashtags for campaigns",
                "Keep it to 1-3 truly relevant tags",
                "Hashtags work better in Groups than on Pages"
            ],
            "current_analysis": {
                "count": len(current_hashtags),
                "too_many": len(current_hashtags) > 3
            }
        }

    def get_optimal_posting_times(
        self,
        target_audience: Optional[Dict[str, Any]],
        content_type: str
    ) -> Dict[str, Any]:
        """Get Facebook-specific optimal posting times."""

        return {
            "time_slots": {
                "lunch_break": {
                    "time": "12:00 PM - 1:00 PM",
                    "audience": "Lunch scrollers"
                },
                "afternoon": {
                    "time": "1:00 PM - 4:00 PM",
                    "audience": "Work breaks, stay-at-home parents"
                },
                "evening": {
                    "time": "7:00 PM - 9:00 PM",
                    "audience": "After dinner scrolling"
                }
            },
            "best_days": ["Wednesday", "Thursday", "Friday"],
            "avoid": "Early morning and late night (lower engagement)",
            "audience_note": "Facebook's audience skews older - adjust timing accordingly"
        }

    def get_format_recommendations(
        self,
        current_format: str,
        duration: Optional[float],
        aspect_ratio: Optional[str]
    ) -> List[OptimizationTip]:
        """Get Facebook-specific format recommendations."""

        return [
            OptimizationTip(
                category="format",
                tip="Use captions/subtitles always",
                impact="high",
                implementation="Facebook auto-plays silent. Captions are essential for engagement.",
                example="Large, readable text with high contrast background"
            ),
            OptimizationTip(
                category="format",
                tip="Square or vertical for Feed",
                impact="medium",
                implementation="1:1 square takes up more feed real estate on mobile.",
                example="Use 1:1 for feed posts, 9:16 for Reels and Stories"
            ),
            OptimizationTip(
                category="format",
                tip="Reels for discovery",
                impact="high",
                implementation="Facebook Reels get pushed to non-followers. Use for reach.",
                example="Cross-post Instagram Reels to Facebook Reels"
            )
        ]

    def get_trending_sounds(self) -> List[TrendingElement]:
        """Get currently trending Facebook elements."""

        return [
            TrendingElement(
                element_type="format",
                name="Relatable Life Content",
                trend_strength=0.85,
                relevance_score=0.8,
                usage_suggestion="Content about parenting, work-life, relationships performs well."
            ),
            TrendingElement(
                element_type="format",
                name="Nostalgic Content",
                trend_strength=0.8,
                relevance_score=0.75,
                usage_suggestion="'Remember when...' or throwback content resonates with Facebook's audience."
            )
        ]

    def get_cta_recommendations(
        self,
        current_cta: Optional[str],
        content_type: str
    ) -> List[OptimizationTip]:
        """Get Facebook-specific CTA recommendations."""

        return [
            OptimizationTip(
                category="cta",
                tip="Share CTAs are powerful",
                impact="high",
                implementation="'Share this with someone who needs to hear this' drives shares.",
                example="Tag a friend CTAs also work on Facebook"
            ),
            OptimizationTip(
                category="cta",
                tip="Group sharing CTAs",
                impact="high",
                implementation="Encourage sharing to relevant Facebook Groups.",
                example="'Share this in your [topic] groups'"
            ),
            OptimizationTip(
                category="cta",
                tip="Link clicks need strong value",
                impact="medium",
                implementation="Facebook deprioritizes link posts. Make the value proposition crystal clear.",
                example="Post engaging content, add link in comments or first comment"
            )
        ]

    def get_algorithm_tips(self) -> List[OptimizationTip]:
        """Get tips for optimizing for Facebook's algorithm."""

        return [
            OptimizationTip(
                category="algorithm",
                tip="Prioritize meaningful interactions",
                impact="high",
                implementation="Comments and shares matter more than likes. Create conversation starters.",
                example="Ask questions, share opinions, invite discussion"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Avoid engagement bait",
                impact="high",
                implementation="Facebook explicitly penalizes 'Like if...' and 'Share if...' posts.",
                example="Create naturally shareable content instead of begging for engagement"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Leverage Groups",
                impact="high",
                implementation="Group content gets priority. Build or participate in relevant groups.",
                example="Create a community group around your niche"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Post Reels for new audience",
                impact="high",
                implementation="Reels are shown to non-followers. Best way to grow on Facebook now.",
                example="Cross-post from Instagram or create Facebook-specific Reels"
            )
        ]
