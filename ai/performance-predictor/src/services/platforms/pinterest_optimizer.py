"""
Pinterest Platform Optimizer

Provides Pinterest-specific optimization strategies for Pins and Idea Pins.
Pinterest is unique as a visual search engine with long content lifespan.
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


class PinterestOptimizer(BasePlatformOptimizer):
    """
    Pinterest-specific optimization strategies.

    Pinterest is unique because:
    - It's a visual search engine, not just social media
    - Content has LONG lifespan (months to years)
    - SEO matters significantly
    - Users are in discovery/planning mode
    - 97% of searches are unbranded
    """

    def _get_platform_config(self) -> PlatformConfig:
        return PlatformConfig(
            platform_name="Pinterest",
            optimal_video_duration=(15, 60),
            optimal_aspect_ratio="2:3",  # 1000x1500 px ideal
            optimal_hashtag_count=(2, 5),
            optimal_caption_length=(100, 500),  # Description is important for SEO
            supported_formats=[
                ContentFormat.IMAGE,
                ContentFormat.VIDEO,
                ContentFormat.PIN,
                ContentFormat.CAROUSEL
            ],
            posting_frequency="5-15 pins daily",
            peak_posting_times=[
                "8 PM - 11 PM",
                "2 AM - 4 AM",
                "Weekends peak higher"
            ],
            algorithm_priorities=[
                "Pin quality and freshness",
                "Domain quality",
                "Pinner quality (engagement history)",
                "Topic relevance",
                "Save rate",
                "Click-through rate"
            ],
            unique_features=[
                "Idea Pins (multi-page)",
                "Product Pins",
                "Rich Pins",
                "Pinterest Trends tool",
                "Shopping integration",
                "Long content lifespan"
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
        """Analyze content for Pinterest optimization."""

        format_score = self.calculate_format_score(duration, "2:3")
        hashtag_score = self.calculate_hashtag_score(len(hashtags))
        caption_score = self.calculate_caption_score(len(caption) if caption else 0)

        # Pinterest values visual quality and SEO highly
        visual_quality = visual_features.get("quality_score", 0.5)

        algorithm_alignment = (
            visual_quality * 0.35 +  # Visual quality is paramount
            caption_score * 0.3 +  # SEO in description
            format_score * 0.2 +
            hashtag_score * 0.15
        )

        return PlatformAnalysis(
            platform_score=algorithm_alignment * 100,
            format_optimization={
                "optimal_aspect_ratio": "2:3 (1000x1500 px)",
                "video_duration": "15-60 seconds for video pins",
                "idea_pins": "Multi-page format for tutorials"
            },
            timing_optimization={
                "optimal_times": self.config.peak_posting_times,
                "posting_frequency": self.config.posting_frequency,
                "best_days": ["Saturday", "Sunday"],
                "content_lifespan": "Pins can drive traffic for months to years"
            },
            content_optimization={
                "visual_quality": visual_quality,
                "seo_score": caption_score,
                "hashtag_score": hashtag_score
            },
            trending_opportunities=self.get_trending_sounds(),
            platform_specific_tips=self.get_algorithm_tips(),
            algorithm_alignment_score=algorithm_alignment,
            competitive_analysis={
                "top_categories": ["Home", "Fashion", "Food", "DIY", "Beauty"],
                "seasonal_importance": "Plan content 45 days ahead for seasons/holidays"
            }
        )

    def get_hook_recommendations(
        self,
        current_hook_score: float,
        content_type: str
    ) -> List[OptimizationTip]:
        """Get Pinterest-specific hook recommendations."""

        return [
            OptimizationTip(
                category="hook",
                tip="Lead with the end result",
                impact="high",
                implementation="Pinterest users are seeking inspiration. Show the aspirational outcome first.",
                example="Beautiful finished room, completed recipe, final outfit look"
            ),
            OptimizationTip(
                category="hook",
                tip="Use text overlay with benefit",
                impact="high",
                implementation="Text on the image stating the value proposition increases saves.",
                example="'10 Easy Dinner Ideas Under 30 Minutes' on a food image"
            ),
            OptimizationTip(
                category="hook",
                tip="Clean, uncluttered visuals",
                impact="high",
                implementation="Pinterest favors minimal, aesthetic imagery. Reduce visual noise.",
                example="Single subject, clean background, good lighting"
            ),
            OptimizationTip(
                category="hook",
                tip="Lifestyle context sells",
                impact="medium",
                implementation="Show products/ideas in aspirational lifestyle context.",
                example="Furniture in a styled room, clothes on a person in a nice setting"
            )
        ]

    def get_hashtag_strategy(
        self,
        current_hashtags: List[str],
        content_category: Optional[str]
    ) -> Dict[str, Any]:
        """Get Pinterest-specific hashtag strategy."""

        return {
            "optimal_count": "2-5 hashtags",
            "placement": "At the end of your description",
            "strategy": "Use searchable, descriptive hashtags",
            "seo_focus": "Keywords in description matter more than hashtags",
            "tips": [
                "Use hashtags as supplementary keywords",
                "Focus on descriptive, searchable terms",
                "Check Pinterest Trends for popular search terms",
                "Hashtags should match user search intent"
            ],
            "description_priority": {
                "first_paragraph": "Include main keywords naturally",
                "call_to_action": "Tell users what to do (save, click, try)",
                "hashtags_last": "Add hashtags at the end"
            }
        }

    def get_optimal_posting_times(
        self,
        target_audience: Optional[Dict[str, Any]],
        content_type: str
    ) -> Dict[str, Any]:
        """Get Pinterest-specific optimal posting times."""

        return {
            "time_slots": {
                "evening_planning": {
                    "time": "8:00 PM - 11:00 PM",
                    "audience": "Users planning and dreaming"
                },
                "late_night": {
                    "time": "2:00 AM - 4:00 AM",
                    "audience": "Night owls, different time zones"
                },
                "weekend_browsing": {
                    "time": "Saturday & Sunday afternoons",
                    "audience": "Leisure browsing and planning"
                }
            },
            "frequency": {
                "recommendation": "5-15 pins per day",
                "spacing": "Space pins throughout the day",
                "fresh_content": "Mix new pins with repins"
            },
            "seasonal_planning": {
                "plan_ahead": "Pin seasonal content 45 days early",
                "why": "Pinterest users plan ahead - Christmas in October, etc.",
                "tip": "Use Pinterest Trends to identify upcoming trends"
            }
        }

    def get_format_recommendations(
        self,
        current_format: str,
        duration: Optional[float],
        aspect_ratio: Optional[str]
    ) -> List[OptimizationTip]:
        """Get Pinterest-specific format recommendations."""

        tips = []

        tips.append(OptimizationTip(
            category="format",
            tip="Use 2:3 vertical aspect ratio",
            impact="high",
            implementation="1000x1500 pixels is optimal. Vertical pins take up more feed space.",
            example="2:3 ratio (width:height) for standard pins"
        ))

        tips.append(OptimizationTip(
            category="format",
            tip="Create Idea Pins for tutorials",
            impact="high",
            implementation="Multi-page Idea Pins get higher engagement for step-by-step content.",
            example="5-20 pages showing a complete tutorial or list"
        ))

        tips.append(OptimizationTip(
            category="format",
            tip="Add text overlay to images",
            impact="high",
            implementation="Text on pins increases save rate. State the value clearly.",
            example="'Easy DIY: Transform Your Space for Under $50'"
        ))

        tips.append(OptimizationTip(
            category="format",
            tip="Video pins for engagement",
            impact="medium",
            implementation="Video pins auto-play and grab attention. Keep under 60 seconds.",
            example="Quick recipe videos, DIY tutorials, product demos"
        ))

        return tips

    def get_trending_sounds(self) -> List[TrendingElement]:
        """Get currently trending Pinterest elements."""

        return [
            TrendingElement(
                element_type="format",
                name="Idea Pins",
                trend_strength=0.9,
                relevance_score=0.85,
                usage_suggestion="Multi-page tutorials and lists get highest engagement."
            ),
            TrendingElement(
                element_type="seasonal",
                name="Plan-ahead content",
                trend_strength=0.85,
                relevance_score=0.9,
                usage_suggestion="Check Pinterest Trends and create content for upcoming seasons."
            ),
            TrendingElement(
                element_type="format",
                name="Infographics",
                trend_strength=0.8,
                relevance_score=0.8,
                usage_suggestion="Data visualizations and informational graphics get saved frequently."
            ),
            TrendingElement(
                element_type="style",
                name="Clean Aesthetic",
                trend_strength=0.85,
                relevance_score=0.85,
                usage_suggestion="Minimal, well-lit, aspirational imagery performs best."
            )
        ]

    def get_cta_recommendations(
        self,
        current_cta: Optional[str],
        content_type: str
    ) -> List[OptimizationTip]:
        """Get Pinterest-specific CTA recommendations."""

        return [
            OptimizationTip(
                category="cta",
                tip="Save CTA is native behavior",
                impact="high",
                implementation="'Save this for later' aligns with how Pinterest users behave.",
                example="End descriptions with 'Save this pin for when you need it'"
            ),
            OptimizationTip(
                category="cta",
                tip="Click for more CTA",
                impact="high",
                implementation="Pinterest drives website traffic. Use 'Click for full tutorial/recipe'.",
                example="'Click through for the complete guide with all the details'"
            ),
            OptimizationTip(
                category="cta",
                tip="Follow for more ideas",
                impact="medium",
                implementation="Follow CTAs build your Pinterest following over time.",
                example="'Follow this board for more [topic] inspiration'"
            ),
            OptimizationTip(
                category="cta",
                tip="Shop now for products",
                impact="high",
                implementation="Pinterest is high-intent for shopping. Use shopping features.",
                example="Enable Product Pins, 'Shop this look' CTAs"
            )
        ]

    def get_algorithm_tips(self) -> List[OptimizationTip]:
        """Get tips for optimizing for Pinterest's algorithm."""

        return [
            OptimizationTip(
                category="algorithm",
                tip="SEO matters more than other platforms",
                impact="high",
                implementation="Pinterest is a search engine. Use keywords in pin titles, descriptions, and boards.",
                example="Think about what users would search for to find your content"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Fresh pins are prioritized",
                impact="high",
                implementation="The algorithm favors new pins over repins. Create new images regularly.",
                example="Create multiple pin designs for the same content"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Consistent pinning beats bursts",
                impact="high",
                implementation="Pin 5-15 times daily consistently rather than 50 pins once a week.",
                example="Use scheduling tools to spread pins throughout the day"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Board organization matters",
                impact="medium",
                implementation="Organize pins into relevant, well-named boards. The algorithm uses board context.",
                example="Create specific boards rather than dumping pins in one general board"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Claim your website",
                impact="high",
                implementation="Claimed websites get priority. Enable Rich Pins for your domain.",
                example="Verify your website and enable Rich Pins for automatic metadata"
            ),
            OptimizationTip(
                category="algorithm",
                tip="Think long-term",
                impact="medium",
                implementation="Pinterest content lives for months/years. Create evergreen content.",
                example="How-to guides, timeless tips, seasonal content (for next year too)"
            )
        ]
