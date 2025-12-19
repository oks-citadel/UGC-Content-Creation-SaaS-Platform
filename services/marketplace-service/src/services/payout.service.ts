import { PrismaClient, Payout, PayoutStatus, PayoutMethod } from '@prisma/client';
import { AppError } from '../middleware/error-handler';
import logger from '../utils/logger';
import currency from 'currency.js';
import config from '../config';
import stripeConnect from '../integrations/stripe-connect';

const prisma = new PrismaClient();

interface RequestPayoutInput {
  creatorId: string;
  amount: number;
  currency: string;
  contractId?: string;
  method: PayoutMethod;
  description?: string;
  metadata?: any;
}

interface AddPayoutMethodInput {
  creatorId: string;
  type: PayoutMethod;
  details: any;
  isDefault?: boolean;
}

export class PayoutService {
  /**
   * Request a payout
   */
  async requestPayout(input: RequestPayoutInput): Promise<Payout> {
    try {
      // Validate minimum payout amount
      if (input.amount < config.payout.minAmount) {
        throw new AppError(
          400,
          `Minimum payout amount is ${config.payout.minAmount} ${input.currency}`
        );
      }

      // Calculate fees
      const platformFee = this.calculatePlatformFee(input.amount);
      const processingFee = this.calculateProcessingFee(input.amount);
      const netAmount = currency(input.amount).subtract(platformFee).subtract(processingFee).value;

      // Validate payout method exists
      const payoutMethod = await prisma.payoutMethodConfig.findFirst({
        where: {
          creatorId: input.creatorId,
          type: input.method,
        },
      });

      if (!payoutMethod) {
        throw new AppError(400, 'Payout method not configured');
      }

      if (!payoutMethod.isVerified) {
        throw new AppError(400, 'Payout method is not verified');
      }

      // Create payout request
      const payout = await prisma.payout.create({
        data: {
          contractId: input.contractId,
          creatorId: input.creatorId,
          amount: input.amount,
          currency: input.currency,
          platformFee,
          processingFee,
          netAmount,
          status: PayoutStatus.PENDING,
          method: input.method,
          description: input.description,
          metadata: input.metadata,
        },
      });

      logger.info(`Payout requested: ${payout.id} for creator ${input.creatorId}`);

      // Process payout asynchronously
      this.processPayout(payout.id).catch((err) => {
        logger.error(`Failed to process payout ${payout.id}:`, err);
      });

      return payout;
    } catch (error) {
      logger.error('Error requesting payout:', error);
      throw error;
    }
  }

