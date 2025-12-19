import logging
from typing import List
import numpy as np
from sentence_transformers import SentenceTransformer

from ..config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings for semantic search."""

    def __init__(self):
        logger.info(f"Loading embedding model: {settings.embedding_model}")
        self.model = SentenceTransformer(settings.embedding_model)
        logger.info("Embedding model loaded successfully")

    async def get_text_embedding(self, text: str) -> List[float]:
        """Generate embedding for text."""
        try:
            if not text or not text.strip():
                # Return zero vector for empty text
                return [0.0] * settings.embedding_dimension

            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding.tolist()

        except Exception as e:
            logger.error(f"Error generating text embedding: {str(e)}")
            # Return zero vector on error
            return [0.0] * settings.embedding_dimension

    async def get_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        try:
            if not texts:
                return []

            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()

        except Exception as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            return [[0.0] * settings.embedding_dimension] * len(texts)

    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between embeddings."""
        v1 = np.array(embedding1)
        v2 = np.array(embedding2)

        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)

        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0

        return float(dot_product / (norm_v1 * norm_v2))
