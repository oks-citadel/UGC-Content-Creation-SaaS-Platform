import { Router, Request, Response } from 'express';
import metricsService from '../services/metrics.service';
import dashboardService from '../services/dashboard.service';
import reportingService from '../services/reporting.service';
import realtimeService from '../services/realtime.service';
import anomalyService from '../services/anomaly.service';
import fatigueService from '../services/fatigue.service';
import contentAggregator from '../aggregators/content.aggregator';
import campaignAggregator from '../aggregators/campaign.aggregator';
import creatorAggregator from '../aggregators/creator.aggregator';
import commerceAggregator from '../aggregators/commerce.aggregator';
import fs from 'fs';

const router: Router = Router();

// Metrics endpoints
router.get('/metrics/:entityType/:entityId', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { startDate, endDate, period, metrics, aggregation } = req.query;

    const data = await metricsService.getMetrics({
      entityType,
      entityId,
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      period: period as string,
      metrics: metrics ? (metrics as string).split(',') : undefined,
      aggregation: aggregation as any,
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

router.post('/metrics', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, metrics, period } = req.body;

    const snapshot = await metricsService.recordMetrics({
      entityType,
      entityId,
      metrics,
      period,
    });

    res.json({ success: true, data: snapshot });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record metrics' });
  }
});

router.get('/metrics/:entityType/:entityId/trend', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { metric, days } = req.query;

    const trend = await metricsService.getMetricTrend(
      entityType,
      entityId,
      metric as string,
      days ? parseInt(days as string, 10) : 30
    );

    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
});

router.get('/metrics/:entityType/:entityId/compare', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const { metric, currentStart, currentEnd, previousStart, previousEnd } = req.query;

    const comparison = await metricsService.compareMetrics({
      entityType,
      entityId,
      metric: metric as string,
      currentPeriod: {
        start: new Date(currentStart as string),
        end: new Date(currentEnd as string),
      },
      previousPeriod: {
        start: new Date(previousStart as string),
        end: new Date(previousEnd as string),
      },
    });

    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ error: 'Failed to compare metrics' });
  }
});

router.get('/metrics/:entityType/top', async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const { metric, limit, startDate, endDate, period } = req.query;

    const topPerformers = await metricsService.getTopPerformers(
      entityType,
      metric as string,
      {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        period: period as string,
        limit: limit ? parseInt(limit as string, 10) : 10,
      }
    );

    res.json({ success: true, data: topPerformers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch top performers' });
  }
});

