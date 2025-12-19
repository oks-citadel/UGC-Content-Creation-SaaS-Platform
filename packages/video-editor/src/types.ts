/**
 * Core types for the video editor SDK
 */

export interface VideoClip {
  id: string;
  file: File | Blob;
  url: string;
  duration: number;
  startTime: number;
  endTime: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  track: number;
}

export interface AudioClip {
  id: string;
  file: File | Blob;
  url: string;
  duration: number;
  startTime: number;
  endTime: number;
  volume: number;
  track: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startTime: number;
  endTime: number;
  animation?: TextAnimation;
}

export interface TextAnimation {
  type: 'fade-in' | 'fade-out' | 'slide-in' | 'slide-out' | 'zoom-in' | 'zoom-out';
  duration: number;
}

export interface Transition {
  id: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom';
  duration: number;
  position: number;
}

export interface VideoFilter {
  id: string;
  type: 'brightness' | 'contrast' | 'saturation' | 'blur' | 'sepia' | 'grayscale' | 'invert';
  intensity: number;
  startTime?: number;
  endTime?: number;
}

export interface TimelineState {
  clips: VideoClip[];
  audioClips: AudioClip[];
  textOverlays: TextOverlay[];
  transitions: Transition[];
  filters: VideoFilter[];
  currentTime: number;
  duration: number;
  zoom: number;
}

export interface RenderOptions {
  width: number;
  height: number;
  fps: number;
  format: 'mp4' | 'webm' | 'mov';
  codec: 'h264' | 'vp8' | 'vp9';
  bitrate: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
}

export interface RenderProgress {
  progress: number;
  currentFrame: number;
  totalFrames: number;
  timeElapsed: number;
  timeRemaining: number;
  status: 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error';
}

export interface EditorConfig {
  maxDuration?: number;
  maxFileSize?: number;
  allowedFormats?: string[];
  defaultRenderOptions?: Partial<RenderOptions>;
}

export interface Asset {
  id: string;
  type: 'video' | 'audio' | 'image';
  file: File;
  url: string;
  thumbnail?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export type EditorEventType =
  | 'clip:added'
  | 'clip:removed'
  | 'clip:updated'
  | 'timeline:updated'
  | 'render:start'
  | 'render:progress'
  | 'render:complete'
  | 'render:error'
  | 'playback:play'
  | 'playback:pause'
  | 'playback:seek';

export interface EditorEvent {
  type: EditorEventType;
  payload?: any;
  timestamp: number;
}
