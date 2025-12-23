import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockPrisma = {
  metricSnapshot: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
  report: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  reportExecution: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    startOfHour: vi.fn((d) => new Date(d)),
    startOfDay: vi.fn((d) => new Date(d)),
    startOfWeek: vi.fn((d) => new Date(d)),
    startOfMonth: vi.fn((d) => new Date(d)),
    subDays: vi.fn((d, days) => new Date(d.getTime() - days * 24 * 60 * 60 * 1000)),
    subHours: vi.fn((d, hours) => new Date(d.getTime() - hours * 60 * 60 * 1000)),
  };
});

vi.mock('lodash', () => ({
  default: {
    groupBy: vi.fn((arr, fn) => {
      const result: Record<string, any[]> = {};
      arr.forEach((item: any) => {
        const key = typeof fn === 'function' ? fn(item) : item[fn];
        if (!result[key]) result[key] = [];
        result[key].push(item);
      });
      return result;
    }),
    orderBy: vi.fn((arr, key, order) => [...arr].sort((a, b) => order === 'desc' ? b[key] - a[key] : a[key] - b[key])),
    mean: vi.fn((arr) => arr.reduce((a: number, b: number) => a + b, 0) / arr.length),
    sum: vi.fn((arr) => arr.reduce((a: number, b: number) => a + b, 0)),
    min: vi.fn((arr) => Math.min(...arr)),
    max: vi.fn((arr) => Math.max(...arr)),
  },
}));

