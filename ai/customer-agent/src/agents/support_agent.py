"""Main support agent with context-aware responses."""

import logging
import json
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from ..config import settings
from ..models import (
    ChatRequest,
    ChatResponse,
    Message,
    SentimentLevel,
    ConversationContext,
    CustomerInfo,
    SuggestResponseRequest,
    SuggestResponseResponse,
    HandoffReason,
)
from ..knowledge import FAQSearchService, ContextBuilder
from ..utils import SentimentAnalyzer

logger = logging.getLogger(__name__)


class SupportAgent:
    """
    Main AI support agent that handles customer conversations with
    context-aware responses, RAG, and escalation detection.
    """

    def __init__(self):
        self.openai_client: Optional[AsyncOpenAI] = None
        self.anthropic_client: Optional[AsyncAnthropic] = None
        self.faq_service = FAQSearchService()
        self.context_builder = ContextBuilder(self.faq_service)
        self.sentiment_analyzer = SentimentAnalyzer()

        # Conversation memory (in production, use Redis)
        self.conversations: Dict[str, ConversationContext] = {}

        # System prompt for the agent
        self.system_prompt = """You are a helpful customer support agent for CreatorBridge, a UGC (User-Generated Content) platform that connects creators with brands.

Your role is to:
1. Help customers with their questions about the platform
2. Assist with billing, technical, and account issues
3. Provide guidance on using platform features
4. Be empathetic and professional at all times

Guidelines:
- Be concise but thorough in your responses
- If you don't know something, admit it and offer to escalate
- Use the provided context and FAQ information when available
- Detect when a customer needs human assistance
- Always maintain a helpful and positive tone

Platform Information:
- CreatorBridge helps creators monetize content and connect with brands
- Features include: content creation tools, analytics, brand marketplace, payments
- Subscription tiers: Free, Pro ($29/mo), Business ($99/mo), Enterprise (custom)

When responding:
- Address the customer's specific concern first
- Provide step-by-step instructions when helpful
- Offer additional assistance at the end"""

    async def _initialize_clients(self):
        """Initialize LLM clients if not already done."""
        if settings.llm_provider == "openai" and not self.openai_client:
            if settings.openai_api_key:
                self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)

        if settings.llm_provider == "anthropic" and not self.anthropic_client:
            if settings.anthropic_api_key:
                self.anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Handle a customer chat message and generate a response.

        Args:
            request: The chat request with message and context

        Returns:
            ChatResponse with the agent's reply
        """
        try:
            await self._initialize_clients()

            # Get or create conversation context
            conversation_id = request.conversation_id or str(uuid.uuid4())
            context = self._get_or_create_context(conversation_id, request.customer_id)

            # Add user message to context
            user_message = Message(
                role="user",
                content=request.message,
                timestamp=datetime.utcnow()
            )
            context.messages.append(user_message)

            # Analyze sentiment
            sentiment_result = await self.sentiment_analyzer.analyze(request.message)
            context.sentiment_score = sentiment_result.score
            context.escalation_risk = self._calculate_escalation_risk(context, sentiment_result)

            # Build knowledge context
            knowledge_context = await self.context_builder.build_context(
                customer_id=request.customer_id,
                current_message=request.message,
                conversation_history=context.messages if request.include_context else None
            )

            # Check for escalation triggers
            should_escalate, escalation_reason = self.sentiment_analyzer.should_escalate(sentiment_result)

            # Also check conversation length
            if len(context.messages) > settings.max_conversation_turns_before_escalation * 2:
                should_escalate = True
                escalation_reason = "Extended conversation without resolution"

            # Generate response
            response_text, detected_intent, sources = await self._generate_response(
                context,
                knowledge_context,
                request.message
            )

            # Add assistant message to context
            assistant_message = Message(
                role="assistant",
                content=response_text,
                timestamp=datetime.utcnow()
            )
            context.messages.append(assistant_message)

            # Update context
            context.current_intent = detected_intent
            self.conversations[conversation_id] = context

            # Generate suggested actions
            suggested_actions = self._generate_suggested_actions(
                detected_intent,
                sentiment_result.level,
                should_escalate
            )

            return ChatResponse(
                conversation_id=conversation_id,
                response=response_text,
                confidence=0.85 if self.openai_client or self.anthropic_client else 0.6,
                intent=detected_intent,
                sentiment=sentiment_result.level,
                requires_escalation=should_escalate,
                escalation_reason=escalation_reason if should_escalate else None,
                suggested_actions=suggested_actions,
                sources=sources
            )

        except Exception as e:
            logger.error(f"Error in chat: {str(e)}", exc_info=True)
            return ChatResponse(
                conversation_id=request.conversation_id or str(uuid.uuid4()),
                response="I apologize, but I'm having trouble processing your request right now. Let me connect you with a human agent who can help you better.",
                confidence=0.0,
                intent=None,
                sentiment=SentimentLevel.NEUTRAL,
                requires_escalation=True,
                escalation_reason="System error",
                suggested_actions=["Connect to human agent"],
                sources=[]
            )

    async def suggest_responses(
        self,
        request: SuggestResponseRequest
    ) -> SuggestResponseResponse:
        """
        Generate response suggestions for human agents.

        Args:
            request: The suggestion request

        Returns:
            SuggestResponseResponse with multiple response options
        """
        try:
            await self._initialize_clients()

            # Build context
            knowledge_context = await self.context_builder.build_context(
                customer_id=None,
                current_message=request.customer_message,
                conversation_history=request.conversation_history
            )

            # Format context for prompt
            context_text = self.context_builder.format_context_for_prompt(knowledge_context)

            suggestions = []
            confidence_scores = []
            sources = []

            # Add sources from FAQs
            for faq in knowledge_context.relevant_faqs:
                sources.append(faq.source_id)

            # Generate suggestions using AI
            if self.openai_client or self.anthropic_client:
                suggestions, confidence_scores = await self._generate_suggestions_ai(
                    request.customer_message,
                    context_text,
                    request.tone,
                    request.max_suggestions
                )
            else:
                # Fallback to template-based suggestions
                suggestions = self._generate_template_suggestions(
                    request.customer_message,
                    knowledge_context
                )
                confidence_scores = [0.5] * len(suggestions)

            return SuggestResponseResponse(
                suggestions=suggestions[:request.max_suggestions],
                confidence_scores=confidence_scores[:request.max_suggestions],
                sources=sources,
                context_used=len(knowledge_context.relevant_faqs) > 0
            )

        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}", exc_info=True)
            return SuggestResponseResponse(
                suggestions=["Thank you for your message. Let me look into this for you."],
                confidence_scores=[0.3],
                sources=[],
                context_used=False
            )

    async def _generate_response(
        self,
        context: ConversationContext,
        knowledge_context: Any,
        current_message: str
    ) -> tuple[str, Optional[str], List[str]]:
        """Generate a response using the LLM."""
        try:
            # Format knowledge context
            context_text = self.context_builder.format_context_for_prompt(knowledge_context)

            # Build conversation messages
            messages = [{"role": "system", "content": self.system_prompt}]

            # Add context as system message if available
            if context_text:
                messages.append({
                    "role": "system",
                    "content": f"Relevant context for this conversation:\n{context_text}"
                })

            # Add conversation history (last 10 messages)
            for msg in context.messages[-10:]:
                messages.append({"role": msg.role, "content": msg.content})

            # Detect intent
            intent = self._detect_intent(current_message)

            sources = [faq.source_id for faq in knowledge_context.relevant_faqs]

            if settings.llm_provider == "openai" and self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model=settings.openai_model,
                    messages=messages,
                    temperature=settings.temperature,
                    max_tokens=settings.max_tokens
                )
                return response.choices[0].message.content, intent, sources

            elif settings.llm_provider == "anthropic" and self.anthropic_client:
                # Convert to Anthropic format
                anthropic_messages = []
                system_content = self.system_prompt
                if context_text:
                    system_content += f"\n\nRelevant context:\n{context_text}"

                for msg in context.messages[-10:]:
                    anthropic_messages.append({
                        "role": msg.role if msg.role in ["user", "assistant"] else "user",
                        "content": msg.content
                    })

                response = await self.anthropic_client.messages.create(
                    model=settings.anthropic_model,
                    max_tokens=settings.max_tokens,
                    system=system_content,
                    messages=anthropic_messages
                )
                return response.content[0].text, intent, sources

            else:
                # Fallback response using FAQ if available
                if knowledge_context.relevant_faqs:
                    best_faq = knowledge_context.relevant_faqs[0]
                    return (
                        f"Based on your question, here's what I found:\n\n{best_faq.answer}\n\nIs there anything else I can help you with?",
                        intent,
                        [best_faq.source_id]
                    )
                else:
                    return (
                        "Thank you for your message. I'm processing your request. A team member will follow up shortly if needed. Is there anything specific I can help you with?",
                        intent,
                        []
                    )

        except Exception as e:
            logger.error(f"Error generating response: {str(e)}", exc_info=True)
            return (
                "I apologize for the inconvenience. Let me connect you with a specialist who can better assist you.",
                None,
                []
            )

    async def _generate_suggestions_ai(
        self,
        customer_message: str,
        context_text: str,
        tone: str,
        num_suggestions: int
    ) -> tuple[List[str], List[float]]:
        """Generate suggestions using AI."""
        prompt = f"""Generate {num_suggestions} different response suggestions for a customer support agent.

