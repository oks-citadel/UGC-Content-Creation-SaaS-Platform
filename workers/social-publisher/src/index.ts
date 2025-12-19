import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import express from 'express';
import pino from 'pino';
import { config } from 'dotenv';
import { SocialPublisher, PublishOptions, PublishResult } from './publisher';

config();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: null,
});

const publisher = new SocialPublisher();

const worker = new Worker<PublishOptions, PublishResult>(
  'social-publishing',
  async (job: Job<PublishOptions>) => {
    const startTime = Date.now();
    logger.info(
      { jobId: job.id, platform: job.data.platform },
      'Processing publishing job'
    );

    try {
      let result: PublishResult;

      switch (job.data.platform) {
        case 'tiktok':
          result = await publisher.publishToTikTok(job.data);
          break;
        case 'instagram':
          result = await publisher.publishToInstagram(job.data);
          break;
        case 'youtube':
          result = await publisher.publishToYouTube(job.data);
          break;
        case 'facebook':
          result = await publisher.publishToFacebook(job.data);
          break;
        default:
          throw new Error(`Unknown platform: ${job.data.platform}`);
      }

      const processingTime = Date.now() - startTime;

      if (!result.success) {
        throw new Error(result.error || 'Publishing failed');
      }

      await job.updateProgress(100);
      await job.log(`Published successfully in ${processingTime}ms`);

      logger.info(
        { jobId: job.id, platform: job.data.platform, processingTime },
        'Publishing job completed successfully'
      );

      return result;
    } catch (error) {
      logger.error(
        { jobId: job.id, platform: job.data.platform, error },
        'Publishing job failed'
      );
      throw error;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '3'),
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 1000 },
    settings: {
      backoffStrategy: (attemptsMade: number) => {
        return Math.min(
          parseInt(process.env.BACKOFF_DELAY || '5000') *
            Math.pow(2, attemptsMade - 1),
          60000
        );
      },
    },
  }
);

// Worker event handlers
worker.on('completed', (job: Job, result: PublishResult) => {
  logger.info(
    { jobId: job.id, platform: result.platform, postId: result.postId },
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

app.get('/health', (req, res) => {
  const isHealthy = !worker.closing && !worker.closed;

  if (isHealthy) {
    res.status(200).json({
      status: 'healthy',
      worker: 'social-publisher',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      worker: 'social-publisher',
    });
  }
});

app.get('/metrics', async (req, res) => {
  const metrics = await worker.getMetrics('completed', 0, -1);
  res.json(metrics);
});

const server = app.listen(
  parseInt(process.env.HEALTH_CHECK_PORT || '3002'),
  () => {
    logger.info(
      { port: parseInt(process.env.HEALTH_CHECK_PORT || '3002') },
      'Health check server started'
    );
  }
);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');

  await worker.close();
  server.close();
  await connection.quit();

  logger.info('Graceful shutdown completed');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

logger.info('Social publisher worker started');
