from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from typing import List

from .config import settings
from .models import (
    CreatorProfile,
    CampaignRequirements,
    CreatorMatchResponse,
    ContentItem,
    ProductInfo,
    ContentMatchResponse,
    SimilarCreatorsResponse,
    TrendingResponse,
    HealthResponse,
)
from .services.matching_service import MatchingService

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.service_name} v{settings.version}")
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.service_name}")


# Initialize FastAPI app
app = FastAPI(
    title="NEXUS Recommendation Engine",
    description="AI-powered creator and content matching service",
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

# Initialize service
matching_service = MatchingService()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service=settings.service_name,
        version=settings.version,
        vector_db_status="connected",
        embeddings_loaded=True
    )


@app.post("/match/creators", response_model=CreatorMatchResponse)
async def match_creators(
    campaign: CampaignRequirements,
    creator_pool: List[CreatorProfile],
    limit: int = 10
):
    """
    Match creators to a campaign based on multiple factors.

    Matching algorithm considers:
    - Niche alignment with campaign requirements
    - Audience demographics overlap
    - Engagement rate compatibility
    - Past performance metrics
    - Content style fit
    - Location preferences
    - Budget alignment

    Returns ranked list of creators with:
    - Match score (0-1)
    - Detailed reasoning
    - Estimated performance metrics
    - Component scores (audience, engagement, style)
    """
    try:
        logger.info(f"Matching creators to campaign: {campaign.campaign_id}")
        result = await matching_service.match_creators_to_campaign(
            campaign,
            creator_pool,
            limit
        )
        return result

    except Exception as e:
        logger.error(f"Error in match_creators endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/match/content", response_model=ContentMatchResponse)
async def match_content(
    product: ProductInfo,
    content_items: List[ContentItem],
    limit: int = 20
):
    """
    Match content to products for optimal product placement.

    Uses semantic similarity and engagement analysis to identify
    content that would best showcase specific products.

    Matching factors:
    - Semantic similarity (descriptions, keywords)
    - Visual style alignment
    - Audience overlap
    - Historical engagement patterns
    - Conversion potential

    Returns:
    - Ranked content matches
    - Predicted conversion rates
    - Audience alignment scores
    - Detailed reasoning
    """
    try:
        logger.info(f"Matching content to product: {product.product_id}")
        result = await matching_service.match_content_to_products(
            product,
            content_items,
            limit
        )
        return result

    except Exception as e:
        logger.error(f"Error in match_content endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/similar/{creator_id}", response_model=SimilarCreatorsResponse)
async def get_similar_creators(
    creator_id: str,
    creator_pool: List[CreatorProfile],
    limit: int = 10
):
    """
    Find creators similar to a given creator.

    Uses vector similarity on creator attributes including:
    - Niche and content categories
    - Content style and format
    - Engagement patterns
    - Audience demographics
    - Posting frequency

    Useful for:
    - Finding alternative creators
    - Building diverse creator lists
    - Competitive analysis
    - Scaling successful partnerships

    Returns:
    - Similarity scores
    - Shared attributes
    - Key differences
    """
    try:
        logger.info(f"Finding similar creators to: {creator_id}")
        result = await matching_service.get_similar_creators(
            creator_id,
            creator_pool,
            limit
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in get_similar_creators endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/trending", response_model=TrendingResponse)
async def get_trending(
    platform: str = "all",
    limit: int = 20,
    time_window_hours: int = 24
):
    """
    Get trending content across platforms.

    Identifies content showing viral patterns based on:
    - Engagement velocity (rate of engagement growth)
    - View-to-engagement ratio
    - Share patterns
    - Algorithmic signals
    - Topic alignment with current trends

    Parameters:
    - platform: Filter by platform (tiktok, instagram, youtube, facebook, all)
    - limit: Maximum number of results
    - time_window_hours: Time window to analyze (default 24h)

    Returns:
    - Trending content ranked by trend score
    - Engagement velocity metrics
    - Viral probability scores
    - Associated trending topics
    """
    try:
        logger.info(f"Getting trending content for platform: {platform}")
        result = await matching_service.get_trending_content(
            platform,
            limit,
            time_window_hours
        )
        return result

    except Exception as e:
        logger.error(f"Error in get_trending endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": settings.service_name,
        "version": settings.version,
        "status": "running",
        "docs": "/docs",
        "capabilities": [
            "creator_matching",
            "content_matching",
            "similarity_search",
            "trending_analysis"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,
        reload=settings.debug
    )
