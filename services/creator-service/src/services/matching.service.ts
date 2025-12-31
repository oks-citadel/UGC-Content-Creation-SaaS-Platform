import prisma from '../lib/prisma';
import { Prisma } from '.prisma/creator-service-client';
import logger from '../lib/logger';
import { config } from '../config';

export interface MatchingCriteria {
  niche?: string;
  niches?: string[];
  minFollowers?: number;
  maxFollowers?: number;
  minEngagementRate?: number;
  location?: string;
  country?: string;
  platforms?: string[];
  minReputationScore?: number;
  budget?: number;
  languages?: string[];
  excludeCreatorIds?: string[];
  limit?: number;
}

export interface CreatorScore {
  creatorId: string;
  score: number;
  breakdown: {
    nicheMatch: number;
    followerMatch: number;
    engagementMatch: number;
    reputationMatch: number;
    locationMatch: number;
    budgetMatch: number;
  };
}

class MatchingService {
  /**
   * Find creators matching specific criteria
   */
  async findMatchingCreators(criteria: MatchingCriteria) {
    const {
      niche,
      niches = [],
      minFollowers = config.get('MIN_FOLLOWERS'),
      maxFollowers,
      minEngagementRate = config.get('MIN_ENGAGEMENT_RATE'),
      location,
      country,
      platforms = [],
      minReputationScore,
      budget,
      languages = [],
      excludeCreatorIds = [],
      limit = config.get('MAX_RECOMMENDATION_COUNT'),
    } = criteria;

    // Build where clause
    const where: Prisma.CreatorWhereInput = {
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      ...(excludeCreatorIds.length > 0 && {
        id: { notIn: excludeCreatorIds },
      }),
    };

    // Niche filtering
    const nicheList = niche ? [niche, ...niches] : niches;
    if (nicheList.length > 0) {
      where.OR = [
        { primaryNiche: { in: nicheList } },
        { secondaryNiches: { hasSome: nicheList } },
      ];
    }

    // Location filtering
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    if (country) {
      where.country = country;
    }

    // Languages
    if (languages.length > 0) {
      where.languages = { hasSome: languages };
    }

    // Budget filtering
    if (budget) {
      where.OR = [
        ...(where.OR || []),
        { minCampaignBudget: null },
        { minCampaignBudget: { lte: budget } },
      ];
    }

    // Reputation filtering
    if (minReputationScore) {
      where.reputationScore = { gte: minReputationScore };
    }

    // Find creators with metrics
    const creators = await prisma.creator.findMany({
      where,
      include: {
        metrics: true,
        verification: true,
      },
      take: limit * 3, // Get more to filter by metrics
    });

    // Filter by metrics (can't do in Prisma where clause due to relation)
    const filteredCreators = creators.filter((creator) => {
      if (!creator.metrics) return false;

      // Follower filtering
      const totalFollowers = creator.metrics.totalFollowers;
      if (totalFollowers < minFollowers) return false;
      if (maxFollowers && totalFollowers > maxFollowers) return false;

      // Engagement rate filtering
      const engagementRate = Number(creator.metrics.avgEngagementRate);
      if (engagementRate < minEngagementRate) return false;

      // Platform filtering
      if (platforms.length > 0) {
        const creatorPlatforms: string[] = [];
        if (creator.instagramHandle) creatorPlatforms.push('INSTAGRAM');
        if (creator.tiktokHandle) creatorPlatforms.push('TIKTOK');
        if (creator.youtubeHandle) creatorPlatforms.push('YOUTUBE');
        if (creator.twitterHandle) creatorPlatforms.push('TWITTER');
        if (creator.facebookHandle) creatorPlatforms.push('FACEBOOK');

        const hasMatchingPlatform = platforms.some(p => creatorPlatforms.includes(p));
        if (!hasMatchingPlatform) return false;
      }

      return true;
    });

    // Sort by reputation and take limit
    const sortedCreators = filteredCreators
      .sort((a, b) => Number(b.reputationScore) - Number(a.reputationScore))
      .slice(0, limit);

    logger.info(
      { criteria, found: sortedCreators.length },
      'Found matching creators'
    );

    return sortedCreators;
  }

