import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ugcActivationService } from '../services/ugcActivationService';
import { logger } from '../lib/logger';

const router = Router();

// Validation schemas
const createSchema = z.object({
  organizationId: z.string().uuid(),
  brandId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  contentId: z.string().uuid(),
  creatorId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  targeting: z.record(z.any()).optional(),
  attributionConfig: z.record(z.any()).optional(),
  utmParams: z.record(z.any()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  createdBy: z.string().uuid(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'ARCHIVED']).optional(),
  targeting: z.record(z.any()).optional(),
  attributionConfig: z.record(z.any()).optional(),
  utmParams: z.record(z.any()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const embedSchema = z.object({
  type: z.enum(['JAVASCRIPT', 'IFRAME', 'DIRECT_LINK', 'REACT', 'VUE', 'WEB_COMPONENT', 'AMP']),
  settings: z.object({
    width: z.string().optional(),
    height: z.string().optional(),
    autoplay: z.boolean().optional(),
    muted: z.boolean().optional(),
    responsive: z.boolean().optional(),
  }).optional(),
  expiresAt: z.string().datetime().optional(),
});

const trackSchema = z.object({
  eventType: z.enum(['view', 'click', 'engagement', 'conversion']),
  visitorId: z.string().optional(),
  sessionId: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  country: z.string().optional(),
  device: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  conversionType: z.string().optional(),
  value: z.number().optional(),
  currency: z.string().optional(),
  orderId: z.string().optional(),
  productId: z.string().optional(),
});

// POST /ugc/activation - Create UGC activation
router.post('/activation', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    const activation = await ugcActivationService.create(data);
    res.status(201).json({ success: true, activation });
  } catch (error) {
    next(error);
  }
});

// GET /ugc/activation/:id - Get activation details
router.get('/activation/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activation = await ugcActivationService.getById(req.params.id);
    if (!activation) {
      return res.status(404).json({ success: false, error: 'Activation not found' });
    }
    res.json({ success: true, activation });
  } catch (error) {
    next(error);
  }
});

// PUT /ugc/activation/:id - Update activation
router.put('/activation/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateSchema.parse(req.body);
    const activation = await ugcActivationService.update(req.params.id, data);
    res.json({ success: true, activation });
  } catch (error) {
    next(error);
  }
});

// DELETE /ugc/activation/:id - Delete activation
router.delete('/activation/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ugcActivationService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /ugc/activation/:id/embed - Generate embed code
router.post('/activation/:id/embed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = embedSchema.parse(req.body);
    const embedCode = await ugcActivationService.generateEmbedCode(req.params.id, data);
    res.status(201).json({ success: true, embedCode });
  } catch (error) {
    next(error);
  }
});

// GET /ugc/activation/:id/embed - Get embed codes
router.get('/activation/:id/embed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const embedCodes = await ugcActivationService.getEmbedCodes(req.params.id);
    res.json({ success: true, embedCodes });
  } catch (error) {
    next(error);
  }
});

// POST /ugc/activation/:id/track - Track attribution/conversions
router.post('/activation/:id/track', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = trackSchema.parse(req.body);
    const event = await ugcActivationService.trackEvent(req.params.id, data);
    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
});

// GET /ugc/activation/:id/analytics - Get analytics
router.get('/activation/:id/analytics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await ugcActivationService.getAnalytics(
      req.params.id,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json({ success: true, analytics });
  } catch (error) {
    next(error);
  }
});

export default router;
