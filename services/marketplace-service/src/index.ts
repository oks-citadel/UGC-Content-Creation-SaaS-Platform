import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import config, { validateConfig } from './config';
import logger from './utils/logger';
import marketplaceRoutes from './routes/marketplace.routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

// Validate configuration
validateConfig();

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: config.server.env === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Initialize Express app
const app: Application = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'healthy',
      service: config.server.serviceName,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.server.env,
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: config.server.serviceName,
      timestamp: new Date().toISOString(),
    });
  }
});

// Readiness check
app.get('/ready', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});

// API routes
app.use('/api/marketplace', marketplaceRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, starting graceful shutdown`);

  // Close Prisma connection
  await prisma.$disconnect();
  logger.info('Database connections closed');

  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const PORT = config.server.port;

async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('Connected to database');

    app.listen(PORT, () => {
      logger.info(`
        ================================================
        🚀 Marketplace Service Started
        ================================================
        Environment: ${config.server.env}
        Port: ${PORT}
        Process ID: ${process.pid}
        ================================================
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
