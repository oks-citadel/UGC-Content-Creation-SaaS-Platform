/**
 * IP-Based Fraud Detection Middleware
 * Tracks login attempts and flags suspicious IP behavior
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'ip-fraud-detection' });
const redis = new Redis(config.redis.url);

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPT_WINDOW = 15 * 60; // 15 minutes
const IP_BLOCK_DURATION = 60 * 60; // 1 hour
const SUSPICIOUS_LOGIN_THRESHOLD = 10; // Different users from same IP

interface IpTrackingData {
  failedAttempts: number;
  lastAttempt: number;
  userIds: string[];
  blocked: boolean;
  blockedUntil?: number;
}

/**
 * Get IP tracking data from Redis
 */
async function getIpData(ip: string): Promise<IpTrackingData | null> {
  try {
    const data = await redis.get(`ip:fraud:${ip}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error({ error, ip }, 'Failed to get IP tracking data');
    return null;
  }
}

/**
 * Update IP tracking data in Redis
 */
async function updateIpData(ip: string, data: IpTrackingData): Promise<void> {
  try {
    await redis.setex(
      `ip:fraud:${ip}`,
      IP_BLOCK_DURATION,
      JSON.stringify(data)
    );
  } catch (error) {
    logger.error({ error, ip }, 'Failed to update IP tracking data');
  }
}

/**
 * Record failed login attempt
 */
export async function recordFailedAttempt(ip: string, userId?: string): Promise<void> {
  const now = Date.now();
  const data = await getIpData(ip) || {
    failedAttempts: 0,
    lastAttempt: now,
    userIds: [],
    blocked: false,
  };

  // Reset if window expired
  if (now - data.lastAttempt > FAILED_ATTEMPT_WINDOW * 1000) {
    data.failedAttempts = 0;
    data.userIds = [];
  }

  data.failedAttempts++;
  data.lastAttempt = now;

  if (userId && !data.userIds.includes(userId)) {
    data.userIds.push(userId);
  }

  // Block IP if too many failed attempts
  if (data.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    data.blocked = true;
    data.blockedUntil = now + IP_BLOCK_DURATION * 1000;
    logger.warn({ ip, failedAttempts: data.failedAttempts }, 'IP blocked due to failed attempts');
  }

  // Flag suspicious if same IP trying many different users
  if (data.userIds.length >= SUSPICIOUS_LOGIN_THRESHOLD) {
    logger.warn({ ip, userCount: data.userIds.length }, 'Suspicious IP: multiple user attempts');
    data.blocked = true;
    data.blockedUntil = now + IP_BLOCK_DURATION * 1000;
  }

  await updateIpData(ip, data);
}

/**
 * Record successful login (resets failed attempts)
 */
export async function recordSuccessfulLogin(ip: string): Promise<void> {
  try {
    await redis.del(`ip:fraud:${ip}`);
  } catch (error) {
    logger.error({ error, ip }, 'Failed to clear IP tracking data');
  }
}

/**
 * Check if IP is blocked
 */
export async function isIpBlocked(ip: string): Promise<boolean> {
  const data = await getIpData(ip);
  if (!data) return false;

  if (data.blocked && data.blockedUntil && Date.now() > data.blockedUntil) {
    // Block expired, clear data
    await redis.del(`ip:fraud:${ip}`);
    return false;
  }

  return data.blocked;
}

/**
 * Middleware to check for blocked IPs
 */
export function ipFraudDetectionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown';

  isIpBlocked(ip).then(blocked => {
    if (blocked) {
      logger.warn({ ip, path: req.path }, 'Blocked IP attempted access');
      res.status(429).json({
        success: false,
        error: {
          code: 'IP_BLOCKED',
          message: 'Too many failed attempts. Please try again later.',
        },
      });
      return;
    }
    next();
  }).catch(error => {
    logger.error({ error, ip }, 'IP fraud detection error');
    // Allow request on error to prevent blocking legitimate users
    next();
  });
}
