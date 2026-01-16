import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { triggerService, CreateTriggerInput } from '../services/trigger.service';

const router = Router();

const createSchema = z.object({
  workflowId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(['EVENT', 'SCHEDULE', 'WEBHOOK', 'CONDITION', 'SEGMENT_ENTRY', 'SEGMENT_EXIT', 'API_CALL']),
  config: z.record(z.any()),
  conditions: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  type: z.enum(['EVENT', 'SCHEDULE', 'WEBHOOK', 'CONDITION', 'SEGMENT_ENTRY', 'SEGMENT_EXIT', 'API_CALL']).optional(),
  config: z.record(z.any()).optional(),
  conditions: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /triggers/types - List available trigger types
router.get('/types', (req: Request, res: Response) => {
  const types = triggerService.getTypes();
  res.json({ success: true, types });
});

// POST /triggers - Create trigger
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSchema.parse(req.body) as CreateTriggerInput;
    const trigger = await triggerService.create(data);
    res.status(201).json({ success: true, trigger });
  } catch (error) {
    next(error);
  }
});

// GET /triggers - List triggers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId, userId, type, isActive, page, limit } = req.query;
    const result = await triggerService.findAll({
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

// GET /triggers/:id - Get trigger
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trigger = await triggerService.findById(req.params.id);
    if (!trigger) {
      return res.status(404).json({ success: false, error: 'Trigger not found' });
    }
    res.json({ success: true, trigger });
  } catch (error) {
    next(error);
  }
});

// PUT /triggers/:id - Update trigger
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateSchema.parse(req.body);
    const trigger = await triggerService.update(req.params.id, data);
    res.json({ success: true, trigger });
  } catch (error) {
    next(error);
  }
});

// DELETE /triggers/:id - Delete trigger
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await triggerService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
