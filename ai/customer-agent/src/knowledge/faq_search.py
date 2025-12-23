"""FAQ and Knowledge Base search service using vector similarity."""

import logging
from typing import List, Optional, Dict, Any
import numpy as np
from openai import AsyncOpenAI

from ..config import settings
from ..models import FAQSearchResult

logger = logging.getLogger(__name__)


class FAQSearchService:
    """
    Service for searching FAQ and knowledge base using vector embeddings.
    Implements RAG (Retrieval Augmented Generation) for context-aware responses.
    """

    def __init__(self):
        self.openai_client: Optional[AsyncOpenAI] = None
        self.faiss_index = None
        self.faq_data: List[Dict[str, Any]] = []
        self.embeddings_cache: Dict[str, np.ndarray] = {}

        # Initialize with sample FAQs (in production, load from database)
        self._initialize_sample_faqs()

    def _initialize_sample_faqs(self):
        """Initialize sample FAQ data for the UGC platform."""
        self.faq_data = [
            {
                "id": "faq_001",
                "category": "billing",
                "question": "How do I upgrade my subscription plan?",
                "answer": "You can upgrade your subscription by going to Settings > Billing > Change Plan. Select your desired plan and confirm the upgrade. The new features will be available immediately, and you'll be charged the prorated difference."
            },
            {
                "id": "faq_002",
                "category": "billing",
                "question": "How do I cancel my subscription?",
                "answer": "To cancel your subscription, go to Settings > Billing > Cancel Subscription. You'll retain access until the end of your current billing period. Your data will be preserved for 30 days after cancellation."
            },
            {
                "id": "faq_003",
                "category": "billing",
                "question": "What payment methods do you accept?",
                "answer": "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. All payments are processed securely through Stripe."
            },
            {
                "id": "faq_004",
                "category": "content",
                "question": "How do I upload content to the platform?",
                "answer": "Click the 'Create' button in the top navigation, then select 'Upload Content'. You can drag and drop files or click to browse. We support video (MP4, MOV), images (JPG, PNG), and audio (MP3, WAV) files up to 5GB."
            },
            {
                "id": "faq_005",
                "category": "content",
                "question": "What are the content guidelines?",
                "answer": "All content must comply with our Community Guidelines. Content should not contain violence, hate speech, adult content, or copyright infringement. Our AI moderation system automatically reviews all uploads for compliance."
            },
            {
                "id": "faq_006",
                "category": "technical",
                "question": "Why is my video not processing?",
                "answer": "Video processing can take a few minutes depending on file size. If it's stuck, try: 1) Refresh the page, 2) Check your internet connection, 3) Ensure the video format is supported (MP4, MOV recommended). Contact support if issues persist."
            },
            {
                "id": "faq_007",
                "category": "technical",
                "question": "How do I connect my social media accounts?",
                "answer": "Go to Settings > Integrations > Social Accounts. Click 'Connect' next to the platform you want to add. You'll be redirected to authorize the connection. We support TikTok, Instagram, YouTube, Facebook, Twitter, and Pinterest."
            },
            {
                "id": "faq_008",
                "category": "account",
                "question": "How do I reset my password?",
                "answer": "Click 'Forgot Password' on the login page, enter your email, and we'll send a reset link. The link expires in 24 hours. If you don't receive it, check your spam folder or contact support."
            },
            {
                "id": "faq_009",
                "category": "account",
                "question": "Can I change my username?",
                "answer": "Yes! Go to Settings > Profile > Edit Profile. You can change your username once every 30 days. Note that your unique creator handle cannot be changed after initial setup."
            },
            {
                "id": "faq_010",
                "category": "creators",
                "question": "How do I become a verified creator?",
                "answer": "To get verified, you need: 1) A complete profile with photo and bio, 2) At least 10 published pieces of content, 3) Connected social media with 1000+ followers, 4) Account in good standing for 30+ days. Apply through Settings > Creator Tools > Verification."
            },
            {
                "id": "faq_011",
                "category": "creators",
                "question": "How do I get paid for my content?",
                "answer": "Creators earn through: 1) Brand partnerships (we take 10% platform fee), 2) Direct tips from fans, 3) Subscription content. Set up payouts in Settings > Payments. We support PayPal, direct bank transfer, and Payoneer. Minimum payout is $50."
            },
            {
                "id": "faq_012",
                "category": "brands",
                "question": "How do I find creators for my campaign?",
                "answer": "Use our Creator Marketplace to search by niche, audience demographics, engagement rate, and location. You can filter by verified creators, previous brand work, and content style. Contact creators directly or use our campaign matching system."
            },
            {
                "id": "faq_013",
                "category": "brands",
                "question": "What are the campaign pricing options?",
                "answer": "Campaign pricing depends on creator tier and deliverables. Nano creators (1K-10K followers) typically charge $50-200 per post. Micro creators (10K-100K) charge $200-1000. Use our rate calculator for estimates, or let creators submit their rates."
            },
            {
                "id": "faq_014",
                "category": "features",
                "question": "What is the AI Caption Generator?",
                "answer": "Our AI Caption Generator creates engaging, platform-optimized captions for your content. It analyzes your image/video and generates captions with relevant hashtags. Access it through the content editor or separately via Tools > Caption Generator."
            },
            {
                "id": "faq_015",
                "category": "features",
                "question": "How does the Performance Predictor work?",
                "answer": "Our AI analyzes your content against successful posts in your niche to predict engagement. It considers visual quality, caption, hashtags, posting time, and trending topics. Use it before posting to optimize your content for maximum reach."
            },
        ]

    async def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding vector for text using OpenAI."""
        # Check cache first
        if text in self.embeddings_cache:
            return self.embeddings_cache[text]

        try:
            if not self.openai_client:
                if settings.openai_api_key:
                    self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
                else:
                    # Return random embedding for demo mode
                    logger.warning("OpenAI API key not configured, using random embeddings")
                    embedding = np.random.randn(settings.embedding_dimension).astype(np.float32)
                    embedding = embedding / np.linalg.norm(embedding)
                    return embedding

            response = await self.openai_client.embeddings.create(
                model=settings.embedding_model,
                input=text
            )
            embedding = np.array(response.data[0].embedding, dtype=np.float32)

            # Cache the embedding
            self.embeddings_cache[text] = embedding

            return embedding

        except Exception as e:
            logger.error(f"Error getting embedding: {str(e)}")
            # Return random embedding on error
            embedding = np.random.randn(settings.embedding_dimension).astype(np.float32)
            return embedding / np.linalg.norm(embedding)

    async def search(
        self,
        query: str,
        top_k: int = 5,
        category_filter: Optional[str] = None,
        min_score: float = 0.5
    ) -> List[FAQSearchResult]:
        """
        Search FAQ knowledge base for relevant answers.

        Args:
            query: Search query text
            top_k: Number of results to return
            category_filter: Optional category to filter by
            min_score: Minimum relevance score threshold

        Returns:
            List of FAQSearchResult ordered by relevance
        """
        try:
            # Get query embedding
            query_embedding = await self._get_embedding(query)

            # Calculate similarity scores for all FAQs
            results = []
            for faq in self.faq_data:
                # Apply category filter if specified
                if category_filter and faq["category"] != category_filter:
                    continue

                # Get FAQ embedding (combining question and answer)
                faq_text = f"{faq['question']} {faq['answer']}"
                faq_embedding = await self._get_embedding(faq_text)

                # Calculate cosine similarity
                similarity = np.dot(query_embedding, faq_embedding) / (
                    np.linalg.norm(query_embedding) * np.linalg.norm(faq_embedding)
                )

                if similarity >= min_score:
                    results.append(FAQSearchResult(
                        question=faq["question"],
                        answer=faq["answer"],
                        category=faq["category"],
                        relevance_score=float(similarity),
                        source_id=faq["id"]
                    ))

            # Sort by relevance score and return top_k
            results.sort(key=lambda x: x.relevance_score, reverse=True)
            return results[:top_k]

        except Exception as e:
            logger.error(f"Error searching FAQs: {str(e)}", exc_info=True)
            return []

    async def search_by_keywords(
        self,
        keywords: List[str],
        top_k: int = 5
    ) -> List[FAQSearchResult]:
        """
        Simple keyword-based search as fallback.

        Args:
            keywords: List of keywords to search for
            top_k: Number of results to return

        Returns:
            List of FAQSearchResult
        """
        results = []

        for faq in self.faq_data:
            faq_text = f"{faq['question']} {faq['answer']}".lower()
            match_count = sum(1 for kw in keywords if kw.lower() in faq_text)

            if match_count > 0:
                score = match_count / len(keywords)
                results.append(FAQSearchResult(
                    question=faq["question"],
                    answer=faq["answer"],
                    category=faq["category"],
                    relevance_score=score,
                    source_id=faq["id"]
                ))

        results.sort(key=lambda x: x.relevance_score, reverse=True)
        return results[:top_k]

    async def get_category_faqs(self, category: str) -> List[FAQSearchResult]:
        """Get all FAQs for a specific category."""
        return [
            FAQSearchResult(
                question=faq["question"],
                answer=faq["answer"],
                category=faq["category"],
                relevance_score=1.0,
                source_id=faq["id"]
            )
            for faq in self.faq_data
            if faq["category"] == category
        ]

    def get_categories(self) -> List[str]:
        """Get list of available FAQ categories."""
        return list(set(faq["category"] for faq in self.faq_data))

    async def add_faq(self, faq: Dict[str, str]) -> bool:
        """
        Add a new FAQ to the knowledge base.

        Args:
            faq: Dictionary with question, answer, category, and id

        Returns:
            Success status
        """
        try:
            required_fields = ["id", "question", "answer", "category"]
            if not all(field in faq for field in required_fields):
                logger.error("Missing required fields in FAQ")
                return False

            self.faq_data.append(faq)

            # Clear embedding cache for this FAQ
            faq_text = f"{faq['question']} {faq['answer']}"
            if faq_text in self.embeddings_cache:
                del self.embeddings_cache[faq_text]

            return True

        except Exception as e:
            logger.error(f"Error adding FAQ: {str(e)}")
            return False
