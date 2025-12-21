import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TemplateService } from '../services/template.service';
import { logger } from '../utils/logger';

const router = Router();
const templateService = new TemplateService();

// Request schemas
const templateIdSchema = z.object({
  templateId: z.string().uuid(),
});

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(['standard', 'exclusive', 'royalty', 'custom']),
  content: z.string(),
  variables: z.array(z.object({
    name: z.string(),
    type: z.enum(['string', 'number', 'date', 'boolean', 'currency']),
    required: z.boolean().default(true),
    defaultValue: z.any().optional(),
  })).optional(),
  isDefault: z.boolean().default(false),
});

// GET /rights/templates - Get available templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const templates = await templateService.listTemplates(type);

    res.json({ templates });
  } catch (error) {
    logger.error({ error }, 'Failed to list templates');
    throw error;
  }
});

// GET /rights/templates/:templateId - Get template details
router.get('/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = templateIdSchema.parse(req.params);
    const template = await templateService.getTemplate(templateId);

    res.json(template);
  } catch (error) {
    logger.error({ error }, 'Failed to get template');
    throw error;
  }
});

// POST /rights/templates - Create custom template (brand)
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = createTemplateSchema.parse(req.body);
    // In production, extract brandId from authenticated user
    const brandId = req.headers['x-brand-id'] as string || 'default-brand';

    const template = await templateService.createTemplate(brandId, body as any);

    res.status(201).json(template);
  } catch (error) {
    logger.error({ error }, 'Failed to create template');
    throw error;
  }
});

// PATCH /rights/templates/:templateId - Update template
router.patch('/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = templateIdSchema.parse(req.params);
    const updates = req.body;

    const template = await templateService.updateTemplate(templateId, updates);

    res.json(template);
  } catch (error) {
    logger.error({ error }, 'Failed to update template');
    throw error;
  }
});

// DELETE /rights/templates/:templateId - Delete template
router.delete('/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = templateIdSchema.parse(req.params);
    await templateService.deleteTemplate(templateId);

    res.status(204).send();
  } catch (error) {
    logger.error({ error }, 'Failed to delete template');
    throw error;
  }
});

// POST /rights/templates/:templateId/preview - Preview template with data
router.post('/:templateId/preview', async (req: Request, res: Response) => {
  try {
    const { templateId } = templateIdSchema.parse(req.params);
    const { variables } = req.body;

    const preview = await templateService.previewTemplate(templateId, variables);

    res.json({ preview });
  } catch (error) {
    logger.error({ error }, 'Failed to preview template');
    throw error;
  }
});

export default router;
