import prisma from '../lib/prisma';
import { Prisma, Creator, CreatorStatus } from '@prisma/client';
import { NotFoundError, ValidationError, ConflictError } from '../middleware/error-handler';
import logger from '../lib/logger';

export interface CreateCreatorInput {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  country?: string;
  timezone?: string;
  primaryNiche?: string;
  secondaryNiches?: string[];
  instagramHandle?: string;
  tiktokHandle?: string;
  youtubeHandle?: string;
  twitterHandle?: string;
  languages?: string[];
  contentTypes?: string[];
}

export interface UpdateCreatorInput {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  location?: string;
  country?: string;
  timezone?: string;
  primaryNiche?: string;
  secondaryNiches?: string[];
  instagramHandle?: string;
  tiktokHandle?: string;
  youtubeHandle?: string;
  twitterHandle?: string;
  facebookHandle?: string;
  linkedinHandle?: string;
  twitchHandle?: string;
  yearsOfExperience?: number;
  languages?: string[];
  contentTypes?: string[];
  preferredBrands?: string[];
  unwillingToWorkWith?: string[];
  minCampaignBudget?: number;
}

export interface ListCreatorsFilters {
  status?: CreatorStatus;
  verificationStatus?: VerificationStatus;
  primaryNiche?: string;
  country?: string;
  minReputationScore?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PortfolioItemInput {
  title: string;
  description?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'LINK';
  mediaUrl: string;
  thumbnailUrl?: string;
  platform?: string;
  externalUrl?: string;
  tags?: string[];
  niche?: string;
  isFeatured?: boolean;
}

class CreatorService {
  async createCreator(data: CreateCreatorInput): Promise<Creator> {
    try {
      // Check if creator already exists for this user
      const existingCreator = await prisma.creator.findUnique({
        where: { userId: data.userId },
      });

      if (existingCreator) {
        throw new ConflictError('Creator profile already exists for this user');
      }

      // Check if email is already in use
      const emailExists = await prisma.creator.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new ConflictError('Email already in use');
      }

      // Create creator with related records
      const creator = await prisma.creator.create({
        data: {
          ...data,
          metrics: {
            create: {
              totalFollowers: 0,
              avgEngagementRate: 0,
              completedCampaigns: 0,
              successRate: 0,
              responseRate: 0,
            },
          },
          earnings: {
            create: {
              totalEarned: 0,
              availableBalance: 0,
              pendingBalance: 0,
              withdrawnBalance: 0,
              lifetimeEarnings: 0,
              totalPayouts: 0,
            },
          },
          verification: {
            create: {
              identityStatus: VerificationStatus.UNVERIFIED,
            },
          },
        },
        include: {
          metrics: true,
          earnings: true,
          verification: true,
        },
      });

      logger.info({ creatorId: creator.id }, 'Creator profile created');

      return creator;
    } catch (error: any) {
      logger.error({ error, data }, 'Failed to create creator');
      throw error;
    }
  }

