import { prisma } from '../lib/prisma';
import { WebhookStatus } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';
import pino from 'pino';
import { config } from '../config';

const logger = pino({ name: 'webhook-service' });

export class WebhookService {
  async createWebhook(
    integrationId: string,
    url: string,
    events: string[]
  ): Promise<{ id: string; secret: string }> {
    try {
      const secret = crypto.randomBytes(32).toString('hex');

      const webhook = await prisma.webhook.create({
        data: {
          integrationId,
          url,
          events,
          secret,
          isActive: true,
        },
      });

      logger.info({ webhookId: webhook.id, integrationId }, 'Webhook created');

      return {
        id: webhook.id,
        secret,
      };
    } catch (error: any) {
      logger.error({ error, integrationId }, 'Failed to create webhook');
      throw error;
    }
  }

  async triggerWebhook(
    integrationId: string,
    event: string,
    payload: any
  ): Promise<void> {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: {
          integrationId,
          isActive: true,
          events: {
            has: event,
          },
        },
      });

      logger.info(
        { integrationId, event, webhookCount: webhooks.length },
        'Triggering webhooks'
      );

      for (const webhook of webhooks) {
        await this.deliverWebhook(webhook.id, event, payload);
      }
    } catch (error: any) {
      logger.error({ error, integrationId, event }, 'Failed to trigger webhooks');
    }
  }

  async deliverWebhook(
    webhookId: string,
    event: string,
    payload: any
  ): Promise<void> {
    try {
      const webhook = await prisma.webhook.findUnique({
        where: { id: webhookId },
      });

      if (!webhook || !webhook.isActive) {
        return;
      }

      // Create delivery record
      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event,
          payload,
          status: WebhookStatus.PENDING,
          attempts: 0,
        },
      });

      // Attempt delivery
      await this.attemptDelivery(delivery.id);
    } catch (error: any) {
      logger.error({ error, webhookId, event }, 'Failed to deliver webhook');
    }
  }

  private async attemptDelivery(deliveryId: string): Promise<void> {
    try {
      const delivery = await prisma.webhookDelivery.findUnique({
        where: { id: deliveryId },
        include: { webhook: true },
      });

      if (!delivery) {
        return;
      }

      const maxRetries = config.webhook.maxRetries;

      if (delivery.attempts >= maxRetries) {
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: WebhookStatus.FAILED,
            error: 'Max retries exceeded',
          },
        });
        return;
      }

      // Generate signature
      const timestamp = Date.now().toString();
      const signature = this.generateSignature(
        JSON.stringify(delivery.payload),
        delivery.webhook.secret,
        timestamp
      );

      // Send webhook
      try {
        const response = await axios.post(
          delivery.webhook.url,
          {
            event: delivery.event,
            timestamp,
            payload: delivery.payload,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signature,
              'X-Webhook-Timestamp': timestamp,
              'X-Webhook-Event': delivery.event,
            },
            timeout: 10000,
          }
        );

        // Success
        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: WebhookStatus.DELIVERED,
            attempts: delivery.attempts + 1,
            response: {
              status: response.status,
              headers: response.headers,
              data: response.data,
            },
            deliveredAt: new Date(),
          },
        });

        await prisma.webhook.update({
          where: { id: delivery.webhookId },
          data: { lastTriggeredAt: new Date() },
        });

        logger.info({ deliveryId, webhookId: delivery.webhookId }, 'Webhook delivered successfully');
      } catch (error: any) {
        // Failure - schedule retry
        const retryDelay = Math.min(
          config.webhook.retryDelayMs * Math.pow(2, delivery.attempts),
          60000
        );

        await prisma.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: WebhookStatus.RETRYING,
            attempts: delivery.attempts + 1,
            error: error.message,
            response: error.response
              ? {
                  status: error.response.status,
                  headers: error.response.headers,
                  data: error.response.data,
                }
              : null,
          },
        });

        // Schedule retry
        setTimeout(() => {
          this.attemptDelivery(deliveryId);
        }, retryDelay);

        logger.warn(
          { deliveryId, attempt: delivery.attempts + 1, retryDelay },
          'Webhook delivery failed, scheduling retry'
        );
      }
    } catch (error: any) {
      logger.error({ error, deliveryId }, 'Failed to attempt delivery');
    }
  }

  private generateSignature(payload: string, secret: string, timestamp: string): string {
    const message = `${timestamp}.${payload}`;
    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
  }

  async verifySignature(
    payload: string,
    signature: string,
    timestamp: string,
    secret: string
  ): Promise<boolean> {
    const expectedSignature = this.generateSignature(payload, secret, timestamp);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  async getWebhookDeliveries(
    webhookId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<any> {
    const [deliveries, total] = await Promise.all([
      prisma.webhookDelivery.findMany({
        where: { webhookId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.webhookDelivery.count({ where: { webhookId } }),
    ]);

    return {
      deliveries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export const webhookService = new WebhookService();
