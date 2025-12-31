import { PrismaClient, Bid, BidStatus } from '.prisma/marketplace-service-client';
import { AppError } from '../middleware/error-handler';
import logger from '../utils/logger';
import axios from 'axios';
import config from '../config';

const prisma = new PrismaClient();

interface SubmitBidInput {
  opportunityId: string;
  creatorId: string;
  proposedRate: number;
  currency: string;
  pitch: string;
  portfolioItems: any[];
  estimatedDays?: number;
  additionalNotes?: string;
}

interface UpdateBidInput {
  proposedRate?: number;
  pitch?: string;
  portfolioItems?: any[];
  estimatedDays?: number;
  additionalNotes?: string;
}

interface NegotiateBidInput {
  counterOffer: number;
  counterOfferedBy: string;
}

export class BiddingService {
  /**
   * Submit a bid for an opportunity
   */
  async submitBid(input: SubmitBidInput): Promise<Bid> {
    try {
      // Validate opportunity is open
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: input.opportunityId },
      });

      if (!opportunity) {
        throw new AppError(404, 'Opportunity not found');
      }

      if (opportunity.status !== 'OPEN') {
        throw new AppError(400, 'This opportunity is no longer accepting bids');
      }

      if (new Date(opportunity.deadline) < new Date()) {
        throw new AppError(400, 'Opportunity deadline has passed');
      }

      // Check if creator already submitted a bid
      const existingBid = await prisma.bid.findUnique({
        where: {
          opportunityId_creatorId: {
            opportunityId: input.opportunityId,
            creatorId: input.creatorId,
          },
        },
      });

      if (existingBid && existingBid.status !== 'WITHDRAWN') {
        throw new AppError(400, 'You have already submitted a bid for this opportunity');
      }

      // Create bid
      const bid = await prisma.bid.create({
        data: {
          opportunityId: input.opportunityId,
          creatorId: input.creatorId,
          proposedRate: input.proposedRate,
          currency: input.currency || 'USD',
          pitch: input.pitch,
          portfolioItems: input.portfolioItems,
          estimatedDays: input.estimatedDays,
          additionalNotes: input.additionalNotes,
          status: BidStatus.PENDING,
        },
      });

      // Update opportunity bid count
      await prisma.opportunity.update({
        where: { id: input.opportunityId },
        data: { bidCount: { increment: 1 } },
      });

      logger.info(`Bid submitted: ${bid.id} by creator ${input.creatorId}`);

      // Notify brand (async)
      this.notifyBrandOfNewBid(opportunity.brandId, bid.id).catch((err) => {
        logger.error('Failed to notify brand of new bid:', err);
      });

      return bid;
    } catch (error) {
      logger.error('Error submitting bid:', error);
      throw error;
    }
  }

  /**
   * Update a bid
   */
  async updateBid(bidId: string, creatorId: string, input: UpdateBidInput): Promise<Bid> {
    try {
      const existingBid = await prisma.bid.findUnique({
        where: { id: bidId },
      });

      if (!existingBid) {
        throw new AppError(404, 'Bid not found');
      }

      if (existingBid.creatorId !== creatorId) {
        throw new AppError(403, 'You can only update your own bids');
      }

      if (!['PENDING', 'COUNTERED'].includes(existingBid.status)) {
        throw new AppError(400, 'Cannot update bid in current status');
      }

      const bid = await prisma.bid.update({
        where: { id: bidId },
        data: {
          ...input,
          updatedAt: new Date(),
        },
      });

      logger.info(`Bid updated: ${bidId}`);
      return bid;
    } catch (error) {
      logger.error('Error updating bid:', error);
      throw error;
    }
  }

  /**
   * Withdraw a bid
   */
  async withdrawBid(bidId: string, creatorId: string): Promise<Bid> {
    try {
      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
      });

      if (!bid) {
        throw new AppError(404, 'Bid not found');
      }

      if (bid.creatorId !== creatorId) {
        throw new AppError(403, 'You can only withdraw your own bids');
      }

      if (bid.status === 'ACCEPTED') {
        throw new AppError(400, 'Cannot withdraw an accepted bid');
      }

      const updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: {
          status: BidStatus.WITHDRAWN,
          updatedAt: new Date(),
        },
      });

      // Decrement opportunity bid count
      await prisma.opportunity.update({
        where: { id: bid.opportunityId },
        data: { bidCount: { decrement: 1 } },
      });

      logger.info(`Bid withdrawn: ${bidId}`);
      return updatedBid;
    } catch (error) {
      logger.error('Error withdrawing bid:', error);
      throw error;
    }
  }

  /**
   * Get bids for an opportunity
   */
  async getBidsForOpportunity(
    opportunityId: string,
    brandId: string,
    filters?: {
      status?: BidStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    bids: Bid[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Verify brand owns the opportunity
      const opportunity = await prisma.opportunity.findUnique({
        where: { id: opportunityId },
      });

      if (!opportunity || opportunity.brandId !== brandId) {
        throw new AppError(403, 'Access denied');
      }

      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = { opportunityId };
      if (filters?.status) {
        where.status = filters.status;
      }

      const [bids, total] = await Promise.all([
        prisma.bid.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.bid.count({ where }),
      ]);

      return {
        bids,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting bids for opportunity:', error);
      throw error;
    }
  }

  /**
   * Get bids by creator
   */
  async getCreatorBids(
    creatorId: string,
    filters?: {
      status?: BidStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    bids: any[];
    total: number;
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

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              budget: true,
              currency: true,
              deadline: true,
              status: true,
            },
          },
        },
      }),
      prisma.bid.count({ where }),
    ]);

    return {
      bids,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Accept a bid
   */
  async acceptBid(bidId: string, brandId: string): Promise<Bid> {
    try {
      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: { opportunity: true },
      });

      if (!bid) {
        throw new AppError(404, 'Bid not found');
      }

      if (bid.opportunity.brandId !== brandId) {
        throw new AppError(403, 'Access denied');
      }

      if (bid.opportunity.status !== 'OPEN') {
        throw new AppError(400, 'Opportunity is not open');
      }

      const updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: {
          status: BidStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });

      // Update opportunity status
      await prisma.opportunity.update({
        where: { id: bid.opportunityId },
        data: {
          status: 'IN_PROGRESS',
          filledSlots: { increment: 1 },
        },
      });

      logger.info(`Bid accepted: ${bidId}`);

      // Notify creator (async)
      this.notifyCreatorOfBidAcceptance(bid.creatorId, bidId).catch((err) => {
        logger.error('Failed to notify creator of bid acceptance:', err);
      });

      return updatedBid;
    } catch (error) {
      logger.error('Error accepting bid:', error);
      throw error;
    }
  }

  /**
   * Reject a bid
   */
  async rejectBid(bidId: string, brandId: string, reason?: string): Promise<Bid> {
    try {
      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
        include: { opportunity: true },
      });

      if (!bid) {
        throw new AppError(404, 'Bid not found');
      }

      if (bid.opportunity.brandId !== brandId) {
        throw new AppError(403, 'Access denied');
      }

      const updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: {
          status: BidStatus.REJECTED,
          rejectionReason: reason,
          respondedAt: new Date(),
        },
      });

      logger.info(`Bid rejected: ${bidId}`);

      // Notify creator (async)
      this.notifyCreatorOfBidRejection(bid.creatorId, bidId).catch((err) => {
        logger.error('Failed to notify creator of bid rejection:', err);
      });

      return updatedBid;
    } catch (error) {
      logger.error('Error rejecting bid:', error);
      throw error;
    }
  }

  /**
   * Negotiate a bid (counter offer)
   */
  async negotiateBid(bidId: string, input: NegotiateBidInput): Promise<Bid> {
    try {
      const bid = await prisma.bid.findUnique({
        where: { id: bidId },
      });

      if (!bid) {
        throw new AppError(404, 'Bid not found');
      }

      if (!['PENDING', 'UNDER_REVIEW'].includes(bid.status)) {
        throw new AppError(400, 'Cannot negotiate bid in current status');
      }

      const updatedBid = await prisma.bid.update({
        where: { id: bidId },
        data: {
          status: BidStatus.COUNTERED,
          counterOffer: input.counterOffer,
          counterOfferBy: input.counterOfferedBy,
          updatedAt: new Date(),
        },
      });

      logger.info(`Bid negotiated: ${bidId}`);

      // Notify the other party
      const notifyUserId = input.counterOfferedBy === bid.creatorId
        ? await this.getBrandIdForBid(bidId)
        : bid.creatorId;

      this.notifyOfCounterOffer(notifyUserId, bidId).catch((err) => {
        logger.error('Failed to notify of counter offer:', err);
      });

      return updatedBid;
    } catch (error) {
      logger.error('Error negotiating bid:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getBrandIdForBid(bidId: string): Promise<string> {
    const bid = await prisma.bid.findUnique({
      where: { id: bidId },
      include: { opportunity: true },
    });
    return bid!.opportunity.brandId;
  }

  private async notifyBrandOfNewBid(brandId: string, bidId: string): Promise<void> {
    try {
      await axios.post(`${config.externalServices.notificationServiceUrl}/api/notifications`, {
        userId: brandId,
        type: 'NEW_BID',
        title: 'New Bid Received',
        message: 'A creator has submitted a bid for your opportunity',
        data: { bidId },
      });
    } catch (error) {
      logger.error('Error notifying brand:', error);
    }
  }

  private async notifyCreatorOfBidAcceptance(creatorId: string, bidId: string): Promise<void> {
    try {
      await axios.post(`${config.externalServices.notificationServiceUrl}/api/notifications`, {
        userId: creatorId,
        type: 'BID_ACCEPTED',
        title: 'Your Bid Was Accepted!',
        message: 'Congratulations! A brand has accepted your bid.',
        data: { bidId },
      });
    } catch (error) {
      logger.error('Error notifying creator:', error);
    }
  }

  private async notifyCreatorOfBidRejection(creatorId: string, bidId: string): Promise<void> {
    try {
      await axios.post(`${config.externalServices.notificationServiceUrl}/api/notifications`, {
        userId: creatorId,
        type: 'BID_REJECTED',
        title: 'Bid Update',
        message: 'Your bid was not selected for this opportunity',
        data: { bidId },
      });
    } catch (error) {
      logger.error('Error notifying creator:', error);
    }
  }

  private async notifyOfCounterOffer(userId: string, bidId: string): Promise<void> {
    try {
      await axios.post(`${config.externalServices.notificationServiceUrl}/api/notifications`, {
        userId,
        type: 'BID_COUNTER_OFFER',
        title: 'Counter Offer Received',
        message: 'You have received a counter offer on a bid',
        data: { bidId },
      });
    } catch (error) {
      logger.error('Error notifying of counter offer:', error);
    }
  }
}

export default new BiddingService();
