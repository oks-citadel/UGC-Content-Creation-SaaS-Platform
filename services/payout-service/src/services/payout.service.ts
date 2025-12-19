import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/error-handler';

export interface Balance {
  available: number;
  pending: number;
  currency: string;
  lastUpdated: string;
}

export interface Earning {
  id: string;
  creatorId: string;
  contentId: string;
  campaignId: string;
  campaignName: string;
  type: 'content_approval' | 'bonus' | 'royalty' | 'milestone';
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: 'pending' | 'available' | 'paid';
  availableDate: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payoutMethod: 'stripe_connect' | 'paypal' | 'bank_transfer';
  stripeTransferId?: string;
  failureReason?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
}

export interface PayoutHistoryQuery {
  page: number;
  limit: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'all';
}

export interface PayoutHistoryResult {
  payouts: Payout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class PayoutService {
  private stripe: Stripe | null = null;
  private balances: Map<string, Balance> = new Map();
  private earnings: Map<string, Earning[]> = new Map();
  private payouts: Map<string, Payout> = new Map();

  constructor() {
    if (config.stripeSecretKey) {
      this.stripe = new Stripe(config.stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
    }
  }

  async getBalance(creatorId: string): Promise<Balance> {
    let balance = this.balances.get(creatorId);

    if (!balance) {
      // Calculate from earnings
      const creatorEarnings = this.earnings.get(creatorId) || [];
      const available = creatorEarnings
        .filter(e => e.status === 'available')
        .reduce((sum, e) => sum + e.netAmount, 0);
      const pending = creatorEarnings
        .filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + e.netAmount, 0);

      balance = {
        available,
        pending,
        currency: 'USD',
        lastUpdated: new Date().toISOString(),
      };
      this.balances.set(creatorId, balance);
    }

    return balance;
  }

  async getEarnings(
    creatorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{ earnings: Earning[]; summary: { total: number; pending: number; available: number } }> {
    let creatorEarnings = this.earnings.get(creatorId) || [];

    // Filter by date range if provided
    if (startDate) {
      const start = new Date(startDate);
      creatorEarnings = creatorEarnings.filter(e => new Date(e.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      creatorEarnings = creatorEarnings.filter(e => new Date(e.createdAt) <= end);
    }

    const summary = {
      total: creatorEarnings.reduce((sum, e) => sum + e.netAmount, 0),
      pending: creatorEarnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.netAmount, 0),
      available: creatorEarnings.filter(e => e.status === 'available').reduce((sum, e) => sum + e.netAmount, 0),
    };

    return { earnings: creatorEarnings, summary };
  }

  async getPendingPayouts(creatorId: string): Promise<Payout[]> {
    return Array.from(this.payouts.values())
      .filter(p => p.creatorId === creatorId && p.status === 'pending');
  }

  async getPayoutHistory(creatorId: string, query: PayoutHistoryQuery): Promise<PayoutHistoryResult> {
    let creatorPayouts = Array.from(this.payouts.values())
      .filter(p => p.creatorId === creatorId);

    if (query.status !== 'all') {
      creatorPayouts = creatorPayouts.filter(p => p.status === query.status);
    }

    // Sort by requested date descending
    creatorPayouts.sort((a, b) =>
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );

    const total = creatorPayouts.length;
    const totalPages = Math.ceil(total / query.limit);
    const start = (query.page - 1) * query.limit;
    const paginatedPayouts = creatorPayouts.slice(start, start + query.limit);

    return {
      payouts: paginatedPayouts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async requestPayout(creatorId: string, amount: number, currency: string): Promise<Payout> {
    // Validate minimum amount
    if (amount < config.minimumPayoutAmount) {
      throw new AppError(
        `Minimum payout amount is ${config.minimumPayoutAmount} ${currency}`,
        400,
        'BELOW_MINIMUM'
      );
    }

    // Check available balance
    const balance = await this.getBalance(creatorId);
    if (amount > balance.available) {
      throw new AppError('Insufficient available balance', 400, 'INSUFFICIENT_BALANCE');
    }

    // Check for pending payouts
    const pending = await this.getPendingPayouts(creatorId);
    if (pending.length > 0) {
      throw new AppError('You already have a pending payout request', 400, 'PENDING_EXISTS');
    }

    const payout: Payout = {
      id: uuidv4(),
      creatorId,
      amount,
      currency,
      status: 'pending',
      payoutMethod: 'stripe_connect', // Default, should come from account settings
      requestedAt: new Date().toISOString(),
    };

    this.payouts.set(payout.id, payout);

    // Update balance
    balance.available -= amount;
    balance.lastUpdated = new Date().toISOString();
    this.balances.set(creatorId, balance);

    logger.info({ payoutId: payout.id, creatorId, amount }, 'Payout requested');

    return payout;
  }

  async getPayoutDetails(payoutId: string): Promise<Payout> {
    const payout = this.payouts.get(payoutId);

    if (!payout) {
      throw new AppError('Payout not found', 404, 'PAYOUT_NOT_FOUND');
    }

    return payout;
  }

  async cancelPayout(payoutId: string, creatorId: string): Promise<void> {
    const payout = this.payouts.get(payoutId);

    if (!payout) {
      throw new AppError('Payout not found', 404, 'PAYOUT_NOT_FOUND');
    }

    if (payout.creatorId !== creatorId) {
      throw new AppError('Not authorized', 403, 'UNAUTHORIZED');
    }

    if (payout.status !== 'pending') {
      throw new AppError('Can only cancel pending payouts', 400, 'INVALID_STATUS');
    }

    payout.status = 'cancelled';
    this.payouts.set(payoutId, payout);

    // Restore balance
    const balance = await this.getBalance(creatorId);
    balance.available += payout.amount;
    balance.lastUpdated = new Date().toISOString();
    this.balances.set(creatorId, balance);

    logger.info({ payoutId }, 'Payout cancelled');
  }

  async processPayouts(): Promise<void> {
    // This would be called by a scheduled job
    const pendingPayouts = Array.from(this.payouts.values())
      .filter(p => p.status === 'pending');

    for (const payout of pendingPayouts) {
      try {
        payout.status = 'processing';
        payout.processedAt = new Date().toISOString();
        this.payouts.set(payout.id, payout);

        if (this.stripe && payout.payoutMethod === 'stripe_connect') {
          // In production, this would create a Stripe transfer
          // const transfer = await this.stripe.transfers.create({...});
          // payout.stripeTransferId = transfer.id;
        }

        payout.status = 'completed';
        payout.completedAt = new Date().toISOString();
        this.payouts.set(payout.id, payout);

        logger.info({ payoutId: payout.id }, 'Payout processed');
      } catch (error) {
        payout.status = 'failed';
        payout.failureReason = error instanceof Error ? error.message : 'Unknown error';
        this.payouts.set(payout.id, payout);

        logger.error({ error, payoutId: payout.id }, 'Payout failed');
      }
    }
  }

  // Called when content is approved
  async recordEarning(params: {
    creatorId: string;
    contentId: string;
    campaignId: string;
    campaignName: string;
    type: Earning['type'];
    grossAmount: number;
    platformFeePercent: number;
    currency: string;
  }): Promise<Earning> {
    const platformFee = Math.round(params.grossAmount * (params.platformFeePercent / 100) * 100) / 100;
    const netAmount = params.grossAmount - platformFee;

    const earning: Earning = {
      id: uuidv4(),
      creatorId: params.creatorId,
      contentId: params.contentId,
      campaignId: params.campaignId,
      campaignName: params.campaignName,
      type: params.type,
      grossAmount: params.grossAmount,
      platformFee,
      netAmount,
      currency: params.currency,
      status: 'pending',
      availableDate: new Date(Date.now() + config.payoutProcessingDays * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    const creatorEarnings = this.earnings.get(params.creatorId) || [];
    creatorEarnings.push(earning);
    this.earnings.set(params.creatorId, creatorEarnings);

    // Update pending balance
    const balance = await this.getBalance(params.creatorId);
    balance.pending += netAmount;
    balance.lastUpdated = new Date().toISOString();
    this.balances.set(params.creatorId, balance);

    logger.info({ earningId: earning.id, creatorId: params.creatorId }, 'Earning recorded');

    return earning;
  }
}
