from typing import Any, Dict, List, Optional
from openai import AsyncOpenAI
import anthropic

from ..config import settings


class LLMService:
    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.anthropic_client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key) if settings.anthropic_api_key else None
    
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        provider: str = "openai",
    ) -> str:
        if provider == "openai" and self.openai_client:
            return await self._generate_openai(prompt, system_prompt, max_tokens, temperature)
        elif provider == "anthropic" and self.anthropic_client:
            return await self._generate_anthropic(prompt, system_prompt, max_tokens, temperature)
        else:
            raise ValueError(f"Provider {provider} not available or not configured")
    
    async def _generate_openai(
        self,
        prompt: str,
        system_prompt: Optional[str],
        max_tokens: int,
        temperature: float,
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content
    
    async def _generate_anthropic(
        self,
        prompt: str,
        system_prompt: Optional[str],
        max_tokens: int,
        temperature: float,
    ) -> str:
        response = await self.anthropic_client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=max_tokens,
            system=system_prompt or "",
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
    
    async def generate_campaign_copy(
        self,
        brand_context: Dict[str, Any],
        campaign_goals: List[str],
        target_audience: Dict[str, Any],
    ) -> Dict[str, str]:
        prompt = f"""Generate marketing campaign copy for the following:
        
Brand: {brand_context.get('name', 'Brand')}
Industry: {brand_context.get('industry', 'Unknown')}
Goals: {', '.join(campaign_goals)}
Target Audience: {target_audience}

Generate:
1. A compelling headline
2. A tagline
3. Body copy (2-3 paragraphs)
4. A call-to-action

Format as JSON with keys: headline, tagline, body, cta"""

        result = await self.generate_text(
            prompt,
            system_prompt="You are an expert marketing copywriter. Generate engaging, conversion-focused copy.",
        )
        
        return {"raw_content": result}
    
    async def analyze_content_performance(
        self,
        content_metrics: Dict[str, Any],
    ) -> Dict[str, Any]:
        prompt = f"""Analyze the following content performance metrics and provide insights:
        
Metrics: {content_metrics}

Provide:
1. Performance summary
2. Key insights
3. Recommendations for improvement
4. Predicted optimal posting times

Format as JSON."""

        result = await self.generate_text(
            prompt,
            system_prompt="You are a data-driven marketing analyst. Provide actionable insights based on metrics.",
        )
        
        return {"analysis": result}


llm_service = LLMService()
