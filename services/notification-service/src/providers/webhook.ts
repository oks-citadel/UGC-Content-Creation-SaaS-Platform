import axios from 'axios';
import pino from 'pino';

const logger = pino({ name: 'webhook-provider' });

export interface WebhookMessage {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export class WebhookProvider {
  async send(message: WebhookMessage): Promise<{ success: boolean; response?: any; error?: string }> {
    try {
      const method = message.method || 'POST';
      const timeout = message.timeout || 10000;
      const maxRetries = message.retries || 3;

      let lastError: any;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const response = await axios({
            method,
            url: message.url,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'NEXUS-Platform/1.0',
              ...message.headers,
            },
            data: message.body,
            timeout,
            validateStatus: (status) => status >= 200 && status < 300,
          });

          logger.info(
            { url: message.url, status: response.status, attempt: attempt + 1 },
            'Webhook sent successfully'
          );

          return {
            success: true,
            response: response.data,
          };
        } catch (error: any) {
          lastError = error;

          if (attempt < maxRetries - 1) {
            // Exponential backoff
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      throw lastError;
    } catch (error: any) {
      logger.error({ error, url: message.url }, 'Failed to send webhook');

      return {
        success: false,
        error: error.message || 'Failed to send webhook',
      };
    }
  }

  async sendBatch(messages: WebhookMessage[]): Promise<Array<{ success: boolean; response?: any; error?: string }>> {
    const results: Array<{ success: boolean; response?: any; error?: string }> = [];

    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
    }

    return results;
  }

  async verify(url: string, secret: string): Promise<boolean> {
    try {
      const timestamp = Date.now();
      const signature = this.generateSignature(timestamp.toString(), secret);

      const response = await axios.post(
        url,
        { event: 'webhook.verify', timestamp },
        {
          headers: {
            'X-Webhook-Signature': signature,
            'X-Webhook-Timestamp': timestamp.toString(),
          },
          timeout: 5000,
        }
      );

      return response.status === 200;
    } catch (error) {
      logger.error({ error, url }, 'Webhook verification failed');
      return false;
    }
  }

  private generateSignature(data: string, secret: string): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }
}

export const webhookProvider = new WebhookProvider();
