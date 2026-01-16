import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cron from 'node-cron';
import { config } from './config';
import workflowRoutes from './routes/workflow.routes';
import triggerRoutes from './routes/trigger.routes';
import actionRoutes from './routes/action.routes';
import { errorHandler } from './middleware/error-handler';
import { WorkflowScheduler } from './engine/scheduler';

const logger = pino({ name: config.serviceName, level: config.nodeEnv === 'production' ? 'info' : 'debug' });
const app: express.Express = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: config.cors.origins, credentials: true }));
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'healthy', service: config.serviceName }));
app.get('/ready', async (req, res) => {
  try {
    const { prisma } = await import('./lib/prisma.js');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', service: config.serviceName });
  } catch (error) {
    res.status(503).json({ status: 'not ready', service: config.serviceName });
  }
});

app.use('/workflows', workflowRoutes);
app.use('/triggers', triggerRoutes);
app.use('/actions', actionRoutes);
app.use((req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } }));
app.use(errorHandler);

const scheduler = new WorkflowScheduler();
cron.schedule('* * * * *', async () => {
  try {
    await scheduler.processSchedules();
  } catch (error) {
    logger.error(error, 'Error processing schedules');
  }
});

const server = app.listen(config.port, () => logger.info(`${config.serviceName} listening on port ${config.port}`));

const gracefulShutdown = async () => {
  logger.info('Shutting down...');
  server.close(async () => {
    try {
      const { prisma } = await import('./lib/prisma.js');
      await prisma.$disconnect();
      const { redis } = await import('./lib/redis');
      await redis.quit();
    } catch (error) {
      logger.error(error, 'Error during shutdown');
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
