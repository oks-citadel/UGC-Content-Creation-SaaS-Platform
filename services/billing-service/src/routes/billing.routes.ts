import { Router, Request, Response } from 'express';
import subscriptionService from '../services/subscription.service';
import usageService from '../services/usage.service';
import invoiceService from '../services/invoice.service';
import stripeIntegration from '../integrations/stripe';
import { PrismaClient, PlanName, UsageType } from '.prisma/billing-service-client';
import logger from '../utils/logger';
import config from '../config';
import { requireActiveSubscription } from '../middleware/entitlement';
import { NotificationClient } from '@nexus/utils';

const router: Router = Router();
const prisma = new PrismaClient();
const notificationClient = new NotificationClient();

interface AuthenticatedRequest extends Request {
  userId?: string;
  subscription?: any;
}

// Middleware to extract user ID from headers
const extractUserId = (req: AuthenticatedRequest, res: Response, next: any) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User ID required' });
  }
  req.userId = userId;
  next();
};

router.use(extractUserId);

// Get current subscription
router.get('/subscription', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.userId!);

    if (!subscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No active subscription found',
      });
    }

    res.json({
      subscription: {
        id: subscription.id,
        plan: (subscription as any).plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAt: subscription.cancelAt,
        canceledAt: subscription.canceledAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        entitlements: (subscription as any).entitlements,
      },
    });
  } catch (error) {
    logger.error('Failed to get subscription', { error, userId: req.userId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve subscription',
    });
  }
});

// Subscribe to a plan
router.post('/subscribe', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planName, email, name, paymentMethodId } = req.body;

    if (!planName || !email) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Plan name and email are required',
      });
    }

    const subscription = await subscriptionService.subscribe({
      userId: req.userId!,
      planName: planName as PlanName,
      email,
      name,
      paymentMethodId,
    });

    res.status(201).json({
      subscription: {
        id: subscription.id,
        plan: (subscription as any).plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
      },
    });
  } catch (error: any) {
    logger.error('Failed to subscribe', { error, userId: req.userId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to create subscription',
    });
  }
});

// Upgrade subscription
router.post('/upgrade', requireActiveSubscription, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planName } = req.body;

    if (!planName) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Plan name is required',
      });
    }

    const currentSubscription = await subscriptionService.getUserSubscription(req.userId!);

    if (!currentSubscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No active subscription found',
      });
    }

    const subscription = await subscriptionService.upgrade(
      currentSubscription.id,
      planName as PlanName
    );

    res.json({
      subscription: {
        id: subscription.id,
        plan: (subscription as any).plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error: any) {
    logger.error('Failed to upgrade subscription', { error, userId: req.userId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to upgrade subscription',
    });
  }
});

// Cancel subscription
router.post('/cancel', requireActiveSubscription, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cancelAtPeriodEnd = true } = req.body;

    const currentSubscription = await subscriptionService.getUserSubscription(req.userId!);

    if (!currentSubscription) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No active subscription found',
      });
    }

    const subscription = await subscriptionService.cancel(
      currentSubscription.id,
      cancelAtPeriodEnd
    );

    res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAt: subscription.cancelAt,
        canceledAt: subscription.canceledAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    });
  } catch (error: any) {
    logger.error('Failed to cancel subscription', { error, userId: req.userId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to cancel subscription',
    });
  }
});

// Get invoices
router.get('/invoices', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, limit = 10, offset = 0 } = req.query;

    const result = await invoiceService.getInvoices({
      userId: req.userId!,
      status: status as any,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.json({
      invoices: result.invoices,
      total: result.total,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });
  } catch (error) {
    logger.error('Failed to get invoices', { error, userId: req.userId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve invoices',
    });
  }
});

// Get invoice by ID
router.get('/invoices/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await invoiceService.getInvoice(id);

    if (!invoice) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invoice not found',
      });
    }

    if (invoice.userId !== req.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied',
      });
    }

    res.json({ invoice });
  } catch (error) {
    logger.error('Failed to get invoice', { error, invoiceId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve invoice',
    });
  }
});

// Download invoice
router.get('/invoices/:id/download', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await invoiceService.getInvoice(id);

    if (!invoice) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Invoice not found',
      });
    }

    if (invoice.userId !== req.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied',
      });
    }

    const pdfUrl = await invoiceService.downloadInvoice(id);

    res.json({ pdfUrl });
  } catch (error) {
    logger.error('Failed to download invoice', { error, invoiceId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to download invoice',
    });
  }
});

// Get usage
router.get('/usage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, startDate, endDate } = req.query;

    const currentSubscription = await subscriptionService.getUserSubscription(req.userId!);

    const usage = await usageService.getUsage({
      userId: req.userId!,
      subscriptionId: currentSubscription?.id,
      type: type as UsageType,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    const summary = await usageService.getUsageSummary({
      userId: req.userId!,
      subscriptionId: currentSubscription?.id,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    });

    res.json({
      usage,
      summary,
    });
  } catch (error) {
    logger.error('Failed to get usage', { error, userId: req.userId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve usage',
    });
  }
});

