import { Router, Request, Response, NextFunction } from 'express';
import { embedService } from '../services/embedService';
import { activationService } from '../services/activationService';

const router = Router();

router.get('/:activationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activationId } = req.params;
    const activation = await activationService.getById(activationId);
    
    if (!activation) {
      return res.status(404).json({ success: false, error: 'Activation not found' });
    }

    const embedCode = embedService.generateEmbedCode(activationId);
    res.json({ success: true, embedCode });
  } catch (error) {
    next(error);
  }
});

router.get('/:activationId/script', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activationId } = req.params;
    const embedCode = embedService.generateEmbedCode(activationId);
    res.type('text/plain').send(embedCode.script);
  } catch (error) {
    next(error);
  }
});

router.get('/:activationId/iframe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { activationId } = req.params;
    const embedCode = embedService.generateEmbedCode(activationId);
    res.type('text/plain').send(embedCode.iframe);
  } catch (error) {
    next(error);
  }
});

export default router;
