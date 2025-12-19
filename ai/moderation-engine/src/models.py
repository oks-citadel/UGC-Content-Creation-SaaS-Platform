from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class ModerationSeverity(str, Enum):
    SAFE = "safe"
    WARNING = "warning"
    VIOLATION = "violation"
    CRITICAL = "critical"


class ContentType(str, Enum):
    VIDEO = "video"
    IMAGE = "image"
    TEXT = "text"
    AUDIO = "audio"


class ModerationRequest(BaseModel):
    content_id: str
    content_url: Optional[str] = None
    content_type: ContentType
    text_content: Optional[str] = None
    brand_id: Optional[str] = None
    check_brand_safety: bool = True
    check_compliance: bool = True
    check_guidelines: bool = False
    brand_guidelines: Optional[Dict[str, Any]] = None


class SafetyIssue(BaseModel):
    category: str
    severity: ModerationSeverity
    confidence: float = Field(..., ge=0.0, le=1.0)
    description: str
    timestamp_start: Optional[float] = None
    timestamp_end: Optional[float] = None


class BrandSafetyResult(BaseModel):
    is_safe: bool
    overall_score: float = Field(..., ge=0.0, le=1.0)
    issues: List[SafetyIssue]
    categories_detected: List[str]
    recommendation: str


class ComplianceIssue(BaseModel):
    issue_type: str
    severity: ModerationSeverity
    description: str
    required_action: str


class FTCComplianceResult(BaseModel):
    is_compliant: bool
    has_disclosure: bool
    disclosure_type: Optional[str] = None
    disclosure_location: Optional[str] = None
    issues: List[ComplianceIssue]
    recommendations: List[str]


class GuidelineViolation(BaseModel):
    guideline: str
    violated: bool
    severity: ModerationSeverity
    description: str
    suggestion: str


class BrandGuidelinesResult(BaseModel):
    compliant: bool
    violations: List[GuidelineViolation]
    compliance_score: float = Field(..., ge=0.0, le=1.0)
    summary: str


class CompetitorMention(BaseModel):
    competitor_name: str
    mention_type: str  # visual, text, audio
    confidence: float
    context: str
    timestamp: Optional[float] = None


class CompetitorDetectionResult(BaseModel):
    competitors_detected: bool
    mentions: List[CompetitorMention]
    total_mentions: int
    recommendation: str


class ModerationResponse(BaseModel):
    content_id: str
    approved: bool
    overall_severity: ModerationSeverity
    brand_safety: Optional[BrandSafetyResult] = None
    ftc_compliance: Optional[FTCComplianceResult] = None
    brand_guidelines: Optional[BrandGuidelinesResult] = None
    competitor_detection: Optional[CompetitorDetectionResult] = None
    moderated_at: str
    actions_required: List[str]


class ComplianceCheckRequest(BaseModel):
    content_id: str
    text_content: str
    content_type: ContentType
    platform: str


class GuidelinesCheckRequest(BaseModel):
    content_id: str
    content_url: Optional[str] = None
    text_content: Optional[str] = None
    brand_guidelines: Dict[str, Any]


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    models_loaded: Dict[str, bool]
