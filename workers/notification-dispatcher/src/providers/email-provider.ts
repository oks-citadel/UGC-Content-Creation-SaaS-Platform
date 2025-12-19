import sgMail from '@sendgrid/mail';
import pino from 'pino';
import pRetry from 'p-retry';

const logger = pino();

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    content: string;
    filename: string;
    type: string;
  }>;
}

export class EmailProvider {
  private logger = logger.child({ provider: 'Email' });

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not configured');
    }
    sgMail.setApiKey(apiKey);
  }

  async send(options: EmailOptions): Promise<void> {
    this.logger.info({ to: options.to, subject: options.subject }, 'Sending email');

    try {
      await pRetry(
        async () => {
          await sgMail.send({
            to: options.to,
            from: options.from || process.env.EMAIL_FROM || 'noreply@nexus.com',
            replyTo: options.replyTo,
            subject: options.subject,
            html: options.html,
            attachments: options.attachments,
          });
        },
        {
          retries: 3,
          onFailedAttempt: (error) => {
            this.logger.warn(
              { attempt: error.attemptNumber, error: error.message },
              'Email send failed, retrying'
            );
          },
        }
      );

      this.logger.info({ to: options.to }, 'Email sent successfully');
    } catch (error) {
      this.logger.error({ error, to: options.to }, 'Failed to send email');
      throw error;
    }
  }

  async sendBulk(emails: EmailOptions[]): Promise<void> {
    this.logger.info({ count: emails.length }, 'Sending bulk emails');

    try {
      const messages = emails.map((email) => ({
        to: email.to,
        from: email.from || process.env.EMAIL_FROM || 'noreply@nexus.com',
        replyTo: email.replyTo,
        subject: email.subject,
        html: email.html,
        attachments: email.attachments,
      }));

      await pRetry(
        async () => {
          await sgMail.send(messages);
        },
        {
          retries: 3,
          onFailedAttempt: (error) => {
            this.logger.warn(
              { attempt: error.attemptNumber, error: error.message },
              'Bulk email send failed, retrying'
            );
          },
        }
      );

      this.logger.info({ count: emails.length }, 'Bulk emails sent successfully');
    } catch (error) {
      this.logger.error({ error, count: emails.length }, 'Failed to send bulk emails');
      throw error;
    }
  }
}
