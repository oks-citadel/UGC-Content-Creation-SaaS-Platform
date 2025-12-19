"""
Instagram Platform Optimizer

Provides Instagram-specific optimization strategies, best practices,
and algorithm insights for Reels, Stories, and Feed content.
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


class InstagramOptimizer(BasePlatformOptimizer):
    """
    Instagram-specific optimization strategies.

    Instagram's algorithm prioritizes:
    - Relationship signals (past interactions)
    - Interest signals (content preferences)
    - Timeliness (recent content)
    - Engagement metrics (likes, comments, saves, shares)
    - For Reels: Watch time, shares, audio usage
    """

    def _get_platform_config(self) -> PlatformConfig:
        return PlatformConfig(
            platform_name="Instagram",
            optimal_video_duration=(15, 90),  # 15-90 seconds for Reels
            optimal_aspect_ratio="9:16",  # For Reels; 1:1 or 4:5 for Feed
            optimal_hashtag_count=(5, 10),
            optimal_caption_length=(150, 300),
            supported_formats=[
                ContentFormat.VIDEO,
                ContentFormat.IMAGE,
                ContentFormat.CAROUSEL,
                ContentFormat.STORY,
                ContentFormat.REEL
            ],
            posting_frequency="1-2x daily",
            peak_posting_times=[
                "11 AM - 1 PM (lunch break)",
                "7 PM - 9 PM (evening)",
                "10 AM - 12 PM (weekends)"
            ],
            algorithm_priorities=[
                "Saves and shares (highest weight)",
                "Comments and replies",
                "Watch time for Reels",
                "Profile visits after viewing",
                "Relationship strength with followers",
                "Content originality"
            ],
            unique_features=[
                "Reels",
                "Stories with stickers",
                "Carousels (swipe posts)",
                "Guides",
                "Collab posts",
                "Broadcast Channels"
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
        """Analyze content for Instagram optimization."""

        format_score = self.calculate_format_score(duration, "9:16")
        hashtag_score = self.calculate_hashtag_score(len(hashtags))
        caption_score = self.calculate_caption_score(len(caption) if caption else 0)

        visual_quality = visual_features.get("quality_score", 0.5)
        hook_score = visual_features.get("hook_strength", 0.5)

        # Instagram values aesthetics more than TikTok
        algorithm_alignment = (
            visual_quality * 0.25 +
            hook_score * 0.25 +
            format_score * 0.2 +
            hashtag_score * 0.15 +
            caption_score * 0.15
        )

        platform_score = algorithm_alignment * 100

        return PlatformAnalysis(
            platform_score=platform_score,
            format_optimization={
                "current_duration": duration,
                "optimal_duration": "15-90 seconds for Reels",
                "aspect_ratio_match": True if "9:16" == visual_features.get("aspect_ratio", "") else False,
                "format_score": format_score,
                "note": "First frame is your thumbnail - make it count"
            },
            timing_optimization={
                "optimal_times": self.config.peak_posting_times,
                "posting_frequency": self.config.posting_frequency,
                "best_days": ["Wednesday", "Friday", "Saturday"]
            },
            content_optimization={
                "visual_quality": visual_quality,
                "hook_score": hook_score,
                "hashtag_score": hashtag_score,
                "caption_score": caption_score
            },
            trending_opportunities=self.get_trending_sounds(),
            platform_specific_tips=self.get_algorithm_tips(),
            algorithm_alignment_score=algorithm_alignment,
            competitive_analysis={
                "avg_duration": "15-30 seconds for Reels",
                "avg_hashtags": "5-10",
                "top_content_types": ["Reels", "Carousels", "Photo dumps"]
            }
        )

    def get_hook_recommendations(
        self,
        current_hook_score: float,
        content_type: str
    ) -> List[OptimizationTip]:
        """Get Instagram-specific hook recommendations."""

        tips = []

        tips.append(OptimizationTip(
            category="hook",
            tip="First frame IS your thumbnail",
            impact="high",
            implementation="Unlike TikTok, Instagram uses the first frame as the Reel cover. Design it to be compelling as a still image.",
            example="Start with a clean, eye-catching visual with text overlay stating the value"
        ))

        if current_hook_score < 0.7:
            tips.append(OptimizationTip(
                category="hook",
                tip="Use the transformation format",
                impact="high",
                implementation="Show before/after or problem/solution immediately. Instagram audiences love transformations.",
                example="Split screen with 'Before' and 'After', or quick cut between states"
            ))

        tips.append(OptimizationTip(
            category="hook",
            tip="Direct address with value statement",
            impact="high",
            implementation="Look at camera, speak directly to viewer, state what they'll learn or gain.",
            example="'Here are 3 mistakes killing your [topic]' while maintaining eye contact"
        ))

        tips.append(OptimizationTip(
            category="hook",
            tip="Leverage aesthetic appeal",
            impact="medium",
            implementation="Instagram audiences expect higher visual quality. Lead with your most visually stunning moment.",
            example="Beautiful product shot, stunning location, or polished graphics"
        ))

        return tips

    def get_hashtag_strategy(
        self,
        current_hashtags: List[str],
        content_category: Optional[str]
    ) -> Dict[str, Any]:
        """Get Instagram-specific hashtag strategy."""

        return {
            "optimal_count": "5-10 hashtags",
            "placement": "In caption (better reach) or first comment (cleaner look)",
            "strategy": "Mix of sizes: 3 large (1M+), 4 medium (100K-1M), 3 small (10K-100K)",
            "banned_hashtags_warning": "Check hashtags before using - Instagram bans hashtags that violate guidelines",
            "recommended_structure": {
                "large": "3 hashtags with 1M+ posts (broad discovery)",
                "medium": "4 hashtags with 100K-1M posts (targeted discovery)",
                "niche": "3 hashtags with 10K-100K posts (highly targeted)"
            },
            "current_analysis": {
                "count": len(current_hashtags),
                "optimal_range": 5 <= len(current_hashtags) <= 10
            },
            "tips": [
                "Research hashtags your competitors use successfully",
                "Create a branded hashtag for your content",
                "Rotate hashtag sets every few posts",
                "Use Instagram's search to check if hashtags are active",
                "Avoid banned hashtags (search the hashtag - if no 'Recent' tab, it's banned)"
            ],
            "placement_debate": {
                "in_caption": "Slightly better for reach, looks less clean",
                "first_comment": "Cleaner aesthetic, post immediately after publishing",
                "recommendation": "Test both, but caption placement is generally safer"
            }
        }

    def get_optimal_posting_times(
        self,
        target_audience: Optional[Dict[str, Any]],
        content_type: str
    ) -> Dict[str, Any]:
        """Get Instagram-specific optimal posting times."""

        return {
            "time_slots": {
                "morning_commute": {
                    "time": "7:00 AM - 9:00 AM",
                    "best_for": "Motivational content, quick tips"
                },
                "lunch_break": {
                    "time": "11:00 AM - 1:00 PM",
                    "best_for": "All content types, highest weekday engagement"
                },
                "afternoon_slump": {
                    "time": "3:00 PM - 5:00 PM",
                    "best_for": "Entertainment, light content"
                },
                "evening_peak": {
                    "time": "7:00 PM - 9:00 PM",
                    "best_for": "In-depth content, tutorials, stories"
                }
            },
            "best_days": {
                "highest_engagement": ["Wednesday", "Friday"],
                "good_engagement": ["Tuesday", "Thursday", "Saturday"],
                "moderate": ["Monday", "Sunday"]
            },
            "content_type_timing": {
                "reels": "Post when your audience is most active - check Instagram Insights",
                "stories": "Post throughout the day (multiple Stories perform well)",
                "feed_posts": "Post at peak times, less frequency is okay",
                "carousels": "Lunch break and evening - when people have time to swipe"
            },
            "frequency_recommendation": {
                "reels": "1-2 per day",
                "stories": "3-7 per day",
                "feed_posts": "3-5 per week",
                "carousels": "2-3 per week"
            }
        }

    def get_format_recommendations(
        self,
        current_format: str,
        duration: Optional[float],
        aspect_ratio: Optional[str]
    ) -> List[OptimizationTip]:
        """Get Instagram-specific format recommendations."""

        tips = []

        # Reels format
        tips.append(OptimizationTip(
            category="format",
            tip="Prioritize Reels for reach",
            impact="high",
            implementation="Instagram is pushing Reels heavily. They get 2x the reach of static posts.",
            example="Convert static content ideas into short video formats"
        ))

        if aspect_ratio and aspect_ratio != "9:16":
            tips.append(OptimizationTip(
                category="format",
                tip="Use 9:16 for Reels",
                impact="high",
                implementation="Vertical video fills the screen in the Reels tab. 1:1 or 4:5 works for Feed only.",
                example="1080x1920 pixels for optimal Reels quality"
            ))

        # Duration
        if duration:
            if duration > 90:
                tips.append(OptimizationTip(
                    category="format",
                    tip="Keep Reels under 90 seconds",
                    impact="medium",
                    implementation="Reels can be up to 90 seconds, but 15-30 seconds often performs best for engagement.",
                    example="Cut to essential content, save longer content for IGTV/YouTube"
                ))

        tips.append(OptimizationTip(
            category="format",
            tip="Design for the grid",
            impact="medium",
            implementation="Your Reels appear on your profile grid. Consider how the cover image looks in that context.",
            example="Use consistent cover image style or colors for brand recognition"
        ))

        tips.append(OptimizationTip(
            category="format",
            tip="Use Carousels for educational content",
            impact="high",
            implementation="Carousels get saved more than single images. Great for tips, tutorials, and lists.",
            example="10-slide carousel with one tip per slide, strong CTA on last slide"
        ))

        return tips

    def get_trending_sounds(self) -> List[TrendingElement]:
        """Get currently trending Instagram sounds."""

        return [
            TrendingElement(
                element_type="sound",
                name="Trending Audio from Reels",
                trend_strength=0.85,
                relevance_score=0.7,
                usage_suggestion="Use the 'Save Audio' feature when you hear trending sounds. Check Reels tab for what's popular."
            ),
            TrendingElement(
                element_type="format",
                name="Photo Dump Carousel",
                trend_strength=0.8,
                relevance_score=0.75,
                usage_suggestion="Casual, authentic multi-photo carousels perform well. Mix professional and candid shots."
            ),
            TrendingElement(
                element_type="format",
                name="Talking Head + B-Roll",
                trend_strength=0.85,
                relevance_score=0.8,
                usage_suggestion="Combine direct-to-camera speaking with relevant B-roll footage for tutorials."
            ),
            TrendingElement(
                element_type="feature",
                name="Collab Posts",
                trend_strength=0.75,
                relevance_score=0.7,
                usage_suggestion="Use Collab feature to appear on two profiles simultaneously, doubling your reach."
            )
        ]

    def get_cta_recommendations(
        self,
        current_cta: Optional[str],
        content_type: str
    ) -> List[OptimizationTip]:
        """Get Instagram-specific CTA recommendations."""

        tips = []

        tips.append(OptimizationTip(
            category="cta",
            tip="Prioritize Save CTAs",
            impact="high",
            implementation="'Save this for later' is powerful on Instagram. Saves are weighted heavily by the algorithm.",
            example="End with 'Save this for when you need it' for reference content"
        ))

        tips.append(OptimizationTip(
            category="cta",
            tip="Use Share to Story CTA",
            impact="high",
            implementation="'Share this to your Story' expands reach to your viewers' audiences.",
            example="Create shareable quotes or tips that people want to share"
        ))

        tips.append(OptimizationTip(
            category="cta",
            tip="DM automation CTAs",
            impact="high",
            implementation="'DM me [KEYWORD] for the free guide' drives DMs and builds list.",
            example="Use tools like ManyChat to automate responses with links/resources"
        ))

        tips.append(OptimizationTip(
            category="cta",
            tip="Double-tap and comment CTAs",
            impact="medium",
            implementation="Simple engagement CTAs still work. Ask specific questions to drive comments.",
            example="'Double tap if this helped' or 'Comment with your answer'"
        ))

        if content_type == "carousel":
            tips.append(OptimizationTip(
                category="cta",
                tip="Use swipe CTAs throughout carousel",
                impact="medium",
                implementation="Add 'Swipe for more' or arrows on each slide to increase swipe-through rate.",
                example="Arrow graphics pointing right, 'Next slide' text"
            ))

        return tips

    def get_algorithm_tips(self) -> List[OptimizationTip]:
        """Get tips for optimizing for Instagram's algorithm."""

        return [
            OptimizationTip(
                category="algorithm",
                tip="Saves and Shares > Likes",
                impact="high",
                implementation="Create content worth saving or sharing. These signals outweigh simple likes.",
                example="Tutorials, tips, quotes, and reference content get saved. Relatable content gets shared."
            ),
            OptimizationTip(
                category="algorithm",
                tip="Reply to comments quickly",
                impact="high",
                implementation="Comments and replies boost your content. Reply within the first hour especially.",
                example="Ask follow-up questions in your replies to keep the conversation going"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Post Reels consistently",
                impact="high",
                implementation="Instagram rewards consistent Reels creators with more distribution.",
                example="Aim for at least 4-5 Reels per week minimum"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Use all features",
                impact="medium",
                implementation="Instagram favors creators who use multiple features: Reels, Stories, Feed, Guides, Live.",
                example="Post a Reel, share it to Stories, and cross-promote with a Feed post"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Avoid engagement bait",
                impact="high",
                implementation="Instagram explicitly penalizes 'like if...' and 'comment if...' bait. Add genuine value.",
                example="Instead of 'like if you agree', ask a genuine question related to your content"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Original content performs better",
                impact="high",
                implementation="Instagram deprioritizes content with TikTok watermarks or recycled content.",
                example="Create original content or remove watermarks when cross-posting"
            )
        ]
