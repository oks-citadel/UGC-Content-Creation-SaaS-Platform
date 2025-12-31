import { PrismaClient } from '.prisma/analytics-service-client';
import { subDays } from 'date-fns';
import { linearRegression } from 'simple-statistics';
import metricsService from './metrics.service';

const prisma = new PrismaClient();

export interface FatigueAnalysis {
  contentId: string;
  platformId: string;
  fatigueScore: number;
  performanceTrend: 'declining' | 'stable' | 'improving';
  recommendation: 'refresh' | 'retire' | 'boost' | 'continue';
  metrics: any;
}

class FatigueService {
  /**
   * Detect creative fatigue for content
   */
  async detectCreativeFatigue(
    contentId: string,
    platformId: string,
    options: {
      lookbackDays?: number;
      threshold?: number;
    } = {}
  ): Promise<FatigueAnalysis> {
    const lookbackDays = options.lookbackDays || 30;
    const threshold = options.threshold || 70.0;

    // Get historical performance data
    const endDate = new Date();
    const startDate = subDays(endDate, lookbackDays);

    const metrics = await metricsService.getAggregatedByPeriod(
      'content',
      contentId,
      'engagement.rate',
      startDate,
      endDate,
      'day'
    );

    if (!metrics || metrics.length < 7) {
      throw new Error('Not enough data to detect creative fatigue');
    }

    // Calculate performance trend
    const trend = this.calculatePerformanceTrend(metrics);

    // Calculate fatigue score (0-100)
    const fatigueScore = this.calculateFatigueScore(metrics, trend);

    // Determine recommendation
    const recommendation = this.getRecommendation(fatigueScore, trend, threshold);

    // Check if fatigue record exists
    const existing = await prisma.creativeFatigue.findFirst({
      where: { contentId, platformId },
      orderBy: { detectedAt: 'desc' },
    });

    let fatigueRecord;

    if (existing && subDays(new Date(), 1) < existing.detectedAt) {
      // Update existing record if less than 1 day old
      fatigueRecord = await prisma.creativeFatigue.update({
        where: { id: existing.id },
        data: {
          fatigueScore,
          performanceTrend: trend,
          recommendation,
          metrics: { historical: metrics },
        },
      });
    } else {
      // Create new record
      fatigueRecord = await prisma.creativeFatigue.create({
        data: {
          contentId,
          platformId,
          fatigueScore,
          performanceTrend: trend,
          recommendation,
          metrics: { historical: metrics },
          threshold,
        },
      });
    }

    return {
      contentId,
      platformId,
      fatigueScore,
      performanceTrend: trend,
      recommendation,
      metrics: { historical: metrics },
    };
  }

  /**
   * Get performance trend analysis
   */
  async getPerformanceTrend(
    contentId: string,
    platformId: string,
    metric: string = 'engagement.rate',
    days: number = 30
  ) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const data = await metricsService.getAggregatedByPeriod(
      'content',
      contentId,
      metric,
      startDate,
      endDate,
      'day'
    );

    if (!data || data.length < 2) {
      return {
        trend: 'stable' as const,
        slope: 0,
        confidence: 0,
        dataPoints: data?.length || 0,
      };
    }

    // Convert to regression format
    const points: [number, number][] = data.map((d, i) => [i, d.value]);

    // Calculate linear regression
    const regression = linearRegression(points);

    // Determine trend based on slope
    const slope = regression.m;
    const trend =
      Math.abs(slope) < 0.1 ? 'stable' : slope > 0 ? 'improving' : 'declining';

