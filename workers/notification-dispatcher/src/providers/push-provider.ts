import * as admin from 'firebase-admin';
import pino from 'pino';
import pRetry from 'p-retry';

const logger = pino();

export interface PushOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

export class PushProvider {
  private logger = logger.child({ provider: 'Push' });

  constructor() {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount) {
      throw new Error('Firebase service account is not configured');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    }
  }

  async send(options: PushOptions): Promise<void> {
    this.logger.info({ token: options.token }, 'Sending push notification');

    try {
      await pRetry(
        async () => {
          const message: admin.messaging.Message = {
            notification: {
              title: options.title,
              body: options.body,
              imageUrl: options.imageUrl,
            },
            data: options.data,
            token: options.token,
            webpush: options.clickAction
              ? {
                  fcmOptions: {
                    link: options.clickAction,
                  },
                }
              : undefined,
          };

          await admin.messaging().send(message);
        },
        {
          retries: 3,
          onFailedAttempt: (error) => {
            this.logger.warn(
              { attempt: error.attemptNumber, error: error.message },
              'Push notification failed, retrying'
            );
          },
        }
      );

      this.logger.info('Push notification sent successfully');
    } catch (error) {
      this.logger.error({ error }, 'Failed to send push notification');
      throw error;
    }
  }

  async sendToMultiple(tokens: string[], options: Omit<PushOptions, 'token'>): Promise<void> {
    this.logger.info({ count: tokens.length }, 'Sending push to multiple devices');

    try {
      await pRetry(
        async () => {
          const message: admin.messaging.MulticastMessage = {
            notification: {
              title: options.title,
              body: options.body,
              imageUrl: options.imageUrl,
            },
            data: options.data,
            tokens,
            webpush: options.clickAction
              ? {
                  fcmOptions: {
                    link: options.clickAction,
                  },
                }
              : undefined,
          };

          const response = await admin.messaging().sendEachForMulticast(message);
          this.logger.info(
            { successCount: response.successCount, failureCount: response.failureCount },
            'Multicast push completed'
          );
        },
        {
          retries: 3,
          onFailedAttempt: (error) => {
            this.logger.warn(
              { attempt: error.attemptNumber, error: error.message },
              'Multicast push failed, retrying'
            );
          },
        }
      );
    } catch (error) {
      this.logger.error({ error }, 'Failed to send multicast push');
      throw error;
    }
  }
}
