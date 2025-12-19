import Queue from 'bull';
import config from '../config';
import invoiceService from '../services/invoice.service';
import logger from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create dunning queue
export const dunningQueue = new Queue('dunning', config.redis.url, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Process dunning jobs
dunningQueue.process(async (job) => {
  const { invoiceId } = job.data;

  logger.info('Processing dunning job', { invoiceId, attempt: job.attemptsMade });

  try {
    await invoiceService.retryPayment(invoiceId);

    logger.info('Dunning job completed successfully', { invoiceId });

    return { success: true, invoiceId };
  } catch (error: any) {
    logger.error('Dunning job failed', { error, invoiceId });

    // If max attempts reached, mark invoice as uncollectible
    if (job.attemptsMade >= config.billing.dunningMaxRetries) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'UNCOLLECTIBLE',
          dunningStatus: 'FAILED',
        },
      });

      logger.warn('Invoice marked as uncollectible after max dunning attempts', {
        invoiceId,
      });
    }

    throw error;
  }
});

// Add dunning job to queue
export const scheduleDunningRetry = async (
  invoiceId: string,
  delayHours: number
): Promise<void> => {
  const delayMs = delayHours * 60 * 60 * 1000;

  await dunningQueue.add(
    { invoiceId },
    {
      delay: delayMs,
      jobId: `dunning-${invoiceId}-${Date.now()}`,
    }
  );

  logger.info('Dunning retry scheduled', { invoiceId, delayHours });
};

// Event handlers
dunningQueue.on('completed', (job, result) => {
  logger.info('Dunning job completed', { jobId: job.id, result });
});

dunningQueue.on('failed', (job, err) => {
  logger.error('Dunning job failed', { jobId: job?.id, error: err.message });
});

dunningQueue.on('stalled', (job) => {
  logger.warn('Dunning job stalled', { jobId: job.id });
});

export default dunningQueue;
