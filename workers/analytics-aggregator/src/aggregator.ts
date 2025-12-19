import pino from 'pino';
import { startOfDay, endOfDay, subDays, subWeeks } from 'date-fns';
import * as stats from 'simple-statistics';
import { TikTokCollector } from './collectors/tiktok-collector';
import { InstagramCollector } from './collectors/instagram-collector';
import { YouTubeCollector } from './collectors/youtube-collector';
import { FacebookCollector } from './collectors/facebook-collector';

const logger = pino();

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'facebook';

export interface MetricsData {
  platform: Platform;
  postId: string;
  metrics: any;
  timestamp: Date;
}

export interface AggregatedMetrics {
  period: 'daily' | 'weekly';
  startDate: Date;
  endDate: Date;
  totalViews: number;
  totalEngagement: number;
  avgEngagementRate: number;
  topPerformingPosts: Array<{
    postId: string;
    platform: Platform;
    engagementRate: number;
  }>;
  platformBreakdown: Record<Platform, any>;
}

export interface AnalyticsReport {
  period: string;
  metrics: AggregatedMetrics;
  insights: string[];
  anomalies: Array<{
    metric: string;
    value: number;
    expected: number;
    deviation: number;
  }>;
  recommendations: string[];
}

export class AnalyticsAggregator {
  private tiktokCollector: TikTokCollector;
  private instagramCollector: InstagramCollector;
  private youtubeCollector: YouTubeCollector;
  private facebookCollector: FacebookCollector;
  private logger = logger.child({ component: 'AnalyticsAggregator' });

  constructor() {
    this.tiktokCollector = new TikTokCollector();
    this.instagramCollector = new InstagramCollector();
    this.youtubeCollector = new YouTubeCollector();
    this.facebookCollector = new FacebookCollector();
  }

