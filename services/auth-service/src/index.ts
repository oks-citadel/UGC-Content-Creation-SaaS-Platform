import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import pinoHttp from 'pino-http';

import { config } from './config';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middleware/error-handler';

const logger = pino({
  name: config.serviceName,
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
});

const app = express();

// Trust proxy (for rate limiting behind load balancer)
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

// Apply rate limiting to auth routes
app.use('/auth', limiter);

// Stricter rate limit for sensitive endpoints
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts, please try again later',
    },
  },
});

app.use('/auth/password/forgot', strictLimiter);
app.use('/auth/password/reset', strictLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: config.serviceName });
});

// Readiness check
app.get('/ready', async (req, res) => {
  try {
    // Import prisma here to avoid circular dependencies
    const { prisma } = await import('./lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', service: config.serviceName });
  } catch (error) {
    res.status(503).json({ status: 'not ready', service: config.serviceName });
  }
});

// Routes
app.use('/auth', authRoutes);

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
