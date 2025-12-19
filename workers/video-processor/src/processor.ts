import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import pino from 'pino';
import { CONFIG } from './config';

ffmpeg.setFfmpegPath(ffmpegPath.path);

const logger = pino({
  level: CONFIG.logging.level,
  transport: CONFIG.logging.pretty
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

export interface VideoMetadata {
  duration: number;
  resolution: { width: number; height: number };
  codec: string;
  bitrate: number;
  fps: number;
  audioCodec?: string;
  fileSize: number;
}

export interface ProcessingResult {
  outputs: {
    format: string;
    path: string;
    size: number;
  }[];
  thumbnails: {
    size: string;
    path: string;
  }[];
  metadata: VideoMetadata;
}

export class VideoProcessor {
  private logger = logger.child({ component: 'VideoProcessor' });

  async transcode(
    inputPath: string,
    outputFormat: 'hls' | 'dash' | 'mp4'
  ): Promise<string> {
    this.logger.info({ inputPath, outputFormat }, 'Starting transcoding');

    const outputDir = path.join(
      CONFIG.video.tempDir,
      `transcode-${Date.now()}`
    );
    await fs.mkdir(outputDir, { recursive: true });

    return new Promise((resolve, reject) => {
      const command = ffmpeg(inputPath);

      if (outputFormat === 'hls') {
        const outputPath = path.join(outputDir, 'playlist.m3u8');
        command
          .outputOptions([
            '-codec: copy',
            '-start_number 0',
            '-hls_time 10',
            '-hls_list_size 0',
            '-f hls',
          ])
          .output(outputPath)
          .on('end', () => {
            this.logger.info({ outputPath }, 'HLS transcoding completed');
            resolve(outputPath);
          })
          .on('error', (err) => {
            this.logger.error({ err }, 'HLS transcoding failed');
            reject(err);
          })
          .run();
      } else if (outputFormat === 'dash') {
        const outputPath = path.join(outputDir, 'manifest.mpd');
        command
          .outputOptions([
            '-codec: copy',
            '-f dash',
            '-seg_duration 10',
          ])
          .output(outputPath)
          .on('end', () => {
            this.logger.info({ outputPath }, 'DASH transcoding completed');
            resolve(outputPath);
          })
          .on('error', (err) => {
            this.logger.error({ err }, 'DASH transcoding failed');
            reject(err);
          })
          .run();
      } else {
        const outputPath = path.join(outputDir, 'output.mp4');
        command
          .outputOptions([
            `-b:v ${CONFIG.video.compression.videoBitrate}`,
            `-b:a ${CONFIG.video.compression.audioBitrate}`,
            `-preset ${CONFIG.video.compression.preset}`,
          ])
          .output(outputPath)
          .on('end', () => {
            this.logger.info({ outputPath }, 'MP4 transcoding completed');
            resolve(outputPath);
          })
          .on('error', (err) => {
            this.logger.error({ err }, 'MP4 transcoding failed');
            reject(err);
          })
          .run();
      }
    });
  }

  async generateThumbnails(
    inputPath: string
  ): Promise<{ size: string; path: string }[]> {
    this.logger.info({ inputPath }, 'Generating thumbnails');

    const outputDir = path.join(
      CONFIG.video.tempDir,
      `thumbnails-${Date.now()}`
    );
    await fs.mkdir(outputDir, { recursive: true });

    const thumbnails: { size: string; path: string }[] = [];

    // Extract a frame at 1 second
    const tempFramePath = path.join(outputDir, 'frame.png');
    await this.extractFrame(inputPath, tempFramePath, 1);

    // Generate multiple sizes
    for (const size of CONFIG.video.thumbnailSizes) {
      const outputPath = path.join(outputDir, `thumbnail-${size.name}.jpg`);

      await sharp(tempFramePath)
        .resize(size.width, size.height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 })
        .toFile(outputPath);

      thumbnails.push({
        size: size.name,
        path: outputPath,
      });

      this.logger.info({ size: size.name, outputPath }, 'Thumbnail generated');
    }

    // Clean up temp frame
    await fs.unlink(tempFramePath);

    return thumbnails;
  }

  private extractFrame(
    inputPath: string,
    outputPath: string,
    timestamp: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: path.dirname(outputPath),
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });
  }

  async extractMetadata(inputPath: string): Promise<VideoMetadata> {
    this.logger.info({ inputPath }, 'Extracting metadata');

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          this.logger.error({ err }, 'Failed to extract metadata');
          return reject(err);
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');
        const audioStream = metadata.streams.find((s) => s.codec_type === 'audio');

        if (!videoStream) {
          return reject(new Error('No video stream found'));
        }

        const result: VideoMetadata = {
          duration: metadata.format.duration || 0,
          resolution: {
            width: videoStream.width || 0,
            height: videoStream.height || 0,
          },
          codec: videoStream.codec_name || 'unknown',
          bitrate: metadata.format.bit_rate || 0,
          fps: this.parseFps(videoStream.r_frame_rate || '0/1'),
          audioCodec: audioStream?.codec_name,
          fileSize: metadata.format.size || 0,
        };

        this.logger.info({ metadata: result }, 'Metadata extracted');
        resolve(result);
      });
    });
  }

  private parseFps(fpsString: string): number {
    const [num, den] = fpsString.split('/').map(Number);
    return den ? num / den : 0;
  }

  async optimizeForWeb(inputPath: string): Promise<string> {
    this.logger.info({ inputPath }, 'Optimizing for web');

    const outputDir = path.join(CONFIG.video.tempDir, `optimized-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'optimized.mp4');

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c:v libx264',
          `-b:v ${CONFIG.video.compression.videoBitrate}`,
          `-preset ${CONFIG.video.compression.preset}`,
          '-c:a aac',
          `-b:a ${CONFIG.video.compression.audioBitrate}`,
          '-movflags +faststart', // Enable progressive streaming
          '-pix_fmt yuv420p', // Ensure compatibility
        ])
        .output(outputPath)
        .on('end', () => {
          this.logger.info({ outputPath }, 'Web optimization completed');
          resolve(outputPath);
        })
        .on('error', (err) => {
          this.logger.error({ err }, 'Web optimization failed');
          reject(err);
        })
        .run();
    });
  }

  async addWatermark(inputPath: string): Promise<string> {
    if (!CONFIG.video.watermark.enabled) {
      this.logger.info('Watermark disabled, skipping');
      return inputPath;
    }

    this.logger.info({ inputPath }, 'Adding watermark');

    const outputDir = path.join(CONFIG.video.tempDir, `watermarked-${Date.now()}`);
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'watermarked.mp4');

    const watermarkPath = CONFIG.video.watermark.path;
    const position = this.getWatermarkPosition(CONFIG.video.watermark.position);

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .input(watermarkPath)
        .complexFilter([
          `[1:v]scale=iw*0.2:-1[watermark]`,
          `[0:v][watermark]overlay=${position}`,
        ])
        .outputOptions(['-codec:a copy'])
        .output(outputPath)
        .on('end', () => {
          this.logger.info({ outputPath }, 'Watermark added');
          resolve(outputPath);
        })
        .on('error', (err) => {
          this.logger.error({ err }, 'Failed to add watermark');
          reject(err);
        })
        .run();
    });
  }

  private getWatermarkPosition(position: string): string {
    const positions: Record<string, string> = {
      topleft: '10:10',
      topright: 'W-w-10:10',
      bottomleft: '10:H-h-10',
      bottomright: 'W-w-10:H-h-10',
      center: '(W-w)/2:(H-h)/2',
    };
    return positions[position] || positions.bottomright;
  }

  async processVideo(inputPath: string): Promise<ProcessingResult> {
    this.logger.info({ inputPath }, 'Starting video processing');

    try {
      // Extract metadata first
      const metadata = await this.extractMetadata(inputPath);

      // Generate thumbnails
      const thumbnails = await this.generateThumbnails(inputPath);

      // Optimize for web
      let processedPath = await this.optimizeForWeb(inputPath);

      // Add watermark if enabled
      processedPath = await this.addWatermark(processedPath);

      // Transcode to multiple formats
      const outputs = await Promise.all(
        CONFIG.video.outputFormats.map(async (format) => {
          const outputPath = await this.transcode(
            processedPath,
            format as 'hls' | 'dash' | 'mp4'
          );
          const stats = await fs.stat(outputPath);
          return {
            format,
            path: outputPath,
            size: stats.size,
          };
        })
      );

      const result: ProcessingResult = {
        outputs,
        thumbnails,
        metadata,
      };

      this.logger.info({ result }, 'Video processing completed');
      return result;
    } catch (error) {
      this.logger.error({ error }, 'Video processing failed');
      throw error;
    }
  }
}
