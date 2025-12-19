// =============================================================================
// Logger Configuration
// =============================================================================

import pino from 'pino';
import { config } from '../config';

const isDevelopment = config.env === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  base: {
    env: config.env,
    service: 'api-gateway',
  },

  formatters: {
    level: (label) => ({ level: label }),
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
    ],
    censor: '[REDACTED]',
  },
});

export default logger;
