import { Request, Response, NextFunction } from 'express';
import subscriptionService from '../services/subscription.service';
import logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const checkEntitlement = (feature: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
      }

      const entitlement = await subscriptionService.checkEntitlement(
        userId,
        feature
      );

      if (!entitlement.allowed) {
        logger.warn('Entitlement check failed', {
          userId,
          feature,
          limit: entitlement.limit,
          used: entitlement.used,
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: `Feature limit exceeded for ${feature}`,
          details: {
            feature,
            limit: entitlement.limit,
            used: entitlement.used,
          },
        });
      }

      // Attach entitlement info to request
      (req as any).entitlement = entitlement;

      next();
    } catch (error) {
      logger.error('Entitlement middleware error', { error, feature });
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check entitlement',
      });
    }
  };
};

export const requireActiveSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId || req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User ID not found in request',
      });
    }

    const subscription = await subscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'No active subscription found',
      });
    }

    // Attach subscription to request
    (req as any).subscription = subscription;

    next();
  } catch (error) {
    logger.error('Subscription middleware error', { error });
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check subscription',
    });
  }
};

export const requirePlan = (allowedPlans: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
      }

      const subscription = await subscriptionService.getUserSubscription(userId);

      if (!subscription) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'No active subscription found',
        });
      }

      if (!allowedPlans.includes(subscription.plan.name)) {
        logger.warn('Plan requirement not met', {
          userId,
          currentPlan: subscription.plan.name,
          requiredPlans: allowedPlans,
        });

        return res.status(403).json({
          error: 'Forbidden',
          message: `This feature requires one of the following plans: ${allowedPlans.join(', ')}`,
          details: {
            currentPlan: subscription.plan.name,
            requiredPlans: allowedPlans,
          },
        });
      }

      // Attach subscription to request
      (req as any).subscription = subscription;

      next();
    } catch (error) {
      logger.error('Plan requirement middleware error', { error });
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check plan requirement',
      });
    }
  };
};

export const checkUsageLimit = (usageType: string, quantity: number = 1) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.userId || req.headers['x-user-id'] as string;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User ID not found in request',
        });
      }

      const entitlement = await subscriptionService.checkEntitlement(
        userId,
        usageType
      );

      if (!entitlement.allowed) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Usage limit exceeded for ${usageType}`,
          details: {
            feature: usageType,
            limit: entitlement.limit,
            used: entitlement.used,
            requestedQuantity: quantity,
          },
        });
      }

      // Check if the requested quantity would exceed the limit
      if (
        entitlement.limit !== undefined &&
        entitlement.used !== undefined &&
        entitlement.used + quantity > entitlement.limit
      ) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Requested quantity would exceed usage limit for ${usageType}`,
          details: {
            feature: usageType,
            limit: entitlement.limit,
            used: entitlement.used,
            requestedQuantity: quantity,
            available: entitlement.limit - entitlement.used,
          },
        });
      }

      next();
    } catch (error) {
      logger.error('Usage limit middleware error', { error, usageType });
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check usage limit',
      });
    }
  };
};
