import { PrismaClient, SubscriptionStatus, PlanName } from '.prisma/billing-service-client';

const mockPrismaClient = {
  subscription: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  plan: {
    findUnique: jest.fn(),
  },
  entitlement: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient),
  SubscriptionStatus: {
    ACTIVE: 'ACTIVE',
    TRIALING: 'TRIALING',
    PAST_DUE: 'PAST_DUE',
    CANCELED: 'CANCELED',
    UNPAID: 'UNPAID',
  },
  PlanName: {
    FREE: 'FREE',
    STARTER: 'STARTER',
    PROFESSIONAL: 'PROFESSIONAL',
    ENTERPRISE: 'ENTERPRISE',
  },
}));

const mockStripeIntegration = {
  createCustomer: jest.fn(),
  createSubscription: jest.fn(),
  updateSubscription: jest.fn(),
  cancelSubscription: jest.fn(),
  attachPaymentMethod: jest.fn(),
  setDefaultPaymentMethod: jest.fn(),
};

jest.mock('../integrations/stripe', () => ({
  __esModule: true,
  default: mockStripeIntegration,
}));

jest.mock('../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../config', () => ({
  __esModule: true,
  default: {
    billing: {
      trialPeriodDays: 14,
    },
    features: {
      proratedBilling: true,
    },
    redis: {
      url: 'redis://localhost:6379',
    },
  },
}));
jest.mock('ioredis', () => {  return jest.fn().mockImplementation(() => ({    get: jest.fn().mockResolvedValue(null),    setex: jest.fn().mockResolvedValue('OK'),    del: jest.fn().mockResolvedValue(1),  }));});

import subscriptionService from '../services/subscription.service';

