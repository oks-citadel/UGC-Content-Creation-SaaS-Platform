import sgMail from '@sendgrid/mail';
import { config } from '../config';
import pino from 'pino';

const logger = pino({ name: 'email-provider' });

sgMail.setApiKey(config.sendgrid.apiKey);

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
    disposition?: string;
  }>;
  replyTo?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

export class EmailProvider {
  async send(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!config.sendgrid.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const msg: any = {
        from: {
          email: config.sendgrid.fromEmail,
          name: config.sendgrid.fromName,
        },
        ...message,
      };

      const [response] = await sgMail.send(msg);

      logger.info({ to: message.to, subject: message.subject }, 'Email sent successfully');

      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
      };
    } catch (error: any) {
      logger.error({ error, to: message.to, subject: message.subject }, 'Failed to send email');

      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  async sendBatch(messages: EmailMessage[]): Promise<Array<{ success: boolean; messageId?: string; error?: string }>> {
    try {
      if (!config.sendgrid.apiKey) {
        throw new Error('SendGrid API key not configured');
      }

      const msgs = messages.map(message => ({
        from: {
          email: config.sendgrid.fromEmail,
          name: config.sendgrid.fromName,
        },
        ...message,
      }));

      const response = await sgMail.send(msgs as any);

      logger.info({ count: messages.length }, 'Batch emails sent successfully');

      return response.map((r: any) => ({
        success: true,
        messageId: r.headers['x-message-id'] as string,
      }));
    } catch (error: any) {
      logger.error({ error, count: messages.length }, 'Failed to send batch emails');

      // Return individual failures
      return messages.map(() => ({
        success: false,
        error: error.message || 'Failed to send email',
      }));
    }
  }

  async sendTemplate(
    to: string | string[],
    templateId: string,
    dynamicTemplateData: Record<string, any>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.send({
      to,
      subject: '', // Subject is defined in template
      html: '', // HTML is defined in template
      templateId,
      dynamicTemplateData,
    });
  }
}

export const emailProvider = new EmailProvider();
