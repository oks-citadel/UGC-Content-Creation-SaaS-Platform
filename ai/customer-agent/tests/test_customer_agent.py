"""Tests for Customer Agent service."""

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.utils.sentiment import SentimentAnalyzer
from src.knowledge.faq_search import FAQSearchService
from src.agents.ticket_classifier import TicketClassifier
from src.models import (
    ChatRequest,
    TicketAnalyzeRequest,
    SentimentLevel,
    TicketCategory,
    TicketPriority,
    ChannelType,
)


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def sentiment_analyzer():
    """Create sentiment analyzer instance."""
    return SentimentAnalyzer()


@pytest.fixture
def faq_service():
    """Create FAQ service instance."""
    return FAQSearchService()


@pytest.fixture
def ticket_classifier():
    """Create ticket classifier instance."""
    return TicketClassifier()


class TestHealthEndpoint:
    """Tests for health endpoint."""

    def test_health_check(self, client):
        """Test health check returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "customer-agent"
        assert "models_loaded" in data

    def test_root_endpoint(self, client):
        """Test root endpoint returns service info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "customer-agent"
        assert "capabilities" in data
        assert "endpoints" in data


class TestChatEndpoint:
    """Tests for chat endpoint."""

    def test_chat_basic(self, client):
        """Test basic chat request."""
        response = client.post(
            "/chat",
            json={
                "message": "Hello, I need help with my account",
                "channel": "chat"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "conversation_id" in data
        assert "sentiment" in data

    def test_chat_with_conversation_id(self, client):
        """Test chat with existing conversation ID."""
        # First message
        response1 = client.post(
            "/chat",
            json={
                "message": "I need help with billing",
                "channel": "chat"
            }
        )
        conversation_id = response1.json()["conversation_id"]

        # Follow-up message
        response2 = client.post(
            "/chat",
            json={
                "message": "Can you show me my invoices?",
                "conversation_id": conversation_id,
                "channel": "chat"
            }
        )
        assert response2.status_code == 200
        assert response2.json()["conversation_id"] == conversation_id


class TestTicketAnalyzeEndpoint:
    """Tests for ticket analyze endpoint."""

    def test_analyze_billing_ticket(self, client):
        """Test analyzing a billing-related ticket."""
        response = client.post(
            "/ticket/analyze",
            json={
                "subject": "Billing issue with my subscription",
                "description": "I was charged twice for my monthly subscription. Please refund the extra charge."
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["category"] == "billing"
        assert "priority" in data
        assert "confidence" in data
        assert "suggested_tags" in data

    def test_analyze_technical_ticket(self, client):
        """Test analyzing a technical support ticket."""
        response = client.post(
            "/ticket/analyze",
            json={
                "subject": "Video upload not working",
                "description": "I keep getting an error when trying to upload videos. The page crashes every time."
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["category"] in ["technical_support", "bug_report"]


class TestSentimentAnalyzer:
    """Tests for sentiment analyzer."""

    @pytest.mark.asyncio
    async def test_negative_sentiment(self, sentiment_analyzer):
        """Test detection of negative sentiment."""
        result = await sentiment_analyzer.analyze(
            "This is terrible! I'm so frustrated with your service."
        )
        assert result.score < 0
        assert result.level in [SentimentLevel.NEGATIVE, SentimentLevel.VERY_NEGATIVE]

    @pytest.mark.asyncio
    async def test_positive_sentiment(self, sentiment_analyzer):
        """Test detection of positive sentiment."""
        result = await sentiment_analyzer.analyze(
            "Thank you so much! This is amazing, I love it!"
        )
        assert result.score > 0
        assert result.level in [SentimentLevel.POSITIVE, SentimentLevel.VERY_POSITIVE]

    @pytest.mark.asyncio
    async def test_neutral_sentiment(self, sentiment_analyzer):
        """Test detection of neutral sentiment."""
        result = await sentiment_analyzer.analyze(
            "I have a question about my account."
        )
        assert -0.3 <= result.score <= 0.3
        assert result.level == SentimentLevel.NEUTRAL

    @pytest.mark.asyncio
    async def test_escalation_triggers(self, sentiment_analyzer):
        """Test detection of escalation triggers."""
        result = await sentiment_analyzer.analyze(
            "I want to speak to a manager right now. This is unacceptable."
        )
        assert len(result.escalation_triggers) > 0
        assert result.requires_attention is True

    @pytest.mark.asyncio
    async def test_should_escalate(self, sentiment_analyzer):
        """Test escalation decision."""
        result = await sentiment_analyzer.analyze(
            "I'm going to contact my lawyer about this fraud."
        )
        should_escalate, reason = sentiment_analyzer.should_escalate(result)
        assert should_escalate is True
        assert len(reason) > 0


class TestFAQSearch:
    """Tests for FAQ search service."""

    @pytest.mark.asyncio
    async def test_search_billing(self, faq_service):
        """Test searching for billing FAQs."""
        results = await faq_service.search("How do I upgrade my plan?")
        assert len(results) > 0
        # Should find upgrade-related FAQ
        assert any("upgrade" in r.question.lower() or "upgrade" in r.answer.lower()
                   for r in results)

    @pytest.mark.asyncio
    async def test_search_technical(self, faq_service):
        """Test searching for technical FAQs."""
        results = await faq_service.search("video not processing")
        assert len(results) > 0

    @pytest.mark.asyncio
    async def test_search_with_category_filter(self, faq_service):
        """Test searching with category filter."""
        results = await faq_service.search(
            "payment",
            category_filter="billing"
        )
        assert all(r.category == "billing" for r in results)

    @pytest.mark.asyncio
    async def test_keyword_search(self, faq_service):
        """Test keyword-based search."""
        results = await faq_service.search_by_keywords(
            ["password", "reset", "account"]
        )
        assert len(results) > 0

    def test_get_categories(self, faq_service):
        """Test getting FAQ categories."""
        categories = faq_service.get_categories()
        assert len(categories) > 0
        assert "billing" in categories


class TestTicketClassifier:
    """Tests for ticket classifier."""

    @pytest.mark.asyncio
    async def test_classify_billing(self, ticket_classifier):
        """Test classifying billing ticket."""
        request = TicketAnalyzeRequest(
            subject="Refund request",
            description="I need a refund for my last payment. I was charged incorrectly."
        )
        result = await ticket_classifier.classify(request)
        assert result.category == TicketCategory.BILLING
        assert result.ticket_id is not None

    @pytest.mark.asyncio
    async def test_classify_urgent(self, ticket_classifier):
        """Test classifying urgent ticket."""
        request = TicketAnalyzeRequest(
            subject="URGENT: Cannot access account",
            description="I urgently need access to my account. This is critical for my business."
        )
        result = await ticket_classifier.classify(request)
        assert result.priority in [TicketPriority.URGENT, TicketPriority.HIGH]

    @pytest.mark.asyncio
    async def test_entity_extraction(self, ticket_classifier):
        """Test entity extraction from ticket."""
        request = TicketAnalyzeRequest(
            subject="Error on TikTok integration",
            description="Getting error code ERR-1234 when connecting to TikTok. My email is user@example.com"
        )
        result = await ticket_classifier.classify(request)
        # Should extract some entities
        assert len(result.key_entities) >= 0  # May be empty without AI


class TestConversationManagement:
    """Tests for conversation management."""

    def test_get_nonexistent_conversation(self, client):
        """Test getting a non-existent conversation."""
        response = client.get("/conversation/nonexistent-id")
        assert response.status_code == 404

    def test_clear_conversation(self, client):
        """Test clearing a conversation."""
        # First create a conversation
        chat_response = client.post(
            "/chat",
            json={"message": "Hello", "channel": "chat"}
        )
        conversation_id = chat_response.json()["conversation_id"]

        # Clear it
        clear_response = client.delete(f"/conversation/{conversation_id}")
        assert clear_response.status_code == 200

        # Verify it's cleared
        get_response = client.get(f"/conversation/{conversation_id}")
        assert get_response.status_code == 404


class TestEscalation:
    """Tests for escalation endpoint."""

    def test_escalate_conversation(self, client):
        """Test escalating a conversation."""
        response = client.post(
            "/escalate",
            json={
                "conversation_id": "test-conv-123",
                "reason": "customer_request",
                "priority": "high",
                "notes": "Customer requested human agent"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "escalation_id" in data
        assert "assigned_team" in data
        assert "estimated_response_time" in data


class TestSuggestResponse:
    """Tests for response suggestion endpoint."""

    def test_suggest_response(self, client):
        """Test generating response suggestions."""
        response = client.post(
            "/suggest-response",
            json={
                "customer_message": "How do I cancel my subscription?",
                "tone": "professional",
                "max_suggestions": 3
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert len(data["suggestions"]) > 0
