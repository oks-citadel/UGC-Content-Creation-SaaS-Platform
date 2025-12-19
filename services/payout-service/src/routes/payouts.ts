import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PayoutService } from '../services/payout.service';
import { logger } from '../utils/logger';

const router = Router();
const payoutService = new PayoutService();

// Request schemas
const requestPayoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
});

const listPayoutsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'all']).default('all'),
});

// GET /payouts/balance - Get current balance
router.get('/balance', async (req: Request, res: Response) => {
  try {
    // In production, extract creatorId from authenticated user
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const balance = await payoutService.getBalance(creatorId);

    res.json(balance);
  } catch (error) {
    logger.error({ error }, 'Failed to get balance');
    throw error;
  }
});

// GET /payouts/earnings - Get earnings history
router.get('/earnings', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const earnings = await payoutService.getEarnings(creatorId, startDate, endDate);

    res.json(earnings);
  } catch (error) {
    logger.error({ error }, 'Failed to get earnings');
    throw error;
  }
});

// GET /payouts/pending - Get pending payouts
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const pending = await payoutService.getPendingPayouts(creatorId);

    res.json({ pending });
  } catch (error) {
    logger.error({ error }, 'Failed to get pending payouts');
    throw error;
  }
});

// GET /payouts/history - Get payout history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const query = listPayoutsSchema.parse(req.query);

    const history = await payoutService.getPayoutHistory(creatorId, query);

    res.json(history);
  } catch (error) {
    logger.error({ error }, 'Failed to get payout history');
    throw error;
  }
});

// POST /payouts/request - Request a payout
router.post('/request', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const body = requestPayoutSchema.parse(req.body);

    const payout = await payoutService.requestPayout(creatorId, body.amount, body.currency);

    res.status(201).json(payout);
  } catch (error) {
    logger.error({ error }, 'Failed to request payout');
    throw error;
  }
});

// GET /payouts/:payoutId - Get payout details
router.get('/:payoutId', async (req: Request, res: Response) => {
  try {
    const payoutId = req.params.payoutId;
    const payout = await payoutService.getPayoutDetails(payoutId);

    res.json(payout);
  } catch (error) {
    logger.error({ error }, 'Failed to get payout details');
    throw error;
  }
});

// POST /payouts/:payoutId/cancel - Cancel payout request
router.post('/:payoutId/cancel', async (req: Request, res: Response) => {
  try {
    const payoutId = req.params.payoutId;
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';

    await payoutService.cancelPayout(payoutId, creatorId);

    res.json({ message: 'Payout cancelled successfully' });
  } catch (error) {
    logger.error({ error }, 'Failed to cancel payout');
    throw error;
  }
});

export default router;
