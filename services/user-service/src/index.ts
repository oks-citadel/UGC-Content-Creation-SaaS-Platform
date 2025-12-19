import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { config } from './config';
import userRoutes from './routes/user.routes';
import { AppError } from '@nexus/utils';

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
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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
app.use('/users', userRoutes);
app.use('/', userRoutes); // Also mount at root for /organizations routes

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
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, method: req.method, path: req.path }, 'Request error');

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'production' ? 'An unexpected error occurred' : err.message,
    },
  });
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

    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;
