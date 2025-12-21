import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import express from 'express';
import pino from 'pino';
import { CONFIG } from './config';
import { VideoProcessor } from './processor';
import { promises as fs } from 'fs';

const logger = pino({
  level: CONFIG.logging.level,
  transport: CONFIG.logging.pretty
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

const connection = new Redis({
  host: CONFIG.redis.host,
  port: CONFIG.redis.port,
  password: CONFIG.redis.password,
  db: CONFIG.redis.db,
  maxRetriesPerRequest: null,
});

const processor = new VideoProcessor();

interface VideoJobData {
  videoId: string;
  inputPath: string;
  userId: string;
  options?: {
    formats?: string[];
    watermark?: boolean;
    thumbnails?: boolean;
  };
}

interface VideoJobResult {
  videoId: string;
  outputs: Array<{ format: string; path: string; size: number }>;
  thumbnails: Array<{ size: string; path: string }>;
  metadata: any;
  processingTime: number;
}

const worker = new Worker<VideoJobData, VideoJobResult>(
  'video-processing',
  async (job: Job<VideoJobData>) => {
    const startTime = Date.now();
    logger.info(
      { jobId: job.id, data: job.data },
      'Processing video job'
    );

    try {
      // Ensure temp directory exists
      await fs.mkdir(CONFIG.video.tempDir, { recursive: true });

      // Process the video
      const result = await processor.processVideo(job.data.inputPath);

      const processingTime = Date.now() - startTime;

      // Update job progress
      await job.updateProgress(100);

      // Emit completion event
      await job.log(`Video processing completed in ${processingTime}ms`);

      const jobResult: VideoJobResult = {
        videoId: job.data.videoId,
        outputs: result.outputs,
        thumbnails: result.thumbnails,
        metadata: result.metadata,
        processingTime,
      };

      logger.info(
        { jobId: job.id, processingTime },
        'Video job completed successfully'
      );

      return jobResult;
    } catch (error) {
      logger.error(
        { jobId: job.id, error },
        'Video job failed'
      );
      throw error;
    }
  },
  {
    connection,
    concurrency: CONFIG.worker.concurrency,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 1000 },
    settings: {
      backoffStrategy: (attemptsMade: number) => {
        return Math.min(
          CONFIG.worker.backoffDelay * Math.pow(2, attemptsMade - 1),
          60000
        );
      },
    },
  }
);

// Worker event handlers
worker.on('completed', (job: Job, result: VideoJobResult) => {
  logger.info(
    { jobId: job.id, videoId: result.videoId },
    'Job completed'
  );
});

worker.on('failed', (job: Job | undefined, error: Error) => {
  logger.error(
    { jobId: job?.id, error: error.message },
    'Job failed'
  );
});

worker.on('error', (error: Error) => {
  logger.error({ error }, 'Worker error');
});

worker.on('stalled', (jobId: string) => {
  logger.warn({ jobId }, 'Job stalled');
});

// Health check server
const app = express();

app.get('/health', (_req, res) => {
  const isHealthy = !worker.closing;

  if (isHealthy) {
    res.status(200).json({
      status: 'healthy',
      worker: 'video-processor',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      worker: 'video-processor',
    });
  }
});

app.get('/metrics', async (_req, res) => {
  res.json({
    worker: 'video-processor',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

const server = app.listen(CONFIG.healthCheck.port, () => {
  logger.info(
    { port: CONFIG.healthCheck.port },
    'Health check server started'
  );
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');

  // Stop accepting new jobs
  await worker.close();

  // Close health check server
  server.close();

  // Close Redis connection
  await connection.quit();

  logger.info('Graceful shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

logger.info('Video processor worker started');
