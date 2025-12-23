import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('uuid', () => ({ v4: vi.fn(() => 'mock-uuid-1234') }));

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    transfers: {
      create: vi.fn().mockResolvedValue({ id: 'tr_mock123' }),
    },
  })),
}));

vi.mock('../../../../services/payout-service/src/config', () => ({
  config: {
    stripeSecretKey: 'sk_test_mock',
    minimumPayoutAmount: 50,
    payoutProcessingDays: 7,
  },
}));

vi.mock('../../../../services/payout-service/src/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../../../services/payout-service/src/middleware/error-handler', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, public statusCode: number, public code: string) {
      super(message);
      this.name = 'AppError';
    }
  },
}));

import { PayoutService } from '../../../../services/payout-service/src/services/payout.service';

describe('PayoutService', () => {
  let payoutService: PayoutService;

  beforeEach(() => {
    payoutService = new PayoutService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Balance Calculations', () => {
    it('should return zero balance for new creator', async () => {
      const balance = await payoutService.getBalance('new-creator-123');

      expect(balance.available).toBe(0);
      expect(balance.pending).toBe(0);
      expect(balance.currency).toBe('USD');
    });

    it('should calculate balance from earnings', async () => {
      await payoutService.recordEarning({
        creatorId: 'creator-balance-test',
        contentId: 'content-123',
        campaignId: 'campaign-456',
        campaignName: 'Test Campaign',
        type: 'content_approval',
        grossAmount: 1000,
        platformFeePercent: 15,
        currency: 'USD',
      });

      const balance = await payoutService.getBalance('creator-balance-test');

      expect(balance.pending).toBe(850);
      expect(balance.available).toBe(0);
    });

    it('should track multiple earnings', async () => {
      await payoutService.recordEarning({
        creatorId: 'multi-earnings-creator',
        contentId: 'content-1',
        campaignId: 'campaign-1',
        campaignName: 'Campaign 1',
        type: 'content_approval',
        grossAmount: 500,
        platformFeePercent: 15,
        currency: 'USD',
      });

      await payoutService.recordEarning({
        creatorId: 'multi-earnings-creator',
        contentId: 'content-2',
        campaignId: 'campaign-2',
        campaignName: 'Campaign 2',
        type: 'bonus',
        grossAmount: 200,
        platformFeePercent: 15,
        currency: 'USD',
      });

      const { earnings, summary } = await payoutService.getEarnings('multi-earnings-creator');

      expect(earnings).toHaveLength(2);
      expect(summary.pending).toBe(595);
    });
  });

  describe('Payout Request Validation', () => {
    it('should reject payout below minimum amount', async () => {
      await payoutService.recordEarning({
        creatorId: 'low-balance-creator',
        contentId: 'content-123',
        campaignId: 'campaign-456',
        campaignName: 'Test Campaign',
        type: 'content_approval',
        grossAmount: 100,
        platformFeePercent: 15,
        currency: 'USD',
      });

      const balance = await payoutService.getBalance('low-balance-creator');
      balance.available = 30;

      await expect(
        payoutService.requestPayout('low-balance-creator', 30, 'USD')
      ).rejects.toThrow('BELOW_MINIMUM');
    });

    it('should reject payout exceeding available balance', async () => {
      await payoutService.recordEarning({
        creatorId: 'insufficient-creator',
        contentId: 'content-123',
        campaignId: 'campaign-456',
        campaignName: 'Test Campaign',
        type: 'content_approval',
        grossAmount: 100,
        platformFeePercent: 15,
        currency: 'USD',
      });

      await expect(
        payoutService.requestPayout('insufficient-creator', 500, 'USD')
      ).rejects.toThrow('INSUFFICIENT_BALANCE');
    });

    it('should reject duplicate pending payout request', async () => {
      await payoutService.recordEarning({
        creatorId: 'pending-creator',
        contentId: 'content-123',
        campaignId: 'campaign-456',
        campaignName: 'Test Campaign',
        type: 'content_approval',
        grossAmount: 1000,
        platformFeePercent: 15,
        currency: 'USD',
      });

      const balance = await payoutService.getBalance('pending-creator');
      balance.available = 850;

      await payoutService.requestPayout('pending-creator', 100, 'USD');

      await expect(
        payoutService.requestPayout('pending-creator', 100, 'USD')
      ).rejects.toThrow('PENDING_EXISTS');
    });

    it('should create valid payout request', async () => {
      await payoutService.recordEarning({
        creatorId: 'valid-payout-creator',
        contentId: 'content-123',
        campaignId: 'campaign-456',
        campaignName: 'Test Campaign',
        type: 'content_approval',
        grossAmount: 1000,
        platformFeePercent: 15,
        currency: 'USD',
      });

      const balance = await payoutService.getBalance('valid-payout-creator');
      balance.available = 850;

      const payout = await payoutService.requestPayout('valid-payout-creator', 100, 'USD');

      expect(payout).toHaveProperty('id');
      expect(payout.amount).toBe(100);
      expect(payout.status).toBe('pending');
      expect(payout.payoutMethod).toBe('stripe_connect');
    });
  });

  describe('Fee Calculations by Tier', () => {
    it('should calculate platform fee correctly', async () => {
      const earning = await payoutService.recordEarning({
        creatorId: 'fee-test-creator',
        contentId: 'content-123',
        campaignId: 'campaign-456',
        campaignName: 'Test Campaign',
        type: 'content_approval',
        grossAmount: 1000,
        platformFeePercent: 15,
        currency: 'USD',
      });

      expect(earning.grossAmount).toBe(1000);
      expect(earning.platformFee).toBe(150);
      expect(earning.netAmount).toBe(850);
    });

    it('should handle different fee percentages', async () => {
      const earning1 = await payoutService.recordEarning({
        creatorId: 'fee-tier-creator',
        contentId: 'content-1',
        campaignId: 'campaign-1',
        campaignName: 'Campaign 1',
        type: 'content_approval',
        grossAmount: 500,
        platformFeePercent: 10,
        currency: 'USD',
      });

      const earning2 = await payoutService.recordEarning({
        creatorId: 'fee-tier-creator',
        contentId: 'content-2',
        campaignId: 'campaign-2',
        campaignName: 'Campaign 2',
        type: 'bonus',
        grossAmount: 500,
        platformFeePercent: 20,
        currency: 'USD',
      });

      expect(earning1.platformFee).toBe(50);
      expect(earning1.netAmount).toBe(450);
      expect(earning2.platformFee).toBe(100);
      expect(earning2.netAmount).toBe(400);
    });

    it('should round fee calculations correctly', async () => {
      const earning = await payoutService.recordEarning({
        creatorId: 'rounding-creator',
        contentId: 'content-123',
        campaignId: 'campaign-456',
        campaignName: 'Test Campaign',
        type: 'content_approval',
        grossAmount: 333,
        platformFeePercent: 15,
        currency: 'USD',
      });

      expect(earning.platformFee).toBe(49.95);
      expect(earning.netAmount).toBe(283.05);
    });
  });

  describe('Tax Document Validation', () => {
    it('should track earning types correctly', async () => {
      const contentEarning = await payoutService.recordEarning({
        creatorId: 'tax-creator',
        contentId: 'content-1',
        campaignId: 'campaign-1',
        campaignName: 'Campaign 1',
        type: 'content_approval',
        grossAmount: 500,
        platformFeePercent: 15,
        currency: 'USD',
      });

      const bonusEarning = await payoutService.recordEarning({
        creatorId: 'tax-creator',
        contentId: 'content-2',
        campaignId: 'campaign-2',
        campaignName: 'Campaign 2',
        type: 'bonus',
        grossAmount: 100,
        platformFeePercent: 15,
        currency: 'USD',
      });

      const royaltyEarning = await payoutService.recordEarning({
        creatorId: 'tax-creator',
        contentId: 'content-3',
        campaignId: 'campaign-3',
        campaignName: 'Campaign 3',
        type: 'royalty',
        grossAmount: 50,
        platformFeePercent: 15,
        currency: 'USD',
      });

      expect(contentEarning.type).toBe('content_approval');
      expect(bonusEarning.type).toBe('bonus');
      expect(royaltyEarning.type).toBe('royalty');
    });

    it('should filter earnings by date range', async () => {
      await payoutService.recordEarning({
        creatorId: 'date-filter-creator',
        contentId: 'content-1',
        campaignId: 'campaign-1',
        campaignName: 'Campaign 1',
        type: 'content_approval',
        grossAmount: 500,
        platformFeePercent: 15,
        currency: 'USD',
      });

      const now = new Date();
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = now.toISOString();

      const { earnings } = await payoutService.getEarnings('date-filter-creator', startDate, endDate);

      expect(earnings).toHaveLength(1);
    });
  });

  describe('Payout Operations', () => {
    it('should cancel pending payout', async () => {
      await payoutService.recordEarning({
        creatorId: 'cancel-creator',
        contentId: 'content-123',
        campaignId: 'campaign-456',
        campaignName: 'Test Campaign',
        type: 'content_approval',
        grossAmount: 1000,
        platformFeePercent: 15,
        currency: 'USD',
      });

      const balance = await payoutService.getBalance('cancel-creator');
      balance.available = 850;

      const payout = await payoutService.requestPayout('cancel-creator', 100, 'USD');
      await payoutService.cancelPayout(payout.id, 'cancel-creator');

      const details = await payoutService.getPayoutDetails(payout.id);
      expect(details.status).toBe('cancelled');
    });

    it('should throw error when cancelling non-existent payout', async () => {
      await expect(
        payoutService.cancelPayout('non-existent-payout', 'creator-123')
      ).rejects.toThrow('PAYOUT_NOT_FOUND');
    });

    it('should get payout history with pagination', async () => {
      await payoutService.recordEarning({
        creatorId: 'history-creator',
        contentId: 'content-123',
        campaignId: 'campaign-456',
        campaignName: 'Test Campaign',
        type: 'content_approval',
        grossAmount: 2000,
        platformFeePercent: 15,
        currency: 'USD',
      });

      const balance = await payoutService.getBalance('history-creator');
      balance.available = 1700;

      await payoutService.requestPayout('history-creator', 100, 'USD');
      balance.available = 1700;

      const history = await payoutService.getPayoutHistory('history-creator', {
        page: 1,
        limit: 10,
        status: 'all',
      });

      expect(history.payouts).toHaveLength(1);
      expect(history.pagination.page).toBe(1);
    });
  });
});
