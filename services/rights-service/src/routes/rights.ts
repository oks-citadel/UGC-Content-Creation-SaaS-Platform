import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { RightsService } from '../services/rights.service';
import { logger } from '../utils/logger';

const router = Router();
const rightsService = new RightsService();

// Request schemas
const contentIdSchema = z.object({
  contentId: z.string().uuid(),
});

const createRightsSchema = z.object({
  contentId: z.string().uuid(),
  creatorId: z.string().uuid(),
  brandId: z.string().uuid(),
  campaignId: z.string().uuid().optional(),
  usageRights: z.object({
    platforms: z.array(z.enum(['website', 'social', 'paid_ads', 'email', 'print', 'broadcast', 'all'])),
    territories: z.array(z.string()).default(['worldwide']),
    duration: z.enum(['perpetual', '1_year', '2_years', '5_years', 'custom']),
    durationDays: z.number().optional(),
    exclusivity: z.enum(['exclusive', 'non_exclusive']).default('non_exclusive'),
    modifications: z.enum(['allowed', 'not_allowed', 'with_approval']).default('with_approval'),
  }),
  compensation: z.object({
    type: z.enum(['flat_fee', 'royalty', 'hybrid']),
    amount: z.number().optional(),
    currency: z.string().default('USD'),
    royaltyPercent: z.number().optional(),
  }),
});

const signLicenseSchema = z.object({
  signatureData: z.string(),
  signedAt: z.string().datetime(),
  ipAddress: z.string().optional(),
});

// GET /content/:contentId/rights - Get content rights
router.get('/:contentId/rights', async (req: Request, res: Response) => {
  try {
    const { contentId } = contentIdSchema.parse(req.params);
    const rights = await rightsService.getContentRights(contentId);

    res.json(rights);
  } catch (error) {
    logger.error({ error }, 'Failed to get content rights');
    throw error;
  }
});

// POST /content/:contentId/rights - Define content rights
router.post('/:contentId/rights', async (req: Request, res: Response) => {
  try {
    const { contentId } = contentIdSchema.parse(req.params);
    const body = createRightsSchema.parse({ ...req.body, contentId });

    const rights = await rightsService.createContentRights(body as any);

    res.status(201).json(rights);
  } catch (error) {
    logger.error({ error }, 'Failed to create content rights');
    throw error;
  }
});

// GET /content/:contentId/license - Get license agreement
router.get('/:contentId/license', async (req: Request, res: Response) => {
  try {
    const { contentId } = contentIdSchema.parse(req.params);
    const format = req.query.format as 'json' | 'pdf' | 'html' || 'json';

    const license = await rightsService.getLicenseAgreement(contentId, format);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="license-${contentId}.pdf"`);
      res.send(license.document);
    } else if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.send(license.document);
    } else {
      res.json(license);
    }
  } catch (error) {
    logger.error({ error }, 'Failed to get license');
    throw error;
  }
});

// POST /content/:contentId/license/sign - Sign license (creator)
router.post('/:contentId/license/sign', async (req: Request, res: Response) => {
  try {
    const { contentId } = contentIdSchema.parse(req.params);
    const signatureData = signLicenseSchema.parse(req.body);
    // In production, extract creatorId from authenticated user
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';

    const signedLicense = await rightsService.signLicense(contentId, creatorId, signatureData as any);

    res.json(signedLicense);
  } catch (error) {
    logger.error({ error }, 'Failed to sign license');
    throw error;
  }
});

// GET /content/:contentId/rights/history - Get rights history
router.get('/:contentId/rights/history', async (req: Request, res: Response) => {
  try {
    const { contentId } = contentIdSchema.parse(req.params);
    const history = await rightsService.getRightsHistory(contentId);

    res.json({ history });
  } catch (error) {
    logger.error({ error }, 'Failed to get rights history');
    throw error;
  }
});

// POST /content/:contentId/rights/transfer - Transfer rights
router.post('/:contentId/rights/transfer', async (req: Request, res: Response) => {
  try {
    const { contentId } = contentIdSchema.parse(req.params);
    const { newBrandId, reason } = req.body;

    const transfer = await rightsService.transferRights(contentId, newBrandId, reason);

    res.json(transfer);
  } catch (error) {
    logger.error({ error }, 'Failed to transfer rights');
    throw error;
  }
});

// POST /content/:contentId/rights/revoke - Revoke rights
router.post('/:contentId/rights/revoke', async (req: Request, res: Response) => {
  try {
    const { contentId } = contentIdSchema.parse(req.params);
    const { reason } = req.body;

    await rightsService.revokeRights(contentId, reason);

    res.json({ message: 'Rights revoked successfully' });
  } catch (error) {
    logger.error({ error }, 'Failed to revoke rights');
    throw error;
  }
});

export default router;