describe('SubscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkEntitlement', () => {
    it('should return allowed: true for unlimited entitlement', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-456',
        status: 'ACTIVE',
        plan: { name: 'PROFESSIONAL' },
        entitlements: [],
      };

      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrismaClient.entitlement.findUnique.mockResolvedValue({
        subscriptionId: 'sub-123',
        feature: 'storage',
        limit: null,
        used: 500,
      });

      const result = await subscriptionService.checkEntitlement('user-456', 'storage');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBeUndefined();
      expect(mockPrismaClient.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-456',
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
        include: {
          plan: true,
          entitlements: true,
        },
      });
    });

    it('should return allowed: false when limit is exceeded', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-456',
        status: 'ACTIVE',
      };

      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrismaClient.entitlement.findUnique.mockResolvedValue({
        subscriptionId: 'sub-123',
        feature: 'campaigns',
        limit: 10,
        used: 10,
      });

      const result = await subscriptionService.checkEntitlement('user-456', 'campaigns');

      expect(result.allowed).toBe(false);
      expect(result.limit).toBe(10);
      expect(result.used).toBe(10);
    });

    it('should return allowed: true when within limit', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-456',
        status: 'ACTIVE',
      };

      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrismaClient.entitlement.findUnique.mockResolvedValue({
        subscriptionId: 'sub-123',
        feature: 'campaigns',
        limit: 10,
        used: 5,
      });

      const result = await subscriptionService.checkEntitlement('user-456', 'campaigns');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.used).toBe(5);
    });

    it('should return allowed: false when no subscription exists', async () => {
      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);

      const result = await subscriptionService.checkEntitlement('user-456', 'campaigns');

      expect(result.allowed).toBe(false);
    });

    it('should return allowed: false when entitlement not found', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-456',
        status: 'ACTIVE',
      };

      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrismaClient.entitlement.findUnique.mockResolvedValue(null);

      const result = await subscriptionService.checkEntitlement('user-456', 'unknown-feature');

      expect(result.allowed).toBe(false);
    });
  });

  describe('subscribe', () => {
    const mockPlan = {
      id: 'plan-123',
      name: 'PROFESSIONAL',
      stripePriceId: 'price_mock123',
      price: 99,
      trialPeriodDays: 14,
      billingPeriod: 'monthly',
      limits: { campaigns: 10, storage: 100 },
    };

    const mockCustomer = { id: 'cus_mock123' };
    const mockStripeSubscription = { id: 'sub_stripe123' };

    it('should create a new subscription', async () => {
      mockPrismaClient.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);
      mockStripeIntegration.createCustomer.mockResolvedValue(mockCustomer);
      mockStripeIntegration.createSubscription.mockResolvedValue(mockStripeSubscription);

      const mockCreatedSubscription = {
        id: 'sub-new-123',
        userId: 'user-456',
        planId: 'plan-123',
        status: 'TRIALING',
        stripeSubscriptionId: 'sub_stripe123',
        stripeCustomerId: 'cus_mock123',
        plan: mockPlan,
      };
      mockPrismaClient.subscription.create.mockResolvedValue(mockCreatedSubscription);
      mockPrismaClient.subscription.findUnique.mockResolvedValue(mockCreatedSubscription);
      mockPrismaClient.entitlement.create.mockResolvedValue({});

      const result = await subscriptionService.subscribe({
        userId: 'user-456',
        planName: 'PROFESSIONAL' as PlanName,
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(result.status).toBe('TRIALING');
      expect(result.planId).toBe('plan-123');
      expect(mockStripeIntegration.createCustomer).toHaveBeenCalledWith({
        userId: 'user-456',
        email: 'test@example.com',
        name: 'Test User',
        metadata: { planName: 'PROFESSIONAL' },
      });
    });

    it('should throw error if user already has active subscription', async () => {
      mockPrismaClient.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrismaClient.subscription.findFirst.mockResolvedValue({
        id: 'existing-sub',
        userId: 'user-456',
        status: 'ACTIVE',
      });

      await expect(
        subscriptionService.subscribe({
          userId: 'user-456',
          planName: 'PROFESSIONAL' as PlanName,
          email: 'test@example.com',
        })
      ).rejects.toThrow('User already has an active subscription');
    });

    it('should throw error if plan not found', async () => {
      mockPrismaClient.plan.findUnique.mockResolvedValue(null);

      await expect(
        subscriptionService.subscribe({
          userId: 'user-456',
          planName: 'INVALID_PLAN' as PlanName,
          email: 'test@example.com',
        })
      ).rejects.toThrow('Plan INVALID_PLAN not found');
    });

    it('should attach payment method when provided', async () => {
      mockPrismaClient.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);
      mockStripeIntegration.createCustomer.mockResolvedValue(mockCustomer);
      mockStripeIntegration.createSubscription.mockResolvedValue(mockStripeSubscription);
      mockPrismaClient.subscription.create.mockResolvedValue({
        id: 'sub-new-123',
        userId: 'user-456',
        plan: mockPlan,
      });
      mockPrismaClient.subscription.findUnique.mockResolvedValue({ userId: 'user-456' });

      await subscriptionService.subscribe({
        userId: 'user-456',
        planName: 'PROFESSIONAL' as PlanName,
        email: 'test@example.com',
        paymentMethodId: 'pm_test123',
      });

      expect(mockStripeIntegration.attachPaymentMethod).toHaveBeenCalledWith(
        'pm_test123',
        'cus_mock123'
      );
      expect(mockStripeIntegration.setDefaultPaymentMethod).toHaveBeenCalledWith(
        'cus_mock123',
        'pm_test123'
      );
    });
  });

  describe('upgrade', () => {
    it('should upgrade subscription to a higher plan', async () => {
      const mockCurrentSubscription = {
        id: 'sub-123',
        planId: 'starter-plan',
        stripeSubscriptionId: 'sub_stripe123',
        plan: { name: 'STARTER', stripePriceId: 'price_starter' },
      };

      const mockNewPlan = {
        id: 'pro-plan',
        name: 'PROFESSIONAL',
        stripePriceId: 'price_pro',
        limits: { campaigns: 50, storage: 500 },
      };

      mockPrismaClient.subscription.findUnique.mockResolvedValue(mockCurrentSubscription);
      mockPrismaClient.plan.findUnique.mockResolvedValue(mockNewPlan);
      mockPrismaClient.subscription.update.mockResolvedValue({
        ...mockCurrentSubscription,
        planId: 'pro-plan',
        plan: mockNewPlan,
      });
      mockPrismaClient.entitlement.deleteMany.mockResolvedValue({ count: 2 });

      const result = await subscriptionService.upgrade('sub-123', 'PROFESSIONAL' as PlanName);

      expect(result.planId).toBe('pro-plan');
      expect(mockPrismaClient.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: { planId: 'pro-plan' },
        include: { plan: true },
      });
    });

    it('should update Stripe subscription', async () => {
      const mockCurrentSubscription = {
        id: 'sub-123',
        planId: 'starter-plan',
        stripeSubscriptionId: 'sub_stripe123',
        plan: { name: 'STARTER', stripePriceId: 'price_starter' },
      };

      const mockNewPlan = {
        id: 'pro-plan',
        name: 'PROFESSIONAL',
        stripePriceId: 'price_pro',
        limits: {},
      };

      mockPrismaClient.subscription.findUnique.mockResolvedValue(mockCurrentSubscription);
      mockPrismaClient.plan.findUnique.mockResolvedValue(mockNewPlan);
      mockPrismaClient.subscription.update.mockResolvedValue({
        ...mockCurrentSubscription,
        planId: 'pro-plan',
      });

      await subscriptionService.upgrade('sub-123', 'PROFESSIONAL' as PlanName);

      expect(mockStripeIntegration.updateSubscription).toHaveBeenCalledWith(
        'sub_stripe123',
        {
          items: [{ id: 'sub_stripe123', price: 'price_pro' }],
          proration_behavior: 'create_prorations',
        }
      );
    });

    it('should throw error if subscription not found', async () => {
      mockPrismaClient.subscription.findUnique.mockResolvedValue(null);

      await expect(
        subscriptionService.upgrade('non-existent', 'PROFESSIONAL' as PlanName)
      ).rejects.toThrow('Subscription not found');
    });
  });

  describe('cancel', () => {
    const mockSubscription = {
      id: 'sub-123',
      stripeSubscriptionId: 'sub_stripe123',
      currentPeriodEnd: new Date('2024-12-31'),
      status: 'ACTIVE',
    };

    it('should cancel subscription at period end', async () => {
      mockPrismaClient.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrismaClient.subscription.update.mockResolvedValue({
        ...mockSubscription,
        cancelAtPeriodEnd: true,
        canceledAt: expect.any(Date),
        cancelAt: mockSubscription.currentPeriodEnd,
      });

      const result = await subscriptionService.cancel('sub-123', true);

      expect(mockStripeIntegration.cancelSubscription).toHaveBeenCalledWith(
        'sub_stripe123',
        true
      );
      expect(mockPrismaClient.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: expect.objectContaining({
          cancelAtPeriodEnd: true,
          canceledAt: expect.any(Date),
          cancelAt: mockSubscription.currentPeriodEnd,
        }),
        include: { plan: true },
      });
    });

    it('should cancel subscription immediately', async () => {
      mockPrismaClient.subscription.findUnique.mockResolvedValue(mockSubscription);
      mockPrismaClient.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: 'CANCELED',
        cancelAtPeriodEnd: false,
        canceledAt: expect.any(Date),
        cancelAt: expect.any(Date),
      });

      const result = await subscriptionService.cancel('sub-123', false);

      expect(mockStripeIntegration.cancelSubscription).toHaveBeenCalledWith(
        'sub_stripe123',
        false
      );
      expect(mockPrismaClient.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: expect.objectContaining({
          cancelAtPeriodEnd: false,
          canceledAt: expect.any(Date),
          cancelAt: expect.any(Date),
          status: 'CANCELED',
        }),
        include: { plan: true },
      });
    });

    it('should throw error if subscription not found', async () => {
      mockPrismaClient.subscription.findUnique.mockResolvedValue(null);

      await expect(subscriptionService.cancel('non-existent')).rejects.toThrow(
        'Subscription not found'
      );
    });
  });

  describe('getUserSubscription', () => {
    it('should return active subscription for user', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-456',
        status: 'ACTIVE',
        plan: { name: 'PROFESSIONAL' },
        entitlements: [{ feature: 'campaigns', limit: 10, used: 5 }],
      };

      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await subscriptionService.getUserSubscription('user-456');

      expect(result).toEqual(mockSubscription);
      expect(mockPrismaClient.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-456',
          status: { in: ['ACTIVE', 'TRIALING'] },
        },
        include: {
          plan: true,
          entitlements: true,
        },
      });
    });

    it('should return null when no active subscription exists', async () => {
      mockPrismaClient.subscription.findFirst.mockResolvedValue(null);

      const result = await subscriptionService.getUserSubscription('user-456');

      expect(result).toBeNull();
    });
  });

  describe('enforceLimit', () => {
    it('should not throw when within limit', async () => {
      const mockSubscription = { id: 'sub-123', userId: 'user-456' };
      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrismaClient.entitlement.findUnique.mockResolvedValue({
        feature: 'campaigns',
        limit: 10,
        used: 5,
      });

      await expect(
        subscriptionService.enforceLimit('user-456', 'campaigns')
      ).resolves.not.toThrow();
    });

    it('should throw when limit exceeded', async () => {
      const mockSubscription = { id: 'sub-123', userId: 'user-456' };
      mockPrismaClient.subscription.findFirst.mockResolvedValue(mockSubscription);
      mockPrismaClient.entitlement.findUnique.mockResolvedValue({
        feature: 'campaigns',
        limit: 10,
        used: 10,
      });

      await expect(
        subscriptionService.enforceLimit('user-456', 'campaigns')
      ).rejects.toThrow('Feature limit exceeded for campaigns. Used: 10, Limit: 10');
    });
  });
});
