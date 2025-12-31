import { PrismaClient } from '.prisma/analytics-service-client';
import metricsService from './metrics.service';
import { subDays, subHours } from 'date-fns';
import _ from 'lodash';

const prisma = new PrismaClient();

export interface DashboardInput {
  userId?: string;
  brandId?: string;
  name: string;
  description?: string;
  widgets: any[];
  layout: any;
  isDefault?: boolean;
  isPublic?: boolean;
  settings?: any;
}

export interface WidgetConfig {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'list' | 'heatmap';
  title: string;
  entityType?: string;
  entityId?: string;
  metric?: string;
  timeRange?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  filters?: any;
}

class DashboardService {
  /**
   * Create a new dashboard
   */
  async createDashboard(input: DashboardInput) {
    const dashboard = await prisma.dashboard.create({
      data: {
        userId: input.userId,
        brandId: input.brandId,
        name: input.name,
        description: input.description,
        widgets: input.widgets,
        layout: input.layout,
        isDefault: input.isDefault || false,
        isPublic: input.isPublic || false,
        settings: input.settings || {},
      },
    });

    return dashboard;
  }

  /**
   * Update dashboard
   */
  async updateDashboard(id: string, updates: Partial<DashboardInput>) {
    const dashboard = await prisma.dashboard.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.widgets && { widgets: updates.widgets }),
        ...(updates.layout && { layout: updates.layout }),
        ...(updates.isDefault !== undefined && { isDefault: updates.isDefault }),
        ...(updates.isPublic !== undefined && { isPublic: updates.isPublic }),
        ...(updates.settings && { settings: updates.settings }),
      },
    });

    return dashboard;
  }

  /**
   * Get dashboard by ID
   */
  async getDashboard(id: string) {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id },
    });

    return dashboard;
  }

  /**
   * List dashboards
   */
  async listDashboards(filters: {
    userId?: string;
    brandId?: string;
    isDefault?: boolean;
    isPublic?: boolean;
  }) {
    const dashboards = await prisma.dashboard.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.brandId && { brandId: filters.brandId }),
        ...(filters.isDefault !== undefined && { isDefault: filters.isDefault }),
        ...(filters.isPublic !== undefined && { isPublic: filters.isPublic }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return dashboards;
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(id: string) {
    await prisma.dashboard.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Get dashboard data with widget calculations
   */
  async getDashboardData(dashboardId: string) {
    const dashboard = await this.getDashboard(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    const widgets = (dashboard.widgets as unknown) as WidgetConfig[];
    const widgetData = await Promise.all(
      widgets.map((widget) => this.calculateWidgetData(widget))
    );

    return {
      dashboard: {
        id: dashboard.id,
        name: dashboard.name,
        description: dashboard.description,
        layout: dashboard.layout,
        settings: dashboard.settings,
      },
      widgets: widgetData,
      generatedAt: new Date(),
    };
  }

  /**
   * Get unified cross-platform dashboard
   */
  async getUnifiedDashboard(filters: {
    userId?: string;
    brandId?: string;
    timeRange?: string;
  }) {
    const timeRange = this.parseTimeRange(filters.timeRange || '7d');

    // Fetch data from all entity types
    const [contentMetrics, campaignMetrics, creatorMetrics, commerceMetrics] =
      await Promise.all([
        this.getEntityOverview('content', timeRange),
        this.getEntityOverview('campaign', timeRange),
        this.getEntityOverview('creator', timeRange),
        this.getEntityOverview('commerce', timeRange),
      ]);

    return {
      overview: {
        content: contentMetrics,
        campaigns: campaignMetrics,
        creators: creatorMetrics,
        commerce: commerceMetrics,
      },
      timeRange,
      generatedAt: new Date(),
    };
  }

  /**
   * Export dashboard configuration
   */
  async exportDashboard(dashboardId: string) {
    const dashboard = await this.getDashboard(dashboardId);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }

    return {
      version: '1.0',
      exportedAt: new Date(),
      dashboard: {
        name: dashboard.name,
        description: dashboard.description,
        widgets: dashboard.widgets,
        layout: dashboard.layout,
        settings: dashboard.settings,
      },
    };
  }

  /**
   * Import dashboard configuration
   */
  async importDashboard(
    config: any,
    options: { userId?: string; brandId?: string }
  ) {
    const dashboard = await this.createDashboard({
      userId: options.userId,
      brandId: options.brandId,
      name: config.dashboard.name,
      description: config.dashboard.description,
      widgets: config.dashboard.widgets,
      layout: config.dashboard.layout,
      settings: config.dashboard.settings,
    });

    return dashboard;
  }

  /**
   * Clone dashboard
   */
  async cloneDashboard(
    dashboardId: string,
    options: { userId?: string; brandId?: string; name?: string }
  ) {
    const original = await this.getDashboard(dashboardId);
    if (!original) {
      throw new Error('Dashboard not found');
    }

    const cloned = await this.createDashboard({
      userId: options.userId || original.userId || undefined,
      brandId: options.brandId || original.brandId || undefined,
      name: options.name || `${original.name} (Copy)`,
      description: original.description || undefined,
      widgets: original.widgets as any[],
      layout: original.layout,
      settings: original.settings || undefined,
    });

    return cloned;
  }

  // Helper methods

  private async calculateWidgetData(widget: WidgetConfig) {
    const timeRange = this.parseTimeRange(widget.timeRange || '7d');

    switch (widget.type) {
      case 'metric':
        return this.calculateMetricWidget(widget, timeRange);
      case 'chart':
        return this.calculateChartWidget(widget, timeRange);
      case 'table':
        return this.calculateTableWidget(widget, timeRange);
      case 'list':
        return this.calculateListWidget(widget, timeRange);
      default:
        return { id: widget.id, type: widget.type, data: null };
    }
  }

  private async calculateMetricWidget(widget: WidgetConfig, timeRange: any) {
    if (!widget.entityType || !widget.metric) {
      return { id: widget.id, type: 'metric', data: null };
    }

    const snapshots = await metricsService.getMetrics({
      entityType: widget.entityType,
      entityId: widget.entityId,
      startDate: timeRange.start,
      endDate: timeRange.end,
      metrics: [widget.metric],
      aggregation: 'sum',
    });

    const value = (snapshots as Record<string, number>)[widget.metric] || 0;

    // Get comparison with previous period
    const previousRange = this.getPreviousPeriod(timeRange);
    const previousSnapshots = await metricsService.getMetrics({
      entityType: widget.entityType,
      entityId: widget.entityId,
      startDate: previousRange.start,
      endDate: previousRange.end,
      metrics: [widget.metric],
      aggregation: 'sum',
    });

    const previousValue = (previousSnapshots as Record<string, number>)[widget.metric] || 0;
    const change = value - previousValue;
    const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

    return {
      id: widget.id,
      type: 'metric',
      title: widget.title,
      data: {
        value,
        change,
        changePercent,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      },
    };
  }

  private async calculateChartWidget(widget: WidgetConfig, timeRange: any) {
    if (!widget.entityType || !widget.metric) {
      return { id: widget.id, type: 'chart', data: null };
    }

    const data = await metricsService.getAggregatedByPeriod(
      widget.entityType,
      widget.entityId || '',
      widget.metric,
      timeRange.start,
      timeRange.end,
      'day'
    );

    return {
      id: widget.id,
      type: 'chart',
      title: widget.title,
      chartType: widget.chartType || 'line',
      data: data.map((d) => ({
        date: d.period,
        value: d.value,
      })),
    };
  }

  private async calculateTableWidget(widget: WidgetConfig, timeRange: any) {
    if (!widget.entityType) {
      return { id: widget.id, type: 'table', data: null };
    }

    const snapshots = await metricsService.getMetrics({
      entityType: widget.entityType,
      startDate: timeRange.start,
      endDate: timeRange.end,
    });

    return {
      id: widget.id,
      type: 'table',
      title: widget.title,
      data: (Array.isArray(snapshots) ? snapshots : []).slice(0, 10), // Limit to 10 rows
    };
  }

  private async calculateListWidget(widget: WidgetConfig, timeRange: any) {
    if (!widget.entityType || !widget.metric) {
      return { id: widget.id, type: 'list', data: null };
    }

    const topPerformers = await metricsService.getTopPerformers(
      widget.entityType,
      widget.metric,
      {
        startDate: timeRange.start,
        endDate: timeRange.end,
        limit: 5,
      }
    );

    return {
      id: widget.id,
      type: 'list',
      title: widget.title,
      data: topPerformers,
    };
  }

  private async getEntityOverview(entityType: string, timeRange: any) {
    const snapshots = await metricsService.getMetrics({
      entityType,
      startDate: timeRange.start,
      endDate: timeRange.end,
    });

    const uniqueEntities = _.uniqBy(Array.isArray(snapshots) ? snapshots : [], 'entityId').length;

    return {
      totalEntities: uniqueEntities,
      totalDataPoints: Array.isArray(snapshots) ? snapshots.length : 0,
    };
  }

  private parseTimeRange(range: string): { start: Date; end: Date } {
    const end = new Date();
    let start: Date;

    if (range.endsWith('h')) {
      const hours = parseInt(range.slice(0, -1), 10);
      start = subHours(end, hours);
    } else if (range.endsWith('d')) {
      const days = parseInt(range.slice(0, -1), 10);
      start = subDays(end, days);
    } else {
      start = subDays(end, 7); // Default to 7 days
    }

    return { start, end };
  }

  private getPreviousPeriod(timeRange: {
    start: Date;
    end: Date;
  }): { start: Date; end: Date } {
    const duration = timeRange.end.getTime() - timeRange.start.getTime();
    return {
      start: new Date(timeRange.start.getTime() - duration),
      end: timeRange.start,
    };
  }
}

export default new DashboardService();