  /**
   * Score a creator for a specific campaign
   */
  async scoreCreatorForCampaign(
    creatorId: string,
    campaignCriteria: MatchingCriteria
  ): Promise<CreatorScore> {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: { metrics: true },
    });

    if (!creator || !creator.metrics) {
      throw new Error('Creator or metrics not found');
    }

    const {
      niche,
      niches = [],
      minFollowers = 0,
      maxFollowers = Infinity,
      minEngagementRate = 0,
      country,
      budget,
      languages = [],
    } = campaignCriteria;

    const breakdown = {
      nicheMatch: 0,
      followerMatch: 0,
      engagementMatch: 0,
      reputationMatch: 0,
      locationMatch: 0,
      budgetMatch: 0,
    };

    // 1. Niche Match (0-30 points)
    const nicheList = niche ? [niche, ...niches] : niches;
    if (nicheList.length > 0) {
      if (creator.primaryNiche && nicheList.includes(creator.primaryNiche)) {
        breakdown.nicheMatch = 30; // Perfect match for primary niche
      } else {
        const secondaryMatches = creator.secondaryNiches.filter(n =>
          nicheList.includes(n)
        ).length;
        breakdown.nicheMatch = Math.min(20, secondaryMatches * 10); // Up to 20 for secondary
      }
    } else {
      breakdown.nicheMatch = 15; // Neutral score if no niche specified
    }

    // 2. Follower Match (0-25 points)
    const totalFollowers = creator.metrics.totalFollowers;
    const targetFollowers = (minFollowers + (maxFollowers === Infinity ? minFollowers * 10 : maxFollowers)) / 2;

    if (totalFollowers >= minFollowers && totalFollowers <= maxFollowers) {
      // Perfect range
      const deviation = Math.abs(totalFollowers - targetFollowers) / targetFollowers;
      breakdown.followerMatch = Math.max(15, 25 - (deviation * 25));
    } else if (totalFollowers < minFollowers) {
      breakdown.followerMatch = Math.max(0, (totalFollowers / minFollowers) * 15);
    } else {
      breakdown.followerMatch = 10; // Over target but still acceptable
    }

    // 3. Engagement Match (0-25 points)
    const engagementRate = Number(creator.metrics.avgEngagementRate);
    if (engagementRate >= minEngagementRate) {
      const multiplier = Math.min(engagementRate / minEngagementRate, 3);
      breakdown.engagementMatch = Math.min(25, 15 * multiplier);
    } else {
      breakdown.engagementMatch = (engagementRate / minEngagementRate) * 15;
    }

    // 4. Reputation Match (0-15 points)
    const reputationScore = Number(creator.reputationScore);
    breakdown.reputationMatch = (reputationScore / 5) * 15;

    // 5. Location Match (0-10 points)
    if (country) {
      breakdown.locationMatch = creator.country === country ? 10 : 0;
    } else {
      breakdown.locationMatch = 5; // Neutral if no location requirement
    }

    // 6. Budget Match (0-5 points)
    if (budget) {
      if (!creator.minCampaignBudget || budget >= Number(creator.minCampaignBudget)) {
        breakdown.budgetMatch = 5;
      } else {
        breakdown.budgetMatch = (budget / Number(creator.minCampaignBudget)) * 5;
      }
    } else {
      breakdown.budgetMatch = 2.5; // Neutral
    }

    // Calculate total score (out of 100)
    const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);

    logger.debug(
      { creatorId, score: totalScore, breakdown },
      'Calculated creator score'
    );

    return {
      creatorId,
      score: Math.round(totalScore * 100) / 100,
      breakdown,
    };
  }

  /**
   * Get recommended creators for a campaign with scores
   */
  async getRecommendedCreators(
    campaignCriteria: MatchingCriteria,
    options: { minScore?: number; includeScores?: boolean } = {}
  ) {
    const { minScore = 50, includeScores = true } = options;

    // Find matching creators
    const creators = await this.findMatchingCreators(campaignCriteria);

    // Score each creator
    const scoredCreators = await Promise.all(
      creators.map(async (creator) => {
        const scoreData = await this.scoreCreatorForCampaign(
          creator.id,
          campaignCriteria
        );

        return {
          creator,
          ...scoreData,
        };
      })
    );

    // Filter by minimum score and sort
    const recommendations = scoredCreators
      .filter((item) => item.score >= minScore)
      .sort((a, b) => b.score - a.score);

    logger.info(
      { criteria: campaignCriteria, recommendations: recommendations.length },
      'Generated creator recommendations'
    );

    if (includeScores) {
      return recommendations;
    }

    return recommendations.map(({ creator }) => creator);
  }

  /**
   * Find similar creators based on a creator's profile
   */
  async findSimilarCreators(creatorId: string, limit: number = 10) {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: { metrics: true },
    });

    if (!creator || !creator.metrics) {
      throw new Error('Creator not found');
    }

    // Build criteria based on creator's profile
    const criteria: MatchingCriteria = {
      niches: [
        ...(creator.primaryNiche ? [creator.primaryNiche] : []),
        ...creator.secondaryNiches,
      ],
      minFollowers: Math.floor(creator.metrics.totalFollowers * 0.5),
      maxFollowers: Math.floor(creator.metrics.totalFollowers * 2),
      minEngagementRate: Number(creator.metrics.avgEngagementRate) * 0.7,
      country: creator.country || undefined,
      minReputationScore: Math.max(0, Number(creator.reputationScore) - 1),
      excludeCreatorIds: [creatorId],
      limit,
    };

    const similar = await this.findMatchingCreators(criteria);

    logger.info(
      { creatorId, found: similar.length },
      'Found similar creators'
    );

    return similar;
  }

  /**
   * Analyze creator compatibility with a brand
   */
  async analyzeCompatibility(creatorId: string, brandId: string) {
    // This would typically fetch brand preferences and compare
    // For now, we'll return a basic compatibility score

    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: { metrics: true },
    });

    if (!creator || !creator.metrics) {
      throw new Error('Creator not found');
    }

    // Check if creator is unwilling to work with this brand
    if (creator.unwillingToWorkWith.includes(brandId)) {
      return {
        compatible: false,
        score: 0,
        reason: 'Creator has marked this brand as unwilling to work with',
      };
    }

    // Basic compatibility score
    const reputationScore = Number(creator.reputationScore);
    const engagementRate = Number(creator.metrics.avgEngagementRate);
    const successRate = Number(creator.metrics.successRate);

    const compatibilityScore = (
      (reputationScore / 5) * 40 +
      Math.min(engagementRate * 100, 1) * 30 +
      (successRate / 100) * 30
    );

    return {
      compatible: compatibilityScore >= 50,
      score: Math.round(compatibilityScore * 100) / 100,
      factors: {
        reputation: reputationScore,
        engagement: engagementRate,
        successRate: successRate,
      },
    };
  }

  /**
   * Get trending creators in a specific niche
   */
  async getTrendingCreators(niche: string, limit: number = 20) {
    const creators = await prisma.creator.findMany({
      where: {
        OR: [
          { primaryNiche: niche },
          { secondaryNiches: { has: niche } },
        ],
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
      },
      include: {
        metrics: true,
      },
      orderBy: [
        { reputationScore: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: limit,
    });

    // Filter by recent activity and engagement
    const trending = creators.filter((creator) => {
      if (!creator.metrics) return false;

      const avgEngagement = Number(creator.metrics.avgEngagementRate);
      const completedCampaigns = creator.metrics.completedCampaigns;

      return avgEngagement > 0.02 && completedCampaigns > 0;
    });

    logger.info({ niche, found: trending.length }, 'Found trending creators');

    return trending;
  }
}

export default new MatchingService();