Customer Message: {customer_message}

Context:
{context_text}

Tone: {tone}

Generate {num_suggestions} distinct response options, each with a different approach:
1. Direct and concise
2. Detailed and explanatory
3. Empathetic and understanding

Respond in JSON format:
{{
    "suggestions": ["response1", "response2", "response3"],
    "confidence": [0.9, 0.8, 0.7]
}}"""

        try:
            if settings.llm_provider == "openai" and self.openai_client:
                response = await self.openai_client.chat.completions.create(
                    model=settings.openai_model,
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that generates customer support response suggestions. Always respond with valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=1000
                )
                result_text = response.choices[0].message.content

            elif settings.llm_provider == "anthropic" and self.anthropic_client:
                response = await self.anthropic_client.messages.create(
                    model=settings.anthropic_model,
                    max_tokens=1000,
                    messages=[{"role": "user", "content": prompt}]
                )
                result_text = response.content[0].text
            else:
                return [], []

            # Parse JSON response
            import re
            json_match = re.search(r'\{[\s\S]*\}', result_text)
            if json_match:
                result = json.loads(json_match.group())
                return result.get("suggestions", []), result.get("confidence", [])

            return [], []

        except Exception as e:
            logger.error(f"Error generating AI suggestions: {str(e)}")
            return [], []

    def _generate_template_suggestions(
        self,
        customer_message: str,
        knowledge_context: Any
    ) -> List[str]:
        """Generate template-based suggestions as fallback."""
        suggestions = []

        # Use FAQ if available
        if knowledge_context.relevant_faqs:
            faq = knowledge_context.relevant_faqs[0]
            suggestions.append(
                f"Thank you for reaching out! {faq.answer}"
            )

        # Generic helpful responses
        suggestions.extend([
            "Thank you for contacting us. I understand your concern and I'm here to help. Let me look into this for you right away.",
            "I appreciate you reaching out. I'll do my best to assist you with this matter. Could you please provide a bit more detail?",
            "Thank you for your patience. I'm reviewing your request and will get back to you with a solution shortly."
        ])

        return suggestions[:3]

    def _get_or_create_context(
        self,
        conversation_id: str,
        customer_id: Optional[str]
    ) -> ConversationContext:
        """Get existing conversation context or create new one."""
        if conversation_id in self.conversations:
            return self.conversations[conversation_id]

        context = ConversationContext(
            conversation_id=conversation_id,
            customer_id=customer_id,
            messages=[],
            entities={},
            sentiment_score=0.0,
            escalation_risk=0.0
        )

        self.conversations[conversation_id] = context
        return context

    def _calculate_escalation_risk(
        self,
        context: ConversationContext,
        sentiment_result: Any
    ) -> float:
        """Calculate overall escalation risk."""
        risk = 0.0

        # Sentiment-based risk
        if sentiment_result.score < 0:
            risk += abs(sentiment_result.score) * 0.4

        # Trigger-based risk
        if len(sentiment_result.escalation_triggers) > 0:
            risk += min(0.4, len(sentiment_result.escalation_triggers) * 0.15)

        # Conversation length risk
        turns = len([m for m in context.messages if m.role == "user"])
        if turns > 5:
            risk += min(0.2, (turns - 5) * 0.04)

        return min(1.0, risk)

    def _detect_intent(self, message: str) -> Optional[str]:
        """Simple intent detection."""
        message_lower = message.lower()

        intent_patterns = {
            "billing_inquiry": ["billing", "payment", "charge", "invoice", "subscription", "refund", "pricing"],
            "technical_support": ["error", "bug", "not working", "broken", "crash", "issue", "problem"],
            "account_question": ["account", "password", "login", "profile", "settings", "email"],
            "content_help": ["upload", "video", "content", "post", "publish", "caption"],
            "feature_question": ["how to", "how do i", "can i", "feature", "tutorial"],
            "cancellation": ["cancel", "unsubscribe", "stop", "end subscription"],
            "upgrade_interest": ["upgrade", "pro plan", "business plan", "more features"],
            "feedback": ["feedback", "suggestion", "improve", "idea"],
            "greeting": ["hello", "hi", "hey", "good morning", "good afternoon"],
        }

        for intent, keywords in intent_patterns.items():
            if any(kw in message_lower for kw in keywords):
                return intent

        return "general_inquiry"

    def _generate_suggested_actions(
        self,
        intent: Optional[str],
        sentiment: SentimentLevel,
        requires_escalation: bool
    ) -> List[str]:
        """Generate suggested next actions."""
        actions = []

        if requires_escalation:
            actions.append("Transfer to human agent")
            actions.append("Create support ticket")

        if intent == "billing_inquiry":
            actions.append("Review billing history")
            actions.append("Check subscription status")

        if intent == "technical_support":
            actions.append("Check system status")
            actions.append("Create bug report")

        if intent == "cancellation":
            actions.append("Offer retention deal")
            actions.append("Process cancellation request")

        if sentiment in [SentimentLevel.VERY_NEGATIVE, SentimentLevel.NEGATIVE]:
            actions.append("Offer compensation")
            actions.append("Schedule callback")

        if not actions:
            actions.append("Continue conversation")
            actions.append("Mark as resolved")

        return actions[:4]

    def clear_conversation(self, conversation_id: str):
        """Clear conversation history."""
        if conversation_id in self.conversations:
            del self.conversations[conversation_id]

    def get_conversation_history(
        self,
        conversation_id: str
    ) -> Optional[List[Message]]:
        """Get conversation history."""
        if conversation_id in self.conversations:
            return self.conversations[conversation_id].messages
        return None
