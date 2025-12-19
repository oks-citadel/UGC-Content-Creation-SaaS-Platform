from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .config import settings
from .models import (
    PredictionRequest,
    PredictionResponse,
    OptimizationResponse,
    ComparisonRequest,
    ComparisonResponse,
    ViralityScore,
    HealthResponse,
    DetailedRecommendationRequest,
    DetailedRecommendationResponse,
    OutcomeReport,
    OutcomeResponse,
)
from .services.predictor_service import PerformancePredictorService
from .services.database import init_db, close_db

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

    # Initialize database for learning system
    if settings.learning_enabled:
        try:
            await init_db()
            logger.info("Database initialized for learning system")
        except Exception as e:
            logger.warning(f"Database initialization failed: {e}. Learning features will be limited.")

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.service_name}")

    # Close database connections
    if settings.learning_enabled:
        try:
            await close_db()
            logger.info("Database connections closed")
        except Exception as e:
            logger.warning(f"Error closing database: {e}")


# Initialize FastAPI app
app = FastAPI(
    title="NEXUS Performance Predictor Service",
    description="AI-powered content performance prediction and optimization",
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
predictor_service = PerformancePredictorService()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service=settings.service_name,
        version=settings.version,
        models_loaded={
            "clip": True,
            "engagement_predictor": True,
            "virality_model": True
        }
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict_performance(request: PredictionRequest):
    """
    Predict content performance before publishing.

    Analyzes content and provides predictions for:
    - Engagement metrics (views, likes, comments, shares)
    - Virality potential
    - Content quality scores
    - Overall performance score

    Use this to evaluate content before publishing.
    """
    try:
        logger.info(f"Predicting performance for {request.platform} content")
        result = await predictor_service.predict_engagement(request)
        return result

    except Exception as e:
        logger.error(f"Error in predict endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/virality", response_model=ViralityScore)
async def predict_virality(request: PredictionRequest):
    """
    Predict viral potential of content.

    Focuses specifically on virality factors:
    - Trending alignment
    - Emotional resonance
    - Shareability
    - Predicted reach
    - Peak timing

    Returns viral probability score and detailed factors.
    """
    try:
        logger.info(f"Predicting virality for {request.platform} content")
        result = await predictor_service.predict_virality(request)
        return result

    except Exception as e:
        logger.error(f"Error in virality endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize", response_model=OptimizationResponse)
async def get_optimization_suggestions(request: PredictionRequest):
    """
    Get actionable suggestions to optimize content performance.

    Analyzes content and provides specific recommendations for:
    - Visual improvements
    - Caption optimization
    - Hashtag strategy
    - Posting timing
    - Hook enhancement
    - CTA optimization

    Each suggestion includes:
    - Expected impact
    - Implementation difficulty
    - Priority level
    """
    try:
        logger.info(f"Generating optimization suggestions for {request.platform} content")
        result = await predictor_service.get_optimization_suggestions(request)
        return result

    except Exception as e:
        logger.error(f"Error in optimize endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/compare", response_model=ComparisonResponse)
async def compare_variants(request: ComparisonRequest):
    """
    Compare two content variants to predict which will perform better.

    Perfect for A/B testing decisions before publishing.

    Compares variants on:
    - Predicted engagement
    - Viral potential
    - Visual quality
    - Overall performance

    Returns:
    - Winner determination
    - Confidence score
    - Key differences
    - Recommendation
    """
    try:
        logger.info("Comparing content variants")
        result = await predictor_service.compare_variants(request)
        return result

    except Exception as e:
        logger.error(f"Error in compare endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend/detailed", response_model=DetailedRecommendationResponse)
async def get_detailed_recommendations(request: DetailedRecommendationRequest):
    """
    Get detailed, actionable recommendations to optimize content performance.

    **This is the advanced recommendation endpoint** that provides:

    - **Specific action steps**: Not generic advice, but step-by-step implementation guides
    - **Platform-specific strategies**: Tailored advice for TikTok, Instagram, YouTube, Facebook, Pinterest
    - **Templates and examples**: Ready-to-use formats and examples
    - **Expected impact**: Quantified improvement predictions
    - **Implementation difficulty**: Easy/Medium/Hard ratings
    - **Time estimates**: How long each recommendation takes to implement

    ## Recommendation Categories:
    - **Hook**: First 3 seconds optimization
    - **Caption**: Caption structure and content
    - **Hashtags**: Hashtag strategy and selection
    - **Audio**: Sound and music optimization
    - **Timing**: Optimal posting times
    - **Visual**: Video/image quality improvements
    - **CTA**: Call-to-action optimization
    - **Trending**: Trend alignment strategies
    - **Pacing**: Video editing and pacing

    ## Response includes:
    - Prioritized list of recommendations
    - Quick wins (easy + high impact)
    - High impact actions
    - Total implementation time estimate
    - Potential score after implementation
    """
    try:
        logger.info(f"Generating detailed recommendations for {request.platform} content")
        result = await predictor_service.get_detailed_recommendations(request)
        return result

    except Exception as e:
        logger.error(f"Error in detailed recommendations endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/learn/outcome", response_model=OutcomeResponse)
async def report_outcome(request: OutcomeReport):
    """
    Report actual content performance for learning and model improvement.

    After publishing content and collecting real performance data, report
    the actual metrics here to:

    - **Improve prediction accuracy**: The system learns from outcomes
    - **Track recommendation effectiveness**: See which recommendations worked
    - **Build historical baselines**: Creator-specific performance patterns
    - **Calibrate confidence scores**: More accurate prediction confidence

    ## What to report:
    - Content ID from the original prediction
    - Actual metrics (views, likes, comments, shares, engagement rate)
    - When the content was published
    - Which recommendations were followed (optional)

    ## Returns:
    - Prediction accuracy analysis
    - Accuracy breakdown by metric
    - How this outcome improves future predictions
    """
    try:
        logger.info(f"Recording outcome for content {request.content_id}")
        result = await predictor_service.record_outcome(request)
        return result

    except Exception as e:
        logger.error(f"Error in outcome endpoint: {str(e)}", exc_info=True)
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
            "engagement_prediction",
            "virality_scoring",
            "content_optimization",
            "variant_comparison",
            "detailed_recommendations",
            "outcome_learning"
        ],
        "endpoints": {
            "predict": "POST /predict - Predict content performance",
            "virality": "POST /predict/virality - Predict viral potential",
            "optimize": "POST /optimize - Get basic optimization suggestions",
            "compare": "POST /compare - Compare two content variants",
            "recommend_detailed": "POST /recommend/detailed - Get detailed, actionable recommendations",
            "learn_outcome": "POST /learn/outcome - Report actual performance for learning"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.debug
    )
