import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import express from 'express';
import pino from 'pino';
import { config } from 'dotenv';
import {
  AnalyticsAggregator,
  MetricsData,
} from './aggregator';

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
const aggregator = new AnalyticsAggregator();
interface AnalyticsJobData {
  type: 'collect' | 'aggregate-daily' | 'aggregate-weekly' | 'generate-report';
  platform?: string;
  accessToken?: string;
  postId?: string;
  metricsData?: MetricsData[];
  historicalData?: MetricsData[];
}
interface AnalyticsJobResult {
  type: string;
  data: any;
  processingTime: number;
}
const worker = new Worker<AnalyticsJobData, AnalyticsJobResult>(
  'analytics-aggregation',
  async (job: Job<AnalyticsJobData>) => {
    const startTime = Date.now();
    logger.info(
      { jobId: job.id, type: job.data.type },
      'Processing analytics job'
    );
    try {
      let result: any;
      switch (job.data.type) {
        case 'collect':
          result = await aggregator.collectMetrics(
            job.data.platform as any,
            job.data.accessToken!,
            job.data.postId!
          );
          break;
        case 'aggregate-daily':
          result = await aggregator.aggregateDaily(job.data.metricsData!);
          break;
        case 'aggregate-weekly':
          result = await aggregator.aggregateWeekly(job.data.metricsData!);
          break;
        case 'generate-report':
          const aggregated =
            job.data.metricsData![0].platform === 'tiktok'
              ? await aggregator.aggregateDaily(job.data.metricsData!)
              : await aggregator.aggregateWeekly(job.data.metricsData!);
          const anomalies = aggregator.detectAnomalies(
            job.data.metricsData!,
            job.data.historicalData || []
          );
          result = aggregator.generateReport(aggregated, anomalies);
          break;
        default:
          throw new Error(`Unknown job type: ${job.data.type}`);
      }
      const processingTime = Date.now() - startTime;
      await job.updateProgress(100);
      await job.log(`Analytics job completed in ${processingTime}ms`);
      logger.info(
        { jobId: job.id, type: job.data.type, processingTime },
        'Analytics job completed successfully'
      );
      return {
        type: job.data.type,
        data: result,
        processingTime,
      };
    } catch (error) {
      logger.error(
        { jobId: job.id, type: job.data.type, error },
        'Analytics job failed'
      );
      throw error;
    }
  },
  {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
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
worker.on('completed', (job: Job, result: AnalyticsJobResult) => {
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
app.get('/health', (_req, res) => {
  const isHealthy = !worker.closing;
  if (isHealthy) {
    res.status(200).json({
      status: 'healthy',
      worker: 'analytics-aggregator',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      worker: 'analytics-aggregator',
    });
  }
});
app.get('/metrics', async (_req, res) => {
  res.json({
    worker: 'analytics-aggregator',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
const server = app.listen(
  parseInt(process.env.HEALTH_CHECK_PORT || '3003'),
  () => {
    logger.info(
      { port: parseInt(process.env.HEALTH_CHECK_PORT || '3003') },
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
logger.info('Analytics aggregator worker started');
