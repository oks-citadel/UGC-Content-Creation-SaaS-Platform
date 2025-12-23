"""
Audience Fit Scorer Model.

Calculates brand-audience and creator-brand fit scores based on
demographic alignment, interest overlap, and content compatibility.
"""

import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import numpy as np
from datetime import datetime
import joblib
import os

from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)


@dataclass
class AudienceFitResult:
    """Audience fit scoring result."""
    overall_fit_score: float  # 0-100
    demographic_match: float  # 0-1
    interest_overlap: float  # 0-1
    content_compatibility: float  # 0-1
    brand_safety_score: float  # 0-1
    authenticity_score: float  # 0-1
    breakdown: Dict[str, float]
    fit_factors: List[str]
    risk_factors: List[str]
    recommendation: str


@dataclass
class BrandProfile:
    """Brand profile for fit calculation."""
    brand_id: str
    industry: str
    target_age_range: tuple  # (min, max)
    target_gender: List[str]  # ["male", "female", "other"]
    target_interests: List[str]
    brand_values: List[str]
    content_preferences: List[str]
    competitor_brands: List[str]
    safety_requirements: Dict[str, Any]


@dataclass
class CreatorProfile:
    """Creator profile for fit calculation."""
    creator_id: str
    audience_age_distribution: Dict[str, float]  # {"18-24": 0.3, "25-34": 0.4, ...}
    audience_gender: Dict[str, float]  # {"male": 0.6, "female": 0.4}
    content_categories: List[str]
    engagement_rate: float
    follower_count: int
    authenticity_indicators: Dict[str, float]
    past_brand_collaborations: List[str]
    content_style: List[str]


