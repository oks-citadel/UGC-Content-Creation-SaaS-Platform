from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class AgentType(str, Enum):
    SALES = "sales"
    SUPPORT = "support"
    HYBRID = "hybrid"


class ChannelType(str, Enum):
    CHAT = "chat"
    EMAIL = "email"
    TICKET = "ticket"
    SOCIAL = "social"


class ConversationStatus(str, Enum):
    ACTIVE = "active"
    WAITING = "waiting"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"


class HandoffReason(str, Enum):
    CUSTOMER_REQUEST = "customer_request"
    SENTIMENT_ESCALATION = "sentiment_escalation"
    COMPLEXITY = "complexity"
    POLICY_VIOLATION = "policy_violation"
    SALES_OPPORTUNITY = "sales_opportunity"
    TECHNICAL_ISSUE = "technical_issue"


class HandoffPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketCategory(str, Enum):
    BILLING = "billing"
    TECHNICAL_SUPPORT = "technical_support"
    ACCOUNT_MANAGEMENT = "account_management"
    CONTENT_ISSUES = "content_issues"
    PLATFORM_FEATURES = "platform_features"
    PARTNERSHIP_INQUIRY = "partnership_inquiry"
    BUG_REPORT = "bug_report"
    FEATURE_REQUEST = "feature_request"
    GENERAL_INQUIRY = "general_inquiry"


class SentimentLevel(str, Enum):
    VERY_NEGATIVE = "very_negative"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    POSITIVE = "positive"
    VERY_POSITIVE = "very_positive"


class Message(BaseModel):
    role: str  # "user", "assistant", "system"
    content: str
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class ConversationContext(BaseModel):
    conversation_id: str
    customer_id: Optional[str] = None
    messages: List[Message] = []
    current_intent: Optional[str] = None
    entities: Dict[str, Any] = {}
    sentiment_score: float = 0.0
    escalation_risk: float = 0.0


class ConversationTurn(BaseModel):
    user_message: str
    assistant_response: str
    intent: Optional[str] = None
    sentiment: Optional[float] = None
    timestamp: datetime


class CustomerInfo(BaseModel):
    customer_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    subscription_tier: Optional[str] = None
    account_created: Optional[datetime] = None
    total_spend: Optional[float] = None
    previous_tickets: int = 0
    satisfaction_score: Optional[float] = None
    tags: List[str] = []


class AgentResponse(BaseModel):
    message: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    intent_detected: Optional[str] = None
    entities_extracted: Dict[str, Any] = {}
    suggested_actions: List[str] = []
    requires_escalation: bool = False
    escalation_reason: Optional[str] = None
    knowledge_sources: List[str] = []


class HandoffRequest(BaseModel):
    conversation_id: str
    customer_id: Optional[str] = None
    reason: HandoffReason
    priority: HandoffPriority
    context_summary: str
    conversation_history: List[Message]
    customer_info: Optional[CustomerInfo] = None
    suggested_agent_skills: List[str] = []


class HandoffResult(BaseModel):
    success: bool
    handoff_id: Optional[str] = None
    assigned_agent_id: Optional[str] = None
    estimated_wait_time: Optional[int] = None  # in minutes
    queue_position: Optional[int] = None
    message: str


class ChannelConfig(BaseModel):
    channel_type: ChannelType
    welcome_message: Optional[str] = None
    auto_response_enabled: bool = True
    escalation_threshold: float = 0.7
    max_auto_responses: int = 5


class RoutingRequest(BaseModel):
    conversation_id: str
    customer_id: Optional[str] = None
    channel: ChannelType
    initial_message: str
    customer_info: Optional[CustomerInfo] = None


class RoutingResult(BaseModel):
    agent_type: AgentType
    confidence: float
    reasoning: str
    suggested_greeting: str


class SalesIntent(BaseModel):
    intent_type: str  # "upgrade", "new_feature", "pricing", "demo"
    confidence: float
    product_interest: Optional[str] = None
    budget_signals: Optional[str] = None
    urgency_level: str = "medium"


class SupportTicket(BaseModel):
    ticket_id: str
    customer_id: Optional[str] = None
    subject: str
    description: str
    category: Optional[TicketCategory] = None
    priority: Optional[TicketPriority] = None
    status: str = "open"
    created_at: datetime
    updated_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    tags: List[str] = []


class AgentMetrics(BaseModel):
    total_conversations: int = 0
    resolved_without_escalation: int = 0
    average_response_time: float = 0.0  # in seconds
    customer_satisfaction: float = 0.0
    escalation_rate: float = 0.0


# API Request/Response Models
class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    customer_id: Optional[str] = None
    message: str
    channel: ChannelType = ChannelType.CHAT
    include_context: bool = True
    metadata: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    conversation_id: str
    response: str
    confidence: float
    intent: Optional[str] = None
    sentiment: SentimentLevel
    requires_escalation: bool = False
    escalation_reason: Optional[str] = None
    suggested_actions: List[str] = []
    sources: List[str] = []


class TicketAnalyzeRequest(BaseModel):
    ticket_id: Optional[str] = None
    subject: str
    description: str
    customer_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class TicketAnalyzeResponse(BaseModel):
    ticket_id: str
    category: TicketCategory
    priority: TicketPriority
    confidence: float
    suggested_tags: List[str]
    key_entities: Dict[str, Any]
    sentiment: SentimentLevel
    similar_tickets: List[str] = []
    suggested_response: Optional[str] = None
    estimated_resolution_time: Optional[str] = None


class SuggestResponseRequest(BaseModel):
    conversation_id: Optional[str] = None
    customer_message: str
    conversation_history: Optional[List[Message]] = None
    customer_info: Optional[CustomerInfo] = None
    tone: str = "professional"  # professional, friendly, formal
    max_suggestions: int = 3


class SuggestResponseResponse(BaseModel):
    suggestions: List[str]
    confidence_scores: List[float]
    sources: List[str]
    context_used: bool


class EscalateRequest(BaseModel):
    conversation_id: str
    customer_id: Optional[str] = None
    reason: HandoffReason
    priority: HandoffPriority = HandoffPriority.MEDIUM
    notes: Optional[str] = None
    conversation_history: Optional[List[Message]] = None


class EscalateResponse(BaseModel):
    success: bool
    escalation_id: str
    assigned_team: Optional[str] = None
    estimated_response_time: Optional[str] = None
    ticket_created: bool = False
    ticket_id: Optional[str] = None
    message: str


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    models_loaded: Dict[str, bool]
    uptime_seconds: Optional[float] = None


class FAQSearchResult(BaseModel):
    question: str
    answer: str
    category: str
    relevance_score: float
    source_id: str


class KnowledgeContext(BaseModel):
    customer_history: Optional[CustomerInfo] = None
    recent_interactions: List[ConversationTurn] = []
    relevant_faqs: List[FAQSearchResult] = []
    account_notes: List[str] = []
    active_issues: List[str] = []


class SentimentAnalysisResult(BaseModel):
    score: float = Field(..., ge=-1.0, le=1.0)
    level: SentimentLevel
    confidence: float
    emotions: Dict[str, float] = {}
    escalation_triggers: List[str] = []
    requires_attention: bool = False