    return {
      trend,
      slope,
      confidence: this.calculateConfidence(data),
      dataPoints: data.length,
      data,
    };
  }

  /**
   * Recommend content refresh
   */
  async recommendRefresh(filters: {
    brandId?: string;
    platformId?: string;
    minFatigueScore?: number;
  }) {
    const fatigueRecords = await prisma.creativeFatigue.findMany({
      where: {
        ...(filters.platformId && { platformId: filters.platformId }),
        fatigueScore: {
          gte: filters.minFatigueScore || 70,
        },
        recommendation: {
          in: ['refresh', 'retire'],
        },
      },
      orderBy: { fatigueScore: 'desc' },
      take: 20,
    });

    return fatigueRecords.map((record) => ({
      contentId: record.contentId,
      platformId: record.platformId,
      fatigueScore: record.fatigueScore,
      recommendation: record.recommendation,
      detectedAt: record.detectedAt,
    }));
  }

  /**
   * Get fatigue history
   */
  async getFatigueHistory(contentId: string, platformId: string, days: number = 90) {
    const startDate = subDays(new Date(), days);

    const history = await prisma.creativeFatigue.findMany({
      where: {
        contentId,
        platformId,
        detectedAt: {
          gte: startDate,
        },
      },
      orderBy: { detectedAt: 'asc' },
    });

    return history;
  }

  /**
   * Mark action taken on fatigued content
   */
  async markActionTaken(
    id: string,
    action: 'refreshed' | 'retired' | 'boosted' | 'ignored'
  ) {
    const record = await prisma.creativeFatigue.update({
      where: { id },
      data: { actionTaken: action },
    });

    return record;
  }

  /**
   * Get all fatigued content
   */
  async getFatiguedContent(filters: {
    platformId?: string;
    minScore?: number;
    recommendation?: string;
    actionTaken?: string;
    limit?: number;
  }) {
    const records = await prisma.creativeFatigue.findMany({
      where: {
        ...(filters.platformId && { platformId: filters.platformId }),
        ...(filters.minScore && { fatigueScore: { gte: filters.minScore } }),
        ...(filters.recommendation && { recommendation: filters.recommendation }),
        ...(filters.actionTaken !== undefined && {
          actionTaken: filters.actionTaken || null,
        }),
      },
      orderBy: { fatigueScore: 'desc' },
      take: filters.limit || 50,
    });

    return records;
  }

  /**
   * Delete old fatigue records
   */
  async cleanupOldRecords(retentionDays: number = 90) {
    const cutoffDate = subDays(new Date(), retentionDays);

    const result = await prisma.creativeFatigue.deleteMany({
      where: {
        detectedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result;
  }

  // Helper methods

  private calculatePerformanceTrend(
    metrics: Array<{ period: string; value: number }>
  ): 'declining' | 'stable' | 'improving' {
    if (metrics.length < 2) return 'stable';

    // Calculate trend using linear regression
    const points: [number, number][] = metrics.map((m, i) => [i, m.value]);
    const regression = linearRegression(points);

    const slope = regression.m;

    // Determine trend
    if (Math.abs(slope) < 0.1) return 'stable';
    return slope > 0 ? 'improving' : 'declining';
  }

  private calculateFatigueScore(
    metrics: Array<{ period: string; value: number }>,
    trend: 'declining' | 'stable' | 'improving'
  ): number {
    if (metrics.length < 2) return 0;

    // Calculate various fatigue indicators
    const recentPeriod = metrics.slice(-7);
    const olderPeriod = metrics.slice(0, 7);

    const recentAvg = this.average(recentPeriod.map((m) => m.value));
    const olderAvg = this.average(olderPeriod.map((m) => m.value));

    // Calculate performance decline
    const decline = olderAvg > 0 ? ((olderAvg - recentAvg) / olderAvg) * 100 : 0;

    // Calculate volatility
    const volatility = this.calculateVolatility(metrics.map((m) => m.value));

    // Base score on decline
    let score = Math.max(0, Math.min(100, decline));

    // Adjust for trend
    if (trend === 'declining') {
      score += 20;
    } else if (trend === 'improving') {
      score -= 20;
    }

    // Adjust for volatility (high volatility might indicate fatigue)
    score += volatility * 10;

    return Math.max(0, Math.min(100, score));
  }

  private getRecommendation(
    fatigueScore: number,
    trend: 'declining' | 'stable' | 'improving',
    threshold: number
  ): 'refresh' | 'retire' | 'boost' | 'continue' {
    if (fatigueScore >= threshold + 20) {
      return 'retire';
    } else if (fatigueScore >= threshold) {
      return 'refresh';
    } else if (trend === 'declining' && fatigueScore >= threshold - 20) {
      return 'boost';
    } else {
      return 'continue';
    }
  }

  private calculateConfidence(metrics: Array<{ period: string; value: number }>): number {
    // Simple confidence based on data points and consistency
    const dataPointsScore = Math.min(metrics.length / 30, 1) * 50;

    const values = metrics.map((m) => m.value);
    const volatility = this.calculateVolatility(values);
    const consistencyScore = Math.max(0, 50 - volatility * 50);

    return dataPointsScore + consistencyScore;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const avg = this.average(values);
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return avg > 0 ? stdDev / avg : 0;
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}

export default new FatigueService();
