import logging
from typing import List, Optional
import re
import openai
import httpx
from PIL import Image
import io

from ...config import settings
from ...models import SafetyIssue, ModerationSeverity, ContentType

logger = logging.getLogger(__name__)


class SafetyDetector:
    """Detector for brand safety issues in content."""

    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

        # Profanity and inappropriate content patterns
        self.profanity_patterns = [
            r'\b(fuck|shit|damn|bitch|ass|crap)\w*\b',
            # Add more patterns as needed
        ]

        self.hate_speech_patterns = [
            r'\b(hate|racist|sexist|homophobic)\w*\b',
        ]

        self.violence_keywords = [
            'kill', 'murder', 'weapon', 'gun', 'knife', 'blood', 'violence', 'attack'
        ]

        self.drug_keywords = [
            'drug', 'cocaine', 'marijuana', 'weed', 'pill', 'substance'
        ]

    async def check_text_safety(self, text: str) -> List[SafetyIssue]:
        """Check text content for safety issues."""
        issues = []

        text_lower = text.lower()

        # Check for profanity
        profanity_issue = self._check_profanity(text, text_lower)
        if profanity_issue:
            issues.append(profanity_issue)

        # Check for hate speech
        hate_speech_issue = self._check_hate_speech(text, text_lower)
        if hate_speech_issue:
            issues.append(hate_speech_issue)

        # Check for violence
        violence_issue = self._check_violence_keywords(text_lower)
        if violence_issue:
            issues.append(violence_issue)

        # Check for drugs
        drug_issue = self._check_drug_keywords(text_lower)
        if drug_issue:
            issues.append(drug_issue)

        # Use OpenAI moderation API if available
        if self.openai_client:
            openai_issues = await self._check_with_openai(text)
            issues.extend(openai_issues)

        return issues

    async def check_visual_safety(
        self,
        content_url: str,
        content_type: ContentType
    ) -> List[SafetyIssue]:
        """Check visual content for safety issues."""
        issues = []

        try:
            # Download content
            async with httpx.AsyncClient() as client:
                response = await client.get(content_url)
                response.raise_for_status()
                content_data = response.content

            # For images, analyze with vision model
            if content_type == ContentType.IMAGE:
                if self.openai_client:
                    image_issues = await self._check_image_with_openai(content_data)
                    issues.extend(image_issues)

            # For videos, would need video analysis (frame sampling, etc.)
            # Simplified for now

        except Exception as e:
            logger.error(f"Error checking visual safety: {str(e)}")

        return issues

    def _check_profanity(self, text: str, text_lower: str) -> Optional[SafetyIssue]:
        """Check for profanity in text."""
        for pattern in self.profanity_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return SafetyIssue(
                    category="profanity",
                    severity=ModerationSeverity.WARNING,
                    confidence=0.9,
                    description="Content contains profanity or inappropriate language"
                )
        return None

    def _check_hate_speech(self, text: str, text_lower: str) -> Optional[SafetyIssue]:
        """Check for hate speech in text."""
        for pattern in self.hate_speech_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                return SafetyIssue(
                    category="hate_speech",
                    severity=ModerationSeverity.CRITICAL,
                    confidence=0.85,
                    description="Content may contain hate speech or discriminatory language"
                )
        return None

    def _check_violence_keywords(self, text_lower: str) -> Optional[SafetyIssue]:
        """Check for violence-related keywords."""
        violence_count = sum(1 for keyword in self.violence_keywords if keyword in text_lower)

        if violence_count >= 2:
            return SafetyIssue(
                category="violence",
                severity=ModerationSeverity.VIOLATION,
                confidence=0.7,
                description="Content contains multiple references to violence"
            )
        return None

    def _check_drug_keywords(self, text_lower: str) -> Optional[SafetyIssue]:
        """Check for drug-related keywords."""
        drug_count = sum(1 for keyword in self.drug_keywords if keyword in text_lower)

        if drug_count >= 2:
            return SafetyIssue(
                category="drugs",
                severity=ModerationSeverity.VIOLATION,
                confidence=0.7,
                description="Content contains references to drugs or substances"
            )
        return None

    async def _check_with_openai(self, text: str) -> List[SafetyIssue]:
        """Use OpenAI Moderation API to check content."""
        issues = []

        try:
            response = self.openai_client.moderations.create(input=text)

            result = response.results[0]

            if result.flagged:
                # Map OpenAI categories to our categories
                category_map = {
                    'hate': ('hate_speech', ModerationSeverity.CRITICAL),
                    'hate/threatening': ('hate_speech', ModerationSeverity.CRITICAL),
                    'harassment': ('harassment', ModerationSeverity.VIOLATION),
                    'harassment/threatening': ('harassment', ModerationSeverity.CRITICAL),
                    'self-harm': ('self_harm', ModerationSeverity.CRITICAL),
                    'sexual': ('adult_content', ModerationSeverity.VIOLATION),
                    'sexual/minors': ('adult_content', ModerationSeverity.CRITICAL),
                    'violence': ('violence', ModerationSeverity.VIOLATION),
                    'violence/graphic': ('violence', ModerationSeverity.CRITICAL),
                }

                for category, flagged in result.categories.model_dump().items():
                    if flagged:
                        our_category, severity = category_map.get(
                            category,
                            (category, ModerationSeverity.WARNING)
                        )

                        # Get confidence score
                        confidence = getattr(result.category_scores, category.replace('/', '_'), 0.5)

                        issues.append(SafetyIssue(
                            category=our_category,
                            severity=severity,
                            confidence=float(confidence),
                            description=f"Flagged by moderation API: {category}"
                        ))

        except Exception as e:
            logger.error(f"Error using OpenAI moderation: {str(e)}")

        return issues

    async def _check_image_with_openai(self, image_data: bytes) -> List[SafetyIssue]:
        """Check image content using OpenAI Vision API."""
        issues = []

        try:
            # Convert image to base64
            import base64
            image_b64 = base64.b64encode(image_data).decode('utf-8')

            response = self.openai_client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze this image for brand safety. Check for: violence, adult content, drugs, weapons, hate symbols, or any inappropriate content. Respond with JSON: {\"issues\": [{\"category\": \"string\", \"severity\": \"warning|violation|critical\", \"description\": \"string\"}]}"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_b64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=300
            )

            # Parse response (simplified - would need proper JSON parsing)
            # For now, return empty list
            # In production, parse the JSON response and create SafetyIssue objects

        except Exception as e:
            logger.error(f"Error checking image with OpenAI: {str(e)}")

        return issues
