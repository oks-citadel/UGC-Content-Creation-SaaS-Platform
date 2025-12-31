import { PrismaClient, Opportunity, OpportunityStatus, Prisma } from '.prisma/marketplace-service-client';
import { AppError } from '../middleware/error-handler';
import logger from '../utils/logger';
import axios from 'axios';
import config from '../config';

const prisma = new PrismaClient();

interface CreateOpportunityInput {
  campaignId: string;
  brandId: string;
  title: string;
  description: string;
  requirements: any[];
  budget: number;
  currency: string;
  deadline: Date;
  targetNiche: string[];
  minFollowers?: number;
  maxFollowers?: number;
  locations: string[];
  deliverables: any[];
  slots?: number;
}

interface UpdateOpportunityInput {
  title?: string;
  description?: string;
  requirements?: any[];
  budget?: number;
  deadline?: Date;
  status?: OpportunityStatus;
  slots?: number;
}

interface OpportunityFilters {
  status?: OpportunityStatus;
  brandId?: string;
  campaignId?: string;
  minBudget?: number;
  maxBudget?: number;
  deadline?: Date;
  niche?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export class OpportunityService {
  /**
   * Create a new opportunity
   */
  async createOpportunity(input: CreateOpportunityInput): Promise<Opportunity> {
    try {
      // Validate campaign exists
      await this.validateCampaign(input.campaignId);

      const opportunity = await prisma.opportunity.create({
        data: {
          campaignId: input.campaignId,
          brandId: input.brandId,
          title: input.title,
          description: input.description,
          requirements: input.requirements,
          budget: input.budget,
          currency: input.currency || 'USD',
          deadline: input.deadline,
          targetNiche: input.targetNiche,
          minFollowers: input.minFollowers,
          maxFollowers: input.maxFollowers,
          locations: input.locations,
          deliverables: input.deliverables,
          slots: input.slots || 1,
          status: OpportunityStatus.OPEN,
        },
      });

      logger.info(`Opportunity created: ${opportunity.id}`);

      // Notify matching creators (async)
      this.notifyMatchingCreators(opportunity.id).catch((err) => {
        logger.error('Failed to notify matching creators:', err);
      });

      return opportunity;
    } catch (error) {
      logger.error('Error creating opportunity:', error);
      throw error;
    }
  }

  /**
   * Update an opportunity
   */
  async updateOpportunity(id: string, input: UpdateOpportunityInput): Promise<Opportunity> {
    try {
      const opportunity = await prisma.opportunity.update({
        where: { id },
        data: input,
      });

      logger.info(`Opportunity updated: ${id}`);
      return opportunity;
    } catch (error) {
      logger.error('Error updating opportunity:', error);
      throw error;
    }
  }

  /**
   * Get opportunity by ID
   */
  async getOpportunityById(id: string): Promise<Opportunity> {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        bids: {
          where: { status: { in: ['PENDING', 'SHORTLISTED', 'UNDER_REVIEW'] } },
          take: 10,
        },
      },
    });

    if (!opportunity) {
      throw new AppError(404, 'Opportunity not found');
    }

    // Increment view count
    await prisma.opportunity.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return opportunity;
  }

  /**
   * List opportunities with filters
   */
  async listOpportunities(filters: OpportunityFilters): Promise<{
    opportunities: Opportunity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.OpportunityWhereInput = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.brandId) {
      where.brandId = filters.brandId;
    }

    if (filters.campaignId) {
      where.campaignId = filters.campaignId;
    }

    if (filters.minBudget || filters.maxBudget) {
      where.budget = {};
      if (filters.minBudget) {
        where.budget.gte = filters.minBudget;
      }
      if (filters.maxBudget) {
        where.budget.lte = filters.maxBudget;
      }
    }

    if (filters.deadline) {
      where.deadline = { gte: filters.deadline };
    }

    if (filters.niche) {
      where.targetNiche = { has: filters.niche };
    }

    if (filters.location) {
      where.locations = { has: filters.location };
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { bids: true },
          },
        },
      }),
      prisma.opportunity.count({ where }),
    ]);

    return {
      opportunities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get AI-powered opportunity matches for a creator
   */
  async getOpportunityMatches(creatorId: string): Promise<Opportunity[]> {
    try {
      // Fetch creator profile
      const creatorProfile = await this.fetchCreatorProfile(creatorId);

      // Get open opportunities
      const opportunities = await prisma.opportunity.findMany({
        where: {
          status: OpportunityStatus.OPEN,
          deadline: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // If AI matching is enabled, use it
      if (config.ai.matchingEnabled && config.ai.openaiApiKey) {
        return this.aiMatchOpportunities(creatorProfile, opportunities);
      }

      // Otherwise, use simple matching
      return this.simpleMatchOpportunities(creatorProfile, opportunities);
    } catch (error) {
      logger.error('Error getting opportunity matches:', error);
      throw error;
    }
  }

  /**
   * Close an opportunity
   */
  async closeOpportunity(id: string, reason?: string): Promise<Opportunity> {
    try {
      const opportunity = await prisma.opportunity.update({
        where: { id },
        data: {
          status: OpportunityStatus.CLOSED,
          closedAt: new Date(),
        },
      });

      // Reject all pending bids
      await prisma.bid.updateMany({
        where: {
          opportunityId: id,
          status: { in: ['PENDING', 'UNDER_REVIEW', 'SHORTLISTED'] },
        },
        data: {
          status: 'REJECTED',
          rejectionReason: reason || 'Opportunity closed',
        },
      });

      logger.info(`Opportunity closed: ${id}`);
      return opportunity;
    } catch (error) {
      logger.error('Error closing opportunity:', error);
      throw error;
    }
  }

  /**
   * Check if opportunity is filled
   */
  async checkAndUpdateFilledStatus(opportunityId: string): Promise<void> {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        contracts: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!opportunity) return;

    if (opportunity.contracts.length >= opportunity.slots) {
      await prisma.opportunity.update({
        where: { id: opportunityId },
        data: {
          status: OpportunityStatus.FILLED,
          filledSlots: opportunity.contracts.length,
        },
      });
    }
  }

  // Private helper methods

  private async validateCampaign(campaignId: string): Promise<void> {
    try {
      const response = await axios.get(
        `${config.externalServices.campaignServiceUrl}/api/campaigns/${campaignId}`
      );
      if (response.status !== 200) {
        throw new AppError(404, 'Campaign not found');
      }
    } catch (error) {
      logger.error('Error validating campaign:', error);
      throw new AppError(404, 'Campaign not found or unavailable');
    }
  }

  private async fetchCreatorProfile(creatorId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.externalServices.creatorServiceUrl}/api/creators/${creatorId}/profile`
      );
      return response.data;
    } catch (error) {
      logger.error('Error fetching creator profile:', error);
      throw new AppError(404, 'Creator profile not found');
    }
  }

  private async notifyMatchingCreators(opportunityId: string): Promise<void> {
    // Implementation would notify creators via notification service
    logger.info(`Notifying matching creators for opportunity: ${opportunityId}`);
  }

  private simpleMatchOpportunities(creatorProfile: any, opportunities: Opportunity[]): Opportunity[] {
    return opportunities
      .filter((opp) => {
        // Match by niche
        const nicheMatch = opp.targetNiche.some((niche) =>
          creatorProfile.niches?.includes(niche)
        );

        // Match by follower count
        const followerMatch =
          (!opp.minFollowers || creatorProfile.totalFollowers >= opp.minFollowers) &&
          (!opp.maxFollowers || creatorProfile.totalFollowers <= opp.maxFollowers);

        // Match by location
        const locationMatch = opp.locations.includes(creatorProfile.country);

        return nicheMatch && followerMatch && locationMatch;
      })
      .slice(0, 20);
  }

  private async aiMatchOpportunities(
    creatorProfile: any,
    opportunities: Opportunity[]
  ): Promise<Opportunity[]> {
    // This would use OpenAI API to score and rank opportunities
    // For now, fallback to simple matching
    return this.simpleMatchOpportunities(creatorProfile, opportunities);
  }
}

export default new OpportunityService();
