"""
Handoff Service for managing transfers to human agents.
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from enum import Enum
import logging
import uuid
from datetime import datetime
import httpx

from ..config import settings

logger = logging.getLogger(__name__)


class HandoffStatus(str, Enum):
    REQUESTED = "requested"
    QUEUED = "queued"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class HandoffPriority(str, Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class HandoffReason(str, Enum):
    CUSTOMER_REQUEST = "customer_request"
    SENTIMENT_ESCALATION = "sentiment_escalation"
    COMPLEXITY = "complexity"
    POLICY_VIOLATION = "policy_violation"
    SALES_OPPORTUNITY = "sales_opportunity"
    TECHNICAL_ISSUE = "technical_issue"
    VIP_CUSTOMER = "vip_customer"


class HandoffRequest(BaseModel):
    conversation_id: str
    customer_id: Optional[str] = None
    reason: HandoffReason
    priority: HandoffPriority = HandoffPriority.MEDIUM
    notes: Optional[str] = None
    context_summary: Optional[str] = None
    requested_team: Optional[str] = None


class HandoffResponse(BaseModel):
    handoff_id: str
    status: HandoffStatus
    queue_position: Optional[int] = None
    estimated_wait_time: Optional[str] = None
    assigned_agent: Optional[str] = None
    message: str


class TransferRequest(BaseModel):
    handoff_id: str
    target_agent_id: Optional[str] = None
    target_team: Optional[str] = None
    notes: Optional[str] = None


class TransferResponse(BaseModel):
    success: bool
    handoff_id: str
    status: HandoffStatus
    assigned_agent: Optional[str] = None
    message: str


class HandoffStatusResponse(BaseModel):
    handoff_id: str
    status: HandoffStatus
    queue_position: Optional[int] = None
    estimated_wait_time: Optional[str] = None
    assigned_agent: Optional[str] = None
    created_at: str
    updated_at: str
    conversation_id: str
    priority: HandoffPriority


class HandoffService:
    """Service for managing customer-to-agent handoffs."""

    def __init__(self):
        # In-memory storage for demo purposes
        # In production, this would use Redis or a database
        self.handoffs: Dict[str, Dict[str, Any]] = {}
        self.queues: Dict[str, List[str]] = {
            "general_support": [],
            "technical_team": [],
            "sales_team": [],
            "senior_support": [],
            "compliance_team": [],
        }
        self.available_agents: Dict[str, List[str]] = {
            "general_support": ["agent_001", "agent_002", "agent_003"],
            "technical_team": ["tech_001", "tech_002"],
            "sales_team": ["sales_001", "sales_002"],
            "senior_support": ["senior_001"],
            "compliance_team": ["compliance_001"],
        }

    async def request_handoff(self, request: HandoffRequest) -> HandoffResponse:
        """Request a handoff to a human agent."""
        handoff_id = f"HO-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.utcnow()

        # Determine target team
        target_team = request.requested_team or self._get_team_for_reason(request.reason)

        # Create handoff record
        handoff = {
            "id": handoff_id,
            "conversation_id": request.conversation_id,
            "customer_id": request.customer_id,
            "reason": request.reason.value,
            "priority": request.priority.value,
            "notes": request.notes,
            "context_summary": request.context_summary,
            "target_team": target_team,
            "status": HandoffStatus.REQUESTED.value,
            "assigned_agent": None,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }

        # Store handoff
        self.handoffs[handoff_id] = handoff

        # Add to queue
        queue_position = self._add_to_queue(handoff_id, target_team, request.priority)

        # Try to auto-assign if agents available
        assigned_agent = await self._try_auto_assign(handoff_id, target_team)

        if assigned_agent:
            status = HandoffStatus.ASSIGNED
            message = f"Your request has been assigned to {assigned_agent}. They will join shortly."
            estimated_wait = "< 2 minutes"
        else:
            status = HandoffStatus.QUEUED
            message = f"Your request has been queued. You are position {queue_position} in line."
            estimated_wait = self._estimate_wait_time(queue_position, request.priority)

        # Update status
        self.handoffs[handoff_id]["status"] = status.value
        self.handoffs[handoff_id]["updated_at"] = datetime.utcnow().isoformat()

        # Send notification to team
        await self._notify_team(handoff_id, target_team, request.priority)

        return HandoffResponse(
            handoff_id=handoff_id,
            status=status,
            queue_position=queue_position if not assigned_agent else None,
            estimated_wait_time=estimated_wait,
            assigned_agent=assigned_agent,
            message=message,
        )

    async def transfer(self, request: TransferRequest) -> TransferResponse:
        """Transfer a handoff to another agent or team."""
        if request.handoff_id not in self.handoffs:
            return TransferResponse(
                success=False,
                handoff_id=request.handoff_id,
                status=HandoffStatus.CANCELLED,
                message="Handoff not found",
            )

        handoff = self.handoffs[request.handoff_id]
        now = datetime.utcnow()

        # Determine new assignment
        if request.target_agent_id:
            assigned_agent = request.target_agent_id
            status = HandoffStatus.ASSIGNED
        elif request.target_team:
            # Try to auto-assign from new team
            assigned_agent = await self._try_auto_assign(request.handoff_id, request.target_team)
            status = HandoffStatus.ASSIGNED if assigned_agent else HandoffStatus.QUEUED
        else:
            return TransferResponse(
                success=False,
                handoff_id=request.handoff_id,
                status=HandoffStatus(handoff["status"]),
                message="Must specify target_agent_id or target_team",
            )

        # Update handoff
        handoff["status"] = status.value
        handoff["assigned_agent"] = assigned_agent
        handoff["updated_at"] = now.isoformat()
        if request.notes:
            handoff["notes"] = (handoff.get("notes") or "") + f"\n[Transfer note]: {request.notes}"

        # Notify new agent/team
        if request.target_team:
            await self._notify_team(request.handoff_id, request.target_team, HandoffPriority(handoff["priority"]))

        return TransferResponse(
            success=True,
            handoff_id=request.handoff_id,
            status=status,
            assigned_agent=assigned_agent,
            message=f"Transferred to {assigned_agent or request.target_team}",
        )

    async def get_status(self, handoff_id: str) -> Optional[HandoffStatusResponse]:
        """Get the status of a handoff."""
        if handoff_id not in self.handoffs:
            return None

        handoff = self.handoffs[handoff_id]

        # Calculate current queue position
        queue_position = None
        if handoff["status"] == HandoffStatus.QUEUED.value:
            target_team = handoff.get("target_team", "general_support")
            if target_team in self.queues and handoff_id in self.queues[target_team]:
                queue_position = self.queues[target_team].index(handoff_id) + 1

        return HandoffStatusResponse(
            handoff_id=handoff_id,
            status=HandoffStatus(handoff["status"]),
            queue_position=queue_position,
            estimated_wait_time=self._estimate_wait_time(queue_position, HandoffPriority(handoff["priority"])) if queue_position else None,
            assigned_agent=handoff.get("assigned_agent"),
            created_at=handoff["created_at"],
            updated_at=handoff["updated_at"],
            conversation_id=handoff["conversation_id"],
            priority=HandoffPriority(handoff["priority"]),
        )

    async def complete_handoff(self, handoff_id: str, resolution_notes: Optional[str] = None) -> bool:
        """Mark a handoff as completed."""
        if handoff_id not in self.handoffs:
            return False

        handoff = self.handoffs[handoff_id]
        handoff["status"] = HandoffStatus.COMPLETED.value
        handoff["updated_at"] = datetime.utcnow().isoformat()
        if resolution_notes:
            handoff["resolution_notes"] = resolution_notes

        # Remove from queue if present
        target_team = handoff.get("target_team", "general_support")
        if target_team in self.queues and handoff_id in self.queues[target_team]:
            self.queues[target_team].remove(handoff_id)

        return True

    async def cancel_handoff(self, handoff_id: str, reason: Optional[str] = None) -> bool:
        """Cancel a handoff request."""
        if handoff_id not in self.handoffs:
            return False

        handoff = self.handoffs[handoff_id]
        handoff["status"] = HandoffStatus.CANCELLED.value
        handoff["updated_at"] = datetime.utcnow().isoformat()
        if reason:
            handoff["cancellation_reason"] = reason

        # Remove from queue
        target_team = handoff.get("target_team", "general_support")
        if target_team in self.queues and handoff_id in self.queues[target_team]:
            self.queues[target_team].remove(handoff_id)

        return True

    def _get_team_for_reason(self, reason: HandoffReason) -> str:
        """Map handoff reason to appropriate team."""
        mapping = {
            HandoffReason.CUSTOMER_REQUEST: "general_support",
            HandoffReason.SENTIMENT_ESCALATION: "senior_support",
            HandoffReason.COMPLEXITY: "technical_team",
            HandoffReason.POLICY_VIOLATION: "compliance_team",
            HandoffReason.SALES_OPPORTUNITY: "sales_team",
            HandoffReason.TECHNICAL_ISSUE: "technical_team",
            HandoffReason.VIP_CUSTOMER: "senior_support",
        }
        return mapping.get(reason, "general_support")

    def _add_to_queue(self, handoff_id: str, team: str, priority: HandoffPriority) -> int:
        """Add handoff to team queue with priority ordering."""
        if team not in self.queues:
            self.queues[team] = []

        queue = self.queues[team]

        # Insert based on priority
        priority_order = {
            HandoffPriority.URGENT: 0,
            HandoffPriority.HIGH: 1,
            HandoffPriority.MEDIUM: 2,
            HandoffPriority.LOW: 3,
        }

        insert_position = len(queue)
        for i, existing_id in enumerate(queue):
            existing = self.handoffs.get(existing_id, {})
            existing_priority = HandoffPriority(existing.get("priority", "medium"))
            if priority_order[priority] < priority_order[existing_priority]:
                insert_position = i
                break

        queue.insert(insert_position, handoff_id)
        return insert_position + 1

    async def _try_auto_assign(self, handoff_id: str, team: str) -> Optional[str]:
        """Try to automatically assign an available agent."""
        if team not in self.available_agents:
            return None

        agents = self.available_agents[team]
        if agents:
            # In production, check actual agent availability
            assigned = agents[0]  # Simple round-robin for demo
            self.handoffs[handoff_id]["assigned_agent"] = assigned
            return assigned

        return None

    def _estimate_wait_time(self, position: Optional[int], priority: HandoffPriority) -> str:
        """Estimate wait time based on queue position and priority."""
        if position is None:
            return "Unknown"

        base_time_per_position = 5  # minutes

        priority_multiplier = {
            HandoffPriority.URGENT: 0.5,
            HandoffPriority.HIGH: 0.75,
            HandoffPriority.MEDIUM: 1.0,
            HandoffPriority.LOW: 1.5,
        }

        estimated_minutes = int(position * base_time_per_position * priority_multiplier[priority])

        if estimated_minutes < 5:
            return "< 5 minutes"
        elif estimated_minutes < 15:
            return "< 15 minutes"
        elif estimated_minutes < 30:
            return "< 30 minutes"
        elif estimated_minutes < 60:
            return "< 1 hour"
        else:
            hours = estimated_minutes // 60
            return f"~ {hours} hour{'s' if hours > 1 else ''}"

    async def _notify_team(self, handoff_id: str, team: str, priority: HandoffPriority) -> bool:
        """Send notification to team about new handoff."""
        try:
            handoff = self.handoffs.get(handoff_id, {})

            async with httpx.AsyncClient() as client:
                notification_payload = {
                    "type": "handoff_request",
                    "priority": priority.value,
                    "recipient": team,
                    "data": {
                        "handoff_id": handoff_id,
                        "conversation_id": handoff.get("conversation_id"),
                        "customer_id": handoff.get("customer_id"),
                        "reason": handoff.get("reason"),
                        "notes": handoff.get("notes"),
                    }
                }

                response = await client.post(
                    f"{settings.notification_service_url}/notifications/send",
                    json=notification_payload,
                    timeout=5.0
                )

                return response.status_code == 200

        except Exception as e:
            logger.warning(f"Failed to send handoff notification: {str(e)}")
            return False


handoff_service = HandoffService()
