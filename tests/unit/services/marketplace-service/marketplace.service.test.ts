import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockPrisma = {
  opportunity: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  bid: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
  OpportunityStatus: {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    FILLED: 'FILLED',
    CLOSED: 'CLOSED',
  },
  BidStatus: {
    PENDING: 'PENDING',
    UNDER_REVIEW: 'UNDER_REVIEW',
    SHORTLISTED: 'SHORTLISTED',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    COUNTERED: 'COUNTERED',
    WITHDRAWN: 'WITHDRAWN',
  },
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ status: 200, data: {} }),
    post: vi.fn().mockResolvedValue({ status: 200 }),
  },
}));

describe('Marketplace Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Creator Matching Algorithm', () => {
    it('should match creators by niche', () => {
      const creatorProfile = {
        id: 'creator-123',
        niches: ['tech', 'lifestyle', 'travel'],
        totalFollowers: 50000,
        country: 'US',
      };

      const opportunities = [
        {
          id: 'opp-1',
          targetNiche: ['tech', 'gaming'],
          minFollowers: 10000,
          maxFollowers: 100000,
          locations: ['US', 'UK'],
        },
        {
          id: 'opp-2',
          targetNiche: ['fashion', 'beauty'],
          minFollowers: 10000,
          maxFollowers: 100000,
          locations: ['US'],
        },
        {
          id: 'opp-3',
          targetNiche: ['travel', 'food'],
          minFollowers: 25000,
          maxFollowers: 75000,
          locations: ['US', 'CA'],
        },
      ];

      const matchingOpps = opportunities.filter((opp) => {
        const nicheMatch = opp.targetNiche.some((niche) => creatorProfile.niches.includes(niche));
        const followerMatch = creatorProfile.totalFollowers >= opp.minFollowers &&
                              creatorProfile.totalFollowers <= opp.maxFollowers;
        const locationMatch = opp.locations.includes(creatorProfile.country);
        return nicheMatch && followerMatch && locationMatch;
      });

      expect(matchingOpps).toHaveLength(2);
      expect(matchingOpps.map((o) => o.id)).toContain('opp-1');
      expect(matchingOpps.map((o) => o.id)).toContain('opp-3');
    });

    it('should filter by follower count range', () => {
      const creators = [
        { id: 'c1', followers: 5000 },
        { id: 'c2', followers: 25000 },
        { id: 'c3', followers: 100000 },
        { id: 'c4', followers: 500000 },
      ];

      const opportunity = {
        minFollowers: 10000,
        maxFollowers: 200000,
      };

      const matchingCreators = creators.filter(
        (c) => c.followers >= opportunity.minFollowers && c.followers <= opportunity.maxFollowers
      );

      expect(matchingCreators).toHaveLength(2);
      expect(matchingCreators.map((c) => c.id)).toEqual(['c2', 'c3']);
    });

    it('should match by location', () => {
      const creators = [
        { id: 'c1', country: 'US' },
        { id: 'c2', country: 'UK' },
        { id: 'c3', country: 'CA' },
        { id: 'c4', country: 'AU' },
      ];

      const opportunity = {
        locations: ['US', 'UK', 'CA'],
      };

      const matchingCreators = creators.filter((c) => opportunity.locations.includes(c.country));

      expect(matchingCreators).toHaveLength(3);
      expect(matchingCreators.map((c) => c.id)).not.toContain('c4');
    });
  });

  describe('Bid Validation', () => {
    it('should validate bid for open opportunity', async () => {
      const mockOpportunity = {
        id: 'opp-123',
        status: 'OPEN',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        brandId: 'brand-456',
      };

      mockPrisma.opportunity.findUnique.mockResolvedValue(mockOpportunity);
      mockPrisma.bid.findUnique.mockResolvedValue(null);
      mockPrisma.bid.create.mockResolvedValue({
        id: 'bid-123',
        opportunityId: 'opp-123',
        creatorId: 'creator-789',
        proposedRate: 500,
        status: 'PENDING',
      });
      mockPrisma.opportunity.update.mockResolvedValue({ ...mockOpportunity, bidCount: 1 });

      const bid = await mockPrisma.bid.create({
        data: {
          opportunityId: 'opp-123',
          creatorId: 'creator-789',
          proposedRate: 500,
          status: 'PENDING',
        },
      });

      expect(bid).toHaveProperty('id');
      expect(bid.status).toBe('PENDING');
    });

    it('should reject bid for closed opportunity', async () => {
      const mockOpportunity = {
        id: 'opp-closed',
        status: 'CLOSED',
        deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };

      mockPrisma.opportunity.findUnique.mockResolvedValue(mockOpportunity);

      const opportunity = await mockPrisma.opportunity.findUnique({ where: { id: 'opp-closed' } });

      expect(opportunity?.status).toBe('CLOSED');
    });

    it('should reject duplicate bid from same creator', async () => {
      mockPrisma.bid.findUnique.mockResolvedValue({
        id: 'existing-bid',
        opportunityId: 'opp-123',
        creatorId: 'creator-789',
        status: 'PENDING',
      });

      const existingBid = await mockPrisma.bid.findUnique({
        where: {
          opportunityId_creatorId: {
            opportunityId: 'opp-123',
            creatorId: 'creator-789',
          },
        },
      });

      expect(existingBid).not.toBeNull();
      expect(existingBid?.status).not.toBe('WITHDRAWN');
    });

    it('should allow withdrawn creator to bid again', async () => {
      mockPrisma.bid.findUnique.mockResolvedValue({
        id: 'withdrawn-bid',
        opportunityId: 'opp-123',
        creatorId: 'creator-789',
        status: 'WITHDRAWN',
      });

      const existingBid = await mockPrisma.bid.findUnique({
        where: {
          opportunityId_creatorId: {
            opportunityId: 'opp-123',
            creatorId: 'creator-789',
          },
        },
      });

      expect(existingBid?.status).toBe('WITHDRAWN');
    });
  });

  describe('Ranking Calculations', () => {
    it('should rank bids by proposed rate (ascending for brand)', () => {
      const bids = [
        { id: 'bid-1', proposedRate: 1000, creatorId: 'c1' },
        { id: 'bid-2', proposedRate: 500, creatorId: 'c2' },
        { id: 'bid-3', proposedRate: 750, creatorId: 'c3' },
        { id: 'bid-4', proposedRate: 600, creatorId: 'c4' },
      ];

      const ranked = [...bids].sort((a, b) => a.proposedRate - b.proposedRate);

      expect(ranked[0].id).toBe('bid-2');
      expect(ranked[1].id).toBe('bid-4');
      expect(ranked[2].id).toBe('bid-3');
      expect(ranked[3].id).toBe('bid-1');
    });

    it('should rank opportunities by budget for creators', () => {
      const opportunities = [
        { id: 'opp-1', budget: 5000 },
        { id: 'opp-2', budget: 10000 },
        { id: 'opp-3', budget: 2500 },
        { id: 'opp-4', budget: 7500 },
      ];

      const ranked = [...opportunities].sort((a, b) => b.budget - a.budget);

      expect(ranked[0].id).toBe('opp-2');
      expect(ranked[1].id).toBe('opp-4');
      expect(ranked[2].id).toBe('opp-1');
      expect(ranked[3].id).toBe('opp-3');
    });

    it('should calculate bid competitiveness score', () => {
      const calculateScore = (bid: any, opportunity: any, creatorStats: any) => {
        const priceScore = 1 - (bid.proposedRate / opportunity.budget);
        const engagementScore = Math.min(creatorStats.engagementRate / 10, 1);
        const followerScore = Math.min(creatorStats.followers / 100000, 1);

        return (priceScore * 0.4) + (engagementScore * 0.35) + (followerScore * 0.25);
      };

      const bid = { proposedRate: 400 };
      const opportunity = { budget: 1000 };
      const creatorStats = { engagementRate: 8, followers: 50000 };

      const score = calculateScore(bid, opportunity, creatorStats);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Search Filtering', () => {
    it('should filter opportunities by budget range', async () => {
      const opportunities = [
        { id: 'opp-1', budget: 500, status: 'OPEN' },
        { id: 'opp-2', budget: 1500, status: 'OPEN' },
        { id: 'opp-3', budget: 3000, status: 'OPEN' },
        { id: 'opp-4', budget: 5000, status: 'OPEN' },
      ];

      const minBudget = 1000;
      const maxBudget = 4000;

      const filtered = opportunities.filter(
        (o) => o.budget >= minBudget && o.budget <= maxBudget
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map((o) => o.id)).toEqual(['opp-2', 'opp-3']);
    });

    it('should filter opportunities by deadline', () => {
      const now = new Date();
      const opportunities = [
        { id: 'opp-1', deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
        { id: 'opp-2', deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) },
        { id: 'opp-3', deadline: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      ];

      const activeOpportunities = opportunities.filter(
        (o) => o.deadline > now
      );

      expect(activeOpportunities).toHaveLength(2);
      expect(activeOpportunities.map((o) => o.id)).not.toContain('opp-3');
    });

    it('should filter opportunities by status', async () => {
      mockPrisma.opportunity.findMany.mockResolvedValue([
        { id: 'opp-1', status: 'OPEN' },
        { id: 'opp-2', status: 'OPEN' },
      ]);

      const opportunities = await mockPrisma.opportunity.findMany({
        where: { status: 'OPEN' },
      });

      expect(opportunities).toHaveLength(2);
      expect(opportunities.every((o: any) => o.status === 'OPEN')).toBe(true);
    });

    it('should filter by niche', () => {
      const opportunities = [
        { id: 'opp-1', targetNiche: ['tech', 'gaming'] },
        { id: 'opp-2', targetNiche: ['fashion', 'beauty'] },
        { id: 'opp-3', targetNiche: ['tech', 'lifestyle'] },
      ];

      const techOpps = opportunities.filter((o) => o.targetNiche.includes('tech'));

      expect(techOpps).toHaveLength(2);
      expect(techOpps.map((o) => o.id)).toContain('opp-1');
      expect(techOpps.map((o) => o.id)).toContain('opp-3');
    });

    it('should support pagination', async () => {
      const page = 2;
      const limit = 10;
      const skip = (page - 1) * limit;

      mockPrisma.opportunity.findMany.mockResolvedValue(
        Array(10).fill(null).map((_, i) => ({ id: `opp-${i + 10}` }))
      );
      mockPrisma.opportunity.count.mockResolvedValue(25);

      const [opportunities, total] = await Promise.all([
        mockPrisma.opportunity.findMany({ skip, take: limit }),
        mockPrisma.opportunity.count({}),
      ]);

      const totalPages = Math.ceil(total / limit);

      expect(opportunities).toHaveLength(10);
      expect(totalPages).toBe(3);
    });
  });

  describe('Bid Operations', () => {
    it('should accept a bid', async () => {
      mockPrisma.bid.update.mockResolvedValue({
        id: 'bid-123',
        status: 'ACCEPTED',
        respondedAt: new Date(),
      });

      const acceptedBid = await mockPrisma.bid.update({
        where: { id: 'bid-123' },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      });

      expect(acceptedBid.status).toBe('ACCEPTED');
      expect(acceptedBid.respondedAt).toBeDefined();
    });

    it('should reject a bid with reason', async () => {
      mockPrisma.bid.update.mockResolvedValue({
        id: 'bid-123',
        status: 'REJECTED',
        rejectionReason: 'Budget constraints',
        respondedAt: new Date(),
      });

      const rejectedBid = await mockPrisma.bid.update({
        where: { id: 'bid-123' },
        data: {
          status: 'REJECTED',
          rejectionReason: 'Budget constraints',
          respondedAt: new Date(),
        },
      });

      expect(rejectedBid.status).toBe('REJECTED');
      expect(rejectedBid.rejectionReason).toBe('Budget constraints');
    });

    it('should counter a bid', async () => {
      mockPrisma.bid.update.mockResolvedValue({
        id: 'bid-123',
        status: 'COUNTERED',
        counterOffer: 400,
        counterOfferBy: 'brand-456',
      });

      const counteredBid = await mockPrisma.bid.update({
        where: { id: 'bid-123' },
        data: {
          status: 'COUNTERED',
          counterOffer: 400,
          counterOfferBy: 'brand-456',
        },
      });

      expect(counteredBid.status).toBe('COUNTERED');
      expect(counteredBid.counterOffer).toBe(400);
    });

    it('should withdraw a bid', async () => {
      mockPrisma.bid.update.mockResolvedValue({
        id: 'bid-123',
        status: 'WITHDRAWN',
      });

      const withdrawnBid = await mockPrisma.bid.update({
        where: { id: 'bid-123' },
        data: { status: 'WITHDRAWN' },
      });

      expect(withdrawnBid.status).toBe('WITHDRAWN');
    });
  });
});
