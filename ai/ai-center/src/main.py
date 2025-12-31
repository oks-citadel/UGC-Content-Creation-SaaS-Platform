from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import httpx

from .config import settings
from .routes import marketing, customer, video, recommendation
from .services.proxy_service import proxy_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    await proxy_service.init()
    yield
    await proxy_service.close()

app = FastAPI(
    title="NEXUS AI Center",
    description="Unified API gateway for all NEXUS AI services",
    version=settings.version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(marketing.router, prefix="/api/marketing", tags=["Marketing Agent"])
app.include_router(customer.router, prefix="/api/customer", tags=["Customer Agent"])
app.include_router(video.router, prefix="/api/video", tags=["Video Generator"])
app.include_router(recommendation.router, prefix="/api/recommendation", tags=["Recommendation Engine"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.service_name, "version": settings.version}

@app.get("/services")
async def list_services():
    return {
        "services": [
            {"name": "marketing-agent", "url": settings.marketing_agent_url},
            {"name": "customer-agent", "url": settings.customer_agent_url},
            {"name": "video-generator", "url": settings.video_generator_url},
            {"name": "recommendation-engine", "url": settings.recommendation_engine_url},
        ]
    }
