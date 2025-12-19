from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from typing import Dict

from .config import settings
from .models import (
    VideoGenerationRequest,
    VideoVariantRequest,
    CaptionRequest,
    MusicRequest,
    VideoResponse,
    VideoVariantsResponse,
    TemplateListResponse,
    HealthResponse,
)
from .services.video_service import VideoGenerationService
from .services.template_service import TemplateService

# Configure logging
logging.basicConfig(
    level=logging.INFO if not settings.debug else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.service_name} v{settings.version}")
    yield
    # Shutdown
    logger.info(f"Shutting down {settings.service_name}")


# Initialize FastAPI app
app = FastAPI(
    title="NEXUS Video Generator Service",
    description="AI-powered UGC video generation service",
    version=settings.version,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
video_service = VideoGenerationService()
template_service = TemplateService()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    dependencies = {
        "openai": "connected" if settings.openai_api_key else "not_configured",
        "replicate": "connected" if settings.replicate_api_token else "not_configured",
        "storage": "s3" if settings.s3_bucket else "local",
    }

    return HealthResponse(
        status="healthy",
        service=settings.service_name,
        version=settings.version,
        dependencies=dependencies
    )


@app.post("/generate", response_model=VideoResponse)
async def generate_video(
    request: VideoGenerationRequest,
    background_tasks: BackgroundTasks
):
    """
    Generate a UGC video from images, script, and voice settings.

    This endpoint creates a complete UGC video with:
    - Images stitched together
    - AI-generated voiceover from script
    - Optional captions
    - Optional background music
    - Template styling applied
    """
    try:
        logger.info(f"Received video generation request with template: {request.template}")

        # Generate video
        result = await video_service.generate_ugc_video(request)

        return result

    except Exception as e:
        logger.error(f"Error in generate_video endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/variants", response_model=VideoVariantsResponse)
async def generate_variants(request: VideoVariantRequest):
    """
    Generate multiple video variants for A/B testing.

    Creates variations with different:
    - Templates
    - Caption styles
    - Music tracks
    - Aspect ratios
    - Pacing
    """
    try:
        logger.info(f"Generating {request.num_variants} video variants")

        variants = await video_service.generate_video_variants(request)

        from datetime import datetime
        return VideoVariantsResponse(
            job_id=variants[0].job_id if variants else "error",
            variants=variants,
            status="completed" if variants else "failed",
            created_at=datetime.utcnow().isoformat()
        )

    except Exception as e:
        logger.error(f"Error in generate_variants endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/captions", response_model=VideoResponse)
async def add_captions(request: CaptionRequest):
    """
    Add captions to an existing video.

    Can auto-generate transcript or use provided text.
    Supports custom caption styling.
    """
    try:
        logger.info(f"Adding captions to video: {request.video_url}")

        result = await video_service.add_captions_to_video(request)

        return result

    except Exception as e:
        logger.error(f"Error in add_captions endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/music", response_model=VideoResponse)
async def add_music(request: MusicRequest):
    """
    Add background music to a video.

    Supports:
    - Custom music tracks
    - Volume control
    - Beat synchronization
    - Fade in/out
    """
    try:
        logger.info(f"Adding music to video: {request.video_url}")

        result = await video_service.add_music_to_video(request)

        return result

    except Exception as e:
        logger.error(f"Error in add_music endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/templates", response_model=TemplateListResponse)
async def list_templates():
    """
    Get list of all available video templates.

    Returns template information including:
    - Description
    - Recommended use cases
    - Supported aspect ratios
    - Features
    """
    try:
        templates = template_service.list_templates()

        return TemplateListResponse(
            templates=templates,
            total=len(templates)
        )

    except Exception as e:
        logger.error(f"Error in list_templates endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get details for a specific template."""
    try:
        template = template_service.get_template(template_id)
        return template

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error in get_template endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": settings.service_name,
        "version": settings.version,
        "status": "running",
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
