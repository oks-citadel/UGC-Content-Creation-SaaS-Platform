import logging
from typing import List
import re

from ...config import settings
from ...models import FTCComplianceResult, ComplianceIssue, ModerationSeverity

logger = logging.getLogger(__name__)


class ComplianceDetector:
    """Detector for FTC compliance and disclosure requirements."""

    def __init__(self):
        # Disclosure terms that indicate sponsored content
        self.disclosure_terms = settings.ftc_disclosure_terms

        # Strong disclosure indicators (clear and prominent)
        self.strong_disclosures = [
            r'#ad\b',
            r'#sponsored\b',
            r'#paidpartnership',
            r'\bsponsored by\b',
            r'\bpaid partnership\b',
        ]

        # Weak disclosure indicators (may not meet FTC requirements)
        self.weak_disclosures = [
            r'#partner\b',
            r'#collab\b',
            r'\bthanks to\b',
        ]

    async def check_ftc_compliance(self, text_content: str) -> FTCComplianceResult:
        """
        Check if content meets FTC disclosure requirements.

        FTC requires:
        1. Clear and conspicuous disclosure
        2. Disclosure must be unavoidable
        3. Disclosure should be at the beginning
        4. Hashtags alone may not be sufficient
        """
        try:
            text_lower = text_content.lower()

            has_disclosure = False
            disclosure_type = None
            disclosure_location = None
            issues = []
            recommendations = []

            # Check for strong disclosures
            for pattern in self.strong_disclosures:
                match = re.search(pattern, text_lower)
                if match:
                    has_disclosure = True
                    disclosure_type = "strong"

                    # Check disclosure location
                    disclosure_position = match.start() / len(text_content)

                    if disclosure_position < 0.2:  # In first 20% of text
                        disclosure_location = "prominent"
                    elif disclosure_position < 0.5:  # In first 50%
                        disclosure_location = "middle"
                        recommendations.append(
                            "Move disclosure to the beginning for better compliance"
                        )
                    else:  # After 50%
                        disclosure_location = "buried"
                        issues.append(ComplianceIssue(
                            issue_type="disclosure_location",
                            severity=ModerationSeverity.WARNING,
                            description="Disclosure is not prominently placed",
                            required_action="Move disclosure to the beginning of caption"
                        ))

                    break

            # Check for weak disclosures only if no strong disclosure found
            if not has_disclosure:
                for pattern in self.weak_disclosures:
                    if re.search(pattern, text_lower):
                        has_disclosure = True
                        disclosure_type = "weak"

                        issues.append(ComplianceIssue(
                            issue_type="weak_disclosure",
                            severity=ModerationSeverity.VIOLATION,
                            description="Disclosure may not meet FTC requirements",
                            required_action="Use clear disclosure like '#ad' or '#sponsored'"
                        ))

                        break

            # No disclosure found
            if not has_disclosure:
                # Check if content appears to be sponsored
                is_likely_sponsored = self._detect_sponsored_content(text_content)

                if is_likely_sponsored:
                    issues.append(ComplianceIssue(
                        issue_type="missing_disclosure",
                        severity=ModerationSeverity.CRITICAL,
                        description="Content appears to be sponsored but lacks required disclosure",
                        required_action="Add FTC-compliant disclosure (e.g., '#ad', '#sponsored')"
                    ))

                    recommendations.append(
                        "Add '#ad' or '#sponsored' at the beginning of your caption"
                    )

            # Additional compliance checks
            self._check_disclosure_clarity(text_content, issues, recommendations)

            # Determine overall compliance
            is_compliant = (
                has_disclosure and
                disclosure_type == "strong" and
                disclosure_location in ["prominent", "middle"] and
                not any(i.severity == ModerationSeverity.CRITICAL for i in issues)
            )

            return FTCComplianceResult(
                is_compliant=is_compliant,
                has_disclosure=has_disclosure,
                disclosure_type=disclosure_type,
                disclosure_location=disclosure_location,
                issues=issues,
                recommendations=recommendations
            )

        except Exception as e:
            logger.error(f"Error checking FTC compliance: {str(e)}", exc_info=True)
            raise

    def _detect_sponsored_content(self, text: str) -> bool:
        """Detect if content is likely sponsored based on language patterns."""
        sponsored_indicators = [
            'use code',
            'discount code',
            'link in bio',
            'swipe up',
            'shop now',
            'check out',
            'use my link',
            'affiliate',
            'promo code',
            'special offer',
        ]

        text_lower = text.lower()
        indicator_count = sum(1 for indicator in sponsored_indicators if indicator in text_lower)

        # If 2 or more indicators, likely sponsored
        return indicator_count >= 2

    def _check_disclosure_clarity(
        self,
        text: str,
        issues: List[ComplianceIssue],
        recommendations: List[str]
    ):
        """Check if disclosure is clear and not buried in hashtags."""

        # Count hashtags before disclosure
        hashtag_pattern = r'#\w+'
        hashtags = re.findall(hashtag_pattern, text)

        if len(hashtags) > 10:
            # Check if disclosure hashtag is buried
            disclosure_hashtag_positions = []

            for idx, hashtag in enumerate(hashtags):
                if any(term.strip('#') in hashtag.lower() for term in self.disclosure_terms):
                    disclosure_hashtag_positions.append(idx)

            if disclosure_hashtag_positions:
                first_disclosure_position = min(disclosure_hashtag_positions)

                if first_disclosure_position > 5:
                    issues.append(ComplianceIssue(
                        issue_type="disclosure_clarity",
                        severity=ModerationSeverity.WARNING,
                        description="Disclosure hashtag may be buried among other hashtags",
                        required_action="Place disclosure hashtag among first few hashtags"
                    ))

                    recommendations.append(
                        "Move disclosure hashtag to be one of the first hashtags"
                    )
