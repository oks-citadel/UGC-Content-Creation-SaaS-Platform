// =============================================================================
// Payout Service - Health Check Routes
// =============================================================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import Stripe from 'stripe';

const router: Router = Router();

// Service metadata
const SERVICE_NAME = 'payout-service';
const SERVICE_VERSION = process.env.npm_package_version || '1.0.0';
const startTime = Date.now();

// Lazy-initialized clients
let prisma: PrismaClient | null = null;
let redis: Redis | null = null;
let stripe: Stripe | null = null;

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

function getRedis(): Redis | null {
  if (!redis && process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);
  }
  return redis;
}

function getStripe(): Stripe | null {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

interface HealthCheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration?: number;
  message?: string;
}

// Liveness probe - just confirms the service is running
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Readiness probe - confirms the service can accept traffic
router.get('/ready', async (_req: Request, res: Response) => {
  const checks: HealthCheckResult[] = [];

  // Database and Stripe are critical for readiness
  const [dbCheck, stripeCheck] = await Promise.all([
    checkDatabase(),
    checkStripe(),
  ]);

  checks.push(dbCheck, stripeCheck);

  // Only database failure makes us not ready (Stripe can be degraded)
  const isReady = dbCheck.status !== 'fail';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    checks,
  });
});

// Full health check
router.get('/', async (_req: Request, res: Response) => {
  const checks: HealthCheckResult[] = [];

  // Run all checks in parallel
  const [dbCheck, redisCheck, stripeCheck, memoryCheck, pendingPayoutsCheck] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkStripe(),
    checkMemory(),
    checkPendingPayouts(),
  ]);

  checks.push(dbCheck, redisCheck, stripeCheck, memoryCheck, pendingPayoutsCheck);

  const hasFailures = checks.some((c) => c.status === 'fail');
  const hasWarnings = checks.some((c) => c.status === 'warn');

  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (hasFailures) status = 'unhealthy';
  else if (hasWarnings) status = 'degraded';

  res.status(hasFailures ? 503 : 200).json({
    status,
    timestamp: new Date().toISOString(),
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  });
});

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return {
      name: 'database',
      status: 'pass',
      duration: Date.now() - start,
      message: 'PostgreSQL connection successful',
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'fail',
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

async function checkRedis(): Promise<HealthCheckResult> {
  const start = Date.now();
  const redisClient = getRedis();

  if (!redisClient) {
    return {
      name: 'redis',
      status: 'warn',
      duration: Date.now() - start,
      message: 'Redis not configured',
    };
  }

  try {
    const response = await redisClient.ping();
    return {
      name: 'redis',
      status: response === 'PONG' ? 'pass' : 'warn',
      duration: Date.now() - start,
      message: response === 'PONG' ? 'Redis connection successful' : `Unexpected response: ${response}`,
    };
  } catch (error) {
    return {
      name: 'redis',
      status: 'fail',
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }
}

async function checkStripe(): Promise<HealthCheckResult> {
  const start = Date.now();
  const stripeClient = getStripe();

  if (!stripeClient) {
    return {
      name: 'stripe',
      status: 'warn',
      duration: Date.now() - start,
      message: 'Stripe not configured',
    };
  }

  try {
    // Retrieve balance to verify API connectivity
    await stripeClient.balance.retrieve();
    return {
      name: 'stripe',
      status: 'pass',
      duration: Date.now() - start,
      message: 'Stripe API connection successful',
    };
  } catch (error) {
    return {
      name: 'stripe',
      status: 'fail',
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Stripe connection failed',
    };
  }
}

async function checkMemory(): Promise<HealthCheckResult> {
  const used = process.memoryUsage();
  const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;
  const threshold = 90;

  return {
    name: 'memory',
    status: heapUsedPercent > threshold ? 'warn' : 'pass',
    message: `Heap usage: ${heapUsedPercent.toFixed(1)}% (${Math.round(used.heapUsed / 1024 / 1024)}MB / ${Math.round(used.heapTotal / 1024 / 1024)}MB)`,
  };
}

async function checkPendingPayouts(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Check for stuck payouts (pending for more than 24 hours)
    const stuckPayouts = await getPrisma().$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM payouts
      WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '24 hours'
    `;
    const stuckCount = Number(stuckPayouts[0]?.count || 0);

    if (stuckCount > 10) {
      return {
        name: 'pending-payouts',
        status: 'warn',
        duration: Date.now() - start,
        message: `${stuckCount} payouts stuck in pending state for >24h`,
      };
    }

    if (stuckCount > 0) {
      return {
        name: 'pending-payouts',
        status: 'pass',
        duration: Date.now() - start,
        message: `${stuckCount} payouts pending for >24h (within threshold)`,
      };
    }

    return {
      name: 'pending-payouts',
      status: 'pass',
      duration: Date.now() - start,
      message: 'No stuck payouts detected',
    };
  } catch (error) {
    return {
      name: 'pending-payouts',
      status: 'warn',
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Could not check pending payouts',
    };
  }
}

export default router;
