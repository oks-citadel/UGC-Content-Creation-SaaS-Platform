import Redis from 'ioredis';
import config from './index';
import logger from './logger';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  db: config.redis.db,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

export default redis;
