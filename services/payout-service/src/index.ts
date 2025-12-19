import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import routes from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging and request ID
app.use(requestId);
app.use(pinoHttp({ logger }));

// Health endpoints
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'payout-service', timestamp: new Date().toISOString() });
});

app.get('/ready', async (_req, res) => {
  try {
    // Add readiness checks here (e.g., database, Stripe connection)
    res.json({ status: 'ready', service: 'payout-service' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: 'Service dependencies unavailable' });
  }
});

app.get('/version', (_req, res) => {
  res.json({
    service: 'payout-service',
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/v1', routes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(config.port, () => {
  logger.info(`Payout service started on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
