import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { actionService } from '../services/action.service';

const router = Router();

const createSchema = z.object({
  workflowId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: z.enum([
    'SEND_EMAIL', 'SEND_SMS', 'SEND_NOTIFICATION', 'SEND_PUSH',
    'UPDATE_SEGMENT', 'UPDATE_PROFILE', 'CALL_WEBHOOK', 'CALL_API',
    'DELAY', 'CONDITION', 'SPLIT', 'MERGE', 'TRANSFORM', 'LOG'
  ]),
  config: z.record(z.any()),
  order: z.number().optional(),
  retryConfig: z.record(z.any()).optional(),
  timeout: z.number().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum([
    'SEND_EMAIL', 'SEND_SMS', 'SEND_NOTIFICATION', 'SEND_PUSH',
    'UPDATE_SEGMENT', 'UPDATE_PROFILE', 'CALL_WEBHOOK', 'CALL_API',
    'DELAY', 'CONDITION', 'SPLIT', 'MERGE', 'TRANSFORM', 'LOG'
  ]).optional(),
  config: z.record(z.any()).optional(),
  order: z.number().optional(),
  retryConfig: z.record(z.any()).optional(),
  timeout: z.number().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /actions/types - List available action types
router.get('/types', (req: Request, res: Response) => {
  const types = actionService.getTypes();
  res.json({ success: true, types });
});

// POST /actions - Create action
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body);
    const action = await actionService.create(data);
    res.status(201).json({ success: true, action });
  } catch (error) {
    next(error);
  }
});

// GET /actions - List actions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId, userId, type, isActive, page, limit } = req.query;
    const result = await actionService.findAll({
      workflowId: workflowId as string,
      userId: userId as string,
      type: type as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /actions/:id - Get action
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const action = await actionService.findById(req.params.id);
    if (!action) {
      return res.status(404).json({ success: false, error: 'Action not found' });
    }
    res.json({ success: true, action });
  } catch (error) {
    next(error);
  }
});

// PUT /actions/:id - Update action
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateSchema.parse(req.body);
    const action = await actionService.update(req.params.id, data);
    res.json({ success: true, action });
  } catch (error) {
    next(error);
  }
});

// DELETE /actions/:id - Delete action
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await actionService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /actions/reorder - Reorder actions
router.post('/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId, actionIds } = req.body;
    await actionService.reorder(workflowId, actionIds);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
