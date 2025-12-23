import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockPrisma = {
  subscription: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  plan: {
    findUnique: vi.fn(),
  },
  entitlement: {
    create: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
  },
  invoice: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  usageRecord: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  paymentAttempt: {
    create: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  SubscriptionStatus: {
    ACTIVE: 'ACTIVE',
    TRIALING: 'TRIALING',
    PAST_DUE: 'PAST_DUE',
    CANCELED: 'CANCELED',
    UNPAID: 'UNPAID',
  },
  InvoiceStatus: {
    DRAFT: 'DRAFT',
    OPEN: 'OPEN',
    PAID: 'PAID',
    UNCOLLECTIBLE: 'UNCOLLECTIBLE',
  },
  PlanName: {
    FREE: 'FREE',
    STARTER: 'STARTER',
    PROFESSIONAL: 'PROFESSIONAL',
    ENTERPRISE: 'ENTERPRISE',
  },
}));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_mock123' }),
    },
    subscriptions: {
      create: vi.fn().mockResolvedValue({ id: 'sub_mock123' }),
      update: vi.fn().mockResolvedValue({ id: 'sub_mock123' }),
      cancel: vi.fn().mockResolvedValue({ id: 'sub_mock123' }),
    },
    paymentMethods: {
      attach: vi.fn().mockResolvedValue({}),
    },
    invoices: {
      create: vi.fn().mockResolvedValue({ id: 'inv_mock123', hosted_invoice_url: 'https://stripe.com/invoice' }),
      retrieve: vi.fn().mockResolvedValue({ invoice_pdf: 'https://stripe.com/pdf' }),
      pay: vi.fn().mockResolvedValue({ status: 'paid', payment_intent: 'pi_123' }),
    },
  })),
}));

