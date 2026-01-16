import { Router, Request, Response, NextFunction } from 'express';
import { segmentService } from '../services/segmentService';
import {
  createSegmentSchema,
  updateSegmentSchema,
  addMembersSchema,
  segmentQuerySchema,
  memberQuerySchema,
} from '../types/segment';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /segments - Create segment with rules
router.post(
  '/',
  rateLimiter({ maxRequests: 100, windowMs: 60000 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = createSegmentSchema.parse(req.body);
      const segment = await segmentService.create(data);
      res.status(201).json({ success: true, segment });
    } catch (error) {
      next(error);
    }
  }
);

// GET /segments - List segments
router.get(
  '/',
  rateLimiter({ maxRequests: 500, windowMs: 60000 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = segmentQuerySchema.parse(req.query);
      const result = await segmentService.findAll(query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /segments/:id - Get segment details
router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const segment = await segmentService.findById(req.params.id);
      if (!segment) {
        return res.status(404).json({ success: false, error: 'Segment not found' });
      }
      res.json({ success: true, segment });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /segments/:id - Update segment
router.put(
  '/:id',
  rateLimiter({ maxRequests: 100, windowMs: 60000 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = updateSegmentSchema.parse(req.body);
      const segment = await segmentService.update(req.params.id, data);
      res.json({ success: true, segment });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /segments/:id - Delete segment
router.delete(
  '/:id',
  rateLimiter({ maxRequests: 50, windowMs: 60000 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await segmentService.delete(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// POST /segments/:id/members - Add members to segment
router.post(
  '/:id/members',
  rateLimiter({ maxRequests: 100, windowMs: 60000 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = addMembersSchema.parse(req.body);
      const result = await segmentService.addMembers(req.params.id, data);
      res.status(201).json({ success: true, result });
    } catch (error) {
      next(error);
    }
  }
);

// GET /segments/:id/members - Get segment members
router.get(
  '/:id/members',
  rateLimiter({ maxRequests: 500, windowMs: 60000 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = memberQuerySchema.parse(req.query);
      const result = await segmentService.getMembers(req.params.id, query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /segments/:id/members/:entityType/:entityId - Remove member
router.delete(
  '/:id/members/:entityType/:entityId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await segmentService.removeMember(
        req.params.id,
        req.params.entityType,
        req.params.entityId
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
