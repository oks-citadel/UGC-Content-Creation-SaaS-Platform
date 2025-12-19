from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from enum import Enum


class AspectRatio(str, Enum):
    VERTICAL = "9:16"  # TikTok, Instagram Reels
    SQUARE = "1:1"     # Instagram Post
    HORIZONTAL = "16:9"  # YouTube


class VideoQuality(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    ULTRA = "ultra"


class VideoTemplate(str, Enum):
    UGC_REVIEW = "ugc_review"
    PRODUCT_SHOWCASE = "product_showcase"
    UNBOXING = "unboxing"
    TUTORIAL = "tutorial"
    LIFESTYLE = "lifestyle"
    TESTIMONIAL = "testimonial"


class VoiceSettings(BaseModel):
    voice_id: str = Field(..., description="Voice ID from TTS provider")
    stability: float = Field(default=0.5, ge=0.0, le=1.0)
    similarity_boost: float = Field(default=0.75, ge=0.0, le=1.0)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class CaptionStyle(BaseModel):
    font_family: str = "Arial"
    font_size: int = 48
    font_color: str = "#FFFFFF"
    background_color: str = "#000000"
    background_opacity: float = 0.7
    position: str = "bottom"  # top, middle, bottom
    animation: str = "fade"  # fade, slide, pop


class MusicSettings(BaseModel):
    track_url: Optional[str] = None
    track_id: Optional[str] = None
    volume: float = Field(default=0.3, ge=0.0, le=1.0)
    fade_in: float = Field(default=1.0, ge=0.0)
    fade_out: float = Field(default=2.0, ge=0.0)


class VideoGenerationRequest(BaseModel):
    images: List[str] = Field(..., description="List of image URLs or base64 encoded images")
    script: str = Field(..., description="Video script/narration text")
    voice_settings: VoiceSettings
    template: VideoTemplate = VideoTemplate.UGC_REVIEW
    aspect_ratio: AspectRatio = AspectRatio.VERTICAL
    quality: VideoQuality = VideoQuality.HIGH
    add_captions: bool = True
    caption_style: Optional[CaptionStyle] = None
    music_settings: Optional[MusicSettings] = None
    transition_style: str = "crossfade"
    duration_per_image: float = 3.0
    brand_overlay: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class VideoVariantRequest(BaseModel):
    base_video_id: Optional[str] = None
    images: List[str]
    script: str
    voice_settings: VoiceSettings
    num_variants: int = Field(default=3, ge=1, le=10)
    templates: List[VideoTemplate] = Field(default_factory=lambda: [VideoTemplate.UGC_REVIEW])
    aspect_ratios: List[AspectRatio] = Field(default_factory=lambda: [AspectRatio.VERTICAL])
    test_variations: List[str] = Field(
        default_factory=lambda: ["caption_style", "music", "pacing"],
        description="What to vary: caption_style, music, pacing, transitions, colors"
    )


class CaptionRequest(BaseModel):
    video_url: str
    transcript: Optional[str] = None
    auto_generate_transcript: bool = True
    caption_style: CaptionStyle
    highlight_keywords: List[str] = Field(default_factory=list)


class MusicRequest(BaseModel):
    video_url: str
    music_settings: MusicSettings
    auto_detect_beats: bool = True
    sync_to_transitions: bool = True


class VideoResponse(BaseModel):
    job_id: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: str  # pending, processing, completed, failed
    duration: Optional[float] = None
    resolution: Optional[str] = None
    file_size: Optional[int] = None
    created_at: str
    metadata: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class VideoVariantsResponse(BaseModel):
    job_id: str
    variants: List[VideoResponse]
    status: str
    created_at: str


class TemplateInfo(BaseModel):
    id: str
    name: str
    description: str
    preview_url: Optional[str] = None
    recommended_for: List[str]
    supported_aspect_ratios: List[AspectRatio]
    default_duration: float
    features: List[str]


class TemplateListResponse(BaseModel):
    templates: List[TemplateInfo]
    total: int


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    dependencies: Dict[str, str]
