import { Router } from 'express';
import rightsRouter from './rights';
import templatesRouter from './templates';

const router = Router();

// Content rights routes
router.use('/content', rightsRouter);

// Rights templates routes
router.use('/rights/templates', templatesRouter);

export default router;
