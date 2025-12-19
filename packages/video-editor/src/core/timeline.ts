import EventEmitter from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import type {
  TimelineState,
  VideoClip,
  AudioClip,
  TextOverlay,
  Transition,
  VideoFilter,
  EditorEvent,
} from '../types';

/**
 * Timeline management for video editor
 */
export class Timeline extends EventEmitter {
  private state: TimelineState;

  constructor() {
    super();
    this.state = {
      clips: [],
      audioClips: [],
      textOverlays: [],
      transitions: [],
      filters: [],
      currentTime: 0,
      duration: 0,
      zoom: 1,
    };
  }

  // Video clip management
  addClip(clip: Omit<VideoClip, 'id'>): VideoClip {
    const newClip: VideoClip = {
      ...clip,
      id: uuidv4(),
    };

    this.state.clips.push(newClip);
    this.updateDuration();
    this.emit('clip:added', newClip);
    this.emit('timeline:updated', this.state);

    return newClip;
  }

  removeClip(clipId: string): void {
    const index = this.state.clips.findIndex((c) => c.id === clipId);
    if (index === -1) return;

    const removed = this.state.clips.splice(index, 1)[0];
    this.updateDuration();
    this.emit('clip:removed', removed);
    this.emit('timeline:updated', this.state);
  }

  updateClip(clipId: string, updates: Partial<VideoClip>): void {
    const clip = this.state.clips.find((c) => c.id === clipId);
    if (!clip) return;

    Object.assign(clip, updates);
    this.updateDuration();
    this.emit('clip:updated', clip);
    this.emit('timeline:updated', this.state);
  }

  // Audio clip management
  addAudioClip(clip: Omit<AudioClip, 'id'>): AudioClip {
    const newClip: AudioClip = {
      ...clip,
      id: uuidv4(),
    };

    this.state.audioClips.push(newClip);
    this.emit('timeline:updated', this.state);

    return newClip;
  }

  removeAudioClip(clipId: string): void {
    const index = this.state.audioClips.findIndex((c) => c.id === clipId);
    if (index === -1) return;

    this.state.audioClips.splice(index, 1);
    this.emit('timeline:updated', this.state);
  }

  // Text overlay management
  addTextOverlay(overlay: Omit<TextOverlay, 'id'>): TextOverlay {
    const newOverlay: TextOverlay = {
      ...overlay,
      id: uuidv4(),
    };

    this.state.textOverlays.push(newOverlay);
    this.emit('timeline:updated', this.state);

    return newOverlay;
  }

  removeTextOverlay(overlayId: string): void {
    const index = this.state.textOverlays.findIndex((o) => o.id === overlayId);
    if (index === -1) return;

    this.state.textOverlays.splice(index, 1);
    this.emit('timeline:updated', this.state);
  }

  updateTextOverlay(overlayId: string, updates: Partial<TextOverlay>): void {
    const overlay = this.state.textOverlays.find((o) => o.id === overlayId);
    if (!overlay) return;

    Object.assign(overlay, updates);
    this.emit('timeline:updated', this.state);
  }

  // Transition management
  addTransition(transition: Omit<Transition, 'id'>): Transition {
    const newTransition: Transition = {
      ...transition,
      id: uuidv4(),
    };

    this.state.transitions.push(newTransition);
    this.emit('timeline:updated', this.state);

    return newTransition;
  }

  removeTransition(transitionId: string): void {
    const index = this.state.transitions.findIndex((t) => t.id === transitionId);
    if (index === -1) return;

    this.state.transitions.splice(index, 1);
    this.emit('timeline:updated', this.state);
  }

  // Filter management
  addFilter(filter: Omit<VideoFilter, 'id'>): VideoFilter {
    const newFilter: VideoFilter = {
      ...filter,
      id: uuidv4(),
    };

    this.state.filters.push(newFilter);
    this.emit('timeline:updated', this.state);

    return newFilter;
  }

  removeFilter(filterId: string): void {
    const index = this.state.filters.findIndex((f) => f.id === filterId);
    if (index === -1) return;

    this.state.filters.splice(index, 1);
    this.emit('timeline:updated', this.state);
  }

  updateFilter(filterId: string, updates: Partial<VideoFilter>): void {
    const filter = this.state.filters.find((f) => f.id === filterId);
    if (!filter) return;

    Object.assign(filter, updates);
    this.emit('timeline:updated', this.state);
  }

  // Playback controls
  setCurrentTime(time: number): void {
    this.state.currentTime = Math.max(0, Math.min(time, this.state.duration));
    this.emit('playback:seek', { time: this.state.currentTime });
  }

  setZoom(zoom: number): void {
    this.state.zoom = Math.max(0.1, Math.min(zoom, 10));
    this.emit('timeline:updated', this.state);
  }

  // State management
  getState(): TimelineState {
    return { ...this.state };
  }

  setState(state: Partial<TimelineState>): void {
    this.state = { ...this.state, ...state };
    this.emit('timeline:updated', this.state);
  }

  clear(): void {
    this.state = {
      clips: [],
      audioClips: [],
      textOverlays: [],
      transitions: [],
      filters: [],
      currentTime: 0,
      duration: 0,
      zoom: 1,
    };
    this.emit('timeline:updated', this.state);
  }

  private updateDuration(): void {
    const clipDurations = this.state.clips.map((c) => c.endTime);
    this.state.duration = clipDurations.length > 0 ? Math.max(...clipDurations) : 0;
  }

  // Utility methods
  getClipsAtTime(time: number): VideoClip[] {
    return this.state.clips.filter((c) => time >= c.startTime && time <= c.endTime);
  }

  getTextOverlaysAtTime(time: number): TextOverlay[] {
    return this.state.textOverlays.filter((o) => time >= o.startTime && time <= o.endTime);
  }

  getActiveFiltersAtTime(time: number): VideoFilter[] {
    return this.state.filters.filter(
      (f) =>
        (!f.startTime && !f.endTime) ||
        (time >= (f.startTime || 0) && time <= (f.endTime || Infinity))
    );
  }
}