class AudienceFitScorer:
    """
    Calculates brand-audience and creator-brand fit scores.

    Uses multiple signals including demographic alignment, interest
    overlap, content compatibility, and brand safety.
    """

    # Industry interest mappings
    INDUSTRY_INTERESTS = {
        "fashion": ["fashion", "style", "clothing", "beauty", "lifestyle"],
        "beauty": ["beauty", "skincare", "makeup", "selfcare", "wellness"],
        "technology": ["tech", "gadgets", "gaming", "innovation", "software"],
        "fitness": ["fitness", "health", "workout", "sports", "nutrition"],
        "food": ["food", "cooking", "recipes", "restaurants", "nutrition"],
        "travel": ["travel", "adventure", "destinations", "lifestyle", "culture"],
        "finance": ["finance", "investing", "money", "business", "entrepreneurship"],
        "entertainment": ["entertainment", "music", "movies", "gaming", "pop culture"],
    }

    # Content style compatibility matrix
    STYLE_COMPATIBILITY = {
        "professional": {"professional": 1.0, "casual": 0.7, "edgy": 0.4, "humorous": 0.6},
        "casual": {"professional": 0.7, "casual": 1.0, "edgy": 0.6, "humorous": 0.9},
        "edgy": {"professional": 0.4, "casual": 0.6, "edgy": 1.0, "humorous": 0.7},
        "humorous": {"professional": 0.6, "casual": 0.9, "edgy": 0.7, "humorous": 1.0},
    }

    def __init__(self, models_dir: str = "./models"):
        self.models_dir = models_dir
        self.scaler = StandardScaler()
        self._load_embeddings()

    def _load_embeddings(self) -> None:
        """Load pre-computed embeddings for interest matching."""
        try:
            embeddings_path = os.path.join(self.models_dir, "audience", "interest_embeddings.joblib")
            if os.path.exists(embeddings_path):
                self.interest_embeddings = joblib.load(embeddings_path)
            else:
                self.interest_embeddings = {}
        except Exception as e:
            logger.warning(f"Failed to load interest embeddings: {e}")
            self.interest_embeddings = {}

    def calculate_fit(
        self,
        brand: BrandProfile,
        creator: CreatorProfile,
    ) -> AudienceFitResult:
        """
        Calculate overall fit score between brand and creator.

        Args:
            brand: Brand profile with target audience
            creator: Creator profile with audience data

        Returns:
            AudienceFitResult with detailed scoring
        """
        # Calculate individual scores
        demographic_match = self._calculate_demographic_match(brand, creator)
        interest_overlap = self._calculate_interest_overlap(brand, creator)
        content_compatibility = self._calculate_content_compatibility(brand, creator)
        brand_safety = self._calculate_brand_safety(brand, creator)
        authenticity = self._calculate_authenticity_score(creator)

        # Calculate weighted overall score
        weights = {
            "demographic": 0.25,
            "interest": 0.25,
            "content": 0.20,
            "safety": 0.15,
            "authenticity": 0.15,
        }

        overall_score = (
            demographic_match * weights["demographic"] +
            interest_overlap * weights["interest"] +
            content_compatibility * weights["content"] +
            brand_safety * weights["safety"] +
            authenticity * weights["authenticity"]
        ) * 100

        # Identify fit factors and risk factors
        fit_factors = self._identify_fit_factors(
            demographic_match, interest_overlap, content_compatibility, authenticity
        )
        risk_factors = self._identify_risk_factors(
            brand_safety, demographic_match, creator
        )

        # Generate recommendation
        recommendation = self._generate_recommendation(
            overall_score, fit_factors, risk_factors
        )

        return AudienceFitResult(
            overall_fit_score=overall_score,
            demographic_match=demographic_match,
            interest_overlap=interest_overlap,
            content_compatibility=content_compatibility,
            brand_safety_score=brand_safety,
            authenticity_score=authenticity,
            breakdown={
                "demographic_contribution": demographic_match * 25,
                "interest_contribution": interest_overlap * 25,
                "content_contribution": content_compatibility * 20,
                "safety_contribution": brand_safety * 15,
                "authenticity_contribution": authenticity * 15,
            },
            fit_factors=fit_factors,
            risk_factors=risk_factors,
            recommendation=recommendation,
        )

    def _calculate_demographic_match(
        self,
        brand: BrandProfile,
        creator: CreatorProfile,
    ) -> float:
        """Calculate demographic alignment score."""
        # Age match
        age_score = self._calculate_age_match(
            brand.target_age_range,
            creator.audience_age_distribution
        )

        # Gender match
        gender_score = self._calculate_gender_match(
            brand.target_gender,
            creator.audience_gender
        )

        return (age_score * 0.5 + gender_score * 0.5)

    def _calculate_age_match(
        self,
        target_range: tuple,
        audience_distribution: Dict[str, float],
    ) -> float:
        """Calculate age range match score."""
        target_min, target_max = target_range

        # Map age brackets to match target range
        matching_percentage = 0.0
        age_brackets = {
            "13-17": (13, 17),
            "18-24": (18, 24),
            "25-34": (25, 34),
            "35-44": (35, 44),
            "45-54": (45, 54),
            "55+": (55, 100),
        }

        for bracket, (bracket_min, bracket_max) in age_brackets.items():
            if bracket in audience_distribution:
                # Check overlap with target range
                overlap_min = max(target_min, bracket_min)
                overlap_max = min(target_max, bracket_max)

                if overlap_min <= overlap_max:
                    # Calculate overlap percentage
                    bracket_size = bracket_max - bracket_min
                    overlap_size = overlap_max - overlap_min
                    overlap_ratio = overlap_size / max(bracket_size, 1)
                    matching_percentage += audience_distribution[bracket] * overlap_ratio

        return min(matching_percentage, 1.0)

    def _calculate_gender_match(
        self,
        target_genders: List[str],
        audience_gender: Dict[str, float],
    ) -> float:
        """Calculate gender match score."""
        if not target_genders or "all" in target_genders:
            return 1.0

        matching_percentage = sum(
            audience_gender.get(gender.lower(), 0)
            for gender in target_genders
        )

        return min(matching_percentage, 1.0)

    def _calculate_interest_overlap(
        self,
        brand: BrandProfile,
        creator: CreatorProfile,
    ) -> float:
        """Calculate interest overlap score."""
        # Get industry-related interests
        industry_interests = self.INDUSTRY_INTERESTS.get(
            brand.industry.lower(),
            brand.target_interests
        )

        all_brand_interests = set(brand.target_interests + industry_interests)
        creator_categories = set(cat.lower() for cat in creator.content_categories)

        # Calculate Jaccard similarity
        if not all_brand_interests:
            return 0.5

        intersection = len(all_brand_interests.intersection(creator_categories))
        union = len(all_brand_interests.union(creator_categories))

        if union == 0:
            return 0.5

        jaccard = intersection / union

        # Boost if creator has strong presence in brand's industry
        if brand.industry.lower() in creator_categories:
            jaccard = min(jaccard * 1.3, 1.0)

        return jaccard

    def _calculate_content_compatibility(
        self,
        brand: BrandProfile,
        creator: CreatorProfile,
    ) -> float:
        """Calculate content style compatibility."""
        if not brand.content_preferences or not creator.content_style:
            return 0.7  # Default moderate compatibility

        total_score = 0.0
        comparisons = 0

        for brand_style in brand.content_preferences:
            brand_style_lower = brand_style.lower()
            if brand_style_lower in self.STYLE_COMPATIBILITY:
                for creator_style in creator.content_style:
                    creator_style_lower = creator_style.lower()
                    if creator_style_lower in self.STYLE_COMPATIBILITY.get(brand_style_lower, {}):
                        total_score += self.STYLE_COMPATIBILITY[brand_style_lower][creator_style_lower]
                        comparisons += 1

        if comparisons == 0:
            return 0.6

        return total_score / comparisons

    def _calculate_brand_safety(
        self,
        brand: BrandProfile,
        creator: CreatorProfile,
    ) -> float:
        """Calculate brand safety score."""
        safety_score = 1.0

        # Check for competitor collaborations
        if brand.competitor_brands:
            for competitor in brand.competitor_brands:
                if competitor.lower() in [c.lower() for c in creator.past_brand_collaborations]:
                    safety_score -= 0.1

        # Check content categories for risky topics
        risky_categories = ["controversial", "political", "adult", "gambling"]
        for category in creator.content_categories:
            if category.lower() in risky_categories:
                safety_score -= 0.15

        # Check safety requirements
        if brand.safety_requirements:
            min_followers = brand.safety_requirements.get("min_followers", 0)
            min_engagement = brand.safety_requirements.get("min_engagement", 0)

            if creator.follower_count < min_followers:
                safety_score -= 0.1
            if creator.engagement_rate < min_engagement:
                safety_score -= 0.1

        return max(safety_score, 0.0)

    def _calculate_authenticity_score(self, creator: CreatorProfile) -> float:
        """Calculate creator authenticity score."""
        if not creator.authenticity_indicators:
            return 0.7  # Default moderate score

        indicators = creator.authenticity_indicators

        # Weight different authenticity signals
        score = 0.0
        weights_sum = 0.0

        if "follower_quality" in indicators:
            score += indicators["follower_quality"] * 0.3
            weights_sum += 0.3

        if "engagement_authenticity" in indicators:
            score += indicators["engagement_authenticity"] * 0.3
            weights_sum += 0.3

        if "content_consistency" in indicators:
            score += indicators["content_consistency"] * 0.2
            weights_sum += 0.2

        if "audience_growth_organic" in indicators:
            score += indicators["audience_growth_organic"] * 0.2
            weights_sum += 0.2

        if weights_sum > 0:
            return score / weights_sum

        return 0.7

    def _identify_fit_factors(
        self,
        demographic: float,
        interest: float,
        content: float,
        authenticity: float,
    ) -> List[str]:
        """Identify positive fit factors."""
        factors = []

        if demographic > 0.7:
            factors.append("Strong demographic alignment with target audience")
        if interest > 0.6:
            factors.append("High interest overlap in relevant categories")
        if content > 0.7:
            factors.append("Content style matches brand preferences")
        if authenticity > 0.8:
            factors.append("High authenticity indicators")

        return factors[:3]

    def _identify_risk_factors(
        self,
        safety: float,
        demographic: float,
        creator: CreatorProfile,
    ) -> List[str]:
        """Identify potential risk factors."""
        risks = []

        if safety < 0.7:
            risks.append("Potential brand safety concerns detected")
        if demographic < 0.5:
            risks.append("Audience demographics may not align well")
        if creator.engagement_rate < 0.02:
            risks.append("Below-average engagement rate")

        return risks[:3]

    def _generate_recommendation(
        self,
        overall_score: float,
        fit_factors: List[str],
        risk_factors: List[str],
    ) -> str:
        """Generate partnership recommendation."""
        if overall_score >= 80:
            return "Strongly recommended for partnership. Excellent brand-creator alignment."
        elif overall_score >= 65:
            return "Recommended for partnership. Good fit with minor considerations."
        elif overall_score >= 50:
            return "Moderate fit. Consider for specific campaigns with audience alignment."
        elif overall_score >= 35:
            return "Limited fit. May work for niche campaigns but review risk factors."
        else:
            return "Not recommended. Significant misalignment or risk factors present."

    def batch_score(
        self,
        brand: BrandProfile,
        creators: List[CreatorProfile],
    ) -> List[AudienceFitResult]:
        """Score multiple creators for a brand."""
        return [self.calculate_fit(brand, creator) for creator in creators]

    def find_best_matches(
        self,
        brand: BrandProfile,
        creators: List[CreatorProfile],
        top_n: int = 10,
    ) -> List[tuple]:
        """Find best matching creators for a brand."""
        scores = self.batch_score(brand, creators)
        scored_creators = list(zip(creators, scores))
        scored_creators.sort(key=lambda x: x[1].overall_fit_score, reverse=True)
        return scored_creators[:top_n]
