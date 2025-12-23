"""
Timing Optimizer Model.

Predicts optimal posting times for content based on platform,
audience timezone, historical performance, and engagement patterns.
"""

import logging
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import numpy as np
import joblib
import os

logger = logging.getLogger(__name__)


@dataclass
class OptimalTimeResult:
    """Optimal posting time prediction result."""
    best_times: List[Dict[str, Any]]  # Top recommended times
    timezone: str
    day_preferences: Dict[str, float]  # Day of week scores
    hour_preferences: Dict[int, float]  # Hour scores
    expected_reach_boost: float  # Expected % boost vs random time
    confidence_score: float
    reasoning: str


@dataclass
class TimingFeatures:
    """Features for timing optimization."""
    platform: str
    content_type: str
    target_timezone: str
    audience_age_group: str  # "18-24", "25-34", etc.
    content_category: str
    creator_historical_data: Optional[Dict[str, Any]] = None


class TimingOptimizer:
    """
    Predicts optimal posting times for content.

    Uses platform-specific data, audience behavior patterns,
    and historical performance to recommend posting times.
    """

    # Platform-specific optimal hours (UTC)
    PLATFORM_PEAK_HOURS = {
        "tiktok": {
            "weekday": [7, 8, 12, 15, 19, 20, 21],
            "weekend": [9, 10, 11, 14, 15, 19, 20],
        },
        "instagram": {
            "weekday": [7, 8, 11, 12, 13, 17, 18, 19],
            "weekend": [10, 11, 12, 17, 18, 19],
        },
        "youtube": {
            "weekday": [14, 15, 16, 17, 18, 19, 20],
            "weekend": [12, 13, 14, 15, 16, 17, 18],
        },
        "facebook": {
            "weekday": [9, 10, 11, 13, 14, 15, 16],
            "weekend": [12, 13, 14, 15],
        },
        "pinterest": {
            "weekday": [20, 21, 22, 23],
            "weekend": [14, 15, 20, 21, 22],
        },
    }

    # Best days by platform
    PLATFORM_BEST_DAYS = {
        "tiktok": ["tuesday", "thursday", "friday"],
        "instagram": ["tuesday", "wednesday", "thursday"],
        "youtube": ["friday", "saturday", "sunday"],
        "facebook": ["wednesday", "thursday", "friday"],
        "pinterest": ["saturday", "sunday", "friday"],
    }

    # Age group activity patterns (hour multipliers)
    AGE_PATTERNS = {
        "13-17": {
            "early_morning": 0.3,  # 5-8
            "morning": 0.5,  # 8-12
            "afternoon": 0.7,  # 12-16
            "evening": 1.0,  # 16-20
            "night": 0.8,  # 20-24
            "late_night": 0.3,  # 0-5
        },
        "18-24": {
            "early_morning": 0.4,
            "morning": 0.6,
            "afternoon": 0.8,
            "evening": 1.0,
            "night": 0.9,
            "late_night": 0.5,
        },
        "25-34": {
            "early_morning": 0.6,
            "morning": 0.9,
            "afternoon": 0.7,
            "evening": 1.0,
            "night": 0.7,
            "late_night": 0.3,
        },
        "35-44": {
            "early_morning": 0.7,
            "morning": 1.0,
            "afternoon": 0.6,
            "evening": 0.9,
            "night": 0.5,
            "late_night": 0.2,
        },
        "45+": {
            "early_morning": 0.8,
            "morning": 1.0,
            "afternoon": 0.7,
            "evening": 0.8,
            "night": 0.4,
            "late_night": 0.1,
        },
    }

    def __init__(self, models_dir: str = "./models"):
        self.models_dir = models_dir
        self._load_historical_data()

    def _load_historical_data(self) -> None:
        """Load historical performance data."""
        try:
            data_path = os.path.join(self.models_dir, "timing", "historical_data.joblib")
            if os.path.exists(data_path):
                self.historical_data = joblib.load(data_path)
            else:
                self.historical_data = {}
        except Exception as e:
            logger.warning(f"Failed to load timing data: {e}")
            self.historical_data = {}

    def predict_optimal_times(
        self,
        features: TimingFeatures,
        num_recommendations: int = 5,
    ) -> OptimalTimeResult:
        """
        Predict optimal posting times for content.

        Args:
            features: Timing optimization features
            num_recommendations: Number of time slots to recommend

        Returns:
            OptimalTimeResult with recommended times
        """
        platform = features.platform.lower()

        # Get platform base patterns
        platform_hours = self.PLATFORM_PEAK_HOURS.get(
            platform, self.PLATFORM_PEAK_HOURS["instagram"]
        )
        platform_days = self.PLATFORM_BEST_DAYS.get(
            platform, self.PLATFORM_BEST_DAYS["instagram"]
        )

        # Calculate hour scores
        hour_scores = self._calculate_hour_scores(
            platform_hours,
            features.audience_age_group,
            features.creator_historical_data,
        )

        # Calculate day scores
        day_scores = self._calculate_day_scores(
            platform_days,
            features.creator_historical_data,
        )

        # Generate time recommendations
        best_times = self._generate_recommendations(
            hour_scores,
            day_scores,
            features.target_timezone,
            num_recommendations,
        )

        # Calculate expected boost
        expected_boost = self._calculate_expected_boost(best_times, platform)

        # Calculate confidence
        confidence = self._calculate_confidence(features)

        # Generate reasoning
        reasoning = self._generate_reasoning(
            platform, features.audience_age_group, best_times
        )

        return OptimalTimeResult(
            best_times=best_times,
            timezone=features.target_timezone,
            day_preferences=day_scores,
            hour_preferences=hour_scores,
            expected_reach_boost=expected_boost,
            confidence_score=confidence,
            reasoning=reasoning,
        )

    def _calculate_hour_scores(
        self,
        platform_hours: Dict[str, List[int]],
        age_group: str,
        historical_data: Optional[Dict[str, Any]],
    ) -> Dict[int, float]:
        """Calculate score for each hour of the day."""
        scores = {hour: 0.3 for hour in range(24)}  # Base score

        # Boost platform peak hours
        for hour in platform_hours.get("weekday", []):
            scores[hour] = max(scores[hour], 0.7)
        for hour in platform_hours.get("weekend", []):
            scores[hour] = max(scores[hour], 0.65)

        # Apply age group patterns
        age_patterns = self.AGE_PATTERNS.get(age_group, self.AGE_PATTERNS["25-34"])

        for hour in range(24):
            if 5 <= hour < 8:
                period = "early_morning"
            elif 8 <= hour < 12:
                period = "morning"
            elif 12 <= hour < 16:
                period = "afternoon"
            elif 16 <= hour < 20:
                period = "evening"
            elif 20 <= hour < 24:
                period = "night"
            else:
                period = "late_night"

            scores[hour] *= age_patterns.get(period, 0.5)

        # Apply historical data if available
        if historical_data and "hour_performance" in historical_data:
            for hour, perf in historical_data["hour_performance"].items():
                scores[int(hour)] = scores[int(hour)] * 0.6 + perf * 0.4

        # Normalize scores
        max_score = max(scores.values()) if scores else 1
        return {hour: score / max_score for hour, score in scores.items()}

    def _calculate_day_scores(
        self,
        platform_days: List[str],
        historical_data: Optional[Dict[str, Any]],
    ) -> Dict[str, float]:
        """Calculate score for each day of the week."""
        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        scores = {day: 0.5 for day in days}  # Base score

        # Boost platform preferred days
        for day in platform_days:
            scores[day.lower()] = 0.85

        # Apply historical data if available
        if historical_data and "day_performance" in historical_data:
            for day, perf in historical_data["day_performance"].items():
                scores[day.lower()] = scores[day.lower()] * 0.6 + perf * 0.4

        # Normalize scores
        max_score = max(scores.values()) if scores else 1
        return {day: score / max_score for day, score in scores.items()}

    def _generate_recommendations(
        self,
        hour_scores: Dict[int, float],
        day_scores: Dict[str, float],
        timezone: str,
        num_recommendations: int,
    ) -> List[Dict[str, Any]]:
        """Generate specific time slot recommendations."""
        recommendations = []

        days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

        # Calculate combined scores for each day-hour combination
        slots = []
        for day in days:
            for hour in range(24):
                combined_score = day_scores[day] * hour_scores[hour]
                slots.append({
                    "day": day,
                    "hour": hour,
                    "score": combined_score,
                })

        # Sort by score and get top recommendations
        slots.sort(key=lambda x: x["score"], reverse=True)

        # Take top slots, avoiding too close times
        selected = []
        for slot in slots:
            # Check if we have a similar time already
            is_unique = True
            for selected_slot in selected:
                if selected_slot["day"] == slot["day"]:
                    if abs(selected_slot["hour"] - slot["hour"]) <= 2:
                        is_unique = False
                        break

            if is_unique:
                selected.append(slot)
                if len(selected) >= num_recommendations:
                    break

        # Format recommendations
        for slot in selected:
            hour_12 = slot["hour"] % 12 or 12
            am_pm = "AM" if slot["hour"] < 12 else "PM"

            recommendations.append({
                "day": slot["day"].capitalize(),
                "time": f"{hour_12}:00 {am_pm}",
                "hour_24": slot["hour"],
                "score": round(slot["score"] * 100, 1),
                "timezone": timezone,
                "expected_performance": self._get_performance_label(slot["score"]),
            })

        return recommendations

    def _get_performance_label(self, score: float) -> str:
        """Get performance label based on score."""
        if score >= 0.8:
            return "Excellent"
        elif score >= 0.6:
            return "Very Good"
        elif score >= 0.4:
            return "Good"
        elif score >= 0.2:
            return "Moderate"
        else:
            return "Low"

    def _calculate_expected_boost(
        self,
        best_times: List[Dict[str, Any]],
        platform: str,
    ) -> float:
        """Calculate expected reach boost vs random posting."""
        if not best_times:
            return 0.0

        avg_score = np.mean([t["score"] for t in best_times]) / 100
        baseline = 0.3  # Random timing baseline

        boost = ((avg_score - baseline) / baseline) * 100
        return max(0, min(boost, 100))  # Cap at 100%

    def _calculate_confidence(self, features: TimingFeatures) -> float:
        """Calculate prediction confidence."""
        confidence = 0.6

        # Boost with historical data
        if features.creator_historical_data:
            if "total_posts" in features.creator_historical_data:
                posts = features.creator_historical_data["total_posts"]
                confidence += min(posts / 100, 0.2)

        # Known platform patterns boost confidence
        if features.platform.lower() in self.PLATFORM_PEAK_HOURS:
            confidence += 0.1

        return min(confidence, 0.95)

    def _generate_reasoning(
        self,
        platform: str,
        age_group: str,
        best_times: List[Dict[str, Any]],
    ) -> str:
        """Generate human-readable reasoning for recommendations."""
        if not best_times:
            return "Unable to generate specific recommendations."

        best_time = best_times[0]
        platform_cap = platform.capitalize()

        reasoning = (
            f"Based on {platform_cap} engagement patterns for the {age_group} age group, "
            f"{best_time['day']} at {best_time['time']} shows the highest potential. "
            f"This time aligns with peak platform activity and your target audience's "
            f"typical online behavior. Posting at optimal times can increase reach by "
            f"20-40% compared to random posting."
        )

        return reasoning

    def get_next_optimal_slot(
        self,
        features: TimingFeatures,
        current_time: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get the next optimal posting slot from current time."""
        if current_time is None:
            current_time = datetime.utcnow()

        result = self.predict_optimal_times(features, num_recommendations=10)

        days_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }

        current_day = current_time.weekday()
        current_hour = current_time.hour

        for time_slot in result.best_times:
            slot_day = days_map[time_slot["day"].lower()]
            slot_hour = time_slot["hour_24"]

            days_until = (slot_day - current_day) % 7
            if days_until == 0 and slot_hour <= current_hour:
                days_until = 7

            next_slot = current_time + timedelta(days=days_until)
            next_slot = next_slot.replace(hour=slot_hour, minute=0, second=0, microsecond=0)

            if next_slot > current_time:
                return {
                    **time_slot,
                    "datetime": next_slot.isoformat(),
                    "hours_until": (next_slot - current_time).total_seconds() / 3600,
                }

        return result.best_times[0] if result.best_times else {}

    def analyze_historical_performance(
        self,
        posts: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Analyze historical post performance by timing."""
        hour_performance = {hour: [] for hour in range(24)}
        day_performance = {day: [] for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]}

        for post in posts:
            if "posted_at" in post and "engagement_rate" in post:
                posted_at = post["posted_at"]
                if isinstance(posted_at, str):
                    posted_at = datetime.fromisoformat(posted_at.replace("Z", "+00:00"))

                hour = posted_at.hour
                day = posted_at.strftime("%A").lower()

                hour_performance[hour].append(post["engagement_rate"])
                day_performance[day].append(post["engagement_rate"])

        # Calculate averages
        hour_avg = {
            hour: np.mean(rates) if rates else 0
            for hour, rates in hour_performance.items()
        }
        day_avg = {
            day: np.mean(rates) if rates else 0
            for day, rates in day_performance.items()
        }

        # Normalize
        max_hour = max(hour_avg.values()) if any(hour_avg.values()) else 1
        max_day = max(day_avg.values()) if any(day_avg.values()) else 1

        return {
            "hour_performance": {h: v / max_hour for h, v in hour_avg.items()},
            "day_performance": {d: v / max_day for d, v in day_avg.items()},
            "total_posts": len(posts),
        }
