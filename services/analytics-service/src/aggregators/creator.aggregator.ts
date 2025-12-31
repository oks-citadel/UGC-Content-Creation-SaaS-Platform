import metricsService from '../services/metrics.service';
import axios from 'axios';
import config from '../config';
import { subDays } from 'date-fns';

export interface CreatorMetrics {
  creatorId: string;
  totalContent: number;
  publishedContent: number;
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalEarnings: number;
  averageEngagementRate: number;
  averageContentScore: number;
  totalFollowers: number;
  followerGrowth: number;
  responseRate: number;
  onTimeDeliveryRate: number;
}

class CreatorAggregator {
  /**
   * Aggregate creator metrics
   */
  async aggregateCreatorMetrics(
    creatorId: string,
    period: 'hourly' | 'daily' = 'daily'
  ) {
    try {
      const [creatorResponse, contentResponse, campaignsResponse, earningsResponse] =
        await Promise.all([
          axios.get(`${config.services.creator}/api/creators/${creatorId}`, {
            timeout: 5000,
          }),
          axios.get(`${config.services.creator}/api/creators/${creatorId}/content`, {
            timeout: 5000,
          }),
          axios.get(`${config.services.creator}/api/creators/${creatorId}/campaigns`, {
            timeout: 5000,
          }),
          axios.get(`${config.services.creator}/api/creators/${creatorId}/earnings`, {
            timeout: 5000,
          }),
        ]);

      const creator = creatorResponse.data;
      const content = contentResponse.data.data || [];
      const campaigns = campaignsResponse.data.data || [];
      const earnings = earningsResponse.data;

      const metrics = this.calculateMetrics(creator, content, campaigns, earnings);

      await metricsService.recordMetrics({
        entityType: 'creator',
        entityId: creatorId,
        metrics,
        period,
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(`Failed to aggregate creator metrics for ${creatorId}:`, error);
      throw error;
    }
  }

  /**
   * Aggregate metrics for all creators
   */
  async aggregateAllCreators(period: 'hourly' | 'daily' = 'daily') {
    try {
      const response = await axios.get(`${config.services.creator}/api/creators`, {
        timeout: 10000,
      });

      const creators = response.data.data || [];

      const results = await Promise.allSettled(
        creators.map((creator: any) =>
          this.aggregateCreatorMetrics(creator.id, period)
        )
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        total: creators.length,
        successful,
        failed,
      };
    } catch (error) {
      console.error('Failed to aggregate all creators:', error);
      throw error;
    }
  }

  /**
   * Calculate creator performance score
   */
  async calculatePerformanceScore(creatorId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const snapshots = await metricsService.getMetrics({
      entityType: 'creator',
      entityId: creatorId,
      startDate,
      endDate,
    });

    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      return {
        score: 0,
        breakdown: {
          contentQuality: 0,
          engagement: 0,
          reliability: 0,
          growth: 0,
        },
      };
    }

    // Calculate weighted performance score
    const latestMetrics = snapshots[snapshots.length - 1].metrics as any || {};

    const contentQuality = (latestMetrics.averageContentScore || 0) * 25;
    const engagement = Math.min((latestMetrics.averageEngagementRate || 0) * 5, 25);
    const reliability = (latestMetrics.onTimeDeliveryRate || 0) * 0.25;
    const growth = Math.min((latestMetrics.followerGrowth || 0), 25);

    const score = contentQuality + engagement + reliability + growth;

    return {
      score: Number(score.toFixed(2)),
      breakdown: {
        contentQuality: Number(contentQuality.toFixed(2)),
        engagement: Number(engagement.toFixed(2)),
        reliability: Number(reliability.toFixed(2)),
        growth: Number(growth.toFixed(2)),
      },
    };
  }

  /**
   * Aggregate creator portfolio metrics
   */
  async aggregatePortfolioMetrics(creatorId: string) {
    try {
      const response = await axios.get(
        `${config.services.creator}/api/creators/${creatorId}/portfolio`,
        { timeout: 5000 }
      );

      const portfolio = response.data.data || [];

      const metrics = {
        totalPieces: portfolio.length,
        platforms: this.countByField(portfolio, 'platform'),
        categories: this.countByField(portfolio, 'category'),
        totalViews: portfolio.reduce((sum: number, p: any) => sum + (p.views || 0), 0),
        totalEngagements: portfolio.reduce(
          (sum: number, p: any) => sum + (p.engagements || 0),
          0
        ),
        averageEngagementRate:
          portfolio.length > 0
            ? portfolio.reduce(
                (sum: number, p: any) => sum + (p.engagementRate || 0),
                0
              ) / portfolio.length
            : 0,
      };

      await metricsService.recordMetrics({
        entityType: 'creator',
        entityId: `${creatorId}:portfolio`,
        metrics,
        period: 'daily',
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(
        `Failed to aggregate portfolio metrics for ${creatorId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Track creator growth over time
   */
  async trackGrowth(creatorId: string, days: number = 90) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const snapshots = await metricsService.getMetrics({
      entityType: 'creator',
      entityId: creatorId,
      startDate,
      endDate,
    });

    if (!Array.isArray(snapshots) || snapshots.length < 2) {
      return {
        followerGrowth: 0,
        contentGrowth: 0,
        earningsGrowth: 0,
      };
    }

    const oldest = snapshots[0].metrics as any || {};
    const latest = snapshots[snapshots.length - 1].metrics as any || {};

    const followerGrowth =
      (oldest || {}).totalFollowers > 0
        ? (((latest || {}).totalFollowers - (oldest || {}).totalFollowers) / (oldest || {}).totalFollowers) *
          100
        : 0;

    const contentGrowth =
      (oldest || {}).totalContent > 0
        ? (((latest || {}).totalContent - (oldest || {}).totalContent) / (oldest || {}).totalContent) * 100
        : 0;

    const earningsGrowth =
      (oldest || {}).totalEarnings > 0
        ? (((latest || {}).totalEarnings - (oldest || {}).totalEarnings) / (oldest || {}).totalEarnings) *
          100
        : 0;

    return {
      followerGrowth: Number(followerGrowth.toFixed(2)),
      contentGrowth: Number(contentGrowth.toFixed(2)),
      earningsGrowth: Number(earningsGrowth.toFixed(2)),
      period: {
        start: startDate,
        end: endDate,
        days,
      },
    };
  }

  /**
   * Get creator leaderboard
   */
  async getLeaderboard(metric: string, limit: number = 10, days: number = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const topPerformers = await metricsService.getTopPerformers('creator', metric, {
      startDate,
      endDate,
      limit,
      order: 'desc',
    });

    return topPerformers;
  }

  /**
   * Aggregate creator collaboration metrics
   */
  async aggregateCollaborationMetrics(creatorId: string) {
    try {
      const response = await axios.get(
        `${config.services.creator}/api/creators/${creatorId}/collaborations`,
        { timeout: 5000 }
      );

      const collaborations = response.data.data || [];

      const metrics = {
        totalCollaborations: collaborations.length,
        activeCollaborations: collaborations.filter(
          (c: any) => c.status === 'active'
        ).length,
        completedCollaborations: collaborations.filter(
          (c: any) => c.status === 'completed'
        ).length,
        brands: [...new Set(collaborations.map((c: any) => c.brandId))].length,
        averageRating:
          collaborations.length > 0
            ? collaborations.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) /
              collaborations.length
            : 0,
      };

      await metricsService.recordMetrics({
        entityType: 'creator',
        entityId: `${creatorId}:collaborations`,
        metrics,
        period: 'daily',
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(
        `Failed to aggregate collaboration metrics for ${creatorId}:`,
        error
      );
      throw error;
    }
  }

  // Helper methods

  private calculateMetrics(
    creator: any,
    content: any[],
    campaigns: any[],
    earnings: any
  ): CreatorMetrics {
    const totalContent = content.length;
    const publishedContent = content.filter((c) => c.status === 'published').length;

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
    const completedCampaigns = campaigns.filter(
      (c) => c.status === 'completed'
    ).length;

    const totalEarnings = earnings.total || 0;

    const totalImpressions = content.reduce(
      (sum, c) => sum + (c.impressions || 0),
      0
    );
    const totalEngagements = content.reduce(
      (sum, c) => sum + (c.engagements || 0),
      0
    );
    const averageEngagementRate =
      totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

    const averageContentScore =
      content.length > 0
        ? content.reduce((sum, c) => sum + (c.score || 0), 0) / content.length
        : 0;

    const totalFollowers = creator.followers || 0;
    const followerGrowth = creator.followerGrowth || 0;

    const responseRate = creator.responseRate || 0;
    const onTimeDeliveryRate = creator.onTimeDeliveryRate || 0;

    return {
      creatorId: creator.id,
      totalContent,
      publishedContent,
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalEarnings,
      averageEngagementRate: Number(averageEngagementRate.toFixed(2)),
      averageContentScore: Number(averageContentScore.toFixed(2)),
      totalFollowers,
      followerGrowth: Number(followerGrowth.toFixed(2)),
      responseRate: Number(responseRate.toFixed(2)),
      onTimeDeliveryRate: Number(onTimeDeliveryRate.toFixed(2)),
    };
  }

  private countByField(items: any[], field: string): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const item of items) {
      const value = item[field] || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    }

    return counts;
  }
}

export default new CreatorAggregator();
