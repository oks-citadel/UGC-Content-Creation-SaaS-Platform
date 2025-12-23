from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from openai import AsyncOpenAI

from .config import settings
from .models import (
    CampaignGenerateRequest,
    CampaignGenerateResponse,
    CopyGenerateRequest,
    CopyGenerateResponse,
    HashtagGenerateRequest,
    HashtagGenerateResponse,
    CompetitorAnalyzeRequest,
    CompetitorAnalyzeResponse,
    TrendAnalyzeRequest,
    TrendAnalyzeResponse,
    ABTestSuggestRequest,
    ABTestSuggestResponse,
    AudienceSegmentRequest,
    AudienceSegmentResponse,
    HealthResponse,
)
from .generators.campaign_generator import CampaignGenerator
from .generators.copy_generator import CopyGenerator
from .generators.hashtag_generator import HashtagGenerator
from .analyzers.competitor_analyzer import CompetitorAnalyzer
from .analyzers.trend_analyzer import TrendAnalyzer
from .optimizers.ab_test_suggester import ABTestSuggester
from .optimizers.audience_segmenter import AudienceSegmenter

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Initialize OpenAI client
openai_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    global openai_client

    # Startup
    logger.info(f"Starting {settings.service_name} v{settings.version}")

    # Initialize OpenAI client
    if settings.openai_api_key:
        openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
        logger.info("OpenAI client initialized")
    else:
        logger.warning("OpenAI API key not configured - AI features will be limited")

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.service_name}")


# Initialize FastAPI app
app = FastAPI(
    title="NEXUS AI Marketing Agent",
    description="AI-powered marketing automation service for content generation, competitor analysis, and campaign optimization",
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
def get_openai_client() -> AsyncOpenAI:
    """Get OpenAI client, raising error if not configured."""
    if openai_client is None:
        raise HTTPException(
            status_code=503,
            detail="OpenAI client not configured. Please set OPENAI_API_KEY."
        )
    return openai_client


# ===================
# Health Check
# ===================


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service=settings.service_name,
        version=settings.version,
        openai_connected=openai_client is not None,
        capabilities=[
            "campaign_generation",
            "copy_generation",
            "hashtag_generation",
            "competitor_analysis",
            "trend_analysis",
            "ab_test_suggestions",
            "audience_segmentation"
        ]
    )


# ===================
# Campaign Endpoints
# ===================


@app.post("/campaign/generate", response_model=CampaignGenerateResponse)
async def generate_campaign(request: CampaignGenerateRequest):
    """
    Generate a comprehensive marketing campaign strategy.

    Creates a detailed campaign brief including:
    - Campaign phases and timeline
    - Platform-specific strategies
    - Content pillars and key messages
    - Budget allocation recommendations
    - Success metrics and KPIs
    """
    try:
        logger.info(f"Generating campaign for brand: {request.brand_name}")
        client = get_openai_client()
        generator = CampaignGenerator(client, settings)
        result = await generator.generate(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating campaign: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Copy Endpoints
# ===================


@app.post("/copy/generate", response_model=CopyGenerateResponse)
async def generate_copy(request: CopyGenerateRequest):
    """
    Generate marketing copy with multiple variations.

    Creates platform-optimized copy including:
    - Headlines and body text
    - Call-to-action variations
    - Hashtag suggestions
    - Engagement score predictions
    - Brand voice consistency check
    """
    try:
        logger.info(f"Generating copy for {request.platform} - {request.content_type}")
        client = get_openai_client()
        generator = CopyGenerator(client, settings)
        result = await generator.generate(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating copy: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Hashtag Endpoints
# ===================


@app.post("/hashtags/generate", response_model=HashtagGenerateResponse)
async def generate_hashtags(request: HashtagGenerateRequest):
    """
    Generate platform-optimized hashtags.

    Provides:
    - Primary and secondary hashtags
    - Niche-specific hashtags
    - Trending hashtags
    - Branded hashtag suggestions
    - Usage strategy recommendations
    """
    try:
        logger.info(f"Generating hashtags for {request.platform} - {request.niche}")
        client = get_openai_client()
        generator = HashtagGenerator(client, settings)
        result = await generator.generate(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating hashtags: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Competitor Analysis Endpoints
# ===================


@app.post("/competitor/analyze", response_model=CompetitorAnalyzeResponse)
async def analyze_competitor(request: CompetitorAnalyzeRequest):
    """
    Analyze competitor content strategies.

    Provides insights on:
    - Competitor content strategies
    - Engagement patterns
    - Content gaps and opportunities
    - Differentiation strategies
    - Actionable recommendations
    """
    try:
        logger.info(f"Analyzing competitors for {request.brand_name}")
        client = get_openai_client()
        analyzer = CompetitorAnalyzer(client, settings)
        result = await analyzer.analyze(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing competitors: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Trend Analysis Endpoints
# ===================


@app.post("/trends/analyze", response_model=TrendAnalyzeResponse)
async def analyze_trends(request: TrendAnalyzeRequest):
    """
    Analyze trending topics and content formats.

    Identifies:
    - Trending topics in your niche
    - Popular hashtags
    - Viral sounds (TikTok/Reels)
    - Emerging content formats
    - Timing recommendations
    """
    try:
        logger.info(f"Analyzing trends for {request.niche}")
        client = get_openai_client()
        analyzer = TrendAnalyzer(client, settings)
        result = await analyzer.analyze(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing trends: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# A/B Test Endpoints
# ===================


@app.post("/ab-test/suggest", response_model=ABTestSuggestResponse)
async def suggest_ab_test(request: ABTestSuggestRequest):
    """
    Suggest A/B test variations for content.

    Provides:
    - Test variations with hypotheses
    - Sample size recommendations
    - Test duration suggestions
    - Success metrics
    - Analysis framework
    """
    try:
        logger.info(f"Suggesting A/B tests for {request.element_to_test}")
        client = get_openai_client()
        suggester = ABTestSuggester(client, settings)
        result = await suggester.suggest(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error suggesting A/B test: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Audience Segmentation Endpoints
# ===================


@app.post("/audience/segment", response_model=AudienceSegmentResponse)
async def segment_audience(request: AudienceSegmentRequest):
    """
    Generate AI-driven audience segments.

    Creates:
    - Detailed audience personas
    - Segment-specific messaging
    - Content recommendations per segment
    - Cross-segment strategies
    - Personalization opportunities
    """
    try:
        logger.info(f"Segmenting audience for {request.brand_name}")
        client = get_openai_client()
        segmenter = AudienceSegmenter(client, settings)
        result = await segmenter.segment(request)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error segmenting audience: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ===================
# Root Endpoint
# ===================


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": settings.service_name,
        "version": settings.version,
        "status": "running",
        "docs": "/docs",
        "capabilities": [
            "campaign_generation",
            "copy_generation",
            "hashtag_generation",
            "competitor_analysis",
            "trend_analysis",
            "ab_test_suggestions",
            "audience_segmentation"
        ],
        "endpoints": {
            "campaign": "POST /campaign/generate - Generate campaign strategy",
            "copy": "POST /copy/generate - Generate marketing copy",
            "hashtags": "POST /hashtags/generate - Generate optimized hashtags",
            "competitor": "POST /competitor/analyze - Analyze competitor strategy",
            "trends": "POST /trends/analyze - Get trending content insights",
            "ab_test": "POST /ab-test/suggest - Suggest A/B test variations",
            "audience": "POST /audience/segment - AI-driven audience segmentation"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8003,
        reload=settings.debug
    )
