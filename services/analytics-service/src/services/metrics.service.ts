import { PrismaClient } from '@prisma/client';
import { startOfHour, startOfDay, startOfWeek, startOfMonth, subDays, subHours } from 'date-fns';
import _ from 'lodash';

const prisma = new PrismaClient();

export interface MetricInput {
  entityType: 'content' | 'campaign' | 'creator' | 'commerce';
  entityId: string;
  metrics: Record<string, any>;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  recordedAt?: Date;
}

export interface MetricQuery {
  entityType: string;
  entityId?: string;
  startDate: Date;
  endDate: Date;
  period?: string;
  metrics?: string[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export interface ComparisonQuery {
  entityType: string;
  entityId: string;
  metric: string;
  currentPeriod: { start: Date; end: Date };
  previousPeriod: { start: Date; end: Date };
}

class MetricsService {
  /**
   * Record metrics for an entity
   */
  async recordMetrics(input: MetricInput) {
    const snapshot = await prisma.metricSnapshot.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        metrics: input.metrics,
        period: input.period,
        recordedAt: input.recordedAt || new Date(),
      },
    });

    return snapshot;
  }

  /**
   * Batch record metrics
   */
  async recordMetricsBatch(inputs: MetricInput[]) {
    const snapshots = await prisma.metricSnapshot.createMany({
      data: inputs.map((input) => ({
        entityType: input.entityType,
        entityId: input.entityId,
        metrics: input.metrics,
        period: input.period,
        recordedAt: input.recordedAt || new Date(),
      })),
    });

    return snapshots;
  }

  /**
   * Get metrics with filtering and aggregation
   */
  async getMetrics(query: MetricQuery) {
    const snapshots = await prisma.metricSnapshot.findMany({
      where: {
        entityType: query.entityType,
        ...(query.entityId && { entityId: query.entityId }),
        ...(query.period && { period: query.period }),
        recordedAt: {
          gte: query.startDate,
          lte: query.endDate,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    if (!query.aggregation) {
      return snapshots;
    }

    // Aggregate metrics
    return this.aggregateMetrics(snapshots, query.metrics, query.aggregation);
  }

  /**
   * Get latest metrics for an entity
   */
  async getLatestMetrics(entityType: string, entityId: string, period?: string) {
    const snapshot = await prisma.metricSnapshot.findFirst({
      where: {
        entityType,
        entityId,
        ...(period && { period }),
      },
      orderBy: { recordedAt: 'desc' },
    });

    return snapshot;
  }

  /**
   * Compare metrics period over period
   */
  async compareMetrics(query: ComparisonQuery) {
    const [currentData, previousData] = await Promise.all([
      this.getMetrics({
        entityType: query.entityType,
        entityId: query.entityId,
        startDate: query.currentPeriod.start,
        endDate: query.currentPeriod.end,
        metrics: [query.metric],
      }),
      this.getMetrics({
        entityType: query.entityType,
        entityId: query.entityId,
        startDate: query.previousPeriod.start,
        endDate: query.previousPeriod.end,
        metrics: [query.metric],
      }),
    ]);

    const currentValue = this.extractMetricValue(currentData, query.metric);
    const previousValue = this.extractMetricValue(previousData, query.metric);

    const change = currentValue - previousValue;
    const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

    return {
      metric: query.metric,
      current: {
        value: currentValue,
        period: query.currentPeriod,
        dataPoints: currentData.length,
      },
      previous: {
        value: previousValue,
        period: query.previousPeriod,
        dataPoints: previousData.length,
      },
      comparison: {
        change,
        changePercent,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      },
    };
  }

  /**
   * Get top performers by metric
   */
  async getTopPerformers(
    entityType: string,
    metric: string,
    options: {
      limit?: number;
      startDate: Date;
      endDate: Date;
      period?: string;
      order?: 'asc' | 'desc';
    }
  ) {
    const snapshots = await prisma.metricSnapshot.findMany({
      where: {
        entityType,
        ...(options.period && { period: options.period }),
        recordedAt: {
          gte: options.startDate,
          lte: options.endDate,
        },
      },
    });

    // Group by entity ID and sum metric values
    const grouped = _.groupBy(snapshots, 'entityId');
    const performers = Object.entries(grouped).map(([entityId, data]) => ({
      entityId,
      value: this.extractMetricValue(data, metric),
      dataPoints: data.length,
    }));

    // Sort and limit
    const sorted = _.orderBy(performers, 'value', options.order || 'desc');
    return sorted.slice(0, options.limit || 10);
  }

  /**
   * Get aggregated metrics by time period
   */
  async getAggregatedByPeriod(
    entityType: string,
    entityId: string,
    metric: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'hour' | 'day' | 'week' | 'month'
  ) {
    const snapshots = await prisma.metricSnapshot.findMany({
      where: {
        entityType,
        entityId,
        recordedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });

    // Group by time period
    const grouped = _.groupBy(snapshots, (s) => {
      const date = new Date(s.recordedAt);
      switch (groupBy) {
        case 'hour':
          return startOfHour(date).toISOString();
        case 'day':
          return startOfDay(date).toISOString();
        case 'week':
          return startOfWeek(date).toISOString();
        case 'month':
          return startOfMonth(date).toISOString();
      }
    });

    return Object.entries(grouped).map(([period, data]) => ({
      period,
      value: this.extractMetricValue(data, metric),
      count: data.length,
    }));
  }

  /**
   * Get metric trends
   */
  async getMetricTrend(
    entityType: string,
    entityId: string,
    metric: string,
    days: number = 30
  ) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const dailyData = await this.getAggregatedByPeriod(
      entityType,
      entityId,
      metric,
      startDate,
      endDate,
      'day'
    );

    // Calculate trend
    const values = dailyData.map((d) => d.value);
    const avg = _.mean(values);
    const trend = this.calculateTrendDirection(values);

    return {
      metric,
      period: { start: startDate, end: endDate },
      data: dailyData,
      summary: {
        average: avg,
        min: _.min(values) || 0,
        max: _.max(values) || 0,
        trend,
      },
    };
  }

  /**
   * Get real-time metrics (last hour)
   */
  async getRealtimeMetrics(entityType: string, entityId: string) {
    const endDate = new Date();
    const startDate = subHours(endDate, 1);

    return this.getMetrics({
      entityType,
      entityId,
      startDate,
      endDate,
      period: 'hourly',
    });
  }

  /**
   * Delete old metrics
   */
  async cleanupOldMetrics(retentionDays: number = 90) {
    const cutoffDate = subDays(new Date(), retentionDays);

    const result = await prisma.metricSnapshot.deleteMany({
      where: {
        recordedAt: {
          lt: cutoffDate,
        },
      },
    });

    return result;
  }

  // Helper methods

  private aggregateMetrics(
    snapshots: any[],
    metrics?: string[],
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' = 'sum'
  ) {
    if (!metrics || metrics.length === 0) {
      return { count: snapshots.length };
    }

    const result: Record<string, number> = {};

    for (const metric of metrics) {
      const values = snapshots
        .map((s) => this.getNestedValue(s.metrics, metric))
        .filter((v) => typeof v === 'number');

      switch (aggregation) {
        case 'sum':
          result[metric] = _.sum(values);
          break;
        case 'avg':
          result[metric] = _.mean(values);
          break;
        case 'min':
          result[metric] = _.min(values) || 0;
          break;
        case 'max':
          result[metric] = _.max(values) || 0;
          break;
        case 'count':
          result[metric] = values.length;
          break;
      }
    }

    return result;
  }

  private extractMetricValue(snapshots: any[], metric: string): number {
    const values = snapshots
      .map((s) => this.getNestedValue(s.metrics, metric))
      .filter((v) => typeof v === 'number');

    return _.sum(values);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private calculateTrendDirection(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = _.mean(firstHalf);
    const secondAvg = _.mean(secondHalf);

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }
}

export default new MetricsService();
