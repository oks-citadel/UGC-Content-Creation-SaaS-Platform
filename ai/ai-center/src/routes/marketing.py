from fastapi import APIRouter, HTTPException
from typing import Any, Dict

from ..config import settings
from ..services.proxy_service import proxy_service

router = APIRouter()


@router.post("/campaigns/generate")
async def generate_campaign(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.marketing_agent_url,
        "/api/campaigns/generate",
        method="POST",
        data=data,
    )
    return result


@router.post("/content/analyze")
async def analyze_content(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.marketing_agent_url,
        "/api/content/analyze",
        method="POST",
        data=data,
    )
    return result


@router.post("/trends/analyze")
async def analyze_trends(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.marketing_agent_url,
        "/api/trends/analyze",
        method="POST",
        data=data,
    )
    return result
