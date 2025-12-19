"""
TikTok Platform Optimizer

Provides TikTok-specific optimization strategies, best practices,
and algorithm insights for content performance prediction.
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


class TikTokOptimizer(BasePlatformOptimizer):
    """
    TikTok-specific optimization strategies.

    TikTok's algorithm prioritizes:
    - Watch time and completion rate
    - Engagement velocity (quick engagement after posting)
    - Sound/audio usage (especially trending sounds)
    - Content freshness and consistency
    - User interactions (likes, comments, shares, saves)
    """

    def _get_platform_config(self) -> PlatformConfig:
        return PlatformConfig(
            platform_name="TikTok",
            optimal_video_duration=(15, 60),  # 15-60 seconds optimal
            optimal_aspect_ratio="9:16",
            optimal_hashtag_count=(3, 5),
            optimal_caption_length=(100, 150),
            supported_formats=[ContentFormat.VIDEO, ContentFormat.IMAGE],
            posting_frequency="1-3x daily",
            peak_posting_times=[
                "7-9 AM (before work/school)",
                "12-3 PM (lunch break)",
                "7-9 PM (evening wind-down)",
                "10 PM-12 AM (late night scrolling)"
            ],
            algorithm_priorities=[
                "Watch time and completion rate",
                "Early engagement velocity",
                "Trending sound usage",
                "User interaction rate",
                "Content freshness",
                "Re-watch rate"
            ],
            unique_features=[
                "Duets and Stitches",
                "Trending sounds",
                "Text-to-speech",
                "Green screen effect",
                "Filters and effects",
                "LIVE streaming"
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
        """Analyze content for TikTok optimization."""

        # Calculate individual scores
        format_score = self.calculate_format_score(duration, "9:16")
        hashtag_score = self.calculate_hashtag_score(len(hashtags))
        caption_score = self.calculate_caption_score(len(caption) if caption else 0)

        # TikTok-specific factors
        hook_score = visual_features.get("hook_strength", 0.5)
        pacing_score = visual_features.get("pacing_score", 0.5)

        # Algorithm alignment
        algorithm_alignment = (
            hook_score * 0.3 +  # Hook is critical
            format_score * 0.2 +
            pacing_score * 0.2 +
            hashtag_score * 0.15 +
            caption_score * 0.15
        )

        # Platform score
        platform_score = algorithm_alignment * 100

        return PlatformAnalysis(
            platform_score=platform_score,
            format_optimization={
                "current_duration": duration,
                "optimal_duration": "15-60 seconds",
                "aspect_ratio_match": "9:16" == visual_features.get("aspect_ratio", ""),
                "format_score": format_score
            },
            timing_optimization={
                "optimal_times": self.config.peak_posting_times,
                "posting_frequency": self.config.posting_frequency,
                "best_days": ["Tuesday", "Thursday", "Friday"]
            },
            content_optimization={
                "hook_score": hook_score,
                "pacing_score": pacing_score,
                "hashtag_score": hashtag_score,
                "caption_score": caption_score
            },
            trending_opportunities=self.get_trending_sounds(),
            platform_specific_tips=self.get_algorithm_tips(),
            algorithm_alignment_score=algorithm_alignment,
            competitive_analysis={
                "avg_duration": "21-34 seconds",
                "avg_hashtags": "3-4",
                "top_performing_formats": ["Tutorial", "POV", "Storytime", "Get Ready With Me"]
            }
        )

    def get_hook_recommendations(
        self,
        current_hook_score: float,
        content_type: str
    ) -> List[OptimizationTip]:
        """Get TikTok-specific hook recommendations."""

        tips = []

        if current_hook_score < 0.7:
            tips.append(OptimizationTip(
                category="hook",
                tip="Use a pattern interrupt in the first 0.5 seconds",
                impact="high",
                implementation="Start with unexpected movement, sound, or text that makes viewers pause their scroll",
                example="Quick zoom, snap cut, or bold text overlay appearing instantly"
            ))

        if current_hook_score < 0.6:
            tips.append(OptimizationTip(
                category="hook",
                tip="Lead with the payoff, not the setup",
                impact="high",
                implementation="Show the end result or most exciting moment first, then explain how you got there",
                example="'I made $10k with this one trick' → shows result → explains method"
            ))

        tips.append(OptimizationTip(
            category="hook",
            tip="Use curiosity gaps",
            impact="high",
            implementation="Create a question in the viewer's mind that they need answered",
            example="'You won't believe what happened when I tried this...' or 'POV: You just discovered...'"
        ))

        tips.append(OptimizationTip(
            category="hook",
            tip="Match trending sound to your hook",
            impact="high",
            implementation="Use a trending sound that naturally builds or has a strong opening beat",
            example="Use sounds that start with energy rather than a slow build"
        ))

        return tips

    def get_hashtag_strategy(
        self,
        current_hashtags: List[str],
        content_category: Optional[str]
    ) -> Dict[str, Any]:
        """Get TikTok-specific hashtag strategy."""

        return {
            "optimal_count": "3-5 hashtags",
            "strategy": "1 broad + 2 niche + 1-2 trending",
            "avoid": ["#fyp", "#foryou", "#viral", "#foryoupage"],
            "why_avoid": "These are saturated and don't help discoverability. The algorithm doesn't use them for distribution.",
            "recommended_structure": {
                "broad": "1 hashtag with 1M+ videos (for general discovery)",
                "niche": "2 hashtags with 10K-500K videos (your specific audience)",
                "trending": "1-2 currently trending hashtags relevant to your content"
            },
            "current_analysis": {
                "count": len(current_hashtags),
                "needs_more": len(current_hashtags) < 3,
                "too_many": len(current_hashtags) > 5
            },
            "tips": [
                "Check TikTok Creative Center for trending hashtags in your niche",
                "Use the search bar to see hashtag view counts",
                "Create a branded hashtag for your content series",
                "Rotate hashtag sets to avoid shadowban triggers"
            ]
        }

    def get_optimal_posting_times(
        self,
        target_audience: Optional[Dict[str, Any]],
        content_type: str
    ) -> Dict[str, Any]:
        """Get TikTok-specific optimal posting times."""

        base_times = {
            "morning_rush": {
                "time": "7:00 AM - 9:00 AM",
                "audience": "Commuters, students before school",
                "content_fit": ["Quick tips", "Motivation", "GRWM"]
            },
            "lunch_break": {
                "time": "12:00 PM - 3:00 PM",
                "audience": "Lunch scrollers, remote workers",
                "content_fit": ["Entertainment", "Tutorials", "Trends"]
            },
            "evening_peak": {
                "time": "7:00 PM - 9:00 PM",
                "audience": "Post-work relaxation",
                "content_fit": ["All content types", "Longer videos"]
            },
            "late_night": {
                "time": "10:00 PM - 12:00 AM",
                "audience": "Night owls, younger demographic",
                "content_fit": ["Entertainment", "Storytime", "Lifestyle"]
            }
        }

        # Adjust based on audience if provided
        if target_audience:
            age_group = target_audience.get("age_group", "")
            if "18-24" in str(age_group):
                base_times["late_night"]["priority"] = "high"
            if "25-34" in str(age_group):
                base_times["evening_peak"]["priority"] = "high"

        return {
            "time_slots": base_times,
            "best_days": {
                "highest_engagement": ["Tuesday", "Thursday"],
                "good_engagement": ["Wednesday", "Friday"],
                "moderate": ["Monday", "Saturday"],
                "lowest": ["Sunday"]
            },
            "frequency_recommendation": "Post 1-3 times daily for optimal growth",
            "consistency_note": "Posting at the same times daily helps the algorithm learn your pattern",
            "timezone_consideration": "Times are in your audience's primary timezone"
        }

    def get_format_recommendations(
        self,
        current_format: str,
        duration: Optional[float],
        aspect_ratio: Optional[str]
    ) -> List[OptimizationTip]:
        """Get TikTok-specific format recommendations."""

        tips = []

        # Aspect ratio
        if aspect_ratio != "9:16":
            tips.append(OptimizationTip(
                category="format",
                tip="Use 9:16 vertical format",
                impact="high",
                implementation="TikTok is designed for vertical content. 9:16 fills the screen and maximizes engagement.",
                example="1080x1920 pixels is the ideal resolution"
            ))

        # Duration
        if duration:
            if duration < 15:
                tips.append(OptimizationTip(
                    category="format",
                    tip="Consider extending video length",
                    impact="medium",
                    implementation="Videos under 15 seconds have less time to build engagement. Aim for 21-34 seconds for optimal watch time.",
                    example="Add more context, multiple tips, or a stronger CTA"
                ))
            elif duration > 60:
                tips.append(OptimizationTip(
                    category="format",
                    tip="Consider shortening for better retention",
                    impact="medium",
                    implementation="Videos over 60 seconds need exceptional content to maintain attention. Cut ruthlessly.",
                    example="Split into multiple parts or remove any slow sections"
                ))

        # General format tips
        tips.append(OptimizationTip(
            category="format",
            tip="Use text overlays throughout",
            impact="high",
            implementation="85% of TikTok is watched with sound off initially. Text ensures your message lands.",
            example="Key points as text, captions for all speech, hook text in first frame"
        ))

        tips.append(OptimizationTip(
            category="format",
            tip="Add captions/subtitles",
            impact="high",
            implementation="Auto-caption or manual captions increase watch time by 40%+",
            example="Use TikTok's auto-caption or CapCut for styled captions"
        ))

        return tips

    def get_trending_sounds(self) -> List[TrendingElement]:
        """Get currently trending TikTok sounds."""

        # Note: In production, this would pull from TikTok's API or a trend tracking service
        # These are example trending sound types

        return [
            TrendingElement(
                element_type="sound",
                name="Original Audio (from viral creator)",
                trend_strength=0.9,
                relevance_score=0.7,
                usage_suggestion="Use this sound within 24-48 hours for maximum reach. Early adoption is key."
            ),
            TrendingElement(
                element_type="sound",
                name="Trending Music Track",
                trend_strength=0.8,
                relevance_score=0.6,
                usage_suggestion="Sync your cuts and key moments to the beat of the music."
            ),
            TrendingElement(
                element_type="format",
                name="POV Format",
                trend_strength=0.85,
                relevance_score=0.7,
                usage_suggestion="Use 'POV:' text overlay and act out the scenario directly to camera."
            ),
            TrendingElement(
                element_type="effect",
                name="Green Screen",
                trend_strength=0.75,
                relevance_score=0.8,
                usage_suggestion="React to screenshots, articles, or other content using green screen."
            )
        ]

    def get_cta_recommendations(
        self,
        current_cta: Optional[str],
        content_type: str
    ) -> List[OptimizationTip]:
        """Get TikTok-specific CTA recommendations."""

        tips = []

        tips.append(OptimizationTip(
            category="cta",
            tip="Use 'Follow for Part 2' for series content",
            impact="high",
            implementation="Create anticipation by promising more content. This drives follows and repeat viewers.",
            example="End with 'Follow to see what happened next' or 'Part 2 coming tomorrow'"
        ))

        tips.append(OptimizationTip(
            category="cta",
            tip="Encourage Duets and Stitches",
            impact="high",
            implementation="Explicitly invite responses. This creates UGC and expands reach.",
            example="'Duet this with your reaction' or 'Stitch this with your story'"
        ))

        tips.append(OptimizationTip(
            category="cta",
            tip="Ask specific questions in comments",
            impact="medium",
            implementation="Questions drive comments, which signal engagement to the algorithm.",
            example="'Drop a 🔥 if you agree' or 'Comment your biggest struggle with [topic]'"
        ))

        tips.append(OptimizationTip(
            category="cta",
            tip="Save CTA for valuable content",
            impact="high",
            implementation="'Save this for later' works when content has reference value. Saves are weighted heavily.",
            example="Use for tutorials, tips, recipes, or any 'how-to' content"
        ))

        return tips

    def get_algorithm_tips(self) -> List[OptimizationTip]:
        """Get tips for optimizing for TikTok's algorithm."""

        return [
            OptimizationTip(
                category="algorithm",
                tip="Maximize watch time and completion rate",
                impact="high",
                implementation="The algorithm heavily weights watch time. Hook early, maintain interest, deliver value throughout.",
                example="If 50%+ of viewers watch to the end, the video gets pushed to larger audiences"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Optimize for re-watches",
                impact="high",
                implementation="Content that's watched multiple times signals high value. Include details viewers might miss.",
                example="Hidden elements, fast text viewers pause to read, or twist endings"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Post consistently at the same times",
                impact="medium",
                implementation="The algorithm learns your posting pattern and prepares your audience.",
                example="Post at 12pm and 7pm daily, not randomly throughout the day"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Engage in the first 30 minutes",
                impact="high",
                implementation="Reply to comments quickly after posting. Early engagement velocity matters.",
                example="Stay online for 30 min after posting to reply to every comment"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Use trending sounds early",
                impact="high",
                implementation="The algorithm promotes content using rising sounds. Get in early, not when it's saturated.",
                example="Check Creative Center daily for emerging sounds in your niche"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Avoid engagement bait that doesn't deliver",
                impact="medium",
                implementation="Clickbait without payoff leads to negative signals (quick exits, low completion).",
                example="If you promise '5 tips', deliver exactly 5 valuable tips"
            )
        ]
