import logging
from typing import List, Dict, Any
import json
import os

from ..config import settings
from ..models import TemplateInfo, VideoTemplate, AspectRatio

logger = logging.getLogger(__name__)


class TemplateService:
    """Service for managing video templates."""

    def __init__(self):
        self.templates_dir = settings.templates_dir
        self._templates = self._load_templates()

    def _load_templates(self) -> Dict[str, TemplateInfo]:
        """Load template configurations."""
        # Default templates configuration
        templates = {
            VideoTemplate.UGC_REVIEW: TemplateInfo(
                id="ugc_review",
                name="UGC Review",
                description="Authentic user review format with product showcase",
                preview_url="https://example.com/previews/ugc_review.mp4",
                recommended_for=["product_reviews", "testimonials", "authentic_content"],
                supported_aspect_ratios=[AspectRatio.VERTICAL, AspectRatio.SQUARE],
                default_duration=30.0,
                features=[
                    "Natural speaking style",
                    "Product close-ups",
                    "Before/after comparisons",
                    "Casual setting",
                    "Authentic testimonials"
                ]
            ),
            VideoTemplate.PRODUCT_SHOWCASE: TemplateInfo(
                id="product_showcase",
                name="Product Showcase",
                description="Professional product demonstration with features highlights",
                preview_url="https://example.com/previews/product_showcase.mp4",
                recommended_for=["product_launches", "feature_highlights", "ecommerce"],
                supported_aspect_ratios=[AspectRatio.VERTICAL, AspectRatio.SQUARE, AspectRatio.HORIZONTAL],
                default_duration=45.0,
                features=[
                    "Multiple product angles",
                    "Feature callouts",
                    "Professional lighting",
                    "Smooth transitions",
                    "Music sync"
                ]
            ),
            VideoTemplate.UNBOXING: TemplateInfo(
                id="unboxing",
                name="Unboxing Experience",
                description="Exciting unboxing journey from packaging to reveal",
                preview_url="https://example.com/previews/unboxing.mp4",
                recommended_for=["new_products", "premium_items", "excitement_building"],
                supported_aspect_ratios=[AspectRatio.VERTICAL, AspectRatio.SQUARE],
                default_duration=60.0,
                features=[
                    "Anticipation building",
                    "Packaging details",
                    "First impressions",
                    "Excitement reactions",
                    "Product reveal"
                ]
            ),
            VideoTemplate.TUTORIAL: TemplateInfo(
                id="tutorial",
                name="Tutorial/How-To",
                description="Step-by-step guide showing product usage",
                preview_url="https://example.com/previews/tutorial.mp4",
                recommended_for=["education", "how_to", "product_guides"],
                supported_aspect_ratios=[AspectRatio.VERTICAL, AspectRatio.HORIZONTAL],
                default_duration=90.0,
                features=[
                    "Step-by-step instructions",
                    "Clear demonstrations",
                    "Tips and tricks",
                    "Result showcase",
                    "Educational captions"
                ]
            ),
            VideoTemplate.LIFESTYLE: TemplateInfo(
                id="lifestyle",
                name="Lifestyle Integration",
                description="Product shown in everyday life scenarios",
                preview_url="https://example.com/previews/lifestyle.mp4",
                recommended_for=["lifestyle_brands", "everyday_use", "aspirational"],
                supported_aspect_ratios=[AspectRatio.VERTICAL, AspectRatio.SQUARE, AspectRatio.HORIZONTAL],
                default_duration=30.0,
                features=[
                    "Real-life scenarios",
                    "Lifestyle aesthetics",
                    "Natural integration",
                    "Aspirational content",
                    "Story-driven"
                ]
            ),
            VideoTemplate.TESTIMONIAL: TemplateInfo(
                id="testimonial",
                name="Testimonial",
                description="Customer success story and satisfaction",
                preview_url="https://example.com/previews/testimonial.mp4",
                recommended_for=["social_proof", "trust_building", "conversions"],
                supported_aspect_ratios=[AspectRatio.VERTICAL, AspectRatio.SQUARE],
                default_duration=45.0,
                features=[
                    "Personal stories",
                    "Problem-solution format",
                    "Emotional connection",
                    "Results showcase",
                    "Credibility building"
                ]
            )
        }

        return templates

    def list_templates(self) -> List[TemplateInfo]:
        """Get list of all available templates."""
        return list(self._templates.values())

    def get_template(self, template_id: str) -> TemplateInfo:
        """Get specific template by ID."""
        for template in self._templates.values():
            if template.id == template_id:
                return template
        raise ValueError(f"Template {template_id} not found")

    def apply_template(self, template_id: str, video_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Apply template-specific configurations to video generation.

        Args:
            template_id: Template identifier
            video_config: Base video configuration

        Returns:
            Updated video configuration with template settings
        """
        template = self.get_template(template_id)

        # Apply template-specific settings
        config = video_config.copy()

        # Template-specific durations
        if template_id == "ugc_review":
            config.update({
                "transition_style": "quick_cut",
                "pacing": "natural",
                "music_genre": "upbeat",
                "caption_keywords_highlight": True
            })
        elif template_id == "product_showcase":
            config.update({
                "transition_style": "smooth_zoom",
                "pacing": "medium",
                "music_genre": "corporate",
                "show_feature_callouts": True
            })
        elif template_id == "unboxing":
            config.update({
                "transition_style": "reveal",
                "pacing": "slow_build",
                "music_genre": "exciting",
                "anticipation_effects": True
            })
        elif template_id == "tutorial":
            config.update({
                "transition_style": "step_marker",
                "pacing": "instructional",
                "music_genre": "background",
                "show_step_numbers": True
            })
        elif template_id == "lifestyle":
            config.update({
                "transition_style": "cinematic",
                "pacing": "slow",
                "music_genre": "ambient",
                "aesthetic_filters": True
            })
        elif template_id == "testimonial":
            config.update({
                "transition_style": "fade",
                "pacing": "emotional",
                "music_genre": "inspirational",
                "show_quotes": True
            })

        return config

    def get_recommended_templates(self, use_case: str) -> List[TemplateInfo]:
        """
        Get templates recommended for a specific use case.

        Args:
            use_case: The use case (e.g., "product_reviews", "ecommerce")

        Returns:
            List of recommended templates
        """
        recommended = []
        for template in self._templates.values():
            if use_case in template.recommended_for:
                recommended.append(template)
        return recommended

    def validate_template_config(self, template_id: str, config: Dict[str, Any]) -> bool:
        """
        Validate that configuration is compatible with template.

        Args:
            template_id: Template identifier
            config: Video configuration to validate

        Returns:
            True if valid, False otherwise
        """
        try:
            template = self.get_template(template_id)

            # Check aspect ratio compatibility
            if "aspect_ratio" in config:
                if config["aspect_ratio"] not in template.supported_aspect_ratios:
                    logger.warning(
                        f"Aspect ratio {config['aspect_ratio']} not recommended for template {template_id}"
                    )
                    return False

            return True

        except ValueError:
            return False
