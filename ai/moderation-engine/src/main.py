from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from .config import settings
from .models import (
    ModerationRequest,
    ModerationResponse,
    ComplianceCheckRequest,
    GuidelinesCheckRequest,
    BrandSafetyResult,
    FTCComplianceResult,
    BrandGuidelinesResult,
    HealthResponse,
)
from .services.moderation_service import ModerationService

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
    title="NEXUS Moderation Engine",
    description="AI-powered content moderation and compliance checking",
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
moderation_service = ModerationService()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        service=settings.service_name,
        version=settings.version,
        models_loaded={
            "safety_detector": True,
            "compliance_detector": True,
            "guidelines_detector": True,
            "competitor_detector": True
        }
    )


@app.post("/moderate", response_model=ModerationResponse)
async def moderate_content(request: ModerationRequest):
    """
    Comprehensive content moderation.

    Performs all enabled checks:
    - Brand safety (inappropriate content detection)
    - FTC compliance (disclosure requirements)
    - Brand guidelines adherence
    - Competitor mentions

    Returns:
    - Overall approval status
    - Severity level
    - Detailed results for each check
    - Required actions for non-compliant content
    """
    try:
        logger.info(f"Moderating content: {request.content_id}")
        result = await moderation_service.moderate_content(request)
        return result

    except Exception as e:
        logger.error(f"Error in moderate endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/check-compliance", response_model=FTCComplianceResult)
async def check_ftc_compliance(request: ComplianceCheckRequest):
    """
    Check FTC compliance for sponsored content.

    Verifies:
    - Presence of required disclosure
    - Disclosure prominence and clarity
    - Platform-specific requirements

    Returns:
    - Compliance status
    - Detected disclosures
    - Issues and recommendations
    """
    try:
        logger.info(f"Checking FTC compliance for: {request.content_id}")
        result = await moderation_service.check_ftc_compliance(
            request.text_content,
            request.content_type
        )
        return result

    except Exception as e:
        logger.error(f"Error in check_compliance endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/check-guidelines", response_model=BrandGuidelinesResult)
async def check_brand_guidelines(request: GuidelinesCheckRequest):
    """
    Check content against brand-specific guidelines.

    Validates:
    - Required keywords and messaging
    - Prohibited words/phrases
    - Tone of voice
    - Visual guidelines (if applicable)
    - Hashtag requirements

    Returns:
    - Compliance status
    - List of violations with severity
    - Compliance score
    - Actionable suggestions
    """
    try:
        logger.info(f"Checking brand guidelines for: {request.content_id}")
        result = await moderation_service.check_brand_guidelines(
            request.content_url,
            request.text_content,
            request.brand_guidelines
        )
        return result

    except Exception as e:
        logger.error(f"Error in check_guidelines endpoint: {str(e)}", exc_info=True)
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
            "brand_safety_detection",
            "ftc_compliance_checking",
            "brand_guidelines_validation",
            "competitor_detection"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8003,
        reload=settings.debug
    )
