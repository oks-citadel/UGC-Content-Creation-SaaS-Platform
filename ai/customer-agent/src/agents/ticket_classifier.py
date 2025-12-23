"""Ticket classification service using AI."""

import logging
import re
import json
from typing import Optional, Dict, Any, List, Tuple
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from ..config import settings
from ..models import (
    TicketCategory,
    TicketPriority,
    TicketAnalyzeRequest,
    TicketAnalyzeResponse,
    SentimentLevel,
)
from ..utils.sentiment import SentimentAnalyzer

logger = logging.getLogger(__name__)


class TicketClassifier:
    """
    AI-powered ticket classifier that determines category, priority,
    and extracts key entities from support tickets.
    """

    def __init__(self):
        self.openai_client: Optional[AsyncOpenAI] = None
        self.anthropic_client: Optional[AsyncAnthropic] = None
        self.sentiment_analyzer = SentimentAnalyzer()

        # Category keywords for fallback classification
        self.category_keywords = {
            TicketCategory.BILLING: [
                "payment", "charge", "invoice", "subscription", "refund",
                "pricing", "upgrade", "downgrade", "billing", "credit card",
                "plan", "cost", "fee", "renewal", "cancel subscription"
            ],
            TicketCategory.TECHNICAL_SUPPORT: [
                "error", "bug", "crash", "not working", "broken", "issue",
                "problem", "help", "fix", "loading", "slow", "stuck",
                "can't access", "doesn't work", "failed"
            ],
            TicketCategory.ACCOUNT_MANAGEMENT: [
                "password", "login", "account", "profile", "email change",
                "username", "settings", "two-factor", "2fa", "verification",
                "access", "locked out", "delete account"
            ],
            TicketCategory.CONTENT_ISSUES: [
                "video", "upload", "content", "post", "image", "caption",
                "moderation", "removed", "deleted", "copyright", "claim",
                "views", "engagement", "reach"
            ],
            TicketCategory.PLATFORM_FEATURES: [
                "how to", "feature", "tutorial", "learn", "guide",
                "instructions", "use", "function", "capability", "tool"
            ],
            TicketCategory.PARTNERSHIP_INQUIRY: [
                "partner", "collaboration", "sponsor", "brand deal",
                "influencer", "campaign", "business", "enterprise", "api"
            ],
            TicketCategory.BUG_REPORT: [
                "bug", "glitch", "malfunction", "unexpected behavior",
                "should not", "supposed to", "incorrect", "wrong"
            ],
            TicketCategory.FEATURE_REQUEST: [
                "request", "suggestion", "would be nice", "please add",
                "wish", "could you", "feature request", "idea"
            ],
            TicketCategory.GENERAL_INQUIRY: [
                "question", "wondering", "curious", "information",
                "tell me about", "what is", "how does"
            ],
        }

        # Priority indicators
        self.priority_indicators = {
            TicketPriority.URGENT: [
                "urgent", "emergency", "critical", "asap", "immediately",
                "right now", "cannot work", "business impact", "production down",
                "losing money", "deadline"
            ],
            TicketPriority.HIGH: [
                "important", "serious", "major", "significant", "blocking",
                "cannot use", "completely broken", "very frustrated"
            ],
            TicketPriority.MEDIUM: [
                "issue", "problem", "not working properly", "inconvenient",
                "frustrated", "need help"
            ],
            TicketPriority.LOW: [
                "minor", "small", "when you can", "no rush", "just wondering",
                "curious", "suggestion"
            ],
        }

    async def _initialize_clients(self):
        """Initialize LLM clients if not already done."""
        if settings.llm_provider == "openai" and not self.openai_client:
            if settings.openai_api_key:
                self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

        if settings.llm_provider == "anthropic" and not self.anthropic_client:
            if settings.anthropic_api_key:
                self.anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def classify(self, request: TicketAnalyzeRequest) -> TicketAnalyzeResponse:
        """
        Classify a support ticket to determine category, priority, and extract entities.

        Args:
            request: The ticket analysis request

        Returns:
            TicketAnalyzeResponse with classification results
        """
        try:
            await self._initialize_clients()

            # Combine subject and description for analysis
            full_text = f"{request.subject}\n\n{request.description}"

            # Try AI classification first
            ai_result = await self._classify_with_ai(full_text)

            if ai_result:
                category, priority, entities, confidence, suggested_response = ai_result
            else:
                # Fallback to rule-based classification
                category = self._classify_category_rules(full_text)
                priority = self._classify_priority_rules(full_text)
                entities = self._extract_entities_rules(full_text)
                confidence = 0.6
                suggested_response = None

            # Analyze sentiment
            sentiment_result = await self.sentiment_analyzer.analyze(full_text)

            # Adjust priority based on sentiment
            if sentiment_result.requires_attention and priority == TicketPriority.LOW:
                priority = TicketPriority.MEDIUM
            elif sentiment_result.level == SentimentLevel.VERY_NEGATIVE and priority != TicketPriority.URGENT:
                priority = TicketPriority.HIGH

            # Generate suggested tags
            suggested_tags = self._generate_tags(category, entities, sentiment_result.level)

            # Estimate resolution time
            estimated_time = self._estimate_resolution_time(category, priority)

            return TicketAnalyzeResponse(
                ticket_id=request.ticket_id or self._generate_ticket_id(),
                category=category,
                priority=priority,
                confidence=confidence,
                suggested_tags=suggested_tags,
                key_entities=entities,
                sentiment=sentiment_result.level,
                similar_tickets=[],  # Would query ticket database in production
                suggested_response=suggested_response,
                estimated_resolution_time=estimated_time
            )

        except Exception as e:
            logger.error(f"Error classifying ticket: {str(e)}", exc_info=True)
            # Return safe defaults on error
            return TicketAnalyzeResponse(
                ticket_id=request.ticket_id or self._generate_ticket_id(),
                category=TicketCategory.GENERAL_INQUIRY,
                priority=TicketPriority.MEDIUM,
                confidence=0.3,
                suggested_tags=["needs-review"],
                key_entities={},
                sentiment=SentimentLevel.NEUTRAL,
                similar_tickets=[],
                suggested_response=None,
                estimated_resolution_time="24-48 hours"
            )

    async def _classify_with_ai(
        self,
        text: str
    ) -> Optional[Tuple[TicketCategory, TicketPriority, Dict, float, Optional[str]]]:
        """Use LLM to classify ticket."""
        try:
            categories_str = ", ".join([c.value for c in TicketCategory])
            priorities_str = ", ".join([p.value for p in TicketPriority])

            prompt = f"""Analyze this customer support ticket and provide classification.

Ticket Content:
{text}

Classify this ticket with the following information:
1. Category (one of: {categories_str})
2. Priority (one of: {priorities_str})
3. Key entities (product names, features, error codes, etc.)
4. Confidence score (0.0 to 1.0)
5. Brief suggested response opening (1-2 sentences)

Respond in JSON format:
{{
    "category": "category_value",
    "priority": "priority_value",
    "entities": {{"entity_type": "entity_value"}},
    "confidence": 0.85,
    "suggested_response": "Thank you for reaching out..."
}}"""

            if settings.llm_provider == "openai" and self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {"role": "system", "content": "You are a support ticket classifier. Always respond with valid JSON only."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=500
                )
                result_text = response.choices[0].message.content

            elif settings.llm_provider == "anthropic" and self.anthropic_client:
                response = await self.anthropic_client.messages.create(
                    model=settings.anthropic_model,
                    max_tokens=500,
                    messages=[{"role": "user", "content": prompt}]
                )
                result_text = response.content[0].text

            else:
                return None

            # Parse JSON response
            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r'\{[\s\S]*\}', result_text)
            if json_match:
                result = json.loads(json_match.group())

                category = TicketCategory(result.get("category", "general_inquiry"))
                priority = TicketPriority(result.get("priority", "medium"))
                entities = result.get("entities", {})
                confidence = float(result.get("confidence", 0.7))
                suggested_response = result.get("suggested_response")

                return category, priority, entities, confidence, suggested_response

            return None

        except Exception as e:
            logger.warning(f"AI classification failed, using fallback: {str(e)}")
            return None

    def _classify_category_rules(self, text: str) -> TicketCategory:
        """Rule-based category classification."""
        text_lower = text.lower()
        category_scores = {}

        for category, keywords in self.category_keywords.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                category_scores[category] = score

        if category_scores:
            return max(category_scores, key=category_scores.get)

        return TicketCategory.GENERAL_INQUIRY

    def _classify_priority_rules(self, text: str) -> TicketPriority:
        """Rule-based priority classification."""
        text_lower = text.lower()

        for priority in [TicketPriority.URGENT, TicketPriority.HIGH,
                        TicketPriority.MEDIUM, TicketPriority.LOW]:
            keywords = self.priority_indicators.get(priority, [])
            if any(kw in text_lower for kw in keywords):
                return priority

        return TicketPriority.MEDIUM

    def _extract_entities_rules(self, text: str) -> Dict[str, Any]:
        """Extract entities using rules and patterns."""
        entities = {}

        # Extract email addresses
        emails = re.findall(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
        if emails:
            entities["emails"] = emails

        # Extract URLs
        urls = re.findall(r'https?://[^\s]+', text)
        if urls:
            entities["urls"] = urls

        # Extract order/ticket IDs
        ids = re.findall(r'\b[A-Z]{2,4}[-_]?\d{4,10}\b', text)
        if ids:
            entities["reference_ids"] = ids

        # Extract error codes
        error_codes = re.findall(r'\b(?:error|code|err)[\s:]+(\w+)\b', text, re.IGNORECASE)
        if error_codes:
            entities["error_codes"] = error_codes

        # Extract platform mentions
        platforms = []
        platform_names = ["tiktok", "instagram", "youtube", "facebook", "twitter", "pinterest"]
        for platform in platform_names:
            if platform in text.lower():
                platforms.append(platform)
        if platforms:
            entities["platforms"] = platforms

        return entities

    def _generate_tags(
        self,
        category: TicketCategory,
        entities: Dict[str, Any],
        sentiment: SentimentLevel
    ) -> List[str]:
        """Generate suggested tags for the ticket."""
        tags = [category.value]

        # Add sentiment-based tags
        if sentiment in [SentimentLevel.VERY_NEGATIVE, SentimentLevel.NEGATIVE]:
            tags.append("needs-attention")

        # Add entity-based tags
        if "platforms" in entities:
            for platform in entities["platforms"][:2]:
                tags.append(f"platform-{platform}")

        if "error_codes" in entities:
            tags.append("has-error-code")

        return tags

    def _estimate_resolution_time(
        self,
        category: TicketCategory,
        priority: TicketPriority
    ) -> str:
        """Estimate resolution time based on category and priority."""
        base_times = {
            TicketCategory.BILLING: "2-4 hours",
            TicketCategory.TECHNICAL_SUPPORT: "4-8 hours",
            TicketCategory.ACCOUNT_MANAGEMENT: "1-2 hours",
            TicketCategory.CONTENT_ISSUES: "4-24 hours",
            TicketCategory.PLATFORM_FEATURES: "1-2 hours",
            TicketCategory.PARTNERSHIP_INQUIRY: "24-48 hours",
            TicketCategory.BUG_REPORT: "24-72 hours",
            TicketCategory.FEATURE_REQUEST: "No ETA - will be reviewed",
            TicketCategory.GENERAL_INQUIRY: "2-4 hours",
        }

        base_time = base_times.get(category, "24 hours")

        # Adjust for priority
        if priority == TicketPriority.URGENT:
            return "< 1 hour"
        elif priority == TicketPriority.HIGH:
            return "1-2 hours"

        return base_time

    def _generate_ticket_id(self) -> str:
        """Generate a unique ticket ID."""
        import uuid
        return f"TKT-{uuid.uuid4().hex[:8].upper()}"

    async def batch_classify(
        self,
        tickets: List[TicketAnalyzeRequest]
    ) -> List[TicketAnalyzeResponse]:
        """Classify multiple tickets in batch."""
        results = []
        for ticket in tickets:
            result = await self.classify(ticket)
            results.append(result)
        return results
