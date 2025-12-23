"""Context builder for customer conversations."""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime

from ..config import settings
from ..models import (
    CustomerInfo,
    ConversationTurn,
    Message,
    KnowledgeContext,
    FAQSearchResult,
)
from .faq_search import FAQSearchService

logger = logging.getLogger(__name__)


class ContextBuilder:
    """
    Builds comprehensive context for AI responses by gathering
    customer history, relevant FAQs, and conversation context.
    """

    def __init__(self, faq_service: Optional[FAQSearchService] = None):
        self.faq_service = faq_service or FAQSearchService()
        self.customer_cache: Dict[str, CustomerInfo] = {}
        self.conversation_cache: Dict[str, List[ConversationTurn]] = {}

    async def build_context(
        self,
        customer_id: Optional[str],
        current_message: str,
        conversation_history: Optional[List[Message]] = None,
        include_faqs: bool = True,
        max_faq_results: int = 3
    ) -> KnowledgeContext:
        """
        Build comprehensive context for generating a response.

        Args:
            customer_id: Optional customer identifier
            current_message: The current customer message
            conversation_history: Previous messages in the conversation
            include_faqs: Whether to search for relevant FAQs
            max_faq_results: Maximum number of FAQ results to include

        Returns:
            KnowledgeContext with all relevant information
        """
        try:
            # Get customer info if available
            customer_info = None
            if customer_id:
                customer_info = await self._get_customer_info(customer_id)

            # Extract recent interactions from conversation history
            recent_interactions = []
            if conversation_history:
                recent_interactions = self._extract_interactions(conversation_history)

            # Search for relevant FAQs
            relevant_faqs = []
            if include_faqs:
                relevant_faqs = await self.faq_service.search(
                    current_message,
                    top_k=max_faq_results,
                    min_score=0.4
                )

            # Get account notes and active issues
            account_notes = []
            active_issues = []
            if customer_id:
                account_notes = await self._get_account_notes(customer_id)
                active_issues = await self._get_active_issues(customer_id)

            return KnowledgeContext(
                customer_history=customer_info,
                recent_interactions=recent_interactions,
                relevant_faqs=relevant_faqs,
                account_notes=account_notes,
                active_issues=active_issues
            )

        except Exception as e:
            logger.error(f"Error building context: {str(e)}", exc_info=True)
            return KnowledgeContext()

    async def _get_customer_info(self, customer_id: str) -> Optional[CustomerInfo]:
        """
        Retrieve customer information.
        In production, this would query a customer database.
        """
        # Check cache first
        if customer_id in self.customer_cache:
            return self.customer_cache[customer_id]

        # In production, query customer database here
        # For now, return sample data for demo purposes
        sample_customer = CustomerInfo(
            customer_id=customer_id,
            name="Demo Customer",
            email=f"{customer_id}@example.com",
            subscription_tier="professional",
            account_created=datetime(2024, 1, 15),
            total_spend=299.99,
            previous_tickets=2,
            satisfaction_score=4.5,
            tags=["active_creator", "brand_partner"]
        )

        # Cache for future requests
        self.customer_cache[customer_id] = sample_customer

        return sample_customer

    def _extract_interactions(
        self,
        messages: List[Message],
        max_turns: int = 10
    ) -> List[ConversationTurn]:
        """Extract conversation turns from message history."""
        turns = []
        user_message = None

        for message in messages[-max_turns * 2:]:
            if message.role == "user":
                user_message = message.content
            elif message.role == "assistant" and user_message:
                turns.append(ConversationTurn(
                    user_message=user_message,
                    assistant_response=message.content,
                    timestamp=message.timestamp or datetime.utcnow()
                ))
                user_message = None

        return turns[-max_turns:]

    async def _get_account_notes(self, customer_id: str) -> List[str]:
        """
        Get account notes for a customer.
        In production, query from CRM or notes database.
        """
        # Sample notes for demo
        return [
            "Customer prefers email communication",
            "Previously helped with billing issue - resolved positively",
        ]

    async def _get_active_issues(self, customer_id: str) -> List[str]:
        """
        Get active support issues for a customer.
        In production, query from ticket system.
        """
        # Return empty for demo - in production, query ticket database
        return []

    def format_context_for_prompt(
        self,
        context: KnowledgeContext,
        max_length: int = 2000
    ) -> str:
        """
        Format context into a string suitable for LLM prompts.

        Args:
            context: The knowledge context to format
            max_length: Maximum length of formatted context

        Returns:
            Formatted context string
        """
        parts = []

        # Customer info section
        if context.customer_history:
            customer = context.customer_history
            parts.append(f"""## Customer Information
- Name: {customer.name or 'Unknown'}
- Subscription: {customer.subscription_tier or 'Free'}
- Account Age: {self._format_account_age(customer.account_created)}
- Previous Tickets: {customer.previous_tickets}
- Satisfaction Score: {customer.satisfaction_score or 'N/A'}/5
- Tags: {', '.join(customer.tags) if customer.tags else 'None'}""")

        # Account notes section
        if context.account_notes:
            parts.append("\n## Account Notes")
            for note in context.account_notes[:3]:
                parts.append(f"- {note}")

        # Active issues section
        if context.active_issues:
            parts.append("\n## Active Issues")
            for issue in context.active_issues[:3]:
                parts.append(f"- {issue}")

        # Relevant FAQs section
        if context.relevant_faqs:
            parts.append("\n## Relevant Knowledge Base Articles")
            for faq in context.relevant_faqs[:3]:
                parts.append(f"""
### {faq.question}
{faq.answer}
(Category: {faq.category}, Relevance: {faq.relevance_score:.0%})""")

        # Recent conversation context
        if context.recent_interactions:
            parts.append("\n## Recent Conversation Context")
            for turn in context.recent_interactions[-3:]:
                parts.append(f"Customer: {turn.user_message[:200]}...")
                parts.append(f"Agent: {turn.assistant_response[:200]}...")

        formatted = "\n".join(parts)

        # Truncate if too long
        if len(formatted) > max_length:
            formatted = formatted[:max_length-100] + "\n\n[Context truncated for length]"

        return formatted

    def _format_account_age(self, created_at: Optional[datetime]) -> str:
        """Format account age in human-readable form."""
        if not created_at:
            return "Unknown"

        days = (datetime.utcnow() - created_at).days

        if days < 30:
            return f"{days} days"
        elif days < 365:
            months = days // 30
            return f"{months} month{'s' if months > 1 else ''}"
        else:
            years = days // 365
            return f"{years} year{'s' if years > 1 else ''}"

    async def enrich_with_intent(
        self,
        context: KnowledgeContext,
        detected_intent: str
    ) -> KnowledgeContext:
        """
        Enrich context with additional information based on detected intent.

        Args:
            context: Existing knowledge context
            detected_intent: The detected user intent

        Returns:
            Enriched context
        """
        # Map intents to FAQ categories
        intent_category_map = {
            "billing_inquiry": "billing",
            "technical_support": "technical",
            "account_question": "account",
            "content_help": "content",
            "creator_inquiry": "creators",
            "brand_inquiry": "brands",
            "feature_question": "features",
        }

        category = intent_category_map.get(detected_intent)

        if category:
            # Add category-specific FAQs
            category_faqs = await self.faq_service.get_category_faqs(category)

            # Merge with existing FAQs, avoiding duplicates
            existing_ids = {faq.source_id for faq in context.relevant_faqs}
            for faq in category_faqs[:2]:
                if faq.source_id not in existing_ids:
                    context.relevant_faqs.append(faq)

        return context

    def clear_cache(self, customer_id: Optional[str] = None):
        """Clear cached customer data."""
        if customer_id:
            if customer_id in self.customer_cache:
                del self.customer_cache[customer_id]
            if customer_id in self.conversation_cache:
                del self.conversation_cache[customer_id]
        else:
            self.customer_cache.clear()
            self.conversation_cache.clear()
