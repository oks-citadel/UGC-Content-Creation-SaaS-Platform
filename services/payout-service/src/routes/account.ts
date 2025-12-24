import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AccountService } from '../services/account.service';
import { logger } from '../utils/logger';

const router: Router = Router();
const accountService = new AccountService();

// Request schemas
const setupAccountSchema = z.object({
  type: z.enum(['stripe_connect', 'paypal', 'bank_transfer']),
  country: z.string().length(2),
  currency: z.string().length(3).default('USD'),
  // Bank transfer details
  bankAccount: z.object({
    accountHolderName: z.string(),
    accountNumber: z.string(),
    routingNumber: z.string().optional(),
    bankName: z.string(),
    bankAddress: z.string().optional(),
    swiftCode: z.string().optional(),
  }).optional(),
  // PayPal details
  paypalEmail: z.string().email().optional(),
});

const updateAccountSchema = z.object({
  defaultCurrency: z.string().length(3).optional(),
  autoPayoutEnabled: z.boolean().optional(),
  autoPayoutThreshold: z.number().positive().optional(),
});

// GET /payouts/account - Get payout account details
router.get('/', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const account = await accountService.getAccount(creatorId);

    res.json(account);
  } catch (error) {
    logger.error({ error }, 'Failed to get account');
    throw error;
  }
});

// POST /payouts/account - Setup payout account
router.post('/', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const body = setupAccountSchema.parse(req.body);

    const account = await accountService.setupAccount(creatorId, body as any);

    res.status(201).json(account);
  } catch (error) {
    logger.error({ error }, 'Failed to setup account');
    throw error;
  }
});

// PATCH /payouts/account - Update payout account
router.patch('/', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const updates = updateAccountSchema.parse(req.body);

    const account = await accountService.updateAccount(creatorId, updates);

    res.json(account);
  } catch (error) {
    logger.error({ error }, 'Failed to update account');
    throw error;
  }
});

// POST /payouts/account/stripe/connect - Initiate Stripe Connect onboarding
router.post('/stripe/connect', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const { returnUrl, refreshUrl } = req.body;

    const onboardingUrl = await accountService.initiateStripeConnect(
      creatorId,
      returnUrl,
      refreshUrl
    );

    res.json({ url: onboardingUrl });
  } catch (error) {
    logger.error({ error }, 'Failed to initiate Stripe Connect');
    throw error;
  }
});

// GET /payouts/account/stripe/status - Check Stripe Connect status
router.get('/stripe/status', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    const status = await accountService.getStripeConnectStatus(creatorId);

    res.json(status);
  } catch (error) {
    logger.error({ error }, 'Failed to get Stripe Connect status');
    throw error;
  }
});

// DELETE /payouts/account - Remove payout account
router.delete('/', async (req: Request, res: Response) => {
  try {
    const creatorId = req.headers['x-creator-id'] as string || 'default-creator';
    await accountService.removeAccount(creatorId);

    res.status(204).send();
  } catch (error) {
    logger.error({ error }, 'Failed to remove account');
    throw error;
  }
});

export default router;
