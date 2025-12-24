import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { TaxService } from '../services/tax.service';
import { logger } from '../utils/logger';

const router: Router = Router();
const taxService = new TaxService();

const taxInfoSchema = z.object({
  taxIdType: z.enum(['ssn', 'ein', 'itin', 'foreign']),
  taxId: z.string().min(1),
  legalName: z.string().min(1),
  address: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    postalCode: z.string(),
    country: z.string().length(2),
  }),
  businessType: z.enum(['individual', 'sole_proprietor', 'llc', 'corporation', 'partnership']).optional(),
});

// GET /payouts/tax-documents - Get tax documents
router.get('/', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const documents = await taxService.getTaxDocuments(creatorId, year);

    res.json({ documents });
  } catch (error) {
    logger.error({ error }, 'Failed to get tax documents');
    throw error;
  }
});

// GET /payouts/tax-documents/:documentId - Download tax document
router.get('/:documentId', async (req: Request, res: Response) => {
  try {
    const documentId = req.params.documentId;
    const document = await taxService.downloadTaxDocument(documentId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    res.send(document.data);
  } catch (error) {
    logger.error({ error }, 'Failed to download tax document');
    throw error;
  }
});

// GET /payouts/tax-documents/info - Get tax information on file
router.get('/info', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const info = await taxService.getTaxInfo(creatorId);

    res.json(info);
  } catch (error) {
    logger.error({ error }, 'Failed to get tax info');
    throw error;
  }
});

// POST /payouts/tax-documents/info - Submit tax information (W-9/W-8)
router.post('/info', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const body = taxInfoSchema.parse(req.body);

    const info = await taxService.submitTaxInfo(creatorId, body as any);

    res.status(201).json(info);
  } catch (error) {
    logger.error({ error }, 'Failed to submit tax info');
    throw error;
  }
});

// GET /payouts/tax-documents/summary/:year - Get annual earnings summary
router.get('/summary/:year', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const year = parseInt(req.params.year);

    const summary = await taxService.getAnnualSummary(creatorId, year);

    res.json(summary);
  } catch (error) {
    logger.error({ error }, 'Failed to get annual summary');
    throw error;
  }
});

export default router;
