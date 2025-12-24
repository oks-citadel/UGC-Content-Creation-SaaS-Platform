// =============================================================================
// Rights Service - Health Check Routes
// =============================================================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const router: Router = Router();

// Service metadata
const SERVICE_NAME = 'rights-service';
const SERVICE_VERSION = process.env.npm_package_version || '1.0.0';
const startTime = Date.now();

// Lazy-initialized clients
let prisma: PrismaClient | null = null;
let redis: Redis | null = null;

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

  // Database check is critical for readiness
  const dbCheck = await checkDatabase();
  checks.push(dbCheck);

  const isReady = checks.every((c) => c.status !== 'fail');

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
  const [dbCheck, redisCheck, memoryCheck, licenseTemplatesCheck] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkMemory(),
    checkLicenseTemplates(),
  ]);

  checks.push(dbCheck, redisCheck, memoryCheck, licenseTemplatesCheck);

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

async function checkLicenseTemplates(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Check that license templates are accessible
    const count = await getPrisma().$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM license_templates WHERE status = 'active'
    `;
    const templateCount = Number(count[0]?.count || 0);

    if (templateCount === 0) {
      return {
        name: 'license-templates',
        status: 'warn',
        duration: Date.now() - start,
        message: 'No active license templates found',
      };
    }

    return {
      name: 'license-templates',
      status: 'pass',
      duration: Date.now() - start,
      message: `${templateCount} active license templates available`,
    };
  } catch (error) {
    return {
      name: 'license-templates',
      status: 'warn',
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Could not check license templates',
    };
  }
}

export default router;