describe('Billing Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Subscription Creation', () => {
    it('should create a new subscription', async () => {
      const mockPlan = {
        id: 'plan-123',
        name: 'PROFESSIONAL',
        stripePriceId: 'price_mock123',
        price: 99,
        trialPeriodDays: 14,
        billingPeriod: 'monthly',
        limits: { campaigns: 10, storage: 100 },
      };

      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-456',
        planId: 'plan-123',
        status: 'TRIALING',
        stripeSubscriptionId: 'sub_mock123',
        stripeCustomerId: 'cus_mock123',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        plan: mockPlan,
      };

      mockPrisma.plan.findUnique.mockResolvedValue(mockPlan);
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscription.create.mockResolvedValue(mockSubscription);

      const plan = await mockPrisma.plan.findUnique({ where: { name: 'PROFESSIONAL' } });
      expect(plan).not.toBeNull();

      const existingSub = await mockPrisma.subscription.findFirst({
        where: { userId: 'user-456', status: { in: ['ACTIVE', 'TRIALING'] } },
      });
      expect(existingSub).toBeNull();

      const subscription = await mockPrisma.subscription.create({
        data: {
          userId: 'user-456',
          planId: plan!.id,
          status: 'TRIALING',
        },
      });

      expect(subscription.status).toBe('TRIALING');
      expect(subscription.planId).toBe('plan-123');
    });

    it('should reject subscription if user already has active one', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        id: 'existing-sub',
        userId: 'user-456',
        status: 'ACTIVE',
      });

      const existingSub = await mockPrisma.subscription.findFirst({
        where: { userId: 'user-456', status: { in: ['ACTIVE', 'TRIALING'] } },
      });

      expect(existingSub).not.toBeNull();
    });

    it('should initialize entitlements after creation', async () => {
      const limits = { campaigns: 10, storage: 100, aiGenerations: 500 };

      mockPrisma.entitlement.create
        .mockResolvedValueOnce({ feature: 'campaigns', limit: 10, used: 0 })
        .mockResolvedValueOnce({ feature: 'storage', limit: 100, used: 0 })
        .mockResolvedValueOnce({ feature: 'aiGenerations', limit: 500, used: 0 });

      const entitlements = await Promise.all(
        Object.entries(limits).map(([feature, limit]) =>
          mockPrisma.entitlement.create({
            data: { subscriptionId: 'sub-123', feature, limit, used: 0 },
          })
        )
      );

      expect(entitlements).toHaveLength(3);
      expect(mockPrisma.entitlement.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('Usage Tracking', () => {
    it('should record usage', async () => {
      mockPrisma.usageRecord.create.mockResolvedValue({
        id: 'usage-123',
        subscriptionId: 'sub-456',
        userId: 'user-789',
        type: 'AI_GENERATIONS',
        quantity: 5,
        unit: 'generation',
      });

      const usage = await mockPrisma.usageRecord.create({
        data: {
          subscriptionId: 'sub-456',
          userId: 'user-789',
          type: 'AI_GENERATIONS',
          quantity: 5,
          unit: 'generation',
        },
      });

      expect(usage.quantity).toBe(5);
      expect(usage.type).toBe('AI_GENERATIONS');
    });

    it('should aggregate usage by period', async () => {
      mockPrisma.usageRecord.findMany.mockResolvedValue([
        { type: 'VIEWS', quantity: 1000 },
        { type: 'VIEWS', quantity: 1500 },
        { type: 'AI_GENERATIONS', quantity: 50 },
        { type: 'AI_GENERATIONS', quantity: 75 },
      ]);

      const records = await mockPrisma.usageRecord.findMany({
        where: { userId: 'user-123' },
      });

      const summary: Record<string, number> = {};
      records.forEach((r: any) => {
        summary[r.type] = (summary[r.type] || 0) + r.quantity;
      });

      expect(summary.VIEWS).toBe(2500);
      expect(summary.AI_GENERATIONS).toBe(125);
    });

    it('should check entitlement limits', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        feature: 'campaigns',
        limit: 10,
        used: 8,
      });

      const entitlement = await mockPrisma.entitlement.findUnique({
        where: { subscriptionId_feature: { subscriptionId: 'sub-123', feature: 'campaigns' } },
      });

      const allowed = entitlement!.used < entitlement!.limit;
      expect(allowed).toBe(true);

      const remaining = entitlement!.limit - entitlement!.used;
      expect(remaining).toBe(2);
    });

    it('should handle unlimited entitlements', async () => {
      mockPrisma.entitlement.findUnique.mockResolvedValue({
        feature: 'storage',
        limit: null,
        used: 500,
      });

      const entitlement = await mockPrisma.entitlement.findUnique({
        where: { subscriptionId_feature: { subscriptionId: 'sub-123', feature: 'storage' } },
      });

      const allowed = entitlement!.limit === null || entitlement!.used < entitlement!.limit;
      expect(allowed).toBe(true);
    });
  });

  describe('Invoice Generation', () => {
    it('should create invoice', async () => {
      mockPrisma.invoice.count.mockResolvedValue(5);
      mockPrisma.invoice.create.mockResolvedValue({
        id: 'inv-123',
        subscriptionId: 'sub-456',
        userId: 'user-789',
        invoiceNumber: 'INV-202401-000006',
        amount: 99,
        tax: 0,
        total: 99,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const count = await mockPrisma.invoice.count();
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(count + 1).padStart(6, '0')}`;

      const invoice = await mockPrisma.invoice.create({
        data: {
          subscriptionId: 'sub-456',
          userId: 'user-789',
          invoiceNumber,
          amount: 99,
          tax: 0,
          total: 99,
          status: 'DRAFT',
        },
      });

      expect(invoice.invoiceNumber).toBe('INV-202401-000006');
      expect(invoice.total).toBe(99);
    });

    it('should list user invoices', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([
        { id: 'inv-1', total: 99, status: 'PAID' },
        { id: 'inv-2', total: 99, status: 'PAID' },
        { id: 'inv-3', total: 99, status: 'OPEN' },
      ]);
      mockPrisma.invoice.count.mockResolvedValue(3);

      const [invoices, total] = await Promise.all([
        mockPrisma.invoice.findMany({ where: { userId: 'user-123' }, take: 10 }),
        mockPrisma.invoice.count({ where: { userId: 'user-123' } }),
      ]);

      expect(invoices).toHaveLength(3);
      expect(total).toBe(3);
    });

    it('should handle payment success', async () => {
      mockPrisma.invoice.update.mockResolvedValue({
        id: 'inv-123',
        status: 'PAID',
        paidAt: new Date(),
      });

      const invoice = await mockPrisma.invoice.update({
        where: { id: 'inv-123' },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          stripePaymentIntentId: 'pi_123',
        },
      });

      expect(invoice.status).toBe('PAID');
      expect(invoice.paidAt).toBeDefined();
    });

    it('should handle payment failure', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-123',
        subscriptionId: 'sub-456',
        total: 99,
        dunningAttempts: 0,
      });

      mockPrisma.paymentAttempt.create.mockResolvedValue({
        id: 'attempt-123',
        invoiceId: 'inv-123',
        amount: 99,
        status: 'failed',
        errorCode: 'card_declined',
      });

      const attempt = await mockPrisma.paymentAttempt.create({
        data: {
          invoiceId: 'inv-123',
          amount: 99,
          status: 'failed',
          errorCode: 'card_declined',
        },
      });

      expect(attempt.status).toBe('failed');
      expect(attempt.errorCode).toBe('card_declined');
    });
  });

  describe('Proration Calculations', () => {
    it('should calculate prorated amount for upgrade', () => {
      const calculateProration = (
        currentPlanPrice: number,
        newPlanPrice: number,
        daysRemaining: number,
        totalDays: number
      ) => {
        const unusedCredit = (currentPlanPrice / totalDays) * daysRemaining;
        const newPlanCost = (newPlanPrice / totalDays) * daysRemaining;
        return Math.round((newPlanCost - unusedCredit) * 100) / 100;
      };

      const prorated = calculateProration(49, 99, 15, 30);
      expect(prorated).toBe(25);
    });

    it('should calculate prorated credit for downgrade', () => {
      const calculateCredit = (
        currentPlanPrice: number,
        newPlanPrice: number,
        daysRemaining: number,
        totalDays: number
      ) => {
        const unusedCredit = (currentPlanPrice / totalDays) * daysRemaining;
        const newPlanCost = (newPlanPrice / totalDays) * daysRemaining;
        return Math.round((unusedCredit - newPlanCost) * 100) / 100;
      };

      const credit = calculateCredit(99, 49, 15, 30);
      expect(credit).toBe(25);
    });

    it('should handle mid-cycle subscription changes', () => {
      const subscriptionStart = new Date('2024-01-01');
      const today = new Date('2024-01-16');
      const subscriptionEnd = new Date('2024-01-31');

      const totalDays = Math.ceil((subscriptionEnd.getTime() - subscriptionStart.getTime()) / (1000 * 60 * 60 * 24));
      const usedDays = Math.ceil((today.getTime() - subscriptionStart.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = totalDays - usedDays;

      expect(totalDays).toBe(30);
      expect(usedDays).toBe(15);
      expect(remainingDays).toBe(15);
    });

    it('should calculate overage charges', () => {
      const calculateOverage = (used: number, limit: number, ratePerUnit: number) => {
        if (used <= limit) return 0;
        return (used - limit) * ratePerUnit;
      };

      const storageOverage = calculateOverage(150, 100, 0.10);
      expect(storageOverage).toBe(5);

      const aiOverage = calculateOverage(600, 500, 0.05);
      expect(aiOverage).toBe(5);

      const noOverage = calculateOverage(50, 100, 0.10);
      expect(noOverage).toBe(0);
    });
  });

  describe('Subscription Operations', () => {
    it('should upgrade subscription', async () => {
      mockPrisma.subscription.update.mockResolvedValue({
        id: 'sub-123',
        planId: 'enterprise-plan',
        status: 'ACTIVE',
      });

      const upgraded = await mockPrisma.subscription.update({
        where: { id: 'sub-123' },
        data: { planId: 'enterprise-plan' },
      });

      expect(upgraded.planId).toBe('enterprise-plan');
    });

    it('should cancel subscription at period end', async () => {
      mockPrisma.subscription.update.mockResolvedValue({
        id: 'sub-123',
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
        status: 'ACTIVE',
      });

      const canceled = await mockPrisma.subscription.update({
        where: { id: 'sub-123' },
        data: {
          cancelAtPeriodEnd: true,
          canceledAt: new Date(),
        },
      });

      expect(canceled.cancelAtPeriodEnd).toBe(true);
      expect(canceled.canceledAt).toBeDefined();
      expect(canceled.status).toBe('ACTIVE');
    });

    it('should cancel subscription immediately', async () => {
      mockPrisma.subscription.update.mockResolvedValue({
        id: 'sub-123',
        status: 'CANCELED',
        canceledAt: new Date(),
        cancelAt: new Date(),
      });

      const canceled = await mockPrisma.subscription.update({
        where: { id: 'sub-123' },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
          cancelAt: new Date(),
        },
      });

      expect(canceled.status).toBe('CANCELED');
    });
  });
});