// Add payment method
router.post('/payment-methods', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentMethodId } = req.body;

    if (!paymentMethodId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Payment method ID is required',
      });
    }

    const currentSubscription = await subscriptionService.getUserSubscription(req.userId!);

    if (!currentSubscription?.stripeCustomerId) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No Stripe customer found',
      });
    }

    const paymentMethod = await stripeIntegration.attachPaymentMethod(
      paymentMethodId,
      currentSubscription.stripeCustomerId
    );

    // Save to database
    const savedPaymentMethod = await prisma.paymentMethod.create({
      data: {
        userId: req.userId!,
        type: paymentMethod.type === 'card' ? 'CARD' : 'BANK_ACCOUNT',
        stripePaymentMethodId: paymentMethod.id,
        brand: (paymentMethod as any).card?.brand,
        last4: (paymentMethod as any).card?.last4 || '',
        expiryMonth: (paymentMethod as any).card?.exp_month,
        expiryYear: (paymentMethod as any).card?.exp_year,
        billingDetails: paymentMethod.billing_details as any,
      },
    });

    res.status(201).json({ paymentMethod: savedPaymentMethod });
  } catch (error) {
    logger.error('Failed to add payment method', { error, userId: req.userId });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to add payment method',
    });
  }
});

// Delete payment method
router.delete('/payment-methods/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!paymentMethod) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Payment method not found',
      });
    }

    if (paymentMethod.userId !== req.userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied',
      });
    }

    if (paymentMethod.stripePaymentMethodId) {
      await stripeIntegration.detachPaymentMethod(
        paymentMethod.stripePaymentMethodId
      );
    }

    await prisma.paymentMethod.delete({
      where: { id },
    });

    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete payment method', { error, paymentMethodId: req.params.id });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete payment method',
    });
  }
});

// Stripe webhook endpoint
router.post('/webhooks/stripe', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Missing stripe-signature header',
      });
    }

    const event = stripeIntegration.constructEvent(
      req.body,
      signature,
      config.stripe.webhookSecret
    );

    logger.info('Received Stripe webhook', { eventType: event.type });

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as any);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as any);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as any);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as any);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as any);
        break;

      default:
        logger.info('Unhandled webhook event type', { eventType: event.type });
    }

    // Store event
    await prisma.billingEvent.create({
      data: {
        userId: (event.data.object as any).metadata?.userId || 'unknown',
        subscriptionId: (event.data.object as any).metadata?.subscriptionId,
        eventType: event.type,
        eventData: event.data.object as any,
        stripeEventId: event.id,
        processedAt: new Date(),
      },
    });

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error', { error: error.message });
    res.status(400).json({
      error: 'Webhook Error',
      message: error.message,
    });
  }
});

// Helper functions for webhook handling
async function handleSubscriptionUpdate(subscription: any) {
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (dbSubscription) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: subscription.status.toUpperCase(),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAt: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000)
          : null,
      },
    });
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (dbSubscription) {
    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });
  }
}

async function handleInvoicePaid(invoice: any) {
  const dbInvoice = await prisma.invoice.findUnique({
    where: { stripeInvoiceId: invoice.id },
  });

  if (dbInvoice) {
    await invoiceService.handlePaymentSuccess({
      invoiceId: dbInvoice.id,
      stripePaymentIntentId: invoice.payment_intent,
    });
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  const dbInvoice = await prisma.invoice.findUnique({
    where: { stripeInvoiceId: invoice.id },
  });

  if (dbInvoice) {
    await invoiceService.handlePaymentFailed({
      invoiceId: dbInvoice.id,
      errorCode: invoice.last_finalization_error?.code,
      errorMessage: invoice.last_finalization_error?.message,
    });
  }
}

async function handleTrialWillEnd(subscription: any) {
  const trialEndDate = new Date(subscription.trial_end * 1000);
  const daysRemaining = Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  logger.info('Trial will end soon', {
    subscriptionId: subscription.id,
    trialEnd: trialEndDate,
    daysRemaining,
  });

  try {
    // Get the subscription from our database to find plan info
    const dbSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      include: {
        plan: { select: { name: true } },
      },
    }) as any;

    if (!dbSubscription) {
      logger.warn('Subscription not found for trial ending notification', {
        stripeSubscriptionId: subscription.id,
      });
      return;
    }

    // Note: User info would need to be fetched from user-service
    // For now, use userId from subscription
    await notificationClient.sendTrialEndingNotification({
      email: 'user@example.com', // Would be fetched from user-service
      userId: dbSubscription.userId,
      userName: undefined,
      planName: dbSubscription.plan?.name || 'Unknown',
      trialEndDate,
      daysRemaining,
    });

    logger.info('Trial ending notification sent successfully', {
      userId: dbSubscription.userId,
      subscriptionId: dbSubscription.id,
      daysRemaining,
    });
  } catch (error) {
    logger.error('Failed to send trial ending notification', {
      error,
      stripeSubscriptionId: subscription.id,
    });
    // Don't throw - webhook should complete successfully
  }
}

export default router;
