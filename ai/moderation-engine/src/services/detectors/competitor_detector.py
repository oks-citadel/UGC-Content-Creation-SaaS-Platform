import logging
from typing import List, Optional
import re

from ...models import CompetitorDetectionResult, CompetitorMention, ModerationSeverity

logger = logging.getLogger(__name__)


class CompetitorDetector:
    """Detector for competitor brand mentions."""

    def __init__(self):
        # This would be loaded from a database in production
        self.competitor_database = {
            "brand_1": {
                "competitors": ["competitor_a", "competitor_b", "competitor_c"],
                "aliases": {
                    "competitor_a": ["comp a", "compa"],
                    "competitor_b": ["comp b", "compb"],
                }
            }
        }

    async def detect_competitors(
        self,
        content_url: Optional[str],
        text_content: Optional[str],
        brand_id: Optional[str]
    ) -> CompetitorDetectionResult:
        """
        Detect mentions of competitor brands in content.

        Checks for:
        - Competitor brand names in text
        - Competitor logos/products in visuals (future)
        """
        try:
            mentions = []

            if not brand_id or brand_id not in self.competitor_database:
                # No competitor data available
                return CompetitorDetectionResult(
                    competitors_detected=False,
                    mentions=[],
                    total_mentions=0,
                    recommendation="No competitor detection configured for this brand"
                )

            competitors = self.competitor_database[brand_id]["competitors"]
            aliases = self.competitor_database[brand_id].get("aliases", {})

            # Check text content
            if text_content:
                text_mentions = self._detect_text_mentions(
                    text_content,
                    competitors,
                    aliases
                )
                mentions.extend(text_mentions)

            # Check visual content (future enhancement)
            if content_url:
                # Would check for competitor logos, products, etc.
                pass

            # Generate recommendation
            recommendation = self._generate_competitor_recommendation(mentions)

            return CompetitorDetectionResult(
                competitors_detected=len(mentions) > 0,
                mentions=mentions,
                total_mentions=len(mentions),
                recommendation=recommendation
            )

        except Exception as e:
            logger.error(f"Error detecting competitors: {str(e)}", exc_info=True)
            raise

    def _detect_text_mentions(
        self,
        text: str,
        competitors: List[str],
        aliases: dict
    ) -> List[CompetitorMention]:
        """Detect competitor mentions in text."""
        mentions = []
        text_lower = text.lower()

        # Check for each competitor
        for competitor in competitors:
            # Check main name
            if self._find_mention(text_lower, competitor):
                mention = self._create_mention(
                    competitor,
                    text,
                    competitor,
                    confidence=0.9
                )
                mentions.append(mention)

            # Check aliases
            if competitor in aliases:
                for alias in aliases[competitor]:
                    if self._find_mention(text_lower, alias):
                        mention = self._create_mention(
                            competitor,
                            text,
                            alias,
                            confidence=0.7
                        )
                        mentions.append(mention)

        return mentions

    def _find_mention(self, text: str, term: str) -> bool:
        """Check if term is mentioned in text with word boundaries."""
        pattern = r'\b' + re.escape(term.lower()) + r'\b'
        return bool(re.search(pattern, text))

    def _create_mention(
        self,
        competitor_name: str,
        text: str,
        matched_term: str,
        confidence: float
    ) -> CompetitorMention:
        """Create a competitor mention object."""

        # Extract context (surrounding text)
        text_lower = text.lower()
        match_pos = text_lower.find(matched_term.lower())

        context_start = max(0, match_pos - 50)
        context_end = min(len(text), match_pos + len(matched_term) + 50)
        context = text[context_start:context_end].strip()

        return CompetitorMention(
            competitor_name=competitor_name,
            mention_type="text",
            confidence=confidence,
            context=f"...{context}..."
        )

    def _generate_competitor_recommendation(
        self,
        mentions: List[CompetitorMention]
    ) -> str:
        """Generate recommendation based on competitor mentions."""

        if not mentions:
            return "No competitor mentions detected. Content is clear."

        if len(mentions) == 1:
            return f"Competitor '{mentions[0].competitor_name}' mentioned. Consider removing or replacing with your brand."

        competitor_names = set(m.competitor_name for m in mentions)
        return f"Multiple competitors detected ({', '.join(competitor_names)}). Remove competitor references before publishing."
