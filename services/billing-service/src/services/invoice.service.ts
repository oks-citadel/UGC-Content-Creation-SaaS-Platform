import { PrismaClient, Invoice, InvoiceStatus, DunningStatus } from '@prisma/client';
import stripeIntegration from '../integrations/stripe';
import logger from '../utils/logger';
import config from '../config';
import { addDays, addHours } from 'date-fns';
import usageService from './usage.service';

const prisma = new PrismaClient();

export class InvoiceService {
  async createInvoice(params: {
    subscriptionId: string;
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    description?: string;
    lineItems?: any[];
    metadata?: Record<string, any>;
  }): Promise<Invoice> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: params.subscriptionId },
        include: { plan: true },
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Calculate invoice amount
      let amount = Number(subscription.plan.price);

      // Add overage charges if enabled
      if (config.features.overageBilling) {
        const overageBilling = await usageService.billOverage(
          params.userId,
          params.subscriptionId
        );
        amount += overageBilling.total;
      }

      const tax = amount * 0.0; // Tax calculation logic here
      const total = amount + tax;

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      const dueDate = addDays(new Date(), config.billing.invoiceDueDays);

      // Create Stripe invoice if customer exists
      let stripeInvoice;
      if (subscription.stripeCustomerId) {
        stripeInvoice = await stripeIntegration.createInvoice({
          customerId: subscription.stripeCustomerId,
          subscriptionId: subscription.stripeSubscriptionId || undefined,
          metadata: {
            userId: params.userId,
            subscriptionId: params.subscriptionId,
          },
        });
      }

      const invoice = await prisma.invoice.create({
        data: {
          subscriptionId: params.subscriptionId,
          userId: params.userId,
          invoiceNumber,
          amount,
          tax,
          total,
          status: InvoiceStatus.DRAFT,
          description: params.description,
          periodStart: params.periodStart,
          periodEnd: params.periodEnd,
          dueDate,
          stripeInvoiceId: stripeInvoice?.id,
          hostedInvoiceUrl: stripeInvoice?.hosted_invoice_url || undefined,
          lineItems: params.lineItems,
          metadata: params.metadata,
        },
      });

      logger.info('Invoice created', {
        invoiceId: invoice.id,
        userId: params.userId,
        total,
      });

      return invoice;
    } catch (error) {
      logger.error('Failed to create invoice', { error, params });
      throw error;
    }
  }

  async getInvoices(params: {
    userId: string;
    status?: InvoiceStatus;
    limit?: number;
    offset?: number;
  }): Promise<{ invoices: Invoice[]; total: number }> {
    try {
      const where: any = {
        userId: params.userId,
      };

      if (params.status) {
        where.status = params.status;
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: params.limit || 10,
          skip: params.offset || 0,
        }),
        prisma.invoice.count({ where }),
      ]);

      return { invoices, total };
    } catch (error) {
      logger.error('Failed to get invoices', { error, params });
      throw error;
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
        },
      });

      return invoice;
    } catch (error) {
      logger.error('Failed to get invoice', { error, invoiceId });
      throw error;
    }
  }

  async downloadInvoice(invoiceId: string): Promise<string> {
    try {
      const invoice = await this.getInvoice(invoiceId);

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.invoicePdfUrl) {
        return invoice.invoicePdfUrl;
      }

      if (invoice.stripeInvoiceId) {
        const stripeInvoice = await stripeIntegration.getInvoice(
          invoice.stripeInvoiceId
        );

        if (stripeInvoice.invoice_pdf) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: { invoicePdfUrl: stripeInvoice.invoice_pdf },
          });

          return stripeInvoice.invoice_pdf;
        }
      }

      throw new Error('Invoice PDF not available');
    } catch (error) {
      logger.error('Failed to download invoice', { error, invoiceId });
      throw error;
    }
  }

  async handlePaymentSuccess(params: {
    invoiceId: string;
    stripePaymentIntentId?: string;
  }): Promise<Invoice> {
    try {
      const invoice = await prisma.invoice.update({
        where: { id: params.invoiceId },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
          stripePaymentIntentId: params.stripePaymentIntentId,
          dunningStatus: DunningStatus.NONE,
          dunningAttempts: 0,
        },
      });

      // Update subscription status if it was past due
      const subscription = await prisma.subscription.findUnique({
        where: { id: invoice.subscriptionId },
      });

      if (subscription && subscription.status === 'PAST_DUE') {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: 'ACTIVE' },
        });
      }

      // Create payment attempt record
      await prisma.paymentAttempt.create({
        data: {
          invoiceId: params.invoiceId,
          amount: invoice.total,
          status: 'succeeded',
          stripePaymentIntentId: params.stripePaymentIntentId,
        },
      });

      logger.info('Payment succeeded', {
        invoiceId: params.invoiceId,
      });

      return invoice;
    } catch (error) {
      logger.error('Failed to handle payment success', { error, params });
      throw error;
    }
  }

  async handlePaymentFailed(params: {
    invoiceId: string;
    errorCode?: string;
    errorMessage?: string;
  }): Promise<Invoice> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: params.invoiceId },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Create payment attempt record
      await prisma.paymentAttempt.create({
        data: {
          invoiceId: params.invoiceId,
          amount: invoice.total,
          status: 'failed',
          errorCode: params.errorCode,
          errorMessage: params.errorMessage,
        },
      });

      // Update subscription status
      await prisma.subscription.update({
        where: { id: invoice.subscriptionId },
        data: { status: 'PAST_DUE' },
      });

      // Initiate dunning process
      await this.initiateDunning(params.invoiceId);

      logger.warn('Payment failed', {
        invoiceId: params.invoiceId,
        errorCode: params.errorCode,
      });

      return invoice;
    } catch (error) {
      logger.error('Failed to handle payment failure', { error, params });
      throw error;
    }
  }

  async retryPayment(invoiceId: string): Promise<Invoice> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { subscription: true },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === InvoiceStatus.PAID) {
        throw new Error('Invoice already paid');
      }

      // Retry payment via Stripe
      if (invoice.stripeInvoiceId) {
        try {
          const stripeInvoice = await stripeIntegration.payInvoice(
            invoice.stripeInvoiceId
          );

          if (stripeInvoice.status === 'paid') {
            return await this.handlePaymentSuccess({
              invoiceId,
              stripePaymentIntentId: stripeInvoice.payment_intent as string,
            });
          }
        } catch (error: any) {
          await this.handlePaymentFailed({
            invoiceId,
            errorCode: error.code,
            errorMessage: error.message,
          });
        }
      }

      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      return updatedInvoice!;
    } catch (error) {
      logger.error('Failed to retry payment', { error, invoiceId });
      throw error;
    }
  }

  private async initiateDunning(invoiceId: string): Promise<void> {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return;
      }

      const dunningAttempt = invoice.dunningAttempts + 1;

      if (dunningAttempt > config.billing.dunningMaxRetries) {
        // Mark as uncollectible
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: InvoiceStatus.UNCOLLECTIBLE,
            dunningStatus: DunningStatus.FAILED,
          },
        });

        // Cancel subscription
        await prisma.subscription.update({
          where: { id: invoice.subscriptionId },
          data: { status: 'UNPAID' },
        });

        logger.warn('Dunning failed, invoice marked uncollectible', {
          invoiceId,
        });

        return;
      }

      const nextRetry = addHours(
        new Date(),
        config.billing.dunningRetryIntervalHours
      );

      const dunningStatus = `RETRY_${dunningAttempt}` as DunningStatus;

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          dunningStatus,
          dunningAttempts: dunningAttempt,
          lastDunningAttempt: new Date(),
          nextDunningAttempt: nextRetry,
        },
      });

      logger.info('Dunning initiated', {
        invoiceId,
        attempt: dunningAttempt,
        nextRetry,
      });

      // Send notification (implement notification service integration)
      await this.sendDunningNotification(invoice.userId, dunningAttempt);
    } catch (error) {
      logger.error('Failed to initiate dunning', { error, invoiceId });
      throw error;
    }
  }

  async processDunningRetries(): Promise<void> {
    try {
      const invoices = await prisma.invoice.findMany({
        where: {
          status: {
            in: [InvoiceStatus.OPEN, InvoiceStatus.UNCOLLECTIBLE],
          },
          dunningStatus: {
            in: [
              DunningStatus.RETRY_1,
              DunningStatus.RETRY_2,
              DunningStatus.RETRY_3,
            ],
          },
          nextDunningAttempt: {
            lte: new Date(),
          },
        },
      });

      logger.info(`Processing ${invoices.length} dunning retries`);

      for (const invoice of invoices) {
        try {
          await this.retryPayment(invoice.id);
        } catch (error) {
          logger.error('Failed to process dunning retry', {
            error,
            invoiceId: invoice.id,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process dunning retries', { error });
      throw error;
    }
  }

  private async generateInvoiceNumber(): Promise<string> {
    const count = await prisma.invoice.count();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const sequence = String(count + 1).padStart(6, '0');

    return `INV-${year}${month}-${sequence}`;
  }

  private async sendDunningNotification(
    userId: string,
    attempt: number
  ): Promise<void> {
    // TODO: Integrate with notification service
    logger.info('Sending dunning notification', { userId, attempt });
  }
}

export default new InvoiceService();
