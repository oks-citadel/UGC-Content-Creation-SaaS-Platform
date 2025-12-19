import metricsService from '../services/metrics.service';
import axios from 'axios';
import config from '../config';
import { subDays } from 'date-fns';

export interface CampaignMetrics {
  campaignId: string;
  totalContent: number;
  publishedContent: number;
  approvedContent: number;
  pendingContent: number;
  totalViews: number;
  totalEngagements: number;
  totalConversions: number;
  totalRevenue: number;
  averageEngagementRate: number;
  averageConversionRate: number;
  roi: number;
  budgetSpent: number;
  budgetRemaining: number;
}

class CampaignAggregator {
  /**
   * Aggregate campaign metrics
   */
  async aggregateCampaignMetrics(
    campaignId: string,
    period: 'hourly' | 'daily' = 'daily'
  ) {
    try {
      // Fetch campaign data
      const [campaignResponse, contentResponse, budgetResponse] = await Promise.all([
        axios.get(`${config.services.campaign}/api/campaigns/${campaignId}`, {
          timeout: 5000,
        }),
        axios.get(`${config.services.campaign}/api/campaigns/${campaignId}/content`, {
          timeout: 5000,
        }),
        axios.get(`${config.services.campaign}/api/campaigns/${campaignId}/budget`, {
          timeout: 5000,
        }),
      ]);

      const campaign = campaignResponse.data;
      const content = contentResponse.data.data || [];
      const budget = budgetResponse.data;

      // Calculate metrics
      const metrics = this.calculateMetrics(campaign, content, budget);

      // Record metrics
      await metricsService.recordMetrics({
        entityType: 'campaign',
        entityId: campaignId,
        metrics,
        period,
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(`Failed to aggregate campaign metrics for ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Aggregate metrics for all active campaigns
   */
  async aggregateAllCampaigns(period: 'hourly' | 'daily' = 'daily') {
    try {
      const response = await axios.get(
        `${config.services.campaign}/api/campaigns?status=active`,
        { timeout: 10000 }
      );

      const campaigns = response.data.data || [];

      const results = await Promise.allSettled(
        campaigns.map((campaign: any) =>
          this.aggregateCampaignMetrics(campaign.id, period)
        )
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        total: campaigns.length,
        successful,
        failed,
      };
    } catch (error) {
      console.error('Failed to aggregate all campaigns:', error);
      throw error;
    }
  }

  /**
   * Aggregate campaign performance by creator
   */
  async aggregateByCreator(campaignId: string) {
    try {
      const response = await axios.get(
        `${config.services.campaign}/api/campaigns/${campaignId}/creators`,
        { timeout: 5000 }
      );

      const creators = response.data.data || [];

      const creatorMetrics = await Promise.all(
        creators.map(async (creator: any) => {
          const contentMetrics = await this.getCreatorContent(campaignId, creator.id);

          return {
            creatorId: creator.id,
            creatorName: creator.name,
            contentCount: contentMetrics.length,
            totalEngagements: contentMetrics.reduce(
              (sum: number, c: any) => sum + (c.engagements || 0),
              0
            ),
            totalViews: contentMetrics.reduce(
              (sum: number, c: any) => sum + (c.views || 0),
              0
            ),
            averageEngagementRate:
              contentMetrics.length > 0
                ? contentMetrics.reduce(
                    (sum: number, c: any) => sum + (c.engagementRate || 0),
                    0
                  ) / contentMetrics.length
                : 0,
          };
        })
      );

      await metricsService.recordMetrics({
        entityType: 'campaign',
        entityId: `${campaignId}:creators`,
        metrics: { creators: creatorMetrics },
        period: 'daily',
        recordedAt: new Date(),
      });

      return creatorMetrics;
    } catch (error) {
      console.error(
        `Failed to aggregate campaign creator metrics for ${campaignId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Calculate campaign ROI
   */
  async calculateROI(campaignId: string) {
    try {
      const [budgetResponse, revenueResponse] = await Promise.all([
        axios.get(`${config.services.campaign}/api/campaigns/${campaignId}/budget`, {
          timeout: 5000,
        }),
        axios.get(`${config.services.campaign}/api/campaigns/${campaignId}/revenue`, {
          timeout: 5000,
        }),
      ]);

      const budgetSpent = budgetResponse.data.spent || 0;
      const revenue = revenueResponse.data.total || 0;

      const roi = budgetSpent > 0 ? ((revenue - budgetSpent) / budgetSpent) * 100 : 0;

      return {
        budgetSpent,
        revenue,
        roi: Number(roi.toFixed(2)),
        profit: revenue - budgetSpent,
      };
    } catch (error) {
      console.error(`Failed to calculate ROI for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Get campaign progress metrics
   */
  async getCampaignProgress(campaignId: string) {
    try {
      const response = await axios.get(
        `${config.services.campaign}/api/campaigns/${campaignId}/progress`,
        { timeout: 5000 }
      );

      const progress = response.data;

      const metrics = {
        totalBriefs: progress.totalBriefs || 0,
        acceptedBriefs: progress.acceptedBriefs || 0,
        completedBriefs: progress.completedBriefs || 0,
        contentSubmitted: progress.contentSubmitted || 0,
        contentApproved: progress.contentApproved || 0,
        contentPublished: progress.contentPublished || 0,
        completionRate:
          progress.totalBriefs > 0
            ? (progress.completedBriefs / progress.totalBriefs) * 100
            : 0,
        approvalRate:
          progress.contentSubmitted > 0
            ? (progress.contentApproved / progress.contentSubmitted) * 100
            : 0,
      };

      await metricsService.recordMetrics({
        entityType: 'campaign',
        entityId: `${campaignId}:progress`,
        metrics,
        period: 'daily',
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(
        `Failed to get campaign progress for ${campaignId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Aggregate campaign timeline metrics
   */
  async aggregateTimelineMetrics(campaignId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const dailyMetrics = [];

    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, days - i - 1);

      try {
        const response = await axios.get(
          `${config.services.campaign}/api/campaigns/${campaignId}/metrics?date=${date.toISOString()}`,
          { timeout: 5000 }
        );

        dailyMetrics.push({
          date: date.toISOString(),
          ...response.data,
        });
      } catch (error) {
        console.error(`Failed to fetch metrics for ${date}:`, error);
      }
    }

    return dailyMetrics;
  }

  // Helper methods

  private calculateMetrics(
    campaign: any,
    content: any[],
    budget: any
  ): CampaignMetrics {
    const totalContent = content.length;
    const publishedContent = content.filter((c) => c.status === 'published').length;
    const approvedContent = content.filter((c) => c.status === 'approved').length;
    const pendingContent = content.filter((c) => c.status === 'pending').length;

    const totalViews = content.reduce((sum, c) => sum + (c.views || 0), 0);
    const totalEngagements = content.reduce(
      (sum, c) => sum + (c.engagements || 0),
      0
    );
    const totalConversions = content.reduce(
      (sum, c) => sum + (c.conversions || 0),
      0
    );
    const totalRevenue = content.reduce((sum, c) => sum + (c.revenue || 0), 0);

    const totalImpressions = content.reduce(
      (sum, c) => sum + (c.impressions || 0),
      0
    );
    const totalClicks = content.reduce((sum, c) => sum + (c.clicks || 0), 0);

    const averageEngagementRate =
      totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

    const averageConversionRate =
      totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    const budgetSpent = budget.spent || 0;
    const budgetTotal = budget.total || 0;
    const budgetRemaining = budgetTotal - budgetSpent;

    const roi = budgetSpent > 0 ? ((totalRevenue - budgetSpent) / budgetSpent) * 100 : 0;

    return {
      campaignId: campaign.id,
      totalContent,
      publishedContent,
      approvedContent,
      pendingContent,
      totalViews,
      totalEngagements,
      totalConversions,
      totalRevenue,
      averageEngagementRate: Number(averageEngagementRate.toFixed(2)),
      averageConversionRate: Number(averageConversionRate.toFixed(2)),
      roi: Number(roi.toFixed(2)),
      budgetSpent,
      budgetRemaining,
    };
  }

  private async getCreatorContent(campaignId: string, creatorId: string) {
    try {
      const response = await axios.get(
        `${config.services.campaign}/api/campaigns/${campaignId}/creators/${creatorId}/content`,
        { timeout: 5000 }
      );

      return response.data.data || [];
    } catch (error) {
      console.error(
        `Failed to get creator content for ${campaignId}/${creatorId}:`,
        error
      );
      return [];
    }
  }
}

export default new CampaignAggregator();
