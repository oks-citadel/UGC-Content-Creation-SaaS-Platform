"""
Sales Agent for handling sales inquiries, lead qualification, and recommendations.
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from enum import Enum
import logging
import uuid
from datetime import datetime

from ..config import settings

logger = logging.getLogger(__name__)


class SalesIntent(str, Enum):
    PRICING = "pricing"
    DEMO = "demo"
    UPGRADE = "upgrade"
    ENTERPRISE = "enterprise"
    GENERAL = "general"
    COMPARISON = "comparison"
    FEATURES = "features"


class LeadScore(str, Enum):
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"
    UNQUALIFIED = "unqualified"


class SalesChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_info: Optional[Dict[str, Any]] = None


class SalesChatResponse(BaseModel):
    response: str
    conversation_id: str
    intent: SalesIntent
    confidence: float
    suggested_products: List[Dict[str, Any]] = []
    call_to_action: Optional[str] = None
    follow_up_questions: List[str] = []


class LeadQualifyRequest(BaseModel):
    customer_id: Optional[str] = None
    company_name: Optional[str] = None
    company_size: Optional[str] = None
    industry: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    use_case: Optional[str] = None
    current_solution: Optional[str] = None
    decision_maker: Optional[bool] = None
    pain_points: Optional[List[str]] = None
    conversation_history: Optional[List[Dict[str, str]]] = None


class LeadQualifyResponse(BaseModel):
    lead_id: str
    score: LeadScore
    score_value: int  # 0-100
    bant_analysis: Dict[str, Any]
    recommendations: List[str]
    next_steps: List[str]
    estimated_deal_value: Optional[float] = None


class ProductRecommendationRequest(BaseModel):
    customer_id: Optional[str] = None
    use_case: Optional[str] = None
    budget_range: Optional[str] = None
    company_size: Optional[str] = None
    features_needed: Optional[List[str]] = None
    industry: Optional[str] = None


class ProductRecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    comparison_table: Optional[Dict[str, Any]] = None
    best_fit: str
    reasoning: str


class SalesAgent:
    """AI-powered sales assistant for handling inquiries and qualifying leads."""

    def __init__(self):
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}
        self.products = self._load_products()

    def _load_products(self) -> List[Dict[str, Any]]:
        """Load product catalog."""
        return [
            {
                "id": "starter",
                "name": "Starter",
                "price": 0,
                "price_label": "Free",
                "features": ["5 creators", "10 campaigns/month", "Basic analytics", "Email support"],
                "best_for": "Small teams getting started",
            },
            {
                "id": "professional",
                "name": "Professional",
                "price": 99,
                "price_label": "$99/month",
                "features": ["25 creators", "Unlimited campaigns", "Advanced analytics", "AI content tools", "Priority support"],
                "best_for": "Growing marketing teams",
            },
            {
                "id": "business",
                "name": "Business",
                "price": 299,
                "price_label": "$299/month",
                "features": ["100 creators", "Everything in Pro", "Custom integrations", "Dedicated manager", "SLA guarantee"],
                "best_for": "Established brands",
            },
            {
                "id": "enterprise",
                "name": "Enterprise",
                "price": None,
                "price_label": "Custom",
                "features": ["Unlimited creators", "White-label", "Custom AI training", "On-premise option", "24/7 support"],
                "best_for": "Large organizations with custom needs",
            },
        ]

    async def chat(self, request: SalesChatRequest) -> SalesChatResponse:
        """Handle sales chat messages."""
        conversation_id = request.conversation_id or str(uuid.uuid4())

        # Store message in conversation history
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []

        self.conversations[conversation_id].append({
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow().isoformat(),
        })

        # Detect intent
        intent, confidence = self._detect_sales_intent(request.message)

        # Generate response based on intent
        response, cta, products = self._generate_sales_response(intent, request)

        # Store response
        self.conversations[conversation_id].append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.utcnow().isoformat(),
        })

        return SalesChatResponse(
            response=response,
            conversation_id=conversation_id,
            intent=intent,
            confidence=confidence,
            suggested_products=products,
            call_to_action=cta,
            follow_up_questions=self._generate_follow_up_questions(intent),
        )

    def _detect_sales_intent(self, message: str) -> tuple[SalesIntent, float]:
        """Detect the sales intent from the message."""
        message_lower = message.lower()

        intent_keywords = {
            SalesIntent.PRICING: ["price", "cost", "pricing", "how much", "rates", "fees", "subscription"],
            SalesIntent.DEMO: ["demo", "trial", "test", "try", "see it", "show me", "walkthrough"],
            SalesIntent.UPGRADE: ["upgrade", "scale", "more features", "larger plan", "grow"],
            SalesIntent.ENTERPRISE: ["enterprise", "custom", "large team", "organization", "white-label"],
            SalesIntent.COMPARISON: ["compare", "vs", "versus", "difference", "better than"],
            SalesIntent.FEATURES: ["features", "capabilities", "what can", "does it", "integration"],
        }

        for intent, keywords in intent_keywords.items():
            if any(kw in message_lower for kw in keywords):
                return intent, 0.85

        return SalesIntent.GENERAL, 0.6

    def _generate_sales_response(self, intent: SalesIntent, request: SalesChatRequest) -> tuple[str, str, List[Dict]]:
        """Generate appropriate sales response based on intent."""
        if intent == SalesIntent.PRICING:
            return (
                "Great question! We offer flexible pricing to fit teams of all sizes:\n\n"
                "• **Starter (Free)**: Perfect for getting started with 5 creators and basic features\n"
                "• **Professional ($99/mo)**: For growing teams with 25 creators and AI tools\n"
                "• **Business ($299/mo)**: For established brands with 100 creators\n"
                "• **Enterprise (Custom)**: Unlimited creators with white-label options\n\n"
                "Which plan sounds most interesting for your needs?",
                "Start a free trial",
                self.products[:3],
            )

        elif intent == SalesIntent.DEMO:
            return (
                "I'd love to show you what NEXUS can do! We offer personalized demos where we can:\n\n"
                "• Walk through the platform features\n"
                "• Show real examples from your industry\n"
                "• Answer your specific questions\n"
                "• Discuss how it fits your workflow\n\n"
                "Would you like to schedule a 30-minute demo with our team?",
                "Schedule a demo",
                [],
            )

        elif intent == SalesIntent.ENTERPRISE:
            return (
                "For enterprise needs, we offer a fully customizable solution including:\n\n"
                "• **Unlimited creators** and campaigns\n"
                "• **White-label** deployment\n"
                "• **Custom AI model** training on your brand voice\n"
                "• **On-premise** deployment options\n"
                "• **Dedicated success manager** and 24/7 support\n"
                "• **Custom integrations** with your existing stack\n\n"
                "I'd recommend speaking with our enterprise team to discuss your specific requirements. "
                "Would you like me to connect you with an enterprise specialist?",
                "Talk to enterprise sales",
                [self.products[3]],
            )

        elif intent == SalesIntent.UPGRADE:
            return (
                "Looking to scale up? That's exciting! Here's what each upgrade tier unlocks:\n\n"
                "**Professional** adds:\n"
                "• More creators (5 → 25)\n"
                "• AI-powered content tools\n"
                "• Advanced analytics\n\n"
                "**Business** adds:\n"
                "• Even more creators (25 → 100)\n"
                "• Custom integrations\n"
                "• Dedicated account manager\n\n"
                "What's driving your need to upgrade? More creators, features, or support?",
                "Upgrade your plan",
                self.products[1:3],
            )

        else:
            return (
                "Thanks for reaching out! I'm here to help you find the right UGC solution for your brand.\n\n"
                "NEXUS helps marketing teams:\n"
                "• Find and manage creator partnerships\n"
                "• Create AI-powered content at scale\n"
                "• Track performance with advanced analytics\n"
                "• Automate campaigns and workflows\n\n"
                "What specific challenge are you looking to solve?",
                "Learn more",
                [],
            )

    def _generate_follow_up_questions(self, intent: SalesIntent) -> List[str]:
        """Generate relevant follow-up questions."""
        questions = {
            SalesIntent.PRICING: [
                "What's your team size?",
                "How many creators are you working with currently?",
                "Do you need any specific integrations?",
            ],
            SalesIntent.DEMO: [
                "What's your main use case for UGC?",
                "Which features are most important to you?",
                "When would be a good time for a demo?",
            ],
            SalesIntent.ENTERPRISE: [
                "How large is your organization?",
                "Do you have specific security or compliance requirements?",
                "What systems would you need to integrate with?",
            ],
            SalesIntent.UPGRADE: [
                "What's limiting you on your current plan?",
                "How quickly do you expect to scale?",
                "Are there specific features you need?",
            ],
        }
        return questions.get(intent, ["What's your main goal with UGC marketing?"])

    async def qualify_lead(self, request: LeadQualifyRequest) -> LeadQualifyResponse:
        """Qualify a lead using BANT criteria."""
        lead_id = f"LEAD-{uuid.uuid4().hex[:8].upper()}"

        # BANT Analysis
        bant = {
            "budget": self._score_budget(request.budget),
            "authority": self._score_authority(request.decision_maker),
            "need": self._score_need(request.use_case, request.pain_points),
            "timeline": self._score_timeline(request.timeline),
        }

        # Calculate overall score
        score_value = int(sum(bant.values()) / 4)

        # Determine lead score tier
        if score_value >= 75:
            score = LeadScore.HOT
        elif score_value >= 50:
            score = LeadScore.WARM
        elif score_value >= 25:
            score = LeadScore.COLD
        else:
            score = LeadScore.UNQUALIFIED

        # Generate recommendations
        recommendations = self._generate_lead_recommendations(bant, request)
        next_steps = self._generate_next_steps(score, bant)

        # Estimate deal value
        deal_value = self._estimate_deal_value(request.company_size, request.budget)

        return LeadQualifyResponse(
            lead_id=lead_id,
            score=score,
            score_value=score_value,
            bant_analysis={
                "budget": {"score": bant["budget"], "details": request.budget or "Unknown"},
                "authority": {"score": bant["authority"], "details": "Decision maker" if request.decision_maker else "Not confirmed"},
                "need": {"score": bant["need"], "details": request.use_case or "Not specified"},
                "timeline": {"score": bant["timeline"], "details": request.timeline or "Unknown"},
            },
            recommendations=recommendations,
            next_steps=next_steps,
            estimated_deal_value=deal_value,
        )

    def _score_budget(self, budget: Optional[str]) -> int:
        if not budget:
            return 25
        budget_lower = budget.lower()
        if any(x in budget_lower for x in ["enterprise", "$1000", "$5000", "unlimited"]):
            return 100
        elif any(x in budget_lower for x in ["$500", "$300", "business"]):
            return 75
        elif any(x in budget_lower for x in ["$100", "$200", "professional"]):
            return 50
        return 25

    def _score_authority(self, decision_maker: Optional[bool]) -> int:
        if decision_maker is True:
            return 100
        elif decision_maker is False:
            return 25
        return 50

    def _score_need(self, use_case: Optional[str], pain_points: Optional[List[str]]) -> int:
        score = 25
        if use_case:
            score += 25
        if pain_points and len(pain_points) > 0:
            score += min(len(pain_points) * 15, 50)
        return min(score, 100)

    def _score_timeline(self, timeline: Optional[str]) -> int:
        if not timeline:
            return 25
        timeline_lower = timeline.lower()
        if any(x in timeline_lower for x in ["immediately", "asap", "this week", "urgent"]):
            return 100
        elif any(x in timeline_lower for x in ["this month", "30 days", "soon"]):
            return 75
        elif any(x in timeline_lower for x in ["quarter", "3 months", "q1", "q2", "q3", "q4"]):
            return 50
        return 25

    def _generate_lead_recommendations(self, bant: Dict[str, int], request: LeadQualifyRequest) -> List[str]:
        recommendations = []
        if bant["budget"] < 50:
            recommendations.append("Offer free trial to demonstrate value before discussing pricing")
        if bant["authority"] < 50:
            recommendations.append("Request to include decision maker in next conversation")
        if bant["need"] < 50:
            recommendations.append("Schedule discovery call to understand pain points better")
        if bant["timeline"] < 50:
            recommendations.append("Create urgency by highlighting competitor activity or limited-time offers")
        return recommendations or ["Lead is well-qualified - proceed to demo/proposal"]

    def _generate_next_steps(self, score: LeadScore, bant: Dict[str, int]) -> List[str]:
        if score == LeadScore.HOT:
            return ["Schedule demo within 24 hours", "Prepare custom proposal", "Involve account executive"]
        elif score == LeadScore.WARM:
            return ["Send case studies from similar industry", "Schedule discovery call", "Add to nurture campaign"]
        elif score == LeadScore.COLD:
            return ["Add to newsletter", "Send educational content", "Re-engage in 30 days"]
        else:
            return ["Add to awareness campaign", "Monitor for engagement signals"]

    def _estimate_deal_value(self, company_size: Optional[str], budget: Optional[str]) -> Optional[float]:
        if not company_size:
            return None
        size_lower = company_size.lower()
        if any(x in size_lower for x in ["enterprise", "1000+", "large"]):
            return 50000.0
        elif any(x in size_lower for x in ["500", "medium", "mid"]):
            return 15000.0
        elif any(x in size_lower for x in ["100", "small"]):
            return 5000.0
        return 1200.0  # Default annual value

    async def get_recommendations(self, request: ProductRecommendationRequest) -> ProductRecommendationResponse:
        """Get product recommendations based on customer needs."""
        scored_products = []

        for product in self.products:
            score = self._score_product_fit(product, request)
            scored_products.append({"product": product, "score": score})

        # Sort by score
        scored_products.sort(key=lambda x: x["score"], reverse=True)

        recommendations = [
            {
                **sp["product"],
                "fit_score": sp["score"],
                "fit_reasons": self._get_fit_reasons(sp["product"], request),
            }
            for sp in scored_products
        ]

        best_fit = recommendations[0]["name"]
        reasoning = self._generate_recommendation_reasoning(recommendations[0], request)

        return ProductRecommendationResponse(
            recommendations=recommendations,
            best_fit=best_fit,
            reasoning=reasoning,
        )

    def _score_product_fit(self, product: Dict, request: ProductRecommendationRequest) -> int:
        score = 50  # Base score

        # Budget scoring
        if request.budget_range:
            budget_lower = request.budget_range.lower()
            if "free" in budget_lower and product["price"] == 0:
                score += 30
            elif "$100" in budget_lower and product["price"] and product["price"] <= 100:
                score += 25
            elif "$300" in budget_lower and product["price"] and product["price"] <= 300:
                score += 25
            elif "custom" in budget_lower and product["price"] is None:
                score += 30

        # Company size scoring
        if request.company_size:
            size_lower = request.company_size.lower()
            if "small" in size_lower and product["id"] in ["starter", "professional"]:
                score += 20
            elif "medium" in size_lower and product["id"] in ["professional", "business"]:
                score += 20
            elif "large" in size_lower and product["id"] in ["business", "enterprise"]:
                score += 20

        return min(score, 100)

    def _get_fit_reasons(self, product: Dict, request: ProductRecommendationRequest) -> List[str]:
        reasons = []
        if product["best_for"]:
            reasons.append(f"Best for: {product['best_for']}")
        if request.features_needed:
            matching = [f for f in request.features_needed if any(f.lower() in pf.lower() for pf in product["features"])]
            if matching:
                reasons.append(f"Matches your needs: {', '.join(matching)}")
        return reasons

    def _generate_recommendation_reasoning(self, product: Dict, request: ProductRecommendationRequest) -> str:
        return (
            f"Based on your requirements, {product['name']} is the best fit because it's "
            f"designed for {product['best_for'].lower()}. It includes key features like "
            f"{', '.join(product['features'][:3])}, which align with your needs."
        )


sales_agent = SalesAgent()
