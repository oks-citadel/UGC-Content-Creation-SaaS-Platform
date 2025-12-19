import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import express from 'express';
import pino from 'pino';
import { config } from 'dotenv';
import { NotificationDispatcher, NotificationOptions } from './dispatcher';

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

const dispatcher = new NotificationDispatcher();

interface NotificationJobData extends NotificationOptions {
  userId?: string;
  metadata?: Record<string, any>;
}

interface NotificationJobResult {
  type: string;
  success: boolean;
  processingTime: number;
  error?: string;
}

const worker = new Worker<NotificationJobData, NotificationJobResult>(
  'notifications',
  async (job: Job<NotificationJobData>) => {
    const startTime = Date.now();
    logger.info(
      { jobId: job.id, type: job.data.type },
      'Processing notification job'
    );

    try {
      await dispatcher.dispatch(job.data);

      const processingTime = Date.now() - startTime;

      await job.updateProgress(100);
      await job.log(`Notification sent in ${processingTime}ms`);

      logger.info(
        { jobId: job.id, type: job.data.type, processingTime },
        'Notification job completed successfully'
      );

      return {
        type: job.data.type,
        success: true,
        processingTime,
      };
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error(
        { jobId: job.id, type: job.data.type, error },
        'Notification job failed'
      );

      return {
        type: job.data.type,
        success: false,
        processingTime,
        error: error.message,
      };
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '10'),
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 1000 },
    settings: {
      backoffStrategy: (attemptsMade: number) => {
        return Math.min(
          parseInt(process.env.BACKOFF_DELAY || '3000') *
            Math.pow(2, attemptsMade - 1),
          30000
        );
      },
    },
  }
);

// Worker event handlers
worker.on('completed', (job: Job, result: NotificationJobResult) => {
  logger.info(
    { jobId: job.id, type: result.type },
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
      worker: 'notification-dispatcher',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      worker: 'notification-dispatcher',
    });
  }
});

app.get('/metrics', async (req, res) => {
  const metrics = await worker.getMetrics('completed', 0, -1);
  res.json(metrics);
});

const server = app.listen(
  parseInt(process.env.HEALTH_CHECK_PORT || '3004'),
  () => {
    logger.info(
      { port: parseInt(process.env.HEALTH_CHECK_PORT || '3004') },
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

logger.info('Notification dispatcher worker started');
