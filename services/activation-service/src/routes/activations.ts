import { Router, Request, Response, NextFunction } from 'express';
import { activationService } from '../services/activationService';
import { createActivationSchema, updateActivationSchema } from '../types/activation';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createActivationSchema.parse(req.body);
    const activation = await activationService.create(data);
    res.status(201).json({ success: true, activation });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = req.query.brandId as string;
    if (!brandId) {
      return res.status(400).json({ success: false, error: 'brandId required' });
    }
    const activations = await activationService.getByBrand(brandId);
    res.json({ success: true, activations });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activation = await activationService.getById(req.params.id);
    if (!activation) {
      return res.status(404).json({ success: false, error: 'Activation not found' });
    }
    res.json({ success: true, activation });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateActivationSchema.parse(req.body);
    const activation = await activationService.update(req.params.id, data);
    res.json({ success: true, activation });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await activationService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activation = await activationService.activate(req.params.id);
    res.json({ success: true, activation });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/pause', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activation = await activationService.pause(req.params.id);
    res.json({ success: true, activation });
  } catch (error) {
    next(error);
  }
});

export default router;
