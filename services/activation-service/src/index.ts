import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './lib/logger';
import activationsRouter from './routes/activations';
import embedRouter from './routes/embed';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'activation-service' });
});

app.use('/api/activations', activationsRouter);
app.use('/api/embed', embedRouter);

app.use(errorHandler);

const port = config.port || 3007;
app.listen(port, () => {
  logger.info({ port }, 'Activation service started');
});

export default app;
