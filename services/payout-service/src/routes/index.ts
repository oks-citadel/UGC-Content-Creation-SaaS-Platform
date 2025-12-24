import { Router } from 'express';
import payoutsRouter from './payouts';
import accountRouter from './account';
import taxRouter from './tax';

const router: Router = Router();

// Payout management routes
router.use('/payouts', payoutsRouter);

// Payout account routes
router.use('/payouts/account', accountRouter);

// Tax documents routes
router.use('/payouts/tax-documents', taxRouter);

export default router;
