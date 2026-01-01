// =============================================================================
// Billing Service Client
// =============================================================================
// A client for communicating with the billing-service from other services
// Used for checking subscription status and entitlements

import { retry } from './retry';

export interface EntitlementResult {
  allowed: boolean;
  limit?: number;
  used?: number;
  feature: string;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
}

export interface BulkEntitlementResult {
  entitlements: Record<string, { allowed: boolean; limit?: number; used?: number }>;
}

export interface BillingClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  apiKey?: string;
}

/**
 * BillingClient provides an interface for checking subscription status
 * and entitlements via the billing-service internal API.
 */
export class BillingClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly apiKey?: string;

  constructor(config?: Partial<BillingClientConfig>) {
    this.baseUrl = config?.baseUrl || process.env.BILLING_SERVICE_URL || 'http://billing-service:3006';
    this.timeout = config?.timeout || 5000;
    this.retries = config?.retries || 2;
    this.apiKey = config?.apiKey || process.env.BILLING_SERVICE_API_KEY;
  }

  /**
   * Check if a user has an active subscription
   */
  async checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    return retry(
      async () => {
        const response = await this.makeRequest(
          '/api/internal/subscription/status',
          'GET',
          userId
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to check subscription status');
        }

        return response.data as SubscriptionStatus;
      },
      {
        maxAttempts: this.retries,
        initialDelayMs: 500,
        backoffFactor: 2,
        jitter: true,
      }
    );
  }

  /**
   * Check if a user has entitlement to a specific feature
   */
  async checkEntitlement(userId: string, feature: string): Promise<EntitlementResult> {
    return retry(
      async () => {
        const response = await this.makeRequest(
          `/api/internal/entitlement/${encodeURIComponent(feature)}`,
          'GET',
          userId
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to check entitlement');
        }

        return response.data as EntitlementResult;
      },
      {
        maxAttempts: this.retries,
        initialDelayMs: 500,
        backoffFactor: 2,
        jitter: true,
      }
    );
  }

  /**
   * Check multiple entitlements at once
   */
  async checkEntitlements(userId: string, features: string[]): Promise<BulkEntitlementResult> {
    return retry(
      async () => {
        const response = await this.makeRequest(
          '/api/internal/entitlements/check',
          'POST',
          userId,
          { features }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to check entitlements');
        }

        return response.data as BulkEntitlementResult;
      },
      {
        maxAttempts: this.retries,
        initialDelayMs: 500,
        backoffFactor: 2,
        jitter: true,
      }
    );
  }

  /**
   * Check if user has active subscription (convenience method)
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const status = await this.checkSubscriptionStatus(userId);
      return status.hasActiveSubscription;
    } catch (error) {
      // Log error but return false to be safe
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  /**
   * Check if user is allowed to use a feature (convenience method)
   */
  async isFeatureAllowed(userId: string, feature: string): Promise<boolean> {
    try {
      const result = await this.checkEntitlement(userId, feature);
      return result.allowed;
    } catch (error) {
      // Log error but return false to be safe
      console.error('Failed to check entitlement:', error);
      return false;
    }
  }

  /**
   * Make HTTP request to billing service
   */
  private async makeRequest(
    path: string,
    method: 'GET' | 'POST',
    userId: string,
    body?: unknown
  ): Promise<{ success: boolean; data?: unknown; error?: { code: string; message: string } }> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'REQUEST_FAILED',
            message: data.error?.message || `Request failed with status ${response.status}`,
          },
        };
      }

      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: `Request timed out after ${this.timeout}ms`,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network request failed',
        },
      };
    }
  }
}

// Export a default singleton instance
export const billingClient = new BillingClient();

// Export factory function for custom configurations
export function createBillingClient(config?: Partial<BillingClientConfig>): BillingClient {
  return new BillingClient(config);
}

// =============================================================================
// Express Middleware Factories
// =============================================================================

import type { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  userId?: string;
  subscription?: SubscriptionStatus['subscription'];
  entitlement?: EntitlementResult;
}

/**
 * Creates middleware that requires an active subscription.
 * Blocks requests from users without an active subscription.
 */
export function createRequireSubscriptionMiddleware(
  client?: BillingClient
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> {
  const billingClientInstance = client || billingClient;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId || (req.headers['x-user-id'] as string);

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID required',
        });
        return;
      }

      const status = await billingClientInstance.checkSubscriptionStatus(userId);

      if (!status.hasActiveSubscription) {
        res.status(403).json({
          error: 'Subscription Required',
          message: 'An active subscription is required to access this feature',
          code: 'SUBSCRIPTION_REQUIRED',
        });
        return;
      }

      // Attach subscription info to request for downstream use
      req.subscription = status.subscription;
      next();
    } catch (error) {
      console.error('Subscription check failed:', error);
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Unable to verify subscription status. Please try again later.',
        code: 'BILLING_SERVICE_UNAVAILABLE',
      });
    }
  };
}

/**
 * Creates middleware that checks for a specific feature entitlement.
 * Blocks requests from users not entitled to the feature.
 */
export function createCheckEntitlementMiddleware(
  feature: string,
  client?: BillingClient
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> {
  const billingClientInstance = client || billingClient;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId || (req.headers['x-user-id'] as string);

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID required',
        });
        return;
      }

      const entitlement = await billingClientInstance.checkEntitlement(userId, feature);

      if (!entitlement.allowed) {
        res.status(403).json({
          error: 'Feature Not Available',
          message: `You do not have access to this feature. Please upgrade your plan.`,
          code: 'FEATURE_NOT_ALLOWED',
          feature,
          limit: entitlement.limit,
          used: entitlement.used,
        });
        return;
      }

      // Attach entitlement info to request for downstream use
      req.entitlement = entitlement;
      next();
    } catch (error) {
      console.error('Entitlement check failed:', error);
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Unable to verify feature entitlement. Please try again later.',
        code: 'BILLING_SERVICE_UNAVAILABLE',
      });
    }
  };
}

/**
 * Creates middleware that checks subscription AND a specific entitlement.
 * Combines both checks in a single middleware for efficiency.
 */
export function createRequireEntitlementMiddleware(
  feature: string,
  client?: BillingClient
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> {
  const billingClientInstance = client || billingClient;

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId || (req.headers['x-user-id'] as string);

      if (!userId) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID required',
        });
        return;
      }

      // Check subscription status first
      const status = await billingClientInstance.checkSubscriptionStatus(userId);

      if (!status.hasActiveSubscription) {
        res.status(403).json({
          error: 'Subscription Required',
          message: 'An active subscription is required to access this feature',
          code: 'SUBSCRIPTION_REQUIRED',
        });
        return;
      }

      // Then check feature entitlement
      const entitlement = await billingClientInstance.checkEntitlement(userId, feature);

      if (!entitlement.allowed) {
        res.status(403).json({
          error: 'Feature Not Available',
          message: `Your current plan does not include access to ${feature}. Please upgrade your plan.`,
          code: 'FEATURE_NOT_ALLOWED',
          feature,
          limit: entitlement.limit,
          used: entitlement.used,
        });
        return;
      }

      // Attach info to request for downstream use
      req.subscription = status.subscription;
      req.entitlement = entitlement;
      next();
    } catch (error) {
      console.error('Subscription/entitlement check failed:', error);
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Unable to verify subscription. Please try again later.',
        code: 'BILLING_SERVICE_UNAVAILABLE',
      });
    }
  };
}