  /**
   * Process a payout
   */
  async processPayout(payoutId: string): Promise<Payout> {
    try {
      const payout = await prisma.payout.findUnique({
        where: { id: payoutId },
      });

      if (!payout) {
        throw new AppError(404, 'Payout not found');
      }

      if (payout.status !== PayoutStatus.PENDING) {
        throw new AppError(400, 'Payout is not in pending status');
      }

      // Update status to processing
      await prisma.payout.update({
        where: { id: payoutId },
        data: { status: PayoutStatus.PROCESSING },
      });

      // Get payout method configuration
      const payoutMethod = await prisma.payoutMethodConfig.findFirst({
        where: {
          creatorId: payout.creatorId,
          type: payout.method!,
        },
      });

      if (!payoutMethod) {
        throw new AppError(400, 'Payout method not found');
      }

      let transactionId: string;
      let provider: string;

      // Process based on method
      switch (payout.method) {
        case PayoutMethod.STRIPE_CONNECT:
          const stripeResult = await this.processStripeConnectPayout(payout, payoutMethod);
          transactionId = stripeResult.transactionId;
          provider = 'stripe';
          break;

        case PayoutMethod.PAYSTACK:
          const paystackResult = await this.processPaystackPayout(payout, payoutMethod);
          transactionId = paystackResult.transactionId;
          provider = 'paystack';
          break;

        case PayoutMethod.FLUTTERWAVE:
          const flutterwaveResult = await this.processFlutterwavePayout(payout, payoutMethod);
          transactionId = flutterwaveResult.transactionId;
          provider = 'flutterwave';
          break;

        default:
          throw new AppError(400, 'Unsupported payout method');
      }

      // Update payout as completed
      const completedPayout = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.COMPLETED,
          transactionId,
          provider,
          processedAt: new Date(),
        },
      });

      logger.info(`Payout processed successfully: ${payoutId}`);
      return completedPayout;
    } catch (error) {
      logger.error(`Error processing payout ${payoutId}:`, error);

      // Mark payout as failed
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          failedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Get payout history for a creator
   */
  async getPayoutHistory(
    creatorId: string,
    filters?: {
      status?: PayoutStatus;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    payouts: Payout[];
    total: number;
    totalAmount: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { creatorId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.requestedAt = {};
      if (filters.startDate) {
        where.requestedAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.requestedAt.lte = filters.endDate;
      }
    }

    const [payouts, total, totalAmountResult] = await Promise.all([
      prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          contract: {
            select: {
              contractNumber: true,
            },
          },
        },
      }),
      prisma.payout.count({ where }),
      prisma.payout.aggregate({
        where: {
          ...where,
          status: PayoutStatus.COMPLETED,
        },
        _sum: {
          netAmount: true,
        },
      }),
    ]);

    return {
      payouts,
      total,
      totalAmount: totalAmountResult._sum.netAmount?.toNumber() || 0,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Add a payout method for a creator
   */
  async addPayoutMethod(input: AddPayoutMethodInput): Promise<any> {
    try {
      // If this is set as default, unset other defaults
      if (input.isDefault) {
        await prisma.payoutMethodConfig.updateMany({
          where: {
            creatorId: input.creatorId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      // Create payout method
      const payoutMethod = await prisma.payoutMethodConfig.create({
        data: {
          creatorId: input.creatorId,
          type: input.type,
          details: input.details,
          isDefault: input.isDefault || false,
          isVerified: false, // Will be verified separately
        },
      });

      logger.info(`Payout method added for creator ${input.creatorId}: ${input.type}`);

      // Initiate verification based on type
      if (input.type === PayoutMethod.STRIPE_CONNECT) {
        await this.initiateStripeConnectOnboarding(payoutMethod.id, input.creatorId);
      }

      return payoutMethod;
    } catch (error) {
      logger.error('Error adding payout method:', error);
      throw error;
    }
  }

  /**
   * Get payout methods for a creator
   */
  async getPayoutMethods(creatorId: string): Promise<any[]> {
    return await prisma.payoutMethodConfig.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Verify payout method
   */
  async verifyPayoutMethod(methodId: string): Promise<any> {
    return await prisma.payoutMethodConfig.update({
      where: { id: methodId },
      data: { isVerified: true },
    });
  }

  /**
   * Cancel a pending payout
   */
  async cancelPayout(payoutId: string, creatorId: string): Promise<Payout> {
    try {
      const payout = await prisma.payout.findUnique({
        where: { id: payoutId },
      });

      if (!payout) {
        throw new AppError(404, 'Payout not found');
      }

      if (payout.creatorId !== creatorId) {
        throw new AppError(403, 'Access denied');
      }

      if (payout.status !== PayoutStatus.PENDING) {
        throw new AppError(400, 'Can only cancel pending payouts');
      }

      const cancelledPayout = await prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.CANCELLED,
        },
      });

      logger.info(`Payout cancelled: ${payoutId}`);
      return cancelledPayout;
    } catch (error) {
      logger.error('Error cancelling payout:', error);
      throw error;
    }
  }

  // Private helper methods

  private calculatePlatformFee(amount: number): number {
    // Platform takes a percentage fee
    return currency(amount).multiply(config.payout.processingFeePercent / 100).value;
  }

  private calculateProcessingFee(amount: number): number {
    // Fixed processing fee
    return config.payout.processingFeeFixed;
  }

  private async processStripeConnectPayout(payout: Payout, payoutMethod: any): Promise<any> {
    try {
      const result = await stripeConnect.createPayout({
        accountId: payoutMethod.stripeAccountId,
        amount: Math.round(payout.netAmount.toNumber() * 100), // Convert to cents
        currency: payout.currency.toLowerCase(),
        metadata: {
          payoutId: payout.id,
          creatorId: payout.creatorId,
        },
      });

      return {
        transactionId: result.id,
      };
    } catch (error) {
      logger.error('Stripe Connect payout error:', error);
      throw new AppError(500, 'Failed to process Stripe payout');
    }
  }

  private async processPaystackPayout(payout: Payout, payoutMethod: any): Promise<any> {
    // Paystack implementation
    // This would integrate with Paystack's Transfer API
    logger.info('Processing Paystack payout:', payout.id);

    // Mock implementation
    return {
      transactionId: `paystack_${Date.now()}`,
    };
  }

  private async processFlutterwavePayout(payout: Payout, payoutMethod: any): Promise<any> {
    // Flutterwave implementation
    // This would integrate with Flutterwave's Transfer API
    logger.info('Processing Flutterwave payout:', payout.id);

    // Mock implementation
    return {
      transactionId: `flutterwave_${Date.now()}`,
    };
  }

  private async initiateStripeConnectOnboarding(methodId: string, creatorId: string): Promise<void> {
    try {
      const accountLink = await stripeConnect.createAccountLink(creatorId);
      logger.info(`Stripe Connect onboarding initiated for creator ${creatorId}`);
      // Store account link or send to creator
    } catch (error) {
      logger.error('Error initiating Stripe Connect onboarding:', error);
    }
  }
}

export default new PayoutService();
