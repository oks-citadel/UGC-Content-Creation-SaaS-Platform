import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import cron from 'node-cron';

import { config } from './config';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middleware/error-handler';
import { NotificationService } from './services/notification.service';

const logger = pino({
  name: config.serviceName,
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
});

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
}));

// Request logging
app.use(pinoHttp({ logger }));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: config.serviceName });
});

// Readiness check
app.get('/ready', async (req, res) => {
  try {
    const { prisma } = await import('./lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', service: config.serviceName });
  } catch (error) {
    res.status(503).json({ status: 'not ready', service: config.serviceName });
  }
});

// Routes
app.use('/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
    },
  });
});

// Error handler
app.use(errorHandler);

// Initialize notification service
const notificationService = new NotificationService();

// Schedule notification processor (every minute)
cron.schedule('* * * * *', async () => {
  try {
    await notificationService.processScheduledNotifications();
  } catch (error) {
    logger.error(error, 'Error processing scheduled notifications');
  }
});

// Schedule retry failed notifications (every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
  try {
    await notificationService.retryFailedNotifications();
  } catch (error) {
    logger.error(error, 'Error retrying failed notifications');
  }
});

// Start server
const server = app.listen(config.port, () => {
  logger.info(`${config.serviceName} listening on port ${config.port}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing server...');

  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      const { prisma } = await import('./lib/prisma');
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error(error, 'Error closing database connection');
    }

    try {
      const { redis } = await import('./lib/redis');
      await redis.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error(error, 'Error closing Redis connection');
    }

    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
