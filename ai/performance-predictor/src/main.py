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
    BatchPredictionRequest,
    BatchPredictionResponse,
    BatchPredictionResult,
    FeatureImportanceResponse,
    ModelHealthResponse,
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


@app.post("/batch/predict", response_model=BatchPredictionResponse)
async def batch_predict(request: BatchPredictionRequest):
    """
    Batch prediction endpoint for multiple content items.

    Process multiple content items in a single request for efficiency.
    Ideal for:
    - Pre-scheduling content calendars
    - Comparing multiple content pieces
    - Bulk content analysis

    ## Request:
    - Up to 50 items per batch
    - Each item requires: content_url, content_type, platform
    - Optional: virality scores, optimization suggestions

    ## Response:
    - Individual results for each item
    - Success/failure status per item
    - Overall batch statistics
    - Total processing time

    ## Performance:
    - Batch processing is more efficient than individual requests
    - Failed items don't block other items
    - Results are returned in request order
    """
    import asyncio
    from datetime import datetime
    import uuid

    start_time = datetime.utcnow()
    batch_id = str(uuid.uuid4())[:12]

    logger.info(f"Processing batch prediction with {len(request.items)} items")

    results = []
    successful = 0
    failed = 0

    # Process items concurrently with semaphore to limit parallelism
    semaphore = asyncio.Semaphore(5)  # Process up to 5 items concurrently

    async def process_item(item):
        nonlocal successful, failed
        async with semaphore:
            try:
                # Convert batch item to prediction request
                pred_request = PredictionRequest(
                    content_url=item.content_url,
                    content_type=item.content_type,
                    platform=item.platform,
                    caption=item.caption,
                    hashtags=item.hashtags,
                    target_audience=item.target_audience,
                    creator_metrics=item.creator_metrics,
                    posting_time=item.posting_time,
                )

                # Get prediction
                prediction = await predictor_service.predict_engagement(pred_request)

                # Get virality if requested
                virality = None
                if request.include_virality:
                    virality = await predictor_service.predict_virality(pred_request)

                # Get optimization suggestions if requested
                optimization = None
                if request.include_optimization:
                    opt_response = await predictor_service.get_optimization_suggestions(pred_request)
                    optimization = opt_response.suggestions

                successful += 1
                return BatchPredictionResult(
                    item_id=item.item_id,
                    content_id=prediction.content_id,
                    success=True,
                    platform=item.platform,
                    engagement_prediction=prediction.engagement_prediction,
                    virality_score=virality if virality else prediction.virality_score,
                    content_analysis=prediction.content_analysis,
                    overall_score=prediction.overall_score,
                    optimization_suggestions=optimization,
                )

            except Exception as e:
                failed += 1
                logger.error(f"Error processing batch item {item.item_id}: {e}")
                return BatchPredictionResult(
                    item_id=item.item_id,
                    content_id="",
                    success=False,
                    error=str(e),
                )

    # Process all items
    tasks = [process_item(item) for item in request.items]
    results = await asyncio.gather(*tasks)

    # Calculate processing time
    processing_time_ms = (datetime.utcnow() - start_time).total_seconds() * 1000

    logger.info(f"Batch {batch_id} completed: {successful} successful, {failed} failed")

    return BatchPredictionResponse(
        batch_id=batch_id,
        total_items=len(request.items),
        successful=successful,
        failed=failed,
        results=results,
        processing_time_ms=processing_time_ms,
        analyzed_at=datetime.utcnow().isoformat(),
    )


@app.get("/models/health", response_model=ModelHealthResponse)
async def get_model_health():
    """
    Get health and statistics about loaded ML models.

    Returns:
    - List of loaded models
    - Model version information
    - Active A/B tests
    - Cache statistics
    """
    try:
        # Import inference module if available
        try:
            from .inference import FastPredictor
            predictor = FastPredictor(preload=False)
            model_info = predictor.get_model_info()
            cache_stats = predictor.get_cache_stats()
        except ImportError:
            model_info = {
                "loaded_models": ["engagement_predictor", "virality_model"],
                "versions": {},
                "ab_tests": {},
            }
            cache_stats = {"size": 0, "max_size": 1000, "hits": 0, "misses": 0, "hit_rate": 0.0}

        return ModelHealthResponse(
            loaded_models=model_info.get("loaded_models", []),
            model_versions={},  # Simplified for now
            ab_tests_active=model_info.get("ab_tests", {}),
            cache_stats=cache_stats,
        )

    except Exception as e:
        logger.error(f"Error getting model health: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models/feature-importance/{target}", response_model=FeatureImportanceResponse)
async def get_feature_importance(target: str):
    """
    Get feature importance for a specific prediction target.

    Args:
        target: Target metric (views, likes, comments, shares, engagement_rate)

    Returns:
        Feature importance scores ranked by importance
    """
    try:
        # Import inference module if available
        try:
            from .inference import FastPredictor
            predictor = FastPredictor(preload=True)
            importance = predictor.get_feature_importance(target)
        except ImportError:
            # Return default feature importance
            importance = {
                "follower_count": 0.25,
                "visual_quality_score": 0.20,
                "hook_strength_score": 0.15,
                "trending_alignment_score": 0.12,
                "caption_length": 0.08,
                "hashtag_count": 0.07,
                "post_hour": 0.06,
                "creator_avg_engagement": 0.05,
                "post_day_of_week": 0.02,
            }

        # Sort by importance
        sorted_importance = dict(sorted(
            importance.items(),
            key=lambda x: x[1],
            reverse=True
        ))

        return FeatureImportanceResponse(
            target=target,
            feature_importance=sorted_importance,
            top_features=list(sorted_importance.keys())[:10],
        )

    except Exception as e:
        logger.error(f"Error getting feature importance: {str(e)}", exc_info=True)
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
            "outcome_learning",
            "batch_prediction",
            "model_versioning",
            "ab_testing",
            "feature_importance"
        ],
        "endpoints": {
            "predict": "POST /predict - Predict content performance",
            "virality": "POST /predict/virality - Predict viral potential",
            "optimize": "POST /optimize - Get basic optimization suggestions",
            "compare": "POST /compare - Compare two content variants",
            "recommend_detailed": "POST /recommend/detailed - Get detailed, actionable recommendations",
            "learn_outcome": "POST /learn/outcome - Report actual performance for learning",
            "batch_predict": "POST /batch/predict - Batch predictions for multiple content items",
            "models_health": "GET /models/health - Get model health and cache statistics",
            "feature_importance": "GET /models/feature-importance/{target} - Get feature importance"
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
