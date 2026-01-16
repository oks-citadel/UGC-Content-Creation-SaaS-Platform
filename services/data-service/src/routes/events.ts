import { Router, Request, Response, NextFunction } from 'express';
import { eventService } from '../services/eventService';
import { baseEventSchema, batchEventSchema, eventQuerySchema } from '../types/event';
import { rateLimiter } from '../middleware/rateLimiter';
import { logger } from '../lib/logger';

const router = Router();

router.post(
  '/',
  rateLimiter({ maxRequests: 1000, windowMs: 60000 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedEvent = baseEventSchema.parse(req.body);
      const result = await eventService.ingestEvent(validatedEvent);
      res.status(201).json({ success: true, event: result });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/batch',
  rateLimiter({ maxRequests: 100, windowMs: 60000 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBatch = batchEventSchema.parse(req.body);
      const result = await eventService.ingestBatch(validatedBatch);
      const status = result.failed > 0 ? 207 : 201;
      res.status(status).json({ success: true, result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /events - Query events with filters
router.get(
  '/',
  rateLimiter({ maxRequests: 500, windowMs: 60000 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = eventQuerySchema.parse(req.query);
      const result = await eventService.queryEvents(query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/stats',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brandId = req.query.brandId as string | undefined;
      const stats = await eventService.getEventStats(brandId);
      res.json({ success: true, stats });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
