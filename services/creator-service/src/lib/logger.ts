import pino from 'pino';
import { config } from '../config';

const logger = pino({
  level: config.get('LOG_LEVEL'),
  transport: config.isDevelopment()
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  base: {
    service: config.get('SERVICE_NAME'),
    env: config.get('NODE_ENV'),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
