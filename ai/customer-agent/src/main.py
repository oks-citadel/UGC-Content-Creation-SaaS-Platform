"""
NEXUS UGC Platform - Customer Agent Service
AI-powered customer support automation with conversational AI.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import httpx
import time
from typing import Optional

from .config import settings
from .models import (
    ChatRequest,
    ChatResponse,
    TicketAnalyzeRequest,
    TicketAnalyzeResponse,
    SuggestResponseRequest,
    SuggestResponseResponse,
    EscalateRequest,
    EscalateResponse,
    HealthResponse,
    HandoffReason,
    HandoffPriority,
)
from .agents import SupportAgent, TicketClassifier
from .agents.sales_agent import (
    sales_agent,
    SalesChatRequest,
    SalesChatResponse,
    LeadQualifyRequest,
    LeadQualifyResponse,
    ProductRecommendationRequest,
    ProductRecommendationResponse,
)
from .services.handoff_service import (
    handoff_service,
    HandoffRequest as ServiceHandoffRequest,
    HandoffResponse as ServiceHandoffResponse,
    TransferRequest,
    TransferResponse,
    HandoffStatusResponse,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Track service start time
start_time: float = 0


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    global start_time
    start_time = time.time()

    # Startup
    logger.info(f"Starting {settings.service_name} v{settings.version}")
    logger.info(f"LLM Provider: {settings.llm_provider}")
    logger.info(f"Vector DB: {settings.vector_db_type}")

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.service_name}")


# Initialize FastAPI app
app = FastAPI(
    title="NEXUS Customer Agent",
    description="AI-powered customer support automation with conversational AI, "
                "ticket classification, and smart response suggestions.",
    version=settings.version,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
support_agent = SupportAgent()
ticket_classifier = TicketClassifier()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.

    Returns service status and loaded model information.
    """
    uptime = time.time() - start_time if start_time else 0

    return HealthResponse(
        status="healthy",
        service=settings.service_name,
        version=settings.version,
        models_loaded={
            "support_agent": True,
            "ticket_classifier": True,
            "sentiment_analyzer": True,
            "faq_search": True,
            "llm_configured": bool(settings.openai_api_key or settings.anthropic_api_key)
        },
        uptime_seconds=uptime
    )


@app.post("/chat", response_model=ChatResponse)
async def handle_chat(request: ChatRequest):
    """
    Handle customer chat messages.

    Processes the customer message and generates an AI response with:
    - Context-aware replies using conversation history
    - Knowledge base integration (RAG)
    - Sentiment analysis
    - Escalation detection
    - Intent classification

    **Request Body:**
    - `message`: The customer's message
    - `conversation_id`: Optional ID to continue existing conversation
    - `customer_id`: Optional customer identifier for personalization
    - `channel`: Communication channel (chat, email, ticket, social)
    - `include_context`: Whether to use conversation history

    **Response:**
    - `response`: The AI-generated response
    - `confidence`: Confidence score of the response
    - `sentiment`: Detected customer sentiment
    - `requires_escalation`: Whether human handoff is needed
    - `suggested_actions`: Recommended next steps
    """
    try:
        logger.info(f"Chat request received: conversation={request.conversation_id}")
        result = await support_agent.chat(request)
        return result

    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ticket/analyze", response_model=TicketAnalyzeResponse)
async def analyze_ticket(request: TicketAnalyzeRequest):
    """
    Analyze and classify a support ticket.

    Uses AI to automatically categorize tickets and determine priority:
    - Category classification (billing, technical, account, etc.)
    - Priority assessment (low, medium, high, urgent)
    - Entity extraction (product names, error codes, etc.)
    - Sentiment analysis
    - Response suggestions

    **Request Body:**
    - `subject`: Ticket subject line
    - `description`: Full ticket description
    - `ticket_id`: Optional existing ticket ID
    - `customer_id`: Optional customer identifier

    **Response:**
    - `category`: Detected ticket category
    - `priority`: Recommended priority level
    - `confidence`: Classification confidence
    - `suggested_tags`: Auto-generated tags
    - `key_entities`: Extracted entities
    - `suggested_response`: Draft response suggestion
    """
    try:
        logger.info(f"Analyzing ticket: {request.ticket_id or 'new'}")
        result = await ticket_classifier.classify(request)
        return result

    except Exception as e:
        logger.error(f"Error in ticket/analyze endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/suggest-response", response_model=SuggestResponseResponse)
