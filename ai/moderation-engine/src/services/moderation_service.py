import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import re

from ..config import settings
from ..models import (
    ModerationRequest,
    ModerationResponse,
    BrandSafetyResult,
    FTCComplianceResult,
    BrandGuidelinesResult,
    CompetitorDetectionResult,
    SafetyIssue,
    ComplianceIssue,
    GuidelineViolation,
    CompetitorMention,
    ModerationSeverity,
    ComplianceCheckRequest,
    GuidelinesCheckRequest,
)
from .detectors.safety_detector import SafetyDetector
from .detectors.compliance_detector import ComplianceDetector
from .detectors.guidelines_detector import GuidelinesDetector
from .detectors.competitor_detector import CompetitorDetector

logger = logging.getLogger(__name__)


class ModerationService:
    """Service for content moderation and compliance checking."""

    def __init__(self):
        self.safety_detector = SafetyDetector()
        self.compliance_detector = ComplianceDetector()
        self.guidelines_detector = GuidelinesDetector()
        self.competitor_detector = CompetitorDetector()

    async def moderate_content(self, request: ModerationRequest) -> ModerationResponse:
        """
        Moderate content for brand safety, compliance, and guidelines.

        Performs comprehensive checks including:
        - Brand safety (inappropriate content detection)
        - FTC compliance (disclosure requirements)
        - Brand guidelines adherence
        - Competitor mentions
        """
        try:
            logger.info(f"Moderating content: {request.content_id}")

            brand_safety = None
            ftc_compliance = None
            brand_guidelines_result = None
            competitor_detection = None

            # Brand safety check
            if request.check_brand_safety:
                brand_safety = await self.check_brand_safety(
                    request.content_url,
                    request.text_content,
                    request.content_type
                )

            # FTC compliance check
            if request.check_compliance and request.text_content:
                ftc_compliance = await self.check_ftc_compliance(
                    request.text_content,
                    request.content_type
                )

            # Brand guidelines check
            if request.check_guidelines and request.brand_guidelines:
                brand_guidelines_result = await self.check_brand_guidelines(
                    request.content_url,
                    request.text_content,
                    request.brand_guidelines
                )

            # Competitor detection
            if settings.competitor_detection_enabled:
                competitor_detection = await self.detect_competitor_mentions(
                    request.content_url,
                    request.text_content,
                    request.brand_id
                )

            # Determine overall approval and severity
            approved, overall_severity, actions_required = self._determine_approval(
                brand_safety,
                ftc_compliance,
                brand_guidelines_result,
                competitor_detection
            )

            return ModerationResponse(
                content_id=request.content_id,
                approved=approved,
                overall_severity=overall_severity,
                brand_safety=brand_safety,
                ftc_compliance=ftc_compliance,
                brand_guidelines=brand_guidelines_result,
                competitor_detection=competitor_detection,
                moderated_at=datetime.utcnow().isoformat(),
                actions_required=actions_required
            )

        except Exception as e:
            logger.error(f"Error moderating content: {str(e)}", exc_info=True)
            raise

    async def check_brand_safety(
        self,
        content_url: Optional[str],
        text_content: Optional[str],
        content_type
    ) -> BrandSafetyResult:
        """
        Check content for brand safety issues.

        Detects:
        - Violence
        - Hate speech
        - Profanity
        - Adult content
        - Drugs/weapons
        - Illegal activity
        """
        try:
            logger.info("Performing brand safety check")

            issues = []
            categories_detected = []

            # Text-based detection
            if text_content:
                text_issues = await self.safety_detector.check_text_safety(text_content)
                issues.extend(text_issues)

            # Visual content detection
            if content_url:
                visual_issues = await self.safety_detector.check_visual_safety(
                    content_url,
                    content_type
                )
                issues.extend(visual_issues)

            # Extract categories
            categories_detected = list(set(issue.category for issue in issues))

            # Calculate overall score
            if not issues:
                overall_score = 1.0
                is_safe = True
            else:
                # Lower score based on severity and number of issues
                severity_weights = {
                    ModerationSeverity.WARNING: 0.1,
                    ModerationSeverity.VIOLATION: 0.3,
                    ModerationSeverity.CRITICAL: 0.5
                }

                total_penalty = sum(
                    severity_weights.get(issue.severity, 0.1) * issue.confidence
                    for issue in issues
                )

                overall_score = max(0.0, 1.0 - total_penalty)
                is_safe = overall_score >= settings.brand_safety_threshold

            # Generate recommendation
            recommendation = self._generate_safety_recommendation(is_safe, issues)

            return BrandSafetyResult(
                is_safe=is_safe,
                overall_score=overall_score,
                issues=issues,
                categories_detected=categories_detected,
                recommendation=recommendation
            )

        except Exception as e:
            logger.error(f"Error in brand safety check: {str(e)}", exc_info=True)
            raise

    async def check_ftc_compliance(
        self,
        text_content: str,
        content_type
    ) -> FTCComplianceResult:
        """
        Check FTC compliance for sponsored content disclosures.

        Verifies:
        - Presence of disclosure
        - Disclosure prominence
        - Disclosure clarity
        - Platform-specific requirements
        """
        try:
            logger.info("Performing FTC compliance check")

            result = await self.compliance_detector.check_ftc_compliance(text_content)

            return result

        except Exception as e:
            logger.error(f"Error in FTC compliance check: {str(e)}", exc_info=True)
            raise

    async def check_brand_guidelines(
        self,
        content_url: Optional[str],
        text_content: Optional[str],
        brand_guidelines: Dict[str, Any]
    ) -> BrandGuidelinesResult:
        """
        Check content against brand-specific guidelines.

        Verifies:
        - Logo usage
        - Color scheme
        - Tone of voice
        - Messaging requirements
        - Prohibited content
        """
        try:
            logger.info("Performing brand guidelines check")

            result = await self.guidelines_detector.check_guidelines(
                content_url,
                text_content,
                brand_guidelines
            )

            return result

        except Exception as e:
            logger.error(f"Error in brand guidelines check: {str(e)}", exc_info=True)
            raise

    async def detect_competitor_mentions(
        self,
        content_url: Optional[str],
        text_content: Optional[str],
        brand_id: Optional[str]
    ) -> CompetitorDetectionResult:
        """
        Detect mentions of competitor brands.

        Checks for:
        - Competitor brand names in text
        - Competitor logos in visuals
        - Competitor products in content
        """
        try:
            logger.info("Detecting competitor mentions")

            result = await self.competitor_detector.detect_competitors(
                content_url,
                text_content,
                brand_id
            )

            return result

        except Exception as e:
            logger.error(f"Error in competitor detection: {str(e)}", exc_info=True)
            raise

    def _determine_approval(
        self,
        brand_safety: Optional[BrandSafetyResult],
        ftc_compliance: Optional[FTCComplianceResult],
        brand_guidelines: Optional[BrandGuidelinesResult],
        competitor_detection: Optional[CompetitorDetectionResult]
    ) -> tuple[bool, ModerationSeverity, List[str]]:
        """Determine overall approval status and required actions."""

        approved = True
        severities = []
        actions_required = []

        # Brand safety
        if brand_safety:
            if not brand_safety.is_safe:
                approved = False
                actions_required.append("Address brand safety issues before publishing")

            for issue in brand_safety.issues:
                severities.append(issue.severity)
                if issue.severity in [ModerationSeverity.VIOLATION, ModerationSeverity.CRITICAL]:
                    actions_required.append(f"Remove {issue.category} content")

        # FTC compliance
        if ftc_compliance:
            if not ftc_compliance.is_compliant:
                approved = False
                actions_required.append("Add required FTC disclosure")

            for issue in ftc_compliance.issues:
                severities.append(issue.severity)

            actions_required.extend(ftc_compliance.recommendations)

        # Brand guidelines
        if brand_guidelines:
            if not brand_guidelines.compliant:
                if brand_guidelines.compliance_score < 0.5:
                    approved = False
                    actions_required.append("Major brand guideline violations - requires revision")

            for violation in brand_guidelines.violations:
                if violation.violated:
                    severities.append(violation.severity)
                    if violation.severity == ModerationSeverity.CRITICAL:
                        approved = False

        # Competitor detection
        if competitor_detection and competitor_detection.competitors_detected:
            severities.append(ModerationSeverity.WARNING)
            actions_required.append("Review and remove competitor mentions")

        # Determine overall severity
        if ModerationSeverity.CRITICAL in severities:
            overall_severity = ModerationSeverity.CRITICAL
        elif ModerationSeverity.VIOLATION in severities:
            overall_severity = ModerationSeverity.VIOLATION
        elif ModerationSeverity.WARNING in severities:
            overall_severity = ModerationSeverity.WARNING
        else:
            overall_severity = ModerationSeverity.SAFE

        return approved, overall_severity, list(set(actions_required))

    def _generate_safety_recommendation(
        self,
        is_safe: bool,
        issues: List[SafetyIssue]
    ) -> str:
        """Generate safety recommendation."""

        if is_safe:
            return "Content is brand-safe and approved for publishing."

        critical_issues = [i for i in issues if i.severity == ModerationSeverity.CRITICAL]
        if critical_issues:
            return f"CRITICAL: Content contains {', '.join(i.category for i in critical_issues)}. Cannot be published without major revisions."

        violation_issues = [i for i in issues if i.severity == ModerationSeverity.VIOLATION]
        if violation_issues:
            return f"Content contains violations: {', '.join(i.category for i in violation_issues)}. Requires edits before publishing."

        return "Content has minor safety concerns. Review and address warnings before publishing."