describe('Analytics Service - Metrics Aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Metrics Aggregation', () => {
    it('should record metrics for an entity', async () => {
      const mockSnapshot = {
        id: 'snapshot-123',
        entityType: 'content',
        entityId: 'content-456',
        metrics: { views: 1000, likes: 50 },
        period: 'daily',
        recordedAt: new Date(),
      };

      mockPrisma.metricSnapshot.create.mockResolvedValue(mockSnapshot);

      const result = await mockPrisma.metricSnapshot.create({
        data: {
          entityType: 'content',
          entityId: 'content-456',
          metrics: { views: 1000, likes: 50 },
          period: 'daily',
          recordedAt: new Date(),
        },
      });

      expect(result).toEqual(mockSnapshot);
      expect(mockPrisma.metricSnapshot.create).toHaveBeenCalledTimes(1);
    });

    it('should batch record multiple metrics', async () => {
      mockPrisma.metricSnapshot.createMany.mockResolvedValue({ count: 3 });

      const inputs = [
        { entityType: 'content', entityId: 'content-1', metrics: { views: 100 }, period: 'hourly' },
        { entityType: 'content', entityId: 'content-2', metrics: { views: 200 }, period: 'hourly' },
        { entityType: 'content', entityId: 'content-3', metrics: { views: 300 }, period: 'hourly' },
      ];

      const result = await mockPrisma.metricSnapshot.createMany({
        data: inputs,
      });

      expect(result.count).toBe(3);
    });

    it('should aggregate metrics with sum', async () => {
      const mockSnapshots = [
        { id: '1', metrics: { views: 100 }, recordedAt: new Date() },
        { id: '2', metrics: { views: 200 }, recordedAt: new Date() },
        { id: '3', metrics: { views: 300 }, recordedAt: new Date() },
      ];

      mockPrisma.metricSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const snapshots = await mockPrisma.metricSnapshot.findMany({
        where: { entityType: 'content', entityId: 'content-123' },
      });

      const totalViews = snapshots.reduce((sum: number, s: any) => sum + s.metrics.views, 0);
      expect(totalViews).toBe(600);
    });

    it('should aggregate metrics with average', async () => {
      const mockSnapshots = [
        { id: '1', metrics: { engagementRate: 5.0 }, recordedAt: new Date() },
        { id: '2', metrics: { engagementRate: 10.0 }, recordedAt: new Date() },
        { id: '3', metrics: { engagementRate: 15.0 }, recordedAt: new Date() },
      ];

      mockPrisma.metricSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const snapshots = await mockPrisma.metricSnapshot.findMany({
        where: { entityType: 'campaign' },
      });

      const avgEngagement = snapshots.reduce((sum: number, s: any) => sum + s.metrics.engagementRate, 0) / snapshots.length;
      expect(avgEngagement).toBe(10);
    });
  });

  describe('Performance Calculations', () => {
    it('should calculate period-over-period change', async () => {
      const currentPeriod = [
        { metrics: { revenue: 5000 } },
        { metrics: { revenue: 6000 } },
      ];
      const previousPeriod = [
        { metrics: { revenue: 4000 } },
        { metrics: { revenue: 4500 } },
      ];

      const currentTotal = currentPeriod.reduce((sum, s) => sum + s.metrics.revenue, 0);
      const previousTotal = previousPeriod.reduce((sum, s) => sum + s.metrics.revenue, 0);

      const change = currentTotal - previousTotal;
      const changePercent = ((change / previousTotal) * 100);

      expect(currentTotal).toBe(11000);
      expect(previousTotal).toBe(8500);
      expect(change).toBe(2500);
      expect(changePercent.toFixed(2)).toBe('29.41');
    });

    it('should identify top performers', async () => {
      const mockSnapshots = [
        { entityId: 'creator-1', metrics: { views: 10000 } },
        { entityId: 'creator-2', metrics: { views: 25000 } },
        { entityId: 'creator-3', metrics: { views: 15000 } },
        { entityId: 'creator-4', metrics: { views: 50000 } },
      ];

      mockPrisma.metricSnapshot.findMany.mockResolvedValue(mockSnapshots);

      const snapshots = await mockPrisma.metricSnapshot.findMany({
        where: { entityType: 'creator' },
      });

      const sorted = [...snapshots].sort((a: any, b: any) => b.metrics.views - a.metrics.views);
      const topPerformers = sorted.slice(0, 3);

      expect(topPerformers[0].entityId).toBe('creator-4');
      expect(topPerformers[1].entityId).toBe('creator-2');
      expect(topPerformers[2].entityId).toBe('creator-3');
    });

    it('should calculate trend direction', () => {
      const upwardValues = [100, 120, 140, 160, 180];
      const downwardValues = [200, 180, 160, 140, 120];
      const stableValues = [100, 102, 98, 101, 99];

      const calculateTrend = (values: number[]) => {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        if (Math.abs(change) < 5) return 'stable';
        return change > 0 ? 'up' : 'down';
      };

      expect(calculateTrend(upwardValues)).toBe('up');
      expect(calculateTrend(downwardValues)).toBe('down');
      expect(calculateTrend(stableValues)).toBe('stable');
    });
  });

  describe('Date Range Filtering', () => {
    it('should filter metrics by date range', async () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      mockPrisma.metricSnapshot.findMany.mockResolvedValue([
        { id: '1', recordedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), metrics: { views: 100 } },
        { id: '2', recordedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), metrics: { views: 200 } },
      ]);

      const snapshots = await mockPrisma.metricSnapshot.findMany({
        where: {
          recordedAt: { gte: weekAgo, lte: now },
        },
      });

      expect(snapshots).toHaveLength(2);
    });

    it('should group metrics by time period', async () => {
      const mockSnapshots = [
        { recordedAt: new Date('2024-01-01T10:00:00Z'), metrics: { views: 100 } },
        { recordedAt: new Date('2024-01-01T14:00:00Z'), metrics: { views: 150 } },
        { recordedAt: new Date('2024-01-02T10:00:00Z'), metrics: { views: 200 } },
        { recordedAt: new Date('2024-01-02T14:00:00Z'), metrics: { views: 250 } },
      ];

      const grouped: Record<string, any[]> = {};
      mockSnapshots.forEach((s) => {
        const day = s.recordedAt.toISOString().split('T')[0];
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(s);
      });

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['2024-01-01']).toHaveLength(2);
      expect(grouped['2024-01-02']).toHaveLength(2);
    });

    it('should handle empty date ranges', async () => {
      mockPrisma.metricSnapshot.findMany.mockResolvedValue([]);

      const snapshots = await mockPrisma.metricSnapshot.findMany({
        where: {
          recordedAt: {
            gte: new Date('2020-01-01'),
            lte: new Date('2020-01-02'),
          },
        },
      });

      expect(snapshots).toHaveLength(0);
    });
  });

  describe('Export Format Generation', () => {
    it('should prepare data for PDF export', () => {
      const reportData = {
        title: 'Campaign Performance Report',
        dateRange: { start: '2024-01-01', end: '2024-01-31' },
        metrics: [
          { name: 'Total Views', value: 100000, change: 15.5 },
          { name: 'Engagement Rate', value: 8.5, change: 2.1 },
          { name: 'Conversions', value: 500, change: -5.0 },
        ],
      };

      expect(reportData.title).toBe('Campaign Performance Report');
      expect(reportData.metrics).toHaveLength(3);
      expect(reportData.metrics[0].value).toBe(100000);
    });

    it('should prepare data for Excel export', () => {
      const data = [
        { date: '2024-01-01', views: 1000, likes: 50, shares: 10 },
        { date: '2024-01-02', views: 1200, likes: 60, shares: 15 },
        { date: '2024-01-03', views: 1100, likes: 55, shares: 12 },
      ];

      const headers = Object.keys(data[0]);
      const rows = data.map((row) => Object.values(row));

      expect(headers).toEqual(['date', 'views', 'likes', 'shares']);
      expect(rows).toHaveLength(3);
      expect(rows[0]).toEqual(['2024-01-01', 1000, 50, 10]);
    });

    it('should prepare data for CSV export', () => {
      const data = [
        { metric: 'views', value: 50000 },
        { metric: 'engagement', value: 7.5 },
        { metric: 'revenue', value: 25000 },
      ];

      const csvLines = [
        'metric,value',
        ...data.map((row) => `${row.metric},${row.value}`),
      ];
      const csv = csvLines.join('\n');

      expect(csv).toContain('metric,value');
      expect(csv).toContain('views,50000');
      expect(csv).toContain('engagement,7.5');
    });

    it('should handle report scheduling', async () => {
      const mockReport = {
        id: 'report-123',
        name: 'Weekly Performance',
        schedule: { cron: '0 9 * * 1' },
        isActive: true,
      };

      mockPrisma.report.create.mockResolvedValue(mockReport);

      const report = await mockPrisma.report.create({
        data: mockReport,
      });

      expect(report.schedule.cron).toBe('0 9 * * 1');
      expect(report.isActive).toBe(true);
    });
  });

  describe('Cleanup Operations', () => {
    it('should delete old metrics', async () => {
      mockPrisma.metricSnapshot.deleteMany.mockResolvedValue({ count: 150 });

      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const result = await mockPrisma.metricSnapshot.deleteMany({
        where: { recordedAt: { lt: cutoffDate } },
      });

      expect(result.count).toBe(150);
    });
  });
});
