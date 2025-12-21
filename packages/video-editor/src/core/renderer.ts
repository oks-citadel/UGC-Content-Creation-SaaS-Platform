import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import EventEmitter from 'eventemitter3';
import type { TimelineState, RenderOptions, RenderProgress } from '../types';

/**
 * Video rendering engine using FFmpeg.wasm
 */
export class VideoRenderer extends EventEmitter {
  private ffmpeg: FFmpeg;
  private isLoaded = false;

  constructor() {
    super();
    this.ffmpeg = new FFmpeg();
  }

  async initialize(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load FFmpeg from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.isLoaded = true;
      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    this.ffmpeg.on('progress', ({ progress, time }) => {
      this.emit('render:progress', {
        progress: progress * 100,
        time,
      });
    });
  }

  async render(timeline: TimelineState, options: RenderOptions): Promise<Blob> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg not loaded. Call initialize() first.');
    }

    this.emit('render:start', { timeline, options });

    try {
      // Prepare rendering
      const progress: RenderProgress = {
        progress: 0,
        currentFrame: 0,
        totalFrames: 0,
        timeElapsed: 0,
        timeRemaining: 0,
        status: 'preparing',
      };

      this.emit('render:progress', progress);

      // Write input files to FFmpeg filesystem
      await this.prepareInputFiles(timeline);

      // Build FFmpeg command
      const command = this.buildFFmpegCommand(timeline, options);

      progress.status = 'rendering';
      this.emit('render:progress', progress);

      // Execute rendering
      await this.ffmpeg.exec(command);

      progress.status = 'encoding';
      this.emit('render:progress', progress);

      // Read output file
      const data = await this.ffmpeg.readFile('output.mp4');
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' });

      // Cleanup
      await this.cleanup();

      progress.status = 'complete';
      progress.progress = 100;
      this.emit('render:progress', progress);
      this.emit('render:complete', blob);

      return blob;
    } catch (error) {
      this.emit('render:error', error);
      throw error;
    }
  }

  private async prepareInputFiles(timeline: TimelineState): Promise<void> {
    // Write video clips
    for (let i = 0; i < timeline.clips.length; i++) {
      const clip = timeline.clips[i];
      const arrayBuffer = await clip.file.arrayBuffer();
      await this.ffmpeg.writeFile(`input${i}.mp4`, new Uint8Array(arrayBuffer));
    }

    // Write audio clips
    for (let i = 0; i < timeline.audioClips.length; i++) {
      const clip = timeline.audioClips[i];
      const arrayBuffer = await clip.file.arrayBuffer();
      await this.ffmpeg.writeFile(`audio${i}.mp3`, new Uint8Array(arrayBuffer));
    }
  }

  private buildFFmpegCommand(timeline: TimelineState, options: RenderOptions): string[] {
    const command: string[] = [];

    // Add input files
    timeline.clips.forEach((_, i) => {
      command.push('-i', `input${i}.mp4`);
    });

    timeline.audioClips.forEach((_, i) => {
      command.push('-i', `audio${i}.mp3`);
    });

    // Build filter complex for compositing
    const filterComplex = this.buildFilterComplex(timeline, options);
    if (filterComplex) {
      command.push('-filter_complex', filterComplex);
    }

    // Output options
    command.push(
      '-c:v',
      this.getVideoCodec(options.codec),
      '-b:v',
      options.bitrate,
      '-r',
      options.fps.toString(),
      '-s',
      `${options.width}x${options.height}`,
      '-preset',
      this.getPreset(options.quality),
      'output.mp4'
    );

    return command;
  }

  private buildFilterComplex(timeline: TimelineState, options: RenderOptions): string {
    const filters: string[] = [];

    // Concatenate video clips
    if (timeline.clips.length > 1) {
      const inputs = timeline.clips.map((_, i) => `[${i}:v]`).join('');
      filters.push(`${inputs}concat=n=${timeline.clips.length}:v=1:a=0[v]`);
    } else {
      filters.push('[0:v]copy[v]');
    }

    // Apply video filters
    timeline.filters.forEach((filter) => {
      const filterStr = this.createFilterString(filter);
      if (filterStr) {
        filters.push(filterStr);
      }
    });

    // Apply text overlays
    timeline.textOverlays.forEach((overlay) => {
      const textFilter = this.createTextOverlay(overlay);
      if (textFilter) {
        filters.push(textFilter);
      }
    });

    return filters.length > 0 ? filters.join(';') : '';
  }

  private createFilterString(filter: any): string {
    switch (filter.type) {
      case 'brightness':
        return `eq=brightness=${filter.intensity}`;
      case 'contrast':
        return `eq=contrast=${filter.intensity}`;
      case 'saturation':
        return `eq=saturation=${filter.intensity}`;
      case 'blur':
        return `boxblur=${filter.intensity}`;
      case 'sepia':
        return `colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131`;
      case 'grayscale':
        return `hue=s=0`;
      case 'invert':
        return `negate`;
      default:
        return '';
    }
  }

  private createTextOverlay(overlay: any): string {
    return `drawtext=text='${overlay.text}':fontsize=${overlay.fontSize}:fontcolor=${overlay.color}:x=${overlay.x}:y=${overlay.y}:enable='between(t,${overlay.startTime},${overlay.endTime})'`;
  }

  private getVideoCodec(codec: string): string {
    switch (codec) {
      case 'h264':
        return 'libx264';
      case 'vp8':
        return 'libvpx';
      case 'vp9':
        return 'libvpx-vp9';
      default:
        return 'libx264';
    }
  }

  private getPreset(quality: string): string {
    switch (quality) {
      case 'low':
        return 'ultrafast';
      case 'medium':
        return 'medium';
      case 'high':
        return 'slow';
      case 'ultra':
        return 'veryslow';
      default:
        return 'medium';
    }
  }

  private async cleanup(): Promise<void> {
    // Clean up temporary files
    try {
      const files = await this.ffmpeg.listDir('/');
      for (const file of files) {
        if (file.name.startsWith('input') || file.name.startsWith('audio')) {
          await this.ffmpeg.deleteFile(file.name);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async terminate(): Promise<void> {
    if (this.isLoaded) {
      await this.ffmpeg.terminate();
      this.isLoaded = false;
    }
  }
}
