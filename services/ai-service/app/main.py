from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import structlog
from datetime import datetime
import uuid

from .config import settings
from .models import (
    GenerateImageRequest,
    GenerateScriptRequest,
    GenerateCaptionRequest,
    GenerateHashtagsRequest,
    AnalyzeContentRequest,
    GenerationResponse,
    GenerationType,
    GenerationStatus,
    ImageGenerationResult,
    ScriptGenerationResult,
    CaptionGenerationResult,
    HashtagGenerationResult,
    ContentAnalysisResult,
    HealthResponse,
)
from .services.openai_service import openai_service

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Create FastAPI app
app = FastAPI(
    title="NEXUS AI Service",
    description="AI-powered content generation and analysis service",
    version="1.0.0",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
)

# CORS
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)


# Auth dependency
async def get_user_id(x_user_id: str = Header(None)) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return x_user_id


# Health endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(
        status="healthy",
        service=settings.service_name,
    )


@app.get("/ready", response_model=HealthResponse)
async def readiness_check():
    # Could add database/redis connectivity checks here
    return HealthResponse(
        status="ready",
        service=settings.service_name,
    )


# Image Generation
@app.post("/generate/image", response_model=GenerationResponse)
async def generate_image(
    request: GenerateImageRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_user_id),
):
    """Generate images using AI."""
    generation_id = str(uuid.uuid4())

    logger.info(
        "Image generation requested",
        generation_id=generation_id,
        user_id=user_id,
        prompt=request.prompt[:100],
    )

    try:
        # Map aspect ratio to size
        size_map = {
            "1:1": "1024x1024",
            "16:9": "1792x1024",
            "9:16": "1024x1792",
        }
        size = size_map.get(request.aspect_ratio, "1024x1024")

        result = await openai_service.generate_image(
            prompt=request.prompt,
            size=size,
            quality=request.quality,
            n=request.num_images,
            style=request.style or "vivid",
        )

        return GenerationResponse(
            id=generation_id,
            type=GenerationType.IMAGE,
            status=GenerationStatus.COMPLETED,
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            result_url=result["images"][0] if result["images"] else None,
            metadata={
                "images": result["images"],
                "revised_prompt": result.get("revised_prompt"),
            },
        )
    except Exception as e:
        logger.error("Image generation failed", error=str(e), generation_id=generation_id)
        return GenerationResponse(
            id=generation_id,
            type=GenerationType.IMAGE,
            status=GenerationStatus.FAILED,
            created_at=datetime.utcnow(),
            error=str(e),
        )


# Script Generation
@app.post("/generate/script", response_model=GenerationResponse)
async def generate_script(
    request: GenerateScriptRequest,
    user_id: str = Depends(get_user_id),
):
    """Generate video scripts."""
    generation_id = str(uuid.uuid4())

    logger.info(
        "Script generation requested",
        generation_id=generation_id,
        user_id=user_id,
        topic=request.topic[:100],
    )

    try:
        result = await openai_service.generate_script(
            topic=request.topic,
            platform=request.platform,
            duration=request.duration,
            tone=request.tone,
            target_audience=request.target_audience,
            key_points=request.key_points,
            brand_guidelines=request.brand_guidelines,
            include_hooks=request.include_hooks,
            include_cta=request.include_cta,
        )

        return GenerationResponse(
            id=generation_id,
            type=GenerationType.SCRIPT,
            status=GenerationStatus.COMPLETED,
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            metadata=result,
        )
    except Exception as e:
        logger.error("Script generation failed", error=str(e), generation_id=generation_id)
        return GenerationResponse(
            id=generation_id,
            type=GenerationType.SCRIPT,
            status=GenerationStatus.FAILED,
            created_at=datetime.utcnow(),
            error=str(e),
        )


# Caption Generation
@app.post("/generate/caption", response_model=GenerationResponse)
async def generate_caption(
    request: GenerateCaptionRequest,
    user_id: str = Depends(get_user_id),
):
    """Generate social media captions."""
    generation_id = str(uuid.uuid4())

    logger.info(
        "Caption generation requested",
        generation_id=generation_id,
        user_id=user_id,
    )

    try:
        result = await openai_service.generate_captions(
            content_description=request.content_description,
            platform=request.platform,
            tone=request.tone,
            max_length=request.max_length,
            include_emojis=request.include_emojis,
            include_hashtags=request.include_hashtags,
            num_variations=request.num_variations,
            brand_voice=request.brand_voice,
        )

        return GenerationResponse(
            id=generation_id,
            type=GenerationType.CAPTION,
            status=GenerationStatus.COMPLETED,
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            metadata=result,
        )
    except Exception as e:
        logger.error("Caption generation failed", error=str(e), generation_id=generation_id)
        return GenerationResponse(
            id=generation_id,
            type=GenerationType.CAPTION,
            status=GenerationStatus.FAILED,
            created_at=datetime.utcnow(),
            error=str(e),
        )


# Hashtag Generation
@app.post("/generate/hashtags", response_model=GenerationResponse)
async def generate_hashtags(
    request: GenerateHashtagsRequest,
    user_id: str = Depends(get_user_id),
):
    """Generate relevant hashtags."""
    generation_id = str(uuid.uuid4())

    logger.info(
        "Hashtag generation requested",
        generation_id=generation_id,
        user_id=user_id,
    )

    try:
        result = await openai_service.generate_hashtags(
            content_description=request.content_description,
            platform=request.platform,
            num_hashtags=request.num_hashtags,
            include_trending=request.include_trending,
            niche=request.niche,
        )

        return GenerationResponse(
            id=generation_id,
            type=GenerationType.HASHTAG,
            status=GenerationStatus.COMPLETED,
            created_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            metadata=result,
        )
    except Exception as e:
        logger.error("Hashtag generation failed", error=str(e), generation_id=generation_id)
        return GenerationResponse(
            id=generation_id,
            type=GenerationType.HASHTAG,
            status=GenerationStatus.FAILED,
            created_at=datetime.utcnow(),
            error=str(e),
        )


# Content Analysis
@app.post("/analyze/content", response_model=ContentAnalysisResult)
async def analyze_content(
    request: AnalyzeContentRequest,
    user_id: str = Depends(get_user_id),
):
    """Analyze content using AI vision."""
    logger.info(
        "Content analysis requested",
        user_id=user_id,
        content_url=request.content_url[:100],
    )

    try:
        result = await openai_service.analyze_content(
            image_url=request.content_url,
            analysis_type=request.analysis_type,
        )

        return ContentAnalysisResult(
            overall_score=result.get("overall_score", 75),
            sentiment=result.get("sentiment", "neutral"),
            engagement_prediction=result.get("engagement_prediction", "medium"),
            suggestions=result.get("suggestions", []),
            detected_objects=result.get("detected_objects"),
            detected_text=result.get("detected_text"),
            brand_safety_score=result.get("brand_safety_score", 90),
            accessibility_score=result.get("accessibility_score", 80),
        )
    except Exception as e:
        logger.error("Content analysis failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)
