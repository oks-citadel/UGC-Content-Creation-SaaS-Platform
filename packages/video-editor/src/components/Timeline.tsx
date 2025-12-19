import React, { useEffect, useRef, useState } from 'react';
import type { TimelineState, VideoClip } from '../types';

interface TimelineProps {
  timeline: TimelineState;
  onClipMove?: (clipId: string, newStartTime: number) => void;
  onClipResize?: (clipId: string, newDuration: number) => void;
  onSeek?: (time: number) => void;
  onZoom?: (zoom: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  timeline,
  onClipMove,
  onClipResize,
  onSeek,
  onZoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);

  useEffect(() => {
    renderTimeline();
  }, [timeline]);

  const renderTimeline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw timeline background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw time markers
    drawTimeMarkers(ctx, canvas.width, canvas.height);

    // Draw video clips
    drawClips(ctx, timeline.clips, canvas.width);

    // Draw audio clips
    drawAudioClips(ctx, timeline.audioClips, canvas.width);

    // Draw playhead
    drawPlayhead(ctx, timeline.currentTime, timeline.duration, canvas.width, canvas.height);
  };

  const drawTimeMarkers = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const markerInterval = 1; // 1 second
    const pixelsPerSecond = (width / timeline.duration) * timeline.zoom;

    ctx.strokeStyle = '#444';
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';

    for (let time = 0; time < timeline.duration; time += markerInterval) {
      const x = time * pixelsPerSecond;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 10);
      ctx.stroke();

      ctx.fillText(formatTime(time), x + 2, 20);
    }
  };

  const drawClips = (ctx: CanvasRenderingContext2D, clips: VideoClip[], width: number) => {
    const pixelsPerSecond = (width / timeline.duration) * timeline.zoom;
    const trackHeight = 60;
    const trackPadding = 5;

    clips.forEach((clip) => {
      const x = clip.startTime * pixelsPerSecond;
      const clipWidth = (clip.endTime - clip.startTime) * pixelsPerSecond;
      const y = 30 + clip.track * (trackHeight + trackPadding);

      // Draw clip background
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x, y, clipWidth, trackHeight);

      // Draw clip border
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, clipWidth, trackHeight);

      // Draw clip name (truncated)
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText(clip.file.name || 'Video Clip', x + 5, y + 20, clipWidth - 10);

      // Draw duration
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#e0e0e0';
      ctx.fillText(formatTime(clip.endTime - clip.startTime), x + 5, y + 40);
    });
  };

  const drawAudioClips = (ctx: CanvasRenderingContext2D, audioClips: any[], width: number) => {
    const pixelsPerSecond = (width / timeline.duration) * timeline.zoom;
    const trackHeight = 40;
    const trackPadding = 5;
    const audioTrackY = 150; // Below video tracks

    audioClips.forEach((clip) => {
      const x = clip.startTime * pixelsPerSecond;
      const clipWidth = (clip.endTime - clip.startTime) * pixelsPerSecond;
      const y = audioTrackY + clip.track * (trackHeight + trackPadding);

      // Draw clip background
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, y, clipWidth, trackHeight);

      // Draw clip border
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, clipWidth, trackHeight);

      // Draw waveform placeholder
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 1;
      for (let i = 0; i < clipWidth; i += 4) {
        const height = Math.random() * trackHeight * 0.6;
        ctx.beginPath();
        ctx.moveTo(x + i, y + trackHeight / 2 - height / 2);
        ctx.lineTo(x + i, y + trackHeight / 2 + height / 2);
        ctx.stroke();
      }
    });
  };

  const drawPlayhead = (
    ctx: CanvasRenderingContext2D,
    currentTime: number,
    duration: number,
    width: number,
    height: number
  ) => {
    const pixelsPerSecond = (width / duration) * timeline.zoom;
    const x = currentTime * pixelsPerSecond;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    // Draw playhead handle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(x, 10, 6, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pixelsPerSecond = (canvas.width / timeline.duration) * timeline.zoom;
    const time = x / pixelsPerSecond;

    onSeek?.(time);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = timeline.zoom * zoomDelta;
    onZoom?.(newZoom);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timeline-container">
      <div className="timeline-controls">
        <button onClick={() => onZoom?.(timeline.zoom * 1.2)}>Zoom In</button>
        <button onClick={() => onZoom?.(timeline.zoom * 0.8)}>Zoom Out</button>
        <span>Duration: {formatTime(timeline.duration)}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={1200}
        height={400}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        style={{ width: '100%', border: '1px solid #333', cursor: 'pointer' }}
      />
    </div>
  );
};
