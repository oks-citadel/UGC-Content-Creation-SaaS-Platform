"""Sentiment analysis utility for customer messages."""

import logging
import re
from typing import List, Dict, Tuple
from ..config import settings
from ..models import SentimentLevel, SentimentAnalysisResult

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """
    Analyze sentiment of customer messages to detect escalation triggers
    and emotional states.
    """

    def __init__(self):
        # Negative sentiment indicators with weights
        self.negative_patterns = {
            # Strong negative
            r'\b(terrible|awful|horrible|worst|hate|disgusting|outraged|furious)\b': -0.9,
            r'\b(unacceptable|ridiculous|absurd|pathetic|useless|worthless)\b': -0.85,
            r'\b(scam|fraud|rip.?off|theft|stealing|cheat)\b': -0.95,

            # Medium negative
            r'\b(disappointed|frustrated|annoyed|upset|angry|mad)\b': -0.7,
            r'\b(poor|bad|wrong|broken|failed|error|bug)\b': -0.5,
            r'\b(slow|delayed|waiting|stuck|issue|problem)\b': -0.4,

            # Mild negative
            r'\b(confus(ed|ing)|unclear|difficult|hard|complicated)\b': -0.3,
            r'\b(not working|doesn\'t work|can\'t|cannot|won\'t)\b': -0.4,
        }

        # Positive sentiment indicators with weights
        self.positive_patterns = {
            # Strong positive
            r'\b(excellent|amazing|wonderful|fantastic|perfect|love|awesome)\b': 0.9,
            r'\b(outstanding|exceptional|brilliant|superb|incredible)\b': 0.85,

            # Medium positive
            r'\b(great|good|nice|helpful|thanks|thank you|appreciate)\b': 0.6,
            r'\b(happy|pleased|satisfied|glad|enjoy)\b': 0.5,

            # Mild positive
            r'\b(ok|okay|fine|works|working|resolved|fixed)\b': 0.3,
            r'\b(understand|got it|makes sense|clear)\b': 0.2,
        }

        # Escalation trigger keywords
        self.escalation_triggers = [
            "speak to manager",
            "human agent",
            "real person",
            "supervisor",
            "escalate",
            "complaint",
            "legal",
            "lawyer",
            "attorney",
            "sue",
            "lawsuit",
            "cancel subscription",
            "cancel my account",
            "refund",
            "money back",
            "unacceptable",
            "never again",
            "worst experience",
            "bbb",
            "better business bureau",
            "report you",
            "social media",
            "going public",
        ]

        # Emotion keywords for detailed analysis
        self.emotion_keywords = {
            "anger": ["angry", "furious", "mad", "outraged", "livid", "irate"],
            "frustration": ["frustrated", "annoyed", "irritated", "exasperated"],
            "disappointment": ["disappointed", "let down", "expected more", "underwhelmed"],
            "confusion": ["confused", "don't understand", "unclear", "lost", "puzzled"],
            "urgency": ["urgent", "asap", "immediately", "right now", "emergency", "critical"],
            "satisfaction": ["happy", "satisfied", "pleased", "grateful", "thankful"],
        }

    async def analyze(self, text: str) -> SentimentAnalysisResult:
        """
        Analyze the sentiment of a text message.

        Args:
            text: The text to analyze

        Returns:
            SentimentAnalysisResult with score, level, and details
        """
        try:
            text_lower = text.lower()

            # Calculate base sentiment score
            score = self._calculate_sentiment_score(text_lower)

            # Detect emotions
            emotions = self._detect_emotions(text_lower)

            # Check for escalation triggers
            escalation_triggers = self._find_escalation_triggers(text_lower)

            # Determine sentiment level
            level = self._score_to_level(score)

            # Determine if requires attention
            requires_attention = (
                score <= settings.sentiment_threshold_escalation
                or len(escalation_triggers) > 0
                or emotions.get("anger", 0) > 0.5
                or emotions.get("urgency", 0) > 0.7
            )

            # Calculate confidence based on pattern matches
            confidence = self._calculate_confidence(text_lower)

            return SentimentAnalysisResult(
                score=score,
                level=level,
                confidence=confidence,
                emotions=emotions,
                escalation_triggers=escalation_triggers,
                requires_attention=requires_attention
            )

        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}", exc_info=True)
            # Return neutral sentiment on error
            return SentimentAnalysisResult(
                score=0.0,
                level=SentimentLevel.NEUTRAL,
                confidence=0.0,
                emotions={},
                escalation_triggers=[],
                requires_attention=False
            )

    def _calculate_sentiment_score(self, text: str) -> float:
        """Calculate overall sentiment score from -1 to 1."""
        total_score = 0.0
        match_count = 0

        # Check negative patterns
        for pattern, weight in self.negative_patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                total_score += weight * len(matches)
                match_count += len(matches)

        # Check positive patterns
        for pattern, weight in self.positive_patterns.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                total_score += weight * len(matches)
                match_count += len(matches)

        # Normalize score
        if match_count > 0:
            score = total_score / match_count
        else:
            score = 0.0

        # Clamp to [-1, 1]
        return max(-1.0, min(1.0, score))

    def _score_to_level(self, score: float) -> SentimentLevel:
        """Convert numeric score to sentiment level."""
        if score <= -0.6:
            return SentimentLevel.VERY_NEGATIVE
        elif score <= -0.2:
            return SentimentLevel.NEGATIVE
        elif score <= 0.2:
            return SentimentLevel.NEUTRAL
        elif score <= 0.6:
            return SentimentLevel.POSITIVE
        else:
            return SentimentLevel.VERY_POSITIVE

    def _detect_emotions(self, text: str) -> Dict[str, float]:
        """Detect specific emotions in text."""
        emotions = {}

        for emotion, keywords in self.emotion_keywords.items():
            # Count keyword matches
            match_count = sum(1 for kw in keywords if kw in text)
            # Calculate emotion intensity (0-1)
            if match_count > 0:
                intensity = min(1.0, match_count * 0.3)
                emotions[emotion] = intensity

        return emotions

    def _find_escalation_triggers(self, text: str) -> List[str]:
        """Find escalation trigger phrases in text."""
        found_triggers = []

        for trigger in self.escalation_triggers:
            if trigger.lower() in text:
                found_triggers.append(trigger)

        # Also check settings-defined keywords
        for keyword in settings.escalation_keywords:
            if keyword.lower() in text and keyword not in found_triggers:
                found_triggers.append(keyword)

        return found_triggers

    def _calculate_confidence(self, text: str) -> float:
        """Calculate confidence in sentiment analysis."""
        total_patterns = len(self.negative_patterns) + len(self.positive_patterns)
        matched_patterns = 0

        for pattern in self.negative_patterns.keys():
            if re.search(pattern, text, re.IGNORECASE):
                matched_patterns += 1

        for pattern in self.positive_patterns.keys():
            if re.search(pattern, text, re.IGNORECASE):
                matched_patterns += 1

        # More matches = higher confidence
        if matched_patterns == 0:
            return 0.5  # Neutral confidence when no patterns matched
        else:
            return min(1.0, 0.5 + (matched_patterns / total_patterns) * 0.5)

    def should_escalate(self, result: SentimentAnalysisResult) -> Tuple[bool, str]:
        """
        Determine if a conversation should be escalated based on sentiment.

        Returns:
            Tuple of (should_escalate, reason)
        """
        if len(result.escalation_triggers) > 0:
            return True, f"Escalation keywords detected: {', '.join(result.escalation_triggers[:3])}"

        if result.score <= settings.sentiment_threshold_escalation:
            return True, f"Very negative sentiment detected (score: {result.score:.2f})"

        if result.emotions.get("anger", 0) > 0.7:
            return True, "High anger level detected"

        if result.emotions.get("urgency", 0) > 0.8:
            return True, "High urgency level detected"

        return False, ""

    async def analyze_conversation(
        self,
        messages: List[str]
    ) -> Dict[str, any]:
        """
        Analyze sentiment trend across a conversation.

        Args:
            messages: List of customer messages

        Returns:
            Dictionary with conversation sentiment analysis
        """
        if not messages:
            return {
                "average_sentiment": 0.0,
                "trend": "stable",
                "escalation_risk": 0.0,
                "requires_attention": False
            }

        scores = []
        all_triggers = []

        for message in messages:
            result = await self.analyze(message)
            scores.append(result.score)
            all_triggers.extend(result.escalation_triggers)

        avg_sentiment = sum(scores) / len(scores)

        # Calculate trend
        if len(scores) >= 2:
            recent_avg = sum(scores[-3:]) / min(3, len(scores))
            early_avg = sum(scores[:3]) / min(3, len(scores))
            if recent_avg < early_avg - 0.2:
                trend = "declining"
            elif recent_avg > early_avg + 0.2:
                trend = "improving"
            else:
                trend = "stable"
        else:
            trend = "stable"

        # Calculate escalation risk
        escalation_risk = 0.0
        if avg_sentiment < 0:
            escalation_risk += abs(avg_sentiment) * 0.5
        if trend == "declining":
            escalation_risk += 0.3
        if len(all_triggers) > 0:
            escalation_risk += min(0.5, len(all_triggers) * 0.15)

        escalation_risk = min(1.0, escalation_risk)

        return {
            "average_sentiment": avg_sentiment,
            "trend": trend,
            "escalation_risk": escalation_risk,
            "requires_attention": escalation_risk > 0.6 or trend == "declining",
            "trigger_count": len(set(all_triggers))
        }
