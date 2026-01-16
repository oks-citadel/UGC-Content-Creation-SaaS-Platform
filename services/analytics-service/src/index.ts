import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import analyticsRoutes from './routes/analytics.routes';
import attributionRoutes from './routes/attribution.routes';
import realtimeService from './services/realtime.service';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: config.serviceName,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api', analyticsRoutes);
app.use('/api/attribution', attributionRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start HTTP server
const server = app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   NEXUS Analytics Service                                ║
║   Port: ${config.port}                                         ║
║   Environment: ${config.env}                       ║
║   WebSocket Port: ${config.wsPort}                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Initialize WebSocket server
realtimeService.initialize(config.wsPort);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');

  server.close(() => {
    console.log('HTTP server closed');
  });

  realtimeService.close();
  console.log('WebSocket server closed');

  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');

  server.close(() => {
    console.log('HTTP server closed');
  });

  realtimeService.close();
  console.log('WebSocket server closed');

  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
