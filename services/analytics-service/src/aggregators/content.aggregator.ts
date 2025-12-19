import metricsService from '../services/metrics.service';
import axios from 'axios';
import config from '../config';
import { subHours, subDays } from 'date-fns';

export interface ContentMetrics {
  contentId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
  clickThroughRate: number;
  conversionRate: number;
  revenue: number;
  reach: number;
  impressions: number;
}

class ContentAggregator {
  /**
   * Aggregate content metrics from content service
   */
  async aggregateContentMetrics(contentId: string, period: 'hourly' | 'daily' = 'hourly') {
    try {
      // Fetch content data from content service
      const response = await axios.get(
        `${config.services.content}/api/content/${contentId}/metrics`,
        { timeout: 5000 }
      );

      const data = response.data;

      // Calculate derived metrics
      const metrics = this.calculateMetrics(data);

      // Record metrics
      await metricsService.recordMetrics({
        entityType: 'content',
        entityId: contentId,
        metrics,
        period,
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(`Failed to aggregate content metrics for ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Aggregate metrics for all active content
   */
  async aggregateAllContent(period: 'hourly' | 'daily' = 'hourly') {
    try {
      // Get list of active content from content service
      const response = await axios.get(
        `${config.services.content}/api/content?status=published`,
        { timeout: 10000 }
      );

      const contents = response.data.data || [];

      // Aggregate metrics for each content piece
      const results = await Promise.allSettled(
        contents.map((content: any) =>
          this.aggregateContentMetrics(content.id, period)
        )
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        total: contents.length,
        successful,
        failed,
      };
    } catch (error) {
      console.error('Failed to aggregate all content:', error);
      throw error;
    }
  }

  /**
   * Aggregate platform-specific metrics
   */
  async aggregatePlatformMetrics(contentId: string, platformId: string) {
    try {
      const response = await axios.get(
        `${config.services.content}/api/content/${contentId}/platforms/${platformId}/metrics`,
        { timeout: 5000 }
      );

      const data = response.data;

      // Platform-specific metrics
      const metrics = {
        platform: platformId,
        ...this.calculateMetrics(data),
        platformSpecific: data.platformSpecific || {},
      };

      // Record with platform-specific entity ID
      await metricsService.recordMetrics({
        entityType: 'content',
        entityId: `${contentId}:${platformId}`,
        metrics,
        period: 'hourly',
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(
        `Failed to aggregate platform metrics for ${contentId}/${platformId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Aggregate real-time metrics
   */
  async aggregateRealtimeMetrics(contentId: string) {
    const endDate = new Date();
    const startDate = subHours(endDate, 1);

    try {
      const response = await axios.get(
        `${config.services.content}/api/content/${contentId}/metrics/realtime`,
        { timeout: 5000 }
      );

      const data = response.data;

      const metrics = {
        ...this.calculateMetrics(data),
        realtime: true,
        timestamp: new Date(),
      };

      await metricsService.recordMetrics({
        entityType: 'content',
        entityId: contentId,
        metrics,
        period: 'hourly',
        recordedAt: new Date(),
      });

      return metrics;
    } catch (error) {
      console.error(`Failed to aggregate realtime metrics for ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate performance score
   */
  async calculatePerformanceScore(contentId: string, days: number = 7) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const snapshots = await metricsService.getMetrics({
      entityType: 'content',
      entityId: contentId,
      startDate,
      endDate,
    });

    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      return 0;
    }

    // Calculate weighted score based on various metrics
    let totalScore = 0;
    let count = 0;

    for (const snapshot of snapshots) {
      const metrics = snapshot.metrics;

      const score =
        (metrics.engagementRate || 0) * 0.3 +
        (metrics.clickThroughRate || 0) * 0.2 +
        (metrics.conversionRate || 0) * 0.3 +
        (metrics.reach || 0) / 1000 * 0.2;

      totalScore += score;
      count++;
    }

    return count > 0 ? totalScore / count : 0;
  }

  // Helper methods

  private calculateMetrics(data: any): ContentMetrics {
    const views = data.views || 0;
    const likes = data.likes || 0;
    const comments = data.comments || 0;
    const shares = data.shares || 0;
    const saves = data.saves || 0;
    const clicks = data.clicks || 0;
    const conversions = data.conversions || 0;
    const impressions = data.impressions || 0;
    const reach = data.reach || 0;
    const revenue = data.revenue || 0;

    // Calculate engagement rate
    const totalEngagements = likes + comments + shares + saves;
    const engagementRate = impressions > 0 ? (totalEngagements / impressions) * 100 : 0;

    // Calculate CTR
    const clickThroughRate = impressions > 0 ? (clicks / impressions) * 100 : 0;

    // Calculate conversion rate
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

    return {
      contentId: data.contentId || data.id,
      views,
      likes,
      comments,
      shares,
      saves,
      engagementRate: Number(engagementRate.toFixed(2)),
      clickThroughRate: Number(clickThroughRate.toFixed(2)),
      conversionRate: Number(conversionRate.toFixed(2)),
      revenue,
      reach,
      impressions,
    };
  }
}

export default new ContentAggregator();
