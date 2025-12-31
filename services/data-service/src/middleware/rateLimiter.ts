import { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export function rateLimiter(options: RateLimitOptions) {
  const { maxRequests, windowMs } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:${req.ip}:${req.path}`;
    const windowSec = Math.ceil(windowMs / 1000);

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSec);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current).toString());

      if (current > maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: windowSec,
        });
      }

      next();
    } catch (error) {
      next();
    }
  };
}
