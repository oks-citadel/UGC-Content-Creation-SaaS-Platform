// =============================================================================
// Health Check Utilities
// =============================================================================
// Shared health check implementation for all CreatorBridge services
// =============================================================================

import { Request, Response, Router } from 'express';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: HealthCheckItem[];
}

export interface HealthCheckItem {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  duration?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthCheckOptions {
  serviceName: string;
  version: string;
  checks?: HealthCheckFunction[];
}

export type HealthCheckFunction = () => Promise<HealthCheckItem>;

// Track service start time for uptime calculation
const startTime = Date.now();

/**
 * Creates a health check router with standard endpoints
 */
export function createHealthRouter(options: HealthCheckOptions): Router {
  const router = Router();

  // Basic liveness probe - just confirms the service is running
  router.get('/health/live', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness probe - confirms the service can accept traffic
  router.get('/health/ready', async (_req: Request, res: Response) => {
    try {
      const result = await runHealthChecks(options);
      const statusCode = result.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Full health check with all dependency checks
  router.get('/health', async (_req: Request, res: Response) => {
    try {
      const result = await runHealthChecks(options);
      const statusCode = result.status === 'healthy' ? 200 :
                        result.status === 'degraded' ? 200 : 503;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}

/**
 * Runs all configured health checks
 */
async function runHealthChecks(options: HealthCheckOptions): Promise<HealthCheckResult> {
  const checks: HealthCheckItem[] = [];
  const checkFunctions = options.checks || [];

  // Run all checks in parallel
  const results = await Promise.allSettled(
    checkFunctions.map(async (checkFn) => {
      const startTime = Date.now();
      try {
        const result = await checkFn();
        result.duration = Date.now() - startTime;
        return result;
      } catch (error) {
        return {
          name: 'unknown',
          status: 'fail' as const,
          duration: Date.now() - startTime,
          message: error instanceof Error ? error.message : 'Check failed',
        };
      }
    })
  );

  // Collect results
  for (const result of results) {
    if (result.status === 'fulfilled') {
      checks.push(result.value);
    } else {
      checks.push({
        name: 'unknown',
        status: 'fail',
        message: result.reason?.message || 'Check failed',
      });
    }
  }

  // Determine overall status
  const hasFailures = checks.some((c) => c.status === 'fail');
  const hasWarnings = checks.some((c) => c.status === 'warn');

  let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (hasFailures) {
    status = 'unhealthy';
  } else if (hasWarnings) {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    service: options.serviceName,
    version: options.version,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
  };
}

// =============================================================================
// Common Health Check Functions
// =============================================================================

/**
 * Creates a database health check using Prisma
 */
export function createDatabaseCheck(prisma: { $queryRaw: (query: TemplateStringsArray) => Promise<unknown> }): HealthCheckFunction {
  return async (): Promise<HealthCheckItem> => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        name: 'database',
        status: 'pass',
        message: 'Database connection successful',
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  };
}

/**
 * Creates a Redis health check
 */
export function createRedisCheck(redis: { ping: () => Promise<string> }): HealthCheckFunction {
  return async (): Promise<HealthCheckItem> => {
    try {
      const response = await redis.ping();
      if (response === 'PONG') {
        return {
          name: 'redis',
          status: 'pass',
          message: 'Redis connection successful',
        };
      }
      return {
        name: 'redis',
        status: 'warn',
        message: `Unexpected Redis response: ${response}`,
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  };
}

/**
 * Creates a memory usage health check
 */
export function createMemoryCheck(thresholdPercent = 90): HealthCheckFunction {
  return async (): Promise<HealthCheckItem> => {
    const used = process.memoryUsage();
    const heapUsedPercent = (used.heapUsed / used.heapTotal) * 100;

    if (heapUsedPercent > thresholdPercent) {
      return {
        name: 'memory',
        status: 'warn',
        message: `High memory usage: ${heapUsedPercent.toFixed(1)}%`,
        details: {
          heapUsed: Math.round(used.heapUsed / 1024 / 1024),
          heapTotal: Math.round(used.heapTotal / 1024 / 1024),
          external: Math.round(used.external / 1024 / 1024),
          rss: Math.round(used.rss / 1024 / 1024),
        },
      };
    }

    return {
      name: 'memory',
      status: 'pass',
      message: `Memory usage: ${heapUsedPercent.toFixed(1)}%`,
      details: {
        heapUsedMB: Math.round(used.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(used.heapTotal / 1024 / 1024),
      },
    };
  };
}

/**
 * Creates an external service health check
 */
export function createExternalServiceCheck(
  name: string,
  checkFn: () => Promise<boolean>,
  timeoutMs = 5000
): HealthCheckFunction {
  return async (): Promise<HealthCheckItem> => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeoutMs)
      );

      const result = await Promise.race([checkFn(), timeoutPromise]);

      if (result) {
        return {
          name,
          status: 'pass',
          message: `${name} is available`,
        };
      }

      return {
        name,
        status: 'fail',
        message: `${name} check returned false`,
      };
    } catch (error) {
      return {
        name,
        status: 'fail',
        message: error instanceof Error ? error.message : `${name} check failed`,
      };
    }
  };
}

/**
 * Creates an Azure Blob Storage health check
 */
export function createBlobStorageCheck(
  containerClient: { exists: () => Promise<boolean> }
): HealthCheckFunction {
  return async (): Promise<HealthCheckItem> => {
    try {
      const exists = await containerClient.exists();
      if (exists) {
        return {
          name: 'blob-storage',
          status: 'pass',
          message: 'Blob storage accessible',
        };
      }
      return {
        name: 'blob-storage',
        status: 'fail',
        message: 'Blob container not found',
      };
    } catch (error) {
      return {
        name: 'blob-storage',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Blob storage check failed',
      };
    }
  };
}

/**
 * Creates a Stripe API health check
 */
export function createStripeCheck(
  stripe: { balance: { retrieve: () => Promise<unknown> } }
): HealthCheckFunction {
  return async (): Promise<HealthCheckItem> => {
    try {
      await stripe.balance.retrieve();
      return {
        name: 'stripe',
        status: 'pass',
        message: 'Stripe API accessible',
      };
    } catch (error) {
      return {
        name: 'stripe',
        status: 'fail',
        message: error instanceof Error ? error.message : 'Stripe check failed',
      };
    }
  };
}

export default {
  createHealthRouter,
  createDatabaseCheck,
  createRedisCheck,
  createMemoryCheck,
  createExternalServiceCheck,
  createBlobStorageCheck,
  createStripeCheck,
};
