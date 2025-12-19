import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) { return Math.min(times * 50, 2000); },
});

redis.on('error', (error) => console.error('Redis error:', error));
redis.on('connect', () => console.log('Redis connected'));
