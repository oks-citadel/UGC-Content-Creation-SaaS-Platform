import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import os
import ffmpeg
from PIL import Image
import httpx
import openai
import replicate

from ..config import settings
from ..models import (
    VideoGenerationRequest,
    VideoVariantRequest,
    VideoResponse,
    CaptionRequest,
    MusicRequest,
    AspectRatio,
)

logger = logging.getLogger(__name__)


class VideoGenerationService:
    """Service for generating UGC videos using AI."""

    def __init__(self):
        self.openai_client = openai.OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.replicate_client = replicate.Client(api_token=settings.replicate_api_token) if settings.replicate_api_token else None
        self.temp_dir = settings.temp_dir
        os.makedirs(self.temp_dir, exist_ok=True)

    async def generate_ugc_video(self, request: VideoGenerationRequest) -> VideoResponse:
        """
        Generate a UGC video from images, script, and voice.

        Args:
            request: Video generation request with images, script, and settings

        Returns:
            VideoResponse with job ID and video URL
        """
        try:
            job_id = str(uuid.uuid4())
            logger.info(f"Starting video generation job {job_id}")

            # Step 1: Download and process images
            image_paths = await self._download_images(request.images, job_id)

            # Step 2: Generate voiceover from script
            audio_path = await self._generate_voiceover(request.script, request.voice_settings, job_id)

            # Step 3: Create video from images
            video_path = await self._create_video_from_images(
                image_paths,
                audio_path,
                request,
                job_id
            )

            # Step 4: Add captions if requested
            if request.add_captions:
                video_path = await self._add_captions(
                    video_path,
                    request.script,
                    request.caption_style,
                    job_id
                )

            # Step 5: Add music if provided
            if request.music_settings:
                video_path = await self._add_music(
                    video_path,
                    request.music_settings,
                    job_id
                )

            # Step 6: Add brand overlay if provided
            if request.brand_overlay:
                video_path = await self._add_brand_overlay(
                    video_path,
                    request.brand_overlay,
                    job_id
                )

            # Step 7: Generate thumbnail
            thumbnail_path = await self._generate_thumbnail(video_path, job_id)

            # Step 8: Upload to storage (S3 or similar)
            video_url = await self._upload_to_storage(video_path, f"{job_id}.mp4")
            thumbnail_url = await self._upload_to_storage(thumbnail_path, f"{job_id}_thumb.jpg")

            # Get video metadata
            probe = ffmpeg.probe(video_path)
            video_info = next(s for s in probe['streams'] if s['codec_type'] == 'video')
            duration = float(probe['format']['duration'])
            file_size = int(probe['format']['size'])

            # Cleanup temporary files
            await self._cleanup_temp_files([video_path, thumbnail_path, audio_path] + image_paths)

            return VideoResponse(
                job_id=job_id,
                video_url=video_url,
                thumbnail_url=thumbnail_url,
                status="completed",
                duration=duration,
                resolution=f"{video_info['width']}x{video_info['height']}",
                file_size=file_size,
                created_at=datetime.utcnow().isoformat(),
                metadata=request.metadata
            )

        except Exception as e:
            logger.error(f"Error generating video: {str(e)}", exc_info=True)
            return VideoResponse(
                job_id=job_id if 'job_id' in locals() else str(uuid.uuid4()),
                status="failed",
                created_at=datetime.utcnow().isoformat(),
                error=str(e)
            )

    async def generate_video_variants(self, request: VideoVariantRequest) -> List[VideoResponse]:
        """
        Generate multiple video variants for A/B testing.

        Args:
            request: Variant generation request

        Returns:
            List of VideoResponse objects
        """
        try:
            logger.info(f"Generating {request.num_variants} video variants")

            variants = []
            tasks = []

            # Create variations based on test_variations
            for i in range(request.num_variants):
                variant_request = self._create_variant_request(request, i)
                tasks.append(self.generate_ugc_video(variant_request))

            # Generate all variants in parallel
            variants = await asyncio.gather(*tasks)

            return variants

        except Exception as e:
            logger.error(f"Error generating variants: {str(e)}", exc_info=True)
            return []

    async def add_captions_to_video(self, request: CaptionRequest) -> VideoResponse:
        """
        Add captions to an existing video.

        Args:
            request: Caption request with video URL and style

        Returns:
            VideoResponse with captioned video
        """
        try:
            job_id = str(uuid.uuid4())
            logger.info(f"Adding captions to video, job {job_id}")

            # Download video
            video_path = await self._download_file(request.video_url, f"{job_id}_input.mp4")

            # Generate or use provided transcript
            transcript = request.transcript
            if request.auto_generate_transcript:
                transcript = await self._generate_transcript(video_path)

            # Add captions
            output_path = await self._add_captions(
                video_path,
                transcript,
                request.caption_style,
                job_id
            )

            # Upload result
            video_url = await self._upload_to_storage(output_path, f"{job_id}_captioned.mp4")

            # Cleanup
            await self._cleanup_temp_files([video_path, output_path])

            return VideoResponse(
                job_id=job_id,
                video_url=video_url,
                status="completed",
                created_at=datetime.utcnow().isoformat()
            )

        except Exception as e:
            logger.error(f"Error adding captions: {str(e)}", exc_info=True)
            raise

    async def add_music_to_video(self, request: MusicRequest) -> VideoResponse:
        """
        Add background music to a video.

        Args:
            request: Music request with video URL and settings

        Returns:
            VideoResponse with music added
        """
        try:
            job_id = str(uuid.uuid4())
            logger.info(f"Adding music to video, job {job_id}")

            # Download video and music
            video_path = await self._download_file(request.video_url, f"{job_id}_input.mp4")

            # Add music
            output_path = await self._add_music(
                video_path,
                request.music_settings,
                job_id
            )

            # Upload result
            video_url = await self._upload_to_storage(output_path, f"{job_id}_music.mp4")

            # Cleanup
            await self._cleanup_temp_files([video_path, output_path])

            return VideoResponse(
                job_id=job_id,
                video_url=video_url,
                status="completed",
                created_at=datetime.utcnow().isoformat()
            )

        except Exception as e:
            logger.error(f"Error adding music: {str(e)}", exc_info=True)
            raise

    # Private helper methods

    async def _download_images(self, image_urls: List[str], job_id: str) -> List[str]:
        """Download images from URLs."""
        image_paths = []
        async with httpx.AsyncClient() as client:
            for idx, url in enumerate(image_urls):
                path = os.path.join(self.temp_dir, f"{job_id}_img_{idx}.jpg")
                response = await client.get(url)
                response.raise_for_status()

                with open(path, 'wb') as f:
                    f.write(response.content)

                image_paths.append(path)

        return image_paths

    async def _generate_voiceover(self, script: str, voice_settings, job_id: str) -> str:
        """Generate voiceover from script using TTS."""
        output_path = os.path.join(self.temp_dir, f"{job_id}_voice.mp3")

        if self.openai_client:
            # Use OpenAI TTS
            response = self.openai_client.audio.speech.create(
                model="tts-1-hd",
                voice=voice_settings.voice_id,
                input=script,
                speed=voice_settings.speed
            )

            response.stream_to_file(output_path)
        else:
            logger.warning("No TTS provider configured, skipping voiceover")

        return output_path

    async def _create_video_from_images(
        self,
        image_paths: List[str],
        audio_path: str,
        request: VideoGenerationRequest,
        job_id: str
    ) -> str:
        """Create video from images and audio using ffmpeg."""
        output_path = os.path.join(self.temp_dir, f"{job_id}_video.mp4")

        # Resize images to target resolution
        width, height = self._get_resolution(request.aspect_ratio)
        resized_paths = []

        for idx, img_path in enumerate(image_paths):
            resized_path = os.path.join(self.temp_dir, f"{job_id}_resized_{idx}.jpg")
            img = Image.open(img_path)
            img = img.resize((width, height), Image.LANCZOS)
            img.save(resized_path)
            resized_paths.append(resized_path)

        # Create concat file for ffmpeg
        concat_file = os.path.join(self.temp_dir, f"{job_id}_concat.txt")
        with open(concat_file, 'w') as f:
            for path in resized_paths:
                f.write(f"file '{path}'\n")
                f.write(f"duration {request.duration_per_image}\n")

        # Generate video with ffmpeg
        try:
            (
                ffmpeg
                .input(concat_file, format='concat', safe=0)
                .output(
                    audio_path,
                    output_path,
                    vcodec='libx264',
                    acodec='aac',
                    pix_fmt='yuv420p',
                    r=settings.default_fps,
                    shortest=None
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error: {e.stderr.decode()}")
            raise

        return output_path

    async def _add_captions(
        self,
        video_path: str,
        transcript: str,
        caption_style,
        job_id: str
    ) -> str:
        """Add captions to video using ffmpeg drawtext filter."""
        output_path = os.path.join(self.temp_dir, f"{job_id}_captioned.mp4")

        if not caption_style:
            from ..models import CaptionStyle
            caption_style = CaptionStyle()

        # Create SRT file from transcript
        srt_path = os.path.join(self.temp_dir, f"{job_id}.srt")
        await self._create_srt_file(transcript, srt_path)

        # Add captions using ffmpeg
        try:
            (
                ffmpeg
                .input(video_path)
                .output(
                    output_path,
                    vf=f"subtitles={srt_path}:force_style='FontName={caption_style.font_family},"
                       f"FontSize={caption_style.font_size},"
                       f"PrimaryColour={self._hex_to_ass_color(caption_style.font_color)},"
                       f"BackColour={self._hex_to_ass_color(caption_style.background_color)},"
                       f"Alignment=2'",
                    acodec='copy'
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error adding captions: {e.stderr.decode()}")
            raise

        return output_path

    async def _add_music(self, video_path: str, music_settings, job_id: str) -> str:
        """Add background music to video."""
        output_path = os.path.join(self.temp_dir, f"{job_id}_with_music.mp4")

        # Download music if URL provided
        if music_settings.track_url:
            music_path = await self._download_file(
                music_settings.track_url,
                f"{job_id}_music.mp3"
            )
        else:
            logger.warning("No music track provided")
            return video_path

        # Mix audio tracks
        try:
            (
                ffmpeg
                .input(video_path)
                .input(music_path)
                .output(
                    output_path,
                    vcodec='copy',
                    acodec='aac',
                    filter_complex=f"[0:a]volume=1.0[a1];[1:a]volume={music_settings.volume}[a2];[a1][a2]amix=inputs=2:duration=first"
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error adding music: {e.stderr.decode()}")
            raise

        return output_path

    async def _add_brand_overlay(self, video_path: str, brand_logo_url: str, job_id: str) -> str:
        """Add brand logo overlay to video."""
        output_path = os.path.join(self.temp_dir, f"{job_id}_branded.mp4")

        # Download logo
        logo_path = await self._download_file(brand_logo_url, f"{job_id}_logo.png")

        # Add overlay using ffmpeg
        try:
            (
                ffmpeg
                .input(video_path)
                .input(logo_path)
                .output(
                    output_path,
                    filter_complex="[1:v]scale=120:-1[logo];[0:v][logo]overlay=W-w-10:H-h-10",
                    acodec='copy'
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error adding overlay: {e.stderr.decode()}")
            raise

        return output_path

    async def _generate_thumbnail(self, video_path: str, job_id: str) -> str:
        """Generate thumbnail from video."""
        thumbnail_path = os.path.join(self.temp_dir, f"{job_id}_thumb.jpg")

        try:
            (
                ffmpeg
                .input(video_path, ss=1)
                .output(thumbnail_path, vframes=1)
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg error generating thumbnail: {e.stderr.decode()}")
            raise

        return thumbnail_path

    async def _generate_transcript(self, video_path: str) -> str:
        """Generate transcript from video audio using Whisper."""
        if not self.openai_client:
            logger.warning("No OpenAI client configured for transcription")
            return ""

        # Extract audio
        audio_path = video_path.replace('.mp4', '_audio.mp3')

        try:
            (
                ffmpeg
                .input(video_path)
                .output(audio_path, acodec='mp3', ac=1, ar='16000')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )

            # Transcribe with Whisper
            with open(audio_path, 'rb') as audio_file:
                transcript = self.openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )

            return transcript

        except Exception as e:
            logger.error(f"Error generating transcript: {str(e)}")
            return ""

    async def _create_srt_file(self, transcript: str, output_path: str):
        """Create SRT subtitle file from transcript."""
        # Simple implementation - split by sentences
        sentences = transcript.split('. ')
        duration_per_sentence = 3.0  # seconds

        with open(output_path, 'w', encoding='utf-8') as f:
            for idx, sentence in enumerate(sentences, 1):
                start_time = (idx - 1) * duration_per_sentence
                end_time = idx * duration_per_sentence

                f.write(f"{idx}\n")
                f.write(f"{self._format_srt_time(start_time)} --> {self._format_srt_time(end_time)}\n")
                f.write(f"{sentence.strip()}\n\n")

    def _format_srt_time(self, seconds: float) -> str:
        """Format seconds to SRT time format."""
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    def _hex_to_ass_color(self, hex_color: str) -> str:
        """Convert hex color to ASS subtitle format."""
        hex_color = hex_color.lstrip('#')
        r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
        return f"&H{b:02X}{g:02X}{r:02X}"

    def _get_resolution(self, aspect_ratio: AspectRatio) -> tuple:
        """Get width and height from aspect ratio."""
        resolutions = {
            AspectRatio.VERTICAL: (1080, 1920),
            AspectRatio.SQUARE: (1080, 1080),
            AspectRatio.HORIZONTAL: (1920, 1080),
        }
        return resolutions.get(aspect_ratio, (1080, 1920))

    def _create_variant_request(self, request: VideoVariantRequest, index: int) -> VideoGenerationRequest:
        """Create a variant request with different parameters."""
        from ..models import VideoGenerationRequest, CaptionStyle, MusicSettings

        # Vary parameters based on test_variations
        template = request.templates[index % len(request.templates)]
        aspect_ratio = request.aspect_ratios[index % len(request.aspect_ratios)]

        # Create varied caption style
        caption_style = CaptionStyle()
        if "caption_style" in request.test_variations:
            colors = ["#FFFFFF", "#FFD700", "#FF6B6B", "#4ECDC4"]
            caption_style.font_color = colors[index % len(colors)]

        return VideoGenerationRequest(
            images=request.images,
            script=request.script,
            voice_settings=request.voice_settings,
            template=template,
            aspect_ratio=aspect_ratio,
            add_captions=True,
            caption_style=caption_style
        )

    async def _download_file(self, url: str, filename: str) -> str:
        """Download file from URL."""
        path = os.path.join(self.temp_dir, filename)
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            with open(path, 'wb') as f:
                f.write(response.content)
        return path

    async def _upload_to_storage(self, file_path: str, key: str) -> str:
        """Upload file to S3 or return local path."""
        if settings.s3_bucket:
            import boto3
            s3 = boto3.client('s3', region_name=settings.aws_region)
            s3.upload_file(file_path, settings.s3_bucket, key)
            return f"https://{settings.s3_bucket}.s3.amazonaws.com/{key}"
        else:
            # Return local path for development
            return f"file://{file_path}"

    async def _cleanup_temp_files(self, file_paths: List[str]):
        """Clean up temporary files."""
        for path in file_paths:
            try:
                if os.path.exists(path):
                    os.remove(path)
            except Exception as e:
                logger.warning(f"Failed to delete temp file {path}: {str(e)}")
