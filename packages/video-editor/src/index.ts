/**
 * @nexus/video-editor
 * Browser-based video editor SDK for the NEXUS platform
 */

// Core
export { Timeline } from './core/timeline';
export { VideoRenderer } from './core/renderer';

// Components
export { Timeline as TimelineComponent } from './components/Timeline';
export { Preview } from './components/Preview';
export { Toolbar } from './components/Toolbar';
export { AssetLibrary } from './components/AssetLibrary';
export { TextOverlay as TextOverlayComponent } from './components/TextOverlay';
export { AudioTrack } from './components/AudioTrack';

// Effects
export { filters } from './effects/filters';
export { transitions } from './effects/transitions';

// Types
export type {
  VideoClip,
  AudioClip,
  TextOverlay,
  TextAnimation,
  Transition,
  VideoFilter,
  TimelineState,
  RenderOptions,
  RenderProgress,
  EditorConfig,
  Asset,
  EditorEventType,
  EditorEvent,
} from './types';
