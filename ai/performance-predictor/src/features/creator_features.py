"""
Creator Feature Extractor.

Extracts features from creator historical performance data
for personalized engagement prediction.
"""

import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class CreatorFeatureSet:
    """Complete set of extracted creator features."""
    # Account metrics
    follower_count: int
    following_count: int
    total_posts: int
    account_age_days: int

    # Engagement metrics
    avg_engagement_rate: float
    engagement_rate_trend: float  # Positive = improving
    avg_likes: float
    avg_comments: float
    avg_shares: float

    # Content patterns
    posting_frequency: float  # Posts per week
    avg_caption_length: float
    avg_hashtag_count: float
    most_used_hashtags: List[str]

    # Performance consistency
    engagement_variance: float
    views_variance: float
    consistency_score: float

    # Audience metrics
    audience_authenticity: float
    audience_growth_rate: float

    # Time patterns
    best_posting_hour: int
    best_posting_day: str
    peak_engagement_time: str

    # Platform specifics
    platform: str
    account_type: str  # personal, business, creator


class CreatorFeatureExtractor:
    """
    Extracts comprehensive features from creator data.

    Analyzes historical performance, posting patterns, and audience
    metrics to generate features for personalized prediction.
    """

    def __init__(self):
        self.feature_cache: Dict[str, CreatorFeatureSet] = {}

    def extract(
        self,
        creator_id: str,
        profile_data: Dict[str, Any],
        posts_data: List[Dict[str, Any]],
        platform: str = "instagram",
    ) -> CreatorFeatureSet:
        """
        Extract comprehensive features from creator data.

        Args:
            creator_id: Unique creator identifier
            profile_data: Creator profile information
            posts_data: Historical posts with engagement data
            platform: Platform the creator is on

        Returns:
            CreatorFeatureSet with all extracted features
        """
        # Extract account metrics
        account_metrics = self._extract_account_metrics(profile_data)

        # Extract engagement metrics from posts
        engagement_metrics = self._extract_engagement_metrics(posts_data)

        # Extract content patterns
        content_patterns = self._extract_content_patterns(posts_data)

        # Extract time patterns
        time_patterns = self._extract_time_patterns(posts_data)

        # Calculate consistency scores
        consistency = self._calculate_consistency(posts_data)

        features = CreatorFeatureSet(
            # Account
            follower_count=account_metrics["follower_count"],
            following_count=account_metrics["following_count"],
            total_posts=account_metrics["total_posts"],
            account_age_days=account_metrics["account_age_days"],
            # Engagement
            avg_engagement_rate=engagement_metrics["avg_engagement_rate"],
            engagement_rate_trend=engagement_metrics["engagement_trend"],
            avg_likes=engagement_metrics["avg_likes"],
            avg_comments=engagement_metrics["avg_comments"],
            avg_shares=engagement_metrics["avg_shares"],
            # Content
            posting_frequency=content_patterns["posting_frequency"],
            avg_caption_length=content_patterns["avg_caption_length"],
            avg_hashtag_count=content_patterns["avg_hashtag_count"],
            most_used_hashtags=content_patterns["most_used_hashtags"],
            # Consistency
            engagement_variance=consistency["engagement_variance"],
            views_variance=consistency["views_variance"],
            consistency_score=consistency["consistency_score"],
            # Audience
            audience_authenticity=account_metrics.get("audience_authenticity", 0.8),
            audience_growth_rate=account_metrics.get("growth_rate", 0.0),
            # Time
            best_posting_hour=time_patterns["best_hour"],
            best_posting_day=time_patterns["best_day"],
            peak_engagement_time=time_patterns["peak_time"],
            # Meta
            platform=platform,
            account_type=profile_data.get("account_type", "personal"),
        )

        self.feature_cache[creator_id] = features
        return features

    def _extract_account_metrics(self, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract account-level metrics."""
        follower_count = profile_data.get("follower_count", 0)
        following_count = profile_data.get("following_count", 0)
        total_posts = profile_data.get("media_count", profile_data.get("total_posts", 0))

        # Calculate account age
        created_at = profile_data.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            account_age_days = (datetime.utcnow() - created_at.replace(tzinfo=None)).days
        else:
            account_age_days = 365  # Default assumption

        # Audience authenticity indicators
        if follower_count > 0 and following_count > 0:
            follow_ratio = follower_count / following_count
            if follow_ratio > 10:
                audience_authenticity = 0.9
            elif follow_ratio > 2:
                audience_authenticity = 0.8
            elif follow_ratio > 0.5:
                audience_authenticity = 0.7
            else:
                audience_authenticity = 0.5
        else:
            audience_authenticity = 0.7

        # Growth rate
        growth_rate = profile_data.get("follower_growth_30d", 0)
        if follower_count > 0:
            growth_rate = growth_rate / follower_count
        else:
            growth_rate = 0

        return {
            "follower_count": follower_count,
            "following_count": following_count,
            "total_posts": total_posts,
            "account_age_days": account_age_days,
            "audience_authenticity": audience_authenticity,
            "growth_rate": growth_rate,
        }

    def _extract_engagement_metrics(self, posts_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract engagement metrics from posts."""
        if not posts_data:
            return {
                "avg_engagement_rate": 0.03,
                "engagement_trend": 0.0,
                "avg_likes": 0,
                "avg_comments": 0,
                "avg_shares": 0,
            }

        engagement_rates = []
        likes = []
        comments = []
        shares = []

        for post in posts_data:
            views = post.get("views", post.get("impressions", 1))
            post_likes = post.get("likes", 0)
            post_comments = post.get("comments", 0)
            post_shares = post.get("shares", 0)

            if views > 0:
                er = (post_likes + post_comments + post_shares) / views
                engagement_rates.append(er)

            likes.append(post_likes)
            comments.append(post_comments)
            shares.append(post_shares)

        # Calculate averages
        avg_engagement_rate = np.mean(engagement_rates) if engagement_rates else 0.03
        avg_likes = np.mean(likes) if likes else 0
        avg_comments = np.mean(comments) if comments else 0
        avg_shares = np.mean(shares) if shares else 0

        # Calculate trend (compare recent half to older half)
        if len(engagement_rates) >= 4:
            mid = len(engagement_rates) // 2
            recent_avg = np.mean(engagement_rates[:mid])
            older_avg = np.mean(engagement_rates[mid:])
            if older_avg > 0:
                engagement_trend = (recent_avg - older_avg) / older_avg
            else:
                engagement_trend = 0
        else:
            engagement_trend = 0

        return {
            "avg_engagement_rate": avg_engagement_rate,
            "engagement_trend": engagement_trend,
            "avg_likes": avg_likes,
            "avg_comments": avg_comments,
            "avg_shares": avg_shares,
        }

    def _extract_content_patterns(self, posts_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract content creation patterns."""
        if not posts_data:
            return {
                "posting_frequency": 0,
                "avg_caption_length": 0,
                "avg_hashtag_count": 0,
                "most_used_hashtags": [],
            }

        # Posting frequency
        if len(posts_data) >= 2:
            dates = []
            for post in posts_data:
                posted_at = post.get("posted_at", post.get("timestamp"))
                if posted_at:
                    if isinstance(posted_at, str):
                        try:
                            posted_at = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
                        except:
                            continue
                    dates.append(posted_at)

            if len(dates) >= 2:
                dates.sort()
                time_span = (dates[-1] - dates[0]).days
                if time_span > 0:
                    posting_frequency = len(dates) / (time_span / 7)  # Posts per week
                else:
                    posting_frequency = 7  # At least daily
            else:
                posting_frequency = 1
        else:
            posting_frequency = 1

        # Caption analysis
        caption_lengths = []
        hashtag_counts = []
        all_hashtags = []

        for post in posts_data:
            caption = post.get("caption", "")
            caption_lengths.append(len(caption))

            # Count hashtags
            hashtags = post.get("hashtags", [])
            if not hashtags and caption:
                import re
                hashtags = re.findall(r"#\w+", caption)
            hashtag_counts.append(len(hashtags))
            all_hashtags.extend([h.lower().strip("#") for h in hashtags])

        avg_caption_length = np.mean(caption_lengths) if caption_lengths else 0
        avg_hashtag_count = np.mean(hashtag_counts) if hashtag_counts else 0

        # Most used hashtags
        from collections import Counter
        hashtag_counter = Counter(all_hashtags)
        most_used_hashtags = [h for h, _ in hashtag_counter.most_common(10)]

        return {
            "posting_frequency": posting_frequency,
            "avg_caption_length": avg_caption_length,
            "avg_hashtag_count": avg_hashtag_count,
            "most_used_hashtags": most_used_hashtags,
        }

    def _extract_time_patterns(self, posts_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extract posting time patterns."""
        if not posts_data:
            return {
                "best_hour": 12,
                "best_day": "wednesday",
                "peak_time": "12:00 PM",
            }

        hour_engagement = {h: [] for h in range(24)}
        day_engagement = {d: [] for d in range(7)}

        for post in posts_data:
            posted_at = post.get("posted_at", post.get("timestamp"))
            engagement = post.get("engagement_rate", 0)

            if not engagement:
                views = post.get("views", 1)
                likes = post.get("likes", 0)
                comments = post.get("comments", 0)
                shares = post.get("shares", 0)
                if views > 0:
                    engagement = (likes + comments + shares) / views

            if posted_at:
                if isinstance(posted_at, str):
                    try:
                        posted_at = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))
                    except:
                        continue

                hour_engagement[posted_at.hour].append(engagement)
                day_engagement[posted_at.weekday()].append(engagement)

        # Find best hour
        hour_avgs = {h: np.mean(engs) if engs else 0 for h, engs in hour_engagement.items()}
        best_hour = max(hour_avgs, key=hour_avgs.get)

        # Find best day
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        day_avgs = {d: np.mean(engs) if engs else 0 for d, engs in day_engagement.items()}
        best_day_idx = max(day_avgs, key=day_avgs.get)
        best_day = days[best_day_idx]

        # Format peak time
        hour_12 = best_hour % 12 or 12
        am_pm = "AM" if best_hour < 12 else "PM"
        peak_time = f"{hour_12}:00 {am_pm}"

        return {
            "best_hour": best_hour,
            "best_day": best_day,
            "peak_time": peak_time,
        }

    def _calculate_consistency(self, posts_data: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate consistency metrics."""
        if not posts_data:
            return {
                "engagement_variance": 0.5,
                "views_variance": 0.5,
                "consistency_score": 0.5,
            }

        engagement_rates = []
        views = []

        for post in posts_data:
            post_views = post.get("views", post.get("impressions", 0))
            post_likes = post.get("likes", 0)
            post_comments = post.get("comments", 0)
            post_shares = post.get("shares", 0)

            if post_views > 0:
                er = (post_likes + post_comments + post_shares) / post_views
                engagement_rates.append(er)
                views.append(post_views)

        if len(engagement_rates) < 2:
            return {
                "engagement_variance": 0.5,
                "views_variance": 0.5,
                "consistency_score": 0.5,
            }

        # Calculate coefficient of variation (lower = more consistent)
        engagement_cv = np.std(engagement_rates) / np.mean(engagement_rates) if np.mean(engagement_rates) > 0 else 1
        views_cv = np.std(views) / np.mean(views) if np.mean(views) > 0 else 1

        # Convert to scores (1 = perfectly consistent, 0 = highly variable)
        engagement_variance = min(engagement_cv, 2) / 2  # Normalize to 0-1
        views_variance = min(views_cv, 2) / 2

        # Consistency score (higher is better)
        consistency_score = 1 - (engagement_variance * 0.6 + views_variance * 0.4)

        return {
            "engagement_variance": engagement_variance,
            "views_variance": views_variance,
            "consistency_score": max(0, consistency_score),
        }

    def to_feature_array(self, features: CreatorFeatureSet) -> np.ndarray:
        """Convert CreatorFeatureSet to numpy array for ML models."""
        return np.array([
            np.log10(max(features.follower_count, 1)),  # Log scale
            np.log10(max(features.total_posts, 1)),
            features.account_age_days / 365,  # Years
            features.avg_engagement_rate,
            features.engagement_rate_trend,
            features.avg_likes / 1000,  # Scale down
            features.avg_comments / 100,
            features.avg_shares / 100,
            features.posting_frequency / 7,  # Normalize to daily
            features.avg_caption_length / 500,
            features.avg_hashtag_count / 30,
            features.engagement_variance,
            features.views_variance,
            features.consistency_score,
            features.audience_authenticity,
            features.audience_growth_rate,
        ])

    def get_cached_features(self, creator_id: str) -> Optional[CreatorFeatureSet]:
        """Get cached features for a creator."""
        return self.feature_cache.get(creator_id)
