import twilio from 'twilio';
import pino from 'pino';
import pRetry from 'p-retry';

const logger = pino();

export interface SMSOptions {
  to: string;
  message: string;
  from?: string;
}

export class SMSProvider {
  private client: twilio.Twilio;
  private logger = logger.child({ provider: 'SMS' });

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not configured');
    }

    this.client = twilio(accountSid, authToken);
  }

  async send(options: SMSOptions): Promise<void> {
    this.logger.info({ to: options.to }, 'Sending SMS');

    try {
      await pRetry(
        async () => {
          await this.client.messages.create({
            body: options.message,
            to: options.to,
            from: options.from || process.env.TWILIO_PHONE_NUMBER,
          });
        },
        {
          retries: 3,
          onFailedAttempt: (error) => {
            this.logger.warn(
              { attempt: error.attemptNumber, error: error.message },
              'SMS send failed, retrying'
            );
          },
        }
      );

      this.logger.info({ to: options.to }, 'SMS sent successfully');
    } catch (error) {
      this.logger.error({ error, to: options.to }, 'Failed to send SMS');
      throw error;
    }
  }
}
