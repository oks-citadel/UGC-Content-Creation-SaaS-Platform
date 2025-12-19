import twilio from 'twilio';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'sms-provider' });

export interface SmsMessage {
  to: string;
  body: string;
  mediaUrl?: string[];
}

export class SmsProvider {
  private client: twilio.Twilio | null = null;

  constructor() {
    if (config.twilio.accountSid && config.twilio.authToken) {
      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
    }
  }

  async send(message: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not configured');
      }

      if (!config.twilio.phoneNumber) {
        throw new Error('Twilio phone number not configured');
      }

      const result = await this.client.messages.create({
        from: config.twilio.phoneNumber,
        to: message.to,
        body: message.body,
        mediaUrl: message.mediaUrl,
      });

      logger.info({ to: message.to, sid: result.sid }, 'SMS sent successfully');

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error: any) {
      logger.error({ error, to: message.to }, 'Failed to send SMS');

      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }

  async sendBatch(messages: SmsMessage[]): Promise<Array<{ success: boolean; messageId?: string; error?: string }>> {
    const results: Array<{ success: boolean; messageId?: string; error?: string }> = [];

    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);

      // Add small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  async getStatus(messageId: string): Promise<{ status: string; error?: string }> {
    try {
      if (!this.client) {
        throw new Error('Twilio client not configured');
      }

      const message = await this.client.messages(messageId).fetch();

      return {
        status: message.status,
      };
    } catch (error: any) {
      logger.error({ error, messageId }, 'Failed to get SMS status');

      return {
        status: 'unknown',
        error: error.message || 'Failed to get SMS status',
      };
    }
  }
}

export const smsProvider = new SmsProvider();
