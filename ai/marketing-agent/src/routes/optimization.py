from fastapi import APIRouter
from typing import Any, Dict, List
from pydantic import BaseModel

from ..services.optimization_service import optimization_service

router = APIRouter()


class CampaignAnalysisRequest(BaseModel):
    campaign_data: Dict[str, Any]
    metrics: Dict[str, Any]


class ContentRecommendationRequest(BaseModel):
    brand_context: Dict[str, Any]
    past_performance: List[Dict[str, Any]]
    trends: List[Dict[str, Any]]


class BudgetOptimizationRequest(BaseModel):
    total_budget: float
    channels: List[Dict[str, Any]]
    goals: List[str]


@router.post("/campaign/analyze")
async def analyze_campaign(request: CampaignAnalysisRequest):
    recommendations = await optimization_service.analyze_campaign_performance(
        request.campaign_data,
        request.metrics,
    )
    return {
        "success": True,
        "recommendations": [r.model_dump() for r in recommendations],
    }


@router.post("/content/recommendations")
async def get_content_recommendations(request: ContentRecommendationRequest):
    recommendations = await optimization_service.generate_content_recommendations(
        request.brand_context,
        request.past_performance,
        request.trends,
    )
    return {"success": True, "recommendations": recommendations}


@router.post("/budget/optimize")
async def optimize_budget(request: BudgetOptimizationRequest):
    allocation = await optimization_service.optimize_budget_allocation(
        request.total_budget,
        request.channels,
        request.goals,
    )
    return {"success": True, "allocation": allocation}
