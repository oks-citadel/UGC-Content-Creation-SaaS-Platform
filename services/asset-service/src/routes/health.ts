// =============================================================================
// Asset Service - Health Check Routes
// =============================================================================

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { BlobServiceClient } from '@azure/storage-blob';
import Redis from 'ioredis';

const router = Router();

// Service metadata
const SERVICE_NAME = 'asset-service';
const SERVICE_VERSION = process.env.npm_package_version || '1.0.0';
const startTime = Date.now();

// Lazy-initialized clients
let prisma: PrismaClient | null = null;
let redis: Redis | null = null;
let blobServiceClient: BlobServiceClient | null = null;

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

function getBlobClient(): BlobServiceClient | null {
  if (!blobServiceClient && process.env.AZURE_STORAGE_CONNECTION_STRING) {
    blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
  }
  return blobServiceClient;
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

  // Database check
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
  const [dbCheck, redisCheck, storageCheck, memoryCheck] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkBlobStorage(),
    checkMemory(),
  ]);

  checks.push(dbCheck, redisCheck, storageCheck, memoryCheck);

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

async function checkBlobStorage(): Promise<HealthCheckResult> {
  const start = Date.now();
  const client = getBlobClient();

  if (!client) {
    return {
      name: 'blob-storage',
      status: 'warn',
      duration: Date.now() - start,
      message: 'Azure Blob Storage not configured',
    };
  }

  try {
    const containerName = process.env.AZURE_STORAGE_CONTAINER_UPLOADS || 'uploads';
    const containerClient = client.getContainerClient(containerName);
    const exists = await containerClient.exists();

    return {
      name: 'blob-storage',
      status: exists ? 'pass' : 'fail',
      duration: Date.now() - start,
      message: exists ? 'Blob storage accessible' : 'Container not found',
    };
  } catch (error) {
    return {
      name: 'blob-storage',
      status: 'fail',
      duration: Date.now() - start,
      message: error instanceof Error ? error.message : 'Blob storage check failed',
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

export default router;