async def suggest_response(request: SuggestResponseRequest):
    """
    Generate response suggestions for human agents.

    Provides AI-generated response drafts based on:
    - Customer message analysis
    - Conversation history
    - Knowledge base search
    - Customer information

    **Request Body:**
    - `customer_message`: The message to respond to
    - `conversation_history`: Previous messages (optional)
    - `customer_info`: Customer details (optional)
    - `tone`: Response tone (professional, friendly, formal)
    - `max_suggestions`: Number of suggestions to generate

    **Response:**
    - `suggestions`: List of response drafts
    - `confidence_scores`: Confidence for each suggestion
    - `sources`: Knowledge base sources used
    """
    try:
        logger.info("Generating response suggestions")
        result = await support_agent.suggest_responses(request)
        return result

    except Exception as e:
        logger.error(f"Error in suggest-response endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/escalate", response_model=EscalateResponse)
async def escalate_conversation(request: EscalateRequest):
    """
    Trigger escalation workflow for a conversation.

    Initiates handoff to human agents with:
    - Notification to support team
    - Ticket creation (if needed)
    - Context summary generation
    - Priority routing

    **Request Body:**
    - `conversation_id`: The conversation to escalate
    - `customer_id`: Customer identifier (optional)
    - `reason`: Reason for escalation
    - `priority`: Escalation priority
    - `notes`: Additional notes for the agent

    **Response:**
    - `success`: Whether escalation was initiated
    - `escalation_id`: Unique escalation identifier
    - `assigned_team`: Team the escalation was routed to
    - `estimated_response_time`: Expected response time
    """
    try:
        logger.info(f"Escalating conversation: {request.conversation_id}")

        # Generate escalation ID
        import uuid
        escalation_id = f"ESC-{uuid.uuid4().hex[:8].upper()}"

        # Map reason to team
        team_mapping = {
            HandoffReason.CUSTOMER_REQUEST: "general_support",
            HandoffReason.SENTIMENT_ESCALATION: "senior_support",
            HandoffReason.COMPLEXITY: "technical_team",
            HandoffReason.POLICY_VIOLATION: "compliance_team",
            HandoffReason.SALES_OPPORTUNITY: "sales_team",
            HandoffReason.TECHNICAL_ISSUE: "technical_team",
        }
        assigned_team = team_mapping.get(request.reason, "general_support")

        # Map priority to response time
        response_times = {
            HandoffPriority.URGENT: "< 15 minutes",
            HandoffPriority.HIGH: "< 1 hour",
            HandoffPriority.MEDIUM: "< 4 hours",
            HandoffPriority.LOW: "< 24 hours",
        }
        estimated_time = response_times.get(request.priority, "< 4 hours")

        # Try to notify notification service
        notification_sent = await _send_escalation_notification(
            escalation_id,
            request,
            assigned_team
        )

        # Create ticket if high priority
        ticket_created = False
        ticket_id = None
        if request.priority in [HandoffPriority.URGENT, HandoffPriority.HIGH]:
            ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
            ticket_created = True

        return EscalateResponse(
            success=True,
            escalation_id=escalation_id,
            assigned_team=assigned_team,
            estimated_response_time=estimated_time,
            ticket_created=ticket_created,
            ticket_id=ticket_id,
            message=f"Escalation initiated. A {assigned_team.replace('_', ' ')} member will respond within {estimated_time}."
        )

    except Exception as e:
        logger.error(f"Error in escalate endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


async def _send_escalation_notification(
    escalation_id: str,
    request: EscalateRequest,
    assigned_team: str
) -> bool:
    """Send notification to notification service."""
    try:
        async with httpx.AsyncClient() as client:
            notification_payload = {
                "type": "escalation",
                "priority": request.priority.value,
                "recipient": assigned_team,
                "data": {
                    "escalation_id": escalation_id,
                    "conversation_id": request.conversation_id,
                    "customer_id": request.customer_id,
                    "reason": request.reason.value,
                    "notes": request.notes
                }
            }

            response = await client.post(
                f"{settings.notification_service_url}/notifications/send",
                json=notification_payload,
                timeout=5.0
            )

            return response.status_code == 200

    except Exception as e:
        logger.warning(f"Failed to send escalation notification: {str(e)}")
        return False


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": settings.service_name,
        "version": settings.version,
        "status": "running",
        "docs": "/docs",
        "capabilities": [
            "conversational_ai",
            "ticket_classification",
            "sentiment_analysis",
            "knowledge_base_rag",
            "response_suggestions",
            "escalation_detection",
            "multi_turn_conversations"
        ],
        "endpoints": {
            "chat": "POST /chat - Handle customer chat messages",
            "ticket_analyze": "POST /ticket/analyze - Classify support tickets",
            "suggest_response": "POST /suggest-response - Generate response suggestions",
            "escalate": "POST /escalate - Trigger escalation workflow",
            "health": "GET /health - Service health check"
        },
        "llm_provider": settings.llm_provider,
        "configured": bool(settings.openai_api_key or settings.anthropic_api_key)
    }