// Dashboard endpoints
router.get('/dashboards', async (req: Request, res: Response) => {
  try {
    const { userId, brandId, isDefault, isPublic } = req.query;

    const dashboards = await dashboardService.listDashboards({
      userId: userId as string,
      brandId: brandId as string,
      isDefault: isDefault === 'true',
      isPublic: isPublic === 'true',
    });

    res.json({ success: true, data: dashboards });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
});

router.post('/dashboards', async (req: Request, res: Response) => {
  try {
    const dashboard = await dashboardService.createDashboard(req.body);
    res.status(201).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create dashboard' });
  }
});

router.get('/dashboards/:id', async (req: Request, res: Response) => {
  try {
    const dashboard = await dashboardService.getDashboard(req.params.id);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

router.put('/dashboards/:id', async (req: Request, res: Response) => {
  try {
    const dashboard = await dashboardService.updateDashboard(req.params.id, req.body);
    res.json({ success: true, data: dashboard });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update dashboard' });
  }
});

router.delete('/dashboards/:id', async (req: Request, res: Response) => {
  try {
    await dashboardService.deleteDashboard(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dashboard' });
  }
});

router.get('/dashboards/:id/data', async (req: Request, res: Response) => {
  try {
    const data = await dashboardService.getDashboardData(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/dashboards/unified/overview', async (req: Request, res: Response) => {
  try {
    const { userId, brandId, timeRange } = req.query;

    const data = await dashboardService.getUnifiedDashboard({
      userId: userId as string,
      brandId: brandId as string,
      timeRange: timeRange as string,
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unified dashboard' });
  }
});

// Report endpoints
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { userId, brandId, type, isActive } = req.query;

    const reports = await reportingService.listReports({
      userId: userId as string,
      brandId: brandId as string,
      type: type as string,
      isActive: isActive === 'true',
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

router.post('/reports', async (req: Request, res: Response) => {
  try {
    const report = await reportingService.createReport(req.body);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create report' });
  }
});

router.get('/reports/:id', async (req: Request, res: Response) => {
  try {
    const report = await reportingService.getReport(req.params.id);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

router.put('/reports/:id', async (req: Request, res: Response) => {
  try {
    const report = await reportingService.updateReport(req.params.id, req.body);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update report' });
  }
});

router.delete('/reports/:id', async (req: Request, res: Response) => {
  try {
    await reportingService.deleteReport(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

router.post('/reports/:id/generate', async (req: Request, res: Response) => {
  try {
    const result = await reportingService.generateReport(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/reports/:id/download', async (req: Request, res: Response) => {
  try {
    const { filePath, fileName, mimeType } = await reportingService.downloadReport(
      req.params.id
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to download report' });
  }
});

router.get('/reports/:id/history', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const history = await reportingService.getReportHistory(
      req.params.id,
      limit ? parseInt(limit as string, 10) : 20
    );
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report history' });
  }
});

// Real-time endpoints
router.get('/realtime/:entityType', async (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const { entityId } = req.query;

    const stats = await realtimeService.getRealtimeStats(
      entityType,
      entityId as string
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch realtime stats' });
  }
});

router.get('/realtime/status', async (req: Request, res: Response) => {
  try {
    const status = {
      subscriptions: realtimeService.getSubscriptionCount(),
      connectedClients: realtimeService.getConnectedClientsCount(),
    };

    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch realtime status' });
  }
});

// Anomaly endpoints
router.get('/anomalies', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, metric, severity, resolved, startDate, endDate, limit } =
      req.query;

    const anomalies = await anomalyService.getAnomalies({
      entityType: entityType as string,
      entityId: entityId as string,
      metric: metric as string,
      severity: severity as string,
      resolved: resolved === 'true',
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, data: anomalies });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

router.post('/anomalies/detect', async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, metric, lookbackDays, thresholdStdDev } = req.body;

    const anomaly = await anomalyService.detectAnomaly(entityType, entityId, metric, {
      lookbackDays,
      thresholdStdDev,
    });

    res.json({ success: true, data: anomaly });
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect anomaly' });
  }
});

router.put('/anomalies/:id/resolve', async (req: Request, res: Response) => {
  try {
    const anomaly = await anomalyService.resolveAnomaly(req.params.id);
    res.json({ success: true, data: anomaly });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve anomaly' });
  }
});

// Alert endpoints
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const { userId, brandId, entityType, isActive } = req.query;

    const alerts = await anomalyService.listAlerts({
      userId: userId as string,
      brandId: brandId as string,
      entityType: entityType as string,
      isActive: isActive === 'true',
    });

    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.post('/alerts', async (req: Request, res: Response) => {
  try {
    const alert = await anomalyService.createAlert(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

router.get('/alerts/:id', async (req: Request, res: Response) => {
  try {
    const alert = await anomalyService.getAlert(req.params.id);
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

router.put('/alerts/:id', async (req: Request, res: Response) => {
  try {
    const alert = await anomalyService.updateAlert(req.params.id, req.body);
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

router.delete('/alerts/:id', async (req: Request, res: Response) => {
  try {
    await anomalyService.deleteAlert(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

router.get('/alerts/:id/triggers', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const triggers = await anomalyService.getAlertTriggers(
      req.params.id,
      limit ? parseInt(limit as string, 10) : 20
    );
    res.json({ success: true, data: triggers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alert triggers' });
  }
});

// Creative fatigue endpoints
router.get('/fatigue/:contentId/:platformId', async (req: Request, res: Response) => {
  try {
    const { contentId, platformId } = req.params;
    const { lookbackDays, threshold } = req.query;

    const analysis = await fatigueService.detectCreativeFatigue(
      contentId,
      platformId,
      {
        lookbackDays: lookbackDays ? parseInt(lookbackDays as string, 10) : undefined,
        threshold: threshold ? parseFloat(threshold as string) : undefined,
      }
    );

    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect creative fatigue' });
  }
});

router.get('/fatigue', async (req: Request, res: Response) => {
  try {
    const { platformId, minScore, recommendation, actionTaken, limit } = req.query;

    const records = await fatigueService.getFatiguedContent({
      platformId: platformId as string,
      minScore: minScore ? parseFloat(minScore as string) : undefined,
      recommendation: recommendation as string,
      actionTaken: actionTaken as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fatigued content' });
  }
});

router.post('/fatigue/:id/action', async (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    const record = await fatigueService.markActionTaken(req.params.id, action);
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark action' });
  }
});

// Aggregator endpoints (for manual triggering)
router.post('/aggregate/content/:contentId', async (req: Request, res: Response) => {
  try {
    const metrics = await contentAggregator.aggregateContentMetrics(req.params.contentId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to aggregate content metrics' });
  }
});

router.post('/aggregate/campaign/:campaignId', async (req: Request, res: Response) => {
  try {
    const metrics = await campaignAggregator.aggregateCampaignMetrics(
      req.params.campaignId
    );
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to aggregate campaign metrics' });
  }
});

router.post('/aggregate/creator/:creatorId', async (req: Request, res: Response) => {
  try {
    const metrics = await creatorAggregator.aggregateCreatorMetrics(req.params.creatorId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to aggregate creator metrics' });
  }
});

router.post('/aggregate/commerce/product/:productId', async (req: Request, res: Response) => {
  try {
    const metrics = await commerceAggregator.aggregateProductMetrics(
      req.params.productId
    );
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to aggregate product metrics' });
  }
});

export default router;
