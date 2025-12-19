import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './utils/logger';
import billingRoutes from './routes/billing.routes';
import planRoutes from './routes/plan.routes';
import cron from 'node-cron';
import invoiceService from './services/invoice.service';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api', limiter);

// Body parsing middleware
// For Stripe webhooks, we need raw body
app.use(
  '/api/billing/webhooks/stripe',
  express.raw({ type: 'application/json' })
);

// For other routes, use JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'billing-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/billing', billingRoutes);
app.use('/api/plans', planRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Scheduled jobs
const setupCronJobs = () => {
  // Process dunning retries every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running dunning retry job');
    try {
      await invoiceService.processDunningRetries();
      logger.info('Dunning retry job completed');
    } catch (error) {
      logger.error('Dunning retry job failed', { error });
    }
  });

  // Reset monthly usage on the 1st of each month at midnight
  cron.schedule('0 0 1 * *', async () => {
    logger.info('Running monthly usage reset job');
    try {
      // This would need to be implemented to reset all subscriptions
      logger.info('Monthly usage reset job completed');
    } catch (error) {
      logger.error('Monthly usage reset job failed', { error });
    }
  });

  logger.info('Cron jobs scheduled');
};

// Start server
const startServer = async () => {
  try {
    // Setup cron jobs
    setupCronJobs();

    app.listen(config.port, () => {
      logger.info(`Billing service listening on port ${config.port}`, {
        nodeEnv: config.nodeEnv,
        port: config.port,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  // Stop accepting new requests
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

startServer();

export default app;
