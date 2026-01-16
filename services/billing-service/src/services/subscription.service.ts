import { PrismaClient, Subscription, SubscriptionStatus, PlanName } from '.prisma/billing-service-client';
import Redis from 'ioredis';
import stripeIntegration from '../integrations/stripe';
import logger from '../utils/logger';
import config from '../config';
import { addDays, addMonths, addYears } from 'date-fns';

const prisma = new PrismaClient();
const redis = new Redis(config.redis.url);

// Cache configuration
const SUBSCRIPTION_CACHE_TTL = 300; // 5 minutes
const _ENTITLEMENT_CACHE_TTL = 60; // 1 minute for entitlements (reserved for future use)

/**
 * Get cached subscription data or fetch from database
 */
async function _getCachedSubscription(userId: string): Promise<Subscription | null> {
  const cacheKey = `subscription:${userId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Subscription cache hit', { userId });
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn('Redis cache error, falling back to database', { error });
  }

  return null;
}

/**
 * Cache subscription data
 */
async function _cacheSubscription(userId: string, subscription: Subscription): Promise<void> {
  const cacheKey = `subscription:${userId}`;

  try {
    await redis.setex(cacheKey, SUBSCRIPTION_CACHE_TTL, JSON.stringify(subscription));
    logger.debug('Subscription cached', { userId });
  } catch (error) {
    logger.warn('Failed to cache subscription', { error, userId });
  }
}

/**
 * Invalidate subscription cache
 */
async function _invalidateSubscriptionCache(userId: string): Promise<void> {
  const cacheKey = `subscription:${userId}`;

  try {
    await redis.del(cacheKey);
    logger.debug('Subscription cache invalidated', { userId });
  } catch (error) {
    logger.warn('Failed to invalidate subscription cache', { error, userId });
  }
}

/**
 * Log entitlement change for audit trail
 */
async function _logEntitlementChange(params: {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'CHECK';
  feature?: string;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await (prisma as any).auditLog?.create({
      data: {
        userId: params.userId,
        action: `ENTITLEMENT_${params.action}`,
        resource: 'subscription',
        resourceId: params.userId,
        oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: 'system',
        userAgent: 'billing-service',
      },
    });
  } catch (error) {
    logger.error('Failed to log entitlement change', { error, params });
  }
}

export class SubscriptionService {
  async subscribe(params: {
    userId: string;
    planName: PlanName;
    email: string;
    name?: string;
    paymentMethodId?: string;
  }): Promise<Subscription> {
    try {
      // Get the plan
      const plan = await prisma.plan.findUnique({
        where: { name: params.planName },
      });

      if (!plan) {
        throw new Error(`Plan ${params.planName} not found`);
      }

      // Check if user already has an active subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: params.userId,
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
        },
      });

      if (existingSubscription) {
        throw new Error('User already has an active subscription');
      }

      // Create Stripe customer
      const customer = await stripeIntegration.createCustomer({
        userId: params.userId,
        email: params.email,
        name: params.name,
        metadata: {
          planName: params.planName,
        },
      });

      // Attach payment method if provided
      if (params.paymentMethodId) {
        await stripeIntegration.attachPaymentMethod(
          params.paymentMethodId,
          customer.id
        );
        await stripeIntegration.setDefaultPaymentMethod(
          customer.id,
          params.paymentMethodId
        );
      }

      // Create Stripe subscription
      let stripeSubscription;
      if (plan.stripePriceId) {
        stripeSubscription = await stripeIntegration.createSubscription({
          customerId: customer.id,
          priceId: plan.stripePriceId,
          trialPeriodDays: plan.trialPeriodDays || config.billing.trialPeriodDays,
          metadata: {
            userId: params.userId,
            planName: params.planName,
          },
          paymentMethodId: params.paymentMethodId,
        });
      }

      // Calculate subscription periods
      const now = new Date();
      const trialEnd = plan.trialPeriodDays
        ? addDays(now, plan.trialPeriodDays)
        : null;

      const currentPeriodStart = trialEnd || now;
      const currentPeriodEnd =
        plan.billingPeriod === 'yearly'
          ? addYears(currentPeriodStart, 1)
          : addMonths(currentPeriodStart, 1);

      // Create subscription in database
      const subscription = await prisma.subscription.create({
        data: {
          userId: params.userId,
          planId: plan.id,
          status: trialEnd ? SubscriptionStatus.TRIALING : SubscriptionStatus.ACTIVE,
          stripeSubscriptionId: stripeSubscription?.id,
          stripeCustomerId: customer.id,
          currentPeriodStart,
          currentPeriodEnd,
          trialStart: trialEnd ? now : null,
          trialEnd: trialEnd,
        },
        include: {
          plan: true,
        },
      });

      // Initialize entitlements
      await this.initializeEntitlements(subscription.id, plan.limits as any);

      logger.info('Subscription created', {
        subscriptionId: subscription.id,
        userId: params.userId,
        planName: params.planName,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription', { error, params });
      throw error;
    }
  }

  async upgrade(subscriptionId: string, newPlanName: PlanName): Promise<Subscription> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const newPlan = await prisma.plan.findUnique({
        where: { name: newPlanName },
      });

      if (!newPlan) {
        throw new Error(`Plan ${newPlanName} not found`);
      }

      // Update Stripe subscription if exists
      if (subscription.stripeSubscriptionId && newPlan.stripePriceId) {
        await stripeIntegration.updateSubscription(
          subscription.stripeSubscriptionId,
          {
            items: [
              {
                id: subscription.stripeSubscriptionId,
                price: newPlan.stripePriceId,
              },
            ],
            proration_behavior: config.features.proratedBilling ? 'create_prorations' : 'none',
          }
        );
      }

      // Update subscription
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId: newPlan.id,
        },
        include: { plan: true },
      });

      // Update entitlements
      await this.updateEntitlements(subscriptionId, newPlan.limits as any);

      logger.info('Subscription upgraded', {
        subscriptionId,
        oldPlan: subscription.plan.name,
        newPlan: newPlanName,
      });

      return updatedSubscription;
    } catch (error) {
      logger.error('Failed to upgrade subscription', { error, subscriptionId });
      throw error;
    }
  }

  async downgrade(subscriptionId: string, newPlanName: PlanName): Promise<Subscription> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const newPlan = await prisma.plan.findUnique({
        where: { name: newPlanName },
      });

      if (!newPlan) {
        throw new Error(`Plan ${newPlanName} not found`);
      }

      // Schedule downgrade at end of current period
      if (subscription.stripeSubscriptionId && newPlan.stripePriceId) {
        await stripeIntegration.updateSubscription(
          subscription.stripeSubscriptionId,
          {
            items: [
              {
                id: subscription.stripeSubscriptionId,
                price: newPlan.stripePriceId,
              },
            ],
            proration_behavior: 'none',
          }
        );
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId: newPlan.id,
        },
        include: { plan: true },
      });

      logger.info('Subscription downgraded', {
        subscriptionId,
        oldPlan: subscription.plan.name,
        newPlan: newPlanName,
      });

      return updatedSubscription;
    } catch (error) {
      logger.error('Failed to downgrade subscription', { error, subscriptionId });
      throw error;
    }
  }

  async cancel(
    subscriptionId: string,
    cancelAtPeriodEnd: boolean = true
  ): Promise<Subscription> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Cancel Stripe subscription
      if (subscription.stripeSubscriptionId) {
        await stripeIntegration.cancelSubscription(
          subscription.stripeSubscriptionId,
          cancelAtPeriodEnd
        );
      }

      const updateData: any = {
        cancelAtPeriodEnd,
        canceledAt: new Date(),
      };

      if (!cancelAtPeriodEnd) {
        updateData.status = SubscriptionStatus.CANCELED;
        updateData.cancelAt = new Date();
      } else {
        updateData.cancelAt = subscription.currentPeriodEnd;
      }

      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: updateData,
        include: { plan: true },
      });

      logger.info('Subscription canceled', {
        subscriptionId,
        cancelAtPeriodEnd,
      });

      return updatedSubscription;
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, subscriptionId });
      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: {
          plan: true,
          entitlements: true,
        },
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to get subscription', { error, subscriptionId });
      throw error;
    }
  }

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
        },
        include: {
          plan: true,
          entitlements: true,
        },
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to get user subscription', { error, userId });
      throw error;
    }
  }

  async getSubscriptionHistory(userId: string): Promise<Subscription[]> {
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: { userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      });

      return subscriptions;
    } catch (error) {
      logger.error('Failed to get subscription history', { error, userId });
      throw error;
    }
  }

  async checkEntitlement(
    userId: string,
    feature: string
  ): Promise<{ allowed: boolean; limit?: number; used?: number }> {
    try {
      const subscription = await this.getUserSubscription(userId);

      if (!subscription) {
        return { allowed: false };
      }

      const entitlement = await prisma.entitlement.findUnique({
        where: {
          subscriptionId_feature: {
            subscriptionId: subscription.id,
            feature,
          },
        },
      });

      if (!entitlement) {
        return { allowed: false };
      }

      if (entitlement.limit === null) {
        return { allowed: true }; // Unlimited
      }

      const allowed = Number(entitlement.used) < Number(entitlement.limit);

      return {
        allowed,
        limit: Number(entitlement.limit),
        used: Number(entitlement.used),
      };
    } catch (error) {
      logger.error('Failed to check entitlement', { error, userId, feature });
      throw error;
    }
  }

  async enforceLimit(userId: string, feature: string): Promise<void> {
    const entitlement = await this.checkEntitlement(userId, feature);

    if (!entitlement.allowed) {
      throw new Error(
        `Feature limit exceeded for ${feature}. Used: ${entitlement.used}, Limit: ${entitlement.limit}`
      );
    }
  }

  async handleTrialExpiry(subscriptionId: string): Promise<void> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.status !== SubscriptionStatus.TRIALING) {
        return;
      }

      const now = new Date();
      if (subscription.trialEnd && now >= subscription.trialEnd) {
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: SubscriptionStatus.ACTIVE,
          },
        });

        logger.info('Trial expired, subscription activated', { subscriptionId });
      }
    } catch (error) {
      logger.error('Failed to handle trial expiry', { error, subscriptionId });
      throw error;
    }
  }

  private async initializeEntitlements(
    subscriptionId: string,
    limits: Record<string, number | null>
  ): Promise<void> {
    const entitlements = Object.entries(limits).map(([feature, limit]) => ({
      subscriptionId,
      userId: '', // Will be set from subscription
      feature,
      limit: limit !== null ? limit : null,
      used: 0,
      resetPeriod: 'monthly',
      lastResetAt: new Date(),
      nextResetAt: addMonths(new Date(), 1),
    }));

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (subscription) {
      for (const entitlement of entitlements) {
        entitlement.userId = subscription.userId;
        await prisma.entitlement.create({ data: entitlement });
      }
    }
  }

  private async updateEntitlements(
    subscriptionId: string,
    limits: Record<string, number | null>
  ): Promise<void> {
    // Delete existing entitlements
    await prisma.entitlement.deleteMany({
      where: { subscriptionId },
    });

    // Create new entitlements
    await this.initializeEntitlements(subscriptionId, limits);
  }
}

export default new SubscriptionService();
