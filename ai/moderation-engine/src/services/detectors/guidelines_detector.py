import logging
from typing import List, Dict, Any, Optional
import re

from ...models import BrandGuidelinesResult, GuidelineViolation, ModerationSeverity

logger = logging.getLogger(__name__)


class GuidelinesDetector:
    """Detector for brand guideline compliance."""

    async def check_guidelines(
        self,
        content_url: Optional[str],
        text_content: Optional[str],
        brand_guidelines: Dict[str, Any]
    ) -> BrandGuidelinesResult:
        """
        Check content against brand-specific guidelines.

        Brand guidelines can include:
        - Required keywords/messaging
        - Prohibited words/phrases
        - Tone of voice requirements
        - Hashtag requirements
        - Visual requirements
        """
        try:
            violations = []

            # Check text-based guidelines
            if text_content:
                text_violations = await self._check_text_guidelines(
                    text_content,
                    brand_guidelines
                )
                violations.extend(text_violations)

            # Check visual guidelines (if applicable)
            if content_url and "visual_guidelines" in brand_guidelines:
                visual_violations = await self._check_visual_guidelines(
                    content_url,
                    brand_guidelines["visual_guidelines"]
                )
                violations.extend(visual_violations)

            # Calculate compliance score
            total_guidelines = len(violations) if violations else 1
            violated_count = sum(1 for v in violations if v.violated)

            compliance_score = 1.0 - (violated_count / max(total_guidelines, 1))

            # Determine if compliant
            compliant = compliance_score >= 0.7 and not any(
                v.violated and v.severity == ModerationSeverity.CRITICAL
                for v in violations
            )

            # Generate summary
            summary = self._generate_guidelines_summary(violations, compliance_score)

            return BrandGuidelinesResult(
                compliant=compliant,
                violations=violations,
                compliance_score=compliance_score,
                summary=summary
            )

        except Exception as e:
            logger.error(f"Error checking brand guidelines: {str(e)}", exc_info=True)
            raise

    async def _check_text_guidelines(
        self,
        text_content: str,
        brand_guidelines: Dict[str, Any]
    ) -> List[GuidelineViolation]:
        """Check text content against brand guidelines."""
        violations = []

        text_lower = text_content.lower()

        # Required keywords
        if "required_keywords" in brand_guidelines:
            required = brand_guidelines["required_keywords"]
            missing_keywords = [kw for kw in required if kw.lower() not in text_lower]

            if missing_keywords:
                violations.append(GuidelineViolation(
                    guideline="required_keywords",
                    violated=True,
                    severity=ModerationSeverity.WARNING,
                    description=f"Missing required keywords: {', '.join(missing_keywords)}",
                    suggestion=f"Include these keywords in your caption: {', '.join(missing_keywords)}"
                ))

        # Prohibited words
        if "prohibited_words" in brand_guidelines:
            prohibited = brand_guidelines["prohibited_words"]
            found_prohibited = [word for word in prohibited if word.lower() in text_lower]

            if found_prohibited:
                violations.append(GuidelineViolation(
                    guideline="prohibited_words",
                    violated=True,
                    severity=ModerationSeverity.VIOLATION,
                    description=f"Contains prohibited words: {', '.join(found_prohibited)}",
                    suggestion=f"Remove these words: {', '.join(found_prohibited)}"
                ))

        # Required hashtags
        if "required_hashtags" in brand_guidelines:
            required_hashtags = brand_guidelines["required_hashtags"]
            hashtags_in_content = re.findall(r'#\w+', text_content.lower())

            missing_hashtags = [
                ht for ht in required_hashtags
                if ht.lower() not in hashtags_in_content
            ]

            if missing_hashtags:
                violations.append(GuidelineViolation(
                    guideline="required_hashtags",
                    violated=True,
                    severity=ModerationSeverity.WARNING,
                    description=f"Missing required hashtags: {', '.join(missing_hashtags)}",
                    suggestion=f"Add these hashtags: {', '.join(missing_hashtags)}"
                ))

        # Tone of voice
        if "tone" in brand_guidelines:
            tone_requirement = brand_guidelines["tone"]
            tone_violation = self._check_tone(text_content, tone_requirement)

            if tone_violation:
                violations.append(tone_violation)

        # Message requirements
        if "required_message" in brand_guidelines:
            required_msg = brand_guidelines["required_message"].lower()
            if required_msg not in text_lower:
                violations.append(GuidelineViolation(
                    guideline="required_message",
                    violated=True,
                    severity=ModerationSeverity.WARNING,
                    description="Required brand message not found",
                    suggestion=f"Include this message: {brand_guidelines['required_message']}"
                ))

        # Character limit
        if "max_characters" in brand_guidelines:
            max_chars = brand_guidelines["max_characters"]
            if len(text_content) > max_chars:
                violations.append(GuidelineViolation(
                    guideline="character_limit",
                    violated=True,
                    severity=ModerationSeverity.WARNING,
                    description=f"Caption exceeds {max_chars} characters ({len(text_content)} characters)",
                    suggestion=f"Shorten caption to under {max_chars} characters"
                ))

        return violations

    async def _check_visual_guidelines(
        self,
        content_url: str,
        visual_guidelines: Dict[str, Any]
    ) -> List[GuidelineViolation]:
        """Check visual content against brand guidelines."""
        violations = []

        # In production, this would analyze images/videos for:
        # - Logo placement
        # - Color scheme
        # - Brand elements
        # - Visual style

        # Placeholder implementation
        if "logo_required" in visual_guidelines and visual_guidelines["logo_required"]:
            # Would check for logo presence
            pass

        return violations

    def _check_tone(self, text: str, required_tone: str) -> Optional[GuidelineViolation]:
        """Check if text matches required tone of voice."""

        # Simple tone detection (in production, use NLP models)
        text_lower = text.lower()

        tone_indicators = {
            "professional": ["we", "our", "please", "thank you"],
            "casual": ["hey", "cool", "awesome", "love"],
            "friendly": ["you", "your", "!", "thanks"],
            "formal": ["we are pleased", "kindly", "sincerely"],
        }

        required_tone_lower = required_tone.lower()

        if required_tone_lower in tone_indicators:
            indicators = tone_indicators[required_tone_lower]
            indicator_count = sum(1 for ind in indicators if ind in text_lower)

            if indicator_count < 2:
                return GuidelineViolation(
                    guideline="tone_of_voice",
                    violated=True,
                    severity=ModerationSeverity.WARNING,
                    description=f"Content does not match required '{required_tone}' tone",
                    suggestion=f"Adjust language to be more {required_tone}"
                )

        return None

    def _generate_guidelines_summary(
        self,
        violations: List[GuidelineViolation],
        compliance_score: float
    ) -> str:
        """Generate summary of guidelines check."""

        if compliance_score >= 0.9:
            return "Content fully complies with brand guidelines."

        if compliance_score >= 0.7:
            return f"Content mostly complies with guidelines ({compliance_score*100:.0f}% compliant) with minor adjustments needed."

        critical_violations = [v for v in violations if v.violated and v.severity == ModerationSeverity.CRITICAL]

        if critical_violations:
            return f"Content has {len(critical_violations)} critical guideline violation(s) that must be addressed."

        violation_count = sum(1 for v in violations if v.violated)
        return f"Content has {violation_count} guideline violation(s) ({compliance_score*100:.0f}% compliant). Review and address issues."
