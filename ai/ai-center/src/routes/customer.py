from fastapi import APIRouter
from typing import Any, Dict

from ..config import settings
from ..services.proxy_service import proxy_service

router = APIRouter()


@router.post("/profile/analyze")
async def analyze_customer_profile(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.customer_agent_url,
        "/api/profile/analyze",
        method="POST",
        data=data,
    )
    return result


@router.post("/segment")
async def segment_customers(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.customer_agent_url,
        "/api/segment",
        method="POST",
        data=data,
    )
    return result


@router.post("/journey/predict")
async def predict_journey(data: Dict[str, Any]):
    result = await proxy_service.forward_request(
        settings.customer_agent_url,
        "/api/journey/predict",
        method="POST",
        data=data,
    )
    return result
