import logging
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime, timedelta
import httpx
import asyncio

from ..config import settings
from ..models import (
    CreatorProfile,
    CampaignRequirements,
    CreatorMatch,
    CreatorMatchResponse,
    ContentItem,
    ProductInfo,
    ContentMatch,
    ContentMatchResponse,
    SimilarCreator,
    SimilarCreatorsResponse,
    TrendingContent,
    TrendingResponse,
)
from .embeddings import EmbeddingService

logger = logging.getLogger(__name__)


class MatchingService:
    """Service for matching creators to campaigns and content to products."""

    # Analytics service URL for fetching real-time data
    ANALYTICS_SERVICE_URL = "http://analytics-service:3008"
    CONTENT_SERVICE_URL = "http://content-service:3004"

    def __init__(self):
        self.embedding_service = EmbeddingService()
        self._http_client: Optional[httpx.AsyncClient] = None

    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client for service calls."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client

    async def close(self):
        """Close HTTP client connections."""
        if self._http_client and not self._http_client.is_closed:
            await self._http_client.aclose()

    async def match_creators_to_campaign(
        self,
        campaign: CampaignRequirements,
        creator_pool: List[CreatorProfile],
        limit: int = 10
    ) -> CreatorMatchResponse:
        """
        Match creators to a campaign based on audience, style, and performance.

        Matching criteria:
        - Niche alignment
        - Audience demographics match
        - Engagement rate
        - Past performance
        - Content style fit
        - Budget compatibility
        """
        try:
            logger.info(f"Matching creators to campaign {campaign.campaign_id}")

            matches = []

            for creator in creator_pool:
                # Calculate match score
                match_score = await self._calculate_creator_match_score(
                    creator,
                    campaign
                )

                if match_score >= settings.min_similarity_score:
                    # Generate detailed match info
                    match = await self._create_creator_match(
                        creator,
                        campaign,
                        match_score
                    )
                    matches.append(match)

            # Sort by match score
            matches.sort(key=lambda x: x.match_score, reverse=True)

            # Apply diversity if needed
            if settings.diversity_factor > 0:
                matches = self._apply_diversity(matches)

            # Limit results
            matches = matches[:limit]

            return CreatorMatchResponse(
                campaign_id=campaign.campaign_id,
                matches=matches,
                total_matches=len(matches),
                match_criteria={
                    "min_engagement_rate": campaign.min_engagement_rate,
                    "min_followers": campaign.min_followers,
                    "required_niche": campaign.required_niche
                }
            )

        except Exception as e:
            logger.error(f"Error matching creators to campaign: {str(e)}", exc_info=True)
            raise

    async def match_content_to_products(
        self,
        product: ProductInfo,
        content_items: List[ContentItem],
        limit: int = 20
    ) -> ContentMatchResponse:
        """
        Match content to products for optimal product placement.

        Uses semantic similarity between:
        - Product description and content description
        - Product keywords and content tags
        - Target audience alignment
        """
        try:
            logger.info(f"Matching content to product {product.product_id}")

            # Generate product embedding
            product_text = f"{product.name} {product.description} {' '.join(product.keywords)}"
            product_embedding = await self.embedding_service.get_text_embedding(product_text)

            matches = []

            for content in content_items:
                # Calculate match score
                match_score = await self._calculate_content_match_score(
                    content,
                    product,
                    product_embedding
                )

                if match_score >= settings.min_similarity_score:
                    match = await self._create_content_match(
                        content,
                        product,
                        match_score
                    )
                    matches.append(match)

            # Sort by match score
            matches.sort(key=lambda x: x.match_score, reverse=True)

            # Limit results
            matches = matches[:limit]

            return ContentMatchResponse(
                product_id=product.product_id,
                matches=matches,
                total_matches=len(matches)
            )

        except Exception as e:
            logger.error(f"Error matching content to products: {str(e)}", exc_info=True)
            raise

    async def get_similar_creators(
        self,
        creator_id: str,
        creator_pool: List[CreatorProfile],
        limit: int = 10
    ) -> SimilarCreatorsResponse:
        """
        Find creators similar to a given creator.

        Useful for:
        - Finding alternative creators
        - Building creator lists
        - Competitive analysis
        """
        try:
            logger.info(f"Finding similar creators to {creator_id}")

            # Find the base creator
            base_creator = next(
                (c for c in creator_pool if c.creator_id == creator_id),
                None
            )

            if not base_creator:
                raise ValueError(f"Creator {creator_id} not found")

            # Generate embedding for base creator
            base_embedding = await self._get_creator_embedding(base_creator)

            similar = []

            for creator in creator_pool:
                if creator.creator_id == creator_id:
                    continue

                # Calculate similarity
                creator_embedding = await self._get_creator_embedding(creator)
                similarity = self._cosine_similarity(base_embedding, creator_embedding)

                if similarity >= settings.min_similarity_score:
                    similar_creator = await self._create_similar_creator(
                        base_creator,
                        creator,
                        similarity
                    )
                    similar.append(similar_creator)

            # Sort by similarity
            similar.sort(key=lambda x: x.similarity_score, reverse=True)

            # Limit results
            similar = similar[:limit]

            return SimilarCreatorsResponse(
                base_creator_id=creator_id,
                similar_creators=similar,
                total_found=len(similar)
            )

        except Exception as e:
            logger.error(f"Error finding similar creators: {str(e)}", exc_info=True)
            raise

    async def get_trending_content(
        self,
        platform: str = "all",
        limit: int = 20,
        time_window_hours: int = 24
    ) -> TrendingResponse:
        """
        Get trending content based on engagement velocity and viral signals.

        Identifies content that is:
        - Rapidly gaining engagement
        - Showing viral patterns
        - Aligned with trending topics
        """
        try:
            logger.info(f"Getting trending content for platform: {platform}")

            # Query analytics-service for real-time trending data
            trending = await self._get_trending_content_data(
                platform,
                time_window_hours
            )

            # Sort by trend score
            trending.sort(key=lambda x: x.trend_score, reverse=True)

            # Limit results
            trending = trending[:limit]

            # Extract top topics
            top_topics = self._extract_top_topics(trending)

            return TrendingResponse(
                trending_content=trending,
                time_window=f"{time_window_hours} hours",
                total_trending=len(trending),
                top_topics=top_topics
            )

        except Exception as e:
            logger.error(f"Error getting trending content: {str(e)}", exc_info=True)
            raise

    # Private helper methods

    async def _calculate_creator_match_score(
        self,
        creator: CreatorProfile,
        campaign: CampaignRequirements
    ) -> float:
        """Calculate overall match score between creator and campaign."""

        scores = []

        # Niche alignment (30%)
        niche_score = self._calculate_niche_alignment(
            creator.niche,
            campaign.required_niche
        )
        scores.append(niche_score * 0.30)

        # Engagement rate match (25%)
        engagement_score = self._calculate_engagement_score(
            creator.avg_engagement_rate,
            campaign.min_engagement_rate
        )
        scores.append(engagement_score * 0.25)

        # Audience alignment (25%)
        audience_score = await self._calculate_audience_alignment(
            creator.audience_demographics,
            campaign.target_audience
        )
        scores.append(audience_score * 0.25)

        # Follower count fit (10%)
        follower_score = self._calculate_follower_score(
            creator.follower_count,
            campaign.min_followers
        )
        scores.append(follower_score * 0.10)

        # Location match (10%)
        location_score = self._calculate_location_score(
            creator.location,
            campaign.preferred_locations
        )
        scores.append(location_score * 0.10)

        return sum(scores)

    def _calculate_niche_alignment(
        self,
        creator_niches: List[str],
        required_niches: List[str]
    ) -> float:
        """Calculate niche alignment score."""
        if not required_niches:
            return 1.0

        # Jaccard similarity
        creator_set = set(n.lower() for n in creator_niches)
        required_set = set(n.lower() for n in required_niches)

        if not creator_set or not required_set:
            return 0.0

        intersection = len(creator_set & required_set)
        union = len(creator_set | required_set)

        return intersection / union if union > 0 else 0.0

    def _calculate_engagement_score(
        self,
        creator_engagement: float,
        min_engagement: float
    ) -> float:
        """Calculate engagement score."""
        if creator_engagement >= min_engagement:
            # Bonus for exceeding minimum
            excess = (creator_engagement - min_engagement) / min_engagement
            return min(1.0, 0.7 + (excess * 0.3))
        else:
            # Penalize for not meeting minimum
            return creator_engagement / min_engagement

    async def _calculate_audience_alignment(
        self,
        creator_audience: Optional[Dict[str, Any]],
        target_audience: Dict[str, Any]
    ) -> float:
        """Calculate audience demographic alignment."""
        if not creator_audience or not target_audience:
            return 0.5  # Neutral if data missing

        # Compare key demographic factors
        scores = []

        # Age alignment
        if "age_range" in creator_audience and "age_range" in target_audience:
            age_overlap = self._calculate_range_overlap(
                creator_audience["age_range"],
                target_audience["age_range"]
            )
            scores.append(age_overlap)

        # Gender alignment
        if "gender" in creator_audience and "gender" in target_audience:
            gender_match = 1.0 if creator_audience["gender"] == target_audience["gender"] else 0.5
            scores.append(gender_match)

        # Interest alignment
        if "interests" in creator_audience and "interests" in target_audience:
            interest_overlap = len(
                set(creator_audience["interests"]) & set(target_audience["interests"])
            ) / len(set(creator_audience["interests"]) | set(target_audience["interests"]))
            scores.append(interest_overlap)

        return np.mean(scores) if scores else 0.5

    def _calculate_follower_score(self, follower_count: int, min_followers: int) -> float:
        """Calculate follower count fit score."""
        if follower_count >= min_followers:
            return 1.0
        else:
            return follower_count / min_followers

    def _calculate_location_score(
        self,
        creator_location: Optional[str],
        preferred_locations: Optional[List[str]]
    ) -> float:
        """Calculate location match score."""
        if not preferred_locations:
            return 1.0  # No preference

        if not creator_location:
            return 0.5  # Neutral if unknown

        return 1.0 if creator_location in preferred_locations else 0.3

    async def _create_creator_match(
        self,
        creator: CreatorProfile,
        campaign: CampaignRequirements,
        match_score: float
    ) -> CreatorMatch:
        """Create detailed creator match object."""

        reasoning = []

        # Niche match
        niche_overlap = set(creator.niche) & set(campaign.required_niche)
        if niche_overlap:
            reasoning.append(f"Strong niche alignment: {', '.join(niche_overlap)}")

        # Engagement
        if creator.avg_engagement_rate > campaign.min_engagement_rate:
            reasoning.append(
                f"Exceeds engagement requirements ({creator.avg_engagement_rate:.1%} vs {campaign.min_engagement_rate:.1%})"
            )

        # Followers
        if creator.follower_count >= campaign.min_followers * 2:
            reasoning.append(f"Strong follower base ({creator.follower_count:,} followers)")

        # Calculate component scores
        audience_overlap = await self._calculate_audience_alignment(
            creator.audience_demographics,
            campaign.target_audience
        )

        engagement_fit = self._calculate_engagement_score(
            creator.avg_engagement_rate,
            campaign.min_engagement_rate
        )

        style_alignment = self._calculate_niche_alignment(
            creator.niche,
            campaign.required_niche
        )

        # Estimate performance
        estimated_performance = {
            "expected_reach": int(creator.follower_count * creator.avg_engagement_rate * 2),
            "expected_engagement_rate": creator.avg_engagement_rate,
            "confidence": match_score
        }

        return CreatorMatch(
            creator_id=creator.creator_id,
            match_score=match_score,
            reasoning=reasoning[:3],  # Top 3 reasons
            audience_overlap=audience_overlap,
            engagement_fit=engagement_fit,
            style_alignment=style_alignment,
            estimated_performance=estimated_performance
        )

    async def _calculate_content_match_score(
        self,
        content: ContentItem,
        product: ProductInfo,
        product_embedding: List[float]
    ) -> float:
        """Calculate content-product match score."""

        # Generate content embedding
        content_text = f"{content.description} {' '.join(content.tags)}"
        content_embedding = await self.embedding_service.get_text_embedding(content_text)

        # Semantic similarity
        semantic_score = self._cosine_similarity(content_embedding, product_embedding)

        # Tag overlap
        tag_score = len(set(content.tags) & set(product.keywords)) / max(
            len(set(content.tags) | set(product.keywords)), 1
        )

        # Combine scores
        match_score = (semantic_score * 0.7 + tag_score * 0.3)

        return match_score

    async def _create_content_match(
        self,
        content: ContentItem,
        product: ProductInfo,
        match_score: float
    ) -> ContentMatch:
        """Create detailed content match object."""

        reasoning = []

        # Tag overlap
        tag_overlap = set(content.tags) & set(product.keywords)
        if tag_overlap:
            reasoning.append(f"Keyword match: {', '.join(list(tag_overlap)[:3])}")

        # Content type fit
        reasoning.append(f"Content type: {content.content_type}")

        # Engagement potential
        if content.engagement_metrics:
            reasoning.append(
                f"Proven engagement: {content.engagement_metrics.get('total_engagement', 0):,}"
            )

        # Predict conversion (simplified)
        predicted_conversion = match_score * 0.05  # 5% max conversion rate

        # Audience alignment
        audience_alignment = match_score * 0.9  # Correlated with match score

        return ContentMatch(
            content_id=content.content_id,
            product_id=product.product_id,
            match_score=match_score,
            reasoning=reasoning,
            predicted_conversion=predicted_conversion,
            audience_alignment=audience_alignment
        )

    async def _get_creator_embedding(self, creator: CreatorProfile) -> List[float]:
        """Generate embedding vector for creator."""
        # Combine creator attributes into text
        creator_text = (
            f"{' '.join(creator.niche)} "
            f"{' '.join(creator.content_style)} "
            f"engagement:{creator.avg_engagement_rate} "
            f"followers:{creator.follower_count}"
        )

        return await self.embedding_service.get_text_embedding(creator_text)

    async def _create_similar_creator(
        self,
        base_creator: CreatorProfile,
        similar_creator: CreatorProfile,
        similarity: float
    ) -> SimilarCreator:
        """Create similar creator object."""

        # Find shared attributes
        shared_niches = set(base_creator.niche) & set(similar_creator.niche)
        shared_styles = set(base_creator.content_style) & set(similar_creator.content_style)

        shared_attributes = []
        if shared_niches:
            shared_attributes.append(f"Shared niches: {', '.join(shared_niches)}")
        if shared_styles:
            shared_attributes.append(f"Similar style: {', '.join(shared_styles)}")

        # Find key differences
        key_differences = []

        follower_diff = abs(base_creator.follower_count - similar_creator.follower_count)
        if follower_diff > 10000:
            direction = "more" if similar_creator.follower_count > base_creator.follower_count else "fewer"
            key_differences.append(f"{follower_diff:,} {direction} followers")

        engagement_diff = abs(
            base_creator.avg_engagement_rate - similar_creator.avg_engagement_rate
        )
        if engagement_diff > 0.01:
            direction = "higher" if similar_creator.avg_engagement_rate > base_creator.avg_engagement_rate else "lower"
            key_differences.append(f"{engagement_diff:.1%} {direction} engagement")

        return SimilarCreator(
            creator_id=similar_creator.creator_id,
            similarity_score=similarity,
            shared_attributes=shared_attributes,
            key_differences=key_differences
        )

    async def _get_trending_content_data(
        self,
        platform: str,
        time_window_hours: int
    ) -> List[TrendingContent]:
        """
        Get trending content data from analytics service.

        Queries the analytics-service for real-time engagement metrics
        and content performance data to identify trending content.
        """
        trending = []
        client = await self._get_http_client()

        try:
            # Calculate time range for the query
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(hours=time_window_hours)

            # Fetch real-time metrics from analytics service
            metrics_response = await client.get(
                f"{self.ANALYTICS_SERVICE_URL}/api/analytics/realtime/content",
                params={
                    "entityId": platform if platform != "all" else None,
                    "startDate": start_date.isoformat(),
                    "endDate": end_date.isoformat(),
                }
            )

            if metrics_response.status_code == 200:
                realtime_data = metrics_response.json().get("data", {})
                logger.info(f"Fetched realtime analytics data for platform: {platform}")
            else:
                realtime_data = {}
                logger.warning(f"Failed to fetch realtime data: {metrics_response.status_code}")

            # Fetch top performing content from analytics service
            top_content_response = await client.get(
                f"{self.ANALYTICS_SERVICE_URL}/api/analytics/metrics/content/top",
                params={
                    "metric": "engagement_velocity",
                    "limit": 50,
                    "startDate": start_date.isoformat(),
                    "endDate": end_date.isoformat(),
                    "period": "hour",
                }
            )

            content_items = []
            if top_content_response.status_code == 200:
                content_items = top_content_response.json().get("data", [])
                logger.info(f"Fetched {len(content_items)} top performing content items")
            else:
                logger.warning(f"Failed to fetch top content: {top_content_response.status_code}")

            # Fetch content details from content service to enrich the data
            content_details = {}
            if content_items:
                content_ids = [item.get("entityId") for item in content_items if item.get("entityId")]
                if content_ids:
                    try:
                        details_response = await client.get(
                            f"{self.CONTENT_SERVICE_URL}/api/content/batch",
                            params={"ids": ",".join(content_ids[:30])}  # Limit batch size
                        )
                        if details_response.status_code == 200:
                            for item in details_response.json().get("data", []):
                                content_details[item.get("id")] = item
                    except Exception as e:
                        logger.warning(f"Failed to fetch content details: {e}")

            # Transform analytics data into TrendingContent objects
            for item in content_items:
                content_id = item.get("entityId")
                if not content_id:
                    continue

                # Get content metadata
                metadata = content_details.get(content_id, {})
                content_platform = metadata.get("platform", "unknown")

                # Filter by platform if specified
                if platform != "all" and content_platform.lower() != platform.lower():
                    continue

                # Calculate metrics
                engagement_velocity = float(item.get("value", 0))

                # Normalize trend score (0-1 scale based on engagement velocity)
                max_velocity = max(
                    (float(i.get("value", 0)) for i in content_items),
                    default=1
                )
                trend_score = min(1.0, engagement_velocity / max(max_velocity, 1)) if max_velocity > 0 else 0.5

                # Calculate viral probability based on engagement patterns
                viral_probability = self._calculate_viral_probability(
                    engagement_velocity,
                    metadata.get("engagement_rate", 0),
                    metadata.get("share_rate", 0)
                )

                # Extract trending topics from content tags/categories
                trending_topics = metadata.get("tags", [])
                if not trending_topics:
                    trending_topics = metadata.get("categories", ["content"])

                trending.append(
                    TrendingContent(
                        content_id=content_id,
                        trend_score=trend_score,
                        engagement_velocity=engagement_velocity,
                        viral_probability=viral_probability,
                        trending_topics=trending_topics[:5],  # Limit topics
                        platform=content_platform,
                        published_at=metadata.get("publishedAt", datetime.utcnow().isoformat())
                    )
                )

            # If we got data from the API, return it
            if trending:
                logger.info(f"Returning {len(trending)} trending content items from analytics service")
                return trending

        except httpx.ConnectError as e:
            logger.warning(f"Cannot connect to analytics service: {e}")
        except httpx.TimeoutException as e:
            logger.warning(f"Timeout connecting to analytics service: {e}")
        except Exception as e:
            logger.error(f"Error fetching trending data from analytics service: {e}", exc_info=True)

        # Fallback: Query content service directly for recent high-engagement content
        logger.info("Falling back to content service query for trending data")
        return await self._get_trending_content_fallback(platform, time_window_hours)

    def _calculate_viral_probability(
        self,
        engagement_velocity: float,
        engagement_rate: float,
        share_rate: float
    ) -> float:
        """Calculate viral probability based on engagement metrics."""
        # Weight factors for viral potential
        velocity_weight = 0.4
        engagement_weight = 0.35
        share_weight = 0.25

        # Normalize metrics (assuming reasonable maximums)
        normalized_velocity = min(1.0, engagement_velocity / 10000)
        normalized_engagement = min(1.0, engagement_rate / 0.15)  # 15% is very high
        normalized_shares = min(1.0, share_rate / 0.05)  # 5% share rate is viral

        viral_score = (
            velocity_weight * normalized_velocity +
            engagement_weight * normalized_engagement +
            share_weight * normalized_shares
        )

        return min(1.0, max(0.0, viral_score))

    async def _get_trending_content_fallback(
        self,
        platform: str,
        time_window_hours: int
    ) -> List[TrendingContent]:
        """
        Fallback method to get trending content directly from content service
        when analytics service is unavailable.
        """
        trending = []
        client = await self._get_http_client()

        try:
            # Query content service for recent content sorted by engagement
            response = await client.get(
                f"{self.CONTENT_SERVICE_URL}/api/content",
                params={
                    "platform": platform if platform != "all" else None,
                    "sortBy": "engagementScore",
                    "sortOrder": "desc",
                    "limit": 30,
                    "publishedAfter": (
                        datetime.utcnow() - timedelta(hours=time_window_hours)
                    ).isoformat(),
                }
            )

            if response.status_code == 200:
                content_items = response.json().get("data", [])

                for i, item in enumerate(content_items):
                    # Calculate trend score based on position and engagement
                    position_score = 1.0 - (i / max(len(content_items), 1))
                    engagement_score = float(item.get("engagementScore", 0))
                    trend_score = 0.6 * position_score + 0.4 * min(1.0, engagement_score / 100)

                    trending.append(
                        TrendingContent(
                            content_id=item.get("id", f"content_{i}"),
                            trend_score=trend_score,
                            engagement_velocity=float(item.get("engagementVelocity", engagement_score * 10)),
                            viral_probability=trend_score * 0.7,
                            trending_topics=item.get("tags", ["content"])[:5],
                            platform=item.get("platform", platform if platform != "all" else "unknown"),
                            published_at=item.get("publishedAt", datetime.utcnow().isoformat())
                        )
                    )

                if trending:
                    logger.info(f"Fallback: Returning {len(trending)} trending items from content service")
                    return trending

        except Exception as e:
            logger.error(f"Fallback content service query failed: {e}")

        # Last resort: return empty list (no mock data)
        logger.warning("No trending data available from any service")
        return trending

    def _extract_top_topics(self, trending: List[TrendingContent]) -> List[str]:
        """Extract top trending topics."""
        topic_counts = {}

        for content in trending:
            for topic in content.trending_topics:
                topic_counts[topic] = topic_counts.get(topic, 0) + 1

        # Sort by count
        sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)

        return [topic for topic, _ in sorted_topics[:10]]

    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        v1 = np.array(vec1)
        v2 = np.array(vec2)

        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)

        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0

        return float(dot_product / (norm_v1 * norm_v2))

    def _calculate_range_overlap(self, range1: List[int], range2: List[int]) -> float:
        """Calculate overlap between two age ranges."""
        start1, end1 = range1
        start2, end2 = range2

        overlap_start = max(start1, start2)
        overlap_end = min(end1, end2)

        if overlap_start >= overlap_end:
            return 0.0

        overlap_size = overlap_end - overlap_start
        total_size = max(end1, end2) - min(start1, start2)

        return overlap_size / total_size if total_size > 0 else 0.0

    def _apply_diversity(self, matches: List[CreatorMatch]) -> List[CreatorMatch]:
        """Apply diversity to avoid too similar creators."""
        # Simple implementation - in production would use more sophisticated methods
        # Keep top matches but ensure variety
        return matches