  async collectMetrics(
    platform: Platform,
    accessToken: string,
    postId: string
  ): Promise<MetricsData> {
    this.logger.info({ platform, postId }, 'Collecting metrics');

    let metrics: any;

    try {
      switch (platform) {
        case 'tiktok':
          metrics = await this.tiktokCollector.collectMetrics(
            accessToken,
            postId
          );
          break;
        case 'instagram':
          metrics = await this.instagramCollector.collectMetrics(
            accessToken,
            postId
          );
          break;
        case 'youtube':
          metrics = await this.youtubeCollector.collectMetrics(
            accessToken,
            postId
          );
          break;
        case 'facebook':
          metrics = await this.facebookCollector.collectMetrics(
            accessToken,
            postId
          );
          break;
        default:
          throw new Error(`Unknown platform: ${platform}`);
      }

      return {
        platform,
        postId,
        metrics,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error({ error, platform, postId }, 'Failed to collect metrics');
      throw error;
    }
  }

  async aggregateDaily(
    metricsData: MetricsData[]
  ): Promise<AggregatedMetrics> {
    this.logger.info({ count: metricsData.length }, 'Aggregating daily metrics');

    const today = new Date();
    const startDate = startOfDay(today);
    const endDate = endOfDay(today);

    return this.aggregate(metricsData, 'daily', startDate, endDate);
  }

  async aggregateWeekly(
    metricsData: MetricsData[]
  ): Promise<AggregatedMetrics> {
    this.logger.info(
      { count: metricsData.length },
      'Aggregating weekly metrics'
    );

    const today = new Date();
    const startDate = startOfDay(subWeeks(today, 1));
    const endDate = endOfDay(today);

    return this.aggregate(metricsData, 'weekly', startDate, endDate);
  }

  private aggregate(
    metricsData: MetricsData[],
    period: 'daily' | 'weekly',
    startDate: Date,
    endDate: Date
  ): AggregatedMetrics {
    // Filter data for the period
    const filteredData = metricsData.filter(
      (data) => data.timestamp >= startDate && data.timestamp <= endDate
    );

    // Calculate totals
    let totalViews = 0;
    let totalEngagement = 0;

    const platformBreakdown: Record<string, any> = {
      tiktok: { views: 0, engagement: 0, count: 0 },
      instagram: { views: 0, engagement: 0, count: 0 },
      youtube: { views: 0, engagement: 0, count: 0 },
      facebook: { views: 0, engagement: 0, count: 0 },
    };

    const postEngagement: Array<{
      postId: string;
      platform: Platform;
      views: number;
      engagement: number;
      engagementRate: number;
    }> = [];

    filteredData.forEach((data) => {
      const views = this.extractViews(data);
      const engagement = this.extractEngagement(data);

      totalViews += views;
      totalEngagement += engagement;

      platformBreakdown[data.platform].views += views;
      platformBreakdown[data.platform].engagement += engagement;
      platformBreakdown[data.platform].count += 1;

      postEngagement.push({
        postId: data.postId,
        platform: data.platform,
        views,
        engagement,
        engagementRate: views > 0 ? (engagement / views) * 100 : 0,
      });
    });

    // Calculate average engagement rate
    const avgEngagementRate =
      totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    // Get top performing posts
    const topPerformingPosts = postEngagement
      .sort((a, b) => b.engagementRate - a.engagementRate)
      .slice(0, 10)
      .map((post) => ({
        postId: post.postId,
        platform: post.platform,
        engagementRate: post.engagementRate,
      }));

    return {
      period,
      startDate,
      endDate,
      totalViews,
      totalEngagement,
      avgEngagementRate,
      topPerformingPosts,
      platformBreakdown,
    };
  }

  private extractViews(data: MetricsData): number {
    switch (data.platform) {
      case 'tiktok':
        return data.metrics.views || 0;
      case 'instagram':
        return data.metrics.videoViews || 0;
      case 'youtube':
        return data.metrics.views || 0;
      case 'facebook':
        return data.metrics.videoViews || 0;
      default:
        return 0;
    }
  }

  private extractEngagement(data: MetricsData): number {
    const metrics = data.metrics;

    switch (data.platform) {
      case 'tiktok':
        return (
          (metrics.likes || 0) +
          (metrics.comments || 0) +
          (metrics.shares || 0)
        );
      case 'instagram':
        return (
          (metrics.likes || 0) +
          (metrics.comments || 0) +
          (metrics.shares || 0) +
          (metrics.saves || 0)
        );
      case 'youtube':
        return (metrics.likes || 0) + (metrics.comments || 0);
      case 'facebook':
        return (
          (metrics.reactions || 0) +
          (metrics.comments || 0) +
          (metrics.shares || 0)
        );
      default:
        return 0;
    }
  }

  calculateEngagementRate(views: number, engagement: number): number {
    return views > 0 ? (engagement / views) * 100 : 0;
  }

  detectAnomalies(
    currentMetrics: MetricsData[],
    historicalMetrics: MetricsData[]
  ): Array<{ metric: string; value: number; expected: number; deviation: number }> {
    this.logger.info('Detecting anomalies');

    const anomalies: Array<{
      metric: string;
      value: number;
      expected: number;
      deviation: number;
    }> = [];

    // Calculate historical averages and standard deviations
    const historicalViews = historicalMetrics.map((m) => this.extractViews(m));
    const historicalEngagement = historicalMetrics.map((m) =>
      this.extractEngagement(m)
    );

    if (historicalViews.length < 2) {
      return anomalies; // Not enough data
    }

    const avgViews = stats.mean(historicalViews);
    const stdViews = stats.standardDeviation(historicalViews);

    const avgEngagement = stats.mean(historicalEngagement);
    const stdEngagement = stats.standardDeviation(historicalEngagement);

    // Check current metrics against historical
    currentMetrics.forEach((data) => {
      const views = this.extractViews(data);
      const engagement = this.extractEngagement(data);

      // Check if views are anomalous (> 2 std deviations)
      const viewsDeviation = Math.abs(views - avgViews) / stdViews;
      if (viewsDeviation > 2) {
        anomalies.push({
          metric: 'views',
          value: views,
          expected: avgViews,
          deviation: viewsDeviation,
        });
      }

      // Check if engagement is anomalous
      const engagementDeviation =
        Math.abs(engagement - avgEngagement) / stdEngagement;
      if (engagementDeviation > 2) {
        anomalies.push({
          metric: 'engagement',
          value: engagement,
          expected: avgEngagement,
          deviation: engagementDeviation,
        });
      }
    });

    return anomalies;
  }

  generateReport(
    aggregatedMetrics: AggregatedMetrics,
    anomalies: Array<{
      metric: string;
      value: number;
      expected: number;
      deviation: number;
    }>
  ): AnalyticsReport {
    this.logger.info('Generating report');

    const insights: string[] = [];
    const recommendations: string[] = [];

    // Generate insights
    insights.push(
      `Total views: ${aggregatedMetrics.totalViews.toLocaleString()}`
    );
    insights.push(
      `Total engagement: ${aggregatedMetrics.totalEngagement.toLocaleString()}`
    );
    insights.push(
      `Average engagement rate: ${aggregatedMetrics.avgEngagementRate.toFixed(2)}%`
    );

    // Platform breakdown insights
    Object.entries(aggregatedMetrics.platformBreakdown).forEach(
      ([platform, data]) => {
        if (data.count > 0) {
          const avgViews = data.views / data.count;
          const avgEngagement = data.engagement / data.count;
          insights.push(
            `${platform}: ${avgViews.toFixed(0)} avg views, ${avgEngagement.toFixed(0)} avg engagement`
          );
        }
      }
    );

    // Generate recommendations
    if (aggregatedMetrics.avgEngagementRate < 5) {
      recommendations.push(
        'Engagement rate is below 5%. Consider improving content quality or posting at peak times.'
      );
    }

    if (anomalies.length > 0) {
      recommendations.push(
        `Detected ${anomalies.length} anomalies. Review recent posts for unusual patterns.`
      );
    }

    // Identify best performing platform
    const bestPlatform = Object.entries(aggregatedMetrics.platformBreakdown)
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => {
        const rateA = (a[1].engagement / a[1].views) * 100;
        const rateB = (b[1].engagement / b[1].views) * 100;
        return rateB - rateA;
      })[0];

    if (bestPlatform) {
      recommendations.push(
        `${bestPlatform[0]} has the highest engagement rate. Consider posting more content there.`
      );
    }

    return {
      period: `${aggregatedMetrics.period} (${aggregatedMetrics.startDate.toISOString()} - ${aggregatedMetrics.endDate.toISOString()})`,
      metrics: aggregatedMetrics,
      insights,
      anomalies,
      recommendations,
    };
  }
}
