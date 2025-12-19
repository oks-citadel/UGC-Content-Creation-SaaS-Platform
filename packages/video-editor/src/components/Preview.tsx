import React, { useEffect, useRef, useState } from 'react';
import type { TimelineState } from '../types';

interface PreviewProps {
  timeline: TimelineState;
  isPlaying: boolean;
  onPlayStateChange?: (playing: boolean) => void;
  onTimeUpdate?: (time: number) => void;
}

export const Preview: React.FC<PreviewProps> = ({
  timeline,
  isPlaying,
  onPlayStateChange,
  onTimeUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const animationFrameRef = useRef<number>();
  const [currentFrame, setCurrentFrame] = useState<ImageData | null>(null);

  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }

    return () => stopPlayback();
  }, [isPlaying]);

  useEffect(() => {
    renderFrame(timeline.currentTime);
  }, [timeline.currentTime, timeline]);

  const startPlayback = () => {
    const startTime = performance.now();
    const initialTime = timeline.currentTime;

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      const newTime = initialTime + elapsed;

      if (newTime >= timeline.duration) {
        onPlayStateChange?.(false);
        onTimeUpdate?.(0);
        return;
      }

      onTimeUpdate?.(newTime);
      renderFrame(newTime);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const stopPlayback = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const renderFrame = async (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Get active clips at current time
    const activeClips = timeline.clips.filter(
      (clip) => time >= clip.startTime && time < clip.endTime
    );

    // Render video clips
    for (const clip of activeClips) {
      await renderVideoClip(ctx, clip, time, canvas.width, canvas.height);
    }

    // Apply filters
    applyFilters(ctx, timeline, time, canvas.width, canvas.height);

    // Render text overlays
    renderTextOverlays(ctx, timeline, time, canvas.width, canvas.height);
  };

  const renderVideoClip = async (
    ctx: CanvasRenderingContext2D,
    clip: any,
    time: number,
    width: number,
    height: number
  ) => {
    let video = videoRefs.current.get(clip.id);

    if (!video) {
      video = document.createElement('video');
      video.src = clip.url;
      video.muted = true;
      videoRefs.current.set(clip.id, video);

      // Wait for video to load
      await new Promise((resolve) => {
        video!.addEventListener('loadeddata', resolve, { once: true });
      });
    }

    // Calculate video time relative to clip
    const clipTime = time - clip.startTime + clip.trimStart;
    video.currentTime = clipTime;

    // Draw video frame
    try {
      ctx.drawImage(video, 0, 0, width, height);
    } catch (error) {
      console.error('Error rendering video frame:', error);
    }
  };

  const applyFilters = (
    ctx: CanvasRenderingContext2D,
    timeline: TimelineState,
    time: number,
    width: number,
    height: number
  ) => {
    const activeFilters = timeline.filters.filter(
      (f) =>
        (!f.startTime && !f.endTime) ||
        (time >= (f.startTime || 0) && time <= (f.endTime || Infinity))
    );

    if (activeFilters.length === 0) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    activeFilters.forEach((filter) => {
      switch (filter.type) {
        case 'brightness':
          applyBrightness(data, filter.intensity);
          break;
        case 'contrast':
          applyContrast(data, filter.intensity);
          break;
        case 'saturation':
          applySaturation(data, filter.intensity);
          break;
        case 'grayscale':
          applyGrayscale(data);
          break;
        case 'sepia':
          applySepia(data);
          break;
        case 'invert':
          applyInvert(data);
          break;
      }
    });

    ctx.putImageData(imageData, 0, 0);
  };

  const renderTextOverlays = (
    ctx: CanvasRenderingContext2D,
    timeline: TimelineState,
    time: number,
    width: number,
    height: number
  ) => {
    const activeOverlays = timeline.textOverlays.filter(
      (o) => time >= o.startTime && time < o.endTime
    );

    activeOverlays.forEach((overlay) => {
      ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      ctx.fillStyle = overlay.color;

      if (overlay.backgroundColor) {
        ctx.fillStyle = overlay.backgroundColor;
        ctx.fillRect(overlay.x, overlay.y, overlay.width, overlay.height);
        ctx.fillStyle = overlay.color;
      }

      ctx.fillText(overlay.text, overlay.x, overlay.y + overlay.fontSize);
    });
  };

  // Filter helper functions
  const applyBrightness = (data: Uint8ClampedArray, value: number) => {
    const factor = value * 255;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i] + factor);
      data[i + 1] = Math.min(255, data[i + 1] + factor);
      data[i + 2] = Math.min(255, data[i + 2] + factor);
    }
  };

  const applyContrast = (data: Uint8ClampedArray, value: number) => {
    const factor = (259 * (value * 255 + 255)) / (255 * (259 - value * 255));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * (data[i] - 128) + 128;
      data[i + 1] = factor * (data[i + 1] - 128) + 128;
      data[i + 2] = factor * (data[i + 2] - 128) + 128;
    }
  };

  const applySaturation = (data: Uint8ClampedArray, value: number) => {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray + value * (data[i] - gray);
      data[i + 1] = gray + value * (data[i + 1] - gray);
      data[i + 2] = gray + value * (data[i + 2] - gray);
    }
  };

  const applyGrayscale = (data: Uint8ClampedArray) => {
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
  };

  const applySepia = (data: Uint8ClampedArray) => {
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      data[i] = Math.min(255, 0.393 * r + 0.769 * g + 0.189 * b);
      data[i + 1] = Math.min(255, 0.349 * r + 0.686 * g + 0.168 * b);
      data[i + 2] = Math.min(255, 0.272 * r + 0.534 * g + 0.131 * b);
    }
  };

  const applyInvert = (data: Uint8ClampedArray) => {
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
  };

  return (
    <div className="preview-container">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        style={{ width: '100%', maxWidth: '960px', backgroundColor: '#000' }}
      />
      <div className="preview-controls">
        <button onClick={() => onPlayStateChange?.(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <span>
          {formatTime(timeline.currentTime)} / {formatTime(timeline.duration)}
        </span>
      </div>
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};
