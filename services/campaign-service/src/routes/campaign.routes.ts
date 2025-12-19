import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { campaignService } from '../services/campaign.service';

const router = Router();

// Validation schemas
const createCampaignSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['UGC', 'INFLUENCER', 'AFFILIATE', 'AMBASSADOR', 'PRODUCT_SEEDING']).optional(),
  startDate: z.string().datetime().optional().transform((s) => s ? new Date(s) : undefined),
  endDate: z.string().datetime().optional().transform((s) => s ? new Date(s) : undefined),
  budget: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  targetAudience: z.record(z.unknown()).optional(),
  goals: z.record(z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
});

const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
});

const createBriefSchema = z.object({
  overview: z.string().max(5000).optional(),
  objectives: z.record(z.unknown()).optional(),
  targetPlatforms: z.array(z.string()).optional(),
  contentTypes: z.array(z.string()).optional(),
  brandGuidelines: z.record(z.unknown()).optional(),
  doAndDonts: z.record(z.unknown()).optional(),
  keyMessages: z.array(z.string()).optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  references: z.record(z.unknown()).optional(),
});

const createDeliverableSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['VIDEO', 'IMAGE', 'STORY', 'REEL', 'TIKTOK', 'BLOG_POST', 'REVIEW', 'TESTIMONIAL', 'OTHER']),
  platform: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  requirements: z.record(z.unknown()).optional(),
  dueDate: z.string().datetime().optional().transform((s) => s ? new Date(s) : undefined),
  compensation: z.number().positive().optional(),
});

const applyToCampaignSchema = z.object({
  pitch: z.string().max(2000).optional(),
  proposedRate: z.number().positive().optional(),
});

const updateApplicationStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'REJECTED']),
});

const addMilestoneSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  dueDate: z.string().datetime().optional().transform((s) => s ? new Date(s) : undefined),
});

// Helper to validate request body
function validate<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: result.error.errors,
        },
      });
    }
    req.body = result.data;
    next();
  };
}

// Helper to require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  const organizationId = req.headers['x-organization-id'] as string;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'Organization ID is required' },
    });
  }

  next();
}

// Campaign routes
// POST /campaigns
router.post('/', requireAuth, validate(createCampaignSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string;
    const campaign = await campaignService.createCampaign(organizationId, userId, req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

// GET /campaigns
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { status, type, page, limit, search, sortBy, sortOrder } = req.query;

    const result = await campaignService.listCampaigns({
      organizationId,
      status: status as string,
      type: type as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /campaigns/stats
router.get('/stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const stats = await campaignService.getCampaignStats(organizationId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// GET /campaigns/:id
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const campaign = await campaignService.getCampaign(req.params.id, organizationId);
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

// PATCH /campaigns/:id
router.patch('/:id', requireAuth, validate(updateCampaignSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const campaign = await campaignService.updateCampaign(req.params.id, organizationId, req.body);
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

// DELETE /campaigns/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    await campaignService.deleteCampaign(req.params.id, organizationId);
    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Brief routes
// PUT /campaigns/:id/brief
router.put('/:id/brief', requireAuth, validate(createBriefSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const brief = await campaignService.createOrUpdateBrief(req.params.id, organizationId, req.body);
    res.json({ success: true, data: brief });
  } catch (error) {
    next(error);
  }
});

// Deliverable routes
// POST /campaigns/:id/deliverables
router.post('/:id/deliverables', requireAuth, validate(createDeliverableSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const deliverable = await campaignService.addDeliverable(req.params.id, organizationId, req.body);
    res.status(201).json({ success: true, data: deliverable });
  } catch (error) {
    next(error);
  }
});

// PATCH /campaigns/:id/deliverables/:deliverableId
router.patch('/:id/deliverables/:deliverableId', requireAuth, validate(createDeliverableSchema.partial()), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const deliverable = await campaignService.updateDeliverable(
      req.params.deliverableId,
      req.params.id,
      organizationId,
      req.body
    );
    res.json({ success: true, data: deliverable });
  } catch (error) {
    next(error);
  }
});

// DELETE /campaigns/:id/deliverables/:deliverableId
router.delete('/:id/deliverables/:deliverableId', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    await campaignService.deleteDeliverable(req.params.deliverableId, req.params.id, organizationId);
    res.json({ success: true, message: 'Deliverable deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Application routes (for creators)
// POST /campaigns/:id/apply
router.post('/:id/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creatorId = req.headers['x-user-id'] as string;
    if (!creatorId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { pitch, proposedRate } = applyToCampaignSchema.parse(req.body);
    const application = await campaignService.applyToCampaign(req.params.id, creatorId, pitch, proposedRate);
    res.status(201).json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
});

// GET /campaigns/:id/applications
router.get('/:id/applications', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const { status } = req.query;
    const applications = await campaignService.listApplications(req.params.id, organizationId, status as string);
    res.json({ success: true, data: applications });
  } catch (error) {
    next(error);
  }
});

// PATCH /campaigns/:id/applications/:applicationId
router.patch('/:id/applications/:applicationId', requireAuth, validate(updateApplicationStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string;
    const application = await campaignService.updateApplicationStatus(
      req.params.applicationId,
      req.params.id,
      organizationId,
      userId,
      req.body.status
    );
    res.json({ success: true, data: application });
  } catch (error) {
    next(error);
  }
});

// Milestone routes
// POST /campaigns/:id/milestones
router.post('/:id/milestones', requireAuth, validate(addMilestoneSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const milestone = await campaignService.addMilestone(
      req.params.id,
      organizationId,
      req.body.name,
      req.body.description,
      req.body.dueDate
    );
    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
});

// POST /campaigns/:id/milestones/:milestoneId/complete
router.post('/:id/milestones/:milestoneId/complete', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = req.headers['x-organization-id'] as string;
    const milestone = await campaignService.completeMilestone(
      req.params.milestoneId,
      req.params.id,
      organizationId
    );
    res.json({ success: true, data: milestone });
  } catch (error) {
    next(error);
  }
});

export default router;
