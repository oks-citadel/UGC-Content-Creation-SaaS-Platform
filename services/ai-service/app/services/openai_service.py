import openai
from typing import List, Optional, Dict, Any
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

from ..config import settings

logger = structlog.get_logger()


class OpenAIService:
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
        self.vision_model = settings.openai_vision_model

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_image(
        self,
        prompt: str,
        size: str = "1024x1024",
        quality: str = "standard",
        n: int = 1,
        style: str = "vivid"
    ) -> Dict[str, Any]:
        """Generate images using DALL-E 3."""
        try:
            response = await self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=size,
                quality=quality,
                n=n,
                style=style,
            )

            return {
                "images": [img.url for img in response.data],
                "revised_prompt": response.data[0].revised_prompt if response.data else None,
            }
        except Exception as e:
            logger.error("Failed to generate image", error=str(e), prompt=prompt[:100])
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_script(
        self,
        topic: str,
        platform: str,
        duration: int,
        tone: str,
        target_audience: Optional[str] = None,
        key_points: Optional[List[str]] = None,
        brand_guidelines: Optional[str] = None,
        include_hooks: bool = True,
        include_cta: bool = True,
    ) -> Dict[str, Any]:
        """Generate a video script."""
        system_prompt = f"""You are an expert content creator specializing in {platform} content.
Create engaging, platform-optimized scripts that capture attention and drive engagement.
Your scripts should be conversational, authentic, and follow best practices for the platform."""

        user_prompt = f"""Create a {duration}-second video script about: {topic}

Platform: {platform}
Tone: {tone}
{f'Target Audience: {target_audience}' if target_audience else ''}
{f'Key Points to Cover: {", ".join(key_points)}' if key_points else ''}
{f'Brand Guidelines: {brand_guidelines}' if brand_guidelines else ''}

Requirements:
- Write in a conversational, authentic voice
- Include timestamps for each section
- {'Include 3 attention-grabbing hooks at the start' if include_hooks else ''}
- {'Include a clear call-to-action at the end' if include_cta else ''}
- Optimize for {platform}'s algorithm and best practices
- Include visual suggestions/directions in [brackets]

Format the response as JSON with the following structure:
{{
    "script": "full script text",
    "sections": [{{"timestamp": "0:00", "content": "section content", "visual_direction": "description"}}],
    "hooks": ["hook 1", "hook 2", "hook 3"],
    "cta": "call to action text",
    "estimated_duration": {duration},
    "word_count": number
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.8,
                response_format={"type": "json_object"},
            )

            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error("Failed to generate script", error=str(e), topic=topic)
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_captions(
        self,
        content_description: str,
        platform: str,
        tone: str,
        max_length: Optional[int] = None,
        include_emojis: bool = True,
        include_hashtags: bool = True,
        num_variations: int = 3,
        brand_voice: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate social media captions."""
        platform_limits = {
            "instagram": 2200,
            "tiktok": 4000,
            "twitter": 280,
            "youtube": 5000,
            "linkedin": 3000,
        }

        effective_max_length = max_length or platform_limits.get(platform, 2200)

        system_prompt = f"""You are a social media expert specializing in creating viral {platform} captions.
Your captions are engaging, authentic, and optimized for engagement."""

        user_prompt = f"""Create {num_variations} unique captions for this content:

Content: {content_description}

Platform: {platform}
Tone: {tone}
Max Length: {effective_max_length} characters
{f'Brand Voice: {brand_voice}' if brand_voice else ''}
Include Emojis: {include_emojis}
Include Hashtags: {include_hashtags}

Requirements:
- Each caption should have a different angle/approach
- Use hooks that stop the scroll
- Optimize for {platform}'s algorithm
- Make it feel authentic, not salesy

Format as JSON:
{{
    "captions": ["caption 1", "caption 2", "caption 3"],
    "hashtags": ["hashtag1", "hashtag2", ...] if include_hashtags else null,
    "character_counts": [123, 145, 167]
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.9,
                response_format={"type": "json_object"},
            )

            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error("Failed to generate captions", error=str(e))
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate_hashtags(
        self,
        content_description: str,
        platform: str,
        num_hashtags: int = 20,
        include_trending: bool = True,
        niche: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate relevant hashtags."""
        system_prompt = f"""You are a social media hashtag expert. Generate effective hashtags for {platform} content.
Mix of trending, niche-specific, and broad-reach hashtags for maximum visibility."""

        user_prompt = f"""Generate {num_hashtags} hashtags for this content:

Content: {content_description}
Platform: {platform}
{f'Niche: {niche}' if niche else ''}

Requirements:
- Mix of high-volume (1M+), medium (100K-1M), and low-volume (10K-100K) hashtags
- Include trending hashtags if relevant
- Avoid banned or shadowbanned hashtags
- Make them relevant to the content

Format as JSON:
{{
    "hashtags": ["hashtag1", "hashtag2", ...],
    "trending": ["trending1", "trending2"],
    "niche_specific": ["niche1", "niche2"],
    "broad_reach": ["broad1", "broad2"]
}}"""

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                response_format={"type": "json_object"},
            )

            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error("Failed to generate hashtags", error=str(e))
            raise

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def analyze_content(
        self,
        image_url: str,
        analysis_type: str = "comprehensive",
    ) -> Dict[str, Any]:
        """Analyze image content using GPT-4 Vision."""
        system_prompt = """You are a content analysis expert. Analyze the provided image and provide detailed insights."""

        analysis_prompts = {
            "comprehensive": """Analyze this image comprehensively:
1. Content description
2. Sentiment/mood
3. Engagement potential (1-100)
4. Brand safety assessment (1-100)
5. Accessibility considerations
6. Improvement suggestions
7. Detected objects and text""",
            "sentiment": "Analyze the sentiment and emotional impact of this image.",
            "engagement": "Predict the engagement potential of this image for social media.",
            "optimization": "Suggest optimizations to improve this image's performance.",
        }

        try:
            response = await self.client.chat.completions.create(
                model=self.vision_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": analysis_prompts.get(analysis_type, analysis_prompts["comprehensive"])},
                            {"type": "image_url", "image_url": {"url": image_url}},
                        ],
                    },
                ],
                temperature=0.5,
                max_tokens=1000,
            )

            # Parse the response into structured format
            content = response.choices[0].message.content
            return {
                "analysis": content,
                "overall_score": 75,  # Would parse from response
                "sentiment": "positive",
                "engagement_prediction": "high",
                "suggestions": [],
                "brand_safety_score": 90,
                "accessibility_score": 80,
            }
        except Exception as e:
            logger.error("Failed to analyze content", error=str(e))
            raise


openai_service = OpenAIService()
