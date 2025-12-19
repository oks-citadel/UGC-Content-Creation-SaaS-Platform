import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import redis from './config/redis';
import commerceRoutes from './routes/commerce.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Application = express();

// ==================== MIDDLEWARE ====================

// Security
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.http(message.trim()),
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// ==================== ROUTES ====================

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: config.server.serviceName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Ready check
app.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await redis.ping();

    res.json({
      status: 'ready',
      service: config.server.serviceName,
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      service: config.server.serviceName,
      error: 'Service dependencies unavailable',
    });
  }
});

// API info
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: config.server.serviceName,
    version: '1.0.0',
    description: 'Commerce microservice for shoppable UGC and attribution tracking',
    endpoints: {
      health: '/health',
      ready: '/ready',
      api: '/api',
      docs: '/api/docs',
    },
  });
});

// API routes
app.use('/api', commerceRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ==================== SERVER STARTUP ====================

const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connection established');

    // Check Redis connection
    await redis.ping();
    logger.info('Redis connection established');

    // Start HTTP server
    const server = app.listen(config.server.port, () => {
      logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🛒  NEXUS COMMERCE SERVICE                              ║
║                                                            ║
║   Environment:  ${config.server.env.padEnd(42)} ║
║   Port:         ${String(config.server.port).padEnd(42)} ║
║   Node:         ${process.version.padEnd(42)} ║
║                                                            ║
║   Status:       RUNNING ✓                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await disconnectDatabase();
          logger.info('Database connection closed');

          await redis.quit();
          logger.info('Redis connection closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forcefully shutting down after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
