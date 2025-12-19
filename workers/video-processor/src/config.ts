import { config } from 'dotenv';

config();

export const CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    backoffDelay: parseInt(process.env.BACKOFF_DELAY || '5000'),
  },
  video: {
    tempDir: process.env.TEMP_DIR || '/tmp/video-processing',
    outputFormats: ['hls', 'dash', 'mp4'],
    thumbnailSizes: [
      { width: 320, height: 180, name: 'small' },
      { width: 640, height: 360, name: 'medium' },
      { width: 1280, height: 720, name: 'large' },
    ],
    watermark: {
      enabled: process.env.WATERMARK_ENABLED === 'true',
      path: process.env.WATERMARK_PATH || '/assets/watermark.png',
      position: process.env.WATERMARK_POSITION || 'bottomright',
    },
    compression: {
      videoBitrate: process.env.VIDEO_BITRATE || '2000k',
      audioBitrate: process.env.AUDIO_BITRATE || '128k',
      preset: process.env.FFMPEG_PRESET || 'medium',
    },
  },
  storage: {
    provider: process.env.STORAGE_PROVIDER || 's3',
    bucket: process.env.STORAGE_BUCKET || 'nexus-videos',
    region: process.env.AWS_REGION || 'us-east-1',
  },
  healthCheck: {
    port: parseInt(process.env.HEALTH_CHECK_PORT || '3001'),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    pretty: process.env.NODE_ENV !== 'production',
  },
};
