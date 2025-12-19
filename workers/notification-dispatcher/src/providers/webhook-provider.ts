import axios from 'axios';
import pino from 'pino';
import pRetry from 'p-retry';
import crypto from 'crypto';

const logger = pino();

export interface WebhookOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  data?: any;
  secret?: string;
}

export class WebhookProvider {
  private logger = logger.child({ provider: 'Webhook' });

  async send(options: WebhookOptions): Promise<void> {
    this.logger.info({ url: options.url }, 'Sending webhook');

    try {
      await pRetry(
        async () => {
          const headers = { ...options.headers };

          // Add signature if secret is provided
          if (options.secret && options.data) {
            const signature = this.generateSignature(
              JSON.stringify(options.data),
              options.secret
            );
            headers['X-Webhook-Signature'] = signature;
          }

          await axios({
            method: options.method || 'POST',
            url: options.url,
            headers,
            data: options.data,
            timeout: 30000,
          });
        },
        {
          retries: 3,
          onFailedAttempt: (error) => {
            this.logger.warn(
              { attempt: error.attemptNumber, error: error.message },
              'Webhook failed, retrying'
            );
          },
        }
      );

      this.logger.info({ url: options.url }, 'Webhook sent successfully');
    } catch (error) {
      this.logger.error({ error, url: options.url }, 'Failed to send webhook');
      throw error;
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
