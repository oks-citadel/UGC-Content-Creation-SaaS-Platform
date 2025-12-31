from fastapi import APIRouter
from typing import Any, Dict

from ..config import settings
from ..services.proxy_service import proxy_service

router = APIRouter()


@router.post("/content/match")
async def match_content(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.recommendation_engine_url,
        "/api/content/match",
        method="POST",
        data=data,
    )
    return result


@router.post("/creators/recommend")
async def recommend_creators(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.recommendation_engine_url,
        "/api/creators/recommend",
        method="POST",
        data=data,
    )
    return result


@router.post("/campaigns/optimize")
async def optimize_campaign(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.recommendation_engine_url,
        "/api/campaigns/optimize",
        method="POST",
        data=data,
    )
    return result