@app.get("/conversation/{conversation_id}")
async def get_conversation(conversation_id: str):
    """
    Get conversation history.

    Retrieves the message history for a specific conversation.
    """
    history = support_agent.get_conversation_history(conversation_id)

    if history is None:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {
        "conversation_id": conversation_id,
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
            }
            for msg in history
        ],
        "message_count": len(history)
    }


@app.delete("/conversation/{conversation_id}")
async def clear_conversation(conversation_id: str):
    """
    Clear conversation history.

    Removes all messages from a conversation.
    """
    support_agent.clear_conversation(conversation_id)
    return {"message": f"Conversation {conversation_id} cleared"}


# ============================================
# Sales Agent Endpoints
# ============================================

@app.post("/agent/sales/chat", response_model=SalesChatResponse)
async def sales_chat(request: SalesChatRequest):
    """
    Handle sales chat inquiries.

    Processes sales-related messages and provides product information,
    pricing details, and guides prospects through the sales funnel.
    """
    try:
        logger.info(f"Sales chat request: conversation={request.conversation_id}")
        result = await sales_agent.chat(request)
        return result
    except Exception as e:
        logger.error(f"Error in sales chat: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/sales/qualify", response_model=LeadQualifyResponse)
async def qualify_lead(request: LeadQualifyRequest):
    """
    Qualify a sales lead using BANT criteria.

    Analyzes lead information to score and qualify prospects:
    - Budget: Can they afford the solution?
    - Authority: Are they a decision maker?
    - Need: Do they have a genuine need?
    - Timeline: When do they plan to buy?
    """
    try:
        logger.info(f"Lead qualification request: customer={request.customer_id}")
        result = await sales_agent.qualify_lead(request)
        return result
    except Exception as e:
        logger.error(f"Error in lead qualification: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/sales/recommendations", response_model=ProductRecommendationResponse)
async def get_recommendations(request: ProductRecommendationRequest):
    """
    Get product recommendations based on customer needs.

    Analyzes customer requirements and suggests the best-fit products
    from the catalog.
    """
    try:
        logger.info("Product recommendation request")
        result = await sales_agent.get_recommendations(request)
        return result
    except Exception as e:
        logger.error(f"Error in recommendations: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Handoff Service Endpoints
# ============================================

@app.post("/agent/handoff/request", response_model=ServiceHandoffResponse)
async def request_handoff(request: ServiceHandoffRequest):
    """
    Request a handoff to a human agent.

    Initiates the transfer process to connect the customer with
    a human support agent based on reason and priority.
    """
    try:
        logger.info(f"Handoff request: conversation={request.conversation_id}, reason={request.reason}")
        result = await handoff_service.request_handoff(request)
        return result
    except Exception as e:
        logger.error(f"Error in handoff request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/handoff/transfer", response_model=TransferResponse)
async def transfer_handoff(request: TransferRequest):
    """
    Transfer a handoff to another agent or team.

    Allows reassigning an existing handoff to a different agent
    or team for specialized handling.
    """
    try:
        logger.info(f"Transfer request: handoff={request.handoff_id}")
        result = await handoff_service.transfer(request)
        return result
    except Exception as e:
        logger.error(f"Error in transfer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/agent/handoff/status/{handoff_id}", response_model=HandoffStatusResponse)
async def get_handoff_status(handoff_id: str):
    """
    Get the status of a handoff request.

    Returns current queue position, estimated wait time,
    and assigned agent information.
    """
    try:
        result = await handoff_service.get_status(handoff_id)
        if not result:
            raise HTTPException(status_code=404, detail="Handoff not found")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting handoff status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/handoff/{handoff_id}/complete")
async def complete_handoff(handoff_id: str, resolution_notes: Optional[str] = None):
    """
    Mark a handoff as completed.
    """
    try:
        success = await handoff_service.complete_handoff(handoff_id, resolution_notes)
        if not success:
            raise HTTPException(status_code=404, detail="Handoff not found")
        return {"success": True, "message": "Handoff completed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing handoff: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/handoff/{handoff_id}/cancel")
async def cancel_handoff(handoff_id: str, reason: Optional[str] = None):
    """
    Cancel a handoff request.
    """
    try:
        success = await handoff_service.cancel_handoff(handoff_id, reason)
        if not success:
            raise HTTPException(status_code=404, detail="Handoff not found")
        return {"success": True, "message": "Handoff cancelled"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling handoff: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8004,
        reload=settings.debug
    )
