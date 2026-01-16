import { Router, Request, Response } from 'express';
import attributionService, { AttributionModel } from '../services/attribution.service';

const router = Router();

/**
 * GET /attribution/models
 * List available attribution models
 */
router.get('/models', (req: Request, res: Response) => {
  try {
    const models = attributionService.getModels();
    res.json({ models });
  } catch (error: any) {
    console.error('Error getting models:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /attribution/touchpoints
 * Record a touchpoint
 */
router.post('/touchpoints', async (req: Request, res: Response) => {
  try {
    const {
      visitorId,
      sessionId,
      channel,
      source,
      medium,
      campaign,
      content,
      term,
      landingPage,
      referrer,
      deviceType,
      browser,
      country,
      region,
      city,
      metadata,
      timestamp,
    } = req.body;

    if (!visitorId || !channel) {
      return res.status(400).json({ error: 'visitorId and channel are required' });
    }

    const touchpoint = await attributionService.recordTouchpoint({
      visitorId,
      sessionId,
      channel,
      source,
      medium,
      campaign,
      content,
      term,
      landingPage,
      referrer,
      deviceType,
      browser,
      country,
      region,
      city,
      metadata,
      timestamp: timestamp ? new Date(timestamp) : undefined,
    });

    res.status(201).json({ touchpoint });
  } catch (error: any) {
    console.error('Error recording touchpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /attribution/touchpoints
 * Query touchpoints with filters
 */
router.get('/touchpoints', async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      channel,
      campaign,
      source,
      visitorId,
      limit,
      offset,
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // If visitorId provided, get touchpoints for that visitor
    if (visitorId) {
      const touchpoints = await attributionService.getTouchpoints(
        visitorId as string,
        {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
          limit: limit ? parseInt(limit as string) : undefined,
        }
      );
      return res.json({ touchpoints, total: touchpoints.length });
    }

    // Otherwise query with filters
    const result = await attributionService.queryTouchpoints({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      channel: channel as string,
      campaign: campaign as string,
      source: source as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error querying touchpoints:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /attribution/conversions
 * Record a conversion
 */
router.post('/conversions', async (req: Request, res: Response) => {
  try {
    const {
      visitorId,
      conversionType,
      value,
      currency,
      orderId,
      productId,
      metadata,
      timestamp,
      lookbackDays,
    } = req.body;

    if (!visitorId || !conversionType) {
      return res.status(400).json({ error: 'visitorId and conversionType are required' });
    }

    const result = await attributionService.recordConversion({
      visitorId,
      conversionType,
      value,
      currency,
      orderId,
      productId,
      metadata,
      timestamp: timestamp ? new Date(timestamp) : undefined,
      lookbackDays,
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error recording conversion:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /attribution/calculate
 * Calculate attribution for a conversion
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { conversionId, models } = req.body;

    if (!conversionId) {
      return res.status(400).json({ error: 'conversionId is required' });
    }

    const validModels: AttributionModel[] = [
      'first_touch',
      'last_touch',
      'linear',
      'time_decay',
      'position_based',
    ];

    const selectedModels = models
      ? models.filter((m: string) => validModels.includes(m as AttributionModel))
      : validModels;

    const result = await attributionService.calculateAttribution(
      conversionId,
      selectedModels
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error calculating attribution:', error);
    if (error.message === 'Conversion not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /attribution/report
 * Get attribution report
 */
router.get('/report', async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      models,
      groupBy,
      includeDetails,
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const validGroupBy = ['channel', 'source', 'campaign', 'medium'];
    const groupByParam = validGroupBy.includes(groupBy as string)
      ? (groupBy as 'channel' | 'source' | 'campaign' | 'medium')
      : 'channel';

    const report = await attributionService.getReport({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      models: models ? (models as string).split(',') as AttributionModel[] : undefined,
      groupBy: groupByParam,
      includeDetails: includeDetails === 'true',
    });

    res.json(report);
  } catch (error: any) {
    console.error('Error getting report:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /attribution/channels
 * Get channel comparison across models
 */
router.get('/channels', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const comparison = await attributionService.getChannelComparison({
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
    });

    res.json(comparison);
  } catch (error: any) {
    console.error('Error getting channel comparison:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /attribution/journey/:visitorId
 * Get customer journey for a visitor
 */
router.get('/journey/:visitorId', async (req: Request, res: Response) => {
  try {
    const { visitorId } = req.params;

    const journey = await attributionService.getCustomerJourney(visitorId);

    res.json(journey);
  } catch (error: any) {
    console.error('Error getting customer journey:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
