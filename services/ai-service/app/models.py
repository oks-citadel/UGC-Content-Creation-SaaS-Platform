from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


class GenerationType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    SCRIPT = "script"
    CAPTION = "caption"
    HASHTAG = "hashtag"
    THUMBNAIL = "thumbnail"
    AVATAR = "avatar"
    VOICE = "voice"


class GenerationStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# Request Models
class GenerateImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000)
    negative_prompt: Optional[str] = Field(None, max_length=1000)
    style: Optional[str] = Field(None, description="Art style preset")
    aspect_ratio: str = Field(default="1:1", pattern=r"^\d+:\d+$")
    num_images: int = Field(default=1, ge=1, le=4)
    quality: str = Field(default="standard", pattern=r"^(standard|hd)$")


class GenerateVideoRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    duration: int = Field(default=5, ge=2, le=30)
    aspect_ratio: str = Field(default="16:9", pattern=r"^\d+:\d+$")
    style: Optional[str] = None
    reference_image_url: Optional[str] = None


class GenerateScriptRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    platform: str = Field(default="instagram", pattern=r"^(instagram|tiktok|youtube|twitter)$")
    duration: int = Field(default=30, ge=15, le=180, description="Target duration in seconds")
    tone: str = Field(default="engaging", pattern=r"^(engaging|professional|casual|humorous|educational)$")
    target_audience: Optional[str] = None
    key_points: Optional[List[str]] = None
    brand_guidelines: Optional[str] = None
    include_hooks: bool = Field(default=True)
    include_cta: bool = Field(default=True)


class GenerateCaptionRequest(BaseModel):
    content_description: str = Field(..., min_length=1, max_length=1000)
    platform: str = Field(default="instagram", pattern=r"^(instagram|tiktok|youtube|twitter|linkedin)$")
    tone: str = Field(default="engaging")
    max_length: Optional[int] = Field(None, ge=50, le=2200)
    include_emojis: bool = Field(default=True)
    include_hashtags: bool = Field(default=True)
    num_variations: int = Field(default=3, ge=1, le=5)
    brand_voice: Optional[str] = None


class GenerateHashtagsRequest(BaseModel):
    content_description: str = Field(..., min_length=1, max_length=500)
    platform: str = Field(default="instagram", pattern=r"^(instagram|tiktok|youtube|twitter)$")
    num_hashtags: int = Field(default=20, ge=5, le=30)
    include_trending: bool = Field(default=True)
    niche: Optional[str] = None


class AnalyzeContentRequest(BaseModel):
    content_url: str
    analysis_type: str = Field(default="comprehensive", pattern=r"^(comprehensive|sentiment|engagement|optimization)$")


class EnhanceContentRequest(BaseModel):
    content_type: str = Field(..., pattern=r"^(image|video)$")
    content_url: str
    enhancements: List[str] = Field(default=["auto"], description="Enhancement types: auto, color, sharpness, denoise, upscale")


# Response Models
class GenerationResponse(BaseModel):
    id: str
    type: GenerationType
    status: GenerationStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    result_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ImageGenerationResult(BaseModel):
    images: List[str]  # URLs
    prompt: str
    revised_prompt: Optional[str] = None


class VideoGenerationResult(BaseModel):
    video_url: str
    thumbnail_url: Optional[str] = None
    duration: float
    prompt: str


class ScriptGenerationResult(BaseModel):
    script: str
    sections: List[Dict[str, str]]
    estimated_duration: int
    word_count: int
    hooks: Optional[List[str]] = None
    cta: Optional[str] = None


class CaptionGenerationResult(BaseModel):
    captions: List[str]
    hashtags: Optional[List[str]] = None
    character_counts: List[int]


class HashtagGenerationResult(BaseModel):
    hashtags: List[str]
    trending: List[str]
    niche_specific: List[str]
    broad_reach: List[str]


class ContentAnalysisResult(BaseModel):
    overall_score: float = Field(..., ge=0, le=100)
    sentiment: str
    engagement_prediction: str
    suggestions: List[str]
    detected_objects: Optional[List[str]] = None
    detected_text: Optional[str] = None
    brand_safety_score: float = Field(..., ge=0, le=100)
    accessibility_score: float = Field(..., ge=0, le=100)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str = "1.0.0"
