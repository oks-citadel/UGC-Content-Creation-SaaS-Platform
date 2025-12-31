from fastapi import APIRouter
from typing import Any, Dict

from ..config import settings
from ..services.proxy_service import proxy_service

router = APIRouter()


@router.post("/generate")
async def generate_video(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.video_generator_url,
        "/api/generate",
        method="POST",
        data=data,
    )
    return result


@router.post("/enhance")
async def enhance_video(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.video_generator_url,
        "/api/enhance",
        method="POST",
        data=data,
    )
    return result


@router.get("/status/{job_id}")
async def get_video_status(job_id: str):
    result = await proxy_service.forward_request(
        settings.video_generator_url,
        f"/api/status/{job_id}",
        method="GET",
    )
    return result
