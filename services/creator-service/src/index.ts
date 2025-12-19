import 'express-async-errors';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { config } from './config';
import logger from './lib/logger';
import prisma from './lib/prisma';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import creatorRoutes from './routes/creator.routes';

const app: Application = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: config.isProduction(),
  crossOriginEmbedderPolicy: config.isProduction(),
}));

// CORS Configuration
app.use(cors({
  origin: config.getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Compression
app.use(compression());

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logging
app.use(pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/health' || req.url === '/metrics',
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (res.statusCode >= 300) return 'info';
    return 'debug';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed with ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`;
  },
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.get('RATE_LIMIT_WINDOW_MS'),
  max: config.get('RATE_LIMIT_MAX_REQUESTS'),
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.url === '/health' || req.url === '/metrics';
  },
});

app.use(limiter);

// Health Check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      service: config.get('SERVICE_NAME'),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.get('NODE_ENV'),
    });
  } catch (error) {
    logger.error({ error }, 'Health check failed');
    res.status(503).json({
      status: 'unhealthy',
      service: config.get('SERVICE_NAME'),
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

// Metrics Endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const [creatorsCount, verifiedCount, activeCount] = await Promise.all([
      prisma.creator.count(),
      prisma.creator.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.creator.count({ where: { status: 'ACTIVE' } }),
    ]);

    res.status(200).json({
      status: 'success',
      service: config.get('SERVICE_NAME'),
      timestamp: new Date().toISOString(),
      metrics: {
        totalCreators: creatorsCount,
        verifiedCreators: verifiedCount,
        activeCreators: activeCount,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch metrics');
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch metrics',
    });
  }
});

// API Routes
app.use('/api/creators', creatorRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: config.get('SERVICE_NAME'),
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
  });
});

// 404 Handler
app.use(notFoundHandler);

// Error Handler (must be last)
app.use(errorHandler);

// Start Server
const PORT = config.get('PORT');

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Start listening
    app.listen(PORT, () => {
      logger.info(
        {
          port: PORT,
          env: config.get('NODE_ENV'),
          service: config.get('SERVICE_NAME'),
        },
        `Creator Service is running on port ${PORT}`
      );
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Close server
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error({ error }, 'Uncaught Exception');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error({ reason, promise }, 'Unhandled Rejection');
  process.exit(1);
});

// Start the server
startServer();

export default app;
