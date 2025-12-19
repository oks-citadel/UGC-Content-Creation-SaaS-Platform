import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { AssetService } from '../services/asset.service';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const router = Router();
const assetService = new AssetService();

// Request schemas
const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  size: z.number().positive(),
  metadata: z.record(z.string()).optional(),
});

const assetIdSchema = z.object({
  id: z.string().uuid(),
});

// POST /assets/upload-url - Get presigned upload URL
router.post('/upload-url', async (req: Request, res: Response) => {
  try {
    const body = uploadUrlSchema.parse(req.body);
    const assetId = uuidv4();

    const uploadData = await assetService.generateUploadUrl({
      assetId,
      filename: body.filename,
      contentType: body.contentType,
      size: body.size,
      metadata: body.metadata,
    });

    res.status(200).json({
      assetId,
      uploadUrl: uploadData.url,
      expiresAt: uploadData.expiresAt,
      fields: uploadData.fields,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate upload URL');
    throw error;
  }
});

// GET /assets/:id - Get asset metadata
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = assetIdSchema.parse(req.params);
    const asset = await assetService.getAsset(id);

    if (!asset) {
      throw new AppError('Asset not found', 404, 'ASSET_NOT_FOUND');
    }

    res.json(asset);
  } catch (error) {
    logger.error({ error }, 'Failed to get asset');
    throw error;
  }
});

// GET /assets/:id/download - Get download URL
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = assetIdSchema.parse(req.params);
    const downloadUrl = await assetService.generateDownloadUrl(id);

    res.json({
      downloadUrl,
      expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24 hours
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate download URL');
    throw error;
  }
});

// GET /assets/:id/variants - Get asset variants (different sizes/formats)
router.get('/:id/variants', async (req: Request, res: Response) => {
  try {
    const { id } = assetIdSchema.parse(req.params);
    const variants = await assetService.getAssetVariants(id);

    res.json({ variants });
  } catch (error) {
    logger.error({ error }, 'Failed to get asset variants');
    throw error;
  }
});

// DELETE /assets/:id - Delete asset
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = assetIdSchema.parse(req.params);
    await assetService.deleteAsset(id);

    res.status(204).send();
  } catch (error) {
    logger.error({ error }, 'Failed to delete asset');
    throw error;
  }
});

// POST /assets/:id/process - Trigger asset processing
router.post('/:id/process', async (req: Request, res: Response) => {
  try {
    const { id } = assetIdSchema.parse(req.params);
    const processingJob = await assetService.triggerProcessing(id);

    res.status(202).json({
      message: 'Processing started',
      jobId: processingJob.jobId,
      status: processingJob.status,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to trigger processing');
    throw error;
  }
});

export default router;
