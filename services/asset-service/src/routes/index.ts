import { Router } from 'express';
import assetsRouter from './assets';
import libraryRouter from './library';

const router = Router();

// Asset management routes
router.use('/assets', assetsRouter);

// Brand asset library routes
router.use('/library', libraryRouter);

export default router;
