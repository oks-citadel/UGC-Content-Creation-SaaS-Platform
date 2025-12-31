from fastapi import APIRouter, HTTPException
from typing import Any, Dict
from pydantic import BaseModel

from ..services.automation_service import automation_service

router = APIRouter()


class CreateFlowRequest(BaseModel):
    name: str
    trigger: Dict[str, Any]
    actions: list
    conditions: list = None


class GenerateFlowRequest(BaseModel):
    goal: str
    target_audience: Dict[str, Any]
    available_actions: list


@router.post("/flows")
async def create_automation_flow(request: CreateFlowRequest):
    flow = await automation_service.create_flow(request.model_dump())
    return {"success": True, "flow": flow}


@router.get("/flows/{flow_id}")
async def get_automation_flow(flow_id: str):
    flow = await automation_service.get_flow(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {"success": True, "flow": flow}


@router.put("/flows/{flow_id}")
async def update_automation_flow(flow_id: str, updates: Dict[str, Any]):
    flow = await automation_service.update_flow(flow_id, updates)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {"success": True, "flow": flow}


@router.delete("/flows/{flow_id}")
async def delete_automation_flow(flow_id: str):
    success = await automation_service.delete_flow(flow_id)
    if not success:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {"success": True}


@router.post("/flows/{flow_id}/activate")
async def activate_flow(flow_id: str):
    flow = await automation_service.activate_flow(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {"success": True, "flow": flow}


@router.post("/flows/{flow_id}/deactivate")
async def deactivate_flow(flow_id: str):
    flow = await automation_service.deactivate_flow(flow_id)
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {"success": True, "flow": flow}


@router.post("/flows/generate")
async def generate_flow_from_goal(request: GenerateFlowRequest):
    flow_template = await automation_service.generate_flow_from_goal(
        request.goal,
        request.target_audience,
        request.available_actions,
    )
    return {"success": True, "flow_template": flow_template}


@router.get("/flows/{flow_id}/analytics")
async def get_flow_analytics(flow_id: str):
    analytics = await automation_service.get_flow_analytics(flow_id)
    return {"success": True, "analytics": analytics}