  async updateCreator(id: string, data: UpdateCreatorInput): Promise<Creator> {
    try {
      const creator = await prisma.creator.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          metrics: true,
          earnings: true,
          verification: true,
        },
      });

      logger.info({ creatorId: id }, 'Creator profile updated');

      return creator;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError('Creator not found');
      }
      logger.error({ error, creatorId: id }, 'Failed to update creator');
      throw error;
    }
  }

  async getCreator(id: string, includeAll: boolean = false) {
    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        metrics: true,
        earnings: true,
        verification: true,
        ...(includeAll && {
          portfolio: {
            orderBy: [{ isFeatured: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
          },
          reviews: {
            where: { isVerified: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        }),
      },
    });

    if (!creator) {
      throw new NotFoundError('Creator not found');
    }

    return creator;
  }

  async getCreatorByUserId(userId: string) {
    const creator = await prisma.creator.findUnique({
      where: { userId },
      include: {
        metrics: true,
        earnings: true,
        verification: true,
      },
    });

    if (!creator) {
      throw new NotFoundError('Creator not found');
    }

    return creator;
  }

  async listCreators(filters: ListCreatorsFilters) {
    const {
      status,
      verificationStatus,
      primaryNiche,
      country,
      minReputationScore,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.CreatorWhereInput = {
      ...(status && { status }),
      ...(verificationStatus && { verificationStatus }),
      ...(primaryNiche && { primaryNiche }),
      ...(country && { country }),
      ...(minReputationScore && { reputationScore: { gte: minReputationScore } }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        include: {
          metrics: true,
        },
        orderBy: [
          { reputationScore: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      prisma.creator.count({ where }),
    ]);

    return {
      data: creators,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateLastActive(id: string): Promise<void> {
    await prisma.creator.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  async deleteCreator(id: string): Promise<void> {
    try {
      await prisma.creator.delete({
        where: { id },
      });

      logger.info({ creatorId: id }, 'Creator deleted');
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError('Creator not found');
      }
      throw error;
    }
  }

  async updateStatus(id: string, status: CreatorStatus): Promise<Creator> {
    const creator = await prisma.creator.update({
      where: { id },
      data: { status },
    });

    logger.info({ creatorId: id, status }, 'Creator status updated');

    return creator;
  }

  // Portfolio Management
  async getPortfolio(creatorId: string) {
    const portfolio = await prisma.creatorPortfolio.findMany({
      where: { creatorId },
      orderBy: [
        { isFeatured: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return portfolio;
  }

  async addPortfolioItem(creatorId: string, data: PortfolioItemInput) {
    // Verify creator exists
    await this.getCreator(creatorId);

    const portfolioItem = await prisma.creatorPortfolio.create({
      data: {
        ...data,
        creatorId,
      },
    });

    logger.info({ creatorId, portfolioItemId: portfolioItem.id }, 'Portfolio item added');

    return portfolioItem;
  }

  async updatePortfolioItem(id: string, data: Partial<PortfolioItemInput>) {
    try {
      const portfolioItem = await prisma.creatorPortfolio.update({
        where: { id },
        data,
      });

      return portfolioItem;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError('Portfolio item not found');
      }
      throw error;
    }
  }

  async deletePortfolioItem(id: string): Promise<void> {
    try {
      await prisma.creatorPortfolio.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundError('Portfolio item not found');
      }
      throw error;
    }
  }

  // Metrics
  async getMetrics(creatorId: string) {
    const metrics = await prisma.creatorMetrics.findUnique({
      where: { creatorId },
    });

    if (!metrics) {
      throw new NotFoundError('Metrics not found');
    }

    return metrics;
  }

  async updateMetrics(creatorId: string, data: Partial<Prisma.CreatorMetricsUpdateInput>) {
    const metrics = await prisma.creatorMetrics.update({
      where: { creatorId },
      data: {
        ...data,
        lastSyncedAt: new Date(),
      },
    });

    logger.info({ creatorId }, 'Metrics updated');

    return metrics;
  }

  // Earnings
  async getEarnings(creatorId: string) {
    const earnings = await prisma.creatorEarnings.findUnique({
      where: { creatorId },
    });

    if (!earnings) {
      throw new NotFoundError('Earnings not found');
    }

    return earnings;
  }

  async requestPayout(creatorId: string, amount: number) {
    const earnings = await this.getEarnings(creatorId);

    if (amount > Number(earnings.availableBalance)) {
      throw new ValidationError('Insufficient balance');
    }

    if (amount < Number(earnings.minPayoutAmount)) {
      throw new ValidationError(`Minimum payout amount is ${earnings.minPayoutAmount}`);
    }

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        creatorId,
        amount,
        currency: 'USD',
        status: 'PENDING',
        method: earnings.payoutMethod || 'stripe',
        processingFee: 2.5,
        netAmount: amount - 2.5,
      },
    });

    // Update balances
    await prisma.creatorEarnings.update({
      where: { creatorId },
      data: {
        availableBalance: { decrement: amount },
        pendingBalance: { increment: amount },
      },
    });

    logger.info({ creatorId, payoutId: payout.id, amount }, 'Payout requested');

    return payout;
  }

  async getPayouts(creatorId: string) {
    const payouts = await prisma.payout.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
    });

    return payouts;
  }

  // Verification
  async verifyCreator(id: string, verifiedBy: string): Promise<Creator> {
    const creator = await prisma.creator.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.VERIFIED,
        verification: {
          update: {
            identityStatus: VerificationStatus.VERIFIED,
            idVerifiedAt: new Date(),
            verifiedBy,
          },
        },
      },
      include: {
        verification: true,
      },
    });

    logger.info({ creatorId: id, verifiedBy }, 'Creator verified');

    return creator;
  }

  async getVerificationStatus(creatorId: string) {
    const verification = await prisma.creatorVerification.findUnique({
      where: { creatorId },
    });

    if (!verification) {
      throw new NotFoundError('Verification record not found');
    }

    return verification;
  }

  async updateVerification(creatorId: string, data: Partial<Prisma.CreatorVerificationUpdateInput>) {
    const verification = await prisma.creatorVerification.update({
      where: { creatorId },
      data,
    });

    return verification;
  }

  // Reputation
  async calculateReputationScore(creatorId: string): Promise<number> {
    const [creator, reviews, metrics] = await Promise.all([
      this.getCreator(creatorId),
      prisma.creatorReview.findMany({
        where: { creatorId, isVerified: true },
      }),
      this.getMetrics(creatorId),
    ]);

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum: number, review: { rating: number | string }) => sum + Number(review.rating), 0) / reviews.length
      : 0;

    // Calculate completion rate score (0-1)
    const completionScore = metrics.completedCampaigns > 0
      ? Number(metrics.successRate) / 100
      : 0;

    // Calculate response rate score (0-1)
    const responseScore = Number(metrics.responseRate) / 100;

    // Calculate verification bonus (0-1)
    const verificationBonus = creator.verificationStatus === 'VERIFIED' ? 0.5 : 0;

    // Weighted score (out of 5)
    const reputationScore = (
      (avgRating * 0.4) +
      (completionScore * 5 * 0.3) +
      (responseScore * 5 * 0.2) +
      (verificationBonus * 0.1 * 5)
    );

    // Update creator's reputation score
    await prisma.creator.update({
      where: { id: creatorId },
      data: {
        reputationScore: Math.round(reputationScore * 100) / 100,
        totalReviews: reviews.length,
      },
    });

    return reputationScore;
  }

  // Reviews
  async getReviews(creatorId: string) {
    const reviews = await prisma.creatorReview.findMany({
      where: { creatorId, isVerified: true },
      orderBy: { createdAt: 'desc' },
    });

    return reviews;
  }

  async respondToReview(reviewId: string, response: string) {
    const review = await prisma.creatorReview.update({
      where: { id: reviewId },
      data: {
        response,
        respondedAt: new Date(),
      },
    });

    return review;
  }
}

export default new CreatorService();
