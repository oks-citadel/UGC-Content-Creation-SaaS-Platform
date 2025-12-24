import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { LibraryService } from '../services/library.service';
import { logger } from '../utils/logger';

const router: Router = Router();
const libraryService = new LibraryService();

// Request schemas
const listAssetsSchema = z.object({
  folderId: z.string().uuid().optional(),
  contentType: z.enum(['image', 'video', 'audio', 'document', 'all']).default('all'),
  campaignId: z.string().uuid().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'name', 'size']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const createFolderSchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().uuid().optional(),
  description: z.string().max(1000).optional(),
});

const folderIdSchema = z.object({
  folderId: z.string().uuid(),
});

// GET /library - List brand's asset library
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = listAssetsSchema.parse(req.query);
    // In production, extract brandId from authenticated user
    const brandId = req.headers['x-brand-id'] as string || 'default-brand';

    const result = await libraryService.listAssets(brandId, query as any);

    res.json(result);
  } catch (error) {
    logger.error({ error }, 'Failed to list library assets');
    throw error;
  }
});

// GET /library/folders - List folders
router.get('/folders', async (req: Request, res: Response) => {
  try {
    const brandId = req.headers['x-brand-id'] as string || 'default-brand';
    const parentId = req.query.parentId as string | undefined;

    const folders = await libraryService.listFolders(brandId, parentId);

    res.json({ folders });
  } catch (error) {
    logger.error({ error }, 'Failed to list folders');
    throw error;
  }
});

// POST /library/folders - Create folder
router.post('/folders', async (req: Request, res: Response) => {
  try {
    const body = createFolderSchema.parse(req.body);
    const brandId = req.headers['x-brand-id'] as string || 'default-brand';

    const folder = await libraryService.createFolder(brandId, body as any);

    res.status(201).json(folder);
  } catch (error) {
    logger.error({ error }, 'Failed to create folder');
    throw error;
  }
});

// GET /library/folders/:folderId - Get folder details
router.get('/folders/:folderId', async (req: Request, res: Response) => {
  try {
    const { folderId } = folderIdSchema.parse(req.params);
    const folder = await libraryService.getFolder(folderId);

    res.json(folder);
  } catch (error) {
    logger.error({ error }, 'Failed to get folder');
    throw error;
  }
});

// PATCH /library/folders/:folderId - Update folder
router.patch('/folders/:folderId', async (req: Request, res: Response) => {
  try {
    const { folderId } = folderIdSchema.parse(req.params);
    const updates = req.body;

    const folder = await libraryService.updateFolder(folderId, updates);

    res.json(folder);
  } catch (error) {
    logger.error({ error }, 'Failed to update folder');
    throw error;
  }
});

// DELETE /library/folders/:folderId - Delete folder
router.delete('/folders/:folderId', async (req: Request, res: Response) => {
  try {
    const { folderId } = folderIdSchema.parse(req.params);
    await libraryService.deleteFolder(folderId);

    res.status(204).send();
  } catch (error) {
    logger.error({ error }, 'Failed to delete folder');
    throw error;
  }
});

// POST /library/assets/:assetId/move - Move asset to folder
router.post('/assets/:assetId/move', async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId;
    const { folderId } = req.body;

    await libraryService.moveAsset(assetId, folderId);

    res.json({ message: 'Asset moved successfully' });
  } catch (error) {
    logger.error({ error }, 'Failed to move asset');
    throw error;
  }
});

export default router;
