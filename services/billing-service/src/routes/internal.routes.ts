/**
 * Internal API Routes for Billing Service
 * These endpoints are for service-to-service communication to check
 * subscription status and entitlements.
 */

import { Router, Request, Response } from 'express';
import subscriptionService from '../services/subscription.service';
import logger from '../utils/logger';

const router: Router = Router();

interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Middleware to extract user ID from headers
const extractUserId = (req: AuthenticatedRequest, res: Response, next: any) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User ID required' });
  }
  req.userId = userId;
  next();
};

router.use(extractUserId);

// Check entitlement for a specific feature
router.get('/entitlement/:feature', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { feature } = req.params;

    const entitlement = await subscriptionService.checkEntitlement(userId, feature);

    res.json({
      allowed: entitlement.allowed,
      limit: entitlement.limit,
      used: entitlement.used,
      feature,
    });
  } catch (error) {
    logger.error('Failed to check entitlement', { error, userId: req.userId, feature: req.params.feature });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check entitlement',
    });
  }
});

// Check if user has active subscription
router.get('/subscription/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const subscription = await subscriptionService.getUserSubscription(userId);

    if (!subscription) {
      return res.json({
        hasActiveSubscription: false,
        subscription: null,
      });
    }

    res.json({
      hasActiveSubscription: true,
      subscription: {
        id: subscription.id,
        plan: (subscription as any).plan?.name,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    logger.error('Failed to check subscription status', { error, userId: req.userId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check subscription status',
    });
  }
});

// Check multiple entitlements at once
router.post('/entitlements/check', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { features } = req.body;

    if (!Array.isArray(features)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Features must be an array',
      });
    }

    const results: Record<string, { allowed: boolean; limit?: number; used?: number }> = {};

    for (const feature of features) {
      results[feature] = await subscriptionService.checkEntitlement(userId, feature);
    }

    res.json({ entitlements: results });
  } catch (error) {
    logger.error('Failed to check entitlements', { error, userId: req.userId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check entitlements',
    });
  }
});

export default router;
