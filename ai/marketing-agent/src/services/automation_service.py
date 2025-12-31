from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel


class TriggerType(str, Enum):
    TIME_BASED = "time_based"
    EVENT_BASED = "event_based"
    CONDITION_BASED = "condition_based"


class ActionType(str, Enum):
    SEND_EMAIL = "send_email"
    POST_CONTENT = "post_content"
    UPDATE_SEGMENT = "update_segment"
    NOTIFY_TEAM = "notify_team"
    TRIGGER_CAMPAIGN = "trigger_campaign"


class AutomationFlow(BaseModel):
    id: Optional[str] = None
    name: str
    trigger: Dict[str, Any]
    actions: List[Dict[str, Any]]
    conditions: Optional[List[Dict[str, Any]]] = None
    is_active: bool = False


class AutomationService:
    def __init__(self):
        self.flows: Dict[str, AutomationFlow] = {}
    
    async def create_flow(self, flow_data: Dict[str, Any]) -> AutomationFlow:
        from uuid import uuid4
        flow = AutomationFlow(
            id=str(uuid4()),
            **flow_data
        )
        self.flows[flow.id] = flow
        return flow
    
    async def get_flow(self, flow_id: str) -> Optional[AutomationFlow]:
        return self.flows.get(flow_id)
    
    async def update_flow(self, flow_id: str, updates: Dict[str, Any]) -> Optional[AutomationFlow]:
        if flow_id in self.flows:
            flow = self.flows[flow_id]
            for key, value in updates.items():
                if hasattr(flow, key):
                    setattr(flow, key, value)
            return flow
        return None
    
    async def delete_flow(self, flow_id: str) -> bool:
        if flow_id in self.flows:
            del self.flows[flow_id]
            return True
        return False
    
    async def activate_flow(self, flow_id: str) -> Optional[AutomationFlow]:
        return await self.update_flow(flow_id, {"is_active": True})
    
    async def deactivate_flow(self, flow_id: str) -> Optional[AutomationFlow]:
        return await self.update_flow(flow_id, {"is_active": False})
    
    async def generate_flow_from_goal(
        self,
        goal: str,
        target_audience: Dict[str, Any],
        available_actions: List[str],
    ) -> Dict[str, Any]:
        """Generate an automation flow based on marketing goals."""
        
        flow_template = {
            "name": f"Auto-generated flow for: {goal[:50]}",
            "trigger": {
                "type": TriggerType.EVENT_BASED.value,
                "event": "user_signup",
            },
            "actions": [
                {
                    "type": ActionType.SEND_EMAIL.value,
                    "delay": "1h",
                    "template": "welcome_email",
                },
                {
                    "type": ActionType.UPDATE_SEGMENT.value,
                    "delay": "24h",
                    "segment": "engaged_users",
                },
            ],
            "conditions": [
                {
                    "field": "engagement_score",
                    "operator": "greater_than",
                    "value": 50,
                }
            ],
        }
        
        return flow_template
    
    async def get_flow_analytics(self, flow_id: str) -> Dict[str, Any]:
        """Get analytics for an automation flow."""
        return {
            "flow_id": flow_id,
            "executions": 0,
            "success_rate": 0.0,
            "avg_completion_time": "0s",
            "last_execution": None,
        }


automation_service = AutomationService()
