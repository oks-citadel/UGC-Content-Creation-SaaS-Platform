"""
NEXUS UGC Platform - Customer Agent
AI-powered customer service agent for sales and support.
"""

__version__ = "1.0.0"

from .config import settings
from .agents import SupportAgent, TicketClassifier
from .knowledge import FAQSearchService, ContextBuilder
from .utils import SentimentAnalyzer

__all__ = [
    "settings",
    "SupportAgent",
    "TicketClassifier",
    "FAQSearchService",
    "ContextBuilder",
    "SentimentAnalyzer",
]
