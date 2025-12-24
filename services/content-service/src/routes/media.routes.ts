import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { mediaService } from '../services/media.service';
import { config } from '../config';

const router: Router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      ...config.upload.allowedImageTypes,
      ...config.upload.allowedVideoTypes,
      'audio/mpeg',
      'audio/wav',
      'application/pdf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

// Helper to require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }
  next();
}

// POST /media/upload
router.post('/upload', requireAuth, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string | undefined;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No file provided' },
      });
    }

    const result = await mediaService.uploadMedia({
      file: req.file,
      organizationId,
      userId,
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /media/upload-multiple
router.post('/upload-multiple', requireAuth, upload.array('files', 10), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string | undefined;

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'No files provided' },
      });
    }

    const results = await Promise.all(
      files.map((file) =>
        mediaService.uploadMedia({
          file,
          organizationId,
          userId,
        })
      )
    );

    res.status(201).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

// GET /media
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const organizationId = req.headers['x-organization-id'] as string | undefined;
    const { type, page, limit } = req.query;

    const result = await mediaService.listMedia(
      userId,
      organizationId,
      type as string,
      page ? parseInt(page as string) : undefined,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

// GET /media/:id
router.get('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const media = await mediaService.getMedia(req.params.id, userId);
    res.json({ success: true, data: media });
  } catch (error) {
    next(error);
  }
});

// DELETE /media/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    await mediaService.deleteMedia(req.params.id, userId);
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
